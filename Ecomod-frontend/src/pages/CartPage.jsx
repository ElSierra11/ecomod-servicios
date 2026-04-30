import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../App";
import { useCart } from "../App";
import { cartApi, catalogApi } from "../services/api";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  ArrowRight,
  Package,
  AlertCircle,
  CheckCircle,
  X,
  ShoppingBag,
  Tag,
  Truck,
  Gift,
  ShieldCheck,
  Clock,
  Sparkles,
} from "lucide-react";

export default function CartPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { updateCartCount } = useCart();
  const [cart, setCart] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [addForm, setAddForm] = useState({ product_id: "", quantity: 1 });
  const [removingId, setRemovingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadCart();
    loadProducts();
  }, []);

  const calcTotal = (c) => {
    if (!c?.items?.length) return 0;
    return c.items.reduce(
      (s, i) =>
        s + (parseFloat(i.unit_price) || 0) * (parseInt(i.quantity) || 1),
      0,
    );
  };

  const updateGlobalCount = (cartData) => {
    const count =
      cartData?.items?.reduce((s, i) => s + (parseInt(i.quantity) || 1), 0) ||
      0;
    updateCartCount(count);
  };

  const loadCart = async () => {
    try {
      setLoading(true);
      let c;
      try {
        c = await cartApi.getByUser(user.id);
      } catch {
        c = await cartApi.create({ user_id: user.id });
      }
      if (c?.items) {
        c.total = calcTotal(c);
        c.total_items = c.items.reduce(
          (s, i) => s + (parseInt(i.quantity) || 1),
          0,
        );
      }
      setCart(c);
      updateGlobalCount(c);
    } catch (e) {
      addToast("error", "Error", "No se pudo cargar el carrito");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const d = await catalogApi.getProducts();
      setProducts(d);
    } catch {}
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!addForm.product_id) {
      addToast("warning", "Atención", "Selecciona un producto primero");
      return;
    }
    try {
      const product = products.find(
        (p) => p.id === parseInt(addForm.product_id),
      );
      let currentCart = cart;
      if (!currentCart) {
        currentCart = await cartApi.create({ user_id: user.id });
      }

      await cartApi.addItem(currentCart.id, {
        product_id: parseInt(addForm.product_id),
        quantity: parseInt(addForm.quantity),
        unit_price: product?.price || 0,
        product_name: product?.name || "",
      });

      addToast(
        "success",
        "¡Agregado!",
        `"${product?.name}" añadido al carrito`,
      );
      setAddForm({ product_id: "", quantity: 1 });
      setShowAddForm(false);
      await loadCart();
    } catch (e) {
      addToast("error", "Error", e.message || "No se pudo agregar el producto");
    }
  };

  const handleRemoveItem = async (itemId, productName) => {
    setRemovingId(itemId);
    try {
      await cartApi.removeItem(cart.id, itemId);
      await loadCart();
      addToast("success", "Eliminado", `"${productName}" removido del carrito`);
    } catch (e) {
      addToast("error", "Error", e.message);
    } finally {
      setRemovingId(null);
    }
  };

  const handleUpdateQty = async (itemId, qty, productName) => {
    if (qty < 1) return;
    try {
      await cartApi.updateItem(cart.id, itemId, { quantity: qty });
      await loadCart();
      if (qty > 1) {
        addToast(
          "info",
          "Actualizado",
          `Cantidad de "${productName}" actualizada`,
        );
      }
    } catch {}
  };

  const handleClear = async () => {
    if (!confirm("¿Vaciar todo el carrito?")) return;
    try {
      await cartApi.clearCart(cart.id);
      addToast(
        "success",
        "Carrito vaciado",
        "Todos los productos fueron eliminados",
      );
      await loadCart();
    } catch (e) {
      addToast("error", "Error", e.message);
    }
  };

  if (loading) {
    return (
      <div className="ec-cart-loading">
        <div className="ec-cart-spinner" />
        <span>Cargando tu carrito...</span>
      </div>
    );
  }

  const total = calcTotal(cart);
  const itemCount = cart?.items?.reduce((s, i) => s + i.quantity, 0) || 0;
  const shipping = total > 150000 ? 0 : 15000;
  const discount = total > 200000 ? Math.round(total * 0.1) : 0;
  const finalTotal = total + shipping - discount;

  return (
    <div className="ec-cart">
      {/* Page header */}
      <div className="ec-cart-header">
        <div className="ec-cart-header-left">
          <div className="ec-cart-header-icon-wrap">
            <ShoppingCart size={24} strokeWidth={2} />
          </div>
          <div>
            <h1 className="ec-cart-title">Mi Carrito</h1>
            <p className="ec-cart-subtitle">
              {itemCount} producto{itemCount !== 1 ? "s" : ""} en tu carrito
              {itemCount > 0 && ` · Total: $${finalTotal.toLocaleString()}`}
            </p>
          </div>
        </div>
        <button
          className="ec-cart-add-toggle"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus size={16} strokeWidth={2.5} />
          {showAddForm ? "Cerrar" : "Agregar producto"}
        </button>
      </div>

      {/* Add product form */}
      {showAddForm && (
        <div className="ec-cart-add-bar">
          <div className="ec-cart-add-bar-header">
            <Tag size={18} strokeWidth={2} />
            <span>Agregar producto al carrito</span>
          </div>
          <form className="ec-cart-add-form" onSubmit={handleAddItem}>
            <select
              className="ec-cart-select"
              value={addForm.product_id}
              onChange={(e) =>
                setAddForm({ ...addForm, product_id: e.target.value })
              }
            >
              <option value="">Selecciona un producto...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ${p.price?.toLocaleString()}
                </option>
              ))}
            </select>
            <div className="ec-cart-qty-wrap">
              <button
                type="button"
                onClick={() =>
                  setAddForm({
                    ...addForm,
                    quantity: Math.max(1, addForm.quantity - 1),
                  })
                }
              >
                <Minus size={14} strokeWidth={2.5} />
              </button>
              <input
                type="number"
                min="1"
                className="ec-cart-qty-input"
                value={addForm.quantity}
                onChange={(e) =>
                  setAddForm({
                    ...addForm,
                    quantity: parseInt(e.target.value) || 1,
                  })
                }
              />
              <button
                type="button"
                onClick={() =>
                  setAddForm({ ...addForm, quantity: addForm.quantity + 1 })
                }
              >
                <Plus size={14} strokeWidth={2.5} />
              </button>
            </div>
            <button type="submit" className="ec-cart-add-btn">
              <Plus size={16} strokeWidth={2.5} /> Agregar al carrito
            </button>
          </form>
        </div>
      )}

      <div className="ec-cart-body">
        {/* Items column */}
        <div className="ec-cart-items-col">
          <div className="ec-cart-card">
            <div className="ec-cart-card-head">
              <div className="ec-cart-card-title">
                <Package size={18} strokeWidth={2} />
                Tus productos
              </div>
              {cart?.items?.length > 0 && (
                <button className="ec-cart-clear-btn" onClick={handleClear}>
                  <Trash2 size={14} strokeWidth={2} /> Vaciar carrito
                </button>
              )}
            </div>

            {!cart?.items?.length ? (
              <div className="ec-cart-empty">
                <div className="ec-cart-empty-icon">
                  <ShoppingBag size={48} strokeWidth={1} />
                </div>
                <h3>Tu carrito está vacío</h3>
                <p>
                  Agrega productos desde el catálogo o usando el botón de arriba
                </p>
                <button className="ec-cart-empty-btn">
                  <Sparkles size={16} strokeWidth={2} />
                  Explorar productos
                </button>
              </div>
            ) : (
              <div className="ec-cart-list">
                {cart.items.map((item) => (
                  <div
                    key={item.id}
                    className={`ec-cart-item ${removingId === item.id ? "removing" : ""}`}
                  >
                    <div className="ec-cart-item-img">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.product_name} />
                      ) : (
                        <Package size={24} strokeWidth={1.5} />
                      )}
                    </div>

                    <div className="ec-cart-item-info">
                      <div className="ec-cart-item-name">
                        {item.product_name || `Producto #${item.product_id}`}
                      </div>
                      <div className="ec-cart-item-unit">
                        ${parseFloat(item.unit_price).toLocaleString()} / unidad
                      </div>
                      <div className="ec-cart-item-stock">
                        <CheckCircle size={11} strokeWidth={2.5} /> En stock
                      </div>
                    </div>

                    <div className="ec-cart-qty">
                      <button
                        className="ec-cart-qty-btn"
                        onClick={() =>
                          handleUpdateQty(
                            item.id,
                            item.quantity - 1,
                            item.product_name,
                          )
                        }
                      >
                        <Minus size={13} strokeWidth={2.5} />
                      </button>
                      <span className="ec-cart-qty-val">{item.quantity}</span>
                      <button
                        className="ec-cart-qty-btn"
                        onClick={() =>
                          handleUpdateQty(
                            item.id,
                            item.quantity + 1,
                            item.product_name,
                          )
                        }
                      >
                        <Plus size={13} strokeWidth={2.5} />
                      </button>
                    </div>

                    <div className="ec-cart-item-sub">
                      <span className="ec-cart-item-sub-label">SUBTOTAL</span>
                      <strong className="ec-cart-item-sub-val">
                        ${(item.unit_price * item.quantity).toLocaleString()}
                      </strong>
                    </div>

                    <button
                      className="ec-cart-remove"
                      onClick={() =>
                        handleRemoveItem(item.id, item.product_name)
                      }
                      title="Eliminar producto"
                    >
                      <Trash2 size={16} strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Benefits */}
          {cart?.items?.length > 0 && (
            <div className="ec-cart-benefits">
              <div className="ec-benefit">
                <Truck size={18} strokeWidth={2} />
                <div>
                  <strong>Envío gratis</strong>
                  <span>En compras mayores a $150.000</span>
                </div>
              </div>
              <div className="ec-benefit">
                <ShieldCheck size={18} strokeWidth={2} />
                <div>
                  <strong>Compra protegida</strong>
                  <span>Tus datos están seguros</span>
                </div>
              </div>
              <div className="ec-benefit">
                <Clock size={18} strokeWidth={2} />
                <div>
                  <strong>Entrega rápida</strong>
                  <span>24-48 horas en principales ciudades</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary column */}
        {cart?.items?.length > 0 && (
          <div className="ec-cart-summary-col">
            <div className="ec-cart-card ec-cart-summary">
              <div className="ec-cart-card-head">
                <div className="ec-cart-card-title">
                  <CreditCard size={18} strokeWidth={2} />
                  Resumen del pedido
                </div>
              </div>
              <div className="ec-cart-summary-body">
                <div className="ec-cart-summary-row">
                  <span>
                    Subtotal ({itemCount}{" "}
                    {itemCount === 1 ? "producto" : "productos"})
                  </span>
                  <span>${total.toLocaleString()}</span>
                </div>

                <div className="ec-cart-summary-row">
                  <span className="ec-cart-ship-row">
                    <Truck size={14} strokeWidth={2} /> Envío
                  </span>
                  {shipping === 0 ? (
                    <span className="ec-cart-free">¡GRATIS!</span>
                  ) : (
                    <span>${shipping.toLocaleString()}</span>
                  )}
                </div>

                {discount > 0 && (
                  <div className="ec-cart-summary-row discount">
                    <span className="ec-cart-discount-row">
                      <Gift size={14} strokeWidth={2} /> Descuento (10%)
                    </span>
                    <span>-${discount.toLocaleString()}</span>
                  </div>
                )}

                <div className="ec-cart-summary-divider" />

                <div className="ec-cart-summary-total">
                  <span>Total a pagar</span>
                  <strong>${finalTotal.toLocaleString()}</strong>
                </div>

                <div className="ec-cart-summary-units">
                  {itemCount} unidad{itemCount !== 1 ? "es" : ""} · IVA incluido
                </div>

                <button className="ec-cart-checkout-btn">
                  <span>Proceder al pago</span>
                  <CreditCard size={18} strokeWidth={2} />
                  <ArrowRight size={16} strokeWidth={2.5} />
                </button>

                <div className="ec-cart-secure-note">
                  <ShieldCheck size={14} strokeWidth={2} />
                  Compra 100% segura · Datos encriptados · SSL
                </div>

                {total < 150000 && (
                  <div className="ec-cart-progress">
                    <div className="ec-cart-progress-bar">
                      <div
                        className="ec-cart-progress-fill"
                        style={{
                          width: `${Math.min(100, (total / 150000) * 100)}%`,
                        }}
                      />
                    </div>
                    <span>
                      ¡Te faltan ${(150000 - total).toLocaleString()} para envío
                      gratis!
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        .ec-cart { font-family: 'Inter', sans-serif; animation: ecCartFade .35s ease; }
        @keyframes ecCartFade { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

        .ec-cart-loading { 
          display:flex; flex-direction:column; align-items:center; 
          justify-content:center; min-height:300px; gap:16px; 
          color:var(--text3,#9ca3af); font-family:'Inter',sans-serif; 
        }
        .ec-cart-spinner { 
          width:40px; height:40px; 
          border:3px solid rgba(232,41,28,.12); 
          border-top-color:#e8291c; border-radius:50%; 
          animation:ecSpin .8s linear infinite; 
        }
        @keyframes ecSpin { to{transform:rotate(360deg)} }

        /* Header */
        .ec-cart-header { 
          display:flex; align-items:center; justify-content:space-between; 
          margin-bottom:24px; flex-wrap:wrap; gap:16px; 
        }
        .ec-cart-header-left { display:flex; align-items:center; gap:14px; }
        .ec-cart-header-icon-wrap {
          width:48px; height:48px;
          background: linear-gradient(135deg, #e8291c, #c2200f);
          border-radius:12px;
          display:flex; align-items:center; justify-content:center;
          color:#fff;
          box-shadow: 0 4px 16px rgba(232,41,28,.3);
        }
        .ec-cart-title { font-size:26px; font-weight:900; margin:0; color:var(--text,#111); letter-spacing:-.02em; }
        .ec-cart-subtitle { font-size:13px; color:var(--text3,#9ca3af); margin:4px 0 0; font-weight:500; }
        .ec-cart-add-toggle {
          display:flex; align-items:center; gap:8px;
          padding:10px 18px;
          background: var(--surface,#fff);
          border: 1.5px solid var(--border,#e5e7eb);
          border-radius:10px;
          font-family:'Inter',sans-serif;
          font-size:13px; font-weight:700;
          color:var(--text,#111);
          cursor:pointer;
          transition:all .2s;
        }
        .ec-cart-add-toggle:hover { border-color:#e8291c; color:#e8291c; background:#fff5f5; }

        /* Add bar */
        .ec-cart-add-bar {
          background: var(--surface,#fff);
          border: 1.5px solid var(--border,#e5e7eb);
          border-radius:16px;
          padding:20px 24px;
          margin-bottom:24px;
          animation: ecSlide .3s ease;
        }
        @keyframes ecSlide { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        .ec-cart-add-bar-header {
          display:flex; align-items:center; gap:10px;
          margin-bottom:14px;
          font-size:14px; font-weight:700;
          color:var(--text,#111);
        }
        .ec-cart-add-bar-header svg { color:#e8291c; }
        .ec-cart-add-form { display:flex; gap:12px; flex-wrap:wrap; align-items:center; }
        .ec-cart-select {
          flex:2; min-width:200px;
          padding:11px 14px;
          background:var(--bg2,#f9fafb);
          border:1.5px solid var(--border,#e5e7eb);
          border-radius:10px;
          font-family:'Inter',sans-serif;
          font-size:13px; font-weight:500;
          color:var(--text,#111); outline:none;
          transition:all .2s;
          cursor:pointer;
        }
        .ec-cart-select:focus { border-color:#e8291c; box-shadow:0 0 0 3px rgba(232,41,28,.1); }
        .ec-cart-qty-wrap {
          display:flex; align-items:center;
          border:1.5px solid var(--border,#e5e7eb);
          border-radius:10px;
          overflow:hidden;
        }
        .ec-cart-qty-wrap button {
          width:36px; height:40px;
          background:var(--bg2,#f9fafb);
          border:none;
          color:var(--text2,#555);
          display:flex; align-items:center; justify-content:center;
          cursor:pointer;
          transition:all .15s;
        }
        .ec-cart-qty-wrap button:hover { background:var(--hover-bg,#fff5f5); color:#e8291c; }
        .ec-cart-qty-input {
          width:50px; height:40px;
          background:var(--surface,#fff);
          border:none;
          font-family:'Inter',sans-serif;
          font-size:14px; font-weight:700;
          color:var(--text,#111);
          text-align:center;
          outline:none;
        }
        .ec-cart-add-btn {
          display:flex; align-items:center; gap:8px;
          padding:11px 22px;
          background: linear-gradient(135deg,#e8291c,#c2200f);
          border:none; border-radius:10px;
          font-family:'Inter',sans-serif;
          font-size:13px; font-weight:800;
          color:#fff; cursor:pointer;
          transition:all .25s; white-space:nowrap;
          box-shadow: 0 4px 16px rgba(232,41,28,.25);
        }
        .ec-cart-add-btn:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(232,41,28,.35); }

        /* Body layout */
        .ec-cart-body { display:grid; grid-template-columns:1fr 340px; gap:24px; align-items:start; }
        @media(max-width:1024px) { .ec-cart-body { grid-template-columns:1fr; } }

        /* Card */
        .ec-cart-card {
          background:var(--surface,#fff);
          border:1px solid var(--border,#e5e7eb);
          border-radius:16px;
          overflow:hidden;
          box-shadow: 0 1px 4px rgba(0,0,0,.04);
        }
        .ec-cart-card-head {
          display:flex; align-items:center; justify-content:space-between;
          padding:18px 24px;
          border-bottom:1px solid var(--border,#e5e7eb);
        }
        .ec-cart-card-title {
          display:flex; align-items:center; gap:10px;
          font-size:15px; font-weight:800; color:var(--text,#111);
        }
        .ec-cart-clear-btn {
          display:flex; align-items:center; gap:6px;
          padding:7px 14px;
          background:rgba(239,68,68,.06);
          border:1px solid rgba(239,68,68,.15);
          border-radius:20px;
          font-family:'Inter',sans-serif;
          font-size:12px; font-weight:700;
          color:#dc2626; cursor:pointer; transition:all .2s;
        }
        .ec-cart-clear-btn:hover { background:rgba(239,68,68,.12); transform:translateY(-1px); }

        /* Empty */
        .ec-cart-empty { text-align:center; padding:60px 24px; }
        .ec-cart-empty-icon {
          width:100px; height:100px;
          background: linear-gradient(135deg, rgba(232,41,28,.08), rgba(249,115,22,.06));
          border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          color:#e8291c;
          margin:0 auto 20px;
        }
        .ec-cart-empty h3 { font-size:18px; font-weight:800; margin:0 0 6px; color:var(--text,#111); }
        .ec-cart-empty p  { font-size:13px; color:var(--text3,#9ca3af); margin:0 0 20px; }
        .ec-cart-empty-btn {
          display:inline-flex; align-items:center; gap:8px;
          padding:12px 28px;
          background: linear-gradient(135deg,#e8291c,#c2200f);
          color:#fff;
          border:none; border-radius:30px;
          font-family:'Inter',sans-serif;
          font-size:14px; font-weight:700;
          cursor:pointer; transition:all .25s;
          box-shadow: 0 4px 16px rgba(232,41,28,.25);
        }
        .ec-cart-empty-btn:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(232,41,28,.35); }

        /* Item */
        .ec-cart-list { padding:4px 0; }
        .ec-cart-item {
          display:flex; align-items:center; gap:18px;
          padding:18px 24px;
          border-bottom:1px solid var(--border,#e5e7eb);
          transition:all .25s;
        }
        .ec-cart-item:last-child { border-bottom:none; }
        .ec-cart-item:hover { background:rgba(232,41,28,.02); }
        .ec-cart-item.removing { opacity:.35; transform:scale(.97); }

        .ec-cart-item-img {
          width:72px; height:72px;
          border-radius:12px;
          background:var(--bg2,#f9fafb);
          border:1px solid var(--border,#e5e7eb);
          display:flex; align-items:center; justify-content:center;
          color:var(--text3,#bbb); flex-shrink:0; overflow:hidden;
        }
        .ec-cart-item-img img { width:100%; height:100%; object-fit:cover; }

        .ec-cart-item-info { flex:1; min-width:0; }
        .ec-cart-item-name { font-size:15px; font-weight:700; color:var(--text,#111); margin-bottom:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .ec-cart-item-unit { font-size:12px; color:var(--text3,#9ca3af); font-weight:500; margin-bottom:4px; }
        .ec-cart-item-stock {
          display:inline-flex; align-items:center; gap:4px;
          font-size:11px; font-weight:600; color:#16a34a;
        }

        .ec-cart-qty { display:flex; align-items:center; gap:10px; flex-shrink:0; }
        .ec-cart-qty-btn {
          width:32px; height:32px;
          border-radius:8px;
          background:var(--bg2,#f5f5f5);
          border:1.5px solid var(--border,#e5e7eb);
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:all .15s; color:var(--text,#111);
        }
        .ec-cart-qty-btn:hover { border-color:#e8291c; color:#e8291c; background:rgba(232,41,28,.06); }
        .ec-cart-qty-val { font-size:16px; font-weight:800; min-width:28px; text-align:center; color:var(--text,#111); }

        .ec-cart-item-sub { text-align:right; flex-shrink:0; min-width:90px; }
        .ec-cart-item-sub-label { display:block; font-size:9px; font-weight:800; letter-spacing:.1em; color:var(--text3,#9ca3af); text-transform:uppercase; margin-bottom:4px; }
        .ec-cart-item-sub-val { font-size:17px; font-weight:900; color:#e8291c; font-family:'Barlow Condensed',sans-serif; }

        .ec-cart-remove {
          background:none; border:none; cursor:pointer;
          color:var(--text3,#bbb); padding:8px;
          border-radius:8px; transition:all .2s;
          display:flex; align-items:center; flex-shrink:0;
        }
        .ec-cart-remove:hover { background:rgba(239,68,68,.08); color:#dc2626; transform:scale(1.1); }

        /* Benefits */
        .ec-cart-benefits {
          display:grid; grid-template-columns:repeat(3, 1fr);
          gap:12px; margin-top:20px;
        }
        .ec-benefit {
          display:flex; align-items:center; gap:12px;
          padding:16px;
          background:var(--surface,#fff);
          border:1px solid var(--border,#e5e7eb);
          border-radius:14px;
          color:var(--text3,#9ca3af);
        }
        .ec-benefit svg { color:#e8291c; flex-shrink:0; }
        .ec-benefit strong { display:block; font-size:13px; font-weight:700; color:var(--text,#111); margin-bottom:2px; }
        .ec-benefit span { font-size:11px; }

        /* Summary */
        .ec-cart-summary-col { position:sticky; top:140px; }
        .ec-cart-summary-body { padding:24px; }
        .ec-cart-summary-row {
          display:flex; justify-content:space-between; align-items:center;
          font-size:14px; margin-bottom:14px; color:var(--text,#111); font-weight:500;
        }
        .ec-cart-summary-row span:first-child, .ec-cart-ship-row {
          color:var(--text3,#9ca3af);
          display:flex; align-items:center; gap:6px; font-weight:500;
        }
        .ec-cart-free {
          color:#16a34a; font-weight:800;
          display:flex; align-items:center; gap:4px;
        }
        .ec-cart-discount-row { color:#16a34a !important; font-weight:600; }
        .ec-cart-summary-row.discount { color:#16a34a; }
        .ec-cart-summary-divider { height:1px; background:var(--border,#e5e7eb); margin:16px 0; }
        
        .ec-cart-summary-total {
          display:flex; justify-content:space-between; align-items:center;
          margin-bottom:6px;
        }
        .ec-cart-summary-total span { font-size:16px; font-weight:700; color:var(--text,#111); }
        .ec-cart-summary-total strong { font-size:28px; font-weight:900; color:#e8291c; font-family:'Barlow Condensed',sans-serif; letter-spacing:-.02em; }
        
        .ec-cart-summary-units {
          font-size:12px; color:var(--text3,#9ca3af);
          text-align:right; margin-bottom:24px; font-weight:500;
        }

        .ec-cart-checkout-btn {
          width:100%;
          display:flex; align-items:center; justify-content:center; gap:10px;
          padding:16px;
          background: linear-gradient(135deg,#e8291c,#c2200f);
          border:none; border-radius:12px;
          font-family:'Inter',sans-serif;
          font-size:16px; font-weight:800;
          color:#fff; cursor:pointer; transition:all .3s;
          margin-bottom:14px;
          box-shadow: 0 6px 20px rgba(232,41,28,.3);
        }
        .ec-cart-checkout-btn:hover { transform:translateY(-3px); box-shadow:0 12px 32px rgba(232,41,28,.4); }

        .ec-cart-secure-note {
          display:flex; align-items:center; justify-content:center; gap:8px;
          font-size:12px; color:var(--text3,#9ca3af); font-weight:600;
          margin-bottom:16px;
        }

        .ec-cart-progress {
          padding:14px;
          background: linear-gradient(135deg, rgba(232,41,28,.06), rgba(249,115,22,.04));
          border-radius:10px;
          text-align:center;
        }
        .ec-cart-progress-bar {
          height:6px;
          background:var(--border,#e5e7eb);
          border-radius:3px;
          overflow:hidden;
          margin-bottom:8px;
        }
        .ec-cart-progress-fill {
          height:100%;
          background: linear-gradient(90deg, #e8291c, #f97316);
          border-radius:3px;
          transition:width .5s ease;
        }
        .ec-cart-progress span {
          font-size:11px; font-weight:700; color:#e8291c;
        }

        @media(max-width:600px) {
          .ec-cart-benefits { grid-template-columns:1fr; }
          .ec-cart-item { flex-wrap:wrap; gap:12px; }
          .ec-cart-item-sub { text-align:left; flex:1; }
          .ec-cart-summary-total strong { font-size:22px; }
        }
      `}</style>
    </div>
  );
}
