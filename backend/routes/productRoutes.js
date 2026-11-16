const express = require("express");
const router = express.Router();

const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct
} = require("../controllers/productController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

// All logged-in users can view products
router.get("/", protect, getProducts);
router.get("/:id", protect, getProductById);

// Only admin and manager can modify products
router.post("/", protect, allowRoles("admin", "manager"), createProduct);
router.put("/:id", protect, allowRoles("admin", "manager"), updateProduct);

module.exports = router;