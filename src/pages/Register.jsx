import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Phone, UserPlus, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { registerCustomer } from "../services/api";

const Register = () => {
  const navigate = useNavigate();

  // Controlled component states
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear validation error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (apiError) setApiError("");
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (formData.phone.trim().length < 7) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError("");
    setSuccessMsg("");

    try {
      const response = await registerCustomer({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      });

      if (response.success || response.customer) {
        setSuccessMsg("Account created successfully! Redirecting to login...");
        setTimeout(() => {
          navigate("/login", {
            state: { registeredEmail: formData.email },
          });
        }, 1500);
      } else {
        setApiError(response.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Registration failed. Email might already exist or server is offline.";
      setApiError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box glass-panel animate-fade-in">
        <div className="auth-header">
          <div style={{ display: "inline-flex", padding: "0.75rem", background: "rgba(99, 102, 241, 0.15)", borderRadius: "1rem", color: "#818cf8", marginBottom: "1rem" }}>
            <UserPlus size={28} />
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join ShopKart to start shopping today</p>
        </div>

        {/* Global API Error Alert */}
        {apiError && (
          <div className="alert alert-error">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>{apiError}</div>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="alert alert-success">
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>{successMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">
              <User size={15} />
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. Alex Morgan"
              className={`form-input ${errors.fullName ? "input-error" : ""}`}
            />
            {errors.fullName && <span className="error-text"><AlertCircle size={13} /> {errors.fullName}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              <Mail size={15} />
              Email Address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="alex@example.com"
              className={`form-input ${errors.email ? "input-error" : ""}`}
            />
            {errors.email && <span className="error-text"><AlertCircle size={13} /> {errors.email}</span>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              <Lock size={15} />
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              className={`form-input ${errors.password ? "input-error" : ""}`}
            />
            {errors.password && <span className="error-text"><AlertCircle size={13} /> {errors.password}</span>}
          </div>

          {/* Phone Number */}
          <div className="form-group" style={{ marginBottom: "1.75rem" }}>
            <label className="form-label" htmlFor="phone">
              <Phone size={15} />
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
              className={`form-input ${errors.phone ? "input-error" : ""}`}
            />
            {errors.phone && <span className="error-text"><AlertCircle size={13} /> {errors.phone}</span>}
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin" style={{ width: 18, height: 18, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%" }}></div>
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?
          <Link to="/login" className="auth-link">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
