const mongoose = require("mongoose");
const Product = require("../models/product.model");

// Task 2: Create Product (POST /products)
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;

    // Check for missing required fields
    if (!name || !description || price === undefined || !category || !image || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: "All fields (name, description, price, category, image, stock) are required",
      });
    }

    // Validate price > 0
    if (typeof price !== "number" || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a number greater than 0",
      });
    }

    // Validate stock >= 0
    if (typeof stock !== "number" || stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock must be a non-negative number",
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      image,
      stock,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Task 3 & Task 5 & Bonus: Get All Products (GET /products) with search, category filter, and sorting
const getProducts = async (req, res) => {
  try {
    const { search, category, sort } = req.query;

    // Build dynamic query filter
    const query = {};

    // Case-insensitive search on name
    if (search && search.trim() !== "") {
      query.name = { $regex: search.trim(), $options: "i" };
    }

    // Category filter
    if (category && category.trim() !== "" && category !== "All Categories") {
      query.category = category.trim();
    }

    // Create Mongoose query with field selection needed by UI
    let mongooseQuery = Product.find(query).select("_id name price category image stock");

    // Sorting (Bonus Challenge)
    if (sort === "price_asc") {
      mongooseQuery = mongooseQuery.sort({ price: 1 });
    } else if (sort === "price_desc") {
      mongooseQuery = mongooseQuery.sort({ price: -1 });
    } else {
      mongooseQuery = mongooseQuery.sort({ createdAt: -1 });
    }

    const products = await mongooseQuery;

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Task 4: Get Single Product by ID (GET /products/:id)
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
};
