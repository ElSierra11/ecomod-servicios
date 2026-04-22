import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
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
  RefreshCw,
} from "lucide-react";

export default function CartPage() {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [addForm, setAddForm] = useState({ product_id: "", quantity: 1 });
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    loadCart();
    loadProducts();
  }, []);

  // Función para calcular el total del carrito correctamente
  const calculateCartTotal = (cartData) => {
    if (!cartData || !cartData.items || cartData.items.length === 0) return 0;
    return cartData.items.reduce((sum, item) => {
      const price = parseFloat(item.unit_price) || 0;
      const qty = parseInt(item.quantity) || 1;
      return sum + price * qty;
    }, 0);
  };

  // Función para calcular el subtotal del carrito
  const calculateCartSubtotal = (cartData) => {
    if (!cartData || !cartData.items || cartData.items.length === 0) return 0;
    return cartData.items.reduce((sum, item) => {
      const price = parseFloat(item.unit_price) || 0;
      const qty = parseInt(item.quantity) || 1;
      return sum + price * qty;
    }, 0);
  };

  const loadCart = async () => {
    try {
      setLoading(true);
      let c = null;
      try {
        c = await cartApi.getByUser(user.id);
        // Asegurar que el total esté correctamente calculado
        if (c && c.items) {
          c.total = calculateCartTotal(c);
          c.subtotal = calculateCartSubtotal(c);
          c.total_items = c.items.reduce(
            (sum, item) => sum + (parseInt(item.quantity) || 1),
            0,
          );
        }
      } catch {
        c = await cartApi.create({ user_id: user.id });
      }
      setCart(c);
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await catalogApi.getProducts();
      setProducts(data);
    } catch {}
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!addForm.product_id) return;
    try {
      const product = products.find(
        (p) => p.id === parseInt(addForm.product_id),
      );
      await cartApi.addItem(cart.id, {
        product_id: parseInt(addForm.product_id),
        quantity: parseInt(addForm.quantity),
        unit_price: product?.price || 0,
        product_name: product?.name || "",
      });
      setMsg({ type: "success", text: "Producto agregado al carrito" });
      setAddForm({ product_id: "", quantity: 1 });
      await loadCart();
      setTimeout(() => setMsg(null), 3000);
    } catch (e) {
      setMsg({ type: "error", text: e.message });
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await cartApi.removeItem(cart.id, itemId);
      await loadCart();
      setMsg({ type: "success", text: "Producto eliminado" });
      setTimeout(() => setMsg(null), 2000);
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    }
  };

  const handleUpdateQty = async (itemId, qty) => {
    if (qty < 1) return;
    try {
      await cartApi.updateItem(cart.id, itemId, { quantity: qty });
      await loadCart();
    } catch {}
  };

  const handleClear = async () => {
    if (!confirm("¿Estás seguro de vaciar todo el carrito?")) return;
    try {
      await cartApi.clearCart(cart.id);
      setMsg({ type: "success", text: "Carrito vaciado" });
      await loadCart();
      setTimeout(() => setMsg(null), 2000);
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    }
  };

  const handleCheckout = () => {
    setIsCheckingOut(true);
    // Aquí redirigir a OrdersPage o crear orden directamente
    setTimeout(() => {
      setIsCheckingOut(false);
      setMsg({ type: "success", text: "Redirigiendo al pago..." });
    }, 1500);
  };

  if (loading) {
    return (
      <div className="cart-loading">
        <div className="cart-loading-spinner"></div>
        <p>Cargando tu carrito...</p>
      </div>
    );
  }

  return (
    <div className="cart-modern">
      {/* Header */}
      <div className="cart-header">
        <div className="cart-header-left">
          <div className="cart-badge">
            <ShoppingCart size={14} />
            <span>CARRITO DE COMPRAS</span>
          </div>
          <h1 className="cart-title">
            Mi Carrito
            <span>Revisa y confirma tus productos</span>
          </h1>
        </div>
        <div className="cart-header-right">
          <div className="cart-stats">
            <Package size={16} />
            <span>{cart?.total_items || 0} productos</span>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {msg && (
        <div className={`cart-alert ${msg.type}`}>
          {msg.type === "success" ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="cart-alert-close">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Add Product Section */}
      <div className="cart-add-section">
        <div className="cart-add-header">
          <ShoppingBag size={18} />
          <h3>Agregar producto</h3>
        </div>
        <form onSubmit={handleAddItem} className="cart-add-form">
          <div className="cart-add-field">
            <label>Seleccionar producto</label>
            <select
              value={addForm.product_id}
              onChange={(e) =>
                setAddForm({ ...addForm, product_id: e.target.value })
              }
            >
              <option value="">Elige un producto...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ${p.price?.toLocaleString()}
                </option>
              ))}
            </select>
          </div>
          <div className="cart-add-field cart-add-quantity">
            <label>Cantidad</label>
            <input
              type="number"
              min="1"
              value={addForm.quantity}
              onChange={(e) =>
                setAddForm({ ...addForm, quantity: e.target.value })
              }
            />
          </div>
          <button type="submit" className="cart-add-btn">
            <Plus size={16} />
            <span>Agregar</span>
          </button>
        </form>
      </div>

      {/* Cart Items */}
      <div className="cart-items-section">
        <div className="cart-items-header">
          <h3>Tus productos</h3>
          {cart?.items?.length > 0 && (
            <button className="cart-clear-btn" onClick={handleClear}>
              <Trash2 size={14} />
              <span>Vaciar carrito</span>
            </button>
          )}
        </div>

        {cart?.items?.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-icon">
              <ShoppingCart size={64} strokeWidth={1} />
            </div>
            <h4>Tu carrito está vacío</h4>
            <p>Agrega productos usando el selector de arriba</p>
          </div>
        ) : (
          <>
            <div className="cart-items-list">
              {cart.items.map((item, idx) => {
                const product = products.find((p) => p.id === item.product_id);
                return (
                  <div
                    key={item.id}
                    className="cart-item"
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="cart-item-image">
                      {product?.image_urls?.[0] ? (
                        <img
                          src={product.image_urls[0]}
                          alt={item.product_name}
                        />
                      ) : (
                        <div className="cart-item-image-placeholder">
                          <Package size={24} />
                        </div>
                      )}
                    </div>

                    <div className="cart-item-info">
                      <h4 className="cart-item-name">
                        {item.product_name || `Producto #${item.product_id}`}
                      </h4>
                      <div className="cart-item-meta">
                        <span className="cart-item-price">
                          ${item.unit_price?.toLocaleString()}
                        </span>
                        <span className="cart-item-unit">/ unidad</span>
                      </div>
                    </div>

                    <div className="cart-item-quantity">
                      <button
                        className="cart-qty-btn"
                        onClick={() =>
                          handleUpdateQty(item.id, item.quantity - 1)
                        }
                      >
                        <Minus size={14} />
                      </button>
                      <span className="cart-qty-value">{item.quantity}</span>
                      <button
                        className="cart-qty-btn"
                        onClick={() =>
                          handleUpdateQty(item.id, item.quantity + 1)
                        }
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="cart-item-subtotal">
                      <span className="cart-subtotal-label">Subtotal</span>
                      <span className="cart-subtotal-value">
                        ${(item.unit_price * item.quantity).toLocaleString()}
                      </span>
                    </div>

                    <button
                      className={`cart-item-remove ${hoveredItem === item.id ? "visible" : ""}`}
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Cart Summary */}
            <div className="cart-summary">
              <div className="cart-summary-content">
                <div className="cart-summary-row">
                  <span>Subtotal</span>
                  <span>
                    $
                    {cart.subtotal?.toLocaleString() ||
                      calculateCartSubtotal(cart).toLocaleString()}
                  </span>
                </div>
                <div className="cart-summary-row">
                  <span>Envío</span>
                  <span className="cart-shipping-info">
                    Calculado en checkout
                  </span>
                </div>
                <div className="cart-summary-divider"></div>
                <div className="cart-summary-row cart-summary-total">
                  <span>Total</span>
                  <span className="cart-total-amount">
                    $
                    {cart.total?.toLocaleString() ||
                      calculateCartTotal(cart).toLocaleString()}
                  </span>
                </div>
                <div className="cart-summary-row cart-summary-items">
                  <span>
                    {cart.total_items ||
                      cart.items?.reduce(
                        (sum, item) => sum + item.quantity,
                        0,
                      )}{" "}
                    unidades
                  </span>
                </div>
              </div>

              <button
                className="cart-checkout-btn"
                onClick={handleCheckout}
                disabled={isCheckingOut}
              >
                {isCheckingOut ? (
                  <div className="cart-checkout-spinner"></div>
                ) : (
                  <>
                    <span>Proceder al pago</span>
                    <CreditCard size={18} />
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .cart-modern {
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .cart-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 16px;
        }

        .cart-loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .cart-header {
          background: linear-gradient(
            135deg,
            var(--surface) 0%,
            var(--bg2) 100%
          );
          border-radius: var(--radius-lg);
          padding: 24px 28px;
          margin-bottom: 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .cart-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 4px 12px;
          background: rgba(124, 252, 110, 0.1);
          border: 1px solid rgba(124, 252, 110, 0.2);
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
          color: var(--accent);
          margin-bottom: 12px;
        }

        .cart-title {
          font-size: 28px;
          font-weight: 800;
          margin: 0;
        }

        .cart-title span {
          display: block;
          font-size: 14px;
          font-weight: 400;
          color: var(--text2);
          margin-top: 4px;
        }

        .cart-stats {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: var(--bg);
          border-radius: 40px;
          font-size: 13px;
        }

        .cart-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          border-radius: var(--radius);
          margin-bottom: 20px;
          animation: slideDown 0.3s ease;
          position: relative;
        }

        .cart-alert.success {
          background: rgba(124, 252, 110, 0.1);
          border: 1px solid rgba(124, 252, 110, 0.2);
          color: var(--accent);
        }

        .cart-alert.error {
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.2);
          color: var(--danger);
        }

        .cart-alert-close {
          margin-left: auto;
          background: none;
          border: none;
          cursor: pointer;
          color: currentColor;
          opacity: 0.7;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .cart-add-section {
          background: var(--surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          padding: 20px 24px;
          margin-bottom: 28px;
        }

        .cart-add-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border);
        }

        .cart-add-header h3 {
          font-size: 16px;
          font-weight: 600;
        }

        .cart-add-form {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          align-items: flex-end;
        }

        .cart-add-field {
          flex: 2;
          min-width: 200px;
        }

        .cart-add-field label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: var(--text2);
          margin-bottom: 6px;
        }

        .cart-add-field select,
        .cart-add-field input {
          width: 100%;
          padding: 10px 14px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          color: var(--text);
          font-size: 14px;
          transition: all 0.2s;
        }

        .cart-add-field select:focus,
        .cart-add-field input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(124, 252, 110, 0.1);
        }

        .cart-add-quantity {
          flex: 0.5;
          min-width: 100px;
        }

        .cart-add-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border: none;
          border-radius: var(--radius);
          color: #000;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .cart-add-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(124, 252, 110, 0.3);
        }

        .cart-items-section {
          background: var(--surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          overflow: hidden;
        }

        .cart-items-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }

        .cart-items-header h3 {
          font-size: 16px;
          font-weight: 600;
        }

        .cart-clear-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.2);
          border-radius: 20px;
          color: var(--danger);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cart-clear-btn:hover {
          background: rgba(248, 113, 113, 0.2);
        }

        .cart-empty {
          text-align: center;
          padding: 60px 24px;
        }

        .cart-empty-icon {
          width: 120px;
          height: 120px;
          margin: 0 auto 24px;
          background: var(--bg2);
          border-radius: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text3);
        }

        .cart-empty h4 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .cart-empty p {
          color: var(--text2);
        }

        .cart-items-list {
          padding: 8px 0;
        }

        .cart-item {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
          transition: all 0.3s;
          animation: slideIn 0.3s ease-out forwards;
          opacity: 0;
          transform: translateX(-10px);
        }

        @keyframes slideIn {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .cart-item:hover {
          background: var(--bg2);
        }

        .cart-item-image {
          width: 70px;
          height: 70px;
          border-radius: 12px;
          overflow: hidden;
          background: var(--bg3);
          flex-shrink: 0;
        }

        .cart-item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cart-item-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text3);
        }

        .cart-item-info {
          flex: 2;
        }

        .cart-item-name {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 6px;
        }

        .cart-item-meta {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .cart-item-price {
          font-size: 15px;
          font-weight: 700;
          color: var(--accent);
        }

        .cart-item-unit {
          font-size: 11px;
          color: var(--text3);
        }

        .cart-item-quantity {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .cart-qty-btn {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: var(--bg);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cart-qty-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .cart-qty-value {
          font-size: 15px;
          font-weight: 600;
          min-width: 30px;
          text-align: center;
        }

        .cart-item-subtotal {
          text-align: right;
          min-width: 100px;
        }

        .cart-subtotal-label {
          display: block;
          font-size: 10px;
          color: var(--text3);
          margin-bottom: 2px;
        }

        .cart-subtotal-value {
          font-size: 16px;
          font-weight: 700;
          color: var(--accent);
        }

        .cart-item-remove {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text3);
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
          opacity: 0;
        }

        .cart-item-remove.visible,
        .cart-item:hover .cart-item-remove {
          opacity: 1;
        }

        .cart-item-remove:hover {
          background: rgba(248, 113, 113, 0.1);
          color: var(--danger);
        }

        .cart-summary {
          background: var(--bg2);
          padding: 24px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 24px;
        }

        .cart-summary-content {
          flex: 1;
          max-width: 300px;
        }

        .cart-summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 14px;
        }

        .cart-summary-row span:first-child {
          color: var(--text2);
        }

        .cart-shipping-info {
          font-size: 12px;
          color: var(--text3);
        }

        .cart-summary-divider {
          height: 1px;
          background: var(--border);
          margin: 16px 0;
        }

        .cart-summary-total {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .cart-total-amount {
          color: var(--accent);
          font-size: 22px;
        }

        .cart-summary-items {
          font-size: 12px;
          color: var(--text3);
        }

        .cart-checkout-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 32px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border: none;
          border-radius: 40px;
          font-size: 16px;
          font-weight: 700;
          color: #000;
          cursor: pointer;
          transition: all 0.3s;
        }

        .cart-checkout-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(124, 252, 110, 0.3);
        }

        .cart-checkout-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .cart-checkout-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(0, 0, 0, 0.3);
          border-top-color: #000;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @media (max-width: 768px) {
          .cart-item {
            flex-wrap: wrap;
          }
          .cart-item-subtotal {
            margin-left: auto;
          }
          .cart-summary {
            flex-direction: column;
          }
          .cart-checkout-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
