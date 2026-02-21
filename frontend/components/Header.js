"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import navigationItems from "../lib/navigationItems";

export default function Header() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [mounted, setMounted] = useState(false);

  const toggleMobileMenu = () => {
    if (!mobileMenuVisible) {
      setMobileMenuVisible(true);
      // small tick to allow mounting before playing open animation
      setTimeout(() => setMobileMenuOpen(true), 10);
    } else {
      // play close animation then unmount
      setMobileMenuOpen(false);
      setTimeout(() => setMobileMenuVisible(false), 260);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Mark as mounted to prevent hydration mismatch
    setMounted(true);

    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartCount(cart.length);
    } catch (e) {
      setCartCount(0);
    }

    // Listen for cart updates
    const handleCartUpdate = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        setCartCount(cart.length);
      } catch (e) {
        setCartCount(0);
      }
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    window.addEventListener("storage", handleCartUpdate);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("storage", handleCartUpdate);
    };
  }, []);

  // navigation items are maintained in frontend/lib/navigationItems.js

  const isActive = (href) => {
    if (href === "/") return router.pathname === "/";
    return router.pathname.startsWith(href);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
      setSearchInput("");
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 animate-headerEnter transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100"
          : "bg-white border-b border-gray-50 shadow-sm"
      }`}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between gap-2 md:gap-4 h-20 md:h-24">
          {/* Left: Logo + Brand */}
          <Link
            href="/"
            className="flex items-center gap-2 flex-shrink-0 focus:outline-none animate-slideUpSoft"
            aria-label="Back to home"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 animate-scaleUpSoft relative">
              <Image
                src="/logo/willy collection.png"
                alt="willy COLLECTION logo"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 40px, 48px"
              />
            </div>
            <span className="font-bold text-xs sm:text-sm md:text-base whitespace-nowrap animate-scaleUpSoft">
              willy COLLECTION
            </span>
          </Link>

          {/* Center: Search */}
          <div className="flex-1 flex justify-center px-1 md:px-0">
            <form
              className="w-full max-w-[350px] md:max-w-[450px] flex"
              onSubmit={handleSearch}
            >
              <label htmlFor="site-search" className="sr-only">
                Search
              </label>
              <input
                id="site-search"
                placeholder="Search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="flex-1 min-w-0 h-10 md:h-11 px-3 md:px-4 text-sm md:text-base border border-gray-200 rounded-l-lg focus:outline-none search-focus-smooth transition-shadow duration-200"
              />
              <button
                type="submit"
                className="h-10 md:h-11 px-3 md:px-5 text-sm md:text-base border border-l-0 rounded-r-lg transition-transform duration-150 hover:translate-y-[-1px] focus:translate-y-[-1px]"
              >
                Search
              </button>
            </form>
          </div>

          {/* Right: Actions (Cart + Contact + Menu) */}
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 animate-slideUpSoft">
            {/* Cart Icon */}
            <Link
              href="/cart"
              className="p-3 md:p-2.5 rounded-lg md:rounded-md micro-hover micro-press group"
              aria-label={
                mounted
                  ? `Shopping cart with ${cartCount} items`
                  : "Shopping cart"
              }
            >
              <svg
                className="w-5 h-5 md:w-6 md:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5"
                />
              </svg>
            </Link>

            {/* Contact Icon + Phone */}
            <a
              href="tel:+254797062606"
              className="hidden md:flex items-center gap-2 px-3 py-2 text-sm micro-hover group"
              aria-label="Call +254 797 062 606"
            >
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <span className="group-hover:translate-y-[-1px] transition-transform text-xs lg:text-sm">
                +254 797 062 606
              </span>
            </a>

            {/* Mobile Menu Toggle */}
            <button
              onClick={toggleMobileMenu}
              className="p-3 md:hidden rounded-md micro-hover"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuVisible && (
          <nav
            className={`lg:hidden border-t border-gray-100 py-4 bg-white ${mobileMenuOpen ? "animate-menuOpen" : "animate-menuClose"}`}
            id="mobile-menu"
            aria-label="Mobile navigation"
          >
            <div className="space-y-2 px-4">
              <a
                href="tel:+254797062606"
                onClick={() => toggleMobileMenu()}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-lg hover:bg-gray-50 focus:outline-none focus:bg-gray-100 micro-hover"
                style={{ color: "#1c140c" }}
              >
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span>+254 797 062 606</span>
              </a>
              <Link
                href="/about"
                onClick={() => toggleMobileMenu()}
                className="block px-4 py-3 text-sm font-medium transition-colors rounded-lg hover:bg-gray-50 focus:outline-none focus:bg-gray-100 micro-hover"
                style={{ color: "#1c140c" }}
              >
                About Us
              </Link>
              <Link
                href="/shipping"
                onClick={() => toggleMobileMenu()}
                className="block px-4 py-3 text-sm font-medium transition-colors rounded-lg hover:bg-gray-50 focus:outline-none focus:bg-gray-100 micro-hover"
                style={{ color: "#1c140c" }}
              >
                Shipping Policy
              </Link>
              <Link
                href="/contact"
                onClick={() => toggleMobileMenu()}
                className="block px-4 py-3 text-sm font-medium transition-colors rounded-lg hover:bg-gray-50 focus:outline-none focus:bg-gray-100 micro-hover"
                style={{ color: "#1c140c" }}
              >
                Contact Us
              </Link>
              <Link
                href="/faqs"
                onClick={() => toggleMobileMenu()}
                className="block px-4 py-3 text-sm font-medium transition-colors rounded-lg hover:bg-gray-50 focus:outline-none focus:bg-gray-100 micro-hover"
                style={{ color: "#1c140c" }}
              >
                FAQs
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
