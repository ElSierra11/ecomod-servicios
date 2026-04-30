import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { paymentsApi } from "../services/api";
import {
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  Shield,
  CreditCard,
  Hash,
  Package,
  Clock,
} from "lucide-react";

// ─── Confetti mejorado ───────────────────────────────────────────────────────
function Confetti({ active }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const colors = [
      "#e8291c",
      "#f97316",
      "#fbbf24",
      "#10b981",
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
      "#06b6d4",
    ];

    const pieces = Array.from({ length: 150 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * -window.innerHeight - 100,
      r: Math.random() * 6 + 2,
      d: Math.random() * 100 + 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 10,
      tiltAngle: Math.random() * Math.PI * 2,
      tiltSpeed: Math.random() * 0.07 + 0.03,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 4,
      opacity: Math.random() * 0.5 + 0.5,
    }));

    let frame;
    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      pieces.forEach((p) => {
        p.tiltAngle += p.tiltSpeed;
        p.y += (Math.cos(p.d) + 2) * 1.5;
        p.x += Math.sin(p.tiltAngle) * 1.2;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        // Dibujar formas variadas: círculos, cuadrados, triángulos
        const shape = Math.floor(Math.random() * 3);
        if (shape === 0) {
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else if (shape === 1) {
          ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
        } else {
          ctx.beginPath();
          ctx.moveTo(0, -p.r);
          ctx.lineTo(p.r, p.r);
          ctx.lineTo(-p.r, p.r);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();

        if (p.y > window.innerHeight + 50) {
          p.y = -50;
          p.x = Math.random() * window.innerWidth;
        }
      });
      frame = requestAnimationFrame(draw);
    };
    draw();

    const timer = setTimeout(() => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    }, 6000);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      window.removeEventListener("resize", resize);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 999,
      }}
    />
  );
}

// ─── Countdown Ring ─────────────────────────────────────────────────────────
function CountdownRing({ seconds, total }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const progress = ((total - seconds) / total) * circ;

  return (
    <div className="pp-countdown">
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="rgba(232,41,28,0.1)"
          strokeWidth="3"
        />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="#e8291c"
          strokeWidth="3"
          strokeDasharray={circ}
          strokeDashoffset={circ - progress}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <span className="pp-countdown-text">{seconds}</span>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function PaypalReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(5);
  const [showDetails, setShowDetails] = useState(false);
  const [txnId, setTxnId] = useState("");
  const [orderAmount, setOrderAmount] = useState(null);
  const orderId = searchParams.get("order_id");

  // ── Procesar pago ─────────────────────────────────────────────────────────
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
        const result = await paymentsApi.executePaypalOrder(
          paymentId,
          payerId,
          orderId,
        );
        if (result.success) {
          setTxnId(paymentId);
          setOrderAmount(result.amount || result.order?.total_amount);
          setStatus("success");
        } else {
          if (
            result.error?.includes("already") ||
            result.error?.includes("ya fue")
          ) {
            setTxnId(paymentId);
            setStatus("success");
          } else {
            setStatus("error");
            setMessage(
              result.error || "No se pudo completar el procesamiento del pago.",
            );
          }
        }
      } catch (err) {
        if (
          err.message?.includes("already") ||
          err.message?.includes("ya fue")
        ) {
          setTxnId(paymentId);
          setStatus("success");
        } else {
          setStatus("error");
          setMessage(
            err.message || "Ocurrió un error inesperado al procesar tu pago.",
          );
        }
      }
    };
    run();
  }, [searchParams, orderId]);

  // ── Countdown y redirección ───────────────────────────────────────────────
  useEffect(() => {
    if (status !== "success") return;

    const t1 = setTimeout(() => setShowDetails(true), 600);

    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          navigate("/payments");
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(t1);
      clearInterval(interval);
    };
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
    <div className="pp-root">
      <Confetti active={status === "success"} />

      {/* Background decoration */}
      <div className="pp-bg">
        <div className="pp-bg-orb orb1" />
        <div className="pp-bg-orb orb2" />
        <div className="pp-bg-grid" />
      </div>

      {/* Main Card */}
      <div className={`pp-card ${status}`}>
        {/* Logo */}
        <div className="pp-logo">
          <div className="pp-logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
            </svg>
          </div>
          <span className="pp-logo-text">EcoMod</span>
        </div>

        {/* ── LOADING ── */}
        {status === "loading" && (
          <div className="pp-state">
            <div className="pp-loader-wrap">
              <div className="pp-loader-ring">
                <Loader2
                  size={40}
                  strokeWidth={2.5}
                  className="pp-loader-spin"
                />
              </div>
              <div className="pp-loader-pulse" />
            </div>
            <h2 className="pp-title">Verificando tu pago</h2>
            <p className="pp-sub">
              Estamos confirmando la transacción con PayPal. Esto solo tomará
              unos segundos...
            </p>
            <div className="pp-loading-steps">
              <div className="pp-step active">
                <div className="pp-step-dot" />
                <span>Conectando con PayPal</span>
              </div>
              <div className="pp-step active">
                <div className="pp-step-dot" />
                <span>Validando transacción</span>
              </div>
              <div className="pp-step">
                <div className="pp-step-dot" />
                <span>Confirmando pago</span>
              </div>
            </div>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {status === "success" && (
          <div className="pp-state success-state">
            {/* Success Icon */}
            <div className="pp-success-icon">
              <div className="pp-success-ring ring1" />
              <div className="pp-success-ring ring2" />
              <div className="pp-success-ring ring3" />
              <div className="pp-check-wrap">
                <CheckCircle size={36} strokeWidth={2.5} color="#10b981" />
              </div>
            </div>

            {/* Stamp */}
            <div className="pp-stamp">
              <Shield size={12} strokeWidth={2.5} />
              <span>PAGO CONFIRMADO</span>
            </div>

            {/* Title */}
            <h2 className="pp-title success-title">
              ¡Transacción
              <br />
              Exitosa!
            </h2>
            <p className="pp-sub success-sub">
              Tu pago ha sido procesado y confirmado exitosamente.
            </p>

            {/* Details */}
            <div className={`pp-details ${showDetails ? "visible" : ""}`}>
              {orderId && (
                <div className="pp-detail-row">
                  <span className="pp-detail-label">
                    <Package size={12} strokeWidth={2.5} />
                    Orden
                  </span>
                  <span className="pp-detail-val">#{orderId}</span>
                </div>
              )}
              {orderAmount && (
                <div className="pp-detail-row">
                  <span className="pp-detail-label">
                    <CreditCard size={12} strokeWidth={2.5} />
                    Monto
                  </span>
                  <span className="pp-detail-val highlight">
                    {formatCOP(orderAmount)}
                  </span>
                </div>
              )}
              {txnId && (
                <div className="pp-detail-row">
                  <span className="pp-detail-label">
                    <Hash size={12} strokeWidth={2.5} />
                    Transacción
                  </span>
                  <span className="pp-detail-val mono">
                    {txnId.slice(0, 16)}...
                  </span>
                </div>
              )}
              <div className="pp-detail-row">
                <span className="pp-detail-label">
                  <Clock size={12} strokeWidth={2.5} />
                  Estado
                </span>
                <span className="pp-detail-val success-badge">
                  <CheckCircle size={10} strokeWidth={2.5} />
                  COMPLETADO
                </span>
              </div>
              <div className="pp-detail-row">
                <span className="pp-detail-label">
                  <CreditCard size={12} strokeWidth={2.5} />
                  Método
                </span>
                <span className="pp-detail-val">PayPal</span>
              </div>
            </div>

            {/* Redirect */}
            <div className="pp-redirect">
              <CountdownRing seconds={countdown} total={5} />
              <div className="pp-redirect-text">
                <span>Redirigiendo a Pagos</span>
                <span className="pp-redirect-sub">
                  en {countdown} segundo{countdown !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <button
              className="pp-btn-primary"
              onClick={() => navigate("/payments")}
            >
              Ver mis pagos
              <ArrowRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* ── ERROR ── */}
        {status === "error" && (
          <div className="pp-state error-state">
            <div className="pp-error-icon">
              <XCircle size={40} strokeWidth={2} color="#ef4444" />
            </div>
            <div className="pp-error-badge">
              <XCircle size={12} strokeWidth={2.5} />
              <span>PAGO NO COMPLETADO</span>
            </div>
            <h2 className="pp-title">Error en el pago</h2>
            <p className="pp-sub error-sub">{message}</p>

            <div className="pp-error-actions">
              <button
                className="pp-btn-secondary"
                onClick={() => navigate("/payments")}
              >
                Volver a Pagos
              </button>
              <button
                className="pp-btn-outline"
                onClick={() => window.location.reload()}
              >
                Intentar de nuevo
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pp-footer">
          <Shield size={12} strokeWidth={2} />
          <span>Transacción cifrada con SSL · Procesada por PayPal</span>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Barlow+Condensed:wght@400;600;700;800&display=swap');

        .pp-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f0f13 0%, #1a1a24 50%, #0f0f13 100%);
          font-family: 'Inter', sans-serif;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }

        /* ── Background ── */
        .pp-bg { position: fixed; inset: 0; pointer-events: none; }
        .pp-bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.12;
        }
        .orb1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, #e8291c, transparent);
          top: -150px; left: -150px;
          animation: orbFloat 10s ease-in-out infinite alternate;
        }
        .orb2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #f97316, transparent);
          bottom: -100px; right: -100px;
          animation: orbFloat 12s ease-in-out infinite alternate-reverse;
        }
        @keyframes orbFloat {
          from { transform: translate(0, 0); }
          to   { transform: translate(40px, 40px); }
        }
        .pp-bg-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(232,41,28,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232,41,28,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        /* ── Card ── */
        .pp-card {
          position: relative;
          z-index: 10;
          background: rgba(255, 255, 255, 0.97);
          backdrop-filter: blur(20px);
          border: 1.5px solid rgba(232, 41, 28, 0.15);
          border-radius: 24px;
          padding: 40px 36px 32px;
          width: 100%;
          max-width: 460px;
          text-align: center;
          animation: cardIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.1);
        }
        .pp-card.success { 
          border-color: rgba(16, 185, 129, 0.3);
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.3),
            0 0 40px rgba(16, 185, 129, 0.1);
        }
        .pp-card.error { 
          border-color: rgba(239, 68, 68, 0.25);
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.3),
            0 0 40px rgba(239, 68, 68, 0.08);
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Logo ── */
        .pp-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 32px;
        }
        .pp-logo-icon {
          width: 40px; height: 40px;
          background: linear-gradient(135deg, #e8291c, #f97316);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(232, 41, 28, 0.3);
        }
        .pp-logo-text {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 24px;
          font-weight: 800;
          color: #1a1a1a;
          letter-spacing: -0.02em;
        }

        /* ── State ── */
        .pp-state { display: flex; flex-direction: column; align-items: center; }

        /* ── Loading ── */
        .pp-loader-wrap {
          position: relative;
          width: 80px; height: 80px;
          margin: 0 auto 20px;
        }
        .pp-loader-ring {
          width: 80px; height: 80px;
          border-radius: 50%;
          background: rgba(232, 41, 28, 0.08);
          display: flex; align-items: center; justify-content: center;
          border: 2px solid rgba(232, 41, 28, 0.15);
        }
        .pp-loader-spin {
          animation: spin 1s linear infinite;
          color: #e8291c;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .pp-loader-pulse {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 2px solid rgba(232, 41, 28, 0.1);
          animation: pulse 2s ease-out infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.3); opacity: 0; }
        }

        .pp-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 32px;
          font-weight: 800;
          color: #1a1a1a;
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .pp-sub {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
          margin-top: 10px;
          max-width: 320px;
        }

        .pp-loading-steps {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 28px;
          width: 100%;
          max-width: 280px;
        }
        .pp-step {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
          color: #9ca3af;
          font-weight: 500;
          transition: all 0.3s;
        }
        .pp-step.active { color: #1a1a1a; font-weight: 600; }
        .pp-step-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #e5e7eb;
          transition: all 0.3s;
          flex-shrink: 0;
        }
        .pp-step.active .pp-step-dot {
          background: #e8291c;
          box-shadow: 0 0 0 4px rgba(232, 41, 28, 0.15);
        }

        /* ── Success ── */
        .pp-success-icon {
          position: relative;
          width: 100px; height: 100px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto;
        }
        .pp-success-ring {
          position: absolute;
          border-radius: 50%;
          border: 1.5px solid rgba(16, 185, 129, 0.3);
          animation: ringPulse 2.5s ease-out infinite;
        }
        .ring1 { inset: 0; animation-delay: 0s; }
        .ring2 { inset: -14px; animation-delay: 0.5s; }
        .ring3 { inset: -28px; animation-delay: 1s; }
        @keyframes ringPulse {
          0%   { transform: scale(0.9); opacity: 0.6; }
          100% { transform: scale(1.2); opacity: 0; }
        }
        .pp-check-wrap {
          width: 72px; height: 72px;
          background: rgba(16, 185, 129, 0.1);
          border: 2px solid rgba(16, 185, 129, 0.3);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          animation: checkIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
        }
        @keyframes checkIn {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }

        .pp-stamp {
          margin-top: 20px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          background: rgba(16, 185, 129, 0.1);
          border: 1.5px solid rgba(16, 185, 129, 0.25);
          border-radius: 40px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.15em;
          color: #10b981;
          animation: stampIn 0.4s ease 0.8s both;
        }
        @keyframes stampIn {
          from { opacity: 0; transform: scale(0.8) rotate(-5deg); }
          to   { opacity: 1; transform: scale(1) rotate(0deg); }
        }

        .success-title {
          font-size: 40px;
          background: linear-gradient(135deg, #1a1a1a 30%, #e8291c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: titleIn 0.5s ease 1s both;
          margin-top: 16px;
        }
        @keyframes titleIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .success-sub {
          animation: titleIn 0.5s ease 1.1s both;
        }

        /* ── Details ── */
        .pp-details {
          width: 100%;
          margin-top: 24px;
          background: #f9fafb;
          border: 1.5px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          opacity: 0;
          transform: translateY(12px);
          transition: all 0.5s ease;
        }
        .pp-details.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .pp-detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid #e5e7eb;
        }
        .pp-detail-row:last-child { border-bottom: none; }
        .pp-detail-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }
        .pp-detail-val {
          font-size: 13px;
          color: #1a1a1a;
          font-weight: 700;
        }
        .pp-detail-val.highlight {
          color: #e8291c;
          font-size: 15px;
          font-family: 'Barlow Condensed', sans-serif;
        }
        .pp-detail-val.mono {
          font-family: 'SF Mono', monospace;
          font-size: 11px;
          color: #6b7280;
        }
        .success-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(16, 185, 129, 0.1);
          color: #10b981 !important;
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 20px;
          padding: 4px 12px;
          font-size: 11px !important;
          font-weight: 800;
          letter-spacing: 0.04em;
        }

        /* ── Countdown ── */
        .pp-countdown {
          position: relative;
          width: 56px; height: 56px;
          flex-shrink: 0;
        }
        .pp-countdown-text {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 800;
          color: #e8291c;
          font-family: 'Barlow Condensed', sans-serif;
        }
        .pp-redirect {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
          padding: 16px 20px;
          background: #f9fafb;
          border: 1.5px solid #e5e7eb;
          border-radius: 16px;
          width: 100%;
        }
        .pp-redirect-text {
          display: flex;
          flex-direction: column;
          text-align: left;
          gap: 3px;
        }
        .pp-redirect-text span:first-child {
          font-size: 14px;
          font-weight: 700;
          color: #1a1a1a;
        }
        .pp-redirect-sub {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        /* ── Buttons ── */
        .pp-btn-primary {
          margin-top: 16px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px;
          background: linear-gradient(135deg, #e8291c, #c2200f);
          border: none;
          border-radius: 12px;
          color: white;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s;
          box-shadow: 0 4px 16px rgba(232, 41, 28, 0.3);
        }
        .pp-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(232, 41, 28, 0.4);
        }

        /* ── Error ── */
        .pp-error-icon {
          width: 80px; height: 80px;
          background: rgba(239, 68, 68, 0.08);
          border: 2px solid rgba(239, 68, 68, 0.2);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px;
          animation: checkIn 0.4s ease both;
        }
        .pp-error-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          background: rgba(239, 68, 68, 0.08);
          border: 1.5px solid rgba(239, 68, 68, 0.2);
          border-radius: 40px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: #ef4444;
          margin-bottom: 12px;
        }
        .error-sub { color: #6b7280; }
        
        .pp-error-actions {
          display: flex;
          gap: 10px;
          margin-top: 24px;
          width: 100%;
        }
        .pp-btn-secondary {
          flex: 1;
          padding: 12px;
          background: linear-gradient(135deg, #e8291c, #c2200f);
          border: none;
          border-radius: 10px;
          color: white;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s;
        }
        .pp-btn-secondary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(232, 41, 28, 0.3);
        }
        .pp-btn-outline {
          flex: 1;
          padding: 12px;
          background: white;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          color: #4b5563;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .pp-btn-outline:hover {
          border-color: #e8291c;
          color: #e8291c;
          background: #fff5f5;
        }

        /* ── Footer ── */
        .pp-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 11px;
          color: #9ca3af;
          font-weight: 500;
        }

        @media (max-width: 480px) {
          .pp-card { padding: 32px 24px 24px; max-width: 100%; }
          .pp-title { font-size: 28px; }
          .success-title { font-size: 34px; }
          .pp-error-actions { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
