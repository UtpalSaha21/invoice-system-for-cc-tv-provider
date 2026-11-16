const express = require("express");
const router = express.Router();

const {
    getStockAdjustments,
    createStockAdjustment
} = require("../controllers/stockAdjustmentController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

// Only admin can view stock adjustments
router.get("/", protect, allowRoles("admin"), getStockAdjustments);

// Only admin can create stock adjustments
router.post("/", protect, allowRoles("admin"), createStockAdjustment);

module.exports = router;