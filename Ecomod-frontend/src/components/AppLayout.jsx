import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import EcoModLogo from "./EcoModLogo";
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  ClipboardList,
  CreditCard,
  Truck,
  Bell,
  LogOut,
  Sun,
  Moon,
  ChevronRight,
  Activity,
  Server,
  Users,
  BarChart3,
} from "lucide-react";

export default function AppLayout({ children, page, setPage }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [hoveredService, setHoveredService] = useState(null);

  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "catalog", icon: Store, label: "Catálogo" },
    { id: "inventory", icon: Package, label: "Inventario" },
    { id: "cart", icon: ShoppingCart, label: "Carrito" },
    { id: "orders", icon: ClipboardList, label: "Órdenes" },
    { id: "payments", icon: CreditCard, label: "Pagos" },
    { id: "shipping", icon: Truck, label: "Envíos" },
    { id: "notifications", icon: Bell, label: "Notificaciones" },
    //ITEMS SOLO PARA ADMIN
    { id: "admin-users", icon: Users, label: "Usuarios", adminOnly: true },
    {
      id: "admin-stats",
      icon: BarChart3,
      label: "Estadísticas",
      adminOnly: true,
    },
  ];

  const microservices = [
    { name: "Auth", port: "8002", color: "var(--accent)", status: "active" },
    { name: "Catalog", port: "8003", color: "var(--cyan)", status: "active" },
    { name: "Inventory", port: "8004", color: "var(--pink)", status: "active" },
    { name: "Cart", port: "8005", color: "#a78bfa", status: "active" },
    { name: "Orders", port: "8006", color: "#fb923c", status: "active" },
    { name: "Payments", port: "8007", color: "#34d399", status: "active" },
    { name: "Shipping", port: "8008", color: "#60a5fa", status: "active" },
    { name: "Notifications", port: "8009", color: "#f472b6", status: "active" },
    {
      name: "Kong Gateway",
      port: "8000",
      color: "var(--warning)",
      status: "active",
    },
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
    "admin-users": "Gestión de Usuarios",
    "admin-stats": "Estadísticas",
  };

  const initials = user
    ? (user.nombre || user.email || "U")[0].toUpperCase()
    : "U";

  // Filtrar items según rol del usuario
  const visibleNavItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === "admin",
  );

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ padding: "20px 16px 16px" }}>
          <EcoModLogo />
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">General</div>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = page === item.id;
            return (
              <button
                key={item.id}
                className={`nav-link ${isActive ? "active" : ""}`}
                onClick={() => setPage(item.id)}
              >
                <Icon size={18} className="icon" strokeWidth={1.5} />
                <span>{item.label}</span>
                {isActive && (
                  <ChevronRight size={14} style={{ marginLeft: "auto" }} />
                )}
              </button>
            );
          })}

          <div className="nav-section-label" style={{ marginTop: 24 }}>
            <Server size={10} style={{ display: "inline", marginRight: 6 }} />
            Microservicios
          </div>
          {microservices.map((service) => (
            <div
              key={service.name}
              className="service-item"
              onMouseEnter={() => setHoveredService(service.name)}
              onMouseLeave={() => setHoveredService(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                fontSize: 12,
                color: "var(--text3)",
                transition: "all 0.2s ease",
                borderRadius: "var(--radius)",
                cursor: "pointer",
                background:
                  hoveredService === service.name
                    ? "var(--surface)"
                    : "transparent",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: service.color,
                  flexShrink: 0,
                  boxShadow:
                    hoveredService === service.name
                      ? `0 0 8px ${service.color}`
                      : "none",
                  transition: "box-shadow 0.2s ease",
                }}
              />
              <span style={{ flex: 1 }}>{service.name}</span>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "monospace",
                  color: "var(--text3)",
                  opacity: hoveredService === service.name ? 1 : 0.6,
                }}
              >
                :{service.port}
              </span>
            </div>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-chip">
            <div className="user-avatar">{initials}</div>
            <div style={{ overflow: "hidden", flex: 1 }}>
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
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <div>
            <span className="topbar-title">{titles[page]}</span>
            <div
              style={{
                fontSize: 12,
                color: "var(--text3)",
                marginTop: 4,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Activity size={12} />
              <span>
                Panel de control •{" "}
                {new Date().toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 12px",
                background: "var(--surface)",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  boxShadow: "0 0 8px var(--accent)",
                  animation: "pulse 2s infinite",
                }}
              />
              <span style={{ fontSize: 12, color: "var(--text2)" }}>
                Kong Gateway · localhost:8000
              </span>
            </div>
            <button
              className="theme-toggle"
              onClick={toggle}
              title="Cambiar tema"
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
              <span>{theme === "dark" ? "Claro" : "Oscuro"}</span>
            </button>
          </div>
        </div>
        <div className="page" style={{ animation: "fadeIn 0.3s ease" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
