import { useState, useEffect } from "react";
import Image from "next/image";

const Carousel = ({ children }) => {
  const images = [
    "/logo/air-force-1-black-and-white.webp",
    "/logo/air-jordan-1-retro-travis-scott.webp",
    "/logo/nike-air-max-90-valentines-day.webp",
    "/logo/nike-dunk-low.webp",
    "/logo/adidas-gazelle-blue.webp",
    "/logo/new-balance-550.webp",
    "/logo/jordan-4-off-white.webp",
    "/logo/puma-cali-sneakers.webp",
    "/logo/air-max-97-silver-bullet.webp",
    "/logo/nike-sb-dunk-low-blue-lobster.webp",
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isHovered || !isLoaded) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isHovered, isLoaded, images.length]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length,
    );
  };

  if (!isLoaded) {
    return (
      <div className="h-96 md:h-screen bg-gradient-to-b from-neutral-100 to-neutral-200 flex items-center justify-center">
        <div className="animate-pulse text-neutral-600">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className="relative h-96 md:h-screen bg-neutral-100 overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image carousel with smooth transitions */}
      <div className="relative w-full h-full">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute w-full h-full transition-all duration-1000 ease-in-out ${
              index === currentIndex
                ? "opacity-100 scale-100"
                : "opacity-0 scale-105"
            }`}
          >
            <Image
              src={image}
              alt={`Carousel slide ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
              quality={75}
              sizes="100vw"
              loading={index === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>

      {/* Premium dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60"></div>

      {/* Content overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="animate-slideUp">{children}</div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-40 p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all duration-300 opacity-0 group-hover:opacity-100 transform hover:scale-110"
        aria-label="Previous slide"
      >
        <svg
          className="w-6 h-6 text-white"
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
        onClick={nextSlide}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-40 p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all duration-300 opacity-0 group-hover:opacity-100 transform hover:scale-110"
        aria-label="Next slide"
      >
        <svg
          className="w-6 h-6 text-white"
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

      {/* Carousel indicators with enhanced styling */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 z-40">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-500 rounded-full backdrop-blur-md transform hover:scale-125 ${
              index === currentIndex
                ? "w-8 h-2.5 bg-white shadow-lg"
                : "w-2.5 h-2.5 bg-white/40 hover:bg-white/60"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div className="absolute bottom-8 right-8 text-white/60 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {String(currentIndex + 1).padStart(2, "0")} /{" "}
        {String(images.length).padStart(2, "0")}
      </div>
    </div>
  );
};

export default Carousel;
