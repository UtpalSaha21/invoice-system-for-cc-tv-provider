const express = require("express");
const router = express.Router();

const {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer
} = require("../controllers/customerController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

// All logged-in users can view customers
router.get("/", protect, getCustomers);
router.get("/:id", protect, getCustomerById);

// Admin, manager and staff can create customers
router.post("/", protect, allowRoles("admin", "manager", "staff"), createCustomer);

// Only admin and manager can update or delete customers
router.put("/:id", protect, allowRoles("admin", "manager"), updateCustomer);
router.delete("/:id", protect, allowRoles("admin", "manager"), deleteCustomer);

module.exports = router;