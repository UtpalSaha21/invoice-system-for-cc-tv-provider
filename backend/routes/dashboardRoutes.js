const express = require("express");
const router = express.Router();

const {
    getDashboardSummary
} = require("../controllers/dashboardController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

// All logged-in users can view the dashboard
router.get(
    "/",
    protect,
    allowRoles("admin", "manager", "staff"),
    getDashboardSummary
);

module.exports = router;