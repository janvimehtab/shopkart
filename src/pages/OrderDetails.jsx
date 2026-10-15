import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Calendar,
  CreditCard,
  MapPin,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { getOrderById, updateOrderStatus } from "../services/api";

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOrderById(id);
      if (data.success && data.order) {
        setOrder(data.order);
      } else {
        setError("Order not found.");
      }
    } catch (err) {
      console.error("Error loading order:", err);
      setError(err.response?.data?.message || "Failed to retrieve order details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleAdvanceStatus = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      setStatusMessage(null);
      const data = await updateOrderStatus(order._id, newStatus);
      if (data.success && data.order) {
        setOrder(data.order);
        setStatusMessage(`Order updated to ${newStatus}`);
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err) {
      console.error("Status update error:", err);
      setStatusMessage(err.response?.data?.message || "Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const statusSteps = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    const idx = statusSteps.indexOf(order.status);
    return idx >= 0 ? idx : 0;
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="loader-ring"></div>
        <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
          Loading order details...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-details-container animate-fade-in">
        <div className="glass-panel" style={{ textAlign: "center", padding: "4rem 2rem", maxWidth: "520px", margin: "3rem auto" }}>
          <AlertCircle size={48} color="#f43f5e" style={{ marginBottom: "1rem" }} />
          <h2>Order Not Found</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>{error || "Unable to display this order."}</p>
          <Link to="/orders" className="btn-primary" style={{ width: "auto" }}>
            <span>Back to Orders</span>
          </Link>
        </div>
      </div>
    );
  }

  const dateStr = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const currentStep = getCurrentStepIndex();

  return (
    <div className="order-details-container animate-fade-in">
      <div className="order-details-header">
        <Link to="/orders" className="checkout-back-link">
          <ArrowLeft size={16} />
          <span>Back to All Orders</span>
        </Link>
        <div className="order-details-title-row">
          <div>
            <h1 className="page-title">Order Details</h1>
            <p className="page-subtitle">Placed on {dateStr}</p>
          </div>
          <div className="order-id-badge">
            <span>ID: {order._id}</span>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="alert alert-success animate-fade-in" style={{ marginBottom: "1.5rem" }}>
          <Sparkles size={18} />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Bonus Challenge: Status Progression Stepper */}
      <div className="glass-panel status-stepper-card">
        <div className="stepper-title-row">
          <h3>Order Progress Tracking (Bonus Challenge)</h3>
          <span className="badge badge-primary">{order.status}</span>
        </div>

        <div className="stepper-track">
          {statusSteps.map((step, idx) => {
            const isCompleted = idx <= currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div
                key={step}
                className={`stepper-node ${isCompleted ? "node-completed" : ""} ${isCurrent ? "node-active" : ""}`}
              >
                <div className="node-circle">
                  {idx < currentStep ? (
                    <CheckCircle2 size={16} />
                  ) : idx === currentStep ? (
                    <Clock size={16} />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span className="node-label">{step}</span>
              </div>
            );
          })}
        </div>

        {/* Demo buttons to advance status */}
        <div className="stepper-actions">
          <span className="stepper-actions-label">Advance Status:</span>
          {statusSteps.map((step, idx) => (
            <button
              key={step}
              onClick={() => handleAdvanceStatus(step)}
              disabled={updatingStatus || order.status === step}
              className={`btn-step ${order.status === step ? "btn-step-active" : ""}`}
            >
              {step}
            </button>
          ))}
        </div>
      </div>

      <div className="order-details-grid">
        {/* Left: Ordered Items Snapshot */}
        <div className="order-items-column">
          <div className="glass-panel order-card">
            <h2 className="section-title">Purchased Items ({order.items?.length || 0})</h2>

            <div className="order-items-table">
              {order.items?.map((item, idx) => (
                <div key={idx} className="details-item-row">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="details-item-img" />
                  ) : (
                    <div className="details-item-img-placeholder">
                      <Package size={24} />
                    </div>
                  )}

                  <div className="details-item-info">
                    <span className="details-item-title">{item.name}</span>
                    <span className="details-item-sub">
                      Purchase Snapshot: ₹{item.price?.toLocaleString("en-IN")} each
                    </span>
                  </div>

                  <div className="details-item-qty">
                    <span>Qty: {item.quantity}</span>
                  </div>

                  <div className="details-item-total">
                    <span>₹{((item.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="order-card-divider"></div>

            <div className="summary-breakdown" style={{ marginTop: "1rem" }}>
              <div className="summary-row">
                <span className="summary-label">Items Subtotal:</span>
                <span className="summary-value">₹{order.totalAmount?.toLocaleString("en-IN")}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Shipping:</span>
                <span className="summary-value summary-free">FREE</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row summary-total-row">
                <span className="summary-total-label">Grand Total:</span>
                <span className="summary-total-value">
                  ₹{order.totalAmount?.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Delivery & Payment Details */}
        <div className="order-sidebar-column">
          {/* Shipping Address Box */}
          <div className="glass-panel order-card" style={{ marginBottom: "1.5rem" }}>
            <div className="sidebar-section-header">
              <MapPin size={18} />
              <h3>Delivery Address</h3>
            </div>
            {order.shippingAddress ? (
              <div className="address-content">
                <p className="address-name">{order.shippingAddress.fullName}</p>
                <p className="address-phone">Phone: {order.shippingAddress.phone}</p>
                <p className="address-line">{order.shippingAddress.addressLine1}</p>
                <p className="address-location">
                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                </p>
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)" }}>No shipping address available</p>
            )}
          </div>

          {/* Payment & Security Box */}
          <div className="glass-panel order-card">
            <div className="sidebar-section-header">
              <CreditCard size={18} />
              <h3>Payment Information</h3>
            </div>
            <div className="payment-details-list">
              <div className="payment-detail-row">
                <span className="detail-label">Payment Status:</span>
                <span className="badge badge-success">{order.paymentStatus}</span>
              </div>
              <div className="payment-detail-row">
                <span className="detail-label">Razorpay Order ID:</span>
                <span className="detail-code">{order.razorpayOrderId || "N/A"}</span>
              </div>
              <div className="payment-detail-row">
                <span className="detail-label">Payment ID:</span>
                <span className="detail-code">{order.razorpayPaymentId || "N/A"}</span>
              </div>
              <div className="payment-detail-row">
                <span className="detail-label">Payment Mode:</span>
                <span className="detail-val">Razorpay Standard Checkout (Test Mode)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
