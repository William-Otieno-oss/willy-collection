import useSWR from "swr";
import { useMemo } from "react";
import Link from "next/link";
import SneakerCard from "./SneakerCard";
import API_BASE, { fetcher } from "../lib/api";

export default function OffersSection() {
  const { data } = useSWR(`${API_BASE}/api/sneakers`, fetcher);
  const sneakers = Array.isArray(data)
    ? data
    : data && Array.isArray(data.data)
      ? data.data
      : [];
  const offers = useMemo(
    () =>
      Array.isArray(sneakers)
        ? sneakers.filter((s) => s.onSale).slice(0, 12)
        : [],
    [sneakers],
  );

  if (offers.length === 0) return null;

  return (
    <section className="py-32 px-4 sm:px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-20">
          <div>
            <span className="text-sm font-semibold text-error uppercase tracking-widest">
              Limited time
            </span>
            <h2 className="text-5xl font-semibold mt-4 text-neutral-900">
              Exclusive Offers
            </h2>
          </div>
          <Link href="/offers">
            <button className="mt-6 md:mt-0 px-8 py-3.5 bg-brand text-brand-dark font-medium rounded-sm shadow-xs hover:shadow-sm hover:bg-brand-light transition-all duration-200">
              View All Deals →
            </button>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {offers.slice(0, 8).map((s, idx) => (
            <div
              key={s.id}
              className="animate-slideUp"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <SneakerCard s={s} onSale={true} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
