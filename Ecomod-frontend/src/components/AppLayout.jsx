import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import EcoModLogo from "./EcoModLogo";

export default function AppLayout({ children, page, setPage }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  const navItems = [
    { id: "dashboard", icon: "◈", label: "Dashboard" },
    { id: "catalog", icon: "🏪", label: "Catálogo" },
    { id: "inventory", icon: "📦", label: "Inventario" },
    { id: "cart", icon: "🛒", label: "Carrito" },
    { id: "orders", icon: "📋", label: "Órdenes" },
    { id: "payments", icon: "💳", label: "Pagos" },
    { id: "shipping", icon: "🚚", label: "Envíos" },
    { id: "notifications", icon: "🔔", label: "Notificaciones" },
  ];

  const titles = {
    dashboard: "Dashboard",
    catalog: "Catálogo de Productos",
    inventory: "Gestión de Inventario",
    cart: "Carrito de Compras",
    orders: "Órdenes",
    payments: "Pagos",
    shipping: "Envíos",
    notifications: "Notificaciones",
  };

  const initials = user
    ? (user.nombre || user.email || "U")[0].toUpperCase()
    : "U";

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ padding: "12px 8px 4px" }}>
          <EcoModLogo />
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">General</div>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-link ${page === item.id ? "active" : ""}`}
              onClick={() => setPage(item.id)}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div className="nav-section-label" style={{ marginTop: 16 }}>
            Microservicios
          </div>
          {[
            { label: "Auth — :8002", color: "var(--accent)" },
            { label: "Catalog — :8003", color: "var(--cyan)" },
            { label: "Inventory — :8004", color: "var(--pink)" },
            { label: "Cart — :8005", color: "#a78bfa" },
            { label: "Orders — :8006", color: "#fb923c" },
            { label: "Payments — :8007", color: "#34d399" },
            { label: "Shipping — :8008", color: "#60a5fa" },
            { label: "Notifications — :8009", color: "#f472b6" },
            { label: "Kong — :8000", color: "var(--warning)" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                fontSize: 12,
                color: "var(--text3)",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: s.color,
                  flexShrink: 0,
                }}
              />
              {s.label}
            </div>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-chip">
            <div className="user-avatar">{initials}</div>
            <div style={{ overflow: "hidden" }}>
              <div
                className="user-name"
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.nombre
                  ? `${user.nombre} ${user.apellido || ""}`.trim()
                  : user?.email}
              </div>
              <div className="user-role">{user?.role || "cliente"}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={logout}>
            ↪ Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <span className="topbar-title">{titles[page]}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text3)" }}>
              Kong Gateway · localhost:8000
            </span>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--accent)",
                boxShadow: "0 0 6px var(--accent)",
              }}
            />
            <button
              className="theme-toggle"
              onClick={toggle}
              title="Cambiar tema"
            >
              {theme === "dark" ? "☀️ Claro" : "🌙 Oscuro"}
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
