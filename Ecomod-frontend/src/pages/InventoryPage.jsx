import { useEffect, useState } from "react";
import { inventoryApi, catalogApi } from "../services/api";

function Modal({ title, onClose, children }) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StockColor(qty) {
  if (qty === 0) return "var(--danger)";
  if (qty < 10) return "var(--warning)";
  return "var(--accent)";
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ product_id: "", quantity: "" });
  const [rForm, setRForm] = useState({ product_id: "", quantity: "" });
  const [relForm, setRelForm] = useState({ product_id: "", quantity: "" });

  const load = () => {
    inventoryApi
      .getAll()
      .then(setInventory)
      .catch(() => {});
    catalogApi
      .getProducts()
      .then(setProducts)
      .catch(() => {});
  };
  useEffect(() => {
    load();
  }, []);

  const showAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 3500);
  };
  const pMap = Object.fromEntries(products.map((p) => [p.id, p.name]));

  const available = (item) => item.quantity - item.reserved;

  // CREATE / UPDATE STOCK
  const saveStock = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await inventoryApi.create({
        product_id: parseInt(form.product_id),
        quantity: parseInt(form.quantity),
      });
      showAlert("success", "Stock registrado correctamente");
      setModal(null);
      load();
    } catch (err) {
      showAlert("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // RESERVE
  const reserveStock = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await inventoryApi.reserve({
        product_id: parseInt(rForm.product_id),
        quantity: parseInt(rForm.quantity),
      });
      if (res.success) {
        showAlert("success", res.message);
        setModal(null);
        load();
      } else showAlert("error", res.message);
    } catch (err) {
      showAlert("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // RELEASE
  const releaseStock = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await inventoryApi.release({
        product_id: parseInt(relForm.product_id),
        quantity: parseInt(relForm.quantity),
      });
      if (res.success) {
        showAlert("success", res.message);
        setModal(null);
        load();
      } else showAlert("error", res.message);
    } catch (err) {
      showAlert("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page fade-in">
      {alert && (
        <div
          className={`alert alert-${alert.type === "error" ? "error" : "success"}`}
        >
          {alert.text}
        </div>
      )}

      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <h2
            style={{
              fontFamily: "var(--font-head)",
              fontSize: 26,
              fontWeight: 800,
            }}
          >
            Inventario
          </h2>
          <p style={{ color: "var(--text2)", fontSize: 14, marginTop: 4 }}>
            Gestiona el stock en tiempo real — reservas y liberaciones
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setModal("release")}
          >
            ↩ Liberar
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setModal("reserve")}
          >
            🔒 Reservar
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setForm({ product_id: "", quantity: "" });
              setModal("stock");
            }}
          >
            + Stock
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Items con stock</div>
          <div className="stat-value" style={{ color: "var(--cyan)" }}>
            {inventory.length}
          </div>
          <div className="stat-sub">registros de inventario</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Unidades totales</div>
          <div className="stat-value" style={{ color: "var(--accent)" }}>
            {inventory.reduce((s, i) => s + i.quantity, 0)}
          </div>
          <div className="stat-sub">en todos los productos</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Unidades reservadas</div>
          <div className="stat-value" style={{ color: "var(--warning)" }}>
            {inventory.reduce((s, i) => s + i.reserved, 0)}
          </div>
          <div className="stat-sub">pendientes de confirmar</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Productos sin stock</div>
          <div className="stat-value" style={{ color: "var(--danger)" }}>
            {inventory.filter((i) => i.quantity - i.reserved === 0).length}
          </div>
          <div className="stat-sub">disponible = 0</div>
        </div>
      </div>

      {/* TABLE */}
      {inventory.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📦</div>
          <div className="empty-title">Sin registros de inventario</div>
          <p>Añade stock para un producto</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>ID Producto</th>
                <th>Stock total</th>
                <th>Reservado</th>
                <th>Disponible</th>
                <th>Nivel</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => {
                const avail = available(item);
                const pct =
                  item.quantity > 0 ? (avail / item.quantity) * 100 : 0;
                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600, color: "var(--text)" }}>
                      {pMap[item.product_id] || `Producto #${item.product_id}`}
                    </td>
                    <td>
                      <span className="badge badge-cyan">
                        {item.product_id}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{item.quantity}</td>
                    <td
                      style={{
                        color:
                          item.reserved > 0 ? "var(--warning)" : "var(--text3)",
                      }}
                    >
                      {item.reserved}
                    </td>
                    <td style={{ fontWeight: 700, color: StockColor(avail) }}>
                      {avail}
                    </td>
                    <td style={{ minWidth: 120 }}>
                      <div className="stock-bar">
                        <div
                          className="stock-fill"
                          style={{
                            width: `${pct}%`,
                            background: StockColor(avail),
                          }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text3)",
                          marginTop: 3,
                        }}
                      >
                        {Math.round(pct)}% disponible
                      </div>
                    </td>
                    <td>
                      {avail === 0 ? (
                        <span className="badge badge-red">Agotado</span>
                      ) : avail < 10 ? (
                        <span className="badge badge-yellow">Bajo stock</span>
                      ) : (
                        <span className="badge badge-green">En stock</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: AÑADIR / ACTUALIZAR STOCK */}
      {modal === "stock" && (
        <Modal
          title="Registrar / Actualizar stock"
          onClose={() => setModal(null)}
        >
          <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>
            Si el producto ya tiene registro, el stock se actualizará. Si no, se
            creará uno nuevo.
          </p>
          <form onSubmit={saveStock}>
            <div className="form-group">
              <label className="form-label">Producto *</label>
              <select
                className="form-select"
                value={form.product_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, product_id: e.target.value }))
                }
                required
              >
                <option value="">Selecciona un producto</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (ID: {p.id})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Cantidad total *</label>
              <input
                className="form-input"
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, quantity: e.target.value }))
                }
                required
              />
            </div>
            <div className="flex gap-2" style={{ justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Guardando..." : "Registrar stock"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: RESERVAR */}
      {modal === "reserve" && (
        <Modal title="🔒 Reservar stock" onClose={() => setModal(null)}>
          <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>
            Reserva unidades para un pedido en proceso. El stock disponible se
            reducirá.
          </p>
          <form onSubmit={reserveStock}>
            <div className="form-group">
              <label className="form-label">Producto *</label>
              <select
                className="form-select"
                value={rForm.product_id}
                onChange={(e) =>
                  setRForm((f) => ({ ...f, product_id: e.target.value }))
                }
                required
              >
                <option value="">Selecciona un producto</option>
                {inventory.map((i) => (
                  <option key={i.product_id} value={i.product_id}>
                    {pMap[i.product_id] || `Producto #${i.product_id}`} —
                    Disponible: {available(i)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Cantidad a reservar *</label>
              <input
                className="form-input"
                type="number"
                min="1"
                value={rForm.quantity}
                onChange={(e) =>
                  setRForm((f) => ({ ...f, quantity: e.target.value }))
                }
                required
              />
            </div>
            <div className="flex gap-2" style={{ justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Reservando..." : "Confirmar reserva"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: LIBERAR */}
      {modal === "release" && (
        <Modal title="↩ Liberar stock reservado" onClose={() => setModal(null)}>
          <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>
            Libera unidades reservadas de vuelta al stock disponible (ej. pedido
            cancelado).
          </p>
          <form onSubmit={releaseStock}>
            <div className="form-group">
              <label className="form-label">Producto *</label>
              <select
                className="form-select"
                value={relForm.product_id}
                onChange={(e) =>
                  setRelForm((f) => ({ ...f, product_id: e.target.value }))
                }
                required
              >
                <option value="">Selecciona un producto</option>
                {inventory
                  .filter((i) => i.reserved > 0)
                  .map((i) => (
                    <option key={i.product_id} value={i.product_id}>
                      {pMap[i.product_id] || `Producto #${i.product_id}`} —
                      Reservado: {i.reserved}
                    </option>
                  ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Cantidad a liberar *</label>
              <input
                className="form-input"
                type="number"
                min="1"
                value={relForm.quantity}
                onChange={(e) =>
                  setRelForm((f) => ({ ...f, quantity: e.target.value }))
                }
                required
              />
            </div>
            <div className="flex gap-2" style={{ justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-outline"
                disabled={loading}
              >
                {loading ? "Liberando..." : "Liberar stock"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
