import { useState, createContext, useContext, useCallback } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import AdminUsers from "./pages/AdminUsers";
import AdminStats from "./pages/AdminStats";
import AppLayout from "./components/AppLayout";
import PaypalReturn from "./pages/PaypalReturn";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import LogoIcon from "./components/LogoIcon";

/* ════════════════════════════════════════
   TOAST CONTEXT - Notificaciones globales
   ════════════════════════════════════════ */
export const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, title, message, duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-icon">
              {toast.type === "success" && "✓"}
              {toast.type === "error" && "✕"}
              {toast.type === "warning" && "!"}
              {toast.type === "info" && "ℹ"}
            </div>
            <div className="toast-content">
              <div className="toast-title">{toast.title}</div>
              <div className="toast-message">{toast.message}</div>
            </div>
            <button
              className="toast-close"
              onClick={() => removeToast(toast.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
};

/* ════════════════════════════════════════
   CART CONTEXT - Carrito global
   ════════════════════════════════════════ */
export const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);

  const updateCartCount = useCallback((count) => setCartCount(count), []);
  const updateCartItems = useCallback((items) => setCartItems(items), []);

  return (
    <CartContext.Provider
      value={{ cartCount, cartItems, updateCartCount, updateCartItems }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
};

/* ════════════════════════════════════════
   ADMIN GUARD
   ════════════════════════════════════════ */
function AdminOnly({ user, children }) {
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8">
          <div className="text-5xl mb-4">🔒</div>
          <h2
            className="text-xl font-bold mb-2"
            style={{ color: "var(--text)" }}
          >
            Acceso restringido
          </h2>
          <p style={{ color: "var(--text3)", fontSize: 14 }}>
            Esta sección requiere permisos de <strong>administrador</strong>.
          </p>
        </div>
      </div>
    );
  }
  return children;
}

/* ════════════════════════════════════════
   LOADING SCREEN CON NUEVO LOGO
   ════════════════════════════════════════ */
function LoadingScreen() {
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
        <div className="flex items-center justify-center gap-3 mb-4">
          <LogoIcon size={48} />
          <div
            style={{
              fontFamily: "var(--font-head)",
              fontSize: 42,
              fontWeight: 800,
              background:
                "linear-gradient(135deg, var(--primary), var(--secondary))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-1px",
            }}
          >
            EcoMod
          </div>
        </div>
        <div style={{ color: "var(--text3)", fontSize: 13, marginTop: 12 }}>
          Cargando tu experiencia de compra...
        </div>
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid rgba(232,41,28,0.15)",
            borderTopColor: "var(--primary)",
            borderRadius: "50%",
            margin: "20px auto 0",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   APP CONTENT
   ════════════════════════════════════════ */
function AppContent() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState("dashboard");

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) return <AuthPage />;

  return (
    <AppLayout page={page} setPage={setPage}>
      {page === "dashboard" && <Dashboard setPage={setPage} />}
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
      {page === "admin-users" && (
        <AdminOnly user={user}>
          <AdminUsers />
        </AdminOnly>
      )}
      {page === "admin-stats" && (
        <AdminOnly user={user}>
          <AdminStats />
        </AdminOnly>
      )}
    </AppLayout>
  );
}

/* ════════════════════════════════════════
   MAIN APP
   ════════════════════════════════════════ */
export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/*" element={<AppContent />} />
              <Route path="/paypal-return" element={<PaypalReturn />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
