import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Truck,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import CartItem from "../components/CartItem";

const Cart = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    loading,
    error,
    refreshCart,
    subtotal,
    totalCount,
    uniqueItemsCount,
  } = useCart();

  const handleCheckout = () => {
    navigate("/checkout");
  };

  // Loading State (Task 17)
  if (loading) {
    return (
      <div className="spinner-container">
        <div className="loader-ring"></div>
        <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
          Loading your cart...
        </p>
      </div>
    );
  }

  // Error State (Task 17)
  if (error && cartItems.length === 0) {
    return (
      <div className="cart-page-container animate-fade-in">
        <div className="cart-error-state glass-panel">
          <AlertCircle size={48} color="#f43f5e" style={{ marginBottom: "1rem" }} />
          <h2>Unable to load your cart.</h2>
          <p>{error}</p>
          <button
            onClick={refreshCart}
            className="btn-primary"
            style={{ width: "auto", marginTop: "1.5rem" }}
          >
            <RefreshCw size={18} />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  // Empty State (Task 17)
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="cart-page-container animate-fade-in">
        <div className="cart-empty-state glass-panel">
          <div className="cart-empty-icon-wrap">
            <ShoppingBag size={56} className="cart-empty-icon" />
          </div>
          <h2>Your cart is empty 🛒</h2>
          <p>Looks like you haven't added anything yet.</p>
          <Link to="/products" className="btn-primary empty-browse-btn">
            <span>Browse Products</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  const shippingCost = 0; // Free delivery
  const finalTotal = subtotal + shippingCost;

  return (
    <div className="cart-page-container animate-fade-in">
      <div className="cart-header">
        <div>
          <h1 className="page-title">My Cart</h1>
          <p className="page-subtitle">
            You have {totalCount} {totalCount === 1 ? "unit" : "units"} ({uniqueItemsCount} {uniqueItemsCount === 1 ? "product" : "products"}) in your cart
          </p>
        </div>
        <Link to="/products" className="btn-outline cart-continue-link">
          <ArrowLeft size={16} />
          <span>Continue Shopping</span>
        </Link>
      </div>

      <div className="cart-layout-grid">
        {/* Left Column: Cart Items List */}
        <div className="cart-items-section">
          {cartItems.map((item) => (
            <CartItem
              key={item._id || item.product?._id}
              item={item}
            />
          ))}
        </div>

        {/* Right Column: Order Summary (Task 13, 15) */}
        <div className="cart-summary-section">
          <div className="order-summary-card glass-panel">
            <h2 className="summary-title">Order Summary</h2>

            <div className="summary-breakdown">
              <div className="summary-row">
                <span className="summary-label">
                  Items ({totalCount} {totalCount === 1 ? "unit" : "units"}):
                </span>
                <span className="summary-value">
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="summary-row">
                <span className="summary-label">Shipping:</span>
                <span className="summary-value summary-free">
                  FREE
                </span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-row summary-total-row">
                <span className="summary-total-label">Subtotal:</span>
                <span className="summary-total-value">
                  ₹{finalTotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={handleCheckout}
              className="btn-primary checkout-btn"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} />
            </button>

            {/* Assurance badges */}
            <div className="summary-perks">
              <div className="perk-item">
                <ShieldCheck size={18} className="perk-icon" />
                <span>Secure Checkout with JWT</span>
              </div>
              <div className="perk-item">
                <Truck size={18} className="perk-icon" />
                <span>Free Express Shipping</span>
              </div>
              <div className="perk-item">
                <Sparkles size={18} className="perk-icon" />
                <span>Real-time Stock Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
