import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../App";
import { useCart } from "../App";
import { cartApi, catalogApi, ordersApi } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, Trash2, Plus, Minus, CreditCard, ArrowRight,
  Package, CheckCircle, Tag, Truck, ShieldCheck, Clock, Sparkles, Loader2, X
} from "lucide-react";
import { cn } from "../lib/utils";

export default function CartPage({ setPage, onCheckout }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { updateCartCount } = useCart();
  const [cart, setCart] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addForm, setAddForm] = useState({ product_id: "", quantity: 1 });
  const [removingId, setRemovingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  };

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
    if (!confirm("¿Vaciar todo el carrito?")) return;
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-12">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
            <ShoppingCart className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-head font-bold leading-none">Mi Carrito</h1>
            <p className="text-muted-foreground mt-1">
              {itemCount} producto{itemCount !== 1 ? "s" : ""} {itemCount > 0 && `· Total: ${formatCOP(finalTotal)}`}
            </p>
          </div>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card hover:border-primary hover:text-primary transition-colors font-bold text-sm">
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? "Cerrar" : "Agregar producto"}
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
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-3xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center bg-secondary/20">
              <h2 className="text-lg font-bold flex items-center gap-2"><Package className="w-5 h-5 text-primary" /> Tus productos</h2>
              {cart?.items?.length > 0 && (
                <button onClick={handleClear} className="text-sm font-bold text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                  <Trash2 className="w-4 h-4" /> Vaciar
                </button>
              )}
            </div>

            {!cart?.items?.length ? (
              <div className="p-12 text-center">
                <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6"><ShoppingCart className="w-10 h-10 text-muted-foreground" /></div>
                <h3 className="text-xl font-bold mb-2">Tu carrito está vacío</h3>
                <p className="text-muted-foreground mb-6">Agrega productos desde el catálogo para continuar.</p>
                <button onClick={() => setPage("catalog")} className="px-8 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary/90 transition-colors inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Explorar catálogo
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {cart.items.map(item => (
                  <motion.div layout key={item.id} className={cn("p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 transition-colors hover:bg-secondary/20", removingId === item.id && "opacity-50 scale-[0.98]")}>
                    <div className="w-20 h-20 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                      {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-contain p-2" /> : <Package className="w-8 h-8 text-muted-foreground/30" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-lg mb-1 truncate" title={item.product_name}>{item.product_name || `Producto #${item.product_id}`}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{formatCOP(item.unit_price)} / ud</p>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-md"><CheckCircle className="w-3 h-3" /> En stock</span>
                    </div>
                    <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="flex items-center gap-3 bg-background border border-border rounded-xl p-1">
                        <button onClick={() => handleUpdateQty(item.id, item.quantity - 1, item.product_name)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary"><Minus className="w-3 h-3" /></button>
                        <span className="font-bold w-6 text-center">{item.quantity}</span>
                        <button onClick={() => handleUpdateQty(item.id, item.quantity + 1, item.product_name)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary"><Plus className="w-3 h-3" /></button>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase mb-1">Subtotal</p>
                        <p className="font-head font-bold text-lg text-primary">{formatCOP(item.unit_price * item.quantity)}</p>
                      </div>
                      <button onClick={() => handleRemoveItem(item.id, item.product_name)} className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
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

        {/* Right Column (Summary) */}
        {cart?.items?.length > 0 && (
          <div className="glass-card rounded-3xl border border-border overflow-hidden sticky top-24 shadow-xl">
            <div className="p-6 border-b border-border bg-secondary/20">
              <h2 className="text-lg font-bold flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /> Resumen del pedido</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Subtotal ({itemCount} ud)</span>
                <span className="font-bold">{formatCOP(total)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium flex items-center gap-2"><Truck className="w-4 h-4" /> Envío</span>
                {shipping === 0 ? <span className="font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-md">¡GRATIS!</span> : <span className="font-bold">{formatCOP(shipping)}</span>}
              </div>
              {discount > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-500 font-medium flex items-center gap-2"><Tag className="w-4 h-4" /> Descuento (10%)</span>
                  <span className="font-bold text-green-500">-{formatCOP(discount)}</span>
                </div>
              )}
              
              <div className="h-px w-full bg-border my-4" />
              
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-bold">Total a pagar</span>
                <span className="text-2xl font-head font-bold text-primary">{formatCOP(finalTotal)}</span>
              </div>

              <button onClick={handleCheckout} disabled={checkingOut} className="w-full py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50">
                {checkingOut ? <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</> : <><CreditCard className="w-5 h-5" /> Proceder al pago <ArrowRight className="w-4 h-4" /></>}
              </button>

              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4" /> Compra 100% segura (SSL)
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
