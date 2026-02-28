#!/usr/bin/env node

/**
 * Production Deployment Helper for Willy Collection
 * Deploys and manages both backend and frontend services
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const config = {
  backendPort: 4000,
  frontendPort: 3000,
  env: process.env.NODE_ENV || "production",
  dbPath: "./backend/dev.db",
};

console.log("🚀 Willy Collection - Production Deployment");
console.log(`📦 Environment: ${config.env}`);
console.log(`🔧 Backend Port: ${config.backendPort}`);
console.log(`🎨 Frontend Port: ${config.frontendPort}`);
console.log("");

// Start backend
console.log("▶️  Starting backend API server...");
const backendEnv = {
  ...process.env,
  NODE_ENV: config.env,
  PORT: config.backendPort,
  DATABASE_URL: `file:${config.dbPath}`,
};

const backend = spawn("npm", ["run", "start"], {
  cwd: path.join(__dirname, "backend"),
  env: backendEnv,
  stdio: "inherit",
});

backend.on("error", (err) => {
  console.error("❌ Backend failed to start:", err.message);
  process.exit(1);
});

// Wait before starting frontend
setTimeout(() => {
  console.log("\n▶️  Starting frontend server...");
  const frontendEnv = {
    ...process.env,
    NODE_ENV: config.env,
    NEXT_PUBLIC_API_URL: `http://localhost:${config.backendPort}`,
  };

  const frontend = spawn("npm", ["run", "build"], {
    cwd: path.join(__dirname, "frontend"),
    env: frontendEnv,
    stdio: "inherit",
  });

  frontend.on("close", (code) => {
    if (code !== 0) {
      console.error("❌ Frontend build failed");
      process.exit(1);
    }

    console.log("\n📦 Frontend build complete. Starting server...");
    const serve = spawn("npm", ["run", "start"], {
      cwd: path.join(__dirname, "frontend"),
      env: frontendEnv,
      stdio: "inherit",
    });

    serve.on("error", (err) => {
      console.error("❌ Frontend failed to start:", err.message);
      process.exit(1);
    });
  });
}, 3000);

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n🛑 Shutting down gracefully...");
  backend.kill();
  process.exit(0);
});

console.log("✅ Deployment initialized");
console.log(`🌐 Frontend: http://localhost:${config.frontendPort}`);
console.log(`📡 Backend: http://localhost:${config.backendPort}`);
console.log("");
