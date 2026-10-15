const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_TmxN4VhGYKwD7T",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "Ak42Zt4yh8Qo1lWHOZ4YvgAL",
});

module.exports = razorpay;