import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { useToast } from "../App";
import { useCart } from "../App";
import { useSwal } from "../hooks/useSwal"; // ← IMPORTAMOS SWAL
import { catalogApi, cartApi, inventoryApi } from "../services/api";
import {
  Search,
  Filter,
  X,
  Package,
  Tag,
  Image as ImageIcon,
  Grid3x3,
  List,
  ShoppingCart,
  Plus,
  Minus,
  Edit2,
  Trash2,
  Star,
  Heart,
  ChevronDown,
  Check,
  AlertCircle,
  CheckCircle,
  SlidersHorizontal,
  Zap,
  Eye,
  Share2,
  Sparkles,
} from "lucide-react";

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div
      className="ec-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="ec-modal">
        <div className="ec-modal-header">
          <h3>{title}</h3>
          <button className="ec-modal-close" onClick={onClose}>
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
        <div className="ec-modal-body">{children}</div>
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({
  p,
  catMap,
  stock,
  onAddToCart,
  onEdit,
  onDelete,
  isAdmin,
  layout,
}) {
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [liked, setLiked] = useState(false);
  const avail = stock[p.id] ?? null;
  const inStock = avail === null || avail > 0;

  const handleAdd = async () => {
    if (!inStock) return;
    setAdding(true);
    await onAddToCart(p, qty);
    setAdding(false);
    setQty(1);
  };

  if (layout === "list") {
    return (
      <div className="ec-list-item">
        <div className="ec-list-img">
          {p.image_urls?.[0] ? (
            <img src={p.image_urls[0]} alt={p.name} loading="lazy" />
          ) : (
            <div className="ec-list-img-ph">
              <Package size={22} strokeWidth={2} />
            </div>
          )}
        </div>
        <div className="ec-list-info">
          <div className="ec-list-name">{p.name}</div>
          {p.category_id && (
            <span className="ec-cat-badge">{catMap[p.category_id]}</span>
          )}
          <div className="ec-list-desc">
            {p.description?.slice(0, 80) || "Sin descripción"}
            {p.description?.length > 80 && "…"}
          </div>
        </div>
        <div className="ec-list-right">
          <div className="ec-list-price">
            ${Number(p.price).toLocaleString("es-CO")}
          </div>
          {avail !== null && (
            <div
              className={`ec-stock-pill ${avail === 0 ? "out" : avail < 5 ? "low" : "ok"}`}
            >
              {avail === 0
                ? "Agotado"
                : avail < 5
                  ? `¡Solo ${avail}!`
                  : `Stock: ${avail}`}
            </div>
          )}
          <div className="ec-list-actions">
            {inStock && (
              <div className="ec-qty-ctrl">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  <Minus size={12} strokeWidth={2.5} />
                </button>
                <span>{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(avail || 99, q + 1))}
                >
                  <Plus size={12} strokeWidth={2.5} />
                </button>
              </div>
            )}
            <button
              className={`ec-add-btn ${!inStock ? "disabled" : ""}`}
              onClick={handleAdd}
              disabled={!inStock || adding}
            >
              {adding ? (
                <span className="ec-btn-spin" />
              ) : (
                <>
                  <ShoppingCart size={14} strokeWidth={2} />{" "}
                  {inStock ? "Agregar" : "Agotado"}
                </>
              )}
            </button>
            {isAdmin && (
              <div className="ec-admin-acts">
                <button className="ec-admin-btn" onClick={() => onEdit(p)}>
                  <Edit2 size={14} strokeWidth={2} />
                </button>
                <button
                  className="ec-admin-btn danger"
                  onClick={() => onDelete(p.id)}
                >
                  <Trash2 size={14} strokeWidth={2} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative bg-card rounded-[2rem] p-4 border border-border/40 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 flex flex-col h-full">
      {/* Image Section */}
      <div className="aspect-[4/5] bg-secondary/30 rounded-[1.5rem] relative overflow-hidden flex items-center justify-center p-6 mb-4 transition-colors group-hover:bg-primary/5">
        {p.image_urls?.[0] ? (
          <img src={p.image_urls[0]} alt={p.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700 ease-out" />
        ) : (
          <div className="text-muted-foreground/20"><Package size={48} /></div>
        )}
        
        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {p.category_id && <span className="bg-white/90 backdrop-blur-md text-foreground text-[9px] font-black px-2.5 py-1 rounded-full shadow-sm border border-border/50 uppercase tracking-wider">{catMap[p.category_id]}</span>}
          {avail === 0 && <span className="bg-red-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-lg">AGOTADO</span>}
          {avail !== null && avail < 5 && avail > 0 && <span className="bg-amber-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-lg animate-pulse">¡SOLO {avail}!</span>}
        </div>

        {/* Interaction Overlay */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 rounded-[1.5rem]">
          <button className="w-11 h-11 bg-white text-black rounded-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all scale-75 group-hover:scale-100 shadow-xl"><Eye size={18} /></button>
          <button onClick={() => setLiked(!liked)} className={cn("w-11 h-11 rounded-xl flex items-center justify-center transition-all scale-75 group-hover:scale-100 shadow-xl", liked ? "bg-red-500 text-white" : "bg-white text-black")}><Heart size={18} fill={liked ? "currentColor" : "none"} /></button>
          {isAdmin && (
            <div className="absolute bottom-3 right-3 flex gap-2">
              <button onClick={() => onEdit(p)} className="w-9 h-9 bg-blue-500 text-white rounded-lg flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors"><Edit2 size={14} /></button>
              <button onClick={() => onDelete(p.id)} className="w-9 h-9 bg-red-600 text-white rounded-lg flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors"><Trash2 size={14} /></button>
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="flex-1 flex flex-col px-1">
        <div className="flex items-center gap-1 mb-2">
          {[1,2,3,4,5].map(i => <Star key={i} size={10} fill={i <= 4 ? "#f59e0b" : "none"} color={i <= 4 ? "#f59e0b" : "#ccc"} />)}
          <span className="text-[10px] font-bold text-muted-foreground ml-1">(24)</span>
        </div>
        
        <h4 className="font-black text-sm line-clamp-1 mb-1 group-hover:text-primary transition-colors">{p.name}</h4>
        <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{p.description || "Sin descripción disponible"}</p>
        
        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-lg font-black text-foreground">${Number(p.price).toLocaleString("es-CO")}</span>
            <span className="text-[10px] text-muted-foreground line-through opacity-50">${Number(p.price * 1.2).toLocaleString("es-CO")}</span>
          </div>

          {inStock ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 bg-secondary/50 rounded-xl p-1 border border-border/50">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white transition-colors"><Minus size={12} /></button>
                <span className="text-xs font-black w-4 text-center">{qty}</span>
                <button onClick={() => setQty(q => Math.min(avail || 99, q + 1))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white transition-colors"><Plus size={12} /></button>
              </div>
              <button onClick={handleAdd} disabled={adding} className="flex-1 h-9 bg-foreground text-background rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all active:scale-95 shadow-md">
                {adding ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <><ShoppingCart size={14} /> Agregar</>}
              </button>
            </div>
          ) : (
            <button className="w-full h-9 bg-secondary text-muted-foreground rounded-xl text-xs font-black cursor-not-allowed" disabled>Agotado</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CatalogPage({ initialCategory, setInitialCategory }) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { addToast } = useToast();
  const { updateCartCount } = useCart();
  const { success, error, warning, confirm, loading, close, toast, delete: swalDelete } =
    useSwal(isDark); // ← SWAL INTEGRADO CON TEMA
  const isAdmin = user?.role === "admin";

  const [allProducts, setAllProducts] = useState([]); // Todos los productos sin filtrar
  const [products, setProducts] = useState([]); // Productos filtrados
  const [categories, setCategories] = useState([]);
  const [stock, setStock] = useState({});
  const [cart, setCart] = useState(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [sort, setSort] = useState("default");
  const [view, setView] = useState("products");
  const [layout, setLayout] = useState("grid");
  const [modal, setModal] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // ← renombrado
  const [initialLoading, setInitialLoading] = useState(true);

  const [pForm, setPForm] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    image_urls: "",
  });
  const [cForm, setCForm] = useState({ name: "", description: "" });

  // Refs para validación de campos
  const nameRef = useRef(null);
  const priceRef = useRef(null);
  const catNameRef = useRef(null);

  // ── Load data UNA SOLA VEZ al inicio ───────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setInitialLoading(true);
      const [prods, cats] = await Promise.all([
        catalogApi.getProducts(),
        catalogApi.getCategories(),
      ]);
      setAllProducts(prods);
      setProducts(prods);
      setCategories(cats);

      // Stock por producto
      try {
        const inv = await inventoryApi.getAll();
        const map = {};
        inv.forEach((i) => {
          map[i.product_id] = i.quantity - (i.reserved_quantity || 0);
        });
        setStock(map);
      } catch {}

      // Carrito del usuario o anónimo
      try {
        let c;
        if (user) {
          c = await cartApi.getByUser(user.id);
        } else {
          const anonToken = localStorage.getItem("ecomod_anon_token");
          if (anonToken) c = await cartApi.getByToken(anonToken);
        }
        if (c) {
          setCart(c);
          const count = c.items?.reduce((s, i) => s + (parseInt(i.quantity) || 1), 0) || 0;
          updateCartCount(count);
        }
      } catch {}
    } catch (err) {
      addToast("error", "Error", "No se pudieron cargar los productos");
    } finally {
      setInitialLoading(false);
    }
  }, [user?.id, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle initial category from dashboard
  useEffect(() => {
    if (initialCategory) {
      setCatFilter(initialCategory);
      // Optional: clear it after applying so it doesn't persist if the user navigates back and forth
      // setInitialCategory(""); 
    }
  }, [initialCategory]);

  // ── FILTRADO LOCAL (no recarga del backend) ─────────────────────────────────
  useEffect(() => {
    let filtered = [...allProducts];

    // Filtro por categoría
    if (catFilter) {
      filtered = filtered.filter(
        (p) => String(p.category_id) === String(catFilter),
      );
    }

    // Filtro por búsqueda (nombre o descripción)
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q),
      );
    }

    // Ordenamiento
    if (sort === "price-asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sort === "price-desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sort === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    setProducts(filtered);
  }, [allProducts, catFilter, search, sort]);

  // ── Add to cart ──────────────────────────────────────────────────────────────
  const handleAddToCart = async (product, qty) => {
    try {
      let c = cart;
      
      // Si no hay carrito cargado en el estado local
      if (!c) {
        if (user) {
          // Usuario autenticado
          try {
            c = await cartApi.getByUser(user.id);
          } catch {
            c = await cartApi.create({ user_id: user.id });
          }
        } else {
          // Usuario anónimo
          let anonToken = localStorage.getItem("ecomod_anon_token");
          if (anonToken) {
            try {
              c = await cartApi.getByToken(anonToken);
            } catch {
              c = await cartApi.create({ anonymous_token: anonToken });
            }
          } else {
            c = await cartApi.create({});
            localStorage.setItem("ecomod_anon_token", c.anonymous_token);
          }
        }
        setCart(c);
      }

      await cartApi.addItem(c.id, {
        product_id: product.id,
        quantity: qty,
        unit_price: product.price,
        product_name: product.name,
      });

      // Actualizar contador global
      let updated;
      if (user) {
        updated = await cartApi.getByUser(user.id);
      } else {
        updated = await cartApi.getByToken(localStorage.getItem("ecomod_anon_token"));
      }
      
      const count =
        updated.items?.reduce((s, i) => s + (parseInt(i.quantity) || 1), 0) ||
        0;
      updateCartCount(count);

      addToast(
        "success",
        "¡Agregado!",
        `"${product.name}" (${qty}) añadido al carrito`,
      );
      setCart(updated);
    } catch (err) {
      addToast("error", "Error", err.message || "Error al agregar al carrito");
    }
  };

  // ─── VALIDACIONES POR CAMPO CON SWAL ───────────────────────────────────────

  const validateProductName = (name, ref = null) => {
    if (!name.trim()) {
      warning(
        "Campo requerido",
        "Por favor ingresa el nombre del producto",
      ).then(() => {
        ref?.current?.focus();
      });
      return false;
    }
    if (name.trim().length < 2) {
      warning(
        "Nombre muy corto",
        "El nombre debe tener al menos 2 caracteres",
      ).then(() => {
        ref?.current?.focus();
      });
      return false;
    }
    return true;
  };

  const validateProductPrice = (price, ref = null) => {
    if (!price || price === "") {
      warning(
        "Campo requerido",
        "Por favor ingresa el precio del producto",
      ).then(() => {
        ref?.current?.focus();
      });
      return false;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      warning("Precio inválido", "El precio debe ser mayor a 0").then(() => {
        ref?.current?.focus();
      });
      return false;
    }
    return true;
  };

  const validateCategoryName = (name, ref = null) => {
    if (!name.trim()) {
      warning(
        "Campo requerido",
        "Por favor ingresa el nombre de la categoría",
      ).then(() => {
        ref?.current?.focus();
      });
      return false;
    }
    if (name.trim().length < 2) {
      warning(
        "Nombre muy corto",
        "El nombre debe tener al menos 2 caracteres",
      ).then(() => {
        ref?.current?.focus();
      });
      return false;
    }
    return true;
  };

  // ── Product CRUD ─────────────────────────────────────────────────────────────
  const openNewProduct = () => {
    setEditItem(null);
    setPForm({
      name: "",
      description: "",
      price: "",
      category_id: "",
      image_urls: "",
    });
    setModal("product");
  };
  const openEditProduct = (p) => {
    setEditItem(p);
    setPForm({
      name: p.name,
      description: p.description || "",
      price: p.price,
      category_id: p.category_id || "",
      image_urls: (p.image_urls || []).join(", "),
    });
    setModal("product");
  };
  const saveProduct = async (e) => {
    e.preventDefault();

    // Validación campo por campo con Swal
    if (!validateProductName(pForm.name, nameRef)) return;
    if (!validateProductPrice(pForm.price, priceRef)) return;

    setIsLoading(true);
    loading(editItem ? "Actualizando producto..." : "Creando producto...");

    try {
      const body = {
        name: pForm.name.trim(),
        description: pForm.description.trim(),
        price: parseFloat(pForm.price),
        category_id: pForm.category_id ? parseInt(pForm.category_id) : null,
        image_urls: pForm.image_urls
          ? pForm.image_urls
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      };
      if (editItem) {
        await catalogApi.updateProduct(editItem.id, body);
        close();
        success("¡Actualizado!", "Producto modificado correctamente");
      } else {
        await catalogApi.createProduct(body);
        close();
        success("¡Creado!", "Nuevo producto agregado al catálogo");
      }
      setModal(null);
      loadData();
    } catch (err) {
      close();
      error(
        "Error al guardar",
        err.message || "No se pudo guardar el producto",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    // Reemplazamos confirm nativo por Swal delete
    const result = await swalDelete(
      "¿Eliminar producto?",
      "Esta acción no se puede deshacer. El producto se removerá permanentemente del catálogo.",
    );

    if (!result.isConfirmed) return;

    setIsLoading(true);
    loading("Eliminando...");

    try {
      await catalogApi.deleteProduct(id);
      close();
      success("¡Eliminado!", "Producto removido del catálogo");
      loadData();
    } catch (err) {
      close();
      error(
        "Error al eliminar",
        err.message || "No se pudo eliminar el producto",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Category CRUD ─────────────────────────────────────────────────────────────
  const openNewCategory = () => {
    setEditItem(null);
    setCForm({ name: "", description: "" });
    setModal("category");
  };
  const saveCategory = async (e) => {
    e.preventDefault();

    // Validación con Swal
    if (!validateCategoryName(cForm.name, catNameRef)) return;

    setIsLoading(true);
    loading("Creando categoría...");

    try {
      await catalogApi.createCategory(cForm);
      close();
      success("¡Creada!", "Nueva categoría agregada correctamente");
      setModal(null);
      loadData();
    } catch (err) {
      close();
      error("Error al crear", err.message || "No se pudo crear la categoría");
    } finally {
      setIsLoading(false);
    }
  };
  const deleteCategory = async (id) => {
    // Swal confirm en vez de confirm nativo
    const result = await confirm(
      "¿Eliminar categoría?",
      "Los productos asociados quedarán sin categoría. ¿Deseas continuar?",
      "Sí, eliminar",
      "Cancelar",
    );

    if (!result.isConfirmed) return;

    setIsLoading(true);
    loading("Eliminando...");

    try {
      await catalogApi.deleteCategory(id);
      close();
      success("¡Eliminada!", "Categoría removida correctamente");
      // Limpiar filtro si era esa categoría
      if (String(catFilter) === String(id)) {
        setCatFilter("");
      }
      loadData();
    } catch (err) {
      close();
      error(
        "Error al eliminar",
        err.message || "No se pudo eliminar la categoría",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const cartCount = cart?.items?.reduce((s, i) => s + i.quantity, 0) || 0;

  if (initialLoading) {
    return (
      <div className="ec-catalog-loading">
        <div className="ec-catalog-spinner" />
        <span>Cargando catálogo...</span>
        <div className="ec-loading-dots">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  return (
    <div className={`ec-catalog ${isDark ? "dark" : ""}`}>
      {/* ── Page Header ── */}
      <div className="ec-catalog-header">
        <div className="ec-catalog-header-left">
          <h1 className="ec-catalog-title">
            {view === "products" ? "Catálogo" : "Categorías"}
          </h1>
          <p className="ec-catalog-sub">
            {view === "products"
              ? `${products.length} de ${allProducts.length} productos`
              : `${categories.length} categorías`}
          </p>
        </div>
        <div className="ec-catalog-header-right">
          {cartCount > 0 && (
            <div className="ec-cart-pill">
              <ShoppingCart size={14} strokeWidth={2} />
              <span>{cartCount} en carrito</span>
            </div>
          )}
          {isAdmin && (
            <>
              <button className="ec-btn-outline" onClick={openNewCategory}>
                <Tag size={14} strokeWidth={2} /> Nueva Categoría
              </button>
              <button className="ec-btn-primary" onClick={openNewProduct}>
                <Plus size={14} strokeWidth={2.5} /> Nuevo Producto
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="ec-tabs">
        <button
          className={`ec-tab ${view === "products" ? "active" : ""}`}
          onClick={() => setView("products")}
        >
          <Package size={15} strokeWidth={2} /> Productos{" "}
          <span className="ec-tab-count">{allProducts.length}</span>
        </button>
        <button
          className={`ec-tab ${view === "categories" ? "active" : ""}`}
          onClick={() => setView("categories")}
        >
          <Tag size={15} strokeWidth={2} /> Categorías{" "}
          <span className="ec-tab-count">{categories.length}</span>
        </button>
      </div>

      {/* ── Products View ── */}
      {view === "products" && (
        <>
          {/* Filters bar */}
          <div className="ec-filters-bar">
            {/* Search */}
            <div className="ec-search-box">
              <Search size={16} strokeWidth={2} />
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")}>
                  <X size={14} strokeWidth={2.5} />
                </button>
              )}
            </div>

            {/* Category filter dropdown */}
            <div className="ec-filter-select">
              <Filter size={14} strokeWidth={2} />
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="ec-filter-select">
              <SlidersHorizontal size={14} strokeWidth={2} />
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="default">Ordenar por</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="name">Nombre A-Z</option>
              </select>
            </div>

            {/* Layout toggle */}
            <div className="ec-layout-toggle">
              <button
                className={layout === "grid" ? "active" : ""}
                onClick={() => setLayout("grid")}
              >
                <Grid3x3 size={16} strokeWidth={2} />
              </button>
              <button
                className={layout === "list" ? "active" : ""}
                onClick={() => setLayout("list")}
              >
                <List size={16} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Category pills - FILTRO RÁPIDO */}
          {categories.length > 0 && (
            <div className="ec-cat-pills">
              <button
                className={`ec-cat-pill ${!catFilter ? "active" : ""}`}
                onClick={() => setCatFilter("")}
              >
                <Sparkles size={12} strokeWidth={2.5} /> Todos
                <span>{allProducts.length}</span>
              </button>
              {categories.map((c) => {
                const count = allProducts.filter(
                  (p) => p.category_id === c.id,
                ).length;
                return (
                  <button
                    key={c.id}
                    className={`ec-cat-pill ${String(catFilter) === String(c.id) ? "active" : ""}`}
                    onClick={() =>
                      setCatFilter(
                        String(catFilter) === String(c.id) ? "" : String(c.id),
                      )
                    }
                  >
                    {c.name}
                    <span>{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Active filters indicator */}
          {(search || catFilter) && (
            <div className="ec-active-filters">
              <span>Filtros activos:</span>
              {search && (
                <span className="ec-filter-tag">
                  Búsqueda: "{search}"
                  <button onClick={() => setSearch("")}>
                    <X size={10} strokeWidth={3} />
                  </button>
                </span>
              )}
              {catFilter && (
                <span className="ec-filter-tag">
                  Categoría: {catMap[catFilter]}
                  <button onClick={() => setCatFilter("")}>
                    <X size={10} strokeWidth={3} />
                  </button>
                </span>
              )}
              <button
                className="ec-clear-filters"
                onClick={() => {
                  setSearch("");
                  setCatFilter("");
                }}
              >
                Limpiar todo
              </button>
            </div>
          )}

          {/* Products */}
          {products.length === 0 ? (
            <div className="ec-empty">
              <Package size={52} strokeWidth={1} />
              <h3>No hay productos</h3>
              <p>
                {search && !catFilter
                  ? `Sin resultados para "${search}"`
                  : catFilter && !search
                    ? `Sin productos en "${catMap[catFilter]}"`
                    : search && catFilter
                      ? `Sin resultados para "${search}" en "${catMap[catFilter]}"`
                      : "Aún no hay productos en el catálogo"}
              </p>
              {(search || catFilter) && (
                <button
                  className="ec-btn-outline"
                  onClick={() => {
                    setSearch("");
                    setCatFilter("");
                  }}
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : layout === "grid" ? (
            <div className="ec-prod-grid">
              {products.map((p, idx) => (
                <ProductCard
                  key={p.id}
                  p={p}
                  catMap={catMap}
                  stock={stock}
                  onAddToCart={handleAddToCart}
                  onEdit={openEditProduct}
                  onDelete={deleteProduct}
                  isAdmin={isAdmin}
                  layout="grid"
                />
              ))}
            </div>
          ) : (
            <div className="ec-prod-list">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  p={p}
                  catMap={catMap}
                  stock={stock}
                  onAddToCart={handleAddToCart}
                  onEdit={openEditProduct}
                  onDelete={deleteProduct}
                  isAdmin={isAdmin}
                  layout="list"
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Categories View ── */}
      {view === "categories" && (
        <div className="ec-cats-grid">
          {categories.length === 0 ? (
            <div className="ec-empty">
              <Tag size={52} strokeWidth={1} />
              <h3>Sin categorías</h3>
              <p>Crea la primera categoría para organizar productos</p>
              {isAdmin && (
                <button className="ec-btn-primary" onClick={openNewCategory}>
                  <Plus size={14} strokeWidth={2.5} /> Crear categoría
                </button>
              )}
            </div>
          ) : (
            categories.map((c) => (
              <div
                key={c.id}
                className="ec-cat-card"
                onClick={() => {
                  setView("products");
                  setCatFilter(String(c.id));
                }}
                style={{ cursor: "pointer" }}
              >
                <div className="ec-cat-card-icon">
                  <Tag size={26} strokeWidth={2} />
                </div>
                <div className="ec-cat-card-info">
                  <div className="ec-cat-card-name">{c.name}</div>
                  <div className="ec-cat-card-desc">
                    {c.description || "Sin descripción"}
                  </div>
                  <div className="ec-cat-card-count">
                    <Package size={11} strokeWidth={2.5} />{" "}
                    {allProducts.filter((p) => p.category_id === c.id).length}{" "}
                    productos
                  </div>
                </div>
                {isAdmin && (
                  <button
                    className="ec-cat-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCategory(c.id);
                    }}
                  >
                    <Trash2 size={15} strokeWidth={2} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {modal === "product" && (
        <Modal
          title={editItem ? "Editar producto" : "Nuevo producto"}
          onClose={() => setModal(null)}
        >
          <form onSubmit={saveProduct} className="ec-form">
            <div className="ec-form-group">
              <label>Nombre *</label>
              <input
                ref={nameRef}
                type="text"
                value={pForm.name}
                onChange={(e) =>
                  setPForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Ej: Camiseta Deportiva"
              />
            </div>
            <div className="ec-form-group">
              <label>Descripción</label>
              <textarea
                rows="3"
                value={pForm.description}
                onChange={(e) =>
                  setPForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Describe el producto…"
              />
            </div>
            <div className="ec-form-row">
              <div className="ec-form-group">
                <label>Precio (COP) *</label>
                <input
                  ref={priceRef}
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={pForm.price}
                  onChange={(e) =>
                    setPForm((f) => ({ ...f, price: e.target.value }))
                  }
                />
              </div>
              <div className="ec-form-group">
                <label>Categoría</label>
                <select
                  value={pForm.category_id}
                  onChange={(e) =>
                    setPForm((f) => ({ ...f, category_id: e.target.value }))
                  }
                >
                  <option value="">Sin categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="ec-form-group">
              <label>URLs de imágenes</label>
              <input
                type="text"
                placeholder="https://img.com/foto.jpg, https://…"
                value={pForm.image_urls}
                onChange={(e) =>
                  setPForm((f) => ({ ...f, image_urls: e.target.value }))
                }
              />
              <span className="ec-form-hint">
                Separa múltiples URLs con comas
              </span>
            </div>
            <div className="ec-form-actions">
              <button
                type="button"
                className="ec-btn-outline"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="ec-btn-primary"
                disabled={isLoading}
              >
                {isLoading
                  ? "Guardando…"
                  : editItem
                    ? "Guardar cambios"
                    : "Crear producto"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === "category" && (
        <Modal title="Nueva categoría" onClose={() => setModal(null)}>
          <form onSubmit={saveCategory} className="ec-form">
            <div className="ec-form-group">
              <label>Nombre *</label>
              <input
                ref={catNameRef}
                type="text"
                value={cForm.name}
                onChange={(e) =>
                  setCForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Ej: Electrónica"
              />
            </div>
            <div className="ec-form-group">
              <label>Descripción</label>
              <textarea
                rows="3"
                value={cForm.description}
                onChange={(e) =>
                  setCForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Describe la categoría…"
              />
            </div>
            <div className="ec-form-actions">
              <button
                type="button"
                className="ec-btn-outline"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="ec-btn-primary"
                disabled={isLoading}
              >
                {isLoading ? "Guardando…" : "Crear categoría"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <style>{`
        .ec-catalog { font-family: 'Inter', sans-serif; animation: ecFadeUp .3s ease; color: var(--ec-text); }
        @keyframes ecFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

        /* Loading */
        .ec-catalog-loading {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; min-height: 50vh; gap: 16px;
          color: var(--ec-text3); font-family: 'Inter', sans-serif;
        }
        .ec-catalog-spinner {
          width: 44px; height: 44px;
          border: 3px solid rgba(220,38,38,.12);
          border-top-color: var(--ec-primary); border-radius: 50%;
          animation: ecSpin .8s linear infinite;
        }
        @keyframes ecSpin { to { transform: rotate(360deg); } }
        .ec-loading-dots { display: flex; gap: 6px; margin-top: 4px; }
        .ec-loading-dots span {
          width: 6px; height: 6px;
          background: var(--ec-primary); border-radius: 50%;
          animation: ecBounce 1.4s ease-in-out infinite both;
        }
        .ec-loading-dots span:nth-child(1) { animation-delay: -.32s; }
        .ec-loading-dots span:nth-child(2) { animation-delay: -.16s; }
        @keyframes ecBounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

        /* Header */
        .ec-catalog-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 32px; flex-wrap: wrap; gap: 20px;
        }
        .ec-catalog-title {
          font-family: 'Outfit', sans-serif;
          font-size: 32px; font-weight: 800;
          color: var(--ec-text); margin: 0 0 4px; letter-spacing: -.02em;
        }
        .ec-catalog-sub { font-size: 14px; color: var(--ec-text3); margin: 0; font-weight: 500; }
        .ec-catalog-header-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

        .ec-cart-pill {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 16px;
          background: rgba(220,38,38,.08);
          border: 1.5px solid rgba(220,38,38,.15);
          border-radius: 30px;
          font-size: 13px; font-weight: 700;
          color: var(--ec-primary);
          box-shadow: 0 2px 8px rgba(220,38,38,0.05);
        }

        /* Buttons */
        .ec-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 24px;
          background: linear-gradient(135deg, var(--ec-primary), var(--ec-primary2));
          border: none; border-radius: 12px;
          color: #fff; font-size: 14px; font-weight: 700;
          font-family: 'Inter', sans-serif;
          cursor: pointer; transition: all .3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: var(--ec-shadow-primary);
        }
        .ec-btn-primary:hover { transform: translateY(-2px); box-shadow: var(--ec-shadow-primary-lg); }
        .ec-btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 20px;
          background: var(--ec-card-bg);
          border: 1.5px solid var(--ec-border); border-radius: 12px;
          color: var(--ec-text2); font-size: 14px; font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer; transition: all .2s;
        }
        .ec-btn-outline:hover { border-color: var(--ec-primary); color: var(--ec-primary); background: var(--ec-hover-bg); }

        /* Tabs */
        .ec-tabs {
          display: flex; gap: 12px;
          border-bottom: 1.5px solid var(--ec-border);
          margin-bottom: 32px;
        }
        .ec-tab {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 20px;
          background: none; border: none;
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700;
          color: var(--ec-text3); cursor: pointer;
          border-bottom: 2px solid transparent; margin-bottom: -2px;
          transition: all .25s;
        }
        .ec-tab:hover { color: var(--ec-text); }
        .ec-tab.active { color: var(--ec-primary); border-bottom-color: var(--ec-primary); }
        .ec-tab-count {
          padding: 2px 10px; border-radius: 12px;
          background: var(--ec-bg2);
          font-size: 11px; font-weight: 800;
          color: var(--ec-text3);
        }
        .ec-tab.active .ec-tab-count { background: rgba(220,38,38,.1); color: var(--ec-primary); }

        /* Filters */
        .ec-filters-bar {
          display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; align-items: center;
        }
        .ec-search-box {
          flex: 1; min-width: 240px;
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px;
          background: var(--ec-card-bg);
          border: 1.5px solid var(--ec-border);
          border-radius: 14px; transition: all .3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .ec-search-box:focus-within { border-color: var(--ec-primary); box-shadow: 0 0 0 4px rgba(220,38,38,.08); background: var(--ec-surface); }
        .ec-search-box input { flex:1; background:none; border:none; outline:none; font-family:'Inter',sans-serif; font-size:15px; color:var(--ec-text); }
        .ec-search-box input::placeholder { color: var(--ec-text3); }
        .ec-search-box button { background:none; border:none; cursor:pointer; color:var(--ec-text3); display:flex; align-items:center; transition: color .15s; }
        .ec-search-box button:hover { color: var(--ec-primary); }
        .ec-filter-select {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px;
          background: var(--ec-card-bg);
          border: 1.5px solid var(--ec-border);
          border-radius: 14px; color: var(--ec-text2);
        }
        .ec-filter-select select { background:none; border:none; outline:none; font-family:'Inter',sans-serif; font-size:14px; font-weight:600; color:var(--ec-text); cursor:pointer; }
        .ec-filter-select select option { background: var(--ec-bg2); color: var(--ec-text); }

        .ec-layout-toggle {
          display: flex; gap: 4px; padding: 5px;
          background: var(--ec-card-bg);
          border: 1.5px solid var(--ec-border);
          border-radius: 12px;
        }
        .ec-layout-toggle button {
          padding: 8px 12px; background:none; border:none;
          border-radius: 8px; cursor:pointer; color:var(--ec-text3);
          display:flex; align-items:center; transition:all .2s;
        }
        .ec-layout-toggle button.active { background: var(--ec-primary); color: #fff; box-shadow: 0 4px 10px rgba(220,38,38,0.2); }

        /* Category pills */
        .ec-cat-pills {
          display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 24px;
        }
        .ec-cat-pill {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 18px;
          background: var(--ec-card-bg);
          border: 1.5px solid var(--ec-border);
          border-radius: 30px;
          font-size: 13px; font-weight: 700;
          color: var(--ec-text2); cursor: pointer; transition: all .25s;
          box-shadow: var(--ec-shadow);
        }
        .ec-cat-pill span { font-size: 11px; background: var(--ec-bg2); padding: 2px 9px; border-radius: 12px; font-weight: 800; color: var(--ec-text3); }
        .ec-cat-pill:hover { border-color: var(--ec-primary); color: var(--ec-primary); transform: translateY(-1px); }
        .ec-cat-pill.active { 
          background: linear-gradient(135deg, var(--ec-primary), var(--ec-primary2)); 
          border-color: var(--ec-primary); 
          color: #fff; 
          box-shadow: var(--ec-shadow-primary);
        }
        .ec-cat-pill.active span { background: rgba(255,255,255,.2); color: #fff; }

        /* Active filters */
        .ec-active-filters {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          margin-bottom: 24px; padding: 12px 18px;
          background: var(--ec-bg2);
          border-radius: 14px; font-size: 13px;
        }
        .ec-active-filters > span:first-child { color: var(--ec-text3); font-weight: 700; }
        .ec-filter-tag {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px;
          background: var(--ec-primary); color: #fff;
          border-radius: 30px; font-size: 11px; font-weight: 700;
          box-shadow: 0 2px 8px rgba(220,38,38,0.2);
        }
        .ec-filter-tag button {
          background: none; border: none; color: #fff; cursor: pointer;
          display: flex; align-items: center; padding: 0; opacity: .8;
        }
        .ec-filter-tag button:hover { opacity: 1; }
        .ec-clear-filters {
          background: none; border: none;
          color: var(--ec-primary); cursor: pointer;
          font-size: 12px; font-weight: 700;
          text-decoration: underline; margin-left: auto;
        }

        /* Product Grid */
        .ec-prod-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 24px;
        }
        .ec-prod-card {
          background: var(--ec-card-bg);
          border: 1.5px solid var(--ec-border);
          border-radius: 20px; overflow: hidden;
          transition: all .35s cubic-bezier(0.4, 0, 0.2, 1); cursor: default;
          box-shadow: var(--ec-shadow);
          position: relative;
        }
        .ec-prod-card:hover { 
          border-color: var(--ec-primary); 
          transform: translateY(-8px); 
          box-shadow: var(--ec-shadow-hover); 
        }

        .ec-prod-img {
          position: relative; height: 240px;
          background: var(--ec-bg2); overflow: hidden;
        }
        .ec-prod-img img { width:100%; height:100%; object-fit:cover; transition:transform .6s cubic-bezier(0.4, 0, 0.2, 1); }
        .ec-prod-card:hover .ec-prod-img img { transform: scale(1.1); }
        .ec-prod-img-ph { width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:var(--ec-text3); background: var(--ec-bg2); }
        
        .ec-prod-cat {
          position:absolute; top:12px; left:12px;
          padding: 5px 12px; border-radius: 30px;
          background: rgba(255,255,255,0.9);
          font-size: 10px; font-weight: 800;
          color: var(--ec-primary);
          letter-spacing: .05em; text-transform: uppercase;
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          z-index: 2;
        }
        .dark .ec-prod-cat { background: rgba(15,23,42,0.8); color: #fff; }
        
        .ec-prod-badge {
          position:absolute; top:12px; right:12px;
          padding: 5px 12px; border-radius: 30px;
          font-size: 10px; font-weight: 800; text-transform: uppercase;
          z-index: 2; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .ec-prod-badge.hot { background: var(--ec-primary); color: #fff; }
        .ec-prod-badge.out { background: #64748b; color: #fff; }

        .ec-prod-overlay {
          position:absolute; inset:0;
          background: rgba(0,0,0,0.4);
          display:flex; align-items:center; justify-content:center; gap:12px;
          opacity:0; transition: all .3s ease;
          backdrop-filter: blur(2px);
          z-index: 5;
        }
        .ec-prod-card:hover .ec-prod-overlay { opacity: 1; }
        .ec-prod-overlay-btn {
          width: 44px; height: 44px;
          border-radius: 14px;
          background: #fff; border: none;
          color: #1e293b; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all .25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          transform: translateY(20px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }
        .ec-prod-card:hover .ec-prod-overlay-btn { transform: translateY(0); }
        .ec-prod-overlay-btn:nth-child(2) { transition-delay: .05s; }
        .ec-prod-overlay-btn:nth-child(3) { transition-delay: .1s; }
        .ec-prod-overlay-btn:hover { transform: scale(1.15) rotate(5deg); background: var(--ec-primary); color: #fff; }
        .ec-prod-overlay-btn.liked { background: #fff5f5; color: #e8291c; }

        .ec-prod-admin-overlay {
          position:absolute; inset:0;
          background: rgba(0,0,0,.55);
          display:flex; align-items:center; justify-content:center; gap:10px;
          opacity:0; transition:opacity .2s;
        }
        .ec-prod-card:hover .ec-prod-admin-overlay { opacity:1; }
        .ec-prod-admin-overlay button {
          width:36px; height:36px; border-radius:8px;
          background:rgba(255,255,255,.9); border:none;
          cursor:pointer; display:flex; align-items:center; justify-content:center;
          transition:all .15s;
        }
        .ec-prod-admin-overlay button:hover { background:#fff; color:var(--ec-primary, #e8291c); }

        .ec-prod-body { padding: 16px; }
        .ec-prod-name { font-size:15px; font-weight:800; color:var(--ec-text, #1a1a1a); margin-bottom:5px; line-height:1.35; }
        .ec-prod-desc { font-size:12px; color:var(--ec-text3, #9ca3af); line-height:1.5; margin-bottom:8px; }
        .ec-prod-stars { display:flex; align-items:center; gap:2px; margin-bottom:10px; }
        .ec-prod-reviews { font-size:10px; color:var(--ec-text3, #9ca3af); margin-left:5px; font-weight: 500; }
        .ec-prod-price {
          font-family:'Barlow Condensed', sans-serif;
          font-size:26px; font-weight:800;
          color:var(--ec-primary, #e8291c); margin-bottom:14px; letter-spacing: -.01em;
        }

        /* Buy controls */
        .ec-prod-buy { display:flex; align-items:center; gap:8px; }
        .ec-qty-ctrl {
          display:flex; align-items:center; gap:0;
          border: 1.5px solid var(--ec-border, #e5e7eb); border-radius:10px; overflow:hidden;
          flex-shrink:0;
        }
        .ec-qty-ctrl button {
          width:30px; height:34px; background:var(--ec-bg, #f5f5f5); border:none;
          cursor:pointer; display:flex; align-items:center; justify-content:center;
          color:var(--ec-text2, #4b5563); transition:all .15s;
        }
        .ec-qty-ctrl button:hover { background:var(--ec-primary, #e8291c); color:#fff; }
        .ec-qty-ctrl span { padding:0 12px; font-size:13px; font-weight:800; color:var(--ec-text, #1a1a1a); min-width:30px; text-align:center; }

        .ec-add-btn {
          flex:1; display:flex; align-items:center; justify-content:center; gap:6px;
          padding: 9px 14px;
          background: linear-gradient(135deg, var(--ec-primary, #e8291c), var(--ec-primary2, #c2200f));
          border:none; border-radius:10px;
          color:#fff; font-size:13px; font-weight:700; font-family:'Inter',sans-serif;
          cursor:pointer; transition:all .25s;
          box-shadow: 0 4px 14px rgba(232,41,28,.25);
        }
        .ec-add-btn:hover:not(.disabled):not(:disabled) { 
          transform: translateY(-2px); 
          box-shadow: 0 8px 24px rgba(232,41,28,.35); 
        }
        .ec-add-btn.disabled, .ec-add-btn:disabled { 
          background: #ccc; cursor:not-allowed; transform:none; box-shadow:none; 
        }
        .ec-btn-spin { 
          width:14px; height:14px; 
          border:2px solid rgba(255,255,255,.4); 
          border-top-color:#fff; border-radius:50%; 
          animation:ecSpin .6s linear infinite; 
        }

        /* Stock pills */
        .ec-stock-pill { padding:4px 10px; border-radius:20px; font-size:10px; font-weight:800; letter-spacing: .02em; }
        .ec-stock-pill.ok  { background:rgba(22,163,74,.1); color:#16a34a; }
        .ec-stock-pill.low { background:rgba(217,119,6,.1);  color:#d97706; }
        .ec-stock-pill.out { background:rgba(220,38,38,.1);  color:#dc2626; }

        /* List view */
        .ec-prod-list { display:flex; flex-direction:column; gap:12px; }
        .ec-list-item {
          display:flex; align-items:center; gap:18px;
          padding:18px; background:var(--ec-card-bg, #fff);
          border:1.5px solid var(--ec-border, #e5e7eb); border-radius:14px;
          transition:all .25s;
        }
        .ec-list-item:hover { 
          border-color:var(--ec-primary, #e8291c); 
          box-shadow:0 6px 20px rgba(0,0,0,.08); 
          transform: translateX(4px);
        }
        .ec-list-img { width:80px; height:80px; border-radius:12px; overflow:hidden; background:var(--ec-bg, #f5f5f5); flex-shrink:0; }
        .ec-list-img img { width:100%; height:100%; object-fit:cover; }
        .ec-list-img-ph { width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:var(--ec-text3, #9ca3af); }
        .ec-list-info { flex:1; }
        .ec-list-name { font-size:16px; font-weight:800; color:var(--ec-text, #1a1a1a); margin-bottom:5px; }
        .ec-cat-badge { 
          display:inline-block; padding:3px 10px; border-radius:20px; 
          font-size:10px; font-weight:800; 
          background:rgba(232,41,28,.1); color:var(--ec-primary, #e8291c); 
          margin-bottom:6px; letter-spacing: .03em;
        }
        .ec-list-desc { font-size:13px; color:var(--ec-text3, #9ca3af); line-height:1.5; }
        .ec-list-right { display:flex; flex-direction:column; align-items:flex-end; gap:8px; min-width: 140px; }
        .ec-list-price { 
          font-family:'Barlow Condensed', sans-serif; 
          font-size:24px; font-weight:800; color:var(--ec-primary, #e8291c); 
        }
        .ec-list-actions { display:flex; align-items:center; gap:8px; }
        .ec-admin-acts { display:flex; gap:6px; }
        .ec-admin-btn {
          width:34px; height:34px; border-radius:8px;
          background:var(--ec-bg, #f5f5f5); border:1.5px solid var(--ec-border, #e5e7eb);
          cursor:pointer; display:flex; align-items:center; justify-content:center;
          color:var(--ec-text2, #4b5563); transition:all .15s;
        }
        .ec-admin-btn:hover { border-color:var(--ec-primary, #e8291c); color:var(--ec-primary, #e8291c); }
        .ec-admin-btn.danger:hover { border-color:#dc2626; color:#dc2626; background: rgba(220,38,38,.06); }

        /* Categories grid */
        .ec-cats-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:16px; }
        .ec-cat-card {
          display:flex; align-items:center; gap:16px; padding:24px;
          background:var(--ec-card-bg, #fff); border:1.5px solid var(--ec-border, #e5e7eb);
          border-radius:16px; transition:all .25s; position:relative;
        }
        .ec-cat-card:hover { 
          border-color:var(--ec-primary, #e8291c); 
          transform:translateY(-3px); 
          box-shadow:0 12px 32px rgba(0,0,0,.1); 
        }
        .ec-cat-card-icon { 
          width:56px; height:56px; border-radius:16px; 
          background: linear-gradient(135deg, rgba(232,41,28,.1), rgba(249,115,22,.08)); 
          display:flex; align-items:center; justify-content:center; 
          color:var(--ec-primary, #e8291c); flex-shrink:0; 
          font-size: 24px;
        }
        .ec-cat-card-info { flex:1; }
        .ec-cat-card-name { font-size:17px; font-weight:800; color:var(--ec-text, #1a1a1a); margin-bottom:5px; }
        .ec-cat-card-desc { font-size:13px; color:var(--ec-text3, #9ca3af); margin-bottom:8px; line-height:1.4; }
        .ec-cat-card-count { 
          display:inline-flex; align-items:center; gap:5px; 
          font-size:12px; font-weight:700; color:var(--ec-primary, #e8291c);
          background: rgba(232,41,28,.06);
          padding: 4px 12px;
          border-radius: 20px;
        }
        .ec-cat-delete { 
          width:34px; height:34px; border-radius:8px; 
          background:rgba(220,38,38,.06); border:none; 
          cursor:pointer; display:flex; align-items:center; justify-content:center; 
          color:#dc2626; transition:all .15s; 
        }
        .ec-cat-delete:hover { background:rgba(220,38,38,.12); transform: scale(1.1); }

        /* Empty */
        .ec-empty {
          text-align:center; padding:60px 24px;
          background:var(--ec-surface, #fff); border:2px dashed var(--ec-border, #e5e7eb);
          border-radius:16px; display:flex; flex-direction:column; align-items:center; gap:12px;
          color:var(--ec-text3, #9ca3af);
        }
        .ec-empty h3 { font-size:18px; font-weight:800; color:var(--ec-text2, #4b5563); margin: 0; }
        .ec-empty p  { font-size:14px; margin: 0; }

        /* Modal */
        .ec-modal-overlay {
          position:fixed; inset:0; background:rgba(0,0,0,.5);
          backdrop-filter:blur(8px);
          display:flex; align-items:center; justify-content:center;
          z-index:1000; padding:20px; animation:ecFadeIn .2s ease;
        }
        @keyframes ecFadeIn { from{opacity:0} to{opacity:1} }
        .ec-modal {
          background:var(--ec-surface, #fff); border-radius:20px;
          width:100%; max-width:520px; max-height:90vh; overflow-y:auto;
          animation:ecSlideUp .25s ease; 
          box-shadow: 0 24px 64px rgba(0,0,0,.2);
        }
        @keyframes ecSlideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .ec-modal-header {
          display:flex; justify-content:space-between; align-items:center;
          padding:20px 24px; border-bottom:1px solid var(--ec-border, #e5e7eb);
        }
        .ec-modal-header h3 { font-size:18px; font-weight:800; color:var(--ec-text, #1a1a1a); margin: 0; }
        .ec-modal-close { 
          width:34px; height:34px; border-radius:10px; 
          background:var(--ec-bg, #f5f5f5); border:none; 
          cursor:pointer; display:flex; align-items:center; justify-content:center; 
          color:var(--ec-text3, #9ca3af); transition:all .15s; 
        }
        .ec-modal-close:hover { background:rgba(220,38,38,.08); color:#dc2626; }
        .ec-modal-body { padding:24px; }

        /* Form */
        .ec-form { display:flex; flex-direction:column; gap:18px; }
        .ec-form-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        .ec-form-group { display:flex; flex-direction:column; gap:6px; }
        .ec-form-group label { font-size:12px; font-weight:700; color:var(--ec-text2, #4b5563); text-transform:uppercase; letter-spacing:.05em; }
        .ec-form-group input, .ec-form-group select, .ec-form-group textarea {
          padding:11px 14px; background:var(--ec-bg2, #fafafa);
          border:1.5px solid var(--ec-border, #e5e7eb); border-radius:10px;
          color:var(--ec-text, #1a1a1a); font-size:14px; font-family:'Inter',sans-serif;
          transition:all .2s; outline:none;
        }
        .ec-form-group input:focus, .ec-form-group select:focus, .ec-form-group textarea:focus { 
          border-color:var(--ec-primary, #e8291c); 
          box-shadow:0 0 0 3px rgba(232,41,28,.1); 
        }
        .ec-form-hint { font-size:11px; color:var(--ec-text3, #9ca3af); margin-top: 2px; }
        .ec-form-actions { display:flex; justify-content:flex-end; gap:10px; padding-top:4px; }

        @media(max-width:768px){
          .ec-prod-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .ec-filters-bar { flex-direction:column; align-items: stretch; }
          .ec-form-row { grid-template-columns:1fr; }
          .ec-list-item { flex-wrap:wrap; }
          .ec-cats-grid { grid-template-columns: 1fr; }
        }
        @media(max-width:480px){
          .ec-prod-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
          .ec-catalog-title { font-size: 26px; }
        }
      `}</style>
    </div>
  );
}
