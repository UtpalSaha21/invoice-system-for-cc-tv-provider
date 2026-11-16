
const db = require("../config/db");

// GET /api/suppliers
exports.getSuppliers = async (req, res) => {
    try {
        const [suppliers] = await db.query(
            "SELECT * FROM suppliers ORDER BY id DESC"
        );

        res.json({ success: true, data: suppliers });
    } catch (error) {
        console.error("Get suppliers error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch suppliers"
        });
    }
};

// GET /api/suppliers/:id
exports.getSupplierById = async (req, res) => {
    try {
        const [suppliers] = await db.query(
            "SELECT * FROM suppliers WHERE id = ?",
            [req.params.id]
        );

        if (suppliers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found"
            });
        }

        res.json({ success: true, data: suppliers[0] });
    } catch (error) {
        console.error("Get supplier error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch supplier"
        });
    }
};

// POST /api/suppliers
exports.createSupplier = async (req, res) => {
    try {
        const { name, phone, email, address } = req.body;

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Supplier name is required"
            });
        }

        const [result] = await db.query(
            `INSERT INTO suppliers (name, phone, email, address)
             VALUES (?, ?, ?, ?)`,
            [
                name.trim(),
                phone || null,
                email || null,
                address || null
            ]
        );

        res.status(201).json({
            success: true,
            message: "Supplier created successfully",
            id: result.insertId
        });
    } catch (error) {
        console.error("Create supplier error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to create supplier"
        });
    }
};

// PUT /api/suppliers/:id
exports.updateSupplier = async (req, res) => {
    try {
        const { name, phone, email, address } = req.body;

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Supplier name is required"
            });
        }

        const [result] = await db.query(
            `UPDATE suppliers
             SET name = ?, phone = ?, email = ?, address = ?
             WHERE id = ?`,
            [
                name.trim(),
                phone || null,
                email || null,
                address || null,
                req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            const [existing] = await db.query(
                "SELECT id FROM suppliers WHERE id = ?",
                [req.params.id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Supplier not found"
                });
            }
        }

        res.json({
            success: true,
            message: "Supplier updated successfully"
        });
    } catch (error) {
        console.error("Update supplier error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to update supplier"
        });
    }
};

// DELETE /api/suppliers/:id
exports.deleteSupplier = async (req, res) => {
    try {
        // Preserve supplier records linked to previous purchases.
        const [purchases] = await db.query(
            "SELECT id FROM purchases WHERE supplier_id = ? LIMIT 1",
            [req.params.id]
        );

        if (purchases.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Cannot delete a supplier linked to purchases"
            });
        }

        const [result] = await db.query(
            "DELETE FROM suppliers WHERE id = ?",
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found"
            });
        }

        res.json({
            success: true,
            message: "Supplier deleted successfully"
        });
    } catch (error) {
        console.error("Delete supplier error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to delete supplier"
        });
    }
};

module.exports = exports;
