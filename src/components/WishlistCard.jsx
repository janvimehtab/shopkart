import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, ExternalLink, Loader2, HeartCrack } from "lucide-react";

const WishlistCard = ({ product, onRemove }) => {
  const [removing, setRemoving] = useState(false);
  const isOutOfStock = product.stock <= 0;

  const handleRemove = async () => {
    if (removing) return;
    setRemoving(true);
    try {
      await onRemove(product._id);
    } catch (err) {
      console.error("Failed to remove product:", err);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="wishlist-card glass-card">
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

        <div className="wishlist-card-actions">
          <Link
            to={`/products/${product._id}`}
            className="btn-outline wishlist-btn-view"
          >
            <ExternalLink size={16} />
            <span>View Details</span>
          </Link>

          <button
            onClick={handleRemove}
            disabled={removing}
            className="btn-danger-outline wishlist-btn-remove"
            title="Remove from Wishlist"
          >
            {removing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Removing...</span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>Remove from Wishlist</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WishlistCard;
