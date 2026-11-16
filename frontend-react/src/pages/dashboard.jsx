import apiFetch from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import {
  Package,
  Users,
  ShoppingCart,
  Wallet,
  AlertTriangle,
  RefreshCw,
  Receipt,
  TrendingUp,
  Truck,
  ArrowDownToLine,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const emptyData = {
  products: {},
  customers: {},
  suppliers: {},
  sales: {},
  today: {},
  purchases: {},
  low_stock_products: [],
  recent_sales: [],
};

function money(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD", {
    maximumFractionDigits: 2,
  })}`;
}

function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span>{title}</span>
        <div className="stat-icon">
          <Icon size={21} />
        </div>
      </div>
      <h2>{value}</h2>
      <p>{subtitle}</p>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token } = useAuth();

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch("/api/dashboard");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Could not load dashboard"
        );
      }

      setData({ ...emptyData, ...result.data });
    } catch (err) {
      setError(
        `${err.message}. Check that your backend is running on port 5000.`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const chartData = [...(data.recent_sales || [])]
    .reverse()
    .map((sale) => ({
      invoice: sale.invoice_no,
      amount: Number(sale.total || 0),
    }));

  return (
    <div className="dashboard-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">OVERVIEW</p>
          <h1>Dashboard</h1>
          <p className="muted">
            Here's what's happening at your business today.
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={loadDashboard}
          disabled={loading}
        >
          <RefreshCw size={16} />
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <AlertTriangle size={19} />
          <span>{error}</span>
        </div>
      )}

      <div className="stats-grid">
        <StatCard
          title="Total Products"
          value={data.products.total_products ?? 0}
          subtitle={`${data.products.total_stock_units ?? 0} units in stock`}
          icon={Package}
        />

        <StatCard
          title="Total Customers"
          value={data.customers.total_customers ?? 0}
          subtitle="Registered customers"
          icon={Users}
        />

        <StatCard
          title="Today's Sales"
          value={money(data.today.today_sales_value)}
          subtitle={`${data.today.today_sales_count ?? 0} invoices today`}
          icon={ShoppingCart}
        />

        <StatCard
          title="Paid Revenue"
          value={money(data.sales.paid_revenue)}
          subtitle="All-time paid sales"
          icon={Wallet}
        />

        <StatCard
          title="Total Suppliers"
          value={data.suppliers.total_suppliers ?? 0}
          subtitle="Registered suppliers"
          icon={Truck}
        />

        <StatCard
          title="Total Purchases"
          value={money(data.purchases.total_purchases_value)}
          subtitle={`${data.purchases.total_purchases ?? 0} purchase records`}
          icon={ArrowDownToLine}
        />
      </div>

      <div className="dashboard-grid">
        <section className="panel sales-panel">
          <div className="panel-heading">
            <div>
              <h3>Recent Sales Overview</h3>
              <p className="muted">
                Invoice totals for the five most recent sales
              </p>
            </div>
            <TrendingUp size={21} className="heading-icon" />
          </div>

          <div className="chart-container">
            {loading ? (
              <p className="empty-state">Loading chart...</p>
            ) : chartData.length === 0 ? (
              <p className="empty-state">
                No sales recorded yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 5, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e8edf3"
                  />
                  <XAxis
                    dataKey="invoice"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [money(value), "Sale total"]}
                  />
                  <Bar
                    dataKey="amount"
                    fill="#2563eb"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="panel low-stock-panel">
          <div className="panel-heading">
            <div>
              <h3>Low Stock Alerts</h3>
              <p className="muted">
                Products needing attention
              </p>
            </div>
            <AlertTriangle size={21} className="warning-icon" />
          </div>

          {loading ? (
            <p className="empty-state">Loading products...</p>
          ) : data.low_stock_products.length === 0 ? (
            <p className="empty-state">
              No low-stock products found.
            </p>
          ) : (
            <div className="stock-list">
              {data.low_stock_products.map((product) => (
                <div className="stock-item" key={product.id}>
                  <div className="product-avatar">
                    <Package size={19} />
                  </div>
                  <div className="stock-product-info">
                    <strong>{product.name}</strong>
                    <span>SKU: {product.sku || "N/A"}</span>
                  </div>
                  <div className="stock-quantity">
                    <strong>{product.stock}</strong>
                    <span>Min: {product.minimum_stock}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="panel recent-sales-panel">
        <div className="panel-heading">
          <div>
            <h3>Recent Invoices</h3>
            <p className="muted">
              Your latest sales transactions
            </p>
          </div>
          <Receipt size={21} className="heading-icon" />
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Payment</th>
                <th className="amount-cell">Total</th>
              </tr>
            </thead>

            <tbody>
              {!loading && data.recent_sales.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty-state">
                    No invoices available.
                  </td>
                </tr>
              )}

              {data.recent_sales.map((sale) => (
                <tr key={sale.id}>
                  <td className="invoice-number">
                    {sale.invoice_no}
                  </td>
                  <td>{sale.customer_name || "Walk-in Customer"}</td>
                  <td>
                    {sale.created_at
                      ? new Date(sale.created_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>
                    <span
                      className={`status ${
                        sale.payment_status === "paid"
                          ? "status-paid"
                          : sale.payment_status === "partial"
                          ? "status-partial"
                          : "status-unpaid"
                      }`}
                    >
                      {sale.payment_status}
                    </span>
                  </td>
                  <td className="amount-cell">
                    {money(sale.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
