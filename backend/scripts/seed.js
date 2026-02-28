const bcrypt = require("bcrypt");
const prisma = require("../src/db");

async function main() {
  console.log("🌱 Seeding database...\n");

  // Validate required secrets in production
  if (process.env.NODE_ENV === "production") {
    if (!process.env.JWT_SECRET) {
      throw new Error(
        "JWT_SECRET environment variable is required in production",
      );
    }
    if (!process.env.ADMIN_PASSWORD) {
      throw new Error(
        "ADMIN_PASSWORD environment variable is required in production",
      );
    }
  }

  // Seed admin user
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd) {
    throw new Error(
      "ADMIN_PASSWORD environment variable is required for admin user creation",
    );
  }
  // always ensure the admin user exists and update the password when
  // the environment variable changes.  we fetch first so we know which
  // operation happened, letting us log appropriately.
  const existing = await prisma.user.findUnique({ where: { email } });
  const hash = await bcrypt.hash(pwd, 10);
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { password: hash, isAdmin: true },
    });
    console.log("✅ Updated admin password for:", email);
  } else {
    await prisma.user.create({
      data: { email, password: hash, name: "Admin", isAdmin: true },
    });
    console.log("✅ Created admin user:", email);
  }

  // Seed banners
  console.log("Creating banners...");

  // wipe existing banners before inserting so that running the seed
  // repeatedly during development doesn't pile up duplicates.  In
  // production the admin UI would manage banners so this script should
  // only be used for initial setup or testing.
  await prisma.banner.deleteMany({});
  console.log("✅ Cleared existing banners");

  let banners;
  try {
    banners = await prisma.banner.createMany({
      data: [
        {
          title: "New Summer Collection",
          subtitle: "Discover the latest kicks",
          description: "Limited edition sneakers for the season",
          imageUrl:
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=500&fit=crop",
          link: "/categories/sneakers",
          ctaText: "Shop Summer",
          order: 0,
          active: true,
        },
        {
          title: "Premium Brands",
          subtitle: "Exclusive designer sneakers",
          description: "High-end collaborations and limited drops",
          imageUrl:
            "https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=1200&h=500&fit=crop",
          link: "/categories/official-shoes",
          ctaText: "View Premium",
          order: 1,
          active: true,
        },
        {
          title: "Athletic Performance",
          subtitle: "Built for athletes",
          description: "Sports-grade technology for maximum comfort",
          imageUrl:
            "https://images.unsplash.com/photo-1542219550-41c1eb3d4054?w=1200&h=500&fit=crop",
          link: "/categories/sport-shoes",
          ctaText: "Shop Sports",
          order: 2,
          active: true,
        },
        {
          title: "Men's Collection",
          subtitle: "Latest styles for men",
          description: "Trending shoes for the modern man",
          imageUrl:
            "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=1200&h=500&fit=crop",
          link: "/categories/men-shoes",
          ctaText: "Browse Men",
          order: 3,
          active: true,
        },
      ],
    });
    console.log(`✅ Created ${banners.count} banners`);
  } catch (err) {
    if (err.code === "P2002") {
      console.warn("Some banners already exist, skipping duplicates");
    } else {
      console.warn("Banner creation error", { message: err.message });
    }
  }

  // Seed categories
  console.log("Creating categories...");
  let categories;
  try {
    categories = await prisma.category.createMany({
      data: [
        {
          name: "Men",
          slug: "men-shoes",
          icon: "👔",
          order: 0,
          featured: true,
        },
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
      ],
    });
    console.log(`✅ Created ${categories.count} categories`);
  } catch (err) {
    if (err.code === "P2002") {
      console.warn("Some categories already exist, skipping duplicates");
    } else {
      console.warn("Category creation error", { message: err.message });
    }
  }

  // Seed brands
  console.log("Creating brands...");
  let brands;
  try {
    brands = await prisma.brand.createMany({
      data: [
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
      ],
    });
    console.log(`✅ Created ${brands.count} brands`);
  } catch (err) {
    if (err.code === "P2002") {
      console.warn("Some brands already exist, skipping duplicates");
    } else {
      console.warn("Brand creation error", { message: err.message });
    }
  }

  // seed a few sample sneakers so that catalog filter tests return data
  console.log("Creating sample sneakers...");
  const existingSneaks = await prisma.sneaker.count();
  if (existingSneaks === 0) {
    // pick first brand id (if exists) or default 1
    const firstBrand = await prisma.brand.findFirst();
    const brandId = firstBrand ? firstBrand.id : 1;
    await prisma.sneaker.createMany({
      data: [
        {
          brandId,
          modelName: "Sample Sneaker One",
          slug: "sample-sneaker-one",
          description: "A test sneaker for demo purposes",
          price: 99.99,
          categories: JSON.stringify(["sneakers"]),
          colors: JSON.stringify(["red", "white"]),
          featured: true,
          inStock: true,
        },
        {
          brandId,
          modelName: "Sample Sneaker Two",
          slug: "sample-sneaker-two",
          description: "Another demo sneaker",
          price: 149.5,
          categories: JSON.stringify(["sneakers"]),
          colors: JSON.stringify(["black"]),
          featured: false,
          inStock: true,
        },
      ],
    });
    console.log("✅ Created sample sneakers");
  } else {
    console.log("✅ Sneakers already present, skipping sample generation");
  }

  // Seed sizes if they don't exist
  console.log("Creating shoe sizes...");
  const existingSizes = await prisma.size.count();
  if (existingSizes === 0) {
    const sizeNames = [
      "35",
      "36",
      "37",
      "38",
      "39",
      "40",
      "41",
      "42",
      "43",
      "44",
      "45",
      "46",
    ];
    await prisma.size.createMany({
      data: sizeNames.map((name) => ({ name })),
    });
    console.log(`✅ Created ${sizeNames.length} shoe sizes`);
  } else {
    console.log("✅ Shoe sizes already present, skipping");
  }

  // Seed stocks for all sneakers if none exist
  console.log("Creating stock records for sneakers...");
  const existingStocks = await prisma.stock.count();
  if (existingStocks === 0) {
    const allSneakers = await prisma.sneaker.findMany();
    const allSizes = await prisma.size.findMany();

    if (allSneakers.length > 0 && allSizes.length > 0) {
      const stockData = [];
      for (const sneaker of allSneakers) {
        // Create stock for sizes 38-44 for each sneaker with 10 units each
        for (const size of allSizes.slice(3, 9)) {
          // sizes 38-44 (index 3-9)
          stockData.push({
            sneakerId: sneaker.id,
            sizeId: size.id,
            quantity: 10,
          });
        }
      }
      if (stockData.length > 0) {
        await prisma.stock.createMany({
          data: stockData,
        });
        console.log(`✅ Created ${stockData.length} stock records`);
      }
    }
  } else {
    console.log("✅ Stock records already present, skipping");
  }

  // Add mega-menu items for Men
  const menCat = await prisma.category.findUnique({
    where: { slug: "men-shoes" },
  });

  if (menCat) {
    await prisma.megaMenuItem.deleteMany({ where: { categoryId: menCat.id } });
    await prisma.megaMenuItem.createMany({
      data: [
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
      ],
    });
  }

  // Add mega-menu items for Sneakers
  const sneakersCat = await prisma.category.findUnique({
    where: { slug: "sneakers" },
  });

  if (sneakersCat) {
    await prisma.megaMenuItem.deleteMany({
      where: { categoryId: sneakersCat.id },
    });
    await prisma.megaMenuItem.createMany({
      data: [
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
      ],
    });
  }

  console.log("\n✨ Database seeding completed successfully!");
}

// export main so that other modules (like server startup) can invoke it
module.exports = { main };

// If the script is run directly (node backend/scripts/seed.js), execute it
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
