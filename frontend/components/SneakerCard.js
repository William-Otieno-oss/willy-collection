import React, { useState, useEffect, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "../lib/api";

function SneakerCard({ s, onSale }) {
  const brandName = typeof s.brand === "object" ? s.brand?.name : s.brand;
  const sizes = s.stocks
    ? s.stocks
        .map((stock) =>
          stock && typeof stock.size === "object"
            ? stock.size.name
            : stock.size,
        )
        .filter((sz) => sz !== undefined && sz !== null)
        .sort((a, b) => {
          const na = Number(a);
          const nb = Number(b);
          if (!isNaN(na) && !isNaN(nb)) return na - nb;
          return String(a).localeCompare(String(b));
        })
    : [];
  const sizeRange =
    sizes.length > 0
      ? `${sizes[0]} - ${sizes[sizes.length - 1]}`
      : "Sizes available";

  const imageUrl = getImageUrl(s.images?.[0]?.url) || "/placeholder.png";
  const isOnSale = onSale || s.onSale;
  const discount =
    isOnSale && s.originalPrice
      ? Math.round(((s.originalPrice - s.price) / s.originalPrice) * 100)
      : 0;

  // Wishlist state / toggle
  const _wishId = s.id ?? s.slug;
  const wishId = String(_wishId ?? "");
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    try {
      const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
      setWishlisted(wishlist.includes(wishId));
    } catch (e) {
      setWishlisted(false);
    }
  }, [wishId]);

  const toggleWishlist = (e) => {
    // prevent link/navigation when clicking the heart
    e.preventDefault();
    e.stopPropagation();
    try {
      const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
      const idx = wishlist.indexOf(wishId);
      if (idx === -1) {
        wishlist.push(wishId);
        setWishlisted(true);
      } else {
        wishlist.splice(idx, 1);
        setWishlisted(false);
      }
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
      window.dispatchEvent(new Event("wishlistUpdated"));
    } catch (err) {
      console.error("wishlist toggle error", err);
    }
  };

  return (
    <Link href={`/sneakers/${s.slug || s.id}`} legacyBehavior>
      <a>
        <div className="group relative h-full overflow-hidden rounded-lg border border-neutral-200/60 bg-white shadow-xs transition-all duration-200 hover:border-brand/40 hover:shadow-sm hover:scale-105 cursor-pointer flex flex-col">
          {/* Image container */}
          <div
            className="relative h-80 w-full overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200"
            style={{ aspectRatio: "1" }}
          >
            <Image
              src={imageUrl}
              fill
              className="object-cover transition-all duration-300 ease-out"
              alt={`${brandName} ${s.modelName}`}
              quality={85}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
            />

            {/* Image overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-250 group-hover:opacity-100" />

            {/* ON SALE Badge */}
            {isOnSale && (
              <div className="absolute top-4 right-4 z-20 inline-flex items-center justify-center h-14 w-14 rounded-full bg-error text-white font-bold text-sm shadow-md badge-error transition-transform duration-250 group-hover:scale-110">
                {discount > 0 ? `-${discount}%` : "SALE"}
              </div>
            )}

            {/* Wishlist Button */}
            <button
              onClick={toggleWishlist}
              aria-label={
                wishlisted ? "Remove from wishlist" : "Add to wishlist"
              }
              className={`absolute top-4 left-4 z-20 h-10 w-10 rounded-lg backdrop-blur-md shadow-xs transition-all duration-250 flex items-center justify-center ${
                wishlisted
                  ? "bg-error/90 text-white hover:bg-error"
                  : "bg-white/90 text-neutral-500 hover:bg-brand hover:text-brand-dark"
              }`}
            >
              <svg
                className="w-5 h-5 transition-transform duration-250"
                viewBox="0 0 24 24"
                fill={wishlisted ? "currentColor" : "none"}
                stroke={wishlisted ? "none" : "currentColor"}
                strokeWidth={wishlisted ? 0 : 2}
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 3.99 4 6.5 4 8.24 4 9.91 4.81 11 6.08 12.09 4.81 13.76 4 15.5 4 18.01 4 20 6 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </button>

            {/* Quick View Overlay */}
            <div className="absolute inset-0 bg-black/0 transition-all duration-250 group-hover:bg-black/10 flex items-center justify-center">
              <button className="opacity-0 transition-all duration-250 group-hover:opacity-100 px-4 py-2 bg-white text-neutral-900 font-semibold rounded-md hover:bg-neutral-50 shadow-xs text-sm">
                View Details
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col gap-4 p-6 sm:p-7">
            {/* Brand */}
            <div className="text-xs font-bold uppercase tracking-widest text-neutral-500 transition-colors duration-250 group-hover:text-brand">
              {brandName}
            </div>

            {/* Product Name */}
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-neutral-900 line-clamp-2 text-lg leading-snug transition-colors duration-250 group-hover:text-brand">
                {s.modelName}
              </h3>
              <p className="text-xs font-medium text-neutral-500">
                Sizes: <span className="text-brand font-bold">{sizeRange}</span>
              </p>
            </div>

            {/* Pricing Section */}
            <div className="mt-auto space-y-3 border-t border-neutral-200/60 pt-4">
              {isOnSale && s.originalPrice ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-neutral-900">
                    KES{" "}
                    {typeof s.price === "string"
                      ? s.price
                      : Math.round(s.price).toLocaleString()}
                  </span>
                  <span className="text-xs font-medium text-neutral-400 line-through">
                    KES{" "}
                    {typeof s.originalPrice === "string"
                      ? s.originalPrice
                      : Math.round(s.originalPrice).toLocaleString()}
                  </span>
                </div>
              ) : (
                <span className="text-2xl font-bold text-neutral-900">
                  KES{" "}
                  {typeof s.price === "string"
                    ? s.price
                    : Math.round(s.price).toLocaleString()}
                </span>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 pt-2">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`h-4 w-4 transition-colors ${
                      i < Math.floor(Math.random() * 5)
                        ? "text-brand"
                        : "text-neutral-300"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs font-semibold text-neutral-600">
                (245)
              </span>
            </div>
          </div>
        </div>
      </a>
    </Link>
  );
}

export default memo(SneakerCard);
