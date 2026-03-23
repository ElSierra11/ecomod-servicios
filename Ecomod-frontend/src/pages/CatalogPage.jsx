import { useEffect, useState, useCallback } from "react";
import { catalogApi } from "../services/api";

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

  const [pForm, setPForm] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    image_urls: "",
  });
  const [cForm, setCForm] = useState({ name: "", description: "" });

  const loadProducts = useCallback(
    (cat, src) => {
      const params = new URLSearchParams();
      if (src !== undefined ? src : search)
        params.set("search", src !== undefined ? src : search);
      if (cat !== undefined ? cat : catFilter)
        params.set("category_id", cat !== undefined ? cat : catFilter);
      catalogApi
        .getProducts(params.toString() ? "?" + params.toString() : "")
        .then(setProducts)
        .catch(() => {});
    },
    [search, catFilter],
  );

  const loadData = useCallback(
    (cat) => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const filterVal = cat !== undefined ? cat : catFilter;
      if (filterVal) params.set("category_id", filterVal);
      catalogApi
        .getProducts(params.toString() ? "?" + params.toString() : "")
        .then(setProducts)
        .catch(() => {});
      catalogApi
        .getCategories()
        .then(setCategories)
        .catch(() => {});
    },
    [search, catFilter],
  );

  useEffect(() => {
    loadData();
  }, []);

  const handleCatFilter = (val) => {
    setCatFilter(val);
    // Filtrar inmediatamente con el nuevo valor
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (val) params.set("category_id", val);
    catalogApi
      .getProducts(params.toString() ? "?" + params.toString() : "")
      .then(setProducts)
      .catch(() => {});
  };

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
            Catálogo
          </h2>
          <p style={{ color: "var(--text2)", fontSize: 14, marginTop: 4 }}>
            Administra productos y categorías del sistema
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm" onClick={openNewCategory}>
            + Categoría
          </button>
          <button className="btn btn-primary btn-sm" onClick={openNewProduct}>
            + Producto
          </button>
        </div>
      </div>

      {/* TABS */}
      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 24,
          borderBottom: "1px solid var(--border)",
        }}
      >
        {["products", "categories"].map((t) => (
          <button
            key={t}
            onClick={() => setView(t)}
            style={{
              padding: "10px 20px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${view === t ? "var(--accent)" : "transparent"}`,
              color: view === t ? "var(--accent)" : "var(--text2)",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14,
              marginBottom: -1,
            }}
          >
            {t === "products"
              ? `Productos (${products.length})`
              : `Categorías (${categories.length})`}
          </button>
        ))}
      </div>

      {/* FILTERS */}
      {view === "products" && (
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <input
            className="form-input"
            style={{ maxWidth: 260 }}
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadData()}
          />
          <select
            className="form-select"
            style={{ maxWidth: 200 }}
            value={catFilter}
            onChange={(e) => handleCatFilter(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {catFilter && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => handleCatFilter("")}
            >
              ✕ Limpiar filtro
            </button>
          )}
          <button className="btn btn-outline btn-sm" onClick={() => loadData()}>
            Filtrar
          </button>
        </div>
      )}

      {/* PRODUCTS GRID */}
      {view === "products" &&
        (products.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🏪</div>
            <div className="empty-title">Sin productos</div>
            <p>
              {catFilter
                ? `No hay productos en esta categoría`
                : "Crea el primer producto del catálogo"}
            </p>
          </div>
        ) : (
          <div className="card-grid">
            {products.map((p) => (
              <div key={p.id} className="product-card">
                {p.image_urls && p.image_urls.length > 0 ? (
                  <div
                    style={{
                      width: "100%",
                      height: 160,
                      borderRadius: 10,
                      overflow: "hidden",
                      marginBottom: 12,
                      background: "var(--bg3)",
                    }}
                  >
                    <img
                      src={p.image_urls[0]}
                      alt={p.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: 120,
                      borderRadius: 10,
                      marginBottom: 12,
                      background: "var(--bg3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 36,
                      color: "var(--text3)",
                    }}
                  >
                    🏷️
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div className="product-name">{p.name}</div>
                  <span className="badge badge-cyan">ID {p.id}</span>
                </div>
                <div className="product-price">
                  ${Number(p.price).toLocaleString("es-CO")}
                </div>
                <div className="product-desc">
                  {p.description || "Sin descripción"}
                </div>
                <div className="product-meta">
                  {p.category_id ? (
                    <span className="badge badge-pink">
                      {catMap[p.category_id] || `Cat. ${p.category_id}`}
                    </span>
                  ) : (
                    <span className="badge">Sin categoría</span>
                  )}
                  <div className="flex gap-2">
                    <button
                      className="btn btn-ghost btn-sm btn-icon"
                      title="Editar"
                      onClick={() => openEditProduct(p)}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn btn-danger btn-sm btn-icon"
                      title="Eliminar"
                      onClick={() => deleteProduct(p.id)}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

      {/* CATEGORIES TABLE */}
      {view === "categories" &&
        (categories.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🏷️</div>
            <div className="empty-title">Sin categorías</div>
            <p>Crea la primera categoría</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="badge badge-cyan">{c.id}</span>
                    </td>
                    <td style={{ fontWeight: 600, color: "var(--text)" }}>
                      {c.name}
                    </td>
                    <td>{c.description || "—"}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteCategory(c.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {/* MODAL PRODUCTO */}
      {modal === "product" && (
        <Modal
          title={editItem ? "Editar producto" : "Nuevo producto"}
          onClose={() => setModal(null)}
        >
          <form onSubmit={saveProduct}>
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input
                className="form-input"
                value={pForm.name}
                onChange={(e) =>
                  setPForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea
                className="form-textarea"
                value={pForm.description}
                onChange={(e) =>
                  setPForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div className="form-group">
                <label className="form-label">Precio * (COP)</label>
                <input
                  className="form-input"
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
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select
                  className="form-select"
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
            <div className="form-group">
              <label className="form-label">
                URLs de imágenes{" "}
                <span className="text-muted">(separadas por coma)</span>
              </label>
              <input
                className="form-input"
                placeholder="https://..., https://..."
                value={pForm.image_urls}
                onChange={(e) =>
                  setPForm((f) => ({ ...f, image_urls: e.target.value }))
                }
              />
              {pForm.image_urls && pForm.image_urls.trim() && (
                <div
                  style={{
                    marginTop: 10,
                    borderRadius: 8,
                    overflow: "hidden",
                    height: 100,
                    background: "var(--bg3)",
                  }}
                >
                  <img
                    src={pForm.image_urls.split(",")[0].trim()}
                    alt="preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
            <div
              className="flex gap-2"
              style={{ justifyContent: "flex-end", marginTop: 8 }}
            >
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

      {/* MODAL CATEGORÍA */}
      {modal === "category" && (
        <Modal title="Nueva categoría" onClose={() => setModal(null)}>
          <form onSubmit={saveCategory}>
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input
                className="form-input"
                value={cForm.name}
                onChange={(e) =>
                  setCForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea
                className="form-textarea"
                value={cForm.description}
                onChange={(e) =>
                  setCForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div
              className="flex gap-2"
              style={{ justifyContent: "flex-end", marginTop: 8 }}
            >
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
                {loading ? "Guardando..." : "Crear categoría"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
