import apiFetch from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { Search, RefreshCw, X } from "lucide-react";

function Products() {
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    const canManageProducts = ["admin", "manager"].includes(user?.role);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [formError, setFormError] = useState("");
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState("all");


    const [formData, setFormData] = useState({
        name: "",
        category_id: "",
        sku: "",
        description: "",
        buy_price: "",
        sell_price: "",
        stock: "",
        minimum_stock: "",
    });

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await apiFetch("/api/products");

            if (!response.ok) {
                throw new Error("Failed to load products.");
            }

            const data = await response.json();

            // Support either an array or { products: [...] }
            const productList = Array.isArray(data)
                ? data
                : Array.isArray(data.products)
                    ? data.products
                    : Array.isArray(data.data)
                        ? data.data
                        : null;

            if (!Array.isArray(productList)) {
                throw new Error("Unexpected products API response.");
            }

            setProducts(productList);
        } catch (err) {
            setError(err.message || "Could not load products.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const filteredProducts = products.filter((product) => {
        const searchText = search.trim().toLowerCase();

        const name = String(product.name || "").toLowerCase();
        const sku = String(product.sku || "").toLowerCase();

        const matchesSearch =
            name.includes(searchText) ||
            sku.includes(searchText);

        const matchesCategory =
            selectedCategory === "all" ||
            String(product.category_id ?? "") === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    const fetchCategories = async () => {
        try {
            const response = await apiFetch("/api/categories");
            const result = await response.json();

            const list = Array.isArray(result)
                ? result
                : Array.isArray(result.data)
                    ? result.data
                    : Array.isArray(result.categories)
                        ? result.categories
                        : [];

            setCategories(list);
        } catch (err) {
            console.error("Failed to load categories:", err);
        }
    };

    const handleFormChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };


    const handleAddProduct = async (event) => {
        event.preventDefault();
        setFormError("");

        if (!formData.name.trim()) {
            setFormError("Product name is required.");
            return;
        }

        try {
            setSaving(true);

            const isEditing = editingId !== null;

            const response = await apiFetch(
                isEditing ? `/api/products/${editingId}` : "/api/products",
                {
                    method: isEditing ? "PUT" : "POST",
                    body: JSON.stringify({
                        name: formData.name.trim(),
                        category_id: formData.category_id || null,
                        sku: formData.sku,
                        description: formData.description,
                        buy_price: Number(formData.buy_price || 0),
                        sell_price: Number(formData.sell_price || 0),
                        ...(isAdmin
                            ? { stock: Number(formData.stock || 0) }
                            : {}),
                        minimum_stock: Number(formData.minimum_stock || 5),
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to save product.");
            }

            await fetchProducts();

            setFormData({
                name: "",
                category_id: "",
                sku: "",
                description: "",
                buy_price: "",
                sell_price: "",
                stock: "",
                minimum_stock: "5",
            });

            setEditingId(null);
            setShowForm(false);

            alert(
                isEditing
                    ? "Product updated successfully!"
                    : "Product added successfully!"
            );
        } catch (err) {
            setFormError(err.message || "Could not save product.");
        } finally {
            setSaving(false);
        }
    };



    const handleEditProduct = (product) => {
        setEditingId(product.id);

        setFormData({
            name: product.name || "",
            category_id: product.category_id ?? "",
            sku: product.sku || "",
            description: product.description || "",
            buy_price: product.buy_price ?? "",
            sell_price: product.sell_price ?? "",
            stock: product.stock ?? 0,
            minimum_stock: product.minimum_stock ?? 5,
        });

        setFormError("");
        setShowForm(true);
    };



    return (
        <div className="page-content">
            <div className="page-header">
                <div>
                    <h1>Products</h1>
                    <p>Manage your CCTV products and stock.</p>
                </div>

                <div className="header-actions">
                    {canManageProducts && (
                        <button
                            className="btn-primary"
                            onClick={() => {
                                setEditingId(null);
                                setFormError("");
                                setFormData({
                                    name: "",
                                    category_id: "",
                                    sku: "",
                                    description: "",
                                    buy_price: "",
                                    sell_price: "",
                                    stock: "",
                                    minimum_stock: "5",
                                });
                                setShowForm(true);
                            }}
                        >
                            + Add Product
                        </button>
                    )}

                    <button className="refresh-button" onClick={fetchProducts}>
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>
            </div>


            {showForm && (
                <div
                    className="entity-modal-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget && !saving) {
                            setShowForm(false);
                            setEditingId(null);
                            setFormError("");
                        }
                    }}
                >
                    <section
                        className="entity-modal product-form-container"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="product-form-title"
                    >
                        <div className="entity-modal-header">
                            <div>
                                <h2 id="product-form-title">
                                    {editingId !== null ? "Edit Product" : "Add New Product"}
                                </h2>
                                <p>Manage product details, pricing, and stock levels.</p>
                            </div>
                            <button
                                type="button"
                                className="icon-button"
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingId(null);
                                    setFormError("");
                                }}
                                disabled={saving}
                                aria-label="Close form"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddProduct} className="product-form">
                            <label>
                                Product Name *
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleFormChange}
                                    required
                                />
                            </label>

                            <label>
                                Category
                                <select
                                    name="category_id"
                                    value={formData.category_id}
                                    onChange={handleFormChange}
                                >
                                    <option value="">No category</option>
                                    {categories.map((category) => (
                                        <option
                                            key={category.id}
                                            value={category.id}
                                        >
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                SKU
                                <input
                                    name="sku"
                                    value={formData.sku}
                                    onChange={handleFormChange}
                                />
                            </label>

                            <label>
                                Description
                                <input
                                    name="description"
                                    value={formData.description}
                                    onChange={handleFormChange}
                                />
                            </label>

                            <label>
                                Buying Price (৳)
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    name="buy_price"
                                    value={formData.buy_price}
                                    onChange={handleFormChange}
                                />
                            </label>

                            <label>
                                Selling Price (৳)
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    name="sell_price"
                                    value={formData.sell_price}
                                    onChange={handleFormChange}
                                />
                            </label>

                            {isAdmin && (
                                <label>
                                    Initial Stock
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        name="stock"
                                        value={formData.stock}
                                        onChange={handleFormChange}
                                    />
                                </label>
                            )}

                            <label>
                                Minimum Stock Alert
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    name="minimum_stock"
                                    value={formData.minimum_stock}
                                    onChange={handleFormChange}
                                />
                            </label>

                            {formError && (
                                <p className="error-message">{formError}</p>
                            )}

                            <div className="entity-modal-actions">
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingId(null);
                                        setFormError("");
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
                                            ? "Update Product"
                                            : "Save Product"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}


            <div className="products-toolbar">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by product name or SKU..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                    <select
                        value={selectedCategory}
                        onChange={(event) => setSelectedCategory(event.target.value)}
                        aria-label="Filter products by category"
                    >
                        <option value="all">All Categories</option>

                        {categories.map((category) => (
                            <option key={category.id} value={String(category.id)}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>


                <span className="product-count">
                    {filteredProducts.length} products
                </span>
            </div>

            {loading ? (
                <p>Loading products...</p>
            ) : error ? (
                <div className="error-message">
                    {error}
                    <button onClick={fetchProducts}>Try again</button>
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Product Name</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Stock Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => (
                                    <tr key={product.product_id}>
                                        <td>{product.id}</td>
                                        <td>{product.name}</td>
                                        <td>
                                            ৳ {Number(product.buy_price || 0).toLocaleString()}
                                        </td>
                                        <td>{product.stock ?? 0}</td>

                                        <td>
                                            {Number(product.stock ?? 0) === 0 ? (
                                                <span className="stock-badge stock-out">
                                                    Out of Stock
                                                </span>
                                            ) : Number(product.stock) <= Number(product.minimum_stock ?? 5) ? (
                                                <span className="stock-badge stock-low">
                                                    Low Stock
                                                </span>
                                            ) : (
                                                <span className="stock-badge stock-good">
                                                    In Stock
                                                </span>
                                            )}
                                        </td>

                                        <td>
                                            {canManageProducts && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleEditProduct(product)}
                                                >
                                                    Edit
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4">
                                        No products found.
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

export default Products;
