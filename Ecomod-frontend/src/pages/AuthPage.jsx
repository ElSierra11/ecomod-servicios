import { useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/api";
import { useTheme } from "../hooks/useTheme";
import { useSwal } from "../hooks/useSwal";
import LogoIcon from "../components/LogoIcon";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { cn } from "../lib/utils";

// Validaciones
const validateEmail = (e) => (!e?.trim() ? "El correo es obligatorio" : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? "Correo inválido" : null);
const validatePassword = (p, min = 6) => (!p?.trim() ? "La contraseña es obligatoria" : p.length < min ? `Mínimo ${min} caracteres` : null);
const validateName = (n, f) => (!n?.trim() ? `El ${f} es obligatorio` : n.trim().length < 2 ? "Mínimo 2 caracteres" : null);

function InputField({ label, icon: Icon, type = "text", value, onChange, error, placeholder, name, autoComplete }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  
  return (
    <div className="mb-4 relative">
      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
        {label}
      </label>
      <div className={cn(
        "flex items-center gap-3 px-4 py-3.5 rounded-2xl border bg-background/50 transition-all focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary shadow-sm",
        error ? "border-destructive focus-within:ring-destructive/50" : "border-border hover:border-primary/50"
      )}>
        <Icon className="w-5 h-5 text-muted-foreground/70" />
        <input
          name={name}
          id={name}
          autoComplete={autoComplete}
          type={isPassword ? (show ? "text" : "password") : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/50 font-medium"
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="absolute -bottom-5 left-1 text-[10px] font-bold text-destructive flex items-center gap-1">{error}</p>}
    </div>
  );
}


const perks = [
  { icon: "🚚", text: "Envíos a toda Colombia" },
  { icon: "🛡️", text: "Compra 100% segura" },
  { icon: "🔄", text: "30 días de devolución" },
  { icon: "⚡", text: "Despacho en 24 horas" },
];

export default function AuthPage() {
  const { login, loginWithToken } = useAuth();
  const { theme } = useTheme();
  const { success, error: swalError, toast } = useSwal(theme === "dark");
  
  const [tab, setTab] = useState("login");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ email: "", password: "", nombre: "", apellido: "" });

  const set = useCallback((k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((err) => ({ ...err, [k]: null }));
  }, []);

  const switchTab = (t) => {
    setTab(t);
    setErrors({});
    setForm({ email: "", password: "", nombre: "", apellido: "" });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const errs = { email: validateEmail(form.email), password: validatePassword(form.password, 6) };
    if (Object.values(errs).some(Boolean)) return setErrors(errs);
    
    setIsLoading(true);
    try {
      await login({ email: form.email, password: form.password });
      toast("success", "¡Bienvenido de vuelta!");
    } catch (err) {
      swalError("Error", err.message || "Credenciales incorrectas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const errs = {
      nombre: validateName(form.nombre, "nombre"),
      apellido: validateName(form.apellido, "apellido"),
      email: validateEmail(form.email),
      password: validatePassword(form.password, 8),
    };
    if (Object.values(errs).some(Boolean)) return setErrors(errs);

    setIsLoading(true);
    try {
      await authApi.register(form);
      success("¡Cuenta creada!", "Inicia sesión con tus credenciales");
      setTimeout(() => switchTab("login"), 2000);
    } catch (err) {
      swalError("Error", err.message || "No se pudo crear la cuenta");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (tokenResponse) => {
    setIsLoading(true);
    try {
      const response = await authApi.googleAuth(tokenResponse.access_token);
      loginWithToken(response);
      toast("success", "¡Bienvenido con Google!");
    } catch (err) {
      swalError("Error", err.message || "No se pudo iniciar sesión con Google");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => swalError("Error", "La autenticación con Google fue cancelada o falló."),
  });

  return (
    <div className="min-h-screen flex font-body bg-background selection:bg-primary/30 selection:text-primary">
      {/* Left Column: Form Content */}
      <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col justify-center relative p-6 sm:p-12 lg:p-16 z-10 bg-card">
        {/* Decorative Blur */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
        
        <div className="w-full max-w-sm mx-auto relative z-10">
          <div className="mb-12 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <LogoIcon size={32} />
            </div>
            <span className="font-head text-3xl font-black tracking-tight">Eco<span className="text-primary">Mod</span></span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="mb-8">
                <h1 className="text-4xl font-head font-black tracking-tight text-foreground mb-3">
                  {tab === "login" ? "Hola de nuevo." : "Comienza ahora."}
                </h1>
                <p className="text-muted-foreground text-sm font-medium">
                  {tab === "login" 
                    ? "Inicia sesión para gestionar tus compras y envíos." 
                    : "Crea tu cuenta corporativa y accede a todo el catálogo."}
                </p>
              </div>
              
              <form onSubmit={tab === "login" ? handleLogin : handleRegister} className="space-y-6">
                
                {tab === "register" && (
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Nombre" icon={User} value={form.nombre} onChange={set("nombre")} error={errors.nombre} placeholder="Juan" name="given-name" autoComplete="given-name" />
                    <InputField label="Apellido" icon={User} value={form.apellido} onChange={set("apellido")} error={errors.apellido} placeholder="Pérez" name="family-name" autoComplete="family-name" />
                  </div>
                )}
                
                <InputField label="Correo electrónico" icon={Mail} value={form.email} onChange={set("email")} error={errors.email} placeholder="tu@correo.com" name="email" autoComplete="email" />
                <InputField label="Contraseña" icon={Lock} type="password" value={form.password} onChange={set("password")} error={errors.password} placeholder="••••••••" name="password" autoComplete={tab === "login" ? "current-password" : "new-password"} />
                
                {tab === "login" && (
                  <div className="flex justify-end -mt-2">
                    <button type="button" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">¿Olvidaste tu contraseña?</button>
                  </div>
                )}

                <button disabled={isLoading} className="w-full relative group overflow-hidden bg-primary text-primary-foreground py-4 rounded-2xl font-bold transition-all disabled:opacity-70 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-0.5">
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative flex items-center justify-center gap-2">
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <>
                        {tab === "login" ? "Ingresar al sistema" : "Crear mi cuenta"}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                </button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-[10px]"><span className="bg-card px-4 text-muted-foreground uppercase font-black tracking-widest">O continúa con</span></div>
              </div>

              {/* Botón de Google Premium */}
              <button 
                type="button" 
                onClick={handleGoogleLogin} 
                className="w-full flex items-center justify-center gap-3 bg-secondary/50 text-foreground py-4 rounded-2xl font-bold transition-all hover:bg-secondary border border-border hover:border-border/80 group"
              >
                <div className="bg-white p-1 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                  <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /><path fill="none" d="M1 1h22v22H1z" /></svg>
                </div>
                <span>Google</span>
              </button>

              <div className="mt-8 text-center">
                <p className="text-sm text-muted-foreground font-medium">
                  {tab === "login" ? "¿Nuevo en EcoMod?" : "¿Ya eres usuario?"}{" "}
                  <button 
                    onClick={() => switchTab(tab === "login" ? "register" : "login")} 
                    className="font-black text-primary hover:text-primary/80 transition-colors"
                  >
                    {tab === "login" ? "Crear cuenta" : "Inicia sesión"}
                  </button>
                </p>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Right Column: Hero Visuals */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative bg-muted items-center justify-center p-12 overflow-hidden border-l border-border">
        {/* Background Image Layer */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/auth-hero.png')" }}
        />
        
        {/* Overlay Dark/Light for better contrast */}
        <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        {/* Content Box */}
        <div className="relative z-10 w-full max-w-xl">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="glass-card border border-white/10 dark:border-white/5 bg-background/60 backdrop-blur-xl p-10 rounded-3xl shadow-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-primary font-bold text-xs mb-6 uppercase tracking-widest border border-primary/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Plataforma v2.0
            </div>
            
            <h2 className="text-4xl font-head font-black tracking-tight text-foreground leading-tight mb-6">
              Escala tu negocio con una arquitectura orientada a eventos.
            </h2>
            
            <p className="text-lg text-foreground/80 font-medium mb-8 leading-relaxed">
              Descubre una experiencia e-commerce premium. Microservicios resilientes, pagos en milisegundos y un inventario sincronizado en tiempo real.
            </p>

            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/150?img=${i+10}`} alt="User" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="text-sm font-bold text-foreground">
                <span className="text-primary">+10,000</span> usuarios confían
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
