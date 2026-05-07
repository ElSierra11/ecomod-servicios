import { useEffect, useState, useRef } from "react";
import { inventoryApi, catalogApi } from "../services/api";
import { useSwal } from "../hooks/useSwal";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, AlertCircle, CheckCircle, Lock, Unlock, Plus, X,
  RefreshCw, BarChart3, Warehouse, Clock
} from "lucide-react";
import { cn } from "../lib/utils";

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center bg-secondary/30">
          <h3 className="font-bold text-lg">{title}</h3>
          <button className="p-2 hover:bg-secondary rounded-full" onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </div>
  );
}

function StatusBadge({ avail }) {
  if (avail === 0) return <span className="px-2 py-1 bg-red-500/10 text-red-500 text-xs font-bold rounded-md">Agotado</span>;
  if (avail < 10) return <span className="px-2 py-1 bg-amber-500/10 text-amber-500 text-xs font-bold rounded-md">Stock bajo</span>;
  return <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-md">En stock</span>;
}

export default function InventoryPage() {
  const { success, error, warning, confirm, loading, close } = useSwal(false);
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ product_id: "", quantity: "" });
  const [rForm, setRForm] = useState({ product_id: "", quantity: "" });
  const [relForm, setRelForm] = useState({ product_id: "", quantity: "" });

  const refs = { stockP: useRef(), stockQ: useRef(), resP: useRef(), resQ: useRef(), relP: useRef(), relQ: useRef() };

  const load = async () => {
    try {
      const [inv, prods] = await Promise.all([inventoryApi.getAll(), catalogApi.getProducts()]);
      setInventory(inv); setProducts(prods);
    } catch { error("Error", "Error al cargar datos"); }
  };

  useEffect(() => { load(); }, []);

  const pMap = Object.fromEntries(products.map(p => [p.id, p.name]));
  const available = (item) => item.quantity - (item.reserved || 0);

  const totalUnits = inventory.reduce((s, i) => s + i.quantity, 0);
  const totalReserved = inventory.reduce((s, i) => s + (i.reserved || 0), 0);
  const lowStockCount = inventory.filter(i => available(i) > 0 && available(i) < 10).length;
  const outOfStockCount = inventory.filter(i => available(i) === 0).length;

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
    if (!form.product_id) return warning("Requerido", "Selecciona producto").then(() => refs.stockP.current?.focus());
    if (!form.quantity || form.quantity < 1) return warning("Inválido", "Cantidad inválida").then(() => refs.stockQ.current?.focus());

    setIsLoading(true); loading("Registrando...");
    try {
      await inventoryApi.create({ product_id: parseInt(form.product_id), quantity: parseInt(form.quantity) });
      close(); success("¡Stock registrado!", "Se actualizó el inventario"); setModal(null); load();
    } catch (err) { close(); error("Error", err.message); } finally { setIsLoading(false); }
  };

  const reserveStock = async (e) => {
    e.preventDefault();
    if (!rForm.product_id) return warning("Requerido", "Selecciona producto").then(() => refs.resP.current?.focus());
    const qty = parseInt(rForm.quantity);
    if (!qty || qty < 1) return warning("Inválido", "Cantidad inválida").then(() => refs.resQ.current?.focus());
    
    const item = inventory.find(i => String(i.product_id) === String(rForm.product_id));
    if (!item) return warning("Error", "Producto no existe");
    if (qty > available(item)) return warning("Stock insuficiente", `Solo hay ${available(item)} disponibles`);

    const res = await confirm("¿Reservar?", `Vas a reservar ${qty} unidades de "${pMap[rForm.product_id]}".`, "Reservar", "Cancelar");
    if (!res.isConfirmed) return;

    setIsLoading(true); loading("Reservando...");
    try {
      const resp = await inventoryApi.reserve({ product_id: parseInt(rForm.product_id), quantity: qty });
      close();
      if (resp.success) { success("¡Reserva exitosa!", resp.message); setModal(null); load(); }
      else warning("No se pudo reservar", resp.message);
    } catch (err) { close(); error("Error", err.message); } finally { setIsLoading(false); }
  };

  const releaseStock = async (e) => {
    e.preventDefault();
    if (!relForm.product_id) return warning("Requerido", "Selecciona producto").then(() => refs.relP.current?.focus());
    const qty = parseInt(relForm.quantity);
    if (!qty || qty < 1) return warning("Inválido", "Cantidad inválida").then(() => refs.relQ.current?.focus());
    
    const item = inventory.find(i => String(i.product_id) === String(relForm.product_id));
    if (!item) return warning("Error", "Producto no existe");
    if (qty > (item.reserved || 0)) return warning("Error", `Solo hay ${item.reserved} reservadas`);

    const res = await confirm("¿Liberar?", `Vas a liberar ${qty} unidades de "${pMap[relForm.product_id]}".`, "Liberar", "Cancelar");
    if (!res.isConfirmed) return;

    setIsLoading(true); loading("Liberando...");
    try {
      const resp = await inventoryApi.release({ product_id: parseInt(relForm.product_id), quantity: qty });
      close();
      if (resp.success) { success("¡Liberación exitosa!", resp.message); setModal(null); load(); }
      else warning("No se pudo liberar", resp.message);
    } catch (err) { close(); error("Error", err.message); } finally { setIsLoading(false); }
  };

  const stats = [
    { icon: Package, label: "Productos", value: inventory.length, sub: "registrados", c: "text-primary", bg: "bg-primary/10" },
    { icon: BarChart3, label: "Unidades", value: totalUnits.toLocaleString(), sub: "stock físico", c: "text-blue-500", bg: "bg-blue-500/10" },
    { icon: Clock, label: "Reservadas", value: totalReserved.toLocaleString(), sub: "pendientes", c: "text-amber-500", bg: "bg-amber-500/10" },
    { icon: AlertCircle, label: "Agotados", value: outOfStockCount, sub: "sin stock", c: "text-red-500", bg: "bg-red-500/10" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs tracking-widest uppercase mb-1"><Warehouse className="w-4 h-4" /> Inventario</div>
          <h1 className="text-3xl font-head font-bold">Control de Stock</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors font-bold text-sm"><RefreshCw className="w-4 h-4" /> Actualizar</button>
          <button onClick={() => { setRelForm({product_id:"", quantity:""}); setModal("release"); }} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-500 text-blue-500 hover:bg-blue-500/10 transition-colors font-bold text-sm"><Unlock className="w-4 h-4" /> Liberar</button>
          <button onClick={() => { setRForm({product_id:"", quantity:""}); setModal("reserve"); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors font-bold text-sm"><Lock className="w-4 h-4" /> Reservar</button>
          <button onClick={() => { setForm({product_id:"", quantity:""}); setModal("stock"); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors font-bold text-sm"><Plus className="w-4 h-4" /> Agregar</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="glass-card p-5 rounded-2xl flex items-center gap-4">
            <div className={cn("p-3 rounded-xl", s.bg, s.c)}><s.icon className="w-6 h-6" /></div>
            <div><p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
          </div>
        ))}
      </div>

      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20 font-bold text-sm">
          <AlertCircle className="w-5 h-5" /> {lowStockCount} producto{lowStockCount > 1 ? "s" : ""} con stock bajo.
        </div>
      )}

      <div className="glass-card rounded-3xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border bg-secondary/30"><h2 className="font-bold">Inventario ({inventory.length})</h2></div>
        {!inventory.length ? (
          <div className="text-center p-12"><Warehouse className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" /> <h3 className="text-xl font-bold mb-2">Vacío</h3> <button onClick={() => setModal("stock")} className="px-6 py-2 bg-primary text-white rounded-full font-bold">Agregar primer producto</button></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/20 text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                  <th className="p-4 font-bold">ID</th><th className="p-4 font-bold">Producto</th><th className="p-4 font-bold">Total</th><th className="p-4 font-bold">Reserva</th><th className="p-4 font-bold">Disp</th><th className="p-4 font-bold min-w-[150px]">Nivel</th><th className="p-4 font-bold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {inventory.map(i => {
                  const avail = available(i);
                  const pct = i.quantity > 0 ? Math.round((avail / i.quantity) * 100) : 0;
                  const barColor = avail === 0 ? "bg-red-500" : avail < 10 ? "bg-amber-500" : "bg-green-500";
                  return (
                    <tr key={i.product_id} className="hover:bg-secondary/10 transition-colors text-sm">
                      <td className="p-4 font-mono text-muted-foreground">#{i.product_id}</td>
                      <td className="p-4 font-bold">{pMap[i.product_id] || `Producto #${i.product_id}`}</td>
                      <td className="p-4">{i.quantity}</td>
                      <td className="p-4 text-amber-500">{i.reserved || 0}</td>
                      <td className={cn("p-4 font-bold", avail===0?"text-red-500":avail<10?"text-amber-500":"text-green-500")}>{avail}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2"><div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden"><div className={cn("h-full rounded-full", barColor)} style={{width:`${pct}%`}}/></div><span className="text-xs w-8">{pct}%</span></div>
                      </td>
                      <td className="p-4"><StatusBadge avail={avail} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modal === "stock" && (
          <Modal title="Agregar Stock" onClose={() => setModal(null)}>
            <form onSubmit={saveStock} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-muted-foreground mb-2 block">Producto</label>
                <select ref={refs.stockP} value={form.product_id} onChange={e => setForm({...form, product_id: e.target.value})} className="w-full p-3 bg-background border border-border rounded-xl outline-none focus:border-primary">
                  <option value="">-- Seleccionar --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-muted-foreground mb-2 block">Cantidad</label>
                <input ref={refs.stockQ} type="number" min="1" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="w-full p-3 bg-background border border-border rounded-xl outline-none focus:border-primary" />
              </div>
              <button type="submit" disabled={isLoading} className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50">Guardar</button>
            </form>
          </Modal>
        )}
        {modal === "reserve" && (
          <Modal title="Reservar Stock" onClose={() => setModal(null)}>
            <form onSubmit={reserveStock} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-muted-foreground mb-2 block">Producto</label>
                <select ref={refs.resP} value={rForm.product_id} onChange={e => setRForm({...rForm, product_id: e.target.value})} className="w-full p-3 bg-background border border-border rounded-xl outline-none focus:border-primary">
                  <option value="">-- Seleccionar --</option>
                  {inventory.map(i => <option key={i.product_id} value={i.product_id}>{pMap[i.product_id]} (disp: {available(i)})</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-muted-foreground mb-2 block">Cantidad</label>
                <input ref={refs.resQ} type="number" min="1" value={rForm.quantity} onChange={e => setRForm({...rForm, quantity: e.target.value})} className="w-full p-3 bg-background border border-border rounded-xl outline-none focus:border-primary" />
              </div>
              <button type="submit" disabled={isLoading} className="w-full py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 disabled:opacity-50">Reservar</button>
            </form>
          </Modal>
        )}
        {modal === "release" && (
          <Modal title="Liberar Stock" onClose={() => setModal(null)}>
            <form onSubmit={releaseStock} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-muted-foreground mb-2 block">Producto</label>
                <select ref={refs.relP} value={relForm.product_id} onChange={e => setRelForm({...relForm, product_id: e.target.value})} className="w-full p-3 bg-background border border-border rounded-xl outline-none focus:border-primary">
                  <option value="">-- Seleccionar --</option>
                  {inventory.filter(i => (i.reserved || 0) > 0).map(i => <option key={i.product_id} value={i.product_id}>{pMap[i.product_id]} (res: {i.reserved})</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-muted-foreground mb-2 block">Cantidad</label>
                <input ref={refs.relQ} type="number" min="1" value={relForm.quantity} onChange={e => setRelForm({...relForm, quantity: e.target.value})} className="w-full p-3 bg-background border border-border rounded-xl outline-none focus:border-primary" />
              </div>
              <button type="submit" disabled={isLoading} className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 disabled:opacity-50">Liberar</button>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
