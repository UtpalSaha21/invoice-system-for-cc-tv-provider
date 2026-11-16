import apiFetch from "../utils/api";
import { useEffect, useState } from "react";
import { RefreshCw, Plus, Pencil, Trash2, Search, X } from "lucide-react";

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
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

  const [formData, setFormData] = useState({ ...emptyForm });

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch("/api/suppliers");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load suppliers.");
      }

      const list = Array.isArray(result)
        ? result
        : Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.suppliers)
        ? result.suppliers
        : [];

      setSuppliers(list);
    } catch (err) {
      setError(err.message || "Could not load suppliers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setFormData({ ...emptyForm });
    setError("");
    setShowForm(true);
  };

  const openEditForm = (supplier) => {
    setEditingId(supplier.id);
    setFormData({
      name: supplier.name || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
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
      setError("Supplier name is required.");
      return;
    }

    try {
      setSaving(true);

      const isEditing = editingId !== null;

      const response = await apiFetch(
        isEditing
          ? `/api/suppliers/${editingId}`
          : "/api/suppliers",
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
        throw new Error(result.message || "Failed to save supplier.");
      }

      await fetchSuppliers();
      setShowForm(false);
      setEditingId(null);
      setFormData({ ...emptyForm });
    } catch (err) {
      setError(err.message || "Could not save supplier.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (supplier) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${supplier.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await apiFetch(
        `/api/suppliers/${supplier.id}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete supplier.");
      }

      await fetchSuppliers();
    } catch (err) {
      setError(err.message || "Could not delete supplier.");
    }
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    const query = search.toLowerCase();

    return (
      String(supplier.name || "").toLowerCase().includes(query) ||
      String(supplier.phone || "").toLowerCase().includes(query) ||
      String(supplier.email || "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Suppliers</h1>
          <p>Manage your CCTV Point Khulna suppliers.</p>
        </div>

        <div className="header-actions">
          <button className="btn-primary" onClick={openAddForm}>
            <Plus size={16} />
            Add Supplier
          </button>

          <button onClick={fetchSuppliers}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error && !showForm && <div className="error-message">{error}</div>}

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
            className="entity-modal supplier-form-container"
            role="dialog"
            aria-modal="true"
            aria-labelledby="supplier-form-title"
          >
            <div className="entity-modal-header">
              <div>
                <h2 id="supplier-form-title">
                  {editingId !== null ? "Edit Supplier" : "Add New Supplier"}
                </h2>
                <p>Keep supplier contact details up to date.</p>
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

            <form onSubmit={handleSubmit} className="supplier-form">
              {error && <div className="error-message">{error}</div>}
              <label>
                Supplier Name *
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter supplier name"
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
                  placeholder="Enter supplier address"
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
                      ? "Update Supplier"
                      : "Save Supplier"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <div className="supplier-toolbar">
        <div className="supplier-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <span>{filteredSuppliers.length} supplier(s)</span>
      </div>

      {loading ? (
        <p>Loading suppliers...</p>
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
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>{supplier.id}</td>
                    <td>{supplier.name || "—"}</td>
                    <td>{supplier.phone || "—"}</td>
                    <td>{supplier.email || "—"}</td>
                    <td>{supplier.address || "—"}</td>
                    <td>
                      <div className="header-actions">
                        <button
                          type="button"
                          onClick={() => openEditForm(supplier)}
                          aria-label={`Edit ${supplier.name}`}
                        >
                          <Pencil size={15} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(supplier)}
                          aria-label={`Delete ${supplier.name}`}
                        >
                          <Trash2 size={15} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">
                    {search ? "No matching suppliers found." : "No suppliers found."}
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

export default Suppliers;
