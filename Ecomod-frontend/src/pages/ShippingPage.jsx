import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { shippingApi, ordersApi } from "../services/api";
import {
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  X,
  DollarSign,
  Calendar,
  Search,
  Navigation,
  Phone,
  Mail,
  Building2,
  Hash,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Star,
  Shield,
  Zap,
  Send,
  User,
  CreditCard,
  AlertTriangle,
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
    bg: "rgba(245,158,11,.1)",
    border: "rgba(245,158,11,.2)",
    next: "processing",
    nextLabel: "Procesar",
    step: 1,
  },
  processing: {
    label: "Procesando",
    icon: Package,
    color: "#3b82f6",
    bg: "rgba(59,130,246,.1)",
    border: "rgba(59,130,246,.2)",
    next: "shipped",
    nextLabel: "Enviar",
    step: 2,
  },
  shipped: {
    label: "Enviado",
    icon: Truck,
    color: "#8b5cf6",
    bg: "rgba(139,92,246,.1)",
    border: "rgba(139,92,246,.2)",
    next: "in_transit",
    nextLabel: "En tránsito",
    step: 3,
  },
  in_transit: {
    label: "En tránsito",
    icon: Navigation,
    color: "#06b6d4",
    bg: "rgba(6,182,212,.1)",
    border: "rgba(6,182,212,.2)",
    next: "delivered",
    nextLabel: "Entregar",
    step: 4,
  },
  delivered: {
    label: "Entregado",
    icon: CheckCircle,
    color: "#10b981",
    bg: "rgba(16,185,129,.1)",
    border: "rgba(16,185,129,.2)",
    next: null,
    nextLabel: null,
    step: 5,
  },
  returned: {
    label: "Devuelto",
    icon: XCircle,
    color: "#dc2626",
    bg: "rgba(220,38,38,.1)",
    border: "rgba(220,38,38,.2)",
    next: null,
    nextLabel: null,
    step: 0,
  },
  cancelled: {
    label: "Cancelado",
    icon: AlertTriangle,
    color: "#6b7280",
    bg: "rgba(107,114,128,.1)",
    border: "rgba(107,114,128,.2)",
    next: null,
    nextLabel: null,
    step: 0,
  },
};

const DEPARTMENTS = [
  "Bogotá",
  "Antioquia",
  "Valle del Cauca",
  "Atlántico",
  "Bolívar",
  "Cundinamarca",
  "Santander",
  "Córdoba",
  "Nariño",
  "Meta",
  "Risaralda",
  "Caldas",
  "Quindío",
  "Boyacá",
  "Tolima",
  "Huila",
  "Cesar",
  "Magdalena",
];

const CARRIERS = [
  {
    id: "servientrega",
    name: "Servientrega",
    icon: Truck,
    color: "#f97316",
    gradient: "linear-gradient(135deg, #f97316, #ea580c)",
  },
  {
    id: "interrapidisimo",
    name: "Interrapidísimo",
    icon: Package,
    color: "#8b5cf6",
    gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  },
  {
    id: "coordinadora",
    name: "Coordinadora",
    icon: Truck,
    color: "#ec4899",
    gradient: "linear-gradient(135deg, #ec4899, #db2777)",
  },
  {
    id: "tcc",
    name: "TCC",
    icon: Package,
    color: "#06b6d4",
    gradient: "linear-gradient(135deg, #06b6d4, #0891b2)",
  },
  {
    id: "deprisa",
    name: "Deprisa",
    icon: Truck,
    color: "#10b981",
    gradient: "linear-gradient(135deg, #10b981, #059669)",
  },
];

export default function ShippingPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [shipments, setShipments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [cost, setCost] = useState(null);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState({
    order_id: "",
    recipient_name: "",
    address: "",
    city: "",
    department: "Bogotá",
    carrier: "servientrega",
    postal_code: "",
    country: "Colombia",
    phone: "",
    email: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sh, ords] = await Promise.all([
        shippingApi.getByUser(user.id),
        ordersApi.getByUser(user.id),
      ]);
      setShipments(sh);
      setOrders(
        ords.filter((o) =>
          ["shipped", "confirmed", "completed"].includes(o.status),
        ),
      );
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCalcCost = async () => {
    if (!form.department) return;
    try {
      const result = await shippingApi.calculateCost(
        form.department,
        form.carrier,
      );
      setCost(result);
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setMsg(null);
    try {
      const shipment = await shippingApi.create({
        ...form,
        order_id: parseInt(form.order_id),
        user_id: user.id,
        carrier:
          CARRIERS.find((c) => c.id === form.carrier)?.name || form.carrier,
      });
      setMsg({
        type: "success",
        text: `¡Envío creado! Tracking: ${shipment.tracking_number}`,
      });
      setShowForm(false);
      setCost(null);
      setForm({
        order_id: "",
        recipient_name: "",
        address: "",
        city: "",
        department: "Bogotá",
        carrier: "servientrega",
        postal_code: "",
        country: "Colombia",
        phone: "",
        email: "",
      });
      await loadData();
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await shippingApi.updateStatus(id, status);
      await loadData();
      setMsg({ type: "success", text: "Estado actualizado correctamente" });
      setTimeout(() => setMsg(null), 3000);
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    }
  };

  const stats = {
    total: shipments.length,
    pending: shipments.filter((s) => s.status === "pending").length,
    inTransit: shipments.filter((s) =>
      ["shipped", "in_transit"].includes(s.status),
    ).length,
    delivered: shipments.filter((s) => s.status === "delivered").length,
  };

  const filteredShipments = shipments.filter((s) => {
    const matchesSearch =
      !searchTerm ||
      s.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(s.id).includes(searchTerm);
    const matchesStatus = !statusFilter || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeStatuses = [...new Set(shipments.map((s) => s.status))];

  if (loading) {
    return (
      <div className="sp-loading">
        <div className="sp-spinner" />
        <span>Cargando envíos...</span>
        <div className="sp-loading-dots">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  return (
    <div className={`sp-root ${isDark ? "dark" : ""}`}>
      {/* ══ HEADER ══ */}
      <div className="sp-header">
        <div className="sp-header-left">
          <div className="sp-badge">
            <Truck size={14} strokeWidth={2.5} />
            <span>GESTIÓN DE ENVÍOS</span>
          </div>
          <h1 className="sp-title">
            Envíos y Logística
            <span>Seguimiento y gestión de tus pedidos en tiempo real</span>
          </h1>
        </div>
        <div className="sp-header-right">
          <button className="sp-btn-refresh" onClick={loadData}>
            <RefreshCw size={14} strokeWidth={2} />
            <span>Actualizar</span>
          </button>
          <button
            className={`sp-btn-create ${showForm ? "active" : ""}`}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? (
              <X size={16} strokeWidth={2.5} />
            ) : (
              <Plus size={16} strokeWidth={2.5} />
            )}
            <span>{showForm ? "Cancelar" : "Crear envío"}</span>
          </button>
        </div>
      </div>

      {/* ══ ALERT ══ */}
      {msg && (
        <div className={`sp-alert ${msg.type}`}>
          {msg.type === "success" ? (
            <CheckCircle size={18} strokeWidth={2.5} />
          ) : (
            <XCircle size={18} strokeWidth={2.5} />
          )}
          <span>{msg.text}</span>
          <button className="sp-alert-close" onClick={() => setMsg(null)}>
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* ══ STATS ══ */}
      {shipments.length > 0 && (
        <div className="sp-stats">
          {[
            {
              icon: Package,
              label: "Total envíos",
              value: stats.total,
              color: "#e8291c",
              bg: "rgba(232,41,28,.1)",
              trend: "registrados",
            },
            {
              icon: Clock,
              label: "Pendientes",
              value: stats.pending,
              color: "#f59e0b",
              bg: "rgba(245,158,11,.1)",
              trend: "por procesar",
            },
            {
              icon: Navigation,
              label: "En tránsito",
              value: stats.inTransit,
              color: "#3b82f6",
              bg: "rgba(59,130,246,.1)",
              trend: "activos",
            },
            {
              icon: CheckCircle,
              label: "Entregados",
              value: stats.delivered,
              color: "#10b981",
              bg: "rgba(16,185,129,.1)",
              trend: "completados",
            },
          ].map(({ icon: Icon, label, value, color, bg, trend }, i) => (
            <div
              key={label}
              className="sp-stat"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="sp-stat-icon" style={{ background: bg, color }}>
                <Icon size={22} strokeWidth={2} />
              </div>
              <div className="sp-stat-body">
                <span className="sp-stat-label">{label}</span>
                <span className="sp-stat-value" style={{ color }}>
                  {value}
                </span>
                <span className="sp-stat-trend">{trend}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ CREATE FORM ══ */}
      {showForm && (
        <div className="sp-form-card">
          <div className="sp-form-header">
            <div>
              <h3>
                <Send
                  size={18}
                  strokeWidth={2.5}
                  style={{ color: "#e8291c" }}
                />
                Nuevo envío
              </h3>
              <p>Completa los datos para generar un nuevo envío</p>
            </div>
          </div>

          <form onSubmit={handleCreate}>
            <div className="sp-form-grid">
              <div className="sp-form-group">
                <label>Orden a enviar *</label>
                <div className="sp-select-wrap">
                  <Package size={14} strokeWidth={2} />
                  <select
                    value={form.order_id}
                    onChange={(e) =>
                      setForm({ ...form, order_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Selecciona una orden</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        Orden #{o.id} — {formatCOP(o.total_amount || 0)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sp-form-group">
                <label>Destinatario *</label>
                <div className="sp-input-wrap">
                  <User size={14} strokeWidth={2} />
                  <input
                    value={form.recipient_name}
                    onChange={(e) =>
                      setForm({ ...form, recipient_name: e.target.value })
                    }
                    placeholder="Nombre completo"
                    required
                  />
                </div>
              </div>

              <div className="sp-form-group full-width">
                <label>Dirección de entrega *</label>
                <div className="sp-input-wrap">
                  <MapPin size={14} strokeWidth={2} />
                  <input
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    placeholder="Calle 123 # 45-67, Apto 301"
                    required
                  />
                </div>
              </div>

              <div className="sp-form-group">
                <label>Ciudad *</label>
                <div className="sp-input-wrap">
                  <Building2 size={14} strokeWidth={2} />
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Bogotá"
                    required
                  />
                </div>
              </div>

              <div className="sp-form-group">
                <label>Departamento *</label>
                <div className="sp-select-wrap">
                  <MapPin size={14} strokeWidth={2} />
                  <select
                    value={form.department}
                    onChange={(e) => {
                      setForm({ ...form, department: e.target.value });
                      setCost(null);
                    }}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sp-form-group full-width">
                <label>Transportista</label>
                <div className="sp-carriers">
                  {CARRIERS.map((c) => {
                    const Icon = c.icon;
                    const isActive = form.carrier === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={`sp-carrier-btn ${isActive ? "active" : ""}`}
                        onClick={() => {
                          setForm({ ...form, carrier: c.id });
                          setCost(null);
                        }}
                        style={{
                          borderColor: isActive ? c.color : undefined,
                          background: isActive ? `${c.color}10` : undefined,
                        }}
                      >
                        <div
                          className="sp-carrier-icon"
                          style={{ background: c.gradient }}
                        >
                          <Icon size={16} color="#fff" strokeWidth={2} />
                        </div>
                        <span>{c.name}</span>
                        {isActive && (
                          <CheckCircle
                            size={14}
                            color={c.color}
                            strokeWidth={2.5}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="sp-form-group">
                <label>Teléfono de contacto</label>
                <div className="sp-input-wrap">
                  <Phone size={14} strokeWidth={2} />
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="300 123 4567"
                  />
                </div>
              </div>

              <div className="sp-form-group">
                <label>Correo electrónico</label>
                <div className="sp-input-wrap">
                  <Mail size={14} strokeWidth={2} />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="cliente@email.com"
                  />
                </div>
              </div>

              <div className="sp-form-group">
                <label>Código postal</label>
                <div className="sp-input-wrap">
                  <Hash size={14} strokeWidth={2} />
                  <input
                    value={form.postal_code}
                    onChange={(e) =>
                      setForm({ ...form, postal_code: e.target.value })
                    }
                    placeholder="110111"
                  />
                </div>
              </div>
            </div>

            {/* Cost Calculator */}
            <div className="sp-cost-section">
              <button
                type="button"
                className="sp-calc-btn"
                onClick={handleCalcCost}
              >
                <DollarSign size={16} strokeWidth={2} />
                Calcular costo de envío
              </button>
              {cost && (
                <div className="sp-cost-result">
                  <div className="sp-cost-item">
                    <span className="sp-cost-label">Costo estimado</span>
                    <span className="sp-cost-value">
                      {formatCOP(cost.cost || 0)}
                    </span>
                  </div>
                  <div className="sp-cost-divider" />
                  <div className="sp-cost-item">
                    <span className="sp-cost-label">Tiempo estimado</span>
                    <span className="sp-cost-days">
                      <Clock size={14} strokeWidth={2} />
                      {cost.estimated_days} días hábiles
                    </span>
                  </div>
                  <div className="sp-cost-divider" />
                  <div className="sp-cost-item">
                    <span className="sp-cost-label">Transportista</span>
                    <span className="sp-cost-carrier">
                      {CARRIERS.find((c) => c.id === form.carrier)?.name}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="sp-form-actions">
              <button
                type="button"
                className="sp-btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="sp-btn-primary"
                disabled={creating}
              >
                {creating ? (
                  <span className="sp-btn-spinner" />
                ) : (
                  <>
                    <Truck size={16} strokeWidth={2} />
                    Crear envío
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══ FILTERS & SEARCH ══ */}
      {shipments.length > 0 && (
        <div className="sp-filters">
          <div className="sp-search-box">
            <Search size={16} strokeWidth={2} />
            <input
              type="text"
              placeholder="Buscar por tracking, destinatario o # de envío..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")}>
                <X size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>

          <div className="sp-status-filters">
            <button
              className={`sp-status-pill ${!statusFilter ? "active" : ""}`}
              onClick={() => setStatusFilter("")}
            >
              <Zap size={12} strokeWidth={2.5} />
              Todos
              <span>{shipments.length}</span>
            </button>
            {activeStatuses.map((status) => {
              const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
              const count = shipments.filter((s) => s.status === status).length;
              return (
                <button
                  key={status}
                  className={`sp-status-pill ${statusFilter === status ? "active" : ""}`}
                  onClick={() =>
                    setStatusFilter(statusFilter === status ? "" : status)
                  }
                  style={{
                    background: statusFilter === status ? config.bg : undefined,
                    borderColor:
                      statusFilter === status ? config.border : undefined,
                    color: statusFilter === status ? config.color : undefined,
                  }}
                >
                  <config.icon size={12} strokeWidth={2.5} />
                  {config.label}
                  <span
                    style={{
                      background:
                        statusFilter === status
                          ? `${config.color}20`
                          : undefined,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ SHIPMENTS LIST ══ */}
      <div className="sp-list-card">
        <div className="sp-list-header">
          <h2>
            <Package size={18} strokeWidth={2.5} style={{ color: "#e8291c" }} />
            Mis envíos
          </h2>
          <span className="sp-list-count">
            {filteredShipments.length} de {shipments.length} envíos
          </span>
        </div>

        {shipments.length === 0 ? (
          <div className="sp-empty">
            <div className="sp-empty-icon">
              <Truck size={56} strokeWidth={1} />
            </div>
            <h3>No hay envíos registrados</h3>
            <p>
              Crea un envío para comenzar a gestionar la logística de tus
              pedidos
            </p>
            <button className="sp-empty-btn" onClick={() => setShowForm(true)}>
              <Plus size={16} strokeWidth={2.5} />
              Crear primer envío
            </button>
          </div>
        ) : filteredShipments.length === 0 ? (
          <div className="sp-empty">
            <div className="sp-empty-icon">
              <Search size={56} strokeWidth={1} />
            </div>
            <h3>Sin resultados</h3>
            <p>No se encontraron envíos que coincidan con tu búsqueda</p>
            <button
              className="sp-empty-btn"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
              }}
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="sp-shipments">
            {filteredShipments.map((shipment, idx) => {
              const config =
                STATUS_CONFIG[shipment.status] || STATUS_CONFIG.pending;
              const StatusIcon = config.icon;
              const isExpanded = selectedShipment?.id === shipment.id;
              const carrier =
                CARRIERS.find((c) => c.name === shipment.carrier) ||
                CARRIERS[0];
              const CarrierIcon = carrier?.icon || Truck;
              const progressPercent = (config.step / 5) * 100;

              return (
                <div
                  key={shipment.id}
                  className={`sp-shipment ${isExpanded ? "expanded" : ""}`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {/* Card Header */}
                  <div
                    className="sp-shipment-header"
                    onClick={() =>
                      setSelectedShipment(isExpanded ? null : shipment)
                    }
                  >
                    <div className="sp-shipment-main">
                      <div className="sp-shipment-id">
                        <div
                          className="sp-shipment-icon"
                          style={{ background: config.bg, color: config.color }}
                        >
                          <StatusIcon size={18} strokeWidth={2.5} />
                        </div>
                        <div>
                          <div className="sp-shipment-title">
                            Envío #{shipment.id}
                            <span
                              className="sp-status-badge"
                              style={{
                                background: config.bg,
                                color: config.color,
                                border: `1px solid ${config.border}`,
                              }}
                            >
                              {config.label}
                            </span>
                          </div>
                          <div className="sp-shipment-meta">
                            <span>
                              <Hash size={11} strokeWidth={2.5} />
                              Orden #{shipment.order_id}
                            </span>
                            <span className="sp-dot" />
                            <span>
                              <Calendar size={11} strokeWidth={2.5} />
                              {new Date(shipment.created_at).toLocaleDateString(
                                "es-CO",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="sp-shipment-right">
                      <div className="sp-shipment-carrier">
                        <div
                          className="sp-carrier-dot"
                          style={{ background: carrier?.color || "#e8291c" }}
                        />
                        <span>{shipment.carrier}</span>
                      </div>
                      <div className="sp-shipment-cost">
                        <DollarSign size={13} strokeWidth={2.5} />
                        {formatCOP(shipment.shipping_cost || 0)}
                      </div>
                      <button className="sp-expand-btn">
                        {isExpanded ? (
                          <ChevronUp size={18} strokeWidth={2.5} />
                        ) : (
                          <ChevronDown size={18} strokeWidth={2.5} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Tracking Number */}
                  <div className="sp-tracking-bar">
                    <div className="sp-tracking-label">Número de tracking</div>
                    <code className="sp-tracking-code">
                      {shipment.tracking_number}
                    </code>
                    <button
                      className="sp-tracking-copy"
                      onClick={() => {
                        navigator.clipboard.writeText(shipment.tracking_number);
                        setMsg({
                          type: "success",
                          text: "¡Tracking copiado al portapapeles!",
                        });
                        setTimeout(() => setMsg(null), 2000);
                      }}
                    >
                      Copiar
                    </button>
                  </div>

                  {/* Progress Timeline */}
                  <div className="sp-progress-wrap">
                    <div className="sp-progress-track">
                      <div
                        className="sp-progress-fill"
                        style={{
                          width: `${progressPercent}%`,
                          background: `linear-gradient(90deg, ${config.color}, ${carrier?.color || config.color})`,
                        }}
                      />
                    </div>
                    <div className="sp-progress-steps">
                      {[
                        { label: "Pendiente", step: 1 },
                        { label: "Procesando", step: 2 },
                        { label: "Enviado", step: 3 },
                        { label: "En tránsito", step: 4 },
                        { label: "Entregado", step: 5 },
                      ].map((s) => (
                        <div
                          key={s.step}
                          className={`sp-progress-step ${config.step >= s.step ? "active" : ""} ${
                            config.step === s.step ? "current" : ""
                          }`}
                        >
                          <div
                            className="sp-step-dot"
                            style={{
                              background:
                                config.step >= s.step
                                  ? config.step === s.step
                                    ? config.color
                                    : "#10b981"
                                  : "#e5e7eb",
                              boxShadow:
                                config.step === s.step
                                  ? `0 0 0 4px ${config.bg}`
                                  : "none",
                            }}
                          />
                          <span>{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="sp-shipment-detail">
                      <div className="sp-detail-grid">
                        <div className="sp-detail-section">
                          <h4>
                            <User size={14} strokeWidth={2.5} />
                            Destinatario
                          </h4>
                          <div className="sp-detail-row">
                            <span className="sp-detail-label">Nombre</span>
                            <span className="sp-detail-value">
                              {shipment.recipient_name}
                            </span>
                          </div>
                          <div className="sp-detail-row">
                            <span className="sp-detail-label">Dirección</span>
                            <span className="sp-detail-value">
                              {shipment.address}, {shipment.city},{" "}
                              {shipment.department}
                            </span>
                          </div>
                          {shipment.phone && (
                            <div className="sp-detail-row">
                              <span className="sp-detail-label">Teléfono</span>
                              <span className="sp-detail-value">
                                {shipment.phone}
                              </span>
                            </div>
                          )}
                          {shipment.email && (
                            <div className="sp-detail-row">
                              <span className="sp-detail-label">Email</span>
                              <span className="sp-detail-value">
                                {shipment.email}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="sp-detail-section">
                          <h4>
                            <Truck size={14} strokeWidth={2.5} />
                            Información del envío
                          </h4>
                          <div className="sp-detail-row">
                            <span className="sp-detail-label">
                              Transportista
                            </span>
                            <span
                              className="sp-detail-value"
                              style={{ color: carrier?.color }}
                            >
                              {shipment.carrier}
                            </span>
                          </div>
                          <div className="sp-detail-row">
                            <span className="sp-detail-label">Costo</span>
                            <span
                              className="sp-detail-value"
                              style={{ color: "#e8291c", fontWeight: 800 }}
                            >
                              {formatCOP(shipment.shipping_cost || 0)}
                            </span>
                          </div>
                          <div className="sp-detail-row">
                            <span className="sp-detail-label">Creado</span>
                            <span className="sp-detail-value">
                              {new Date(shipment.created_at).toLocaleString(
                                "es-CO",
                              )}
                            </span>
                          </div>
                          {shipment.postal_code && (
                            <div className="sp-detail-row">
                              <span className="sp-detail-label">
                                Código postal
                              </span>
                              <span className="sp-detail-value">
                                {shipment.postal_code}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {config.next && (
                        <div className="sp-detail-actions">
                          <button
                            className="sp-update-btn"
                            onClick={() =>
                              handleUpdateStatus(shipment.id, config.next)
                            }
                          >
                            {config.next === "delivered" ? (
                              <>
                                <CheckCircle size={16} strokeWidth={2.5} />
                                Marcar como entregado
                              </>
                            ) : (
                              <>
                                <ArrowRight size={16} strokeWidth={2.5} />
                                Avanzar a: {STATUS_CONFIG[config.next]?.label}
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ STYLES ══ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Barlow+Condensed:wght@400;600;700;800&display=swap');

        .sp-root {
          font-family: 'Inter', sans-serif;
          --primary: #e8291c;
          --primary2: #c2200f;
          --orange: #f97316;
          --card: #ffffff;
          --border: #e5e7eb;
          --border2: #d1d5db;
          --text: #1a1a1a;
          --text2: #4b5563;
          --text3: #9ca3af;
          --bg: #f5f5f5;
          --bg2: #fafafa;
          --hover-bg: #fff5f5;
          --success: #10b981;
          --warning: #f59e0b;
          --info: #3b82f6;
        }

        /* Loading */
        .sp-loading {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; min-height: 50vh; gap: 16px;
          color: var(--ec-text3);
        }
        .sp-spinner {
          width: 44px; height: 44px;
          border: 3px solid rgba(232,41,28,.12);
          border-top-color: #e8291c;
          border-radius: 50%;
          animation: spSpin .8s linear infinite;
        }
        @keyframes spSpin { to { transform: rotate(360deg); } }
        .sp-loading-dots { display: flex; gap: 6px; margin-top: 4px; }
        .sp-loading-dots span {
          width: 6px; height: 6px;
          background: #e8291c; border-radius: 50%;
          animation: spBounce 1.4s ease-in-out infinite both;
        }
        .sp-loading-dots span:nth-child(1) { animation-delay: -.32s; }
        .sp-loading-dots span:nth-child(2) { animation-delay: -.16s; }
        @keyframes spBounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

        /* Header */
        .sp-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 28px; flex-wrap: wrap; gap: 16px;
        }
        .sp-header-left { flex: 1; }
        .sp-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 5px 14px;
          background: rgba(232,41,28,.08);
          border: 1.5px solid rgba(232,41,28,.15);
          border-radius: 20px;
          font-size: 10px; font-weight: 800;
          letter-spacing: .12em; color: var(--ec-primary);
          margin-bottom: 12px; text-transform: uppercase;
        }
        .sp-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 36px; font-weight: 800;
          color: var(--ec-text); margin: 0; line-height: 1.1;
          letter-spacing: -.02em;
        }
        .sp-title span {
          display: block; font-family: 'Inter', sans-serif;
          font-size: 15px; font-weight: 400;
          color: var(--ec-text3); margin-top: 8px;
          letter-spacing: 0;
        }
        .sp-header-right { display: flex; gap: 10px; align-items: center; }

        .sp-btn-refresh {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 20px;
          background: var(--ec-bg2);
          border: 1.5px solid var(--ec-border);
          border-radius: 10px;
          font-family: 'Inter', sans-serif; font-size: 13px;
          font-weight: 700; color: var(--ec-text2);
          cursor: pointer; transition: all .2s;
        }
        .sp-btn-refresh:hover { border-color: var(--ec-primary); color: var(--ec-primary); background: var(--ec-hover-bg); }

        .sp-btn-create {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 22px;
          background: linear-gradient(135deg, var(--ec-primary), var(--ec-primary2));
          border: none; border-radius: 10px;
          font-family: 'Inter', sans-serif; font-size: 13px;
          font-weight: 700; color: #fff;
          cursor: pointer; transition: all .25s;
          box-shadow: 0 4px 16px rgba(232,41,28,.25);
        }
        .sp-btn-create:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(232,41,28,.35); }
        .sp-btn-create.active {
          background: var(--ec-text3);
          box-shadow: none;
        }

        /* Alert */
        .sp-alert {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 20px; border-radius: 12px;
          margin-bottom: 24px; animation: spSlideDown .3s ease;
          font-size: 14px; font-weight: 600;
        }
        @keyframes spSlideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .sp-alert.success {
          background: rgba(16,185,129,.08);
          border: 1.5px solid rgba(16,185,129,.2);
          color: var(--ec-success);
        }
        .sp-alert.error {
          background: rgba(220,38,38,.08);
          border: 1.5px solid rgba(220,38,38,.2);
          color: #dc2626;
        }
        .sp-alert-close {
          margin-left: auto; background: none; border: none;
          cursor: pointer; color: currentColor;
          display: flex; align-items: center;
          padding: 4px; border-radius: 6px;
          transition: all .15s;
        }
        .sp-alert-close:hover { background: rgba(0,0,0,.05); }

        /* Stats */
        .sp-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 18px; margin-bottom: 32px;
        }
        .sp-stat {
          background: var(--ec-card-bg); 
          border: 1.5px solid var(--ec-border);
          backdrop-filter: blur(10px);
          border-radius: 20px; padding: 24px;
          display: flex; align-items: center; gap: 16px;
          animation: spFadeUp .5s ease forwards;
          opacity: 0; transition: all .3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dark .sp-stat {
          background: rgba(30, 41, 59, 0.4);
          border-color: rgba(255, 255, 255, 0.05);
        }
        @keyframes spFadeUp { to { opacity: 1; transform: translateY(0); } from { opacity: 0; transform: translateY(16px); } }
        .sp-stat:hover { 
          transform: translateY(-4px); 
          box-shadow: var(--ec-shadow-lg); 
          border-color: var(--ec-primary); 
        }
        .sp-stat-icon {
          width: 56px; height: 56px;
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1);
        }
        .sp-stat-label { display: block; font-size: 11px; font-weight: 700; color: var(--ec-text3); text-transform: uppercase; letter-spacing: .08em; }
        .sp-stat-value { display: block; font-size: 28px; font-weight: 800; margin: 4px 0; font-family: 'Outfit', sans-serif; letter-spacing: -.02em; }
        .sp-stat-trend { display: block; font-size: 11px; color: var(--ec-text3); font-weight: 500; }

        /* Form Card */
        .sp-form-card {
          background: var(--ec-card-bg); 
          border: 1.5px solid var(--ec-border);
          backdrop-filter: blur(12px);
          border-radius: 24px; padding: 32px;
          margin-bottom: 32px; animation: spSlideDown .3s ease;
          box-shadow: var(--ec-shadow-lg);
        }
        .dark .sp-form-card {
          background: rgba(30, 41, 59, 0.5);
          border-color: rgba(255, 255, 255, 0.08);
        }
        .sp-form-header { margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1.5px solid var(--ec-border); }
        .sp-form-header h3 {
          font-size: 20px; font-weight: 800; color: var(--ec-text);
          display: flex; align-items: center; gap: 12px; margin: 0 0 8px;
          font-family: 'Outfit', sans-serif;
        }
        .sp-form-header p { font-size: 14px; color: var(--ec-text3); margin: 0; }

        .sp-form-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .sp-form-group {
          display: flex; flex-direction: column; gap: 8px;
        }
        .sp-form-group.full-width { grid-column: 1 / -1; }
        .sp-form-group label {
          font-size: 12px; font-weight: 700;
          color: var(--ec-text2); text-transform: uppercase;
          letter-spacing: .06em; margin-left: 4px;
        }
        .sp-input-wrap, .sp-select-wrap {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px;
          background: var(--ec-bg);
          border: 1.5px solid var(--ec-border);
          border-radius: 14px;
          transition: all .2s;
          color: var(--ec-text3);
        }
        .sp-input-wrap:focus-within, .sp-select-wrap:focus-within {
          border-color: var(--ec-primary);
          box-shadow: 0 0 0 4px rgba(220,38,38,.08);
          background: var(--ec-surface);
        }
        .sp-input-wrap input, .sp-select-wrap select {
          flex: 1; background: none; border: none; outline: none;
          font-family: 'Inter', sans-serif; font-size: 14px;
          color: var(--ec-text);
        }
        .sp-input-wrap input::placeholder { color: var(--ec-text3); }
        .sp-select-wrap select { cursor: pointer; }
        .sp-select-wrap select option { background: var(--ec-bg2); color: var(--ec-text); }

        /* Carriers */
        .sp-carriers {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
        }
        .sp-carrier-btn {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 18px;
          background: var(--ec-bg2);
          border: 1.5px solid var(--ec-border);
          border-radius: 16px;
          cursor: pointer; transition: all .25s;
          font-family: 'Inter', sans-serif; font-size: 14px;
          font-weight: 700; color: var(--ec-text);
        }
        .sp-carrier-btn:hover { border-color: var(--ec-primary); transform: translateY(-2px); }
        .sp-carrier-btn.active {
          border-color: var(--ec-primary);
          background: rgba(220,38,38,0.05);
          box-shadow: 0 8px 20px rgba(220,38,38,0.12);
        }
        .sp-carrier-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          color: #fff;
        }

        /* Cost Section */
        .sp-cost-section {
          margin-top: 28px; padding: 24px;
          background: var(--ec-bg); border-radius: 18px;
          border: 1.5px dashed var(--ec-border);
        }
        .sp-calc-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 20px;
          background: rgba(59,130,246,.08);
          border: 1.5px solid rgba(59,130,246,.15);
          border-radius: 12px;
          font-family: 'Inter', sans-serif; font-size: 13px;
          font-weight: 700; color: var(--ec-info);
          cursor: pointer; transition: all .2s;
        }
        .sp-calc-btn:hover { background: rgba(59,130,246,.15); transform: translateY(-1px); }
        .sp-cost-result {
          display: flex; align-items: center; gap: 32px;
          margin-top: 20px; padding-top: 20px;
          border-top: 1.5px solid var(--ec-border);
          flex-wrap: wrap;
        }
        .sp-cost-item { display: flex; flex-direction: column; gap: 6px; }
        .sp-cost-label { font-size: 11px; font-weight: 700; color: var(--ec-text3); text-transform: uppercase; letter-spacing: .08em; }
        .sp-cost-value { font-size: 28px; font-weight: 800; color: var(--ec-primary); font-family: 'Outfit', sans-serif; }
        .sp-cost-days {
          display: flex; align-items: center; gap: 8px;
          font-size: 14px; font-weight: 700; color: var(--ec-warning);
        }
        .sp-cost-carrier { font-size: 14px; font-weight: 700; color: var(--ec-text2); }
        .sp-cost-divider { width: 1px; height: 44px; background: var(--ec-border); }

        /* Form Actions */
        .sp-form-actions {
          display: flex; justify-content: flex-end; gap: 12px;
          margin-top: 28px; padding-top: 24px;
          border-top: 1.5px solid var(--ec-border);
        }
        .sp-btn-secondary {
          padding: 12px 28px;
          background: var(--ec-bg2);
          border: 1.5px solid var(--ec-border);
          border-radius: 12px;
          font-family: 'Inter', sans-serif; font-size: 14px;
          font-weight: 700; color: var(--ec-text2);
          cursor: pointer; transition: all .2s;
        }
        .sp-btn-secondary:hover { border-color: var(--ec-text3); color: var(--ec-text); background: var(--ec-bg3); }
        .sp-btn-primary {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 32px;
          background: linear-gradient(135deg, var(--ec-primary), var(--ec-primary2));
          border: none; border-radius: 12px;
          font-family: 'Inter', sans-serif; font-size: 14px;
          font-weight: 700; color: #fff;
          cursor: pointer; transition: all .3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: var(--ec-shadow-primary);
        }
        .sp-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: var(--ec-shadow-primary-lg); }
        .sp-btn-primary:disabled { opacity: .6; cursor: not-allowed; }

        /* Filters */
        .sp-filters { margin-bottom: 28px; }
        .sp-search-box {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 20px;
          background: var(--ec-card-bg);
          border: 1.5px solid var(--ec-border);
          border-radius: 16px;
          margin-bottom: 16px;
          transition: all .3s ease;
          box-shadow: var(--ec-shadow);
        }
        .dark .sp-search-box { background: rgba(30, 41, 59, 0.4); }
        .sp-search-box:focus-within {
          border-color: var(--ec-primary);
          box-shadow: 0 0 0 4px rgba(220,38,38,.08);
          background: var(--ec-surface);
        }
        .sp-search-box input {
          flex: 1; background: none; border: none; outline: none;
          font-family: 'Inter', sans-serif; font-size: 15px;
          color: var(--ec-text);
        }
        .sp-search-box input::placeholder { color: var(--ec-text3); }

        .sp-status-filters {
          display: flex; gap: 10px; flex-wrap: wrap;
        }
        .sp-status-pill {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 20px;
          background: var(--ec-card-bg);
          border: 1.5px solid var(--ec-border);
          border-radius: 30px;
          font-size: 13px; font-weight: 700;
          color: var(--ec-text2); cursor: pointer;
          transition: all .25s;
          box-shadow: var(--ec-shadow);
        }
        .dark .sp-status-pill { background: rgba(30, 41, 59, 0.4); }
        .sp-status-pill span {
          font-size: 11px; background: var(--ec-bg3);
          padding: 2px 10px; border-radius: 20px;
          font-weight: 800; color: var(--ec-text3);
        }
        .sp-status-pill:hover { border-color: var(--ec-primary); color: var(--ec-primary); transform: translateY(-1px); }
        .sp-status-pill.active {
          background: linear-gradient(135deg, var(--ec-primary), var(--ec-primary2));
          border-color: var(--ec-primary); color: #fff;
          box-shadow: var(--ec-shadow-primary);
        }
        .sp-status-pill.active span { background: rgba(255,255,255,0.2); color: #fff; }

        /* List Card */
        .sp-list-card {
          background: var(--ec-card-bg);
          border: 1.5px solid var(--ec-border);
          backdrop-filter: blur(12px);
          border-radius: 24px; overflow: hidden;
          box-shadow: var(--ec-shadow-lg);
        }
        .dark .sp-list-card {
          background: rgba(30, 41, 59, 0.4);
          border-color: rgba(255, 255, 255, 0.05);
        }
        .sp-list-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 24px 32px;
          border-bottom: 1.5px solid var(--ec-border);
          background: rgba(255,255,255,0.02);
        }
        .sp-list-header h2 {
          font-size: 20px; font-weight: 800; color: var(--ec-text);
          display: flex; align-items: center; gap: 12px; margin: 0;
          font-family: 'Outfit', sans-serif;
        }
        .sp-list-count {
          padding: 6px 16px; border-radius: 30px;
          background: var(--ec-bg3); font-size: 12px;
          font-weight: 700; color: var(--ec-text2);
        }

        /* Empty */
        .sp-empty {
          text-align: center; padding: 80px 24px;
          display: flex; flex-direction: column;
          align-items: center; gap: 20px;
          color: var(--ec-text3);
        }
        .sp-empty-icon {
          width: 120px; height: 120px;
          border-radius: 50%;
          background: var(--ec-bg2);
          display: flex; align-items: center; justify-content: center;
          color: var(--ec-text3);
          box-shadow: inset 0 4px 12px rgba(0,0,0,0.05);
        }
        .sp-empty h3 { font-size: 24px; font-weight: 800; color: var(--ec-text); margin: 0; font-family: 'Outfit', sans-serif; }
        .sp-empty p { font-size: 15px; margin: 0; max-width: 440px; line-height: 1.6; }
        .sp-empty-btn {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 14px 32px;
          background: linear-gradient(135deg, var(--ec-primary), var(--ec-primary2));
          border: none; border-radius: 14px;
          font-family: 'Inter', sans-serif; font-size: 15px;
          font-weight: 700; color: #fff;
          cursor: pointer; transition: all .3s cubic-bezier(0.4, 0, 0.2, 1);
          margin-top: 12px;
          box-shadow: var(--ec-shadow-primary);
        }
        .sp-empty-btn:hover { transform: translateY(-2px); box-shadow: var(--ec-shadow-primary-lg); }

        /* Shipments */
        .sp-shipments { display: flex; flex-direction: column; }
        .sp-shipment {
          border-bottom: 1.5px solid var(--ec-border);
          animation: spFadeUp .4s ease forwards;
          opacity: 0; transition: all .25s;
        }
        .sp-shipment:last-child { border-bottom: none; }
        .sp-shipment:hover { background: rgba(255,255,255,0.02); }
        .dark .sp-shipment:hover { background: rgba(255,255,255,0.03); }
        .sp-shipment.expanded { background: rgba(255,255,255,0.03); }

        .sp-shipment-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 24px 32px; cursor: pointer; flex-wrap: wrap; gap: 20px;
        }
        .sp-shipment-main { flex: 1; }
        .sp-shipment-id {
          display: flex; align-items: center; gap: 16px;
        }
        .sp-shipment-icon {
          width: 48px; height: 48px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .sp-shipment-title {
          font-size: 16px; font-weight: 800; color: var(--ec-text);
          display: flex; align-items: center; gap: 12px;
          font-family: 'Outfit', sans-serif;
        }
        .sp-status-badge {
          padding: 4px 14px; border-radius: 20px;
          font-size: 10px; font-weight: 800;
          letter-spacing: .06em; text-transform: uppercase;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }
        .sp-shipment-meta {
          display: flex; align-items: center; gap: 12px;
          margin-top: 8px; font-size: 12px; color: var(--ec-text3);
          font-weight: 500;
        }
        .sp-shipment-meta span { display: flex; align-items: center; gap: 6px; }
        .sp-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--ec-border2); }

        .sp-shipment-right {
          display: flex; align-items: center; gap: 24px;
        }
        .sp-shipment-carrier {
          display: flex; align-items: center; gap: 10px;
          font-size: 13px; font-weight: 700; color: var(--ec-text2);
        }
        .sp-carrier-dot { width: 8px; height: 8px; border-radius: 50%; }
        .sp-shipment-cost {
          display: flex; align-items: center; gap: 4px;
          font-size: 18px; font-weight: 800;
          color: var(--ec-primary); font-family: 'Outfit', sans-serif;
        }
        .sp-expand-btn {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: var(--ec-bg3); border: 1.5px solid var(--ec-border);
          color: var(--ec-text2); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all .2s;
        }
        .sp-expand-btn:hover { border-color: var(--ec-primary); color: var(--ec-primary); background: var(--ec-hover-bg); transform: scale(1.05); }

        /* Tracking Bar */
        .sp-tracking-bar {
          display: flex; align-items: center; gap: 16px;
          padding: 16px 32px;
          background: var(--ec-bg);
          border-top: 1.5px solid var(--ec-border);
          border-bottom: 1.5px solid var(--ec-border);
        }
        .sp-tracking-label {
          font-size: 11px; font-weight: 800;
          color: var(--ec-text3); text-transform: uppercase;
          letter-spacing: .08em; white-space: nowrap;
        }
        .sp-tracking-code {
          flex: 1;
          font-family: 'SF Mono', 'Monaco', monospace;
          font-size: 14px; font-weight: 700;
          color: var(--ec-text);
          background: var(--ec-card-bg);
          padding: 8px 16px;
          border-radius: 10px;
          border: 1.5px solid var(--ec-border);
          letter-spacing: .05em;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
        }
        .sp-tracking-copy {
          padding: 8px 18px;
          background: var(--ec-bg3);
          border: 1.5px solid var(--ec-border);
          border-radius: 10px;
          font-family: 'Inter', sans-serif; font-size: 12px;
          font-weight: 700; color: var(--ec-primary);
          cursor: pointer; transition: all .2s;
        }
        .sp-tracking-copy:hover { border-color: var(--ec-primary); background: var(--ec-hover-bg); transform: translateY(-1px); }

        /* Progress */
        .sp-progress-wrap { padding: 28px 32px 20px; }
        .sp-progress-track {
          height: 8px; background: var(--ec-bg3);
          border-radius: 4px; overflow: hidden; margin-bottom: 16px;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
        }
        .sp-progress-fill {
          height: 100%; border-radius: 4px;
          transition: width .8s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 12px rgba(220,38,38,0.3);
        }
        .sp-progress-steps {
          display: flex; justify-content: space-between;
        }
        .sp-progress-step {
          display: flex; flex-direction: column; align-items: center;
          gap: 8px; flex: 1;
        }
        .sp-step-dot {
          width: 12px; height: 12px; border-radius: 50%;
          transition: all .4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border: 2px solid var(--ec-bg);
          box-shadow: 0 0 0 2px var(--ec-border);
        }
        .sp-progress-step.active .sp-step-dot { transform: scale(1.2); box-shadow: 0 0 10px currentColor; }
        .sp-progress-step span {
          font-size: 10px; font-weight: 700;
          color: var(--ec-text3); text-transform: uppercase;
          letter-spacing: .04em; text-align: center;
        }
        .sp-progress-step.active span { color: var(--ec-text2); }
        .sp-progress-step.current span { color: var(--ec-text); font-weight: 800; }

        /* Detail */
        .sp-shipment-detail {
          padding: 0 32px 32px;
          animation: spFadeUp .4s ease;
        }
        .sp-detail-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 24px; margin-bottom: 24px;
        }
        .sp-detail-section {
          background: rgba(255,255,255,0.02);
          border: 1.5px solid var(--ec-border);
          border-radius: 18px; padding: 24px;
          box-shadow: var(--ec-shadow);
        }
        .sp-detail-section h4 {
          font-size: 12px; font-weight: 800;
          color: var(--ec-text3); text-transform: uppercase;
          letter-spacing: .1em;
          display: flex; align-items: center; gap: 10px;
          margin: 0 0 20px;
        }
        .sp-detail-row {
          display: flex; justify-content: space-between; align-items: flex-start;
          padding: 10px 0;
          border-bottom: 1px solid var(--ec-border);
        }
        .sp-detail-row:last-child { border-bottom: none; }
        .sp-detail-label { font-size: 12px; color: var(--ec-text3); font-weight: 500; }
        .sp-detail-value { font-size: 13px; color: var(--ec-text); font-weight: 700; text-align: right; max-width: 60%; }

        .sp-detail-actions {
          display: flex; justify-content: flex-end;
        }
        .sp-update-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 28px;
          background: linear-gradient(135deg, #10b981, #059669);
          border: none; border-radius: 12px;
          font-family: 'Inter', sans-serif; font-size: 14px;
          font-weight: 700; color: #fff;
          cursor: pointer; transition: all .3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 20px rgba(16,185,129,.25);
        }
        .sp-update-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(16,185,129,.35); }

        /* Responsive */
        @media (max-width: 1024px) {
          .sp-stats { grid-template-columns: repeat(2, 1fr); }
          .sp-form-grid { grid-template-columns: 1fr; }
          .sp-detail-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .sp-header { flex-direction: column; }
          .sp-header-right { width: 100%; }
          .sp-btn-refresh, .sp-btn-create { flex: 1; justify-content: center; }
          .sp-stats { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .sp-stat { padding: 14px; }
          .sp-stat-icon { width: 40px; height: 40px; }
          .sp-stat-value { font-size: 20px; }
          .sp-shipment-header { flex-direction: column; align-items: flex-start; }
          .sp-shipment-right { width: 100%; justify-content: space-between; }
          .sp-tracking-bar { flex-wrap: wrap; }
          .sp-progress-steps span { font-size: 9px; }
          .sp-cost-result { flex-direction: column; align-items: flex-start; gap: 12px; }
          .sp-cost-divider { width: 100%; height: 1px; }
        }
        @media (max-width: 480px) {
          .sp-title { font-size: 28px; }
          .sp-stats { grid-template-columns: 1fr 1fr; }
          .sp-form-card { padding: 20px 16px; }
          .sp-carriers { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
}
