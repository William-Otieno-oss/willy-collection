/**
 * Rate limiting middleware to prevent brute force attacks and DDoS
 * Uses Redis for distributed, cluster-safe rate limiting
 */

const redis = require("../services/redis");

// in-memory fallback map used when Redis is unreachable. Keys are
// identical to Redis keys and values store { count, expires }.
const localLimits = new Map();

const rateLimit = (maxRequests = 100, windowMs = 900000) => {
  return async (req, res, next) => {
    // debug log environment (helps track why bypass may not fire)
    // allow bypass in test or during development, or when explicit header
    // is supplied.  Hitting the rate limiter while actively building or
    // exercising the frontend (refreshing repeatedly) can be confusing – the
    // store will look empty even though items exist.  We only enforce limits
    // in production.
    if (
      process.env.NODE_ENV !== "production" ||
      req.headers["x-bypass-rate-limit"] === "1"
    ) {
      console.log(
        "[rateLimit] env",
        process.env.NODE_ENV,
        "bypass?",
        req.headers["x-bypass-rate-limit"],
      );
      // reset if requested
      if (req.headers["x-reset-rate-limit"] === "1") {
        // Clear all keys for this IP (not cluster-safe, but test-only)
        // Not implemented for Redis for safety
      }
      return next();
    }

    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const routePath =
      (req.baseUrl ? `${req.baseUrl}${req.path || ""}` : req.path) || "global";
    const key = `ratelimit:${ip}:${routePath}`;
    const now = Date.now();

    // In development or test, always use the in-memory limiter. This keeps
    // behavior predictable during local runs and avoids relying on Redis, which
    // may not be available in CI or the developer's machine.  We also check
    // for the presence of a usable client (the stub exported outside of
    // production will throw if used).
    if (
      process.env.NODE_ENV !== "production" ||
      !redis ||
      typeof redis.incr !== "function"
    ) {
      let entry = localLimits.get(key);
      if (!entry || now > entry.expires) {
        entry = { count: 0, expires: now + windowMs };
      }
      entry.count += 1;
      localLimits.set(key, entry);

      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader(
        "X-RateLimit-Remaining",
        Math.max(0, maxRequests - entry.count),
      );
      res.setHeader("X-RateLimit-Reset", new Date(entry.expires).toISOString());

      if (entry.count > maxRequests) {
        return res.status(429).json({
          error: "Too many requests. Please try again later (fallback).",
          retryAfter: Math.ceil((entry.expires - now) / 1000),
        });
      }

      return next();
    }

    try {
      // Use Redis INCR and EXPIRE for atomicity
      let count = await redis.incr(key);
      if (count === 1) {
        await redis.pexpire(key, windowMs);
      }
      const ttl = await redis.pttl(key);

      // ensure count is numeric (fallback if redis returns non-numeric)
      if (typeof count !== "number" || isNaN(count)) {
        throw new Error(`Invalid redis count value: ${count}`);
      }

      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - count));
      res.setHeader(
        "X-RateLimit-Reset",
        new Date(now + (ttl > 0 ? ttl : windowMs)).toISOString(),
      );

      if (count > maxRequests) {
        return res.status(429).json({
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil((ttl > 0 ? ttl : windowMs) / 1000),
        });
      }

      next();
    } catch (err) {
      // Redis unavailable or returned bad data; fall back to simple in-memory limiter.
      if (process.env.NODE_ENV !== "production") {
        console.error(
          "Rate limit Redis error or invalid response, using in-memory fallback",
          err,
        );
      }

      let entry = localLimits.get(key);
      if (!entry || now > entry.expires) {
        entry = { count: 0, expires: now + windowMs };
      }
      entry.count += 1;
      localLimits.set(key, entry);

      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader(
        "X-RateLimit-Remaining",
        Math.max(0, maxRequests - entry.count),
      );
      res.setHeader("X-RateLimit-Reset", new Date(entry.expires).toISOString());

      if (entry.count > maxRequests) {
        return res.status(429).json({
          error: "Too many requests. Please try again later (fallback).",
          retryAfter: Math.ceil((entry.expires - now) / 1000),
        });
      }

      next();
    }
  };
};

module.exports = { rateLimit };
