import { useState } from "react";
import { authApi } from "../services/api";
import { useTheme } from "../hooks/useTheme";
import {
  Mail,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Shield,
  Zap,
} from "lucide-react";

export default function ForgotPassword() {
  const { theme } = useTheme();
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
      setError(err.message || "Error al enviar el correo");
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
            <h2 className="text-2xl font-bold mb-3">¡Revisa tu correo!</h2>
            <p className="text-white/60 mb-6">
              Hemos enviado un enlace de recuperación a{" "}
              <strong className="text-emerald-400">{email}</strong>
            </p>
            <a
              href="/login"
              className="inline-flex items-center gap-2 text-emerald-400 hover:underline"
            >
              <ArrowLeft size={16} />
              Volver al inicio de sesión
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`auth-modern ${theme === "dark" ? "dark" : "light"}`}>
      {/* Fondo animado */}
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
              <Zap size={32} className="text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              EcoMod
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Recuperación de contraseña
            </p>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-bold">¿Olvidaste tu contraseña?</h2>
            <p className="text-white/50 text-sm mt-2">
              Ingresa tu correo y te enviaremos un enlace para restablecerla
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm flex items-center gap-2 animate-shake">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="input-group">
              <div
                className={`input-field ${focusedField === "email" ? "focused" : ""}`}
              >
                <Mail size={18} />
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="submit-btn w-full"
            >
              {loading ? (
                <div className="spinner"></div>
              ) : (
                <>
                  <span>Enviar enlace de recuperación</span>
                  <Sparkles size={16} />
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

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-white/30 text-xs">
              ¿Problemas para recibir el correo? Verifica tu bandeja de spam o
              contacta a soporte.
            </p>
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

        .input-group {
          margin-bottom: 20px;
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

        .auth-modern.light .input-field.focused {
          border-color: #00b894;
          box-shadow: 0 0 0 3px rgba(0, 184, 148, 0.1);
        }

        .input-field svg {
          color: rgba(255, 255, 255, 0.4);
        }

        .auth-modern.light .input-field svg {
          color: #adb5bd;
        }

        .input-field input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 14px;
          color: inherit;
        }

        .input-field input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .auth-modern.light .input-field input::placeholder {
          color: #adb5bd;
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

        .auth-modern.light .submit-btn {
          background: linear-gradient(135deg, #00b894, #0984e3);
          color: #fff;
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
