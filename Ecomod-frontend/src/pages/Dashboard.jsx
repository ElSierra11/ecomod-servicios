import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
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
import {
  ShoppingBag,
  Tag,
  Package,
  ClipboardList,
  CreditCard,
  DollarSign,
  Truck,
  Server,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Zap,
  Shield,
  Activity,
  Cpu,
  Network,
  Sparkles,
  Gauge,
  Layers,
  Bell,
  ShoppingCart,
} from "lucide-react";

const SVC_LIST = [
  {
    key: "auth",
    label: "Auth Service",
    desc: "JWT · bcrypt · Tokens",
    port: "8002",
    icon: Shield,
    color: "#00b894",
    gradient: "linear-gradient(135deg, #00b894, #009379)",
  },
  {
    key: "catalog",
    label: "Catalog Service",
    desc: "Productos · Categorías",
    port: "8003",
    icon: ShoppingBag,
    color: "#0984e3",
    gradient: "linear-gradient(135deg, #0984e3, #0066b3)",
  },
  {
    key: "inventory",
    label: "Inventory Service",
    desc: "Stock · Reservas",
    port: "8004",
    icon: Package,
    color: "#e17055",
    gradient: "linear-gradient(135deg, #e17055, #c4452c)",
  },
  {
    key: "cart",
    label: "Cart Service",
    desc: "Carrito · Tokens anónimos",
    port: "8005",
    icon: ShoppingCart,
    color: "#a29bfe",
    gradient: "linear-gradient(135deg, #a29bfe, #6c5ce7)",
  },
  {
    key: "orders",
    label: "Order Service",
    desc: "Saga · Órdenes",
    port: "8006",
    icon: ClipboardList,
    color: "#fdcb6e",
    gradient: "linear-gradient(135deg, #fdcb6e, #f39c12)",
  },
  {
    key: "payments",
    label: "Payment Service",
    desc: "Stripe · Transacciones",
    port: "8007",
    icon: CreditCard,
    color: "#00cec9",
    gradient: "linear-gradient(135deg, #00cec9, #00a8a3)",
  },
  {
    key: "shipping",
    label: "Shipping Service",
    desc: "Envíos · Logística",
    port: "8008",
    icon: Truck,
    color: "#74b9ff",
    gradient: "linear-gradient(135deg, #74b9ff, #3b82f6)",
  },
  {
    key: "notifications",
    label: "Notification Service",
    desc: "Email · Eventos",
    port: "8009",
    icon: Bell,
    color: "#fd79a8",
    gradient: "linear-gradient(135deg, #fd79a8, #e84393)",
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    products: 7,
    categories: 5,
    inventory: 9,
    orders: 23,
    ordersConfirmed: 18,
    ordersShipped: 12,
    payments: 8,
    paymentsTotal: 1590000,
    shipments: 2,
    notifications: 45,
  });
  const [services, setServices] = useState(
    Object.fromEntries(SVC_LIST.map((s) => [s.key, true])),
  );
  const [hoveredStat, setHoveredStat] = useState(null);
  const [hoveredService, setHoveredService] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState("week");

  const onlineCount = Object.values(services).filter((v) => v === true).length;
  const isDark = theme === "dark";

  const statCards = [
    {
      icon: ShoppingBag,
      label: "Productos",
      value: stats.products,
      trend: "+12%",
      color: isDark ? "#00ff88" : "#00b894",
    },
    {
      icon: Tag,
      label: "Categorías",
      value: stats.categories,
      trend: "+3",
      color: isDark ? "#00d4ff" : "#0984e3",
    },
    {
      icon: Package,
      label: "Items en stock",
      value: stats.inventory,
      trend: "-5%",
      color: isDark ? "#ff6b6b" : "#e17055",
    },
    {
      icon: ClipboardList,
      label: "Mis órdenes",
      value: stats.orders,
      trend: "+8",
      color: isDark ? "#fbbf24" : "#fdcb6e",
    },
    {
      icon: CreditCard,
      label: "Pagos exitosos",
      value: stats.payments,
      trend: "+4",
      color: isDark ? "#34d399" : "#00cec9",
    },
    {
      icon: DollarSign,
      label: "Total pagado",
      value: `$${stats.paymentsTotal.toLocaleString()}`,
      trend: "+$320K",
      color: isDark ? "#c084fc" : "#a29bfe",
    },
    {
      icon: Truck,
      label: "Envíos",
      value: stats.shipments,
      trend: "+2",
      color: isDark ? "#60a5fa" : "#74b9ff",
    },
    {
      icon: Server,
      label: "Microservicios",
      value: `${onlineCount}/8`,
      trend: "100%",
      color:
        onlineCount === 8
          ? isDark
            ? "#00ff88"
            : "#00b894"
          : isDark
            ? "#fbbf24"
            : "#fdcb6e",
    },
  ];

  // Datos del gráfico
  const chartData = [12, 19, 15, 27, 22, 34, 42, 38, 45, 52, 48, 58];

  return (
    <div
      className={`dashboard-modern ${isDark ? "dark-theme" : "light-theme"}`}
    >
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <div className="dashboard-badge">
            <Sparkles size={14} />
            <span>REAL-TIME DASHBOARD</span>
          </div>
          <h1 className="dashboard-title">
            Panel de Control
            <span className="dashboard-title-glow">Microservices</span>
          </h1>
          <p className="dashboard-subtitle">
            {new Date().toLocaleDateString("es-ES", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="dashboard-header-right">
          <div className="timeframe-selector">
            <button
              className={`tf-btn ${selectedTimeframe === "day" ? "active" : ""}`}
              onClick={() => setSelectedTimeframe("day")}
            >
              Día
            </button>
            <button
              className={`tf-btn ${selectedTimeframe === "week" ? "active" : ""}`}
              onClick={() => setSelectedTimeframe("week")}
            >
              Semana
            </button>
            <button
              className={`tf-btn ${selectedTimeframe === "month" ? "active" : ""}`}
              onClick={() => setSelectedTimeframe("month")}
            >
              Mes
            </button>
          </div>
          <button className="refresh-button" onClick={() => {}}>
            <RefreshCw size={16} />
            <span>Sincronizar</span>
          </button>
          <div className="system-status">
            <div className="status-pulse"></div>
            <span>Sistema Operacional</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((stat, idx) => (
          <div
            key={stat.label}
            className="stat-card"
            onMouseEnter={() => setHoveredStat(idx)}
            onMouseLeave={() => setHoveredStat(null)}
            style={{
              "--card-color": stat.color,
              transform:
                hoveredStat === idx ? "translateY(-6px)" : "translateY(0)",
            }}
          >
            <div className="stat-glow" style={{ background: stat.color }}></div>
            <div
              className="stat-icon"
              style={{ background: `${stat.color}15`, color: stat.color }}
            >
              <stat.icon size={24} strokeWidth={1.5} />
            </div>
            <div className="stat-content">
              <span className="stat-label">{stat.label}</span>
              <div className="stat-value-wrapper">
                <span className="stat-value">{stat.value}</span>
                <span
                  className={`stat-trend ${stat.trend.startsWith("+") ? "positive" : stat.trend.startsWith("-") ? "negative" : ""}`}
                >
                  {stat.trend}
                  {stat.trend.startsWith("+") && <TrendingUp size={10} />}
                  {stat.trend.startsWith("-") && <TrendingDown size={10} />}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="main-grid">
        {/* Gráfico de actividad */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <Activity size={18} />
              <span>Actividad de Microservicios</span>
            </div>
            <div className="chart-legend">
              <div
                className="legend-dot"
                style={{ background: isDark ? "#00ff88" : "#00b894" }}
              />
              <span>Requests (últimas 12h)</span>
            </div>
          </div>
          <div className="chart">
            {chartData.map((value, idx) => (
              <div key={idx} className="chart-bar-container">
                <div
                  className="chart-bar"
                  style={{
                    height: `${(value / 60) * 100}%`,
                    background: `linear-gradient(180deg, ${isDark ? "#00ff88" : "#00b894"}, ${isDark ? "#00d4ff" : "#0984e3"})`,
                    animationDelay: `${idx * 0.05}s`,
                  }}
                />
                <span className="chart-label">{idx + 1}h</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="activity-card">
          <div className="activity-header">
            <Zap size={18} />
            <span>Actividad en Tiempo Real</span>
            <div className="live-badge">
              <div className="live-dot"></div>
              LIVE
            </div>
          </div>
          <div className="activity-list">
            {[
              {
                icon: ShoppingBag,
                action: "Nuevo producto agregado",
                time: "Hace 2 min",
                color: isDark ? "#00ff88" : "#00b894",
              },
              {
                icon: CreditCard,
                action: "Pago procesado #ORD-2341",
                time: "Hace 5 min",
                color: isDark ? "#34d399" : "#00cec9",
              },
              {
                icon: Package,
                action: "Stock actualizado - SKU: PROD-001",
                time: "Hace 12 min",
                color: isDark ? "#ff6b6b" : "#e17055",
              },
              {
                icon: Truck,
                action: "Envío confirmado #SHIP-892",
                time: "Hace 18 min",
                color: isDark ? "#60a5fa" : "#74b9ff",
              },
              {
                icon: Bell,
                action: "Notificación enviada al usuario",
                time: "Hace 25 min",
                color: isDark ? "#f472b6" : "#fd79a8",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="activity-item"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div
                  className="activity-icon"
                  style={{ background: `${item.color}15`, color: item.color }}
                >
                  <item.icon size={14} />
                </div>
                <div className="activity-info">
                  <span className="activity-action">{item.action}</span>
                  <span className="activity-time">{item.time}</span>
                </div>
                <div className="activity-arrow">
                  <ArrowRight size={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Microservicios */}
      <div className="services-section">
        <div className="section-header">
          <div className="section-title">
            <Cpu size={20} />
            <span>Microservicios</span>
            <div className="service-stats">
              <span className="online-count">{onlineCount}</span>
              <span className="total-count">/8</span>
              <span className="online-text">Operacionales</span>
            </div>
          </div>
          <div className="service-progress">
            <div
              className="progress-bar"
              style={{ width: `${(onlineCount / 8) * 100}%` }}
            />
          </div>
        </div>

        <div className="services-grid">
          {SVC_LIST.map((service) => {
            const isOnline = services[service.key];
            const Icon = service.icon;
            return (
              <div
                key={service.key}
                className={`service-card ${isOnline ? "online" : "offline"}`}
                onMouseEnter={() => setHoveredService(service.key)}
                onMouseLeave={() => setHoveredService(null)}
                style={{
                  "--service-color": service.color,
                  transform:
                    hoveredService === service.key
                      ? "translateY(-4px)"
                      : "translateY(0)",
                }}
              >
                <div
                  className="service-glow"
                  style={{ background: service.gradient }}
                />
                <div className="service-header">
                  <div
                    className="service-icon"
                    style={{
                      background: `${service.color}15`,
                      color: service.color,
                    }}
                  >
                    <Icon size={22} />
                  </div>
                  <div
                    className={`service-status ${isOnline ? "online" : "offline"}`}
                  >
                    {isOnline ? (
                      <CheckCircle size={10} />
                    ) : (
                      <XCircle size={10} />
                    )}
                  </div>
                </div>
                <div className="service-body">
                  <h4 className="service-name">{service.label}</h4>
                  <p className="service-desc">{service.desc}</p>
                  <div className="service-footer">
                    <code className="service-port">{service.port}</code>
                    <div className="service-latency">
                      <Gauge size={10} />
                      <span>{Math.floor(Math.random() * 50) + 10}ms</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Flujo de saga */}
      <div className="saga-section">
        <div className="section-header">
          <div className="section-title">
            <Layers size={20} />
            <span>Saga Coreografiada</span>
            <div className="saga-badge">EVENT-DRIVEN</div>
          </div>
        </div>

        <div className="saga-flow">
          {[
            {
              step: "01",
              label: "Cart",
              sub: "Cart Service",
              icon: ShoppingCart,
              color: isDark ? "#c084fc" : "#a29bfe",
              status: "completed",
            },
            {
              step: "02",
              label: "Order",
              sub: "Order Service",
              icon: ClipboardList,
              color: isDark ? "#fbbf24" : "#fdcb6e",
              status: "completed",
            },
            {
              step: "03",
              label: "Inventory",
              sub: "Inventory Service",
              icon: Package,
              color: isDark ? "#ff6b6b" : "#e17055",
              status: "active",
            },
            {
              step: "04",
              label: "Payment",
              sub: "Payment Service",
              icon: CreditCard,
              color: isDark ? "#34d399" : "#00cec9",
              status: "pending",
            },
            {
              step: "05",
              label: "Shipping",
              sub: "Shipping Service",
              icon: Truck,
              color: isDark ? "#60a5fa" : "#74b9ff",
              status: "pending",
            },
            {
              step: "06",
              label: "Notify",
              sub: "Notification Service",
              icon: Bell,
              color: isDark ? "#f472b6" : "#fd79a8",
              status: "pending",
            },
          ].map((step, idx) => (
            <div key={step.step} className="saga-step">
              <div
                className={`saga-circle ${step.status}`}
                style={{ borderColor: step.color }}
              >
                <step.icon size={18} style={{ color: step.color }} />
              </div>
              <div className="saga-content">
                <span className="saga-number">{step.step}</span>
                <span className="saga-label">{step.label}</span>
                <span className="saga-sub">{step.sub}</span>
              </div>
              {idx < 5 && (
                <div className="saga-connector">
                  <div className="connector-line"></div>
                  <ArrowRight size={14} className="connector-icon" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .dashboard-modern {
          min-height: 100vh;
          padding: 24px;
          transition: all 0.3s ease;
        }

        /*  MODO OSCURO  */
        .dashboard-modern.dark-theme {
          background: linear-gradient(135deg, #0a0a0f, #0f0f1a);
        }

        .dark-theme .dashboard-header,
        .dark-theme .chart-card,
        .dark-theme .activity-card,
        .dark-theme .service-card,
        .dark-theme .saga-flow {
          background: rgba(18, 18, 28, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 255, 136, 0.15);
        }

        .dark-theme .dashboard-badge {
          background: rgba(0, 255, 136, 0.1);
          border: 1px solid rgba(0, 255, 136, 0.3);
          color: #00ff88;
        }

        .dark-theme .dashboard-title {
          background: linear-gradient(135deg, #fff, #00ff88);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .dark-theme .tf-btn.active {
          background: #00ff88;
          color: #000;
        }

        .dark-theme .refresh-button {
          background: rgba(0, 255, 136, 0.1);
          border: 1px solid rgba(0, 255, 136, 0.3);
          color: #00ff88;
        }

        .dark-theme .status-pulse {
          background: #00ff88;
          box-shadow: 0 0 10px #00ff88;
        }

        .dark-theme .stat-card {
          background: rgba(18, 18, 28, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 255, 136, 0.15);
        }

        .dark-theme .stat-value {
          background: linear-gradient(135deg, #fff, var(--card-color));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .dark-theme .stat-trend.positive {
          background: rgba(0, 255, 136, 0.15);
          color: #00ff88;
        }

        .dark-theme .stat-trend.negative {
          background: rgba(255, 107, 107, 0.15);
          color: #ff6b6b;
        }

        .dark-theme .live-badge {
          background: rgba(255, 107, 107, 0.15);
          color: #ff6b6b;
        }

        .dark-theme .service-card {
          border: 1px solid rgba(0, 255, 136, 0.15);
        }

        .dark-theme .service-status.online {
          background: rgba(0, 255, 136, 0.15);
          color: #00ff88;
        }

        .dark-theme .service-latency {
          color: #00ff88;
        }

        .dark-theme .saga-badge {
          background: rgba(0, 255, 136, 0.1);
          color: #00ff88;
        }

        .dark-theme .saga-circle.completed {
          background: rgba(0, 255, 136, 0.1);
          box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
        }

        /* ==================== MODO CLARO PREMIUM ==================== */
        .dashboard-modern.light-theme {
          background: linear-gradient(135deg, #f5f7fa 0%, #eef2f7 100%);
        }

        .light-theme .dashboard-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 184, 148, 0.15);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        }

        .light-theme .dashboard-badge {
          background: rgba(0, 184, 148, 0.08);
          border: 1px solid rgba(0, 184, 148, 0.2);
          color: #00b894;
        }

        .light-theme .dashboard-title {
          background: linear-gradient(135deg, #1a1a2e, #00b894);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .light-theme .dashboard-subtitle {
          color: #6c757d;
        }

        .light-theme .timeframe-selector {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
        }

        .light-theme .tf-btn {
          color: #6c757d;
        }

        .light-theme .tf-btn.active {
          background: #00b894;
          color: #fff;
          box-shadow: 0 2px 8px rgba(0, 184, 148, 0.3);
        }

        .light-theme .refresh-button {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          color: #495057;
        }

        .light-theme .refresh-button:hover {
          background: #00b894;
          border-color: #00b894;
          color: #fff;
        }

        .light-theme .system-status {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          color: #495057;
        }

        .light-theme .status-pulse {
          background: #00b894;
          box-shadow: 0 0 8px #00b894;
        }

        .light-theme .stat-card {
          background: #ffffff;
          border: 1px solid #e9ecef;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .light-theme .stat-card:hover {
          box-shadow: 0 8px 30px rgba(0, 184, 148, 0.12);
          border-color: rgba(0, 184, 148, 0.3);
        }

        .light-theme .stat-label {
          color: #6c757d;
        }

        .light-theme .stat-value {
          background: linear-gradient(135deg, #1a1a2e, var(--card-color));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .light-theme .stat-trend.positive {
          background: rgba(0, 184, 148, 0.1);
          color: #00b894;
        }

        .light-theme .stat-trend.negative {
          background: rgba(225, 112, 85, 0.1);
          color: #e17055;
        }

        .light-theme .chart-card,
        .light-theme .activity-card {
          background: #ffffff;
          border: 1px solid #e9ecef;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .light-theme .chart-title,
        .light-theme .activity-header {
          color: #1a1a2e;
        }

        .light-theme .chart-legend span,
        .light-theme .chart-label {
          color: #6c757d;
        }

        .light-theme .activity-item {
          background: #f8f9fa;
        }

        .light-theme .activity-item:hover {
          background: rgba(0, 184, 148, 0.05);
        }

        .light-theme .activity-action {
          color: #1a1a2e;
        }

        .light-theme .activity-time {
          color: #adb5bd;
        }

        .light-theme .live-badge {
          background: rgba(225, 112, 85, 0.1);
          color: #e17055;
        }

        .light-theme .service-card {
          background: #ffffff;
          border: 1px solid #e9ecef;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .light-theme .service-card:hover {
          box-shadow: 0 8px 25px rgba(0, 184, 148, 0.1);
          border-color: rgba(0, 184, 148, 0.2);
        }

        .light-theme .service-name {
          color: #1a1a2e;
        }

        .light-theme .service-desc {
          color: #6c757d;
        }

        .light-theme .service-port {
          background: #f8f9fa;
          color: #6c757d;
        }

        .light-theme .service-status.online {
          background: rgba(0, 184, 148, 0.1);
          color: #00b894;
        }

        .light-theme .service-latency {
          color: #00b894;
        }

        .light-theme .saga-flow {
          background: #ffffff;
          border: 1px solid #e9ecef;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .light-theme .saga-number {
          color: #adb5bd;
        }

        .light-theme .saga-label {
          color: #1a1a2e;
        }

        .light-theme .saga-sub {
          color: #6c757d;
        }

        .light-theme .saga-badge {
          background: rgba(0, 184, 148, 0.1);
          color: #00b894;
        }

        .light-theme .saga-circle.completed {
          background: rgba(0, 184, 148, 0.08);
          box-shadow: 0 0 15px rgba(0, 184, 148, 0.2);
        }

        .light-theme .connector-line {
          background: linear-gradient(90deg, #dee2e6, transparent);
        }

        .light-theme .connector-icon {
          color: #adb5bd;
        }

        .light-theme .section-title {
          color: #1a1a2e;
        }

        .light-theme .online-count {
          color: #00b894;
        }

        .light-theme .total-count,
        .light-theme .online-text {
          color: #6c757d;
        }

        .light-theme .service-progress {
          background: #e9ecef;
        }

        .light-theme .progress-bar {
          background: linear-gradient(90deg, #00b894, #0984e3);
        }

        /* ==================== ESTILOS COMPARTIDOS ==================== */
        .dashboard-header {
          border-radius: 24px;
          padding: 24px 28px;
          margin-bottom: 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }

        .dashboard-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
          margin-bottom: 16px;
        }

        .dashboard-title {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .dashboard-title-glow {
          display: block;
          font-size: 14px;
          opacity: 0.7;
          margin-top: 4px;
        }

        .dashboard-subtitle {
          font-size: 13px;
        }

        .dashboard-header-right {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .timeframe-selector {
          display: flex;
          gap: 4px;
          padding: 4px;
          border-radius: 12px;
        }

        .tf-btn {
          padding: 6px 16px;
          background: transparent;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .refresh-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          border-radius: 40px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
        }

        .system-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 40px;
          font-size: 12px;
        }

        .status-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 28px;
        }

        .stat-card {
          position: relative;
          border-radius: 20px;
          padding: 20px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          overflow: hidden;
        }

        .stat-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          opacity: 0.6;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .stat-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .stat-value-wrapper {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-top: 8px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 800;
        }

        .stat-trend {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 20px;
        }

        .main-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 20px;
          margin-bottom: 28px;
        }

        .chart-card,
        .activity-card {
          border-radius: 20px;
          padding: 24px;
          transition: all 0.3s;
        }

        .chart-header,
        .activity-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          font-size: 14px;
          font-weight: 600;
        }

        .chart-legend {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
          font-size: 11px;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .chart {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          height: 200px;
        }

        .chart-bar-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          height: 100%;
        }

        .chart-bar {
          width: 100%;
          min-height: 4px;
          border-radius: 4px;
          transition: height 0.5s ease;
          animation: barRise 0.6s ease-out;
        }

        @keyframes barRise {
          from {
            height: 0;
          }
          to {
            height: var(--target-height);
          }
        }

        .chart-label {
          font-size: 10px;
        }

        .live-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: auto;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
        }

        .live-dot {
          width: 6px;
          height: 6px;
          background: #e17055;
          border-radius: 50%;
          animation: pulse 1s infinite;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 12px;
          transition: all 0.3s;
          animation: slideIn 0.4s ease-out forwards;
          opacity: 0;
          transform: translateX(-10px);
        }

        @keyframes slideIn {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .activity-icon {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .activity-info {
          flex: 1;
        }

        .activity-action {
          display: block;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 2px;
        }

        .activity-time {
          font-size: 10px;
        }

        .activity-arrow {
          opacity: 0;
          transition: opacity 0.3s;
        }

        .activity-item:hover .activity-arrow {
          opacity: 1;
        }

        .services-section,
        .saga-section {
          margin-bottom: 32px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          font-weight: 700;
        }

        .service-stats {
          margin-left: 12px;
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .online-count {
          font-size: 20px;
          font-weight: 800;
        }

        .total-count {
          font-size: 14px;
        }

        .online-text {
          font-size: 11px;
          margin-left: 6px;
        }

        .service-progress {
          width: 200px;
          height: 4px;
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 20px;
        }

        .service-card {
          position: relative;
          border-radius: 20px;
          padding: 20px;
          transition: all 0.3s;
          overflow: hidden;
        }

        .service-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100%;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .service-card:hover .service-glow {
          opacity: 0.05;
        }

        .service-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .service-icon {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .service-status {
          width: 24px;
          height: 24px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .service-name {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .service-desc {
          font-size: 11px;
          margin-bottom: 16px;
        }

        .service-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .service-port {
          font-size: 10px;
          font-family: monospace;
          padding: 2px 8px;
          border-radius: 6px;
        }

        .service-latency {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
        }

        .saga-flow {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          border-radius: 20px;
          padding: 32px;
        }

        .saga-step {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
          min-width: 120px;
        }

        .saga-circle {
          width: 56px;
          height: 56px;
          border-radius: 28px;
          border: 2px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }

        .saga-circle.active {
          animation: pulseGlow 2s infinite;
        }

        @keyframes pulseGlow {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(0, 184, 148, 0.4);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(0, 184, 148, 0);
          }
        }

        .saga-content {
          display: flex;
          flex-direction: column;
        }

        .saga-number {
          font-size: 10px;
          font-weight: 600;
        }

        .saga-label {
          font-size: 14px;
          font-weight: 700;
        }

        .saga-sub {
          font-size: 10px;
        }

        .saga-connector {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .connector-line {
          width: 40px;
          height: 1px;
        }

        .saga-badge {
          margin-left: 12px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
        }

        @media (max-width: 1024px) {
          .main-grid {
            grid-template-columns: 1fr;
          }
          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .dashboard-modern {
            padding: 16px;
          }
          .saga-flow {
            flex-direction: column;
          }
          .saga-connector {
            transform: rotate(90deg);
            margin: 8px 0;
          }
        }
      `}</style>
    </div>
  );
}
