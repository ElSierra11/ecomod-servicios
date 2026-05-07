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
    { title: "Ofertas de temporada", sub: "Hasta 50% de descuento en seleccionados", cta: "Ver ofertas", from: "from-primary", to: "to-orange-500", Icon: Zap, tag: "SUPER OFERTA" },
    { title: "Envío gratis nacional", sub: "En compras mayores a $150.000 COP.", cta: "Comprar ahora", from: "from-blue-600", to: "to-cyan-500", Icon: Truck, tag: "ENVÍO GRATIS" },
    { title: "Nuevos productos 2026", sub: "Lo último en tecnología y hogar", cta: "Explorar", from: "from-emerald-600", to: "to-teal-500", Icon: Sparkles, tag: "NUEVO" },
  ];

  const categories = [
    { name: "Tecnología", Icon: Zap, color: "text-blue-500", bg: "bg-blue-500/10", count: 24 },
    { name: "Electrodomésticos", Icon: Box, color: "text-orange-500", bg: "bg-orange-500/10", count: 18 },
    { name: "Ropa y Moda", Icon: Tag, color: "text-pink-500", bg: "bg-pink-500/10", count: 42 },
    { name: "Deportes", Icon: Award, color: "text-emerald-500", bg: "bg-emerald-500/10", count: 31 },
    { name: "Hogar", Icon: Package, color: "text-violet-500", bg: "bg-violet-500/10", count: 27 },
    { name: "Juguetes", Icon: Star, color: "text-amber-500", bg: "bg-amber-500/10", count: 15 },
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
      
      {/* HERO BANNER */}
      <div className="relative rounded-3xl overflow-hidden h-64 md:h-80 shadow-lg">
        {banners.map((b, i) => (
          <div
            key={i}
            className={cn(
              "absolute inset-0 flex items-center p-8 md:p-16 transition-opacity duration-700 bg-gradient-to-r",
              b.from, b.to,
              i === heroBanner ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            )}
          >
            <div className="max-w-xl text-white relative z-20">
              <span className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-wider uppercase bg-white/20 backdrop-blur-md rounded-full">{b.tag}</span>
              <h2 className="text-4xl md:text-5xl font-head font-bold mb-4 leading-tight">{b.title}</h2>
              <p className="text-white/90 mb-8 text-lg">{b.sub}</p>
              <button onClick={() => setPage("catalog")} className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform">
                {b.cta} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <b.Icon className="absolute right-10 top-1/2 -translate-y-1/2 w-48 h-48 text-white/10" />
          </div>
        ))}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {banners.map((_, i) => (
            <button key={i} onClick={() => setHeroBanner(i)} className={cn("w-2 h-2 rounded-full transition-all", i === heroBanner ? "w-6 bg-white" : "bg-white/50")} />
          ))}
        </div>
        <div className="db-banner-dots">
          {banners.map((_, i) => (
            <button
              key={i}
              className={`db-dot ${i === heroBanner ? "active" : ""}`}
              onClick={() => setHeroBanner(i)}
            />
          ))}
        </div>
      </section>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: "Mis compras", value: formatCOP(stats.sales), c: "text-primary", bg: "bg-primary/10" },
          { icon: ClipboardList, label: "Pedidos", value: stats.orders, c: "text-blue-500", bg: "bg-blue-500/10" },
          { icon: ShoppingBag, label: "Productos", value: stats.products, c: "text-emerald-500", bg: "bg-emerald-500/10" },
          { icon: Tag, label: "Ticket Prom.", value: formatCOP(stats.avgTicket), c: "text-amber-500", bg: "bg-amber-500/10" },
        ].map((s, i) => (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={s.label} className="glass-card p-5 rounded-2xl flex items-center gap-4">
            <div className={cn("p-3 rounded-xl", s.bg, s.c)}><s.icon className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{s.label}</p>
              <p className="text-lg font-bold">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CATEGORIES */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-head font-bold flex items-center gap-2"><Flame className="w-5 h-5 text-primary" /> Categorías</h3>
          <button onClick={() => setPage("catalog")} className="text-sm font-bold text-primary hover:underline flex items-center gap-1">Ver todo <ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((c, i) => (
            <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} onClick={() => setPage("catalog")} key={c.name} className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center gap-3 hover:-translate-y-1 transition-transform">
              <div className={cn("p-3 rounded-full", c.bg, c.c)}><c.Icon className="w-6 h-6" /></div>
              <span className="text-sm font-bold text-center leading-tight">{c.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* FEATURED PRODUCTS */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-head font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-500" /> Destacados</h3>
          <button onClick={() => setPage("catalog")} className="text-sm font-bold text-primary hover:underline flex items-center gap-1">Ver catálogo <ChevronRight className="w-4 h-4" /></button>
        </div>
        
        {products.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-3xl border-dashed">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h4 className="text-lg font-bold">No hay productos</h4>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p, i) => (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={p.id} className="glass-card rounded-2xl overflow-hidden group">
                <div className="aspect-square bg-secondary/50 relative overflow-hidden flex items-center justify-center p-6">
                  {p.image_urls?.[0] ? (
                    <img src={p.image_urls[0]} alt={p.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <Package className="w-16 h-16 text-muted-foreground/30" />
                  )}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {i === 0 && <span className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-md">HOT</span>}
                    <span className="bg-foreground text-background text-[10px] font-bold px-2 py-1 rounded-md">-20%</span>
                  </div>
                  <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                    <button onClick={() => setPage("catalog")} className="w-10 h-10 bg-background text-foreground rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-colors shadow-lg"><Eye className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-sm line-clamp-1 mb-1" title={p.name}>{p.name}</h4>
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className={cn("w-3 h-3", s <= 4 ? "text-amber-500 fill-amber-500" : "text-muted-foreground")} />)}
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground line-through">{formatCOP(p.price * 1.2)}</p>
                      <p className="font-bold text-primary">{formatCOP(p.price)}</p>
                    </div>
                    <button onClick={() => { setQuickAddProduct(p); setQuickAddOpen(true); }} disabled={addingToCart[p.id]} className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                      {addingToCart[p.id] ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
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
