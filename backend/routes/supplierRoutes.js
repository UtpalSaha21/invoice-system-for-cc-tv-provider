const express = require("express");
const router = express.Router();

const {
    getSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier
} = require("../controllers/supplierController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

// All logged-in users can view suppliers
router.get("/", protect, getSuppliers);
router.get("/:id", protect, getSupplierById);

// Only admin and manager can manage suppliers
router.post("/", protect, allowRoles("admin", "manager"), createSupplier);
router.put("/:id", protect, allowRoles("admin", "manager"), updateSupplier);
router.delete("/:id", protect, allowRoles("admin", "manager"), deleteSupplier);

module.exports = router;