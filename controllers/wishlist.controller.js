const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

/**
 * Task 2 — Add Product to Wishlist (POST /wishlist/:productId)
 * Adds a product ObjectId reference to the authenticated user's wishlist array.
 * Edge cases handled:
 * - 400: Invalid product ObjectId format
 * - 404: Product not found in database
 * - 409: Product already saved in wishlist (duplicate prevention)
 */
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if already in wishlist
    const isAlreadyWishlisted = req.user.wishlist && req.user.wishlist.some(
      (id) => id.toString() === productId
    );

    if (isAlreadyWishlisted) {
      return res.status(409).json({
        success: false,
        message: "Product already in wishlist",
      });
    }

    if (!req.user.wishlist) {
      req.user.wishlist = [];
    }

    req.user.wishlist.push(productId);
    await req.user.save();

    return res.status(200).json({
      success: true,
      message: "Product added to wishlist",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Task 3 — Get Current User's Wishlist (GET /wishlist)
 * Returns the populated products referenced in the authenticated user's wishlist.
 */
const getWishlist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).populate({
      path: "wishlist",
      select: "_id name price category image stock description",
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Filter out null values in case a referenced product was deleted from DB
    const wishlist = (customer.wishlist || []).filter((item) => item !== null);

    return res.status(200).json({
      success: true,
      count: wishlist.length,
      wishlist,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Task 4 — Remove Product from Wishlist (DELETE /wishlist/:productId)
 * Removes the product ObjectId reference from the authenticated user's wishlist array.
 * Edge cases handled:
 * - 400: Invalid product ObjectId format
 * - 404: Product not in wishlist
 */
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const isPresent = req.user.wishlist && req.user.wishlist.some(
      (id) => id.toString() === productId
    );

    if (!isPresent) {
      return res.status(404).json({
        success: false,
        message: "Product not in wishlist",
      });
    }

    req.user.wishlist = req.user.wishlist.filter(
      (id) => id.toString() !== productId
    );
    await req.user.save();

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Bonus Task — Toggle Wishlist State (PATCH /wishlist/:productId/toggle)
 * Toggles a product in/out of the user's wishlist atomically.
 */
const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!req.user.wishlist) {
      req.user.wishlist = [];
    }

    const index = req.user.wishlist.findIndex(
      (id) => id.toString() === productId
    );

    let isWishlisted = false;
    let message = "";

    if (index > -1) {
      req.user.wishlist.splice(index, 1);
      isWishlisted = false;
      message = "Product removed from wishlist";
    } else {
      req.user.wishlist.push(productId);
      isWishlisted = true;
      message = "Product added to wishlist";
    }

    await req.user.save();

    return res.status(200).json({
      success: true,
      message,
      isWishlisted,
      count: req.user.wishlist.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlist,
};
