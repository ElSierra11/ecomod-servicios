import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
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
  TrendingUp,
  DollarSign,
  Calendar,
  Search,
  Navigation,
  Phone,
  Mail,
  Building2,
  Hash,
} from "lucide-react";

const STATUS = {
  pending: {
    label: "Pendiente",
    icon: Clock,
    color: "#fbbf24",
    bg: "rgba(251, 191, 36, 0.1)",
    next: "processing",
  },
  processing: {
    label: "Procesando",
    icon: Package,
    color: "#00d4ff",
    bg: "rgba(0, 212, 255, 0.1)",
    next: "shipped",
  },
  shipped: {
    label: "Enviado",
    icon: Truck,
    color: "#f472b6",
    bg: "rgba(244, 114, 182, 0.1)",
    next: "in_transit",
  },
  in_transit: {
    label: "En tránsito",
    icon: Navigation,
    color: "#00d4ff",
    bg: "rgba(0, 212, 255, 0.1)",
    next: "delivered",
  },
  delivered: {
    label: "Entregado",
    icon: CheckCircle,
    color: "#00ff88",
    bg: "rgba(0, 255, 136, 0.1)",
    next: null,
  },
  returned: {
    label: "Devuelto",
    icon: XCircle,
    color: "#ff6b6b",
    bg: "rgba(255, 107, 107, 0.1)",
    next: null,
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
  { id: "servientrega", name: "Servientrega", icon: Truck, color: "#f97316" },
  {
    id: "interrapidisimo",
    name: "Interrapidísimo",
    icon: Package,
    color: "#8b5cf6",
  },
  { id: "coordinadora", name: "Coordinadora", icon: Truck, color: "#ec4899" },
  { id: "tcc", name: "TCC", icon: Package, color: "#06b6d4" },
  { id: "deprisa", name: "Deprisa", icon: Truck, color: "#10b981" },
];

export default function ShippingPage() {
  const { user } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [cost, setCost] = useState(null);
  const [selectedShipment, setSelectedShipment] = useState(null);
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
        ords.filter((o) => o.status === "shipped" || o.status === "confirmed"),
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
        text: `✓ Envío creado — Tracking: ${shipment.tracking_number}`,
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

  const getStatusStats = () => {
    return {
      total: shipments.length,
      pending: shipments.filter((s) => s.status === "pending").length,
      inTransit: shipments.filter(
        (s) => s.status === "shipped" || s.status === "in_transit",
      ).length,
      delivered: shipments.filter((s) => s.status === "delivered").length,
    };
  };

  const stats = getStatusStats();

  if (loading) {
    return (
      <div className="shipping-loading">
        <div className="shipping-loading-spinner"></div>
        <p>Cargando envíos...</p>
      </div>
    );
  }

  return (
    <div className="shipping-modern">
      {/* Header */}
      <div className="shipping-header">
        <div className="shipping-header-left">
          <div className="shipping-badge">
            <Truck size={14} />
            <span>GESTIÓN DE ENVÍOS</span>
          </div>
          <h1 className="shipping-title">
            Envíos
            <span>Logística y seguimiento de pedidos</span>
          </h1>
        </div>
        <div className="shipping-header-right">
          <button className="shipping-refresh" onClick={loadData}>
            <RefreshCw size={14} />
            <span>Actualizar</span>
          </button>
          <button
            className="shipping-create-btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            <span>{showForm ? "Cancelar" : "Crear envío"}</span>
          </button>
        </div>
      </div>

      {/* Alert */}
      {msg && (
        <div className={`shipping-alert ${msg.type}`}>
          {msg.type === "success" ? (
            <CheckCircle size={16} />
          ) : (
            <XCircle size={16} />
          )}
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)}>✕</button>
        </div>
      )}

      {/* Stats Cards */}
      {shipments.length > 0 && (
        <div className="shipping-stats">
          <div className="shipping-stat-card">
            <div
              className="shipping-stat-icon"
              style={{
                background: "rgba(124, 252, 110, 0.1)",
                color: "#00ff88",
              }}
            >
              <Package size={22} />
            </div>
            <div className="shipping-stat-info">
              <span className="shipping-stat-label">Total envíos</span>
              <span className="shipping-stat-value">{stats.total}</span>
            </div>
          </div>
          <div className="shipping-stat-card">
            <div
              className="shipping-stat-icon"
              style={{
                background: "rgba(251, 191, 36, 0.1)",
                color: "#fbbf24",
              }}
            >
              <Clock size={22} />
            </div>
            <div className="shipping-stat-info">
              <span className="shipping-stat-label">Pendientes</span>
              <span className="shipping-stat-value">{stats.pending}</span>
            </div>
          </div>
          <div className="shipping-stat-card">
            <div
              className="shipping-stat-icon"
              style={{ background: "rgba(0, 212, 255, 0.1)", color: "#00d4ff" }}
            >
              <Navigation size={22} />
            </div>
            <div className="shipping-stat-info">
              <span className="shipping-stat-label">En tránsito</span>
              <span className="shipping-stat-value">{stats.inTransit}</span>
            </div>
          </div>
          <div className="shipping-stat-card">
            <div
              className="shipping-stat-icon"
              style={{ background: "rgba(0, 255, 136, 0.1)", color: "#00ff88" }}
            >
              <CheckCircle size={22} />
            </div>
            <div className="shipping-stat-info">
              <span className="shipping-stat-label">Entregados</span>
              <span className="shipping-stat-value">{stats.delivered}</span>
            </div>
          </div>
        </div>
      )}

      {/* Create Shipment Form */}
      {showForm && (
        <div className="shipping-form-card">
          <div className="shipping-form-header">
            <h3>Nuevo envío</h3>
            <p>Completa los datos para generar un envío</p>
          </div>
          <form onSubmit={handleCreate}>
            <div className="shipping-form-grid">
              <div className="shipping-form-group">
                <label>Orden a enviar *</label>
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
                      Orden #{o.id} — ${o.total_amount?.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="shipping-form-group">
                <label>Destinatario *</label>
                <input
                  value={form.recipient_name}
                  onChange={(e) =>
                    setForm({ ...form, recipient_name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="shipping-form-group full-width">
                <label>Dirección *</label>
                <input
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="Calle 123 # 45-67"
                  required
                />
              </div>

              <div className="shipping-form-group">
                <label>Ciudad *</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                />
              </div>

              <div className="shipping-form-group">
                <label>Departamento *</label>
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

              <div className="shipping-form-group">
                <label>Transportista</label>
                <div className="shipping-carrier-select">
                  {CARRIERS.map((c) => {
                    const Icon = c.icon;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={`shipping-carrier-btn ${form.carrier === c.id ? "active" : ""}`}
                        onClick={() => {
                          setForm({ ...form, carrier: c.id });
                          setCost(null);
                        }}
                        style={{
                          borderColor:
                            form.carrier === c.id ? c.color : "var(--border)",
                        }}
                      >
                        <Icon size={16} style={{ color: c.color }} />
                        <span>{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="shipping-form-group">
                <label>Teléfono</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="300 123 4567"
                />
              </div>

              <div className="shipping-form-group">
                <label>Código postal</label>
                <input
                  value={form.postal_code}
                  onChange={(e) =>
                    setForm({ ...form, postal_code: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Cost Calculator */}
            <div className="shipping-cost-section">
              <button
                type="button"
                className="shipping-calc-btn"
                onClick={handleCalcCost}
              >
                <DollarSign size={14} />
                Calcular costo de envío
              </button>
              {cost && (
                <div className="shipping-cost-result">
                  <div className="shipping-cost-item">
                    <span className="shipping-cost-label">Costo estimado</span>
                    <span className="shipping-cost-value">
                      ${cost.cost?.toLocaleString()}
                    </span>
                  </div>
                  <div className="shipping-cost-item">
                    <span className="shipping-cost-label">
                      Tiempo de entrega
                    </span>
                    <span className="shipping-cost-days">
                      {cost.estimated_days} días hábiles
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="shipping-form-actions">
              <button
                type="button"
                className="shipping-cancel-btn"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="shipping-submit-btn"
                disabled={creating}
              >
                {creating ? (
                  <div className="shipping-spinner"></div>
                ) : (
                  <>
                    Crear envío <Plus size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Shipments List */}
      <div className="shipping-list-card">
        <div className="shipping-list-header">
          <h3>Mis envíos</h3>
          <span className="shipping-count">{shipments.length} total</span>
        </div>

        {shipments.length === 0 ? (
          <div className="shipping-empty">
            <Truck size={48} strokeWidth={1} />
            <h4>No hay envíos registrados</h4>
            <p>Crea un envío para una orden pagada</p>
          </div>
        ) : (
          <div className="shipping-list">
            {shipments.map((shipment, idx) => {
              const statusConfig = STATUS[shipment.status] || STATUS.pending;
              const StatusIcon = statusConfig.icon;
              const isExpanded = selectedShipment?.id === shipment.id;
              const carrier =
                CARRIERS.find((c) => c.name === shipment.carrier) ||
                CARRIERS[0];
              const CarrierIcon = carrier?.icon || Truck;

              return (
                <div
                  key={shipment.id}
                  className="shipping-item"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div
                    className="shipping-item-header"
                    onClick={() =>
                      setSelectedShipment(isExpanded ? null : shipment)
                    }
                  >
                    <div className="shipping-item-info">
                      <div className="shipping-item-id">
                        <Hash size={12} />
                        <span>Envío #{shipment.id}</span>
                      </div>
                      <div className="shipping-item-order">
                        Orden #{shipment.order_id}
                      </div>
                      <div className="shipping-item-tracking">
                        <span className="shipping-tracking-label">
                          Tracking:
                        </span>
                        <code className="shipping-tracking-code">
                          {shipment.tracking_number}
                        </code>
                      </div>
                    </div>

                    <div className="shipping-item-details">
                      <div className="shipping-item-carrier">
                        <CarrierIcon
                          size={14}
                          style={{ color: carrier?.color }}
                        />
                        <span>{shipment.carrier}</span>
                      </div>
                      <div
                        className="shipping-status-badge"
                        style={{
                          background: statusConfig.bg,
                          color: statusConfig.color,
                        }}
                      >
                        <StatusIcon size={12} />
                        <span>{statusConfig.label}</span>
                      </div>
                      <div className="shipping-item-cost">
                        <DollarSign size={12} />
                        <span>{shipment.shipping_cost?.toLocaleString()}</span>
                      </div>
                      <div className="shipping-item-arrow">
                        {isExpanded ? "▲" : "▼"}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="shipping-item-detail">
                      <div className="shipping-detail-grid">
                        <div className="shipping-detail-section">
                          <h4>Destinatario</h4>
                          <div className="shipping-detail-row">
                            <User size={14} />
                            <span>{shipment.recipient_name}</span>
                          </div>
                          <div className="shipping-detail-row">
                            <MapPin size={14} />
                            <span>
                              {shipment.address}, {shipment.city},{" "}
                              {shipment.department}
                            </span>
                          </div>
                          {shipment.phone && (
                            <div className="shipping-detail-row">
                              <Phone size={14} />
                              <span>{shipment.phone}</span>
                            </div>
                          )}
                        </div>

                        <div className="shipping-detail-section">
                          <h4>Información del envío</h4>
                          <div className="shipping-detail-row">
                            <Calendar size={14} />
                            <span>
                              Creado:{" "}
                              {new Date(shipment.created_at).toLocaleString(
                                "es-CO",
                              )}
                            </span>
                          </div>
                          <div className="shipping-detail-row">
                            <Package size={14} />
                            <span>Transportista: {shipment.carrier}</span>
                          </div>
                          <div className="shipping-detail-row">
                            <DollarSign size={14} />
                            <span>
                              Costo: ${shipment.shipping_cost?.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {statusConfig.next && (
                          <div className="shipping-detail-actions">
                            <button
                              className="shipping-update-btn"
                              onClick={() =>
                                handleUpdateStatus(
                                  shipment.id,
                                  statusConfig.next,
                                )
                              }
                            >
                              {statusConfig.next === "delivered" ? (
                                <>
                                  Marcar como entregado{" "}
                                  <CheckCircle size={14} />
                                </>
                              ) : (
                                <>
                                  Avanzar estado <ArrowRight size={14} />
                                </>
                              )}
                            </button>
                          </div>
                        )}
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
        .shipping-modern {
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

        .shipping-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 16px;
        }

        .shipping-loading-spinner {
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

        .shipping-header {
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

        .shipping-badge {
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

        .shipping-title {
          font-size: 28px;
          font-weight: 800;
          margin: 0;
        }

        .shipping-title span {
          display: block;
          font-size: 14px;
          font-weight: 400;
          color: var(--text2);
          margin-top: 4px;
        }

        .shipping-header-right {
          display: flex;
          gap: 12px;
        }

        .shipping-refresh {
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

        .shipping-refresh:hover {
          background: rgba(0, 255, 136, 0.2);
        }

        .shipping-create-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border: none;
          border-radius: 40px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .shipping-create-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(124, 252, 110, 0.3);
        }

        .shipping-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          border-radius: var(--radius);
          margin-bottom: 20px;
          animation: slideDown 0.3s ease;
        }

        .shipping-alert.success {
          background: rgba(124, 252, 110, 0.1);
          border: 1px solid rgba(124, 252, 110, 0.2);
          color: var(--accent);
        }

        .shipping-alert.error {
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.2);
          color: var(--danger);
        }

        .shipping-alert button {
          margin-left: auto;
          background: none;
          border: none;
          cursor: pointer;
          color: currentColor;
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

        .shipping-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .shipping-stat-card {
          background: var(--surface);
          border-radius: var(--radius-lg);
          padding: 20px;
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s;
        }

        .shipping-stat-card:hover {
          transform: translateY(-2px);
          border-color: var(--accent);
        }

        .shipping-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .shipping-stat-info {
          flex: 1;
        }

        .shipping-stat-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text3);
        }

        .shipping-stat-value {
          display: block;
          font-size: 28px;
          font-weight: 800;
          margin-top: 4px;
        }

        .shipping-form-card {
          background: var(--surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          padding: 24px;
          margin-bottom: 24px;
          animation: slideDown 0.3s ease;
        }

        .shipping-form-header {
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border);
        }

        .shipping-form-header h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .shipping-form-header p {
          font-size: 13px;
          color: var(--text2);
        }

        .shipping-form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .shipping-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .shipping-form-group.full-width {
          grid-column: 1 / -1;
        }

        .shipping-form-group label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text2);
        }

        .shipping-form-group select,
        .shipping-form-group input {
          padding: 10px 14px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          color: var(--text);
          font-size: 14px;
          transition: all 0.2s;
        }

        .shipping-form-group select:focus,
        .shipping-form-group input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(124, 252, 110, 0.1);
        }

        .shipping-carrier-select {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .shipping-carrier-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          cursor: pointer;
          transition: all 0.2s;
        }

        .shipping-carrier-btn.active {
          background: rgba(0, 255, 136, 0.05);
        }

        .shipping-cost-section {
          margin: 20px 0;
          padding: 16px;
          background: var(--bg2);
          border-radius: var(--radius);
        }

        .shipping-calc-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(0, 212, 255, 0.1);
          border: 1px solid rgba(0, 212, 255, 0.2);
          border-radius: var(--radius);
          color: #00d4ff;
          cursor: pointer;
          transition: all 0.2s;
        }

        .shipping-calc-btn:hover {
          background: rgba(0, 212, 255, 0.2);
        }

        .shipping-cost-result {
          display: flex;
          gap: 20px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
        }

        .shipping-cost-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .shipping-cost-label {
          font-size: 11px;
          color: var(--text3);
        }

        .shipping-cost-value {
          font-size: 18px;
          font-weight: 700;
          color: var(--accent);
        }

        .shipping-cost-days {
          font-size: 14px;
          font-weight: 600;
          color: #fbbf24;
        }

        .shipping-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 20px;
        }

        .shipping-cancel-btn {
          padding: 10px 20px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          cursor: pointer;
        }

        .shipping-submit-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border: none;
          border-radius: var(--radius);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .shipping-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(124, 252, 110, 0.3);
        }

        .shipping-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(0, 0, 0, 0.3);
          border-top-color: #000;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        .shipping-list-card {
          background: var(--surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          overflow: hidden;
        }

        .shipping-list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }

        .shipping-list-header h3 {
          font-size: 16px;
          font-weight: 600;
        }

        .shipping-count {
          padding: 4px 12px;
          background: rgba(0, 212, 255, 0.1);
          border-radius: 20px;
          font-size: 12px;
          color: #00d4ff;
        }

        .shipping-empty {
          text-align: center;
          padding: 60px 24px;
        }

        .shipping-empty svg {
          color: var(--text3);
          margin-bottom: 16px;
        }

        .shipping-empty h4 {
          font-size: 18px;
          margin-bottom: 8px;
        }

        .shipping-empty p {
          color: var(--text2);
        }

        .shipping-list {
          display: flex;
          flex-direction: column;
        }

        .shipping-item {
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

        .shipping-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          cursor: pointer;
          transition: all 0.2s;
          flex-wrap: wrap;
          gap: 16px;
        }

        .shipping-item-header:hover {
          background: var(--bg2);
        }

        .shipping-item-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .shipping-item-id {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 700;
        }

        .shipping-item-order {
          font-size: 12px;
          color: var(--text3);
        }

        .shipping-item-tracking {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
        }

        .shipping-tracking-label {
          color: var(--text3);
        }

        .shipping-tracking-code {
          font-family: monospace;
          font-size: 11px;
          padding: 2px 6px;
          background: var(--bg);
          border-radius: 4px;
        }

        .shipping-item-details {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .shipping-item-carrier {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }

        .shipping-status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .shipping-item-cost {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          font-weight: 700;
          color: var(--accent);
        }

        .shipping-item-arrow {
          color: var(--text3);
          font-size: 12px;
        }

        .shipping-item-detail {
          padding: 0 24px 20px 24px;
          background: var(--bg2);
        }

        .shipping-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .shipping-detail-section h4 {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text3);
          margin-bottom: 12px;
        }

        .shipping-detail-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 0;
          font-size: 13px;
        }

        .shipping-detail-actions {
          display: flex;
          align-items: flex-end;
        }

        .shipping-update-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border: none;
          border-radius: var(--radius);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .shipping-update-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(124, 252, 110, 0.3);
        }

        @media (max-width: 768px) {
          .shipping-header {
            flex-direction: column;
            align-items: stretch;
          }
          .shipping-header-right {
            justify-content: stretch;
          }
          .shipping-stats {
            grid-template-columns: 1fr 1fr;
          }
          .shipping-form-grid {
            grid-template-columns: 1fr;
          }
          .shipping-detail-grid {
            grid-template-columns: 1fr;
          }
          .shipping-item-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .shipping-item-details {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
}
