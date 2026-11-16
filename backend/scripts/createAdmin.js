require("dotenv").config();

const readline = require("readline");
const bcrypt = require("bcryptjs");
const db = require("../config/db");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

async function createAdmin() {
    try {
        const username = (await ask("Enter admin username: ")).trim();
        const fullName = (await ask("Enter admin full name: ")).trim();
        const emailInput = (await ask("Enter admin email (optional): ")).trim();
        const email = emailInput || null;

        const password = process.env.ADMIN_PASSWORD;

        if (!username || !fullName) {
            throw new Error("Username and full name are required.");
        }

        if (!password || password.length < 12) {
            throw new Error("Password must be at least 12 characters.");
        }

        const [existingUsers] = await db.query(
            "SELECT id FROM users WHERE username = ? OR (email IS NOT NULL AND email = ?)",
            [username, email]
        );

        if (existingUsers.length > 0) {
            throw new Error("This username or email is already registered.");
        }

        const [adminRows] = await db.query(
            "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
        );

        if (adminRows.length > 0) {
            throw new Error(
                "An administrator already exists. Use the user management feature to add another account."
            );
        }

        const passwordHash = await bcrypt.hash(password, 12);

        await db.query(
            `INSERT INTO users
             (username, full_name, email, password_hash, role, status)
             VALUES (?, ?, ?, ?, 'admin', 'active')`,
            [username, fullName, email, passwordHash]
        );

        console.log("\nAdmin account created successfully!");
        console.log("Username:", username);
        console.log("Role: admin");
        console.log("Status: active");

    } catch (error) {
        console.error("\nAdmin creation failed:", error.message);
        process.exitCode = 1;
    } finally {
        rl.close();
        await db.end();
    }
}

createAdmin();