// simple script to insert a payment (for testing)
const { PrismaClient } = require("@prisma/client");
(async () => {
  const p = new PrismaClient();
  try {
    const rec = await p.payment.create({
      data: {
        orderId: 1,
        mpesaNumber: "0700000000",
        amount: 100,
        checkoutRequestId: "TEST123",
      },
    });
    console.log("created", rec);
  } catch (e) {
    console.error("err", e.message);
  } finally {
    await p.$disconnect();
  }
})();
