const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

/**
 * Task 2 — Add Product to Cart (POST /cart/:productId)
 * Adds a product to the authenticated user's cart or increments quantity if already present.
 * Validates product existence and stock limits.
 */
const addToCart = async (req, res) => {
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

    if (product.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: "Product is out of stock",
      });
    }

    if (!req.user.cart) {
      req.user.cart = [];
    }

    const existingItemIndex = req.user.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Product already in cart -> increment quantity by 1
      const newQuantity = req.user.cart[existingItemIndex].quantity + 1;
      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. Stock limit of ${product.stock} reached.`,
        });
      }
      req.user.cart[existingItemIndex].quantity = newQuantity;
    } else {
      // New product -> quantity = 1
      req.user.cart.push({
        product: product._id,
        quantity: 1,
      });
    }

    await req.user.save();

    await req.user.populate({
      path: "cart.product",
      select: "_id name price category image stock description",
    });

    const cart = (req.user.cart || []).filter((item) => item.product !== null);

    return res.status(200).json({
      success: true,
      message: "Cart updated",
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Task 3 — Get Current User Cart (GET /cart)
 * Authenticates user, loads user, populates each cart item's Product, returns cart.
 */
const getCart = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).populate({
      path: "cart.product",
      select: "_id name price category image stock description",
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Filter out null values in case a referenced product was deleted from DB
    const cart = (customer.cart || []).filter((item) => item.product !== null);

    return res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Task 4 — Update Product Quantity (PATCH /cart/:productId)
 * Updates the quantity for a specific product in the user's cart.
 * Validates numeric quantity >= 1, stock limits, and product existence in cart.
 */
const updateQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (
      typeof quantity !== "number" ||
      isNaN(quantity) ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be an integer of at least 1",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Quantity exceeds available stock (${product.stock})`,
      });
    }

    if (!req.user.cart) {
      req.user.cart = [];
    }

    const itemIndex = req.user.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not in cart",
      });
    }

    req.user.cart[itemIndex].quantity = quantity;
    await req.user.save();

    await req.user.populate({
      path: "cart.product",
      select: "_id name price category image stock description",
    });

    const cart = (req.user.cart || []).filter((item) => item.product !== null);

    return res.status(200).json({
      success: true,
      message: "Cart updated",
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Task 5 — Remove Product from Cart (DELETE /cart/:productId)
 * Removes the product entry from the authenticated user's cart.
 */
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (!req.user.cart) {
      req.user.cart = [];
    }

    const itemIndex = req.user.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not in cart",
      });
    }

    req.user.cart.splice(itemIndex, 1);
    await req.user.save();

    await req.user.populate({
      path: "cart.product",
      select: "_id name price category image stock description",
    });

    const cart = (req.user.cart || []).filter((item) => item.product !== null);

    return res.status(200).json({
      success: true,
      message: "Product removed from cart",
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateQuantity,
  removeFromCart,
};
