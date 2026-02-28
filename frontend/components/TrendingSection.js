import useSWR from "swr";
import { useMemo } from "react";
import SneakerCard from "./SneakerCard";
import { fetcher } from "../lib/api";

export default function TrendingSection() {
  // Fetch all sneakers from public API (use relative path so `fetcher`
  // composes the base URL correctly). We then apply a defensive
  // availability filter on the client to ensure Trending renders only
  // products that are actually available.
  const { data } = useSWR(`/api/sneakers`, fetcher);

  const sneakers = Array.isArray(data)
    ? data
    : data && Array.isArray(data.data)
      ? data.data
      : [];

  const trending = useMemo(() => {
    if (!Array.isArray(sneakers) || sneakers.length === 0) return [];

    // Keep product if any of the accepted availability signals are present
    const isAvailable = (s) => {
      try {
        if (!s || typeof s !== "object") return false;
        if (s.available === true) return true;
        if (s.inStock === true) return true;
        if (typeof s.quantity === "number" && s.quantity > 0) return true;
        if (Array.isArray(s.stocks)) {
          return s.stocks.some(
            (st) =>
              st &&
              typeof st === "object" &&
              (st.inStock === true ||
                (typeof st.quantity === "number" && st.quantity > 0)),
          );
        }
        return false;
      } catch (err) {
        return false;
      }
    };

    return sneakers.filter((s) => isAvailable(s));
  }, [sneakers]);

  // hide or show message when no trending products available
  if (trending.length === 0) {
    return (
      <section className="bg-white py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <span className="text-xs font-semibold text-brand/70 uppercase tracking-widest">
              Collections
            </span>
            <h2 className="text-5xl font-bold mt-4 mb-6 text-neutral-900">
              Trending This Season
            </h2>
            <p className="text-lg text-neutral-600 max-w-3xl leading-relaxed">
              Discover the most coveted sneaker styles, handpicked for
              discerning collectors.
            </p>
          </div>
          <p className="text-center text-neutral-500 text-lg py-12">
            No trending sneakers available at the moment.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-24 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20">
          <span className="text-xs font-semibold text-brand/70 uppercase tracking-widest">
            Collections
          </span>
          <h2 className="text-5xl font-bold mt-4 mb-6 text-neutral-900">
            Trending This Season
          </h2>
          <p className="text-lg text-neutral-600 max-w-3xl leading-relaxed">
            Discover the most coveted sneaker styles, handpicked for discerning
            collectors.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
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
