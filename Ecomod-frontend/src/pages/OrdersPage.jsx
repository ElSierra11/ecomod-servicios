import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { ordersApi, cartApi } from "../services/api";

const STATUS = {
  pending: { label: "Pendiente", badge: "badge-yellow" },
  confirmed: { label: "Confirmada", badge: "badge-cyan" },
  shipped: { label: "Enviada", badge: "badge-green" },
  delivered: { label: "Entregada", badge: "badge-green" },
  cancelled: { label: "Cancelada", badge: "badge-red" },
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersApi.getByUser(user.id);
      setOrders(data);
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromCart = async () => {
    setCreating(true);
    setMsg(null);
    try {
      const cart = await cartApi.getByUser(user.id);
      if (!cart.items || cart.items.length === 0) {
        setMsg({
          type: "error",
          text: "El carrito está vacío. Agrega productos antes de crear una orden.",
        });
        return;
      }
      const order = await ordersApi.create({
        user_id: user.id,
        cart_id: cart.id,
        items: cart.items.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          unit_price: item.unit_price,
          quantity: item.quantity,
        })),
      });
      setMsg({
        type: order.status === "confirmed" ? "success" : "error",
        text:
          order.status === "confirmed"
            ? `✓ Orden #${order.id} confirmada — stock reservado en inventory-service`
            : `✗ Orden #${order.id} cancelada — ${order.notes}`,
      });
      await loadOrders();
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setCreating(false);
    }
  };

  if (loading)
    return (
      <div className="page">
        <div className="empty">
          <div className="empty-icon">📋</div>
          <p>Cargando órdenes...</p>
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

      {/* Crear orden */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-header" style={{ marginBottom: 0 }}>
          <div>
            <span className="section-title">Crear orden desde carrito</span>
            <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 4 }}>
              Inicia la{" "}
              <span style={{ color: "var(--cyan)" }}>Saga coreografiada</span> —
              reserva stock automáticamente en inventory-service
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleCreateFromCart}
            disabled={creating}
          >
            {creating ? "Procesando Saga..." : "Crear orden →"}
          </button>
        </div>
      </div>

      {/* Saga steps indicator */}
      <div
        style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}
      >
        {[
          { step: "1", label: "Orden creada", color: "var(--cyan)" },
          { step: "2", label: "Stock reservado", color: "var(--accent)" },
          { step: "3", label: "Pago procesado", color: "var(--pink)" },
          { step: "4", label: "Orden enviada", color: "var(--warning)" },
        ].map((s) => (
          <div
            key={s.step}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              fontSize: 13,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: s.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color: "var(--bg)",
              }}
            >
              {s.step}
            </div>
            <span style={{ color: "var(--text2)" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Lista de órdenes */}
      <div className="card">
        <div className="section-header">
          <span className="section-title">Mis órdenes</span>
          <span className="badge badge-cyan">{orders.length} total</span>
        </div>

        {orders.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📋</div>
            <div className="empty-title">No tienes órdenes aún</div>
            <p>Agrega productos al carrito y crea tu primera orden</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Items</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <>
                    <tr
                      key={order.id}
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        setSelected(selected?.id === order.id ? null : order)
                      }
                    >
                      <td style={{ color: "var(--text)", fontWeight: 600 }}>
                        Orden #{order.id}
                      </td>
                      <td>
                        <span
                          className={`badge ${STATUS[order.status]?.badge || "badge-cyan"}`}
                        >
                          {STATUS[order.status]?.label || order.status}
                        </span>
                      </td>
                      <td>
                        {new Date(order.created_at).toLocaleString("es-CO")}
                      </td>
                      <td>{order.items?.length} producto(s)</td>
                      <td
                        style={{
                          textAlign: "right",
                          fontWeight: 700,
                          color: "var(--accent)",
                        }}
                      >
                        ${order.total_amount?.toLocaleString()}
                      </td>
                      <td style={{ textAlign: "right", color: "var(--text3)" }}>
                        {selected?.id === order.id ? "▲" : "▼"}
                      </td>
                    </tr>
                    {selected?.id === order.id && (
                      <tr key={`detail-${order.id}`}>
                        <td
                          colSpan={6}
                          style={{
                            padding: "0 0 12px",
                            background: "var(--bg2)",
                          }}
                        >
                          <div style={{ padding: "12px 16px" }}>
                            {order.notes && (
                              <div
                                style={{
                                  fontSize: 13,
                                  color: "var(--text2)",
                                  marginBottom: 10,
                                  padding: "8px 12px",
                                  background: "var(--surface)",
                                  borderRadius: 8,
                                }}
                              >
                                {order.notes}
                              </div>
                            )}
                            <table style={{ width: "100%" }}>
                              <thead>
                                <tr>
                                  <th>Producto</th>
                                  <th style={{ textAlign: "center" }}>Cant.</th>
                                  <th style={{ textAlign: "right" }}>Precio</th>
                                  <th style={{ textAlign: "right" }}>
                                    Subtotal
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.items?.map((item) => (
                                  <tr key={item.id}>
                                    <td>
                                      {item.product_name ||
                                        `Producto #${item.product_id}`}
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                      {item.quantity}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                      ${item.unit_price?.toLocaleString()}
                                    </td>
                                    <td
                                      style={{
                                        textAlign: "right",
                                        fontWeight: 600,
                                        color: "var(--text)",
                                      }}
                                    >
                                      ${item.subtotal?.toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
