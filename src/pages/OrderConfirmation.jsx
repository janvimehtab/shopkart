import React, { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import {
  CheckCircle,
  Package,
  ArrowRight,
  ShoppingBag,
  Clock,
  MapPin,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { getOrderById } from "../services/api";

const OrderConfirmation = () => {
  const { id } = useParams();
  const location = useLocation();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!order && id) {
      const fetchOrder = async () => {
        try {
          setLoading(true);
          const data = await getOrderById(id);
          if (data.success && data.order) {
            setOrder(data.order);
          } else {
            setError("Could not find order details.");
          }
        } catch (err) {
          console.error("Error loading order:", err);
          setError(
            err.response?.data?.message || "Failed to load order confirmation."
          );
        } finally {
          setLoading(false);
        }
      };

      fetchOrder();
    }
  }, [id, order]);

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="loader-ring"></div>
        <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
          Loading your order confirmation...
        </p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="order-confirmation-container animate-fade-in">
        <div className="glass-panel order-confirmation-card" style={{ textAlign: "center" }}>
          <AlertCircle size={48} color="#f43f5e" style={{ marginBottom: "1rem" }} />
          <h2>Order Not Found</h2>
          <p style={{ color: "var(--text-muted)" }}>{error}</p>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", justifyContent: "center" }}>
            <Link to="/orders" className="btn-primary" style={{ width: "auto" }}>
              <span>Go to My Orders</span>
            </Link>
            <Link to="/products" className="btn-outline" style={{ width: "auto" }}>
              <span>Browse Products</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-confirmation-container animate-fade-in">
      <div className="glass-panel order-confirmation-card">
        {/* Success Icon */}
        <div className="order-success-icon-wrap">
          <CheckCircle size={56} className="order-success-icon" />
        </div>

        <h1 className="confirmation-title">Order Placed Successfully! 🎉</h1>
        <p className="confirmation-subtitle">
          Your order has been saved and payment has been verified.
        </p>

        {/* Order Quick Details */}
        <div className="order-meta-box">
          <div className="order-meta-row">
            <span className="meta-label">Order ID:</span>
            <span className="meta-value order-id-highlight">{order?._id || id}</span>
          </div>

          <div className="order-meta-row">
            <span className="meta-label">Total Amount:</span>
            <span className="meta-value total-highlight">
              ₹{(order?.totalAmount || 0).toLocaleString("en-IN")}
            </span>
          </div>

          <div className="order-meta-row">
            <span className="meta-label">Payment Status:</span>
            <span className="badge badge-success">
              {order?.paymentStatus || "PAID"}
            </span>
          </div>

          <div className="order-meta-row">
            <span className="meta-label">Order Status:</span>
            <span className="badge badge-primary">
              {order?.status || "PLACED"}
            </span>
          </div>
        </div>

        {/* Ordered Items Preview */}
        {order?.items && order.items.length > 0 && (
          <div className="confirmation-items-preview">
            <h3>Items Ordered ({order.items.length})</h3>
            <div className="confirmation-items-list">
              {order.items.map((item, idx) => (
                <div key={idx} className="confirmation-item-row">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="confirmation-item-img"
                    />
                  )}
                  <div className="confirmation-item-desc">
                    <span className="confirmation-item-title">{item.name}</span>
                    <span className="confirmation-item-sub">
                      Qty: {item.quantity} × ₹{item.price?.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <span className="confirmation-item-cost">
                    ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shipping Summary */}
        {order?.shippingAddress && (
          <div className="confirmation-shipping-box">
            <div className="shipping-box-header">
              <MapPin size={16} />
              <span>Delivering to</span>
            </div>
            <p className="shipping-recipient">
              {order.shippingAddress.fullName} • {order.shippingAddress.phone}
            </p>
            <p className="shipping-address-text">
              {order.shippingAddress.addressLine1}, {order.shippingAddress.city},{" "}
              {order.shippingAddress.state} - {order.shippingAddress.pincode}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="confirmation-actions">
          <Link to="/orders" className="btn-primary" style={{ width: "auto" }}>
            <Package size={18} />
            <span>View My Orders</span>
          </Link>
          <Link to="/products" className="btn-outline" style={{ width: "auto" }}>
            <ShoppingBag size={18} />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
