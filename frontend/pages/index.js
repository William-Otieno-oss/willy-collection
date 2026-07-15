import dynamic from "next/dynamic";
import useSWR from "swr";
import Layout from "../components/Layout";
import HeroCarousel from "../components/HeroCarousel";
import { fetcher } from "../lib/api";

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
  {
    category: "Sports",
    items: [{ name: "Reebok", slug: "reebok-shoes" }],
  },
];

const features = [
  {
    label: "01",
    title: "Fast Delivery",
    description: "30-45 min delivery. Same-day available in Nairobi.",
  },
  {
    label: "02",
    title: "Secure Payments",
    description:
      "M-Pesa, cash on delivery, and more. All transactions protected.",
  },
  {
    label: "03",
    title: "Expert Support",
    description: "24/7 support. Our team helps you find the perfect fit.",
  },
];

const reasons = [
  {
    title: "Curated Selection",
    description:
      "Hundreds of authentic sneaker styles from elite global brands. From timeless classics to limited drops.",
  },
  {
    title: "Seamless Experience",
    description:
      "Intuitive platform with fast, frictionless checkout and same-day delivery options across Nairobi.",
  },
  {
    title: "Flexible Options",
    description:
      "Nationwide shipping, same-day Nairobi delivery, or local pickup. Available 8 AM - 8 PM, 7 days.",
  },
  {
    title: "Secure Payments",
    description:
      "M-Pesa, cash on delivery, and more. All transactions encrypted and protected.",
  },
];

export default function Home() {
  const { error } = useSWR("/api/sneakers", fetcher);

  return (
    <Layout>
      {error && (
        <div className="max-w-4xl mx-auto mt-8 mb-4 p-4 bg-error-light border border-error text-error rounded-lg text-center font-semibold">
          {error.message || "Failed to load products"}
        </div>
      )}

      <HeroCarousel />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4 sm:px-6 py-32 max-w-7xl mx-auto">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="p-8 bg-white rounded-lg border border-neutral-200/60 hover:border-brand/30 hover:shadow-sm hover:scale-105 transition-all duration-200"
          >
            <div className="text-sm font-semibold text-brand mb-6">
              {feature.label}
            </div>
            <h3 className="font-semibold text-lg mb-4 text-neutral-900">
              {feature.title}
            </h3>
            <p className="text-neutral-600 text-base leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </section>

      <TrendingSection />
      <OffersSection />
      <BrandSection brands={brands} />

      <section className="py-32 px-4 sm:px-6 bg-neutral-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-5xl font-semibold text-neutral-900 mb-8">
            Need Expert Guidance?
          </h2>
          <p className="text-lg text-neutral-700 mb-12 leading-relaxed">
            Our sneaker specialists are available 24/7 to help you discover your
            perfect fit.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:+254797062606">
              <button className="px-8 py-3.5 bg-brand text-brand-dark font-medium rounded-sm shadow-xs hover:shadow-sm hover:bg-brand-light transition-all duration-200 inline-flex items-center gap-3">
                Call Us
              </button>
            </a>
            <a href="https://wa.me/254797062606">
              <button className="px-8 py-3.5 bg-neutral-900 text-white font-medium rounded-sm shadow-xs hover:shadow-sm hover:bg-neutral-800 transition-all duration-200 inline-flex items-center gap-3">
                WhatsApp
              </button>
            </a>
          </div>
        </div>
      </section>

      <section className="py-32 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="mb-20 text-center">
            <h2 className="text-5xl font-semibold text-neutral-900">
              Why Choose willy COLLECTION?
            </h2>
            <p className="text-lg text-neutral-700 mt-6 max-w-2xl mx-auto leading-relaxed">
              Excellence that speaks for itself.
            </p>
          </div>
          <div className="space-y-6">
            {reasons.map((reason) => (
              <div
                key={reason.title}
                className="bg-neutral-50/50 p-8 rounded-lg border border-neutral-200/60 hover:border-brand/30 hover:shadow-sm hover:scale-105 transition-all duration-200"
              >
                <h3 className="font-semibold text-lg mb-4 text-neutral-900">
                  {reason.title}
                </h3>
                <p className="text-neutral-700 leading-relaxed">
                  {reason.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
