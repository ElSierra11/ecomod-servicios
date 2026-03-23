import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import CatalogPage from "./pages/CatalogPage";
import InventoryPage from "./pages/InventoryPage";
import CartPage from "./pages/CartPage";
import OrdersPage from "./pages/OrdersPage";
import PaymentsPage from "./pages/PaymentsPage";
import ShippingPage from "./pages/ShippingPage";
import NotificationsPage from "./pages/NotificationsPage";
import AppLayout from "./components/AppLayout";

// Guard para rutas que requieren rol admin
function AdminOnly({ user, children }) {
  if (user?.role !== "admin") {
    return (
      <div className="page">
        <div className="empty">
          <div className="empty-icon">🔒</div>
          <div className="empty-title">Acceso restringido</div>
          <p style={{ color: "var(--text3)", fontSize: 14, marginTop: 8 }}>
            Esta sección requiere permisos de <strong>administrador</strong>.
          </p>
        </div>
      </div>
    );
  }
  return children;
}

function AppContent() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState("dashboard");

  // Pantalla de carga
  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: "var(--font-head)",
              fontSize: 32,
              fontWeight: 800,
              background: "linear-gradient(135deg, var(--accent), var(--cyan))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            EcoMod
          </div>
          <div style={{ color: "var(--text3)", fontSize: 13, marginTop: 8 }}>
            Cargando...
          </div>
        </div>
      </div>
    );

  // Guard principal — si no hay usuario, mostrar login
  if (!user) return <AuthPage />;

  return (
    <AppLayout page={page} setPage={setPage}>
      {page === "dashboard" && <Dashboard />}
      {page === "catalog" && <CatalogPage />}
      {page === "inventory" && (
        <AdminOnly user={user}>
          <InventoryPage />
        </AdminOnly>
      )}
      {page === "cart" && <CartPage />}
      {page === "orders" && <OrdersPage />}
      {page === "payments" && <PaymentsPage />}
      {page === "shipping" && <ShippingPage />}
      {page === "notifications" && <NotificationsPage />}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
