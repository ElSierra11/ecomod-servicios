import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { useToast } from "../App";
import { useCart } from "../App";
import { catalogApi, ordersApi, cartApi } from "../services/api";
import {
  ShoppingCart,
  Package,
  ClipboardList,
  CreditCard,
  DollarSign,
  Truck,
  TrendingUp,
  CheckCircle,
  Clock,
  ArrowRight,
  Star,
  Eye,
  Zap,
  Tag,
  Percent,
  ChevronRight,
  Flame,
  Award,
  RefreshCw,
  Box,
  ShoppingBag,
  Plus,
  Minus,
  Heart,
  Share2,
  Filter,
  Grid3X3,
  List,
  Search,
  X,
  Check,
  Sparkles,
} from "lucide-react";

const formatCOP = (n) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(n);

const STATUS_MAP = {
  confirmed: {
    label: "Confirmado",
    color: "#16a34a",
    bg: "rgba(22,163,74,.1)",
  },
  completed: {
    label: "Completado",
    color: "#16a34a",
    bg: "rgba(22,163,74,.1)",
  },
  pending: { label: "Pendiente", color: "#f59e0b", bg: "rgba(245,158,11,.1)" },
  shipped: { label: "Enviado", color: "#3b82f6", bg: "rgba(59,130,246,.1)" },
  cancelled: { label: "Cancelado", color: "#dc2626", bg: "rgba(220,38,38,.1)" },
};

export default function Dashboard({ setPage }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { addToast } = useToast();
  const { cartCount, updateCartCount } = useCart();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState({});
  const [stats, setStats] = useState({
    sales: 0,
    orders: 0,
    products: 0,
    avgTicket: 0,
  });
  const [heroBanner, setHeroBanner] = useState(0);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddProduct, setQuickAddProduct] = useState(null);
  const [quickAddQty, setQuickAddQty] = useState(1);
  const isDark = theme === "dark";

  useEffect(() => {
    load();
    const t = setInterval(() => setHeroBanner((b) => (b + 1) % 3), 5000);
    return () => clearInterval(t);
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [prods, ords, cart] = await Promise.all([
        catalogApi.getProducts(),
        ordersApi.getByUser(user?.id),
        cartApi.getByUser(user?.id).catch(() => null),
      ]);
      setProducts(prods?.slice(0, 8) || []);
      setOrders(ords?.slice(0, 5) || []);
      const sales = ords?.reduce((s, o) => s + (o.total_amount || 0), 0) || 0;
      setStats({
        sales,
        orders: ords?.length || 0,
        products: prods?.length || 0,
        avgTicket: ords?.length ? Math.round(sales / ords.length) : 0,
      });
      // Update global cart count
      if (cart?.items) {
        const count = cart.items.reduce(
          (s, i) => s + (parseInt(i.quantity) || 1),
          0,
        );
        updateCartCount(count);
      }
    } catch (e) {
      console.error(e);
      addToast("error", "Error", "No se pudieron cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product, qty = 1) => {
    const pid = product.id;
    setAddingToCart((prev) => ({ ...prev, [pid]: true }));
    try {
      let cart = await cartApi.getByUser(user?.id).catch(async () => {
        return await cartApi.create({ user_id: user?.id });
      });

      await cartApi.addItem(cart.id, {
        product_id: pid,
        quantity: qty,
        unit_price: product.price || 0,
        product_name: product.name || "",
      });

      // Refresh cart count
      const updatedCart = await cartApi.getByUser(user?.id);
      const newCount =
        updatedCart.items?.reduce(
          (s, i) => s + (parseInt(i.quantity) || 1),
          0,
        ) || 0;
      updateCartCount(newCount);

      addToast(
        "success",
        "¡Agregado!",
        `"${product.name}" añadido al carrito (${qty})`,
      );
      setQuickAddOpen(false);
      setQuickAddQty(1);
    } catch (e) {
      addToast("error", "Error", e.message || "No se pudo agregar al carrito");
    } finally {
      setAddingToCart((prev) => ({ ...prev, [pid]: false }));
    }
  };

  const openQuickAdd = (product) => {
    setQuickAddProduct(product);
    setQuickAddQty(1);
    setQuickAddOpen(true);
  };

  const banners = [
    {
      title: "Ofertas de temporada",
      sub: "Hasta 50% de descuento en electrodomésticos seleccionados",
      cta: "Ver ofertas",
      gradient: "linear-gradient(135deg, #e8291c 0%, #f97316 100%)",
      emoji: "⚡",
      tag: "SUPER OFERTA",
    },
    {
      title: "Envío gratis nacional",
      sub: "En compras mayores a $150.000 COP. ¡Aprovecha ya!",
      cta: "Comprar ahora",
      gradient: "linear-gradient(135deg, #1d4ed8 0%, #0891b2 100%)",
      emoji: "🚚",
      tag: "ENVÍO GRATIS",
    },
    {
      title: "Nuevos productos 2026",
      sub: "Descubre las últimas novedades en tecnología, hogar y más",
      cta: "Explorar novedades",
      gradient: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
      emoji: "✨",
      tag: "NUEVO",
    },
  ];

  const categories = [
    {
      name: "Tecnología",
      icon: "💻",
      color: "#3b82f6",
      count: 24,
      gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    },
    {
      name: "Electrodomésticos",
      icon: "🏠",
      color: "#f97316",
      count: 18,
      gradient: "linear-gradient(135deg, #f97316, #ea580c)",
    },
    {
      name: "Ropa y Moda",
      icon: "👕",
      color: "#ec4899",
      count: 42,
      gradient: "linear-gradient(135deg, #ec4899, #db2777)",
    },
    {
      name: "Deportes",
      icon: "⚽",
      color: "#10b981",
      count: 31,
      gradient: "linear-gradient(135deg, #10b981, #059669)",
    },
    {
      name: "Hogar",
      icon: "🛋️",
      color: "#8b5cf6",
      count: 27,
      gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
    },
    {
      name: "Juguetes",
      icon: "🎮",
      color: "#f59e0b",
      count: 15,
      gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    },
  ];

  const promos = [
    {
      icon: Truck,
      title: "Envío gratis",
      sub: "En compras +$150k",
      color: "#3b82f6",
    },
    {
      icon: RefreshCw,
      title: "30 días devolución",
      sub: "Sin preguntas",
      color: "#10b981",
    },
    {
      icon: Award,
      title: "Garantía oficial",
      sub: "Productos originales",
      color: "#f59e0b",
    },
    {
      icon: Zap,
      title: "Pago seguro",
      sub: "Stripe & PayPal",
      color: "#8b5cf6",
    },
  ];

  if (loading) {
    return (
      <div className="db-loading">
        <div className="db-spinner" />
        <span>Cargando tu tienda...</span>
        <div className="db-loading-dots">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  return (
    <div className={`db-root ${isDark ? "dark" : "light"}`}>
      {/* ══ HERO BANNER ══ */}
      <section className="db-hero">
        <div className="db-hero-inner">
          {banners.map((b, i) => (
            <div
              key={i}
              className={`db-banner ${i === heroBanner ? "active" : ""}`}
              style={{ background: b.gradient }}
            >
              <div className="db-banner-glow" />
              <div className="db-banner-content">
                <div className="db-banner-tag">{b.tag}</div>
                <span className="db-banner-emoji">{b.emoji}</span>
                <div className="db-banner-text">
                  <h2 className="db-banner-title">{b.title}</h2>
                  <p className="db-banner-sub">{b.sub}</p>
                  <button
                    className="db-banner-cta"
                    onClick={() => setPage?.("catalog")}
                  >
                    {b.cta} <ArrowRight size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
              <div className="db-banner-shine" />
            </div>
          ))}
        </div>
        <div className="db-banner-dots">
          {banners.map((_, i) => (
            <button
              key={i}
              className={`db-dot ${i === heroBanner ? "active" : ""}`}
              onClick={() => setHeroBanner(i)}
            />
          ))}
        </div>
      </section>

      {/* ══ PROMO STRIP ══ */}
      <section className="db-promos">
        {promos.map(({ icon: Icon, title, sub, color }) => (
          <div key={title} className="db-promo">
            <div
              className="db-promo-icon"
              style={{ color, background: `${color}14` }}
            >
              <Icon size={22} strokeWidth={2} />
            </div>
            <div>
              <div className="db-promo-title">{title}</div>
              <div className="db-promo-sub">{sub}</div>
            </div>
          </div>
        ))}
      </section>

      {/* ══ STATS ══ */}
      <section className="db-stats">
        {[
          {
            icon: DollarSign,
            label: "Mis compras",
            value: formatCOP(stats.sales),
            color: "#e8291c",
            trend: "+12%",
            iconBg: "rgba(232,41,28,.1)",
          },
          {
            icon: ClipboardList,
            label: "Pedidos realizados",
            value: stats.orders,
            color: "#3b82f6",
            trend: `${stats.orders} total`,
            iconBg: "rgba(59,130,246,.1)",
          },
          {
            icon: ShoppingBag,
            label: "Productos disponibles",
            value: stats.products,
            color: "#10b981",
            trend: "en catálogo",
            iconBg: "rgba(16,185,129,.1)",
          },
          {
            icon: Tag,
            label: "Ticket promedio",
            value: formatCOP(stats.avgTicket),
            color: "#f59e0b",
            trend: "por orden",
            iconBg: "rgba(245,158,11,.1)",
          },
        ].map(({ icon: Icon, label, value, color, trend, iconBg }, i) => (
          <div
            key={label}
            className="db-stat"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className="db-stat-icon" style={{ background: iconBg, color }}>
              <Icon size={22} strokeWidth={2} />
            </div>
            <div className="db-stat-body">
              <span className="db-stat-label">{label}</span>
              <span className="db-stat-value">{value}</span>
              <span className="db-stat-trend">{trend}</span>
            </div>
          </div>
        ))}
      </section>

      {/* ══ CATEGORIES ══ */}
      <section className="db-section">
        <div className="db-section-head">
          <h2>
            <Flame size={18} strokeWidth={2.5} style={{ color: "#e8291c" }} />
            Explorar por categoría
          </h2>
          <button className="db-see-all" onClick={() => setPage?.("catalog")}>
            Ver todo <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        </div>
        <div className="db-cats">
          {categories.map(({ name, icon, color, count, gradient }) => (
            <button
              key={name}
              className="db-cat"
              onClick={() => setPage?.("catalog")}
            >
              <div className="db-cat-icon" style={{ background: gradient }}>
                <span>{icon}</span>
              </div>
              <span className="db-cat-name">{name}</span>
              <span className="db-cat-count">{count} productos</span>
            </button>
          ))}
        </div>
      </section>

      {/* ══ FEATURED PRODUCTS ══ */}
      <section className="db-section">
        <div className="db-section-head">
          <h2>
            <Sparkles
              size={18}
              strokeWidth={2.5}
              style={{ color: "#f97316" }}
            />
            Productos destacados
          </h2>
          <div className="db-section-actions">
            <button className="db-view-toggle active">
              <Grid3X3 size={14} strokeWidth={2} />
            </button>
            <button className="db-see-all" onClick={() => setPage?.("catalog")}>
              Ver catálogo <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="db-empty">
            <Package size={48} strokeWidth={1} />
            <h3>No hay productos disponibles aún</h3>
            <p>Los productos aparecerán aquí cuando estén disponibles</p>
            <button
              className="db-empty-btn"
              onClick={() => setPage?.("catalog")}
            >
              Explorar catálogo
            </button>
          </div>
        ) : (
          <div className="db-products">
            {products.map((p, i) => {
              const discount = [10, 15, 20, 25, 30][i % 5];
              const original = Math.round(p.price * (1 + discount / 100));
              const isAdding = addingToCart[p.id];

              return (
                <div
                  key={p.id}
                  className="db-product"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {/* Badges */}
                  <div className="db-product-badges">
                    {i < 3 && (
                      <span
                        className={`db-badge ${i === 0 ? "hot" : i === 1 ? "top" : "new"}`}
                      >
                        {i === 0 ? "🔥 HOT" : i === 1 ? "⭐ TOP" : "🆕 NUEVO"}
                      </span>
                    )}
                    <span className="db-badge discount">-{discount}%</span>
                  </div>

                  {/* Image */}
                  <div className="db-product-img">
                    {p.image_urls?.[0] ? (
                      <img src={p.image_urls[0]} alt={p.name} loading="lazy" />
                    ) : (
                      <div className="db-product-placeholder">
                        <Package size={36} strokeWidth={1.5} />
                      </div>
                    )}
                    <div className="db-product-overlay">
                      <button
                        className="db-product-action"
                        onClick={() => setPage?.("catalog")}
                      >
                        <Eye size={15} strokeWidth={2} />
                      </button>
                      <button className="db-product-action">
                        <Heart size={15} strokeWidth={2} />
                      </button>
                      <button className="db-product-action">
                        <Share2 size={15} strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="db-product-body">
                    <p className="db-product-name">{p.name}</p>

                    <div className="db-product-stars">
                      {[...Array(5)].map((_, j) => (
                        <Star
                          key={j}
                          size={12}
                          fill={j < 4 ? "#f59e0b" : "none"}
                          color="#f59e0b"
                          strokeWidth={2}
                        />
                      ))}
                      <span>({24 + i * 3})</span>
                    </div>

                    <div className="db-product-pricing">
                      <span className="db-product-original">
                        {formatCOP(original)}
                      </span>
                      <span className="db-product-price">
                        {formatCOP(p.price)}
                      </span>
                      <span className="db-product-save">
                        Ahorras {formatCOP(original - p.price)}
                      </span>
                    </div>

                    <div className="db-product-actions">
                      <button
                        className={`db-product-cart ${isAdding ? "loading" : ""}`}
                        onClick={() => openQuickAdd(p)}
                        disabled={isAdding}
                      >
                        {isAdding ? (
                          <span className="db-spinner-sm" />
                        ) : (
                          <>
                            <ShoppingCart size={14} strokeWidth={2} />
                            Agregar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ══ RECENT ORDERS ══ */}
      <section className="db-section">
        <div className="db-section-head">
          <h2>
            <ClipboardList
              size={18}
              strokeWidth={2.5}
              style={{ color: "#3b82f6" }}
            />
            Mis pedidos recientes
          </h2>
          <button className="db-see-all" onClick={() => setPage?.("orders")}>
            Ver todos <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="db-empty">
            <ShoppingBag size={48} strokeWidth={1} />
            <h3>Aún no tienes pedidos</h3>
            <p>¡Empieza a comprar y tus pedidos aparecerán aquí!</p>
            <button
              className="db-empty-btn"
              onClick={() => setPage?.("catalog")}
            >
              Ir a comprar
            </button>
          </div>
        ) : (
          <div className="db-orders">
            {orders.map((o) => {
              const s = STATUS_MAP[o.status] || {
                label: o.status,
                color: "#6b7280",
                bg: "rgba(107,114,128,.1)",
              };
              return (
                <div key={o.id} className="db-order">
                  <div className="db-order-left">
                    <div className="db-order-icon">
                      <Package size={18} strokeWidth={2} />
                    </div>
                    <div>
                      <div className="db-order-id">Pedido #{o.id}</div>
                      <div className="db-order-date">
                        {new Date(o.created_at).toLocaleDateString("es-CO", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                      <div className="db-order-items">
                        {o.items?.length || 0} producto(s)
                      </div>
                    </div>
                  </div>
                  <div className="db-order-right">
                    <div className="db-order-amount">
                      {formatCOP(o.total_amount)}
                    </div>
                    <div
                      className="db-order-status"
                      style={{ color: s.color, background: s.bg }}
                    >
                      <span
                        className="db-status-dot"
                        style={{ background: s.color }}
                      />
                      {s.label}
                    </div>
                    <button
                      className="db-order-detail"
                      onClick={() => setPage?.("orders")}
                    >
                      Ver detalle <ArrowRight size={12} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ══ QUICK ADD MODAL ══ */}
      {quickAddOpen && quickAddProduct && (
        <div
          className="db-modal-overlay"
          onClick={() => setQuickAddOpen(false)}
        >
          <div className="db-modal" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-header">
              <h3>Agregar al carrito</h3>
              <button
                className="db-modal-close"
                onClick={() => setQuickAddOpen(false)}
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            <div className="db-modal-body">
              <div className="db-modal-product">
                {quickAddProduct.image_urls?.[0] ? (
                  <img
                    src={quickAddProduct.image_urls[0]}
                    alt={quickAddProduct.name}
                  />
                ) : (
                  <div className="db-modal-img-placeholder">
                    <Package size={32} strokeWidth={1.5} />
                  </div>
                )}
                <div>
                  <div className="db-modal-product-name">
                    {quickAddProduct.name}
                  </div>
                  <div className="db-modal-product-price">
                    {formatCOP(quickAddProduct.price)}
                  </div>
                </div>
              </div>

              <div className="db-modal-qty">
                <label>Cantidad:</label>
                <div className="db-qty-control">
                  <button
                    onClick={() => setQuickAddQty(Math.max(1, quickAddQty - 1))}
                  >
                    <Minus size={14} strokeWidth={2.5} />
                  </button>
                  <span>{quickAddQty}</span>
                  <button onClick={() => setQuickAddQty(quickAddQty + 1)}>
                    <Plus size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              <div className="db-modal-total">
                <span>Total:</span>
                <strong>
                  {formatCOP(quickAddProduct.price * quickAddQty)}
                </strong>
              </div>
            </div>
            <div className="db-modal-footer">
              <button
                className="db-modal-btn secondary"
                onClick={() => setQuickAddOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="db-modal-btn primary"
                onClick={() => handleAddToCart(quickAddProduct, quickAddQty)}
              >
                <ShoppingCart size={16} strokeWidth={2} />
                Agregar al carrito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ STYLES ══ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Barlow+Condensed:wght@400;600;700;800&display=swap');

        .db-root {
          font-family: 'Inter', sans-serif;
          --primary: #e8291c;
          --primary2: #c2200f;
          --orange: #f97316;
        }
        .db-root.dark  { --card: #1c1c24; --border: rgba(255,255,255,.08); --text: #f0f0f5; --text2: #a0a0b0; --text3: #6b6b80; --bg: #0f0f13; }
        .db-root.light { --card: #ffffff; --border: #e5e7eb; --text: #1a1a1a; --text2: #4b5563; --text3: #9ca3af; --bg: #f5f5f5; }

        /* Loading */
        .db-loading {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; min-height: 50vh; gap: 16px;
          color: var(--text3); font-family: 'Inter', sans-serif;
        }
        .db-spinner {
          width: 44px; height: 44px;
          border: 3px solid rgba(232,41,28,.12);
          border-top-color: #e8291c;
          border-radius: 50%;
          animation: spin .8s linear infinite;
        }
        .db-spinner-sm {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin .6s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .db-loading-dots { display: flex; gap: 6px; margin-top: 4px; }
        .db-loading-dots span {
          width: 6px; height: 6px;
          background: var(--primary);
          border-radius: 50%;
          animation: bounce 1.4s ease-in-out infinite both;
        }
        .db-loading-dots span:nth-child(1) { animation-delay: -.32s; }
        .db-loading-dots span:nth-child(2) { animation-delay: -.16s; }

        /* Hero */
        .db-hero {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          height: 220px;
          margin-bottom: 24px;
        }
        .db-hero-inner { position: relative; height: 100%; }
        .db-banner {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          padding: 0 48px;
          opacity: 0;
          transition: opacity .6s ease;
          pointer-events: none;
        }
        .db-banner.active { opacity: 1; pointer-events: auto; }
        .db-banner-glow {
          position: absolute;
          width: 300px; height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,.15) 0%, transparent 70%);
          right: 10%; top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }
        .db-banner-content {
          display: flex;
          align-items: center;
          gap: 28px;
          position: relative;
          z-index: 2;
        }
        .db-banner-tag {
          position: absolute;
          top: -40px;
          left: 0;
          background: rgba(255,255,255,.2);
          backdrop-filter: blur(8px);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .1em;
          color: #fff;
          text-transform: uppercase;
        }
        .db-banner-emoji { font-size: 64px; line-height: 1; filter: drop-shadow(0 4px 12px rgba(0,0,0,.2)); }
        .db-banner-text { max-width: 420px; }
        .db-banner-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 38px;
          font-weight: 800;
          color: #fff;
          line-height: 1.05;
          margin-bottom: 8px;
          text-shadow: 0 2px 12px rgba(0,0,0,.2);
        }
        .db-banner-sub { font-size: 15px; color: rgba(255,255,255,.9); margin-bottom: 20px; line-height: 1.5; }
        .db-banner-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 26px;
          background: #fff;
          color: #1a1a1a;
          border: none;
          border-radius: 30px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all .25s;
          box-shadow: 0 4px 16px rgba(0,0,0,.2);
        }
        .db-banner-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.3); }
        .db-banner-shine {
          position: absolute;
          top: 0; left: -100%;
          width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.1), transparent);
          animation: shine 3s infinite;
        }
        @keyframes shine { 0%{left:-100%} 100%{left:200%} }
        .db-banner-dots {
          position: absolute;
          bottom: 16px; right: 24px;
          display: flex; gap: 8px;
          z-index: 3;
        }
        .db-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,.35);
          border: none;
          cursor: pointer;
          transition: all .3s;
          padding: 0;
        }
        .db-dot.active { background: #fff; width: 24px; border-radius: 4px; }

        /* Promos */
        .db-promos {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 28px;
        }
        .db-promo {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: all .2s;
        }
        .db-promo:hover { box-shadow: 0 4px 20px rgba(0,0,0,.08); transform: translateY(-2px); border-color: var(--border2); }
        .db-promo-icon {
          width: 48px; height: 48px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .db-promo-title { font-size: 13px; font-weight: 700; color: var(--text); }
        .db-promo-sub { font-size: 11px; color: var(--text3); margin-top: 2px; }

        /* Stats */
        .db-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        .db-stat {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          animation: fadeUp .5s ease forwards;
          opacity: 0;
          transition: all .25s;
        }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } from { opacity: 0; transform: translateY(16px); } }
        .db-stat:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,.08); border-color: var(--primary); }
        .db-stat-icon {
          width: 52px; height: 52px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .db-stat-label { display: block; font-size: 11px; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: .06em; }
        .db-stat-value { display: block; font-size: 22px; font-weight: 800; color: var(--text); margin: 4px 0; font-family: 'Barlow Condensed', sans-serif; letter-spacing: -.01em; }
        .db-stat-trend { display: block; font-size: 11px; color: var(--text3); font-weight: 500; }

        /* Section */
        .db-section { margin-bottom: 36px; }
        .db-section-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .db-section-head h2 {
          font-size: 19px;
          font-weight: 800;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .db-section-actions { display: flex; align-items: center; gap: 8px; }
        .db-view-toggle {
          width: 32px; height: 32px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--card);
          color: var(--text3);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all .15s;
        }
        .db-view-toggle.active, .db-view-toggle:hover { border-color: var(--primary); color: var(--primary); background: var(--hover-bg); }
        .db-see-all {
          display: flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: var(--primary);
          cursor: pointer;
          transition: gap .15s;
        }
        .db-see-all:hover { gap: 8px; }

        /* Categories */
        .db-cats {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
        }
        .db-cat {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all .25s;
          font-family: 'Inter', sans-serif;
        }
        .db-cat:hover { border-color: var(--primary); transform: translateY(-4px); box-shadow: 0 12px 28px rgba(232,41,28,.1); }
        .db-cat-icon {
          width: 56px; height: 56px;
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          font-size: 28px;
          transition: transform .25s;
        }
        .db-cat:hover .db-cat-icon { transform: scale(1.1); }
        .db-cat-name { font-size: 13px; font-weight: 700; color: var(--text); text-align: center; }
        .db-cat-count { font-size: 11px; color: var(--text3); font-weight: 500; }

        /* Products */
        .db-products {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .db-product {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          position: relative;
          transition: all .3s;
          animation: fadeUp .5s ease forwards;
          opacity: 0;
        }
        .db-product:hover { border-color: var(--primary); transform: translateY(-6px); box-shadow: 0 20px 50px rgba(0,0,0,.12); }
        .db-product-badges {
          position: absolute;
          top: 10px; left: 10px; right: 10px;
          display: flex;
          justify-content: space-between;
          z-index: 3;
          pointer-events: none;
        }
        .db-badge {
          font-size: 9px;
          font-weight: 900;
          padding: 4px 10px;
          border-radius: 20px;
          letter-spacing: .05em;
        }
        .db-badge.hot { background: #1a1a1a; color: #fff; }
        .db-badge.top { background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; }
        .db-badge.new { background: linear-gradient(135deg, #10b981, #059669); color: #fff; }
        .db-badge.discount { background: var(--primary); color: #fff; }

        .db-product-img {
          height: 180px;
          background: var(--bg);
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          position: relative;
        }
        .db-product-img img {
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform .4s;
        }
        .db-product:hover .db-product-img img { transform: scale(1.08); }
        .db-product-placeholder { color: var(--text3); }
        
        .db-product-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,.4);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          opacity: 0;
          transition: opacity .25s;
        }
        .db-product:hover .db-product-overlay { opacity: 1; }
        .db-product-action {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: rgba(255,255,255,.95);
          border: none;
          color: #1a1a1a;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all .2s;
          transform: translateY(10px);
          opacity: 0;
        }
        .db-product:hover .db-product-action { transform: translateY(0); opacity: 1; }
        .db-product-action:nth-child(2) { transition-delay: .05s; }
        .db-product-action:nth-child(3) { transition-delay: .1s; }
        .db-product-action:hover { background: #fff; transform: scale(1.1); }

        .db-product-body { padding: 14px; }
        .db-product-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 6px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.4;
          min-height: 40px;
        }
        .db-product-stars {
          display: flex; align-items: center; gap: 2px;
          margin-bottom: 10px;
        }
        .db-product-stars span { font-size: 11px; color: var(--text3); margin-left: 5px; font-weight: 500; }
        
        .db-product-pricing { margin-bottom: 12px; }
        .db-product-original {
          display: block;
          font-size: 12px;
          color: var(--text3);
          text-decoration: line-through;
          margin-bottom: 2px;
        }
        .db-product-price {
          font-size: 20px;
          font-weight: 800;
          color: var(--primary);
          font-family: 'Barlow Condensed', sans-serif;
          letter-spacing: -.01em;
        }
        .db-product-save {
          display: block;
          font-size: 11px;
          color: var(--success, #16a34a);
          font-weight: 600;
          margin-top: 2px;
        }

        .db-product-actions { display: flex; gap: 8px; }
        .db-product-cart {
          flex: 1;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 10px;
          background: linear-gradient(135deg, var(--primary), var(--primary2));
          color: #fff;
          border: none; border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 13px; font-weight: 700;
          cursor: pointer;
          transition: all .25s;
          box-shadow: 0 4px 14px rgba(232,41,28,.25);
        }
        .db-product-cart:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(232,41,28,.35); }
        .db-product-cart:disabled { opacity: .7; cursor: not-allowed; }
        .db-product-cart.loading { background: var(--text3); }

        /* Orders */
        .db-orders { display: flex; flex-direction: column; gap: 10px; }
        .db-order {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all .25s;
          gap: 16px;
        }
        .db-order:hover { border-color: var(--primary); transform: translateX(6px); box-shadow: 0 4px 16px rgba(0,0,0,.06); }
        .db-order-left { display: flex; align-items: center; gap: 16px; }
        .db-order-icon {
          width: 46px; height: 46px;
          background: rgba(232,41,28,.1);
          color: var(--primary);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .db-order-id { font-size: 15px; font-weight: 700; color: var(--text); }
        .db-order-date { font-size: 12px; color: var(--text3); margin-top: 3px; font-weight: 500; }
        .db-order-items { font-size: 12px; color: var(--text3); margin-top: 2px; }
        .db-order-right { display: flex; align-items: center; gap: 16px; }
        .db-order-amount { font-size: 17px; font-weight: 800; color: var(--text); font-family: 'Barlow Condensed', sans-serif; }
        .db-order-status {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 700;
          padding: 5px 14px; border-radius: 20px;
          white-space: nowrap;
        }
        .db-status-dot { width: 6px; height: 6px; border-radius: 50%; }
        .db-order-detail {
          display: flex; align-items: center; gap: 4px;
          background: none; border: 1.5px solid var(--border);
          border-radius: 8px; padding: 7px 14px;
          font-family: 'Inter', sans-serif;
          font-size: 12px; font-weight: 700;
          color: var(--text2); cursor: pointer;
          transition: all .2s;
        }
        .db-order-detail:hover { border-color: var(--primary); color: var(--primary); background: var(--hover-bg); }

        /* Empty */
        .db-empty {
          background: var(--card);
          border: 2px dashed var(--border);
          border-radius: 16px;
          text-align: center;
          padding: 56px 24px;
          color: var(--text3);
        }
        .db-empty svg { margin-bottom: 16px; opacity: .35; }
        .db-empty h3 { font-size: 17px; font-weight: 800; color: var(--text); margin-bottom: 6px; }
        .db-empty p { font-size: 14px; margin-bottom: 20px; }
        .db-empty-btn {
          padding: 12px 28px;
          background: linear-gradient(135deg, var(--primary), var(--primary2));
          color: #fff;
          border: none; border-radius: 30px;
          font-family: 'Inter', sans-serif;
          font-size: 14px; font-weight: 700;
          cursor: pointer;
          transition: all .25s;
          box-shadow: 0 4px 16px rgba(232,41,28,.25);
        }
        .db-empty-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(232,41,28,.35); }

        /* Modal */
        .db-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,.5);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000;
          padding: 24px;
          animation: fadeIn .2s ease;
        }
        .db-modal {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 20px;
          width: 100%; max-width: 420px;
          overflow: hidden;
          animation: scaleIn .25s ease;
          box-shadow: 0 24px 64px rgba(0,0,0,.2);
        }
        .db-modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }
        .db-modal-header h3 { font-size: 17px; font-weight: 800; color: var(--text); margin: 0; }
        .db-modal-close {
          background: none; border: none;
          color: var(--text3); cursor: pointer;
          padding: 4px; border-radius: 8px;
          transition: all .15s;
          display: flex; align-items: center;
        }
        .db-modal-close:hover { background: var(--hover-bg); color: var(--primary); }
        .db-modal-body { padding: 24px; }
        .db-modal-product {
          display: flex; align-items: center; gap: 16px;
          margin-bottom: 20px;
        }
        .db-modal-product img, .db-modal-img-placeholder {
          width: 80px; height: 80px;
          border-radius: 12px;
          object-fit: cover;
          background: var(--bg);
          display: flex; align-items: center; justify-content: center;
          color: var(--text3);
          flex-shrink: 0;
        }
        .db-modal-product-name { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
        .db-modal-product-price { font-size: 20px; font-weight: 800; color: var(--primary); font-family: 'Barlow Condensed', sans-serif; }
        
        .db-modal-qty { margin-bottom: 20px; }
        .db-modal-qty label { display: block; font-size: 12px; font-weight: 600; color: var(--text3); margin-bottom: 8px; text-transform: uppercase; letter-spacing: .05em; }
        .db-qty-control {
          display: inline-flex; align-items: center; gap: 0;
          border: 1.5px solid var(--border);
          border-radius: 10px;
          overflow: hidden;
        }
        .db-qty-control button {
          width: 40px; height: 40px;
          background: var(--bg);
          border: none;
          color: var(--text);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all .15s;
        }
        .db-qty-control button:hover { background: var(--hover-bg); color: var(--primary); }
        .db-qty-control span {
          width: 50px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 700;
          color: var(--text);
          border-left: 1px solid var(--border);
          border-right: 1px solid var(--border);
        }
        
        .db-modal-total {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px;
          background: var(--bg);
          border-radius: 12px;
          margin-bottom: 20px;
        }
        .db-modal-total span { font-size: 14px; color: var(--text2); font-weight: 600; }
        .db-modal-total strong { font-size: 22px; font-weight: 800; color: var(--primary); font-family: 'Barlow Condensed', sans-serif; }
        
        .db-modal-footer {
          display: flex; gap: 10px;
          padding: 0 24px 24px;
        }
        .db-modal-btn {
          flex: 1;
          padding: 12px;
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 14px; font-weight: 700;
          cursor: pointer;
          transition: all .2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .db-modal-btn.secondary {
          background: var(--bg);
          border: 1.5px solid var(--border);
          color: var(--text2);
        }
        .db-modal-btn.secondary:hover { border-color: var(--text3); color: var(--text); }
        .db-modal-btn.primary {
          background: linear-gradient(135deg, var(--primary), var(--primary2));
          border: none;
          color: #fff;
          box-shadow: 0 4px 16px rgba(232,41,28,.25);
        }
        .db-modal-btn.primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(232,41,28,.35); }

        /* Responsive */
        @media (max-width: 1200px) {
          .db-products { grid-template-columns: repeat(3, 1fr); }
          .db-cats { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 900px) {
          .db-promos { grid-template-columns: repeat(2, 1fr); }
          .db-stats { grid-template-columns: repeat(2, 1fr); }
          .db-products { grid-template-columns: repeat(2, 1fr); }
          .db-cats { grid-template-columns: repeat(3, 1fr); }
          .db-hero { height: 180px; }
          .db-banner-title { font-size: 28px; }
          .db-banner-emoji { font-size: 48px; }
          .db-banner-content { padding: 0 32px; }
        }
        @media (max-width: 600px) {
          .db-stats { grid-template-columns: 1fr 1fr; }
          .db-products { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .db-cats { grid-template-columns: repeat(2, 1fr); }
          .db-promos { grid-template-columns: 1fr; }
          .db-hero { height: 160px; border-radius: 12px; }
          .db-banner-content { gap: 16px; padding: 0 20px; }
          .db-banner-title { font-size: 22px; }
          .db-banner-emoji { font-size: 36px; }
          .db-banner-sub { font-size: 13px; }
          .db-order { flex-direction: column; align-items: flex-start; }
          .db-order-right { width: 100%; justify-content: space-between; }
        }
      `}</style>
    </div>
  );
}
