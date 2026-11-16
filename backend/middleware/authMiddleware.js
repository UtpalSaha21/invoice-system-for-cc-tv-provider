const jwt = require("jsonwebtoken");
const db = require("../config/db");

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Please login first."
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const [users] = await db.query(
            `SELECT id, username, full_name, email, role, status
             FROM users
             WHERE id = ?`,
            [decoded.id]
        );

        if (users.length === 0 || users[0].status !== "active") {
            return res.status(401).json({
                success: false,
                message: "User account is inactive or does not exist."
            });
        }

        req.user = users[0];

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
};

const allowRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to access this resource."
            });
        }

        next();
    };
};

module.exports = { protect, allowRoles };