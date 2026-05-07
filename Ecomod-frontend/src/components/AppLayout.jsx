import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { useCart } from "../App";
import LogoIcon from "./LogoIcon";
import { useToast } from "../App";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Package,
  ClipboardList,
  CreditCard,
  Truck,
  Bell,
  LogOut,
  Sun,
  Moon,
  Search,
  ChevronDown,
  Users,
  BarChart3,
  Menu,
  X,
=======
  Zap,
  Shield,
  RotateCcw,
  Server,
  MapPin,
  Phone,
  Heart,
>>>>>>> 7a936b07f48b43d7f5672176b09371ae9ab85c04
  User,
  ShoppingBag,
} from "lucide-react";
import { cn } from "../lib/utils";

export default function AppLayout({ children, page, setPage }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { cartCount } = useCart();
  const { addToast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const isDark = theme === "dark";

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target))
        setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isAdmin = user?.role === "admin";

  const userNavItems = [
    { id: "dashboard", icon: ShoppingBag, label: "Inicio" },
    { id: "catalog", icon: Package, label: "CatÃ¡logo" },
    { id: "cart", icon: ShoppingCart, label: "Carrito" },
    { id: "orders", icon: ClipboardList, label: "Pedidos" },
    { id: "payments", icon: CreditCard, label: "Pagos" },
    { id: "shipping", icon: Truck, label: "EnvÃ­os" },
    { id: "notifications", icon: Bell, label: "Alertas" },
  ];

  const adminNavItems = [
    { id: "admin-stats", icon: BarChart3, label: "Dashboard" },
    { id: "catalog", icon: Package, label: "CatÃ¡logo" },
    { id: "inventory", icon: Package, label: "Inventario" },
    { id: "orders", icon: ClipboardList, label: "Pedidos" },
    { id: "payments", icon: CreditCard, label: "Pagos" },
    { id: "shipping", icon: Truck, label: "EnvÃ­os" },
    { id: "admin-users", icon: Users, label: "Usuarios" },
    { id: "notifications", icon: Bell, label: "Alertas" },
  ];

  const visibleNav = isAdmin ? adminNavItems : userNavItems;
  const initials = user ? (user.nombre || user.email || "U")[0].toUpperCase() : "U";
  const fullName = user?.nombre ? `${user.nombre} ${user.apellido || ""}`.trim() : user?.email?.split("@")[0];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      addToast("info", "BÃºsqueda iniciada", `Resultados para "${searchQuery}"`);
      setPage("catalog");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className={cn("min-h-screen flex flex-col font-body transition-colors duration-300", isDark ? "dark bg-background text-foreground" : "bg-background text-foreground")}>
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 glass-nav shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">
            
            {/* Logo */}
            <button 
              onClick={() => setPage(isAdmin ? "admin-stats" : "dashboard")}
              className="flex items-center gap-2 group focus:outline-none"
            >
              <LogoIcon size={32} className="group-hover:scale-110 transition-transform" />
              <span className="font-head text-2xl font-bold tracking-tight">
                Eco<span className="text-primary">Mod</span>
              </span>
            </button>

            {/* Search Bar (Desktop) */}
            <div className="hidden md:flex flex-1 max-w-xl items-center relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="Buscar productos..."
                className="w-full pl-10 pr-4 py-2 rounded-full border border-border bg-secondary/50 focus:bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              
              {!isAdmin && (
                <button 
                  onClick={() => setPage("cart")}
                  className="relative p-2 rounded-full hover:bg-secondary transition-colors focus:outline-none"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-primary rounded-full">
                      {cartCount}
                    </span>
                  )}
                </button>
              )}

              {/* User Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-secondary transition-colors focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm">
                    {initials}
                  </div>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", userMenuOpen && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 rounded-xl shadow-lg bg-card border border-border overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-border bg-secondary/30">
                        <p className="text-sm font-medium leading-none mb-1">{fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        <div className="mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary border-transparent">
                          {isAdmin ? "Admin" : "Cliente"}
                        </div>
                      </div>
                      <div className="p-2">
                        {visibleNav.slice(0, 4).map((item) => (
                          <button
                            key={item.id}
                            onClick={() => { setPage(item.id); setUserMenuOpen(false); }}
                            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-foreground hover:bg-secondary hover:text-primary rounded-md transition-colors"
                          >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </button>
                        ))}
                      </div>
                      <div className="p-2 border-t border-border">
                        <button 
                          onClick={toggle}
                          className="flex items-center gap-3 w-full px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-md transition-colors"
                        >
                          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                          {isDark ? "Modo Claro" : "Modo Oscuro"}
                        </button>
                        <button 
                          onClick={() => { logout(); setUserMenuOpen(false); }}
                          className="flex items-center gap-3 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors mt-1"
                        >
                          <LogOut className="h-4 w-4" />
                          Cerrar SesiÃ³n
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-full hover:bg-secondary transition-colors focus:outline-none"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

            </div>
          </div>
        </>
      )}

      {/* â•â• PAGE CONTENT â•â• */}
      <main className="ec-main">{children}</main>

      {/* â•â• FOOTER â•â• */}
      <footer className="ec-footer">
        <div className="ec-footer-inner">
          <div className="ec-footer-top">
            <div className="ec-footer-brand">
              <div className="ec-logo-icon sm">
                <Zap size={13} strokeWidth={2.5} />
              </div>
              <span>
                <b>Eco</b>Mod
              </span>
            </div>
            <div className="ec-footer-desc">
              Tu marketplace de confianza. Productos de calidad, envÃ­os rÃ¡pidos
              y la mejor experiencia de compra en Colombia.
            </div>
          </div>
          <div className="ec-footer-links">
            <div className="ec-footer-col">
              <h4>Comprar</h4>
              {["CatÃ¡logo", "Ofertas", "Nuevos", "MÃ¡s vendidos"].map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
            <div className="ec-footer-col">
              <h4>Mi cuenta</h4>
              {["Pedidos", "Pagos", "EnvÃ­os", "Favoritos"].map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
            <div className="ec-footer-col">
              <h4>Ayuda</h4>
              {["Centro de ayuda", "Devoluciones", "Contacto", "TÃ©rminos"].map(
                (l) => (
                  <span key={l}>{l}</span>
                ),
              )}
            </div>
          </div>
          <div className="ec-footer-bottom">
            <div className="ec-footer-copy">
              Â© {new Date().getFullYear()} EcoMod Â· Todos los derechos
              reservados
            </div>
            <div className="ec-footer-payments">
              <span>ðŸ’³ Visa</span>
              <span>ðŸ’³ Mastercard</span>
              <span>ðŸ’³ Amex</span>
              <span>ðŸ’³ PayPal</span>
            </div>
          </div>
        </div>
      </header>

      {/* SECONDARY NAV (DESKTOP) */}
      <nav className="hidden md:flex border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex overflow-x-auto no-scrollbar">
          {visibleNav.map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                page === item.id 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 right-0 w-3/4 max-w-sm bg-card border-l border-border shadow-2xl z-50 p-6 flex flex-col md:hidden"
            >
              <div className="flex justify-between items-center mb-8">
                <span className="font-head text-xl font-bold">MenÃº</span>
                <button onClick={() => setMobileOpen(false)} className="p-2 hover:bg-secondary rounded-full">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
                {visibleNav.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setPage(item.id); setMobileOpen(false); }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                      page === item.id ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="mt-auto pt-4 border-t border-border flex flex-col gap-2">
                <button onClick={toggle} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-secondary">
                  {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  {isDark ? "Modo Claro" : "Modo Oscuro"}
                </button>
                <button onClick={() => { logout(); setMobileOpen(false); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10">
                  <LogOut className="h-5 w-5" />
                  Cerrar SesiÃ³n
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border bg-card mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <LogoIcon size={24} />
                <span className="font-head text-xl font-bold">EcoMod</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Plataforma de comercio electrÃ³nico moderno construido sobre una arquitectura de microservicios robusta y escalable.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Plataforma</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">CatÃ¡logo</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Ofertas</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">CategorÃ­as</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Centro de Ayuda</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">TÃ©rminos de Servicio</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacidad</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Sistema</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span>API Gateway (Kong) Operativo</span>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} EcoMod Inc. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
