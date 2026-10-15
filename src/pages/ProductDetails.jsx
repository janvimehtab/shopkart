import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getProductById } from "../services/api";
import { ArrowLeft, ShoppingCart, AlertCircle, CheckCircle2, XCircle, Heart, Loader2 } from "lucide-react";
import { addToWishlist, removeFromWishlist, getWishlist } from "../services/api";
import { useCart } from "../context/CartContext";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cartItems, addToCart, itemLoading } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartNotice, setCartNotice] = useState("");
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistNotice, setWishlistNotice] = useState("");

  useEffect(() => {
    const fetchProductAndWishlist = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getProductById(id);
        if (data.success && data.product) {
          setProduct(data.product);
        } else {
          setError("Product not found");
        }

        // Check if item is already in user wishlist
        try {
          const wData = await getWishlist();
          if (wData.success && Array.isArray(wData.wishlist)) {
            const hasItem = wData.wishlist.some((item) => item._id === id);
            setIsWishlisted(hasItem);
          }
        } catch (wErr) {
          // Unauthenticated or error, ignore
        }
      } catch (err) {
        console.error("Error fetching product details:", err);
        setError(
          err.response?.data?.message || "Something went wrong while loading the product."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductAndWishlist();
    }
  }, [id]);

  const handleWishlistToggle = async () => {
    if (wishlistLoading) return;
    setWishlistLoading(true);
    setWishlistNotice("");
    try {
      if (isWishlisted) {
        await removeFromWishlist(id);
        setIsWishlisted(false);
        setWishlistNotice("Product removed from wishlist");
      } else {
        await addToWishlist(id);
        setIsWishlisted(true);
        setWishlistNotice("Product added to wishlist!");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setWishlistNotice("Please login to save products to wishlist");
      } else if (err.response?.status === 409) {
        setIsWishlisted(true);
        setWishlistNotice("Product already in wishlist");
      } else {
        setWishlistNotice(err.response?.data?.message || "Unable to update wishlist");
      }
    } finally {
      setWishlistLoading(false);
      setTimeout(() => setWishlistNotice(""), 3500);
    }
  };

  const handleAddToCart = async () => {
    if (isOutOfStock || isAddingToCart) return;
    setCartNotice("");
    const res = await addToCart(id);
    if (!res.success) {
      if (res.status === 401) {
        setCartNotice("Please login to add products to your cart");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setCartNotice(res.error || "Unable to add to cart");
      }
    } else {
      setCartNotice(res.message || "Added to cart!");
    }
    setTimeout(() => setCartNotice(""), 3500);
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="loader-ring"></div>
        <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
          Loading product details...
        </p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="details-error-container">
        <div className="glass-panel text-center" style={{ padding: "3rem 2rem", maxWidth: "500px", margin: "3rem auto" }}>
          <AlertCircle size={48} color="#f43f5e" style={{ margin: "0 auto 1rem" }} />
          <h2 style={{ color: "#ffffff", marginBottom: "0.75rem" }}>
            {error || "Product Not Found"}
          </h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            The product you are looking for does not exist or may have been removed.
          </p>
          <Link to="/products" className="btn-outline">
            <ArrowLeft size={16} /> Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="details-page-container animate-fade-in">
      {/* Back link */}
      <Link to="/products" className="back-link">
        <ArrowLeft size={18} />
        <span>Back to Products</span>
      </Link>

      <div className="details-card glass-panel">
        {/* Large Product Image */}
        <div className="details-image-section">
          <img
            src={product.image}
            alt={product.name}
            className="details-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&auto=format&fit=crop&q=60";
            }}
          />
        </div>

        {/* Product Details Info */}
        <div className="details-info-section">
          <span className="details-category-badge">{product.category}</span>

          <h1 className="details-title">{product.name}</h1>

          <div className="details-price">
            ₹{product.price.toLocaleString("en-IN")}
          </div>

          <div className="details-description-block">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>

          <div className="details-stock-status">
            {isOutOfStock ? (
              <span className="stock-pill stock-out">
                <XCircle size={16} /> Out of Stock
              </span>
            ) : (
              <span className="stock-pill stock-in">
                <CheckCircle2 size={16} /> In Stock ({product.stock} units left)
              </span>
            )}
          </div>

          {/* Action buttons: Add to Cart and Wishlist */}
          <div className="details-action-row">
            {(() => {
              const isAddingToCart = !!itemLoading[id];
              const cartItem = cartItems?.find(
                (i) => (i.product?._id || i.product) === id
              );
              const isCartAtStock =
                cartItem && cartItem.quantity >= (product.stock || 0);

              return (
                <button
                  onClick={handleAddToCart}
                  className="btn-primary details-cart-btn"
                  disabled={isOutOfStock || isAddingToCart || isCartAtStock}
                >
                  {isAddingToCart ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Adding to Cart...</span>
                    </>
                  ) : isOutOfStock ? (
                    <span>Out of Stock</span>
                  ) : isCartAtStock ? (
                    <span>Max in Cart ({cartItem.quantity})</span>
                  ) : cartItem ? (
                    <>
                      <ShoppingCart size={20} />
                      <span>Add Another ({cartItem.quantity} in Cart)</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={20} />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
              );
            })()}

            <button
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
              className={`btn-wishlist details-wishlist-btn ${
                isWishlisted ? "btn-wishlist-saved" : ""
              }`}
            >
              {wishlistLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : isWishlisted ? (
                <>
                  <Heart size={18} fill="#f43f5e" color="#f43f5e" />
                  <span>Saved to Wishlist</span>
                </>
              ) : (
                <>
                  <Heart size={18} color="currentColor" />
                  <span>Add to Wishlist</span>
                </>
              )}
            </button>
          </div>

          {cartNotice && (
            <div className="alert alert-info" style={{ marginTop: "1rem" }}>
              <ShoppingCart size={18} />
              <span>{cartNotice}</span>
            </div>
          )}

          {wishlistNotice && (
            <div
              className={`alert ${
                isWishlisted ? "alert-success" : "alert-info"
              }`}
              style={{ marginTop: "1rem" }}
            >
              <Heart size={18} />
              <span>{wishlistNotice}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
