const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const {
  createPaymentOrder,
  verifyPayment,
  getOrders,
  getOrderById,
  updateOrderStatus,
  simulateTestPayment,
} = require("../controllers/order.controller");

// Task 4: Create payment order & ShopKart order (Protected)
router.post("/create-payment-order", protect, createPaymentOrder);

// Task 5 & Razorpay Verification: Verify payment signature and clear cart (Protected)
router.post("/verify-payment", protect, verifyPayment);

// Simulation / Dev Test Payment helper (Protected)
router.post("/simulate-test-payment", protect, simulateTestPayment);

// Task 7: Get all orders of authenticated customer (Protected)
router.get("/", protect, getOrders);

// Task 17: Get single order by ID (Protected, ownership enforced)
router.get("/:id", protect, getOrderById);

// Bonus: Update order status progression (Protected)
router.patch("/:id/status", protect, updateOrderStatus);

module.exports = router;
