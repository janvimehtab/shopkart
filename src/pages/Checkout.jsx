import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  Truck,
  CreditCard,
  AlertCircle,
  Loader2,
  Lock,
  Sparkles,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { createPaymentOrder, verifyPayment, simulateTestPayment } from "../services/api";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, loading: cartLoading, subtotal, totalCount, clearCart } = useCart();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [apiError, setApiError] = useState(null);

  // Redirect if cart is empty and not loading
  useEffect(() => {
    if (!cartLoading && (!cartItems || cartItems.length === 0)) {
      navigate("/cart");
    }
  }, [cartLoading, cartItems, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field-specific error as user types
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (apiError) setApiError(null);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.fullName || !formData.fullName.trim()) {
      errors.fullName = "Full name is required";
    }

    if (!formData.phone || !formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else {
      const cleanPhone = formData.phone.trim().replace(/[\s-]/g, "");
      if (!/^\d{10}$/.test(cleanPhone)) {
        errors.phone = "Phone should contain a valid 10-digit number";
      }
    }

    if (!formData.addressLine1 || !formData.addressLine1.trim()) {
      errors.addressLine1 = "Address line is required";
    }

    if (!formData.city || !formData.city.trim()) {
      errors.city = "City is required";
    }

    if (!formData.state || !formData.state.trim()) {
      errors.state = "State is required";
    }

    if (!formData.pincode || !formData.pincode.trim()) {
      errors.pincode = "Pincode is required";
    } else {
      const cleanPincode = formData.pincode.trim();
      if (!/^\d{6}$/.test(cleanPincode)) {
        errors.pincode = "Pincode must contain 6 digits";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getShippingPayload = () => {
    const shippingDetails = {
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim().replace(/[\s-]/g, ""),
      addressLine1: formData.addressLine1.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      pincode: formData.pincode.trim(),
    };

    // Supports both flat and nested shippingAddress backend controllers
    return {
      ...shippingDetails,
      shippingAddress: shippingDetails,
    };
  };

  const handleSimulatePayment = async () => {
    setApiError(null);
    if (!validateForm()) {
      return;
    }

    setSimulating(true);
    try {
      let targetOrderId = pendingOrderId;

      if (!targetOrderId) {
        const orderPayload = getShippingPayload();
        const paymentOrderData = await createPaymentOrder(orderPayload);
        
        if (!paymentOrderData.success) {
          throw new Error(paymentOrderData.message || "Failed to create order");
        }
        targetOrderId = paymentOrderData.shopKartOrderId;
        setPendingOrderId(targetOrderId);
      }

      const simRes = await simulateTestPayment(targetOrderId);
      if (simRes.success) {
        clearCart();
        navigate(`/order-success/${targetOrderId}`, {
          state: { order: simRes.order },
        });
      } else {
        setApiError(simRes.message || "Simulation payment failed");
      }
    } catch (err) {
      console.error("Simulation error:", err);
      setApiError(
        err.response?.data?.message || err.message || "Payment simulation failed"
      );
    } finally {
      setSimulating(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setApiError(null);

    // Form Validation
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // 1. Send Order Details to Backend
      const orderPayload = getShippingPayload();
      const paymentOrderData = await createPaymentOrder(orderPayload);

      if (!paymentOrderData.success) {
        throw new Error(paymentOrderData.message || "Failed to initialize order");
      }

      const { shopKartOrderId, razorpayOrderId, amount, currency, key } = paymentOrderData;
      setPendingOrderId(shopKartOrderId);

      // Extract valid key or fallback to Test Mode Key ID
      const validRazorpayKey =
        key && !key.includes("shopkartlab06")
          ? key
          : (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_RAZORPAY_KEY_ID) ||
            "rzp_test_TmxN4VhGYKwD7T";

      // 2. Load Razorpay SDK
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !window.Razorpay) {
        throw new Error(
          "Razorpay Checkout script could not be loaded. Please check your network connection."
        );
      }

      // 3. Configure Razorpay Standard Checkout Options
      const options = {
        key: validRazorpayKey,
        amount: amount, // Amount calculated in paise by backend
        currency: currency || "INR",
        name: "ShopKart",
        description: `Order #${shopKartOrderId}`,
        order_id: razorpayOrderId,
        handler: async function (response) {
          try {
            setSubmitting(true);
            const verifyRes = await verifyPayment({
              shopKartOrderId: shopKartOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              clearCart();
              navigate(`/order-success/${shopKartOrderId}`, {
                state: { order: verifyRes.order },
              });
            } else {
              setApiError(verifyRes.message || "Payment verification failed.");
              setSubmitting(false);
            }
          } catch (verifyErr) {
            console.error("Signature verification error:", verifyErr);
            setApiError(
              verifyErr.response?.data?.message ||
                "Payment verification failed. Please contact support."
            );
            setSubmitting(false);
          }
        },
        prefill: {
          name: formData.fullName,
          contact: formData.phone,
        },
        theme: {
          color: "#6366f1",
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
          },
        },
      };

      const paymentObject = new window.Razorpay(options);

      paymentObject.on("payment.failed", function (response) {
        console.error("Payment failed", response.error);
        setApiError(
          `Payment failed: ${response.error?.description || "Transaction declined"}. Your cart has not been cleared. Please try again.`
        );
        setSubmitting(false);
      });

      paymentObject.open();
    } catch (err) {
      console.error("Order creation error:", err);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "An unexpected error occurred while placing your order.";
      setApiError(errMsg);
      setSubmitting(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="spinner-container">
        <div className="loader-ring"></div>
        <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
          Preparing checkout...
        </p>
      </div>
    );
  }

  return (
    <div className="checkout-page-container animate-fade-in">
      <div className="checkout-header">
        <Link to="/cart" className="checkout-back-link">
          <ArrowLeft size={16} />
          <span>Back to Cart</span>
        </Link>
        <h1 className="page-title">Checkout</h1>
        <p className="page-subtitle">
          Complete your delivery details and proceed to secure payment
        </p>
      </div>

      {apiError && (
        <div
          className="alert alert-danger checkout-top-alert animate-fade-in"
          style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.75rem", padding: "1.25rem" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertCircle size={20} />
            <span style={{ fontWeight: 600 }}>{apiError}</span>
          </div>
          <div style={{ fontSize: "0.86rem", color: "#fca5a5", lineHeight: "1.5" }}>
            <strong>Why did Razorpay fail?</strong> Razorpay's official checkout popup requires valid Test API Keys from your{" "}
            <a
              href="https://dashboard.razorpay.com/#/app/keys"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#ffffff", textDecoration: "underline" }}
            >
              Razorpay Dashboard
            </a>{" "}
            in <code>.env</code> (<code>RAZORPAY_KEY_ID</code> and <code>RAZORPAY_KEY_SECRET</code>). You can either add real test keys or instantly complete the order flow using the Test Simulation below:
          </div>
          <button
            type="button"
            onClick={handleSimulatePayment}
            disabled={simulating}
            className="btn-primary"
            style={{
              width: "auto",
              padding: "0.55rem 1.25rem",
              fontSize: "0.88rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "0.25rem",
            }}
          >
            {simulating ? (
              <>
                <Loader2 size={16} className="spinner-icon" />
                <span>Completing Test Payment...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>⚡ Complete with Test Simulation</span>
              </>
            )}
          </button>
        </div>
      )}

      <div className="checkout-layout-grid">
        {/* Left Column: Shipping Details Form */}
        <div className="checkout-form-section">
          <div className="checkout-card glass-panel">
            <div className="checkout-section-header">
              <Truck size={20} className="header-icon" />
              <h2>Shipping Details</h2>
            </div>

            <form onSubmit={handlePlaceOrder} noValidate className="shipping-form">
              <div className="form-group">
                <label htmlFor="fullName">
                  Full Name <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Aarav Sharma"
                  className={`form-input ${formErrors.fullName ? "input-error" : ""}`}
                />
                {formErrors.fullName && (
                  <p className="error-message">{formErrors.fullName}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="phone">
                  Phone Number <span className="required-star">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210 (10 digits)"
                  className={`form-input ${formErrors.phone ? "input-error" : ""}`}
                />
                {formErrors.phone && (
                  <p className="error-message">{formErrors.phone}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="addressLine1">
                  Address Line <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  id="addressLine1"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  placeholder="e.g. 22 MG Road, Flat 402"
                  className={`form-input ${formErrors.addressLine1 ? "input-error" : ""}`}
                />
                {formErrors.addressLine1 && (
                  <p className="error-message">{formErrors.addressLine1}</p>
                )}
              </div>

              <div className="form-row-three">
                <div className="form-group">
                  <label htmlFor="city">
                    City <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Bengaluru"
                    className={`form-input ${formErrors.city ? "input-error" : ""}`}
                  />
                  {formErrors.city && (
                    <p className="error-message">{formErrors.city}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="state">
                    State <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="e.g. Karnataka"
                    className={`form-input ${formErrors.state ? "input-error" : ""}`}
                  />
                  {formErrors.state && (
                    <p className="error-message">{formErrors.state}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="pincode">
                    Pincode <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    id="pincode"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="e.g. 560001 (6 digits)"
                    maxLength={6}
                    className={`form-input ${formErrors.pincode ? "input-error" : ""}`}
                  />
                  {formErrors.pincode && (
                    <p className="error-message">{formErrors.pincode}</p>
                  )}
                </div>
              </div>

              <div className="shipping-notice">
                <ShieldCheck size={16} />
                <span>Your shipping details are securely stored with your order.</span>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="checkout-summary-section">
          <div className="order-summary-card glass-panel">
            <h2 className="summary-title">Order Summary</h2>

            <div className="checkout-items-list">
              {cartItems.map((item) => {
                const itemTotal = (item.product?.price || 0) * (item.quantity || 1);
                return (
                  <div key={item._id || item.product?._id} className="checkout-summary-item">
                    <div className="checkout-item-info">
                      <span className="checkout-item-name">{item.product?.name}</span>
                      <span className="checkout-item-qty">Qty: {item.quantity}</span>
                    </div>
                    <span className="checkout-item-total">
                      ₹{itemTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="summary-breakdown" style={{ marginTop: "1rem" }}>
              <div className="summary-row">
                <span className="summary-label">
                  Items ({totalCount} {totalCount === 1 ? "unit" : "units"}):
                </span>
                <span className="summary-value">
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="summary-row">
                <span className="summary-label">Shipping:</span>
                <span className="summary-value summary-free">FREE</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-row summary-total-row">
                <span className="summary-total-label">Total:</span>
                <span className="summary-total-value">
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={submitting || simulating}
              className="btn-primary checkout-btn"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="spinner-icon" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  <span>Place Order • ₹{subtotal.toLocaleString("en-IN")}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSimulatePayment}
              disabled={submitting || simulating}
              className="btn-outline"
              style={{
                width: "100%",
                marginTop: "0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                fontSize: "0.88rem",
                padding: "0.75rem",
                borderColor: "rgba(139, 92, 246, 0.4)",
                color: "#c4b5fd",
              }}
            >
              {simulating ? (
                <>
                  <Loader2 size={16} className="spinner-icon" />
                  <span>Processing Test Payment...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>⚡ Simulate Test Payment (Dev Mode)</span>
                </>
              )}
            </button>

            <div className="payment-security-badge">
              <Lock size={14} />
              <span>Razorpay Test Mode 256-bit Encrypted Payment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;