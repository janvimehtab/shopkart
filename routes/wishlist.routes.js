const express = require("express");
const router = express.Router();
const {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlist,
} = require("../controllers/wishlist.controller");
const { protect } = require("../middlewares/auth.middleware");

// All wishlist routes require authentication
router.use(protect);

// Task 3: Get current user's wishlist
router.get("/", getWishlist);

// Task 2: Add product to wishlist
router.post("/:productId", addToWishlist);

// Task 4: Remove product from wishlist
router.delete("/:productId", removeFromWishlist);

// Bonus: Toggle product in wishlist
router.patch("/:productId/toggle", toggleWishlist);

module.exports = router;
