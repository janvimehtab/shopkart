import axios from "axios";

// Create an Axios instance with withCredentials set to true
// This ensures that the HttpOnly token cookie is automatically attached to requests
const API = axios.create({
  baseURL: "http://localhost:5001",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Task 1 — Register a new customer
 * POST /customers/register
 * Payload: { fullName, email, password, phone }
 */
export const registerCustomer = async (customerData) => {
  const response = await API.post("/customers/register", customerData);
  return response.data;
};

/**
 * Task 2 — Login existing customer
 * POST /customers/login
 * Payload: { email, password }
 */
export const loginCustomer = async (credentials) => {
  const response = await API.post("/customers/login", credentials);
  return response.data;
};

/**
 * Task 3 — Fetch logged in user profile
 * GET /customers/me
 * Sends HttpOnly cookie automatically
 */
export const getProfile = async () => {
  const response = await API.get("/customers/me");
  return response.data;
};

/**
 * Task 4 — Logout user
 * POST /customers/logout
 * Clears HttpOnly cookie on backend
 */
export const logoutCustomer = async () => {
  const response = await API.post("/customers/logout");
  return response.data;
};

/**
 * Task 3 & 5 & Bonus — Get all products with search, category, sort
 * GET /products
 */
export const getProducts = async ({ search = "", category = "", sort = "" } = {}) => {
  const params = {};
  if (search) params.search = search;
  if (category && category !== "All Categories") params.category = category;
  if (sort) params.sort = sort;

  const response = await API.get("/products", { params });
  return response.data;
};

/**
 * Task 4 — Get single product by ID
 * GET /products/:id
 */
export const getProductById = async (id) => {
  const response = await API.get(`/products/${id}`);
  return response.data;
};

/**
 * Task 2 — Create product
 * POST /products
 */
export const createProduct = async (productData) => {
  const response = await API.post("/products", productData);
  return response.data;
};

/**
 * Task 3 — Get Current User's Wishlist
 * GET /wishlist
 */
export const getWishlist = async () => {
  const response = await API.get("/wishlist");
  return response.data;
};

/**
 * Task 2 — Add Product to Wishlist
 * POST /wishlist/:productId
 */
export const addToWishlist = async (productId) => {
  const response = await API.post(`/wishlist/${productId}`);
  return response.data;
};

/**
 * Task 4 — Remove Product from Wishlist
 * DELETE /wishlist/:productId
 */
export const removeFromWishlist = async (productId) => {
  const response = await API.delete(`/wishlist/${productId}`);
  return response.data;
};

/**
 * Bonus Task — Toggle Wishlist State
 * PATCH /wishlist/:productId/toggle
 */
export const toggleWishlist = async (productId) => {
  const response = await API.patch(`/wishlist/${productId}/toggle`);
  return response.data;
};

/**
 * Task 3 — Get Current User's Cart
 * GET /cart
 */
export const getCart = async () => {
  const response = await API.get("/cart");
  return response.data;
};

/**
 * Task 2 — Add Product to Cart
 * POST /cart/:productId
 */
export const addToCart = async (productId) => {
  const response = await API.post(`/cart/${productId}`);
  return response.data;
};

/**
 * Task 4 — Update Product Quantity in Cart
 * PATCH /cart/:productId
 * Payload: { quantity }
 */
export const updateCartQuantity = async (productId, quantity) => {
  const response = await API.patch(`/cart/${productId}`, { quantity });
  return response.data;
};

/**
 * Task 5 — Remove Product from Cart
 * DELETE /cart/:productId
 */
export const removeFromCart = async (productId) => {
  const response = await API.delete(`/cart/${productId}`);
  return response.data;
};

/**
 * Lab 06 Task 4 — Create Razorpay Payment Order & ShopKart Pending Order
 * POST /orders/create-payment-order
 * Payload: { shippingAddress: { fullName, phone, addressLine1, city, state, pincode } }
 */
export const createPaymentOrder = async (shippingAddress) => {
  const response = await API.post("/orders/create-payment-order", {
    shippingAddress,
  });
  return response.data;
};

/**
 * Lab 06 Task 5 — Verify Razorpay Payment Signature
 * POST /orders/verify-payment
 * Payload: { shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
export const verifyPayment = async (paymentData) => {
  const response = await API.post("/orders/verify-payment", paymentData);
  return response.data;
};

/**
 * Lab 06 Task 7 — Get Current User's Orders
 * GET /orders
 */
export const getOrders = async () => {
  const response = await API.get("/orders");
  return response.data;
};

/**
 * Lab 06 Task 17 — Get Single Order By ID
 * GET /orders/:id
 */
export const getOrderById = async (orderId) => {
  const response = await API.get(`/orders/${orderId}`);
  return response.data;
};

/**
 * Lab 06 Bonus — Update Order Status Progression
 * PATCH /orders/:id/status
 * Payload: { status }
 */
export const updateOrderStatus = async (orderId, status) => {
  const response = await API.patch(`/orders/${orderId}/status`, { status });
  return response.data;
};

/**
 * Dev / Test Mode: Simulate Successful Razorpay Payment
 * POST /orders/simulate-test-payment
 */
export const simulateTestPayment = async (shopKartOrderId) => {
  const response = await API.post("/orders/simulate-test-payment", {
    shopKartOrderId,
  });
  return response.data;
};

export default API;
