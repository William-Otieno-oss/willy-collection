const prisma = require("../src/db");

async function main() {
  console.log("🌱 Seeding brands (safe)...\n");

  try {
    const data = [
      {
        name: "Nike",
        slug: "nike",
        description: "Nike: Just Do It",
        order: 0,
        featured: true,
      },
      {
        name: "Adidas",
        slug: "adidas",
        description: "Adidas: Impossible is Nothing",
        order: 1,
        featured: true,
      },
      {
        name: "Puma",
        slug: "puma",
        description: "Puma: Forever Faster",
        order: 2,
        featured: true,
      },
      {
        name: "New Balance",
        slug: "new-balance",
        description: "New Balance: Wear Your Greatness",
        order: 3,
        featured: true,
      },
      {
        name: "Vans",
        slug: "vans",
        description: "Vans: Off The Wall",
        order: 4,
        featured: false,
      },
    ];

    let created = 0;
    for (const b of data) {
      await prisma.brand.upsert({
        where: { slug: b.slug },
        update: {
          name: b.name,
          description: b.description,
          order: b.order,
          featured: b.featured,
        },
        create: b,
      });
      created += 1;
    }

    console.log(`✅ Upserted ${created} brands`);
  } catch (err) {
    console.error("Error seeding brands:", err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
