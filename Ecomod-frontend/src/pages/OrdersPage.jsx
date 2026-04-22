import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { ordersApi, cartApi } from "../services/api";
import {
  ShoppingBag,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Calendar,
  AlertCircle,
  Loader2,
  CreditCard,
} from "lucide-react";

const STATUS = {
  pending: {
    label: "Pendiente",
    icon: Clock,
    color: "#fbbf24",
    bg: "rgba(251, 191, 36, 0.1)",
  },
  confirmed: {
    label: "Confirmada",
    icon: CheckCircle,
    color: "#00d4ff",
    bg: "rgba(0, 212, 255, 0.1)",
  },
  shipped: {
    label: "Enviada",
    icon: Truck,
    color: "#00ff88",
    bg: "rgba(0, 255, 136, 0.1)",
  },
  delivered: {
    label: "Entregada",
    icon: Package,
    color: "#00ff88",
    bg: "rgba(0, 255, 136, 0.1)",
  },
  cancelled: {
    label: "Cancelada",
    icon: XCircle,
    color: "#ff6b6b",
    bg: "rgba(255, 107, 107, 0.1)",
  },
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar órdenes
      const ordersData = await ordersApi.getByUser(user.id);
      setOrders(ordersData);

      // Cargar carrito actual
      try {
        const cartData = await cartApi.getByUser(user.id);
        console.log("Cart loaded:", cartData);
        setCart(cartData);
      } catch (err) {
        console.error("Error loading cart:", err);
      }
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromCart = async () => {
    setCreating(true);
    setMsg(null);
    setDebugInfo(null);

    try {
      // 1. Obtener carrito actual
      let currentCart = cart;
      if (
        !currentCart ||
        !currentCart.items ||
        currentCart.items.length === 0
      ) {
        currentCart = await cartApi.getByUser(user.id);
        setCart(currentCart);
      }

      console.log("Cart data:", currentCart);

      // 2. Validar que el carrito tenga items
      if (
        !currentCart ||
        !currentCart.items ||
        currentCart.items.length === 0
      ) {
        setMsg({
          type: "error",
          text: "El carrito está vacío. Agrega productos antes de crear una orden.",
        });
        setCreating(false);
        return;
      }

      // 3. Calcular el total correctamente
      const calculatedTotal = currentCart.items.reduce((sum, item) => {
        const price = parseFloat(item.unit_price) || 0;
        const qty = parseInt(item.quantity) || 1;
        return sum + price * qty;
      }, 0);

      // 4. Preparar los items en el formato que espera el backend
      const formattedItems = currentCart.items.map((item) => ({
        product_id: parseInt(item.product_id),
        product_name: item.product_name || `Producto #${item.product_id}`,
        unit_price: parseFloat(item.unit_price) || 0,
        quantity: parseInt(item.quantity) || 1,
      }));

      // 5. Construir el body de la orden
      const orderBody = {
        user_id: parseInt(user.id),
        cart_id: parseInt(currentCart.id),
        items: formattedItems,
        total_amount: calculatedTotal,
        notes: `Orden creada desde el carrito ${currentCart.id}`,
        email: user.email || null,
      };

      console.log("Order body being sent:", JSON.stringify(orderBody, null, 2));
      setDebugInfo(orderBody);

      // 6. Crear la orden
      const order = await ordersApi.create(orderBody);

      console.log("Order response:", order);

      // 7. Mostrar mensaje
      if (order && order.id) {
        if (order.status === "confirmed") {
          setMsg({
            type: "success",
            text: `✓ Orden #${order.id} confirmada — Stock reservado exitosamente`,
          });
        } else if (order.status === "cancelled") {
          setMsg({
            type: "error",
            text: `✗ Orden #${order.id} cancelada — ${order.notes || "Error en el proceso"}`,
          });
        } else {
          setMsg({
            type: "success",
            text: `✓ Orden #${order.id} creada con estado: ${order.status}`,
          });
        }
      } else {
        throw new Error("No se recibió respuesta válida del servidor");
      }

      // 8. Recargar datos
      await loadData();
    } catch (err) {
      console.error("Error creating order:", err);
      setMsg({
        type: "error",
        text: `Error al crear orden: ${err.message || "Error desconocido"}`,
      });
    } finally {
      setCreating(false);
    }
  };

  const getStatusStats = () => {
    return {
      total: orders.length,
      confirmed: orders.filter((o) => o.status === "confirmed").length,
      shipped: orders.filter(
        (o) => o.status === "shipped" || o.status === "delivered",
      ).length,
      pending: orders.filter((o) => o.status === "pending").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    };
  };

  const stats = getStatusStats();

  if (loading) {
    return (
      <div className="orders-loading">
        <div className="orders-loading-spinner"></div>
        <p>Cargando tus órdenes...</p>
      </div>
    );
  }

  return (
    <div className="orders-modern">
      {/* Header */}
      <div className="orders-header">
        <div className="orders-header-left">
          <div className="orders-badge">
            <ShoppingBag size={14} />
            <span>GESTIÓN DE ÓRDENES</span>
          </div>
          <h1 className="orders-title">
            Mis Órdenes
            <span>Seguimiento de tus compras</span>
          </h1>
        </div>
        <div className="orders-header-right">
          <button className="orders-refresh" onClick={loadData}>
            <RefreshCw size={14} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Alert */}
      {msg && (
        <div className={`orders-alert ${msg.type}`}>
          {msg.type === "success" ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)}>✕</button>
        </div>
      )}

      {/* Debug Info */}
      {debugInfo && (
        <div className="orders-debug">
          <details>
            <summary>🔧 Debug: Datos enviados al servidor</summary>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </details>
        </div>
      )}

      {/* Stats Cards */}
      {orders.length > 0 && (
        <div className="orders-stats">
          <div className="orders-stat-card">
            <div
              className="orders-stat-icon"
              style={{
                background: "rgba(124, 252, 110, 0.1)",
                color: "#00ff88",
              }}
            >
              <ShoppingBag size={22} />
            </div>
            <div className="orders-stat-info">
              <span className="orders-stat-label">Total</span>
              <span className="orders-stat-value">{stats.total}</span>
            </div>
          </div>
          <div className="orders-stat-card">
            <div
              className="orders-stat-icon"
              style={{ background: "rgba(0, 212, 255, 0.1)", color: "#00d4ff" }}
            >
              <CheckCircle size={22} />
            </div>
            <div className="orders-stat-info">
              <span className="orders-stat-label">Confirmadas</span>
              <span className="orders-stat-value">{stats.confirmed}</span>
            </div>
          </div>
          <div className="orders-stat-card">
            <div
              className="orders-stat-icon"
              style={{ background: "rgba(0, 255, 136, 0.1)", color: "#00ff88" }}
            >
              <Truck size={22} />
            </div>
            <div className="orders-stat-info">
              <span className="orders-stat-label">Enviadas</span>
              <span className="orders-stat-value">{stats.shipped}</span>
            </div>
          </div>
          <div className="orders-stat-card">
            <div
              className="orders-stat-icon"
              style={{
                background: "rgba(251, 191, 36, 0.1)",
                color: "#fbbf24",
              }}
            >
              <Clock size={22} />
            </div>
            <div className="orders-stat-info">
              <span className="orders-stat-label">Pendientes</span>
              <span className="orders-stat-value">{stats.pending}</span>
            </div>
          </div>
        </div>
      )}

      {/* Cart Summary Card */}
      {cart && cart.items && cart.items.length > 0 && (
        <div className="orders-cart-summary">
          <div className="orders-cart-header">
            <Package size={18} />
            <h3>Carrito actual</h3>
            <span className="orders-cart-items">
              {cart.items.length} productos
            </span>
          </div>
          <div className="orders-cart-items-list">
            {cart.items.slice(0, 3).map((item) => (
              <div key={item.id} className="orders-cart-item">
                <span className="orders-cart-item-name">
                  {item.product_name || `Producto #${item.product_id}`}
                </span>
                <span className="orders-cart-item-qty">×{item.quantity}</span>
                <span className="orders-cart-item-price">
                  $
                  {(
                    (item.unit_price || 0) * (item.quantity || 1)
                  ).toLocaleString()}
                </span>
              </div>
            ))}
            {cart.items.length > 3 && (
              <div className="orders-cart-more">
                +{cart.items.length - 3} productos más
              </div>
            )}
          </div>
          <div className="orders-cart-total">
            <span>Total del carrito</span>
            <strong>
              $
              {(
                cart.total ||
                cart.items.reduce(
                  (sum, item) =>
                    sum + (item.unit_price || 0) * (item.quantity || 1),
                  0,
                )
              ).toLocaleString()}
            </strong>
          </div>
        </div>
      )}

      {/* Create Order Card */}
      <div className="orders-create-card">
        <div className="orders-create-content">
          <div className="orders-create-icon">
            <ShoppingBag size={32} />
          </div>
          <div className="orders-create-info">
            <h3>Crear orden desde carrito</h3>
            <p>
              Inicia la Saga coreografiada — reserva stock automáticamente en
              inventory-service
            </p>
            {cart && cart.items && cart.items.length > 0 && (
              <div className="orders-create-cart-info">
                <Package size={12} />
                <span>{cart.items.length} productos en carrito</span>
                <span className="orders-cart-total-preview">
                  Total: $
                  {(
                    cart.total ||
                    cart.items.reduce(
                      (sum, item) =>
                        sum + (item.unit_price || 0) * (item.quantity || 1),
                      0,
                    )
                  ).toLocaleString()}
                </span>
              </div>
            )}
          </div>
          <button
            className="orders-create-btn"
            onClick={handleCreateFromCart}
            disabled={
              creating || !cart || !cart.items || cart.items.length === 0
            }
          >
            {creating ? (
              <>
                <Loader2 size={16} className="spinner" />
                <span>Procesando Saga...</span>
              </>
            ) : (
              <>
                <span>Crear orden</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* No items in cart warning */}
      {(!cart || !cart.items || cart.items.length === 0) && (
        <div className="orders-warning">
          <AlertCircle size={18} />
          <span>
            No hay productos en el carrito. Agrega productos para crear una
            orden.
          </span>
        </div>
      )}

      {/* Saga Steps */}
      <div className="orders-saga">
        <div className="orders-saga-header">
          <TrendingUp size={16} />
          <span>Flujo de la Saga Coreografiada</span>
        </div>
        <div className="orders-saga-steps">
          {[
            {
              step: "1",
              label: "Orden creada",
              icon: ShoppingBag,
              color: "#00d4ff",
            },
            {
              step: "2",
              label: "Stock reservado",
              icon: Package,
              color: "#00ff88",
            },
            {
              step: "3",
              label: "Pago procesado",
              icon: CreditCard,
              color: "#f472b6",
            },
            {
              step: "4",
              label: "Orden enviada",
              icon: Truck,
              color: "#fbbf24",
            },
          ].map((s, idx) => (
            <div key={s.step} className="orders-saga-step">
              <div
                className="orders-saga-circle"
                style={{ background: s.color }}
              >
                {s.step}
              </div>
              <div className="orders-saga-label">{s.label}</div>
              {idx < 3 && <div className="orders-saga-line" />}
            </div>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="orders-list-card">
        <div className="orders-list-header">
          <h3>Historial de órdenes</h3>
          <span className="orders-count">{orders.length} total</span>
        </div>

        {orders.length === 0 ? (
          <div className="orders-empty">
            <ShoppingBag size={48} strokeWidth={1} />
            <h4>No tienes órdenes aún</h4>
            <p>Agrega productos al carrito y crea tu primera orden</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order, idx) => {
              const statusConfig = STATUS[order.status] || STATUS.pending;
              const StatusIcon = statusConfig.icon;
              const isExpanded = selected?.id === order.id;

              return (
                <div
                  key={order.id}
                  className="orders-item"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div
                    className="orders-item-header"
                    onClick={() => setSelected(isExpanded ? null : order)}
                  >
                    <div className="orders-item-info">
                      <div className="orders-item-id">Orden #{order.id}</div>
                      <div className="orders-item-date">
                        <Calendar size={12} />
                        {new Date(order.created_at).toLocaleString("es-CO", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <div className="orders-item-status">
                      <div
                        className="orders-status-badge"
                        style={{
                          background: statusConfig.bg,
                          color: statusConfig.color,
                        }}
                      >
                        <StatusIcon size={12} />
                        <span>{statusConfig.label}</span>
                      </div>
                      <div className="orders-item-total">
                        ${order.total_amount?.toLocaleString()}
                      </div>
                      <div className="orders-item-arrow">
                        {isExpanded ? "▲" : "▼"}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="orders-item-detail">
                      {order.notes && (
                        <div className="orders-item-notes">
                          <AlertCircle size={14} />
                          <span>{order.notes}</span>
                        </div>
                      )}
                      <div className="orders-items-table">
                        <div className="orders-items-header">
                          <span>Producto</span>
                          <span>Cantidad</span>
                          <span>Precio</span>
                          <span>Subtotal</span>
                        </div>
                        {order.items?.map((item) => (
                          <div key={item.id} className="orders-item-row">
                            <span className="orders-product-name">
                              {item.product_name ||
                                `Producto #${item.product_id}`}
                            </span>
                            <span className="orders-product-qty">
                              {item.quantity}
                            </span>
                            <span className="orders-product-price">
                              ${item.unit_price?.toLocaleString()}
                            </span>
                            <span className="orders-product-subtotal">
                              ${item.subtotal?.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .orders-modern {
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .spinner {
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .orders-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 16px;
        }

        .orders-loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .orders-header {
          background: linear-gradient(
            135deg,
            var(--surface) 0%,
            var(--bg2) 100%
          );
          border-radius: var(--radius-lg);
          padding: 24px 28px;
          margin-bottom: 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .orders-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 4px 12px;
          background: rgba(124, 252, 110, 0.1);
          border: 1px solid rgba(124, 252, 110, 0.2);
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
          color: var(--accent);
          margin-bottom: 12px;
        }

        .orders-title {
          font-size: 28px;
          font-weight: 800;
          margin: 0;
        }

        .orders-title span {
          display: block;
          font-size: 14px;
          font-weight: 400;
          color: var(--text2);
          margin-top: 4px;
        }

        .orders-refresh {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          background: rgba(0, 255, 136, 0.1);
          border: 1px solid rgba(0, 255, 136, 0.2);
          border-radius: 40px;
          color: var(--accent);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .orders-refresh:hover {
          background: rgba(0, 255, 136, 0.2);
        }

        .orders-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          border-radius: var(--radius);
          margin-bottom: 20px;
          animation: slideDown 0.3s ease;
        }

        .orders-alert.success {
          background: rgba(124, 252, 110, 0.1);
          border: 1px solid rgba(124, 252, 110, 0.2);
          color: var(--accent);
        }

        .orders-alert.error {
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.2);
          color: var(--danger);
        }

        .orders-alert button {
          margin-left: auto;
          background: none;
          border: none;
          cursor: pointer;
          color: currentColor;
        }

        .orders-debug {
          margin-bottom: 20px;
          padding: 12px;
          background: rgba(0, 0, 0, 0.05);
          border-radius: var(--radius);
          font-size: 11px;
        }

        .orders-debug details {
          cursor: pointer;
        }

        .orders-debug pre {
          margin-top: 8px;
          padding: 8px;
          background: var(--bg);
          border-radius: 4px;
          overflow-x: auto;
          font-size: 10px;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .orders-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .orders-stat-card {
          background: var(--surface);
          border-radius: var(--radius-lg);
          padding: 20px;
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s;
        }

        .orders-stat-card:hover {
          transform: translateY(-2px);
          border-color: var(--accent);
        }

        .orders-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .orders-stat-info {
          flex: 1;
        }

        .orders-stat-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text3);
        }

        .orders-stat-value {
          display: block;
          font-size: 28px;
          font-weight: 800;
          margin-top: 4px;
        }

        .orders-cart-summary {
          background: rgba(0, 212, 255, 0.05);
          border: 1px solid rgba(0, 212, 255, 0.2);
          border-radius: var(--radius-lg);
          padding: 20px;
          margin-bottom: 24px;
        }

        .orders-cart-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(0, 212, 255, 0.2);
        }

        .orders-cart-header h3 {
          font-size: 15px;
          font-weight: 600;
          flex: 1;
        }

        .orders-cart-items {
          padding: 4px 10px;
          background: rgba(0, 212, 255, 0.1);
          border-radius: 20px;
          font-size: 11px;
          color: #00d4ff;
        }

        .orders-cart-items-list {
          margin-bottom: 16px;
        }

        .orders-cart-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid var(--border);
          font-size: 13px;
        }

        .orders-cart-item-name {
          flex: 2;
        }

        .orders-cart-item-qty {
          color: var(--text3);
        }

        .orders-cart-item-price {
          font-weight: 600;
          color: var(--accent);
        }

        .orders-cart-more {
          padding: 8px 0;
          font-size: 12px;
          color: var(--text3);
          text-align: center;
        }

        .orders-cart-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid var(--border);
          font-size: 14px;
        }

        .orders-cart-total strong {
          font-size: 18px;
          color: var(--accent);
        }

        .orders-create-card {
          background: linear-gradient(
            135deg,
            rgba(0, 255, 136, 0.05),
            rgba(0, 212, 255, 0.05)
          );
          border: 1px solid rgba(0, 255, 136, 0.2);
          border-radius: var(--radius-lg);
          padding: 24px;
          margin-bottom: 24px;
        }

        .orders-create-content {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .orders-create-icon {
          width: 60px;
          height: 60px;
          background: rgba(0, 255, 136, 0.1);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
        }

        .orders-create-info {
          flex: 1;
        }

        .orders-create-info h3 {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .orders-create-info p {
          font-size: 13px;
          color: var(--text2);
        }

        .orders-create-cart-info {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
          padding: 6px 12px;
          background: rgba(0, 255, 136, 0.05);
          border-radius: var(--radius);
          font-size: 11px;
          color: var(--text3);
        }

        .orders-cart-total-preview {
          margin-left: auto;
          color: var(--accent);
          font-weight: 600;
        }

        .orders-create-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 28px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border: none;
          border-radius: 40px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .orders-create-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(124, 252, 110, 0.3);
        }

        .orders-create-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .orders-warning {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.2);
          border-radius: var(--radius);
          color: #fbbf24;
          margin-bottom: 24px;
        }

        .orders-saga {
          background: var(--surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          padding: 20px 24px;
          margin-bottom: 24px;
        }

        .orders-saga-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text2);
          margin-bottom: 20px;
        }

        .orders-saga-steps {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .orders-saga-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          flex: 1;
          position: relative;
        }

        .orders-saga-circle {
          width: 40px;
          height: 40px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
          color: #000;
        }

        .orders-saga-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text2);
        }

        .orders-saga-line {
          position: absolute;
          right: -50%;
          top: 20px;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, var(--accent), transparent);
        }

        .orders-list-card {
          background: var(--surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          overflow: hidden;
        }

        .orders-list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }

        .orders-list-header h3 {
          font-size: 16px;
          font-weight: 600;
        }

        .orders-count {
          padding: 4px 12px;
          background: rgba(0, 212, 255, 0.1);
          border-radius: 20px;
          font-size: 12px;
          color: #00d4ff;
        }

        .orders-empty {
          text-align: center;
          padding: 60px 24px;
        }

        .orders-empty svg {
          color: var(--text3);
          margin-bottom: 16px;
        }

        .orders-empty h4 {
          font-size: 18px;
          margin-bottom: 8px;
        }

        .orders-empty p {
          color: var(--text2);
        }

        .orders-list {
          display: flex;
          flex-direction: column;
        }

        .orders-item {
          border-bottom: 1px solid var(--border);
          animation: slideIn 0.3s ease-out forwards;
          opacity: 0;
          transform: translateX(-10px);
        }

        @keyframes slideIn {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .orders-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          cursor: pointer;
          transition: all 0.2s;
          flex-wrap: wrap;
          gap: 16px;
        }

        .orders-item-header:hover {
          background: var(--bg2);
        }

        .orders-item-info {
          flex: 1;
        }

        .orders-item-id {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .orders-item-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--text3);
        }

        .orders-item-status {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .orders-status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .orders-item-total {
          font-size: 18px;
          font-weight: 800;
          color: var(--accent);
        }

        .orders-item-arrow {
          color: var(--text3);
          font-size: 12px;
        }

        .orders-item-detail {
          padding: 0 24px 20px 24px;
          background: var(--bg2);
        }

        .orders-item-notes {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(251, 191, 36, 0.1);
          border-radius: var(--radius);
          margin-bottom: 16px;
          font-size: 12px;
          color: #fbbf24;
        }

        .orders-items-table {
          background: var(--surface);
          border-radius: var(--radius);
          overflow: hidden;
        }

        .orders-items-header {
          display: grid;
          grid-template-columns: 3fr 1fr 1fr 1fr;
          padding: 12px 16px;
          background: var(--bg2);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text3);
          border-bottom: 1px solid var(--border);
        }

        .orders-item-row {
          display: grid;
          grid-template-columns: 3fr 1fr 1fr 1fr;
          padding: 12px 16px;
          font-size: 13px;
          border-bottom: 1px solid var(--border);
        }

        .orders-item-row:last-child {
          border-bottom: none;
        }

        .orders-product-name {
          font-weight: 500;
        }

        .orders-product-qty {
          text-align: center;
        }

        .orders-product-price {
          text-align: right;
          color: var(--text2);
        }

        .orders-product-subtotal {
          text-align: right;
          font-weight: 700;
          color: var(--accent);
        }

        @media (max-width: 768px) {
          .orders-header {
            flex-direction: column;
            align-items: stretch;
          }
          .orders-stats {
            grid-template-columns: 1fr 1fr;
          }
          .orders-saga-steps {
            flex-direction: column;
          }
          .orders-saga-line {
            display: none;
          }
          .orders-item-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .orders-item-status {
            width: 100%;
            justify-content: space-between;
          }
          .orders-items-header,
          .orders-item-row {
            grid-template-columns: 2fr 0.8fr 1fr 1fr;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
}
