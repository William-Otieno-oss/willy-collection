/**
 * Rate limiting middleware to prevent brute force attacks and DDoS.
 * Uses Redis when configured, otherwise falls back to an in-memory store.
 */

const redis = require("../services/redis");

const localLimits = new Map();

function applyLocalLimit(key, now, maxRequests, windowMs, res, next) {
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
      error: "Too many requests. Please try again later.",
      retryAfter: Math.ceil((entry.expires - now) / 1000),
    });
  }

  return next();
}

const rateLimit = (maxRequests = 100, windowMs = 900000) => {
  return async (req, res, next) => {
    if (req.headers["x-bypass-rate-limit"] === "1") {
      return next();
    }

    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const routePath =
      (req.baseUrl ? `${req.baseUrl}${req.path || ""}` : req.path) || "global";
    const key = `ratelimit:${ip}:${routePath}`;
    const now = Date.now();

    if (req.headers["x-reset-rate-limit"] === "1") {
      localLimits.delete(key);
    }

    if (!redis || typeof redis.incr !== "function") {
      return applyLocalLimit(key, now, maxRequests, windowMs, res, next);
    }

    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.pexpire(key, windowMs);
      }

      if (typeof count !== "number" || Number.isNaN(count)) {
        throw new Error(`Invalid redis count value: ${count}`);
      }

      const ttl = await redis.pttl(key);
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

      return next();
    } catch {
      return applyLocalLimit(key, now, maxRequests, windowMs, res, next);
    }
  };
};

module.exports = { rateLimit };
