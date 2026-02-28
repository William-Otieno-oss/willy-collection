const { PrismaClient } = require("@prisma/client");
(async () => {
  const p = new PrismaClient();
  const cats = await p.category.findMany({ include: { megaMenuItems: true } });
  console.log(JSON.stringify(cats, null, 2));
  await p.$disconnect();
})();
