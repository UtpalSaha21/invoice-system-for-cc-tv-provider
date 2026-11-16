import apiFetch from "../utils/api";
import { useEffect, useState } from "react";
import {
  RefreshCw,
  Plus,
  Trash2,
  ShoppingCart,
  Eye,
  X,
  Printer,
} from "lucide-react";

const emptyItem = () => ({
  product_id: "",
  quantity: "1",
  unit_cost: "",
});

function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const [formData, setFormData] = useState({
    supplier_id: "",
    payment_status: "paid",
    notes: "",
    items: [emptyItem()],
  });

  const fetchPurchases = async () => {
    const response = await apiFetch("/api/purchases");
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to load purchases.");
    }

    const list = Array.isArray(result)
      ? result
      : Array.isArray(result.data)
      ? result.data
      : Array.isArray(result.purchases)
      ? result.purchases
      : [];

    setPurchases(list);
  };

  const fetchFormData = async () => {
    const [supplierResponse, productResponse] = await Promise.all([
      apiFetch("/api/suppliers"),
      apiFetch("/api/products"),
    ]);

    const supplierResult = await supplierResponse.json();
    const productResult = await productResponse.json();

    if (!supplierResponse.ok) {
      throw new Error(supplierResult.message || "Failed to load suppliers.");
    }

    if (!productResponse.ok) {
      throw new Error(productResult.message || "Failed to load products.");
    }

    const supplierList = Array.isArray(supplierResult)
      ? supplierResult
      : Array.isArray(supplierResult.data)
      ? supplierResult.data
      : Array.isArray(supplierResult.suppliers)
      ? supplierResult.suppliers
      : [];

    const productList = Array.isArray(productResult)
      ? productResult
      : Array.isArray(productResult.data)
      ? productResult.data
      : Array.isArray(productResult.products)
      ? productResult.products
      : [];

    setSuppliers(supplierList);
    setProducts(productList);
  };

  const loadPage = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([fetchPurchases(), fetchFormData()]);
    } catch (err) {
      setError(err.message || "Could not load purchase data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const openForm = () => {
    setError("");
    setSuccess("");
    setFormData({
      supplier_id: "",
      payment_status: "paid",
      notes: "",
      items: [emptyItem()],
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setError("");
  };

  const updateItem = (index, field, value) => {
    setFormData((previous) => ({
      ...previous,
      items: previous.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
              ...(field === "product_id" ? { unit_cost: "" } : {}),
            }
          : item
      ),
    }));
  };

  const addItem = () => {
    setFormData((previous) => ({
      ...previous,
      items: [...previous.items, emptyItem()],
    }));
  };

  const removeItem = (index) => {
    setFormData((previous) => ({
      ...previous,
      items:
        previous.items.length === 1
          ? previous.items
          : previous.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const getProduct = (productId) =>
    products.find((product) => String(product.id) === String(productId));

  const calculateSubtotal = () =>
    formData.items.reduce((total, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitCost = Number(item.unit_cost) || 0;
      return total + quantity * unitCost;
    }, 0);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (formData.items.length === 0) {
      setError("Add at least one product.");
      return;
    }

    for (const item of formData.items) {
      if (!item.product_id) {
        setError("Please select a product for every purchase item.");
        return;
      }

      if (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0) {
        setError("Each quantity must be a positive whole number.");
        return;
      }

      if (item.unit_cost === "" || !Number.isFinite(Number(item.unit_cost)) || Number(item.unit_cost) < 0) {
        setError("Enter a valid non-negative purchase price for every product.");
        return;
      }
    }

    try {
      setSaving(true);

      const payload = {
        supplier_id: formData.supplier_id || null,
        payment_status: formData.payment_status,
        notes: formData.notes.trim(),
        items: formData.items.map((item) => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
          unit_cost: Number(item.unit_cost),
        })),
      };

      const response = await apiFetch("/api/purchases", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create purchase.");
      }

      setSuccess(
        `Purchase ${result.data?.purchase_no || ""} saved successfully. Stock has been updated.`
      );

      setShowForm(false);

      setFormData({
        supplier_id: "",
        payment_status: "paid",
        notes: "",
        items: [emptyItem()],
      });

      await Promise.all([fetchPurchases(), fetchFormData()]);
    } catch (err) {
      setError(err.message || "Could not create purchase.");
    } finally {
      setSaving(false);
    }
  };

  const viewPurchase = async (purchase) => {
    try {
      setError("");
      setSuccess("");

      const response = await apiFetch(`/api/purchases/${purchase.id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load purchase details.");
      }

      setSelectedPurchase(result.data);
    } catch (err) {
      setError(err.message || "Could not load purchase details.");
    }
  };

  const formatMoney = (amount) =>
    `৳${Number(amount || 0).toLocaleString("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Purchases</h1>
          <p>Record stock purchases from your suppliers.</p>
        </div>

        <div className="header-actions">
          <button className="btn-primary" onClick={openForm}>
            <Plus size={16} />
            New Purchase
          </button>

          <button onClick={loadPage}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error && !showForm && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {showForm && (
        <div
          className="entity-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              closeForm();
            }
          }}
        >
          <section
            className="entity-modal purchase-form-container purchase-entry-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="purchase-form-title"
          >
            <div className="entity-modal-header">
              <div>
                <h2 id="purchase-form-title">New Purchase</h2>
                <p>Record supplier items and update product stock.</p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            <div className="purchase-form-grid">
              <label>
                Supplier
                <select
                  value={formData.supplier_id}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      supplier_id: event.target.value,
                    }))
                  }
                >
                  <option value="">No supplier selected</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Payment Status *
                <select
                  value={formData.payment_status}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      payment_status: event.target.value,
                    }))
                  }
                  required
                >
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                </select>
              </label>

              <label className="purchase-notes-field">
                Notes
                <textarea
                  value={formData.notes}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Optional purchase notes"
                  rows={2}
                />
              </label>
            </div>

            <div className="purchase-items-heading">
              <h3>Purchase Items</h3>
              <button type="button" onClick={addItem}>
                <Plus size={15} />
                Add Product
              </button>
            </div>

            <div className="purchase-items-list">
              {formData.items.map((item, index) => {
                const product = getProduct(item.product_id);
                const lineTotal =
                  (Number(item.quantity) || 0) *
                  (Number(item.unit_cost) || 0);

                return (
                  <div className="purchase-item-row" key={index}>
                    <label>
                      Product *
                      <select
                        value={item.product_id}
                        onChange={(event) =>
                          updateItem(index, "product_id", event.target.value)
                        }
                        required
                      >
                        <option value="">Select a product</option>
                        {products.map((productOption) => (
                          <option
                            key={productOption.id}
                            value={productOption.id}
                          >
                            {productOption.name} (Stock: {productOption.stock})
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Quantity *
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(index, "quantity", event.target.value)
                        }
                        required
                      />
                    </label>

                    <label>
                      Unit Cost (৳) *
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_cost}
                        onChange={(event) =>
                          updateItem(index, "unit_cost", event.target.value)
                        }
                        placeholder="0.00"
                        required
                      />
                    </label>

                    <div className="purchase-line-total">
                      <span>Line Total</span>
                      <strong>{formatMoney(lineTotal)}</strong>
                    </div>

                    <button
                      type="button"
                      className="purchase-remove-button"
                      onClick={() => removeItem(index)}
                      disabled={formData.items.length === 1}
                      title="Remove product"
                      aria-label={`Remove item ${index + 1}`}
                    >
                      <Trash2 size={17} />
                    </button>

                    {product && (
                      <span className="purchase-current-stock">
                        Current stock: {product.stock}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="purchase-total">
              <span>Purchase Total</span>
              <strong>{formatMoney(calculateSubtotal())}</strong>
            </div>

            <div className="entity-modal-actions purchase-submit-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button" disabled={saving}>
                <ShoppingCart size={16} />
                {saving ? "Saving Purchase..." : "Save Purchase"}
              </button>
            </div>

            <p className="purchase-stock-note">
              Saving this purchase will increase product stock through your
              backend API. Do not submit the same purchase twice.
            </p>
          </form>
          </section>
        </div>
      )}

      <div className="purchase-summary">
        <div className="purchase-summary-card">
          <span>Total Purchases</span>
          <strong>{purchases.length}</strong>
        </div>

        <div className="purchase-summary-card">
          <span>Total Purchase Value</span>
          <strong>
            {formatMoney(
              purchases.reduce(
                (total, purchase) => total + Number(purchase.total || 0),
                0
              )
            )}
          </strong>
        </div>
      </div>

      {loading ? (
        <p>Loading purchases...</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Purchase No.</th>
                <th>Supplier</th>
                <th>Date</th>
                <th>Total</th>
                <th>Payment Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {purchases.length > 0 ? (
                purchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td>{purchase.id}</td>
                    <td>{purchase.purchase_no || "—"}</td>
                    <td>{purchase.supplier_name || "—"}</td>
                    <td>
                      {purchase.created_at
                        ? new Date(purchase.created_at).toLocaleDateString()
                        : purchase.purchase_date
                        ? new Date(purchase.purchase_date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>{formatMoney(purchase.total)}</td>
                    <td>
                      <span
                        className={`payment-status payment-${purchase.payment_status || "unpaid"}`}
                      >
                        {purchase.payment_status || "Unknown"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => viewPurchase(purchase)}
                      >
                        <Eye size={15} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">No purchases recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      
{selectedPurchase && (
  <div className="purchase-modal-backdrop">
    <div className="table-container purchase-details-modal">
      <div className="purchase-form-heading no-print">
        <div>
          <h2>Purchase Details</h2>
          <p>{selectedPurchase.purchase_no}</p>
        </div>

        <button
          type="button"
          onClick={() => setSelectedPurchase(null)}
          aria-label="Close purchase details"
        >
          <X size={18} />
        </button>
      </div>

      <div className="print-invoice" id="purchase-invoice">
        <div className="invoice-header">
          <div>
            <span>
              <img className="sale-invoice-logo" src="/logo.png" alt="" />
              <h1>CCTV Point Khulna</h1>
            </span>
            <p>Inventory &amp; Sales Management</p>
            <p>Purchase Invoice</p>
          </div>

          <div className="invoice-number">
            <strong>Purchase No.</strong>
            <span>{selectedPurchase.purchase_no || `PUR-${selectedPurchase.id}`}</span>
            <strong>Purchase ID</strong>
            <span>{selectedPurchase.id}</span>
          </div>
        </div>

        <div className="invoice-divider" />

        <div className="invoice-information">
          <div>
            <h3>Supplier Information</h3>
            <p>
              <strong>Name:</strong>{" "}
              {selectedPurchase.supplier_name || "Not specified"}
            </p>
          </div>

          <div>
            <h3>Purchase Information</h3>
            <p>
              <strong>Date:</strong>{" "}
              {selectedPurchase.created_at
                ? new Date(selectedPurchase.created_at).toLocaleDateString()
                : selectedPurchase.purchase_date
                ? new Date(selectedPurchase.purchase_date).toLocaleDateString()
                : "Not available"}
            </p>

            <p>
              <strong>Payment:</strong>{" "}
              <span className="invoice-payment-status">
                {selectedPurchase.payment_status || "Unknown"}
              </span>
            </p>
          </div>
        </div>

        <h3 className="invoice-items-title">Purchased Items</h3>

        <div className="invoice-table-wrapper">
          <table className="invoice-items-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Cost</th>
                <th>Line Total</th>
              </tr>
            </thead>

            <tbody>
              {(selectedPurchase.items || []).map((item, index) => (
                <tr key={item.id || index}>
                  <td>{index + 1}</td>
                  <td>
                    {item.current_product_name || `Product #${item.product_id}`}
                  </td>
                  <td>{item.quantity}</td>
                  <td>{formatMoney(item.unit_cost)}</td>
                  <td>{formatMoney(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="invoice-total">
          <span>Grand Total</span>
          <strong>{formatMoney(selectedPurchase.total)}</strong>
        </div>

        <div className="invoice-notes">
          <strong>Notes:</strong> {selectedPurchase.notes || "None"}
        </div>

        <div className="invoice-footer">
          <p>Thank you for maintaining accurate inventory records.</p>
          <p>CCTV Point Khulna</p>
        </div>
      </div>

      <div className="invoice-actions no-print">
        <button
          type="button"
          className="btn-primary"
          onClick={() => window.print()}
        >
          <Printer size={17} />
          Print Invoice
        </button>

        <button
          type="button"
          onClick={() => setSelectedPurchase(null)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}

export default Purchases;
