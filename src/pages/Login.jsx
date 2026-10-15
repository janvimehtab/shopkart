import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, LogIn, AlertCircle, ArrowRight } from "lucide-react";
import { loginCustomer, getProfile } from "../services/api";

const Login = ({ setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: location.state?.registeredEmail || "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (apiError) setApiError("");
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError("");

    try {
      const response = await loginCustomer({
        email: formData.email,
        password: formData.password,
      });

      if (response.success) {
        // Fetch logged-in user details via /customers/me
        try {
          const profile = await getProfile();
          if (setUser) setUser(profile);
        } catch (profileErr) {
          console.error("Failed to fetch profile after login:", profileErr);
        }
        navigate("/home");
      } else {
        setApiError(response.message || "Invalid Credentials");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || "Invalid Credentials";
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
            <LogIn size={28} />
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to access your ShopKart account</p>
        </div>

        {/* Invalid Credentials or API Error */}
        {apiError && (
          <div className="alert alert-error">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>{apiError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              <Mail size={15} />
              Email Address
            </label>
            <input
              id="login-email"
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
          <div className="form-group" style={{ marginBottom: "1.75rem" }}>
            <label className="form-label" htmlFor="login-password">
              <Lock size={15} />
              Password
            </label>
            <input
              id="login-password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className={`form-input ${errors.password ? "input-error" : ""}`}
            />
            {errors.password && <span className="error-text"><AlertCircle size={13} /> {errors.password}</span>}
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin" style={{ width: 18, height: 18, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%" }}></div>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?
          <Link to="/register" className="auth-link">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
