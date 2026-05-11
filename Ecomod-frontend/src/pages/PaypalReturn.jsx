import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { paymentsApi } from "../services/api";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, ArrowRight, Shield, CreditCard, Hash, Package, Clock, Loader2 } from "lucide-react";

// Confetti Component
function Confetti({ active }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const resize = () => { canvas.width = window.innerWidth * dpr; canvas.height = window.innerHeight * dpr; ctx.scale(dpr, dpr); };
    resize(); window.addEventListener("resize", resize);
    const colors = ["#e8291c", "#f97316", "#fbbf24", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"];
    const pieces = Array.from({ length: 150 }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * -window.innerHeight - 100,
      r: Math.random() * 6 + 2, d: Math.random() * 100 + 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 10, tiltAngle: Math.random() * Math.PI * 2, tiltSpeed: Math.random() * 0.07 + 0.03,
      rotation: Math.random() * 360, rotationSpeed: (Math.random() - 0.5) * 4, opacity: Math.random() * 0.5 + 0.5
    }));
    let frame;
    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      pieces.forEach((p) => {
        p.tiltAngle += p.tiltSpeed; p.y += (Math.cos(p.d) + 2) * 1.5; p.x += Math.sin(p.tiltAngle) * 1.2; p.rotation += p.rotationSpeed;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate((p.rotation * Math.PI) / 180); ctx.globalAlpha = p.opacity; ctx.fillStyle = p.color;
        const shape = Math.floor(Math.random() * 3);
        if (shape === 0) { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill(); }
        else if (shape === 1) ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
        else { ctx.beginPath(); ctx.moveTo(0, -p.r); ctx.lineTo(p.r, p.r); ctx.lineTo(-p.r, p.r); ctx.closePath(); ctx.fill(); }
        ctx.restore();
        if (p.y > window.innerHeight + 50) { p.y = -50; p.x = Math.random() * window.innerWidth; }
      });
      frame = requestAnimationFrame(draw);
    };
    draw();
    const timer = setTimeout(() => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); }, 6000);
    return () => { cancelAnimationFrame(frame); clearTimeout(timer); window.removeEventListener("resize", resize); };
  }, [active]);
  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-50" />;
}

export default function PaypalReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(5);
  const [txnId, setTxnId] = useState("");
  const [orderAmount, setOrderAmount] = useState(null);
  const orderId = searchParams.get("order_id");

  useEffect(() => {
    const paymentId = searchParams.get("paymentId");
    const payerId = searchParams.get("PayerID");

    if (!paymentId || !payerId) {
      setStatus("error");
      setMessage("No se recibió la información de confirmación de PayPal.");
      return;
    }

    const run = async () => {
      try {
        const result = await paymentsApi.executePaypalOrder(paymentId, payerId, orderId);
        if (result.success) {
          // Asegurar que el estado de la orden se actualice a 'confirmed'
          try { 
            const { ordersApi } = await import("../services/api");
            await ordersApi.updateStatus(orderId, "confirmed"); 
          } catch (e) { console.error("Error updating order status:", e); }

          setTxnId(paymentId);
          setOrderAmount(result.amount || result.order?.total_amount);
          setStatus("success");
          setMessage("¡Pago completado con éxito!");
        } else {
          setStatus("error");
          setMessage(result.error || "No se pudo procesar el pago");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Error en la conexión con el servidor");
      }
    };
    run();
  }, [searchParams, orderId]);

  useEffect(() => {
    if (status !== "loading") {
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) { clearInterval(timer); navigate("/dashboard", { state: { target: "payments" } }); return 0; }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status, navigate]);

  const formatCOP = (n) => {
    if (!n) return "$0";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(n);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Confetti active={status === "success"} />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-card border border-border rounded-3xl shadow-xl overflow-hidden text-center p-8">
        {status === "loading" && (
          <div className="py-12 flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
            <h2 className="text-2xl font-bold mb-2">Procesando pago...</h2>
            <p className="text-muted-foreground">Por favor no cierres esta ventana.</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold mb-2">¡Pago Exitoso!</h2>
            <p className="text-muted-foreground mb-8">Tu orden #{orderId} está lista.</p>
            
            <div className="bg-secondary/30 rounded-2xl p-4 text-left space-y-3 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1"><Hash className="w-4 h-4"/> ID Transacción</span>
                <span className="font-mono font-bold truncate ml-4">{txnId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1"><CreditCard className="w-4 h-4"/> Método</span>
                <span className="font-bold">PayPal</span>
              </div>
              {orderAmount && (
                <div className="flex justify-between text-sm border-t border-border/50 pt-3 mt-3">
                  <span className="text-muted-foreground flex items-center gap-1"><Package className="w-4 h-4"/> Total</span>
                  <span className="font-bold text-primary text-lg">${orderAmount.toLocaleString("es-CO")} COP</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground font-bold bg-secondary/50 rounded-full py-2 w-max mx-auto px-4">
              <Clock className="w-4 h-4" /> Redirigiendo en {countdown}s
            </div>
          </div>
        )}

        {status === "error" && (
          <div>
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Pago Fallido</h2>
            <p className="text-muted-foreground mb-8">{message}</p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground font-bold bg-secondary/50 rounded-full py-2 w-max mx-auto px-4">
              <Clock className="w-4 h-4" /> Redirigiendo en {countdown}s
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
