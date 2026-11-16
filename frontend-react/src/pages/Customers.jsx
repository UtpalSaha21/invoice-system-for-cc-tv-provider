import apiFetch from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { RefreshCw, Plus, Pencil, Trash2, Search, X } from "lucide-react";

function Customers() {
  const {user} = useAuth();
  const canManageCustomers = ["admin","manager"].includes(user?.role);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const emptyForm = {
    name: "",
    phone: "",
    email: "",
    address: "",
  };

  const [formData, setFormData] = useState(emptyForm);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch("/api/customers");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load customers.");
      }

      const list = Array.isArray(result)
        ? result
        : Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.customers)
        ? result.customers
        : [];

      setCustomers(list);
    } catch (err) {
      setError(err.message || "Could not load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setFormData({ ...emptyForm });
    setError("");
    setShowForm(true);
  };

  const openEditForm = (customer) => {
    setEditingId(customer.id);
    setFormData({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
    });
    setError("");
    setShowForm(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Customer name is required.");
      return;
    }

    try {
      setSaving(true);

      const isEditing = editingId !== null;

      const response = await apiFetch(
        isEditing
          ? `/api/customers/${editingId}`
          : "/api/customers",
        {
          method: isEditing ? "PUT" : "POST",
          body: JSON.stringify({
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim(),
            address: formData.address.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save customer.");
      }

      await fetchCustomers();
      setShowForm(false);
      setEditingId(null);
      setFormData({ ...emptyForm });
    } catch (err) {
      setError(err.message || "Could not save customer.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (customer) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${customer.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await apiFetch(
        `/api/customers/${customer.id}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete customer.");
      }

      await fetchCustomers();
    } catch (err) {
      setError(err.message || "Could not delete customer.");
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const query = search.toLowerCase();

    return (
      String(customer.name || "").toLowerCase().includes(query) ||
      String(customer.phone || "").toLowerCase().includes(query) ||
      String(customer.email || "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p>Manage your CCTV Point Khulna customers.</p>
        </div>

        <div className="header-actions">
          <button className="btn-primary" onClick={openAddForm}>
            <Plus size={16} />
            Add Customer
          </button>

          <button onClick={fetchCustomers}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error && !showForm && (
        <div className="error-message">
          {error}
        </div>
      )}

      {showForm && (
        <div
          className="entity-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowForm(false);
              setEditingId(null);
              setError("");
            }
          }}
        >
          <section
            className="entity-modal customer-form-container"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-form-title"
          >
            <div className="entity-modal-header">
              <div>
                <h2 id="customer-form-title">
                  {editingId !== null ? "Edit Customer" : "Add New Customer"}
                </h2>
                <p>Keep customer contact details up to date.</p>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setError("");
                }}
                disabled={saving}
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="customer-form">
              {error && <div className="error-message">{error}</div>}
              <label>
                Customer Name *
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter customer name"
                  required
                />
              </label>

              <label>
                Phone
                <input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />
              </label>

              <label>
                Email
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                />
              </label>

              <label>
                Address
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter customer address"
                  rows={3}
                />
              </label>

              <div className="entity-modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setError("");
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                      ? "Update Customer"
                      : "Save Customer"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <div className="customer-toolbar">
        <div className="customer-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <span>{filteredCustomers.length} customer(s)</span>
      </div>

      {loading ? (
        <p>Loading customers...</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th>{canManageCustomers && ("Actions")}</th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.id}</td>
                    <td>{customer.name || "—"}</td>
                    <td>{customer.phone || "—"}</td>
                    <td>{customer.email || "—"}</td>
                    <td>{customer.address || "—"}</td>
                    <td>
                      {canManageCustomers && (<div className="header-actions">
                        <button
                          type="button"
                          onClick={() => openEditForm(customer)}
                          aria-label={`Edit ${customer.name}`}
                        >
                          <Pencil size={15} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(customer)}
                          aria-label={`Delete ${customer.name}`}
                        >
                          <Trash2 size={15} />
                          Delete
                        </button>
                      </div>)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">
                    {search ? "No matching customers found." : "No customers found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Customers;