
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

export default function Login() {
    const { login } = useAuth();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSubmitting(true);

        try {
            await login(username, password);
        } catch (err) {
            setError(err.message || "Unable to login.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">

                <div className="login-logo">
                    <img src="/logo.png" alt="CCTV Point Logo" />
                </div>

                <h1 className="login-title">CCTV Point</h1>

                <p className="login-subtitle">
                    KHULNA · INVENTORY MANAGEMENT
                </p>

                <div className="login-welcome">
                    <h2>Welcome back</h2>
                    <p>Sign in to access your workspace.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <label className="login-label">
                        Username or Email
                    </label>

                    <input
                        type="text"
                        className="login-input"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username or email"
                        autoComplete="username"
                        required
                    />

                    <label className="login-label">
                        Password
                    </label>

                    <div className="login-password-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            className="login-password-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            required
                        />

                        <button
                            type="button"
                            className="login-eye-button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={
                                showPassword ? "Hide password" : "Show password"
                            }
                        >
                            {showPassword ? (
                                <EyeOff size={19} />
                            ) : (
                                <Eye size={19} />
                            )}
                        </button>
                    </div>

                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="login-submit-button"
                        disabled={submitting}
                    >
                        <LockKeyhole size={18} />
                        {submitting ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <p className="login-footer">
                    CCTV Point Khulna · Inventory & Sales Management
                </p>

            </div>
        </div>
    );
}
