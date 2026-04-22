import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/api";
import {
  BarChart3,
  Users,
  UserCheck,
  UserX,
  Shield,
  User as UserIcon,
  TrendingUp,
} from "lucide-react";

export default function AdminStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await authApi.getUserStats();
        setStats(data);
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span>Cargando estadísticas...</span>
      </div>
    );
  }

  const cards = [
    {
      icon: Users,
      label: "Total usuarios",
      value: stats?.total || 0,
      color: "#00b894",
    },
    {
      icon: UserCheck,
      label: "Usuarios activos",
      value: stats?.active || 0,
      color: "#00ff88",
    },
    {
      icon: UserX,
      label: "Usuarios inactivos",
      value: stats?.inactive || 0,
      color: "#ff6b6b",
    },
    {
      icon: Shield,
      label: "Administradores",
      value: stats?.admins || 0,
      color: "#c084fc",
    },
    {
      icon: UserIcon,
      label: "Clientes",
      value: stats?.clients || 0,
      color: "#00d4ff",
    },
  ];

  return (
    <div className="admin-stats">
      <div className="page-header">
        <div className="page-title">
          <BarChart3 size={24} />
          <h1>Estadísticas de Usuarios</h1>
        </div>
      </div>

      <div className="stats-grid">
        {cards.map((card) => (
          <div key={card.label} className="stat-card">
            <div
              className="stat-icon"
              style={{ background: `${card.color}15`, color: card.color }}
            >
              <card.icon size={28} />
            </div>
            <div className="stat-info">
              <span className="stat-label">{card.label}</span>
              <span className="stat-value">{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <TrendingUp size={18} />
          <span>Distribución de usuarios</span>
        </div>
        <div className="chart-bars">
          <div className="bar-item">
            <span>Administradores</span>
            <div className="bar-bg">
              <div
                className="bar-fill"
                style={{
                  width: `${((stats?.admins || 0) / (stats?.total || 1)) * 100}%`,
                  background: "#c084fc",
                }}
              />
            </div>
            <span className="bar-value">{stats?.admins || 0}</span>
          </div>
          <div className="bar-item">
            <span>Clientes</span>
            <div className="bar-bg">
              <div
                className="bar-fill"
                style={{
                  width: `${((stats?.clients || 0) / (stats?.total || 1)) * 100}%`,
                  background: "#00d4ff",
                }}
              />
            </div>
            <span className="bar-value">{stats?.clients || 0}</span>
          </div>
          <div className="bar-item">
            <span>Activos vs Inactivos</span>
            <div className="bar-group">
              <div className="bar-bg">
                <div
                  className="bar-fill active"
                  style={{
                    width: `${((stats?.active || 0) / (stats?.total || 1)) * 100}%`,
                    background: "#00ff88",
                  }}
                />
              </div>
              <div className="bar-bg">
                <div
                  className="bar-fill inactive"
                  style={{
                    width: `${((stats?.inactive || 0) / (stats?.total || 1)) * 100}%`,
                    background: "#ff6b6b",
                  }}
                />
              </div>
            </div>
            <div className="bar-legend">
              <span>
                <span className="dot active-dot"></span> Activos:{" "}
                {stats?.active || 0}
              </span>
              <span>
                <span className="dot inactive-dot"></span> Inactivos:{" "}
                {stats?.inactive || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .admin-stats {
          padding: 24px;
        }

        .page-header {
          margin-bottom: 28px;
        }

        .page-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .page-title h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 28px;
        }

        .stat-card {
          background: var(--surface);
          border-radius: 20px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          border: 1px solid var(--border);
          transition: all 0.3s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          border-color: var(--accent);
        }

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-info {
          flex: 1;
        }

        .stat-label {
          display: block;
          font-size: 12px;
          color: var(--text3);
          margin-bottom: 4px;
        }

        .stat-value {
          display: block;
          font-size: 32px;
          font-weight: 800;
        }

        .chart-card {
          background: var(--surface);
          border-radius: 20px;
          padding: 24px;
          border: 1px solid var(--border);
        }

        .chart-header {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 24px;
        }

        .chart-bars {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .bar-item {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .bar-item > span:first-child {
          width: 140px;
          font-size: 14px;
        }

        .bar-bg {
          flex: 1;
          height: 32px;
          background: var(--bg2);
          border-radius: 8px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          border-radius: 8px;
          transition: width 0.5s ease;
        }

        .bar-group {
          flex: 1;
          display: flex;
          gap: 8px;
        }

        .bar-group .bar-bg {
          flex: 1;
        }

        .bar-value {
          width: 50px;
          text-align: right;
          font-weight: 600;
        }

        .bar-legend {
          display: flex;
          gap: 24px;
          margin-top: 8px;
          margin-left: 156px;
        }

        .bar-legend span {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .active-dot {
          background: #00ff88;
        }

        .inactive-dot {
          background: #ff6b6b;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          min-height: 300px;
        }

        .spinner {
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

        @media (max-width: 768px) {
          .bar-item {
            flex-wrap: wrap;
          }
          .bar-item > span:first-child {
            width: 100%;
          }
          .bar-legend {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
}
