/**
 * Basic smoke tests for the API
 * Tests core endpoints to verify runtime functionality
 */
const http = require("http");

const BASE_URL = "http://localhost:4000";

async function makeRequest(path, method = "GET") {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.end();
  });
}

async function runTests() {
  console.log("🧪 Running API smoke tests...\n");

  const tests = [
    {
      name: "Health Check",
      path: "/api/health",
      expectedStatus: 200,
    },
    {
      name: "GET /api/sneakers",
      path: "/api/sneakers",
      expectedStatus: 200,
    },
    {
      name: "GET /api/categories",
      path: "/api/categories",
      expectedStatus: 200,
    },
    {
      name: "GET /api/brands",
      path: "/api/brands",
      expectedStatus: 200,
    },
    {
      name: "GET /api/banners",
      path: "/api/banners",
      expectedStatus: 200,
    },
    {
      name: "404 Not Found",
      path: "/api/nonexistent",
      expectedStatus: 404,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await makeRequest(test.path);
      if (result.status === test.expectedStatus) {
        console.log(`✅ ${test.name} (${result.status})`);
        passed++;
      } else {
        console.log(
          `❌ ${test.name} - Expected ${test.expectedStatus}, got ${result.status}`,
        );
        failed++;
      }
    } catch (err) {
      console.log(`❌ ${test.name} - Error: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  process.exit(failed > 0 ? 1 : 0);
}

// Wait a bit for server to be ready, then run tests
setTimeout(runTests, 2000);
