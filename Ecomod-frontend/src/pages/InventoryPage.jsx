import { useEffect, useState } from "react";
import { inventoryApi, catalogApi } from "../services/api";
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Lock,
  Unlock,
  Plus,
  X,
  RefreshCw,
  BarChart3,
  Warehouse,
  Truck,
  Clock,
} from "lucide-react";

function Modal({ title, onClose, children }) {
  return (
    <div
      className="modal-modern"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-modern-content">
        <div className="modal-modern-header">
          <h3>{title}</h3>
          <button className="modal-modern-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-modern-body">{children}</div>
      </div>
    </div>
  );
}

function StockColor(qty) {
  if (qty === 0) return "#ff6b6b";
  if (qty < 10) return "#fbbf24";
  return "#00ff88";
}

function StockStatusBadge({ avail }) {
  if (avail === 0) {
    return <span className="stock-badge stock-badge-danger">Agotado</span>;
  }
  if (avail < 10) {
    return <span className="stock-badge stock-badge-warning">Bajo stock</span>;
  }
  return <span className="stock-badge stock-badge-success">En stock</span>;
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
  const [hoveredRow, setHoveredRow] = useState(null);

  const load = async () => {
    try {
      const [inventoryData, productsData] = await Promise.all([
        inventoryApi.getAll(),
        catalogApi.getProducts(),
      ]);
      setInventory(inventoryData);
      setProducts(productsData);
    } catch (error) {
      showAlert("error", "Error al cargar datos");
    }
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

  const totalUnits = inventory.reduce((s, i) => s + i.quantity, 0);
  const totalReserved = inventory.reduce((s, i) => s + i.reserved, 0);
  const totalAvailable = totalUnits - totalReserved;
  const lowStockCount = inventory.filter(
    (i) => available(i) > 0 && available(i) < 10,
  ).length;
  const outOfStockCount = inventory.filter((i) => available(i) === 0).length;

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
    <div className="inventory-modern">
      {/* Header */}
      <div className="inventory-header">
        <div className="inventory-header-left">
          <div className="inventory-badge">
            <Warehouse size={14} />
            <span>GESTIÓN DE INVENTARIO</span>
          </div>
          <h1 className="inventory-title">
            Inventario
            <span>Control de stock en tiempo real</span>
          </h1>
        </div>
        <div className="inventory-header-right">
          <button
            className="inventory-btn-outline"
            onClick={() => setModal("release")}
          >
            <Unlock size={16} />
            <span>Liberar</span>
          </button>
          <button
            className="inventory-btn-warning"
            onClick={() => setModal("reserve")}
          >
            <Lock size={16} />
            <span>Reservar</span>
          </button>
          <button
            className="inventory-btn-primary"
            onClick={() => {
              setForm({ product_id: "", quantity: "" });
              setModal("stock");
            }}
          >
            <Plus size={16} />
            <span>Agregar Stock</span>
          </button>
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <div className={`inventory-alert ${alert.type}`}>
          {alert.type === "success" ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{alert.text}</span>
          <button onClick={() => setAlert(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="inventory-stats">
        <div className="inventory-stat-card">
          <div
            className="inventory-stat-icon"
            style={{ background: "rgba(0, 255, 136, 0.1)", color: "#00ff88" }}
          >
            <Package size={24} />
          </div>
          <div className="inventory-stat-info">
            <span className="inventory-stat-label">Items en inventario</span>
            <span className="inventory-stat-value">{inventory.length}</span>
            <span className="inventory-stat-sub">productos registrados</span>
          </div>
        </div>
        <div className="inventory-stat-card">
          <div
            className="inventory-stat-icon"
            style={{ background: "rgba(0, 212, 255, 0.1)", color: "#00d4ff" }}
          >
            <BarChart3 size={24} />
          </div>
          <div className="inventory-stat-info">
            <span className="inventory-stat-label">Unidades totales</span>
            <span className="inventory-stat-value">
              {totalUnits.toLocaleString()}
            </span>
            <span className="inventory-stat-sub">stock físico</span>
          </div>
        </div>
        <div className="inventory-stat-card">
          <div
            className="inventory-stat-icon"
            style={{ background: "rgba(251, 191, 36, 0.1)", color: "#fbbf24" }}
          >
            <Clock size={24} />
          </div>
          <div className="inventory-stat-info">
            <span className="inventory-stat-label">Unidades reservadas</span>
            <span className="inventory-stat-value">
              {totalReserved.toLocaleString()}
            </span>
            <span className="inventory-stat-sub">pendientes</span>
          </div>
        </div>
        <div className="inventory-stat-card">
          <div
            className="inventory-stat-icon"
            style={{ background: "rgba(255, 107, 107, 0.1)", color: "#ff6b6b" }}
          >
            <AlertCircle size={24} />
          </div>
          <div className="inventory-stat-info">
            <span className="inventory-stat-label">Productos agotados</span>
            <span className="inventory-stat-value">{outOfStockCount}</span>
            <span className="inventory-stat-sub">sin stock disponible</span>
          </div>
        </div>
      </div>

      {/* Low Stock Warning */}
      {lowStockCount > 0 && (
        <div className="inventory-warning">
          <AlertCircle size={18} />
          <span>
            {lowStockCount} productos tienen stock bajo (menos de 10 unidades)
          </span>
        </div>
      )}

      {/* Inventory Table */}
      {inventory.length === 0 ? (
        <div className="inventory-empty">
          <Package size={48} strokeWidth={1} />
          <h3>Sin registros de inventario</h3>
          <p>Agrega stock para tus productos</p>
        </div>
      ) : (
        <div className="inventory-table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>ID</th>
                <th>Stock total</th>
                <th>Reservado</th>
                <th>Disponible</th>
                <th>Nivel</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item, idx) => {
                const avail = available(item);
                const pct =
                  item.quantity > 0 ? (avail / item.quantity) * 100 : 0;
                const productName =
                  pMap[item.product_id] || `Producto #${item.product_id}`;

                return (
                  <tr
                    key={item.id}
                    className="inventory-table-row"
                    onMouseEnter={() => setHoveredRow(item.product_id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{ animationDelay: `${idx * 0.03}s` }}
                  >
                    <td className="inventory-product-name">
                      <div className="inventory-product-info">
                        <span className="inventory-product-title">
                          {productName}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="inventory-id-badge">
                        {item.product_id}
                      </span>
                    </td>
                    <td className="inventory-quantity">{item.quantity}</td>
                    <td className="inventory-reserved">{item.reserved}</td>
                    <td
                      className="inventory-available"
                      style={{ color: StockColor(avail), fontWeight: 700 }}
                    >
                      {avail}
                    </td>
                    <td className="inventory-stock-cell">
                      <div className="inventory-stock-bar-container">
                        <div className="inventory-stock-bar">
                          <div
                            className="inventory-stock-fill"
                            style={{
                              width: `${pct}%`,
                              background: StockColor(avail),
                            }}
                          />
                        </div>
                        <span className="inventory-stock-percent">
                          {Math.round(pct)}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <StockStatusBadge avail={avail} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Add Stock */}
      {modal === "stock" && (
        <Modal
          title="Registrar / Actualizar stock"
          onClose={() => setModal(null)}
        >
          <p className="inventory-modal-desc">
            Si el producto ya tiene registro, el stock se actualizará. Si no, se
            creará uno nuevo.
          </p>
          <form onSubmit={saveStock} className="inventory-modal-form">
            <div className="inventory-form-group">
              <label>Producto *</label>
              <select
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
            <div className="inventory-form-group">
              <label>Cantidad total *</label>
              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, quantity: e.target.value }))
                }
                required
                placeholder="Ej: 100"
              />
            </div>
            <div className="inventory-modal-actions">
              <button
                type="button"
                className="inventory-btn-secondary"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inventory-btn-primary"
                disabled={loading}
              >
                {loading ? "Guardando..." : "Registrar stock"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Reserve */}
      {modal === "reserve" && (
        <Modal title="Reservar stock" onClose={() => setModal(null)}>
          <p className="inventory-modal-desc">
            Reserva unidades para un pedido en proceso. El stock disponible se
            reducirá.
          </p>
          <form onSubmit={reserveStock} className="inventory-modal-form">
            <div className="inventory-form-group">
              <label>Producto *</label>
              <select
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
            <div className="inventory-form-group">
              <label>Cantidad a reservar *</label>
              <input
                type="number"
                min="1"
                value={rForm.quantity}
                onChange={(e) =>
                  setRForm((f) => ({ ...f, quantity: e.target.value }))
                }
                required
                placeholder="Ej: 5"
              />
            </div>
            <div className="inventory-modal-actions">
              <button
                type="button"
                className="inventory-btn-secondary"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inventory-btn-warning"
                disabled={loading}
              >
                {loading ? "Reservando..." : "Confirmar reserva"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Release */}
      {modal === "release" && (
        <Modal title="Liberar stock reservado" onClose={() => setModal(null)}>
          <p className="inventory-modal-desc">
            Libera unidades reservadas de vuelta al stock disponible (ej. pedido
            cancelado).
          </p>
          <form onSubmit={releaseStock} className="inventory-modal-form">
            <div className="inventory-form-group">
              <label>Producto *</label>
              <select
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
            <div className="inventory-form-group">
              <label>Cantidad a liberar *</label>
              <input
                type="number"
                min="1"
                value={relForm.quantity}
                onChange={(e) =>
                  setRelForm((f) => ({ ...f, quantity: e.target.value }))
                }
                required
                placeholder="Ej: 3"
              />
            </div>
            <div className="inventory-modal-actions">
              <button
                type="button"
                className="inventory-btn-secondary"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inventory-btn-outline"
                disabled={loading}
              >
                {loading ? "Liberando..." : "Liberar stock"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <style jsx>{`
        .inventory-modern {
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

        .inventory-header {
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

        .inventory-badge {
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

        .inventory-title {
          font-size: 28px;
          font-weight: 800;
          margin: 0;
        }

        .inventory-title span {
          display: block;
          font-size: 14px;
          font-weight: 400;
          color: var(--text2);
          margin-top: 4px;
        }

        .inventory-header-right {
          display: flex;
          gap: 12px;
        }

        .inventory-btn-primary,
        .inventory-btn-outline,
        .inventory-btn-warning {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: var(--radius);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .inventory-btn-primary {
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border: none;
          color: #000;
        }

        .inventory-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(124, 252, 110, 0.3);
        }

        .inventory-btn-warning {
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.3);
          color: #fbbf24;
        }

        .inventory-btn-warning:hover {
          background: rgba(251, 191, 36, 0.2);
          transform: translateY(-2px);
        }

        .inventory-btn-outline {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text2);
        }

        .inventory-btn-outline:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .inventory-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          border-radius: var(--radius);
          margin-bottom: 20px;
          animation: slideDown 0.3s ease;
        }

        .inventory-alert.success {
          background: rgba(124, 252, 110, 0.1);
          border: 1px solid rgba(124, 252, 110, 0.2);
          color: var(--accent);
        }

        .inventory-alert.error {
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.2);
          color: var(--danger);
        }

        .inventory-alert button {
          margin-left: auto;
          background: none;
          border: none;
          cursor: pointer;
          color: currentColor;
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

        .inventory-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .inventory-stat-card {
          background: var(--surface);
          border-radius: var(--radius-lg);
          padding: 20px;
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s;
        }

        .inventory-stat-card:hover {
          transform: translateY(-2px);
          border-color: var(--accent);
        }

        .inventory-stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .inventory-stat-info {
          flex: 1;
        }

        .inventory-stat-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text3);
          margin-bottom: 4px;
        }

        .inventory-stat-value {
          display: block;
          font-size: 28px;
          font-weight: 800;
        }

        .inventory-stat-sub {
          display: block;
          font-size: 11px;
          color: var(--text3);
          margin-top: 4px;
        }

        .inventory-warning {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.2);
          border-radius: var(--radius);
          color: #fbbf24;
          margin-bottom: 24px;
        }

        .inventory-empty {
          text-align: center;
          padding: 60px 24px;
          background: var(--surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
        }

        .inventory-empty svg {
          color: var(--text3);
          margin-bottom: 16px;
        }

        .inventory-empty h3 {
          font-size: 18px;
          margin-bottom: 8px;
        }

        .inventory-empty p {
          color: var(--text2);
        }

        .inventory-table-container {
          background: var(--surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          overflow-x: auto;
        }

        .inventory-table {
          width: 100%;
          border-collapse: collapse;
        }

        .inventory-table th {
          padding: 16px 20px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text3);
          border-bottom: 1px solid var(--border);
          background: var(--bg2);
        }

        .inventory-table td {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          font-size: 14px;
        }

        .inventory-table-row {
          transition: all 0.2s;
          animation: slideRow 0.3s ease-out forwards;
          opacity: 0;
          transform: translateX(-10px);
        }

        @keyframes slideRow {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .inventory-table-row:hover {
          background: var(--bg2);
        }

        .inventory-product-name {
          font-weight: 600;
          color: var(--text);
        }

        .inventory-product-title {
          font-weight: 600;
        }

        .inventory-id-badge {
          display: inline-block;
          padding: 2px 8px;
          background: rgba(0, 212, 255, 0.1);
          border-radius: 20px;
          font-size: 11px;
          font-family: monospace;
          color: #00d4ff;
        }

        .inventory-quantity,
        .inventory-reserved {
          font-weight: 600;
        }

        .inventory-available {
          font-weight: 700;
        }

        .inventory-stock-cell {
          min-width: 120px;
        }

        .inventory-stock-bar-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .inventory-stock-bar {
          flex: 1;
          height: 6px;
          background: var(--bg3);
          border-radius: 3px;
          overflow: hidden;
        }

        .inventory-stock-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s;
        }

        .inventory-stock-percent {
          font-size: 11px;
          color: var(--text3);
          min-width: 40px;
        }

        .stock-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .stock-badge-success {
          background: rgba(0, 255, 136, 0.1);
          color: #00ff88;
        }

        .stock-badge-warning {
          background: rgba(251, 191, 36, 0.1);
          color: #fbbf24;
        }

        .stock-badge-danger {
          background: rgba(255, 107, 107, 0.1);
          color: #ff6b6b;
        }

        .modal-modern {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn 0.2s ease;
        }

        .modal-modern-content {
          background: var(--surface);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-modern-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }

        .modal-modern-header h3 {
          font-size: 18px;
          font-weight: 700;
        }

        .modal-modern-close {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--bg2);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-modern-body {
          padding: 24px;
        }

        .inventory-modal-desc {
          font-size: 13px;
          color: var(--text2);
          margin-bottom: 20px;
          padding: 10px 12px;
          background: var(--bg2);
          border-radius: var(--radius);
        }

        .inventory-modal-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .inventory-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .inventory-form-group label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text2);
        }

        .inventory-form-group select,
        .inventory-form-group input {
          padding: 10px 14px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          color: var(--text);
          font-size: 14px;
          transition: all 0.2s;
        }

        .inventory-form-group select:focus,
        .inventory-form-group input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(124, 252, 110, 0.1);
        }

        .inventory-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 8px;
        }

        .inventory-btn-secondary {
          padding: 10px 20px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          color: var(--text2);
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .inventory-header {
            flex-direction: column;
            align-items: stretch;
          }
          .inventory-header-right {
            justify-content: stretch;
          }
          .inventory-header-right button {
            flex: 1;
            justify-content: center;
          }
          .inventory-stats {
            grid-template-columns: 1fr 1fr;
          }
          .inventory-table th,
          .inventory-table td {
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
}
