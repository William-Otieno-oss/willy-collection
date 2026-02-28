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
    // If an access cookie is present the server will authenticate us.  We
    // attempt a harmless request to verify and redirect if successful.
    const checkAuth = async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/orders?limit=1`, {
          credentials: "include",
        });
        if (resp.ok) {
          Router.push("/admin/dashboard");
        }
      } catch (e) {
        // ignore errors, stay on login page
      }
    };
    checkAuth();
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
        // backend may return { error: 'msg' } or { error: { code, message } }
        let msg = data.error || "Login failed. Please try again.";
        if (msg && typeof msg === "object") {
          // prefer message property, otherwise stringify
          msg = msg.message || JSON.stringify(msg);
        }
        setError(msg);
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

      // NOTE: the server has already set HTTP-only access/refresh cookies.
      // We no longer persist tokens in localStorage.  The response still
      // returns the access token for backward‑compatibility and automated
      // tests which may inspect it.

      // Clear form
      setEmail("");
      setPassword("");
      setFieldErrors({});

      // Redirect to dashboard
      Router.push("/admin/dashboard");
    } catch (err) {
      console.error("Login fetch error", err);
      // Provide more informative message when CORS or network issues occur
      let message = "Connection failed. Please try again.";
      if (err instanceof TypeError) {
        message = "Network error. Check your connection or CORS configuration.";
      } else if (err && err.message) {
        message = err.message;
      }
      setError(message);
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
            <div className="mb-6 p-4 bg-brand-light/20 border border-brand-light rounded-lg text-brand-dark text-sm font-medium animate-slideUp">
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
                <p className="mt-2 text-sm text-brand-dark">
                  {fieldErrors.email}
                </p>
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
