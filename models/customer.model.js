const mongoose = require("mongoose")

const customerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full-Name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone number"],
      trim: true,
    },
    wishlist: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
      ],
      default: [],
    },
    cart: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
          min: [1, "Quantity cannot be less than 1"],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
)

customerSchema.methods.toJSON = function () {
  const customer = this.toObject();
  delete customer.password;
  return customer;
}

module.exports = mongoose.model("Customer", customerSchema);