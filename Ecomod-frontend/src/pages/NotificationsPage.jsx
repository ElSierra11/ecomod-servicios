import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { notificationsApi } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, CheckCircle, XCircle, Mail, Filter, AlertCircle, Clock,
  Search, RefreshCw, Package, CreditCard, Truck, ShoppingBag,
  ChevronDown, ChevronUp, Trash2, CheckCheck, Sparkles, Zap, Info
} from "lucide-react";
import { cn } from "../lib/utils";

const TYPE_CONFIG = {
  order_confirmed: { icon: ShoppingBag, label: "Orden confirmada", c: "text-emerald-500", bg: "bg-emerald-500/10" },
  payment_succeeded: { icon: CreditCard, label: "Pago exitoso", c: "text-emerald-500", bg: "bg-emerald-500/10" },
  payment_failed: { icon: XCircle, label: "Pago fallido", c: "text-red-500", bg: "bg-red-500/10" },
  shipment_created: { icon: Truck, label: "Envío creado", c: "text-blue-500", bg: "bg-blue-500/10" },
  shipment_delivered: { icon: Package, label: "Pedido entregado", c: "text-purple-500", bg: "bg-purple-500/10" },
  system: { icon: Zap, label: "Sistema", c: "text-amber-500", bg: "bg-amber-500/10" },
  promotion: { icon: Sparkles, label: "Promoción", c: "text-pink-500", bg: "bg-pink-500/10" },
};

const GROUP_LABELS = { today: "Hoy", yesterday: "Ayer", week: "Esta semana", older: "Anteriores" };

export default function NotificationsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [readIds, setReadIds] = useState(new Set());

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await notificationsApi.getByUser(user.id);
      setNotifications(data);
      setReadIds(new Set(data.filter(n => n.sent).map(n => n.id)));
    } catch (e) {} finally { setLoading(false); }
  };

  const markAsRead = (id) => setReadIds(prev => new Set([...prev, id]));
  const markAllAsRead = () => setReadIds(new Set(notifications.map(n => n.id)));

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setReadIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const filtered = useMemo(() => {
    let r = filter === "all" ? notifications : notifications.filter(n => n.type === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      r = r.filter(n => (n.subject||"").toLowerCase().includes(q) || (n.body||"").toLowerCase().includes(q) || (n.email||"").toLowerCase().includes(q));
    }
    return r;
  }, [notifications, filter, searchQuery]);

  const grouped = useMemo(() => {
    const g = { today: [], yesterday: [], week: [], older: [] };
    const now = new Date(), todayStr = now.toDateString(), yesterdayStr = new Date(now - 86400000).toDateString();
    filtered.forEach(n => {
      const d = new Date(n.created_at), dStr = d.toDateString(), diff = Math.floor((now - d) / 86400000);
      if (dStr === todayStr) g.today.push(n);
      else if (dStr === yesterdayStr) g.yesterday.push(n);
      else if (diff <= 7) g.week.push(n);
      else g.older.push(n);
    });
    return g;
  }, [filtered]);

  const types = useMemo(() => [...new Set(notifications.map(n => n.type))], [notifications]);
  
  const stats = useMemo(() => ({
    total: notifications.length,
    unread: notifications.filter(n => !readIds.has(n.id)).length,
    sent: notifications.filter(n => n.sent).length,
    failed: notifications.filter(n => !n.sent).length,
  }), [notifications, readIds]);

  if (loading) return <div className="flex justify-center items-center h-64"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"/></div>;

  const unreadCount = stats.unread;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white relative">
            <Bell className="w-6 h-6" />
            {stats.unread > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-background border-2 border-primary text-primary rounded-full text-[10px] font-bold flex items-center justify-center">{stats.unread}</span>}
          </div>
          <div>
            <h1 className="text-3xl font-head font-bold">Notificaciones</h1>
            <p className="text-muted-foreground text-sm">{stats.unread > 0 ? `Tienes ${stats.unread} sin leer` : "Todo al día"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {stats.unread > 0 && <button onClick={markAllAsRead} className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl hover:bg-secondary font-bold text-sm transition-colors"><CheckCheck className="w-4 h-4" /> Marcar todo</button>}
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl hover:bg-secondary font-bold text-sm transition-colors"><RefreshCw className="w-4 h-4" /> Actualizar</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Bell, label: "Total", value: stats.total, c: "text-primary", bg: "bg-primary/10" },
          { icon: Mail, label: "Sin leer", value: stats.unread, c: "text-blue-500", bg: "bg-blue-500/10", glow: stats.unread > 0 },
          { icon: CheckCircle, label: "Enviadas", value: stats.sent, c: "text-emerald-500", bg: "bg-emerald-500/10" },
          { icon: AlertCircle, label: "Fallidas", value: stats.failed, c: "text-red-500", bg: "bg-red-500/10" },
        ].map(s => (
          <div key={s.label} className={cn("glass-card p-4 rounded-2xl flex items-center gap-4 border", s.glow ? "border-blue-500" : "border-border")}>
            <div className={cn("p-3 rounded-xl", s.bg, s.c)}><s.icon className="w-5 h-5" /></div>
            <div><p className="text-xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground font-bold uppercase">{s.label}</p></div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2 focus-within:border-primary">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 bg-transparent outline-none text-sm" />
          {searchQuery && <button onClick={() => setSearchQuery("")}><XCircle className="w-4 h-4 text-muted-foreground" /></button>}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 sm:pb-0">
          <button onClick={() => setFilter("all")} className={cn("px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors", filter==="all"?"bg-primary text-white":"bg-secondary/50 hover:bg-secondary")}>Todas</button>
          {types.map(t => (
            <button key={t} onClick={() => setFilter(t)} className={cn("px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors", filter===t?"bg-primary text-white":"bg-secondary/50 hover:bg-secondary")}>{TYPE_CONFIG[t]?.label || t}</button>
          ))}
        </div>
      </div>

      {!filtered.length ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-3xl">
          <Bell className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No hay notificaciones</h3>
          <p className="text-muted-foreground">Estás al día con tus notificaciones.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([gKey, items]) => {
            if (!items.length) return null;
            return (
              <div key={gKey}>
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">{GROUP_LABELS[gKey]}</h3>
                <div className="space-y-3">
                  {items.map((n, i) => {
                    const c = TYPE_CONFIG[n.type] || { icon: Info, label: n.type, c: "text-muted-foreground", bg: "bg-secondary" };
                    const expanded = selectedId === n.id;
                    const read = readIds.has(n.id);
                    return (
                      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}} key={n.id} onClick={() => { setSelectedId(expanded ? null : n.id); markAsRead(n.id); }} className={cn("glass-card rounded-2xl border border-border overflow-hidden cursor-pointer transition-colors hover:bg-secondary/20", !read && "border-primary/30 bg-primary/5")}>
                        <div className="p-4 flex items-start gap-4">
                          {!read && <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />}
                          <div className={cn("p-2 rounded-xl flex-shrink-0", c.bg, c.c)}><c.icon className="w-5 h-5" /></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                              <h4 className={cn("font-bold truncate", !read && "text-primary")}>{n.subject || c.label}</h4>
                              <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(n.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className={cn("px-2 py-0.5 rounded-md font-bold", c.bg, c.c)}>{c.label}</span>
                              <span className={cn("px-2 py-0.5 rounded-md font-bold flex items-center gap-1", n.sent?"bg-green-500/10 text-green-500":"bg-red-500/10 text-red-500")}>
                                {n.sent ? <CheckCircle className="w-3 h-3"/> : <XCircle className="w-3 h-3"/>} {n.sent?"Enviado":"Fallido"}
                              </span>
                            </div>
                          </div>
                          <button className="p-2 text-muted-foreground">{expanded ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}</button>
                        </div>
                        <AnimatePresence>
                          {expanded && (
                            <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="px-4 pb-4 overflow-hidden border-t border-border mt-2 pt-4 bg-secondary/10">
                              <div className="text-sm mb-4" dangerouslySetInnerHTML={{__html: n.body || "Sin contenido"}} />
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">Ref: {n.reference_type} #{n.reference_id}</p>
                                <div className="flex gap-2">
                                  <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }} className="px-3 py-1.5 rounded-lg text-sm font-bold text-destructive hover:bg-destructive/10 flex items-center gap-1"><Trash2 className="w-4 h-4"/> Eliminar</button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}
