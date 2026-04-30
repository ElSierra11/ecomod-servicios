import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/api";
import { useTheme } from "../hooks/useTheme";
import { useSwal } from "../hooks/useSwal";
import LogoIcon from "../components/LogoIcon";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  ArrowLeft,
  Moon,
  Sun,
  Truck,
  ShieldCheck,
  RotateCcw,
  Zap,
  Star,
  AlertCircle,
} from "lucide-react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function useGoogleScript() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (window.google?.accounts?.id) {
      setReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setReady(true);
    document.head.appendChild(script);
  }, []);
  return ready;
}

function GoogleSignInButton({ onSuccess, onError }) {
  const googleReady = useGoogleScript();
  const buttonRef = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (
      googleReady &&
      buttonRef.current &&
      !initialized.current &&
      window.google?.accounts?.id &&
      GOOGLE_CLIENT_ID
    ) {
      initialized.current = true;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            const result = await authApi.googleAuth(response.credential);
            onSuccess(result);
          } catch (err) {
            onError(err.message || "Error al autenticar con Google");
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: 320,
      });
    }
  }, [googleReady, onSuccess, onError]);

  if (!GOOGLE_CLIENT_ID)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px",
          background: "rgba(232,41,28,0.1)",
          borderRadius: "8px",
          color: "#e8291c",
          fontSize: "12px",
        }}
      >
        <AlertCircle size={14} />
        <span>Google login no configurado</span>
      </div>
    );
  return (
    <div
      ref={buttonRef}
      style={{ display: "flex", justifyContent: "center", minHeight: "44px" }}
    />
  );
}

const validateEmail = (email) => {
  if (!email.trim()) return "El correo es obligatorio";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return "Ingresa un correo válido";
  return null;
};
const validatePassword = (password, minLength = 6) => {
  if (!password.trim()) return "La contraseña es obligatoria";
  if (password.length < minLength) return `Mínimo ${minLength} caracteres`;
  return null;
};
const validateName = (name, field) => {
  if (!name.trim()) return `El ${field} es obligatorio`;
  if (name.trim().length < 2) return `Mínimo 2 caracteres`;
  return null;
};

const perks = [
  { icon: Truck, text: "Envíos a toda Colombia" },
  { icon: ShieldCheck, text: "Compra 100% segura" },
  { icon: RotateCcw, text: "30 días de devolución" },
  { icon: Zap, text: "Despacho en 24 horas" },
];

export default function AuthPage() {
  const { login, loginWithToken } = useAuth();
  const { theme, toggle } = useTheme();
  const { success, error: swalError, toast } = useSwal(theme === "dark");
  const [tab, setTab] = useState("login");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

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

  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const nombreRef = useRef(null);
  const apellidoRef = useRef(null);

  const isDark = theme === "dark";

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((err) => ({ ...err, [k]: null }));
  };
  const setR = (k) => (e) => {
    setResetForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((err) => ({ ...err, [k]: null }));
  };

  const switchTab = (t) => {
    setTab(t);
    setErrors({});
    setForm({ email: "", password: "", nombre: "", apellido: "" });
    setResetForm({ token: "", new_password: "", confirm: "" });
  };

  const validateForm = (fields) => {
    const newErrors = {};
    fields.forEach(({ key, validator, ref }) => {
      const err = validator(form[key] || resetForm[key]);
      if (err) {
        newErrors[key] = err;
        ref?.current?.focus();
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (
      !validateForm([
        {
          key: "email",
          validator: () => validateEmail(form.email),
          ref: emailRef,
        },
        {
          key: "password",
          validator: () => validatePassword(form.password, 6),
          ref: passwordRef,
        },
      ])
    )
      return;
    setIsLoading(true);
    try {
      await login(form.email, form.password);
      toast("success", "¡Bienvenido de vuelta!");
    } catch (err) {
      swalError(
        "Error de inicio de sesión",
        err.message || "Credenciales incorrectas",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (
      !validateForm([
        {
          key: "nombre",
          validator: () => validateName(form.nombre, "nombre"),
          ref: nombreRef,
        },
        {
          key: "apellido",
          validator: () => validateName(form.apellido, "apellido"),
          ref: apellidoRef,
        },
        {
          key: "email",
          validator: () => validateEmail(form.email),
          ref: emailRef,
        },
        {
          key: "password",
          validator: () => validatePassword(form.password, 8),
          ref: passwordRef,
        },
      ])
    )
      return;
    setIsLoading(true);
    try {
      await authApi.register({
        email: form.email,
        password: form.password,
        nombre: form.nombre,
        apellido: form.apellido,
      });
      success("¡Cuenta creada!", "Ahora inicia sesión con tus credenciales");
      setTimeout(() => switchTab("login"), 2000);
    } catch (err) {
      swalError(
        "Error al registrarte",
        err.message || "No se pudo crear la cuenta",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (
      !validateForm([
        {
          key: "email",
          validator: () => validateEmail(form.email),
          ref: emailRef,
        },
      ])
    )
      return;
    setIsLoading(true);
    try {
      await authApi.forgotPassword(form.email);
      success("¡Revisa tu correo!", "Te enviamos un enlace");
      setTimeout(() => switchTab("reset"), 2000);
    } catch (err) {
      swalError("Error al enviar", err.message || "No encontramos esa cuenta");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (resetForm.new_password !== resetForm.confirm) {
      setErrors({ confirm: "Las contraseñas no coinciden" });
      return;
    }
    if (
      !validateForm([
        {
          key: "token",
          validator: (v) => (!v?.trim() ? "Pega el token de tu correo" : null),
        },
        {
          key: "new_password",
          validator: () => validatePassword(resetForm.new_password, 8),
        },
      ])
    )
      return;
    setIsLoading(true);
    try {
      await authApi.resetPassword(resetForm.token, resetForm.new_password);
      success(
        "¡Contraseña actualizada!",
        "Inicia sesión con tu nueva contraseña",
      );
      setTimeout(() => switchTab("login"), 2000);
    } catch (err) {
      swalError("Error al restablecer", err.message || "El token es inválido");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = (data) => {
    loginWithToken(data);
    toast("success", "¡Inicio con Google exitoso!");
  };
  const handleGoogleError = (err) => {
    swalError("Error de Google", err || "No se pudo autenticar");
  };

  const inputStyle = (error) => ({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "0 16px",
    borderRadius: "12px",
    border: `2px solid ${error ? "#f87171" : isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb"}`,
    background: isDark ? "rgba(255,255,255,0.05)" : "#fff",
    transition: "all 0.2s",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* LEFT PANEL */}
      <div
        style={{
          display: "none",
          width: "55%",
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(145deg, #e8291c 0%, #c0392b 40%, #922b21 100%)",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px",
        }}
        className="auth-left-desktop"
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "24rem",
            height: "24rem",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "50%",
            transform: "translateY(-50%) translateX(33%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "16rem",
            height: "16rem",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "50%",
            transform: "translateY(33%) translateX(-25%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "url('data:image/svg+xml,%3Csvg width=%2220%22 height=%2220%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Ccircle cx=%2210%22 cy=%2210%22 r=%221%22 fill=%22white%22 opacity=%220.05%22/%3E%3C/svg%3E')",
            opacity: 0.5,
          }}
        />

        <div style={{ position: "relative", zIndex: 10, maxWidth: "420px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                background: "rgba(255,255,255,0.2)",
                backdropFilter: "blur(4px)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LogoIcon size={28} />
            </div>
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "24px",
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "-0.5px",
              }}
            >
              Eco
            </span>
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "24px",
                fontWeight: 800,
                color: "rgba(255,255,255,0.7)",
                letterSpacing: "-0.5px",
              }}
            >
              Mod
            </span>
          </div>

          <h1
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "56px",
              fontWeight: 900,
              color: "#fff",
              lineHeight: 1.05,
              marginBottom: "16px",
              letterSpacing: "-1px",
            }}
          >
            Tu tienda
            <br />
            <span style={{ color: "rgba(255,255,255,0.7)" }}>en línea</span>
            <br />
            favorita
          </h1>
          <p
            style={{
              fontSize: "15px",
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.6,
              marginBottom: "36px",
            }}
          >
            Miles de productos. Los mejores precios. Envío rápido a todo el
            país.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginBottom: "32px",
            }}
          >
            {perks.map(({ icon: Icon, text }) => (
              <div
                key={text}
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    background: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(4px)",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                  }}
                >
                  <Icon size={16} />
                </div>
                <span
                  style={{
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.85)",
                    fontWeight: 600,
                  }}
                >
                  {text}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              paddingTop: "24px",
              borderTop: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <div style={{ display: "flex", gap: "2px" }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="#fbbf24" color="#fbbf24" />
              ))}
            </div>
            <span
              style={{
                fontSize: "12px",
                color: "rgba(255,255,255,0.7)",
                fontWeight: 600,
              }}
            >
              +50,000 clientes satisfechos
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: isDark ? "#0f0f13" : "#faf8f5",
          position: "relative",
        }}
      >
        <button
          onClick={toggle}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            border: `2px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb"}`,
            background: isDark ? "rgba(255,255,255,0.05)" : "#fff",
            color: isDark ? "rgba(255,255,255,0.5)" : "#6b7280",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Mobile logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "32px",
          }}
        >
          <LogoIcon size={32} />
          <span
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: isDark ? "#fff" : "#1a1a1a",
            }}
          >
            Eco
          </span>
          <span style={{ fontSize: "20px", fontWeight: 800, color: "#e8291c" }}>
            Mod
          </span>
        </div>

        <div style={{ width: "100%", maxWidth: "380px" }}>
          {/* Tabs */}
          {(tab === "login" || tab === "register") && (
            <div
              style={{
                display: "flex",
                borderBottom: `2px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb"}`,
                marginBottom: "28px",
              }}
            >
              {["login", "register"].map((t) => (
                <button
                  key={t}
                  onClick={() => switchTab(t)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "none",
                    border: "none",
                    borderBottom: `2px solid ${tab === t ? "#e8291c" : "transparent"}`,
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    marginBottom: "-2px",
                    color:
                      tab === t
                        ? "#e8291c"
                        : isDark
                          ? "rgba(255,255,255,0.4)"
                          : "#9ca3af",
                    transition: "all 0.2s",
                  }}
                >
                  {t === "login" ? "Iniciar sesión" : "Crear cuenta"}
                </button>
              ))}
            </div>
          )}

          {/* LOGIN */}
          {tab === "login" && (
            <form
              onSubmit={handleLogin}
              style={{ animation: "authFadeUp 0.35s ease" }}
            >
              <div style={{ marginBottom: "24px" }}>
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    marginBottom: "4px",
                    color: isDark ? "#f0f0f8" : "#1a1a1a",
                  }}
                >
                  ¡Bienvenido!
                </h2>
                <p
                  style={{
                    fontSize: "13px",
                    color: isDark ? "rgba(255,255,255,0.4)" : "#888",
                  }}
                >
                  Ingresa a tu cuenta para continuar comprando
                </p>
              </div>

              {/* Email */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: isDark ? "rgba(255,255,255,0.6)" : "#555",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Correo electrónico
                </label>
                <div style={inputStyle(errors.email)}>
                  <Mail
                    size={18}
                    style={{
                      color: errors.email ? "#f87171" : "#bbb",
                      flexShrink: 0,
                    }}
                  />
                  <input
                    ref={emailRef}
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={form.email}
                    onChange={set("email")}
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "14px",
                      padding: "14px 0",
                      color: isDark ? "#f0f0f8" : "#1a1a1a",
                    }}
                  />
                </div>
                {errors.email && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#ef4444",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      marginTop: "4px",
                    }}
                  >
                    <AlertCircle size={12} />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: isDark ? "rgba(255,255,255,0.6)" : "#555",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Contraseña
                </label>
                <div style={inputStyle(errors.password)}>
                  <Lock
                    size={18}
                    style={{
                      color: errors.password ? "#f87171" : "#bbb",
                      flexShrink: 0,
                    }}
                  />
                  <input
                    ref={passwordRef}
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={set("password")}
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "14px",
                      padding: "14px 0",
                      color: isDark ? "#f0f0f8" : "#1a1a1a",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#bbb",
                      padding: 0,
                    }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#ef4444",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      marginTop: "4px",
                    }}
                  >
                    <AlertCircle size={12} />
                    {errors.password}
                  </p>
                )}
              </div>

              <div style={{ textAlign: "right", margin: "-4px 0 16px" }}>
                <button
                  type="button"
                  onClick={() => switchTab("forgot")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#e8291c",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "14px 24px",
                  background: "linear-gradient(135deg, #e8291c, #c0392b)",
                  border: "none",
                  borderRadius: "12px",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "15px",
                  fontWeight: 800,
                  color: "#fff",
                  cursor: "pointer",
                  transition: "all 0.25s",
                  marginBottom: "16px",
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading ? (
                  <span
                    style={{
                      width: "18px",
                      height: "18px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      animation: "authSpin 0.6s linear infinite",
                      display: "inline-block",
                    }}
                  />
                ) : (
                  <>
                    <span>Entrar</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div style={{ position: "relative", margin: "24px 0" }}>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb"}`,
                    }}
                  />
                </div>
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      padding: "0 12px",
                      fontSize: "12px",
                      color: "#9ca3af",
                      background: isDark ? "#0f0f13" : "#faf8f5",
                    }}
                  >
                    o continúa con
                  </span>
                </div>
              </div>

              <GoogleSignInButton
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
              />
            </form>
          )}

          {/* REGISTER */}
          {tab === "register" && (
            <form
              onSubmit={handleRegister}
              style={{ animation: "authFadeUp 0.35s ease" }}
            >
              <div style={{ marginBottom: "24px" }}>
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    marginBottom: "4px",
                    color: isDark ? "#f0f0f8" : "#1a1a1a",
                  }}
                >
                  Crea tu cuenta
                </h2>
                <p
                  style={{
                    fontSize: "13px",
                    color: isDark ? "rgba(255,255,255,0.4)" : "#888",
                  }}
                >
                  Regístrate gratis y empieza a comprar
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: isDark ? "rgba(255,255,255,0.6)" : "#555",
                      marginBottom: "6px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Nombre
                  </label>
                  <div style={inputStyle(errors.nombre)}>
                    <User
                      size={18}
                      style={{
                        color: errors.nombre ? "#f87171" : "#bbb",
                        flexShrink: 0,
                      }}
                    />
                    <input
                      ref={nombreRef}
                      type="text"
                      placeholder="Juan"
                      value={form.nombre}
                      onChange={set("nombre")}
                      style={{
                        flex: 1,
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "14px",
                        padding: "14px 0",
                        color: isDark ? "#f0f0f8" : "#1a1a1a",
                      }}
                    />
                  </div>
                  {errors.nombre && (
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#ef4444",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        marginTop: "4px",
                      }}
                    >
                      <AlertCircle size={12} />
                      {errors.nombre}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: isDark ? "rgba(255,255,255,0.6)" : "#555",
                      marginBottom: "6px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Apellido
                  </label>
                  <div style={inputStyle(errors.apellido)}>
                    <User
                      size={18}
                      style={{
                        color: errors.apellido ? "#f87171" : "#bbb",
                        flexShrink: 0,
                      }}
                    />
                    <input
                      ref={apellidoRef}
                      type="text"
                      placeholder="Pérez"
                      value={form.apellido}
                      onChange={set("apellido")}
                      style={{
                        flex: 1,
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "14px",
                        padding: "14px 0",
                        color: isDark ? "#f0f0f8" : "#1a1a1a",
                      }}
                    />
                  </div>
                  {errors.apellido && (
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#ef4444",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        marginTop: "4px",
                      }}
                    >
                      <AlertCircle size={12} />
                      {errors.apellido}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: isDark ? "rgba(255,255,255,0.6)" : "#555",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Correo electrónico
                </label>
                <div style={inputStyle(errors.email)}>
                  <Mail
                    size={18}
                    style={{
                      color: errors.email ? "#f87171" : "#bbb",
                      flexShrink: 0,
                    }}
                  />
                  <input
                    ref={emailRef}
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={form.email}
                    onChange={set("email")}
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "14px",
                      padding: "14px 0",
                      color: isDark ? "#f0f0f8" : "#1a1a1a",
                    }}
                  />
                </div>
                {errors.email && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#ef4444",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      marginTop: "4px",
                    }}
                  >
                    <AlertCircle size={12} />
                    {errors.email}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: isDark ? "rgba(255,255,255,0.6)" : "#555",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Contraseña
                </label>
                <div style={inputStyle(errors.password)}>
                  <Lock
                    size={18}
                    style={{
                      color: errors.password ? "#f87171" : "#bbb",
                      flexShrink: 0,
                    }}
                  />
                  <input
                    ref={passwordRef}
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={set("password")}
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "14px",
                      padding: "14px 0",
                      color: isDark ? "#f0f0f8" : "#1a1a1a",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#bbb",
                      padding: 0,
                    }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#ef4444",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      marginTop: "4px",
                    }}
                  >
                    <AlertCircle size={12} />
                    {errors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "14px 24px",
                  background: "linear-gradient(135deg, #e8291c, #c0392b)",
                  border: "none",
                  borderRadius: "12px",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "15px",
                  fontWeight: 800,
                  color: "#fff",
                  cursor: "pointer",
                  transition: "all 0.25s",
                  marginBottom: "16px",
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading ? (
                  <span
                    style={{
                      width: "18px",
                      height: "18px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      animation: "authSpin 0.6s linear infinite",
                      display: "inline-block",
                    }}
                  />
                ) : (
                  <>
                    <span>Crear cuenta</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div style={{ position: "relative", margin: "24px 0" }}>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb"}`,
                    }}
                  />
                </div>
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      padding: "0 12px",
                      fontSize: "12px",
                      color: "#9ca3af",
                      background: isDark ? "#0f0f13" : "#faf8f5",
                    }}
                  >
                    o continúa con
                  </span>
                </div>
              </div>

              <GoogleSignInButton
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
              />

              <p
                style={{
                  fontSize: "11px",
                  textAlign: "center",
                  marginTop: "12px",
                  color: isDark ? "rgba(255,255,255,0.3)" : "#9ca3af",
                }}
              >
                Al registrarte aceptas nuestros{" "}
                <a
                  href="#"
                  style={{
                    color: "#e8291c",
                    textDecoration: "none",
                    fontWeight: 700,
                  }}
                >
                  Términos
                </a>{" "}
                y{" "}
                <a
                  href="#"
                  style={{
                    color: "#e8291c",
                    textDecoration: "none",
                    fontWeight: 700,
                  }}
                >
                  Política de privacidad
                </a>
              </p>
            </form>
          )}

          {/* FORGOT */}
          {tab === "forgot" && (
            <form
              onSubmit={handleForgot}
              style={{ animation: "authFadeUp 0.35s ease" }}
            >
              <button
                type="button"
                onClick={() => switchTab("login")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "12px",
                  fontWeight: 700,
                  marginBottom: "16px",
                  color: isDark ? "rgba(255,255,255,0.4)" : "#888",
                }}
              >
                <ArrowLeft size={15} /> Volver al login
              </button>

              <div style={{ marginBottom: "24px" }}>
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    marginBottom: "4px",
                    color: isDark ? "#f0f0f8" : "#1a1a1a",
                  }}
                >
                  Recuperar contraseña
                </h2>
                <p
                  style={{
                    fontSize: "13px",
                    color: isDark ? "rgba(255,255,255,0.4)" : "#888",
                  }}
                >
                  Te enviaremos un enlace a tu correo
                </p>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: isDark ? "rgba(255,255,255,0.6)" : "#555",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Correo electrónico
                </label>
                <div style={inputStyle(errors.email)}>
                  <Mail
                    size={18}
                    style={{
                      color: errors.email ? "#f87171" : "#bbb",
                      flexShrink: 0,
                    }}
                  />
                  <input
                    ref={emailRef}
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={form.email}
                    onChange={set("email")}
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "14px",
                      padding: "14px 0",
                      color: isDark ? "#f0f0f8" : "#1a1a1a",
                    }}
                  />
                </div>
                {errors.email && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#ef4444",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      marginTop: "4px",
                    }}
                  >
                    <AlertCircle size={12} />
                    {errors.email}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "14px 24px",
                  background: "linear-gradient(135deg, #e8291c, #c0392b)",
                  border: "none",
                  borderRadius: "12px",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "15px",
                  fontWeight: 800,
                  color: "#fff",
                  cursor: "pointer",
                  transition: "all 0.25s",
                  marginBottom: "16px",
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading ? (
                  <span
                    style={{
                      width: "18px",
                      height: "18px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      animation: "authSpin 0.6s linear infinite",
                      display: "inline-block",
                    }}
                  />
                ) : (
                  <>
                    <span>Enviar enlace</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => switchTab("reset")}
                style={{
                  width: "100%",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#e8291c",
                  textAlign: "center",
                  marginTop: "8px",
                }}
              >
                ¿Ya tienes el código? Restablecer
              </button>
            </form>
          )}

          {/* RESET */}
          {tab === "reset" && (
            <form
              onSubmit={handleReset}
              style={{ animation: "authFadeUp 0.35s ease" }}
            >
              <button
                type="button"
                onClick={() => switchTab("forgot")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "12px",
                  fontWeight: 700,
                  marginBottom: "16px",
                  color: isDark ? "rgba(255,255,255,0.4)" : "#888",
                }}
              >
                <ArrowLeft size={15} /> Volver
              </button>

              <div style={{ marginBottom: "24px" }}>
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    marginBottom: "4px",
                    color: isDark ? "#f0f0f8" : "#1a1a1a",
                  }}
                >
                  Nueva contraseña
                </h2>
                <p
                  style={{
                    fontSize: "13px",
                    color: isDark ? "rgba(255,255,255,0.4)" : "#888",
                  }}
                >
                  Ingresa el token de tu correo y tu nueva contraseña
                </p>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: isDark ? "rgba(255,255,255,0.6)" : "#555",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Token del correo
                </label>
                <div style={inputStyle(errors.token)}>
                  <Lock
                    size={18}
                    style={{
                      color: errors.token ? "#f87171" : "#bbb",
                      flexShrink: 0,
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Pega el token aquí"
                    value={resetForm.token}
                    onChange={setR("token")}
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "14px",
                      padding: "14px 0",
                      color: isDark ? "#f0f0f8" : "#1a1a1a",
                      fontFamily: "monospace",
                      fontSize: "12px",
                    }}
                  />
                </div>
                {errors.token && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#ef4444",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      marginTop: "4px",
                    }}
                  >
                    <AlertCircle size={12} />
                    {errors.token}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: isDark ? "rgba(255,255,255,0.6)" : "#555",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Nueva contraseña
                </label>
                <div style={inputStyle(errors.new_password)}>
                  <Lock
                    size={18}
                    style={{
                      color: errors.new_password ? "#f87171" : "#bbb",
                      flexShrink: 0,
                    }}
                  />
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={resetForm.new_password}
                    onChange={setR("new_password")}
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "14px",
                      padding: "14px 0",
                      color: isDark ? "#f0f0f8" : "#1a1a1a",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#bbb",
                      padding: 0,
                    }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.new_password && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#ef4444",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      marginTop: "4px",
                    }}
                  >
                    <AlertCircle size={12} />
                    {errors.new_password}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: isDark ? "rgba(255,255,255,0.6)" : "#555",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Confirmar contraseña
                </label>
                <div style={inputStyle(errors.confirm)}>
                  <Lock
                    size={18}
                    style={{
                      color: errors.confirm ? "#f87171" : "#bbb",
                      flexShrink: 0,
                    }}
                  />
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    value={resetForm.confirm}
                    onChange={setR("confirm")}
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "14px",
                      padding: "14px 0",
                      color: isDark ? "#f0f0f8" : "#1a1a1a",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#bbb",
                      padding: 0,
                    }}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirm && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#ef4444",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      marginTop: "4px",
                    }}
                  >
                    <AlertCircle size={12} />
                    {errors.confirm}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "14px 24px",
                  background: "linear-gradient(135deg, #e8291c, #c0392b)",
                  border: "none",
                  borderRadius: "12px",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "15px",
                  fontWeight: 800,
                  color: "#fff",
                  cursor: "pointer",
                  transition: "all 0.25s",
                  marginBottom: "16px",
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading ? (
                  <span
                    style={{
                      width: "18px",
                      height: "18px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      animation: "authSpin 0.6s linear infinite",
                      display: "inline-block",
                    }}
                  />
                ) : (
                  <>
                    <span>Restablecer contraseña</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes authFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes authSpin {
          to { transform: rotate(360deg); }
        }
        @media (min-width: 1024px) {
          .auth-left-desktop { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
