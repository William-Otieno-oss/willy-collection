// Redis client singleton for rate limiting and other features
const Redis = require("ioredis");

// Only instantiate a real Redis client in production environments; in
// development or CI we prefer not to depend on a running Redis server at
// all because it frequently isn't available.  The rate limit middleware
// already has an in‑memory fallback, so it's safe to export a dummy stub.
let redis;
if (process.env.NODE_ENV === "production") {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });

  redis.on("error", (err) => {
    // Log errors in production so we can alert/monitor
    console.error("Redis error:", err);
  });
} else {
  // stub object with the methods used by rate limiter; they will throw if
  // accidentally invoked, which will trigger the in‑memory fallback.
  const noop = async () => {
    throw new Error("Redis client not available in non-production");
  };
  redis = {
    incr: noop,
    pexpire: noop,
    pttl: noop,
  };
}

module.exports = redis;
