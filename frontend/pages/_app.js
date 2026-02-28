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

// Authentication is now managed via HTTP-only cookies set by the backend.
// Individual pages perform their own checks and redirect to login if needed.
// We do not manage tokens in client-side storage here.

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Prefetch critical pages on mount
    const criticalPages = ["/cart", "/checkout"];
    criticalPages.forEach((page) => {
      router.prefetch(page);
    });

    // No global auth checks here; individual admin pages handle their own
    // redirects when API calls return 401.

    // Log page view (only in development)
    if (process.env.NODE_ENV !== "production") {
      const logRouteChange = (url) => {
        // Development navigation tracking disabled in production
      };
      router.events.on("routeChangeComplete", logRouteChange);
      return () => {
        router.events.off("routeChangeComplete", logRouteChange);
      };
    }
  }, [router]);

  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}
