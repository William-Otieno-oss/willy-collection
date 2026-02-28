console.log("running check_routes");
const paths = [
  "./src/routes/auth",
  "./src/routes/sneakers",
  "./src/routes/orders",
  "./src/routes/admin",
  "./src/routes/s3",
  "./src/routes/banners",
  "./src/routes/categories",
  "./src/routes/brands",
];
paths.forEach((p) => {
  try {
    const mod = require(p);
    console.log(p, typeof mod, mod && mod.constructor && mod.constructor.name);
    if (mod && typeof mod == "object") {
      console.log("keys", Object.keys(mod));
    }
  } catch (e) {
    console.error("error requiring", p, e);
  }
});
