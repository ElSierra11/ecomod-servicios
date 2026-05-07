import { useState } from "react";
import { authApi } from "../services/api";
import { useTheme } from "../hooks/useTheme";
import {
  Mail,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Zap,
  Shield,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

export default function ForgotPassword() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await authApi.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Error al enviar el correo de recuperación");
    } finally {
      setLoading(false);
    }
  };

  // ── SUCCESS STATE ──
  if (success) {
    return (
      <div className={`fp-root ${isDark ? "dark" : "light"}`}>
        <div className="fp-bg">
          <div className="fp-bg-orb orb1" />
          <div className="fp-bg-orb orb2" />
          <div className="fp-bg-grid" />
        </div>

        <div className="fp-container">
          <div className="fp-card success-card">
            {/* Success Animation */}
            <div className="fp-success-icon">
              <div className="fp-success-ring ring1" />
              <div className="fp-success-ring ring2" />
              <div className="fp-success-ring ring3" />
              <div className="fp-check-wrap">
                <CheckCircle size={40} strokeWidth={2.5} color="#10b981" />
              </div>
            </div>

            <div className="fp-stamp">
              <Shield size={12} strokeWidth={2.5} />
              <span>CORREO ENVIADO</span>
            </div>

            <h2 className="fp-title">¡Revisa tu correo!</h2>
            <p className="fp-sub">
              Hemos enviado un enlace de recuperación a{" "}
              <strong className="fp-highlight">{email}</strong>
            </p>

            <div className="fp-info-box">
              <div className="fp-info-row">
                <Mail size={14} strokeWidth={2} />
                <span>El enlace expira en 24 horas</span>
              </div>
              <div className="fp-info-row">
                <Lock size={14} strokeWidth={2} />
                <span>Verifica tu bandeja de spam</span>
              </div>
            </div>

            <a href="/login" className="fp-link-btn">
              <ArrowLeft size={16} strokeWidth={2.5} />
              Volver al inicio de sesión
            </a>
          </div>
        </div>

        <style>{`
          .fp-root {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
            font-family: 'Inter', sans-serif;
          }
          .fp-root.dark { background: linear-gradient(135deg, #0f0f13 0%, #1a1a24 50%, #0f0f13 100%); }
          .fp-root.light { background: linear-gradient(135deg, #f5f5f5 0%, #fafafa 50%, #f5f5f5 100%); }

          .fp-bg { position: fixed; inset: 0; pointer-events: none; }
          .fp-bg-orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(100px);
            opacity: 0.1;
          }
          .orb1 {
            width: 500px; height: 500px;
            background: radial-gradient(circle, #e8291c, transparent);
            top: -100px; left: -100px;
            animation: orbFloat 10s ease-in-out infinite alternate;
          }
          .orb2 {
            width: 400px; height: 400px;
            background: radial-gradient(circle, #f97316, transparent);
            bottom: -80px; right: -80px;
            animation: orbFloat 12s ease-in-out infinite alternate-reverse;
          }
          @keyframes orbFloat {
            from { transform: translate(0, 0); }
            to   { transform: translate(30px, 30px); }
          }
          .fp-bg-grid {
            position: absolute; inset: 0;
            background-image:
              linear-gradient(rgba(232,41,28,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(232,41,28,0.03) 1px, transparent 1px);
            background-size: 50px 50px;
          }

          .fp-container {
            position: relative;
            z-index: 10;
            padding: 20px;
            width: 100%;
            max-width: 440px;
          }

          .fp-card {
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(20px);
            border: 1.5px solid rgba(232, 41, 28, 0.15);
            border-radius: 24px;
            padding: 48px 36px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
            animation: cardIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          }
          .fp-root.dark .fp-card {
            background: rgba(28, 28, 36, 0.95);
            border-color: rgba(232, 41, 28, 0.2);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
          }
          @keyframes cardIn {
            from { opacity: 0; transform: translateY(30px) scale(0.96); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }

          .fp-success-icon {
            position: relative;
            width: 100px; height: 100px;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 20px;
          }
          .fp-success-ring {
            position: absolute;
            border-radius: 50%;
            border: 1.5px solid rgba(16, 185, 129, 0.3);
            animation: ringPulse 2.5s ease-out infinite;
          }
          .ring1 { inset: 0; animation-delay: 0s; }
          .ring2 { inset: -12px; animation-delay: 0.5s; }
          .ring3 { inset: -24px; animation-delay: 1s; }
          @keyframes ringPulse {
            0%   { transform: scale(0.9); opacity: 0.6; }
            100% { transform: scale(1.2); opacity: 0; }
          }
          .fp-check-wrap {
            width: 64px; height: 64px;
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

          .fp-stamp {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 5px 14px;
            background: rgba(16, 185, 129, 0.1);
            border: 1.5px solid rgba(16, 185, 129, 0.2);
            border-radius: 40px;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.15em;
            color: #10b981;
            margin-bottom: 20px;
            animation: stampIn 0.4s ease 0.6s both;
          }
          @keyframes stampIn {
            from { opacity: 0; transform: scale(0.8); }
            to   { opacity: 1; transform: scale(1); }
          }

          .fp-title {
            font-family: 'Barlow Condensed', sans-serif;
            font-size: 32px;
            font-weight: 800;
            color: #1a1a1a;
            margin: 0 0 12px;
            letter-spacing: -0.02em;
          }
          .fp-root.dark .fp-title { color: #f0f0f5; }

          .fp-sub {
            font-size: 14px;
            color: #6b7280;
            line-height: 1.6;
            margin: 0 0 24px;
          }
          .fp-root.dark .fp-sub { color: #a0a0b0; }

          .fp-highlight {
            color: #e8291c;
            font-weight: 700;
          }

          .fp-info-box {
            background: #f9fafb;
            border: 1.5px solid #e5e7eb;
            border-radius: 14px;
            padding: 16px;
            margin-bottom: 24px;
            text-align: left;
          }
          .fp-root.dark .fp-info-box {
            background: rgba(255, 255, 255, 0.03);
            border-color: rgba(255, 255, 255, 0.08);
          }
          .fp-info-row {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 13px;
            color: #6b7280;
            padding: 6px 0;
          }
          .fp-info-row:first-child { border-bottom: 1px solid #e5e7eb; padding-top: 0; }
          .fp-info-row:last-child { padding-bottom: 0; }
          .fp-root.dark .fp-info-row { color: #a0a0b0; }
          .fp-root.dark .fp-info-row:first-child { border-color: rgba(255, 255, 255, 0.08); }

          .fp-link-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 24px;
            background: linear-gradient(135deg, #e8291c, #c2200f);
            border: none;
            border-radius: 12px;
            color: #fff;
            font-size: 14px;
            font-weight: 700;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.25s;
            box-shadow: 0 4px 16px rgba(232, 41, 28, 0.25);
          }
          .fp-link-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(232, 41, 28, 0.35);
          }
        `}</style>
      </div>
    );
  }

  // ── MAIN FORM ──
  return (
    <div className={`fp-root ${isDark ? "dark" : "light"}`}>
      <div className="fp-bg">
        <div className="fp-bg-orb orb1" />
        <div className="fp-bg-orb orb2" />
        <div className="fp-bg-grid" />
      </div>

      <div className="fp-container">
        <div className="fp-card">
          {/* Logo */}
          <div className="fp-logo">
            <div className="fp-logo-icon">
              <Zap size={24} strokeWidth={2.5} color="#fff" />
            </div>
            <div>
              <h1 className="fp-logo-text">EcoMod</h1>
              <span className="fp-logo-sub">Recuperación de cuenta</span>
            </div>
          </div>

          <div className="fp-header">
            <h2 className="fp-form-title">¿Olvidaste tu contraseña?</h2>
            <p className="fp-form-sub">
              No te preocupes, te enviaremos un enlace seguro para restablecerla
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="fp-error">
              <AlertCircle size={16} strokeWidth={2.5} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="fp-input-group">
              <label className="fp-label">Correo electrónico</label>
              <div
                className={`fp-input-wrap ${focusedField === "email" ? "focused" : ""}`}
              >
                <Mail size={16} strokeWidth={2} />
                <input
                  type="email"
                  placeholder="tucorreo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  required
                />
              </div>
              <span className="fp-hint">
                Ingresa el correo asociado a tu cuenta
              </span>
            </div>

            <button type="submit" disabled={loading} className="fp-submit-btn">
              {loading ? (
                <span className="fp-spinner" />
              ) : (
                <>
                  <span>Enviar enlace de recuperación</span>
                  <Sparkles size={16} strokeWidth={2} />
                </>
              )}
            </button>
          </form>

          <div className="fp-footer">
            <a href="/login" className="fp-back-link">
              <ArrowLeft size={14} strokeWidth={2.5} />
              Volver al inicio de sesión
            </a>

            <div className="fp-security">
              <Shield size={12} strokeWidth={2} />
              <span>Enlace seguro · Expira en 24h</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Barlow+Condensed:wght@400;600;700;800&display=swap');

        .fp-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }
        .fp-root.dark { background: linear-gradient(135deg, #0f0f13 0%, #1a1a24 50%, #0f0f13 100%); }
        .fp-root.light { background: linear-gradient(135deg, #f5f5f5 0%, #fafafa 50%, #f5f5f5 100%); }

        .fp-bg { position: fixed; inset: 0; pointer-events: none; }
        .fp-bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.1;
        }
        .orb1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #e8291c, transparent);
          top: -100px; left: -100px;
          animation: orbFloat 10s ease-in-out infinite alternate;
        }
        .orb2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, #f97316, transparent);
          bottom: -80px; right: -80px;
          animation: orbFloat 12s ease-in-out infinite alternate-reverse;
        }
        @keyframes orbFloat {
          from { transform: translate(0, 0); }
          to   { transform: translate(30px, 30px); }
        }
        .fp-bg-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(232,41,28,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232,41,28,0.03) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        .fp-container {
          position: relative;
          z-index: 10;
          padding: 20px;
          width: 100%;
          max-width: 440px;
          animation: slideUp 0.5s ease both;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .fp-card {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          border: 1.5px solid rgba(232, 41, 28, 0.12);
          border-radius: 24px;
          padding: 40px 36px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
        }
        .fp-root.dark .fp-card {
          background: rgba(28, 28, 36, 0.95);
          border-color: rgba(232, 41, 28, 0.18);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        }

        /* Logo */
        .fp-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          margin-bottom: 32px;
        }
        .fp-logo-icon {
          width: 48px; height: 48px;
          background: linear-gradient(135deg, #e8291c, #f97316);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 16px rgba(232, 41, 28, 0.3);
        }
        .fp-logo-text {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #1a1a1a;
          line-height: 1;
          letter-spacing: -0.02em;
        }
        .fp-root.dark .fp-logo-text { color: #f0f0f5; }
        .fp-logo-sub {
          font-size: 12px;
          color: #9ca3af;
          font-weight: 500;
        }
        .fp-root.dark .fp-logo-sub { color: #6b6b80; }

        /* Header */
        .fp-header { text-align: center; margin-bottom: 28px; }
        .fp-form-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 26px;
          font-weight: 800;
          color: #1a1a1a;
          margin: 0 0 8px;
          letter-spacing: -0.01em;
        }
        .fp-root.dark .fp-form-title { color: #f0f0f5; }
        .fp-form-sub {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.5;
          margin: 0;
        }
        .fp-root.dark .fp-form-sub { color: #a0a0b0; }

        /* Error */
        .fp-error {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(220, 38, 38, 0.08);
          border: 1.5px solid rgba(220, 38, 38, 0.2);
          border-radius: 12px;
          color: #dc2626;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 20px;
          animation: shake 0.4s ease-in-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }

        /* Input */
        .fp-input-group { margin-bottom: 24px; }
        .fp-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #4b5563;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }
        .fp-root.dark .fp-label { color: #a0a0b0; }
        .fp-input-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: #f9fafb;
          border: 1.5px solid #e5e7eb;
          border-radius: 14px;
          transition: all 0.2s;
        }
        .fp-root.dark .fp-input-wrap {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.08);
        }
        .fp-input-wrap.focused {
          border-color: #e8291c;
          box-shadow: 0 0 0 4px rgba(232, 41, 28, 0.1);
          background: #fff;
        }
        .fp-root.dark .fp-input-wrap.focused {
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 0 0 4px rgba(232, 41, 28, 0.15);
        }
        .fp-input-wrap svg { color: #9ca3af; flex-shrink: 0; }
        .fp-input-wrap.focused svg { color: #e8291c; }
        .fp-input-wrap input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          color: #1a1a1a;
        }
        .fp-root.dark .fp-input-wrap input { color: #f0f0f5; }
        .fp-input-wrap input::placeholder { color: #9ca3af; }
        .fp-hint {
          display: block;
          font-size: 12px;
          color: #9ca3af;
          margin-top: 8px;
          font-weight: 500;
        }

        /* Submit */
        .fp-submit-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px;
          background: linear-gradient(135deg, #e8291c, #c2200f);
          border: none;
          border-radius: 14px;
          color: #fff;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s;
          box-shadow: 0 4px 16px rgba(232, 41, 28, 0.25);
          margin-top: 8px;
        }
        .fp-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(232, 41, 28, 0.35);
        }
        .fp-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .fp-spinner {
          width: 20px; height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Footer */
        .fp-footer {
          margin-top: 28px;
          padding-top: 24px;
          border-top: 1.5px solid #e5e7eb;
          text-align: center;
        }
        .fp-root.dark .fp-footer { border-color: rgba(255, 255, 255, 0.08); }
        .fp-back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #6b7280;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
          margin-bottom: 16px;
        }
        .fp-back-link:hover { color: #e8291c; gap: 12px; }
        .fp-security {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11px;
          color: #9ca3af;
          font-weight: 500;
        }
        .fp-root.dark .fp-security { color: #6b6b80; }

        @media (max-width: 480px) {
          .fp-card { padding: 32px 24px; }
          .fp-logo-text { font-size: 24px; }
          .fp-form-title { font-size: 22px; }
        }
      `}</style>
    </div>
  );
}
