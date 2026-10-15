import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingBag, ShoppingCart, LogOut, UserCheck, LogIn, UserPlus, Heart, Package } from "lucide-react";
import { logoutCustomer } from "../services/api";
import { useCart } from "../context/CartContext";

const Navbar = ({ user, setUser, wishlistCount }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalCount, clearCart } = useCart();

  const handleLogout = async () => {
    try {
      await logoutCustomer();
      clearCart();
      if (setUser) setUser(null);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      // Even if API call fails, clear local state & redirect
      clearCart();
      if (setUser) setUser(null);
      navigate("/login");
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        {/* Brand Logo */}
        <Link to={user ? "/home" : "/login"} style={styles.logoLink}>
          <div style={styles.logoBadge}>
            <ShoppingBag size={22} color="#ffffff" />
          </div>
          <span style={styles.logoText}>
            Shop<span style={styles.logoHighlight}>Kart</span>
          </span>
        </Link>

        {/* Navigation Actions */}
        <div style={styles.actionsGroup}>
          {user && (
            <Link
              to="/home"
              style={{
                ...styles.navLink,
                ...(isActive("/home") ? styles.activeNavLink : {}),
              }}
            >
              Home
            </Link>
          )}

          <Link
            to="/products"
            style={{
              ...styles.navLink,
              ...(isActive("/products") ? styles.activeNavLink : {}),
            }}
          >
            Products
          </Link>

          <Link
            to="/wishlist"
            style={{
              ...styles.navLink,
              ...(isActive("/wishlist") ? styles.activeNavLink : {}),
            }}
          >
            <Heart size={16} />
            <span>
              Wishlist
              {typeof wishlistCount === "number" && wishlistCount >= 0 && (
                <span className="navbar-wishlist-count">
                  ({wishlistCount})
                </span>
              )}
            </span>
          </Link>

          <Link
            to="/cart"
            style={{
              ...styles.navLink,
              ...(isActive("/cart") ? styles.activeNavLink : {}),
            }}
          >
            <ShoppingCart size={16} />
            <span>
              Cart
              <span className="navbar-cart-count">
                ({totalCount})
              </span>
            </span>
          </Link>

          {user && (
            <Link
              to="/orders"
              style={{
                ...styles.navLink,
                ...(isActive("/orders") ? styles.activeNavLink : {}),
              }}
            >
              <Package size={16} />
              <span>Orders</span>
            </Link>
          )}

          {user ? (
            <>
              <div style={styles.userInfo}>
                <div style={styles.userAvatar}>
                  <UserCheck size={16} />
                </div>
                <span style={styles.userName}>{user.fullName || user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="btn-danger"
                style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                style={{
                  ...styles.navLink,
                  ...(isActive("/login") ? styles.activeNavLink : {}),
                }}
              >
                <LogIn size={16} />
                <span>Login</span>
              </Link>
              <Link
                to="/register"
                className="btn-primary"
                style={{
                  padding: "0.5rem 1.1rem",
                  fontSize: "0.875rem",
                  borderRadius: "0.6rem",
                  textDecoration: "none",
                  width: "auto",
                }}
              >
                <UserPlus size={16} />
                <span>Register</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    background: "rgba(15, 23, 42, 0.75)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    position: "sticky",
    top: 0,
    zIndex: 100,
    padding: "0.85rem 1.5rem",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoLink: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    textDecoration: "none",
  },
  logoBadge: {
    width: "40px",
    height: "40px",
    borderRadius: "0.75rem",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)",
  },
  logoText: {
    fontFamily: "Outfit, sans-serif",
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "#ffffff",
    letterSpacing: "-0.02em",
  },
  logoHighlight: {
    color: "#8b5cf6",
  },
  actionsGroup: {
    display: "flex",
    alignItems: "center",
    gap: "1.25rem",
  },
  navLink: {
    color: "#94a3b8",
    textDecoration: "none",
    fontWeight: 500,
    fontSize: "0.95rem",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    transition: "color 0.2s ease",
  },
  activeNavLink: {
    color: "#ffffff",
    fontWeight: 600,
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.4rem 0.8rem",
    background: "rgba(30, 41, 59, 0.6)",
    borderRadius: "0.6rem",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  userAvatar: {
    color: "#34d399",
    display: "flex",
    alignItems: "center",
  },
  userName: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#f8fafc",
  },
};

export default Navbar;
