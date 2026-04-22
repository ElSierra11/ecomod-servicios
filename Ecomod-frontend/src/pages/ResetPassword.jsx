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
} from "lucide-react";

export default function ResetPassword() {
  const { theme } = useTheme();
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
      setError("Token no válido o expirado");
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

  const getStrengthText = () => {
    const texts = ["Muy débil", "Débil", "Media", "Fuerte", "Muy fuerte"];
    const colors = ["#ff6b6b", "#ffa502", "#ffd32a", "#7cfc6e", "#00ff88"];
    return { text: texts[passwordStrength], color: colors[passwordStrength] };
  };

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
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.message || "Error al restablecer la contraseña");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`auth-modern ${theme === "dark" ? "dark" : "light"}`}>
        <div className="auth-bg">
          <div className="auth-grid"></div>
          <div className="auth-gradient"></div>
        </div>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="glass-card text-center max-w-md w-full animate-fadeIn">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold mb-3">
              ¡Contraseña actualizada!
            </h2>
            <p className="text-white/60 mb-6">
              Tu contraseña ha sido restablecida exitosamente.
            </p>
            <div className="text-white/40 text-sm">
              Redirigiendo al inicio de sesión...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`auth-modern ${theme === "dark" ? "dark" : "light"}`}>
      <div className="auth-bg">
        <div className="auth-grid"></div>
        <div className="auth-gradient"></div>
        <div className="auth-particles">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full animate-slideUp">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 rounded-2xl mb-4">
              <Shield size={32} className="text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              EcoMod
            </h1>
            <p className="text-white/50 text-sm mt-1">Restablecer contraseña</p>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-bold">Nueva contraseña</h2>
            <p className="text-white/50 text-sm mt-2">
              Ingresa tu nueva contraseña
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm flex items-center gap-2 animate-shake">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="input-group">
              <div
                className={`input-field ${focusedField === "token" ? "focused" : ""}`}
              >
                <Lock size={18} />
                <input
                  type="text"
                  placeholder="Token del email"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  onFocus={() => setFocusedField("token")}
                  onBlur={() => setFocusedField(null)}
                  className="font-mono"
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <div
                className={`input-field ${focusedField === "password" ? "focused" : ""}`}
              >
                <Lock size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {newPassword && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div
                      className="strength-fill"
                      style={{
                        width: `${(passwordStrength / 4) * 100}%`,
                        background: getStrengthText().color,
                      }}
                    />
                  </div>
                  <span style={{ color: getStrengthText().color }}>
                    {getStrengthText().text}
                  </span>
                </div>
              )}
            </div>

            <div className="input-group">
              <div
                className={`input-field ${focusedField === "confirm" ? "focused" : ""}`}
              >
                <Lock size={18} />
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField("confirm")}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="submit-btn w-full"
            >
              {loading ? (
                <div className="spinner"></div>
              ) : (
                <>
                  <span>Restablecer contraseña</span>
                  <Zap size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/login"
              className="text-white/40 hover:text-white text-sm flex items-center justify-center gap-1 transition-colors"
            >
              <ArrowLeft size={14} />
              Volver al inicio de sesión
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-modern {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
        }

        .auth-modern.dark {
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 100%);
        }

        .auth-modern.light {
          background: linear-gradient(135deg, #f5f7fa 0%, #eef2f7 100%);
        }

        .auth-bg {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 0;
        }

        .auth-grid {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image:
            linear-gradient(rgba(0, 255, 136, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 136, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: gridMove 20s linear infinite;
        }

        @keyframes gridMove {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }

        .auth-gradient {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(
            circle at 50% 50%,
            rgba(0, 255, 136, 0.08),
            transparent 50%
          );
          animation: gradientRotate 30s ease infinite;
        }

        @keyframes gradientRotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: rgba(0, 255, 136, 0.3);
          border-radius: 50%;
          animation: floatParticle linear infinite;
        }

        @keyframes floatParticle {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            transform: translateY(-100px) translateX(20px);
            opacity: 0;
          }
        }

        .glass-card {
          position: relative;
          z-index: 1;
          background: rgba(18, 18, 28, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 255, 136, 0.15);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .auth-modern.light .glass-card {
          background: rgba(255, 255, 255, 0.95);
          border-color: rgba(0, 184, 148, 0.15);
        }

        .input-field {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          transition: all 0.3s;
        }

        .auth-modern.light .input-field {
          background: #f8f9fa;
          border-color: #e9ecef;
        }

        .input-field.focused {
          border-color: #00ff88;
          box-shadow: 0 0 0 3px rgba(0, 255, 136, 0.1);
        }

        .input-field input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 14px;
          color: inherit;
        }

        .password-toggle {
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.4);
          display: flex;
          align-items: center;
          padding: 0;
        }

        .password-strength {
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .strength-bar {
          flex: 1;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .strength-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s;
        }

        .submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 24px;
          background: linear-gradient(135deg, #00ff88, #00d4ff);
          border: none;
          border-radius: 40px;
          font-size: 14px;
          font-weight: 600;
          color: #000;
          cursor: pointer;
          transition: all 0.3s;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 255, 136, 0.3);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(0, 0, 0, 0.3);
          border-top-color: #000;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }
      `}</style>
    </div>
  );
}
