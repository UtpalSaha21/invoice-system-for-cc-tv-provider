
const db = require("../config/db");

// GET /api/stock-adjustments
// View stock adjustment history.
exports.getStockAdjustments = async (req, res) => {
    try {
        const [adjustments] = await db.query(`
            SELECT
                sa.*,
                p.name AS product_name,
                p.sku AS product_sku
            FROM stock_adjustments sa
            LEFT JOIN products p ON sa.product_id = p.id
            ORDER BY sa.id DESC
        `);

        res.json({
            success: true,
            data: adjustments
        });
    } catch (error) {
        console.error("Get stock adjustments error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch stock adjustment history"
        });
    }
};

// POST /api/stock-adjustments
// Adjust stock and record the reason atomically.
exports.createStockAdjustment = async (req, res) => {
    const { product_id, quantity_change, reason } = req.body;

    const productId = Number(product_id);
    const change = Number(quantity_change);
    const adjustmentReason =
        typeof reason === "string" ? reason.trim() : "";

    if (!Number.isInteger(productId) || productId <= 0) {
        return res.status(400).json({
            success: false,
            message: "A valid product ID is required"
        });
    }

    if (!Number.isInteger(change) || change === 0) {
        return res.status(400).json({
            success: false,
            message: "Quantity change must be a non-zero integer"
        });
    }

    if (!adjustmentReason || adjustmentReason.length > 255) {
        return res.status(400).json({
            success: false,
            message: "Reason is required and must be at most 255 characters"
        });
    }

    let connection;
    let transactionStarted = false;

    try {
        connection = await db.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

        // Lock the product row while checking and changing stock.
        const [products] = await connection.query(
            `SELECT id, name, stock
             FROM products
             WHERE id = ?
             FOR UPDATE`,
            [productId]
        );

        if (products.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const product = products[0];
        const currentStock = Number(product.stock);
        const newStock = currentStock + change;

        // Stock must never become negative.
        if (newStock < 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message: `Insufficient stock. Current stock: ${currentStock}`
            });
        }

        await connection.query(
            `UPDATE products
             SET stock = ?
             WHERE id = ?`,
            [newStock, productId]
        );

        const [result] = await connection.query(
            `INSERT INTO stock_adjustments
             (product_id, quantity_change, reason)
             VALUES (?, ?, ?)`,
            [productId, change, adjustmentReason]
        );

        await connection.commit();
        transactionStarted = false;

        res.status(201).json({
            success: true,
            message: "Stock adjusted successfully",
            data: {
                adjustment_id: result.insertId,
                product_id: productId,
                product_name: product.name,
                previous_stock: currentStock,
                quantity_change: change,
                new_stock: newStock,
                reason: adjustmentReason
            }
        });
    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Rollback error:", rollbackError.message);
            }
        }

        console.error("Create stock adjustment error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to adjust stock"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};
