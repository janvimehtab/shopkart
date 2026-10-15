const Customer = require("../models/customer.model");
const bcrypt = require("bcrypt");
const generateTokenAndSetCookie = require("../utils/generateToken");

// Register
const registerCustomer = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields are mandatory",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters",
      });
    }

    const existingCustomer = await Customer.findOne({ email })
    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const customer = await Customer.create({
      fullName,
      email,
      password: hashedPassword,
      phone,
    })

    return res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      customer: {
        _id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Login
const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const invalidAuthResponse = () =>
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });

    const customer = await Customer.findOne({ email });
    if (!customer) {
      return invalidAuthResponse();
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return invalidAuthResponse();
    }

    const token = generateTokenAndSetCookie(res, customer._id);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      customer: customer.toJSON(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Profile
const getProfile = async (req, res) => {
  try {
    return res.status(200).json(req.user.toJSON());
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Logout
const logoutCustomer = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Bonus: Change Password
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Both old and new passwords are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must contain at least 6 characters",
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, req.user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect old password",
      });
    }

    const salt = await bcrypt.genSalt(10);
    req.user.password = await bcrypt.hash(newPassword, salt);
    await req.user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerCustomer,
  loginCustomer,
  getProfile,
  logoutCustomer,
  changePassword,
};