const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getToken() {
  return localStorage.getItem("ecomod_token");
}

function getRefreshToken() {
  return localStorage.getItem("ecomod_refresh_token");
}

async function req(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${BASE}${path}`, { ...options, headers, signal: controller.signal });
    clearTimeout(timeout);
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
      throw new Error(data.detail || data.message || `Error ${res.status}`);
    return data;
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') throw new Error('La solicitud tardó demasiado. Intenta de nuevo.');
    throw e;
  }
}

// AUTH API
export const authApi = {
  register: (body) =>
    req("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) =>
    req("/auth/login", { method: "POST", body: JSON.stringify(body) }),

  // ✅ NUEVO: Google OAuth
  googleAuth: (credential) =>
    req("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential }),
    }),

  profile: () => req("/auth/profile"),
  health: () => req("/auth/health"),
  refreshToken: (refreshToken) =>
    req("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),
  logout: () => req("/auth/logout", { method: "POST" }),
  updateProfile: (profileData) =>
    req("/auth/profile", { method: "PUT", body: JSON.stringify(profileData) }),
  changePassword: ({ current_password, new_password }) =>
    req("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ current_password, new_password }),
    }),
  forgotPassword: (email) =>
    req("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token, new_password) =>
    req("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password }),
    }),
  verifyEmail: (token) => req(`/auth/verify-email/${token}`, { method: "GET" }),
  resendVerification: (email) =>
    req("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  getAllUsers: () => req("/auth/users"),
  getUserById: (userId) => req(`/auth/users/${userId}`),
  updateUserRole: (userId, role) =>
    req(`/auth/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
  updateUserStatus: (userId, isActive) =>
    req(`/auth/users/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: isActive }),
    }),
  deleteUser: (userId) => req(`/auth/users/${userId}`, { method: "DELETE" }),
  getUserStats: () => req("/auth/stats/users"),
};

// CATALOG API
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

// INVENTORY API
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

// CART API
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

// ORDERS API
export const ordersApi = {
  create: (body) =>
    req("/orders/", {
      method: "POST",
      body: JSON.stringify({
        user_id: body.user_id,
        cart_id: body.cart_id,
        items: body.items.map((item) => ({
          product_id: parseInt(item.product_id),
          product_name: item.product_name,
          unit_price: parseFloat(item.unit_price),
          quantity: parseInt(item.quantity),
        })),
        notes: body.notes || null,
        email: body.email || null,
        total_amount: body.total_amount,
      }),
    }),
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

// PAYMENTS API
export const paymentsApi = {
  createIntent: (body) =>
    req("/payments/stripe/create-intent", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  confirmIntent: (body) =>
    req("/payments/stripe/confirm", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  createPaypalOrder: (body) =>
    req("/payments/paypal/create", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  executePaypalOrder: (paymentId, payerId, orderId) =>
    req(
      `/payments/paypal/execute?paymentId=${paymentId}&PayerID=${payerId}&order_id=${orderId}`,
      { method: "GET" },
    ),
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

// SHIPPING API
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

// NOTIFICATIONS API
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

// TOKEN UTILS
export const tokenUtils = {
  getToken,
  getRefreshToken,
  setToken: (token) => localStorage.setItem("ecomod_token", token),
  setRefreshToken: (refreshToken) =>
    localStorage.setItem("ecomod_refresh_token", refreshToken),
  removeTokens: () => {
    localStorage.removeItem("ecomod_token");
    localStorage.removeItem("ecomod_refresh_token");
  },
};
