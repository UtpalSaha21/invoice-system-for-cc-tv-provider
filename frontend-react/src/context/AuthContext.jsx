import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [loading, setLoading] = useState(true);

    // Restore login session when the application starts
    useEffect(() => {
        const checkLogin = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch("/api/auth/me", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    setUser(data.user);
                } else {
                    logout();
                }
            } catch (error) {
                console.error("Session check failed:", error);
                logout();
            } finally {
                setLoading(false);
            }
        };

        checkLogin();
    }, []);

    // Login function
    const login = async (username, password) => {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Login failed.");
        }

        localStorage.setItem("token", data.token);

        setToken(data.token);
        setUser(data.user);

        return data;
    };

    // Logout function
    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook
export const useAuth = () => {
    return useContext(AuthContext);
};