import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Loader2, ShoppingCart, Check } from "lucide-react";
import { addToWishlist, removeFromWishlist } from "../services/api";
import { useCart } from "../context/CartContext";

const ProductCard = ({ product, initialWishlisted = false, onWishlistChange }) => {
  const navigate = useNavigate();
  const { cartItems, addToCart, itemLoading } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [cartSuccess, setCartSuccess] = useState(false);

  const isOutOfStock = product.stock <= 0;
  const isAddingToCart = !!itemLoading[product._id];
  const cartItem = cartItems?.find(
    (i) => (i.product?._id || i.product) === product._id
  );
  const isInCart = !!cartItem;
  const isCartAtStock = cartItem && cartItem.quantity >= product.stock;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAddingToCart || isOutOfStock || isCartAtStock) return;

    setErrorMsg("");
    const res = await addToCart(product._id);
    if (!res.success) {
      if (res.status === 401) {
        setErrorMsg("Please login to add to cart.");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setErrorMsg(res.error || "Unable to add to cart.");
      }
      setTimeout(() => setErrorMsg(""), 3500);
    } else {
      setCartSuccess(true);
      setTimeout(() => setCartSuccess(false), 2000);
    }
  };

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return; // Prevent duplicate clicks while saving

    setLoading(true);
    setErrorMsg("");

    try {
      if (isWishlisted) {
        // Remove from wishlist
        await removeFromWishlist(product._id);
        setIsWishlisted(false);
        if (onWishlistChange) onWishlistChange(product._id, false);
      } else {
        // Add to wishlist (Task 2: POST /wishlist/:productId)
        await addToWishlist(product._id);
        setIsWishlisted(true);
        if (onWishlistChange) onWishlistChange(product._id, true);
      }
    } catch (err) {
      console.error("Wishlist action error:", err);
      if (err.response?.status === 401) {
        setErrorMsg("Please login to save products.");
        setTimeout(() => navigate("/login"), 1500);
      } else if (err.response?.status === 409) {
        setIsWishlisted(true);
        setErrorMsg("Product already in wishlist.");
      } else {
        setErrorMsg(
          err.response?.data?.message || "Unable to save product. Please try again."
        );
      }
      setTimeout(() => setErrorMsg(""), 3500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-card glass-card">
      <div className="product-image-container">
        <img
          src={product.image}
          alt={product.name}
          className="product-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&auto=format&fit=crop&q=60";
          }}
        />
        <span className="product-category-badge">{product.category}</span>

        {/* Quick floating heart button */}
        <button
          onClick={handleWishlistClick}
          disabled={loading}
          className={`wishlist-float-btn ${isWishlisted ? "active" : ""}`}
          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          aria-label="Wishlist toggle"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin text-accent" />
          ) : (
            <Heart
              size={18}
              fill={isWishlisted ? "#f43f5e" : "none"}
              color={isWishlisted ? "#f43f5e" : "#ffffff"}
            />
          )}
        </button>
      </div>

      <div className="product-content">
        <h3 className="product-title" title={product.name}>
          {product.name}
        </h3>

        <div className="product-price">
          ₹{product.price.toLocaleString("en-IN")}
        </div>

        <div
          className={`product-stock ${isOutOfStock ? "stock-out" : "stock-in"}`}
        >
          {isOutOfStock ? "Out of Stock" : `${product.stock} units left`}
        </div>

        {errorMsg && (
          <div className="wishlist-feedback-error">
            {errorMsg}
          </div>
        )}

        {cartSuccess && (
          <div className="alert-success" style={{ padding: "0.4rem 0.6rem", borderRadius: "0.5rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
            <Check size={14} />
            <span>Added to Cart!</span>
          </div>
        )}

        {/* Primary Cart Action Button (Task 7) */}
        <button
          onClick={handleAddToCart}
          disabled={isAddingToCart || isOutOfStock || isCartAtStock}
          className="btn-primary product-btn-add-cart"
          style={{ marginBottom: "0.6rem" }}
        >
          {isAddingToCart ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Adding...</span>
            </>
          ) : isOutOfStock ? (
            <span>Out of Stock</span>
          ) : isCartAtStock ? (
            <span>Max in Cart ({cartItem.quantity})</span>
          ) : isInCart ? (
            <>
              <ShoppingCart size={16} />
              <span>Add Another ({cartItem.quantity})</span>
            </>
          ) : (
            <>
              <ShoppingCart size={16} />
              <span>Add to Cart</span>
            </>
          )}
        </button>

        {/* Secondary Action Row: Details & Wishlist */}
        <div className="product-actions-row">
          <Link
            to={`/products/${product._id}`}
            className="btn-outline product-btn-view"
          >
            View Details
          </Link>

          <button
            onClick={handleWishlistClick}
            disabled={loading}
            className={`btn-wishlist ${isWishlisted ? "btn-wishlist-saved" : ""}`}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : isWishlisted ? (
              <>
                <Heart size={16} fill="#f43f5e" color="#f43f5e" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Heart size={16} color="currentColor" />
                <span>Wishlist</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
