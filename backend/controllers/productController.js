
const db = require("../config/db");

// GET /api/products
// Get all products with their category names
exports.getProducts = async (req, res) => {
    try {
        const [products] = await db.query(`
            SELECT
                p.*,
                c.name AS category_name
            FROM products p
            LEFT JOIN categories c
                ON p.category_id = c.id
            ORDER BY p.id DESC
        `);

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error("Get products error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch products"
        });
    }
};

// GET /api/products/:id
// Get one product by ID
exports.getProductById = async (req, res) => {
    try {
        const [products] = await db.query(
            `SELECT * FROM products WHERE id = ?`,
            [req.params.id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.json({
            success: true,
            data: products[0]
        });
    } catch (error) {
        console.error("Get product error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch product"
        });
    }
};

// POST /api/products
// Add a new product
exports.createProduct = async (req, res) => {
    try {
        if (
            req.user.role !== "admin" &&
            Object.prototype.hasOwnProperty.call(req.body, "stock")
        ) {
            return res.status(403).json({
                success: false,
                message: "Only administrators can set initial product stock."
            });
        }
        const {
            category_id,
            sku,
            name,
            description,
            buy_price,
            sell_price,
            stock,
            minimum_stock
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Product name is required"
            });
        }

        const buyPrice = Number(buy_price ?? 0);
        const sellPrice = Number(sell_price ?? 0);
        const stockQty = Number(stock ?? 0);
        const minimumStock = Number(minimum_stock ?? 5);
        const categoryId =
            category_id === "" || category_id == null
                ? null
                : Number(category_id);

        if (
            !Number.isFinite(buyPrice) ||
            !Number.isFinite(sellPrice) ||
            !Number.isInteger(stockQty) ||
            !Number.isInteger(minimumStock) ||
            buyPrice < 0 ||
            sellPrice < 0 ||
            stockQty < 0 ||
            minimumStock < 0 ||
            (categoryId !== null &&
                (!Number.isInteger(categoryId) || categoryId <= 0))
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid prices, stock, and category"
            });
        }

        const [result] = await db.query(
            `INSERT INTO products
            (category_id, sku, name, description, buy_price,
             sell_price, stock, minimum_stock)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                categoryId,
                sku || null,
                name.trim(),
                description || null,
                buyPrice,
                sellPrice,
                stockQty,
                minimumStock
            ]
        );

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            id: result.insertId
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "That SKU already exists"
            });
        }

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({
                success: false,
                message: "Selected category does not exist"
            });
        }

        console.error("Create product error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to create product"
        });
    }
};

// PUT /api/products/:id
// Update an existing product
exports.updateProduct = async (req, res) => {
    try {
        if (
            req.user.role !== "admin" &&
            Object.prototype.hasOwnProperty.call(req.body, "stock")
        ) {
            return res.status(403).json({
                success: false,
                message: "Only administrators can change product stock."
            });
        }

        const [existingProducts] = await db.query(
            "SELECT stock FROM products WHERE id = ?",
            [req.params.id]
        );

        if (existingProducts.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        const {
            category_id,
            sku,
            name,
            description,
            buy_price,
            sell_price,
            stock,
            minimum_stock
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Product name is required"
            });
        }

        const buyPrice = Number(buy_price);
        const sellPrice = Number(sell_price);
        const stockQty =
            req.user.role === "admin"
                ? Number(stock)
                : Number(existingProducts[0].stock);
        const minimumStock = Number(minimum_stock);
        const categoryId =
            category_id === "" || category_id == null
                ? null
                : Number(category_id);

        if (
            !Number.isFinite(buyPrice) ||
            !Number.isFinite(sellPrice) ||
            !Number.isInteger(stockQty) ||
            !Number.isInteger(minimumStock) ||
            buyPrice < 0 ||
            sellPrice < 0 ||
            stockQty < 0 ||
            minimumStock < 0 ||
            (categoryId !== null &&
                (!Number.isInteger(categoryId) || categoryId <= 0))
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid product values"
            });
        }

        const [result] = await db.query(
            `UPDATE products
             SET category_id = ?, sku = ?, name = ?, description = ?,
                 buy_price = ?, sell_price = ?, stock = ?,
                 minimum_stock = ?
             WHERE id = ?`,
            [
                categoryId,
                sku || null,
                name.trim(),
                description || null,
                buyPrice,
                sellPrice,
                stockQty,
                minimumStock,
                req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            const [existing] = await db.query(
                "SELECT id FROM products WHERE id = ?",
                [req.params.id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found"
                });
            }
        }

        res.json({
            success: true,
            message: "Product updated successfully"
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "That SKU already exists"
            });
        }

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({
                success: false,
                message: "Selected category does not exist"
            });
        }

        console.error("Update product error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to update product"
        });
    }
};