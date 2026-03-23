import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/api";
import { useTheme } from "../hooks/useTheme";
import EcoModLogo from "../components/EcoModLogo";

export default function AuthPage() {
  const { login } = useAuth();
  const { theme, toggle } = useTheme();
  const [tab, setTab] = useState("login");
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

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setR = (k) => (e) =>
    setResetForm((f) => ({ ...f, [k]: e.target.value }));
  const switchTab = (t) => {
    setTab(t);
    setMsg(null);
  };

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
        text: "✓ Cuenta creada. Ahora inicia sesión.",
      });
      switchTab("login");
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

  return (
    <div className="auth-page">
      <button className="auth-theme-btn" onClick={toggle}>
        {theme === "dark" ? "☀️ Tema claro" : "🌙 Tema oscuro"}
      </button>

      {/* PANEL IZQUIERDO */}
      <div className="auth-left">
        <div
          className="auth-orb"
          style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="auth-brand" style={{ width: "100%", maxWidth: 500 }}>
            <EcoModLogo />
          </div>
          <div
            style={{
              marginTop: 24,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {[
              "Auth Service — JWT + bcrypt",
              "Catalog Service — Productos & categorías",
              "Inventory Service — Stock en tiempo real",
              "Payment Service — Stripe integrado",
              "Notification Service — Emails automáticos",
            ].map((s) => (
              <div
                key={s}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 14,
                  color: "var(--text2)",
                }}
              >
                <span style={{ color: "var(--accent)", fontSize: 16 }}>◆</span>{" "}
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PANEL DERECHO */}
      <div className="auth-right">
        {(tab === "login" || tab === "register") && (
          <div className="auth-tabs">
            <button
              className={`auth-tab ${tab === "login" ? "active" : ""}`}
              onClick={() => switchTab("login")}
            >
              Iniciar sesión
            </button>
            <button
              className={`auth-tab ${tab === "register" ? "active" : ""}`}
              onClick={() => switchTab("register")}
            >
              Crear cuenta
            </button>
          </div>
        )}

        {msg && (
          <div
            className={`alert alert-${msg.type === "error" ? "error" : "success"}`}
          >
            {msg.text}
          </div>
        )}

        {tab === "login" && (
          <form onSubmit={handleLogin} className="fade-in">
            <p className="auth-title">Bienvenido</p>
            <p className="auth-sub">Ingresa tus credenciales para continuar</p>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="correo@ejemplo.com"
                value={form.email}
                onChange={set("email")}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={set("password")}
                required
              />
            </div>
            <button
              className="btn btn-primary w-full"
              style={{ justifyContent: "center", marginTop: 8 }}
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar →"}
            </button>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button
                type="button"
                onClick={() => switchTab("forgot")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--accent)",
                  fontSize: 13,
                  textDecoration: "underline",
                }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </form>
        )}

        {tab === "register" && (
          <form onSubmit={handleRegister} className="fade-in">
            <p className="auth-title">Crear cuenta</p>
            <p className="auth-sub">Regístrate para acceder a la plataforma</p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input
                  className="form-input"
                  placeholder="Juan"
                  value={form.nombre}
                  onChange={set("nombre")}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Apellido</label>
                <input
                  className="form-input"
                  placeholder="Pérez"
                  value={form.apellido}
                  onChange={set("apellido")}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="correo@ejemplo.com"
                value={form.email}
                onChange={set("email")}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Contraseña{" "}
                <span style={{ color: "var(--text3)", fontSize: 12 }}>
                  (mín. 8 caracteres)
                </span>
              </label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={set("password")}
                required
                minLength={8}
              />
            </div>
            <button
              className="btn btn-primary w-full"
              style={{ justifyContent: "center", marginTop: 8 }}
              disabled={loading}
            >
              {loading ? "Creando..." : "Crear cuenta →"}
            </button>
          </form>
        )}

        {tab === "forgot" && (
          <form onSubmit={handleForgot} className="fade-in">
            <button
              type="button"
              onClick={() => switchTab("login")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text3)",
                fontSize: 13,
                marginBottom: 16,
                padding: 0,
              }}
            >
              ← Volver al login
            </button>
            <p className="auth-title">¿Olvidaste tu contraseña?</p>
            <p className="auth-sub">
              Ingresa tu email y te enviaremos un enlace para restablecerla.
            </p>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="correo@ejemplo.com"
                value={form.email}
                onChange={set("email")}
                required
              />
            </div>
            <button
              className="btn btn-primary w-full"
              style={{ justifyContent: "center", marginTop: 8 }}
              disabled={loading}
            >
              {loading ? "Enviando..." : "Enviar enlace →"}
            </button>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button
                type="button"
                onClick={() => switchTab("reset")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text3)",
                  fontSize: 13,
                  textDecoration: "underline",
                }}
              >
                Ya tengo el código, ingresar nueva contraseña
              </button>
            </div>
          </form>
        )}

        {tab === "reset" && (
          <form onSubmit={handleReset} className="fade-in">
            <button
              type="button"
              onClick={() => switchTab("forgot")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text3)",
                fontSize: 13,
                marginBottom: 16,
                padding: 0,
              }}
            >
              ← Volver
            </button>
            <p className="auth-title">Nueva contraseña</p>
            <p className="auth-sub">
              Pega el token que llegó a tu email y escribe tu nueva contraseña.
            </p>
            <div className="form-group">
              <label className="form-label">Token del email</label>
              <input
                className="form-input"
                placeholder="Pega el token aquí"
                value={resetForm.token}
                onChange={setR("token")}
                required
                style={{ fontFamily: "monospace", fontSize: 12 }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nueva contraseña</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={resetForm.new_password}
                onChange={setR("new_password")}
                required
                minLength={8}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmar contraseña</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={resetForm.confirm}
                onChange={setR("confirm")}
                required
                minLength={8}
              />
            </div>
            <button
              className="btn btn-primary w-full"
              style={{ justifyContent: "center", marginTop: 8 }}
              disabled={loading}
            >
              {loading ? "Actualizando..." : "Restablecer contraseña →"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
