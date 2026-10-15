import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Wishlist from "./pages/Wishlist";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import { CartProvider } from "./context/CartContext";
import { getProfile, getWishlist } from "./services/api";

function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [wishlistCount, setWishlistCount] = useState(0);

  const fetchWishlistCount = async () => {
    try {
      const data = await getWishlist();
      if (data.success) {
        setWishlistCount(data.count ?? data.wishlist?.length ?? 0);
      }
    } catch (err) {
      // User might be unauthenticated, wishlist count defaults to 0
      setWishlistCount(0);
    }
  };

  useEffect(() => {
    // Check initial authentication state when app loads
    const checkInitialAuth = async () => {
      try {
        const currentUser = await getProfile();
        setUser(currentUser);
        if (currentUser) {
          await fetchWishlistCount();
        }
      } catch (err) {
        setUser(null);
        setWishlistCount(0);
      } finally {
        setInitializing(false);
      }
    };

    checkInitialAuth();
  }, []);

  // When user changes (e.g. login/logout), refresh wishlist count
  useEffect(() => {
    if (user) {
      fetchWishlistCount();
    } else {
      setWishlistCount(0);
    }
  }, [user]);

  if (initializing) {
    return (
      <div className="spinner-container">
        <div className="loader-ring"></div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Initializing ShopKart...
        </p>
      </div>
    );
  }

  return (
    <CartProvider user={user}>
      <Router>
        <Navbar user={user} setUser={setUser} wishlistCount={wishlistCount} />
        <main style={{ minHeight: "calc(100vh - 75px)" }}>
          <Routes>
            {/* Public Registration Route */}
            <Route path="/register" element={<Register />} />

            {/* Public Login Route */}
            <Route path="/login" element={<Login setUser={setUser} />} />

            {/* Protected Home Route */}
            <Route
              path="/home"
              element={
                <ProtectedRoute user={user} setUser={setUser}>
                  <Home user={user} setUser={setUser} />
                </ProtectedRoute>
              }
            />

            {/* Product Listing Route */}
            <Route
              path="/products"
              element={
                <Products
                  onWishlistChange={() => {
                    if (user) fetchWishlistCount();
                  }}
                />
              }
            />

            {/* Product Details Route */}
            <Route path="/products/:id" element={<ProductDetails />} />

            {/* Task 6 & 8: Protected Wishlist Route */}
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute user={user} setUser={setUser}>
                  <Wishlist
                    onWishlistUpdate={(count) => setWishlistCount(count)}
                  />
                </ProtectedRoute>
              }
            />

            {/* Lab 05 Tasks 8 & 13: Protected Cart Route */}
            <Route
              path="/cart"
              element={
                <ProtectedRoute user={user} setUser={setUser}>
                  <Cart />
                </ProtectedRoute>
              }
            />

            {/* Lab 06 Task 2: Protected Checkout Route */}
            <Route
              path="/checkout"
              element={
                <ProtectedRoute user={user} setUser={setUser}>
                  <Checkout />
                </ProtectedRoute>
              }
            />

            {/* Lab 06 Task 6: Protected Order Confirmation Route */}
            <Route
              path="/order-success/:id"
              element={
                <ProtectedRoute user={user} setUser={setUser}>
                  <OrderConfirmation />
                </ProtectedRoute>
              }
            />

            {/* Lab 06 Task 8: Protected My Orders Route */}
            <Route
              path="/orders"
              element={
                <ProtectedRoute user={user} setUser={setUser}>
                  <Orders />
                </ProtectedRoute>
              }
            />

            {/* Lab 06 Task 17 & Bonus: Protected Single Order Details Route */}
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute user={user} setUser={setUser}>
                  <OrderDetails />
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect */}
            <Route
              path="*"
              element={<Navigate to="/products" replace />}
            />
          </Routes>
        </main>
      </Router>
    </CartProvider>
  );
}

export default App;
