import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { useCart } from "../App";
<<<<<<< HEAD
import LogoIcon from "./LogoIcon";
import { useToast } from "../App";
import { motion, AnimatePresence } from "framer-motion";
=======
import { useToast } from "../App";
>>>>>>> 7a936b07f48b43d7f5672176b09371ae9ab85c04
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
<<<<<<< HEAD
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
<<<<<<< HEAD
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
=======
  const [searchFocused, setSearchFocused] = useState(false);
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

  const navItems = [
>>>>>>> 7a936b07f48b43d7f5672176b09371ae9ab85c04
    { id: "dashboard", icon: ShoppingBag, label: "Inicio" },
    { id: "catalog", icon: Package, label: "Catálogo" },
    { id: "cart", icon: ShoppingCart, label: "Carrito" },
    { id: "orders", icon: ClipboardList, label: "Pedidos" },
    { id: "payments", icon: CreditCard, label: "Pagos" },
    { id: "shipping", icon: Truck, label: "Envíos" },
<<<<<<< HEAD
    { id: "notifications", icon: Bell, label: "Alertas" },
  ];

  const adminNavItems = [
    { id: "admin-stats", icon: BarChart3, label: "Dashboard" },
    { id: "catalog", icon: Package, label: "Catálogo" },
    { id: "inventory", icon: Package, label: "Inventario" },
    { id: "orders", icon: ClipboardList, label: "Pedidos" },
    { id: "payments", icon: CreditCard, label: "Pagos" },
    { id: "shipping", icon: Truck, label: "Envíos" },
    { id: "admin-users", icon: Users, label: "Usuarios" },
    { id: "notifications", icon: Bell, label: "Alertas" },
  ];

  const visibleNav = isAdmin ? adminNavItems : userNavItems;
  const initials = user ? (user.nombre || user.email || "U")[0].toUpperCase() : "U";
  const fullName = user?.nombre ? `${user.nombre} ${user.apellido || ""}`.trim() : user?.email?.split("@")[0];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      addToast("info", "Búsqueda iniciada", `Resultados para "${searchQuery}"`);
      setPage("catalog");
    }
  };

=======
    { id: "inventory", icon: Package, label: "Inventario" },
    { id: "notifications", icon: Bell, label: "Alertas" },
  ];

  const adminItems = [
    { id: "admin-users", icon: Users, label: "Usuarios" },
    { id: "admin-stats", icon: BarChart3, label: "Estadísticas" },
  ];

  const visibleNav = [
    ...navItems,
    ...(user?.role === "admin" ? adminItems : []),
  ];

  const initials = user
    ? (user.nombre || user.email || "U")[0].toUpperCase()
    : "U";
  const fullName = user?.nombre
    ? `${user.nombre} ${user.apellido || ""}`.trim()
    : user?.email?.split("@")[0];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      addToast("info", "Buscando...", `Resultados para "${searchQuery}"`);
      setPage("catalog");
    }
  };

>>>>>>> 7a936b07f48b43d7f5672176b09371ae9ab85c04
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
<<<<<<< HEAD
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
=======
    <div className={`ec-root ${isDark ? "dark" : "light"}`}>
      {/* ══ TOP STRIP ══ */}
      <div className="ec-strip">
        <div className="ec-strip-inner">
          <div className="ec-strip-left">
            <MapPin size={11} strokeWidth={2.5} />
            <span>Envíos a toda Colombia</span>
            <span className="ec-strip-sep">|</span>
            <Phone size={11} strokeWidth={2.5} />
            <span>01 8000 EcoMod</span>
          </div>
          <div className="ec-strip-right">
            <Zap size={11} strokeWidth={2.5} />
            <span>Despacho en 24h en ciudades principales</span>
            <span className="ec-strip-sep">|</span>
            <Shield size={11} strokeWidth={2.5} />
            <span>Compra 100% segura</span>
            <span className="ec-strip-sep">|</span>
            <RotateCcw size={11} strokeWidth={2.5} />
            <span>30 días de devolución</span>
          </div>
        </div>
      </div>

      {/* ══ MAIN HEADER ══ */}
      <header className="ec-header">
        <div className="ec-header-inner">
          {/* Logo */}
          <button className="ec-logo" onClick={() => setPage("dashboard")}>
            <div className="ec-logo-icon">
              <Zap size={20} strokeWidth={2.5} />
            </div>
            <div className="ec-logo-text">
              <span className="ec-logo-eco">Eco</span>
              <span className="ec-logo-mod">Mod</span>
            </div>
          </button>

          {/* Search Bar */}
          <div className={`ec-search ${searchFocused ? "focused" : ""}`}>
            <select className="ec-search-cat">
              <option>Todas</option>
              <option>Tecnología</option>
              <option>Electro</option>
              <option>Hogar</option>
              <option>Ropa</option>
              <option>Deportes</option>
            </select>
            <input
              className="ec-search-input"
              type="text"
              placeholder="¿Qué estás buscando hoy?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onKeyDown={handleKeyDown}
            />
            <button className="ec-search-btn" onClick={handleSearch}>
              <Search size={18} strokeWidth={2.5} />
            </button>
          </div>

          {/* Header Actions */}
          <div className="ec-header-actions">
            {/* Wishlist */}
            <button className="ec-action-btn hide-mobile">
              <div className="ec-action-icon">
                <Heart size={20} strokeWidth={2} />
              </div>
              <span className="ec-action-label">Favoritos</span>
            </button>

            {/* Cart with REAL counter */}
            <button className="ec-action-btn" onClick={() => setPage("cart")}>
              <div className="ec-action-icon">
                <ShoppingCart size={20} strokeWidth={2} />
                {cartCount > 0 && (
                  <span className="ec-badge ec-badge-pulse">{cartCount}</span>
                )}
              </div>
              <span className="ec-action-label">Carrito</span>
            </button>

            {/* Notifications */}
            <button
              className="ec-action-btn hide-mobile"
              onClick={() => setPage("notifications")}
            >
              <div className="ec-action-icon">
                <Bell size={20} strokeWidth={2} />
                <span className="ec-badge ec-badge-dot" />
              </div>
              <span className="ec-action-label">Alertas</span>
            </button>

            {/* User Menu */}
            <div className="ec-user-menu" ref={userMenuRef}>
              <button
                className="ec-user-trigger"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="ec-user-avatar">{initials}</div>
                <div className="ec-user-info hide-mobile">
                  <span className="ec-user-greeting">Hola,</span>
                  <span className="ec-user-name">
                    {fullName?.split(" ")[0] || "Usuario"}
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  strokeWidth={2.5}
                  className={`ec-chevron ${userMenuOpen ? "open" : ""}`}
                />
              </button>

              {userMenuOpen && (
                <div className="ec-user-dropdown">
                  <div className="ec-dropdown-header">
                    <div className="ec-dropdown-avatar">{initials}</div>
                    <div>
                      <div className="ec-dropdown-name">{fullName}</div>
                      <div className="ec-dropdown-email">{user?.email}</div>
                      <div className="ec-dropdown-role">
                        {user?.role === "admin" ? "Administrador" : "Cliente"}
                      </div>
                    </div>
                  </div>
                  <div className="ec-dropdown-divider" />
                  {[
                    { id: "orders", icon: ClipboardList, label: "Mis pedidos" },
                    { id: "payments", icon: CreditCard, label: "Mis pagos" },
                    { id: "shipping", icon: Truck, label: "Mis envíos" },
                  ].map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      className="ec-dropdown-item"
                      onClick={() => {
                        setPage(id);
                        setUserMenuOpen(false);
                      }}
                    >
                      <Icon size={15} strokeWidth={2} />
                      {label}
                    </button>
                  ))}
                  <div className="ec-dropdown-divider" />
                  <button className="ec-dropdown-item theme" onClick={toggle}>
                    {isDark ? (
                      <Sun size={15} strokeWidth={2} />
                    ) : (
                      <Moon size={15} strokeWidth={2} />
                    )}
                    {isDark ? "Modo claro" : "Modo oscuro"}
                  </button>
                  <button
                    className="ec-dropdown-item danger"
                    onClick={() => {
                      logout();
                      addToast("success", "Sesión cerrada", "Hasta pronto 👋");
                    }}
                  >
                    <LogOut size={15} strokeWidth={2} />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              className="ec-mobile-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X size={22} strokeWidth={2.5} />
              ) : (
                <Menu size={22} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ══ CATEGORY NAV ══ */}
      <nav className="ec-nav">
        <div className="ec-nav-inner">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button
                key={item.id}
                className={`ec-nav-item ${active ? "active" : ""}`}
                onClick={() => {
                  setPage(item.id);
                  setMobileOpen(false);
                }}
              >
                <Icon size={15} strokeWidth={2.5} />
                <span>{item.label}</span>
                {item.id === "cart" && cartCount > 0 && (
                  <span className="ec-nav-badge">{cartCount}</span>
                )}
              </button>
            );
          })}

          <div className="ec-nav-spacer" />

          {/* Gateway status */}
          <div className="ec-gateway">
            <Server size={11} strokeWidth={2.5} />
            <span>API Gateway</span>
            <div className="ec-gateway-dot" />
            <span className="ec-gateway-port">:8000</span>
          </div>
        </div>
      </nav>

      {/* ══ MOBILE DRAWER ══ */}
      {mobileOpen && (
        <>
          <div
            className="ec-mobile-overlay"
            onClick={() => setMobileOpen(false)}
          />
          <div className="ec-mobile-drawer">
            <div className="ec-mobile-drawer-header">
              <div className="ec-logo-icon sm">
                <Zap size={14} strokeWidth={2.5} />
              </div>
              <span className="ec-mobile-drawer-title">Menú</span>
              <button
                className="ec-mobile-close"
                onClick={() => setMobileOpen(false)}
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
            {visibleNav.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`ec-mobile-item ${page === item.id ? "active" : ""}`}
                  onClick={() => {
                    setPage(item.id);
                    setMobileOpen(false);
                  }}
                >
                  <Icon size={18} strokeWidth={2} />
                  {item.label}
                  {item.id === "cart" && cartCount > 0 && (
                    <span className="ec-mobile-badge">{cartCount}</span>
                  )}
                </button>
              );
            })}
            <div className="ec-mobile-divider" />
            <button className="ec-mobile-item theme" onClick={toggle}>
              {isDark ? (
                <Sun size={18} strokeWidth={2} />
              ) : (
                <Moon size={18} strokeWidth={2} />
              )}
              {isDark ? "Modo claro" : "Modo oscuro"}
            </button>
            <button
              className="ec-mobile-item danger"
              onClick={() => {
                logout();
                setMobileOpen(false);
              }}
            >
              <LogOut size={18} strokeWidth={2} />
              Cerrar sesión
>>>>>>> 7a936b07f48b43d7f5672176b09371ae9ab85c04
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
                          Cerrar Sesión
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

      {/* ══ PAGE CONTENT ══ */}
      <main className="ec-main">{children}</main>

      {/* ══ FOOTER ══ */}
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
              Tu marketplace de confianza. Productos de calidad, envíos rápidos
              y la mejor experiencia de compra en Colombia.
            </div>
          </div>
          <div className="ec-footer-links">
            <div className="ec-footer-col">
              <h4>Comprar</h4>
              {["Catálogo", "Ofertas", "Nuevos", "Más vendidos"].map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
            <div className="ec-footer-col">
              <h4>Mi cuenta</h4>
              {["Pedidos", "Pagos", "Envíos", "Favoritos"].map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
            <div className="ec-footer-col">
              <h4>Ayuda</h4>
              {["Centro de ayuda", "Devoluciones", "Contacto", "Términos"].map(
                (l) => (
                  <span key={l}>{l}</span>
                ),
              )}
            </div>
          </div>
          <div className="ec-footer-bottom">
            <div className="ec-footer-copy">
              © {new Date().getFullYear()} EcoMod · Todos los derechos
              reservados
            </div>
            <div className="ec-footer-payments">
              <span>💳 Visa</span>
              <span>💳 Mastercard</span>
              <span>💳 Amex</span>
              <span>💳 PayPal</span>
            </div>
          </div>
        </div>
<<<<<<< HEAD
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
                <span className="font-head text-xl font-bold">Menú</span>
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
                  Cerrar Sesión
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
                Plataforma de comercio electrónico moderno construido sobre una arquitectura de microservicios robusta y escalable.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Plataforma</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Catálogo</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Ofertas</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Categorías</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Centro de Ayuda</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Términos de Servicio</a></li>
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
=======
      </footer>

      {/* ══ STYLES ══ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Barlow+Condensed:wght@400;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .ec-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          font-family: 'Inter', sans-serif;
        }

        /* ── VARIABLES ── */
        .ec-root.light {
          --bg:       #f5f5f5;
          --surface:  #ffffff;
          --border:   #e5e7eb;
          --border2:  #d1d5db;
          --text:     #1a1a1a;
          --text2:    #4b5563;
          --text3:    #9ca3af;
          --primary:  #e8291c;
          --primary2: #c2200f;
          --orange:   #f97316;
          --strip-bg: #1a1a1a;
          --header-bg:#ffffff;
          --nav-bg:   #e8291c;
          --nav-text: #ffffff;
          --card-bg:  #ffffff;
          --hover-bg: #fff5f5;
          --shadow:   0 4px 12px rgba(0,0,0,.08);
          --shadow-lg:0 12px 40px rgba(0,0,0,.12);
        }
        .ec-root.dark {
          --bg:       #0f0f13;
          --surface:  #1c1c24;
          --border:   rgba(255,255,255,.08);
          --border2:  rgba(255,255,255,.14);
          --text:     #f0f0f5;
          --text2:    #a0a0b0;
          --text3:    #6b6b80;
          --primary:  #f43f5e;
          --primary2: #e11d48;
          --orange:   #fb923c;
          --strip-bg: #0a0a0d;
          --header-bg:#18181f;
          --nav-bg:   #1f1f28;
          --nav-text: #f0f0f5;
          --card-bg:  #1c1c24;
          --hover-bg: rgba(244,63,94,.06);
          --shadow:   0 4px 16px rgba(0,0,0,.4);
          --shadow-lg:0 12px 40px rgba(0,0,0,.5);
        }

        /* ── TOP STRIP ── */
        .ec-strip {
          background: var(--strip-bg);
          color: #fff;
          font-size: 11px;
          font-weight: 500;
          padding: 7px 0;
          letter-spacing: 0.02em;
        }
        .ec-strip-inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }
        .ec-strip-left, .ec-strip-right {
          display: flex;
          align-items: center;
          gap: 8px;
          opacity: .85;
        }
        .ec-strip-sep { opacity: .35; font-weight: 300; }

        /* ── HEADER ── */
        .ec-header {
          background: var(--header-bg);
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 200;
          box-shadow: 0 1px 8px rgba(0,0,0,.06);
        }
        .ec-root.dark .ec-header { box-shadow: 0 2px 16px rgba(0,0,0,.4); }
        .ec-header-inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          gap: 24px;
        }

        /* Logo */
        .ec-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          background: none;
          border: none;
          cursor: pointer;
          flex-shrink: 0;
          text-decoration: none;
          transition: transform 0.2s;
        }
        .ec-logo:hover { transform: scale(1.02); }
        .ec-logo-icon {
          width: 40px; height: 40px;
          background: linear-gradient(135deg, var(--primary), var(--orange));
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          box-shadow: 0 4px 12px rgba(232,41,28,.3);
        }
        .ec-logo-icon.sm { width: 28px; height: 28px; border-radius: 7px; }
        .ec-logo-text { font-family: 'Barlow Condensed', sans-serif; font-size: 28px; font-weight: 800; line-height: 1; letter-spacing: -0.5px; }
        .ec-logo-eco { color: var(--text); }
        .ec-logo-mod { color: var(--primary); }

        /* Search */
        .ec-search {
          flex: 1;
          display: flex;
          height: 46px;
          border: 2px solid var(--border);
          border-radius: 10px;
          overflow: hidden;
          transition: all .25s;
          max-width: 720px;
          background: var(--surface);
        }
        .ec-search.focused { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(232,41,28,.1); }
        .ec-search-cat {
          padding: 0 14px;
          background: var(--bg);
          border: none;
          border-right: 1px solid var(--border);
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: var(--text2);
          cursor: pointer;
          outline: none;
          white-space: nowrap;
        }
        .ec-search-input {
          flex: 1;
          padding: 0 18px;
          background: transparent;
          border: none;
          outline: none;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          color: var(--text);
        }
        .ec-search-input::placeholder { color: var(--text3); }
        .ec-search-btn {
          padding: 0 20px;
          background: var(--primary);
          border: none;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: background .2s;
        }
        .ec-search-btn:hover { background: var(--primary2); }

        /* Actions */
        .ec-header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .ec-action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 6px 12px;
          background: none;
          border: none;
          cursor: pointer;
          border-radius: 10px;
          transition: all .15s;
          color: var(--text);
          position: relative;
        }
        .ec-action-btn:hover { background: var(--hover-bg); color: var(--primary); }
        .ec-action-icon { position: relative; }
        .ec-badge {
          position: absolute;
          top: -6px; right: -8px;
          min-width: 18px; height: 18px;
          background: var(--primary);
          color: #fff;
          font-size: 10px;
          font-weight: 900;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          border: 2px solid var(--header-bg);
        }
        .ec-badge-pulse { animation: pulse 2s infinite; }
        .ec-badge-dot {
          width: 8px; height: 8px;
          min-width: 8px;
          padding: 0;
          top: -2px; right: -2px;
        }
        .ec-action-label { font-size: 10px; font-weight: 600; color: var(--text2); margin-top: 1px; }
        .ec-action-btn:hover .ec-action-label { color: var(--primary); }

        /* User menu */
        .ec-user-menu { position: relative; }
        .ec-user-trigger {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 12px;
          background: none;
          border: none;
          cursor: pointer;
          border-radius: 10px;
          color: var(--text);
          transition: background .15s;
        }
        .ec-user-trigger:hover { background: var(--hover-bg); }
        .ec-user-avatar {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, var(--primary), var(--orange));
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
          color: #fff;
          flex-shrink: 0;
        }
        .ec-user-info { display: flex; flex-direction: column; text-align: left; }
        .ec-user-greeting { font-size: 10px; color: var(--text3); line-height: 1; font-weight: 500; }
        .ec-user-name { font-size: 13px; font-weight: 700; color: var(--text); line-height: 1.3; }
        .ec-chevron { color: var(--text3); transition: transform .2s; }
        .ec-chevron.open { transform: rotate(180deg); }

        /* Dropdown */
        .ec-user-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 260px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          animation: dropIn .2s ease;
          z-index: 300;
        }
        @keyframes dropIn { from{opacity:0;transform:translateY(-10px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .ec-dropdown-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px;
          background: linear-gradient(135deg, rgba(232,41,28,.06), rgba(249,115,22,.04));
        }
        .ec-dropdown-avatar {
          width: 44px; height: 44px;
          background: linear-gradient(135deg, var(--primary), var(--orange));
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 18px;
          color: #fff;
          flex-shrink: 0;
        }
        .ec-dropdown-name { font-size: 14px; font-weight: 700; color: var(--text); }
        .ec-dropdown-email { font-size: 11px; color: var(--text3); margin-top: 2px; }
        .ec-dropdown-role {
          display: inline-block;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .08em;
          padding: 2px 8px;
          background: rgba(232,41,28,.1);
          color: var(--primary);
          border-radius: 20px;
          margin-top: 5px;
          text-transform: uppercase;
        }
        .ec-dropdown-divider { height: 1px; background: var(--border); margin: 4px 0; }
        .ec-dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 11px 18px;
          background: none;
          border: none;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: var(--text2);
          cursor: pointer;
          transition: all .15s;
          text-align: left;
        }
        .ec-dropdown-item:hover { background: var(--hover-bg); color: var(--primary); }
        .ec-dropdown-item.theme:hover { color: var(--orange); }
        .ec-dropdown-item.danger { color: #ef4444; }
        .ec-dropdown-item.danger:hover { background: rgba(239,68,68,.06); }

        /* ── NAV BAR ── */
        .ec-nav {
          background: var(--nav-bg);
          position: sticky;
          top: 74px;
          z-index: 190;
        }
        .ec-nav-inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          overflow-x: auto;
          scrollbar-width: none;
          gap: 2px;
        }
        .ec-nav-inner::-webkit-scrollbar { display: none; }
        .ec-nav-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: none;
          border: none;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: var(--nav-text);
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all .2s;
          white-space: nowrap;
          opacity: .88;
          position: relative;
        }
        .ec-nav-item:hover { opacity: 1; background: rgba(255,255,255,.1); }
        .ec-nav-item.active { opacity: 1; border-bottom-color: #fff; background: rgba(255,255,255,.15); }
        .ec-root.dark .ec-nav-item.active { border-bottom-color: var(--primary); background: rgba(244,63,94,.1); color: var(--primary); }
        
        .ec-nav-badge {
          background: #fff;
          color: var(--primary);
          font-size: 9px;
          font-weight: 900;
          padding: 1px 5px;
          border-radius: 10px;
          margin-left: 2px;
        }
        
        .ec-nav-spacer { flex: 1; }
        .ec-gateway {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 700;
          color: var(--nav-text);
          opacity: .5;
          padding: 0 8px;
          white-space: nowrap;
        }
        .ec-gateway-dot {
          width: 6px; height: 6px;
          background: #4ade80;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        .ec-gateway-port { opacity: .7; }

        /* ── MOBILE ── */
        .ec-mobile-toggle {
          display: none;
          background: none;
          border: none;
          color: var(--text);
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          transition: background .15s;
        }
        .ec-mobile-toggle:hover { background: var(--hover-bg); }
        .ec-mobile-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: var(--overlay);
          z-index: 400;
          backdrop-filter: blur(4px);
        }
        .ec-mobile-drawer {
          display: none;
          position: fixed;
          top: 0; right: 0; bottom: 0;
          width: 300px;
          background: var(--surface);
          z-index: 500;
          flex-direction: column;
          overflow-y: auto;
          box-shadow: var(--shadow-lg);
          animation: slideInRight .25s ease;
        }
        @keyframes slideInRight { from{transform:translateX(100%)} to{transform:translateX(0)} }
        .ec-mobile-drawer-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }
        .ec-mobile-drawer-title { font-size: 18px; font-weight: 800; color: var(--text); flex: 1; }
        .ec-mobile-close {
          background: none;
          border: none;
          color: var(--text3);
          cursor: pointer;
          padding: 4px;
          border-radius: 8px;
          transition: all .15s;
        }
        .ec-mobile-close:hover { background: var(--hover-bg); color: var(--primary); }
        .ec-mobile-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 24px;
          background: none;
          border: none;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: var(--text);
          cursor: pointer;
          border-bottom: 1px solid var(--border);
          transition: all .15s;
          text-align: left;
          position: relative;
        }
        .ec-mobile-item:hover, .ec-mobile-item.active { color: var(--primary); background: var(--hover-bg); }
        .ec-mobile-item.danger { color: #ef4444; }
        .ec-mobile-badge {
          margin-left: auto;
          background: var(--primary);
          color: #fff;
          font-size: 10px;
          font-weight: 900;
          padding: 2px 7px;
          border-radius: 10px;
        }
        .ec-mobile-divider { height: 8px; background: var(--bg); border-bottom: 1px solid var(--border); }

        /* ── MAIN ── */
        .ec-main {
          flex: 1;
          background: var(--bg);
          max-width: 1400px;
          width: 100%;
          margin: 0 auto;
          padding: 24px;
          animation: fadeUp .35s ease;
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

        /* ── FOOTER ── */
        .ec-footer {
          background: var(--surface);
          border-top: 1px solid var(--border);
          padding: 40px 0 20px;
          margin-top: auto;
        }
        .ec-footer-inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .ec-footer-top {
          display: flex;
          gap: 48px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }
        .ec-footer-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: var(--text);
          margin-bottom: 8px;
        }
        .ec-footer-desc {
          font-size: 13px;
          color: var(--text3);
          max-width: 300px;
          line-height: 1.6;
        }
        .ec-footer-links {
          display: flex;
          gap: 48px;
          flex: 1;
          flex-wrap: wrap;
        }
        .ec-footer-col {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ec-footer-col h4 {
          font-size: 13px;
          font-weight: 800;
          color: var(--text);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }
        .ec-footer-col span {
          font-size: 13px;
          color: var(--text3);
          cursor: pointer;
          transition: color .15s;
        }
        .ec-footer-col span:hover { color: var(--primary); }
        .ec-footer-bottom {
          border-top: 1px solid var(--border);
          padding-top: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        .ec-footer-copy { font-size: 12px; color: var(--text3); }
        .ec-footer-payments {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: var(--text3);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .ec-search { max-width: 500px; }
        }
        @media (max-width: 900px) {
          .hide-mobile { display: none !important; }
          .ec-search { display: none; }
          .ec-nav { display: none; }
          .ec-mobile-toggle { display: flex; }
          .ec-mobile-overlay { display: block; }
          .ec-mobile-drawer { display: flex; }
          .ec-strip-right { display: none; }
          .ec-main { padding: 16px; }
          .ec-footer-top { flex-direction: column; gap: 24px; }
          .ec-footer-links { gap: 32px; }
        }
        @media (max-width: 600px) {
          .ec-header-inner { padding: 10px 16px; gap: 12px; }
          .ec-logo-text { font-size: 22px; }
          .ec-logo-icon { width: 34px; height: 34px; }
          .ec-action-btn { padding: 4px 8px; }
          .ec-action-label { display: none; }
          .ec-user-info { display: none; }
          .ec-chevron { display: none; }
          .ec-strip-inner { justify-content: center; }
          .ec-footer-bottom { flex-direction: column; text-align: center; }
        }
      `}</style>
>>>>>>> 7a936b07f48b43d7f5672176b09371ae9ab85c04
    </div>
  );
}
