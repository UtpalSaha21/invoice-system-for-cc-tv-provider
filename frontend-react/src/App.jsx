
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  Tags,
  Users as UsersIcon,
  Truck,
  ShoppingCart,
  Receipt,
  ClipboardList,
  Menu,
  Search,
  UserPlus,
  Bell,
  ChevronDown,
  Video,
  LogOut,
} from "lucide-react";

import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products.jsx";
import Categories from "./pages/Categories.jsx";
import Customers from "./pages/Customers.jsx";
import Suppliers from "./pages/Suppliers.jsx";
import Purchases from "./pages/Purchases.jsx";
import Sales from "./pages/Sales.jsx";
import StockAdjustments from "./pages/StockAdjustments";
import Login from "./pages/Login";
import { useAuth } from "./context/AuthContext";
import Users from "./pages/Users";

import "./index.css";

// Pages available to each role
const rolePermissions = {
  admin: [
    "Dashboard",
    "Products",
    "Categories",
    "Customers",
    "Suppliers",
    "Purchases",
    "Sales & Invoices",
    "Stock Adjustments",
    "User Management"
  ],

  manager: [
    "Dashboard",
    "Products",
    "Categories",
    "Customers",
    "Suppliers",
    "Purchases",
    "Sales & Invoices",
  ],

  staff: [
    "Dashboard",
    "Products",
    "Categories",
    "Customers",
    "Sales & Invoices",
  ],
};

// Sidebar navigation
const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Products", icon: Package },
  { label: "Categories", icon: Tags },
  { label: "Customers", icon: UsersIcon },
  { label: "Suppliers", icon: Truck },
  { label: "Purchases", icon: ShoppingCart },
  { label: "Sales & Invoices", icon: Receipt },
  { label: "Stock Adjustments", icon: ClipboardList },
  { label: "User Management", icon: UserPlus },
];

export default function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user, logout, loading } = useAuth();

  // Get pages allowed for the logged-in user's role
  const allowedPages = rolePermissions[user?.role] || [];

  // Prevent access to unauthorized pages
  useEffect(() => {
    if (user && !allowedPages.includes(activePage)) {
      setActivePage("Dashboard");
    }
  }, [user, activePage]);

  // Wait until the saved login session is checked
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "Arial, sans-serif",
          color: "#475467",
        }}
      >
        Checking login session...
      </div>
    );
  }

  // Show login page if the user is not authenticated
  if (!user) {
    return <Login />;
  }

  // Show only navigation items allowed for this role
  const visibleNavigation = navigation.filter(({ label }) =>
    allowedPages.includes(label)
  );

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-logo">
            <img src="/logo.png" alt="" />
          </div>
          <div>
            <h2>CCTV Point</h2>
            <span>KHULNA</span>
          </div>
        </div>

        <p className="nav-label">MAIN MENU</p>

        <nav className="navigation">
          {visibleNavigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${
                activePage === label ? "nav-item-active" : ""
              }`}
              onClick={() => {
                setActivePage(label);
                setSidebarOpen(false);
              }}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="online-indicator" />
          <div>
            <strong>Inventory System</strong>
            <span>© Utpal Saha</span>
          </div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
            >
              <Menu size={21} />
            </button>

            <div className="breadcrumb">
              <span>Workspace</span>
              <span>/</span>
              <strong>{activePage}</strong>
            </div>
          </div>

          <div className="topbar-right">
            {/* <div className="search-box">
              <Search size={17} />
              <input
                type="search"
                placeholder="Search..."
                aria-label="Search"
              />
              <kbd>⌘ K</kbd>
            </div> */}

            {/* <button
              className="icon-button notification-button"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={20} />
              <span />
            </button> */}

            <div className="profile">
              <div className="profile-avatar">
                {(user.full_name || user.username || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="profile-info">
                <strong>{user.full_name || user.username}</strong>
                <span>{user.role}</span>
              </div>
            </div>

            <button
              className="icon-button"
              onClick={logout}
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>

        <main className="content">
          {activePage === "Dashboard" ? (
            <Dashboard />
          ) : activePage === "User Management" ? (
            <Users />
          ) : activePage === "Products" ? (
            <Products />
          ) : activePage === "Categories" ? (
            <Categories />
          ) : activePage === "Customers" ? (
            <Customers />
          ) : activePage === "Suppliers" ? (
            <Suppliers />
          ) : activePage === "Purchases" ? (
            <Purchases />
          ) : activePage === "Sales & Invoices" ? (
            <Sales />
          ) : activePage === "Stock Adjustments" ? (
            <StockAdjustments />
          ) : (
            <Dashboard />
          )}
        </main>

        <footer className="app-footer">
          CCTV Point Khulna · Inventory & Sales Management
        </footer>
      </div>
    </div>
  );
}
