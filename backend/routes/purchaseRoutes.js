const express = require("express");
const router = express.Router();

const {
    getPurchases,
    getPurchaseById,
    createPurchase
} = require("../controllers/purchaseController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

// Admin and manager can view purchases
router.get("/", protect, allowRoles("admin", "manager"), getPurchases);
router.get("/:id", protect, allowRoles("admin", "manager"), getPurchaseById);

// Admin and manager can create purchases
router.post("/", protect, allowRoles("admin", "manager"), createPurchase);

module.exports = router;