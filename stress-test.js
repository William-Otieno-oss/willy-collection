/**
 * Stress Test Suite for Willy Collection E-commerce Platform
 * Tests critical endpoints under load
 *
 * Run: node stress-test.js
 * Customise: modify CONCURRENT_USERS, DURATION_SECONDS below
 */

const http = require("http");
const https = require("https");

const BASE_URL = "http://localhost:3000";
const API_BASE = "http://localhost:4000/api";

// Configuration
const CONCURRENT_USERS = 10;
const DURATION_SECONDS = 30;
const REQUEST_TIMEOUT = 5000;

// Metrics
let totalRequests = 0;
let successRequests = 0;
let failedRequests = 0;
let totalTime = 0;
let responseTimes = [];

// Test scenarios
const scenarios = [
  {
    name: "Root page load",
    method: "GET",
    url: BASE_URL + "/",
    weight: 3, // higher weight = more frequent
  },
  {
    name: "List sneakers",
    method: "GET",
    url: API_BASE + "/sneakers?limit=12",
    weight: 3,
  },
  {
    name: "Search products",
    method: "GET",
    url: API_BASE + "/sneakers?search=nike&limit=12",
    weight: 2,
  },
  {
    name: "Get product details",
    method: "GET",
    url: API_BASE + "/sneakers/nike-santoni",
    weight: 2,
  },
  {
    name: "Filter by category",
    method: "GET",
    url: API_BASE + "/sneakers?category=men-shoes&limit=12",
    weight: 2,
  },
  {
    name: "Get categories",
    method: "GET",
    url: API_BASE + "/categories",
    weight: 1,
  },
  {
    name: "Get brands",
    method: "GET",
    url: API_BASE + "/brands",
    weight: 1,
  },
  {
    name: "Health check",
    method: "GET",
    url: API_BASE + "/health",
    weight: 1,
  },
];

// Weighted random scenario selection
function getRandomScenario() {
  const totalWeight = scenarios.reduce((s, sc) => s + sc.weight, 0);
  let random = Math.random() * totalWeight;
  for (const scenario of scenarios) {
    random -= scenario.weight;
    if (random <= 0) return scenario;
  }
  return scenarios[0];
}

// Make HTTP request
function makeRequest(scenario) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const url = new URL(scenario.url);
    const protocol = url.protocol === "https:" ? https : http;

    const req = protocol.request(
      url,
      {
        method: scenario.method,
        headers: {
          "User-Agent": "StressTest/1.0",
        },
        timeout: REQUEST_TIMEOUT,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          const duration = Date.now() - startTime;
          resolve({
            status: res.statusCode,
            duration,
            success: res.statusCode >= 200 && res.statusCode < 300,
          });
        });
      },
    );

    req.on("error", () => {
      const duration = Date.now() - startTime;
      resolve({ status: 0, duration, success: false });
    });

    req.on("timeout", () => {
      req.destroy();
      const duration = Date.now() - startTime;
      resolve({ status: 0, duration, success: false });
    });

    req.end();
  });
}

// Worker function for simulating concurrent user
async function worker(userId, duration) {
  const endTime = Date.now() + duration;
  while (Date.now() < endTime) {
    const scenario = getRandomScenario();
    const result = await makeRequest(scenario);

    totalRequests++;
    if (result.success) {
      successRequests++;
    } else {
      failedRequests++;
    }
    responseTimes.push(result.duration);
    totalTime += result.duration;

    // Add small delay between requests (100-500ms)
    await new Promise((resolve) =>
      setTimeout(resolve, 100 + Math.random() * 400),
    );
  }
}

// Calculate statistics
function calculateStats() {
  const sorted = responseTimes.sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = totalTime / totalRequests;
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];

  return { min, max, avg, p50, p95, p99 };
}

// Main test execution
async function runStressTest() {
  console.log("\n🔥 Willy Collection E-commerce Stress Test");
  console.log("═".repeat(60));
  console.log(`Configuration:`);
  console.log(`  Concurrent Users: ${CONCURRENT_USERS}`);
  console.log(`  Duration: ${DURATION_SECONDS}s`);
  console.log(`  API Base: ${API_BASE}`);
  console.log(`  Total Scenarios: ${scenarios.length}`);
  console.log("═".repeat(60));
  console.log("\n⏳ Starting test...\n");

  const startTime = Date.now();

  // Start workers
  const workers = [];
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    workers.push(
      worker(i, DURATION_SECONDS * 1000).catch((err) =>
        console.error(`Worker ${i} error:`, err.message),
      ),
    );
  }

  // Wait for all workers to complete
  await Promise.all(workers);
  const totalDuration = Date.now() - startTime;

  // Calculate and display results
  const stats = calculateStats();
  const throughput = (totalRequests / (totalDuration / 1000)).toFixed(2);
  const successRate = ((successRequests / totalRequests) * 100).toFixed(2);

  console.log("\n📊 Test Results");
  console.log("═".repeat(60));
  console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Successful: ${successRequests} (${successRate}%)`);
  console.log(`Failed: ${failedRequests}`);
  console.log(`Throughput: ${throughput} req/s`);
  console.log("═".repeat(60));

  console.log("\n⏱️  Response Times (ms)");
  console.log("═".repeat(60));
  console.log(`Min: ${stats.min.toFixed(2)}`);
  console.log(`Max: ${stats.max.toFixed(2)}`);
  console.log(`Avg: ${stats.avg.toFixed(2)}`);
  console.log(`P50 (median): ${stats.p50.toFixed(2)}`);
  console.log(`P95: ${stats.p95.toFixed(2)}`);
  console.log(`P99: ${stats.p99.toFixed(2)}`);
  console.log("═".repeat(60));

  // Performance assessment
  console.log("\n🎯 Performance Assessment");
  console.log("═".repeat(60));

  const assessments = [];
  if (stats.avg < 200) assessments.push("✅ Average response time: Excellent");
  else if (stats.avg < 500) assessments.push("✅ Average response time: Good");
  else if (stats.avg < 1000)
    assessments.push("⚠️  Average response time: Fair");
  else assessments.push("❌ Average response time: Poor");

  if (successRate >= 99) assessments.push("✅ Success rate: Excellent");
  else if (successRate >= 95) assessments.push("✅ Success rate: Good");
  else if (successRate >= 90) assessments.push("⚠️  Success rate: Fair");
  else assessments.push("❌ Success rate: Poor");

  if (stats.p99 < 2000) assessments.push("✅ P99 latency: Excellent");
  else if (stats.p99 < 5000) assessments.push("✅ P99 latency: Good");
  else assessments.push("⚠️  P99 latency: Could improve");

  if (throughput > 20)
    assessments.push(`✅ Throughput (${throughput} req/s): Good`);
  else if (throughput > 10)
    assessments.push(`⚠️  Throughput (${throughput} req/s): Fair`);
  else assessments.push(`❌ Throughput (${throughput} req/s): Poor`);

  assessments.forEach((a) => console.log(a));
  console.log("═".repeat(60) + "\n");
}

// Run test
runStressTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
