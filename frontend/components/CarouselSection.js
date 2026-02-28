import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "./Sidebar";
import navigationItems from "../lib/navigationItems";
import { generateSlides } from "../lib/logoImages";

export default function CarouselSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Generate slides based on selected category
  const slides = generateSlides(selectedCategory);

  // Reset slide index when category changes
  useEffect(() => {
    setCurrentSlide(0);
  }, [selectedCategory]);

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="w-full">
      <div className="flex">
        {/* Left Sidebar Navigation with category hover */}
        <Sidebar
          items={navigationItems}
          width="w-48"
          onCategoryHover={setSelectedCategory}
        />

        {/* Main Carousel Area */}
        <div className="flex-1 relative overflow-hidden bg-neutral-100">
          {/* Carousel Slides */}
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 flex items-center justify-center ${
                idx === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              {/* Background Image */}
              <Image
                src={(slide && typeof slide.image === "string" && slide.image.trim() !== "") ? slide.image : "/placeholder.svg"}
                alt={slide.title || "carousel"}
                fill
                className="object-cover"
                priority={idx === 0}
                quality={90}
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 100vw"
                loading={idx === 0 ? "eager" : "lazy"}
              />

              {/* Dark Overlay - Reduced opacity for better image visibility */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/50"></div>

              {/* Content Overlay */}
              <div className="relative text-center px-8 z-10">
                <h2 className="text-6xl md:text-7xl font-bold mb-4 font-display text-accent drop-shadow-lg">
                  {slide.title}
                </h2>
                <p className="text-2xl md:text-3xl text-neutral-100 mb-8 font-light drop-shadow-md">
                  {slide.subtitle}
                </p>
                <Link href={slide.link}>
                  <button className="px-8 py-3.5 bg-brand hover:bg-brand-light text-brand-dark font-semibold rounded-sm transition-all duration-200 shadow-xs hover:shadow-sm">
                    {slide.cta}
                  </button>
                </Link>
              </div>
            </div>
          ))}

          {/* Slide Indicators */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`transition-all duration-250 rounded-full ${
                  idx === currentSlide
                    ? "bg-brand w-8 h-3"
                    : "bg-neutral-500 hover:bg-neutral-400 w-3 h-3"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={() =>
              setCurrentSlide(
                (prev) => (prev - 1 + slides.length) % slides.length,
              )
            }
            className="absolute left-6 top-1/2 transform -translate-y-1/2 p-3 bg-white/20 hover:bg-white/40 text-white rounded-full transition-all duration-300 z-20"
            aria-label="Previous slide"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={() =>
              setCurrentSlide((prev) => (prev + 1) % slides.length)
            }
            className="absolute right-6 top-1/2 transform -translate-y-1/2 p-3 bg-white/20 hover:bg-white/40 text-white rounded-full transition-all duration-300 z-20"
            aria-label="Next slide"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
