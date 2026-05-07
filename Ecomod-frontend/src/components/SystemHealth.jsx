import { useState, useEffect, useCallback } from "react";
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Server, 
  Cpu, 
  Zap,
  Globe,
  Database,
  Truck,
  CreditCard,
  Bell,
  ShoppingCart,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  authApi, 
  catalogApi, 
  inventoryApi, 
  cartApi, 
  ordersApi, 
  paymentsApi, 
  shippingApi, 
  notificationsApi 
} from "../services/api";

const SERVICES = [
  { id: "auth", name: "Auth Service", api: authApi, icon: Globe },
  { id: "catalog", name: "Catalog Service", api: catalogApi, icon: Layers },
  { id: "inventory", name: "Inventory Service", api: inventoryApi, icon: Database },
  { id: "cart", name: "Cart Service", api: cartApi, icon: ShoppingCart },
  { id: "orders", name: "Order Service", api: ordersApi, icon: Cpu },
  { id: "payments", name: "Payment Service", api: paymentsApi, icon: CreditCard },
  { id: "shipping", name: "Shipping Service", api: shippingApi, icon: Truck },
  { id: "notifications", name: "Notification Service", api: notificationsApi, icon: Bell },
];

export default function SystemHealth() {
  const [health, setHealth] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const checkHealth = useCallback(async () => {
    setRefreshing(true);
    const results = {};
    
    await Promise.all(SERVICES.map(async (svc) => {
      const start = Date.now();
      try {
        const res = await svc.api.health();
        const latency = Date.now() - start;
        results[svc.id] = { status: "healthy", latency, ...res };
      } catch (e) {
        results[svc.id] = { status: "down", error: e.message };
      }
    }));

    setHealth(results);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [checkHealth]);

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold font-head flex items-center gap-2">
            <Activity className="text-primary w-6 h-6" />
            Estado del Ecosistema
          </h2>
          <p className="text-sm text-muted-foreground">Monitoreo en tiempo real de microservicios</p>
        </div>
        <button 
          onClick={checkHealth} 
          disabled={refreshing}
          className="p-2 hover:bg-secondary rounded-xl transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {SERVICES.map((svc, i) => {
            const data = health[svc.id];
            const isDown = !data || data.status === "down";
            const isHealthy = data?.status === "healthy";

            return (
              <motion.div
                key={svc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-2xl p-4 relative overflow-hidden group hover:shadow-lg transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-2 rounded-xl ${isHealthy ? 'bg-green-500/10 text-green-500' : isDown ? 'bg-red-500/10 text-red-500' : 'bg-secondary text-muted-foreground'}`}>
                    <svc.icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    {isHealthy && <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">{data.latency}ms</span>}
                    <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  </div>
                </div>

                <h3 className="font-bold text-sm mb-1">{svc.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {isHealthy ? "Operativo" : isDown ? "Fuera de servicio" : "Verificando..."}
                </p>

                {/* Background Decoration */}
                <div className={`absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity`}>
                  <svc.icon size={64} />
                </div>
                
                {isDown && data?.error && (
                  <div className="mt-2 text-[10px] text-red-500 bg-red-500/5 p-1.5 rounded-lg truncate" title={data.error}>
                    {data.error}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Summary Footer */}
      <div className="mt-6 p-4 bg-secondary/30 rounded-2xl border border-border/50 flex flex-wrap gap-6 text-sm">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Cluster:</span>
          <span className="font-bold">EcoMod-Main</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">Región:</span>
          <span className="font-bold">AWS-US-East-1</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="font-bold text-green-500">
            {Object.values(health).filter(v => v.status === "healthy").length}/{SERVICES.length} Online
          </span>
        </div>
      </div>
    </div>
  );
}
