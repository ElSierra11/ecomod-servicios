import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { shippingApi, ordersApi } from "../services/api";

const STATUS = {
  pending: { label: "Pendiente", badge: "badge-yellow" },
  processing: { label: "Procesando", badge: "badge-cyan" },
  shipped: { label: "Enviado", badge: "badge-pink" },
  in_transit: { label: "En tránsito", badge: "badge-cyan" },
  delivered: { label: "Entregado", badge: "badge-green" },
  returned: { label: "Devuelto", badge: "badge-red" },
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
];

const CARRIERS = [
  "Servientrega",
  "Interrapidísimo",
  "Coordinadora",
  "TCC",
  "Deprisa",
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
  const [form, setForm] = useState({
    order_id: "",
    recipient_name: "",
    address: "",
    city: "",
    department: "Bogotá",
    carrier: "Servientrega",
    postal_code: "",
    country: "Colombia",
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
        carrier: "Servientrega",
        postal_code: "",
        country: "Colombia",
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
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    }
  };

  if (loading)
    return (
      <div className="page">
        <div className="empty">
          <div className="empty-icon">🚚</div>
          <p>Cargando envíos...</p>
        </div>
      </div>
    );

  return (
    <div className="page">
      {msg && (
        <div
          className={`alert alert-${msg.type === "error" ? "error" : "success"} fade-in`}
        >
          {msg.text}
        </div>
      )}

      {/* Header */}
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <h2
            style={{
              fontFamily: "var(--font-head)",
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            Envíos
          </h2>
          <p style={{ color: "var(--text2)", fontSize: 14, marginTop: 4 }}>
            Gestiona la logística de tus pedidos
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancelar" : "+ Crear envío"}
        </button>
      </div>

      {/* Formulario crear envío */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="section-header" style={{ marginBottom: 16 }}>
            <span className="section-title">Nuevo envío</span>
          </div>
          <form onSubmit={handleCreate}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div className="form-group">
                <label className="form-label">Orden a enviar *</label>
                <select
                  className="form-select"
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
              <div className="form-group">
                <label className="form-label">Nombre del destinatario *</label>
                <input
                  className="form-input"
                  value={form.recipient_name}
                  onChange={(e) =>
                    setForm({ ...form, recipient_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Dirección *</label>
                <input
                  className="form-input"
                  placeholder="Calle 123 # 45-67"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Ciudad *</label>
                <input
                  className="form-input"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Departamento *</label>
                <select
                  className="form-select"
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
              <div className="form-group">
                <label className="form-label">Transportista</label>
                <select
                  className="form-select"
                  value={form.carrier}
                  onChange={(e) => {
                    setForm({ ...form, carrier: e.target.value });
                    setCost(null);
                  }}
                >
                  {CARRIERS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Código postal</label>
                <input
                  className="form-input"
                  value={form.postal_code}
                  onChange={(e) =>
                    setForm({ ...form, postal_code: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Cálculo de costo */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                margin: "8px 0 16px",
              }}
            >
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleCalcCost}
              >
                Calcular costo de envío
              </button>
              {cost && (
                <div style={{ display: "flex", gap: 16 }}>
                  <span className="badge badge-green">
                    Costo: ${cost.cost?.toLocaleString()}
                  </span>
                  <span className="badge badge-cyan">
                    {cost.estimated_days} días hábiles
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2" style={{ justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={creating}
              >
                {creating ? "Creando..." : "Crear envío →"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de envíos */}
      <div className="card">
        <div className="section-header">
          <span className="section-title">Mis envíos</span>
          <span className="badge badge-cyan">{shipments.length} total</span>
        </div>

        {shipments.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🚚</div>
            <div className="empty-title">No hay envíos registrados</div>
            <p>Crea un envío para una orden pagada</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Destinatario</th>
                  <th>Destino</th>
                  <th>Transportista</th>
                  <th>Tracking</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Costo</th>
                  <th>Avanzar</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, color: "var(--text)" }}>
                      #{s.order_id}
                    </td>
                    <td>{s.recipient_name}</td>
                    <td style={{ fontSize: 12 }}>
                      {s.city}, {s.department}
                    </td>
                    <td>{s.carrier}</td>
                    <td
                      style={{
                        fontFamily: "monospace",
                        fontSize: 11,
                        color: "var(--text3)",
                      }}
                    >
                      {s.tracking_number}
                    </td>
                    <td>
                      <span
                        className={`badge ${STATUS[s.status]?.badge || "badge-cyan"}`}
                      >
                        {STATUS[s.status]?.label || s.status}
                      </span>
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontWeight: 600,
                        color: "var(--accent)",
                      }}
                    >
                      ${s.shipping_cost?.toLocaleString()}
                    </td>
                    <td>
                      {s.status === "processing" && (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleUpdateStatus(s.id, "shipped")}
                        >
                          Marcar enviado
                        </button>
                      )}
                      {s.status === "shipped" && (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleUpdateStatus(s.id, "in_transit")}
                        >
                          En tránsito
                        </button>
                      )}
                      {s.status === "in_transit" && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleUpdateStatus(s.id, "delivered")}
                        >
                          Entregado ✓
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
