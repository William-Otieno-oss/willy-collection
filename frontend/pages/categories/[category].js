import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState } from "react";
import Layout from "../../components/Layout";
import SneakerCard from "../../components/SneakerCard";
import { API_BASE } from "../../lib/api";

const fetcher = (url) => fetch(url).then((r) => r.json());

const categoryMap = {
  "men-shoes": { name: "Men", query: "Men" },
  "women-shoes": { name: "Women", query: "Women" },
  "kids-shoes": { name: "Kids", query: "Kids" },
  sneakers: { name: "Sneakers", query: "Sneaker" },
  "sport-shoes": { name: "Sports", query: "Sport" },
  "canvas-shoes": { name: "Canvas", query: "Canvas" },
  "official-shoes": { name: "Official", query: "Official" },
  boots: { name: "Boots", query: "Boot" },
  "slip-on-shoes": { name: "Slip-Ons", query: "Slip" },
};

export default function CategoryPage() {
  const router = useRouter();
  const { category } = router.query;
  const categoryInfo = categoryMap[category] || { name: "Products", query: "" };

  // fetch products from the server with a category filter so we don’t rely on
  // the client-side substring logic, which can accidentally drop items when
  // case/spacing is off or the JSON format varies.
  const queryParam = categoryInfo.query
    ? `?category=${encodeURIComponent(categoryInfo.query)}`
    : "";
  const { data } = useSWR(`${API_BASE}/api/sneakers${queryParam}`, fetcher);
  const products = Array.isArray(data)
    ? data
    : data && Array.isArray(data.data)
      ? data.data
      : [];

  function getBrandName(b) {
    if (!b) return "";
    return typeof b === "object" ? b.name : b;
  }

  // server already applied the category filter; no need to reevaluate here
  const filteredProducts = products;

  // Sorting and filtering state could be added here
  const [sortBy, setSortBy] = useState("recent");

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return (a.price || 0) - (b.price || 0);
      case "price-high":
        return (b.price || 0) - (a.price || 0);
      case "popular":
        return (b.views || 0) - (a.views || 0);
      case "recent":
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  return (
    <Layout>
      {/* Category Header */}
      <div className="bg-gray-50 py-12 px-4 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-brand-dark">
            {categoryInfo.name}
          </h1>
          <div className="flex items-center text-sm text-gray-600">
            <Link href="/" className="cursor-pointer hover:text-gray-900">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span>{categoryInfo.name}</span>
          </div>
        </div>
      </div>

      {/* Filters and Sorting Bar */}
      <div className="bg-white border-b border-gray-200 py-4 px-4 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-600">
              Showing {filteredProducts.length} products
            </span>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm px-4 py-2 border border-gray-300 rounded hover:border-gray-400 transition-colors"
            >
              <option value="recent">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sortedProducts.map((product) => (
                <SneakerCard key={product.id} s={product} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="text-gray-600 text-lg mb-4">
                No products found in this category
              </p>
              <Link href="/" legacyBehavior>
                <a className="inline-block px-6 py-2 rounded font-semibold transition-opacity hover:opacity-90 bg-brand text-brand-dark">
                  Continue Shopping
                </a>
              </Link>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

// Create static paths for all categories
export async function getStaticProps({ params }) {
  return {
    props: {},
    revalidate: 60,
  };
}

export async function getStaticPaths() {
  const paths = Object.keys(categoryMap).map((category) => ({
    params: { category },
  }));

  return {
    paths,
    fallback: true,
  };
}
