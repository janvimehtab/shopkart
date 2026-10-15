import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Calendar,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  ArrowRight,
  ChevronRight,
  Clock,
  CheckCircle2,
  Truck,
  ShieldAlert,
} from "lucide-react";
import { getOrders } from "../services/api";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOrders();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err.response?.data?.message || "Failed to load your orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "PLACED":
        return "badge-primary";
      case "CONFIRMED":
        return "badge-info";
      case "SHIPPED":
        return "badge-warning";
      case "DELIVERED":
        return "badge-success";
      case "PENDING_PAYMENT":
        return "badge-pending";
      default:
        return "badge-primary";
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="spinner-container">
        <div className="loader-ring"></div>
        <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
          Loading your orders...
        </p>
      </div>
    );
  }

  // Error State
  if (error && orders.length === 0) {
    return (
      <div className="orders-page-container animate-fade-in">
        <div className="glass-panel" style={{ textAlign: "center", padding: "4rem 2rem", maxWidth: "500px", margin: "3rem auto" }}>
          <AlertCircle size={48} color="#f43f5e" style={{ marginBottom: "1rem" }} />
          <h2>Unable to load your orders</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>{error}</p>
          <button onClick={fetchOrders} className="btn-primary" style={{ width: "auto" }}>
            <RefreshCw size={18} />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  // Empty State
  if (!orders || orders.length === 0) {
    return (
      <div className="orders-page-container animate-fade-in">
        <div className="glass-panel cart-empty-state">
          <div className="cart-empty-icon-wrap">
            <Package size={56} className="cart-empty-icon" />
          </div>
          <h2>You have not placed any orders yet.</h2>
          <p>Explore our catalogue and place your first order today!</p>
          <Link to="/products" className="btn-primary empty-browse-btn">
            <span>Start Shopping</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page-container animate-fade-in">
      <div className="orders-header">
        <h1 className="page-title">My Orders</h1>
        <p className="page-subtitle">
          View and track all your previous purchases ({orders.length} {orders.length === 1 ? "order" : "orders"})
        </p>
      </div>

      <div className="orders-list">
        {orders.map((order) => {
          const dateStr = new Date(order.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });

          return (
            <div key={order._id} className="glass-panel order-card animate-fade-in">
              <div className="order-card-header">
                <div className="order-card-title-group">
                  <div className="order-number-wrap">
                    <Package size={18} className="order-card-icon" />
                    <span className="order-number">Order #{order._id}</span>
                  </div>
                  <div className="order-date-wrap">
                    <Calendar size={14} />
                    <span>{dateStr}</span>
                  </div>
                </div>

                <div className="order-badges-group">
                  <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                    {order.status}
                  </span>
                  <span className={`badge ${order.paymentStatus === "PAID" ? "badge-success" : "badge-pending"}`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="order-card-divider"></div>

              {/* Items summary */}
              <div className="order-card-items">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="order-item-chip">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="order-item-thumbnail" />
                    )}
                    <span className="order-item-name">{item.name}</span>
                    <span className="order-item-qty">× {item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="order-card-divider"></div>

              {/* Card Footer with Total & Link to Details */}
              <div className="order-card-footer">
                <div className="order-total-block">
                  <span className="order-total-label">Total Amount:</span>
                  <span className="order-total-value">
                    ₹{(order.totalAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>

                <Link to={`/orders/${order._id}`} className="btn-outline view-details-btn">
                  <span>View Details</span>
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;
