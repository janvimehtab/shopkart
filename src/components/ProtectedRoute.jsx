import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getProfile } from "../services/api";

const ProtectedRoute = ({ user, setUser, children }) => {
  const [loading, setLoading] = useState(user === null ? true : false);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      // If user state is already available, skip fetching
      if (user) {
        setLoading(false);
        return;
      }

      try {
        const data = await getProfile();
        if (isMounted) {
          setUser(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [user, setUser]);

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="loader-ring"></div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Verifying session...
        </p>
      </div>
    );
  }

  // If not logged in after check -> Redirect automatically to /login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
