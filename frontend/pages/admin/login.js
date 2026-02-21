import { useState, useEffect } from "react";
import Router from "next/router";
import API_BASE from "../../lib/api";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { LoadingSpinner } from "../../components/Loading";

// Validation helper functions
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function validateLoginInputs(email, password) {
  const errors = {};

  if (!email || !email.trim()) {
    errors.email = "Email is required";
  } else if (!isValidEmail(email.trim())) {
    errors.email = "Please enter a valid email address";
  }

  if (!password) {
    errors.password = "Password is required";
  } else if (password.length < 1) {
    errors.password = "Password is required";
  } else if (password.length > 500) {
    errors.password = "Password is too long";
  }

  return errors;
}

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    // Check if already authenticated
    const token = localStorage.getItem("admin_token");
    const expiresAt = localStorage.getItem("admin_token_expires");
    if (token && expiresAt && parseInt(expiresAt) > Date.now()) {
      Router.push("/admin/dashboard");
    }
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    // Validate inputs
    const validationErrors = validateLoginInputs(email, password);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
        }),
        credentials: "include",
      });

      const data = await res.json();

      // Validate response structure
      if (!res.ok) {
        setError(data.error || "Login failed. Please try again.");
        setLoading(false);
        return;
      }

      if (!data.token || typeof data.token !== "string") {
        setError("Invalid response from server. Please try again.");
        setLoading(false);
        return;
      }

      if (!data.expiresIn || typeof data.expiresIn !== "number") {
        setError("Invalid token expiration. Please try again.");
        setLoading(false);
        return;
      }

      // Store token with expiration timestamp
      const expiresAt = Date.now() + data.expiresIn * 1000;
      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_token_expires", expiresAt.toString());

      // Clear form
      setEmail("");
      setPassword("");
      setFieldErrors({});

      // Redirect to dashboard
      Router.push("/admin/dashboard");
    } catch (err) {
      // Error handled via setError state
      if (err instanceof TypeError) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("Connection failed. Please try again.");
      }
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-primary to-black flex items-center justify-center px-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-accent/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/3 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-fadeIn">
          <h1 className="text-4xl font-bold text-white mb-2">willy</h1>
          <p className="text-accent font-semibold">ADMIN PORTAL</p>
        </div>

        {/* Login Card */}
        <Card className="p-8 animate-slideUp backdrop-blur-md bg-white/95">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-600 mb-8">Sign in to manage your store</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium animate-slideUp">
              <span className="inline-block mr-2">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-5" noValidate>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors({ ...fieldErrors, email: "" });
                  }
                }}
                disabled={loading}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  fieldErrors.email
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-200 focus:ring-accent"
                }`}
                placeholder="admin@willy.com"
                autoComplete="email"
              />
              {fieldErrors.email && (
                <p className="mt-2 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors({ ...fieldErrors, password: "" });
                    }
                  }}
                  disabled={loading}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    fieldErrors.password
                      ? "border-red-300 focus:ring-red-200 pr-10"
                      : "border-gray-200 focus:ring-accent pr-10"
                  }`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  disabled={loading}
                  tabIndex="-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-2 text-sm text-red-600">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center text-xs text-gray-600">
            🔒 Secure admin access only
          </div>
        </Card>
      </div>
    </div>
  );
}
