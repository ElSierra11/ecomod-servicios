import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { notificationsApi } from "../services/api";
import {
  Bell,
  CheckCircle,
  XCircle,
  Mail,
  Filter,
  Calendar,
  AlertCircle,
  Clock,
  Search,
  RefreshCw,
  Package,
  CreditCard,
  Truck,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Trash2,
  CheckCheck,
  Sparkles,
  Zap,
  Info,
} from "lucide-react";

const TYPE_CONFIG = {
  order_confirmed: {
    icon: ShoppingBag,
    label: "Orden confirmada",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.12)",
    border: "rgba(16, 185, 129, 0.25)",
    gradient: "linear-gradient(135deg, #10b981, #059669)",
  },
  payment_succeeded: {
    icon: CreditCard,
    label: "Pago exitoso",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.12)",
    border: "rgba(16, 185, 129, 0.25)",
    gradient: "linear-gradient(135deg, #10b981, #059669)",
  },
  payment_failed: {
    icon: XCircle,
    label: "Pago fallido",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.12)",
    border: "rgba(239, 68, 68, 0.25)",
    gradient: "linear-gradient(135deg, #ef4444, #dc2626)",
  },
  shipment_created: {
    icon: Truck,
    label: "Envío creado",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.12)",
    border: "rgba(59, 130, 246, 0.25)",
    gradient: "linear-gradient(135deg, #3b82f6, #2563eb)",
  },
  shipment_delivered: {
    icon: Package,
    label: "Pedido entregado",
    color: "#8b5cf6",
    bg: "rgba(139, 92, 246, 0.12)",
    border: "rgba(139, 92, 246, 0.25)",
    gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  },
  system: {
    icon: Zap,
    label: "Sistema",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.25)",
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
  },
  promotion: {
    icon: Sparkles,
    label: "Promoción",
    color: "#ec4899",
    bg: "rgba(236, 72, 153, 0.12)",
    border: "rgba(236, 72, 153, 0.25)",
    gradient: "linear-gradient(135deg, #ec4899, #db2777)",
  },
};

const GROUP_LABELS = {
  today: "📅 Hoy",
  yesterday: "📆 Ayer",
  week: "🗓️ Esta semana",
  older: "📂 Anteriores",
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [readIds, setReadIds] = useState(new Set());
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await notificationsApi.getByUser(user.id);
      setNotifications(data);
      // Marcar automáticamente como "visto" al cargar (simulado)
      const initialRead = new Set(data.filter((n) => n.sent).map((n) => n.id));
      setReadIds(initialRead);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (id) => {
    setReadIds((prev) => new Set([...prev, id]));
  };

  const markAllAsRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  const deleteNotification = async (id) => {
    setDeletingId(id);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setReadIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setDeletingId(null);
    }, 300);
  };

  const filtered = useMemo(() => {
    let result =
      filter === "all"
        ? notifications
        : notifications.filter((n) => n.type === filter);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          (n.subject || "").toLowerCase().includes(q) ||
          (n.body || "").toLowerCase().includes(q) ||
          (n.email || "").toLowerCase().includes(q),
      );
    }

    return result;
  }, [notifications, filter, searchQuery]);

  const grouped = useMemo(() => {
    const groups = { today: [], yesterday: [], week: [], older: [] };
    const now = new Date();
    const todayStr = now.toDateString();
    const yesterdayStr = new Date(now - 86400000).toDateString();

    filtered.forEach((n) => {
      const date = new Date(n.created_at);
      const dateStr = date.toDateString();
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

      if (dateStr === todayStr) groups.today.push(n);
      else if (dateStr === yesterdayStr) groups.yesterday.push(n);
      else if (diffDays <= 7) groups.week.push(n);
      else groups.older.push(n);
    });

    return groups;
  }, [filtered]);

  const types = useMemo(
    () => [...new Set(notifications.map((n) => n.type))],
    [notifications],
  );

  const stats = useMemo(
    () => ({
      total: notifications.length,
      unread: notifications.filter((n) => !readIds.has(n.id)).length,
      sent: notifications.filter((n) => n.sent).length,
      failed: notifications.filter((n) => !n.sent).length,
    }),
    [notifications, readIds],
  );

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
      year: "numeric",
    });
  };

  const getTimeString = (date) => {
    return new Date(date).toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="ntf-loading">
        <div className="ntf-spinner-ring">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <span>Cargando notificaciones...</span>
        <div className="ntf-loading-dots">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  const unreadCount = stats.unread;

  return (
    <div className={`ntf-root ${isDark ? "dark" : "light"}`}>
      {/* ══ HEADER ══ */}
      <div className="ntf-header">
        <div className="ntf-header-left">
          <div className="ntf-header-icon">
            <Bell size={22} strokeWidth={2.5} />
            {unreadCount > 0 && (
              <span className="ntf-header-badge">{unreadCount}</span>
            )}
          </div>
          <div>
            <h1>Notificaciones</h1>
            <p>
              {unreadCount > 0
                ? `Tienes ${unreadCount} notificación${unreadCount !== 1 ? "es" : ""} sin leer`
                : "Todas las notificaciones leídas"}
            </p>
          </div>
        </div>
        <div className="ntf-header-actions">
          {unreadCount > 0 && (
            <button className="ntf-btn-ghost" onClick={markAllAsRead}>
              <CheckCheck size={16} strokeWidth={2} />
              <span>Marcar todo como leído</span>
            </button>
          )}
          <button className="ntf-btn-refresh" onClick={loadData}>
            <RefreshCw size={16} strokeWidth={2} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* ══ STATS CARDS ══ */}
      <div className="ntf-stats">
        {[
          {
            icon: Bell,
            label: "Total",
            value: stats.total,
            color: "#e8291c",
            bg: "rgba(232,41,28,.1)",
            trend: "notificaciones",
          },
          {
            icon: Mail,
            label: "Sin leer",
            value: stats.unread,
            color: "#3b82f6",
            bg: "rgba(59,130,246,.1)",
            trend: unreadCount > 0 ? "pendientes" : "al día",
            highlight: unreadCount > 0,
          },
          {
            icon: CheckCircle,
            label: "Enviadas",
            value: stats.sent,
            color: "#10b981",
            bg: "rgba(16,185,129,.1)",
            trend: "exitosas",
          },
          {
            icon: AlertCircle,
            label: "Fallidas",
            value: stats.failed,
            color: "#ef4444",
            bg: "rgba(239,68,68,.1)",
            trend: "con error",
          },
        ].map(
          ({ icon: Icon, label, value, color, bg, trend, highlight }, i) => (
            <div
              key={label}
              className={`ntf-stat ${highlight ? "highlight" : ""}`}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="ntf-stat-icon" style={{ background: bg, color }}>
                <Icon size={20} strokeWidth={2} />
              </div>
              <div className="ntf-stat-body">
                <span className="ntf-stat-value" style={{ color }}>
                  {value}
                </span>
                <span className="ntf-stat-label">{label}</span>
                <span className="ntf-stat-trend">{trend}</span>
              </div>
              {highlight && <div className="ntf-stat-pulse" />}
            </div>
          ),
        )}
      </div>

      {/* ══ SEARCH & FILTERS ══ */}
      <div className="ntf-toolbar">
        <div className="ntf-search">
          <Search size={16} strokeWidth={2} />
          <input
            type="text"
            placeholder="Buscar notificaciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="ntf-search-clear"
              onClick={() => setSearchQuery("")}
            >
              <XCircle size={14} strokeWidth={2} />
            </button>
          )}
        </div>
        <div className="ntf-filters">
          <div className="ntf-filter-group">
            <Filter size={14} strokeWidth={2} />
            <button
              className={`ntf-filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              Todas
              <span className="ntf-filter-count">{notifications.length}</span>
            </button>
            {types.map((t) => (
              <button
                key={t}
                className={`ntf-filter-btn ${filter === t ? "active" : ""}`}
                onClick={() => setFilter(t)}
              >
                {TYPE_CONFIG[t]?.label || t}
                <span className="ntf-filter-count">
                  {notifications.filter((n) => n.type === t).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ NOTIFICATIONS LIST ══ */}
      {filtered.length === 0 ? (
        <div className="ntf-empty">
          <div className="ntf-empty-icon">
            <Bell size={48} strokeWidth={1} />
          </div>
          <h3>
            {searchQuery
              ? "No se encontraron resultados"
              : "No hay notificaciones"}
          </h3>
          <p>
            {searchQuery
              ? "Intenta con otros términos de búsqueda"
              : "Las notificaciones aparecerán cuando se procesen órdenes, pagos y envíos"}
          </p>
          {searchQuery && (
            <button
              className="ntf-empty-btn"
              onClick={() => setSearchQuery("")}
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className="ntf-list">
          {Object.entries(grouped).map(([groupKey, groupItems]) => {
            if (groupItems.length === 0) return null;
            return (
              <div key={groupKey} className="ntf-group">
                <div className="ntf-group-label">{GROUP_LABELS[groupKey]}</div>
                {groupItems.map((n, idx) => {
                  const config = TYPE_CONFIG[n.type] || {
                    icon: Info,
                    label: n.type,
                    color: "#6b7280",
                    bg: "rgba(107,114,128,.12)",
                    border: "rgba(107,114,128,.25)",
                    gradient: "linear-gradient(135deg, #6b7280, #4b5563)",
                  };
                  const Icon = config.icon;
                  const isExpanded = selectedId === n.id;
                  const isRead = readIds.has(n.id);
                  const isDeleting = deletingId === n.id;

                  return (
                    <div
                      key={n.id}
                      className={`ntf-item ${isExpanded ? "expanded" : ""} ${isRead ? "read" : "unread"} ${isDeleting ? "deleting" : ""}`}
                      style={{ animationDelay: `${idx * 0.04}s` }}
                      onClick={() => {
                        setSelectedId(isExpanded ? null : n.id);
                        markAsRead(n.id);
                      }}
                    >
                      {/* Unread indicator */}
                      {!isRead && <div className="ntf-unread-dot" />}

                      {/* Icon */}
                      <div
                        className="ntf-item-icon"
                        style={{
                          background: config.bg,
                          color: config.color,
                          border: `1.5px solid ${config.border}`,
                        }}
                      >
                        <Icon size={18} strokeWidth={2} />
                      </div>

                      {/* Content */}
                      <div className="ntf-item-content">
                        <div className="ntf-item-top">
                          <div className="ntf-item-title-row">
                            <span className="ntf-item-title">
                              {n.subject || config.label}
                            </span>
                            <div className="ntf-item-badges">
                              {!isRead && (
                                <span className="ntf-badge-unread">Nuevo</span>
                              )}
                              <span
                                className="ntf-badge-type"
                                style={{
                                  background: config.bg,
                                  color: config.color,
                                  border: `1px solid ${config.border}`,
                                }}
                              >
                                {config.label}
                              </span>
                              <span
                                className={`ntf-badge-status ${n.sent ? "sent" : "failed"}`}
                              >
                                {n.sent ? (
                                  <>
                                    <CheckCircle size={10} /> Enviado
                                  </>
                                ) : (
                                  <>
                                    <XCircle size={10} /> Fallido
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="ntf-item-meta">
                            <span className="ntf-meta-time">
                              <Clock size={11} strokeWidth={2} />
                              {getTimeString(n.created_at)}
                            </span>
                            <span className="ntf-meta-sep">·</span>
                            <span className="ntf-meta-date">
                              {getDaysAgo(n.created_at)}
                            </span>
                            {n.email && (
                              <>
                                <span className="ntf-meta-sep">·</span>
                                <span className="ntf-meta-email">
                                  <Mail size={11} strokeWidth={2} />
                                  {n.email}
                                </span>
                              </>
                            )}
                            {n.reference_type && (
                              <>
                                <span className="ntf-meta-sep">·</span>
                                <span className="ntf-meta-ref">
                                  {n.reference_type} #{n.reference_id}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div className="ntf-item-detail">
                            <div className="ntf-detail-header">
                              <span>Detalle del mensaje</span>
                              <div className="ntf-detail-meta">
                                <span>Canal: {n.channel || "email"}</span>
                                <span>•</span>
                                <span>Tipo: {n.type}</span>
                                <span>•</span>
                                <span>ID: #{n.id}</span>
                              </div>
                            </div>
                            {n.error && (
                              <div className="ntf-detail-error">
                                <AlertCircle size={14} strokeWidth={2} />
                                <span>{n.error}</span>
                              </div>
                            )}
                            <div
                              className="ntf-detail-body"
                              dangerouslySetInnerHTML={{
                                __html:
                                  n.body || "<p>Sin contenido adicional</p>",
                              }}
                            />
                            <div className="ntf-detail-actions">
                              <button
                                className="ntf-detail-btn secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(n.id);
                                }}
                              >
                                <Trash2 size={14} strokeWidth={2} />
                                Eliminar
                              </button>
                              <button
                                className="ntf-detail-btn primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <CheckCheck size={14} strokeWidth={2} />
                                Marcar como leída
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Expand chevron */}
                      <div className="ntf-item-expand">
                        {isExpanded ? (
                          <ChevronUp size={18} strokeWidth={2.5} />
                        ) : (
                          <ChevronDown size={18} strokeWidth={2.5} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* ══ STYLES ══ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Barlow+Condensed:wght@400;600;700;800&display=swap');

        .ntf-root {
          font-family: 'Inter', sans-serif;
          max-width: 900px;
          margin: 0 auto;
          padding: 8px 0 40px;
          --primary: #e8291c;
          --primary2: #c2200f;
        }
        .ntf-root.dark  { --card: #1c1c24; --border: rgba(255,255,255,.08); --text: #f0f0f5; --text2: #a0a0b0; --text3: #6b6b80; --bg: #0f0f13; --hover: rgba(255,255,255,.04); }
        .ntf-root.light { --card: #ffffff; --border: #e5e7eb; --text: #1a1a1a; --text2: #4b5563; --text3: #9ca3af; --bg: #f5f5f5; --hover: rgba(0,0,0,.03); }

        /* Loading */
        .ntf-loading {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; min-height: 50vh; gap: 16px;
          color: var(--text3); font-family: 'Inter', sans-serif;
        }
        .ntf-spinner-ring {
          display: inline-block; position: relative; width: 48px; height: 48px;
        }
        .ntf-spinner-ring div {
          box-sizing: border-box; display: block; position: absolute;
          width: 36px; height: 36px; margin: 6px;
          border: 3px solid var(--primary);
          border-radius: 50%; animation: ntfSpin 1.2s cubic-bezier(0.5,0,0.5,1) infinite;
          border-color: var(--primary) transparent transparent transparent;
        }
        .ntf-spinner-ring div:nth-child(1) { animation-delay: -.45s; }
        .ntf-spinner-ring div:nth-child(2) { animation-delay: -.3s; }
        .ntf-spinner-ring div:nth-child(3) { animation-delay: -.15s; }
        @keyframes ntfSpin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        .ntf-loading-dots { display: flex; gap: 6px; margin-top: 4px; }
        .ntf-loading-dots span {
          width: 6px; height: 6px; background: var(--primary);
          border-radius: 50%; animation: ntfBounce 1.4s ease-in-out infinite both;
        }
        .ntf-loading-dots span:nth-child(1) { animation-delay: -.32s; }
        .ntf-loading-dots span:nth-child(2) { animation-delay: -.16s; }
        @keyframes ntfBounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }

        /* Header */
        .ntf-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 24px; flex-wrap: wrap; gap: 16px;
        }
        .ntf-header-left { display: flex; align-items: center; gap: 16px; }
        .ntf-header-icon {
          width: 52px; height: 52px;
          background: linear-gradient(135deg, var(--primary), var(--primary2));
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          color: #fff; position: relative;
          box-shadow: 0 4px 16px rgba(232,41,28,.3);
        }
        .ntf-header-badge {
          position: absolute; top: -6px; right: -6px;
          min-width: 22px; height: 22px;
          background: #fff; color: var(--primary);
          border: 2px solid var(--primary);
          border-radius: 11px;
          font-size: 11px; font-weight: 900;
          display: flex; align-items: center; justify-content: center;
          padding: 0 6px;
          animation: ntfPop .3s cubic-bezier(0.175,0.885,0.32,1.275);
          box-shadow: 0 2px 8px rgba(0,0,0,.15);
        }
        @keyframes ntfPop { from{transform:scale(0)} to{transform:scale(1)} }
        .ntf-header h1 { font-size: 26px; font-weight: 900; color: var(--text); margin: 0; letter-spacing: -.02em; }
        .ntf-header p { font-size: 13px; color: var(--text3); margin: 4px 0 0; font-weight: 500; }
        .ntf-header-actions { display: flex; gap: 10px; }
        .ntf-btn-ghost {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 18px;
          background: var(--card);
          border: 1.5px solid var(--border);
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 13px; font-weight: 700;
          color: var(--text2); cursor: pointer;
          transition: all .2s;
        }
        .ntf-btn-ghost:hover { border-color: #10b981; color: #10b981; background: rgba(16,185,129,.06); }
        .ntf-btn-refresh {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 18px;
          background: var(--card);
          border: 1.5px solid var(--border);
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 13px; font-weight: 700;
          color: var(--text2); cursor: pointer;
          transition: all .2s;
        }
        .ntf-btn-refresh:hover { border-color: var(--primary); color: var(--primary); background: var(--hover); }
        .ntf-btn-refresh:active { transform: scale(.97); }

        /* Stats */
        .ntf-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 14px; margin-bottom: 24px;
        }
        .ntf-stat {
          background: var(--card);
          border: 1.5px solid var(--border);
          border-radius: 16px;
          padding: 18px;
          display: flex; align-items: center; gap: 14px;
          position: relative; overflow: hidden;
          animation: ntfFadeUp .5s ease forwards;
          opacity: 0;
          transition: all .25s;
        }
        @keyframes ntfFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .ntf-stat:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,.08); border-color: var(--primary); }
        .ntf-stat.highlight { border-color: #3b82f6; }
        .ntf-stat-icon {
          width: 46px; height: 46px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .ntf-stat-body { flex: 1; }
        .ntf-stat-value { display: block; font-size: 26px; font-weight: 800; font-family: 'Barlow Condensed', sans-serif; letter-spacing: -.01em; }
        .ntf-stat-label { display: block; font-size: 12px; font-weight: 700; color: var(--text2); text-transform: uppercase; letter-spacing: .04em; margin-top: 2px; }
        .ntf-stat-trend { display: block; font-size: 11px; color: var(--text3); font-weight: 500; margin-top: 2px; }
        .ntf-stat-pulse {
          position: absolute; top: 12px; right: 12px;
          width: 8px; height: 8px;
          background: #3b82f6;
          border-radius: 50%;
          animation: ntfPulse 2s infinite;
        }
        @keyframes ntfPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }

        /* Toolbar */
        .ntf-toolbar { margin-bottom: 20px; }
        .ntf-search {
          display: flex; align-items: center; gap: 10px;
          background: var(--card);
          border: 1.5px solid var(--border);
          border-radius: 12px;
          padding: 10px 14px;
          margin-bottom: 14px;
          transition: all .2s;
        }
        .ntf-search:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(232,41,28,.08); }
        .ntf-search svg { color: var(--text3); flex-shrink: 0; }
        .ntf-search input {
          flex: 1; border: none; background: none;
          font-family: 'Inter', sans-serif;
          font-size: 14px; font-weight: 500;
          color: var(--text); outline: none;
        }
        .ntf-search input::placeholder { color: var(--text3); }
        .ntf-search-clear {
          background: none; border: none;
          color: var(--text3); cursor: pointer;
          padding: 2px; display: flex; align-items: center;
          transition: all .15s;
        }
        .ntf-search-clear:hover { color: var(--primary); }

        /* Filters */
        .ntf-filters { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .ntf-filter-group {
          display: flex; align-items: center; gap: 6px;
          flex-wrap: wrap;
        }
        .ntf-filter-group > svg { color: var(--text3); }
        .ntf-filter-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px;
          background: var(--card);
          border: 1.5px solid var(--border);
          border-radius: 20px;
          font-family: 'Inter', sans-serif;
          font-size: 12px; font-weight: 600;
          color: var(--text2); cursor: pointer;
          transition: all .2s;
        }
        .ntf-filter-btn:hover { border-color: var(--primary); color: var(--primary); }
        .ntf-filter-btn.active {
          background: linear-gradient(135deg, var(--primary), var(--primary2));
          border-color: var(--primary);
          color: #fff;
          box-shadow: 0 4px 14px rgba(232,41,28,.25);
        }
        .ntf-filter-count {
          background: rgba(0,0,0,.1);
          padding: 1px 7px;
          border-radius: 10px;
          font-size: 10px; font-weight: 800;
        }
        .ntf-filter-btn.active .ntf-filter-count { background: rgba(255,255,255,.2); }

        /* Empty */
        .ntf-empty {
          text-align: center; padding: 60px 24px;
          background: var(--card);
          border: 2px dashed var(--border);
          border-radius: 20px;
        }
        .ntf-empty-icon {
          width: 90px; height: 90px;
          background: linear-gradient(135deg, rgba(232,41,28,.08), rgba(249,115,22,.06));
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: var(--primary);
          margin: 0 auto 20px;
        }
        .ntf-empty h3 { font-size: 18px; font-weight: 800; color: var(--text); margin-bottom: 6px; }
        .ntf-empty p { font-size: 13px; color: var(--text3); margin-bottom: 20px; max-width: 360px; margin-left: auto; margin-right: auto; }
        .ntf-empty-btn {
          padding: 11px 24px;
          background: linear-gradient(135deg, var(--primary), var(--primary2));
          color: #fff; border: none; border-radius: 30px;
          font-family: 'Inter', sans-serif;
          font-size: 13px; font-weight: 700;
          cursor: pointer; transition: all .25s;
          box-shadow: 0 4px 16px rgba(232,41,28,.25);
        }
        .ntf-empty-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(232,41,28,.35); }

        /* List & Groups */
        .ntf-list { display: flex; flex-direction: column; gap: 20px; }
        .ntf-group-label {
          font-size: 13px; font-weight: 800;
          color: var(--text3);
          text-transform: uppercase;
          letter-spacing: .08em;
          margin-bottom: 10px;
          padding-left: 4px;
        }

        /* Item */
        .ntf-item {
          display: flex; align-items: flex-start; gap: 14px;
          background: var(--card);
          border: 1.5px solid var(--border);
          border-radius: 16px;
          padding: 16px 18px;
          cursor: pointer;
          position: relative;
          transition: all .25s;
          animation: ntfFadeUp .4s ease forwards;
          opacity: 0;
        }
        .ntf-item:hover { border-color: var(--primary); transform: translateX(4px); box-shadow: 0 4px 16px rgba(0,0,0,.06); }
        .ntf-item.expanded { border-color: var(--primary); box-shadow: 0 8px 28px rgba(0,0,0,.08); }
        .ntf-item.unread { background: linear-gradient(135deg, var(--card), rgba(59,130,246,.03)); border-left: 3px solid #3b82f6; }
        .ntf-item.deleting { opacity: 0; transform: scale(.95) translateX(20px); transition: all .3s ease; }

        .ntf-unread-dot {
          position: absolute; left: 8px; top: 50%;
          transform: translateY(-50%);
          width: 6px; height: 6px;
          background: #3b82f6;
          border-radius: 50%;
          animation: ntfPulse 2s infinite;
        }

        .ntf-item-icon {
          width: 44px; height: 44px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .ntf-item-content { flex: 1; min-width: 0; }
        .ntf-item-top { width: 100%; }
        .ntf-item-title-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 10px; flex-wrap: wrap; margin-bottom: 6px;
        }
        .ntf-item-title {
          font-size: 15px; font-weight: 700;
          color: var(--text); flex: 1;
        }
        .ntf-item.read .ntf-item-title { color: var(--text2); }
        .ntf-item-badges { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

        .ntf-badge-unread {
          font-size: 9px; font-weight: 900;
          padding: 3px 10px;
          background: #3b82f6;
          color: #fff;
          border-radius: 20px;
          letter-spacing: .05em;
          animation: ntfPop .3s ease;
        }
        .ntf-badge-type {
          font-size: 10px; font-weight: 700;
          padding: 3px 10px;
          border-radius: 20px;
          letter-spacing: .02em;
        }
        .ntf-badge-status {
          display: flex; align-items: center; gap: 4px;
          font-size: 10px; font-weight: 700;
          padding: 3px 10px;
          border-radius: 20px;
        }
        .ntf-badge-status.sent { background: #d1fae5; color: #065f46; }
        .ntf-badge-status.failed { background: #fee2e2; color: #991b1b; }

        .ntf-item-meta {
          display: flex; align-items: center; flex-wrap: wrap;
          gap: 6px;
          font-size: 12px; color: var(--text3); font-weight: 500;
        }
        .ntf-meta-time, .ntf-meta-email {
          display: flex; align-items: center; gap: 4px;
        }
        .ntf-meta-sep { color: var(--border2); }
        .ntf-meta-ref {
          font-size: 11px; font-weight: 600;
          color: var(--primary);
          background: rgba(232,41,28,.08);
          padding: 1px 8px;
          border-radius: 6px;
        }

        .ntf-item-expand {
          color: var(--text3);
          transition: all .2s;
          flex-shrink: 0;
          margin-top: 4px;
        }
        .ntf-item:hover .ntf-item-expand { color: var(--primary); }
        .ntf-item.expanded .ntf-item-expand { color: var(--primary); transform: rotate(180deg); }

        /* Detail */
        .ntf-item-detail {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid var(--border);
          animation: ntfFadeUp .25s ease;
        }
        .ntf-detail-header {
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 10px;
          margin-bottom: 12px;
        }
        .ntf-detail-header > span {
          font-size: 11px; font-weight: 800;
          text-transform: uppercase; letter-spacing: .06em;
          color: var(--text3);
        }
        .ntf-detail-meta {
          display: flex; align-items: center; gap: 8px;
          font-size: 11px; color: var(--text3); font-weight: 500;
        }
        .ntf-detail-error {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px;
          background: rgba(239,68,68,.08);
          border: 1px solid rgba(239,68,68,.15);
          border-radius: 10px;
          margin-bottom: 12px;
          font-size: 12px; color: #ef4444; font-weight: 600;
        }
        .ntf-detail-body {
          font-size: 13px; color: var(--text2);
          line-height: 1.7;
          padding: 12px;
          background: var(--bg);
          border-radius: 10px;
          margin-bottom: 14px;
        }
        .ntf-detail-body p { margin-bottom: 8px; }
        .ntf-detail-body p:last-child { margin-bottom: 0; }

        .ntf-detail-actions {
          display: flex; gap: 10px;
        }
        .ntf-detail-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 16px;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 12px; font-weight: 700;
          cursor: pointer; transition: all .2s;
          border: 1.5px solid transparent;
        }
        .ntf-detail-btn.secondary {
          background: var(--bg);
          border-color: var(--border);
          color: var(--text2);
        }
        .ntf-detail-btn.secondary:hover { border-color: #ef4444; color: #ef4444; background: rgba(239,68,68,.06); }
        .ntf-detail-btn.primary {
          background: linear-gradient(135deg, var(--primary), var(--primary2));
          color: #fff;
          box-shadow: 0 4px 14px rgba(232,41,28,.25);
        }
        .ntf-detail-btn.primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(232,41,28,.35); }

        /* Responsive */
        @media (max-width: 768px) {
          .ntf-stats { grid-template-columns: repeat(2, 1fr); }
          .ntf-header { flex-direction: column; align-items: flex-start; }
          .ntf-header-actions { width: 100%; }
          .ntf-btn-ghost, .ntf-btn-refresh { flex: 1; justify-content: center; }
          .ntf-item-title-row { flex-direction: column; align-items: flex-start; }
          .ntf-item-badges { flex-wrap: wrap; }
          .ntf-filters { overflow-x: auto; padding-bottom: 4px; }
          .ntf-filter-group { flex-wrap: nowrap; }
        }
        @media (max-width: 480px) {
          .ntf-stats { grid-template-columns: 1fr 1fr; }
          .ntf-item { padding: 12px; gap: 10px; }
          .ntf-item-icon { width: 38px; height: 38px; }
          .ntf-detail-actions { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
