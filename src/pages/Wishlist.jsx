import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, RefreshCw, AlertCircle, ShoppingBag, ArrowRight } from "lucide-react";
import { getWishlist, removeFromWishlist } from "../services/api";
import WishlistCard from "../components/WishlistCard";

const Wishlist = ({ onWishlistUpdate }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchWishlist = async () => {
    setLoading(true);
    setError(false);
    setErrorMessage("");

    try {
      const data = await getWishlist();
      if (data.success) {
        setWishlist(data.wishlist || []);
        if (onWishlistUpdate) onWishlistUpdate(data.count ?? data.wishlist?.length ?? 0);
      } else {
        setError(true);
        setErrorMessage("We couldn't load your wishlist.");
      }
    } catch (err) {
      console.error("Error fetching wishlist:", err);
      setError(true);
      setErrorMessage(
        err.response?.data?.message || "We couldn't load your wishlist."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      const response = await removeFromWishlist(productId);
      if (response.success) {
        setWishlist((prev) => {
          const updated = prev.filter((p) => p._id !== productId);
          if (onWishlistUpdate) onWishlistUpdate(updated.length);
          return updated;
        });
      }
    } catch (err) {
      console.error("Failed to remove item from wishlist:", err);
      alert(err.response?.data?.message || "Failed to remove product from wishlist");
    }
  };

  return (
    <div className="wishlist-page-container animate-fade-in">
      {/* Page Header */}
      <div className="wishlist-header">
        <div>
          <h1 className="page-title">My Wishlist</h1>
          {!loading && !error && (
            <p className="page-subtitle">
              {wishlist.length === 1
                ? "1 product saved"
                : `${wishlist.length} products saved`}
            </p>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="spinner-container">
          <div className="loader-ring"></div>
          <p style={{ color: "var(--text-muted)", fontSize: "1.05rem" }}>
            Loading your wishlist...
          </p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="wishlist-error-state glass-panel">
          <AlertCircle size={52} color="#f43f5e" style={{ marginBottom: "1rem" }} />
          <h2>Something went wrong.</h2>
          <p>{errorMessage || "We couldn't load your wishlist."}</p>
          <button onClick={fetchWishlist} className="btn-primary" style={{ marginTop: "1.5rem" }}>
            <RefreshCw size={18} />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && wishlist.length === 0 && (
        <div className="wishlist-empty-state glass-panel">
          <div className="empty-heart-icon-wrapper">
            <Heart size={54} color="#f43f5e" fill="rgba(244, 63, 94, 0.2)" />
          </div>
          <h2>Your wishlist is empty</h2>
          <p>
            Save products you love and find them here later.
          </p>
          <Link to="/products" className="btn-primary empty-browse-btn">
            <ShoppingBag size={18} />
            <span>Browse Products</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Wishlist Grid */}
      {!loading && !error && wishlist.length > 0 && (
        <div className="products-grid wishlist-grid">
          {wishlist.map((product) => (
            <WishlistCard
              key={product._id}
              product={product}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
