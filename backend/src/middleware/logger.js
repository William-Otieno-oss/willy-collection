/**
 * Structured logging middleware
 * Provides consistent logging format and levels
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const currentLogLevel =
  LOG_LEVELS[process.env.LOG_LEVEL || "INFO"] || LOG_LEVELS.INFO;

function formatLog(level, message, data = {}) {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
  };
}

const logger = {
  error: (message, data = {}) => {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error(JSON.stringify(formatLog("ERROR", message, data)));
    }
  },

  warn: (message, data = {}) => {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn(JSON.stringify(formatLog("WARN", message, data)));
    }
  },

  info: (message, data = {}) => {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.log(JSON.stringify(formatLog("INFO", message, data)));
    }
  },

  debug: (message, data = {}) => {
    if (currentLogLevel >= LOG_LEVELS.DEBUG && process.env.NODE_ENV !== "production") {
      console.log(JSON.stringify(formatLog("DEBUG", message, data)));
    }
  },

  request: (req, res, next) => {
    const start = Date.now();
    const originalJson = res.json;

    res.json = function (data) {
      const duration = Date.now() - start;
      logger.info("HTTP Request", {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip || req.connection.remoteAddress,
      });
      return originalJson.call(this, data);
    };

    next();
  },
};

module.exports = logger;
