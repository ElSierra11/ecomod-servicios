import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { notificationsApi } from "../services/api";

const TYPE_CONFIG = {
  order_confirmed: {
    icon: "📋",
    label: "Orden confirmada",
    badge: "badge-cyan",
  },
  payment_succeeded: {
    icon: "💳",
    label: "Pago exitoso",
    badge: "badge-green",
  },
  payment_failed: { icon: "❌", label: "Pago fallido", badge: "badge-red" },
  shipment_created: { icon: "🚚", label: "Envío creado", badge: "badge-pink" },
  shipment_delivered: {
    icon: "📦",
    label: "Pedido entregado",
    badge: "badge-green",
  },
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await notificationsApi.getByUser(user.id);
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered =
    filter === "all"
      ? notifications
      : notifications.filter((n) => n.type === filter);

  const types = [...new Set(notifications.map((n) => n.type))];

  if (loading)
    return (
      <div className="page">
        <div className="empty">
          <div className="empty-icon">🔔</div>
          <p>Cargando notificaciones...</p>
        </div>
      </div>
    );

  return (
    <div className="page">
      {/* Stats */}
      {notifications.length > 0 && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          {[
            {
              label: "Total",
              value: notifications.length,
              color: "var(--text)",
            },
            {
              label: "Enviadas",
              value: notifications.filter((n) => n.sent).length,
              color: "var(--accent)",
            },
            {
              label: "Fallidas",
              value: notifications.filter((n) => !n.sent).length,
              color: "var(--danger)",
            },
            {
              label: "Hoy",
              value: notifications.filter(
                (n) =>
                  new Date(n.created_at).toDateString() ===
                  new Date().toDateString(),
              ).length,
              color: "var(--cyan)",
            },
          ].map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-label">{s.label}</div>
              <div
                className="stat-value"
                style={{ color: s.color, fontSize: 28 }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="section-header" style={{ marginBottom: 16 }}>
          <span className="section-title">Notificaciones</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className={`btn btn-sm ${filter === "all" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setFilter("all")}
            >
              Todas ({notifications.length})
            </button>
            {types.map((t) => (
              <button
                key={t}
                className={`btn btn-sm ${filter === t ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setFilter(t)}
              >
                {TYPE_CONFIG[t]?.icon} {TYPE_CONFIG[t]?.label || t}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🔔</div>
            <div className="empty-title">No hay notificaciones</div>
            <p>
              Las notificaciones aparecen automáticamente cuando se procesan
              órdenes, pagos y envíos
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((n) => (
              <div key={n.id}>
                <button
                  className="w-full"
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background:
                      selected?.id === n.id ? "var(--surface)" : "transparent",
                    border: `1px solid ${selected?.id === n.id ? "var(--border2)" : "var(--border)"}`,
                    borderRadius: "var(--radius)",
                    padding: "12px 16px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onClick={() => setSelected(selected?.id === n.id ? null : n)}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <span style={{ fontSize: 20 }}>
                      {TYPE_CONFIG[n.type]?.icon || "🔔"}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: "var(--text)",
                          }}
                        >
                          {n.subject || TYPE_CONFIG[n.type]?.label || n.type}
                        </span>
                        <span
                          className={`badge ${TYPE_CONFIG[n.type]?.badge || "badge-cyan"}`}
                          style={{ fontSize: 10 }}
                        >
                          {TYPE_CONFIG[n.type]?.label || n.type}
                        </span>
                        {n.sent ? (
                          <span
                            className="badge badge-green"
                            style={{ fontSize: 10 }}
                          >
                            ✓ Enviado
                          </span>
                        ) : (
                          <span
                            className="badge badge-red"
                            style={{ fontSize: 10 }}
                          >
                            ✗ Error
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text3)",
                          marginTop: 2,
                        }}
                      >
                        {new Date(n.created_at).toLocaleString("es-CO")}
                        {n.email && ` · Para: ${n.email}`}
                        {n.reference_type &&
                          ` · ${n.reference_type} #${n.reference_id}`}
                      </div>
                    </div>
                    <span style={{ color: "var(--text3)", fontSize: 12 }}>
                      {selected?.id === n.id ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {/* Detalle del email */}
                {selected?.id === n.id && (
                  <div
                    style={{
                      border: "1px solid var(--border)",
                      borderTop: "none",
                      borderRadius: "0 0 var(--radius) var(--radius)",
                      padding: 16,
                      background: "var(--bg2)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text3)",
                        marginBottom: 8,
                      }}
                    >
                      Canal: {n.channel} · Tipo: {n.type}
                      {n.error && (
                        <span style={{ color: "var(--danger)", marginLeft: 8 }}>
                          Error: {n.error}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text2)",
                        lineHeight: 1.6,
                      }}
                      dangerouslySetInnerHTML={{ __html: n.body }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
