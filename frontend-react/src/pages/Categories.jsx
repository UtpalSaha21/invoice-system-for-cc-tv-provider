import apiFetch from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { RefreshCw, Plus, Pencil, Trash2, X } from "lucide-react";

function Categories() {
  const { user } = useAuth();
  const canManageCategories = ["admin", "manager"].includes(user?.role);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch("/api/categories");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load categories.");
      }

      setCategories(result.data || []);
    } catch (err) {
      setError(err.message || "Could not load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setFormData({ name: "", description: "" });
    setError("");
    setShowForm(true);
  };

  const openEditForm = (category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name || "",
      description: category.description || "",
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
      setError("Category name is required.");
      return;
    }

    try {
      setSaving(true);

      const isEditing = editingId !== null;

      const response = await apiFetch(
        isEditing
          ? `/api/categories/${editingId}`
          : "/api/categories",
        {
          method: isEditing ? "PUT" : "POST",
          body: JSON.stringify({
            name: formData.name.trim(),
            description: formData.description.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save category.");
      }

      await fetchCategories();
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: "", description: "" });
    } catch (err) {
      setError(err.message || "Could not save category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await apiFetch(
        `/api/categories/${category.id}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete category.");
      }

      await fetchCategories();
    } catch (err) {
      setError(err.message || "Could not delete category.");
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Categories</h1>
          <p>Organize your CCTV products by category.</p>
        </div>

        <div className="header-actions">
          {canManageCategories && (
            <button className="btn-primary" onClick={openAddForm}>
              <Plus size={16} />
              Add Category
            </button>
          )}

          <button onClick={fetchCategories}>
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
            className="entity-modal category-form-container"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-form-title"
          >
            <div className="entity-modal-header">
              <div>
                <h2 id="category-form-title">
                  {editingId !== null ? "Edit Category" : "Add New Category"}
                </h2>
                <p>Organize your products by category.</p>
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

            <form onSubmit={handleSubmit} className="category-form">
              {error && <div className="error-message">{error}</div>}
              <label>
                Category Name *
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. CCTV Cameras"
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Optional category description"
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
                      ? "Update Category"
                      : "Save Category"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {loading ? (
        <p>Loading categories...</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Category Name</th>
                <th>Description</th>
                <th>{canManageCategories && ("Actions")}</th>
              </tr>
            </thead>

            <tbody>
              {categories.length > 0 ? (
                categories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.id}</td>
                    <td>{category.name}</td>
                    <td>{category.description || "—"}</td>
                    <td>
                      {canManageCategories && (
                        <div className="header-actions">
                          <button
                            type="button"
                            onClick={() => openEditForm(category)}
                            aria-label={`Edit ${category.name}`}
                          >
                            <Pencil size={15} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(category)}
                            aria-label={`Delete ${category.name}`}
                          >
                            <Trash2 size={15} />
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No categories found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Categories;
