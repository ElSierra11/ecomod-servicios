import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../services/api";
import { useTheme } from "../hooks/useTheme";
import {
  Lock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Shield,
  Zap,
  KeyRound,
  Fingerprint,
} from "lucide-react";

export default function ResetPassword() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError(
        "Token no válido o expirado. Solicita un nuevo enlace de recuperación.",
      );
    }
  }, [searchParams]);

  useEffect(() => {
    let strength = 0;
    if (newPassword.length >= 8) strength++;
    if (newPassword.match(/[a-z]/) && newPassword.match(/[A-Z]/)) strength++;
    if (newPassword.match(/[0-9]/)) strength++;
    if (newPassword.match(/[^a-zA-Z0-9]/)) strength++;
    setPasswordStrength(strength);
  }, [newPassword]);

  const getStrengthConfig = () => {
    const configs = [
      {
        text: "Muy débil",
        color: "#dc2626",
        bg: "rgba(220,38,38,.1)",
        width: "20%",
      },
      {
        text: "Débil",
        color: "#f97316",
        bg: "rgba(249,115,22,.1)",
        width: "40%",
      },
      {
        text: "Media",
        color: "#fbbf24",
        bg: "rgba(251,191,36,.1)",
        width: "60%",
      },
      {
        text: "Fuerte",
        color: "#10b981",
        bg: "rgba(16,185,129,.1)",
        width: "80%",
      },
      {
        text: "Muy fuerte",
        color: "#059669",
        bg: "rgba(5,150,105,.1)",
        width: "100%",
      },
    ];
    return configs[passwordStrength] || configs[0];
  };

  const strengthConfig = getStrengthConfig();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authApi.resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Error al restablecer la contraseña");
    } finally {
      setLoading(false);
    }
  };

  // ── SUCCESS STATE ──
  if (success) {
    return (
      <div className={`rp-root ${isDark ? "dark" : "light"}`}>
        <div className="rp-bg">
          <div className="rp-bg-orb orb1" />
          <div className="rp-bg-orb orb2" />
          <div className="rp-bg-grid" />
        </div>

        <div className="rp-container">
          <div className="rp-card success-card">
            {/* Success Animation */}
            <div className="rp-success-icon">
              <div className="rp-success-ring ring1" />
              <div className="rp-success-ring ring2" />
              <div className="rp-success-ring ring3" />
              <div className="rp-check-wrap">
                <CheckCircle size={40} strokeWidth={2.5} color="#10b981" />
              </div>
            </div>

            <div className="rp-stamp">
              <Shield size={12} strokeWidth={2.5} />
              <span>CONTRASEÑA ACTUALIZADA</span>
            </div>

            <h2 className="rp-title">¡Listo!</h2>
            <p className="rp-sub">
              Tu contraseña ha sido restablecida exitosamente. Ahora puedes
              iniciar sesión con tu nueva contraseña.
            </p>

            <div className="rp-countdown-box">
              <div className="rp-countdown-ring">
                <svg width="48" height="48" viewBox="0 0 48 48">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="rgba(232,41,28,.1)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="#e8291c"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={125.6}
                    strokeDashoffset={0}
                    transform="rotate(-90 24 24)"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="125.6"
                      to="0"
                      dur="3s"
                      fill="freeze"
                    />
                  </circle>
                </svg>
                <span className="rp-countdown-text">3s</span>
              </div>
              <div className="rp-countdown-info">
                <span>Redirigiendo al login</span>
                <span className="rp-countdown-sub">en unos segundos...</span>
              </div>
            </div>

            <button
              className="rp-btn-primary"
              onClick={() => navigate("/login")}
            >
              <Fingerprint size={16} strokeWidth={2.5} />
              Iniciar sesión ahora
            </button>
          </div>
        </div>

        <style>{`
          .rp-root {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
            font-family: 'Inter', sans-serif;
          }
          .rp-root.dark { background: linear-gradient(135deg, #0f0f13 0%, #1a1a24 50%, #0f0f13 100%); }
          .rp-root.light { background: linear-gradient(135deg, #f5f5f5 0%, #fafafa 50%, #f5f5f5 100%); }

          .rp-bg { position: fixed; inset: 0; pointer-events: none; }
          .rp-bg-orb {
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
          .rp-bg-grid {
            position: absolute; inset: 0;
            background-image:
              linear-gradient(rgba(232,41,28,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(232,41,28,0.03) 1px, transparent 1px);
            background-size: 50px 50px;
          }

          .rp-container {
            position: relative;
            z-index: 10;
            padding: 20px;
            width: 100%;
            max-width: 440px;
          }

          .rp-card {
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(20px);
            border: 1.5px solid rgba(16, 185, 129, 0.2);
            border-radius: 24px;
            padding: 48px 36px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
            animation: cardIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          }
          .rp-root.dark .rp-card {
            background: rgba(28, 28, 36, 0.95);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
          }
          @keyframes cardIn {
            from { opacity: 0; transform: translateY(30px) scale(0.96); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }

          .rp-success-icon {
            position: relative;
            width: 100px; height: 100px;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 20px;
          }
          .rp-success-ring {
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
          .rp-check-wrap {
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

          .rp-stamp {
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

          .rp-title {
            font-family: 'Barlow Condensed', sans-serif;
            font-size: 32px;
            font-weight: 800;
            color: #1a1a1a;
            margin: 0 0 12px;
            letter-spacing: -0.02em;
          }
          .rp-root.dark .rp-title { color: #f0f0f5; }

          .rp-sub {
            font-size: 14px;
            color: #6b7280;
            line-height: 1.6;
            margin: 0 0 24px;
          }
          .rp-root.dark .rp-sub { color: #a0a0b0; }

          .rp-countdown-box {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 16px 20px;
            background: #f9fafb;
            border: 1.5px solid #e5e7eb;
            border-radius: 16px;
            margin-bottom: 24px;
            text-align: left;
          }
          .rp-root.dark .rp-countdown-box {
            background: rgba(255, 255, 255, 0.03);
            border-color: rgba(255, 255, 255, 0.08);
          }
          .rp-countdown-ring {
            position: relative;
            width: 48px; height: 48px;
            flex-shrink: 0;
          }
          .rp-countdown-text {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 800;
            color: #e8291c;
            font-family: 'Barlow Condensed', sans-serif;
          }
          .rp-countdown-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .rp-countdown-info span:first-child {
            font-size: 14px;
            font-weight: 700;
            color: #1a1a1a;
          }
          .rp-root.dark .rp-countdown-info span:first-child { color: #f0f0f5; }
          .rp-countdown-sub {
            font-size: 12px;
            color: #9ca3af;
          }

          .rp-btn-primary {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 28px;
            background: linear-gradient(135deg, #e8291c, #c2200f);
            border: none;
            border-radius: 12px;
            color: #fff;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.25s;
            box-shadow: 0 4px 16px rgba(232, 41, 28, 0.25);
          }
          .rp-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(232, 41, 28, 0.35);
          }
        `}</style>
      </div>
    );
  }

  // ── MAIN FORM ──
  return (
    <div className={`rp-root ${isDark ? "dark" : "light"}`}>
      <div className="rp-bg">
        <div className="rp-bg-orb orb1" />
        <div className="rp-bg-orb orb2" />
        <div className="rp-bg-grid" />
      </div>

      <div className="rp-container">
        <div className="rp-card">
          {/* Logo */}
          <div className="rp-logo">
            <div className="rp-logo-icon">
              <KeyRound size={24} strokeWidth={2.5} color="#fff" />
            </div>
            <div>
              <h1 className="rp-logo-text">EcoMod</h1>
              <span className="rp-logo-sub">Restablecer contraseña</span>
            </div>
          </div>

          <div className="rp-header">
            <h2 className="rp-form-title">Nueva contraseña</h2>
            <p className="rp-form-sub">
              Crea una contraseña segura para proteger tu cuenta
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rp-error">
              <AlertCircle size={16} strokeWidth={2.5} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Token Field */}
            <div className="rp-input-group">
              <label className="rp-label">Token de recuperación</label>
              <div
                className={`rp-input-wrap ${focusedField === "token" ? "focused" : ""}`}
              >
                <Lock size={16} strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Ingresa el token del correo"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  onFocus={() => setFocusedField("token")}
                  onBlur={() => setFocusedField(null)}
                  className="rp-mono"
                  required
                />
              </div>
            </div>

            {/* New Password */}
            <div className="rp-input-group">
              <label className="rp-label">Nueva contraseña</label>
              <div
                className={`rp-input-wrap ${focusedField === "password" ? "focused" : ""}`}
              >
                <Lock size={16} strokeWidth={2} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                <button
                  type="button"
                  className="rp-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={16} strokeWidth={2} />
                  ) : (
                    <Eye size={16} strokeWidth={2} />
                  )}
                </button>
              </div>
              {/* Strength Meter */}
              {newPassword && (
                <div className="rp-strength">
                  <div className="rp-strength-bar">
                    <div
                      className="rp-strength-fill"
                      style={{
                        width: strengthConfig.width,
                        background: strengthConfig.color,
                      }}
                    />
                  </div>
                  <span
                    className="rp-strength-text"
                    style={{ color: strengthConfig.color }}
                  >
                    {strengthConfig.text}
                  </span>
                </div>
              )}
              <div className="rp-hint">
                Usa mayúsculas, minúsculas, números y símbolos para mayor
                seguridad
              </div>
            </div>

            {/* Confirm Password */}
            <div className="rp-input-group">
              <label className="rp-label">Confirmar contraseña</label>
              <div
                className={`rp-input-wrap ${focusedField === "confirm" ? "focused" : ""}`}
              >
                <Lock size={16} strokeWidth={2} />
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repite tu nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField("confirm")}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                <button
                  type="button"
                  className="rp-toggle"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? (
                    <EyeOff size={16} strokeWidth={2} />
                  ) : (
                    <Eye size={16} strokeWidth={2} />
                  )}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <span className="rp-match-error">
                  Las contraseñas no coinciden
                </span>
              )}
              {confirmPassword &&
                newPassword === confirmPassword &&
                newPassword.length >= 8 && (
                  <span className="rp-match-success">
                    <CheckCircle size={12} strokeWidth={2.5} />
                    Las contraseñas coinciden
                  </span>
                )}
            </div>

            <button
              type="submit"
              disabled={
                loading ||
                !token ||
                newPassword !== confirmPassword ||
                newPassword.length < 8
              }
              className="rp-submit-btn"
            >
              {loading ? (
                <span className="rp-spinner" />
              ) : (
                <>
                  <span>Restablecer contraseña</span>
                  <Zap size={16} strokeWidth={2} />
                </>
              )}
            </button>
          </form>

          <div className="rp-footer">
            <a href="/login" className="rp-back-link">
              <ArrowLeft size={14} strokeWidth={2.5} />
              Volver al inicio de sesión
            </a>

            <div className="rp-security">
              <Shield size={12} strokeWidth={2} />
              <span>Conexión segura · Token de un solo uso</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Barlow+Condensed:wght@400;600;700;800&display=swap');

        .rp-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }
        .rp-root.dark { background: linear-gradient(135deg, #0f0f13 0%, #1a1a24 50%, #0f0f13 100%); }
        .rp-root.light { background: linear-gradient(135deg, #f5f5f5 0%, #fafafa 50%, #f5f5f5 100%); }

        .rp-bg { position: fixed; inset: 0; pointer-events: none; }
        .rp-bg-orb {
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
        .rp-bg-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(232,41,28,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232,41,28,0.03) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        .rp-container {
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

        .rp-card {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          border: 1.5px solid rgba(232, 41, 28, 0.12);
          border-radius: 24px;
          padding: 40px 36px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
        }
        .rp-root.dark .rp-card {
          background: rgba(28, 28, 36, 0.95);
          border-color: rgba(232, 41, 28, 0.18);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        }

        /* Logo */
        .rp-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          margin-bottom: 32px;
        }
        .rp-logo-icon {
          width: 48px; height: 48px;
          background: linear-gradient(135deg, #e8291c, #f97316);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 16px rgba(232, 41, 28, 0.3);
        }
        .rp-logo-text {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #1a1a1a;
          line-height: 1;
          letter-spacing: -0.02em;
        }
        .rp-root.dark .rp-logo-text { color: #f0f0f5; }
        .rp-logo-sub {
          font-size: 12px;
          color: #9ca3af;
          font-weight: 500;
        }
        .rp-root.dark .rp-logo-sub { color: #6b6b80; }

        /* Header */
        .rp-header { text-align: center; margin-bottom: 28px; }
        .rp-form-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 26px;
          font-weight: 800;
          color: #1a1a1a;
          margin: 0 0 8px;
          letter-spacing: -0.01em;
        }
        .rp-root.dark .rp-form-title { color: #f0f0f5; }
        .rp-form-sub {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.5;
          margin: 0;
        }
        .rp-root.dark .rp-form-sub { color: #a0a0b0; }

        /* Error */
        .rp-error {
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
        .rp-input-group { margin-bottom: 20px; }
        .rp-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #4b5563;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }
        .rp-root.dark .rp-label { color: #a0a0b0; }
        .rp-input-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: #f9fafb;
          border: 1.5px solid #e5e7eb;
          border-radius: 14px;
          transition: all 0.2s;
        }
        .rp-root.dark .rp-input-wrap {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.08);
        }
        .rp-input-wrap.focused {
          border-color: #e8291c;
          box-shadow: 0 0 0 4px rgba(232, 41, 28, 0.1);
          background: #fff;
        }
        .rp-root.dark .rp-input-wrap.focused {
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 0 0 4px rgba(232, 41, 28, 0.15);
        }
        .rp-input-wrap svg { color: #9ca3af; flex-shrink: 0; }
        .rp-input-wrap.focused svg { color: #e8291c; }
        .rp-input-wrap input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          color: #1a1a1a;
        }
        .rp-root.dark .rp-input-wrap input { color: #f0f0f5; }
        .rp-input-wrap input::placeholder { color: #9ca3af; }
        .rp-mono { font-family: 'SF Mono', monospace; letter-spacing: 0.05em; }

        .rp-toggle {
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          display: flex;
          align-items: center;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.15s;
        }
        .rp-toggle:hover { color: #e8291c; background: rgba(232, 41, 28, 0.08); }

        /* Strength Meter */
        .rp-strength {
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .rp-strength-bar {
          flex: 1;
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
        }
        .rp-root.dark .rp-strength-bar { background: rgba(255, 255, 255, 0.1); }
        .rp-strength-fill {
          height: 100%;
          border-radius: 2px;
          transition: all 0.3s ease;
        }
        .rp-strength-text {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        .rp-hint {
          display: block;
          font-size: 12px;
          color: #9ca3af;
          margin-top: 8px;
          font-weight: 500;
        }

        .rp-match-error {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #dc2626;
          margin-top: 8px;
          font-weight: 600;
        }
        .rp-match-success {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #10b981;
          margin-top: 8px;
          font-weight: 600;
        }

        /* Submit */
        .rp-submit-btn {
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
        .rp-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(232, 41, 28, 0.35);
        }
        .rp-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .rp-spinner {
          width: 20px; height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Footer */
        .rp-footer {
          margin-top: 28px;
          padding-top: 24px;
          border-top: 1.5px solid #e5e7eb;
          text-align: center;
        }
        .rp-root.dark .rp-footer { border-color: rgba(255, 255, 255, 0.08); }
        .rp-back-link {
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
        .rp-back-link:hover { color: #e8291c; gap: 12px; }
        .rp-security {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11px;
          color: #9ca3af;
          font-weight: 500;
        }
        .rp-root.dark .rp-security { color: #6b6b80; }

        @media (max-width: 480px) {
          .rp-card { padding: 32px 24px; }
          .rp-logo-text { font-size: 24px; }
          .rp-form-title { font-size: 22px; }
        }
      `}</style>
    </div>
  );
}
