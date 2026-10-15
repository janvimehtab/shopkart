require("dotenv").config();
const http = require("http");
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
const Product = require("./models/product.model");
const Customer = require("./models/customer.model");

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/customers", customerRoutes);
app.use("/products", productRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/cart", cartRoutes);

async function runTests() {
  console.log("=== Starting ShopKart Lab 05 Cart Automated Verification Suite ===");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB Atlas.");

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

  try {
    // 1. Unauthenticated GET /cart -> 401
    console.log("\n[Test 1] GET /cart without token -> Expect 401");
    const unauthGet = await request("GET", "/cart");
    console.log(`Status: ${unauthGet.status}`, unauthGet.body);
    if (unauthGet.status !== 401) throw new Error("Expected 401 for unauthenticated request");

    // 2. Unauthenticated POST /cart/:id -> 401
    console.log("\n[Test 2] POST /cart/:id without token -> Expect 401");
    const unauthPost = await request("POST", "/cart/66d123456789012345678901");
    console.log(`Status: ${unauthPost.status}`, unauthPost.body);
    if (unauthPost.status !== 401) throw new Error("Expected 401 for unauthenticated request");

    // 3. Register & Login test user
    const testEmail = `cart_tester_${Date.now()}@example.com`;
    console.log(`\n[Setup] Registering test user: ${testEmail}`);
    const regRes = await request("POST", "/customers/register", {
      fullName: "Cart Tester",
      email: testEmail,
      password: "password123",
      phone: "9876543210",
    });
    console.log(`Registered status: ${regRes.status}`);

    const loginRes = await request("POST", "/customers/login", {
      email: testEmail,
      password: "password123",
    });
    console.log(`Login status: ${loginRes.status}`);
    const token = loginRes.body.token;
    if (!token) throw new Error("Login failed to return token");

    // 4. Invalid product ID -> 400
    console.log("\n[Test 4] POST /cart/notanid with valid token -> Expect 400");
    const invalidIdRes = await request("POST", "/cart/notanid", null, token);
    console.log(`Status: ${invalidIdRes.status}`, invalidIdRes.body);
    if (invalidIdRes.status !== 400) throw new Error("Expected 400 for invalid product ID");

    // 5. Non-existent product ID -> 404
    console.log("\n[Test 5] POST /cart/66d123456789012345678901 with non-existent ID -> Expect 404");
    const notFoundRes = await request("POST", "/cart/66d123456789012345678901", null, token);
    console.log(`Status: ${notFoundRes.status}`, notFoundRes.body);
    if (notFoundRes.status !== 404) throw new Error("Expected 404 for non-existent product");

    // Find or create test product
    let sampleProduct = await Product.findOne({ stock: { $gte: 5 } });
    if (!sampleProduct) {
      console.log("Creating temporary product with stock=5 for tests...");
      sampleProduct = await Product.create({
        name: "Test Mechanical Keyboard",
        description: "RGB Mechanical Keyboard for gaming",
        price: 2999,
        category: "Electronics",
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800",
        stock: 5,
      });
    }
    const realProductId = sampleProduct._id.toString();
    console.log(`Using product ID: ${realProductId} (${sampleProduct.name}, stock: ${sampleProduct.stock})`);

    // 6. Test 1 from Lab: Add new item POST /cart/:productId -> Expected quantity: 1
    console.log(`\n[Test 6] POST /cart/${realProductId} (Add new item) -> Expect 200 and quantity = 1`);
    const addRes1 = await request("POST", `/cart/${realProductId}`, null, token);
    console.log(`Status: ${addRes1.status}`, addRes1.body);
    if (addRes1.status !== 200) throw new Error("Failed to add product to cart");
    const item1 = addRes1.body.cart.find((i) => i.product._id === realProductId || i.product === realProductId);
    if (!item1 || item1.quantity !== 1) throw new Error(`Expected quantity 1, got ${item1?.quantity}`);

    // 7. Test 2 from Lab: Add same item again -> Expected quantity: 2
    console.log(`\n[Test 7] POST /cart/${realProductId} again (Add same item) -> Expect quantity = 2`);
    const addRes2 = await request("POST", `/cart/${realProductId}`, null, token);
    console.log(`Status: ${addRes2.status}`, addRes2.body);
    if (addRes2.status !== 200) throw new Error("Failed to increment product in cart");
    const item2 = addRes2.body.cart.find((i) => i.product._id === realProductId || i.product === realProductId);
    if (!item2 || item2.quantity !== 2) throw new Error(`Expected quantity 2, got ${item2?.quantity}`);

    // 8. Test 3 from Lab: GET /cart -> Expected populated Product information
    console.log("\n[Test 8] GET /cart -> Expect 200 with populated Product information");
    const getRes = await request("GET", "/cart", null, token);
    console.log(`Status: ${getRes.status}, Cart length: ${getRes.body.cart?.length}`);
    console.log("Populated cart item:", JSON.stringify(getRes.body.cart[0], null, 2));
    if (getRes.status !== 200 || !getRes.body.cart || getRes.body.cart.length === 0) {
      throw new Error("Failed to retrieve populated cart");
    }
    const populatedProduct = getRes.body.cart[0].product;
    if (!populatedProduct.name || !populatedProduct.price || populatedProduct.stock === undefined) {
      throw new Error("Product details not properly populated in GET /cart");
    }

    // 9. Test 4 from Lab: Update quantity PATCH /cart/:productId -> quantity = 3
    console.log(`\n[Test 9] PATCH /cart/${realProductId} with { quantity: 3 } -> Expect 200 and quantity = 3`);
    const updateRes = await request("PATCH", `/cart/${realProductId}`, { quantity: 3 }, token);
    console.log(`Status: ${updateRes.status}`, updateRes.body);
    if (updateRes.status !== 200) throw new Error("Failed to update cart quantity");
    const item3 = updateRes.body.cart.find((i) => i.product._id === realProductId || i.product === realProductId);
    if (!item3 || item3.quantity !== 3) throw new Error(`Expected quantity 3, got ${item3?.quantity}`);

    // 10. Test 5 from Lab: Exceed stock -> 400 Bad Request
    const excessiveQuantity = sampleProduct.stock + 10;
    console.log(`\n[Test 10] PATCH /cart/${realProductId} exceeding stock (${excessiveQuantity} > ${sampleProduct.stock}) -> Expect 400`);
    const exceedRes = await request("PATCH", `/cart/${realProductId}`, { quantity: excessiveQuantity }, token);
    console.log(`Status: ${exceedRes.status}`, exceedRes.body);
    if (exceedRes.status !== 400) throw new Error("Expected 400 when exceeding product stock");

    // 11. Test Quantity < 1 -> 400 Bad Request
    console.log(`\n[Test 11] PATCH /cart/${realProductId} with { quantity: 0 } -> Expect 400`);
    const zeroQtyRes = await request("PATCH", `/cart/${realProductId}`, { quantity: 0 }, token);
    console.log(`Status: ${zeroQtyRes.status}`, zeroQtyRes.body);
    if (zeroQtyRes.status !== 400) throw new Error("Expected 400 when quantity < 1");

    // 12. Test 6 from Lab: Remove item DELETE /cart/:productId -> 200
    console.log(`\n[Test 12] DELETE /cart/${realProductId} -> Expect 200 and item removed`);
    const deleteRes = await request("DELETE", `/cart/${realProductId}`, null, token);
    console.log(`Status: ${deleteRes.status}`, deleteRes.body);
    if (deleteRes.status !== 200) throw new Error("Failed to remove item from cart");
    const foundDeleted = deleteRes.body.cart.find((i) => (i.product._id || i.product) === realProductId);
    if (foundDeleted) throw new Error("Product should have been removed from cart");

    // 13. Remove again -> 404
    console.log(`\n[Test 13] DELETE /cart/${realProductId} again -> Expect 404`);
    const deleteAgainRes = await request("DELETE", `/cart/${realProductId}`, null, token);
    console.log(`Status: ${deleteAgainRes.status}`, deleteAgainRes.body);
    if (deleteAgainRes.status !== 404) throw new Error("Expected 404 when removing item not in cart");

    // 14. Final GET /cart -> empty
    console.log("\n[Test 14] GET /cart -> Expect empty cart");
    const finalCartRes = await request("GET", "/cart", null, token);
    console.log(`Status: ${finalCartRes.status}, items: ${finalCartRes.body.cart?.length}`);
    if (finalCartRes.body.cart.length !== 0) throw new Error("Cart should be empty");

    // Clean up test user
    await Customer.deleteOne({ email: testEmail });
    console.log("\nCleaned up test user.");

    console.log("\n🎉 ALL 14 CART BACKEND TEST CASES PASSED SUCCESSFULLY!");
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ CART TEST FAILED:", err);
    server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTests();
