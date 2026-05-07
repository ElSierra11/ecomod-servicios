import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../App";
import { useSwal } from "../hooks/useSwal"; // ← IMPORTAMOS SWAL
import { ordersApi, cartApi, shippingApi } from "../services/api";
import {
  ShoppingBag,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ArrowRight,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  CreditCard,
  DollarSign,
  Box,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Eye,
  Printer,
  Download,
  Circle,
  CheckCircle2,
} from "lucide-react";

const formatCOP = (n) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(n);

const STATUS_CONFIG = {
  pending: {
    label: "Pendiente",
    icon: Clock,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.2)",
    step: 1,
    desc: "Esperando confirmación de pago",
  },
  confirmed: {
    label: "Confirmada",
    icon: CheckCircle,
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.2)",
    step: 2,
    desc: "Pago confirmado, preparando envío",
  },
  shipped: {
    label: "En camino",
    icon: Truck,
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.1)",
    border: "rgba(59,130,246,0.2)",
    step: 3,
    desc: "Tu pedido está en ruta de entrega",
  },
  delivered: {
    label: "Entregada",
    icon: Package,
    color: "#059669",
    bg: "rgba(5,150,105,0.1)",
    border: "rgba(5,150,105,0.2)",
    step: 4,
    desc: "Pedido entregado exitosamente",
  },
  cancelled: {
    label: "Cancelada",
    icon: XCircle,
    color: "#dc2626",
    bg: "rgba(220,38,38,0.1)",
    border: "rgba(220,38,38,0.2)",
    step: 0,
    desc: "Orden cancelada",
  },
};

const TRACKING_STEPS = [
  { label: "Orden recibida", icon: ShoppingBag },
  { label: "Pago confirmado", icon: CheckCircle2 },
  { label: "En preparación", icon: Box },
  { label: "Enviado", icon: Truck },
  { label: "Entregado", icon: Package },
];

export default function OrdersPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { success, error, warning, confirm, loading, close, toast } =
    useSwal(false); // ← SWAL INTEGRADO
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // ← renombrado
  const [creating, setCreating] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [shippingData, setShippingData] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [ordersData, cartData] = await Promise.all([
        ordersApi.getByUser(user.id),
        cartApi.getByUser(user.id).catch(() => null),
      ]);
      setOrders(ordersData || []);
      setCart(cartData);

      // Cargar info de envíos para cada orden
      const shippingPromises = (ordersData || [])
        .filter((o) => o.status === "shipped" || o.status === "delivered")
        .map(async (o) => {
          try {
            const ship = await shippingApi.getByOrder(o.id);
            return { orderId: o.id, data: ship };
          } catch {
            return null;
          }
        });

      const shippingResults = await Promise.all(shippingPromises);
      const shippingMap = {};
      shippingResults.forEach((r) => {
        if (r) shippingMap[r.orderId] = r.data;
      });
      setShippingData(shippingMap);
    } catch (e) {
      addToast("error", "Error", "No se pudieron cargar las órdenes");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── VALIDACIONES Y HANDLERS CON SWAL ─────────────────────────────────────

  const handleCreateFromCart = async () => {
    setCreating(true);

    try {
      let currentCart = cart;
      if (!currentCart || !currentCart.items?.length) {
        currentCart = await cartApi.getByUser(user.id);
        setCart(currentCart);
      }

      // Validación: carrito vacío
      if (!currentCart || !currentCart.items?.length) {
        warning(
          "Carrito vacío",
          "Agrega productos al carrito antes de crear una orden",
        );
        setCreating(false);
        return;
      }

      // Confirmación antes de crear
      const cartTotal = currentCart.items.reduce((sum, item) => {
        const price = parseFloat(item.unit_price) || 0;
        const qty = parseInt(item.quantity) || 1;
        return sum + price * qty;
      }, 0);

      const result = await confirm(
        "¿Crear orden?",
        `Vas a crear una orden con ${currentCart.items.length} producto(s) por un total de ${formatCOP(cartTotal)}. ¿Deseas continuar?`,
        "Sí, crear orden",
        "Cancelar",
      );

      if (!result.isConfirmed) {
        setCreating(false);
        return;
      }

      loading("Creando tu orden...");

      const calculatedTotal = currentCart.items.reduce((sum, item) => {
        const price = parseFloat(item.unit_price) || 0;
        const qty = parseInt(item.quantity) || 1;
        return sum + price * qty;
      }, 0);

      const formattedItems = currentCart.items.map((item) => ({
        product_id: parseInt(item.product_id),
        product_name: item.product_name || `Producto #${item.product_id}`,
        unit_price: parseFloat(item.unit_price) || 0,
        quantity: parseInt(item.quantity) || 1,
      }));

      const orderBody = {
        user_id: parseInt(user.id),
        cart_id: parseInt(currentCart.id),
        items: formattedItems,
        total_amount: calculatedTotal,
        notes: `Orden creada desde el carrito ${currentCart.id}`,
        email: user.email || null,
      };

      const order = await ordersApi.create(orderBody);

      if (order && order.id) {
        close();
        success("¡Orden creada!", `Orden #${order.id} creada exitosamente`);
        await loadData();
      }
    } catch (err) {
      close();
      error("Error al crear orden", err.message || "No se pudo crear la orden");
    } finally {
      setCreating(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    // Confirmación antes de cancelar
    const result = await confirm(
      "¿Cancelar orden?",
      "Esta acción no se puede deshacer. La orden será marcada como cancelada.",
      "Sí, cancelar",
      "No, mantener",
    );

    if (!result.isConfirmed) return;

    loading("Cancelando orden...");

    try {
      await ordersApi.cancel(orderId);
      close();
      success("Orden cancelada", `La orden #${orderId} ha sido cancelada`);
      await loadData();
    } catch (err) {
      close();
      error("Error al cancelar", err.message || "No se pudo cancelar la orden");
    }
  };

  const getStatusStats = () => ({
    total: orders.length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    shipped: orders.filter(
      (o) => o.status === "shipped" || o.status === "delivered",
    ).length,
    pending: orders.filter((o) => o.status === "pending").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  });

  const stats = getStatusStats();

  // Filtrar y ordenar
  let filteredOrders = [...orders];
  if (filterStatus !== "all") {
    filteredOrders = filteredOrders.filter((o) => o.status === filterStatus);
  }
  if (sortBy === "newest") {
    filteredOrders.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );
  } else if (sortBy === "oldest") {
    filteredOrders.sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at),
    );
  } else if (sortBy === "highest") {
    filteredOrders.sort(
      (a, b) => (b.total_amount || 0) - (a.total_amount || 0),
    );
  }

  const getDaysAgo = (date) => {
    const diff = Math.floor(
      (new Date() - new Date(date)) / (1000 * 60 * 60 * 24),
    );
    if (diff === 0) return "Hoy";
    if (diff === 1) return "Ayer";
    if (diff < 7) return `Hace ${diff} días`;
    return new Date(date).toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
    });
  };

  if (isLoading) {
    return (
      <div className="ord-loading">
        <div className="ord-spinner" />
        <span>Cargando tus órdenes...</span>
        <div className="ord-loading-dots">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  return (
    <div className="ord-root">
      {/* ══ HEADER ══ */}
      <div className="ord-header">
        <div className="ord-header-left">
          <div className="ord-header-icon">
            <ShoppingBag size={24} strokeWidth={2} />
          </div>
          <div>
            <h1 className="ord-title">Mis Pedidos</h1>
            <p className="ord-subtitle">Seguimiento y estado de tus compras</p>
          </div>
        </div>
        <div className="ord-header-actions">
          {cart?.items?.length > 0 && (
            <button
              className="ord-btn ord-btn-primary"
              onClick={handleCreateFromCart}
              disabled={creating}
            >
              {creating ? (
                <span className="ord-btn-spinner" />
              ) : (
                <>
                  <Sparkles size={16} strokeWidth={2} />
                  Crear orden desde carrito
                </>
              )}
            </button>
          )}
          <button className="ord-btn ord-btn-ghost" onClick={loadData}>
            <RefreshCw size={16} strokeWidth={2} />
            Actualizar
          </button>
        </div>
      </div>

      {/* ══ STATS ══ */}
      <div className="ord-stats">
        {[
          {
            icon: ShoppingBag,
            label: "Total",
            value: stats.total,
            color: "#e8291c",
            bg: "rgba(232,41,28,0.08)",
          },
          {
            icon: CheckCircle,
            label: "Confirmadas",
            value: stats.confirmed,
            color: "#10b981",
            bg: "rgba(16,185,129,0.08)",
          },
          {
            icon: Truck,
            label: "Enviadas",
            value: stats.shipped,
            color: "#3b82f6",
            bg: "rgba(59,130,246,0.08)",
          },
          {
            icon: Clock,
            label: "Pendientes",
            value: stats.pending,
            color: "#f59e0b",
            bg: "rgba(245,158,11,0.08)",
          },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <button
            key={label}
            className={`ord-stat ${filterStatus === label.toLowerCase().replace("s", "") ? "active" : ""}`}
            onClick={() =>
              setFilterStatus(
                filterStatus === label.toLowerCase().replace("s", "")
                  ? "all"
                  : label.toLowerCase().replace("s", ""),
              )
            }
          >
            <div className="ord-stat-icon" style={{ background: bg, color }}>
              <Icon size={20} strokeWidth={2} />
            </div>
            <div className="ord-stat-info">
              <span className="ord-stat-value" style={{ color }}>
                {value}
              </span>
              <span className="ord-stat-label">{label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* ══ FILTERS & SORT ══ */}
      <div className="ord-filters">
        <div className="ord-filter-group">
          <span className="ord-filter-label">Estado:</span>
          {[
            { id: "all", label: "Todas" },
            { id: "pending", label: "Pendientes" },
            { id: "confirmed", label: "Confirmadas" },
            { id: "shipped", label: "En camino" },
            { id: "delivered", label: "Entregadas" },
            { id: "cancelled", label: "Canceladas" },
          ].map((f) => (
            <button
              key={f.id}
              className={`ord-filter-pill ${filterStatus === f.id ? "active" : ""}`}
              onClick={() => setFilterStatus(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ord-sort">
          <span>Ordenar:</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Más recientes</option>
            <option value="oldest">Más antiguas</option>
            <option value="highest">Mayor valor</option>
          </select>
        </div>
      </div>

      {/* ══ ORDERS LIST ══ */}
      <div className="ord-list">
        {filteredOrders.length === 0 ? (
          <div className="ord-empty">
            <div className="ord-empty-icon">
              <ShoppingBag size={48} strokeWidth={1} />
            </div>
            <h3>
              {filterStatus !== "all"
                ? "No hay órdenes con este filtro"
                : "Aún no tienes pedidos"}
            </h3>
            <p>
              {filterStatus !== "all"
                ? "Prueba con otro filtro o crea una nueva orden"
                : "Agrega productos al carrito y crea tu primera orden"}
            </p>
            {filterStatus !== "all" && (
              <button
                className="ord-btn ord-btn-outline"
                onClick={() => setFilterStatus("all")}
              >
                Ver todas las órdenes
              </button>
            )}
          </div>
        ) : (
          filteredOrders.map((order, idx) => {
            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = status.icon;
            const isExpanded = selectedOrder === order.id;
            const shipInfo = shippingData[order.id];

            return (
              <div
                key={order.id}
                className={`ord-card ${isExpanded ? "expanded" : ""}`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                {/* Card Header */}
                <div
                  className="ord-card-header"
                  onClick={() => setSelectedOrder(isExpanded ? null : order.id)}
                >
                  <div className="ord-card-main">
                    <div className="ord-card-id">
                      <span>Pedido #{order.id}</span>
                      <div
                        className="ord-status-badge"
                        style={{
                          background: status.bg,
                          color: status.color,
                          border: `1px solid ${status.border}`,
                        }}
                      >
                        <StatusIcon size={12} strokeWidth={2.5} />
                        {status.label}
                      </div>
                    </div>
                    <div className="ord-card-meta">
                      <span>
                        <Calendar size={12} strokeWidth={2} />
                        {getDaysAgo(order.created_at)}
                      </span>
                      <span className="ord-meta-sep">•</span>
                      <span>
                        <Package size={12} strokeWidth={2} />
                        {order.items?.length || 0} producto
                        {order.items?.length !== 1 ? "s" : ""}
                      </span>
                      <span className="ord-meta-sep">•</span>
                      <span>
                        <DollarSign size={12} strokeWidth={2} />
                        {formatCOP(order.total_amount)}
                      </span>
                    </div>
                  </div>
                  <div className="ord-card-right">
                    <span className="ord-card-total">
                      {formatCOP(order.total_amount)}
                    </span>
                    <div
                      className={`ord-expand-icon ${isExpanded ? "open" : ""}`}
                    >
                      <ChevronDown size={18} strokeWidth={2.5} />
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="ord-card-body">
                    {/* Tracking Timeline */}
                    {order.status !== "cancelled" && (
                      <div className="ord-tracking">
                        <h4>Seguimiento del pedido</h4>
                        <div className="ord-tracking-steps">
                          {TRACKING_STEPS.map((step, i) => {
                            const StepIcon = step.icon;
                            const isActive = i < status.step;
                            const isCurrent = i === status.step - 1;
                            return (
                              <div
                                key={i}
                                className={`ord-track-step ${isActive ? "active" : ""} ${isCurrent ? "current" : ""}`}
                              >
                                <div className="ord-track-dot">
                                  {isActive ? (
                                    <CheckCircle size={16} strokeWidth={2.5} />
                                  ) : (
                                    <Circle size={16} strokeWidth={2} />
                                  )}
                                </div>
                                <span className="ord-track-label">
                                  {step.label}
                                </span>
                                {isCurrent && (
                                  <span className="ord-track-now">Actual</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div className="ord-tracking-bar">
                          <div
                            className="ord-tracking-fill"
                            style={{
                              width: `${((status.step - 1) / (TRACKING_STEPS.length - 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Shipping Info */}
                    {shipInfo && (
                      <div className="ord-shipping-info">
                        <h4>
                          <Truck size={16} strokeWidth={2} />
                          Información de envío
                        </h4>
                        <div className="ord-shipping-grid">
                          {shipInfo.tracking_number && (
                            <div className="ord-ship-item">
                              <span>Guía</span>
                              <strong>{shipInfo.tracking_number}</strong>
                            </div>
                          )}
                          {shipInfo.carrier && (
                            <div className="ord-ship-item">
                              <span>Transportista</span>
                              <strong>{shipInfo.carrier}</strong>
                            </div>
                          )}
                          {shipInfo.department && (
                            <div className="ord-ship-item">
                              <span>Destino</span>
                              <strong>{shipInfo.department}</strong>
                            </div>
                          )}
                          {shipInfo.estimated_delivery && (
                            <div className="ord-ship-item">
                              <span>Entrega estimada</span>
                              <strong>
                                {new Date(
                                  shipInfo.estimated_delivery,
                                ).toLocaleDateString("es-CO")}
                              </strong>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Products Table */}
                    <div className="ord-products">
                      <h4>Productos</h4>
                      <div className="ord-products-table">
                        <div className="ord-products-header">
                          <span>Producto</span>
                          <span>Cant.</span>
                          <span>Precio unit.</span>
                          <span>Subtotal</span>
                        </div>
                        {order.items?.map((item) => (
                          <div key={item.id} className="ord-product-row">
                            <div className="ord-product-name">
                              <Package size={14} strokeWidth={2} />
                              <span>
                                {item.product_name ||
                                  `Producto #${item.product_id}`}
                              </span>
                            </div>
                            <span className="ord-product-qty">
                              {item.quantity}
                            </span>
                            <span className="ord-product-price">
                              {formatCOP(item.unit_price)}
                            </span>
                            <span className="ord-product-subtotal">
                              {formatCOP(
                                (item.unit_price || 0) * (item.quantity || 1),
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="ord-products-total">
                        <span>Total del pedido</span>
                        <strong>{formatCOP(order.total_amount)}</strong>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="ord-card-actions">
                      {order.status === "pending" && (
                        <button
                          className="ord-btn ord-btn-danger ord-btn-sm"
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          <XCircle size={14} strokeWidth={2} />
                          Cancelar orden
                        </button>
                      )}
                      <button className="ord-btn ord-btn-ghost ord-btn-sm">
                        <Printer size={14} strokeWidth={2} />
                        Imprimir
                      </button>
                      <button className="ord-btn ord-btn-ghost ord-btn-sm">
                        <Download size={14} strokeWidth={2} />
                        Descargar factura
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Barlow+Condensed:wght@600;700;800&display=swap');

        .ord-root {
          font-family: 'Inter', sans-serif;
          animation: ordFadeUp .35s ease;
        }
        @keyframes ordFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

        .ord-loading {
          display:flex; flex-direction:column; align-items:center;
          justify-content:center; min-height:300px; gap:16px;
          color:var(--text3,#9ca3af);
        }
        .ord-spinner {
          width:44px; height:44px;
          border:3px solid rgba(232,41,28,.12);
          border-top-color:#e8291c; border-radius:50%;
          animation:ordSpin .8s linear infinite;
        }
        @keyframes ordSpin { to{transform:rotate(360deg)} }
        .ord-loading-dots { display:flex; gap:6px; }
        .ord-loading-dots span {
          width:6px; height:6px; background:#e8291c;
          border-radius:50%; animation:ordBounce 1.4s ease-in-out infinite both;
        }
        .ord-loading-dots span:nth-child(1) { animation-delay:-.32s; }
        .ord-loading-dots span:nth-child(2) { animation-delay:-.16s; }
        @keyframes ordBounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }

        /* Header */
        .ord-header {
          display:flex; justify-content:space-between; align-items:center;
          margin-bottom:24px; flex-wrap:wrap; gap:16px;
        }
        .ord-header-left { display:flex; align-items:center; gap:14px; }
        .ord-header-icon {
          width:48px; height:48px;
          background:linear-gradient(135deg,#e8291c,#c2200f);
          border-radius:12px;
          display:flex; align-items:center; justify-content:center;
          color:#fff;
          box-shadow:0 4px 16px rgba(232,41,28,.3);
        }
        .ord-title { font-size:26px; font-weight:900; margin:0; color:var(--text,#111); letter-spacing:-.02em; }
        .ord-subtitle { font-size:13px; color:var(--text3,#9ca3af); margin:4px 0 0; }
        .ord-header-actions { display:flex; gap:10px; flex-wrap:wrap; }

        /* Buttons */
        .ord-btn {
          display:inline-flex; align-items:center; justify-content:center; gap:8px;
          padding:10px 20px; border-radius:10px;
          font-size:13px; font-weight:700; font-family:'Inter',sans-serif;
          cursor:pointer; transition:all .2s; border:none; white-space:nowrap;
        }
        .ord-btn-primary {
          background:linear-gradient(135deg,#e8291c,#c2200f);
          color:#fff;
          box-shadow:0 4px 16px rgba(232,41,28,.25);
        }
        .ord-btn-primary:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 24px rgba(232,41,28,.35); }
        .ord-btn-primary:disabled { opacity:.7; cursor:not-allowed; }
        .ord-btn-ghost {
          background:var(--surface,#fff);
          border:1.5px solid var(--border,#e5e7eb);
          color:var(--text2,#555);
        }
        .ord-btn-ghost:hover { border-color:#e8291c; color:#e8291c; background:var(--hover-bg,#fff5f5); }
        .ord-btn-outline {
          background:transparent;
          border:1.5px solid var(--border,#e5e7eb);
          color:var(--text2,#555);
        }
        .ord-btn-outline:hover { border-color:#e8291c; color:#e8291c; }
        .ord-btn-danger {
          background:rgba(220,38,38,.08);
          border:1.5px solid rgba(220,38,38,.2);
          color:#dc2626;
        }
        .ord-btn-danger:hover { background:rgba(220,38,38,.12); border-color:#dc2626; }
        .ord-btn-sm { padding:7px 14px; font-size:12px; }
        .ord-btn-spinner {
          width:16px; height:16px;
          border:2px solid rgba(255,255,255,.3);
          border-top-color:#fff; border-radius:50%;
          animation:ordSpin .6s linear infinite;
        }

        /* Stats */
        .ord-stats {
          display:grid; grid-template-columns:repeat(4,1fr);
          gap:14px; margin-bottom:24px;
        }
        .ord-stat {
          display:flex; align-items:center; gap:14px;
          padding:18px;
          background:var(--card-bg,#fff);
          border:1.5px solid var(--border,#e5e7eb);
          border-radius:14px;
          cursor:pointer; transition:all .25s;
          text-align:left;
        }
        .ord-stat:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,.08); }
        .ord-stat.active { border-color:#e8291c; box-shadow:0 4px 16px rgba(232,41,28,.1); }
        .ord-stat-icon {
          width:48px; height:48px; border-radius:12px;
          display:flex; align-items:center; justify-content:center;
          flex-shrink:0;
        }
        .ord-stat-info { display:flex; flex-direction:column; gap:2px; }
        .ord-stat-value { font-size:24px; font-weight:900; font-family:'Barlow Condensed',sans-serif; }
        .ord-stat-label { font-size:11px; font-weight:700; color:var(--text3,#9ca3af); text-transform:uppercase; letter-spacing:.06em; }

        /* Filters */
        .ord-filters {
          display:flex; justify-content:space-between; align-items:center;
          margin-bottom:20px; flex-wrap:wrap; gap:12px;
        }
        .ord-filter-group {
          display:flex; align-items:center; gap:8px; flex-wrap:wrap;
        }
        .ord-filter-label { font-size:12px; font-weight:700; color:var(--text3,#9ca3af); }
        .ord-filter-pill {
          padding:6px 14px;
          background:var(--card-bg,#fff);
          border:1.5px solid var(--border,#e5e7eb);
          border-radius:20px;
          font-size:12px; font-weight:700;
          color:var(--text2,#555); cursor:pointer;
          transition:all .15s;
        }
        .ord-filter-pill:hover { border-color:#e8291c; color:#e8291c; }
        .ord-filter-pill.active { background:#e8291c; border-color:#e8291c; color:#fff; }
        .ord-sort {
          display:flex; align-items:center; gap:8px;
          font-size:13px; color:var(--text2,#555);
        }
        .ord-sort select {
          padding:8px 12px;
          background:var(--card-bg,#fff);
          border:1.5px solid var(--border,#e5e7eb);
          border-radius:8px;
          font-family:'Inter',sans-serif; font-size:13px; font-weight:600;
          color:var(--text,#111); cursor:pointer; outline:none;
        }

        /* Cards */
        .ord-list { display:flex; flex-direction:column; gap:12px; }
        .ord-card {
          background:var(--card-bg,#fff);
          border:1.5px solid var(--border,#e5e7eb);
          border-radius:16px;
          overflow:hidden;
          transition:all .25s;
          animation:ordFadeUp .4s ease forwards;
          opacity:0;
        }
        .ord-card:hover { border-color:var(--border2,#d1d5db); box-shadow:0 4px 16px rgba(0,0,0,.06); }
        .ord-card.expanded { border-color:#e8291c; box-shadow:0 8px 32px rgba(232,41,28,.1); }

        .ord-card-header {
          display:flex; justify-content:space-between; align-items:center;
          padding:18px 24px; cursor:pointer; gap:16px;
        }
        .ord-card-main { flex:1; min-width:0; }
        .ord-card-id {
          display:flex; align-items:center; gap:10px; margin-bottom:6px; flex-wrap:wrap;
        }
        .ord-card-id span { font-size:16px; font-weight:800; color:var(--text,#111); }
        .ord-status-badge {
          display:inline-flex; align-items:center; gap:5px;
          padding:4px 12px; border-radius:20px;
          font-size:11px; font-weight:800;
        }
        .ord-card-meta {
          display:flex; align-items:center; gap:10px; flex-wrap:wrap;
          font-size:12px; color:var(--text3,#9ca3af); font-weight:500;
        }
        .ord-card-meta span { display:flex; align-items:center; gap:4px; }
        .ord-meta-sep { opacity:.5; }
        .ord-card-right {
          display:flex; align-items:center; gap:16px;
          flex-shrink:0;
        }
        .ord-card-total {
          font-size:20px; font-weight:900;
          color:#e8291c; font-family:'Barlow Condensed',sans-serif;
        }
        .ord-expand-icon {
          color:var(--text3,#9ca3af);
          transition:transform .25s, color .15s;
        }
        .ord-expand-icon.open { transform:rotate(180deg); color:#e8291c; }

        /* Card Body */
        .ord-card-body {
          padding:0 24px 24px;
          border-top:1px solid var(--border,#e5e7eb);
          animation:ordFadeUp .3s ease;
        }

        /* Tracking */
        .ord-tracking { margin:24px 0; }
        .ord-tracking h4 {
          font-size:13px; font-weight:800;
          color:var(--text2,#555);
          text-transform:uppercase; letter-spacing:.06em;
          margin-bottom:16px;
        }
        .ord-tracking-steps {
          display:flex; justify-content:space-between;
          position:relative; margin-bottom:8px;
        }
        .ord-track-step {
          display:flex; flex-direction:column; align-items:center;
          gap:6px; flex:1; position:relative;
        }
        .ord-track-dot {
          width:32px; height:32px;
          border-radius:50%;
          background:var(--bg3,#f0f0f0);
          color:var(--text3,#9ca3af);
          display:flex; align-items:center; justify-content:center;
          transition:all .3s;
        }
        .ord-track-step.active .ord-track-dot {
          background:rgba(16,185,129,.15); color:#10b981;
        }
        .ord-track-step.current .ord-track-dot {
          background:rgba(59,130,246,.15); color:#3b82f6;
          animation:ordPulse 2s infinite;
        }
        @keyframes ordPulse { 0%,100%{box-shadow:0 0 0 0 rgba(59,130,246,.4)} 50%{box-shadow:0 0 0 8px rgba(59,130,246,0)} }
        .ord-track-label { font-size:10px; font-weight:700; color:var(--text3,#9ca3af); text-align:center; }
        .ord-track-step.active .ord-track-label { color:var(--text2,#555); }
        .ord-track-step.current .ord-track-label { color:#3b82f6; }
        .ord-track-now {
          font-size:9px; font-weight:800;
          color:#3b82f6; background:rgba(59,130,246,.1);
          padding:1px 6px; border-radius:10px;
        }
        .ord-tracking-bar {
          height:4px; background:var(--bg3,#f0f0f0);
          border-radius:2px; overflow:hidden;
        }
        .ord-tracking-fill {
          height:100%; background:linear-gradient(90deg,#10b981,#3b82f6);
          border-radius:2px; transition:width .5s ease;
        }

        /* Shipping Info */
        .ord-shipping-info { margin:20px 0; }
        .ord-shipping-info h4 {
          display:flex; align-items:center; gap:8px;
          font-size:13px; font-weight:800;
          color:var(--text2,#555);
          text-transform:uppercase; letter-spacing:.06em;
          margin-bottom:12px;
        }
        .ord-shipping-grid {
          display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr));
          gap:12px;
        }
        .ord-ship-item {
          background:var(--bg2,#fafafa);
          border:1px solid var(--border,#e5e7eb);
          border-radius:10px; padding:12px 16px;
        }
        .ord-ship-item span { display:block; font-size:11px; color:var(--text3,#9ca3af); margin-bottom:4px; font-weight:600; }
        .ord-ship-item strong { font-size:14px; color:var(--text,#111); font-weight:800; }

        /* Products */
        .ord-products { margin:20px 0; }
        .ord-products h4 {
          font-size:13px; font-weight:800;
          color:var(--text2,#555);
          text-transform:uppercase; letter-spacing:.06em;
          margin-bottom:12px;
        }
        .ord-products-table {
          background:var(--bg2,#fafafa);
          border:1px solid var(--border,#e5e7eb);
          border-radius:12px; overflow:hidden;
        }
        .ord-products-header {
          display:grid; grid-template-columns:2fr .8fr 1fr 1fr;
          padding:10px 16px;
          background:var(--bg3,#f0f0f0);
          font-size:10px; font-weight:800;
          color:var(--text3,#9ca3af);
          text-transform:uppercase; letter-spacing:.06em;
        }
        .ord-product-row {
          display:grid; grid-template-columns:2fr .8fr 1fr 1fr;
          padding:12px 16px;
          border-bottom:1px solid var(--border,#e5e7eb);
          font-size:13px; align-items:center;
        }
        .ord-product-row:last-child { border-bottom:none; }
        .ord-product-name { display:flex; align-items:center; gap:8px; font-weight:600; color:var(--text,#111); }
        .ord-product-qty { text-align:center; color:var(--text2,#555); font-weight:700; }
        .ord-product-price { text-align:right; color:var(--text3,#9ca3af); }
        .ord-product-subtotal { text-align:right; font-weight:800; color:#e8291c; font-family:'Barlow Condensed',sans-serif; }
        .ord-products-total {
          display:flex; justify-content:space-between; align-items:center;
          padding:14px 16px; margin-top:2px;
          border-top:2px solid var(--border,#e5e7eb);
          font-size:14px; font-weight:700;
        }
        .ord-products-total strong { font-size:22px; color:#e8291c; font-family:'Barlow Condensed',sans-serif; }

        /* Card Actions */
        .ord-card-actions {
          display:flex; gap:10px; padding-top:16px;
          border-top:1px solid var(--border,#e5e7eb);
        }

        /* Empty */
        .ord-empty {
          text-align:center; padding:60px 24px;
          background:var(--card-bg,#fff);
          border:2px dashed var(--border,#e5e7eb);
          border-radius:16px;
        }
        .ord-empty-icon {
          width:100px; height:100px;
          background:linear-gradient(135deg,rgba(232,41,28,.08),rgba(249,115,22,.06));
          border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          color:#e8291c; margin:0 auto 20px;
        }
        .ord-empty h3 { font-size:18px; font-weight:800; color:var(--text,#111); margin-bottom:6px; }
        .ord-empty p { font-size:14px; color:var(--text3,#9ca3af); margin-bottom:20px; }

        /* Responsive */
        @media(max-width:900px) {
          .ord-stats { grid-template-columns:repeat(2,1fr); }
          .ord-tracking-steps { gap:4px; }
          .ord-track-label { font-size:9px; }
        }
        @media(max-width:600px) {
          .ord-stats { grid-template-columns:1fr 1fr; }
          .ord-card-header { flex-direction:column; align-items:flex-start; }
          .ord-card-right { width:100%; justify-content:space-between; }
          .ord-products-header,
          .ord-product-row { grid-template-columns:2fr 1fr 1fr; }
          .ord-product-price { display:none; }
          .ord-shipping-grid { grid-template-columns:1fr 1fr; }
        }
      `}</style>
    </div>
  );
}
