require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dns = require("dns");

try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
  // Ignore
}

const customerRoutes = require("./routes/customer.routes");
const productRoutes = require("./routes/product.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const Product = require("./models/product.model");
const Customer = require("./models/customer.model");

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/customers", customerRoutes);
app.use("/products", productRoutes);
app.use("/wishlist", wishlistRoutes);

async function runTests() {
  console.log("=== Starting ShopKart Lab 04 Automated Verification Suite ===");

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
    // 1. Unauthenticated GET /wishlist
    console.log("\n[Test 1] GET /wishlist without token -> Expect 401");
    const unauthGet = await request("GET", "/wishlist");
    console.log(`Status: ${unauthGet.status}`, unauthGet.body);
    if (unauthGet.status !== 401) throw new Error("Expected 401 for unauthenticated request");

    // 2. Unauthenticated POST /wishlist/:id
    console.log("\n[Test 2] POST /wishlist/123 without token -> Expect 401");
    const unauthPost = await request("POST", "/wishlist/66d123456789012345678901");
    console.log(`Status: ${unauthPost.status}`, unauthPost.body);
    if (unauthPost.status !== 401) throw new Error("Expected 401 for unauthenticated request");

    // 3. Register & Login test user
    const testEmail = `wishlist_tester_${Date.now()}@example.com`;
    console.log(`\n[Setup] Registering test user: ${testEmail}`);
    const regRes = await request("POST", "/customers/register", {
      fullName: "Wishlist Tester",
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
    console.log("\n[Test 4] POST /wishlist/notanid with valid token -> Expect 400");
    const invalidIdRes = await request("POST", "/wishlist/notanid", null, token);
    console.log(`Status: ${invalidIdRes.status}`, invalidIdRes.body);
    if (invalidIdRes.status !== 400) throw new Error("Expected 400 for invalid product ID");

    // 5. Non-existent product ID -> 404
    console.log("\n[Test 5] POST /wishlist/66d123456789012345678901 with non-existent ID -> Expect 404");
    const notFoundRes = await request("POST", "/wishlist/66d123456789012345678901", null, token);
    console.log(`Status: ${notFoundRes.status}`, notFoundRes.body);
    if (notFoundRes.status !== 404) throw new Error("Expected 404 for non-existent product");

    // Find a real product from DB
    let sampleProduct = await Product.findOne();
    if (!sampleProduct) {
      console.log("Creating temporary product for tests...");
      sampleProduct = await Product.create({
        name: "Test Mechanical Keyboard",
        description: "Test description",
        price: 2999,
        category: "Electronics",
        image: "https://example.com/test.jpg",
        stock: 10,
      });
    }
    const realProductId = sampleProduct._id.toString();
    console.log(`Using product ID: ${realProductId} (${sampleProduct.name})`);

    // 6. Add real product to wishlist -> 200
    console.log(`\n[Test 6] POST /wishlist/${realProductId} -> Expect 200/201 Success`);
    const addRes = await request("POST", `/wishlist/${realProductId}`, null, token);
    console.log(`Status: ${addRes.status}`, addRes.body);
    if (addRes.status !== 200 && addRes.status !== 201) throw new Error("Failed to add to wishlist");

    // 7. Duplicate add -> 409
    console.log(`\n[Test 7] POST /wishlist/${realProductId} again -> Expect 409 Conflict`);
    const dupRes = await request("POST", `/wishlist/${realProductId}`, null, token);
    console.log(`Status: ${dupRes.status}`, dupRes.body);
    if (dupRes.status !== 409) throw new Error("Expected 409 for duplicate wishlist item");

    // 8. Get current user's wishlist -> 200 with populated fields
    console.log("\n[Test 8] GET /wishlist -> Expect 200, count >= 1 and populated product details");
    const getRes = await request("GET", "/wishlist", null, token);
    console.log(`Status: ${getRes.status}, Count: ${getRes.body.count}`);
    console.log("First populated item:", getRes.body.wishlist[0]);
    if (getRes.status !== 200 || !getRes.body.wishlist || getRes.body.wishlist.length === 0) {
      throw new Error("Failed to get populated wishlist");
    }
    if (!getRes.body.wishlist[0].name || !getRes.body.wishlist[0].price) {
      throw new Error("Product data not populated properly");
    }

    // 9. Bonus Toggle API
    console.log(`\n[Test 9] PATCH /wishlist/${realProductId}/toggle -> Expect removal (isWishlisted: false)`);
    const toggleOff = await request("PATCH", `/wishlist/${realProductId}/toggle`, null, token);
    console.log(`Status: ${toggleOff.status}`, toggleOff.body);
    if (toggleOff.body.isWishlisted !== false) throw new Error("Toggle off failed");

    console.log(`\n[Test 10] PATCH /wishlist/${realProductId}/toggle -> Expect re-add (isWishlisted: true)`);
    const toggleOn = await request("PATCH", `/wishlist/${realProductId}/toggle`, null, token);
    console.log(`Status: ${toggleOn.status}`, toggleOn.body);
    if (toggleOn.body.isWishlisted !== true) throw new Error("Toggle on failed");

    // 10. Remove from wishlist -> 200
    console.log(`\n[Test 11] DELETE /wishlist/${realProductId} -> Expect 200 Success`);
    const delRes = await request("DELETE", `/wishlist/${realProductId}`, null, token);
    console.log(`Status: ${delRes.status}`, delRes.body);
    if (delRes.status !== 200) throw new Error("Failed to remove from wishlist");

    // 11. Remove again -> 404
    console.log(`\n[Test 12] DELETE /wishlist/${realProductId} again -> Expect 404`);
    const delAgain = await request("DELETE", `/wishlist/${realProductId}`, null, token);
    console.log(`Status: ${delAgain.status}`, delAgain.body);
    if (delAgain.status !== 404) throw new Error("Expected 404 for item not in wishlist");

    // 12. Final GET /wishlist -> count = 0
    console.log("\n[Test 13] GET /wishlist -> Expect 200, count: 0");
    const finalGet = await request("GET", "/wishlist", null, token);
    console.log(`Status: ${finalGet.status}, Count: ${finalGet.body.count}`);
    if (finalGet.body.count !== 0) throw new Error("Wishlist should be empty");

    // Clean up test user
    await Customer.deleteOne({ email: testEmail });
    console.log("\nCleaned up test user.");

    console.log("\n🎉 ALL 13 TEST CASES PASSED SUCCESSFULLY!");
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ TEST FAILED:", err);
    server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTests();
