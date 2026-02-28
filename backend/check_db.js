const { PrismaClient } = require("@prisma/client");
(async () => {
  const p = new PrismaClient();
  try {
    console.log("connecting");
    const rows = await p.order.findMany();
    console.log("orders", rows);
    const pays = await p.payment.findMany();
    console.log("payments", pays);
  } catch (e) {
    console.error("error", e);
  } finally {
    await p.$disconnect();
  }
})();
