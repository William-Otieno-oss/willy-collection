import useSWR from "swr";
import { useMemo } from "react";
import SneakerCard from "./SneakerCard";
import API_BASE, { fetcher } from "../lib/api";

export default function TrendingSection() {
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

  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <span className="text-sm font-semibold text-accent uppercase tracking-widest">
            Collections
          </span>
          <h2
            className="text-4xl md:text-5xl font-display font-bold mt-3 mb-4"
            style={{ color: "#1c140c" }}
          >
            Trending This Season
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl">
            Discover the most coveted sneaker styles handpicked for you
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {trending.map((s, idx) => (
            <div
              key={s.id}
              className="animate-slideUp"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <SneakerCard s={s} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
