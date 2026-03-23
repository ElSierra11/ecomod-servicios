import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { cartApi, catalogApi } from "../services/api";

export default function CartPage() {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [addForm, setAddForm] = useState({ product_id: "", quantity: 1 });

  useEffect(() => {
    loadCart();
    loadProducts();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      let c = null;
      try {
        c = await cartApi.getByUser(user.id);
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
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await cartApi.removeItem(cart.id, itemId);
      await loadCart();
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
    try {
      await cartApi.clearCart(cart.id);
      setMsg({ type: "success", text: "Carrito vaciado" });
      await loadCart();
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    }
  };

  if (loading)
    return (
      <div className="page">
        <div className="empty">
          <div className="empty-icon">🛒</div>
          <p>Cargando carrito...</p>
        </div>
      </div>
    );

  return (
    <div className="page">
      {msg && (
        <div
          className={`alert alert-${msg.type === "error" ? "error" : "success"} fade-in`}
        >
          {msg.text}
        </div>
      )}

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-header" style={{ marginBottom: 16 }}>
          <span className="section-title">Agregar producto</span>
          <span className="badge badge-cyan">Carrito #{cart?.id}</span>
        </div>
        <form
          onSubmit={handleAddItem}
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <div
            className="form-group"
            style={{ flex: 1, minWidth: 200, marginBottom: 0 }}
          >
            <label className="form-label">Producto</label>
            <select
              className="form-select"
              value={addForm.product_id}
              onChange={(e) =>
                setAddForm({ ...addForm, product_id: e.target.value })
              }
            >
              <option value="">Selecciona un producto</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ${p.price?.toLocaleString()}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ width: 100, marginBottom: 0 }}>
            <label className="form-label">Cantidad</label>
            <input
              type="number"
              min="1"
              className="form-input"
              value={addForm.quantity}
              onChange={(e) =>
                setAddForm({ ...addForm, quantity: e.target.value })
              }
            />
          </div>
          <button type="submit" className="btn btn-primary">
            + Agregar
          </button>
        </form>
      </div>

      <div className="card">
        <div className="section-header">
          <div>
            <span className="section-title">Mi carrito</span>
            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
              {cart?.user_id
                ? `Usuario #${cart.user_id}`
                : `Token: ${cart?.anonymous_token?.slice(0, 18)}...`}
            </div>
          </div>
          {cart?.items?.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={handleClear}>
              Vaciar carrito
            </button>
          )}
        </div>

        {cart?.items?.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🛒</div>
            <div className="empty-title">El carrito está vacío</div>
            <p>Agrega productos usando el selector de arriba</p>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Precio unit.</th>
                    <th style={{ textAlign: "center" }}>Cantidad</th>
                    <th style={{ textAlign: "right" }}>Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.items.map((item) => (
                    <tr key={item.id}>
                      <td style={{ color: "var(--text)", fontWeight: 500 }}>
                        {item.product_name || `Producto #${item.product_id}`}
                      </td>
                      <td>${item.unit_price?.toLocaleString()}</td>
                      <td style={{ textAlign: "center" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                          }}
                        >
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() =>
                              handleUpdateQty(item.id, item.quantity - 1)
                            }
                          >
                            −
                          </button>
                          <span
                            style={{
                              fontWeight: 600,
                              minWidth: 20,
                              textAlign: "center",
                            }}
                          >
                            {item.quantity}
                          </span>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() =>
                              handleUpdateQty(item.id, item.quantity + 1)
                            }
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          color: "var(--text)",
                          fontWeight: 600,
                        }}
                      >
                        ${item.subtotal?.toLocaleString()}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 0 0",
                marginTop: 16,
                borderTop: "1px solid var(--border)",
              }}
            >
              <span style={{ color: "var(--text2)", fontSize: 14 }}>
                {cart.total_items} unidades
              </span>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text3)",
                    marginBottom: 2,
                  }}
                >
                  Total
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: "var(--accent)",
                    fontFamily: "var(--font-head)",
                  }}
                >
                  ${cart.total?.toLocaleString()}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
