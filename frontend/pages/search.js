import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import Link from "next/link";
import Layout from "../components/Layout";
import SneakerCard from "../components/SneakerCard";
import { API_BASE } from "../lib/api";
import { LoadingSpinner, EmptyState } from "../components/Loading";
import PageHeader from "../components/PageHeader";

const fetcher = async (url) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || (data && data.success === false && data.error)) {
    const err = new Error(
      (data && data.error && data.error.message) || "Failed to fetch products",
    );
    err.status = res.status;
    throw err;
  }
  return data;
};

export default function SearchPage() {
  const router = useRouter();
  const { q } = router.query;
  const searchQuery = (q || "").toLowerCase();

  // local input state for debouncing
  const [inputValue, setInputValue] = useState(q || "");

  // debounce URL update
  useEffect(() => {
    const handler = setTimeout(() => {
      if (inputValue !== q) {
        router.replace(
          { pathname: "/search", query: { q: inputValue } },
          undefined,
          { shallow: true },
        );
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [inputValue, q, router]);

  const { data, isLoading, error } = useSWR(() => {
    let url = `${API_BASE}/api/sneakers?limit=500`;
    if (searchQuery) {
      url += `&search=${encodeURIComponent(searchQuery)}`;
    }
    return url;
  }, fetcher);

  const products = data?.data || data || [];

  function getBrandName(b) {
    if (!b) return "Unknown";
    if (typeof b === "string") return b;
    return b.name || b.brandName || "Unknown";
  }

  // server has already filtered results based on searchQuery
  const filteredProducts = products;

  // Sorting
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
      <PageHeader
        title="Search Results"
        subtitle={searchQuery ? `Results for "${q}"` : "Search our collection"}
        background={true}
      />

      {/* Search Controls */}
      <section className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <span className="text-sm text-gray-600">
              Showing {isLoading ? "..." : filteredProducts.length} products
            </span>
            <input
              type="text"
              placeholder="Search products..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-offset-0"
            />
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
      </section>

      {/* Products Grid */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <LoadingSpinner />
          ) : error ? (
            <EmptyState
              icon="❌"
              title="Something went wrong"
              description={(() => {
                if (error.status === 400)
                  return "Bad request. Please check your input.";
                if (error.status === 401)
                  return "Unauthorized access. Please log in.";
                if (error.status === 403)
                  return "You do not have permission to view this resource.";
                if (error.status === 404)
                  return "Requested resource not found.";
                if (error.status === 429)
                  return "Too many requests. Please try again later.";
                return (
                  error.message || "Unable to load products. Please try again."
                );
              })()}
            />
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="No Products Found"
              description={
                searchQuery
                  ? `We couldn't find any products matching "${q}". Try a different search.`
                  : "Enter a search term to find products."
              }
              action={
                <Link href="/">
                  <button className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                    Back to Home
                  </button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {sortedProducts.map((product) => (
                <SneakerCard key={product.id} s={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
