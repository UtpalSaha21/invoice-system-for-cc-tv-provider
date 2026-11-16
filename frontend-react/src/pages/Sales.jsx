import apiFetch from "../utils/api";
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Eye,
  Printer,
  X,
  Trash2,
  Receipt,
} from "lucide-react";

const money = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getErrorMessage = (error, fallback) =>
  error instanceof Error ? error.message : fallback;

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [discount, setDiscount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([
    { product_id: "", quantity: "1" },
  ]);

  async function request(url, options = {}) {
    const response = await apiFetch(url, options);

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false) {
      throw new Error(
        result.message || `Request failed (${response.status})`
      );
    }

    return result;
  }


  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [salesResult, customersResult, productsResult] =
        await Promise.all([
          request("/api/sales"),
          request("/api/customers"),
          request("/api/products"),
        ]);

      setSales(
        Array.isArray(salesResult.data) ? salesResult.data : []
      );

      setCustomers(
        Array.isArray(customersResult)
          ? customersResult
          : Array.isArray(customersResult.data)
            ? customersResult.data
            : Array.isArray(customersResult.customers)
              ? customersResult.customers
              : []
      );

      setProducts(
        Array.isArray(productsResult)
          ? productsResult
          : Array.isArray(productsResult.data)
            ? productsResult.data
            : []
      );
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load sales data."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredSales = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return sales;

    return sales.filter((sale) =>
      [
        sale.invoice_no,
        sale.customer_name,
        sale.customer_phone,
        sale.payment_status,
        sale.payment_method,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [sales, search]);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const product = products.find(
          (p) => Number(p.id) === Number(item.product_id)
        );

        return (
          sum +
          Number(product?.sell_price || 0) *
          Math.max(0, Number(item.quantity) || 0)
        );
      }, 0),
    [items, products]
  );

  const discountAmount = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, subtotal - discountAmount);

  function resetForm() {
    setCustomerId("");
    setDiscount("0");
    setPaymentMethod("cash");
    setPaymentStatus("paid");
    setNotes("");
    setItems([{ product_id: "", quantity: "1" }]);
    setError("");
    setMessage("");
  }

  function addItem() {
    setItems((current) => [
      ...current,
      { product_id: "", quantity: "1" },
    ]);
  }

  function updateItem(index, field, value) {
    setItems((current) =>
      current.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }

  function removeItem(index) {
    setItems((current) =>
      current.length === 1
        ? current
        : current.filter((_, i) => i !== index)
    );
  }

  async function createSale(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!items.length || items.some((item) => !item.product_id)) {
      setError("Please select a product for every invoice item.");
      return;
    }

    if (
      items.some(
        (item) =>
          !Number.isInteger(Number(item.quantity)) ||
          Number(item.quantity) <= 0
      )
    ) {
      setError("Each product quantity must be a positive whole number.");
      return;
    }

    if (!Number.isFinite(Number(discount)) || Number(discount) < 0) {
      setError("Discount must be zero or a positive amount.");
      return;
    }

    if (Number(discount) > subtotal) {
      setError("Discount cannot exceed the subtotal.");
      return;
    }

    // Check quantities locally for a faster, clearer warning.
    // The backend still performs the authoritative stock validation.
    const requestedQuantities = new Map();

    for (const item of items) {
      const id = Number(item.product_id);
      requestedQuantities.set(
        id,
        (requestedQuantities.get(id) || 0) + Number(item.quantity)
      );
    }

    for (const [id, quantity] of requestedQuantities) {
      const product = products.find((p) => Number(p.id) === id);

      if (!product) {
        setError("A selected product could not be found. Refresh and try again.");
        return;
      }

      if (Number(product.stock) < quantity) {
        setError(
          `Insufficient stock for ${product.name}. Available: ${product.stock}.`
        );
        return;
      }
    }

    setSaving(true);

    try {
      const result = await request("/api/sales", {
        method: "POST",
        body: JSON.stringify({
          customer_id: customerId || null,
          items: items.map((item) => ({
            product_id: Number(item.product_id),
            quantity: Number(item.quantity),
          })),
          discount: Number(discount),
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          notes: notes.trim(),
        }),
      });

      setMessage(
        `Invoice ${result.data?.invoice_no || ""} created successfully.`
      );
      setShowForm(false);
      resetForm();

      await loadData();

      if (result.data?.id) {
        await viewInvoice(result.data.id);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create sale."));
    } finally {
      setSaving(false);
    }
  }

  async function viewInvoice(id) {
    setInvoiceLoading(true);
    setError("");

    try {
      const result = await request(`/api/sales/${id}`);
      setSelectedSale(result.data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load invoice details."));
    } finally {
      setInvoiceLoading(false);
    }
  }

  const statusClass = (status) =>
    `sale-status sale-status-${String(status || "")
      .toLowerCase()
      .replace(/[^a-z]/g, "")}`;

  return (
    <div className="sales-page">
      <div className="page-header sales-header">
        <div>
          <h1>Sales & Invoices</h1>
          <p>Create sales, manage invoices, and track payments.</p>
        </div>

        <div className="sales-header-actions">
          
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <Plus size={18} />
            New Sale
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
        <div className="sales-alert sales-alert-success">
          {message}
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
        <div className="sales-alert sales-alert-error">
          {error}
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="sales-summary-grid">
        <div className="sales-summary-card">
          <span>Total invoices</span>
          <strong>{sales.length}</strong>
        </div>

        <div className="sales-summary-card">
          <span>Total sales value</span>
          <strong>
            {money(
              sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0)
            )}
          </strong>
        </div>

        <div className="sales-summary-card">
          <span>Paid invoices</span>
          <strong>
            {sales.filter((sale) => sale.payment_status === "paid").length}
          </strong>
        </div>

        <div className="sales-summary-card">
          <span>Unpaid invoices</span>
          <strong>
            {sales.filter((sale) => sale.payment_status === "unpaid").length}
          </strong>
        </div>
      </div>

      <div className="sales-toolbar">
        <div className="sales-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search invoice, customer, or payment..."
          />
        </div>

        <span className="sales-result-count">
          {filteredSales.length} invoice(s)
        </span>
      </div>

      <div className="sales-table-card">
        {loading ? (
          <div className="sales-empty">Loading sales...</div>
        ) : filteredSales.length === 0 ? (
          <div className="sales-empty">
            <Receipt size={32} />
            <strong>No invoices found</strong>
            <span>Create a new sale to get started.</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Payment method</th>
                  <th>Payment status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>
                      <strong>{sale.invoice_no || `INV-${sale.id}`}</strong>
                    </td>
                    <td>{formatDate(sale.created_at || sale.sale_date || sale.date)}</td>
                    <td>
                      <div className="sales-customer-cell">
                        <strong>{sale.customer_name || "Walk-in customer"}</strong>
                        {sale.customer_phone && (
                          <small>{sale.customer_phone}</small>
                        )}
                      </div>
                    </td>
                    <td>
                      <strong>{money(sale.total)}</strong>
                    </td>
                    <td>
                      {String(sale.payment_method || "—")
                        .replace("_", " ")
                        .replace(/\b\w/g, (char) => char.toUpperCase())}
                    </td>
                    <td>
                      <span className={statusClass(sale.payment_status)}>
                        {sale.payment_status || "Unknown"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="icon-button"
                        title="View invoice"
                        onClick={() => viewInvoice(sale.id)}
                      >
                        <Eye size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div
          className="sales-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowForm(false);
            }
          }}
        >
          <div className="sales-modal sales-create-modal">
            <div className="sales-modal-header">
              <div>
                <h2>Create New Sale</h2>
                <p>Product stock will be updated automatically.</p>
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

            <form onSubmit={createSale}>
              <div className="sales-form-grid">
                <label>
                  Customer
                  <select
                    value={customerId}
                    onChange={(event) => setCustomerId(event.target.value)}
                  >
                    <option value="">Walk-in customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                        {customer.phone ? ` — ${customer.phone}` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Payment method
                  <select
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank">Bank transfer</option>
                    <option value="mobile_banking">Mobile banking</option>
                  </select>
                </label>

                <label>
                  Payment status
                  <select
                    value={paymentStatus}
                    onChange={(event) => setPaymentStatus(event.target.value)}
                  >
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="partial">Partial</option>
                  </select>
                </label>

                <label>
                  Discount (৳)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(event) => setDiscount(event.target.value)}
                  />
                </label>
              </div>

              <div className="sales-items-heading">
                <h3>Invoice items</h3>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={addItem}
                >
                  <Plus size={15} />
                  Add product
                </button>
              </div>

              <div className="sales-item-list">
                {items.map((item, index) => {
                  const product = products.find(
                    (p) => Number(p.id) === Number(item.product_id)
                  );

                  const quantity = Math.max(0, Number(item.quantity) || 0);
                  const lineTotal =
                    Number(product?.sell_price || 0) * quantity;

                  return (
                    <div className="sales-item-row" key={index}>
                      <label className="sales-item-product">
                        Product
                        <select
                          value={item.product_id}
                          onChange={(event) =>
                            updateItem(index, "product_id", event.target.value)
                          }
                          required
                        >
                          <option value="">Select product</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} — {money(p.sell_price)} · Stock: {p.stock}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="sales-item-quantity">
                        Qty
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

                      <div className="sales-item-total">
                        <span>Line total</span>
                        <strong>{money(lineTotal)}</strong>
                        {product && (
                          <small>Available: {product.stock}</small>
                        )}
                      </div>

                      <button
                        type="button"
                        className="icon-button sales-remove-item"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                        title="Remove item"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <label className="sales-notes-field">
                Notes (optional)
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows="2"
                  placeholder="Warranty, installation, or other notes..."
                />
              </label>

              <div className="sales-total-panel">
                <div>
                  <span>Subtotal</span>
                  <strong>{money(subtotal)}</strong>
                </div>
                <div>
                  <span>Discount</span>
                  <strong>− {money(discountAmount)}</strong>
                </div>
                <div className="sales-grand-total">
                  <span>Total payable</span>
                  <strong>{money(total)}</strong>
                </div>
              </div>

              <div className="sales-modal-actions">
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
                  disabled={saving || items.length === 0}
                >
                  {saving ? "Creating invoice..." : "Create Sale & Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedSale && (
        <div className="sales-modal-backdrop">
          <div className="sales-modal sales-invoice-modal">
            <div className="sales-modal-header no-print">
              <div>
                <h2>Invoice Details</h2>
                <p>{selectedSale.invoice_no}</p>
              </div>
              <div className="sales-header-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => window.print()}
                >
                  <Printer size={16} />
                  Print invoice
                </button>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setSelectedSale(null)}
                  aria-label="Close invoice"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {invoiceLoading ? (
              <div className="sales-empty">Loading invoice...</div>
            ) : (
              <div className="sales-print-area">
                <div className="sales-invoice-brand">
                  <span>
                    <img className="sale-invoice-logo" src="/logo.png" alt="" />
                    <h1>CCTV Point Khulna</h1>
                  </span>
                  <p>Sales Invoice</p>
                </div>

                <div className="sales-invoice-meta">
                  <div>
                    <span>Invoice number</span>
                    <strong>{selectedSale.invoice_no || `INV-${selectedSale.id}`}</strong>
                  </div>
                  <div>
                    <span>Date</span>
                    <strong>
                      {formatDate(
                        selectedSale.created_at ||
                        selectedSale.sale_date ||
                        selectedSale.date
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>Payment method</span>
                    <strong>
                      {String(selectedSale.payment_method || "—")
                        .replace("_", " ")
                        .replace(/\b\w/g, (char) => char.toUpperCase())}
                    </strong>
                  </div>
                  <div>
                    <span>Payment status</span>
                    <strong>{selectedSale.payment_status || "—"}</strong>
                  </div>
                </div>

                <div className="sales-invoice-customer">
                  <h3>Customer</h3>
                  <p>{selectedSale.customer_name || "Walk-in customer"}</p>
                  {selectedSale.customer_phone && <p>{selectedSale.customer_phone}</p>}
                  {selectedSale.customer_email && <p>{selectedSale.customer_email}</p>}
                  {selectedSale.customer_address && <p>{selectedSale.customer_address}</p>}
                </div>

                <div className="table-responsive">
                  <table className="sales-table sales-invoice-items">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Unit price</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedSale.items || []).map((item, index) => (
                        <tr key={item.id || `${item.product_id}-${index}`}>
                          <td>{index + 1}</td>
                          <td>{item.product_name || `Product #${item.product_id}`}</td>
                          <td>{item.quantity}</td>
                          <td>{money(item.unit_price)}</td>
                          <td>{money(item.line_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="sales-invoice-totals">
                  <div>
                    <span>Subtotal</span>
                    <strong>{money(selectedSale.subtotal)}</strong>
                  </div>
                  <div>
                    <span>Discount</span>
                    <strong>− {money(selectedSale.discount)}</strong>
                  </div>
                  <div className="sales-invoice-grand-total">
                    <span>Total</span>
                    <strong>{money(selectedSale.total)}</strong>
                  </div>
                </div>

                {selectedSale.notes && (
                  <div className="sales-invoice-notes">
                    <strong>Notes:</strong> {selectedSale.notes}
                  </div>
                )}

                <div className="sales-invoice-footer">
                  Thank you for choosing CCTV Point Khulna.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
