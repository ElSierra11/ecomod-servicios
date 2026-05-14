import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../App";
import { useCart } from "../App";
import { cartApi, catalogApi, ordersApi } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { useSwal } from "../hooks/useSwal"; // ← IMPORTAMOS SWAL
import { useTheme } from "../hooks/useTheme"; // ← PARA EL TEMA DE SWAL
import {
  ShoppingCart, Trash2, Plus, Minus, CreditCard, ArrowRight,
  Package, CheckCircle, Tag, Truck, ShieldCheck, Clock, Sparkles, Loader2, X
} from "lucide-react";
import { cn } from "../lib/utils";

export default function CartPage({ setPage, onCheckout }) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { addToast } = useToast();
  const { updateCartCount } = useCart();
  const { success, error, confirm, loading: swalLoading, close, delete: swalDelete } = useSwal(isDark);
  const [cart, setCart] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addForm, setAddForm] = useState({ product_id: "", quantity: 1 });
  const [removingId, setRemovingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const updateGlobalCount = (c) => {
    updateCartCount(c?.items?.reduce((s, i) => s + (parseInt(i.quantity) || 1), 0) || 0);
  };

  const calcTotal = (c) => c?.items?.reduce((s, i) => s + (parseFloat(i.unit_price) || 0) * (parseInt(i.quantity) || 1), 0) || 0;

  useEffect(() => {
    loadCart();
    loadProducts();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      let c;
      try { c = await cartApi.getByUser(user.id); } catch { c = await cartApi.create({ user_id: user.id }); }
      setCart(c);
      updateGlobalCount(c);
    } catch (e) {
      addToast("error", "Error", "No se pudo cargar el carrito");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try { setProducts(await catalogApi.getProducts()); } catch {}
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!addForm.product_id) return addToast("warning", "Atención", "Selecciona un producto primero");
    try {
      const product = products.find(p => p.id === parseInt(addForm.product_id));
      let currentCart = cart || await cartApi.create({ user_id: user.id });
      await cartApi.addItem(currentCart.id, { product_id: parseInt(addForm.product_id), quantity: parseInt(addForm.quantity), unit_price: product?.price || 0, product_name: product?.name || "" });
      addToast("success", "¡Agregado!", `"${product?.name}" añadido al carrito`);
      setAddForm({ product_id: "", quantity: 1 });
      setShowAddForm(false);
      await loadCart();
    } catch (e) { addToast("error", "Error", e.message || "No se pudo agregar"); }
  };

  const handleRemoveItem = async (itemId, productName) => {
    setRemovingId(itemId);
    try {
      await cartApi.removeItem(cart.id, itemId);
      await loadCart();
      addToast("success", "Eliminado", `"${productName}" removido`);
    } catch (e) { addToast("error", "Error", e.message); } finally { setRemovingId(null); }
  };

  const handleUpdateQty = async (itemId, qty, productName) => {
    if (qty < 1) return;
    try {
      await cartApi.updateItem(cart.id, itemId, { quantity: qty });
      await loadCart();
      if (qty > 1) addToast("info", "Actualizado", `Cantidad de "${productName}" actualizada`);
    } catch {}
  };

  const handleClear = async () => {
    const result = await swalDelete("¿Vaciar carrito?", "Se eliminarán todos los productos que has seleccionado.");
    if (!result.isConfirmed) return;
    
    try {
      await cartApi.clearCart(cart.id);
      addToast("success", "Carrito vaciado", "Productos eliminados");
      await loadCart();
    } catch (e) { addToast("error", "Error", e.message); }
  };

  const handleCheckout = async () => {
    if (!cart?.items?.length) return;
    setCheckingOut(true);
    try {
      const orderData = {
        user_id: user.id,
        cart_id: cart.id,
        items: cart.items.map(i => ({ product_id: i.product_id, product_name: i.product_name, unit_price: parseFloat(i.unit_price), quantity: parseInt(i.quantity) })),
        total_amount: finalTotal,
        email: user.email || null,
      };
      const newOrder = await ordersApi.create(orderData);
      // Clear cart in background
      cartApi.clearCart(cart.id).then(() => updateCartCount(0)).catch(() => {});
      
      if (onCheckout) onCheckout(newOrder.id);
      if (setPage) setPage("payments");
      
      addToast("success", "Orden lista", `Procede con el pago de tu orden #${String(newOrder.id).padStart(6, "0")}`);
    } catch (e) { 
      addToast("error", "Error al crear orden", e.message); 
    } finally { 
      setCheckingOut(false); 
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Cargando carrito...</p>
      </div>
    );
  }

  const total = calcTotal(cart);
  const itemCount = cart?.items?.reduce((s, i) => s + i.quantity, 0) || 0;
  const shipping = total > 150000 ? 0 : 15000;
  const discount = total > 200000 ? Math.round(total * 0.1) : 0;
  const finalTotal = total + shipping - discount;

  const formatCOP = (n) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-16 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-6 mb-10 px-1">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
            <ShoppingCart className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-4xl font-head font-black tracking-tight leading-none mb-2">Mi Carrito</h1>
            <p className="text-muted-foreground font-medium">
              {itemCount} producto{itemCount !== 1 ? "s" : ""} {itemCount > 0 && `· Total: ${formatCOP(finalTotal)}`}
            </p>
          </div>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-border/50 bg-card hover:border-primary hover:text-primary hover:shadow-xl hover:shadow-primary/5 transition-all font-black text-xs uppercase tracking-wider">
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? "Cerrar" : "Añadir Producto"}
        </button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-8">
            <div className="glass-card p-6 rounded-2xl border border-border">
              <div className="flex items-center gap-2 text-sm font-bold mb-4 text-primary"><Tag className="w-4 h-4" /> Agregar manual</div>
              <form onSubmit={handleAddItem} className="flex flex-col md:flex-row gap-4">
                <select value={addForm.product_id} onChange={e => setAddForm({ ...addForm, product_id: e.target.value })} className="flex-1 px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                  <option value="">Selecciona un producto...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} — {formatCOP(p.price)}</option>)}
                </select>
                <div className="flex items-center border border-border rounded-xl bg-background overflow-hidden">
                  <button type="button" onClick={() => setAddForm({ ...addForm, quantity: Math.max(1, addForm.quantity - 1) })} className="px-4 py-3 hover:bg-secondary transition-colors"><Minus className="w-4 h-4" /></button>
                  <input type="number" min="1" value={addForm.quantity} onChange={e => setAddForm({ ...addForm, quantity: parseInt(e.target.value) || 1 })} className="w-16 text-center font-bold bg-transparent outline-none" />
                  <button type="button" onClick={() => setAddForm({ ...addForm, quantity: addForm.quantity + 1 })} className="px-4 py-3 hover:bg-secondary transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
                <button type="submit" className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors whitespace-nowrap">
                  <Plus className="w-4 h-4" /> Agregar
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (Items) */}
        <div className="lg:col-span-2           <div className="bg-card rounded-[2.5rem] border border-border/40 shadow-xl shadow-black/5 overflow-hidden">
            <div className="p-8 border-b border-border/40 flex justify-between items-center bg-secondary/10">
              <h2 className="text-xl font-head font-black flex items-center gap-3"><Package className="w-6 h-6 text-primary" /> Tus Productos</h2>
              {cart?.items?.length > 0 && (
                <button onClick={handleClear} className="text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-xl transition-all">
                  <Trash2 className="w-4 h-4 inline mr-1" /> Vaciar
                </button>
              )}
            </div>

            {!cart?.items?.length ? (
              <div className="p-16 text-center">
                <div className="w-24 h-24 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-6"><ShoppingCart className="w-10 h-10 text-muted-foreground/30" /></div>
                <h3 className="text-2xl font-head font-black mb-3">Tu carrito está vacío</h3>
                <p className="text-muted-foreground font-medium mb-8 max-w-xs mx-auto">Agrega productos desde el catálogo para empezar tu compra.</p>
                <button onClick={() => setPage("catalog")} className="px-10 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Explorar Catálogo
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {cart.items.map(item => (
                  <motion.div layout key={item.id} className={cn("p-8 flex flex-col md:flex-row items-start md:items-center gap-8 transition-all hover:bg-secondary/5", removingId === item.id && "opacity-50 scale-[0.98]")}>
                    <div className="w-24 h-24 rounded-2xl bg-secondary/30 flex items-center justify-center flex-shrink-0 border border-border/20 p-2">
                      {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-contain" /> : <Package className="w-10 h-10 text-muted-foreground/20" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-lg mb-1 truncate group-hover:text-primary transition-colors" title={item.product_name}>{item.product_name || `Producto #${item.product_id}`}</h4>
                      <p className="text-sm font-bold text-muted-foreground mb-3">{formatCOP(item.unit_price)} por unidad</p>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-green-600 bg-green-600/10 px-2.5 py-1 rounded-full"><CheckCircle className="w-3 h-3" /> En Stock</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                      <div className="flex items-center gap-4 bg-secondary/40 rounded-2xl p-1.5 border border-border/40">
                        <button onClick={() => handleUpdateQty(item.id, item.quantity - 1, item.product_name)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white transition-all shadow-sm"><Minus className="w-3.5 h-3.5" /></button>
                        <span className="font-black text-sm w-6 text-center">{item.quantity}</span>
                        <button onClick={() => handleUpdateQty(item.id, item.quantity + 1, item.product_name)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white transition-all shadow-sm"><Plus className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="text-right min-w-[120px]">
                        <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase mb-1">Subtotal</p>
                        <p className="font-head font-black text-xl text-primary">{formatCOP(item.unit_price * item.quantity)}</p>
                      </div>
                      <button onClick={() => handleRemoveItem(item.id, item.product_name)} className="p-3 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 rounded-2xl transition-all"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          </div>

          {cart?.items?.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Truck, t: "Envío gratis", s: "En compras > $150k" },
                { icon: ShieldCheck, t: "Compra protegida", s: "Tus datos seguros" },
                { icon: Clock, t: "Entrega rápida", s: "24-48h en ciudades" }
              ].map((b, i) => (
                <div key={i} className="glass-card p-4 rounded-2xl border border-border flex items-center gap-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg"><b.icon className="w-5 h-5" /></div>
                  <div><p className="text-sm font-bold leading-tight">{b.t}</p><p className="text-xs text-muted-foreground">{b.s}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col        {cart?.items?.length > 0 && (
          <div className="bg-card rounded-[2.5rem] border border-border/40 overflow-hidden sticky top-24 shadow-2xl shadow-black/5">
            <div className="p-8 border-b border-border/40 bg-secondary/10">
              <h2 className="text-xl font-head font-black flex items-center gap-3"><CreditCard className="w-6 h-6 text-primary" /> Resumen Pago</h2>
            </div>
            <div className="p-8 space-y-5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Subtotal ({itemCount} ud)</span>
                <span className="font-black">{formatCOP(total)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-black uppercase tracking-widest text-[10px] flex items-center gap-2"><Truck className="w-4 h-4" /> Envío</span>
                {shipping === 0 ? <span className="font-black text-green-600 bg-green-600/10 px-3 py-1 rounded-full text-[10px]">¡GRATIS!</span> : <span className="font-black">{formatCOP(shipping)}</span>}
              </div>
              {discount > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-600 font-black uppercase tracking-widest text-[10px] flex items-center gap-2"><Tag className="w-4 h-4" /> Descuento (10%)</span>
                  <span className="font-black text-green-600">-{formatCOP(discount)}</span>
                </div>
              )}
              
              <div className="h-px w-full bg-border/40 my-6" />
              
              <div className="flex justify-between items-end mb-8">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Total Final</p>
                  <p className="text-3xl font-head font-black text-primary leading-none">{formatCOP(finalTotal)}</p>
                </div>
              </div>
 
              <button onClick={handleCheckout} disabled={checkingOut} className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-red-700 hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-primary/20">
                {checkingOut ? <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</> : <><CreditCard className="w-5 h-5" /> Pagar Ahora <ArrowRight className="w-4 h-4" /></>}
              </button>
 
              <div className="flex items-center justify-center gap-2 mt-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                <ShieldCheck className="w-4 h-4 text-green-600" /> Transacción 100% Protegida
              </div>
            </div>
          </div>
        )}   </div>
        )}
      </div>
    </motion.div>
  );
}
