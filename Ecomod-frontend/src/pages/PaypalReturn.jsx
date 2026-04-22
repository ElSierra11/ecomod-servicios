import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { paymentsApi } from "../services/api";

// ─── Confetti particle
function Confetti({ active }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = [
      "#10b981",
      "#34d399",
      "#fbbf24",
      "#f0f0f0",
      "#6ee7b7",
      "#fcd34d",
    ];
    const pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      r: Math.random() * 7 + 3,
      d: Math.random() * 120 + 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 10,
      tiltAngle: 0,
      tiltSpeed: Math.random() * 0.1 + 0.05,
    }));

    let frame;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p) => {
        p.tiltAngle += p.tiltSpeed;
        p.y += (Math.cos(p.d) + 2) * 1.8;
        p.x += Math.sin(p.tiltAngle) * 1.5;
        p.tilt = Math.sin(p.tiltAngle) * 12;
        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
        ctx.stroke();
        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
      });
      frame = requestAnimationFrame(draw);
    };
    draw();
    const timer = setTimeout(() => cancelAnimationFrame(frame), 5000);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 999,
      }}
    />
  );
}

// ─── Countdown ring
function CountdownRing({ seconds, total }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const progress = (seconds / total) * circ;
  return (
    <svg width="52" height="52" viewBox="0 0 52 52">
      <circle
        cx="26"
        cy="26"
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="3"
      />
      <circle
        cx="26"
        cy="26"
        r={r}
        fill="none"
        stroke="#10b981"
        strokeWidth="3"
        strokeDasharray={circ}
        strokeDashoffset={circ - progress}
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
        style={{ transition: "stroke-dashoffset 1s linear" }}
      />
      <text
        x="26"
        y="31"
        textAnchor="middle"
        fill="#f0f0f0"
        fontSize="13"
        fontWeight="700"
      >
        {seconds}
      </text>
    </svg>
  );
}

// ─── Main component
export default function PaypalReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(6);
  const [showDetails, setShowDetails] = useState(false);
  const [txnId, setTxnId] = useState("");
  const orderId = searchParams.get("order_id");

  // ── Procesar pago
  useEffect(() => {
    const paymentId = searchParams.get("paymentId");
    const payerId = searchParams.get("PayerID");

    if (!paymentId || !payerId) {
      setStatus("error");
      setMessage("No se recibió información de pago de PayPal.");
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
          setStatus("success");
        } else {
          if (result.error?.includes("already")) {
            setTxnId(paymentId);
            setStatus("success");
          } else {
            setStatus("error");
            setMessage(result.error || "Error al procesar el pago.");
          }
        }
      } catch (err) {
        if (err.message?.includes("already")) {
          setTxnId(paymentId);
          setStatus("success");
        } else {
          setStatus("error");
          setMessage(err.message || "Error inesperado al procesar el pago.");
        }
      }
    };
    run();
  }, [searchParams, orderId]);

  // ── Countdown y redirect
  useEffect(() => {
    if (status !== "success") return;
    // Mostrar detalles con pequeño delay para que la animación impacte primero
    const t1 = setTimeout(() => setShowDetails(true), 800);
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

  return (
    <div className="pr-root">
      <Confetti active={status === "success"} />

      {/* ── Fondo ── */}
      <div className="pr-bg">
        <div className="pr-bg-orb orb1" />
        <div className="pr-bg-orb orb2" />
        <div className="pr-bg-grid" />
      </div>

      {/* ── Card ── */}
      <div className={`pr-card ${status}`}>
        {/* Logo */}
        <div className="pr-logo">
          <div className="pr-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
            </svg>
          </div>
          <span className="pr-logo-text">EcoMod</span>
        </div>

        {/* ── Estado: cargando ── */}
        {status === "loading" && (
          <div className="pr-state">
            <div className="pr-spinner-wrap">
              <div className="pr-spinner" />
              <div className="pr-spinner-inner" />
            </div>
            <h2 className="pr-title">Verificando tu pago</h2>
            <p className="pr-sub">Confirmando la transacción con PayPal…</p>
            <div className="pr-dots">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        {/* ── Estado: éxito ── */}
        {status === "success" && (
          <div className="pr-state success-state">
            {/* Ícono animado */}
            <div className="pr-success-icon">
              <div className="pr-success-ring ring1" />
              <div className="pr-success-ring ring2" />
              <div className="pr-success-ring ring3" />
              <div className="pr-check-wrap">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path
                    className="pr-check-path"
                    d="M8 20 L16 29 L32 12"
                    stroke="#10b981"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
            </div>

            <div className="pr-stamp">
              <span>✦ TRANSACCIÓN CONFIRMADA ✦</span>
            </div>

            <h2 className="pr-title success-title">
              ¡La transacción
              <br />
              es un hecho!
            </h2>
            <p className="pr-sub success-sub">
              Tu pago fue procesado y confirmado exitosamente por PayPal.
            </p>

            {/* Detalles con animación de entrada */}
            <div className={`pr-details ${showDetails ? "visible" : ""}`}>
              {orderId && (
                <div className="pr-detail-row">
                  <span className="pr-detail-label">Orden</span>
                  <span className="pr-detail-val">#{orderId}</span>
                </div>
              )}
              {txnId && (
                <div className="pr-detail-row">
                  <span className="pr-detail-label">ID Transacción</span>
                  <span className="pr-detail-val mono">
                    {txnId.slice(0, 20)}…
                  </span>
                </div>
              )}
              <div className="pr-detail-row">
                <span className="pr-detail-label">Estado</span>
                <span className="pr-detail-val success-badge">✓ PAGADO</span>
              </div>
              <div className="pr-detail-row">
                <span className="pr-detail-label">Método</span>
                <span className="pr-detail-val">PayPal</span>
              </div>
            </div>

            {/* Countdown + redirect */}
            <div className="pr-redirect">
              <CountdownRing seconds={countdown} total={6} />
              <div className="pr-redirect-text">
                <span>Redirigiendo a tus pagos</span>
                <span className="pr-redirect-sub">
                  en {countdown} segundo{countdown !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <button
              className="pr-btn-now"
              onClick={() => navigate("/payments")}
            >
              Ir ahora →
            </button>
          </div>
        )}

        {/* ── Estado: error ── */}
        {status === "error" && (
          <div className="pr-state error-state">
            <div className="pr-error-icon">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path
                  d="M12 12 L28 28 M28 12 L12 28"
                  stroke="#ef4444"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h2 className="pr-title">Pago no completado</h2>
            <p className="pr-sub">{message}</p>
            <button
              className="pr-btn-back"
              onClick={() => navigate("/payments")}
            >
              ← Volver a pagos
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="pr-footer">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <rect
              x="3"
              y="11"
              width="18"
              height="11"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M7 11V7a5 5 0 0110 0v4"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <span>Transacción cifrada · Procesada por PayPal</span>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .pr-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #080810;
          font-family: 'Syne', sans-serif;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }

        /* ── Fondo ── */
        .pr-bg { position: fixed; inset: 0; pointer-events: none; }
        .pr-bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.18;
        }
        .orb1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #10b981, transparent);
          top: -100px; left: -100px;
          animation: orbFloat 8s ease-in-out infinite alternate;
        }
        .orb2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, #fbbf24, transparent);
          bottom: -80px; right: -80px;
          animation: orbFloat 10s ease-in-out infinite alternate-reverse;
        }
        @keyframes orbFloat {
          from { transform: translate(0, 0); }
          to   { transform: translate(30px, 30px); }
        }
        .pr-bg-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(16,185,129,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16,185,129,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        /* ── Card ── */
        .pr-card {
          position: relative;
          z-index: 10;
          background: rgba(12, 12, 20, 0.92);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 28px;
          padding: 44px 40px 36px;
          width: 100%;
          max-width: 440px;
          text-align: center;
          animation: cardIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .pr-card.success { border-color: rgba(16,185,129,0.3); }
        .pr-card.error   { border-color: rgba(239,68,68,0.25); }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(32px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Logo ── */
        .pr-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 36px;
        }
        .pr-logo-icon {
          width: 38px; height: 38px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .pr-logo-text {
          font-size: 20px;
          font-weight: 800;
          color: #f0f0f0;
          letter-spacing: -0.02em;
        }

        /* ── Estado común ── */
        .pr-state { display: flex; flex-direction: column; align-items: center; gap: 0; }
        .pr-title {
          font-size: 28px;
          font-weight: 800;
          color: #f0f0f0;
          line-height: 1.15;
          letter-spacing: -0.02em;
          margin-top: 20px;
        }
        .pr-sub {
          font-size: 14px;
          color: rgba(255,255,255,0.45);
          line-height: 1.6;
          margin-top: 10px;
          max-width: 300px;
        }

        /* ── Loading ── */
        .pr-spinner-wrap {
          position: relative;
          width: 72px; height: 72px;
          margin: 0 auto;
        }
        .pr-spinner, .pr-spinner-inner {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 3px solid transparent;
          animation: spin 1s linear infinite;
        }
        .pr-spinner      { border-top-color: #10b981; }
        .pr-spinner-inner{
          inset: 10px;
          border-top-color: rgba(16,185,129,0.35);
          animation-direction: reverse;
          animation-duration: 0.7s;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .pr-dots {
          display: flex; gap: 8px; margin-top: 20px;
        }
        .pr-dots span {
          width: 7px; height: 7px;
          background: #10b981;
          border-radius: 50%;
          animation: dotBounce 1.4s ease-in-out infinite;
        }
        .pr-dots span:nth-child(2) { animation-delay: 0.2s; }
        .pr-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dotBounce {
          0%,80%,100% { transform: scale(0.5); opacity: 0.4; }
          40%          { transform: scale(1);   opacity: 1; }
        }

        /* ── Success icon ── */
        .pr-success-icon {
          position: relative;
          width: 100px; height: 100px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto;
        }
        .pr-success-ring {
          position: absolute;
          border-radius: 50%;
          border: 1.5px solid rgba(16,185,129,0.4);
          animation: ringPulse 2.5s ease-out infinite;
        }
        .ring1 { inset: 0;    animation-delay: 0s; }
        .ring2 { inset: -12px; animation-delay: 0.4s; }
        .ring3 { inset: -24px; animation-delay: 0.8s; }
        @keyframes ringPulse {
          0%   { transform: scale(0.85); opacity: 0.8; }
          100% { transform: scale(1.15); opacity: 0; }
        }
        .pr-check-wrap {
          width: 72px; height: 72px;
          background: rgba(16,185,129,0.1);
          border: 1.5px solid rgba(16,185,129,0.35);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          animation: checkIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.2s both;
        }
        @keyframes checkIn {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        .pr-check-path {
          stroke-dasharray: 50;
          stroke-dashoffset: 50;
          animation: drawCheck 0.5s ease 0.6s forwards;
        }
        @keyframes drawCheck {
          to { stroke-dashoffset: 0; }
        }

        /* ── Stamp ── */
        .pr-stamp {
          margin-top: 20px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 5px 14px;
          background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.25);
          border-radius: 40px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.18em;
          color: #10b981;
          font-family: 'DM Mono', monospace;
          animation: stampIn 0.4s ease 0.8s both;
        }
        @keyframes stampIn {
          from { opacity: 0; transform: scale(0.8); }
          to   { opacity: 1; transform: scale(1); }
        }

        /* ── Title success ── */
        .success-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 48px;
          font-weight: 400;
          letter-spacing: 0.02em;
          background: linear-gradient(135deg, #f0f0f0 40%, #10b981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: titleIn 0.5s ease 1s both;
        }
        @keyframes titleIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .success-sub {
          animation: titleIn 0.5s ease 1.1s both;
        }

        /* ── Details ── */
        .pr-details {
          width: 100%;
          margin-top: 24px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          overflow: hidden;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .pr-details.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .pr-detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 11px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .pr-detail-row:last-child { border-bottom: none; }
        .pr-detail-label {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .pr-detail-val {
          font-size: 13px;
          color: #f0f0f0;
          font-weight: 600;
        }
        .pr-detail-val.mono {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: rgba(255,255,255,0.6);
        }
        .success-badge {
          background: rgba(16,185,129,0.15);
          color: #10b981 !important;
          border: 1px solid rgba(16,185,129,0.3);
          border-radius: 20px;
          padding: 3px 10px;
          font-size: 11px !important;
          font-family: 'DM Mono', monospace;
          letter-spacing: 0.06em;
        }

        /* ── Redirect ── */
        .pr-redirect {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 24px;
          padding: 14px 18px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          width: 100%;
        }
        .pr-redirect-text {
          display: flex;
          flex-direction: column;
          text-align: left;
          gap: 2px;
        }
        .pr-redirect-text span:first-child {
          font-size: 13px;
          font-weight: 600;
          color: #f0f0f0;
        }
        .pr-redirect-sub {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          font-family: 'DM Mono', monospace;
        }

        /* ── Botones ── */
        .pr-btn-now {
          margin-top: 14px;
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #10b981, #059669);
          border: none;
          border-radius: 12px;
          color: white;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.02em;
        }
        .pr-btn-now:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(16,185,129,0.35);
        }

        /* ── Error ── */
        .pr-error-icon {
          width: 72px; height: 72px;
          background: rgba(239,68,68,0.1);
          border: 1.5px solid rgba(239,68,68,0.3);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          animation: checkIn 0.4s ease both;
        }
        .pr-btn-back {
          margin-top: 24px;
          padding: 12px 28px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 40px;
          color: #f87171;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .pr-btn-back:hover { background: rgba(239,68,68,0.18); }

        /* ── Footer ── */
        .pr-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          margin-top: 32px;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.06);
          font-size: 11px;
          color: rgba(255,255,255,0.2);
          font-family: 'DM Mono', monospace;
        }

        @media (max-width: 480px) {
          .pr-card { padding: 36px 24px 28px; }
          .success-title { font-size: 38px; }
        }
      `}</style>
    </div>
  );
}
