import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { useToast } from "../App";
import { useSwal } from "../hooks/useSwal"; // ← NUEVO: Importar hook de SweetAlert
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
  ChevronDown,
  Wallet,
  Shield,
  Receipt,
  TrendingUp,
  Zap,
  FileText,
  Calendar,
  Hash,
  DollarSign,
  Printer,
  Copy,
  ChevronRight,
  ArrowRight,
  Package,
} from "lucide-react";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    "pk_test_51TDZt1E9kBxCJwntAWeM1HbFiNc3Z9RFT2ojKJbaZSIwzLUnVw78eJrKmz9WWqnYWCn72Sht3bYw4dqRfvCfvAQp00TDiynNvH",
);

/* ════════════════════════════════════════════════════════
   PDF PROFESIONAL - Comprobante bancario formal
   ════════════════════════════════════════════════════════ */
async function generateReceipt(payment, order) {
  try {
    const { default: jsPDF } = await import("jspdf");
    let amount = payment.amount || 0;
    if (amount < 1000 && order?.items?.length > 0)
      amount = order.items.reduce(
        (s, i) => s + (i.subtotal || i.unit_price * i.quantity || 0),
        0,
      );
    if (amount < 1000 && order?.total_amount) amount = order.total_amount;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageW = 210;
    const margin = 20;
    let y = 0;

    // ── Helpers ──
    const addText = (text, x, y_, opts = {}) => {
      const {
        size = 10,
        font = "normal",
        color = [33, 33, 33],
        align = "left",
      } = opts;
      doc.setFontSize(size);
      doc.setFont("helvetica", font);
      doc.setTextColor(...color);
      doc.text(text, x, y_, { align });
    };

    const addLine = (x1, y1, x2, y2, color = [200, 200, 200], width = 0.3) => {
      doc.setDrawColor(...color);
      doc.setLineWidth(width);
      doc.line(x1, y1, x2, y2);
    };

    const addBox = (x, y_, w, h, fillColor = [255, 255, 255], radius = 3) => {
      doc.setFillColor(...fillColor);
      doc.roundedRect(x, y_, w, h, radius, radius, "F");
    };

    // ══ HEADER BANNER ══
    doc.setFillColor(232, 41, 28);
    doc.rect(0, 0, pageW, 45, "F");

    // Logo area
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, 10, 50, 25, 4, 4, "F");
    addText("EcoMod", margin + 25, 22, {
      size: 18,
      font: "bold",
      color: [232, 41, 28],
      align: "center",
    });
    addText("Comprobante Oficial", margin + 25, 30, {
      size: 8,
      color: [107, 114, 128],
      align: "center",
    });

    // Header right info
    addText("COMPROBANTE DE PAGO", pageW - margin, 18, {
      size: 16,
      font: "bold",
      color: [255, 255, 255],
      align: "right",
    });
    addText(`No. ${String(payment.id).padStart(8, "0")}`, pageW - margin, 26, {
      size: 11,
      color: [255, 255, 255],
      align: "right",
    });
    addText(
      new Date(payment.created_at).toLocaleDateString("es-CO", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      pageW - margin,
      33,
      { size: 9, color: [255, 220, 220], align: "right" },
    );
    addText(
      new Date(payment.created_at).toLocaleTimeString("es-CO"),
      pageW - margin,
      38,
      { size: 8, color: [255, 200, 200], align: "right" },
    );

    // Decorative line
    addLine(0, 45, pageW, 45, [232, 41, 28], 1);

    // ══ STATUS BADGE ══
    y = 55;
    const statusColor =
      payment.status === "succeeded"
        ? [22, 163, 74]
        : payment.status === "failed"
          ? [220, 38, 38]
          : [245, 158, 11];
    const statusText =
      payment.status === "succeeded"
        ? "PAGO APROBADO"
        : payment.status === "failed"
          ? "PAGO RECHAZADO"
          : "PENDIENTE";

    doc.setFillColor(...statusColor);
    doc.roundedRect(pageW - margin - 60, y - 4, 60, 12, 6, 6, "F");
    addText(statusText, pageW - margin - 30, y + 3, {
      size: 9,
      font: "bold",
      color: [255, 255, 255],
      align: "center",
    });

    // ══ AMOUNT SECTION ══
    y = 72;
    addBox(margin, y, pageW - margin * 2, 35, [250, 250, 252], 4);
    addLine(margin + 10, y + 5, margin + 10, y + 30, [232, 41, 28], 2);

    addText("MONTO TOTAL PAGADO", margin + 18, y + 12, {
      size: 9,
      color: [107, 114, 128],
    });
    addText(
      `$ ${Math.round(amount).toLocaleString("es-CO")} COP`,
      margin + 18,
      y + 26,
      { size: 24, font: "bold", color: [232, 41, 28] },
    );

    addText("Moneda", pageW - margin - 50, y + 12, {
      size: 8,
      color: [107, 114, 128],
      align: "right",
    });
    addText("COP - Peso Colombiano", pageW - margin - 50, y + 20, {
      size: 9,
      font: "bold",
      color: [33, 33, 33],
      align: "right",
    });
    addText("Tasa: 1 USD = $4,200 COP", pageW - margin - 50, y + 28, {
      size: 8,
      color: [107, 114, 128],
      align: "right",
    });

    // ══ TRANSACTION DETAILS ══
    y = 118;
    addText("DETALLES DE LA TRANSACCIÓN", margin, y, {
      size: 11,
      font: "bold",
      color: [33, 33, 33],
    });
    addLine(margin, y + 3, margin + 60, y + 3, [232, 41, 28], 1);

    y += 12;
    addBox(margin, y, pageW - margin * 2, 55, [250, 250, 252], 4);

    const details = [
      ["ID de Transacción", payment.transaction_id?.slice(0, 32) || "N/A"],
      [
        "Método de Pago",
        payment.payment_method === "card_stripe"
          ? "Tarjeta de Crédito/Débito (Stripe)"
          : payment.payment_method === "paypal"
            ? "PayPal"
            : payment.payment_method,
      ],
      ["Fecha y Hora", new Date(payment.created_at).toLocaleString("es-CO")],
      ["Estado", statusText],
      ["Canal", payment.channel || "Web"],
    ];

    details.forEach(([label, value], i) => {
      const rowY = y + 10 + i * 10;
      addText(label, margin + 10, rowY, { size: 8, color: [107, 114, 128] });
      if (
        value === "PAGO APROBADO" ||
        value === "PAGO RECHAZADO" ||
        value === "PENDIENTE"
      ) {
        const stColor =
          value === "PAGO APROBADO"
            ? [22, 163, 74]
            : value === "PAGO RECHAZADO"
              ? [220, 38, 38]
              : [245, 158, 11];
        doc.setFillColor(...stColor);
        doc.roundedRect(margin + 80, rowY - 4, 35, 7, 2, 2, "F");
        addText(value, margin + 97.5, rowY + 1, {
          size: 7,
          font: "bold",
          color: [255, 255, 255],
          align: "center",
        });
      } else {
        addText(value, margin + 80, rowY, {
          size: 9,
          font: "bold",
          color: [33, 33, 33],
        });
      }
      if (i < details.length - 1) {
        addLine(
          margin + 10,
          rowY + 3,
          pageW - margin - 10,
          rowY + 3,
          [230, 230, 230],
          0.2,
        );
      }
    });

    // ══ ORDER INFO ══
    y += 65;
    addText("INFORMACIÓN DE LA ORDEN", margin, y, {
      size: 11,
      font: "bold",
      color: [33, 33, 33],
    });
    addLine(margin, y + 3, margin + 55, y + 3, [232, 41, 28], 1);

    y += 12;
    addBox(margin, y, pageW - margin * 2, 38, [250, 250, 252], 4);

    addText("Número de Orden", margin + 10, y + 10, {
      size: 8,
      color: [107, 114, 128],
    });
    addText(
      `#${String(payment.order_id).padStart(6, "0")}`,
      margin + 10,
      y + 18,
      { size: 12, font: "bold", color: [33, 33, 33] },
    );

    addText("Monto de la Orden", pageW / 2 + 10, y + 10, {
      size: 8,
      color: [107, 114, 128],
    });
    addText(
      `$ ${Math.round(amount).toLocaleString("es-CO")} COP`,
      pageW / 2 + 10,
      y + 18,
      { size: 12, font: "bold", color: [232, 41, 28] },
    );

    addText("Productos", margin + 10, y + 28, {
      size: 8,
      color: [107, 114, 128],
    });
    addText(`${order?.items?.length || 0} artículos`, margin + 10, y + 36, {
      size: 9,
      font: "bold",
      color: [33, 33, 33],
    });

    // ══ PRODUCTS TABLE ══
    if (order?.items?.length > 0) {
      y += 50;
      addText("DETALLE DE PRODUCTOS", margin, y, {
        size: 11,
        font: "bold",
        color: [33, 33, 33],
      });
      addLine(margin, y + 3, margin + 50, y + 3, [232, 41, 28], 1);

      y += 12;
      // Table header
      doc.setFillColor(232, 41, 28);
      doc.roundedRect(margin, y - 4, pageW - margin * 2, 10, 2, 2, "F");
      addText("Producto", margin + 5, y + 2, {
        size: 8,
        font: "bold",
        color: [255, 255, 255],
      });
      addText("Cant.", pageW - margin - 55, y + 2, {
        size: 8,
        font: "bold",
        color: [255, 255, 255],
        align: "right",
      });
      addText("Precio Unit.", pageW - margin - 30, y + 2, {
        size: 8,
        font: "bold",
        color: [255, 255, 255],
        align: "right",
      });
      addText("Subtotal", pageW - margin - 5, y + 2, {
        size: 8,
        font: "bold",
        color: [255, 255, 255],
        align: "right",
      });

      y += 10;
      order.items.forEach((item, i) => {
        const rowY = y + i * 10;
        if (i % 2 === 0) {
          doc.setFillColor(250, 250, 252);
          doc.rect(margin, rowY - 4, pageW - margin * 2, 10, "F");
        }
        const unitPrice =
          item.unit_price ||
          (item.subtotal ? item.subtotal / item.quantity : 0) ||
          0;
        const itemSubtotal = item.subtotal || unitPrice * item.quantity || 0;
        const name =
          item.product_name.length > 45
            ? item.product_name.slice(0, 42) + "..."
            : item.product_name;
        addText(name, margin + 5, rowY + 2, { size: 8, color: [33, 33, 33] });
        addText(`${item.quantity}`, pageW - margin - 55, rowY + 2, {
          size: 8,
          color: [33, 33, 33],
          align: "right",
        });
        addText(
          `$${Math.round(unitPrice).toLocaleString("es-CO")}`,
          pageW - margin - 30,
          rowY + 2,
          { size: 8, color: [107, 114, 128], align: "right" },
        );
        addText(
          `$${Math.round(itemSubtotal).toLocaleString("es-CO")}`,
          pageW - margin - 5,
          rowY + 2,
          { size: 8, font: "bold", color: [33, 33, 33], align: "right" },
        );
      });

      y += order.items.length * 10 + 8;
      // Total row
      addLine(margin, y - 2, pageW - margin, y - 2, [200, 200, 200], 0.5);
      addText("TOTAL", pageW - margin - 55, y + 4, {
        size: 9,
        font: "bold",
        color: [33, 33, 33],
        align: "right",
      });
      addText(
        `$ ${Math.round(amount).toLocaleString("es-CO")} COP`,
        pageW - margin - 5,
        y + 4,
        { size: 11, font: "bold", color: [232, 41, 28], align: "right" },
      );
    } else {
      y += 50;
      addText("DETALLE DE PRODUCTOS", margin, y, {
        size: 11,
        font: "bold",
        color: [33, 33, 33],
      });
      addLine(margin, y + 3, margin + 50, y + 3, [232, 41, 28], 1);
      y += 15;
      addBox(margin, y, pageW - margin * 2, 30, [250, 250, 252], 4);
      addText(
        "No hay detalle de productos disponible para esta transacción.",
        pageW / 2,
        y + 15,
        { size: 10, color: [107, 114, 128], align: "center" },
      );
    }

    // ══ FOOTER ══
    y = 270;
    addLine(margin, y, pageW - margin, y, [200, 200, 200], 0.3);

    addText(
      "Este documento es un comprobante oficial de pago generado por EcoMod.",
      pageW / 2,
      y + 8,
      {
        size: 8,
        color: [107, 114, 128],
        align: "center",
      },
    );
    addText(
      `Generado el ${new Date().toLocaleString("es-CO")} • ID: ${payment.transaction_id?.slice(0, 16) || "N/A"}`,
      pageW / 2,
      y + 13,
      {
        size: 7,
        color: [156, 163, 175],
        align: "center",
      },
    );

    // QR placeholder area
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(pageW - margin - 25, y + 2, 25, 25, 2, 2, "F");
    addText("QR", pageW - margin - 12.5, y + 16, {
      size: 8,
      color: [156, 163, 175],
      align: "center",
    });
    addText("Verificar", pageW - margin - 12.5, y + 22, {
      size: 6,
      color: [156, 163, 175],
      align: "center",
    });

    doc.save(`EcoMod-Comprobante-${String(payment.id).padStart(8, "0")}.pdf`);
  } catch (e) {
    console.error(e);
    throw new Error("Error al generar el comprobante");
  }
}
/* ════════════════════════════════════════════════════════
   STRIPE CARD STYLE
   ════════════════════════════════════════════════════════ */
const CARD_STYLE = {
  style: {
    base: {
      fontSize: "15px",
      fontFamily: "'Inter', sans-serif",
      color: "#1f2937",
      letterSpacing: "0.02em",
      "::placeholder": { color: "#9ca3af" },
    },
    invalid: { color: "#ef4444" },
  },
};

/* ════════════════════════════════════════════════════════
   STRIPE CHECKOUT FORM
   ════════════════════════════════════════════════════════ */
function StripeCheckoutForm({ order, user, onSuccess, onError, swal }) {
  // ← NUEVO: recibe swal como prop
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    // ← NUEVO: Confirmación con SweetAlert antes de pagar
    const confirm = await swal.confirm(
      "Confirmar Pago",
      `¿Deseas pagar $${order.total_amount?.toLocaleString("es-CO")} COP con tarjeta de crédito?`,
      "Sí, pagar ahora",
      "Cancelar",
    );

    if (!confirm.isConfirmed) return;

    setProcessing(true);
    setCardError(null);

    // ← NUEVO: Loading mientras se procesa
    swal.loading("Procesando pago...");

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
        swal.close(); // ← NUEVO: Cerrar loading
        onError(error.message);
        return;
      }
      if (paymentIntent.status !== "succeeded") {
        setCardError(`Estado inesperado: ${paymentIntent.status}`);
        swal.close(); // ← NUEVO: Cerrar loading
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
      swal.close(); // ← NUEVO: Cerrar loading
      onSuccess(payment);
    } catch (err) {
      swal.close(); // ← NUEVO: Cerrar loading en error
      onError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="pay-form-stripe">
      <div className="pay-card-field">
        <label>
          <CreditCard size={14} strokeWidth={2} />
          Datos de la tarjeta
        </label>
        <div className="pay-card-element">
          <CardElement
            options={CARD_STYLE}
            onChange={(e) => setCardComplete(e.complete)}
          />
        </div>
      </div>

      {cardError && (
        <div className="pay-card-error">
          <AlertCircle size={14} strokeWidth={2} />
          <span>{cardError}</span>
        </div>
      )}

      <div className="pay-test-cards">
        <span className="pay-test-badge">TEST</span>
        <div className="pay-test-list">
          <button
            type="button"
            className="pay-test-card"
            onClick={() => navigator.clipboard.writeText("4242424242424242")}
          >
            <Copy size={10} />
            4242 4242 4242 4242
            <span className="pay-test-ok">✓ Éxito</span>
          </button>
          <button
            type="button"
            className="pay-test-card"
            onClick={() => navigator.clipboard.writeText("4000000000000002")}
          >
            <Copy size={10} />
            4000 0000 0000 0002
            <span className="pay-test-fail">✕ Rechazada</span>
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="pay-btn-stripe"
        disabled={!stripe || processing || !cardComplete}
      >
        {processing ? (
          <div className="pay-btn-spinner" />
        ) : (
          <>
            <Zap size={16} strokeWidth={2.5} />
            Pagar ${order.total_amount?.toLocaleString("es-CO")} COP
            <ArrowRight size={16} strokeWidth={2.5} />
          </>
        )}
      </button>

      <div className="pay-secure">
        <Shield size={12} strokeWidth={2.5} />
        <span>Pago 100% seguro · Encriptado SSL · Stripe</span>
      </div>
    </form>
  );
}

/* ════════════════════════════════════════════════════════
   PAYPAL FORM
   ════════════════════════════════════════════════════════ */
function PaypalForm({ order, user, onError, swal }) {
  // ← NUEVO: recibe swal como prop
  const [processing, setProcessing] = useState(false);

  const handlePaypal = async () => {
    // ← NUEVO: Confirmación con SweetAlert antes de redirigir
    const confirm = await swal.confirm(
      "Continuar con PayPal",
      `Serás redirigido a PayPal para pagar $${order.total_amount?.toLocaleString("es-CO")} COP (≈ $${(order.total_amount / 4200).toFixed(2)} USD).`,
      "Continuar",
      "Cancelar",
    );

    if (!confirm.isConfirmed) return;

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
    <div className="pay-form-paypal">
      <div className="pay-paypal-info">
        <div className="pay-conversion">
          <div className="pay-conversion-item">
            <span className="pay-conversion-label">Monto en COP</span>
            <span className="pay-conversion-cop">
              ${order.total_amount?.toLocaleString("es-CO")}
            </span>
          </div>
          <ArrowRight
            size={20}
            strokeWidth={2}
            className="pay-conversion-arrow"
          />
          <div className="pay-conversion-item">
            <span className="pay-conversion-label">Aprox. en USD</span>
            <span className="pay-conversion-usd">≈ ${usd}</span>
          </div>
        </div>
        <p className="pay-paypal-desc">
          Serás redirigido a PayPal para completar el pago de forma segura. No
          almacenamos tus datos bancarios.
        </p>
      </div>
      <button
        className="pay-btn-paypal"
        onClick={handlePaypal}
        disabled={processing}
      >
        {processing ? (
          <div className="pay-btn-spinner dark" />
        ) : (
          <>
            <Wallet size={18} strokeWidth={2} />
            Continuar con PayPal
            <ChevronRight size={16} strokeWidth={2.5} />
          </>
        )}
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   RECEIPT MODAL
   ════════════════════════════════════════════════════════ */
function ReceiptModal({ payment, order, onClose, swal }) {
  // ← NUEVO: recibe swal como prop
  const [generating, setGenerating] = useState(false);
  const { addToast } = useToast();
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
      // ← NUEVO: SweetAlert de éxito en vez de toast
      swal.success("¡Listo!", "Comprobante descargado correctamente");
    } catch (e) {
      // ← NUEVO: SweetAlert de error
      swal.error("Error", "No se pudo generar el comprobante");
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    // ← NUEVO: SweetAlert informativo
    swal.info("Imprimiendo", "Preparando comprobante para impresión...");
  };

  const statusConfig = {
    succeeded: {
      color: "#10b981",
      bg: "rgba(16,185,129,.1)",
      label: "Pago Aprobado",
    },
    failed: {
      color: "#ef4444",
      bg: "rgba(239,68,68,.1)",
      label: "Pago Rechazado",
    },
    pending: {
      color: "#f59e0b",
      bg: "rgba(245,158,11,.1)",
      label: "Pendiente",
    },
  };
  const sc = statusConfig[payment.status] || statusConfig.pending;

  return (
    <div
      className="pay-modal-overlay"
      onClick={(e) => e.target === ref.current && onClose()}
      ref={ref}
    >
      <div className="pay-modal">
        <button className="pay-modal-close" onClick={onClose}>
          <XCircle size={20} strokeWidth={2} />
        </button>

        <div className="pay-modal-header">
          <div
            className="pay-modal-icon"
            style={{ background: sc.bg, color: sc.color }}
          >
            <CheckCircle size={32} strokeWidth={2} />
          </div>
          <h2>¡Pago Completado!</h2>
          <p>
            Tu orden #{String(payment.order_id).padStart(6, "0")} está siendo
            procesada
          </p>
          <div
            className="pay-modal-status"
            style={{ background: sc.bg, color: sc.color }}
          >
            {sc.label}
          </div>
        </div>

        <div className="pay-modal-body">
          <div className="pay-modal-amount">
            <span className="pay-modal-amount-label">Monto pagado</span>
            <span className="pay-modal-amount-value">
              ${payment.amount?.toLocaleString("es-CO")} COP
            </span>
          </div>

          <div className="pay-modal-details">
            {[
              {
                icon: Hash,
                label: "Transacción",
                value: payment.transaction_id?.slice(0, 24) || "N/A",
              },
              {
                icon: CreditCard,
                label: "Método",
                value:
                  payment.payment_method === "card_stripe"
                    ? "Tarjeta de Crédito"
                    : "PayPal",
              },
              {
                icon: Calendar,
                label: "Fecha",
                value: new Date(payment.created_at).toLocaleString("es-CO"),
              },
              {
                icon: Receipt,
                label: "Referencia",
                value: `ECO-${String(payment.id).padStart(8, "0")}`,
              },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="pay-modal-detail-row">
                <div className="pay-modal-detail-icon">
                  <Icon size={14} strokeWidth={2} />
                </div>
                <span className="pay-modal-detail-label">{label}</span>
                <span className="pay-modal-detail-value">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pay-modal-footer">
          <button className="pay-modal-btn secondary" onClick={onClose}>
            Cerrar
          </button>
          <button className="pay-modal-btn print" onClick={handlePrint}>
            <Printer size={14} strokeWidth={2} />
            Imprimir
          </button>
          <button
            className="pay-modal-btn primary"
            onClick={handleDownload}
            disabled={generating}
          >
            <Download size={14} strokeWidth={2} />
            {generating ? "Generando..." : "Descargar PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   STATUS CONFIG
   ════════════════════════════════════════════════════════ */
const STATUS = {
  pending: {
    label: "Pendiente",
    icon: Clock,
    color: "#f59e0b",
    bg: "rgba(245,158,11,.1)",
    border: "rgba(245,158,11,.2)",
  },
  succeeded: {
    label: "Exitoso",
    icon: CheckCircle,
    color: "#10b981",
    bg: "rgba(16,185,129,.1)",
    border: "rgba(16,185,129,.2)",
  },
  failed: {
    label: "Fallido",
    icon: XCircle,
    color: "#ef4444",
    bg: "rgba(239,68,68,.1)",
    border: "rgba(239,68,68,.2)",
  },
  refunded: {
    label: "Reembolsado",
    icon: RefreshCw,
    color: "#8b5cf6",
    bg: "rgba(139,92,246,.1)",
    border: "rgba(139,92,246,.2)",
  },
};

const METHOD_ICONS = {
  card_stripe: CreditCard,
  paypal: Wallet,
};

/* ════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════ */
export default function PaymentsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { addToast } = useToast();
  const swal = useSwal(theme === "dark"); // ← NUEVO: Inicializar SweetAlert con tema
  const isDark = theme === "dark";
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState("");
  const [method, setMethod] = useState("stripe");
  const [receipt, setReceipt] = useState(null);
  const [selectOpen, setSelectOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

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
      // ← NUEVO: SweetAlert para error de carga inicial
      swal.error(
        "Error de conexión",
        "No se pudieron cargar los datos de pagos. Intenta de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = async (payment) => {
    // Toast sutil para notificación en esquina (mantenido)
    addToast(
      "success",
      "¡Pago Exitoso!",
      `Transacción #${payment.transaction_id?.slice(0, 12)} confirmada`,
    );

    setSelectedOrder("");
    await loadData();
    setReceipt({
      payment,
      order: allOrders.find((o) => o.id === payment.order_id),
    });
  };

  const handleError = async (reason) => {
    // ← NUEVO: SweetAlert para errores de pago graves
    swal.error("Pago Fallido", reason);
    await loadData();
  };

  const handleRefund = async (paymentId) => {
    // ← NUEVO: Confirmación con SweetAlert antes de reembolsar
    const result = await swal.confirm(
      "¿Solicitar Reembolso?",
      "El dinero será devuelto en 3-5 días hábiles. Esta acción no se puede deshacer.",
      "Sí, reembolsar",
      "Cancelar",
    );

    if (!result.isConfirmed) return;

    // ← NUEVO: Loading mientras procesa
    swal.loading("Procesando reembolso...");

    try {
      await paymentsApi.refund(paymentId);
      swal.close(); // ← NUEVO: Cerrar loading
      // ← NUEVO: SweetAlert de éxito
      swal.success(
        "¡Reembolso Procesado!",
        "El dinero será devuelto en 3-5 días hábiles",
      );
      await loadData();
    } catch (e) {
      swal.close(); // ← NUEVO: Cerrar loading
      // ← NUEVO: SweetAlert de error
      swal.error("Error", e.message);
    }
  };

  const handleDownloadReceipt = async (pay) => {
    try {
      await generateReceipt(
        pay,
        allOrders.find((o) => o.id === pay.order_id),
      );
      // ← NUEVO: SweetAlert de éxito en vez de toast
      swal.success(
        "¡Descargado!",
        "El comprobante se ha guardado correctamente",
      );
    } catch (e) {
      // ← NUEVO: SweetAlert de error
      swal.error("Error", "No se pudo generar el comprobante");
    }
  };

  const currentOrder = orders.find((o) => o.id === parseInt(selectedOrder));

  const filteredPayments =
    filterStatus === "all"
      ? payments
      : payments.filter((p) => p.status === filterStatus);

  const stats = useMemo(
    () => ({
      total: payments
        .filter((p) => p.status === "succeeded")
        .reduce((a, p) => a + p.amount, 0),
      succeeded: payments.filter((p) => p.status === "succeeded").length,
      failed: payments.filter((p) => p.status === "failed").length,
      refunded: payments.filter((p) => p.status === "refunded").length,
    }),
    [payments],
  );

  if (loading) {
    return (
      <div className={`pay-loading ${isDark ? "dark" : "light"}`}>
        <div className="pay-spinner-ring">
          <div />
          <div />
          <div />
          <div />
        </div>
        <span>Cargando pagos...</span>
        <div className="pay-loading-dots">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  return (
    <div className={`pay-root ${isDark ? "dark" : "light"}`}>
      {/* ══ HEADER ══ */}
      <div className="pay-header">
        <div className="pay-header-left">
          <div className="pay-header-icon">
            <CreditCard size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1>Pagos</h1>
            <p>Gestiona tus transacciones y métodos de pago</p>
          </div>
        </div>
        <button className="pay-refresh" onClick={loadData}>
          <RefreshCw size={16} strokeWidth={2} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* ══ RECEIPT MODAL ══ */}
      {receipt && (
        <ReceiptModal
          payment={receipt.payment}
          order={receipt.order}
          onClose={() => setReceipt(null)}
          swal={swal} // ← NUEVO: Pasar swal al modal
        />
      )}

      {/* ══ STATS ══ */}
      <div className="pay-stats">
        {[
          {
            icon: TrendingUp,
            label: "Total Pagado",
            value: `$${stats.total.toLocaleString("es-CO")}`,
            color: "#10b981",
            bg: "rgba(16,185,129,.1)",
            trend: "acumulado",
          },
          {
            icon: CheckCircle,
            label: "Exitosos",
            value: stats.succeeded,
            color: "#10b981",
            bg: "rgba(16,185,129,.1)",
            trend: "transacciones",
          },
          {
            icon: XCircle,
            label: "Fallidos",
            value: stats.failed,
            color: "#ef4444",
            bg: "rgba(239,68,68,.1)",
            trend: "rechazados",
          },
          {
            icon: RefreshCw,
            label: "Reembolsos",
            value: stats.refunded,
            color: "#8b5cf6",
            bg: "rgba(139,92,246,.1)",
            trend: "devueltos",
          },
        ].map(({ icon: Icon, label, value, color, bg, trend }, i) => (
          <div
            key={label}
            className="pay-stat"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div className="pay-stat-icon" style={{ background: bg, color }}>
              <Icon size={20} strokeWidth={2} />
            </div>
            <div className="pay-stat-body">
              <span className="pay-stat-value" style={{ color }}>
                {value}
              </span>
              <span className="pay-stat-label">{label}</span>
              <span className="pay-stat-trend">{trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ══ PAYMENT PANEL ══ */}
      <div className="pay-panel">
        <div className="pay-panel-head">
          <div className="pay-panel-title">
            <Zap size={18} strokeWidth={2.5} />
            Procesar Pago
          </div>
          <span className="pay-panel-badge">
            {orders.length} órdenes pendientes
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="pay-empty-orders">
            <div className="pay-empty-orders-icon">
              <CheckCircle size={32} strokeWidth={1.5} />
            </div>
            <h3>¡Todo al día!</h3>
            <p>No tienes órdenes pendientes de pago en este momento.</p>
          </div>
        ) : (
          <>
            <div className="pay-order-select">
              <label>Selecciona una orden para pagar</label>
              <div className={`pay-select ${selectOpen ? "open" : ""}`}>
                <button
                  className="pay-select-trigger"
                  onClick={() => setSelectOpen(!selectOpen)}
                >
                  <span>
                    {currentOrder
                      ? `Orden #${String(currentOrder.id).padStart(6, "0")} — $${currentOrder.total_amount?.toLocaleString("es-CO")} COP`
                      : "Selecciona una orden..."}
                  </span>
                  <ChevronDown
                    size={16}
                    strokeWidth={2.5}
                    className={selectOpen ? "rotated" : ""}
                  />
                </button>
                {selectOpen && (
                  <div className="pay-select-dropdown">
                    {orders.map((o) => (
                      <button
                        key={o.id}
                        className={`pay-select-option ${selectedOrder == o.id ? "selected" : ""}`}
                        onClick={() => {
                          setSelectedOrder(String(o.id));
                          setSelectOpen(false);
                        }}
                      >
                        <div className="pay-select-option-left">
                          <Package size={14} strokeWidth={2} />
                          <span>Orden #{String(o.id).padStart(6, "0")}</span>
                        </div>
                        <span className="pay-select-option-amount">
                          ${o.total_amount?.toLocaleString("es-CO")}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {currentOrder && (
              <>
                <div className="pay-order-summary">
                  <div className="pay-order-summary-item">
                    <span>Subtotal</span>
                    <strong>
                      ${currentOrder.total_amount?.toLocaleString("es-CO")} COP
                    </strong>
                  </div>
                  <div className="pay-order-summary-item">
                    <span>Envío</span>
                    <strong className="pay-free">¡GRATIS!</strong>
                  </div>
                  <div className="pay-order-summary-divider" />
                  <div className="pay-order-summary-item total">
                    <span>Total a pagar</span>
                    <strong>
                      ${currentOrder.total_amount?.toLocaleString("es-CO")} COP
                    </strong>
                  </div>
                </div>

                <div className="pay-method-tabs">
                  <button
                    className={`pay-method-tab ${method === "stripe" ? "active" : ""}`}
                    onClick={() => setMethod("stripe")}
                  >
                    <CreditCard size={16} strokeWidth={2} />
                    Tarjeta de Crédito
                    <span className="pay-method-badge">Stripe</span>
                  </button>
                  <button
                    className={`pay-method-tab ${method === "paypal" ? "active" : ""}`}
                    onClick={() => setMethod("paypal")}
                  >
                    <Wallet size={16} strokeWidth={2} />
                    PayPal
                  </button>
                </div>

                <div className="pay-form-container">
                  {method === "stripe" ? (
                    <Elements stripe={stripePromise}>
                      <StripeCheckoutForm
                        order={currentOrder}
                        user={user}
                        onSuccess={handleSuccess}
                        onError={handleError}
                        swal={swal} // ← NUEVO: Pasar swal al formulario
                      />
                    </Elements>
                  ) : (
                    <PaypalForm
                      order={currentOrder}
                      user={user}
                      onError={handleError}
                      swal={swal} // ← NUEVO: Pasar swal al formulario
                    />
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ══ HISTORY ══ */}
      <div className="pay-history">
        <div className="pay-history-head">
          <div className="pay-history-title">
            <Receipt size={18} strokeWidth={2.5} />
            Historial de Pagos
            <span className="pay-history-count">
              {payments.length} transacciones
            </span>
          </div>
          <div className="pay-history-filters">
            {["all", "succeeded", "failed", "refunded"].map((s) => (
              <button
                key={s}
                className={`pay-history-filter ${filterStatus === s ? "active" : ""}`}
                onClick={() => setFilterStatus(s)}
              >
                {s === "all" ? "Todas" : STATUS[s]?.label || s}
              </button>
            ))}
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="pay-history-empty">
            <div className="pay-history-empty-icon">
              <Receipt size={48} strokeWidth={1} />
            </div>
            <h3>
              {filterStatus === "all"
                ? "Sin pagos registrados"
                : `Sin pagos ${STATUS[filterStatus]?.label.toLowerCase() || filterStatus}`}
            </h3>
            <p>
              Tus transacciones aparecerán aquí una vez que realices un pago.
            </p>
          </div>
        ) : (
          <div className="pay-history-list">
            {filteredPayments.map((pay, idx) => {
              const s = STATUS[pay.status] || STATUS.pending;
              const Icon = s.icon;
              const MethodIcon = METHOD_ICONS[pay.payment_method] || CreditCard;

              return (
                <div
                  key={pay.id}
                  className="pay-history-item"
                  style={{ animationDelay: `${idx * 0.04}s` }}
                >
                  <div className="pay-history-item-left">
                    <div
                      className="pay-history-item-icon"
                      style={{
                        background: s.bg,
                        color: s.color,
                        border: `1.5px solid ${s.border}`,
                      }}
                    >
                      <Icon size={16} strokeWidth={2.5} />
                    </div>
                    <div className="pay-history-item-info">
                      <div className="pay-history-item-title">
                        <span>Pago #{String(pay.id).padStart(6, "0")}</span>
                        <div className="pay-history-item-badges">
                          <span
                            className="pay-history-status"
                            style={{
                              background: s.bg,
                              color: s.color,
                              border: `1px solid ${s.border}`,
                            }}
                          >
                            {s.label}
                          </span>
                          <span className="pay-history-method">
                            <MethodIcon size={10} strokeWidth={2.5} />
                            {pay.payment_method === "card_stripe"
                              ? "Tarjeta"
                              : "PayPal"}
                          </span>
                        </div>
                      </div>
                      <div className="pay-history-item-meta">
                        <span>
                          <Calendar size={11} strokeWidth={2} />{" "}
                          {new Date(pay.created_at).toLocaleDateString("es-CO")}
                        </span>
                        <span className="pay-meta-sep">·</span>
                        <span>
                          <Clock size={11} strokeWidth={2} />{" "}
                          {new Date(pay.created_at).toLocaleTimeString(
                            "es-CO",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </span>
                        <span className="pay-meta-sep">·</span>
                        <span className="pay-history-ref">
                          Orden #{String(pay.order_id).padStart(6, "0")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="pay-history-item-right">
                    <span className="pay-history-amount">
                      ${pay.amount?.toLocaleString("es-CO")}
                    </span>
                    <div className="pay-history-actions">
                      {pay.status === "succeeded" && (
                        <button
                          className="pay-history-action refund"
                          onClick={() => handleRefund(pay.id)}
                          title="Solicitar reembolso"
                        >
                          <RefreshCw size={14} strokeWidth={2} />
                        </button>
                      )}
                      <button
                        className="pay-history-action download"
                        onClick={() => handleDownloadReceipt(pay)}
                        title="Descargar comprobante"
                      >
                        <Download size={14} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ STYLES ══ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Barlow+Condensed:wght@400;600;700;800&display=swap');

        .pay-root {
          font-family: 'Inter', sans-serif;
          max-width: 900px;
          margin: 0 auto;
          padding: 8px 0 40px;
          --primary: #e8291c;
          --primary2: #c2200f;
        }
        .pay-root.dark  { --card: #1c1c24; --border: rgba(255,255,255,.08); --text: #f0f0f5; --text2: #a0a0b0; --text3: #6b6b80; --bg: #0f0f13; --hover: rgba(255,255,255,.04); --surface-hover: #252530; }
        .pay-root.light { --card: #ffffff; --border: #e5e7eb; --text: #1a1a1a; --text2: #4b5563; --text3: #9ca3af; --bg: #f5f5f5; --hover: rgba(0,0,0,.03); --surface-hover: #fafafa; }

        /* Loading */
        .pay-loading {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; min-height: 50vh; gap: 16px;
          color: var(--text3); font-family: 'Inter', sans-serif;
        }
        .pay-spinner-ring {
          display: inline-block; position: relative; width: 48px; height: 48px;
        }
        .pay-spinner-ring div {
          box-sizing: border-box; display: block; position: absolute;
          width: 36px; height: 36px; margin: 6px;
          border: 3px solid var(--primary);
          border-radius: 50%; animation: paySpin 1.2s cubic-bezier(0.5,0,0.5,1) infinite;
          border-color: var(--primary) transparent transparent transparent;
        }
        .pay-spinner-ring div:nth-child(1) { animation-delay: -.45s; }
        .pay-spinner-ring div:nth-child(2) { animation-delay: -.3s; }
        .pay-spinner-ring div:nth-child(3) { animation-delay: -.15s; }
        @keyframes paySpin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        .pay-loading-dots { display: flex; gap: 6px; margin-top: 4px; }
        .pay-loading-dots span {
          width: 6px; height: 6px; background: var(--primary);
          border-radius: 50%; animation: payBounce 1.4s ease-in-out infinite both;
        }
        .pay-loading-dots span:nth-child(1) { animation-delay: -.32s; }
        .pay-loading-dots span:nth-child(2) { animation-delay: -.16s; }
        @keyframes payBounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }

        /* Header */
        .pay-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 24px; flex-wrap: wrap; gap: 16px;
        }
        .pay-header-left { display: flex; align-items: center; gap: 16px; }
        .pay-header-icon {
          width: 52px; height: 52px;
          background: linear-gradient(135deg, var(--primary), var(--primary2));
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          box-shadow: 0 4px 16px rgba(232,41,28,.3);
        }
        .pay-header h1 { font-size: 26px; font-weight: 900; color: var(--text); margin: 0; letter-spacing: -.02em; }
        .pay-header p { font-size: 13px; color: var(--text3); margin: 4px 0 0; font-weight: 500; }
        .pay-refresh {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 18px;
          background: var(--card);
          border: 1.5px solid var(--border);
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 13px; font-weight: 700;
          color: var(--text2); cursor: pointer;
          transition: all .2s;
        }
        .pay-refresh:hover { border-color: var(--primary); color: var(--primary); background: var(--hover); }
        .pay-refresh:active { transform: scale(.97); }

        /* Stats */
        .pay-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 14px; margin-bottom: 24px;
        }
        .pay-stat {
          background: var(--card);
          border: 1.5px solid var(--border);
          border-radius: 16px;
          padding: 18px;
          display: flex; align-items: center; gap: 14px;
          animation: payFadeUp .5s ease forwards;
          opacity: 0;
          transition: all .25s;
        }
        @keyframes payFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .pay-stat:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,.08); border-color: var(--primary); }
        .pay-stat-icon {
          width: 46px; height: 46px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .pay-stat-body { flex: 1; }
        .pay-stat-value { display: block; font-size: 24px; font-weight: 800; font-family: 'Barlow Condensed', sans-serif; letter-spacing: -.01em; }
        .pay-stat-label { display: block; font-size: 12px; font-weight: 700; color: var(--text2); text-transform: uppercase; letter-spacing: .04em; margin-top: 2px; }
        .pay-stat-trend { display: block; font-size: 11px; color: var(--text3); font-weight: 500; margin-top: 2px; }

        /* Panel */
        .pay-panel {
          background: var(--card);
          border: 1.5px solid var(--border);
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 24px;
          transition: all .25s;
        }
        .pay-panel:hover { box-shadow: 0 4px 20px rgba(0,0,0,.06); }
        .pay-panel-head {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 20px; flex-wrap: wrap; gap: 10px;
        }
        .pay-panel-title {
          display: flex; align-items: center; gap: 10px;
          font-size: 17px; font-weight: 800; color: var(--text);
        }
        .pay-panel-badge {
          font-size: 11px; font-weight: 700;
          padding: 4px 12px;
          background: rgba(232,41,28,.1);
          color: var(--primary);
          border-radius: 20px;
        }

        /* Empty orders */
        .pay-empty-orders {
          text-align: center; padding: 48px 24px;
        }
        .pay-empty-orders-icon {
          width: 80px; height: 80px;
          background: linear-gradient(135deg, rgba(16,185,129,.1), rgba(16,185,129,.05));
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: #10b981;
          margin: 0 auto 16px;
        }
        .pay-empty-orders h3 { font-size: 18px; font-weight: 800; color: var(--text); margin-bottom: 6px; }
        .pay-empty-orders p { font-size: 13px; color: var(--text3); }

        /* Order Select */
        .pay-order-select { margin-bottom: 20px; }
        .pay-order-select label {
          display: block; font-size: 12px; font-weight: 700;
          color: var(--text2); text-transform: uppercase; letter-spacing: .05em;
          margin-bottom: 8px;
        }
        .pay-select { position: relative; }
        .pay-select-trigger {
          width: 100%;
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 16px;
          background: var(--bg);
          border: 1.5px solid var(--border);
          border-radius: 12px;
          font-family: 'Inter', sans-serif;
          font-size: 14px; font-weight: 600;
          color: var(--text); cursor: pointer;
          transition: all .2s;
        }
        .pay-select-trigger:hover { border-color: var(--primary); }
        .pay-select.open .pay-select-trigger { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(232,41,28,.08); }
        .pay-select-trigger svg { color: var(--text3); transition: transform .2s; }
        .pay-select-trigger svg.rotated { transform: rotate(180deg); }
        .pay-select-dropdown {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0;
          background: var(--card);
          border: 1.5px solid var(--border);
          border-radius: 12px;
          z-index: 50;
          overflow: hidden;
          box-shadow: 0 12px 40px rgba(0,0,0,.12);
          animation: payScaleIn .2s ease;
        }
        @keyframes payScaleIn { from{opacity:0;transform:scale(.95) translateY(-4px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .pay-select-option {
          width: 100%;
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 16px;
          background: none; border: none;
          font-family: 'Inter', sans-serif;
          font-size: 13px; font-weight: 600;
          color: var(--text); cursor: pointer;
          transition: all .15s;
        }
        .pay-select-option:hover { background: var(--hover); }
        .pay-select-option.selected { background: rgba(232,41,28,.06); color: var(--primary); }
        .pay-select-option-left { display: flex; align-items: center; gap: 10px; }
        .pay-select-option-amount { font-weight: 800; color: var(--primary); font-family: 'Barlow Condensed', sans-serif; font-size: 15px; }

        /* Order Summary */
        .pay-order-summary {
          background: var(--bg);
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 20px;
        }
        .pay-order-summary-item {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 13px; padding: 6px 0;
        }
        .pay-order-summary-item span { color: var(--text3); font-weight: 500; }
        .pay-order-summary-item strong { color: var(--text); font-weight: 700; }
        .pay-order-summary-item.total { margin-top: 4px; padding-top: 10px; border-top: 1px solid var(--border); }
        .pay-order-summary-item.total span { font-size: 14px; font-weight: 800; color: var(--text); }
        .pay-order-summary-item.total strong { font-size: 20px; font-weight: 900; color: var(--primary); font-family: 'Barlow Condensed', sans-serif; }
        .pay-free { color: #10b981 !important; font-weight: 800 !important; }
        .pay-order-summary-divider { height: 1px; background: var(--border); margin: 4px 0; }

        /* Method Tabs */
        .pay-method-tabs {
          display: flex; gap: 10px;
          margin-bottom: 20px;
        }
        .pay-method-tab {
          flex: 1;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 12px;
          background: var(--bg);
          border: 1.5px solid var(--border);
          border-radius: 12px;
          font-family: 'Inter', sans-serif;
          font-size: 13px; font-weight: 700;
          color: var(--text2); cursor: pointer;
          transition: all .2s;
        }
        .pay-method-tab:hover { border-color: var(--primary); color: var(--primary); }
        .pay-method-tab.active {
          background: linear-gradient(135deg, var(--primary), var(--primary2));
          border-color: var(--primary);
          color: #fff;
          box-shadow: 0 4px 16px rgba(232,41,28,.25);
        }
        .pay-method-badge {
          font-size: 9px; font-weight: 900;
          padding: 2px 8px;
          background: rgba(255,255,255,.2);
          border-radius: 10px;
          margin-left: 4px;
        }

        /* Stripe Form */
        .pay-form-stripe { animation: payFadeUp .3s ease; }
        .pay-card-field { margin-bottom: 16px; }
        .pay-card-field label {
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 700;
          color: var(--text2); text-transform: uppercase; letter-spacing: .05em;
          margin-bottom: 8px;
        }
        .pay-card-element {
          padding: 14px;
          background: var(--bg);
          border: 1.5px solid var(--border);
          border-radius: 12px;
          transition: all .2s;
        }
        .pay-card-element:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(232,41,28,.08); }
        .pay-card-error {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px;
          background: rgba(239,68,68,.08);
          border: 1px solid rgba(239,68,68,.15);
          border-radius: 10px;
          margin-bottom: 14px;
          font-size: 12px; color: #ef4444; font-weight: 600;
        }

        .pay-test-cards {
          margin-bottom: 16px;
          padding: 12px 14px;
          background: var(--bg);
          border-radius: 10px;
        }
        .pay-test-badge {
          display: inline-block;
          font-size: 9px; font-weight: 900;
          padding: 2px 8px;
          background: var(--primary);
          color: #fff;
          border-radius: 4px;
          margin-bottom: 8px;
          letter-spacing: .05em;
        }
        .pay-test-list { display: flex; flex-direction: column; gap: 6px; }
        .pay-test-card {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 12px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 8px;
          font-family: 'Courier New', monospace;
          font-size: 12px; font-weight: 600;
          color: var(--text2); cursor: pointer;
          transition: all .15s;
        }
        .pay-test-card:hover { border-color: var(--primary); color: var(--primary); }
        .pay-test-ok { margin-left: auto; font-size: 10px; font-weight: 700; color: #10b981; font-family: 'Inter', sans-serif; }
        .pay-test-fail { margin-left: auto; font-size: 10px; font-weight: 700; color: #ef4444; font-family: 'Inter', sans-serif; }

        .pay-btn-stripe {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          padding: 16px;
          background: linear-gradient(135deg, var(--primary), var(--primary2));
          border: none; border-radius: 12px;
          font-family: 'Inter', sans-serif;
          font-size: 15px; font-weight: 800;
          color: #fff; cursor: pointer;
          transition: all .3s;
          box-shadow: 0 6px 20px rgba(232,41,28,.3);
        }
        .pay-btn-stripe:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(232,41,28,.4); }
        .pay-btn-stripe:disabled { opacity: .6; cursor: not-allowed; transform: none !important; }
        .pay-btn-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: paySpin .6s linear infinite;
        }
        .pay-secure {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 14px;
          font-size: 12px; color: var(--text3); font-weight: 600;
        }

        /* PayPal Form */
        .pay-form-paypal { animation: payFadeUp .3s ease; }
        .pay-paypal-info { margin-bottom: 16px; }
        .pay-conversion {
          display: flex; align-items: center; gap: 16px;
          margin-bottom: 12px; padding: 16px;
          background: var(--bg);
          border-radius: 12px;
        }
        .pay-conversion-item { flex: 1; text-align: center; }
        .pay-conversion-label { display: block; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: .05em; margin-bottom: 4px; }
        .pay-conversion-cop { display: block; font-size: 20px; font-weight: 900; color: var(--text); font-family: 'Barlow Condensed', sans-serif; }
        .pay-conversion-usd { display: block; font-size: 16px; font-weight: 700; color: var(--text3); }
        .pay-conversion-arrow { color: var(--text3); }
        .pay-paypal-desc { font-size: 13px; color: var(--text3); text-align: center; line-height: 1.5; }
        .pay-btn-paypal {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          padding: 16px;
          background: linear-gradient(135deg, #ffc439, #e0a800);
          border: none; border-radius: 12px;
          font-family: 'Inter', sans-serif;
          font-size: 15px; font-weight: 800;
          color: #003087; cursor: pointer;
          transition: all .3s;
          box-shadow: 0 6px 20px rgba(255,196,57,.3);
        }
        .pay-btn-paypal:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(255,196,57,.4); }
        .pay-btn-paypal:disabled { opacity: .6; cursor: not-allowed; }

        /* History */
        .pay-history {
          background: var(--card);
          border: 1.5px solid var(--border);
          border-radius: 20px;
          overflow: hidden;
          transition: all .25s;
        }
        .pay-history:hover { box-shadow: 0 4px 20px rgba(0,0,0,.06); }
        .pay-history-head {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
          flex-wrap: wrap; gap: 12px;
        }
        .pay-history-title {
          display: flex; align-items: center; gap: 10px;
          font-size: 17px; font-weight: 800; color: var(--text);
        }
        .pay-history-count {
          font-size: 11px; font-weight: 700;
          padding: 3px 10px;
          background: var(--bg);
          color: var(--text3);
          border-radius: 20px;
          margin-left: 8px;
        }
        .pay-history-filters { display: flex; gap: 6px; flex-wrap: wrap; }
        .pay-history-filter {
          padding: 6px 14px;
          background: var(--bg);
          border: 1.5px solid var(--border);
          border-radius: 20px;
          font-family: 'Inter', sans-serif;
          font-size: 12px; font-weight: 600;
          color: var(--text2); cursor: pointer;
          transition: all .2s;
        }
        .pay-history-filter:hover { border-color: var(--primary); color: var(--primary); }
        .pay-history-filter.active {
          background: linear-gradient(135deg, var(--primary), var(--primary2));
          border-color: var(--primary);
          color: #fff;
          box-shadow: 0 4px 14px rgba(232,41,28,.25);
        }

        .pay-history-empty {
          text-align: center; padding: 56px 24px;
        }
        .pay-history-empty-icon {
          width: 90px; height: 90px;
          background: linear-gradient(135deg, rgba(232,41,28,.08), rgba(249,115,22,.06));
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: var(--primary);
          margin: 0 auto 20px;
        }
        .pay-history-empty h3 { font-size: 18px; font-weight: 800; color: var(--text); margin-bottom: 6px; }
        .pay-history-empty p { font-size: 13px; color: var(--text3); }

        .pay-history-list { padding: 4px 0; }
        .pay-history-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 24px;
          border-bottom: 1px solid var(--border);
          transition: all .25s;
          animation: payFadeUp .4s ease forwards;
          opacity: 0;
          flex-wrap: wrap; gap: 12px;
        }
        .pay-history-item:last-child { border-bottom: none; }
        .pay-history-item:hover { background: var(--hover); transform: translateX(4px); }
        .pay-history-item-left { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }
        .pay-history-item-icon {
          width: 42px; height: 42px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .pay-history-item-info { flex: 1; min-width: 0; }
        .pay-history-item-title {
          display: flex; align-items: center; gap: 10px;
          flex-wrap: wrap; margin-bottom: 5px;
        }
        .pay-history-item-title > span {
          font-size: 15px; font-weight: 700; color: var(--text);
        }
        .pay-history-item-badges { display: flex; gap: 6px; }
        .pay-history-status {
          font-size: 10px; font-weight: 900;
          padding: 3px 10px;
          border-radius: 20px;
          letter-spacing: .03em;
        }
        .pay-history-method {
          display: flex; align-items: center; gap: 4px;
          font-size: 10px; font-weight: 700;
          padding: 3px 10px;
          background: var(--bg);
          color: var(--text3);
          border-radius: 20px;
        }
        .pay-history-item-meta {
          display: flex; align-items: center; flex-wrap: wrap;
          gap: 6px;
          font-size: 12px; color: var(--text3); font-weight: 500;
        }
        .pay-meta-sep { color: var(--border2); }
        .pay-history-ref {
          font-size: 11px; font-weight: 600;
          color: var(--primary);
          background: rgba(232,41,28,.08);
          padding: 1px 8px;
          border-radius: 6px;
        }

        .pay-history-item-right {
          display: flex; align-items: center; gap: 14px;
          flex-shrink: 0;
        }
        .pay-history-amount {
          font-size: 18px; font-weight: 900;
          color: var(--primary);
          font-family: 'Barlow Condensed', sans-serif;
          letter-spacing: -.01em;
        }
        .pay-history-actions { display: flex; gap: 6px; }
        .pay-history-action {
          width: 34px; height: 34px;
          border-radius: 8px;
          background: var(--bg);
          border: 1.5px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          color: var(--text3); cursor: pointer;
          transition: all .2s;
        }
        .pay-history-action:hover { transform: scale(1.1); }
        .pay-history-action.refund:hover { background: rgba(239,68,68,.08); border-color: rgba(239,68,68,.2); color: #ef4444; }
        .pay-history-action.download:hover { background: rgba(232,41,28,.08); border-color: rgba(232,41,28,.2); color: var(--primary); }

        /* Modal */
        .pay-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,.6);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000;
          padding: 24px;
          animation: payFadeIn .2s ease;
        }
        @keyframes payFadeIn { from{opacity:0} to{opacity:1} }
        .pay-modal {
          background: var(--card);
          border: 1.5px solid var(--border);
          border-radius: 24px;
          width: 100%; max-width: 440px;
          overflow: hidden;
          position: relative;
          animation: payScaleIn .3s cubic-bezier(0.175,0.885,0.32,1.275);
          box-shadow: 0 24px 64px rgba(0,0,0,.2);
        }
        .pay-modal-close {
          position: absolute; top: 16px; right: 16px;
          background: none; border: none;
          color: var(--text3); cursor: pointer;
          padding: 4px; border-radius: 8px;
          display: flex; align-items: center;
          transition: all .15s; z-index: 10;
        }
        .pay-modal-close:hover { background: var(--hover); color: var(--primary); }
        .pay-modal-header {
          text-align: center; padding: 32px 24px 20px;
          background: linear-gradient(180deg, var(--bg), var(--card));
        }
        .pay-modal-icon {
          width: 72px; height: 72px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px;
        }
        .pay-modal-header h2 { font-size: 22px; font-weight: 900; color: var(--text); margin: 0 0 6px; }
        .pay-modal-header p { font-size: 13px; color: var(--text3); margin: 0 0 12px; }
        .pay-modal-status {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 900;
          padding: 5px 16px;
          border-radius: 20px;
          letter-spacing: .05em;
        }

        .pay-modal-body { padding: 0 24px 20px; }
        .pay-modal-amount {
          text-align: center;
          padding: 20px;
          background: var(--bg);
          border-radius: 16px;
          margin-bottom: 20px;
        }
        .pay-modal-amount-label { display: block; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 6px; }
        .pay-modal-amount-value { display: block; font-size: 32px; font-weight: 900; color: var(--primary); font-family: 'Barlow Condensed', sans-serif; letter-spacing: -.02em; }

        .pay-modal-details { display: flex; flex-direction: column; gap: 8px; }
        .pay-modal-detail-row {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px;
          background: var(--bg);
          border-radius: 10px;
        }
        .pay-modal-detail-icon {
          width: 32px; height: 32px;
          background: var(--card);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: var(--text3); flex-shrink: 0;
        }
        .pay-modal-detail-label { font-size: 12px; font-weight: 600; color: var(--text3); flex: 1; }
        .pay-modal-detail-value { font-size: 12px; font-weight: 700; color: var(--text); text-align: right; }

        .pay-modal-footer {
          display: flex; gap: 10px;
          padding: 0 24px 24px;
        }
        .pay-modal-btn {
          flex: 1;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 12px;
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 13px; font-weight: 700;
          cursor: pointer; transition: all .2s;
          border: 1.5px solid transparent;
        }
        .pay-modal-btn.secondary {
          background: var(--bg);
          border-color: var(--border);
          color: var(--text2);
        }
        .pay-modal-btn.secondary:hover { border-color: var(--text3); color: var(--text); }
        .pay-modal-btn.print {
          background: var(--bg);
          border-color: var(--border);
          color: var(--text2);
        }
        .pay-modal-btn.print:hover { border-color: #3b82f6; color: #3b82f6; background: rgba(59,130,246,.06); }
        .pay-modal-btn.primary {
          background: linear-gradient(135deg, var(--primary), var(--primary2));
          color: #fff;
          box-shadow: 0 4px 16px rgba(232,41,28,.25);
        }
        .pay-modal-btn.primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(232,41,28,.35); }
        .pay-modal-btn:disabled { opacity: .6; cursor: not-allowed; transform: none !important; }

        /* Responsive */
        @media (max-width: 768px) {
          .pay-stats { grid-template-columns: repeat(2, 1fr); }
          .pay-header { flex-direction: column; align-items: flex-start; }
          .pay-history-head { flex-direction: column; align-items: flex-start; }
          .pay-history-item { flex-direction: column; align-items: flex-start; }
          .pay-history-item-right { width: 100%; justify-content: space-between; }
          .pay-method-tabs { flex-direction: column; }
          .pay-modal-footer { flex-direction: column; }
        }
        @media (max-width: 480px) {
          .pay-stats { grid-template-columns: 1fr 1fr; }
          .pay-panel { padding: 16px; }
        }
      `}</style>
    </div>
  );
}
