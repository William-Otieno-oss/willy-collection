import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import API_BASE from "../lib/api";
import CategorySidebar from "./CategorySidebar";
import { useSwipeable } from "react-swipeable";

// Skeleton loading component
const CarouselSkeleton = () => (
  <div className="w-full h-96 md:h-[500px] bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
);

export default function HeroCarousel() {
  const [banners, setBanners] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const autoPlayRef = useRef(null);
  const carouselRef = useRef(null);

  // Fetch banners from API
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/api/banners`);
        if (!response.ok) throw new Error("Failed to fetch banners");
        const data = await response.json();

        // dedupe returned banners by `order` field; repeated seeding can create
        // multiple identical entries which makes the carousel look like it's stuck
        // on one slide even though we're advancing.  Keep first banner for each
        // order value and preserve the API's sort order.
        const unique = [];
        const seen = new Set();
        for (const b of data) {
          if (!seen.has(b.order)) {
            unique.push(b);
            seen.add(b.order);
          }
        }
        setBanners(unique.length > 0 ? unique : []);
        setError(null);
      } catch (err) {
        // Error handled, carousel shows without banners
        setError(err.message);
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlay || banners.length === 0) {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      return;
    }

    autoPlayRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isAutoPlay, banners.length]);

  // Handle slide navigation
  const goToSlide = useCallback(
    (index) => {
      if (index >= 0 && index < banners.length) {
        setCurrentSlide(index);
        setIsAutoPlay(false);
        // Resume autoplay after 8 seconds of inactivity
        setTimeout(() => setIsAutoPlay(true), 8000);
      }
    },
    [banners.length],
  );

  const nextSlide = useCallback(
    () => goToSlide((currentSlide + 1) % banners.length),
    [currentSlide, banners.length, goToSlide],
  );

  const prevSlide = useCallback(
    () => goToSlide((currentSlide - 1 + banners.length) % banners.length),
    [currentSlide, banners.length, goToSlide],
  );

  // Swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: nextSlide,
    onSwipedRight: prevSlide,
    trackMouse: false,
    delta: 50,
  });

  // Handle pause on hover
  const handleMouseEnter = () => setIsAutoPlay(false);
  const handleMouseLeave = () => setIsAutoPlay(true);

  // If no banners, show placeholder
  if (!loading && (!banners || banners.length === 0)) {
    return (
      <div className="w-full">
        <div className="flex">
          <CategorySidebar />
          <div className="flex-1 h-96 md:h-[500px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <p className="text-gray-500 text-lg">No banners available</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex">
          <CategorySidebar isLoading={true} />
          <div className="flex-1">
            <CarouselSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-900">
      <div className="flex gap-2 md:gap-0">
        {/* Sidebar Navigation */}
        <CategorySidebar />

        {/* Hero Carousel */}
        <div
          ref={carouselRef}
          className="flex-1 relative overflow-hidden h-96 md:h-[500px] lg:h-[600px] bg-gray-900"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          {...swipeHandlers}
          role="region"
          aria-label="Hero carousel"
          aria-live="polite"
        >
          {/* Slides */}
          {banners.map((banner, idx) => (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                idx === currentSlide
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none"
              }`}
              role="img"
              aria-label={banner.title}
            >
              {/* Background Image */}
              <Image
                src={banner.imageUrl}
                alt={banner.title}
                fill
                className="object-cover"
                priority={idx === 0}
                quality={90}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) calc(100vw - 12rem), calc(100vw - 12rem)"
              />

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-black/40"></div>

              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-start justify-center px-6 md:px-12 lg:px-20 py-8">
                <div className="max-w-xl space-y-4">
                  {/* Title */}
                  <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg leading-tight">
                    {banner.title}
                  </h2>

                  {/* Subtitle */}
                  {banner.subtitle && (
                    <p className="text-lg md:text-xl text-gray-100 drop-shadow-md font-light">
                      {banner.subtitle}
                    </p>
                  )}

                  {/* Description */}
                  {banner.description && (
                    <p className="text-sm md:text-base text-gray-200 drop-shadow-sm max-w-md">
                      {banner.description}
                    </p>
                  )}

                  {/* CTA Button */}
                  {banner.link && (
                    <div className="pt-6">
                      <Link href={banner.link}>
                        <button className="px-8 py-3.5 md:px-10 md:py-4 bg-brand hover:bg-brand/90 text-white font-semibold rounded-sm transition-all duration-200 shadow-sm hover:shadow-md text-sm md:text-base">
                          {banner.ctaText || "Shop Now"}
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Left Arrow */}
          {banners.length > 1 && (
            <button
              onClick={prevSlide}
              className="absolute left-4 md:left-6 top-1/2 transform -translate-y-1/2 z-20 p-2 md:p-3 bg-white/20 hover:bg-white/40 text-white rounded-full transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Previous banner"
            >
              <svg
                className="w-5 h-5 md:w-6 md:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {/* Right Arrow */}
          {banners.length > 1 && (
            <button
              onClick={nextSlide}
              className="absolute right-4 md:right-6 top-1/2 transform -translate-y-1/2 z-20 p-2 md:p-3 bg-white/20 hover:bg-white/40 text-white rounded-full transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Next banner"
            >
              <svg
                className="w-5 h-5 md:w-6 md:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}

          {/* Pagination Dots */}
          {banners.length > 1 && (
            <div className="absolute bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-2 md:gap-3">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToSlide(idx)}
                  className={`transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-white ${
                    idx === currentSlide
                      ? "bg-orange-500 w-8 h-2.5 md:w-10 md:h-3"
                      : "bg-white/40 hover:bg-white/60 w-2.5 h-2.5 md:w-3 md:h-3"
                  }`}
                  aria-label={`Go to banner ${idx + 1}`}
                  aria-current={idx === currentSlide ? "true" : "false"}
                />
              ))}
            </div>
          )}

          {/* Loading Error */}
          {error && (
            <div className="absolute bottom-4 left-4 right-4 bg-red-500/90 text-white px-4 py-2 rounded text-sm">
              Failed to load banners: {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
