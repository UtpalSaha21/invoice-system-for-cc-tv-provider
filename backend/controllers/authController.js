const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// LOGIN
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username/email and password are required."
            });
        }

        const [users] = await db.query(
            `SELECT id, username, full_name, email,
                    password_hash, role, status
             FROM users
             WHERE username = ? OR email = ?
             LIMIT 1`,
            [username, username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid username/email or password."
            });
        }

        const user = users[0];

        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive. Contact the administrator."
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid username/email or password."
            });
        }

        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            success: true,
            message: "Login successful.",
            token,
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Server error during login."
        });
    }
};

// GET CURRENT LOGGED-IN USER
const getMe = async (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
};

module.exports = {
    login,
    getMe
};