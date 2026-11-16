
const db = require("../config/db");

// GET /api/categories
exports.getCategories = async (req, res) => {
    try {
        const [categories] = await db.query(
            "SELECT * FROM categories ORDER BY id DESC"
        );

        res.json({ success: true, data: categories });
    } catch (error) {
        console.error("Get categories error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch categories"
        });
    }
};

// GET /api/categories/:id
exports.getCategoryById = async (req, res) => {
    try {
        const [categories] = await db.query(
            "SELECT * FROM categories WHERE id = ?",
            [req.params.id]
        );

        if (categories.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        res.json({ success: true, data: categories[0] });
    } catch (error) {
        console.error("Get category error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch category"
        });
    }
};

// POST /api/categories
exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Category name is required"
            });
        }

        const [result] = await db.query(
            "INSERT INTO categories (name, description) VALUES (?, ?)",
            [name.trim(), description || null]
        );

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            id: result.insertId
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "This category already exists"
            });
        }

        console.error("Create category error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to create category"
        });
    }
};

// PUT /api/categories/:id
exports.updateCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Category name is required"
            });
        }

        const [result] = await db.query(
            "UPDATE categories SET name = ?, description = ? WHERE id = ?",
            [name.trim(), description || null, req.params.id]
        );

        if (result.affectedRows === 0) {
            const [existing] = await db.query(
                "SELECT id FROM categories WHERE id = ?",
                [req.params.id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Category not found"
                });
            }
        }

        res.json({
            success: true,
            message: "Category updated successfully"
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "This category already exists"
            });
        }

        console.error("Update category error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to update category"
        });
    }
};

// DELETE /api/categories/:id
exports.deleteCategory = async (req, res) => {
    try {
        const [products] = await db.query(
            "SELECT id FROM products WHERE category_id = ? LIMIT 1",
            [req.params.id]
        );

        if (products.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Cannot delete this category because products use it"
            });
        }

        const [result] = await db.query(
            "DELETE FROM categories WHERE id = ?",
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        res.json({
            success: true,
            message: "Category deleted successfully"
        });
    } catch (error) {
        console.error("Delete category error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to delete category"
        });
    }
};
