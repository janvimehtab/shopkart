import React, { useState, useEffect } from "react";
import { getProducts, getWishlist } from "../services/api";
import ProductCard from "../components/ProductCard";
import SearchBar from "../components/SearchBar";
import { AlertCircle, PackageOpen } from "lucide-react";

const Products = ({ onWishlistChange }) => {
  const [products, setProducts] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [sort, setSort] = useState("");

  const fetchWishlistIds = async () => {
    try {
      const data = await getWishlist();
      if (data.success && Array.isArray(data.wishlist)) {
        const ids = new Set(data.wishlist.map((p) => p._id));
        setWishlistIds(ids);
      }
    } catch (err) {
      // User may be a guest or unauthenticated
      setWishlistIds(new Set());
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getProducts({
        search: searchTerm,
        category: category,
        sort: sort,
      });
      if (data.success) {
        setProducts(data.products || []);
      } else {
        setError(data.message || "Something went wrong while loading products.");
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      const msg =
        err.response?.data?.message ||
        (err.code === "ERR_NETWORK"
          ? "Unable to connect to the backend server on port 5001. Please ensure the server is running."
          : "Something went wrong while loading products.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlistIds();
  }, []);

  // Re-fetch whenever search, category or sort changes
  useEffect(() => {
    // Debounce search slightly to avoid spamming requests
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, category, sort]);

  const handleCardWishlistChange = (productId, isSaved) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (isSaved) {
        next.add(productId);
      } else {
        next.delete(productId);
      }
      return next;
    });
    if (onWishlistChange) {
      onWishlistChange();
    }
  };

  return (
    <div className="products-page-container animate-fade-in">
      {/* Header */}
      <div className="products-header">
        <h1 className="page-title">Discover Products</h1>
        <p className="page-subtitle">
          Explore the latest electronics, fashion, books, and home essentials.
        </p>
      </div>

      {/* Task 7: Search & Filter UI */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        category={category}
        onCategoryChange={setCategory}
        sort={sort}
        onSortChange={setSort}
      />

      {/* Loading State */}
      {loading && (
        <div className="spinner-container">
          <div className="loader-ring"></div>
          <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
            Loading products...
          </p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="alert alert-error" style={{ justifyContent: "center", margin: "2rem auto", maxWidth: "600px", flexDirection: "column", gap: "0.75rem", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchProducts}
            className="btn-primary"
            style={{ width: "auto", padding: "0.4rem 1rem", fontSize: "0.85rem", margin: "0 auto" }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <div className="empty-state glass-panel">
          <PackageOpen size={48} className="empty-icon" />
          <h3>No products found.</h3>
          <p>Try adjusting your search query or selecting a different category.</p>
        </div>
      )}

      {/* Product Listing Grid */}
      {!loading && !error && products.length > 0 && (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              initialWishlisted={wishlistIds.has(product._id)}
              onWishlistChange={handleCardWishlistChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
