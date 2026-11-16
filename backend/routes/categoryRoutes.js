const express = require("express");
const router = express.Router();

const {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} = require("../controllers/categoryController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

// All logged-in users can view categories
router.get("/", protect, getCategories);
router.get("/:id", protect, getCategoryById);

// Only admin and manager can manage categories
router.post("/", protect, allowRoles("admin", "manager"), createCategory);
router.put("/:id", protect, allowRoles("admin", "manager"), updateCategory);
router.delete("/:id", protect, allowRoles("admin", "manager"), deleteCategory);

module.exports = router;