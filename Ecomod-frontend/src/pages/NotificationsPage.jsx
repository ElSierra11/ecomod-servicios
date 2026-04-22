import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { notificationsApi } from "../services/api";
import {
  Bell,
  CheckCircle,
  XCircle,
  Mail,
  Filter,
  Calendar,
  TrendingUp,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  Archive,
  RefreshCw,
} from "lucide-react";

const TYPE_CONFIG = {
  order_confirmed: {
    icon: "📋",
    label: "Orden confirmada",
    color: "#00d4ff",
    bg: "rgba(0, 212, 255, 0.1)",
  },
  payment_succeeded: {
    icon: "💳",
    label: "Pago exitoso",
    color: "#00ff88",
    bg: "rgba(0, 255, 136, 0.1)",
  },
  payment_failed: {
    icon: "❌",
    label: "Pago fallido",
    color: "#ff6b6b",
    bg: "rgba(255, 107, 107, 0.1)",
  },
  shipment_created: {
    icon: "🚚",
    label: "Envío creado",
    color: "#f472b6",
    bg: "rgba(244, 114, 182, 0.1)",
  },
  shipment_delivered: {
    icon: "📦",
    label: "Pedido entregado",
    color: "#00ff88",
    bg: "rgba(0, 255, 136, 0.1)",
  },
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");

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

  const stats = {
    total: notifications.length,
    sent: notifications.filter((n) => n.sent).length,
    failed: notifications.filter((n) => !n.sent).length,
    today: notifications.filter(
      (n) =>
        new Date(n.created_at).toDateString() === new Date().toDateString(),
    ).length,
  };

  if (loading) {
    return (
      <div className="notifications-loading">
        <div className="notifications-loading-spinner"></div>
        <p>Cargando notificaciones...</p>
      </div>
    );
  }

  return (
    <div className="notifications-modern">
      {/* Header */}
      <div className="notifications-header">
        <div className="notifications-header-left">
          <div className="notifications-badge">
            <Bell size={14} />
            <span>SISTEMA DE NOTIFICACIONES</span>
          </div>
          <h1 className="notifications-title">
            Notificaciones
            <span>Historial de comunicaciones</span>
          </h1>
        </div>
        <div className="notifications-header-right">
          <button className="notifications-refresh" onClick={loadData}>
            <RefreshCw size={14} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {notifications.length > 0 && (
        <div className="notifications-stats">
          <div className="notifications-stat-card">
            <div
              className="notifications-stat-icon"
              style={{
                background: "rgba(124, 252, 110, 0.1)",
                color: "#00ff88",
              }}
            >
              <Bell size={22} />
            </div>
            <div className="notifications-stat-info">
              <span className="notifications-stat-label">Total</span>
              <span className="notifications-stat-value">{stats.total}</span>
            </div>
          </div>
          <div className="notifications-stat-card">
            <div
              className="notifications-stat-icon"
              style={{ background: "rgba(0, 212, 255, 0.1)", color: "#00d4ff" }}
            >
              <CheckCircle size={22} />
            </div>
            <div className="notifications-stat-info">
              <span className="notifications-stat-label">Enviadas</span>
              <span
                className="notifications-stat-value"
                style={{ color: "#00d4ff" }}
              >
                {stats.sent}
              </span>
            </div>
          </div>
          <div className="notifications-stat-card">
            <div
              className="notifications-stat-icon"
              style={{
                background: "rgba(255, 107, 107, 0.1)",
                color: "#ff6b6b",
              }}
            >
              <XCircle size={22} />
            </div>
            <div className="notifications-stat-info">
              <span className="notifications-stat-label">Fallidas</span>
              <span
                className="notifications-stat-value"
                style={{ color: "#ff6b6b" }}
              >
                {stats.failed}
              </span>
            </div>
          </div>
          <div className="notifications-stat-card">
            <div
              className="notifications-stat-icon"
              style={{
                background: "rgba(251, 191, 36, 0.1)",
                color: "#fbbf24",
              }}
            >
              <Calendar size={22} />
            </div>
            <div className="notifications-stat-info">
              <span className="notifications-stat-label">Hoy</span>
              <span
                className="notifications-stat-value"
                style={{ color: "#fbbf24" }}
              >
                {stats.today}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="notifications-filters">
        <div className="notifications-filter-group">
          <Filter size={16} />
          <button
            className={`notifications-filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Todas
            <span className="notifications-filter-count">
              {notifications.length}
            </span>
          </button>
          {types.map((t) => (
            <button
              key={t}
              className={`notifications-filter-btn ${filter === t ? "active" : ""}`}
              onClick={() => setFilter(t)}
            >
              {TYPE_CONFIG[t]?.icon} {TYPE_CONFIG[t]?.label || t}
              <span className="notifications-filter-count">
                {notifications.filter((n) => n.type === t).length}
              </span>
            </button>
          ))}
        </div>
        <div className="notifications-view-toggle">
          <button
            className={`notifications-view-btn ${viewMode === "list" ? "active" : ""}`}
            onClick={() => setViewMode("list")}
          >
            <Eye size={14} />
            <span>Lista</span>
          </button>
          <button
            className={`notifications-view-btn ${viewMode === "compact" ? "active" : ""}`}
            onClick={() => setViewMode("compact")}
          >
            <EyeOff size={14} />
            <span>Compacto</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="notifications-empty">
          <Bell size={48} strokeWidth={1} />
          <h3>No hay notificaciones</h3>
          <p>
            Las notificaciones aparecen automáticamente cuando se procesan
            órdenes, pagos y envíos
          </p>
        </div>
      ) : (
        <div className="notifications-list">
          {filtered.map((n, idx) => {
            const config = TYPE_CONFIG[n.type] || {
              icon: "🔔",
              label: n.type,
              color: "var(--text3)",
              bg: "var(--bg2)",
            };
            const isSelected = selected?.id === n.id;

            return (
              <div
                key={n.id}
                className="notifications-item-wrapper"
                style={{ animationDelay: `${idx * 0.03}s` }}
              >
                <div
                  className={`notifications-item ${isSelected ? "expanded" : ""}`}
                  onClick={() => setSelected(isSelected ? null : n)}
                >
                  <div
                    className="notifications-item-icon"
                    style={{ background: config.bg, color: config.color }}
                  >
                    <span style={{ fontSize: 20 }}>{config.icon}</span>
                  </div>
                  <div className="notifications-item-content">
                    <div className="notifications-item-header">
                      <span className="notifications-item-title">
                        {n.subject || config.label}
                      </span>
                      <div className="notifications-item-badges">
                        <span
                          className={`notifications-badge ${n.sent ? "sent" : "failed"}`}
                        >
                          {n.sent ? "Enviado" : "Fallido"}
                        </span>
                        <span
                          className="notifications-badge type"
                          style={{ background: config.bg, color: config.color }}
                        >
                          {config.label}
                        </span>
                      </div>
                    </div>
                    <div className="notifications-item-meta">
                      <span className="notifications-item-date">
                        {new Date(n.created_at).toLocaleString("es-CO", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {n.email && (
                        <>
                          <span className="notifications-item-separator">
                            •
                          </span>
                          <span className="notifications-item-email">
                            <Mail size={12} />
                            {n.email}
                          </span>
                        </>
                      )}
                      {n.reference_type && (
                        <>
                          <span className="notifications-item-separator">
                            •
                          </span>
                          <span className="notifications-item-reference">
                            {n.reference_type} #{n.reference_id}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="notifications-item-arrow">
                    {isSelected ? "▲" : "▼"}
                  </div>
                </div>

                {/* Expanded Content */}
                {isSelected && (
                  <div className="notifications-item-detail">
                    <div className="notifications-detail-header">
                      <span className="notifications-detail-label">
                        Detalle del mensaje
                      </span>
                      <div className="notifications-detail-meta">
                        <span>Canal: {n.channel}</span>
                        <span>Tipo: {n.type}</span>
                      </div>
                    </div>
                    {n.error && (
                      <div className="notifications-detail-error">
                        <AlertCircle size={14} />
                        <span>Error: {n.error}</span>
                      </div>
                    )}
                    <div
                      className="notifications-detail-body"
                      dangerouslySetInnerHTML={{ __html: n.body }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .notifications-modern {
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

        .notifications-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 16px;
        }

        .notifications-loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .notifications-header {
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

        .notifications-badge {
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

        .notifications-title {
          font-size: 28px;
          font-weight: 800;
          margin: 0;
        }

        .notifications-title span {
          display: block;
          font-size: 14px;
          font-weight: 400;
          color: var(--text2);
          margin-top: 4px;
        }

        .notifications-refresh {
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

        .notifications-refresh:hover {
          background: rgba(0, 255, 136, 0.2);
          transform: rotate(180deg);
        }

        .notifications-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .notifications-stat-card {
          background: var(--surface);
          border-radius: var(--radius-lg);
          padding: 20px;
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s;
        }

        .notifications-stat-card:hover {
          transform: translateY(-2px);
          border-color: var(--accent);
        }

        .notifications-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notifications-stat-info {
          flex: 1;
        }

        .notifications-stat-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text3);
        }

        .notifications-stat-value {
          display: block;
          font-size: 28px;
          font-weight: 800;
          margin-top: 4px;
        }

        .notifications-filters {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
        }

        .notifications-filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .notifications-filter-group svg {
          color: var(--text3);
        }

        .notifications-filter-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 20px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text2);
        }

        .notifications-filter-btn.active {
          background: var(--surface);
          border-color: var(--accent);
          color: var(--accent);
        }

        .notifications-filter-count {
          padding: 0 4px;
          background: rgba(124, 252, 110, 0.1);
          border-radius: 10px;
          font-size: 10px;
        }

        .notifications-view-toggle {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
        }

        .notifications-view-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: none;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          cursor: pointer;
          color: var(--text3);
          transition: all 0.2s;
        }

        .notifications-view-btn.active {
          background: var(--surface);
          color: var(--accent);
        }

        .notifications-empty {
          text-align: center;
          padding: 60px 24px;
          background: var(--surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
        }

        .notifications-empty svg {
          color: var(--text3);
          margin-bottom: 16px;
        }

        .notifications-empty h3 {
          font-size: 18px;
          margin-bottom: 8px;
        }

        .notifications-empty p {
          color: var(--text2);
        }

        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .notifications-item-wrapper {
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

        .notifications-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all 0.3s;
        }

        .notifications-item:hover {
          border-color: var(--accent);
          transform: translateX(4px);
        }

        .notifications-item.expanded {
          border-radius: var(--radius-lg) var(--radius-lg) 0 0;
          border-bottom: none;
        }

        .notifications-item-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notifications-item-content {
          flex: 1;
        }

        .notifications-item-header {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 6px;
        }

        .notifications-item-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--text);
        }

        .notifications-item-badges {
          display: flex;
          gap: 6px;
        }

        .notifications-badge {
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 600;
        }

        .notifications-badge.sent {
          background: rgba(0, 255, 136, 0.1);
          color: #00ff88;
        }

        .notifications-badge.failed {
          background: rgba(255, 107, 107, 0.1);
          color: #ff6b6b;
        }

        .notifications-badge.type {
          background: rgba(0, 212, 255, 0.1);
          color: #00d4ff;
        }

        .notifications-item-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          font-size: 11px;
          color: var(--text3);
        }

        .notifications-item-date {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .notifications-item-separator {
          color: var(--border);
        }

        .notifications-item-email,
        .notifications-item-reference {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .notifications-item-arrow {
          color: var(--text3);
          font-size: 12px;
        }

        .notifications-item-detail {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-top: none;
          border-radius: 0 0 var(--radius-lg) var(--radius-lg);
          padding: 20px;
        }

        .notifications-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--border);
        }

        .notifications-detail-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text2);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .notifications-detail-meta {
          display: flex;
          gap: 12px;
          font-size: 11px;
          color: var(--text3);
        }

        .notifications-detail-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(255, 107, 107, 0.1);
          border: 1px solid rgba(255, 107, 107, 0.2);
          border-radius: var(--radius);
          margin-bottom: 16px;
          font-size: 12px;
          color: #ff6b6b;
        }

        .notifications-detail-body {
          font-size: 13px;
          color: var(--text2);
          line-height: 1.6;
        }

        .notifications-detail-body :global(p) {
          margin-bottom: 8px;
        }

        @media (max-width: 768px) {
          .notifications-header {
            flex-direction: column;
            align-items: stretch;
          }
          .notifications-stats {
            grid-template-columns: 1fr 1fr;
          }
          .notifications-filters {
            flex-direction: column;
            align-items: stretch;
          }
          .notifications-filter-group {
            overflow-x: auto;
            padding-bottom: 8px;
          }
          .notifications-item {
            flex-wrap: wrap;
          }
          .notifications-item-icon {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
    </div>
  );
}
