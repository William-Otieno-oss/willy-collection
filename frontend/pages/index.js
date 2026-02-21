import { useMemo } from "react";
import dynamic from "next/dynamic";
import useSWR from "swr";
import Link from "next/link";
import Layout from "../components/Layout";
import SneakerCard from "../components/SneakerCard";
import HeroCarousel from "../components/HeroCarousel";
import { API_BASE } from "../lib/api";

// Dynamic imports for below-fold sections to reduce critical path
const TrendingSection = dynamic(
  () => import("../components/TrendingSection").then((mod) => mod.default),
  { loading: () => <div className="h-96 bg-gray-50" />, ssr: true },
);

const OffersSection = dynamic(
  () => import("../components/OffersSection").then((mod) => mod.default),
  { loading: () => <div className="h-96 bg-white" />, ssr: true },
);

const BrandSection = dynamic(
  () => import("../components/BrandSection").then((mod) => mod.default),
  { loading: () => <div className="h-80 bg-white" />, ssr: true },
);

const fetcher = (url) =>
  fetch(url).then(async (r) => {
    if (!r.ok) {
      const text = await r.text().catch(() => "<no body>");
      // Error handled by API client
      return [];
    }
    const payload = await r.json().catch(() => null);
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
  });

export default function Home() {
  const { data } = useSWR(`${API_BASE}/api/sneakers`, fetcher);
  const sneakers = Array.isArray(data)
    ? data
    : data && Array.isArray(data.data)
      ? data.data
      : [];

  const trending = useMemo(
    () => (Array.isArray(sneakers) ? sneakers.slice(0, 12) : []),
    [sneakers],
  );
  const offers = useMemo(
    () =>
      Array.isArray(sneakers)
        ? sneakers.filter((s) => s.onSale).slice(0, 12)
        : [],
    [sneakers],
  );

  const brands = [
    {
      category: "Sneakers",
      items: [
        { name: "Nike", slug: "nike-shoes" },
        { name: "Adidas Shoes", slug: "adidas-shoes" },
        { name: "Puma", slug: "puma-shoes" },
        { name: "Vans", slug: "vans" },
        { name: "New Balance", slug: "new-balance-shoes" },
        { name: "FILA", slug: "fila-shoes" },
      ],
    },
    {
      category: "Boots",
      items: [
        { name: "Timberland", slug: "timberland-shoes" },
        { name: "Clarks", slug: "clark-shoes" },
        { name: "Prada", slug: "prada" },
        { name: "Delta", slug: "delta-shoes" },
      ],
    },
    { category: "Sports", items: [{ name: "Reebok", slug: "reebok-shoes" }] },
  ];

  const categories = [
    { name: "Men", slug: "men-shoes" },
    { name: "Women", slug: "women-shoes" },
    { name: "Kids", slug: "kids-shoes" },
    { name: "Sneakers", slug: "sneakers" },
    { name: "Sports", slug: "sport-shoes" },
    { name: "Canvas", slug: "canvas-shoes" },
    { name: "Official", slug: "official-shoes" },
    { name: "Boots", slug: "boots" },
    { name: "Slip-Ons", slug: "slip-on-shoes" },
  ];

  return (
    <Layout>
      {/* Hero Section with API-driven Carousel and Category Sidebar */}
      <HeroCarousel />

      {/* Feature Strip - Modern Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 py-20 max-w-7xl mx-auto">
        {[
          {
            icon: "⚡",
            title: "Fast Delivery",
            description:
              "30-45 mins delivery. Same-day delivery available in Nairobi",
          },
          {
            icon: "💳",
            title: "Flexible Payment",
            description:
              "Multiple payment options including M-Pesa & cash on delivery",
          },
          {
            icon: "💬",
            title: "Dedicated Support",
            description:
              "24/7 support for orders, recommendations & assistance",
          },
        ].map((feature, idx) => (
          <div
            key={idx}
            className="group p-8 bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-100 hover:border-accent hover:shadow-xl transition-all duration-500 hover:-translate-y-2"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
              {feature.icon}
            </div>
            <h3
              className="font-display font-bold text-lg mb-3"
              style={{ color: "#1c140c" }}
            >
              {feature.title}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </section>

      {/* Dynamically loaded below-fold sections for better LCP */}
      <TrendingSection />
      <OffersSection />
      <BrandSection brands={brands} />

      {/* Support/Contact CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            Questions About Your Next Kicks?
          </h2>
          <p className="text-gray-300 text-lg mb-10">
            Our sneaker experts are ready to help you find the perfect fit
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:+254797062606">
              <button className="px-8 py-4 bg-accent hover:bg-orange-600 text-gray-900 font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg inline-flex items-center gap-2">
                <span>📞</span>
                <span>Call Us Now</span>
              </button>
            </a>
            <a href="https://wa.me/254797062606">
              <button className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg inline-flex items-center gap-2">
                <span>💬</span>
                <span>WhatsApp</span>
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-4xl font-display font-bold mb-12 text-center"
            style={{ color: "#1c140c" }}
          >
            Why Choose willy COLLECTION?
          </h2>
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-xl border border-gray-100 hover:border-accent hover:shadow-lg transition-all duration-300">
              <h3
                className="font-display font-bold text-xl mb-3"
                style={{ color: "#1c140c" }}
              >
                🛍️ Widest Selection
              </h3>
              <p className="text-gray-700">
                Explore hundreds of authentic sneaker styles from top global
                brands. From classic Air Force 1s to limited edition releases.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl border border-gray-100 hover:border-accent hover:shadow-lg transition-all duration-300">
              <h3
                className="font-display font-bold text-xl mb-3"
                style={{ color: "#1c140c" }}
              >
                ⚡ Easy & Fast
              </h3>
              <p className="text-gray-700">
                User-friendly website with seamless checkout. Get your kicks
                delivered fast—same-day delivery available in Nairobi.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl border border-gray-100 hover:border-accent hover:shadow-lg transition-all duration-300">
              <h3
                className="font-display font-bold text-xl mb-3"
                style={{ color: "#1c140c" }}
              >
                🚚 Flexible Delivery
              </h3>
              <p className="text-gray-700">
                Choose nationwide delivery, same-day delivery in Nairobi, or
                pick-up options. Available 8 AM - 8 PM daily.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl border border-gray-100 hover:border-accent hover:shadow-lg transition-all duration-300">
              <h3
                className="font-display font-bold text-xl mb-3"
                style={{ color: "#1c140c" }}
              >
                💰 Multiple Payment Options
              </h3>
              <p className="text-gray-700">
                M-Pesa, cash on delivery, and more. Pay securely with minimal
                friction. All transactions protected.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
