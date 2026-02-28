const rateLimit = require("./src/middleware/rateLimit").rateLimit;
let calledNext = false;
let req = {
  headers: {},
  ip: "127.0.0.1",
  connection: { remoteAddress: "127.0.0.1" },
  baseUrl: "",
  path: "/api/sneakers",
};
let res = {
  setHeader: () => {},
  status: (code) => ({
    json: (d) => {
      console.log("json", code, d);
      return res;
    },
  }),
};
async function runTest() {
  const middleware = rateLimit(100, 900000);
  await middleware(req, res, () => {
    calledNext = true;
    console.log("next executed");
  });
  console.log("done, calledNext=", calledNext);
}
runTest();
