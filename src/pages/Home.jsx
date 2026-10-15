import React, { useEffect, useState } from "react";
import { User, Mail, Phone, ShieldCheck, ShoppingBag, Clock, Sparkles, LogOut, CheckCircle } from "lucide-react";
import { getProfile, logoutCustomer } from "../services/api";
import { useNavigate } from "react-router-dom";

const Home = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(!user);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchCustomerProfile = async () => {
      try {
        const data = await getProfile();
        if (isMounted) {
          setProfile(data);
          if (setUser) setUser(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to fetch customer profile:", err);
          setError("Failed to load customer profile. Please log in again.");
          setLoading(false);
        }
      }
    };

    fetchCustomerProfile();

    return () => {
      isMounted = false;
    };
  }, [setUser]);

  const handleLogout = async () => {
    try {
      await logoutCustomer();
      if (setUser) setUser(null);
      navigate("/login");
    } catch (err) {
      if (setUser) setUser(null);
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="loader-ring"></div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Loading dashboard profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-page">
        <div className="auth-box glass-panel text-center">
          <h2 style={{ color: "#f43f5e", marginBottom: "1rem" }}>Session Error</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>{error}</p>
          <button onClick={() => navigate("/login")} className="btn-primary">
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Active Member";

  return (
    <div className="dashboard-container animate-fade-in">
      {/* Welcome Banner */}
      <div className="welcome-banner glass-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div className="badge badge-active" style={{ marginBottom: "0.75rem" }}>
              <ShieldCheck size={14} />
              <span>Authenticated Session</span>
            </div>
            <h1 className="welcome-title">
              Welcome back, {profile?.fullName || "Customer"}! 👋
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", maxWidth: "600px" }}>
              Your account is verified and ready. Manage your profile details and start shopping for exclusive ShopKart deals.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={handleLogout} className="btn-danger">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Details Cards */}
      <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.35rem", marginBottom: "1.25rem", color: "#ffffff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <User size={20} color="#8b5cf6" />
        <span>Account Profile Details</span>
      </h2>

      <div className="profile-grid">
        {/* Full Name */}
        <div className="info-card glass-card">
          <div className="info-icon-wrapper" style={{ background: "rgba(99, 102, 241, 0.15)", borderColor: "rgba(99, 102, 241, 0.3)", color: "#818cf8" }}>
            <User size={24} />
          </div>
          <div>
            <div className="info-label">Full Name</div>
            <div className="info-value">{profile?.fullName || "N/A"}</div>
          </div>
        </div>

        {/* Email */}
        <div className="info-card glass-card">
          <div className="info-icon-wrapper" style={{ background: "rgba(139, 92, 246, 0.15)", borderColor: "rgba(139, 92, 246, 0.3)", color: "#a78bfa" }}>
            <Mail size={24} />
          </div>
          <div>
            <div className="info-label">Email Address</div>
            <div className="info-value">{profile?.email || "N/A"}</div>
          </div>
        </div>

        {/* Phone */}
        <div className="info-card glass-card">
          <div className="info-icon-wrapper" style={{ background: "rgba(236, 72, 153, 0.15)", borderColor: "rgba(236, 72, 153, 0.3)", color: "#f472b6" }}>
            <Phone size={24} />
          </div>
          <div>
            <div className="info-label">Phone Number</div>
            <div className="info-value">{profile?.phone || "N/A"}</div>
          </div>
        </div>

        {/* Account ID */}
        <div className="info-card glass-card">
          <div className="info-icon-wrapper" style={{ background: "rgba(16, 185, 129, 0.15)", borderColor: "rgba(16, 185, 129, 0.3)", color: "#34d399" }}>
            <Sparkles size={24} />
          </div>
          <div>
            <div className="info-label">Customer ID</div>
            <div className="info-value" style={{ fontFamily: "monospace", fontSize: "0.95rem" }}>
              {profile?._id || "N/A"}
            </div>
          </div>
        </div>

        {/* Member Since */}
        <div className="info-card glass-card">
          <div className="info-icon-wrapper" style={{ background: "rgba(245, 158, 11, 0.15)", borderColor: "rgba(245, 158, 11, 0.3)", color: "#fbbf24" }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="info-label">Member Since</div>
            <div className="info-value">{joinDate}</div>
          </div>
        </div>

        {/* Status */}
        <div className="info-card glass-card">
          <div className="info-icon-wrapper" style={{ background: "rgba(59, 130, 246, 0.15)", borderColor: "rgba(59, 130, 246, 0.3)", color: "#60a5fa" }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="info-label">Account Status</div>
            <div className="info-value" style={{ color: "#34d399" }}>Verified Customer</div>
          </div>
        </div>
      </div>

      {/* Shopping Showcase / Dashboard Placeholder */}
      <div className="glass-panel" style={{ padding: "2rem", marginTop: "1rem" }}>
        <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", color: "#ffffff", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ShoppingBag size={20} color="#ec4899" />
          <span>ShopKart Quick Explorer</span>
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: "1.6" }}>
          Your HttpOnly cookie authentication was validated successfully via backend route <code style={{ background: "rgba(0,0,0,0.4)", padding: "0.2rem 0.5rem", borderRadius: "0.4rem", color: "#a78bfa" }}>GET /customers/me</code>.
        </p>
      </div>
    </div>
  );
};

export default Home;
