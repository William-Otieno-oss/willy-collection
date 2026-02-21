// All images from /public/logo directory with category mapping
// Auto-generated list of available sneaker images for carousel

export const logoImagesWithCategories = [
  { name: "adidas-ad2000.webp", category: "Men" },
  { name: "adidas-campus-black.webp", category: "Men" },
  { name: "adidas-gazelle-blue.webp", category: "Women" },
  { name: "adidas-stan-smith-sneakers.webp", category: "Sneakers" },
  { name: "adidas-superstar.webp", category: "Men" },
  { name: "air-force-1-black-and-white.webp", category: "Sneakers" },
  { name: "air-force-1-high-tops-black.webp", category: "Men" },
  { name: "air-force-1-louis-vuitton.webp", category: "Official" },
  { name: "air-jordan-1-retro-travis-scott.webp", category: "Sneakers" },
  { name: "air-jordan-1-low-concord.webp", category: "Men" },
  { name: "air-jordan-1-midnight-navy.webp", category: "Sneakers" },
  { name: "air-jordan-11-black.webp", category: "Sports" },
  { name: "air-jordan-11-bred.webp", category: "Sports" },
  { name: "air-jordan-3-fragment.webp", category: "Sneakers" },
  { name: "air-jordan-4-cactus-jack.webp", category: "Men" },
  { name: "air-jordan-6-retro-mvp.webp", category: "Sports" },
  { name: "air-max-270-cactus-trails.webp", category: "Women" },
  { name: "air-max-90-black.webp", category: "Sneakers" },
  { name: "air-max-90-cool-grey_4xHn.webp", category: "Men" },
  { name: "air-max-90-grey.webp", category: "Canvas" },
  { name: "air-max-95-sketch_iVO.webp", category: "Sneakers" },
  { name: "air-max-97-black.webp", category: "Men" },
  { name: "air-max-97-silver-bullet.webp", category: "Sneakers" },
  { name: "alexander-mcqueen.webp", category: "Official" },
  { name: "bape-sta-green.webp", category: "Men" },
  { name: "bape-sta-shoes.webp", category: "Sneakers" },
  { name: "dior-b30.webp", category: "Official" },
  { name: "dior-homme.webp", category: "Men" },
  { name: "dunk-low-grey-fog.webp", category: "Sneakers" },
  { name: "new-balance-550.webp", category: "Women" },
  { name: "new-balance-9060.webp", category: "Sneakers" },
  { name: "nike-air-force-1-black-white.webp", category: "Canvas" },
  { name: "nike-air-max-270.webp", category: "Women" },
  { name: "nike-dunk-low.webp", category: "Sneakers" },
  { name: "nike-sb-dunk-low-blue-lobster.webp", category: "Sports" },
  { name: "puma-cali-sneakers.webp", category: "Canvas" },
  { name: "jordan-4-off-white.webp", category: "Official" },
  { name: "lanvin-air-force-1.webp", category: "Official" },
  { name: "louis-vuitton-trainer_8V7.webp", category: "Official" },
  { name: "nike-shox.webp", category: "Sports" },
  { name: "prada-cloudburst-thunder.webp", category: "Official" },
  { name: "air-jordan-4-red-thunder_qtV.webp", category: "Men" },
  { name: "nike-tn.webp", category: "Canvas" },
  { name: "versace-sneakers.webp", category: "Official" },
  { name: "yezzy-700.webp", category: "Men" },
];

export const generateSlides = (category = null) => {
  const imagesToUse = category
    ? logoImagesWithCategories.filter((img) => img.category === category)
    : logoImagesWithCategories;

  const collectionTitles = [
    "Premium Collection",
    "Summer Glory",
    "Limited Edition",
    "Exclusive Drops",
    "Classic Kicks",
    "Street Style",
    "Performance Gear",
    "Vintage Vibes",
    "Urban Heat",
    "Elite Selection",
  ];

  const collectionSubtitles = [
    "Exclusive sneaker styles",
    "New arrivals this season",
    "Rare & exclusive kicks",
    "Just released",
    "Timeless favorites",
    "Fresh on the streets",
    "Built for action",
    "Retro classics",
    "City curated picks",
    "Premium selection",
  ];

  const ctaTexts = [
    "Shop Now",
    "View Collection",
    "Explore",
    "Get Now",
    "Discover",
  ];
  const links = [
    "/offers",
    "/categories/sneakers",
    "/brands",
    "/offers",
    "/categories/sneakers",
  ];

  return imagesToUse.map((img, idx) => ({
    id: idx + 1,
    title: collectionTitles[idx % collectionTitles.length],
    subtitle: collectionSubtitles[idx % collectionSubtitles.length],
    cta: ctaTexts[idx % ctaTexts.length],
    link: links[idx % links.length],
    image: `/logo/${img.name}`,
    category: img.category,
  }));
};
