import { useEffect, useState, useRef } from "react";
import { inventoryApi, catalogApi } from "../services/api";
import { useSwal } from "../hooks/useSwal"; // ← IMPORTAMOS SWAL
import {
  Package,
  AlertCircle,
  CheckCircle,
  Lock,
  Unlock,
  Plus,
  X,
  RefreshCw,
  BarChart3,
  Warehouse,
  Clock,
} from "lucide-react";

function Modal({ title, onClose, children }) {
  return (
    <div
      className="ec-inv-modal-bg"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="ec-inv-modal">
        <div className="ec-inv-modal-head">
          <h3>{title}</h3>
          <button className="ec-inv-modal-close" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        <div className="ec-inv-modal-body">{children}</div>
      </div>
    </div>
  );
}

function StatusBadge({ avail }) {
  if (avail === 0)
    return <span className="ec-inv-badge ec-inv-badge-danger">Agotado</span>;
  if (avail < 10)
    return (
      <span className="ec-inv-badge ec-inv-badge-warning">Stock bajo</span>
    );
  return <span className="ec-inv-badge ec-inv-badge-success">En stock</span>;
}

export default function InventoryPage() {
  const { success, error, warning, confirm, loading, close } = useSwal(false); // ← SWAL INTEGRADO
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [alert, setAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // ← renombrado
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ product_id: "", quantity: "" });
  const [rForm, setRForm] = useState({ product_id: "", quantity: "" });
  const [relForm, setRelForm] = useState({ product_id: "", quantity: "" });

  // Refs para validación de campos
  const stockProductRef = useRef(null);
  const stockQtyRef = useRef(null);
  const reserveProductRef = useRef(null);
  const reserveQtyRef = useRef(null);
  const releaseProductRef = useRef(null);
  const releaseQtyRef = useRef(null);

  const load = async () => {
    try {
      const [inv, prods] = await Promise.all([
        inventoryApi.getAll(),
        catalogApi.getProducts(),
      ]);
      setInventory(inv);
      setProducts(prods);
    } catch {
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
  const available = (item) => item.quantity - (item.reserved || 0);

  const totalUnits = inventory.reduce((s, i) => s + i.quantity, 0);
  const totalReserved = inventory.reduce((s, i) => s + (i.reserved || 0), 0);
  const lowStockCount = inventory.filter(
    (i) => available(i) > 0 && available(i) < 10,
  ).length;
  const outOfStockCount = inventory.filter((i) => available(i) === 0).length;

  // ─── VALIDACIONES POR CAMPO CON SWAL ─────────────────────────────────────

  const validateProductSelect = (productId, fieldName, ref = null) => {
    if (!productId || productId === "") {
      warning("Campo requerido", `Por favor selecciona un ${fieldName}`).then(
        () => {
          ref?.current?.focus();
        },
      );
      return false;
    }
    return true;
  };

  const validateQuantity = (quantity, fieldName, ref = null, min = 1) => {
    if (!quantity || quantity === "") {
      warning(
        "Campo requerido",
        `Por favor ingresa la cantidad a ${fieldName}`,
      ).then(() => {
        ref?.current?.focus();
      });
      return false;
    }
    const numQty = parseInt(quantity);
    if (isNaN(numQty) || numQty < min) {
      warning("Cantidad inválida", `La cantidad debe ser al menos ${min}`).then(
        () => {
          ref?.current?.focus();
        },
      );
      return false;
    }
    return true;
  };

  const validateReserveQuantity = (productId, quantity, ref = null) => {
    if (!validateQuantity(quantity, "reservar", ref, 1)) return false;

    const item = inventory.find(
      (i) => String(i.product_id) === String(productId),
    );
    if (!item) {
      warning(
        "Producto no encontrado",
        "El producto seleccionado no existe en el inventario",
      );
      return false;
    }

    const avail = available(item);
    const numQty = parseInt(quantity);
    if (numQty > avail) {
      warning(
        "Stock insuficiente",
        `Solo hay ${avail} unidades disponibles para reservar`,
      ).then(() => {
        ref?.current?.focus();
      });
      return false;
    }
    return true;
  };

  const validateReleaseQuantity = (productId, quantity, ref = null) => {
    if (!validateQuantity(quantity, "liberar", ref, 1)) return false;

    const item = inventory.find(
      (i) => String(i.product_id) === String(productId),
    );
    if (!item) {
      warning(
        "Producto no encontrado",
        "El producto seleccionado no existe en el inventario",
      );
      return false;
    }

    const reserved = item.reserved || 0;
    const numQty = parseInt(quantity);
    if (numQty > reserved) {
      warning(
        "Reserva insuficiente",
        `Solo hay ${reserved} unidades reservadas para liberar`,
      ).then(() => {
        ref?.current?.focus();
      });
      return false;
    }
    return true;
  };

  // ─── HANDLERS CON SWAL ───────────────────────────────────────────────────

  const saveStock = async (e) => {
    e.preventDefault();

    // Validación campo por campo
    if (!validateProductSelect(form.product_id, "producto", stockProductRef))
      return;
    if (!validateQuantity(form.quantity, "agregar", stockQtyRef, 1)) return;

    setIsLoading(true);
    loading("Registrando stock...");

    try {
      await inventoryApi.create({
        product_id: parseInt(form.product_id),
        quantity: parseInt(form.quantity),
      });
      close();
      success("¡Stock registrado!", "El inventario se actualizó correctamente");
      setModal(null);
      load();
    } catch (err) {
      close();
      error("Error al guardar", err.message || "No se pudo registrar el stock");
    } finally {
      setIsLoading(false);
    }
  };

  const reserveStock = async (e) => {
    e.preventDefault();

    // Validación campo por campo
    if (!validateProductSelect(rForm.product_id, "producto", reserveProductRef))
      return;
    if (
      !validateReserveQuantity(rForm.product_id, rForm.quantity, reserveQtyRef)
    )
      return;

    // Confirmación extra antes de reservar
    const result = await confirm(
      "¿Confirmar reserva?",
      `Vas a reservar ${rForm.quantity} unidades de "${pMap[rForm.product_id]}". ¿Deseas continuar?`,
      "Sí, reservar",
      "Cancelar",
    );

    if (!result.isConfirmed) return;

    setIsLoading(true);
    loading("Reservando stock...");

    try {
      const res = await inventoryApi.reserve({
        product_id: parseInt(rForm.product_id),
        quantity: parseInt(rForm.quantity),
      });
      if (res.success) {
        close();
        success("¡Reserva exitosa!", res.message);
        setModal(null);
        load();
      } else {
        close();
        warning("No se pudo reservar", res.message);
      }
    } catch (err) {
      close();
      error(
        "Error al reservar",
        err.message || "No se pudo completar la reserva",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const releaseStock = async (e) => {
    e.preventDefault();

    // Validación campo por campo
    if (
      !validateProductSelect(relForm.product_id, "producto", releaseProductRef)
    )
      return;
    if (
      !validateReleaseQuantity(
        relForm.product_id,
        relForm.quantity,
        releaseQtyRef,
      )
    )
      return;

    // Confirmación extra antes de liberar
    const result = await confirm(
      "¿Confirmar liberación?",
      `Vas a liberar ${relForm.quantity} unidades reservadas de "${pMap[relForm.product_id]}". ¿Deseas continuar?`,
      "Sí, liberar",
      "Cancelar",
    );

    if (!result.isConfirmed) return;

    setIsLoading(true);
    loading("Liberando stock...");

    try {
      const res = await inventoryApi.release({
        product_id: parseInt(relForm.product_id),
        quantity: parseInt(relForm.quantity),
      });
      if (res.success) {
        close();
        success("¡Liberación exitosa!", res.message);
        setModal(null);
        load();
      } else {
        close();
        warning("No se pudo liberar", res.message);
      }
    } catch (err) {
      close();
      error(
        "Error al liberar",
        err.message || "No se pudo completar la liberación",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const stats = [
    {
      icon: Package,
      label: "Productos",
      value: inventory.length,
      sub: "registrados",
      color: "#e8291c",
      bg: "rgba(232,41,28,.08)",
    },
    {
      icon: BarChart3,
      label: "Unidades",
      value: totalUnits.toLocaleString(),
      sub: "stock físico",
      color: "#2563eb",
      bg: "rgba(37,99,235,.08)",
    },
    {
      icon: Clock,
      label: "Reservadas",
      value: totalReserved.toLocaleString(),
      sub: "pendientes",
      color: "#d97706",
      bg: "rgba(217,119,6,.08)",
    },
    {
      icon: AlertCircle,
      label: "Agotados",
      value: outOfStockCount,
      sub: "sin stock",
      color: "#dc2626",
      bg: "rgba(220,38,38,.08)",
    },
  ];

  return (
    <div className="ec-inv">
      {/* Header */}
      <div className="ec-inv-header">
        <div className="ec-inv-header-left">
          <div className="ec-inv-eyebrow">
            <Warehouse size={13} /> INVENTARIO
          </div>
          <h1 className="ec-inv-title">Control de Stock</h1>
          <p className="ec-inv-sub">Gestión de inventario en tiempo real</p>
        </div>
        <div className="ec-inv-header-actions">
          <button className="ec-inv-btn ec-inv-btn-ghost" onClick={load}>
            <RefreshCw size={15} /> Actualizar
          </button>
          <button
            className="ec-inv-btn ec-inv-btn-outline"
            onClick={() => {
              setRelForm({ product_id: "", quantity: "" });
              setModal("release");
            }}
          >
            <Unlock size={15} /> Liberar
          </button>
          <button
            className="ec-inv-btn ec-inv-btn-warning"
            onClick={() => {
              setRForm({ product_id: "", quantity: "" });
              setModal("reserve");
            }}
          >
            <Lock size={15} /> Reservar
          </button>
          <button
            className="ec-inv-btn ec-inv-btn-primary"
            onClick={() => {
              setForm({ product_id: "", quantity: "" });
              setModal("stock");
            }}
          >
            <Plus size={15} /> Agregar Stock
          </button>
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <div className={`ec-inv-alert ${alert.type}`}>
          {alert.type === "success" ? (
            <CheckCircle size={15} />
          ) : (
            <AlertCircle size={15} />
          )}
          <span>{alert.text}</span>
          <button onClick={() => setAlert(null)}>
            <X size={13} />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="ec-inv-stats">
        {stats.map(({ icon: Icon, label, value, sub, color, bg }) => (
          <div key={label} className="ec-inv-stat">
            <div className="ec-inv-stat-icon" style={{ background: bg, color }}>
              <Icon size={22} />
            </div>
            <div className="ec-inv-stat-info">
              <span className="ec-inv-stat-label">{label}</span>
              <span className="ec-inv-stat-value" style={{ color }}>
                {value}
              </span>
              <span className="ec-inv-stat-sub">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Low stock warning */}
      {lowStockCount > 0 && (
        <div className="ec-inv-warning">
          <AlertCircle size={16} />
          <span>
            {lowStockCount} producto{lowStockCount > 1 ? "s" : ""} con stock
            bajo (menos de 10 unidades)
          </span>
        </div>
      )}

      {/* Table */}
      <div className="ec-inv-card">
        <div className="ec-inv-card-head">
          <span>Inventario ({inventory.length} productos)</span>
        </div>

        {inventory.length === 0 ? (
          <div className="ec-inv-empty">
            <div className="ec-inv-empty-icon">
              <Warehouse size={36} />
            </div>
            <h3>Inventario vacío</h3>
            <p>Agrega stock para empezar a gestionar el inventario</p>
            <button
              className="ec-inv-btn ec-inv-btn-primary"
              onClick={() => setModal("stock")}
              style={{ marginTop: 16 }}
            >
              <Plus size={15} /> Agregar primer producto
            </button>
          </div>
        ) : (
          <div className="ec-inv-table-wrap">
            <table className="ec-inv-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Producto</th>
                  <th>Stock Total</th>
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
                    item.quantity > 0
                      ? Math.round((avail / item.quantity) * 100)
                      : 0;
                  const barColor =
                    avail === 0
                      ? "#dc2626"
                      : avail < 10
                        ? "#d97706"
                        : "#16a34a";
                  return (
                    <tr
                      key={item.product_id}
                      className="ec-inv-row"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <td>
                        <span className="ec-inv-id">#{item.product_id}</span>
                      </td>
                      <td>
                        <span className="ec-inv-prod-name">
                          {pMap[item.product_id] ||
                            `Producto #${item.product_id}`}
                        </span>
                      </td>
                      <td>
                        <span className="ec-inv-num">{item.quantity}</span>
                      </td>
                      <td>
                        <span className="ec-inv-num ec-inv-reserved">
                          {item.reserved || 0}
                        </span>
                      </td>
                      <td>
                        <span
                          className="ec-inv-num"
                          style={{ color: barColor, fontWeight: 800 }}
                        >
                          {avail}
                        </span>
                      </td>
                      <td>
                        <div className="ec-inv-bar-wrap">
                          <div className="ec-inv-bar">
                            <div
                              className="ec-inv-bar-fill"
                              style={{ width: `${pct}%`, background: barColor }}
                            />
                          </div>
                          <span className="ec-inv-bar-pct">{pct}%</span>
                        </div>
                      </td>
                      <td>
                        <StatusBadge avail={avail} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add stock */}
      {modal === "stock" && (
        <Modal title="➕ Agregar Stock" onClose={() => setModal(null)}>
          <p className="ec-inv-modal-desc">
            Registra o actualiza el stock de un producto en el inventario.
          </p>
          <form className="ec-inv-modal-form" onSubmit={saveStock}>
            <div className="ec-inv-form-group">
              <label>Producto *</label>
              <select
                ref={stockProductRef}
                value={form.product_id}
                onChange={(e) =>
                  setForm({ ...form, product_id: e.target.value })
                }
              >
                <option value="">Selecciona un producto</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="ec-inv-form-group">
              <label>Cantidad a agregar *</label>
              <input
                ref={stockQtyRef}
                type="number"
                min="1"
                placeholder="Ej: 100"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
            <div className="ec-inv-modal-actions">
              <button
                type="button"
                className="ec-inv-btn ec-inv-btn-ghost"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="ec-inv-btn ec-inv-btn-primary"
                disabled={isLoading}
              >
                {isLoading ? "Guardando..." : "Guardar Stock"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Reserve */}
      {modal === "reserve" && (
        <Modal title="🔒 Reservar Stock" onClose={() => setModal(null)}>
          <p className="ec-inv-modal-desc">
            Reserva unidades de un producto para una orden pendiente.
          </p>
          <form className="ec-inv-modal-form" onSubmit={reserveStock}>
            <div className="ec-inv-form-group">
              <label>Producto *</label>
              <select
                ref={reserveProductRef}
                value={rForm.product_id}
                onChange={(e) =>
                  setRForm({ ...rForm, product_id: e.target.value })
                }
              >
                <option value="">Selecciona un producto</option>
                {inventory.map((i) => (
                  <option key={i.product_id} value={i.product_id}>
                    {pMap[i.product_id] || `Producto #${i.product_id}`} (disp:{" "}
                    {available(i)})
                  </option>
                ))}
              </select>
            </div>
            <div className="ec-inv-form-group">
              <label>Cantidad a reservar *</label>
              <input
                ref={reserveQtyRef}
                type="number"
                min="1"
                placeholder="Ej: 5"
                value={rForm.quantity}
                onChange={(e) =>
                  setRForm({ ...rForm, quantity: e.target.value })
                }
              />
            </div>
            <div className="ec-inv-modal-actions">
              <button
                type="button"
                className="ec-inv-btn ec-inv-btn-ghost"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="ec-inv-btn ec-inv-btn-warning"
                disabled={isLoading}
              >
                {isLoading ? "Reservando..." : "Reservar"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Release */}
      {modal === "release" && (
        <Modal title="🔓 Liberar Stock" onClose={() => setModal(null)}>
          <p className="ec-inv-modal-desc">
            Libera unidades reservadas de vuelta al stock disponible.
          </p>
          <form className="ec-inv-modal-form" onSubmit={releaseStock}>
            <div className="ec-inv-form-group">
              <label>Producto *</label>
              <select
                ref={releaseProductRef}
                value={relForm.product_id}
                onChange={(e) =>
                  setRelForm({ ...relForm, product_id: e.target.value })
                }
              >
                <option value="">Selecciona un producto</option>
                {inventory
                  .filter((i) => (i.reserved || 0) > 0)
                  .map((i) => (
                    <option key={i.product_id} value={i.product_id}>
                      {pMap[i.product_id] || `Producto #${i.product_id}`}{" "}
                      (reservado: {i.reserved})
                    </option>
                  ))}
              </select>
            </div>
            <div className="ec-inv-form-group">
              <label>Cantidad a liberar *</label>
              <input
                ref={releaseQtyRef}
                type="number"
                min="1"
                placeholder="Ej: 3"
                value={relForm.quantity}
                onChange={(e) =>
                  setRelForm({ ...relForm, quantity: e.target.value })
                }
              />
            </div>
            <div className="ec-inv-modal-actions">
              <button
                type="button"
                className="ec-inv-btn ec-inv-btn-ghost"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="ec-inv-btn ec-inv-btn-outline"
                disabled={isLoading}
              >
                {isLoading ? "Liberando..." : "Liberar Stock"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

        .ec-inv { font-family:'Nunito',sans-serif; animation:ecInvFade .3s ease; }
        @keyframes ecInvFade { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

        /* Header */
        .ec-inv-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; flex-wrap:wrap; gap:16px; }
        .ec-inv-eyebrow { display:inline-flex; align-items:center; gap:6px; font-size:10px; font-weight:800; letter-spacing:.16em; color:#e8291c; margin-bottom:6px; }
        .ec-inv-title { font-size:26px; font-weight:900; margin:0 0 4px; color:var(--text,#111); }
        .ec-inv-sub { font-size:13px; color:var(--text3,#9ca3af); margin:0; }
        .ec-inv-header-actions { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }

        /* Buttons */
        .ec-inv-btn {
          display:flex; align-items:center; gap:7px;
          padding:9px 18px; border-radius:9px;
          font-family:'Nunito',sans-serif; font-size:13px; font-weight:800;
          cursor:pointer; transition:all .2s; white-space:nowrap; border:none;
        }
        .ec-inv-btn-primary { background:linear-gradient(135deg,#e8291c,#c0392b); color:#fff; }
        .ec-inv-btn-primary:hover { transform:translateY(-2px); box-shadow:0 6px 16px rgba(232,41,28,.3); }
        .ec-inv-btn-warning { background:linear-gradient(135deg,#f59e0b,#d97706); color:#fff; }
        .ec-inv-btn-warning:hover { transform:translateY(-2px); box-shadow:0 6px 16px rgba(245,158,11,.3); }
        .ec-inv-btn-outline { background:transparent; border:1.5px solid #2563eb; color:#2563eb; }
        .ec-inv-btn-outline:hover { background:rgba(37,99,235,.06); }
        .ec-inv-btn-ghost { background:var(--surface,#fff); border:1.5px solid var(--border,rgba(0,0,0,.1)); color:var(--text2,#666); }
        .ec-inv-btn-ghost:hover { border-color:#e8291c; color:#e8291c; }
        .ec-inv-btn:disabled { opacity:.6; cursor:not-allowed; transform:none !important; }

        /* Alert */
        .ec-inv-alert { display:flex; align-items:center; gap:10px; padding:11px 14px; border-radius:10px; font-size:13px; font-weight:600; margin-bottom:20px; animation:ecInvSlide .25s ease; }
        @keyframes ecInvSlide { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        .ec-inv-alert.success { background:rgba(34,197,94,.08); border:1px solid rgba(34,197,94,.2); color:#16a34a; }
        .ec-inv-alert.error   { background:rgba(232,41,28,.08); border:1px solid rgba(232,41,28,.2); color:#e8291c; }
        .ec-inv-alert button  { margin-left:auto; background:none; border:none; cursor:pointer; color:inherit; display:flex; align-items:center; }

        /* Stats */
        .ec-inv-stats { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:14px; margin-bottom:20px; }
        .ec-inv-stat {
          background:var(--surface,#fff);
          border:1px solid var(--border,rgba(0,0,0,.08));
          border-radius:14px; padding:18px;
          display:flex; align-items:center; gap:14px;
          transition:all .2s;
        }
        .ec-inv-stat:hover { transform:translateY(-2px); box-shadow:0 4px 16px rgba(0,0,0,.08); }
        .ec-inv-stat-icon { width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .ec-inv-stat-info { display:flex; flex-direction:column; gap:2px; }
        .ec-inv-stat-label { font-size:11px; font-weight:700; color:var(--text3,#9ca3af); text-transform:uppercase; letter-spacing:.06em; }
        .ec-inv-stat-value { font-size:26px; font-weight:900; line-height:1.1; }
        .ec-inv-stat-sub { font-size:11px; color:var(--text3,#9ca3af); }

        /* Warning */
        .ec-inv-warning {
          display:flex; align-items:center; gap:10px;
          padding:12px 16px;
          background:rgba(245,158,11,.08);
          border:1px solid rgba(245,158,11,.2);
          border-radius:10px; margin-bottom:20px;
          font-size:13px; font-weight:700; color:#d97706;
        }

        /* Card */
        .ec-inv-card { background:var(--surface,#fff); border:1px solid var(--border,rgba(0,0,0,.08)); border-radius:14px; overflow:hidden; }
        .ec-inv-card-head { padding:16px 20px; border-bottom:1px solid var(--border,rgba(0,0,0,.07)); font-size:14px; font-weight:800; color:var(--text,#111); }

        /* Empty */
        .ec-inv-empty { text-align:center; padding:52px 24px; }
        .ec-inv-empty-icon { width:80px; height:80px; background:rgba(232,41,28,.06); border-radius:50%; display:flex; align-items:center; justify-content:center; color:#e8291c; margin:0 auto 16px; }
        .ec-inv-empty h3 { font-size:17px; font-weight:800; margin:0 0 6px; color:var(--text,#111); }
        .ec-inv-empty p  { font-size:13px; color:var(--text3,#9ca3af); margin:0; }

        /* Table */
        .ec-inv-table-wrap { overflow-x:auto; }
        .ec-inv-table { width:100%; border-collapse:collapse; }
        .ec-inv-table th {
          padding:13px 18px; text-align:left;
          font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.08em;
          color:var(--text3,#9ca3af);
          border-bottom:1px solid var(--border,rgba(0,0,0,.07));
          background:var(--bg2,#f9fafb);
        }
        .ec-inv-table td { padding:14px 18px; border-bottom:1px solid var(--border,rgba(0,0,0,.06)); font-size:13px; }
        .ec-inv-row { transition:background .15s; animation:ecInvRow .3s ease-out both; opacity:0; }
        @keyframes ecInvRow { to{opacity:1} }
        .ec-inv-row:hover { background:rgba(232,41,28,.02); }
        .ec-inv-row:last-child td { border-bottom:none; }

        .ec-inv-id { display:inline-block; padding:2px 8px; background:rgba(37,99,235,.08); border-radius:20px; font-size:11px; font-family:monospace; color:#2563eb; font-weight:700; }
        .ec-inv-prod-name { font-weight:700; color:var(--text,#111); }
        .ec-inv-num { font-weight:700; color:var(--text,#111); }
        .ec-inv-reserved { color:#d97706; }

        .ec-inv-bar-wrap { display:flex; align-items:center; gap:8px; min-width:100px; }
        .ec-inv-bar { flex:1; height:6px; background:var(--bg3,#f0f0f0); border-radius:3px; overflow:hidden; }
        .ec-inv-bar-fill { height:100%; border-radius:3px; transition:width .4s ease; }
        .ec-inv-bar-pct { font-size:11px; color:var(--text3,#9ca3af); min-width:36px; font-weight:600; }

        .ec-inv-badge { display:inline-block; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:700; }
        .ec-inv-badge-success { background:rgba(34,197,94,.1); color:#16a34a; }
        .ec-inv-badge-warning { background:rgba(245,158,11,.1); color:#d97706; }
        .ec-inv-badge-danger  { background:rgba(220,38,38,.1); color:#dc2626; }

        /* Modal */
        .ec-inv-modal-bg { position:fixed; inset:0; background:rgba(0,0,0,.55); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px; animation:ecInvFade .2s ease; }
        .ec-inv-modal { background:var(--surface,#fff); border-radius:16px; width:100%; max-width:460px; max-height:90vh; overflow-y:auto; animation:ecInvModalUp .25s ease; }
        @keyframes ecInvModalUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .ec-inv-modal-head { display:flex; justify-content:space-between; align-items:center; padding:18px 22px; border-bottom:1px solid var(--border,rgba(0,0,0,.08)); }
        .ec-inv-modal-head h3 { font-size:17px; font-weight:800; margin:0; color:var(--text,#111); }
        .ec-inv-modal-close { width:30px; height:30px; border-radius:8px; background:var(--bg2,#f5f5f5); border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--text3,#999); transition:all .15s; }
        .ec-inv-modal-close:hover { background:rgba(220,38,38,.08); color:#dc2626; }
        .ec-inv-modal-body { padding:22px; }
        .ec-inv-modal-desc { font-size:13px; color:var(--text2,#666); margin-bottom:20px; padding:10px 12px; background:var(--bg2,#f9fafb); border-radius:8px; border-left:3px solid #e8291c; }
        .ec-inv-modal-form { display:flex; flex-direction:column; gap:18px; }
        .ec-inv-form-group { display:flex; flex-direction:column; gap:6px; }
        .ec-inv-form-group label { font-size:12px; font-weight:700; color:var(--text2,#555); text-transform:uppercase; letter-spacing:.06em; }
        .ec-inv-form-group select, .ec-inv-form-group input {
          padding:10px 14px;
          background:var(--bg2,#f9fafb);
          border:1.5px solid var(--border,rgba(0,0,0,.1));
          border-radius:9px;
          font-family:'Nunito',sans-serif; font-size:14px;
          color:var(--text,#111); outline:none; transition:all .2s;
        }
        .ec-inv-form-group select:focus, .ec-inv-form-group input:focus { border-color:#e8291c; box-shadow:0 0 0 3px rgba(232,41,28,.1); }
        .ec-inv-modal-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:6px; }

        @media(max-width:768px) {
          .ec-inv-header { flex-direction:column; }
          .ec-inv-header-actions { flex-wrap:wrap; }
          .ec-inv-stats { grid-template-columns:1fr 1fr; }
        }
      `}</style>
    </div>
  );
}
