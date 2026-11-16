const express = require("express");
const router = express.Router();

const {
    getSales,
    getSaleById,
    createSale
} = require("../controllers/saleController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

// All logged-in users can view sales and invoices
router.get("/", protect, allowRoles("admin", "manager", "staff"), getSales);
router.get("/:id", protect, allowRoles("admin", "manager", "staff"), getSaleById);

// All logged-in users can create sales
router.post("/", protect, allowRoles("admin", "manager", "staff"), createSale);

module.exports = router;