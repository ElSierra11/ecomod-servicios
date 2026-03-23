const BASE = "";

function getToken() {
  return localStorage.getItem("ecomod_token");
}

async function req(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `Error ${res.status}`);
  return data;
}

// AUTH
export const authApi = {
  register: (body) =>
    req("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) =>
    req("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  profile: () => req("/auth/profile"),
  health: () => req("/auth/health"),
};

// CATALOG
export const catalogApi = {
  getProducts: (params = "") => req(`/catalog/products${params}`),
  getProduct: (id) => req(`/catalog/products/${id}`),
  createProduct: (body) =>
    req("/catalog/products", { method: "POST", body: JSON.stringify(body) }),
  updateProduct: (id, body) =>
    req(`/catalog/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteProduct: (id) => req(`/catalog/products/${id}`, { method: "DELETE" }),
  getCategories: () => req("/catalog/categories"),
  createCategory: (body) =>
    req("/catalog/categories", { method: "POST", body: JSON.stringify(body) }),
  deleteCategory: (id) =>
    req(`/catalog/categories/${id}`, { method: "DELETE" }),
  health: () => req("/catalog/health"),
};

// INVENTORY
export const inventoryApi = {
  getAll: () => req("/inventory/"),
  getStock: (pid) => req(`/inventory/${pid}`),
  create: (body) =>
    req("/inventory/", { method: "POST", body: JSON.stringify(body) }),
  update: (pid, body) =>
    req(`/inventory/${pid}`, { method: "PUT", body: JSON.stringify(body) }),
  reserve: (body) =>
    req("/inventory/reserve", { method: "POST", body: JSON.stringify(body) }),
  release: (body) =>
    req("/inventory/release", { method: "POST", body: JSON.stringify(body) }),
  health: () => req("/inventory/health"),
};

// CART
export const cartApi = {
  create: (body = {}) =>
    req("/cart/", { method: "POST", body: JSON.stringify(body) }),
  getByUser: (userId) => req(`/cart/user/${userId}`),
  getByToken: (token) => req(`/cart/anonymous/${token}`),
  getById: (cartId) => req(`/cart/${cartId}`),
  addItem: (cartId, body) =>
    req(`/cart/${cartId}/items`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateItem: (cartId, itemId, body) =>
    req(`/cart/${cartId}/items/${itemId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  removeItem: (cartId, itemId) =>
    req(`/cart/${cartId}/items/${itemId}`, { method: "DELETE" }),
  clearCart: (cartId) => req(`/cart/${cartId}/items`, { method: "DELETE" }),
  merge: (body) =>
    req("/cart/merge", { method: "POST", body: JSON.stringify(body) }),
  health: () => req("/cart/health"),
};

// ORDERS
export const ordersApi = {
  create: (body) =>
    req("/orders/", { method: "POST", body: JSON.stringify(body) }),
  getAll: () => req("/orders/"),
  getById: (id) => req(`/orders/${id}`),
  getByUser: (userId) => req(`/orders/user/${userId}`),
  updateStatus: (id, status) =>
    req(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  health: () => req("/orders/health"),
};

// PAYMENTS
export const paymentsApi = {
  process: (body) =>
    req("/payments/", { method: "POST", body: JSON.stringify(body) }),
  getAll: () => req("/payments/"),
  getById: (id) => req(`/payments/${id}`),
  getByOrder: (orderId) => req(`/payments/order/${orderId}`),
  getByUser: (userId) => req(`/payments/user/${userId}`),
  refund: (id, body = {}) =>
    req(`/payments/${id}/refund`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  health: () => req("/payments/health"),
};

// SHIPPING
export const shippingApi = {
  create: (body) =>
    req("/shipping/", { method: "POST", body: JSON.stringify(body) }),
  getAll: () => req("/shipping/"),
  getById: (id) => req(`/shipping/${id}`),
  getByOrder: (orderId) => req(`/shipping/order/${orderId}`),
  getByUser: (userId) => req(`/shipping/user/${userId}`),
  getByTracking: (tracking) => req(`/shipping/tracking/${tracking}`),
  updateStatus: (id, status) =>
    req(`/shipping/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  calculateCost: (department, carrier = "Servientrega") =>
    req(
      `/shipping/calculate?department=${encodeURIComponent(department)}&carrier=${encodeURIComponent(carrier)}`,
    ),
  getRates: () => req("/shipping/rates"),
  health: () => req("/shipping/health"),
};

// NOTIFICATIONS
export const notificationsApi = {
  getAll: () => req("/notifications/"),
  getByUser: (userId) => req(`/notifications/user/${userId}`),
  sendOrderConfirmed: (body) =>
    req("/notifications/events/order-confirmed", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  sendPaymentSucceeded: (body) =>
    req("/notifications/events/payment-succeeded", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  sendShipmentCreated: (body) =>
    req("/notifications/events/shipment-created", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  health: () => req("/notifications/health"),
};
