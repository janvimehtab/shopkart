import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import {
  getCart,
  addToCart as apiAddToCart,
  updateCartQuantity as apiUpdateCartQuantity,
  removeFromCart as apiRemoveFromCart,
} from "../services/api";

const CartContext = createContext(null);

export const CartProvider = ({ children, user }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [itemLoading, setItemLoading] = useState({}); // { [productId]: boolean }

  // Fetch cart data from the server
  const fetchCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getCart();
      if (data.success && Array.isArray(data.cart)) {
        setCartItems(data.cart);
      } else {
        setCartItems([]);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setCartItems([]);
      } else {
        console.error("Error loading cart:", err);
        setError(err.response?.data?.message || "Unable to load your cart.");
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load cart whenever the authenticated user changes
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Add product to cart (or increment quantity if already present)
  const addToCart = async (productId) => {
    setItemLoading((prev) => ({ ...prev, [productId]: true }));
    try {
      const data = await apiAddToCart(productId);
      if (data.success && Array.isArray(data.cart)) {
        setCartItems(data.cart);
      }
      return { success: true, message: data.message || "Cart updated" };
    } catch (err) {
      console.error("Error adding to cart:", err);
      const message =
        err.response?.data?.message || "Failed to add product to cart.";
      return { success: false, error: message, status: err.response?.status };
    } finally {
      setItemLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // Update quantity for a specific product
  const updateQuantity = async (productId, quantity) => {
    setItemLoading((prev) => ({ ...prev, [productId]: true }));
    try {
      const data = await apiUpdateCartQuantity(productId, quantity);
      if (data.success && Array.isArray(data.cart)) {
        setCartItems(data.cart);
      }
      return { success: true, message: data.message || "Quantity updated" };
    } catch (err) {
      console.error("Error updating cart quantity:", err);
      const message =
        err.response?.data?.message || "Failed to update quantity.";
      return { success: false, error: message, status: err.response?.status };
    } finally {
      setItemLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // Remove a product from the cart
  const removeFromCart = async (productId) => {
    setItemLoading((prev) => ({ ...prev, [productId]: true }));
    try {
      const data = await apiRemoveFromCart(productId);
      if (data.success && Array.isArray(data.cart)) {
        setCartItems(data.cart);
      }
      return { success: true, message: data.message || "Product removed from cart" };
    } catch (err) {
      console.error("Error removing from cart:", err);
      const message =
        err.response?.data?.message || "Failed to remove product from cart.";
      return { success: false, error: message, status: err.response?.status };
    } finally {
      setItemLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // Clear local cart state (e.g. on logout)
  const clearCart = () => {
    setCartItems([]);
    setError(null);
    setItemLoading({});
  };

  // Derived values - not stored separately
  const { totalCount, subtotal, uniqueItemsCount } = useMemo(() => {
    let count = 0;
    let total = 0;

    cartItems.forEach((item) => {
      const qty = item.quantity || 0;
      const price = item.product?.price || 0;
      count += qty;
      total += price * qty;
    });

    return {
      totalCount: count,
      subtotal: total,
      uniqueItemsCount: cartItems.length,
    };
  }, [cartItems]);

  const value = {
    cartItems,
    loading,
    error,
    itemLoading,
    totalCount,
    subtotal,
    uniqueItemsCount,
    addToCart,
    updateQuantity,
    removeFromCart,
    refreshCart: fetchCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export default CartContext;
