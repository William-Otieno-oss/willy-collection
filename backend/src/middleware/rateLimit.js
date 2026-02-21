/**
 * Rate limiting middleware to prevent brute force attacks and DDoS
 * Uses memory-based tracking (suitable for single instance, use Redis for distributed)
 */

const rateLimit = (maxRequests = 100, windowMs = 900000) => {
  const requests = new Map();

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, data] of requests.entries()) {
      if (now - data.resetTime > windowMs) {
        requests.delete(key);
      }
    }
  }, windowMs);

  // Cleanup on process exit
  process.on("SIGINT", () => clearInterval(cleanup));
  process.on("SIGTERM", () => clearInterval(cleanup));

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress || "unknown";
    const now = Date.now();

    if (!requests.has(key)) {
      requests.set(key, {
        count: 0,
        resetTime: now,
      });
    }

    const data = requests.get(key);

    // Reset counter if window expired
    if (now - data.resetTime > windowMs) {
      data.count = 0;
      data.resetTime = now;
    }

    data.count++;

    // Add rate limit headers
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - data.count));
    res.setHeader(
      "X-RateLimit-Reset",
      new Date(data.resetTime + windowMs).toISOString(),
    );

    if (data.count > maxRequests) {
      return res.status(429).json({
        error: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((data.resetTime + windowMs - now) / 1000),
      });
    }

    next();
  };
};

module.exports = { rateLimit };
