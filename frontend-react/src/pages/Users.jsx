
import { useEffect, useState } from "react";
import {
    UserPlus,
    X,
    Eye,
    EyeOff,
    RefreshCw,
    Users as UsersIcon
} from "lucide-react";

import apiFetch from "../utils/api";

function Users() {
    const [formData, setFormData] = useState({
        username: "",
        full_name: "",
        email: "",
        password: "",
        role: "staff",
    });

    const [users, setUsers] = useState([]);

    const [saving, setSaving] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(true);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [listError, setListError] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // Fetch all users
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoadingUsers(true);
                setListError("");

                const response = await apiFetch("/api/users");
                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message || "Failed to fetch users."
                    );
                }

                setUsers(result.users || []);

            } catch (err) {
                setListError(
                    err.message || "Could not load users."
                );
            } finally {
                setLoadingUsers(false);
            }
        };

        fetchUsers();
    }, [refreshKey]);

    // Handle form inputs
    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // Create new user
    const handleSubmit = async (event) => {
        event.preventDefault();

        setMessage("");
        setError("");

        if (formData.password.length < 12) {
            setError("Password must be at least 12 characters.");
            return;
        }

        try {
            setSaving(true);

            const response = await apiFetch("/api/users", {
                method: "POST",
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Failed to create account."
                );
            }

            setMessage(
                result.message || "Account created successfully!"
            );

            setFormData({
                username: "",
                full_name: "",
                email: "",
                password: "",
                role: "staff",
            });

            setShowPassword(false);

            // Refresh user list
            setRefreshKey((previous) => previous + 1);

        } catch (err) {
            setError(
                err.message || "Could not create account."
            );
        } finally {
            setSaving(false);
        }
    };

    // Reset form
    const handleReset = () => {
        setFormData({
            username: "",
            full_name: "",
            email: "",
            password: "",
            role: "staff",
        });

        setShowPassword(false);
        setMessage("");
        setError("");
    };


    // Activate or deactivate a user
    const handleStatusChange = async (user) => {
        const newStatus =
            user.status === "active" ? "inactive" : "active";

        const action =
            newStatus === "active" ? "activate" : "deactivate";

        const confirmed = window.confirm(
            `Are you sure you want to ${action} ${user.username}?`
        );

        if (!confirmed) return;

        try {
            const response = await apiFetch(
                `/api/users/${user.id}/status`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        status: newStatus,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Failed to update account status."
                );
            }

            // Update the table immediately
            setUsers((previousUsers) =>
                previousUsers.map((item) =>
                    item.id === user.id
                        ? { ...item, status: newStatus }
                        : item
                )
            );

            setMessage(result.message);

        } catch (err) {
            setError(
                err.message || "Could not update account status."
            );
        }
    };


    // Format date
    const formatDate = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleDateString();
    };

    return (
        <div className="page-content">

            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1>User Management</h1>
                    <p>Create and manage Manager and Staff accounts.</p>
                </div>
            </div>

            {/* Create User Form */}
            <div className="entity-modal category-form-container">

                <div className="entity-modal-header">
                    <div>
                        <h2>
                            <UserPlus size={20} />
                            Create New User
                        </h2>

                        <p>
                            Enter the account information below.
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="category-form"
                    autoComplete="off"
                >

                    {message && (
                        <div className="success-message">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <label>
                        Username *

                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Enter username"
                            autoComplete="off"
                            required
                        />
                    </label>

                    <label>
                        Full Name

                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            placeholder="Enter full name"
                        />
                    </label>

                    <label>
                        Email

                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter email address"
                            autoComplete="off"
                        />
                    </label>

                    <label>
                        Password *

                        <div className="password-input-wrapper">
                            <input
                                type={
                                    showPassword ? "text" : "password"
                                }
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Minimum 12 characters"
                                minLength={12}
                                autoComplete="new-password"
                                required
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowPassword(!showPassword)
                                }
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >
                                {showPassword
                                    ? <EyeOff size={18} />
                                    : <Eye size={18} />
                                }
                            </button>
                        </div>
                    </label>

                    <label>
                        Account Role *

                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            required
                        >
                            <option value="staff">Staff</option>
                            <option value="manager">Manager</option>
                        </select>
                    </label>

                    <div className="entity-modal-actions">

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={handleReset}
                            disabled={saving}
                        >
                            <X size={16} />
                            Reset
                        </button>

                        <button
                            type="submit"
                            className="primary-button"
                            disabled={saving}
                        >
                            <UserPlus size={16} />
                            {saving ? "Creating..." : "Create Account"}
                        </button>

                    </div>
                </form>
            </div>

            {/* User List */}
            <div className="users-list-section">

                <div className="users-list-header">
                    <div>
                        <h2>
                            <UsersIcon size={20} />
                            User Accounts
                        </h2>

                        <p>
                            Total accounts: {users.length}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                            setRefreshKey((previous) => previous + 1)
                        }
                        disabled={loadingUsers}
                    >
                        <RefreshCw
                            size={16}
                            className={loadingUsers ? "spin" : ""}
                        />
                        Refresh
                    </button>
                </div>

                {listError && (
                    <div className="error-message">
                        {listError}
                    </div>
                )}

                {loadingUsers ? (
                    <p className="users-loading">
                        Loading users...
                    </p>
                ) : users.length === 0 && !listError ? (
                    <p className="users-empty">
                        No user accounts found.
                    </p>
                ) : (
                    !listError && (
                        <div className="users-table-container">
                            <table className="users-table">

                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Username</th>
                                        <th>Full Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Created At</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td>{user.id}</td>

                                            <td>
                                                {user.username}
                                            </td>

                                            <td>
                                                {user.full_name || "—"}
                                            </td>

                                            <td>
                                                {user.email || "—"}
                                            </td>

                                            <td>
                                                <span
                                                    className={`role-badge ${user.role}`}
                                                >
                                                    {user.role}
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={`status-badge ${user.status}`}
                                                >
                                                    {user.status}
                                                </span>
                                            </td>

                                            <td>
                                                {formatDate(user.created_at)}
                                            </td>

                                            <td>
                                                {
                                                    user.role == "admin" ? (
                                                        <span className="admin-protected">
                                                            Protected
                                                        </span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className={
                                                                user.status === "active"
                                                                    ? "deactivate-user-button"
                                                                    : "activate-user-button"
                                                            }
                                                            onClick={() => handleStatusChange(user)}
                                                        >
                                                            {user.status === "active"
                                                                ? "Deactivate"
                                                                : "Activate"}
                                                        </button>
                                                    )
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                            </table>
                        </div>
                    )
                )}

            </div>

        </div>
    );
}

export default Users;
