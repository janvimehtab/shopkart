import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Minus, Trash2, Loader2, AlertCircle } from "lucide-react";
import { useCart } from "../context/CartContext";

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart, itemLoading } = useCart();
  const [localError, setLocalError] = useState("");

  const product = item.product;
  if (!product) return null;

  const isUpdating = !!itemLoading[product._id];
  const itemTotal = (product.price || 0) * (item.quantity || 1);
  const isAtMin = item.quantity <= 1;
  const isAtMax = item.quantity >= product.stock;

  const handleIncrement = async () => {
    if (isUpdating || isAtMax) return;
    setLocalError("");
    const res = await updateQuantity(product._id, item.quantity + 1);
    if (!res.success) {
      setLocalError(res.error);
      setTimeout(() => setLocalError(""), 3500);
    }
  };

  const handleDecrement = async () => {
    if (isUpdating || isAtMin) return;
    setLocalError("");
    const res = await updateQuantity(product._id, item.quantity - 1);
    if (!res.success) {
      setLocalError(res.error);
      setTimeout(() => setLocalError(""), 3500);
    }
  };

  const handleRemove = async () => {
    if (isUpdating) return;
    setLocalError("");
    const res = await removeFromCart(product._id);
    if (!res.success) {
      setLocalError(res.error);
      setTimeout(() => setLocalError(""), 3500);
    }
  };

  return (
    <div className="cart-item glass-card">
      <div className="cart-item-image-wrapper">
        <img
          src={product.image}
          alt={product.name}
          className="cart-item-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&auto=format&fit=crop&q=60";
          }}
        />
      </div>

      <div className="cart-item-info">
        <div className="cart-item-header">
          <div>
            <span className="cart-item-category">{product.category}</span>
            <Link to={`/products/${product._id}`} className="cart-item-title-link">
              <h3 className="cart-item-title">{product.name}</h3>
            </Link>
          </div>
          <button
            onClick={handleRemove}
            disabled={isUpdating}
            className="cart-item-remove-btn"
            title="Remove item"
            aria-label="Remove item"
          >
            {isUpdating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            <span>Remove</span>
          </button>
        </div>

        <div className="cart-item-price-row">
          <div className="cart-item-unit-price">
            ₹{product.price?.toLocaleString("en-IN")}
            <span className="cart-item-unit-label"> each</span>
          </div>

          <div className="cart-item-stock-status">
            {product.stock <= 5 ? (
              <span className="cart-stock-warning">
                Only {product.stock} left in stock
              </span>
            ) : (
              <span className="cart-stock-available">In Stock</span>
            )}
          </div>
        </div>

        {localError && (
          <div className="cart-item-error">
            <AlertCircle size={14} />
            <span>{localError}</span>
          </div>
        )}

        <div className="cart-item-bottom-row">
          {/* Quantity Controls: [-] 2 [+] */}
          <div className="cart-quantity-selector">
            <button
              onClick={handleDecrement}
              disabled={isUpdating || isAtMin}
              className="qty-btn"
              title={isAtMin ? "Minimum quantity is 1 (use Remove to delete)" : "Decrease quantity"}
              aria-label="Decrease quantity"
            >
              <Minus size={14} />
            </button>

            <span className="qty-value">
              {isUpdating ? (
                <Loader2 size={14} className="animate-spin text-accent" />
              ) : (
                item.quantity
              )}
            </span>

            <button
              onClick={handleIncrement}
              disabled={isUpdating || isAtMax}
              className="qty-btn"
              title={isAtMax ? "Maximum available stock reached" : "Increase quantity"}
              aria-label="Increase quantity"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Line Subtotal */}
          <div className="cart-item-subtotal">
            <span className="cart-item-subtotal-label">Subtotal:</span>
            <span className="cart-item-subtotal-value">
              ₹{itemTotal.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
