
const express = require("express");
const router = express.Router();

const { createUser, getUsers, updateUserStatus } = require("../controllers/userController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

// Only Admin can create users
router.post("/", protect, allowRoles("admin"), createUser);

//only Admin can view users
router.get("/",protect,allowRoles("admin"),getUsers)

// Admin can activate or deactivate accounts
router.patch("/:id/status", protect, allowRoles("admin"), updateUserStatus);

module.exports = router;
