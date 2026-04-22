import { useEffect, useState, useCallback } from "react";
import { catalogApi } from "../services/api";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  X,
  Package,
  Tag,
  Image as ImageIcon,
  Grid3x3,
  List,
  ChevronLeft,
  ChevronRight,
  Star,
  Eye,
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

export default function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [view, setView] = useState("products");
  const [modal, setModal] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [layout, setLayout] = useState("grid");
  const [hoveredProduct, setHoveredProduct] = useState(null);

  const [pForm, setPForm] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    image_urls: "",
  });
  const [cForm, setCForm] = useState({ name: "", description: "" });

  const loadData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (catFilter) params.set("category_id", catFilter);

      const [productsData, categoriesData] = await Promise.all([
        catalogApi.getProducts(
          params.toString() ? "?" + params.toString() : "",
        ),
        catalogApi.getCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      showAlert("error", "Error al cargar datos");
    }
  }, [search, catFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 3500);
  };

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
    setLoading(true);
    try {
      const body = {
        name: pForm.name,
        description: pForm.description,
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
        showAlert("success", "Producto actualizado");
      } else {
        await catalogApi.createProduct(body);
        showAlert("success", "Producto creado");
      }
      setModal(null);
      loadData();
    } catch (err) {
      showAlert("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm("¿Eliminar este producto?")) return;
    try {
      await catalogApi.deleteProduct(id);
      showAlert("success", "Producto eliminado");
      loadData();
    } catch (err) {
      showAlert("error", err.message);
    }
  };

  const openNewCategory = () => {
    setEditItem(null);
    setCForm({ name: "", description: "" });
    setModal("category");
  };

  const saveCategory = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await catalogApi.createCategory(cForm);
      showAlert("success", "Categoría creada");
      setModal(null);
      loadData();
    } catch (err) {
      showAlert("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id) => {
    if (!confirm("¿Eliminar esta categoría?")) return;
    try {
      await catalogApi.deleteCategory(id);
      showAlert("success", "Categoría eliminada");
      loadData();
    } catch (err) {
      showAlert("error", err.message);
    }
  };

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return (
    <div className="catalog-modern">
      {/* Header */}
      <div className="catalog-header">
        <div className="catalog-header-left">
          <div className="catalog-badge">
            <Package size={14} />
            <span>GESTIÓN DE PRODUCTOS</span>
          </div>
          <h1 className="catalog-title">
            Catálogo
            <span>Administra productos y categorías</span>
          </h1>
        </div>
        <div className="catalog-header-right">
          <button className="catalog-btn-outline" onClick={openNewCategory}>
            <Tag size={16} />
            <span>Nueva Categoría</span>
          </button>
          <button className="catalog-btn-primary" onClick={openNewProduct}>
            <Plus size={16} />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <div className={`catalog-alert ${alert.type}`}>
          <span>{alert.text}</span>
          <button onClick={() => setAlert(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="catalog-tabs">
        <button
          className={`catalog-tab ${view === "products" ? "active" : ""}`}
          onClick={() => setView("products")}
        >
          <Package size={16} />
          <span>Productos</span>
          <span className="catalog-tab-count">{products.length}</span>
        </button>
        <button
          className={`catalog-tab ${view === "categories" ? "active" : ""}`}
          onClick={() => setView("categories")}
        >
          <Tag size={16} />
          <span>Categorías</span>
          <span className="catalog-tab-count">{categories.length}</span>
        </button>
      </div>

      {/* Products View */}
      {view === "products" && (
        <>
          {/* Filters */}
          <div className="catalog-filters">
            <div className="catalog-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadData()}
              />
              {search && (
                <button onClick={() => setSearch("")}>
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="catalog-filter-select">
              <Filter size={18} />
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
            <div className="catalog-layout-toggle">
              <button
                className={`catalog-layout-btn ${layout === "grid" ? "active" : ""}`}
                onClick={() => setLayout("grid")}
              >
                <Grid3x3 size={16} />
              </button>
              <button
                className={`catalog-layout-btn ${layout === "list" ? "active" : ""}`}
                onClick={() => setLayout("list")}
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {/* Products Grid/List */}
          {products.length === 0 ? (
            <div className="catalog-empty">
              <Package size={48} strokeWidth={1} />
              <h3>No hay productos</h3>
              <p>
                {catFilter
                  ? "No hay productos en esta categoría"
                  : "Crea el primer producto del catálogo"}
              </p>
            </div>
          ) : layout === "grid" ? (
            <div className="catalog-grid">
              {products.map((p, idx) => (
                <div
                  key={p.id}
                  className="catalog-product-card"
                  onMouseEnter={() => setHoveredProduct(p.id)}
                  onMouseLeave={() => setHoveredProduct(null)}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="catalog-product-image">
                    {p.image_urls && p.image_urls.length > 0 ? (
                      <img src={p.image_urls[0]} alt={p.name} />
                    ) : (
                      <div className="catalog-product-image-placeholder">
                        <ImageIcon size={32} />
                      </div>
                    )}
                    <div
                      className={`catalog-product-actions ${hoveredProduct === p.id ? "visible" : ""}`}
                    >
                      <button onClick={() => openEditProduct(p)}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => deleteProduct(p.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="catalog-product-info">
                    <div className="catalog-product-header">
                      <h3 className="catalog-product-name">{p.name}</h3>
                      {p.category_id && (
                        <span className="catalog-product-category">
                          {catMap[p.category_id]}
                        </span>
                      )}
                    </div>
                    <p className="catalog-product-description">
                      {p.description?.slice(0, 80) || "Sin descripción"}
                      {p.description?.length > 80 && "..."}
                    </p>
                    <div className="catalog-product-footer">
                      <span className="catalog-product-price">
                        ${Number(p.price).toLocaleString("es-CO")}
                      </span>
                      <span className="catalog-product-id">ID {p.id}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="catalog-list">
              {products.map((p) => (
                <div key={p.id} className="catalog-list-item">
                  <div className="catalog-list-image">
                    {p.image_urls && p.image_urls.length > 0 ? (
                      <img src={p.image_urls[0]} alt={p.name} />
                    ) : (
                      <Package size={24} />
                    )}
                  </div>
                  <div className="catalog-list-info">
                    <h4>{p.name}</h4>
                    <p>{p.description?.slice(0, 60) || "Sin descripción"}</p>
                    <div className="catalog-list-meta">
                      {p.category_id && (
                        <span className="catalog-list-category">
                          {catMap[p.category_id]}
                        </span>
                      )}
                      <span className="catalog-list-id">ID {p.id}</span>
                    </div>
                  </div>
                  <div className="catalog-list-price">
                    <span>${Number(p.price).toLocaleString("es-CO")}</span>
                  </div>
                  <div className="catalog-list-actions">
                    <button onClick={() => openEditProduct(p)}>
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => deleteProduct(p.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Categories View */}
      {view === "categories" && (
        <div className="catalog-categories">
          {categories.length === 0 ? (
            <div className="catalog-empty">
              <Tag size={48} strokeWidth={1} />
              <h3>No hay categorías</h3>
              <p>Crea la primera categoría para organizar tus productos</p>
            </div>
          ) : (
            <div className="catalog-categories-grid">
              {categories.map((c) => (
                <div key={c.id} className="catalog-category-card">
                  <div className="catalog-category-icon">
                    <Tag size={24} />
                  </div>
                  <div className="catalog-category-info">
                    <h3>{c.name}</h3>
                    <p>{c.description || "Sin descripción"}</p>
                    <div className="catalog-category-meta">
                      <span className="catalog-category-id">ID {c.id}</span>
                      <span className="catalog-category-products">
                        {products.filter((p) => p.category_id === c.id).length}{" "}
                        productos
                      </span>
                    </div>
                  </div>
                  <button
                    className="catalog-category-delete"
                    onClick={() => deleteCategory(c.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product Modal */}
      {modal === "product" && (
        <Modal
          title={editItem ? "Editar producto" : "Nuevo producto"}
          onClose={() => setModal(null)}
        >
          <form onSubmit={saveProduct} className="catalog-modal-form">
            <div className="catalog-form-group">
              <label>Nombre del producto *</label>
              <input
                type="text"
                value={pForm.name}
                onChange={(e) =>
                  setPForm((f) => ({ ...f, name: e.target.value }))
                }
                required
                placeholder="Ej: Camiseta Deportiva"
              />
            </div>
            <div className="catalog-form-group">
              <label>Descripción</label>
              <textarea
                rows="3"
                value={pForm.description}
                onChange={(e) =>
                  setPForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Describe el producto..."
              />
            </div>
            <div className="catalog-form-row">
              <div className="catalog-form-group">
                <label>Precio * (COP)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={pForm.price}
                  onChange={(e) =>
                    setPForm((f) => ({ ...f, price: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="catalog-form-group">
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
            <div className="catalog-form-group">
              <label>URLs de imágenes</label>
              <input
                type="text"
                placeholder="https://ejemplo.com/imagen.jpg, https://..."
                value={pForm.image_urls}
                onChange={(e) =>
                  setPForm((f) => ({ ...f, image_urls: e.target.value }))
                }
              />
              <span className="catalog-form-hint">
                Separa múltiples URLs con comas
              </span>
            </div>
            <div className="catalog-modal-actions">
              <button
                type="button"
                className="catalog-btn-secondary"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="catalog-btn-primary"
                disabled={loading}
              >
                {loading
                  ? "Guardando..."
                  : editItem
                    ? "Guardar cambios"
                    : "Crear producto"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Category Modal */}
      {modal === "category" && (
        <Modal title="Nueva categoría" onClose={() => setModal(null)}>
          <form onSubmit={saveCategory} className="catalog-modal-form">
            <div className="catalog-form-group">
              <label>Nombre de la categoría *</label>
              <input
                type="text"
                value={cForm.name}
                onChange={(e) =>
                  setCForm((f) => ({ ...f, name: e.target.value }))
                }
                required
                placeholder="Ej: Electrónica"
              />
            </div>
            <div className="catalog-form-group">
              <label>Descripción</label>
              <textarea
                rows="3"
                value={cForm.description}
                onChange={(e) =>
                  setCForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Describe la categoría..."
              />
            </div>
            <div className="catalog-modal-actions">
              <button
                type="button"
                className="catalog-btn-secondary"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="catalog-btn-primary"
                disabled={loading}
              >
                {loading ? "Guardando..." : "Crear categoría"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <style jsx>{`
        .catalog-modern {
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

        .catalog-header {
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

        .catalog-badge {
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

        .catalog-title {
          font-size: 28px;
          font-weight: 800;
          margin: 0;
        }

        .catalog-title span {
          display: block;
          font-size: 14px;
          font-weight: 400;
          color: var(--text2);
          margin-top: 4px;
        }

        .catalog-header-right {
          display: flex;
          gap: 12px;
        }

        .catalog-btn-primary,
        .catalog-btn-outline {
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

        .catalog-btn-primary {
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border: none;
          color: #000;
        }

        .catalog-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(124, 252, 110, 0.3);
        }

        .catalog-btn-outline {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text2);
        }

        .catalog-btn-outline:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .catalog-alert {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          border-radius: var(--radius);
          margin-bottom: 20px;
          animation: slideDown 0.3s ease;
        }

        .catalog-alert.success {
          background: rgba(124, 252, 110, 0.1);
          border: 1px solid rgba(124, 252, 110, 0.2);
          color: var(--accent);
        }

        .catalog-alert.error {
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.2);
          color: var(--danger);
        }

        .catalog-alert button {
          background: none;
          border: none;
          cursor: pointer;
          color: currentColor;
        }

        .catalog-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 8px;
        }

        .catalog-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: none;
          border: none;
          border-radius: var(--radius);
          color: var(--text2);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .catalog-tab.active {
          background: var(--surface);
          color: var(--accent);
        }

        .catalog-tab-count {
          padding: 2px 8px;
          background: var(--bg2);
          border-radius: 20px;
          font-size: 11px;
        }

        .catalog-filters {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .catalog-search {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          transition: all 0.2s;
        }

        .catalog-search:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(124, 252, 110, 0.1);
        }

        .catalog-search input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          font-size: 14px;
        }

        .catalog-search button {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text3);
        }

        .catalog-filter-select {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
        }

        .catalog-filter-select select {
          background: none;
          border: none;
          outline: none;
          color: var(--text);
          font-size: 14px;
        }

        .catalog-layout-toggle {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
        }

        .catalog-layout-btn {
          padding: 8px 12px;
          background: none;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          color: var(--text3);
          transition: all 0.2s;
        }

        .catalog-layout-btn.active {
          background: var(--surface);
          color: var(--accent);
        }

        .catalog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .catalog-product-card {
          background: var(--surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          overflow: hidden;
          transition: all 0.3s;
          animation: slideUp 0.3s ease-out forwards;
          opacity: 0;
          transform: translateY(10px);
        }

        @keyframes slideUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .catalog-product-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow);
          border-color: var(--accent);
        }

        .catalog-product-image {
          position: relative;
          height: 200px;
          overflow: hidden;
          background: var(--bg3);
        }

        .catalog-product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }

        .catalog-product-card:hover .catalog-product-image img {
          transform: scale(1.05);
        }

        .catalog-product-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text3);
        }

        .catalog-product-actions {
          position: absolute;
          top: 12px;
          right: 12px;
          display: flex;
          gap: 8px;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .catalog-product-actions.visible {
          opacity: 1;
        }

        .catalog-product-actions button {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.7);
          border: none;
          cursor: pointer;
          color: white;
          transition: all 0.2s;
        }

        .catalog-product-actions button:hover {
          background: var(--accent);
          color: #000;
        }

        .catalog-product-info {
          padding: 16px;
        }

        .catalog-product-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .catalog-product-name {
          font-size: 16px;
          font-weight: 700;
          margin: 0;
        }

        .catalog-product-category {
          font-size: 10px;
          padding: 2px 8px;
          background: rgba(124, 252, 110, 0.1);
          border-radius: 20px;
          color: var(--accent);
        }

        .catalog-product-description {
          font-size: 12px;
          color: var(--text2);
          line-height: 1.5;
          margin-bottom: 12px;
        }

        .catalog-product-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .catalog-product-price {
          font-size: 20px;
          font-weight: 800;
          color: var(--accent);
        }

        .catalog-product-id {
          font-size: 10px;
          color: var(--text3);
        }

        .catalog-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .catalog-list-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          transition: all 0.3s;
        }

        .catalog-list-item:hover {
          border-color: var(--accent);
          transform: translateX(4px);
        }

        .catalog-list-image {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          background: var(--bg3);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .catalog-list-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .catalog-list-info {
          flex: 1;
        }

        .catalog-list-info h4 {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .catalog-list-info p {
          font-size: 12px;
          color: var(--text2);
          margin-bottom: 6px;
        }

        .catalog-list-meta {
          display: flex;
          gap: 12px;
          font-size: 10px;
        }

        .catalog-list-category {
          padding: 2px 8px;
          background: rgba(124, 252, 110, 0.1);
          border-radius: 20px;
          color: var(--accent);
        }

        .catalog-list-id {
          color: var(--text3);
        }

        .catalog-list-price {
          text-align: right;
          min-width: 100px;
        }

        .catalog-list-price span {
          font-size: 18px;
          font-weight: 700;
          color: var(--accent);
        }

        .catalog-list-actions {
          display: flex;
          gap: 8px;
        }

        .catalog-list-actions button {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--bg2);
          border: 1px solid var(--border);
          cursor: pointer;
          transition: all 0.2s;
        }

        .catalog-list-actions button:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .catalog-empty {
          text-align: center;
          padding: 60px 24px;
          background: var(--surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
        }

        .catalog-empty svg {
          color: var(--text3);
          margin-bottom: 16px;
        }

        .catalog-empty h3 {
          font-size: 18px;
          margin-bottom: 8px;
        }

        .catalog-empty p {
          color: var(--text2);
        }

        .catalog-categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .catalog-category-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          transition: all 0.3s;
          position: relative;
        }

        .catalog-category-card:hover {
          border-color: var(--accent);
          transform: translateY(-2px);
        }

        .catalog-category-icon {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          background: rgba(124, 252, 110, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
        }

        .catalog-category-info {
          flex: 1;
        }

        .catalog-category-info h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .catalog-category-info p {
          font-size: 12px;
          color: var(--text2);
          margin-bottom: 6px;
        }

        .catalog-category-meta {
          display: flex;
          gap: 12px;
          font-size: 10px;
        }

        .catalog-category-id {
          color: var(--text3);
        }

        .catalog-category-products {
          color: var(--accent);
        }

        .catalog-category-delete {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(248, 113, 113, 0.1);
          border: none;
          cursor: pointer;
          color: var(--danger);
          transition: all 0.2s;
        }

        .catalog-category-delete:hover {
          background: rgba(248, 113, 113, 0.2);
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

        .catalog-modal-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .catalog-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .catalog-form-group label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text2);
        }

        .catalog-form-group input,
        .catalog-form-group select,
        .catalog-form-group textarea {
          padding: 10px 14px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          color: var(--text);
          font-size: 14px;
          transition: all 0.2s;
        }

        .catalog-form-group input:focus,
        .catalog-form-group select:focus,
        .catalog-form-group textarea:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(124, 252, 110, 0.1);
        }

        .catalog-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .catalog-form-hint {
          font-size: 11px;
          color: var(--text3);
          margin-top: 4px;
        }

        .catalog-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 8px;
        }

        .catalog-btn-secondary {
          padding: 10px 20px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          color: var(--text2);
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .catalog-header {
            flex-direction: column;
            align-items: stretch;
          }
          .catalog-header-right {
            justify-content: stretch;
          }
          .catalog-header-right button {
            flex: 1;
            justify-content: center;
          }
          .catalog-grid {
            grid-template-columns: 1fr;
          }
          .catalog-form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
