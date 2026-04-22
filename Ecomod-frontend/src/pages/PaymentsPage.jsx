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
import {
  CreditCard,
  Smartphone,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Shield,
  Wallet,
  Receipt,
  DollarSign,
} from "lucide-react";

const stripePromise = loadStripe(
  "pk_test_51TDZt1E9kBxCJwntAWeM1HbFiNc3Z9RFT2ojKJbaZSIwzLUnVw78eJrKmz9WWqnYWCn72Sht3bYw4dqRfvCfvAQp00TDiynNvH",
);

const PAY_STATUS = {
  pending: {
    label: "Pendiente",
    icon: Clock,
    color: "#fbbf24",
    bg: "rgba(251, 191, 36, 0.1)",
  },
  succeeded: {
    label: "Exitoso",
    icon: CheckCircle,
    color: "#00ff88",
    bg: "rgba(0, 255, 136, 0.1)",
  },
  failed: {
    label: "Fallido",
    icon: XCircle,
    color: "#ff6b6b",
    bg: "rgba(255, 107, 107, 0.1)",
  },
  refunded: {
    label: "Reembolsado",
    icon: RefreshCw,
    color: "#f472b6",
    bg: "rgba(244, 114, 182, 0.1)",
  },
};

const CARD_STYLE = {
  style: {
    base: {
      fontSize: "14px",
      fontFamily: "DM Sans, sans-serif",
      color: "var(--text)",
      "::placeholder": { color: "var(--text3)" },
      iconColor: "var(--accent)",
    },
    invalid: { color: "#ff6b6b", iconColor: "#ff6b6b" },
  },
};

// Generador de PDF (mantiene la misma función pero la puedes modernizar después)

// Generador de PDF - VERSIÓN CON MONTO CALCULADO CORRECTAMENTE
// Generador de PDF - VERSIÓN CON SEPARACIÓN CORRECTA
async function generateReceipt(payment, order) {
  try {
    const { default: jsPDF } = await import("jspdf");

    // Calcular monto correcto
    let correctAmount = payment.amount || 0;
    if (correctAmount < 1000 && order?.items?.length > 0) {
      correctAmount = order.items.reduce(
        (sum, item) => sum + (item.subtotal || 0),
        0,
      );
    }
    if (correctAmount < 1000 && order?.total_amount) {
      correctAmount = order.total_amount;
    }
    const formattedAmount = Math.round(correctAmount).toLocaleString();

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Colores
    const green = [16, 185, 129];
    const greenLight = [209, 250, 229];
    const dark = [31, 41, 55];
    const gray = [107, 114, 128];
    const lightGray = [243, 244, 246];

    // ============ HEADER ============
    doc.setFillColor(green[0], green[1], green[2]);
    doc.rect(0, 0, 210, 38, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("EcoMod", 20, 18);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Plataforma de comercio electrónico", 20, 28);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Comprobante #${payment.id}`, 190, 18, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(
      new Date(payment.created_at).toLocaleDateString("es-CO"),
      190,
      28,
      { align: "right" },
    );

    // ============ TÍTULO ============
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("COMPROBANTE DE PAGO", 105, 58, { align: "center" });
    doc.setDrawColor(green[0], green[1], green[2]);
    doc.setLineWidth(0.8);
    doc.line(80, 63, 130, 63);

    // ============ SECCIÓN 1 ============
    let y = 85;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text("Información del pago", 20, y);
    doc.line(20, y + 2, 70, y + 2);

    y += 12;
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.roundedRect(20, y - 4, 170, 48, 4, 4, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text("N° de transacción", 30, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text(payment.transaction_id?.slice(0, 28) || "N/A", 75, y);

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text("Método de pago", 30, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(dark[0], dark[1], dark[2]);
    let method = payment.payment_method;
    if (method === "card_stripe") method = "Tarjeta de crédito";
    if (method === "paypal") method = "PayPal";
    if (method === "nequi") method = "Nequi";
    if (method === "daviplata") method = "Daviplata";
    doc.text(method, 75, y);

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text("Fecha y hora", 30, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text(new Date(payment.created_at).toLocaleString("es-CO"), 75, y);

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text("Estado", 30, y);
    doc.setFillColor(green[0], green[1], green[2]);
    doc.roundedRect(75, y - 3, 35, 7, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("PAGADO", 92, y + 1, { align: "center" });

    // ============ SECCIÓN 2 ============
    y += 28;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text("Información de la orden", 20, y);
    doc.line(20, y + 2, 70, y + 2);

    y += 12;
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.roundedRect(20, y - 4, 170, 35, 4, 4, "F");

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text("N° de orden", 30, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(green[0], green[1], green[2]);
    doc.setFontSize(14);
    doc.text(`#${payment.order_id}`, 75, y);

    y += 12;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text("Monto total", 30, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(green[0], green[1], green[2]);
    doc.setFontSize(15);
    doc.text(`$${formattedAmount} COP`, 75, y);

    // ============ SECCIÓN 3: PRODUCTOS ============
    if (order?.items?.length > 0) {
      y += 28;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(dark[0], dark[1], dark[2]);
      doc.text("Productos", 20, y);
      doc.line(20, y + 2, 50, y + 2);

      y += 12;

      // Encabezados tabla
      doc.setFillColor(green[0], green[1], green[2]);
      doc.rect(20, y - 3, 170, 9, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Producto", 25, y + 2);
      doc.text("Cantidad", 130, y + 2);
      doc.text("Subtotal", 170, y + 2, { align: "right" });

      y += 9;
      doc.setTextColor(dark[0], dark[1], dark[2]);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i];

        if (i % 2 === 0) {
          doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
          doc.rect(20, y - 2, 170, 8, "F");
        }

        const productName =
          item.product_name.length > 38
            ? item.product_name.substring(0, 35) + "..."
            : item.product_name;
        doc.text(productName, 25, y + 2);
        doc.text(`${item.quantity}`, 130, y + 2);
        doc.text(`$${item.subtotal?.toLocaleString()}`, 170, y + 2, {
          align: "right",
        });

        y += 8;

        if (y > 260) {
          doc.addPage();
          y = 30;
          doc.setFillColor(green[0], green[1], green[2]);
          doc.rect(20, y - 3, 170, 9, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.text("Producto", 25, y + 2);
          doc.text("Cantidad", 130, y + 2);
          doc.text("Subtotal", 170, y + 2, { align: "right" });
          y += 9;
          doc.setTextColor(dark[0], dark[1], dark[2]);
        }
      }

      y += 6;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(20, y, 190, y);

      y += 10;

      // ============ TOTAL SEPARADO ============
      // Fondo para el total
      doc.setFillColor(greenLight[0], greenLight[1], greenLight[2]);
      doc.roundedRect(120, y - 5, 70, 14, 4, 4, "F");
      doc.setDrawColor(green[0], green[1], green[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(120, y - 5, 70, 14, 4, 4, "S");

      // Texto "TOTAL PAGADO" a la izquierda del recuadro
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(dark[0], dark[1], dark[2]);
      doc.text("TOTAL PAGADO", 30, y + 3);

      // Monto a la derecha dentro del recuadro
      doc.setFontSize(12);
      doc.setTextColor(green[0], green[1], green[2]);
      doc.text(`$${formattedAmount} COP`, 185, y + 3, { align: "right" });
    }

    // ============ FOOTER ============
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(20, 280, 190, 280);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.text("Este documento es un comprobante de pago válido.", 105, 288, {
        align: "center",
      });
      doc.text(`Generado el ${new Date().toLocaleString("es-CO")}`, 105, 293, {
        align: "center",
      });
      doc.text(`Página ${i} de ${pageCount}`, 190, 293, { align: "right" });
    }

    doc.save(`comprobante-${payment.order_id}-${payment.id}.pdf`);
  } catch (error) {
    console.error("Error:", error);
    alert("Error al generar el comprobante.");
  }
}

function StripeCheckoutForm({ order, user, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      onError("Stripe no está listo");
      return;
    }

    setProcessing(true);
    setCardError(null);

    try {
      // 1. Crear PaymentIntent en el backend
      console.log("📦 Creando intent con:", {
        order_id: order.id,
        user_id: user.id,
        amount: order.total_amount,
      });

      const intentData = await paymentsApi.createIntent({
        order_id: order.id,
        user_id: user.id,
        amount: order.total_amount,
      });

      console.log("✅ Intent creado:", intentData);

      // 2. Confirmar pago con Stripe (interfaz del usuario)
      const cardElement = elements.getElement(CardElement);
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        intentData.client_secret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: user.nombre || `Usuario ${user.id}`,
            },
          },
        },
      );

      if (error) {
        console.error("❌ Error Stripe:", error);
        setCardError(error.message);
        onError(error.message);
        setProcessing(false);
        return;
      }

      if (paymentIntent.status !== "succeeded") {
        console.error("❌ Estado inesperado:", paymentIntent.status);
        setCardError(`Estado inesperado: ${paymentIntent.status}`);
        onError(`Estado inesperado: ${paymentIntent.status}`);
        setProcessing(false);
        return;
      }

      // 3. Confirmar en nuestro backend y guardar en BD
      const payment = await paymentsApi.confirmIntent({
        payment_intent_id: paymentIntent.id,
        order_id: order.id,
        user_id: user.id,
        amount: order.total_amount,
        payment_method: "card_stripe",
        email: user.email,
      });

      console.log("🎉 Pago confirmado:", payment);
      onSuccess(payment);
    } catch (err) {
      console.error("💥 Error general:", err);
      onError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-stripe-form">
      <div className="payment-card-element">
        <CardElement options={CARD_STYLE} />
      </div>

      {cardError && (
        <div className="payment-error">
          <AlertCircle size={14} />
          <span>{cardError}</span>
        </div>
      )}

      <div className="payment-actions">
        <div className="payment-total">
          <span className="payment-total-label">Total a pagar</span>
          <span className="payment-total-amount">
            ${order.total_amount?.toLocaleString()}
          </span>
        </div>
        <button
          type="submit"
          className="payment-submit-btn"
          disabled={!stripe || processing}
        >
          {processing ? (
            <div className="payment-spinner"></div>
          ) : (
            <>
              Pagar ahora <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>

      <div className="payment-security">
        <Shield size={12} />
        <span>
          Pago seguro procesado por Stripe · Tus datos no se almacenan en
          nuestros servidores
        </span>
      </div>

      <div className="payment-test-cards">
        <strong>Tarjetas de prueba Stripe:</strong>
        <div className="payment-test-grid">
          <code>4242 4242 4242 4242</code> <span>✅ Éxito</span>
          <code>4000 0000 0000 0002</code> <span>❌ Rechazo</span>
          <code>4000 0000 0000 9995</code> <span>💰 Fondos insuficientes</span>
        </div>
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
      let payment;

      if (method === "paypal") {
        // Convertir COP a USD (aprox 1 USD = 4200 COP)
        const amountUSD = (order.total_amount / 4200).toFixed(2);

        const response = await paymentsApi.createPaypalOrder({
          order_id: order.id,
          user_id: user.id,
          amount: parseFloat(amountUSD),
        });

        if (response.success && response.approval_url) {
          // Redirigir a PayPal
          window.location.href = response.approval_url;
          return;
        } else {
          throw new Error(response.error || "Error al crear pago PayPal");
        }
      } else {
        // Nequi, Daviplata, test
        payment = await paymentsApi.process({
          order_id: order.id,
          user_id: user.id,
          amount: order.total_amount,
          payment_method: method,
        });

        if (payment.status === "succeeded") {
          onSuccess(payment);
        } else {
          onError(payment.failure_reason || "Pago fallido");
        }
      }
    } catch (err) {
      onError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const methods = [
    { id: "nequi", label: "Nequi", icon: Smartphone, color: "#7c3aed" },
    { id: "daviplata", label: "Daviplata", icon: Wallet, color: "#2563eb" },
    { id: "paypal", label: "PayPal", icon: CreditCard, color: "#0070ba" },
    {
      id: "test_success",
      label: "Test Éxito",
      icon: CheckCircle,
      color: "#00ff88",
    },
    {
      id: "test_fail",
      label: "Test Fallo",
      icon: AlertCircle,
      color: "#ef4444",
    },
  ];

  return (
    <div className="payment-alternative">
      <div className="payment-methods">
        {methods.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              type="button"
              className={`payment-method-btn ${method === m.id ? "active" : ""}`}
              onClick={() => setMethod(m.id)}
              style={{
                borderColor: method === m.id ? m.color : "var(--border)",
              }}
            >
              <Icon size={18} style={{ color: m.color }} />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      <div className="payment-actions">
        <div className="payment-total">
          <span className="payment-total-label">Total a pagar</span>
          <span className="payment-total-amount">
            ${order.total_amount?.toLocaleString()}
          </span>
        </div>
        <button
          className="payment-submit-btn"
          onClick={handlePay}
          disabled={processing}
        >
          {processing ? (
            <div className="payment-spinner"></div>
          ) : (
            <>
              Pagar con{" "}
              {method === "paypal"
                ? "PayPal"
                : method === "nequi"
                  ? "Nequi"
                  : method === "daviplata"
                    ? "Daviplata"
                    : "Método"}{" "}
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

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
      className="modal-modern"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-modern-content receipt-modal">
        <div className="modal-modern-header">
          <h3>🧾 Comprobante de Pago</h3>
          <button className="modal-modern-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="receipt-success">
          <CheckCircle size={48} />
          <h2>¡Pago exitoso!</h2>
          <p>Tu orden #{payment.order_id} está siendo procesada</p>
        </div>

        <div className="receipt-details">
          <div className="receipt-detail">
            <span>Transacción</span>
            <code>{payment.transaction_id?.slice(0, 20) || "N/A"}</code>
          </div>
          <div className="receipt-detail">
            <span>Monto</span>
            <strong>${payment.amount?.toLocaleString()}</strong>
          </div>
          <div className="receipt-detail">
            <span>Método</span>
            <span>
              {payment.payment_method === "card_stripe"
                ? "Tarjeta Stripe"
                : payment.payment_method}
            </span>
          </div>
          <div className="receipt-detail">
            <span>Fecha</span>
            <span>{new Date(payment.created_at).toLocaleString("es-CO")}</span>
          </div>
        </div>

        {order?.items?.length > 0 && (
          <div className="receipt-items">
            <div className="receipt-items-header">
              <span>Producto</span>
              <span>Cant.</span>
              <span>Subtotal</span>
            </div>
            {order.items.map((item) => (
              <div key={item.id} className="receipt-item">
                <span>{item.product_name}</span>
                <span>×{item.quantity}</span>
                <span>${item.subtotal?.toLocaleString()}</span>
              </div>
            ))}
            <div className="receipt-total">
              <span>Total pagado</span>
              <strong>${payment.amount?.toLocaleString()}</strong>
            </div>
          </div>
        )}

        <div className="receipt-actions">
          <button className="receipt-close" onClick={onClose}>
            Cerrar
          </button>
          <button
            className="receipt-download"
            onClick={handleDownload}
            disabled={generating}
          >
            <Download size={16} />
            {generating ? "Generando..." : "Descargar PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState("");
  const [paymentType, setPaymentType] = useState("card");
  const [receipt, setReceipt] = useState(null);

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

  const stats = {
    total: payments
      .filter((p) => p.status === "succeeded")
      .reduce((a, p) => a + p.amount, 0),
    succeeded: payments.filter((p) => p.status === "succeeded").length,
    failed: payments.filter((p) => p.status === "failed").length,
    refunded: payments.filter((p) => p.status === "refunded").length,
  };

  if (loading) {
    return (
      <div className="payments-loading">
        <div className="payments-loading-spinner"></div>
        <p>Cargando pagos...</p>
      </div>
    );
  }

  return (
    <div className="payments-modern">
      {/* Header */}
      <div className="payments-header">
        <div className="payments-header-left">
          <div className="payments-badge">
            <CreditCard size={14} />
            <span>GESTIÓN DE PAGOS</span>
          </div>
          <h1 className="payments-title">
            Pagos
            <span>Procesa pagos seguros con Stripe</span>
          </h1>
        </div>
        <div className="payments-header-right">
          <button className="payments-refresh" onClick={loadData}>
            <RefreshCw size={14} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Alert */}
      {msg && (
        <div className={`payments-alert ${msg.type}`}>
          {msg.type === "success" ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)}>✕</button>
        </div>
      )}

      {/* Receipt Modal */}
      {receipt && (
        <ReceiptModal
          payment={receipt.payment}
          order={receipt.order}
          onClose={() => setReceipt(null)}
        />
      )}

      {/* Process Payment Card */}
      <div className="payments-process-card">
        <div className="payments-process-header">
          <h3>Procesar pago</h3>
          <span className="payments-saga-badge">Saga paso 3</span>
        </div>

        {orders.length === 0 ? (
          <div className="payments-no-orders">
            <AlertCircle size={24} />
            <p>No hay órdenes confirmadas pendientes de pago.</p>
          </div>
        ) : (
          <>
            <div className="payments-order-select">
              <label>Orden a pagar</label>
              <select
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
                <div className="payments-type-toggle">
                  <button
                    className={`payments-type-btn ${paymentType === "card" ? "active" : ""}`}
                    onClick={() => setPaymentType("card")}
                  >
                    <CreditCard size={16} />
                    Tarjeta (Stripe)
                  </button>
                  <button
                    className={`payments-type-btn ${paymentType === "other" ? "active" : ""}`}
                    onClick={() => setPaymentType("other")}
                  >
                    <Smartphone size={16} />
                    Otros métodos
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
        <div className="payments-stats">
          <div className="payments-stat-card">
            <div
              className="payments-stat-icon"
              style={{ background: "rgba(0, 255, 136, 0.1)", color: "#00ff88" }}
            >
              <DollarSign size={22} />
            </div>
            <div className="payments-stat-info">
              <span className="payments-stat-label">Total pagado</span>
              <span className="payments-stat-value">
                ${stats.total.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="payments-stat-card">
            <div
              className="payments-stat-icon"
              style={{ background: "rgba(0, 212, 255, 0.1)", color: "#00d4ff" }}
            >
              <CheckCircle size={22} />
            </div>
            <div className="payments-stat-info">
              <span className="payments-stat-label">Exitosos</span>
              <span className="payments-stat-value">{stats.succeeded}</span>
            </div>
          </div>
          <div className="payments-stat-card">
            <div
              className="payments-stat-icon"
              style={{
                background: "rgba(255, 107, 107, 0.1)",
                color: "#ff6b6b",
              }}
            >
              <XCircle size={22} />
            </div>
            <div className="payments-stat-info">
              <span className="payments-stat-label">Fallidos</span>
              <span className="payments-stat-value">{stats.failed}</span>
            </div>
          </div>
          <div className="payments-stat-card">
            <div
              className="payments-stat-icon"
              style={{
                background: "rgba(244, 114, 182, 0.1)",
                color: "#f472b6",
              }}
            >
              <RefreshCw size={22} />
            </div>
            <div className="payments-stat-info">
              <span className="payments-stat-label">Reembolsos</span>
              <span className="payments-stat-value">{stats.refunded}</span>
            </div>
          </div>
        </div>
      )}

      {/* Payments History */}
      <div className="payments-history-card">
        <div className="payments-history-header">
          <h3>Historial de pagos</h3>
          <span className="payments-count">{payments.length} total</span>
        </div>

        {payments.length === 0 ? (
          <div className="payments-empty">
            <CreditCard size={48} strokeWidth={1} />
            <h4>No hay pagos registrados</h4>
          </div>
        ) : (
          <div className="payments-list">
            {payments.map((pay, idx) => {
              const statusConfig = PAY_STATUS[pay.status] || PAY_STATUS.pending;
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={pay.id}
                  className="payments-item"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="payments-item-info">
                    <div className="payments-item-id">Pago #{pay.id}</div>
                    <div className="payments-item-order">
                      Orden #{pay.order_id}
                    </div>
                    <div className="payments-item-date">
                      {new Date(pay.created_at).toLocaleString("es-CO")}
                    </div>
                  </div>
                  <div className="payments-item-details">
                    <div className="payments-item-method">
                      {pay.payment_method === "card_stripe"
                        ? "💳 Stripe"
                        : pay.payment_method === "nequi"
                          ? "🟣 Nequi"
                          : pay.payment_method === "daviplata"
                            ? "🔵 Daviplata"
                            : pay.payment_method}
                    </div>
                    <div
                      className="payments-status-badge"
                      style={{
                        background: statusConfig.bg,
                        color: statusConfig.color,
                      }}
                    >
                      <StatusIcon size={12} />
                      <span>{statusConfig.label}</span>
                    </div>
                    <div className="payments-item-amount">
                      ${pay.amount?.toLocaleString()}
                    </div>
                    <div className="payments-item-actions">
                      {pay.status === "succeeded" && (
                        <>
                          <button
                            onClick={() => handleDownloadExisting(pay)}
                            title="Descargar comprobante"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => handleRefund(pay.id)}
                            title="Reembolsar"
                          >
                            <RefreshCw size={16} />
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

      <style jsx>{`
        .payments-modern {
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

        .payments-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 16px;
        }

        .payments-loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .payments-header {
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

        .payments-badge {
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

        .payments-title {
          font-size: 28px;
          font-weight: 800;
          margin: 0;
        }

        .payments-title span {
          display: block;
          font-size: 14px;
          font-weight: 400;
          color: var(--text2);
          margin-top: 4px;
        }

        .payments-refresh {
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

        .payments-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          border-radius: var(--radius);
          margin-bottom: 20px;
          animation: slideDown 0.3s ease;
        }

        .payments-alert.success {
          background: rgba(124, 252, 110, 0.1);
          border: 1px solid rgba(124, 252, 110, 0.2);
          color: var(--accent);
        }

        .payments-alert.error {
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.2);
          color: var(--danger);
        }

        .payments-alert button {
          margin-left: auto;
          background: none;
          border: none;
          cursor: pointer;
          color: currentColor;
        }

        .payments-process-card {
          background: var(--surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          padding: 24px;
          margin-bottom: 24px;
        }

        .payments-process-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border);
        }

        .payments-process-header h3 {
          font-size: 16px;
          font-weight: 600;
        }

        .payments-saga-badge {
          padding: 4px 12px;
          background: rgba(244, 114, 182, 0.1);
          border-radius: 20px;
          font-size: 11px;
          color: #f472b6;
        }

        .payments-no-orders {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px;
          background: var(--bg2);
          border-radius: var(--radius);
          color: var(--text3);
        }

        .payments-order-select {
          margin-bottom: 20px;
        }

        .payments-order-select label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: var(--text2);
          margin-bottom: 8px;
        }

        .payments-order-select select {
          width: 100%;
          padding: 12px 16px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          color: var(--text);
          font-size: 14px;
        }

        .payments-type-toggle {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }

        .payments-type-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          cursor: pointer;
          transition: all 0.2s;
        }

        .payments-type-btn.active {
          background: rgba(0, 255, 136, 0.1);
          border-color: var(--accent);
          color: var(--accent);
        }

        .payment-stripe-form {
          margin-top: 20px;
        }

        .payment-card-element {
          padding: 14px 16px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          margin-bottom: 16px;
        }

        .payment-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(255, 107, 107, 0.1);
          border-radius: var(--radius);
          margin-bottom: 16px;
          font-size: 12px;
          color: #ff6b6b;
        }

        .payment-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 16px;
        }

        .payment-total {
          text-align: right;
        }

        .payment-total-label {
          display: block;
          font-size: 11px;
          color: var(--text3);
        }

        .payment-total-amount {
          font-size: 24px;
          font-weight: 800;
          color: var(--accent);
        }

        .payment-submit-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 28px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border: none;
          border-radius: 40px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .payment-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(124, 252, 110, 0.3);
        }

        .payment-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(0, 0, 0, 0.3);
          border-top-color: #000;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        .payment-security {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: var(--bg2);
          border-radius: var(--radius);
          font-size: 11px;
          color: var(--text3);
          margin-bottom: 12px;
        }

        .payment-test-cards {
          padding: 12px;
          background: rgba(0, 212, 255, 0.05);
          border-radius: var(--radius);
          font-size: 11px;
          border-left: 3px solid #00d4ff;
        }

        .payment-test-cards strong {
          display: block;
          margin-bottom: 8px;
        }

        .payment-test-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .payment-test-grid code {
          padding: 2px 6px;
          background: var(--bg);
          border-radius: 4px;
          font-family: monospace;
        }

        .payment-alternative {
          margin-top: 20px;
        }

        .payment-methods {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .payment-method-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          cursor: pointer;
          transition: all 0.2s;
        }

        .payment-method-btn.active {
          background: rgba(0, 255, 136, 0.05);
        }

        .payments-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .payments-stat-card {
          background: var(--surface);
          border-radius: var(--radius-lg);
          padding: 20px;
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s;
        }

        .payments-stat-card:hover {
          transform: translateY(-2px);
          border-color: var(--accent);
        }

        .payments-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .payments-stat-info {
          flex: 1;
        }

        .payments-stat-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text3);
        }

        .payments-stat-value {
          display: block;
          font-size: 28px;
          font-weight: 800;
          margin-top: 4px;
        }

        .payments-history-card {
          background: var(--surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          overflow: hidden;
        }

        .payments-history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }

        .payments-history-header h3 {
          font-size: 16px;
          font-weight: 600;
        }

        .payments-count {
          padding: 4px 12px;
          background: rgba(0, 212, 255, 0.1);
          border-radius: 20px;
          font-size: 12px;
          color: #00d4ff;
        }

        .payments-empty {
          text-align: center;
          padding: 60px 24px;
        }

        .payments-empty svg {
          color: var(--text3);
          margin-bottom: 16px;
        }

        .payments-empty h4 {
          font-size: 18px;
          margin-bottom: 8px;
        }

        .payments-list {
          display: flex;
          flex-direction: column;
        }

        .payments-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-bottom: 1px solid var(--border);
          transition: all 0.2s;
          animation: slideIn 0.3s ease-out forwards;
          opacity: 0;
          transform: translateX(-10px);
          flex-wrap: wrap;
          gap: 12px;
        }

        @keyframes slideIn {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .payments-item:hover {
          background: var(--bg2);
        }

        .payments-item-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .payments-item-id {
          font-size: 14px;
          font-weight: 700;
        }

        .payments-item-order {
          font-size: 11px;
          color: var(--text3);
        }

        .payments-item-date {
          font-size: 11px;
          color: var(--text3);
        }

        .payments-item-details {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .payments-item-method {
          font-size: 12px;
          padding: 4px 10px;
          background: var(--bg);
          border-radius: 20px;
        }

        .payments-status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .payments-item-amount {
          font-size: 16px;
          font-weight: 800;
          color: var(--accent);
        }

        .payments-item-actions {
          display: flex;
          gap: 8px;
        }

        .payments-item-actions button {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--bg2);
          border: 1px solid var(--border);
          cursor: pointer;
          transition: all 0.2s;
        }

        .payments-item-actions button:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .modal-modern {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-modern-content {
          background: var(--surface);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-modern-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }

        .modal-modern-header h3 {
          font-size: 18px;
          font-weight: 700;
        }

        .modal-modern-close {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--bg2);
          border: none;
          cursor: pointer;
        }

        .receipt-success {
          text-align: center;
          padding: 24px;
        }

        .receipt-success svg {
          color: #00ff88;
          margin-bottom: 16px;
        }

        .receipt-success h2 {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .receipt-success p {
          color: var(--text2);
        }

        .receipt-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          padding: 20px 24px;
          background: var(--bg2);
          margin: 0 24px 20px;
          border-radius: var(--radius);
        }

        .receipt-detail {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .receipt-detail span:first-child {
          font-size: 10px;
          color: var(--text3);
          text-transform: uppercase;
        }

        .receipt-detail code {
          font-size: 11px;
          font-family: monospace;
        }

        .receipt-items {
          margin: 0 24px 20px;
        }

        .receipt-items-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          padding: 8px 0;
          font-size: 10px;
          font-weight: 600;
          color: var(--text3);
          border-bottom: 1px solid var(--border);
        }

        .receipt-item {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          padding: 8px 0;
          font-size: 12px;
          border-bottom: 1px solid var(--border);
        }

        .receipt-total {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          font-size: 14px;
          font-weight: 700;
        }

        .receipt-actions {
          display: flex;
          gap: 12px;
          padding: 20px 24px;
          border-top: 1px solid var(--border);
        }

        .receipt-close {
          flex: 1;
          padding: 12px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          cursor: pointer;
        }

        .receipt-download {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border: none;
          border-radius: var(--radius);
          font-weight: 600;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .payments-header {
            flex-direction: column;
            align-items: stretch;
          }
          .payments-stats {
            grid-template-columns: 1fr 1fr;
          }
          .payments-item {
            flex-direction: column;
            align-items: flex-start;
          }
          .payments-item-details {
            width: 100%;
            justify-content: space-between;
          }
          .receipt-details {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
