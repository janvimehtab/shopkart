require("dotenv").config();
const http = require("http");
const crypto = require("crypto");
const mongoose = require("mongoose");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dns = require("dns");

try {
  dns.setDefaultResultOrder("ipv4first");
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
  // Ignore
}

const customerRoutes = require("./routes/customer.routes");
const productRoutes = require("./routes/product.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");
const Product = require("./models/product.model");
const Customer = require("./models/customer.model");
const Order = require("./models/order.model");

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/customers", customerRoutes);
app.use("/products", productRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);

async function runOrderTests() {
  console.log("=== Starting ShopKart Lab 06 Order & Checkout Verification Suite ===");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Ephemeral test server running at ${baseUrl}`);

  const request = async (method, path, body = null, token = null) => {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const req = http.request(
        url,
        {
          method,
          headers,
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            let json = null;
            try {
              json = JSON.parse(data);
            } catch (e) {
              json = data;
            }
            resolve({ status: res.statusCode, body: json });
          });
        }
      );

      req.on("error", reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  };

  const testEmailA = `order_userA_${Date.now()}@example.com`;
  const testEmailB = `order_userB_${Date.now()}@example.com`;

  try {
    // 1. Unauthenticated request to /orders/create-payment-order -> 401
    console.log("\n[Test 1] Unauthenticated POST /orders/create-payment-order -> Expect 401");
    const unauthOrderRes = await request("POST", "/orders/create-payment-order", {
      shippingAddress: {
        fullName: "Test User",
        phone: "9876543210",
        addressLine1: "123 Street",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
      },
    });
    console.log(`Status: ${unauthOrderRes.status}`);
    if (unauthOrderRes.status !== 401) throw new Error("Expected 401 Unauthorized");

    // Setup Test User A
    console.log(`\n[Setup] Registering User A (${testEmailA})`);
    await request("POST", "/customers/register", {
      fullName: "User Alpha",
      email: testEmailA,
      password: "password123",
      phone: "9876543210",
    });

    const loginResA = await request("POST", "/customers/login", {
      email: testEmailA,
      password: "password123",
    });
    const tokenA = loginResA.body.token;
    if (!tokenA) throw new Error("User A login failed");

    // Setup Test User B
    console.log(`\n[Setup] Registering User B (${testEmailB})`);
    await request("POST", "/customers/register", {
      fullName: "User Beta",
      email: testEmailB,
      password: "password123",
      phone: "9876543211",
    });

    const loginResB = await request("POST", "/customers/login", {
      email: testEmailB,
      password: "password123",
    });
    const tokenB = loginResB.body.token;
    if (!tokenB) throw new Error("User B login failed");

    // 2. Empty cart order creation -> 400 Bad Request
    console.log("\n[Test 2] Empty cart checkout -> Expect 400");
    const emptyCartRes = await request(
      "POST",
      "/orders/create-payment-order",
      {
        shippingAddress: {
          fullName: "User Alpha",
          phone: "9876543210",
          addressLine1: "123 Street",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
        },
      },
      tokenA
    );
    console.log(`Status: ${emptyCartRes.status}`, emptyCartRes.body);
    if (emptyCartRes.status !== 400) throw new Error("Expected 400 for empty cart order creation");

    // Setup test products
    console.log("\n[Setup] Creating test products in DB");
    const testProduct1 = await Product.create({
      name: "Mechanical Keyboard RGB",
      description: "Tactile switches",
      price: 2999,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3",
      stock: 5,
    });

    const testProduct2 = await Product.create({
      name: "Wireless Gaming Mouse",
      description: "Ultra-low latency",
      price: 1499,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46",
      stock: 2,
    });

    // Add items to User A's cart: Keyboard x 2, Mouse x 1
    console.log("\n[Setup] Adding products to User A's cart");
    await request("POST", `/cart/${testProduct1._id}`, null, tokenA); // qty 1
    await request("POST", `/cart/${testProduct1._id}`, null, tokenA); // qty 2
    await request("POST", `/cart/${testProduct2._id}`, null, tokenA); // qty 1

    // 3. Shipping Form Validation Failures -> 400 Bad Request
    console.log("\n[Test 3A] Shipping validation: Missing city -> Expect 400");
    const missingCityRes = await request(
      "POST",
      "/orders/create-payment-order",
      {
        shippingAddress: {
          fullName: "User Alpha",
          phone: "9876543210",
          addressLine1: "123 Street",
          city: "   ",
          state: "Karnataka",
          pincode: "560001",
        },
      },
      tokenA
    );
    console.log(`Status: ${missingCityRes.status}`, missingCityRes.body);
    if (missingCityRes.status !== 400) throw new Error("Expected 400 for whitespace city");

    console.log("\n[Test 3B] Shipping validation: Invalid 5-digit pincode -> Expect 400");
    const invalidPinRes = await request(
      "POST",
      "/orders/create-payment-order",
      {
        shippingAddress: {
          fullName: "User Alpha",
          phone: "9876543210",
          addressLine1: "123 Street",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "56001", // only 5 digits
        },
      },
      tokenA
    );
    console.log(`Status: ${invalidPinRes.status}`, invalidPinRes.body);
    if (invalidPinRes.status !== 400) throw new Error("Expected 400 for invalid pincode");

    console.log("\n[Test 3C] Shipping validation: Invalid phone format -> Expect 400");
    const invalidPhoneRes = await request(
      "POST",
      "/orders/create-payment-order",
      {
        shippingAddress: {
          fullName: "User Alpha",
          phone: "12345", // invalid phone
          addressLine1: "123 Street",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
        },
      },
      tokenA
    );
    console.log(`Status: ${invalidPhoneRes.status}`, invalidPhoneRes.body);
    if (invalidPhoneRes.status !== 400) throw new Error("Expected 400 for invalid phone");

    // 4. Insufficient Stock Re-validation
    console.log("\n[Test 4] Insufficient Stock check during checkout -> Expect 400");
    // Reduce product2 stock to 0 directly in DB
    await Product.findByIdAndUpdate(testProduct2._id, { stock: 0 });
    const stockFailRes = await request(
      "POST",
      "/orders/create-payment-order",
      {
        shippingAddress: {
          fullName: "User Alpha",
          phone: "9876543210",
          addressLine1: "123 Street",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
        },
      },
      tokenA
    );
    console.log(`Status: ${stockFailRes.status}`, stockFailRes.body);
    if (stockFailRes.status !== 400 || !stockFailRes.body.message.includes("Insufficient stock")) {
      throw new Error("Expected 400 Insufficient stock error");
    }

    // Restore product2 stock
    await Product.findByIdAndUpdate(testProduct2._id, { stock: 10 });

    // 5. Server-side Total Calculation & Fake total rejection
    console.log("\n[Test 5] Fake total sent from client -> Server calculates correct total");
    // Cart: Keyboard (2999 * 2 = 5998) + Mouse (1499 * 1 = 1499) = 7497
    const expectedTotal = 7497;
    const expectedAmountPaise = 749700;

    const createOrderRes = await request(
      "POST",
      "/orders/create-payment-order",
      {
        totalAmount: 1, // Fake client total
        shippingAddress: {
          fullName: "User Alpha",
          phone: "9876543210",
          addressLine1: "22 MG Road",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
        },
      },
      tokenA
    );

    console.log(`Status: ${createOrderRes.status}`, createOrderRes.body);
    if (createOrderRes.status !== 200) throw new Error("Order creation failed");
    if (createOrderRes.body.amount !== expectedAmountPaise) {
      throw new Error(`Expected amount ${expectedAmountPaise} paise, got ${createOrderRes.body.amount}`);
    }

    const { shopKartOrderId, razorpayOrderId } = createOrderRes.body;
    if (!shopKartOrderId || !razorpayOrderId) {
      throw new Error("Missing shopKartOrderId or razorpayOrderId in response");
    }

    // 6. Verify ShopKart Pending Order in DB
    console.log("\n[Test 6] Verify Order snapshot in MongoDB");
    const dbOrder = await Order.findById(shopKartOrderId);
    if (!dbOrder) throw new Error("Order not saved in database");
    if (dbOrder.totalAmount !== expectedTotal) {
      throw new Error(`Expected totalAmount ${expectedTotal}, got ${dbOrder.totalAmount}`);
    }
    if (dbOrder.status !== "PENDING_PAYMENT" || dbOrder.paymentStatus !== "PENDING") {
      throw new Error(`Expected PENDING_PAYMENT / PENDING, got ${dbOrder.status} / ${dbOrder.paymentStatus}`);
    }
    if (dbOrder.items.length !== 2) {
      throw new Error(`Expected 2 items in snapshot, got ${dbOrder.items.length}`);
    }
    console.log("Snapshot item verified:", dbOrder.items[0]);

    // 7. Cart must still be populated before payment verification
    console.log("\n[Test 7] Verify cart is NOT cleared before payment verification");
    const cartBeforeVerify = await request("GET", "/cart", null, tokenA);
    console.log(`Cart items count before payment verification: ${cartBeforeVerify.body.cart?.length}`);
    if (!cartBeforeVerify.body.cart || cartBeforeVerify.body.cart.length !== 2) {
      throw new Error("Cart was incorrectly cleared before payment verification");
    }

    // 8. Fake / Invalid Payment Signature -> Expect 400 & Cart preserved
    console.log("\n[Test 8] Invalid Payment Signature -> Expect 400");
    const fakeVerifyRes = await request(
      "POST",
      "/orders/verify-payment",
      {
        shopKartOrderId,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: "pay_test_fake_12345",
        razorpay_signature: "invalid_hmac_signature_here",
      },
      tokenA
    );
    console.log(`Status: ${fakeVerifyRes.status}`, fakeVerifyRes.body);
    if (fakeVerifyRes.status !== 400) throw new Error("Expected 400 for invalid signature");

    // Verify order is NOT marked paid in DB
    const orderAfterFake = await Order.findById(shopKartOrderId);
    if (orderAfterFake.paymentStatus === "PAID") {
      throw new Error("Order was marked PAID despite invalid signature");
    }

    // 9. Valid Payment Verification -> Order becomes PAID, PLACED, Cart is cleared
    console.log("\n[Test 9] Valid Payment Verification -> Expect 200, PAID, PLACED, Cart Cleared");
    const validPaymentId = `pay_${Date.now()}`;
    const secret = process.env.RAZORPAY_KEY_SECRET || "shopkart_secret_key_lab06";
    const signatureBody = dbOrder.razorpayOrderId + "|" + validPaymentId;
    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(signatureBody)
      .digest("hex");

    const validVerifyRes = await request(
      "POST",
      "/orders/verify-payment",
      {
        shopKartOrderId,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: validPaymentId,
        razorpay_signature: validSignature,
      },
      tokenA
    );
    console.log(`Status: ${validVerifyRes.status}`, validVerifyRes.body);
    if (validVerifyRes.status !== 200) throw new Error("Payment verification failed");

    // Verify order in DB
    const confirmedOrder = await Order.findById(shopKartOrderId);
    if (confirmedOrder.status !== "PLACED" || confirmedOrder.paymentStatus !== "PAID") {
      throw new Error(`Expected PLACED / PAID, got ${confirmedOrder.status} / ${confirmedOrder.paymentStatus}`);
    }
    if (confirmedOrder.razorpayPaymentId !== validPaymentId) {
      throw new Error("Razorpay payment ID was not saved on order");
    }

    // Verify user's cart is now cleared in DB
    const cartAfterVerify = await request("GET", "/cart", null, tokenA);
    console.log(`Cart items count after verified payment: ${cartAfterVerify.body.cart?.length}`);
    if (cartAfterVerify.body.cart?.length !== 0) {
      throw new Error("User cart was not cleared after successful payment verification");
    }

    // 10. GET /orders -> Returns User A's orders sorted newest first
    console.log("\n[Test 10] GET /orders for User A -> Expect orders array containing the placed order");
    const getOrdersRes = await request("GET", "/orders", null, tokenA);
    console.log(`Status: ${getOrdersRes.status}, Orders count: ${getOrdersRes.body.orders?.length}`);
    if (getOrdersRes.status !== 200 || !getOrdersRes.body.orders || getOrdersRes.body.orders.length === 0) {
      throw new Error("Failed to retrieve user orders");
    }
    const foundOrder = getOrdersRes.body.orders.find((o) => o._id === shopKartOrderId);
    if (!foundOrder) throw new Error("Placed order not found in GET /orders");

    // 11. Ownership enforcement: User B cannot access User A's order -> Expect 403
    console.log("\n[Test 11] GET /orders/:id ownership check (User B accessing User A's order) -> Expect 403");
    const unauthorizedOrderRes = await request("GET", `/orders/${shopKartOrderId}`, null, tokenB);
    console.log(`Status: ${unauthorizedOrderRes.status}`, unauthorizedOrderRes.body);
    if (unauthorizedOrderRes.status !== 403) {
      throw new Error("Expected 403 Forbidden for unauthorized user viewing order");
    }

    // Owner (User A) can fetch the order
    const ownerOrderRes = await request("GET", `/orders/${shopKartOrderId}`, null, tokenA);
    console.log(`Status (Owner): ${ownerOrderRes.status}`);
    if (ownerOrderRes.status !== 200) throw new Error("Owner failed to view own order");

    // 12. Bonus Challenge: PATCH /orders/:id/status
    console.log("\n[Test 12 - Bonus] Advance order status: PLACED -> CONFIRMED -> SHIPPED -> DELIVERED");
    const advanceStatusRes = await request(
      "PATCH",
      `/orders/${shopKartOrderId}/status`,
      { status: "CONFIRMED" },
      tokenA
    );
    console.log(`Status: ${advanceStatusRes.status}, New order status: ${advanceStatusRes.body.order?.status}`);
    if (advanceStatusRes.status !== 200 || advanceStatusRes.body.order?.status !== "CONFIRMED") {
      throw new Error("Failed to advance order status to CONFIRMED");
    }

    // Clean up test data
    console.log("\n[Cleanup] Cleaning up test records");
    await Customer.deleteOne({ email: testEmailA });
    await Customer.deleteOne({ email: testEmailB });
    await Order.deleteOne({ _id: shopKartOrderId });
    await Product.deleteOne({ _id: testProduct1._id });
    await Product.deleteOne({ _id: testProduct2._id });

    console.log("\n🎉 ALL 12 ORDER & CHECKOUT BACKEND TEST CASES PASSED SUCCESSFULLY!");
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ ORDER TEST SUITE FAILED:", err);
    server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
}

runOrderTests();
