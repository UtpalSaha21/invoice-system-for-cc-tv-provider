
const db = require("../config/db");

// GET /api/sales
// Fetch all sales and invoice summaries.
exports.getSales = async (req, res) => {
    try {
        const [sales] = await db.query(`
            SELECT
                s.*,
                c.name AS customer_name,
                c.phone AS customer_phone
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            ORDER BY s.id DESC
        `);

        res.json({
            success: true,
            data: sales
        });
    } catch (error) {
        console.error("Get sales error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch sales"
        });
    }
};

// GET /api/sales/:id
// Fetch one invoice with its items.
exports.getSaleById = async (req, res) => {
    try {
        const [sales] = await db.query(`
            SELECT
                s.*,
                c.name AS customer_name,
                c.phone AS customer_phone,
                c.email AS customer_email,
                c.address AS customer_address
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            WHERE s.id = ?
        `, [req.params.id]);

        if (sales.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }

        const [items] = await db.query(`
            SELECT *
            FROM sale_items
            WHERE sale_id = ?
            ORDER BY id ASC
        `, [req.params.id]);

        res.json({
            success: true,
            data: {
                ...sales[0],
                items
            }
        });
    } catch (error) {
        console.error("Get invoice error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch invoice"
        });
    }
};

// POST /api/sales
// Create an invoice and deduct stock in one transaction.
exports.createSale = async (req, res) => {
    const {
        customer_id,
        items,
        discount = 0,
        payment_method = "cash",
        payment_status = "paid",
        notes
    } = req.body;

    // Validate the items array.
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            success: false,
            message: "At least one sale item is required"
        });
    }

    const validPaymentMethods = [
        "cash",
        "card",
        "bank",
        "mobile_banking"
    ];

    const validPaymentStatuses = [
        "paid",
        "unpaid",
        "partial"
    ];

    if (!validPaymentMethods.includes(payment_method)) {
        return res.status(400).json({
            success: false,
            message: "Invalid payment method"
        });
    }

    if (!validPaymentStatuses.includes(payment_status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid payment status"
        });
    }

    const discountAmount = Number(discount);

    if (
        !Number.isFinite(discountAmount) ||
        discountAmount < 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Discount must be a non-negative amount"
        });
    }

    // Validate and combine repeated product IDs.
    const itemMap = new Map();

    for (const item of items) {
        const productId = Number(item.product_id);
        const quantity = Number(item.quantity);

        if (
            !Number.isInteger(productId) ||
            productId <= 0 ||
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Each item needs a valid product ID and positive quantity"
            });
        }

        itemMap.set(
            productId,
            (itemMap.get(productId) || 0) + quantity
        );
    }

    const normalizedItems = Array.from(
        itemMap,
        ([product_id, quantity]) => ({
            product_id,
            quantity
        })
    );

    const customerId =
        customer_id === "" || customer_id == null
            ? null
            : Number(customer_id);

    if (
        customerId !== null &&
        (!Number.isInteger(customerId) || customerId <= 0)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid customer ID"
        });
    }

    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        let subtotal = 0;
        const invoiceItems = [];

        // Lock product rows and check available stock.
        for (const item of normalizedItems) {
            const [products] = await connection.query(`
                SELECT id, name, sell_price, buy_price, stock
                FROM products
                WHERE id = ?
                FOR UPDATE
            `, [item.product_id]);

            if (products.length === 0) {
                const error = new Error(
                    `Product ID ${item.product_id} does not exist`
                );
                error.statusCode = 400;
                throw error;
            }

            const product = products[0];

            if (Number(product.stock) < item.quantity) {
                const error = new Error(
                    `Insufficient stock for ${product.name}. Available: ${product.stock}`
                );
                error.statusCode = 400;
                throw error;
            }

            const unitPrice = Number(product.sell_price);
            const unitCost = Number(product.buy_price);

            const lineTotal = Number(
                (unitPrice * item.quantity).toFixed(2)
            );

            subtotal += lineTotal;

            invoiceItems.push({
                product_id: product.id,
                product_name: product.name,
                quantity: item.quantity,
                unit_price: unitPrice,
                unit_cost: unitCost,
                line_total: lineTotal
            });
        }

        subtotal = Number(subtotal.toFixed(2));

        if (discountAmount > subtotal) {
            const error = new Error(
                "Discount cannot exceed the subtotal"
            );
            error.statusCode = 400;
            throw error;
        }

        const total = Number(
            (subtotal - discountAmount).toFixed(2)
        );

        // Create a unique invoice number.
        const invoiceNo = `INV-${Date.now()}-${Math.floor(
            Math.random() * 1000
        )}`;

        const [saleResult] = await connection.query(`
            INSERT INTO sales
            (
                invoice_no,
                customer_id,
                subtotal,
                discount,
                total,
                payment_method,
                payment_status,
                notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            invoiceNo,
            customerId,
            subtotal,
            discountAmount,
            total,
            payment_method,
            payment_status,
            notes || null
        ]);

        const saleId = saleResult.insertId;

        // Save invoice items and deduct stock.
        for (const item of invoiceItems) {
            await connection.query(`
                INSERT INTO sale_items
                (
                    sale_id,
                    product_id,
                    product_name,
                    quantity,
                    unit_price,
                    unit_cost,
                    line_total
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                saleId,
                item.product_id,
                item.product_name,
                item.quantity,
                item.unit_price,
                item.unit_cost,
                item.line_total
            ]);

            await connection.query(`
                UPDATE products
                SET stock = stock - ?
                WHERE id = ?
            `, [
                item.quantity,
                item.product_id
            ]);
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: "Sale completed and invoice created successfully",
            data: {
                id: saleId,
                invoice_no: invoiceNo,
                subtotal,
                discount: discountAmount,
                total,
                payment_method,
                payment_status,
                items: invoiceItems
            }
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        if (error.statusCode === 400) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({
                success: false,
                message: "The selected customer or product does not exist"
            });
        }

        console.error("Create sale error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to create sale"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};
