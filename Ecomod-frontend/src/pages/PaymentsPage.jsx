import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { paymentsApi, ordersApi } from "../services/api";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  "pk_test_51TDZt1E9kBxCJwntAWeM1HbFiNc3Z9RFT2ojKJbaZSIwzLUnVw78eJrKmz9WWqnYWCn72Sht3bYw4dqRfvCfvAQp00TDiynNvH",
);

const PAY_STATUS = {
  pending: { label: "Pendiente", badge: "badge-yellow" },
  succeeded: { label: "Exitoso", badge: "badge-green" },
  failed: { label: "Fallido", badge: "badge-red" },
  refunded: { label: "Reembolsado", badge: "badge-pink" },
};

const CARD_STYLE = {
  style: {
    base: {
      fontSize: "14px",
      fontFamily: "DM Sans, sans-serif",
      "::placeholder": { color: "#a8a29e" },
      iconColor: "#4f46e5",
    },
    invalid: { color: "#dc2626", iconColor: "#dc2626" },
  },
};

// ─── Generador de PDF ───────────────────────────────────────────
async function generateReceipt(payment, order) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const W = 210;
  const margin = 20;
  let y = 20;

  // Header con fondo verde
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, W, 40, "F");

  // Logo texto
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("EcoMod", margin, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Commerce Platform", margin, 25);

  // Badge COMPROBANTE
  doc.setFillColor(255, 255, 255, 0.2);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("COMPROBANTE DE PAGO", W - margin, 22, { align: "right" });

  y = 55;

  // Sección estado
  const isSuccess = payment.status === "succeeded";
  doc.setFillColor(
    isSuccess ? 209 : 254,
    isSuccess ? 250 : 202,
    isSuccess ? 229 : 202,
  );
  doc.roundedRect(margin, y, W - margin * 2, 20, 3, 3, "F");

  doc.setTextColor(
    isSuccess ? 5 : 127,
    isSuccess ? 150 : 29,
    isSuccess ? 105 : 29,
  );
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(isSuccess ? "✓ Pago Exitoso" : "✗ Pago Fallido", W / 2, y + 13, {
    align: "center",
  });

  y += 30;

  // Número de transacción
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("NÚMERO DE TRANSACCIÓN", margin, y);

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(payment.transaction_id || "N/A", margin, y + 7);

  y += 20;

  // Línea separadora
  doc.setDrawColor(230, 230, 230);
  doc.line(margin, y, W - margin, y);
  y += 10;

  // Detalles del pago en dos columnas
  const col1 = margin;
  const col2 = W / 2;

  const addRow = (label, value, x, currentY) => {
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(label.toUpperCase(), x, currentY);
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(String(value), x, currentY + 6);
  };

  addRow("Pago #", `#${payment.id}`, col1, y);
  addRow("Orden #", `#${payment.order_id}`, col2, y);
  y += 18;

  addRow(
    "Fecha",
    new Date(payment.created_at).toLocaleString("es-CO"),
    col1,
    y,
  );
  addRow(
    "Método",
    payment.payment_method?.startsWith("pm_")
      ? "Tarjeta (Stripe)"
      : payment.payment_method,
    col2,
    y,
  );
  y += 18;

  addRow(
    "Estado",
    PAY_STATUS[payment.status]?.label || payment.status,
    col1,
    y,
  );
  addRow("Usuario #", String(payment.user_id), col2, y);
  y += 22;

  // Línea separadora
  doc.setDrawColor(230, 230, 230);
  doc.line(margin, y, W - margin, y);
  y += 10;

  // Detalle de la orden
  if (order?.items?.length > 0) {
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Detalle de la Orden", margin, y);
    y += 8;

    // Encabezado tabla
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, W - margin * 2, 8, "F");
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("PRODUCTO", margin + 2, y + 5);
    doc.text("CANT.", W - 80, y + 5);
    doc.text("PRECIO UNIT.", W - 60, y + 5);
    doc.text("SUBTOTAL", W - margin - 2, y + 5, { align: "right" });
    y += 10;

    order.items.forEach((item) => {
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(
        item.product_name || `Producto #${item.product_id}`,
        margin + 2,
        y + 4,
      );
      doc.text(String(item.quantity), W - 80, y + 4);
      doc.text(`$${item.unit_price?.toLocaleString()}`, W - 55, y + 4);
      doc.text(`$${item.subtotal?.toLocaleString()}`, W - margin - 2, y + 4, {
        align: "right",
      });

      doc.setDrawColor(240, 240, 240);
      doc.line(margin, y + 7, W - margin, y + 7);
      y += 9;
    });

    y += 4;
  }

  // Total
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(W - margin - 70, y, 70, 18, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("TOTAL PAGADO", W - margin - 35, y + 6, { align: "center" });
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`$${payment.amount?.toLocaleString()}`, W - margin - 35, y + 14, {
    align: "center",
  });

  y += 28;

  // Footer
  doc.setDrawColor(230, 230, 230);
  doc.line(margin, y, W - margin, y);
  y += 8;

  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    "EcoMod Commerce Platform — Todos los derechos reservados",
    W / 2,
    y,
    { align: "center" },
  );
  doc.text(
    "Este documento es un comprobante oficial de tu transacción.",
    W / 2,
    y + 5,
    { align: "center" },
  );
  doc.text(`Generado el ${new Date().toLocaleString("es-CO")}`, W / 2, y + 10, {
    align: "center",
  });

  doc.save(`comprobante-pago-${payment.id}-orden-${payment.order_id}.pdf`);
}

// ─── Stripe Form ─────────────────────────────────────────────
function StripeCheckoutForm({ order, user, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setCardError(null);
    try {
      const cardElement = elements.getElement(CardElement);
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });
      if (error) {
        setCardError(error.message);
        setProcessing(false);
        return;
      }
      const payment = await paymentsApi.process({
        order_id: order.id,
        user_id: user.id,
        amount: order.total_amount,
        payment_method: paymentMethod.id,
      });
      if (payment.status === "succeeded") {
        onSuccess(payment);
      } else {
        onError(payment.failure_reason);
      }
    } catch (err) {
      onError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        style={{
          padding: "14px 16px",
          background: "var(--bg2)",
          border: "1px solid var(--border2)",
          borderRadius: "var(--radius)",
          marginBottom: 16,
        }}
      >
        <CardElement options={CARD_STYLE} />
      </div>
      {cardError && (
        <div className="alert alert-error" style={{ marginBottom: 12 }}>
          {cardError}
        </div>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 13, color: "var(--text2)" }}>
            Total a pagar
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "var(--accent)",
              fontFamily: "var(--font-head)",
            }}
          >
            ${order.total_amount?.toLocaleString()}
          </div>
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!stripe || processing}
        >
          {processing ? "Procesando..." : "Pagar ahora →"}
        </button>
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: "var(--text3)" }}>
        🔒 Pago seguro procesado por Stripe · Tus datos no se almacenan en
        nuestros servidores
      </div>
    </form>
  );
}

function AlternativePayForm({ order, user, onSuccess, onError }) {
  const [method, setMethod] = useState("nequi");
  const [processing, setProcessing] = useState(false);

  const handlePay = async () => {
    setProcessing(true);
    try {
      const payment = await paymentsApi.process({
        order_id: order.id,
        user_id: user.id,
        amount: order.total_amount,
        payment_method: method,
      });
      if (payment.status === "succeeded") {
        onSuccess(payment);
      } else {
        onError(payment.failure_reason);
      }
    } catch (err) {
      onError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <div
        style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}
      >
        {[
          { id: "nequi", label: "🟣 Nequi" },
          { id: "daviplata", label: "🔵 Daviplata" },
          { id: "test_fail", label: "🧪 Test fallo" },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            className={`btn btn-sm ${method === m.id ? "btn-primary" : "btn-outline"}`}
            onClick={() => setMethod(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 13, color: "var(--text2)" }}>
            Total a pagar
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "var(--accent)",
              fontFamily: "var(--font-head)",
            }}
          >
            ${order.total_amount?.toLocaleString()}
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={handlePay}
          disabled={processing}
        >
          {processing ? "Procesando..." : "Pagar →"}
        </button>
      </div>
    </div>
  );
}

// ─── Modal Comprobante ────────────────────────────────────────
function ReceiptModal({ payment, order, onClose }) {
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    setGenerating(true);
    try {
      await generateReceipt(payment, order);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <span className="modal-title">🧾 Comprobante de Pago</span>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Estado */}
        <div style={{ textAlign: "center", padding: "20px 0 16px" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
          <div
            style={{
              fontFamily: "var(--font-head)",
              fontSize: 22,
              fontWeight: 800,
              color: "var(--accent)",
            }}
          >
            ¡Pago exitoso!
          </div>
          <div style={{ fontSize: 14, color: "var(--text2)", marginTop: 4 }}>
            Tu orden #{payment.order_id} está siendo procesada
          </div>
        </div>

        {/* Detalles */}
        <div
          style={{
            background: "var(--bg2)",
            borderRadius: "var(--radius)",
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            {[
              {
                label: "Transacción",
                value: payment.transaction_id?.slice(0, 20) || "N/A",
                mono: true,
              },
              {
                label: "Monto",
                value: `$${payment.amount?.toLocaleString()}`,
                color: "var(--accent)",
              },
              {
                label: "Método",
                value: payment.payment_method?.startsWith("pm_")
                  ? "Tarjeta Stripe"
                  : payment.payment_method,
              },
              {
                label: "Fecha",
                value: new Date(payment.created_at).toLocaleString("es-CO"),
              },
            ].map((d) => (
              <div key={d.label}>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text3)",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {d.label}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: d.color || "var(--text)",
                    fontFamily: d.mono ? "monospace" : "inherit",
                    marginTop: 2,
                  }}
                >
                  {d.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Items de la orden */}
        {order?.items?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 12,
                color: "var(--text3)",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Productos
            </div>
            {order.items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: "1px solid var(--border)",
                  fontSize: 13,
                }}
              >
                <span style={{ color: "var(--text2)" }}>
                  {item.product_name} × {item.quantity}
                </span>
                <span style={{ fontWeight: 600, color: "var(--text)" }}>
                  ${item.subtotal?.toLocaleString()}
                </span>
              </div>
            ))}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 0 0",
                fontWeight: 800,
                fontSize: 15,
              }}
            >
              <span style={{ color: "var(--text2)" }}>Total pagado</span>
              <span style={{ color: "var(--accent)" }}>
                ${payment.amount?.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Botones */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn btn-outline"
            style={{ flex: 1 }}
            onClick={onClose}
          >
            Cerrar
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={handleDownload}
            disabled={generating}
          >
            {generating ? "Generando..." : "⬇ Descargar PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página Principal ────────────────────────────────────────
export default function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState("");
  const [paymentType, setPaymentType] = useState("card");
  const [receipt, setReceipt] = useState(null); // { payment, order }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pays, ords] = await Promise.all([
        paymentsApi.getByUser(user.id),
        ordersApi.getByUser(user.id),
      ]);
      setPayments(pays);
      setAllOrders(ords);
      setOrders(ords.filter((o) => o.status === "confirmed"));
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = async (payment) => {
    setMsg({
      type: "success",
      text: `✓ Pago exitoso — TXN: ${payment.transaction_id}`,
    });
    setSelectedOrder("");
    await loadData();
    // Mostrar modal de comprobante
    const order = allOrders.find((o) => o.id === payment.order_id);
    setReceipt({ payment, order });
  };

  const handleError = async (reason) => {
    setMsg({ type: "error", text: `✗ Pago fallido: ${reason}` });
    await loadData();
  };

  const handleRefund = async (paymentId) => {
    try {
      await paymentsApi.refund(paymentId);
      setMsg({ type: "success", text: "Reembolso procesado correctamente" });
      await loadData();
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    }
  };

  const handleDownloadExisting = async (pay) => {
    const order = allOrders.find((o) => o.id === pay.order_id);
    await generateReceipt(pay, order);
  };

  const currentOrder = orders.find((o) => o.id === parseInt(selectedOrder));

  if (loading)
    return (
      <div className="page">
        <div className="empty">
          <div className="empty-icon">💳</div>
          <p>Cargando pagos...</p>
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

      {/* Modal comprobante */}
      {receipt && (
        <ReceiptModal
          payment={receipt.payment}
          order={receipt.order}
          onClose={() => setReceipt(null)}
        />
      )}

      {/* Procesar pago */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-header" style={{ marginBottom: 20 }}>
          <div>
            <span className="section-title">Procesar pago</span>
            <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 4 }}>
              <span style={{ color: "var(--pink)" }}>Saga paso 3</span> —
              notifica al order-service el resultado
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div
            style={{ padding: "12px 0", fontSize: 14, color: "var(--text3)" }}
          >
            No hay órdenes confirmadas pendientes de pago. Ve a Órdenes y crea
            una primera.
          </div>
        ) : (
          <>
            <div className="form-group">
              <label className="form-label">Orden a pagar</label>
              <select
                className="form-select"
                value={selectedOrder}
                onChange={(e) => setSelectedOrder(e.target.value)}
              >
                <option value="">Selecciona una orden confirmada</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    Orden #{o.id} — ${o.total_amount?.toLocaleString()} —{" "}
                    {o.items?.length} producto(s)
                  </option>
                ))}
              </select>
            </div>

            {currentOrder && (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  <button
                    className={`btn btn-sm ${paymentType === "card" ? "btn-primary" : "btn-outline"}`}
                    onClick={() => setPaymentType("card")}
                  >
                    💳 Tarjeta (Stripe)
                  </button>
                  <button
                    className={`btn btn-sm ${paymentType === "other" ? "btn-primary" : "btn-outline"}`}
                    onClick={() => setPaymentType("other")}
                  >
                    📱 Otros métodos
                  </button>
                </div>

                {paymentType === "card" ? (
                  <Elements stripe={stripePromise}>
                    <StripeCheckoutForm
                      order={currentOrder}
                      user={user}
                      onSuccess={handleSuccess}
                      onError={handleError}
                    />
                  </Elements>
                ) : (
                  <AlternativePayForm
                    order={currentOrder}
                    user={user}
                    onSuccess={handleSuccess}
                    onError={handleError}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Stats */}
      {payments.length > 0 && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          {[
            {
              label: "Total pagado",
              value: `$${payments
                .filter((p) => p.status === "succeeded")
                .reduce((a, p) => a + p.amount, 0)
                .toLocaleString()}`,
              color: "var(--accent)",
            },
            {
              label: "Pagos exitosos",
              value: payments.filter((p) => p.status === "succeeded").length,
              color: "var(--cyan)",
            },
            {
              label: "Pagos fallidos",
              value: payments.filter((p) => p.status === "failed").length,
              color: "var(--danger)",
            },
            {
              label: "Reembolsos",
              value: payments.filter((p) => p.status === "refunded").length,
              color: "var(--pink)",
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

      {/* Historial */}
      <div className="card">
        <div className="section-header">
          <span className="section-title">Historial de pagos</span>
          <span className="badge badge-cyan">{payments.length} total</span>
        </div>
        {payments.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">💳</div>
            <div className="empty-title">No hay pagos registrados</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Pago</th>
                  <th>Orden</th>
                  <th>Método</th>
                  <th>Estado</th>
                  <th>Transacción</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: "right" }}>Monto</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {payments.map((pay) => (
                  <tr key={pay.id}>
                    <td style={{ fontWeight: 600, color: "var(--text)" }}>
                      #{pay.id}
                    </td>
                    <td>Orden #{pay.order_id}</td>
                    <td>
                      {pay.payment_method?.startsWith("pm_")
                        ? "💳 Stripe"
                        : pay.payment_method === "nequi"
                          ? "🟣 Nequi"
                          : pay.payment_method === "daviplata"
                            ? "🔵 Daviplata"
                            : pay.payment_method}
                    </td>
                    <td>
                      <span
                        className={`badge ${PAY_STATUS[pay.status]?.badge || "badge-cyan"}`}
                      >
                        {PAY_STATUS[pay.status]?.label || pay.status}
                      </span>
                    </td>
                    <td
                      style={{
                        fontFamily: "monospace",
                        fontSize: 12,
                        color: "var(--text3)",
                      }}
                    >
                      {pay.transaction_id?.slice(0, 18) ||
                        pay.failure_reason?.slice(0, 25) ||
                        "—"}
                    </td>
                    <td>{new Date(pay.created_at).toLocaleString("es-CO")}</td>
                    <td
                      style={{
                        textAlign: "right",
                        fontWeight: 700,
                        color:
                          pay.status === "succeeded"
                            ? "var(--accent)"
                            : "var(--text2)",
                      }}
                    >
                      ${pay.amount?.toLocaleString()}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        display: "flex",
                        gap: 6,
                        justifyContent: "flex-end",
                      }}
                    >
                      {pay.status === "succeeded" && (
                        <>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDownloadExisting(pay)}
                            title="Descargar comprobante"
                          >
                            🧾
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRefund(pay.id)}
                          >
                            Reembolsar
                          </button>
                        </>
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
