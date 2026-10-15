const express = require("express");
const router = express.Router();
const {
  registerCustomer,
  loginCustomer,
  getProfile,
  logoutCustomer,
  changePassword,
} = require("../controllers/customer.controller");
const { protect } = require("../middlewares/auth.middleware");

// Unprotected routes
router.post("/register", registerCustomer);
router.post("/login", loginCustomer);

// Protected routes
router.get("/me", protect, getProfile);
router.post("/logout", protect, logoutCustomer);
router.patch("/change-password", protect, changePassword);

module.exports = router;