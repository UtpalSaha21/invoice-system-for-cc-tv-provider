
const db = require("../config/db");
const bcrypt = require("bcryptjs");

// Create Manager or Staff account
exports.createUser = async (req, res) => {
    try {
        const {
            username,
            full_name,
            email,
            password,
            role
        } = req.body;

        // Validate required fields
        if (!username || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "Username, password and role are required."
            });
        }

        // Only Manager and Staff accounts can be created here
        if (!["manager", "staff"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "You can only create Manager or Staff accounts."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters."
            });
        }

        const cleanUsername = username.trim();
        const cleanEmail = email?.trim() || null;

        // Check duplicate username or email
        const [existingUsers] = await db.query(
            `SELECT id FROM users
             WHERE username = ? OR (email = ? AND email IS NOT NULL)`,
            [cleanUsername, cleanEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Username or email already exists."
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert new user
        const [result] = await db.query(
            `INSERT INTO users
             (username, full_name, email, password_hash, role, status)
             VALUES (?, ?, ?, ?, ?, 'active')`,
            [
                cleanUsername,
                full_name?.trim() || null,
                cleanEmail,
                passwordHash,
                role
            ]
        );

        return res.status(201).json({
            success: true,
            message: `${role} account created successfully.`,
            user: {
                id: result.insertId,
                username: cleanUsername,
                full_name: full_name?.trim() || null,
                email: cleanEmail,
                role,
                status: "active"
            }
        });

    } catch (error) {
        console.error("Create user error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating user."
        });
    }
};


// Get all users (without password hashes)
exports.getUsers = async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT
                id,
                username,
                full_name,
                email,
                role,
                status,
                created_at
             FROM users
             ORDER BY created_at DESC`
        );

        return res.status(200).json({
            success: true,
            count: users.length,
            users
        });

    } catch (error) {
        console.error("Get users error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching users."
        });
    }
};


// Activate or deactivate a user account
exports.updateUserStatus = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        const { status } = req.body;

        // Validate user ID
        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID."
            });
        }

        // Only active or inactive status is allowed
        if (!["active", "inactive"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be active or inactive."
            });
        }

        // Prevent changing your own account status
        if (userId === req.user.id) {
            return res.status(400).json({
                success: false,
                message: "You cannot change your own account status."
            });
        }

        // Find the target account
        const [users] = await db.query(
            "SELECT id, role FROM users WHERE id = ?",
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Admin accounts cannot be managed here
        if (users[0].role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin account status cannot be changed here."
            });
        }

        // Update account status
        await db.query(
            "UPDATE users SET status = ? WHERE id = ?",
            [status, userId]
        );

        return res.status(200).json({
            success: true,
            message: `User account ${status === "active" ? "activated" : "deactivated"} successfully.`,
            user: {
                id: userId,
                status
            }
        });

    } catch (error) {
        console.error("Update user status error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating user status."
        });
    }
};
