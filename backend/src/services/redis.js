const Redis = require("ioredis");

let redis = null;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });

  redis.on("error", (err) => {
    console.error("Redis error:", err);
  });
}

module.exports = redis;
