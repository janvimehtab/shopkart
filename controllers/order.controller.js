const crypto = require("crypto");
const mongoose = require("mongoose");
const Order = require("../models/order.model");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");
const razorpay = require("../config/razorpay");

/**
 * Task 4 — Create Payment Order (POST /orders/create-payment-order)
 * Validates shipping address and cart.
 * Re-fetches latest products from DB to verify stock and calculate total on server.
 * Creates ShopKart Order with status PENDING_PAYMENT.
 * Creates real Razorpay Order and returns safe payment details to frontend.
 */
const createPaymentOrder = async (req, res) => {
  try {
    // Support both nested shippingAddress and flat req.body payloads
    const shippingAddress = req.body.shippingAddress || req.body;

    if (!shippingAddress || typeof shippingAddress !== "object") {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    const { fullName, phone, addressLine1, city, state, pincode } = shippingAddress;

    const requiredFields = [
      { name: "Full Name", value: fullName },
      { name: "Phone Number", value: phone },
      { name: "Address Line", value: addressLine1 },
      { name: "City", value: city },
      { name: "State", value: state },
      { name: "Pincode", value: pincode },
    ];

    for (const field of requiredFields) {
      if (!field.value || typeof field.value !== "string" || !field.value.trim()) {
        return res.status(400).json({
          success: false,
          message: `${field.name} cannot be empty or whitespace only`,
        });
      }
    }

    const cleanPhone = String(phone).trim().replace(/[\s-]/g, "");
    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be a valid 10-digit number",
      });
    }

    const cleanPincode = String(pincode).trim();
    if (!/^\d{6}$/.test(cleanPincode)) {
      return res.status(400).json({
        success: false,
        message: "Pincode must contain 6 digits",
      });
    }

    // 2. Fetch authenticated customer and cart
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (!customer.cart || customer.cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart cannot be empty",
      });
    }

    // 3. Final Stock & Product Verification + Server-side Total Calculation
    let totalAmount = 0;
    const orderItems = [];

    for (const cartItem of customer.cart) {
      const product = await Product.findById(cartItem.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: "One or more products in your cart no longer exist",
        });
      }

      if (product.stock < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, requested: ${cartItem.quantity}`,
        });
      }

      const itemTotal = product.price * cartItem.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        image: product.image,
      });
    }

    // 4. Create pending ShopKart order
    const shopKartOrder = new Order({
      user: customer._id,
      items: orderItems,
      shippingAddress: {
        fullName: fullName.trim(),
        phone: cleanPhone,
        addressLine1: addressLine1.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: cleanPincode,
      },
      totalAmount,
      paymentStatus: "PENDING",
      status: "PENDING_PAYMENT",
    });

    await shopKartOrder.save();

    // 5. Create REAL Razorpay Order (amount in paise)
    const amountInPaise = Math.round(totalAmount * 100);
    let razorpayOrder;

    try {
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: shopKartOrder._id.toString(),
      });
    } catch (rzpErr) {
      console.error("❌ Razorpay API Error Details:", rzpErr);
      return res.status(400).json({
        success: false,
        message: `Razorpay Order Creation Failed: ${rzpErr.error?.description || rzpErr.message || "Invalid Key Credentials"}`,
      });
    }

    shopKartOrder.razorpayOrderId = razorpayOrder.id;
    await shopKartOrder.save();

    return res.status(200).json({
      success: true,
      shopKartOrderId: shopKartOrder._id,
      razorpayOrderId: shopKartOrder.razorpayOrderId,
      amount: amountInPaise,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID || "rzp_test_TmxN4VhGYKwD7T",
    });
  } catch (error) {
    console.error("Error creating payment order:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create payment order",
    });
  }
};

/**
 * Task 5 — Verify Payment (POST /orders/verify-payment)
 * Verifies Razorpay HMAC-SHA256 signature using RAZORPAY_KEY_SECRET.
 */
const verifyPayment = async (req, res) => {
  try {
    const {
      shopKartOrderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!shopKartOrderId || !mongoose.Types.ObjectId.isValid(shopKartOrderId)) {
      return res.status(400).json({
        success: false,
        message: "Valid ShopKart order ID is required",
      });
    }

    if (!razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment ID and signature are required",
      });
    }

    const order = await Order.findById(shopKartOrderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify ownership
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not own this order",
      });
    }

    // Verify signature using RAZORPAY_KEY_SECRET
    const secret = process.env.RAZORPAY_KEY_SECRET || "Ak42Zt4yh8Qo1lWHOZ4YvgAL";
    const body = order.razorpayOrderId + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      order.paymentStatus = "FAILED";
      await order.save();
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Payment signature verified successfully
    order.paymentStatus = "PAID";
    order.status = "PLACED";
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    // Decrement stock for ordered items
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // Clear user cart only after verified payment
    const customer = await Customer.findById(req.user._id);
    if (customer) {
      customer.cart = [];
      await customer.save();
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully. Order confirmed.",
      order,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify payment",
    });
  }
};

/**
 * Task 7 — Get Current User Orders (GET /orders)
 */
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Error retrieving orders:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch orders",
    });
  }
};

/**
 * Task 17 — Get Single Order By ID (GET /orders/:id)
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to view this order",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error retrieving order:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch order",
    });
  }
};

/**
 * Order Status Progression (PATCH /orders/:id/status)
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to modify this order",
      });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update order status",
    });
  }
};

/**
 * Test Mode Simulation — Simulate Successful Razorpay Payment
 * POST /orders/simulate-test-payment
 */
const simulateTestPayment = async (req, res) => {
  try {
    const { shopKartOrderId } = req.body;

    if (!shopKartOrderId || !mongoose.Types.ObjectId.isValid(shopKartOrderId)) {
      return res.status(400).json({
        success: false,
        message: "Valid ShopKart order ID is required",
      });
    }

    const order = await Order.findById(shopKartOrderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not own this order",
      });
    }

    const mockPaymentId = `pay_sim_${Date.now()}`;
    order.paymentStatus = "PAID";
    order.status = "PLACED";
    order.razorpayPaymentId = mockPaymentId;
    await order.save();

    // Decrement stock for ordered items
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // Clear user cart
    const customer = await Customer.findById(req.user._id);
    if (customer) {
      customer.cart = [];
      await customer.save();
    }

    return res.status(200).json({
      success: true,
      message: "Test payment verified successfully. Order confirmed.",
      order,
    });
  } catch (error) {
    console.error("Error in test payment simulation:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to simulate test payment",
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getOrders,
  getOrderById,
  updateOrderStatus,
  simulateTestPayment,
};