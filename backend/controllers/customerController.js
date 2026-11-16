
const db = require("../config/db");

// GET /api/customers
exports.getCustomers = async (req, res) => {
    try {
        const [customers] = await db.query(
            "SELECT * FROM customers ORDER BY id DESC"
        );

        res.json({ success: true, data: customers });
    } catch (error) {
        console.error("Get customers error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch customers"
        });
    }
};

// GET /api/customers/:id
exports.getCustomerById = async (req, res) => {
    try {
        const [customers] = await db.query(
            "SELECT * FROM customers WHERE id = ?",
            [req.params.id]
        );

        if (customers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        res.json({ success: true, data: customers[0] });
    } catch (error) {
        console.error("Get customer error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch customer"
        });
    }
};

// POST /api/customers
exports.createCustomer = async (req, res) => {
    try {
        const { name, phone, email, address } = req.body;

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Customer name is required"
            });
        }

        const [result] = await db.query(
            `INSERT INTO customers (name, phone, email, address)
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
            message: "Customer created successfully",
            id: result.insertId
        });
    } catch (error) {
        console.error("Create customer error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to create customer"
        });
    }
};

// PUT /api/customers/:id
exports.updateCustomer = async (req, res) => {
    try {
        const { name, phone, email, address } = req.body;

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Customer name is required"
            });
        }

        const [result] = await db.query(
            `UPDATE customers
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
                "SELECT id FROM customers WHERE id = ?",
                [req.params.id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Customer not found"
                });
            }
        }

        res.json({
            success: true,
            message: "Customer updated successfully"
        });
    } catch (error) {
        console.error("Update customer error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to update customer"
        });
    }
};

// DELETE /api/customers/:id
exports.deleteCustomer = async (req, res) => {
    try {
        // Preserve customer records linked to previous sales.
        const [sales] = await db.query(
            "SELECT id FROM sales WHERE customer_id = ? LIMIT 1",
            [req.params.id]
        );

        if (sales.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Cannot delete a customer linked to sales"
            });
        }

        const [result] = await db.query(
            "DELETE FROM customers WHERE id = ?",
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        res.json({
            success: true,
            message: "Customer deleted successfully"
        });
    } catch (error) {
        console.error("Delete customer error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to delete customer"
        });
    }
};
