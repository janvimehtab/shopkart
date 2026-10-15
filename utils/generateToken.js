const jwt = require("jsonwebtoken");

const generateTokenAndSetCookie = (res, customerId) => {
  const token = jwt.sign({ id: customerId }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });// web token banake deta hai

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, 
  });//xss attack se bachata hai

  return token;
};

module.exports = generateTokenAndSetCookie;