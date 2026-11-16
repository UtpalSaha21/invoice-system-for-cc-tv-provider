import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Video, Eye, EyeOff, LockKeyhole } from "lucide-react";

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
        <div style={styles.page}>
            <div style={styles.card}>
                <div style={styles.logo}>
                    <Video size={30} />
                </div>

                <h1 style={styles.title}>CCTV Point</h1>
                <p style={styles.subtitle}>KHULNA · INVENTORY MANAGEMENT</p>

                <div style={styles.welcome}>
                    <h2>Welcome back</h2>
                    <p>Sign in to access your workspace.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <label style={styles.label}>
                        Username or Email
                    </label>

                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username or email"
                        autoComplete="username"
                        required
                        style={styles.input}
                    />

                    <label style={styles.label}>
                        Password
                    </label>

                    <div style={styles.passwordWrapper}>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            required
                            style={styles.passwordInput}
                        />

                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={styles.eyeButton}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                        </button>
                    </div>

                    {error && (
                        <div style={styles.error}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            ...styles.submitButton,
                            opacity: submitting ? 0.7 : 1
                        }}
                    >
                        <LockKeyhole size={18} />
                        {submitting ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <p style={styles.footer}>
                    CCTV Point Khulna · Inventory & Sales Management
                </p>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
        background: "#f3f6fb",
        fontFamily: "Arial, sans-serif"
    },
    card: {
        width: "100%",
        maxWidth: "420px",
        padding: "38px",
        background: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 12px 40px rgba(15, 23, 42, 0.09)"
    },
    logo: {
        width: "58px",
        height: "58px",
        margin: "0 auto 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "14px",
        background: "#e8efff",
        color: "#3157c8"
    },
    title: {
        textAlign: "center",
        fontSize: "27px",
        margin: "0",
        color: "#172033"
    },
    subtitle: {
        textAlign: "center",
        fontSize: "11px",
        letterSpacing: "1.5px",
        color: "#7b8495",
        marginTop: "7px"
    },
    welcome: {
        marginTop: "34px",
        marginBottom: "25px"
    },
    label: {
        display: "block",
        fontSize: "13px",
        fontWeight: "600",
        color: "#344054",
        marginBottom: "8px",
        marginTop: "19px"
    },
    input: {
        width: "100%",
        boxSizing: "border-box",
        padding: "13px 14px",
        border: "1px solid #dce1e9",
        borderRadius: "8px",
        fontSize: "14px",
        outlineColor: "#3157c8"
    },
    passwordWrapper: {
        display: "flex",
        alignItems: "center",
        border: "1px solid #dce1e9",
        borderRadius: "8px",
        overflow: "hidden"
    },
    passwordInput: {
        flex: 1,
        minWidth: 0,
        padding: "13px 14px",
        border: "none",
        outline: "none",
        fontSize: "14px"
    },
    eyeButton: {
        display: "flex",
        alignItems: "center",
        padding: "10px 12px",
        border: "none",
        background: "#ffffff",
        color: "#667085",
        cursor: "pointer"
    },
    error: {
        marginTop: "15px",
        padding: "11px",
        borderRadius: "7px",
        background: "#fff0f0",
        color: "#c62828",
        fontSize: "13px"
    },
    submitButton: {
        width: "100%",
        marginTop: "25px",
        padding: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "9px",
        border: "none",
        borderRadius: "8px",
        background: "#3157c8",
        color: "#ffffff",
        fontSize: "15px",
        fontWeight: "600",
        cursor: "pointer"
    },
    footer: {
        textAlign: "center",
        marginTop: "28px",
        marginBottom: "0",
        fontSize: "11px",
        color: "#98a0ad"
    }
};