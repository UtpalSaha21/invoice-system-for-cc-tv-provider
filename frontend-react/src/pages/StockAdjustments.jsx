import apiFetch from "../utils/api";
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  X,
  TrendingUp,
  TrendingDown,
  Package,
  History,
} from "lucide-react";

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

async function apiRequest(url, options = {}) {
  const response = await apiFetch(url, options);

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message || `Request failed (${response.status})`
    );
  }

  return result;
}

export default function StockAdjustments() {
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [productId, setProductId] = useState("");
  const [adjustmentType, setAdjustmentType] = useState("increase");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [adjustmentResult, productResult] = await Promise.all([
        apiRequest("/api/stock-adjustments"),
        apiRequest("/api/products"),
      ]);

      setAdjustments(
        Array.isArray(adjustmentResult.data)
          ? adjustmentResult.data
          : []
      );

      setProducts(
        Array.isArray(productResult)
          ? productResult
          : Array.isArray(productResult.data)
            ? productResult.data
            : []
      );
    } catch (err) {
      setError(err.message || "Failed to load stock adjustments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedProduct = products.find(
    (product) => Number(product.id) === Number(productId)
  );

  const signedChange =
    adjustmentType === "increase"
      ? Math.abs(Number(quantity) || 0)
      : -Math.abs(Number(quantity) || 0);

  const projectedStock = selectedProduct
    ? Number(selectedProduct.stock) + signedChange
    : null;

  const filteredAdjustments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return adjustments.filter((adjustment) => {
      const matchesSearch = [
        adjustment.product_name,
        adjustment.product_sku,
        adjustment.reason,
        adjustment.quantity_change,
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLowerCase().includes(term));

      const change = Number(adjustment.quantity_change);

      const matchesType =
        filterType === "all" ||
        (filterType === "increase" && change > 0) ||
        (filterType === "decrease" && change < 0);

      return matchesSearch && matchesType;
    });
  }, [adjustments, search, filterType]);

  const increaseCount = adjustments.filter(
    (item) => Number(item.quantity_change) > 0
  ).length;

  const decreaseCount = adjustments.filter(
    (item) => Number(item.quantity_change) < 0
  ).length;

  function resetForm() {
    setProductId("");
    setAdjustmentType("increase");
    setQuantity("1");
    setReason("");
    setError("");
  }

  async function submitAdjustment(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!productId) {
      setError("Please select a product.");
      return;
    }

    const quantityValue = Number(quantity);

    if (
      !Number.isInteger(quantityValue) ||
      quantityValue <= 0
    ) {
      setError("Quantity must be a positive whole number.");
      return;
    }

    const cleanReason = reason.trim();

    if (!cleanReason) {
      setError("Please enter a reason for this adjustment.");
      return;
    }

    if (cleanReason.length > 255) {
      setError("Reason must be 255 characters or fewer.");
      return;
    }

    const change =
      adjustmentType === "increase"
        ? quantityValue
        : -quantityValue;

    if (
      selectedProduct &&
      Number(selectedProduct.stock) + change < 0
    ) {
      setError(
        `Insufficient stock. Current stock: ${selectedProduct.stock}.`
      );
      return;
    }

    setSaving(true);

    try {
      const result = await apiRequest("/api/stock-adjustments", {
        method: "POST",
        body: JSON.stringify({
          product_id: Number(productId),
          quantity_change: change,
          reason: cleanReason,
        }),
      });

      const data = result.data || {};

      setMessage(
        `${data.product_name || selectedProduct?.name || "Product"}: stock changed from ${data.previous_stock ?? "—"} to ${data.new_stock ?? "—"}.`
      );

      setShowForm(false);
      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to adjust stock.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stock-adjustments-page">
      <div className="page-header stock-adjustments-header">
        <div>
          <h1>Stock Adjustments</h1>
          <p>Record stock corrections, damaged goods, and inventory changes.</p>
        </div>

        <div className="stock-adjustments-actions">
          
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              resetForm();
              setMessage("");
              setShowForm(true);
            }}
          >
            <Plus size={18} />
            Adjust Stock
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {message && (
        <div className="stock-alert stock-alert-success">
          <span>{message}</span>
          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="stock-alert stock-alert-error">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="stock-summary-grid">
        <div className="stock-summary-card">
          <div className="stock-summary-icon">
            <History size={20} />
          </div>
          <div>
            <span>Total adjustments</span>
            <strong>{adjustments.length}</strong>
          </div>
        </div>

        <div className="stock-summary-card">
          <div className="stock-summary-icon stock-icon-increase">
            <TrendingUp size={20} />
          </div>
          <div>
            <span>Stock increases</span>
            <strong>{increaseCount}</strong>
          </div>
        </div>

        <div className="stock-summary-card">
          <div className="stock-summary-icon stock-icon-decrease">
            <TrendingDown size={20} />
          </div>
          <div>
            <span>Stock decreases</span>
            <strong>{decreaseCount}</strong>
          </div>
        </div>

        <div className="stock-summary-card">
          <div className="stock-summary-icon">
            <Package size={20} />
          </div>
          <div>
            <span>Products available</span>
            <strong>{products.length}</strong>
          </div>
        </div>
      </div>

      <div className="stock-adjustments-toolbar">
        <div className="stock-adjustments-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search product, SKU, or reason..."
          />
        </div>

        <select
          aria-label="Filter adjustment type"
          value={filterType}
          onChange={(event) => setFilterType(event.target.value)}
        >
          <option value="all">All adjustments</option>
          <option value="increase">Increases only</option>
          <option value="decrease">Decreases only</option>
        </select>

        <span className="stock-result-count">
          {filteredAdjustments.length} record(s)
        </span>
      </div>

      <div className="stock-adjustments-table-card">
        {loading ? (
          <div className="stock-empty">Loading adjustment history...</div>
        ) : filteredAdjustments.length === 0 ? (
          <div className="stock-empty">
            <Package size={32} />
            <strong>No adjustments found</strong>
            <span>Stock adjustments will appear here after you record them.</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="stock-adjustments-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Quantity change</th>
                  <th>Reason</th>
                </tr>
              </thead>

              <tbody>
                {filteredAdjustments.map((adjustment) => {
                  const change = Number(adjustment.quantity_change);

                  return (
                    <tr key={adjustment.id}>
                      <td>
                        {formatDate(
                          adjustment.created_at ||
                            adjustment.adjustment_date ||
                            adjustment.date
                        )}
                      </td>
                      <td>
                        <strong>
                          {adjustment.product_name ||
                            `Product #${adjustment.product_id}`}
                        </strong>
                      </td>
                      <td>{adjustment.product_sku || "—"}</td>
                      <td>
                        <span
                          className={`stock-change-badge ${
                            change > 0
                              ? "stock-change-positive"
                              : "stock-change-negative"
                          }`}
                        >
                          {change > 0 ? "+" : ""}
                          {change}
                        </span>
                      </td>
                      <td>{adjustment.reason || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div
          className="stock-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              setShowForm(false);
            }
          }}
        >
          <div className="stock-adjustment-modal">
            <div className="stock-modal-header">
              <div>
                <h2>Adjust Product Stock</h2>
                <p>Changes are saved immediately to your inventory.</p>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={() => !saving && setShowForm(false)}
                disabled={saving}
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitAdjustment}>
              <label>
                Select product
                <select
                  value={productId}
                  onChange={(event) => setProductId(event.target.value)}
                  required
                >
                  <option value="">Choose a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} — SKU: {product.sku || "N/A"} — Stock:{" "}
                      {product.stock}
                    </option>
                  ))}
                </select>
              </label>

              {selectedProduct && (
                <div className="stock-current-panel">
                  <span>Current stock</span>
                  <strong>{selectedProduct.stock}</strong>
                  <small>{selectedProduct.name}</small>
                </div>
              )}

              <fieldset className="stock-type-fieldset">
                <legend>Adjustment type</legend>

                <div className="stock-type-options">
                  <label
                    className={`stock-type-option ${
                      adjustmentType === "increase"
                        ? "stock-type-selected"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="adjustmentType"
                      value="increase"
                      checked={adjustmentType === "increase"}
                      onChange={() => setAdjustmentType("increase")}
                    />
                    <TrendingUp size={19} />
                    <span>
                      <strong>Increase stock</strong>
                      <small>Positive adjustment</small>
                    </span>
                  </label>

                  <label
                    className={`stock-type-option ${
                      adjustmentType === "decrease"
                        ? "stock-type-selected"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="adjustmentType"
                      value="decrease"
                      checked={adjustmentType === "decrease"}
                      onChange={() => setAdjustmentType("decrease")}
                    />
                    <TrendingDown size={19} />
                    <span>
                      <strong>Decrease stock</strong>
                      <small>Negative adjustment</small>
                    </span>
                  </label>
                </div>
              </fieldset>

              <label>
                Quantity
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  required
                />
              </label>

              {selectedProduct && Number(quantity) > 0 && (
                <div
                  className={`stock-projected-panel ${
                    projectedStock < 0 ? "stock-projected-error" : ""
                  }`}
                >
                  <span>Stock after adjustment</span>
                  <strong>
                    {projectedStock}
                  </strong>
                </div>
              )}

              <label className="stock-reason-field">
                Reason
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  maxLength={255}
                  rows="3"
                  placeholder="e.g. Damaged product, missing stock, inventory correction..."
                  required
                />
                <small>{reason.length}/255 characters</small>
              </label>

              <div className="stock-adjustment-warning">
                This action changes actual product stock and creates a history
                record. Check the product and quantity before saving.
              </div>

              {error && (
                <div className="stock-alert stock-alert-error">
                  <span>{error}</span>
                  <button
                    type="button"
                    onClick={() => setError("")}
                    aria-label="Dismiss error"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <div className="stock-modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    saving ||
                    !productId ||
                    !reason.trim() ||
                    !Number.isInteger(Number(quantity)) ||
                    Number(quantity) <= 0 ||
                    (adjustmentType === "decrease" &&
                      projectedStock !== null &&
                      projectedStock < 0)
                  }
                >
                  {saving ? "Saving adjustment..." : "Save Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
