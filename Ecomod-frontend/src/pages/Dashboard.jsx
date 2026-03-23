import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  catalogApi,
  inventoryApi,
  authApi,
  cartApi,
  ordersApi,
  paymentsApi,
  shippingApi,
  notificationsApi,
} from "../services/api";

const SVC_LIST = [
  {
    key: "auth",
    label: "Auth Service",
    desc: "JWT · bcrypt · Tokens",
    port: "8002",
    icon: "🔐",
  },
  {
    key: "catalog",
    label: "Catalog Service",
    desc: "Productos · Categorías",
    port: "8003",
    icon: "🏪",
  },
  {
    key: "inventory",
    label: "Inventory Service",
    desc: "Stock · Reservas",
    port: "8004",
    icon: "📦",
  },
  {
    key: "cart",
    label: "Cart Service",
    desc: "Carrito · Tokens anónimos",
    port: "8005",
    icon: "🛒",
  },
  {
    key: "orders",
    label: "Order Service",
    desc: "Saga · Órdenes",
    port: "8006",
    icon: "📋",
  },
  {
    key: "payments",
    label: "Payment Service",
    desc: "Stripe · Transacciones",
    port: "8007",
    icon: "💳",
  },
  {
    key: "shipping",
    label: "Shipping Service",
    desc: "Envíos · Logística",
    port: "8008",
    icon: "🚚",
  },
  {
    key: "notifications",
    label: "Notification Service",
    desc: "Email · Eventos",
    port: "8009",
    icon: "🔔",
  },
];

const ARCH_CARDS = [
  {
    icon: "🔐",
    title: "Auth Service",
    items: [
      "Registro y login",
      "JWT access + refresh tokens",
      "Hash bcrypt contraseñas",
      "Roles: cliente / admin",
    ],
  },
  {
    icon: "🏪",
    title: "Catalog Service",
    items: [
      "CRUD de productos",
      "CRUD de categorías",
      "Filtros por precio/nombre",
      "Imágenes y metadatos",
    ],
  },
  {
    icon: "📦",
    title: "Inventory Service",
    items: [
      "Stock en tiempo real",
      "Reserva de unidades",
      "Liberación de stock",
      "Database per service",
    ],
  },
  {
    icon: "🛒",
    title: "Cart Service",
    items: [
      "Carrito autenticado",
      "Carrito anónimo (token)",
      "Merge al hacer login",
      "Snapshot de precios",
    ],
  },
  {
    icon: "📋",
    title: "Order Service",
    items: [
      "Saga coreografiada",
      "Reserva stock automática",
      "Rollback en fallo",
      "Ciclo: pending→shipped",
    ],
  },
  {
    icon: "💳",
    title: "Payment Service",
    items: [
      "Integración Stripe real",
      "PaymentIntent API",
      "Reembolsos",
      "No almacena tarjetas",
    ],
  },
  {
    icon: "🚚",
    title: "Shipping Service",
    items: [
      "Cálculo de costos",
      "Tracking en tiempo real",
      "Múltiples transportistas",
      "Estados: processing→delivered",
    ],
  },
  {
    icon: "🔔",
    title: "Notification Service",
    items: [
      "Emails transaccionales",
      "Confirmación de pedido",
      "Actualización de envío",
      "Eventos asíncronos",
    ],
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    inventory: 0,
    orders: 0,
    ordersConfirmed: 0,
    ordersShipped: 0,
    payments: 0,
    paymentsTotal: 0,
    shipments: 0,
    notifications: 0,
  });
  const [services, setServices] = useState(
    Object.fromEntries(SVC_LIST.map((s) => [s.key, null])),
  );
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const checkHealth = () => {
    setServices(Object.fromEntries(SVC_LIST.map((s) => [s.key, null])));
    Promise.allSettled([
      authApi.health(),
      catalogApi.health(),
      inventoryApi.health(),
      cartApi.health(),
      ordersApi.health(),
      paymentsApi.health(),
      shippingApi.health(),
      notificationsApi.health(),
    ]).then(([a, c, i, ca, o, p, sh, n]) => {
      setServices({
        auth: a.status === "fulfilled",
        catalog: c.status === "fulfilled",
        inventory: i.status === "fulfilled",
        cart: ca.status === "fulfilled",
        orders: o.status === "fulfilled",
        payments: p.status === "fulfilled",
        shipping: sh.status === "fulfilled",
        notifications: n.status === "fulfilled",
      });
    });
  };

  useEffect(() => {
    checkHealth();
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [products, categories, inventory] = await Promise.allSettled([
        catalogApi.getProducts(),
        catalogApi.getCategories(),
        inventoryApi.getAll(),
      ]);
      setStats((s) => ({
        ...s,
        products: products.value?.length || 0,
        categories: categories.value?.length || 0,
        inventory: inventory.value?.length || 0,
      }));
    } catch {}

    if (user?.id) {
      try {
        const [orders, payments, shipments, notifications] =
          await Promise.allSettled([
            ordersApi.getByUser(user.id),
            paymentsApi.getByUser(user.id),
            shippingApi.getByUser(user.id),
            notificationsApi.getByUser(user.id),
          ]);

        const ords = orders.value || [];
        const pays = payments.value || [];

        setStats((s) => ({
          ...s,
          orders: ords.length,
          ordersConfirmed: ords.filter((o) => o.status === "confirmed").length,
          ordersShipped: ords.filter(
            (o) => o.status === "shipped" || o.status === "delivered",
          ).length,
          payments: pays.filter((p) => p.status === "succeeded").length,
          paymentsTotal: pays
            .filter((p) => p.status === "succeeded")
            .reduce((a, p) => a + p.amount, 0),
          shipments: shipments.value?.length || 0,
          notifications: notifications.value?.length || 0,
        }));

        setRecentOrders(ords.slice(0, 5));
        setRecentPayments(pays.slice(0, 5));
      } catch {}
    }
    setLoading(false);
  };

  const onlineCount = Object.values(services).filter((v) => v === true).length;

  const ORDER_STATUS_COLOR = {
    pending: "var(--warning)",
    confirmed: "var(--cyan)",
    shipped: "var(--accent)",
    delivered: "var(--accent)",
    cancelled: "var(--danger)",
  };

  const PAY_STATUS_COLOR = {
    succeeded: "var(--accent)",
    failed: "var(--danger)",
    pending: "var(--warning)",
    refunded: "var(--text3)",
  };

  return (
    <div className="page fade-in">
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontFamily: "var(--font-head)",
            fontSize: 28,
            fontWeight: 800,
            marginBottom: 4,
          }}
        >
          Dashboard
        </h2>
        <p style={{ color: "var(--text2)", fontSize: 14 }}>
          Bienvenido, <strong>{user?.nombre || user?.email}</strong> · Sistema
          EcoMod activo
        </p>
      </div>

      {/* STATS GRID — 4 columnas */}
      <div
        className="stats-grid"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          marginBottom: 24,
        }}
      >
        {[
          {
            label: "Productos",
            value: stats.products,
            color: "var(--accent)",
            icon: "🏪",
          },
          {
            label: "Categorías",
            value: stats.categories,
            color: "var(--cyan)",
            icon: "🏷️",
          },
          {
            label: "Items en stock",
            value: stats.inventory,
            color: "var(--pink)",
            icon: "📦",
          },
          {
            label: "Mis órdenes",
            value: stats.orders,
            color: "var(--warning)",
            icon: "📋",
          },
          {
            label: "Pagos exitosos",
            value: stats.payments,
            color: "var(--accent)",
            icon: "💳",
          },
          {
            label: "Total pagado",
            value: `$${Math.round(stats.paymentsTotal).toLocaleString()}`,
            color: "var(--accent)",
            icon: "💰",
          },
          {
            label: "Envíos",
            value: stats.shipments,
            color: "#60a5fa",
            icon: "🚚",
          },
          {
            label: "Microservicios",
            value: `${onlineCount}/8`,
            color: onlineCount === 8 ? "var(--accent)" : "var(--warning)",
            icon: "⚡",
          },
        ].map((s) => (
          <div className="stat-card" key={s.label}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
            <div className="stat-label">{s.label}</div>
            <div
              className="stat-value"
              style={{
                color: s.color,
                fontSize: s.value.toString().length > 7 ? 16 : 24,
                wordBreak: "break-all",
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* DOS COLUMNAS: Órdenes recientes + Pagos recientes */}
      {(recentOrders.length > 0 || recentPayments.length > 0) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            marginBottom: 24,
          }}
        >
          {/* Órdenes recientes */}
          <div className="card">
            <div className="section-header" style={{ marginBottom: 12 }}>
              <span className="section-title" style={{ fontSize: 15 }}>
                📋 Órdenes recientes
              </span>
              <span className="badge badge-cyan">{stats.orders} total</span>
            </div>
            {recentOrders.length === 0 ? (
              <div className="empty" style={{ padding: "20px 0" }}>
                <p>No hay órdenes aún</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recentOrders.map((o) => (
                  <div
                    key={o.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--text)",
                        }}
                      >
                        Orden #{o.id}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>
                        {new Date(o.created_at).toLocaleDateString("es-CO")}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: ORDER_STATUS_COLOR[o.status] || "var(--text2)",
                          textTransform: "capitalize",
                        }}
                      >
                        {o.status}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--accent)",
                          fontWeight: 700,
                        }}
                      >
                        ${o.total_amount?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagos recientes */}
          <div className="card">
            <div className="section-header" style={{ marginBottom: 12 }}>
              <span className="section-title" style={{ fontSize: 15 }}>
                💳 Pagos recientes
              </span>
              <span className="badge badge-green">
                {stats.payments} exitosos
              </span>
            </div>
            {recentPayments.length === 0 ? (
              <div className="empty" style={{ padding: "20px 0" }}>
                <p>No hay pagos aún</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recentPayments.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--text)",
                        }}
                      >
                        Orden #{p.order_id}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text3)",
                          fontFamily: "monospace",
                        }}
                      >
                        {p.transaction_id?.slice(0, 16) ||
                          p.failure_reason?.slice(0, 20) ||
                          "—"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: PAY_STATUS_COLOR[p.status] || "var(--text2)",
                          textTransform: "capitalize",
                        }}
                      >
                        {p.status}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--accent)",
                          fontWeight: 700,
                        }}
                      >
                        ${p.amount?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ESTADO MICROSERVICIOS */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-header">
          <h3 className="section-title">Estado de Microservicios</h3>
          <button className="btn btn-ghost btn-sm" onClick={checkHealth}>
            ↺ Actualizar
          </button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          {SVC_LIST.map((s) => (
            <div
              key={s.key}
              className="service-status"
              style={{ justifyContent: "space-between" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  className={`dot ${services[s.key] === null ? "dot-gray" : services[s.key] ? "dot-green" : "dot-red"}`}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    {s.icon} {s.label}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>
                    {s.desc} · :{s.port}
                  </div>
                </div>
              </div>
              <span
                className={`badge ${services[s.key] === null ? "" : services[s.key] ? "badge-green" : "badge-red"}`}
              >
                {services[s.key] === null
                  ? "..."
                  : services[s.key]
                    ? "Online"
                    : "Offline"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SAGA FLOW */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 className="section-title" style={{ marginBottom: 16 }}>
          Flujo de la Saga Coreografiada
        </h3>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            flexWrap: "wrap",
            gap: 4,
          }}
        >
          {[
            {
              step: "1",
              label: "Carrito",
              sub: "cart-service",
              color: "#a78bfa",
            },
            { arrow: true },
            {
              step: "2",
              label: "Orden creada",
              sub: "order-service",
              color: "var(--warning)",
            },
            { arrow: true },
            {
              step: "3",
              label: "Stock reservado",
              sub: "inventory-service",
              color: "var(--pink)",
            },
            { arrow: true },
            {
              step: "4",
              label: "Pago procesado",
              sub: "payment-service + Stripe",
              color: "#34d399",
            },
            { arrow: true },
            {
              step: "5",
              label: "Envío creado",
              sub: "shipping-service",
              color: "#60a5fa",
            },
            { arrow: true },
            {
              step: "6",
              label: "Notificación",
              sub: "notification-service",
              color: "#f472b6",
            },
          ].map((s, i) =>
            s.arrow ? (
              <div
                key={i}
                style={{
                  color: "var(--text3)",
                  fontSize: 18,
                  padding: "0 4px",
                }}
              >
                →
              </div>
            ) : (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  background: "var(--surface)",
                  border: `1px solid ${s.color}30`,
                  borderRadius: 10,
                  padding: "10px 14px",
                  minWidth: 100,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: s.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#fff",
                    marginBottom: 6,
                  }}
                >
                  {s.step}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--text)",
                    textAlign: "center",
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text3)",
                    textAlign: "center",
                    marginTop: 2,
                  }}
                >
                  {s.sub}
                </div>
              </div>
            ),
          )}
        </div>
      </div>

      {/* ARQUITECTURA */}
      <div className="card">
        <h3 className="section-title" style={{ marginBottom: 16 }}>
          Arquitectura del Sistema
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          {ARCH_CARDS.map((s) => (
            <div
              key={s.title}
              style={{
                background: "var(--bg2)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 18,
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
              <div
                style={{
                  fontFamily: "var(--font-head)",
                  fontWeight: 700,
                  fontSize: 14,
                  marginBottom: 10,
                }}
              >
                {s.title}
              </div>
              <ul
                style={{
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                {s.items.map((i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: 12,
                      color: "var(--text2)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span style={{ color: "var(--accent)", fontSize: 9 }}>
                      ◆
                    </span>{" "}
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
