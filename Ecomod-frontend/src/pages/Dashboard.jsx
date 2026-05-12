import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../App";
import { useCart } from "../App";
import { catalogApi, ordersApi, cartApi } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, Package, ClipboardList, CreditCard, DollarSign,
  Truck, CheckCircle, Clock, ArrowRight, Star, Eye, Zap, Tag,
  ChevronRight, Award, RefreshCw, Box, ShoppingBag, Plus, Minus,
  Heart, Share2, Sparkles, X, AlertCircle, Timer, Flame,
} from "lucide-react";
import { cn } from "../lib/utils";

const formatCOP = (n) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(n);

const STATUS_MAP = {
  confirmed: { label: "Confirmado", color: "text-green-600", bg: "bg-green-600/10", icon: CheckCircle },
  completed: { label: "Completado", color: "text-green-600", bg: "bg-green-600/10", icon: CheckCircle },
  pending: { label: "Pendiente", color: "text-amber-500", bg: "bg-amber-500/10", icon: Clock },
  shipped: { label: "Enviado", color: "text-blue-500", bg: "bg-blue-500/10", icon: Truck },
  cancelled: { label: "Cancelado", color: "text-red-500", bg: "bg-red-500/10", icon: AlertCircle },
};

// ─── Flash Sale Countdown ─────────────────────────────────────────────────────
function useCountdown(targetHours = 6) {
  const [time, setTime] = useState({ h: targetHours, m: 0, s: 0 });
  useEffect(() => {
    const end = Date.now() + targetHours * 3600 * 1000;
    const tick = setInterval(() => {
      const diff = Math.max(0, end - Date.now());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime({ h, m, s });
    }, 1000);
    return () => clearInterval(tick);
  }, []);
  return time;
}

function CountdownBlock({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center font-head font-black text-2xl text-white border border-white/30">
        {String(value).padStart(2, "0")}
      </div>
      <span className="text-[9px] font-black text-white/60 uppercase tracking-widest mt-1">{label}</span>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard({ setPage, setInitialCategory }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { updateCartCount } = useCart();

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState({});
  const [heroBanner, setHeroBanner] = useState(0);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddProduct, setQuickAddProduct] = useState(null);
  const [quickAddQty, setQuickAddQty] = useState(1);
  const [likedProducts, setLikedProducts] = useState(new Set());

  const countdown = useCountdown(6);

  useEffect(() => {
    load();
    const t = setInterval(() => setHeroBanner((b) => (b + 1) % 3), 5000);
    return () => clearInterval(t);
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [prods, ords, cart] = await Promise.all([
        catalogApi.getProducts(),
        ordersApi.getByUser(user?.id),
        cartApi.getByUser(user?.id).catch(() => null),
      ]);
      setProducts(prods?.slice(0, 8) || []);
      setOrders(ords?.slice(0, 5) || []);
      if (cart?.items) {
        updateCartCount(
          cart.items.reduce((s, i) => s + (parseInt(i.quantity) || 1), 0)
        );
      }
    } catch {
      addToast("error", "Error", "No se pudieron cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  // Consistent with CatalogPage's handleAddToCart (handles auth users)
  const handleAddToCart = async (product, qty = 1) => {
    const pid = product.id;
    setAddingToCart((prev) => ({ ...prev, [pid]: true }));
    try {
      let cart;
      try {
        cart = await cartApi.getByUser(user?.id);
      } catch {
        cart = await cartApi.create({ user_id: user?.id });
      }
      await cartApi.addItem(cart.id, {
        product_id: pid,
        quantity: qty,
        unit_price: product.price || 0,
        product_name: product.name || "",
      });
      const updated = await cartApi.getByUser(user?.id);
      updateCartCount(
        updated.items?.reduce((s, i) => s + (parseInt(i.quantity) || 1), 0) || 0
      );
      addToast("success", "¡Agregado!", `"${product.name}" añadido al carrito`);
      setQuickAddOpen(false);
      setQuickAddQty(1);
    } catch {
      addToast("error", "Error", "No se pudo agregar al carrito");
    } finally {
      setAddingToCart((prev) => ({ ...prev, [pid]: false }));
    }
  };

  // Navigate to catalog with a category pre-selected
  const goToCatalogCategory = (categoryId) => {
    if (setInitialCategory) setInitialCategory(String(categoryId));
    setPage("catalog");
  };

  const toggleLike = (id) =>
    setLikedProducts((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // ── Data ──────────────────────────────────────────────────────────────────
  const lastOrder = orders[0];
  const lastStatus = lastOrder ? STATUS_MAP[lastOrder.status] || STATUS_MAP.pending : null;
  const totalSpent = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const activeOrders = orders.filter((o) => !["completed", "cancelled"].includes(o.status)).length;

  const banners = [
    {
      title: "Especial de Mascotas",
      sub: "Todo lo que tus mejores amigos necesitan.",
      cta: "Ver ofertas",
      from: "from-orange-500",
      to: "to-red-600",
      Icon: Zap,
      tag: "TEMPORADA",
      image: "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?q=80&w=2070&auto=format&fit=crop",
    },
    {
      title: "Renueva tu Hogar",
      sub: "Las mejores herramientas para tus proyectos.",
      cta: "Comprar ahora",
      from: "from-blue-600",
      to: "to-indigo-700",
      Icon: Truck,
      tag: "PROYECTOS",
      image: "https://images.unsplash.com/photo-1581141849291-1125c7b692b5?q=80&w=2070&auto=format&fit=crop",
    },
    {
      title: "Electrohogar & Tech",
      sub: "Lo último en tecnología para tu vida.",
      cta: "Explorar",
      from: "from-emerald-600",
      to: "to-teal-500",
      Icon: Sparkles,
      tag: "NUEVO",
      image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=2001&auto=format&fit=crop",
    },
  ];

  // Categories with real IDs from catalog — fallback to slug-based navigation
  const categories = [
    { name: "Tecnología", Icon: Zap, color: "text-blue-600", bg: "bg-blue-500/10", img: "https://images.unsplash.com/photo-1526738549149-8e07eca2c1cf?q=80&w=150&auto=format&fit=crop", slug: "tecnologia" },
    { name: "Muebles", Icon: Box, color: "text-amber-700", bg: "bg-amber-500/10", img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=150&auto=format&fit=crop", slug: "muebles" },
    { name: "Herramientas", Icon: Tag, color: "text-red-600", bg: "bg-red-500/10", img: "https://images.unsplash.com/photo-1581141849291-1125c7b692b5?q=80&w=150&auto=format&fit=crop", slug: "herramientas" },
    { name: "Jardín", Icon: Award, color: "text-emerald-600", bg: "bg-emerald-500/10", img: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=150&auto=format&fit=crop", slug: "jardin" },
    { name: "Cocinas", Icon: Package, color: "text-orange-600", bg: "bg-orange-500/10", img: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=150&auto=format&fit=crop", slug: "cocinas" },
    { name: "Mascotas", Icon: Star, color: "text-blue-500", bg: "bg-blue-500/10", img: "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?q=80&w=150&auto=format&fit=crop", slug: "mascotas" },
  ];

  // Flash sale products: top 4 by price descending (highest value = featured deal)
  const flashProducts = [...products].sort((a, b) => b.price - a.price).slice(0, 4);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Cargando tu tienda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16">

      {/* ── HERO BANNER ──────────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden h-[420px] md:h-[480px] shadow-2xl group">
        {banners.map((b, i) => {
          const linkedProduct = products[i % products.length];
          return (
            <div
              key={i}
              className={cn(
                "absolute inset-0 flex items-center transition-all duration-1000 ease-in-out",
                i === heroBanner ? "opacity-100 scale-100 z-10" : "opacity-0 scale-105 z-0 pointer-events-none"
              )}
              style={b.image ? { backgroundImage: `url(${b.image})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
            >
              {b.image && <div className="absolute inset-0 bg-black/30" />}
              <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-12 -translate-y-12" />

              <div className="container mx-auto px-8 md:px-16 flex flex-col md:flex-row items-center justify-between gap-12 relative z-20">
                <div className="max-w-xl text-white text-center md:text-left">
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={i === heroBanner ? { opacity: 1, y: 0 } : {}}
                    className="inline-block px-4 py-1.5 mb-5 text-xs font-black tracking-[0.2em] uppercase bg-white/20 backdrop-blur-xl border border-white/30 rounded-full"
                  >
                    {b.tag}
                  </motion.span>
                  <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    animate={i === heroBanner ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.1 }}
                    className="text-5xl md:text-6xl font-head font-black mb-5 leading-[0.95] tracking-tighter"
                  >
                    {b.title}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={i === heroBanner ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.2 }}
                    className="text-white/80 mb-8 text-lg font-medium max-w-md mx-auto md:mx-0"
                  >
                    {b.sub}
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={i === heroBanner ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 0.3 }}
                  >
                    <button
                      onClick={() => setPage("catalog")}
                      className="group/btn flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-black hover:bg-black hover:text-white transition-all shadow-xl hover:shadow-2xl active:scale-95"
                    >
                      {b.cta}
                      <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, x: 50, rotate: 5 }}
                  animate={i === heroBanner ? { opacity: 1, x: 0, rotate: 0 } : {}}
                  transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                  className="hidden md:block relative"
                >
                  <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full scale-150 animate-pulse" />
                  <div className="relative w-[280px] h-[280px] bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                    {linkedProduct?.image_urls?.[0] ? (
                      <img src={linkedProduct.image_urls[0]} alt="" className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" />
                    ) : (
                      <b.Icon className="w-full h-full text-white/40 p-12" />
                    )}
                    {linkedProduct && (
                      <div className="absolute -bottom-5 -right-5 bg-white p-3 rounded-2xl shadow-2xl text-black">
                        <p className="text-[9px] font-black uppercase tracking-wider opacity-50">Desde</p>
                        <p className="text-lg font-black text-primary">{formatCOP(linkedProduct.price)}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          );
        })}

        {/* Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroBanner(i)}
              className={cn("h-2 rounded-full transition-all duration-500", i === heroBanner ? "w-10 bg-white" : "w-2 bg-white/30 hover:bg-white/50")}
            />
          ))}
        </div>
      </div>

      {/* ── TRUST BADGES ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Truck, title: "Envío Rápido", desc: "A todo el país en 24/48h", color: "text-blue-500" },
          { icon: CheckCircle, title: "Compra Segura", desc: "Garantía de satisfacción total", color: "text-green-500" },
          { icon: CreditCard, title: "Pagos Flexibles", desc: "TC, Débito, PSE y Efectivo", color: "text-purple-500" },
          { icon: Star, title: "Soporte 24/7", desc: "Expertos siempre para ti", color: "text-amber-500" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-2xl border border-border/40 bg-card/40">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-secondary/50", item.color)}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-xs uppercase tracking-tight leading-none mb-0.5">{item.title}</h4>
              <p className="text-[11px] text-muted-foreground font-medium">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── MI ACTIVIDAD ─────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-5 px-1">
          <h3 className="text-xl font-head font-black">Mi actividad</h3>
          <button onClick={() => setPage("orders")} className="text-sm font-black text-primary hover:underline flex items-center gap-1 uppercase tracking-wider">
            Ver pedidos <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Stat: Total gastado */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
            className="p-5 rounded-2xl border border-border/30 bg-card flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Total en compras</p>
              <p className="text-xl font-black">{formatCOP(totalSpent)}</p>
            </div>
          </motion.div>

          {/* Stat: Pedidos activos */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
            className="p-5 rounded-2xl border border-border/30 bg-card flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-500">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Pedidos activos</p>
              <p className="text-xl font-black">{activeOrders}</p>
            </div>
          </motion.div>

          {/* Último pedido con estado real */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
            onClick={() => setPage("orders")}
            className="p-5 rounded-2xl border border-border/30 bg-card flex items-center gap-4 cursor-pointer hover:border-primary/40 transition-colors">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-500">
              {lastStatus ? <lastStatus.icon className="w-6 h-6" /> : <ShoppingBag className="w-6 h-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Último pedido</p>
              {lastOrder ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-sm font-black truncate">{formatCOP(lastOrder.total_amount)}</p>
                  <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full", lastStatus?.color, lastStatus?.bg)}>
                    {lastStatus?.label}
                  </span>
                </div>
              ) : (
                <p className="text-sm font-medium text-muted-foreground">Sin pedidos aún</p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </motion.div>
        </div>
      </div>

      {/* ── CATEGORÍAS ───────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-5 px-1">
          <h3 className="text-xl font-head font-black">Categorías</h3>
          <button onClick={() => setPage("catalog")} className="text-sm font-black text-primary hover:underline flex items-center gap-1 uppercase tracking-wider">
            Ver todo <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto no-scrollbar pb-2">
          <div className="flex gap-3 min-w-max px-1">
            {categories.map((c, i) => (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => goToCatalogCategory(c.slug)}
                key={c.name}
                className="flex flex-col items-center gap-2.5 group"
              >
                <div className="w-20 h-20 rounded-full border-2 border-border/40 bg-white flex items-center justify-center transition-all duration-300 group-hover:border-primary group-hover:shadow-xl group-hover:shadow-primary/10 group-hover:-translate-y-1 relative overflow-hidden shadow-sm">
                  {c.img ? (
                    <img src={c.img} alt={c.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  ) : (
                    <>
                      <div className={cn("absolute inset-2 rounded-full opacity-20", c.bg)} />
                      <c.Icon className={cn("w-9 h-9 relative z-10 transition-transform group-hover:scale-110", c.color)} />
                    </>
                  )}
                </div>
                <span className="text-[11px] font-black text-center leading-tight uppercase tracking-tight group-hover:text-primary transition-colors w-20">{c.name}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* ── FLASH SALE ───────────────────────────────────────────────────────── */}
      {flashProducts.length > 0 && (
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-red-600 to-orange-500 p-6 md:p-8">
          {/* Background texture */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-[-20%] right-[-5%] w-[50%] h-[140%] bg-white rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-head font-black text-white tracking-tight">Ofertas del Día</h3>
                  <p className="text-white/70 text-xs font-bold">Precios especiales por tiempo limitado</p>
                </div>
              </div>

              {/* Countdown */}
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-white/60" />
                <span className="text-white/60 text-xs font-black uppercase tracking-widest mr-1">Termina en</span>
                <div className="flex items-center gap-1.5">
                  <CountdownBlock value={countdown.h} label="hrs" />
                  <span className="text-white font-black text-xl mb-3">:</span>
                  <CountdownBlock value={countdown.m} label="min" />
                  <span className="text-white font-black text-xl mb-3">:</span>
                  <CountdownBlock value={countdown.s} label="seg" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {flashProducts.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 flex flex-col gap-2 group hover:bg-white transition-colors"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-secondary/30 flex items-center justify-center relative">
                    {p.image_urls?.[0] ? (
                      <img src={p.image_urls[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <Package className="w-10 h-10 text-muted-foreground/30" />
                    )}
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">OFERTA</span>
                  </div>
                  <p className="text-xs font-black text-foreground line-clamp-1" title={p.name}>{p.name}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-base font-black text-primary">{formatCOP(p.price)}</span>
                    <button
                      onClick={() => handleAddToCart(p)}
                      disabled={addingToCart[p.id]}
                      className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-red-700 transition-colors active:scale-90"
                    >
                      {addingToCart[p.id]
                        ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        : <Plus className="w-3.5 h-3.5" strokeWidth={3} />}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PRODUCTOS DESTACADOS ──────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-6 px-1">
          <div>
            <h3 className="text-2xl font-head font-black flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-500" /> Selección Destacada
            </h3>
            <p className="text-sm text-muted-foreground font-medium">Los favoritos de nuestra comunidad</p>
          </div>
          <button
            onClick={() => setPage("catalog")}
            className="group flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border hover:border-primary hover:text-primary transition-all font-black text-xs uppercase tracking-wider"
          >
            Ver catálogo <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-secondary/20 rounded-3xl border-2 border-dashed border-border/50">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h4 className="text-xl font-black opacity-50">Próximamente más productos</h4>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((p, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={p.id}
                className="group relative bg-card rounded-[2rem] p-4 border border-border/40 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5"
              >
                <div className="aspect-[4/5] bg-secondary/30 rounded-[1.5rem] relative overflow-hidden flex items-center justify-center p-6 mb-4 transition-colors group-hover:bg-primary/5">
                  {p.image_urls?.[0] ? (
                    <img
                      src={p.image_urls[0]}
                      alt={p.name}
                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <Package className="w-16 h-16 text-muted-foreground/20" />
                  )}

                  {/* Badge */}
                  {i % 3 === 0 && (
                    <span className="absolute top-3 left-3 bg-primary text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-lg shadow-primary/20 z-10">POPULAR</span>
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 rounded-[1.5rem]">
                    <button
                      onClick={() => setPage("catalog")}
                      className="w-11 h-11 bg-white text-black rounded-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all scale-75 group-hover:scale-100 duration-300 shadow-xl"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleLike(p.id)}
                      className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center transition-all scale-75 group-hover:scale-100 duration-300 shadow-xl delay-75",
                        likedProducts.has(p.id) ? "bg-red-100 text-red-500" : "bg-white text-black hover:bg-red-50 hover:text-red-400"
                      )}
                    >
                      <Heart className="w-4 h-4" fill={likedProducts.has(p.id) ? "currentColor" : "none"} />
                    </button>
                    <button
                      onClick={() => { setQuickAddProduct(p); setQuickAddOpen(true); }}
                      className="w-11 h-11 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-black transition-all scale-75 group-hover:scale-100 duration-300 shadow-xl delay-100"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="px-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                    {p.category_name || "General"}
                  </p>
                  <h4 className="font-black text-sm line-clamp-1 mb-2 group-hover:text-primary transition-colors" title={p.name}>
                    {p.name}
                  </h4>

                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={cn("w-3 h-3", s <= 4 ? "text-amber-500 fill-amber-500" : "text-border fill-border")} />
                    ))}
                    <span className="text-[10px] font-bold text-muted-foreground ml-1">(4.8)</span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/40">
                    <span className="text-base font-black">{formatCOP(p.price)}</span>
                    <button
                      onClick={() => handleAddToCart(p)}
                      disabled={addingToCart[p.id]}
                      className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center hover:bg-primary hover:text-white transition-all active:scale-90 shadow-md"
                    >
                      {addingToCart[p.id]
                        ? <RefreshCw className="w-4 h-4 animate-spin" />
                        : <Plus className="w-4 h-4" strokeWidth={3} />}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── NEWSLETTER ───────────────────────────────────────────────────────── */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-foreground text-background p-10 md:p-16 text-center shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[80%] bg-primary rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[80%] bg-blue-500 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-head font-black mb-4 tracking-tighter leading-none">
            Únete al club de beneficios EcoMod
          </h3>
          <p className="text-background/60 mb-8 text-base font-medium">
            Recibe ofertas exclusivas, preventas y lanzamientos antes que nadie.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Tu mejor correo electrónico"
              className="flex-1 px-5 py-3.5 rounded-xl bg-background/10 border border-background/20 text-background placeholder:text-background/40 focus:bg-background/20 focus:outline-none transition-all"
            />
            <button
              onClick={() => addToast("success", "¡Suscrito!", "Te avisaremos las mejores ofertas")}
              className="px-7 py-3.5 bg-primary text-white rounded-xl font-black hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 whitespace-nowrap"
            >
              Suscribirme
            </button>
          </div>
          <p className="mt-5 text-[10px] font-bold text-background/30 uppercase tracking-[0.2em]">
            Al suscribirte aceptas nuestros términos y condiciones
          </p>
        </div>
      </div>

      {/* ── QUICK ADD MODAL ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {quickAddOpen && quickAddProduct && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-sm rounded-3xl shadow-2xl border border-border overflow-hidden"
            >
              <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/30">
                <h3 className="font-bold">Agregar al carrito</h3>
                <button onClick={() => { setQuickAddOpen(false); setQuickAddQty(1); }} className="p-1 hover:bg-secondary rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 rounded-xl bg-secondary/50 flex items-center justify-center p-2 flex-shrink-0">
                    {quickAddProduct.image_urls?.[0]
                      ? <img src={quickAddProduct.image_urls[0]} alt="" className="w-full h-full object-contain" />
                      : <Package className="w-8 h-8 text-muted-foreground/30" />}
                  </div>
                  <div>
                    <h4 className="font-bold leading-tight">{quickAddProduct.name}</h4>
                    <p className="text-primary font-black text-lg mt-1">{formatCOP(quickAddProduct.price)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6 p-4 rounded-xl bg-secondary/50">
                  <span className="font-bold text-sm">Cantidad</span>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setQuickAddQty(Math.max(1, quickAddQty - 1))} className="w-8 h-8 rounded-full bg-background border flex items-center justify-center hover:border-primary transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-black w-5 text-center">{quickAddQty}</span>
                    <button onClick={() => setQuickAddQty(quickAddQty + 1)} className="w-8 h-8 rounded-full bg-background border flex items-center justify-center hover:border-primary transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => handleAddToCart(quickAddProduct, quickAddQty)}
                  disabled={addingToCart[quickAddProduct.id]}
                  className="w-full py-3.5 rounded-xl bg-primary text-white font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {addingToCart[quickAddProduct.id]
                    ? <RefreshCw className="w-4 h-4 animate-spin" />
                    : <><ShoppingCart className="w-5 h-5" /> Agregar {quickAddQty} por {formatCOP(quickAddProduct.price * quickAddQty)}</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}