
const db = require("../config/db");

// GET /api/purchases
exports.getPurchases = async (req, res) => {
    try {
        const [purchases] = await db.query(`
            SELECT
                p.*,
                s.name AS supplier_name
            FROM purchases p
            LEFT JOIN suppliers s
                ON p.supplier_id = s.id
            ORDER BY p.id DESC
        `);

        res.json({
            success: true,
            data: purchases
        });
    } catch (error) {
        console.error("Get purchases error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch purchases"
        });
    }
};

// GET /api/purchases/:id
exports.getPurchaseById = async (req, res) => {
    try {
        const [purchases] = await db.query(
            `SELECT p.*, s.name AS supplier_name
             FROM purchases p
             LEFT JOIN suppliers s ON p.supplier_id = s.id
             WHERE p.id = ?`,
            [req.params.id]
        );

        if (purchases.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Purchase not found"
            });
        }

        const [items] = await db.query(
            `SELECT pi.*, pr.name AS current_product_name
             FROM purchase_items pi
             JOIN products pr ON pi.product_id = pr.id
             WHERE pi.purchase_id = ?`,
            [req.params.id]
        );

        res.json({
            success: true,
            data: {
                ...purchases[0],
                items
            }
        });
    } catch (error) {
        console.error("Get purchase error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch purchase details"
        });
    }
};

// POST /api/purchases
// Creates a purchase and increases stock atomically.
exports.createPurchase = async (req, res) => {
    const { supplier_id, items, payment_status, notes } = req.body;

    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {
        return res.status(400).json({
            success: false,
            message: "At least one purchase item is required"
        });
    }

    const allowedPaymentStatuses = ["paid", "unpaid", "partial"];
    const status = payment_status || "paid";

    if (!allowedPaymentStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid payment status"
        });
    }

    // Validate items before opening the transaction.
    const normalizedItems = [];
    for (const item of items) {
        const productId = Number(item.product_id);
        const quantity = Number(item.quantity);
        const unitCost = Number(item.unit_cost);

        if (
            !Number.isInteger(productId) || productId <= 0 ||
            !Number.isInteger(quantity) || quantity <= 0 ||
            !Number.isFinite(unitCost) || unitCost < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Each item needs a valid product, positive quantity, and non-negative unit cost"
            });
        }

        normalizedItems.push({
            product_id: productId,
            quantity,
            unit_cost: unitCost
        });
    }

    const supplierId =
        supplier_id === "" || supplier_id == null
            ? null
            : Number(supplier_id);

    if (
        supplierId !== null &&
        (!Number.isInteger(supplierId) || supplierId <= 0)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid supplier ID"
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        let subtotal = 0;

        // Lock each product row while stock is being changed.
        for (const item of normalizedItems) {
            const [products] = await connection.query(
                "SELECT id FROM products WHERE id = ? FOR UPDATE",
                [item.product_id]
            );

            if (products.length === 0) {
                throw new Error(
                    `Product ${item.product_id} does not exist`
                );
            }

            item.line_total = Number(
                (item.quantity * item.unit_cost).toFixed(2)
            );

            subtotal += item.line_total;
        }

        subtotal = Number(subtotal.toFixed(2));

        const purchaseNo =
            `PUR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const [purchaseResult] = await connection.query(
            `INSERT INTO purchases
             (purchase_no, supplier_id, subtotal, total, payment_status, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                purchaseNo,
                supplierId,
                subtotal,
                subtotal,
                status,
                notes || null
            ]
        );

        const purchaseId = purchaseResult.insertId;

        for (const item of normalizedItems) {
            await connection.query(
                `INSERT INTO purchase_items
                 (purchase_id, product_id, quantity, unit_cost, line_total)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    purchaseId,
                    item.product_id,
                    item.quantity,
                    item.unit_cost,
                    item.line_total
                ]
            );

            await connection.query(
                `UPDATE products
                 SET stock = stock + ?
                 WHERE id = ?`,
                [item.quantity, item.product_id]
            );
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: "Purchase created and stock updated successfully",
            data: {
                id: purchaseId,
                purchase_no: purchaseNo,
                subtotal,
                total: subtotal,
                items: normalizedItems
            }
        });
    } catch (error) {
        await connection.rollback();

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({
                success: false,
                message: "The selected supplier or product does not exist"
            });
        }

        if (error.message.startsWith("Product ")) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        console.error("Create purchase error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to create purchase"
        });
    } finally {
        connection.release();
    }
};
