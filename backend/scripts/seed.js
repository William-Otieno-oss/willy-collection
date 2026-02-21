const bcrypt = require("bcrypt");
const prisma = require("../src/db");

async function main() {
  console.log("🌱 Seeding database...\n");

  // Seed admin user
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const pwd = process.env.ADMIN_PASSWORD || "password123";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const hash = await bcrypt.hash(pwd, 10);
    await prisma.user.create({
      data: { email, password: hash, name: "Admin", isAdmin: true },
    });
    console.log("✅ Created admin user:", email);
  } else {
    console.log("✅ Admin already exists:", email);
  }

  // Seed banners
  console.log("Creating banners...");
  await prisma.banner.deleteMany({});
  const banners = await prisma.banner.createMany({
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

  // Seed categories
  console.log("Creating categories...");
  await prisma.category.deleteMany({});
  const categories = await prisma.category.createMany({
    data: [
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
    ],
  });
  console.log(`✅ Created ${categories.count} categories`);

  // Seed brands
  console.log("Creating brands...");
  await prisma.brand.deleteMany({});
  const brands = await prisma.brand.createMany({
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

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
