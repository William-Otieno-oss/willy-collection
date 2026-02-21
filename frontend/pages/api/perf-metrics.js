// Performance monitoring and metrics collection endpoint
// Collects Core Web Vitals and other performance metrics from the client

export default function handler(req, res) {
  if (req.method === "POST") {
    const { metrics, url, userAgent } = req.body;

    // Log performance metrics
    console.log("[PERFORMANCE METRICS]", {
      url,
      timestamp: new Date().toISOString(),
      metrics,
      userAgent: userAgent?.substring(0, 100),
    });

    // In production, you might want to:
    // 1. Save to a database
    // 2. Send to analytics service (Google Analytics, Datadog, etc.)
    // 3. Alert if metrics exceed thresholds

    const alerts = [];

    if (metrics.LCP && metrics.LCP > 4000) {
      alerts.push(`High LCP: ${metrics.LCP}ms`);
    }
    if (metrics.FID && metrics.FID > 100) {
      alerts.push(`High FID: ${metrics.FID}ms`);
    }
    if (metrics.CLS && metrics.CLS > 0.1) {
      alerts.push(`High CLS: ${metrics.CLS}`);
    }

    if (alerts.length > 0) {
      console.warn("[PERFORMANCE ALERTS]", alerts.join(", "));
    }

    res.status(200).json({ success: true, alerts });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
