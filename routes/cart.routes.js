const express = require("express");
const router = express.Router();
const {
  addToCart,
  getCart,
  updateQuantity,
  removeFromCart,
} = require("../controllers/cart.controller");
const { protect } = require("../middlewares/auth.middleware");

// All cart routes require authentication
router.use(protect);

// Task 3: Get current user's cart (GET /cart)
router.get("/", getCart);

// Task 2: Add product to cart (POST /cart/:productId)
router.post("/:productId", addToCart);

// Task 4: Update product quantity in cart (PATCH /cart/:productId)
router.patch("/:productId", updateQuantity);

// Task 5: Remove product from cart (DELETE /cart/:productId)
router.delete("/:productId", removeFromCart);

module.exports = router;
