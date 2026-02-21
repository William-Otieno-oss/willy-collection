/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "",
  },

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // Cache images for 1 year (immutable assets)
    domains: [
      "images.unsplash.com",
      "localhost",
      "localhost:9000",
      "127.0.0.1:9000",
      "willy-bucket.s3.us-east-1.amazonaws.com",
    ],
  },

  // Compression
  compress: true,
  poweredByHeader: false,

  // Internationalization (optional, for future expansion)
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },

  async rewrites() {
    // In development, proxy /api requests to the backend running on localhost:4000
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:4000/api/:path*",
        },
      ];
    }
    return [];
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Cache-Control",
            value: "public, s-maxage=31536000, immutable",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },
    ];
  },

  // Optimize webpack
  webpack: (config, { isServer }) => {
    config.optimization.minimize = true;
    return config;
  },
};

module.exports = nextConfig;
