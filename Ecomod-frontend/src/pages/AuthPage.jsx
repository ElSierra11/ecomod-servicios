import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/api";
import { useTheme } from "../hooks/useTheme";
import EcoModLogo from "../components/EcoModLogo";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Shield,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Fingerprint,
  Key,
  Send,
  ArrowLeft,
  ShoppingBag,
  Package,
  CreditCard,
  Bell,
} from "lucide-react";

export default function AuthPage() {
  const { login } = useAuth();
  const { theme, toggle } = useTheme();
  const [tab, setTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    nombre: "",
    apellido: "",
  });
  const [resetForm, setResetForm] = useState({
    token: "",
    new_password: "",
    confirm: "",
  });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const setFormField = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const setResetField = (k) => (e) =>
    setResetForm((f) => ({ ...f, [k]: e.target.value }));

  const switchTab = (t) => {
    setTab(t);
    setMsg(null);
    setForm({ email: "", password: "", nombre: "", apellido: "" });
  };

  // Calcular fuerza de contraseña
  useEffect(() => {
    const password = form.password;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    setPasswordStrength(strength);
  }, [form.password]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (form.password.length < 8) {
      setMsg({
        type: "error",
        text: "La contraseña debe tener al menos 8 caracteres",
      });
      return;
    }
    setLoading(true);
    try {
      await authApi.register({
        email: form.email,
        password: form.password,
        nombre: form.nombre,
        apellido: form.apellido,
      });
      setMsg({
        type: "success",
        text: "✓ Cuenta creada exitosamente. Ahora inicia sesión.",
      });
      setTimeout(() => switchTab("login"), 1500);
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      setMsg({ type: "success", text: "📧 " + data.message });
      setTimeout(() => switchTab("reset"), 2000);
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (resetForm.new_password !== resetForm.confirm) {
      setMsg({ type: "error", text: "Las contraseñas no coinciden" });
      return;
    }
    if (resetForm.new_password.length < 8) {
      setMsg({
        type: "error",
        text: "La contraseña debe tener al menos 8 caracteres",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: resetForm.token,
          new_password: resetForm.new_password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al restablecer");
      setMsg({ type: "success", text: "✓ " + data.message });
      setTimeout(() => switchTab("login"), 2000);
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthText = () => {
    const strengths = ["Muy débil", "Débil", "Media", "Fuerte", "Muy fuerte"];
    const colors = ["#ff6b6b", "#ffa502", "#ffd32a", "#7cfc6e", "#00ff88"];
    return {
      text: strengths[passwordStrength],
      color: colors[passwordStrength],
    };
  };

  const features = [
    { icon: Shield, text: "Auth Service — JWT + bcrypt", color: "#00ff88" },
    {
      icon: ShoppingBag,
      text: "Catalog Service — Productos & categorías",
      color: "#00d4ff",
    },
    {
      icon: Package,
      text: "Inventory Service — Stock en tiempo real",
      color: "#ff6b6b",
    },
    {
      icon: CreditCard,
      text: "Payment Service — Stripe integrado",
      color: "#34d399",
    },
    {
      icon: Bell,
      text: "Notification Service — Emails automáticos",
      color: "#f472b6",
    },
  ];

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

      {/* Theme Toggle */}
      <button className="auth-theme-toggle" onClick={toggle}>
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      <div className="auth-container">
        {/* Panel Izquierdo - Hero */}
        <div className="auth-hero">
          <div className="auth-hero-content">
            <div className="auth-logo-wrapper">
              <EcoModLogo />
            </div>

            <div className="auth-hero-badge">
              <Sparkles size={12} />
              <span>MICROSERVICES ARCHITECTURE</span>
            </div>

            <h1 className="auth-hero-title">
              Comercio Moderno
              <span>Escalable y Distribuido</span>
            </h1>

            <p className="auth-hero-description">
              Plataforma de comercio electrónico construida con microservicios,
              lista para escalar con tu negocio.
            </p>

            <div className="auth-features">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div key={idx} className="auth-feature">
                    <div
                      className="auth-feature-icon"
                      style={{ color: feature.color }}
                    >
                      <Icon size={16} />
                    </div>
                    <span>{feature.text}</span>
                  </div>
                );
              })}
            </div>

            <div className="auth-stats">
              <div className="auth-stat">
                <div className="auth-stat-value">8</div>
                <div className="auth-stat-label">Microservicios</div>
              </div>
              <div className="auth-stat-divider"></div>
              <div className="auth-stat">
                <div className="auth-stat-value">99.9%</div>
                <div className="auth-stat-label">Uptime</div>
              </div>
              <div className="auth-stat-divider"></div>
              <div className="auth-stat">
                <div className="auth-stat-value">&lt;50ms</div>
                <div className="auth-stat-label">Latencia</div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho - Forms */}
        <div className="auth-form-panel">
          <div className="auth-form-container">
            {/* Tabs */}
            {(tab === "login" || tab === "register") && (
              <div className="auth-tabs-modern">
                <button
                  className={`auth-tab-modern ${tab === "login" ? "active" : ""}`}
                  onClick={() => switchTab("login")}
                >
                  <Lock size={14} />
                  <span>Iniciar Sesión</span>
                </button>
                <button
                  className={`auth-tab-modern ${tab === "register" ? "active" : ""}`}
                  onClick={() => switchTab("register")}
                >
                  <User size={14} />
                  <span>Crear Cuenta</span>
                </button>
              </div>
            )}

            {/* Alert Messages */}
            {msg && (
              <div className={`auth-alert ${msg.type}`}>
                {msg.type === "success" ? (
                  <CheckCircle size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                <span>{msg.text}</span>
              </div>
            )}

            {/* Login Form */}
            {tab === "login" && (
              <form onSubmit={handleLogin} className="auth-form">
                <div className="auth-form-header">
                  <h2>Bienvenido de vuelta</h2>
                  <p>Ingresa tus credenciales para continuar</p>
                </div>

                <div className="auth-input-group">
                  <div
                    className={`auth-input-field ${focusedField === "email" ? "focused" : ""}`}
                  >
                    <Mail size={18} />
                    <input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={form.email}
                      onChange={setFormField("email")}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      required
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <div
                    className={`auth-input-field ${focusedField === "password" ? "focused" : ""}`}
                  >
                    <Lock size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Contraseña"
                      value={form.password}
                      onChange={setFormField("password")}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      required
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="auth-form-options">
                  <label className="auth-checkbox">
                    <input type="checkbox" />
                    <span>Recordarme</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => switchTab("forgot")}
                    className="auth-forgot-link"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="auth-spinner"></div>
                  ) : (
                    <>
                      <span>Entrar</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Register Form */}
            {tab === "register" && (
              <form onSubmit={handleRegister} className="auth-form">
                <div className="auth-form-header">
                  <h2>Crear una cuenta</h2>
                  <p>Regístrate para acceder a la plataforma</p>
                </div>

                <div className="auth-name-row">
                  <div className="auth-input-group">
                    <div
                      className={`auth-input-field ${focusedField === "nombre" ? "focused" : ""}`}
                    >
                      <User size={18} />
                      <input
                        type="text"
                        placeholder="Nombre"
                        value={form.nombre}
                        onChange={setFormField("nombre")}
                        onFocus={() => setFocusedField("nombre")}
                        onBlur={() => setFocusedField(null)}
                      />
                    </div>
                  </div>
                  <div className="auth-input-group">
                    <div
                      className={`auth-input-field ${focusedField === "apellido" ? "focused" : ""}`}
                    >
                      <User size={18} />
                      <input
                        type="text"
                        placeholder="Apellido"
                        value={form.apellido}
                        onChange={setFormField("apellido")}
                        onFocus={() => setFocusedField("apellido")}
                        onBlur={() => setFocusedField(null)}
                      />
                    </div>
                  </div>
                </div>

                <div className="auth-input-group">
                  <div
                    className={`auth-input-field ${focusedField === "email_reg" ? "focused" : ""}`}
                  >
                    <Mail size={18} />
                    <input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={form.email}
                      onChange={setFormField("email")}
                      onFocus={() => setFocusedField("email_reg")}
                      onBlur={() => setFocusedField(null)}
                      required
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <div
                    className={`auth-input-field ${focusedField === "password_reg" ? "focused" : ""}`}
                  >
                    <Lock size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Contraseña"
                      value={form.password}
                      onChange={setFormField("password")}
                      onFocus={() => setFocusedField("password_reg")}
                      onBlur={() => setFocusedField(null)}
                      required
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="auth-password-strength">
                      <div className="auth-strength-bar">
                        <div
                          className="auth-strength-fill"
                          style={{
                            width: `${(passwordStrength / 4) * 100}%`,
                            background: getPasswordStrengthText().color,
                          }}
                        />
                      </div>
                      <span style={{ color: getPasswordStrengthText().color }}>
                        {getPasswordStrengthText().text}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="auth-spinner"></div>
                  ) : (
                    <>
                      <span>Crear cuenta</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <p className="auth-terms">
                  Al registrarte, aceptas nuestros{" "}
                  <a href="#">Términos de servicio</a> y{" "}
                  <a href="#">Política de privacidad</a>
                </p>
              </form>
            )}

            {/* Forgot Password Form */}
            {tab === "forgot" && (
              <form onSubmit={handleForgot} className="auth-form">
                <button
                  type="button"
                  onClick={() => switchTab("login")}
                  className="auth-back-btn"
                >
                  <ArrowLeft size={16} />
                  <span>Volver al login</span>
                </button>

                <div className="auth-form-header">
                  <h2>¿Olvidaste tu contraseña?</h2>
                  <p>
                    Ingresa tu email y te enviaremos un enlace para
                    restablecerla
                  </p>
                </div>

                <div className="auth-input-group">
                  <div
                    className={`auth-input-field ${focusedField === "email_forgot" ? "focused" : ""}`}
                  >
                    <Mail size={18} />
                    <input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={form.email}
                      onChange={setFormField("email")}
                      onFocus={() => setFocusedField("email_forgot")}
                      onBlur={() => setFocusedField(null)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="auth-spinner"></div>
                  ) : (
                    <>
                      <span>Enviar enlace</span>
                      <Send size={16} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => switchTab("reset")}
                  className="auth-reset-link"
                >
                  ¿Ya tienes un código? Restablecer contraseña
                </button>
              </form>
            )}

            {/* Reset Password Form */}
            {tab === "reset" && (
              <form onSubmit={handleReset} className="auth-form">
                <button
                  type="button"
                  onClick={() => switchTab("forgot")}
                  className="auth-back-btn"
                >
                  <ArrowLeft size={16} />
                  <span>Volver</span>
                </button>

                <div className="auth-form-header">
                  <h2>Nueva contraseña</h2>
                  <p>Ingresa el token que recibiste y tu nueva contraseña</p>
                </div>

                <div className="auth-input-group">
                  <div
                    className={`auth-input-field ${focusedField === "token" ? "focused" : ""}`}
                  >
                    <Key size={18} />
                    <input
                      type="text"
                      placeholder="Token del email"
                      value={resetForm.token}
                      onChange={setResetField("token")}
                      onFocus={() => setFocusedField("token")}
                      onBlur={() => setFocusedField(null)}
                      required
                      style={{ fontFamily: "monospace" }}
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <div
                    className={`auth-input-field ${focusedField === "new_password" ? "focused" : ""}`}
                  >
                    <Lock size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Nueva contraseña"
                      value={resetForm.new_password}
                      onChange={setResetField("new_password")}
                      onFocus={() => setFocusedField("new_password")}
                      onBlur={() => setFocusedField(null)}
                      required
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="auth-input-group">
                  <div
                    className={`auth-input-field ${focusedField === "confirm" ? "focused" : ""}`}
                  >
                    <Lock size={18} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirmar contraseña"
                      value={resetForm.confirm}
                      onChange={setResetField("confirm")}
                      onFocus={() => setFocusedField("confirm")}
                      onBlur={() => setFocusedField(null)}
                      required
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="auth-spinner"></div>
                  ) : (
                    <>
                      <span>Restablecer contraseña</span>
                      <Fingerprint size={16} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-modern {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
        }

        /* FONDOS */
        .auth-bg {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 0;
        }

        .auth-modern.dark .auth-bg {
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 100%);
        }

        .auth-modern.light .auth-bg {
          background: linear-gradient(135deg, #f5f7fa 0%, #eef2f7 100%);
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

        .auth-particles {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
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

        .auth-theme-toggle {
          position: fixed;
          top: 24px;
          right: 24px;
          width: 44px;
          height: 44px;
          border-radius: 22px;
          background: rgba(0, 255, 136, 0.1);
          border: 1px solid rgba(0, 255, 136, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 20px;
          transition: all 0.3s;
          z-index: 100;
          backdrop-filter: blur(10px);
        }

        .auth-theme-toggle:hover {
          transform: scale(1.05);
          background: rgba(0, 255, 136, 0.2);
        }

        .auth-container {
          position: relative;
          z-index: 1;
          display: flex;
          min-height: 100vh;
        }

        .auth-hero {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
        }

        .auth-hero-content {
          max-width: 500px;
        }

        .auth-logo-wrapper {
          margin-bottom: 32px;
        }

        .auth-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: rgba(0, 255, 136, 0.1);
          border: 1px solid rgba(0, 255, 136, 0.2);
          border-radius: 40px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #00ff88;
          margin-bottom: 24px;
        }

        .auth-hero-title {
          font-size: 42px;
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 16px;
        }

        .auth-modern.dark .auth-hero-title {
          background: linear-gradient(135deg, #fff, #00ff88);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .auth-modern.light .auth-hero-title {
          background: linear-gradient(135deg, #1a1a2e, #00b894);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .auth-hero-title span {
          display: block;
          font-size: 24px;
          opacity: 0.7;
          -webkit-text-fill-color: unset;
          background: none;
        }

        .auth-hero-description {
          color: rgba(255, 255, 255, 0.6);
          font-size: 15px;
          line-height: 1.6;
          margin-bottom: 32px;
        }

        .auth-modern.light .auth-hero-description {
          color: #6c757d;
        }

        .auth-features {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 40px;
        }

        .auth-feature {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
        }

        .auth-modern.dark .auth-feature {
          color: rgba(255, 255, 255, 0.7);
        }

        .auth-modern.light .auth-feature {
          color: #495057;
        }

        .auth-feature-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 255, 136, 0.1);
        }

        .auth-stats {
          display: flex;
          align-items: center;
          gap: 24px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .auth-modern.light .auth-stats {
          border-top-color: rgba(0, 0, 0, 0.1);
        }

        .auth-stat {
          text-align: center;
        }

        .auth-stat-value {
          font-size: 24px;
          font-weight: 800;
          color: #00ff88;
        }

        .auth-modern.light .auth-stat-value {
          color: #00b894;
        }

        .auth-stat-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .auth-modern.light .auth-stat-label {
          color: #6c757d;
        }

        .auth-stat-divider {
          width: 1px;
          height: 30px;
          background: rgba(255, 255, 255, 0.1);
        }

        .auth-modern.light .auth-stat-divider {
          background: rgba(0, 0, 0, 0.1);
        }

        .auth-form-panel {
          width: 520px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
        }

        .auth-modern.dark .auth-form-panel {
          background: rgba(18, 18, 28, 0.8);
          backdrop-filter: blur(20px);
          border-left: 1px solid rgba(0, 255, 136, 0.15);
        }

        .auth-modern.light .auth-form-panel {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-left: 1px solid rgba(0, 184, 148, 0.15);
        }

        .auth-form-container {
          width: 100%;
          max-width: 380px;
        }

        .auth-tabs-modern {
          display: flex;
          gap: 8px;
          background: rgba(0, 0, 0, 0.3);
          padding: 4px;
          border-radius: 60px;
          margin-bottom: 32px;
        }

        .auth-modern.light .auth-tabs-modern {
          background: #f8f9fa;
        }

        .auth-tab-modern {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 20px;
          background: transparent;
          border: none;
          border-radius: 40px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          color: rgba(255, 255, 255, 0.6);
        }

        .auth-modern.light .auth-tab-modern {
          color: #6c757d;
        }

        .auth-tab-modern.active {
          background: rgba(0, 255, 136, 0.15);
          color: #00ff88;
        }

        .auth-modern.light .auth-tab-modern.active {
          background: rgba(0, 184, 148, 0.1);
          color: #00b894;
        }

        .auth-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
          margin-bottom: 24px;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .auth-alert.success {
          background: rgba(0, 255, 136, 0.1);
          border: 1px solid rgba(0, 255, 136, 0.2);
          color: #00ff88;
        }

        .auth-alert.error {
          background: rgba(255, 107, 107, 0.1);
          border: 1px solid rgba(255, 107, 107, 0.2);
          color: #ff6b6b;
        }

        .auth-modern.light .auth-alert.success {
          background: rgba(0, 184, 148, 0.1);
          color: #00b894;
        }

        .auth-form {
          animation: fadeIn 0.4s ease;
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

        .auth-form-header {
          margin-bottom: 28px;
        }

        .auth-form-header h2 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .auth-form-header p {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
        }

        .auth-modern.light .auth-form-header p {
          color: #6c757d;
        }

        .auth-input-group {
          margin-bottom: 20px;
        }

        .auth-input-field {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          transition: all 0.3s;
        }

        .auth-modern.light .auth-input-field {
          background: #f8f9fa;
          border-color: #e9ecef;
        }

        .auth-input-field.focused {
          border-color: #00ff88;
          box-shadow: 0 0 0 3px rgba(0, 255, 136, 0.1);
        }

        .auth-modern.light .auth-input-field.focused {
          border-color: #00b894;
          box-shadow: 0 0 0 3px rgba(0, 184, 148, 0.1);
        }

        .auth-input-field svg {
          color: rgba(255, 255, 255, 0.4);
        }

        .auth-modern.light .auth-input-field svg {
          color: #adb5bd;
        }

        .auth-input-field input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 14px;
          color: inherit;
        }

        .auth-input-field input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .auth-modern.light .auth-input-field input::placeholder {
          color: #adb5bd;
        }

        .auth-password-toggle {
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.4);
          display: flex;
          align-items: center;
          padding: 0;
        }

        .auth-name-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .auth-password-strength {
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .auth-strength-bar {
          flex: 1;
          height: 3px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .auth-strength-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s;
        }

        .auth-form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .auth-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          cursor: pointer;
        }

        .auth-checkbox input {
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: #00ff88;
        }

        .auth-forgot-link {
          background: none;
          border: none;
          font-size: 12px;
          color: #00ff88;
          cursor: pointer;
          transition: opacity 0.3s;
        }

        .auth-modern.light .auth-forgot-link {
          color: #00b894;
        }

        .auth-forgot-link:hover {
          opacity: 0.7;
        }

        .auth-submit-btn {
          width: 100%;
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
          margin-bottom: 20px;
        }

        .auth-modern.light .auth-submit-btn {
          background: linear-gradient(135deg, #00b894, #0984e3);
          color: #fff;
        }

        .auth-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 255, 136, 0.3);
        }

        .auth-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .auth-spinner {
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

        .auth-terms {
          text-align: center;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 20px;
        }

        .auth-modern.light .auth-terms {
          color: #6c757d;
        }

        .auth-terms a {
          color: #00ff88;
          text-decoration: none;
        }

        .auth-modern.light .auth-terms a {
          color: #00b894;
        }

        .auth-back-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
          cursor: pointer;
          margin-bottom: 20px;
          transition: color 0.3s;
        }

        .auth-back-btn:hover {
          color: #00ff88;
        }

        .auth-reset-link {
          width: 100%;
          background: none;
          border: none;
          font-size: 12px;
          color: #00ff88;
          cursor: pointer;
          text-align: center;
          margin-top: 16px;
          transition: opacity 0.3s;
        }

        .auth-reset-link:hover {
          opacity: 0.7;
        }

        @media (max-width: 968px) {
          .auth-hero {
            display: none;
          }
          .auth-form-panel {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .auth-form-panel {
            padding: 24px;
          }
          .auth-name-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
