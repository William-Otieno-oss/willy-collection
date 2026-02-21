import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "../lib/api";

export default function SneakerCard({ s, onSale }) {
  const brandName = typeof s.brand === "object" ? s.brand?.name : s.brand;
  const sizes = s.stocks
    ? s.stocks.map((stock) => stock.size).sort((a, b) => a - b)
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

  return (
    <Link href={`/sneakers/${s.slug || s.id}`} legacyBehavior>
      <a>
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-300 hover:shadow-xl transition-all duration-500 cursor-pointer h-full flex flex-col group">
          {/* Image container */}
          <div
            className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100"
            style={{ aspectRatio: "1" }}
          >
            <Image
              src={imageUrl}
              fill
              className="object-cover group-hover:scale-125 transition-transform duration-500"
              alt={`${brandName} ${s.modelName}`}
              quality={75}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />

            {/* ON OFFER Badge */}
            {isOnSale && (
              <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg transform group-hover:scale-110 transition-transform duration-300 animate-slideInRight">
                {discount > 0 ? `-${discount}%` : "SALE"}
              </div>
            )}

            {/* Wishlist Button */}
            <button className="absolute top-4 left-4 p-2 bg-white/80 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white shadow-md">
              <svg
                className="w-5 h-5 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>

            {/* Quick View Badge */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                className="w-full py-2 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-300"
                style={{ color: "#1c140c" }}
              >
                Quick View
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 flex flex-col flex-1">
            {/* Brand - premium styling */}
            <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3 group-hover:text-accent transition-colors duration-300">
              {brandName}
            </div>

            {/* Product Name */}
            <h3 className="font-display font-bold text-gray-900 mb-3 line-clamp-2 text-sm leading-snug group-hover:text-accent transition-colors duration-300">
              {s.modelName}
            </h3>

            {/* Size Information */}
            <p className="text-xs font-medium mb-4 text-gray-500">
              Sizes: <span style={{ color: "#bc9c71" }}>{sizeRange}</span>
            </p>

            {/* Pricing */}
            <div className="mb-4 mt-auto">
              {isOnSale && s.originalPrice ? (
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-900">
                    KES{" "}
                    {typeof s.price === "string" ? s.price : s.price.toFixed(0)}
                  </span>
                  <span className="text-xs text-gray-400 line-through font-medium">
                    KES{" "}
                    {typeof s.originalPrice === "string"
                      ? s.originalPrice
                      : s.originalPrice.toFixed(0)}
                  </span>
                </div>
              ) : (
                <span className="text-lg font-bold text-gray-900">
                  KES{" "}
                  {typeof s.price === "string" ? s.price : s.price.toFixed(0)}
                </span>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-3.5 h-3.5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-gray-500">(124)</span>
            </div>
          </div>
        </div>
      </a>
    </Link>
  );
}
