const prisma = require("../src/db");

async function main() {
  console.log("🌱 Seeding database with sample banners and categories...\n");

  try {
    // Categories (upsert by slug)
    const categoriesData = [
      { name: "Men", slug: "men-shoes", icon: "👔", order: 0, featured: true },
      {
        name: "Women",
        slug: "women-shoes",
        icon: "👗",
        order: 1,
        featured: true,
      },
      {
        name: "Kids",
        slug: "kids-shoes",
        icon: "👶",
        order: 2,
        featured: true,
      },
      {
        name: "Sneakers",
        slug: "sneakers",
        icon: "👟",
        order: 3,
        featured: true,
      },
      {
        name: "Sports",
        slug: "sport-shoes",
        icon: "⚽",
        order: 4,
        featured: false,
      },
      {
        name: "Canvas",
        slug: "canvas-shoes",
        icon: "🎨",
        order: 5,
        featured: false,
      },
      {
        name: "Official",
        slug: "official-shoes",
        icon: "⭐",
        order: 6,
        featured: false,
      },
      { name: "Boots", slug: "boots", icon: "🥾", order: 7, featured: false },
      {
        name: "Slip-Ons",
        slug: "slip-on-shoes",
        icon: "🩴",
        order: 8,
        featured: false,
      },
    ];

    for (const c of categoriesData) {
      await prisma.category.upsert({
        where: { slug: c.slug },
        update: {
          name: c.name,
          icon: c.icon,
          order: c.order,
          featured: c.featured,
        },
        create: c,
      });
    }
    console.log(`✅ Ensured ${categoriesData.length} sample categories`);

    // Banners (create if not existing by title — wrapped to ignore failures)
    const bannersData = [
      {
        title: "New Summer Collection",
        subtitle: "Discover the latest kicks",
        description: "Limited edition sneakers for the season",
        imageUrl: "/api/placeholder/1200/500?text=Summer+Collection",
        link: "/categories/sneakers",
        ctaText: "Shop Summer",
        order: 0,
        active: true,
      },
      {
        title: "Premium Brands",
        subtitle: "Exclusive designer sneakers",
        description: "High-end collaborations and limited drops",
        imageUrl: "/api/placeholder/1200/500?text=Premium+Brands",
        link: "/categories/official-shoes",
        ctaText: "View Premium",
        order: 1,
        active: true,
      },
      {
        title: "Athletic Performance",
        subtitle: "Built for athletes",
        description: "Sports-grade technology for maximum comfort",
        imageUrl: "/api/placeholder/1200/500?text=Athletic",
        link: "/categories/sport-shoes",
        ctaText: "Shop Sports",
        order: 2,
        active: true,
      },
      {
        title: "Men's Collection",
        subtitle: "Latest styles for men",
        description: "Trending shoes for the modern man",
        imageUrl: "/api/placeholder/1200/500?text=Mens+Shoes",
        link: "/categories/men-shoes",
        ctaText: "Browse Men",
        order: 3,
        active: true,
      },
    ];

    for (const b of bannersData) {
      try {
        await prisma.banner.create({ data: b });
      } catch (e) {
        // ignore duplicates or other issues
      }
    }
    console.log(`✅ Ensured ${bannersData.length} sample banners`);

    // Mega menu items (create safely)
    const menCat = await prisma.category.findUnique({
      where: { slug: "men-shoes" },
    });
    if (menCat) {
      const menItems = [
        {
          title: "All Men Shoes",
          link: "/categories/men-shoes",
          categoryId: menCat.id,
          order: 0,
        },
        {
          title: "Casual",
          link: "/categories/men-shoes?style=casual",
          categoryId: menCat.id,
          order: 1,
        },
        {
          title: "Formal",
          link: "/categories/men-shoes?style=formal",
          categoryId: menCat.id,
          order: 2,
        },
        {
          title: "Athletic",
          link: "/categories/men-shoes?style=athletic",
          categoryId: menCat.id,
          order: 3,
        },
      ];
      for (const mi of menItems) {
        try {
          await prisma.megaMenuItem.create({ data: mi });
        } catch (e) {
          // ignore duplicates or FK issues
        }
      }
      console.log("✅ Added mega-menu items for Men category");
    }

    const sneakersCat = await prisma.category.findUnique({
      where: { slug: "sneakers" },
    });
    if (sneakersCat) {
      const shoeItems = [
        {
          title: "All Sneakers",
          link: "/categories/sneakers",
          categoryId: sneakersCat.id,
          order: 0,
        },
        {
          title: "Running",
          link: "/categories/sneakers?type=running",
          categoryId: sneakersCat.id,
          order: 1,
        },
        {
          title: "Basketball",
          link: "/categories/sneakers?type=basketball",
          categoryId: sneakersCat.id,
          order: 2,
        },
        {
          title: "Casual",
          link: "/categories/sneakers?type=casual",
          categoryId: sneakersCat.id,
          order: 3,
        },
        {
          title: "Limited Edition",
          link: "/categories/sneakers?type=limited",
          categoryId: sneakersCat.id,
          order: 4,
        },
      ];
      for (const si of shoeItems) {
        try {
          await prisma.megaMenuItem.create({ data: si });
        } catch (e) {
          // ignore duplicates or FK issues
        }
      }
      console.log("✅ Added mega-menu items for Sneakers category");
    }

    console.log("\n✨ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
