import { useEffect } from "react";
import { useRouter } from "next/router";
import ErrorBoundary from "../components/ErrorBoundary";
import "../styles/globals.css";

// Performance monitoring
export function reportWebVitals(metric) {
  if (process.env.NODE_ENV === "production") {
    // Send metrics to your analytics provider
    if (typeof window !== "undefined") {
      fetch("/api/perf-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metrics: {
            [metric.name]: metric.value,
          },
          url: window.location.pathname,
          userAgent: navigator.userAgent,
        }),
      }).catch((err) => {
        // Silently fail - metrics reporting should not break app
      });
    }
  }
}

// Check if admin token is expired
function isAdminTokenExpired() {
  if (typeof window === "undefined") return false;

  const token = localStorage.getItem("admin_token");
  const expiresAt = localStorage.getItem("admin_token_expires");

  if (!token || !expiresAt) return false;

  const expirationTime = parseInt(expiresAt);
  return expirationTime <= Date.now();
}

// Clear expired admin session
function clearExpiredAdminSession() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_token_expires");
}

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Check for expired admin token on mount
    if (isAdminTokenExpired()) {
      clearExpiredAdminSession();
      // Redirect to login if on admin page
      if (router.pathname.startsWith("/admin")) {
        router.push("/admin/login");
      }
    }

    // Prefetch critical pages on mount
    const criticalPages = ["/cart", "/checkout"];
    criticalPages.forEach((page) => {
      router.prefetch(page);
    });

    // Handle route changes - check token expiration before navigating to admin pages
    const handleRouteChange = (url) => {
      if (url.startsWith("/admin") && isAdminTokenExpired()) {
        clearExpiredAdminSession();
        router.push("/admin/login");
      }
    };

    router.events.on("routeChangeStart", handleRouteChange);

    // Log page view (only in development)
    if (process.env.NODE_ENV !== "production") {
      const logRouteChange = (url) => {
        // Development navigation tracking disabled in production
      };
      router.events.on("routeChangeComplete", logRouteChange);
      return () => {
        router.events.off("routeChangeStart", handleRouteChange);
        router.events.off("routeChangeComplete", logRouteChange);
      };
    }

    return () => router.events.off("routeChangeStart", handleRouteChange);
  }, [router]);

  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}
