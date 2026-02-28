const prisma = require("./backend/src/db");
(async () => {
  try {
    const bad = await prisma.sneakerImage.findMany({ where: { url: "" } });
    console.log("empty url count:", bad.length);
    if (bad.length) console.log(bad);
    const nulls =
      await prisma.$queryRaw`SELECT * FROM SneakerImage WHERE url IS NULL`;
    console.log("null url count:", nulls.length);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
