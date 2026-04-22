import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { paymentsApi, ordersApi } from "../services/api";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  CreditCard,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Shield,
  Receipt,
  DollarSign,
  TrendingUp,
  Zap,
  ChevronDown,
} from "lucide-react";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    "pk_test_51TDZt1E9kBxCJwntAWeM1HbFiNc3Z9RFT2ojKJbaZSIwzLUnVw78eJrKmz9WWqnYWCn72Sht3bYw4dqRfvCfvAQp00TDiynNvH",
);

// ─── PDF Generator ────────────────────────────────────────────────────────────
async function generateReceipt(payment, order) {
  try {
    const { default: jsPDF } = await import("jspdf");
    let amount = payment.amount || 0;
    if (amount < 1000 && order?.items?.length > 0)
      amount = order.items.reduce((s, i) => s + (i.subtotal || 0), 0);
    if (amount < 1000 && order?.total_amount) amount = order.total_amount;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const G = [16, 185, 129],
      D = [15, 15, 20],
      GR = [107, 114, 128],
      LG = [243, 244, 246];

    doc.setFillColor(...D);
    doc.rect(0, 0, 210, 297, "F");
    doc.setFillColor(...G);
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("EcoMod", 20, 18);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Plataforma de comercio electrónico", 20, 28);
    doc.setFont("helvetica", "bold");
    doc.text(`Comprobante #${payment.id}`, 190, 18, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(
      new Date(payment.created_at).toLocaleDateString("es-CO"),
      190,
      28,
      { align: "right" },
    );

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("COMPROBANTE DE PAGO", 105, 60, { align: "center" });
    doc.setDrawColor(...G);
    doc.setLineWidth(0.8);
    doc.line(70, 65, 140, 65);

    let y = 85;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Información del pago", 20, y);
    doc.setDrawColor(...G);
    doc.line(20, y + 2, 75, y + 2);
    y += 12;
    doc.setFillColor(30, 30, 38);
    doc.roundedRect(20, y - 4, 170, 50, 4, 4, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GR);
    ["N° de transacción", "Método de pago", "Fecha y hora", "Estado"].forEach(
      (lbl, i) => {
        doc.text(lbl, 30, y + i * 11);
      },
    );
    doc.setFont("helvetica", "normal");
    doc.setTextColor(255, 255, 255);
    const meth =
      payment.payment_method === "card_stripe"
        ? "Tarjeta Stripe"
        : payment.payment_method === "paypal"
          ? "PayPal"
          : payment.payment_method;
    [
      payment.transaction_id?.slice(0, 28) || "N/A",
      meth,
      new Date(payment.created_at).toLocaleString("es-CO"),
      "PAGADO",
    ].forEach((val, i) => {
      if (val === "PAGADO") {
        doc.setFillColor(...G);
        doc.roundedRect(75, y + i * 11 - 3, 28, 6, 2, 2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text("PAGADO", 89, y + i * 11 + 1, { align: "center" });
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
      } else {
        doc.text(val, 75, y + i * 11);
      }
    });

    y += 62;
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Información de la orden", 20, y);
    doc.line(20, y + 2, 78, y + 2);
    y += 12;
    doc.setFillColor(30, 30, 38);
    doc.roundedRect(20, y - 4, 170, 28, 4, 4, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GR);
    doc.text("N° de orden", 30, y);
    doc.text("Monto total", 30, y + 11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...G);
    doc.setFontSize(13);
    doc.text(`#${payment.order_id}`, 75, y);
    doc.setFontSize(14);
    doc.text(`$${Math.round(amount).toLocaleString()} COP`, 75, y + 11);

    if (order?.items?.length > 0) {
      y += 40;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("Productos", 20, y);
      doc.line(20, y + 2, 48, y + 2);
      y += 12;
      doc.setFillColor(...G);
      doc.rect(20, y - 3, 170, 9, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Producto", 25, y + 2);
      doc.text("Cant.", 130, y + 2);
      doc.text("Subtotal", 170, y + 2, { align: "right" });
      y += 9;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(220, 220, 220);
      order.items.forEach((item, i) => {
        if (i % 2 === 0) {
          doc.setFillColor(30, 30, 38);
          doc.rect(20, y - 2, 170, 8, "F");
        }
        const name =
          item.product_name.length > 38
            ? item.product_name.slice(0, 35) + "..."
            : item.product_name;
        doc.text(name, 25, y + 2);
        doc.text(`${item.quantity}`, 130, y + 2);
        doc.text(`$${item.subtotal?.toLocaleString()}`, 170, y + 2, {
          align: "right",
        });
        y += 8;
      });
      y += 8;
      doc.setFillColor(25, 60, 45);
      doc.roundedRect(120, y - 5, 70, 14, 3, 3, "F");
      doc.setDrawColor(...G);
      doc.roundedRect(120, y - 5, 70, 14, 3, 3, "S");
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("TOTAL PAGADO", 30, y + 3);
      doc.setTextColor(...G);
      doc.text(`$${Math.round(amount).toLocaleString()} COP`, 185, y + 3, {
        align: "right",
      });
    }

    doc.setDrawColor(50, 50, 60);
    doc.setLineWidth(0.3);
    doc.line(20, 280, 190, 280);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GR);
    doc.text("Comprobante válido generado por EcoMod", 105, 287, {
      align: "center",
    });
    doc.text(`${new Date().toLocaleString("es-CO")}`, 105, 292, {
      align: "center",
    });

    doc.save(`comprobante-orden${payment.order_id}-pago${payment.id}.pdf`);
  } catch (e) {
    console.error(e);
    alert("Error al generar el comprobante.");
  }
}

// ─── Stripe Card Style ─────────────────────────────────────────────────────────
const CARD_STYLE = {
  style: {
    base: {
      fontSize: "15px",
      fontFamily: "'DM Mono', monospace",
      color: "#f0f0f0",
      letterSpacing: "0.04em",
      "::placeholder": { color: "#4a5568" },
      iconColor: "#10b981",
    },
    invalid: { color: "#f87171", iconColor: "#f87171" },
  },
};

// ─── Stripe Checkout Form ──────────────────────────────────────────────────────
function StripeCheckoutForm({ order, user, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setCardError(null);
    try {
      const intentData = await paymentsApi.createIntent({
        order_id: order.id,
        user_id: user.id,
        amount: order.total_amount,
      });
      const cardElement = elements.getElement(CardElement);
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        intentData.client_secret,
        {
          payment_method: {
            card: cardElement,
            billing_details: { name: user.nombre || `Usuario ${user.id}` },
          },
        },
      );
      if (error) {
        setCardError(error.message);
        onError(error.message);
        return;
      }
      if (paymentIntent.status !== "succeeded") {
        setCardError(`Estado inesperado: ${paymentIntent.status}`);
        onError(`Estado inesperado: ${paymentIntent.status}`);
        return;
      }
      const payment = await paymentsApi.confirmIntent({
        payment_intent_id: paymentIntent.id,
        order_id: order.id,
        user_id: user.id,
        amount: order.total_amount,
        payment_method: "card_stripe",
        email: user.email,
      });
      onSuccess(payment);
    } catch (err) {
      onError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="card-field-wrap">
        <div className="card-field-label">
          <CreditCard size={13} />
          <span>Datos de la tarjeta</span>
        </div>
        <div className="card-field-inner">
          <CardElement
            options={CARD_STYLE}
            onChange={(e) => setCardComplete(e.complete)}
          />
        </div>
      </div>

      {cardError && (
        <div className="field-error">
          <AlertCircle size={13} />
          <span>{cardError}</span>
        </div>
      )}

      <div className="test-cards-strip">
        <span className="test-label">SANDBOX</span>
        <span className="test-card">
          <code>4242 4242 4242 4242</code> OK
        </span>
        <span className="test-card">
          <code>4000 0000 0000 0002</code> ✗
        </span>
        <span className="test-card">
          <code>4000 0000 0000 9995</code> sin fondos
        </span>
      </div>

      <button
        type="submit"
        className={`pay-btn stripe-btn ${processing ? "loading" : ""}`}
        disabled={!stripe || processing || !cardComplete}
      >
        {processing ? (
          <span className="btn-spinner" />
        ) : (
          <>
            <span>Pagar ${order.total_amount?.toLocaleString()} COP</span>
            <ArrowRight size={16} />
          </>
        )}
      </button>

      <div className="secure-note">
        <Shield size={11} />
        <span>
          Pago cifrado · Datos procesados directamente por Stripe · No
          almacenamos tu tarjeta
        </span>
      </div>
    </form>
  );
}

// ─── PayPal Form ───────────────────────────────────────────────────────────────
function PaypalForm({ order, user, onError }) {
  const [processing, setProcessing] = useState(false);

  const handlePaypal = async () => {
    setProcessing(true);
    try {
      const amountUSD = (order.total_amount / 4200).toFixed(2);
      const response = await paymentsApi.createPaypalOrder({
        order_id: order.id,
        user_id: user.id,
        amount: parseFloat(amountUSD),
      });
      if (response.success && response.approval_url) {
        window.location.href = response.approval_url;
      } else {
        throw new Error(response.error || "Error al crear pago PayPal");
      }
    } catch (err) {
      onError(err.message);
      setProcessing(false);
    }
  };

  const usd = (order.total_amount / 4200).toFixed(2);

  return (
    <div className="paypal-panel">
      <div className="paypal-info">
        <div className="paypal-amount-row">
          <span className="paypal-cop">
            ${order.total_amount?.toLocaleString()} COP
          </span>
          <span className="paypal-sep">≈</span>
          <span className="paypal-usd">${usd} USD</span>
        </div>
        <p className="paypal-note">
          Serás redirigido a PayPal para completar el pago de forma segura. Al
          aprobar, regresarás automáticamente.
        </p>
      </div>
      <button
        className={`pay-btn paypal-btn ${processing ? "loading" : ""}`}
        onClick={handlePaypal}
        disabled={processing}
        type="button"
      >
        {processing ? (
          <span className="btn-spinner dark" />
        ) : (
          <>
            <PaypalLogo />
            <span>Continuar con PayPal</span>
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </div>
  );
}

function PaypalLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M7.077 21.255l.466-2.954.037-.19H5.5l1.14-7.232C7.08 7.58 9.613 5.5 12.5 5.5h3.277c1.115 0 1.95.21 2.46.621.48.387.66.97.55 1.779l-.003.02v.557l.42.238c.36.204.637.46.83.764.27.433.34.982.21 1.63-.17.83-.497 1.545-.966 2.121-.43.53-.975.94-1.62 1.217-.625.27-1.348.407-2.148.407h-.512c-.37 0-.726.133-.998.374-.274.24-.455.573-.51.935l-.037.2-.42 2.657-.02.1c-.007.05-.023.075-.043.092a.12.12 0 01-.075.025H7.077z"
        fill="#003087"
      />
      <path
        d="M19.04 8.02c-.018.115-.038.233-.062.354-.737 3.784-3.258 5.09-6.48 5.09h-1.64c-.394 0-.727.287-.788.676L9.3 19.5l-.26 1.658c-.044.277.17.527.452.527h3.17c.345 0 .638-.25.693-.59l.028-.148.55-3.49.036-.19c.054-.34.348-.59.693-.59h.437c2.825 0 5.034-1.146 5.68-4.46.27-1.385.13-2.542-.584-3.355a2.783 2.783 0 00-.796-.593l.003-.003z"
        fill="#009cde"
      />
    </svg>
  );
}

// ─── Receipt Modal ─────────────────────────────────────────────────────────────
function ReceiptModal({ payment, order, onClose }) {
  const [generating, setGenerating] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

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
      className="modal-bg"
      onClick={(e) => e.target === ref.current && onClose()}
      ref={ref}
    >
      <div className="modal-box receipt-box">
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        <div className="receipt-hero">
          <div className="receipt-icon-wrap">
            <CheckCircle size={32} className="receipt-check" />
          </div>
          <h2>¡Pago completado!</h2>
          <p>Tu orden #{payment.order_id} está siendo procesada</p>
        </div>

        <div className="receipt-grid">
          {[
            [
              "Transacción",
              <code key="t">
                {payment.transaction_id?.slice(0, 22) || "N/A"}
              </code>,
            ],
            [
              "Monto",
              <strong key="a">${payment.amount?.toLocaleString()} COP</strong>,
            ],
            [
              "Método",
              payment.payment_method === "card_stripe"
                ? "Tarjeta Stripe"
                : "PayPal",
            ],
            ["Fecha", new Date(payment.created_at).toLocaleString("es-CO")],
          ].map(([label, val]) => (
            <div key={label} className="receipt-cell">
              <span className="receipt-cell-label">{label}</span>
              <span className="receipt-cell-value">{val}</span>
            </div>
          ))}
        </div>

        {order?.items?.length > 0 && (
          <div className="receipt-items">
            <div className="receipt-items-head">
              <span>Producto</span>
              <span>Cant.</span>
              <span>Subtotal</span>
            </div>
            {order.items.map((item) => (
              <div key={item.id} className="receipt-item-row">
                <span>{item.product_name}</span>
                <span>×{item.quantity}</span>
                <span>${item.subtotal?.toLocaleString()}</span>
              </div>
            ))}
            <div className="receipt-total-row">
              <span>Total pagado</span>
              <strong>${payment.amount?.toLocaleString()} COP</strong>
            </div>
          </div>
        )}

        <div className="receipt-btns">
          <button className="btn-ghost" onClick={onClose}>
            Cerrar
          </button>
          <button
            className="btn-primary"
            onClick={handleDownload}
            disabled={generating}
          >
            <Download size={14} />
            {generating ? "Generando…" : "Descargar PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
  pending: {
    label: "Pendiente",
    icon: Clock,
    color: "#f59e0b",
    bg: "rgba(245,158,11,.12)",
  },
  succeeded: {
    label: "Exitoso",
    icon: CheckCircle,
    color: "#10b981",
    bg: "rgba(16,185,129,.12)",
  },
  failed: {
    label: "Fallido",
    icon: XCircle,
    color: "#ef4444",
    bg: "rgba(239,68,68,.12)",
  },
  refunded: {
    label: "Reembolsado",
    icon: RefreshCw,
    color: "#a78bfa",
    bg: "rgba(167,139,250,.12)",
  },
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState("");
  const [method, setMethod] = useState("stripe");
  const [receipt, setReceipt] = useState(null);
  const [selectOpen, setSelectOpen] = useState(false);

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
      setOrders(
        ords.filter((o) => o.status === "pending" || o.status === "confirmed"),
      );
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = async (payment) => {
    setMsg({
      type: "success",
      text: `Pago confirmado — TXN: ${payment.transaction_id}`,
    });
    setSelectedOrder("");
    await loadData();
    const order = allOrders.find((o) => o.id === payment.order_id);
    setReceipt({ payment, order });
  };

  const handleError = async (reason) => {
    setMsg({ type: "error", text: `Pago fallido: ${reason}` });
    await loadData();
  };

  const handleRefund = async (paymentId) => {
    try {
      await paymentsApi.refund(paymentId);
      setMsg({ type: "success", text: "Reembolso procesado" });
      await loadData();
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    }
  };

  const currentOrder = orders.find((o) => o.id === parseInt(selectedOrder));

  const stats = {
    total: payments
      .filter((p) => p.status === "succeeded")
      .reduce((a, p) => a + p.amount, 0),
    succeeded: payments.filter((p) => p.status === "succeeded").length,
    failed: payments.filter((p) => p.status === "failed").length,
    refunded: payments.filter((p) => p.status === "refunded").length,
  };

  if (loading)
    return (
      <div className="pm-loading">
        <div className="pm-loader" />
        <span>Cargando pagos…</span>
      </div>
    );

  return (
    <div className="pm-root">
      {/* ── Header ── */}
      <header className="pm-header">
        <div>
          <div className="pm-eyebrow">
            <Zap size={11} /> MÓDULO DE PAGOS
          </div>
          <h1 className="pm-title">Checkout</h1>
          <p className="pm-sub">Stripe · PayPal · Saga paso 3</p>
        </div>
        <button className="pm-refresh" onClick={loadData}>
          <RefreshCw size={14} /> Actualizar
        </button>
      </header>

      {/* ── Alert ── */}
      {msg && (
        <div className={`pm-alert ${msg.type}`}>
          {msg.type === "success" ? (
            <CheckCircle size={15} />
          ) : (
            <AlertCircle size={15} />
          )}
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)}>✕</button>
        </div>
      )}

      {/* ── Receipt Modal ── */}
      {receipt && (
        <ReceiptModal
          payment={receipt.payment}
          order={receipt.order}
          onClose={() => setReceipt(null)}
        />
      )}

      {/* ── Stats ── */}
      <div className="pm-stats">
        {[
          {
            icon: TrendingUp,
            label: "Total pagado",
            value: `$${stats.total.toLocaleString()}`,
            color: "#10b981",
          },
          {
            icon: CheckCircle,
            label: "Exitosos",
            value: stats.succeeded,
            color: "#34d399",
          },
          {
            icon: XCircle,
            label: "Fallidos",
            value: stats.failed,
            color: "#f87171",
          },
          {
            icon: RefreshCw,
            label: "Reembolsos",
            value: stats.refunded,
            color: "#a78bfa",
          },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="pm-stat">
            <Icon size={18} style={{ color }} />
            <div>
              <span className="pm-stat-val">{value}</span>
              <span className="pm-stat-lbl">{label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Payment Panel ── */}
      <div className="pm-panel">
        <div className="pm-panel-head">
          <Receipt size={16} />
          <span>Procesar pago</span>
        </div>

        {orders.length === 0 ? (
          <div className="pm-empty-orders">
            <AlertCircle size={20} />
            <span>No hay órdenes confirmadas pendientes de pago.</span>
          </div>
        ) : (
          <>
            {/* Order selector */}
            <div className="pm-select-wrap">
              <label className="pm-field-label">Orden a pagar</label>
              <div className={`pm-select-box ${selectOpen ? "open" : ""}`}>
                <button
                  type="button"
                  className="pm-select-trigger"
                  onClick={() => setSelectOpen(!selectOpen)}
                >
                  <span>
                    {currentOrder
                      ? `Orden #${currentOrder.id} — $${currentOrder.total_amount?.toLocaleString()} COP`
                      : "Selecciona una orden confirmada"}
                  </span>
                  <ChevronDown size={16} className="pm-chevron" />
                </button>
                {selectOpen && (
                  <div className="pm-dropdown">
                    {orders.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        className={`pm-option ${selectedOrder == o.id ? "selected" : ""}`}
                        onClick={() => {
                          setSelectedOrder(String(o.id));
                          setSelectOpen(false);
                        }}
                      >
                        <span className="pm-opt-id">#{o.id}</span>
                        <span className="pm-opt-amt">
                          ${o.total_amount?.toLocaleString()} COP
                        </span>
                        <span className="pm-opt-items">
                          {o.items?.length} producto(s)
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {currentOrder && (
              <>
                {/* Method tabs */}
                <div className="pm-tabs">
                  <button
                    className={`pm-tab ${method === "stripe" ? "active" : ""}`}
                    onClick={() => setMethod("stripe")}
                    type="button"
                  >
                    <CreditCard size={15} />
                    Tarjeta
                  </button>
                  <button
                    className={`pm-tab ${method === "paypal" ? "active" : ""}`}
                    onClick={() => setMethod("paypal")}
                    type="button"
                  >
                    <PaypalLogo />
                    PayPal
                  </button>
                </div>

                {/* Form area */}
                <div className="pm-form-area">
                  {method === "stripe" ? (
                    <Elements stripe={stripePromise}>
                      <StripeCheckoutForm
                        order={currentOrder}
                        user={user}
                        onSuccess={handleSuccess}
                        onError={handleError}
                      />
                    </Elements>
                  ) : (
                    <PaypalForm
                      order={currentOrder}
                      user={user}
                      onError={handleError}
                    />
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ── History ── */}
      <div className="pm-history">
        <div className="pm-history-head">
          <h3>
            Historial <span>{payments.length}</span>
          </h3>
        </div>

        {payments.length === 0 ? (
          <div className="pm-no-pays">
            <CreditCard size={40} strokeWidth={1} />
            <p>Sin pagos registrados aún</p>
          </div>
        ) : (
          <div className="pm-list">
            {payments.map((pay) => {
              const s = STATUS[pay.status] || STATUS.pending;
              const Icon = s.icon;
              return (
                <div key={pay.id} className="pm-row">
                  <div className="pm-row-left">
                    <div
                      className="pm-row-icon"
                      style={{ background: s.bg, color: s.color }}
                    >
                      <Icon size={15} />
                    </div>
                    <div>
                      <div className="pm-row-id">Pago #{pay.id}</div>
                      <div className="pm-row-meta">
                        Orden #{pay.order_id} ·{" "}
                        {new Date(pay.created_at).toLocaleDateString("es-CO")}
                      </div>
                    </div>
                  </div>
                  <div className="pm-row-right">
                    <div className="pm-row-method">
                      {pay.payment_method === "card_stripe"
                        ? "💳 Stripe"
                        : "🅿️ PayPal"}
                    </div>
                    <div
                      className="pm-badge"
                      style={{ background: s.bg, color: s.color }}
                    >
                      {s.label}
                    </div>
                    <div className="pm-row-amount">
                      ${pay.amount?.toLocaleString()}
                    </div>
                    <div className="pm-row-actions">
                      {pay.status === "succeeded" && (
                        <>
                          <button
                            title="Descargar comprobante"
                            onClick={() =>
                              generateReceipt(
                                pay,
                                allOrders.find((o) => o.id === pay.order_id),
                              )
                            }
                          >
                            <Download size={14} />
                          </button>
                          <button
                            title="Reembolsar"
                            onClick={() => handleRefund(pay.id)}
                          >
                            <RefreshCw size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Syne:wght@400;600;700;800&display=swap');

        .pm-root {
          font-family: 'Syne', sans-serif;
          max-width: 780px;
          margin: 0 auto;
          padding: 0 0 60px;
        }

        /* ── Header ── */
        .pm-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 32px 0 28px;
          border-bottom: 1px solid rgba(255,255,255,.07);
          margin-bottom: 28px;
        }
        .pm-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .18em;
          color: #10b981;
          margin-bottom: 10px;
        }
        .pm-title {
          font-size: 42px;
          font-weight: 800;
          letter-spacing: -.02em;
          margin: 0 0 4px;
          color: var(--text, #f0f0f0);
          line-height: 1;
        }
        .pm-sub {
          font-size: 13px;
          color: var(--text3, #6b7280);
          font-family: 'DM Mono', monospace;
          margin: 0;
        }
        .pm-refresh {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 18px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 40px;
          color: var(--text2, #9ca3af);
          font-size: 12px;
          font-family: 'Syne', sans-serif;
          cursor: pointer;
          transition: all .2s;
          margin-top: 8px;
        }
        .pm-refresh:hover { border-color: #10b981; color: #10b981; }

        /* ── Alert ── */
        .pm-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 20px;
          animation: slideDown .25s ease;
        }
        @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        .pm-alert.success { background: rgba(16,185,129,.1); border: 1px solid rgba(16,185,129,.2); color: #34d399; }
        .pm-alert.error   { background: rgba(239,68,68,.1);  border: 1px solid rgba(239,68,68,.2);  color: #f87171; }
        .pm-alert button  { margin-left: auto; background: none; border: none; cursor: pointer; color: inherit; font-size: 14px; }

        /* ── Stats ── */
        .pm-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .pm-stat {
          background: var(--surface, rgba(255,255,255,.04));
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 14px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: border-color .2s;
        }
        .pm-stat:hover { border-color: rgba(255,255,255,.15); }
        .pm-stat-val {
          display: block;
          font-size: 20px;
          font-weight: 800;
          color: var(--text, #f0f0f0);
          line-height: 1.1;
          font-family: 'DM Mono', monospace;
        }
        .pm-stat-lbl {
          display: block;
          font-size: 10px;
          color: var(--text3, #6b7280);
          letter-spacing: .06em;
          margin-top: 2px;
        }

        /* ── Panel ── */
        .pm-panel {
          background: var(--surface, rgba(255,255,255,.03));
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 18px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .pm-panel-head {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: .06em;
          color: var(--text2, #9ca3af);
          text-transform: uppercase;
          margin-bottom: 22px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255,255,255,.06);
        }
        .pm-empty-orders {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 20px;
          background: rgba(255,255,255,.03);
          border-radius: 10px;
          color: var(--text3, #6b7280);
          font-size: 14px;
        }

        /* ── Custom Select ── */
        .pm-field-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .1em;
          color: var(--text3, #6b7280);
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .pm-select-wrap { margin-bottom: 22px; position: relative; }
        .pm-select-box { position: relative; }
        .pm-select-trigger {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 13px 16px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 10px;
          color: var(--text, #f0f0f0);
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          cursor: pointer;
          transition: border-color .2s;
          text-align: left;
        }
        .pm-select-trigger:hover, .pm-select-box.open .pm-select-trigger {
          border-color: #10b981;
        }
        .pm-chevron { transition: transform .2s; color: var(--text3, #6b7280); flex-shrink: 0; }
        .pm-select-box.open .pm-chevron { transform: rotate(180deg); }
        .pm-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0; right: 0;
          background: var(--surface, #1a1a24);
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 10px;
          overflow: hidden;
          z-index: 50;
          animation: dropIn .15s ease;
        }
        @keyframes dropIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        .pm-option {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: background .15s;
          font-family: 'Syne', sans-serif;
        }
        .pm-option:hover  { background: rgba(255,255,255,.05); }
        .pm-option.selected { background: rgba(16,185,129,.08); }
        .pm-opt-id   { font-size: 13px; font-weight: 700; color: #10b981; font-family: 'DM Mono', monospace; }
        .pm-opt-amt  { font-size: 13px; color: var(--text, #f0f0f0); font-family: 'DM Mono', monospace; }
        .pm-opt-items{ font-size: 11px; color: var(--text3, #6b7280); margin-left: auto; }

        /* ── Tabs ── */
        .pm-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 22px;
          background: rgba(255,255,255,.03);
          border-radius: 12px;
          padding: 4px;
        }
        .pm-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          background: none;
          border: none;
          border-radius: 9px;
          cursor: pointer;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: var(--text3, #6b7280);
          transition: all .2s;
        }
        .pm-tab.active {
          background: rgba(16,185,129,.12);
          color: #10b981;
          border: 1px solid rgba(16,185,129,.25);
        }

        /* ── Form area ── */
        .pm-form-area { animation: fadeUp .2s ease; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

        /* ── Card Field ── */
        .card-field-wrap { margin-bottom: 16px; }
        .card-field-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .1em;
          color: var(--text3, #6b7280);
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .card-field-inner {
          padding: 14px 16px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 10px;
          transition: border-color .2s;
        }
        .card-field-inner:focus-within { border-color: #10b981; }

        /* ── Field error ── */
        .field-error {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          color: #f87171;
          padding: 9px 12px;
          background: rgba(239,68,68,.08);
          border-radius: 8px;
          margin-bottom: 14px;
          font-family: 'DM Mono', monospace;
        }

        /* ── Test cards strip ── */
        .test-cards-strip {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          padding: 10px 14px;
          background: rgba(52,211,153,.05);
          border-left: 2px solid rgba(52,211,153,.3);
          border-radius: 0 8px 8px 0;
          margin-bottom: 18px;
        }
        .test-label {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .15em;
          color: #34d399;
          background: rgba(52,211,153,.15);
          padding: 2px 7px;
          border-radius: 4px;
        }
        .test-card { font-size: 11px; color: var(--text3, #6b7280); font-family: 'DM Mono', monospace; }
        .test-card code {
          background: rgba(255,255,255,.06);
          padding: 2px 6px;
          border-radius: 4px;
          margin-right: 4px;
          color: var(--text, #f0f0f0);
        }

        /* ── Buttons ── */
        .pay-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 24px;
          border: none;
          border-radius: 12px;
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all .25s;
          margin-bottom: 12px;
        }
        .stripe-btn {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
        }
        .stripe-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(16,185,129,.35);
        }
        .stripe-btn:disabled { opacity: .5; cursor: not-allowed; }
        .paypal-btn {
          background: #ffc439;
          color: #003087;
        }
        .paypal-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(255,196,57,.3);
        }
        .paypal-btn:disabled { opacity: .5; cursor: not-allowed; }
        .pay-btn.loading { pointer-events: none; opacity: .7; }

        .btn-spinner {
          display: inline-block;
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin .6s linear infinite;
        }
        .btn-spinner.dark {
          border-color: rgba(0,0,0,.2);
          border-top-color: #003087;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .secure-note {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          color: var(--text3, #6b7280);
          font-family: 'DM Mono', monospace;
        }

        /* ── PayPal panel ── */
        .paypal-panel { padding: 4px 0; }
        .paypal-info { margin-bottom: 20px; }
        .paypal-amount-row {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 10px;
        }
        .paypal-cop { font-size: 24px; font-weight: 800; color: var(--text, #f0f0f0); font-family: 'DM Mono', monospace; }
        .paypal-sep { color: var(--text3, #6b7280); }
        .paypal-usd { font-size: 16px; color: #fbbf24; font-family: 'DM Mono', monospace; }
        .paypal-note { font-size: 13px; color: var(--text3, #6b7280); line-height: 1.6; margin: 0; }

        /* ── History ── */
        .pm-history {
          background: var(--surface, rgba(255,255,255,.03));
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 18px;
          overflow: hidden;
        }
        .pm-history-head {
          padding: 18px 22px;
          border-bottom: 1px solid rgba(255,255,255,.06);
        }
        .pm-history-head h3 {
          font-size: 15px;
          font-weight: 700;
          margin: 0;
          color: var(--text, #f0f0f0);
        }
        .pm-history-head h3 span {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px; height: 22px;
          background: rgba(16,185,129,.15);
          color: #10b981;
          border-radius: 6px;
          font-size: 11px;
          margin-left: 8px;
        }
        .pm-no-pays {
          text-align: center;
          padding: 52px 24px;
          color: var(--text3, #6b7280);
        }
        .pm-no-pays svg { margin-bottom: 14px; opacity: .4; }
        .pm-no-pays p { font-size: 14px; margin: 0; }

        .pm-list { display: flex; flex-direction: column; }
        .pm-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 22px;
          border-bottom: 1px solid rgba(255,255,255,.05);
          transition: background .15s;
          flex-wrap: wrap;
          gap: 10px;
        }
        .pm-row:last-child { border-bottom: none; }
        .pm-row:hover { background: rgba(255,255,255,.025); }

        .pm-row-left { display: flex; align-items: center; gap: 14px; }
        .pm-row-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .pm-row-id   { font-size: 14px; font-weight: 700; color: var(--text, #f0f0f0); }
        .pm-row-meta { font-size: 11px; color: var(--text3, #6b7280); font-family: 'DM Mono', monospace; margin-top: 2px; }

        .pm-row-right { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .pm-row-method {
          font-size: 12px;
          padding: 4px 10px;
          background: rgba(255,255,255,.05);
          border-radius: 20px;
          color: var(--text2, #9ca3af);
        }
        .pm-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          letter-spacing: .04em;
        }
        .pm-row-amount {
          font-size: 15px;
          font-weight: 800;
          color: var(--text, #f0f0f0);
          font-family: 'DM Mono', monospace;
          min-width: 90px;
          text-align: right;
        }
        .pm-row-actions { display: flex; gap: 6px; }
        .pm-row-actions button {
          width: 30px; height: 30px;
          border-radius: 8px;
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.08);
          color: var(--text3, #6b7280);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all .15s;
        }
        .pm-row-actions button:hover { border-color: #10b981; color: #10b981; }

        /* ── Loading ── */
        .pm-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          gap: 16px;
          color: var(--text3, #6b7280);
          font-size: 14px;
        }
        .pm-loader {
          width: 36px; height: 36px;
          border: 2px solid rgba(255,255,255,.1);
          border-top-color: #10b981;
          border-radius: 50%;
          animation: spin .7s linear infinite;
        }

        /* ── Receipt Modal ── */
        .modal-bg {
          position: fixed; inset: 0;
          background: rgba(0,0,0,.75);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          padding: 20px;
        }
        .modal-box {
          background: var(--surface, #15151e);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 20px;
          width: 100%;
          max-width: 480px;
          max-height: 88vh;
          overflow-y: auto;
          position: relative;
          animation: scaleIn .2s ease;
        }
        @keyframes scaleIn { from { opacity:0; transform:scale(.96); } to { opacity:1; transform:scale(1); } }
        .modal-close {
          position: absolute;
          top: 16px; right: 16px;
          width: 30px; height: 30px;
          background: rgba(255,255,255,.07);
          border: none; border-radius: 8px;
          color: var(--text2, #9ca3af);
          cursor: pointer;
          font-size: 13px;
          transition: background .15s;
        }
        .modal-close:hover { background: rgba(255,255,255,.12); }

        .receipt-hero {
          text-align: center;
          padding: 32px 28px 20px;
        }
        .receipt-icon-wrap {
          width: 64px; height: 64px;
          background: rgba(16,185,129,.12);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        .receipt-check { color: #10b981; }
        .receipt-hero h2 { font-size: 22px; font-weight: 800; margin: 0 0 6px; color: var(--text, #f0f0f0); }
        .receipt-hero p  { font-size: 13px; color: var(--text3, #6b7280); margin: 0; }

        .receipt-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: rgba(255,255,255,.06);
          margin: 0 24px 20px;
          border-radius: 12px;
          overflow: hidden;
        }
        .receipt-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 14px;
          background: rgba(255,255,255,.02);
        }
        .receipt-cell-label { font-size: 10px; color: var(--text3, #6b7280); letter-spacing: .08em; text-transform: uppercase; }
        .receipt-cell-value { font-size: 13px; color: var(--text, #f0f0f0); font-family: 'DM Mono', monospace; }
        .receipt-cell-value strong { color: #10b981; font-size: 15px; }
        .receipt-cell-value code { font-size: 11px; }

        .receipt-items { margin: 0 24px 20px; }
        .receipt-items-head {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          padding: 7px 0;
          font-size: 10px;
          font-weight: 700;
          color: var(--text3, #6b7280);
          letter-spacing: .08em;
          text-transform: uppercase;
          border-bottom: 1px solid rgba(255,255,255,.07);
        }
        .receipt-item-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          padding: 9px 0;
          font-size: 12px;
          color: var(--text2, #9ca3af);
          border-bottom: 1px solid rgba(255,255,255,.05);
          font-family: 'DM Mono', monospace;
        }
        .receipt-total-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          font-size: 14px;
          font-weight: 700;
          color: var(--text, #f0f0f0);
        }
        .receipt-total-row strong { color: #10b981; font-family: 'DM Mono', monospace; }

        .receipt-btns {
          display: flex;
          gap: 10px;
          padding: 16px 24px 24px;
          border-top: 1px solid rgba(255,255,255,.06);
        }
        .btn-ghost {
          flex: 1;
          padding: 11px;
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 10px;
          color: var(--text2, #9ca3af);
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          cursor: pointer;
          transition: all .15s;
        }
        .btn-ghost:hover { border-color: rgba(255,255,255,.2); }
        .btn-primary {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px;
          background: linear-gradient(135deg, #10b981, #059669);
          border: none;
          border-radius: 10px;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all .2s;
        }
        .btn-primary:hover:not(:disabled) { box-shadow: 0 4px 16px rgba(16,185,129,.3); }
        .btn-primary:disabled { opacity: .6; cursor: not-allowed; }

        @media (max-width: 600px) {
          .pm-stats { grid-template-columns: 1fr 1fr; }
          .pm-row-right { gap: 8px; }
          .pm-row-amount { min-width: unset; }
          .receipt-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
