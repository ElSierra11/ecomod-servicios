import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../App";
import { useCart } from "../App";
import { catalogApi, ordersApi, cartApi } from "../services/api";
import { motion } from "framer-motion";
import {
  ShoppingCart, Package, ClipboardList, CreditCard, DollarSign,
  Truck, CheckCircle, Clock, ArrowRight, Star, Eye, Zap, Tag,
  ChevronRight, Flame, Award, RefreshCw, Box, ShoppingBag, Plus, Minus,
  Heart, Share2, Grid3X3, Sparkles, X
} from "lucide-react";
import { cn } from "../lib/utils";

const formatCOP = (n) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

const STATUS_MAP = {
  confirmed: { label: "Confirmado", color: "text-green-600", bg: "bg-green-600/10" },
  completed: { label: "Completado", color: "text-green-600", bg: "bg-green-600/10" },
  pending: { label: "Pendiente", color: "text-amber-500", bg: "bg-amber-500/10" },
  shipped: { label: "Enviado", color: "text-blue-500", bg: "bg-blue-500/10" },
  cancelled: { label: "Cancelado", color: "text-red-500", bg: "bg-red-500/10" },
};

export default function Dashboard({ setPage }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { updateCartCount } = useCart();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState({});
  const [stats, setStats] = useState({ sales: 0, orders: 0, products: 0, avgTicket: 0 });
  const [heroBanner, setHeroBanner] = useState(0);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddProduct, setQuickAddProduct] = useState(null);
  const [quickAddQty, setQuickAddQty] = useState(1);

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
      const sales = ords?.reduce((s, o) => s + (o.total_amount || 0), 0) || 0;
      setStats({
        sales,
        orders: ords?.length || 0,
        products: prods?.length || 0,
        avgTicket: ords?.length ? Math.round(sales / ords.length) : 0,
      });
      if (cart?.items) {
        updateCartCount(cart.items.reduce((s, i) => s + (parseInt(i.quantity) || 1), 0));
      }
    } catch (e) {
      addToast("error", "Error", "No se pudieron cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product, qty = 1) => {
    const pid = product.id;
    setAddingToCart((prev) => ({ ...prev, [pid]: true }));
    try {
      let cart = await cartApi.getByUser(user?.id).catch(() => cartApi.create({ user_id: user?.id }));
      await cartApi.addItem(cart.id, { product_id: pid, quantity: qty, unit_price: product.price || 0, product_name: product.name || "" });
      const updatedCart = await cartApi.getByUser(user?.id);
      updateCartCount(updatedCart.items?.reduce((s, i) => s + (parseInt(i.quantity) || 1), 0) || 0);
      addToast("success", "¡Agregado!", `"${product.name}" añadido al carrito`);
      setQuickAddOpen(false);
    } catch (e) {
      addToast("error", "Error", "No se pudo agregar al carrito");
    } finally {
      setAddingToCart((prev) => ({ ...prev, [pid]: false }));
    }
  };

  const banners = [
    { 
      title: "Especial de Mascotas", 
      sub: "Todo lo que tus mejores amigos necesitan con precios increíbles.", 
      cta: "Ver ofertas", 
      from: "from-orange-500", 
      to: "to-red-600", 
      Icon: Zap, 
      tag: "TEMPORADA",
      image: "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?q=80&w=2070&auto=format&fit=crop" // Professional pet image
    },
    { 
      title: "Renueva tu Hogar", 
      sub: "Las mejores herramientas para tus proyectos de este año.", 
      cta: "Comprar ahora", 
      from: "from-blue-600", 
      to: "to-indigo-700", 
      Icon: Truck, 
      tag: "PROYECTOS",
      image: "https://images.unsplash.com/photo-1581141849291-1125c7b692b5?q=80&w=2070&auto=format&fit=crop" // Professional tools image
    },
    { 
      title: "Electrohogar & Tech", 
      sub: "Lo último en tecnología para hacer tu vida más fácil.", 
      cta: "Explorar", 
      from: "from-emerald-600", 
      to: "to-teal-500", 
      Icon: Sparkles, 
      tag: "NUEVO",
      image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=2001&auto=format&fit=crop" // Professional tech image
    },
  ];

  const categories = [
    { name: "Tecnología", Icon: Zap, color: "text-blue-600", bg: "bg-blue-500/10", img: "https://images.unsplash.com/photo-1526738549149-8e07eca2c1cf?q=80&w=150&auto=format&fit=crop" },
    { name: "Muebles", Icon: Box, color: "text-amber-700", bg: "bg-amber-500/10", img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=150&auto=format&fit=crop" },
    { name: "Herramientas", Icon: Tag, color: "text-red-600", bg: "bg-red-500/10", img: "https://images.unsplash.com/photo-1581141849291-1125c7b692b5?q=80&w=150&auto=format&fit=crop" },
    { name: "Jardín", Icon: Award, color: "text-emerald-600", bg: "bg-emerald-500/10", img: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=150&auto=format&fit=crop" },
    { name: "Cocinas", Icon: Package, color: "text-orange-600", bg: "bg-orange-500/10", img: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=150&auto=format&fit=crop" },
    { name: "Mascotas", Icon: Star, color: "text-blue-500", bg: "bg-blue-500/10", img: "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?q=80&w=150&auto=format&fit=crop" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Cargando tu tienda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      
      {/* HERO BANNER - HOMECENTER STYLE */}
      <div className="relative rounded-3xl overflow-hidden h-[450px] md:h-[500px] shadow-2xl group">
        {banners.map((b, i) => {
          // Pair banner with a real product if available
          const linkedProduct = products[i % products.length];
          return (
            <div
              key={i}
              className={cn(
                "absolute inset-0 flex items-center transition-all duration-1000 ease-in-out",
                b.image ? "" : `bg-gradient-to-br ${b.from} ${b.to}`,
                i === heroBanner ? "opacity-100 scale-100 z-10" : "opacity-0 scale-105 z-0 pointer-events-none"
              )}
              style={b.image ? { 
                backgroundImage: `url(${b.image})`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center' 
              } : {}}
            >
              {/* Overlay for readability if image is present */}
              {b.image && <div className="absolute inset-0 bg-black/20" />}
              {/* Abstract decorative elements */}
              <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-12 -translate-y-12" />
              <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-black/5 rounded-full blur-3xl" />
              
              <div className="container mx-auto px-8 md:px-16 flex flex-col md:flex-row items-center justify-between gap-12 relative z-20">
                <div className="max-w-xl text-white text-center md:text-left">
                  <motion.span 
                    initial={{ opacity: 0, y: 20 }}
                    animate={i === heroBanner ? { opacity: 1, y: 0 } : {}}
                    className="inline-block px-4 py-1.5 mb-6 text-xs font-black tracking-[0.2em] uppercase bg-white/20 backdrop-blur-xl border border-white/30 rounded-full"
                  >
                    {b.tag}
                  </motion.span>
                  <motion.h2 
                    initial={{ opacity: 0, y: 30 }}
                    animate={i === heroBanner ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.1 }}
                    className="text-5xl md:text-7xl font-head font-black mb-6 leading-[0.95] tracking-tighter"
                  >
                    {b.title}
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={i === heroBanner ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.2 }}
                    className="text-white/80 mb-10 text-xl font-medium max-w-md mx-auto md:mx-0"
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
                      {b.cta} <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                </div>

                {/* Product Image in Banner */}
                <motion.div 
                  initial={{ opacity: 0, x: 50, rotate: 5 }}
                  animate={i === heroBanner ? { opacity: 1, x: 0, rotate: 0 } : {}}
                  transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                  className="hidden md:block relative"
                >
                  <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full scale-150 animate-pulse" />
                  <div className="relative w-[320px] h-[320px] bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                    {linkedProduct?.image_urls?.[0] ? (
                      <img src={linkedProduct.image_urls[0]} alt="" className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" />
                    ) : (
                      <b.Icon className="w-full h-full text-white/40 p-12" />
                    )}
                    {linkedProduct && (
                      <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-2xl text-black">
                        <p className="text-[10px] font-black uppercase tracking-wider opacity-50">Desde</p>
                        <p className="text-xl font-black text-primary">{formatCOP(linkedProduct.price)}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          );
        })}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
          {banners.map((_, i) => (
            <button key={i} onClick={() => setHeroBanner(i)} className={cn("h-2 rounded-full transition-all duration-500", i === heroBanner ? "w-10 bg-white" : "w-2 bg-white/30 hover:bg-white/50")} />
          ))}
        </div>
      </div>

      {/* TRUST BADGES SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-4">
        {[
          { icon: Truck, title: "Envío Rápido", desc: "A todo el país en 24/48h", color: "text-blue-500" },
          { icon: CheckCircle, title: "Compra Segura", desc: "Garantía de satisfacción total", color: "text-green-500" },
          { icon: CreditCard, title: "Pagos Flexibles", desc: "TC, Débito, PSE y Efectivo", color: "text-purple-500" },
          { icon: Star, title: "Soporte 24/7", desc: "Expertos siempre para ti", color: "text-amber-500" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center bg-secondary/50", item.color)}>
              <item.icon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-sm uppercase tracking-tight leading-none mb-1">{item.title}</h4>
              <p className="text-xs text-muted-foreground font-medium">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* STATS - COMPACTED */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: "Mis compras", value: formatCOP(stats.sales), c: "text-primary", bg: "bg-primary/5" },
          { icon: ClipboardList, label: "Pedidos", value: stats.orders, c: "text-blue-500", bg: "bg-blue-500/5" },
          { icon: ShoppingBag, label: "Productos", value: stats.products, c: "text-emerald-500", bg: "bg-emerald-500/5" },
          { icon: Tag, label: "Ticket Prom.", value: formatCOP(stats.avgTicket), c: "text-amber-500", bg: "bg-amber-500/5" },
        ].map((s, i) => (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={s.label} className="p-4 rounded-2xl border border-border/30 bg-card flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", s.bg, s.c)}><s.icon className="w-5 h-5" /></div>
            <div>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{s.label}</p>
              <p className="text-base font-black">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CATEGORIES - HOMECENTER CIRCULAR STYLE */}
      <div>
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="text-xl font-head font-black flex items-center gap-2">Categorías</h3>
          <button onClick={() => setPage("catalog")} className="text-sm font-black text-primary hover:underline flex items-center gap-1 uppercase tracking-wider">Ver todo <ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="py-2 overflow-x-auto no-scrollbar">
        <div className="flex justify-between items-start min-w-[700px] gap-2 px-2">
          {categories.map((c, i) => (
            <motion.button 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.05 }} 
              onClick={() => setPage("catalog")} 
              key={c.name} 
              className="flex flex-col items-center gap-3 group w-24"
            >
              <div className={cn(
                "w-20 h-20 rounded-full border-2 border-border/40 bg-white flex items-center justify-center transition-all duration-300 group-hover:border-primary group-hover:shadow-xl group-hover:shadow-primary/10 group-hover:-translate-y-1 relative overflow-hidden shadow-sm"
              )}>
                {c.img ? (
                  <img src={c.img} alt={c.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                ) : (
                  <>
                    <div className={cn("absolute inset-2 rounded-full opacity-20", c.bg)} />
                    <c.Icon className={cn("w-10 h-10 relative z-10 transition-transform group-hover:scale-110", c.color)} />
                  </>
                )}
              </div>
              <span className="text-[11px] font-black text-center leading-tight uppercase tracking-tight group-hover:text-primary transition-colors h-8 flex items-center">{c.name}</span>
            </motion.button>
          ))}
          
          {/* Extra retail-style categories for Homecenter look */}
          {[
            { name: "Más ahorro", Icon: DollarSign, color: "text-red-600", bg: "bg-red-600/10" },
            { name: "Car Center", Icon: Truck, color: "text-blue-600", bg: "bg-blue-600/10" },
          ].map((c, i) => (
            <motion.button 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: (categories.length + i) * 0.05 }} 
              onClick={() => setPage("catalog")} 
              key={c.name} 
              className="flex flex-col items-center gap-3 group w-24"
            >
              <div className="w-20 h-20 rounded-full border-2 border-red-600/40 bg-white flex items-center justify-center p-4 transition-all duration-300 group-hover:border-red-600 group-hover:shadow-xl group-hover:shadow-red-600/10 group-hover:-translate-y-1 relative overflow-hidden shadow-sm">
                <div className={cn("absolute inset-2 rounded-full opacity-20", c.bg)} />
                <c.Icon className={cn("w-10 h-10 relative z-10 transition-transform group-hover:scale-110", c.color)} />
              </div>
              <span className="text-[11px] font-black text-center leading-tight uppercase tracking-tight group-hover:text-red-600 transition-colors h-8 flex items-center">{c.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* FEATURED PRODUCTS */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-head font-black flex items-center gap-2"><Sparkles className="w-6 h-6 text-amber-500" /> Selección Destacada</h3>
            <p className="text-sm text-muted-foreground font-medium">Los favoritos de nuestra comunidad esta semana</p>
          </div>
          <button onClick={() => setPage("catalog")} className="group flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border hover:border-primary hover:text-primary transition-all font-black text-xs uppercase tracking-wider">
            Ver catálogo completo <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        {products.length === 0 ? (
          <div className="text-center py-20 bg-secondary/20 rounded-3xl border-2 border-dashed border-border/50">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h4 className="text-xl font-black opacity-50">Próximamente más productos</h4>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((p, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.05 }} 
                key={p.id} 
                className="group relative bg-card rounded-[2.5rem] p-4 border border-border/40 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5"
              >
                <div className="aspect-[4/5] bg-secondary/30 rounded-[2rem] relative overflow-hidden flex items-center justify-center p-8 mb-4 transition-colors group-hover:bg-primary/5">
                  {p.image_urls?.[0] ? (
                    <img src={p.image_urls[0]} alt={p.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700 ease-out" />
                  ) : (
                    <Package className="w-20 h-20 text-muted-foreground/20" />
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                    {i % 3 === 0 && <span className="bg-primary text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg shadow-primary/20">POPULAR</span>}
                    {p.price > 100000 && <span className="bg-black text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg">PREMIUM</span>}
                  </div>
                  
                  {/* Quick actions overlay */}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                    <button onClick={() => setPage("catalog")} className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-all scale-75 group-hover:scale-100 duration-300 shadow-xl"><Eye className="w-5 h-5" /></button>
                    <button onClick={() => { setQuickAddProduct(p); setQuickAddOpen(true); }} className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center hover:bg-black transition-all scale-75 group-hover:scale-100 duration-300 shadow-xl delay-75"><ShoppingCart className="w-5 h-5" /></button>
                  </div>
                </div>

                <div className="px-2 pb-2">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{p.category_name || "General"}</p>
                  <h4 className="font-black text-base line-clamp-1 mb-2 group-hover:text-primary transition-colors" title={p.name}>{p.name}</h4>
                  
                  <div className="flex items-center gap-1.5 mb-4">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(s => <Star key={s} className={cn("w-3 h-3", s <= 4 ? "text-amber-500 fill-amber-500" : "text-border fill-border")} />)}
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground">(4.8)</span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border/40">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground line-through decoration-primary/30">{formatCOP(p.price * 1.15)}</span>
                      <span className="text-lg font-black text-foreground">{formatCOP(p.price)}</span>
                    </div>
                    <button 
                      onClick={() => handleAddToCart(p)} 
                      disabled={addingToCart[p.id]} 
                      className="w-11 h-11 rounded-2xl bg-foreground text-background flex items-center justify-center hover:bg-primary hover:text-white transition-all active:scale-90 shadow-lg"
                    >
                      {addingToCart[p.id] ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" strokeWidth={3} />}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* NEWSLETTER SECTION */}
      <div className="relative rounded-[3rem] overflow-hidden bg-foreground text-background p-12 md:p-20 text-center mt-12 shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[80%] bg-primary rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[80%] bg-blue-500 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <h3 className="text-3xl md:text-5xl font-head font-black mb-6 tracking-tighter leading-none">Únete al club de beneficios EcoMod</h3>
          <p className="text-background/60 mb-10 text-lg font-medium">Recibe ofertas exclusivas, preventas y lanzamientos antes que nadie. Directo a tu bandeja.</p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Tu mejor correo electrónico" 
              className="flex-1 px-6 py-4 rounded-2xl bg-background/10 border border-background/20 text-background placeholder:text-background/40 focus:bg-background/20 focus:outline-none transition-all"
            />
            <button className="px-8 py-4 bg-primary text-white rounded-2xl font-black hover:bg-primary/90 transition-all shadow-xl shadow-primary/20">
              Suscribirme
            </button>
          </form>
          <p className="mt-6 text-[10px] font-bold text-background/30 uppercase tracking-[0.2em]">Al suscribirte aceptas nuestros términos y condiciones</p>
        </div>
      </div>

      {/* QUICK ADD MODAL */}
      {quickAddOpen && quickAddProduct && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/30">
              <h3 className="font-bold">Agregar al carrito</h3>
              <button onClick={() => setQuickAddOpen(false)} className="p-1 hover:bg-secondary rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-xl bg-secondary/50 flex items-center justify-center p-2">
                  {quickAddProduct.image_urls?.[0] ? <img src={quickAddProduct.image_urls[0]} alt="" className="w-full h-full object-contain" /> : <Package className="w-8 h-8 text-muted-foreground/30" />}
                </div>
                <div>
                  <h4 className="font-bold">{quickAddProduct.name}</h4>
                  <p className="text-primary font-bold">{formatCOP(quickAddProduct.price)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mb-6 p-4 rounded-xl bg-secondary/50">
                <span className="font-bold text-sm">Cantidad</span>
                <div className="flex items-center gap-4">
                  <button onClick={() => setQuickAddQty(Math.max(1, quickAddQty - 1))} className="w-8 h-8 rounded-full bg-background border flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                  <span className="font-bold w-4 text-center">{quickAddQty}</span>
                  <button onClick={() => setQuickAddQty(quickAddQty + 1)} className="w-8 h-8 rounded-full bg-background border flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
              <button onClick={() => handleAddToCart(quickAddProduct, quickAddQty)} className="w-full py-4 rounded-xl bg-primary text-white font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
                <ShoppingCart className="w-5 h-5" /> Agregar {quickAddQty} por {formatCOP(quickAddProduct.price * quickAddQty)}
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
