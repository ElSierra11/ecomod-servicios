import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { authApi } from "../services/api";
import {
  BarChart3,
  Users,
  UserCheck,
  UserX,
  Shield,
  User as UserIcon,
  TrendingUp,
  Activity,
  Crown,
  Sparkles,
} from "lucide-react";
import SystemHealth from "../components/SystemHealth";

const formatNumber = (n) => new Intl.NumberFormat("es-CO").format(n || 0);

export default function AdminStats() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // âœ… useCallback para evitar re-renders infinitos
  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.getUserStats();
      setStats(data);
    } catch (err) {
      console.error("Error loading stats:", err);
      setError(err.message || "No se pudieron cargar las estadísticas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <div className="as-loading">
        <div className="as-spinner" />
        <span>Cargando estadísticas...</span>
        <div className="as-loading-dots">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="as-error">
        <span className="as-error-icon">âš ï¸</span>
        <h3>No se pudieron cargar las estadísticas</h3>
        <p>{error}</p>
        <button className="as-retry-btn" onClick={loadStats}>
          Reintentar
        </button>
      </div>
    );
  }

  // âœ… Datos 100% reales del backend â€” sin inventar nada
  const total = stats?.total ?? 0;
  const active = stats?.active ?? 0;
  const inactive = stats?.inactive ?? 0;
  const admins = stats?.admins ?? 0;
  const clients = stats?.clients ?? 0;

  const cards = [
    {
      icon: Users,
      label: "Total usuarios",
      value: total,
      color: "#e8291c",
      bg: "rgba(232,41,28,.1)",
    },
    {
      icon: UserCheck,
      label: "Usuarios activos",
      value: active,
      color: "#10b981",
      bg: "rgba(16,185,129,.1)",
    },
    {
      icon: UserX,
      label: "Usuarios inactivos",
      value: inactive,
      color: "#f59e0b",
      bg: "rgba(245,158,11,.1)",
    },
    {
      icon: Shield,
      label: "Administradores",
      value: admins,
      color: "#8b5cf6",
      bg: "rgba(139,92,246,.1)",
    },
    {
      icon: UserIcon,
      label: "Clientes",
      value: clients,
      color: "#3b82f6",
      bg: "rgba(59,130,246,.1)",
    },
  ];

  // Porcentajes reales calculados en el frontend
  const safeTotal = total || 1;
  const adminPercent = (admins / safeTotal) * 100;
  const clientPercent = (clients / safeTotal) * 100;
  const activePercent = (active / safeTotal) * 100;
  const inactivePercent = (inactive / safeTotal) * 100;

  return (
    <div className={`as-root ${isDark ? "dark" : "light"}`}>
      {/* Header */}
      <div className="as-header">
        <div className="as-header-left">
          <div className="as-badge">
            <Crown size={14} strokeWidth={2.5} />
            <span>PANEL ADMIN</span>
          </div>
          <h1 className="as-title">
            <BarChart3
              size={28}
              strokeWidth={2.5}
              style={{ color: "#e8291c" }}
            />
            Estadísticas de Usuarios
          </h1>
          <p className="as-sub">
            Visualiza la distribución real de tu base de usuarios
          </p>
        </div>
        <div className="as-header-right">
          <div className="as-live-indicator">
            <Activity size={14} strokeWidth={2.5} />
            <span>En vivo</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="as-stats-grid">
        {cards.map((card, i) => (
          <div
            key={card.label}
            className="as-stat-card"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className="as-stat-top">
              <div
                className="as-stat-icon"
                style={{ background: card.bg, color: card.color }}
              >
                <card.icon size={24} strokeWidth={2} />
              </div>
              {/* âœ… Porcentaje real respecto al total en lugar de trend inventado */}
              {card.label !== "Total usuarios" && (
                <div
                  className="as-real-percent"
                  style={{ color: card.color, background: card.bg }}
                >
                  {total > 0
                    ? `${((card.value / safeTotal) * 100).toFixed(1)}%`
                    : "â€”"}
                </div>
              )}
            </div>
            <div className="as-stat-body">
              <span className="as-stat-value" style={{ color: card.color }}>
                {formatNumber(card.value)}
              </span>
              <span className="as-stat-label">{card.label}</span>
            </div>
            <div className="as-stat-bar">
              <div
                className="as-stat-bar-fill"
                style={{
                  width: `${Math.min((card.value / safeTotal) * 100, 100)}%`,
                  background: `linear-gradient(90deg, ${card.color}, ${card.color}88)`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Ecosystem Health Dashboard */}
      <SystemHealth />

      {/* Charts Section */}
      <div className="as-charts-section">
        {/* Distribution Chart */}
        <div className="as-chart-card">
          <div className="as-chart-header">
            <TrendingUp
              size={18}
              strokeWidth={2.5}
              style={{ color: "#e8291c" }}
            />
            <h3>Distribución de usuarios</h3>
            <span className="as-chart-sub">{formatNumber(total)} total</span>
          </div>

          <div className="as-chart-content">
            {/* Circular Progress */}
            <div className="as-circular-chart">
              <svg viewBox="0 0 120 120" className="as-circular-svg">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${adminPercent * 3.14} ${314 - adminPercent * 3.14}`}
                  strokeDashoffset={78.5}
                  transform="rotate(-90 60 60)"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${clientPercent * 3.14} ${314 - clientPercent * 3.14}`}
                  strokeDashoffset={78.5 - adminPercent * 3.14}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className="as-circular-center">
                <span className="as-circular-value">{formatNumber(total)}</span>
                <span className="as-circular-label">Total</span>
              </div>
            </div>

            {/* Legend */}
            <div className="as-chart-legend">
              <div className="as-legend-item">
                <div
                  className="as-legend-dot"
                  style={{ background: "#8b5cf6" }}
                />
                <div className="as-legend-info">
                  <span className="as-legend-label">Administradores</span>
                  <span className="as-legend-value">
                    {formatNumber(admins)}
                  </span>
                </div>
                <div className="as-legend-percent">
                  {adminPercent.toFixed(1)}%
                </div>
              </div>
              <div className="as-legend-item">
                <div
                  className="as-legend-dot"
                  style={{ background: "#3b82f6" }}
                />
                <div className="as-legend-info">
                  <span className="as-legend-label">Clientes</span>
                  <span className="as-legend-value">
                    {formatNumber(clients)}
                  </span>
                </div>
                <div className="as-legend-percent">
                  {clientPercent.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Chart */}
        <div className="as-chart-card">
          <div className="as-chart-header">
            <Activity
              size={18}
              strokeWidth={2.5}
              style={{ color: "#10b981" }}
            />
            <h3>Actividad de usuarios</h3>
            <span className="as-chart-sub">Activos vs Inactivos</span>
          </div>

          <div className="as-bars-chart">
            {/* Active Bar */}
            <div className="as-bar-item">
              <div className="as-bar-header">
                <span className="as-bar-label">
                  <UserCheck size={14} strokeWidth={2.5} />
                  Usuarios activos
                </span>
                <span className="as-bar-value" style={{ color: "#10b981" }}>
                  {formatNumber(active)}
                </span>
              </div>
              <div className="as-bar-track">
                <div
                  className="as-bar-fill"
                  style={{
                    width: `${activePercent}%`,
                    background: "linear-gradient(90deg, #10b981, #34d399)",
                  }}
                />
              </div>
              <span className="as-bar-percent">
                {activePercent.toFixed(1)}%
              </span>
            </div>

            {/* Inactive Bar */}
            <div className="as-bar-item">
              <div className="as-bar-header">
                <span className="as-bar-label">
                  <UserX size={14} strokeWidth={2.5} />
                  Usuarios inactivos
                </span>
                <span className="as-bar-value" style={{ color: "#f59e0b" }}>
                  {formatNumber(inactive)}
                </span>
              </div>
              <div className="as-bar-track">
                <div
                  className="as-bar-fill"
                  style={{
                    width: `${inactivePercent}%`,
                    background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
                  }}
                />
              </div>
              <span className="as-bar-percent">
                {inactivePercent.toFixed(1)}%
              </span>
            </div>

            {/* Summary */}
            <div className="as-activity-summary">
              <div className="as-summary-item">
                <div
                  className="as-summary-icon"
                  style={{
                    background: "rgba(16,185,129,.1)",
                    color: "#10b981",
                  }}
                >
                  <Sparkles size={16} strokeWidth={2} />
                </div>
                <div>
                  <span
                    className="as-summary-value"
                    style={{ color: "#10b981" }}
                  >
                    {activePercent.toFixed(1)}%
                  </span>
                  <span className="as-summary-label">Tasa de actividad</span>
                </div>
              </div>
              <div className="as-summary-divider" />
              <div className="as-summary-item">
                <div
                  className="as-summary-icon"
                  style={{
                    background: "rgba(245,158,11,.1)",
                    color: "#f59e0b",
                  }}
                >
                  <Shield size={16} strokeWidth={2} />
                </div>
                <div>
                  <span
                    className="as-summary-value"
                    style={{ color: "#f59e0b" }}
                  >
                    {formatNumber(inactive)}
                  </span>
                  <span className="as-summary-label">Requieren atención</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Barlow+Condensed:wght@400;600;700;800&display=swap');

        .as-root {
          font-family: 'Inter', sans-serif;
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .as-root.dark {
          --card: #1c1c24; --border: rgba(255,255,255,.08);
          --text: #f0f0f5; --text2: #a0a0b0; --text3: #6b6b80;
          --bg: #0f0f13; --bg2: #16161e;
        }
        .as-root.light {
          --card: #ffffff; --border: #e5e7eb;
          --text: #1a1a1a; --text2: #4b5563; --text3: #9ca3af;
          --bg: #f5f5f5; --bg2: #fafafa;
        }

        /* Loading */
        .as-loading {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; min-height: 50vh; gap: 16px;
          color: #9ca3af;
        }
        .as-spinner {
          width: 44px; height: 44px;
          border: 3px solid rgba(232,41,28,.12);
          border-top-color: #e8291c; border-radius: 50%;
          animation: asSpin .8s linear infinite;
        }
        @keyframes asSpin { to { transform: rotate(360deg); } }
        .as-loading-dots { display: flex; gap: 6px; margin-top: 4px; }
        .as-loading-dots span {
          width: 6px; height: 6px; background: #e8291c;
          border-radius: 50%; animation: asBounce 1.4s ease-in-out infinite both;
        }
        .as-loading-dots span:nth-child(1) { animation-delay: -.32s; }
        .as-loading-dots span:nth-child(2) { animation-delay: -.16s; }
        @keyframes asBounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }

        /* Error */
        .as-error {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; min-height: 50vh; gap: 12px;
          color: #9ca3af; text-align: center;
        }
        .as-error-icon { font-size: 48px; }
        .as-error h3 { font-size: 18px; font-weight: 800; color: #4b5563; margin: 0; }
        .as-error p { font-size: 14px; margin: 0; color: #dc2626; }
        .as-retry-btn {
          margin-top: 8px; padding: 10px 24px;
          background: linear-gradient(135deg, #e8291c, #c2200f);
          border: none; border-radius: 10px; color: #fff;
          font-size: 13px; font-weight: 700; cursor: pointer;
          transition: all .25s;
        }
        .as-retry-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(232,41,28,.3); }

        /* Header */
        .as-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 32px; flex-wrap: wrap; gap: 16px;
        }
        .as-header-left { flex: 1; }
        .as-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 5px 14px; background: rgba(232,41,28,.08);
          border: 1.5px solid rgba(232,41,28,.15); border-radius: 20px;
          font-size: 10px; font-weight: 800; letter-spacing: .12em;
          color: #e8291c; margin-bottom: 12px; text-transform: uppercase;
        }
        .as-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 32px; font-weight: 800; color: var(--ec-text);
          margin: 0 0 8px; display: flex; align-items: center;
          gap: 12px; letter-spacing: -.02em;
        }
        .as-sub { font-size: 15px; color: var(--ec-text3); margin: 0; font-weight: 500; }
        .as-header-right { display: flex; align-items: center; }
        .as-live-indicator {
          display: flex; align-items: center; gap: 8px; padding: 8px 16px;
          background: rgba(16,185,129,.08); border: 1.5px solid rgba(16,185,129,.2);
          border-radius: 20px; font-size: 13px; font-weight: 700; color: #10b981;
        }
        .as-live-indicator::before {
          content: ''; width: 8px; height: 8px; background: #10b981;
          border-radius: 50%; animation: livePulse 2s ease-in-out infinite;
        }
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }

        /* Stats Grid */
        .as-stats-grid {
          display: grid; grid-template-columns: repeat(5, 1fr);
          gap: 16px; margin-bottom: 32px;
        }
        .as-stat-card {
          background: var(--ec-card-bg); border: 1.5px solid var(--ec-border);
          border-radius: 18px; padding: 20px;
          animation: asFadeUp .5s ease forwards; opacity: 0; transition: all .25s;
        }
        @keyframes asFadeUp { to{opacity:1;transform:translateY(0)} from{opacity:0;transform:translateY(16px)} }
        .as-stat-card:hover {
          transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,.1);
          border-color: rgba(232,41,28,.2);
        }
        .as-stat-top {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 16px;
        }
        .as-stat-icon {
          width: 48px; height: 48px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
        }
        /* âœ… Badge de porcentaje real (reemplaza el trend inventado) */
        .as-real-percent {
          padding: 4px 10px; border-radius: 20px;
          font-size: 12px; font-weight: 800;
        }
        .as-stat-body { margin-bottom: 14px; }
        .as-stat-value {
          display: block; font-family: 'Barlow Condensed', sans-serif;
          font-size: 32px; font-weight: 800; letter-spacing: -.01em; line-height: 1;
        }
        .as-stat-label {
          display: block; font-size: 13px; color: var(--ec-text3);
          margin-top: 6px; font-weight: 600;
        }
        .as-stat-bar {
          height: 4px; background: var(--ec-bg); border-radius: 2px; overflow: hidden;
        }
        .as-stat-bar-fill {
          height: 100%; border-radius: 2px; transition: width 1s ease;
        }
        .as-chart-header h3 {
          font-size: 18px; font-weight: 800;
          color: var(--ec-text); margin: 0;
        }
        .as-chart-sub {
          margin-left: auto;
          padding: 4px 12px;
          background: var(--ec-bg);
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          color: var(--ec-text3);
        }

        /* Charts Section */
        .as-charts-section {
          display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
        }
        .as-chart-card {
          background: var(--ec-card-bg); border: 1.5px solid var(--ec-border);
          border-radius: 20px; padding: 28px; transition: all .25s;
        }
        .as-chart-card:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,.08);
          border-color: rgba(232,41,28,.15);
        }
        .as-chart-header {
          display: flex; align-items: center; gap: 10px; margin-bottom: 28px;
        }
        .as-chart-header h3 {
          font-size: 18px; font-weight: 800; color: var(--ec-text); margin: 0;
        }
        .as-chart-sub {
          margin-left: auto; padding: 4px 12px; background: var(--ec-bg);
          border-radius: 20px; font-size: 12px; font-weight: 700; color: var(--ec-text3);
        }

        /* Circular Chart */
        .as-chart-content { display: flex; align-items: center; gap: 32px; }
        .as-circular-chart { position: relative; width: 140px; height: 140px; flex-shrink: 0; }
        .as-circular-svg { width: 100%; height: 100%; }
        .as-circular-center {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
        }
        .as-circular-value {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 28px; font-weight: 800; color: var(--ec-text); line-height: 1;
        }
        .as-circular-label {
          font-size: 11px; color: var(--ec-text3); font-weight: 600;
          text-transform: uppercase; letter-spacing: .05em;
        }

        /* Legend */
        .as-chart-legend { flex: 1; display: flex; flex-direction: column; gap: 16px; }
        .as-legend-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px; background: var(--ec-bg2); border-radius: 12px; transition: all .2s;
        }
        .as-legend-item:hover { transform: translateX(4px); }
        .as-legend-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
        .as-legend-info { flex: 1; }
        .as-legend-label { display: block; font-size: 13px; color: var(--ec-text2); font-weight: 600; }
        .as-legend-value {
          display: block; font-size: 18px; font-weight: 800; color: var(--ec-text);
          font-family: 'Barlow Condensed', sans-serif; margin-top: 2px;
        }
        .as-legend-percent {
          font-size: 14px; font-weight: 800; color: var(--ec-text3);
          font-family: 'Barlow Condensed', sans-serif;
        }

        /* Bars Chart */
        .as-bars-chart { display: flex; flex-direction: column; gap: 24px; }
        .as-bar-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 10px;
        }
        .as-bar-label {
          display: flex; align-items: center; gap: 8px;
          font-size: 14px; font-weight: 700; color: var(--ec-text2);
        }
        .as-bar-value {
          font-family: 'Barlow Condensed', sans-serif; font-size: 20px; font-weight: 800;
        }
        .as-bar-track { height: 12px; background: var(--ec-bg); border-radius: 6px; overflow: hidden; }
        .as-bar-fill { height: 100%; border-radius: 6px; transition: width 1s ease; }
        .as-bar-percent {
          display: block; text-align: right; font-size: 12px;
          color: var(--ec-text3); font-weight: 700; margin-top: 6px;
        }

        /* Activity Summary */
        .as-activity-summary {
          display: flex; align-items: center; gap: 20px;
          margin-top: 8px; padding-top: 20px; border-top: 1.5px solid var(--ec-border);
        }
        .as-summary-item { display: flex; align-items: center; gap: 12px; flex: 1; }
        .as-summary-icon {
          width: 40px; height: 40px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .as-summary-value {
          display: block; font-family: 'Barlow Condensed', sans-serif;
          font-size: 22px; font-weight: 800; line-height: 1;
        }
        .as-summary-label {
          display: block; font-size: 12px; color: var(--ec-text3);
          font-weight: 500; margin-top: 2px;
        }
        .as-summary-divider { width: 1px; height: 40px; background: var(--ec-border); }

        /* Responsive */
        @media (max-width: 1024px) {
          .as-stats-grid { grid-template-columns: repeat(3, 1fr); }
          .as-charts-section { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .as-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .as-title { font-size: 26px; }
          .as-chart-content { flex-direction: column; text-align: center; }
          .as-activity-summary { flex-direction: column; }
          .as-summary-divider { width: 100%; height: 1px; }
        }
        @media (max-width: 480px) {
          .as-stats-grid { grid-template-columns: 1fr; }
          .as-root { padding: 16px; }
          .as-chart-card { padding: 20px; }
        }
      `}</style>
    </div>
  );
}
