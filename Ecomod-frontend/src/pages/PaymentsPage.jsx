import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { useToast } from "../App";
import { useSwal } from "../hooks/useSwal";
import { paymentsApi, ordersApi } from "../services/api";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, Download, RefreshCw, CheckCircle, XCircle, Clock,
  AlertCircle, Wallet, Shield, Receipt, FileText, Calendar, Hash,
  Printer, Copy, ChevronRight, ArrowRight, Package, X, Zap
} from "lucide-react";
import { cn } from "../lib/utils";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_51TDZt1E9kBxCJwntAWeM1HbFiNc3Z9RFT2ojKJbaZSIwzLUnVw78eJrKmz9WWqnYWCn72Sht3bYw4dqRfvCfvAQp00TDiynNvH");

// Helper to format COP
const formatCOP = (n) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

async function generateReceipt(payment, order) {
  try {
    const { default: jsPDF } = await import("jspdf");
    const amount = payment.amount || order?.total_amount || 0;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    
    // --- Configuration ---
    const primaryColor = [37, 99, 235]; // Blue
    const secondaryColor = [71, 85, 105]; // Slate
    const lightBg = [248, 250, 252];
    const margin = 20;
    const pageWidth = 210;
    
    // --- Header / Branding ---
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.text("EcoMod", margin, 25);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("SOLUCIONES MODULARES MODERNAS", margin, 32);
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("COMPROBANTE DE PAGO", pageWidth - margin, 20, { align: "right" });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Recibo No: REC-${String(payment.id).padStart(6, "0")}`, pageWidth - margin, 27, { align: "right" });
    doc.text(`Fecha: ${new Date(payment.created_at).toLocaleDateString("es-CO")}`, pageWidth - margin, 32, { align: "right" });

    // --- Info Section ---
    let y = 55;
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("CLIENTE:", margin, y);
    doc.text("DETALLES DEL PAGO:", pageWidth / 2 + 10, y);
    
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(order?.user?.nombre || "Cliente Valorado", margin, y);
    doc.text(`Orden ID: #${String(order?.id || payment.order_id).padStart(6, "0")}`, pageWidth / 2 + 10, y);
    
    y += 5;
    doc.text(order?.user?.email || "contacto@ecomod.com", margin, y);
    doc.text(`Método: ${payment.payment_method === "card_stripe" ? "Tarjeta de Crédito" : "PayPal"}`, pageWidth / 2 + 10, y);
    
    y += 5;
    doc.text("Colombia", margin, y);
    doc.text(`Transacción: ${payment.transaction_id?.slice(0, 24) || "N/A"}`, pageWidth / 2 + 10, y);

    // --- Table Header ---
    y += 20;
    doc.setFillColor(...lightBg);
    doc.rect(margin, y, pageWidth - margin * 2, 10, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Descripción", margin + 5, y + 6.5);
    doc.text("Cant.", margin + 110, y + 6.5, { align: "center" });
    doc.text("Precio Unit.", margin + 140, y + 6.5, { align: "center" });
    doc.text("Total", pageWidth - margin - 5, y + 6.5, { align: "right" });

    // --- Table Content ---
    y += 10;
    doc.setFont("helvetica", "normal");
    const items = order?.items || [{ product_name: "Pago de orden", quantity: 1, unit_price: amount }];
    
    items.forEach((item, i) => {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.text(item.product_name || "Producto", margin + 5, y + 7);
      doc.text(String(item.quantity), margin + 110, y + 7, { align: "center" });
      doc.text(`$${Math.round(item.unit_price).toLocaleString("es-CO")}`, margin + 140, y + 7, { align: "center" });
      doc.text(`$${Math.round(item.unit_price * item.quantity).toLocaleString("es-CO")}`, pageWidth - margin - 5, y + 7, { align: "right" });
      
      doc.setDrawColor(240, 240, 240);
      doc.line(margin, y + 10, pageWidth - margin, y + 10);
      y += 10;
    });

    // --- Totals Section ---
    y += 10;
    const summaryX = pageWidth - margin - 60;
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL PAGADO:", summaryX, y);
    doc.setFontSize(14);
    doc.setTextColor(...primaryColor);
    doc.text(`$${Math.round(amount).toLocaleString("es-CO")} COP`, pageWidth - margin - 5, y, { align: "right" });

    // --- Footer ---
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    const footerY = 280;
    doc.text("Gracias por su compra en EcoMod. Si tiene alguna duda, contáctenos en soporte@ecomod.com", pageWidth / 2, footerY, { align: "center" });
    doc.text("Este documento es un comprobante de pago electrónico válido.", pageWidth / 2, footerY + 4, { align: "center" });

    doc.save(`EcoMod-Recibo-${String(payment.id).padStart(6, "0")}.pdf`);
  } catch (e) {
    console.error(e);
    throw new Error("Error al generar el comprobante premium");
  }
}

const CARD_STYLE = {
  style: {
    base: { fontSize: "16px", fontFamily: "'Inter', sans-serif", color: "inherit", "::placeholder": { color: "#9ca3af" } },
    invalid: { color: "#ef4444" },
  },
};

function StripeCheckoutForm({ order, user, onSuccess, onError, swal }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    
    const confirm = await swal.confirm("Confirmar Pago", `¿Pagar ${formatCOP(order.total_amount)}?`, "Sí, pagar", "Cancelar");
    if (!confirm.isConfirmed) return;

    setProcessing(true);
    swal.loading("Procesando pago...");
    try {
      const intentData = await paymentsApi.createIntent({ order_id: order.id, user_id: user.id, amount: order.total_amount });
      const { error, paymentIntent } = await stripe.confirmCardPayment(intentData.client_secret, {
        payment_method: { card: elements.getElement(CardElement), billing_details: { name: user.nombre || `User ${user.id}` } }
      });
      if (error || paymentIntent.status !== "succeeded") throw new Error(error?.message || "Pago fallido");
      
      const payment = await paymentsApi.confirmIntent({
        payment_intent_id: paymentIntent.id, order_id: order.id, user_id: user.id,
        amount: order.total_amount, payment_method: "card_stripe", email: user.email,
      });
      
      // Asegurar que el estado de la orden se actualice a 'confirmed'
      try { await ordersApi.updateStatus(order.id, "confirmed"); } catch (e) { console.error("Error updating order status:", e); }
      
      swal.close();
      onSuccess(payment);
    } catch (err) {
      swal.close();
      onError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 rounded-xl border border-border bg-background">
        <label className="flex items-center gap-2 text-sm font-bold text-muted-foreground mb-4">
          <CreditCard className="w-4 h-4" /> Datos de la tarjeta
        </label>
        <div className="p-3 bg-secondary/30 rounded-lg border border-border">
          <CardElement options={CARD_STYLE} onChange={e => setCardComplete(e.complete)} />
        </div>
      </div>
      <button type="submit" disabled={!stripe || processing || !cardComplete} className="w-full py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-colors">
        {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Zap className="w-5 h-5" /> Pagar {formatCOP(order.total_amount)}</>}
      </button>
      <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1"><Shield className="w-3 h-3" /> Pago encriptado por Stripe</p>
    </form>
  );
}

function PaypalForm({ order, user, onError, swal }) {
  const [processing, setProcessing] = useState(false);
  const handlePaypal = async () => {
    const usd = (order.total_amount / 4200).toFixed(2);
    const confirm = await swal.confirm("PayPal", `Pagar aprox $${usd} USD.`, "Continuar", "Cancelar");
    if (!confirm.isConfirmed) return;

    setProcessing(true);
    try {
      const res = await paymentsApi.createPaypalOrder({ order_id: order.id, user_id: user.id, amount: parseFloat(usd) });
      if (res.success) window.location.href = res.approval_url;
      else throw new Error("Error PayPal");
    } catch (e) { onError(e.message); setProcessing(false); }
  };

  return (
    <div className="space-y-6 text-center">
      <div className="p-6 rounded-xl border border-border bg-secondary/20">
        <p className="text-sm font-bold text-muted-foreground mb-2">Total a pagar</p>
        <p className="text-3xl font-head font-bold text-primary mb-1">{formatCOP(order.total_amount)}</p>
        <p className="text-sm text-muted-foreground">≈ ${(order.total_amount / 4200).toFixed(2)} USD</p>
      </div>
      <button onClick={handlePaypal} disabled={processing} className="w-full py-4 bg-[#0070ba] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#003087] disabled:opacity-50 transition-colors">
        {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Wallet className="w-5 h-5" /> Pagar con PayPal</>}
      </button>
    </div>
  );
}

const STATUS_CONF = {
  pending: { label: "Pendiente", icon: Clock, c: "text-amber-500", bg: "bg-amber-500/10" },
  succeeded: { label: "Aprobado", icon: CheckCircle, c: "text-green-500", bg: "bg-green-500/10" },
  failed: { label: "Fallido", icon: XCircle, c: "text-red-500", bg: "bg-red-500/10" },
};

function ReceiptModal({ payment, order, onClose, swal }) {
  const [gen, setGen] = useState(false);
  const handleDl = async () => { setGen(true); try { await generateReceipt(payment, order); swal.success("¡Descargado!", "Tu recibo está listo"); } catch { swal.error("Error", "No se pudo generar el PDF"); } finally { setGen(false); } };
  const st = STATUS_CONF[payment.status] || STATUS_CONF.pending;
  const items = order?.items || [];

  return (
    <div className="fixed inset-0 bg-background/60 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.9 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }} 
        className="bg-card w-full max-w-lg rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] border border-border overflow-hidden relative" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header Decore */}
        <div className={cn("h-3 w-full", st.c.replace("text", "bg"))} />
        
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold">EM</div>
              <div>
                <h2 className="text-xl font-bold font-head leading-none">EcoMod</h2>
                <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">Comprobante Oficial</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-muted-foreground hover:bg-secondary rounded-full transition-colors"><X className="w-5 h-5" /></button>
          </div>

          <div className="text-center mb-8">
            <div className={cn("w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 shadow-inner", st.bg, st.c)}>
              <st.icon className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold mb-1">¡Pago {st.label}!</h3>
            <p className="text-sm text-muted-foreground">Transacción #{payment.transaction_id?.slice(-12).toUpperCase() || payment.id}</p>
          </div>

          <div className="space-y-6">
            <div className="bg-secondary/30 rounded-3xl p-6 border border-border/50">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Monto Total</p>
                  <p className="text-4xl font-head font-bold text-primary">{formatCOP(payment.amount || order?.total_amount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Estado</p>
                  <span className={cn("px-3 py-1 rounded-full text-xs font-bold shadow-sm", st.bg, st.c)}>{st.label}</span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-border/50">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Orden</span>
                  <span className="font-bold">#{String(payment.order_id).padStart(6, "0")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Método de pago</span>
                  <span className="font-bold flex items-center gap-2">
                    {payment.payment_method === "card_stripe" ? <><CreditCard className="w-4 h-4" /> Tarjeta</> : <><Wallet className="w-4 h-4" /> PayPal</>}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Fecha y Hora</span>
                  <span className="font-bold">{new Date(payment.created_at).toLocaleString("es-CO", { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
              </div>
            </div>

            {items.length > 0 && (
              <div className="px-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Resumen de productos</p>
                <div className="max-h-32 overflow-y-auto pr-2 space-y-2 thin-scrollbar">
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="truncate flex-1 pr-4">{item.quantity}x {item.product_name}</span>
                      <span className="font-bold whitespace-nowrap">{formatCOP(item.unit_price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-dashed border-border flex gap-4">
            <button onClick={handleDl} disabled={gen} className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50">
              {gen ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Download className="w-5 h-5" /> Descargar PDF</>}
            </button>
            <button onClick={onClose} className="px-6 py-4 bg-secondary text-foreground rounded-2xl font-bold hover:bg-secondary/80 transition-all active:scale-95">
              Cerrar
            </button>
          </div>
        </div>
        
        {/* Jagged Edge Bottom Decoration */}
        <div className="h-4 w-full bg-card relative overflow-hidden flex">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="w-8 h-8 bg-background rounded-full -mt-4 flex-shrink-0 mx-[-4px]" />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default function PaymentsPage({ checkoutOrderId, onCheckoutHandled }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const swal = useSwal(theme === "dark");
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState("");
  const [method, setMethod] = useState("stripe");
  const [receipt, setReceipt] = useState(null);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (checkoutOrderId && orders.length) { setSelectedOrder(String(checkoutOrderId)); if(onCheckoutHandled) onCheckoutHandled(); } }, [checkoutOrderId, orders]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pays, ords] = await Promise.all([paymentsApi.getByUser(user.id), ordersApi.getByUser(user.id)]);
      setPayments(pays);
      setOrders(ords.filter(o => o.status === "pending"));
    } catch { swal.error("Error", "No se pudieron cargar los datos"); } finally { setLoading(false); }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"/></div>;

  const orderObj = orders.find(o => String(o.id) === selectedOrder);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white"><CreditCard className="w-6 h-6" /></div>
        <h1 className="text-3xl font-head font-bold">Pagos y Facturación</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Nueva Transacción */}
        <div className="glass-card p-6 rounded-3xl border border-border">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6"><Wallet className="w-5 h-5 text-primary" /> Pagar Orden</h2>
          {!orders.length ? (
            <div className="text-center p-8 bg-secondary/30 rounded-2xl border border-dashed border-border"><Package className="w-10 h-10 mx-auto text-muted-foreground mb-2"/> <p className="font-bold">No hay ordenes pendientes</p></div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-bold text-muted-foreground mb-2 block">Selecciona una orden</label>
                <select value={selectedOrder} onChange={e => setSelectedOrder(e.target.value)} className="w-full p-4 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                  <option value="">-- Seleccionar --</option>
                  {orders.map(o => <option key={o.id} value={o.id}>Orden #{o.id} - {formatCOP(o.total_amount)}</option>)}
                </select>
              </div>

              {orderObj && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="flex gap-4">
                    <button onClick={() => setMethod("stripe")} className={cn("flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 font-bold transition-all", method === "stripe" ? "border-primary bg-primary/5 text-primary" : "border-border bg-background hover:bg-secondary")}>
                      <CreditCard className="w-6 h-6" /> Tarjeta
                    </button>
                    <button onClick={() => setMethod("paypal")} className={cn("flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 font-bold transition-all", method === "paypal" ? "border-[#0070ba] bg-[#0070ba]/5 text-[#0070ba]" : "border-border bg-background hover:bg-secondary")}>
                      <Wallet className="w-6 h-6" /> PayPal
                    </button>
                  </div>
                  
                  {method === "stripe" ? (
                    <Elements stripe={stripePromise}><StripeCheckoutForm order={orderObj} user={user} swal={swal} onSuccess={p => { loadData(); setReceipt({p, o: orderObj}); setSelectedOrder(""); }} onError={e => swal.error("Error", e)} /></Elements>
                  ) : (
                    <PaypalForm order={orderObj} user={user} swal={swal} onError={e => swal.error("Error", e)} />
                  )}
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Historial */}
        <div className="glass-card p-6 rounded-3xl border border-border">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6"><FileText className="w-5 h-5 text-primary" /> Historial de Pagos</h2>
          <div className="space-y-4">
            {!payments.length ? <p className="text-muted-foreground text-center py-8">No hay pagos registrados</p> : 
              payments.map(p => {
                const st = STATUS_CONF[p.status] || STATUS_CONF.pending;
                return (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-background border border-border rounded-xl hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setReceipt({p, o: {}})}>
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", st.bg, st.c)}><st.icon className="w-5 h-5"/></div>
                      <div>
                        <p className="font-bold">Orden #{p.order_id}</p>
                        <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{formatCOP(p.amount)}</p>
                      <p className={cn("text-xs font-bold", st.c)}>{st.label}</p>
                    </div>
                  </div>
                )
              })
            }
          </div>
        </div>
      </div>
      {receipt && <ReceiptModal payment={receipt.p} order={receipt.o} onClose={() => setReceipt(null)} swal={swal} />}
    </div>
  );
}
