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
  const [wishlistCount, setWishlistCount] = useState(0);
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
      const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
      setWishlistCount(wishlist.length);
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

    const handleWishlistUpdate = () => {
      try {
        const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
        setWishlistCount(wishlist.length);
      } catch (e) {
        setWishlistCount(0);
      }
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    window.addEventListener("wishlistUpdated", handleWishlistUpdate);
    const handleStorage = () => {
      handleCartUpdate();
      handleWishlistUpdate();
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("wishlistUpdated", handleWishlistUpdate);
      window.removeEventListener("storage", handleStorage);
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
      className={`sticky top-0 z-50 animate-headerEnter transition-all duration-200 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-neutral-200/60"
          : "bg-white border-b border-neutral-100/70 shadow-xs"
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
            <div className="w-14 h-14 md:w-16 md:h-16 flex-shrink-0 animate-scaleUpSoft relative">
              <Image
                src="/logo/willy collection.png"
                alt="willy COLLECTION logo"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 56px, 64px"
              />
            </div>
            <span className="font-bold text-xs sm:text-sm md:text-base whitespace-nowrap animate-scaleUpSoft">
              willy COLLECTION
            </span>
          </Link>

          {/* Center: Search */}
          <div className="flex-1 flex justify-center px-1 md:px-0">
            <form
              className="w-full max-w-[350px] md:max-w-[450px] flex gap-2"
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
                className="flex-1 min-w-0 h-11 md:h-12 px-4 md:px-4 text-sm md:text-base border border-neutral-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-transparent focus:ring-offset-0 transition-all duration-200"
              />
              <button
                type="submit"
                className="h-11 md:h-12 px-4 md:px-5 text-sm md:text-base bg-brand/10 hover:bg-brand/20 border border-brand/30 rounded-sm font-medium text-brand transition-all duration-200 hover:translate-y-[-1px] focus:translate-y-[-1px]"
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
              className="p-2 md:p-2.5 rounded-sm micro-hover micro-press group relative text-xl md:text-2xl"
              aria-label={
                mounted
                  ? `Shopping cart with ${cartCount} items`
                  : "Shopping cart"
              }
            >
              🛍️
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-accent text-white text-[10px] font-bold leading-none px-1.5 py-0.5 rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>


            {/* Wishlist Icon */}
            <Link
              href="/wishlist"
              className="p-3 md:p-2.5 rounded-sm micro-hover micro-press group"
              aria-label={
                mounted ? `Wishlist with ${wishlistCount} items` : "Wishlist"
              }
            >
              <div className="relative">
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 text-error"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-error text-white text-[10px] leading-none px-1 rounded-full">
                    {wishlistCount}
                  </span>
                )}
              </div>
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
              className="p-3 md:hidden rounded-sm micro-hover"
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
            className={`lg:hidden border-t border-neutral-200 py-4 bg-white ${mobileMenuOpen ? "animate-menuOpen" : "animate-menuClose"}`}
            id="mobile-menu"
            aria-label="Mobile navigation"
          >
            <div className="space-y-2 px-4">
              <a
                href="tel:+254797062606"
                onClick={() => toggleMobileMenu()}
                className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors rounded-sm hover:bg-neutral-100 focus:outline-none focus:bg-neutral-100 micro-hover text-neutral-900"
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
                className="block px-4 py-3.5 text-sm font-medium transition-colors rounded-sm hover:bg-neutral-100 focus:outline-none focus:bg-neutral-100 micro-hover text-neutral-900"
              >
                About Us
              </Link>
              <Link
                href="/shipping"
                onClick={() => toggleMobileMenu()}
                className="block px-4 py-3.5 text-sm font-medium transition-colors rounded-sm hover:bg-neutral-100 focus:outline-none focus:bg-neutral-100 micro-hover text-neutral-900"
              >
                Shipping Policy
              </Link>
              <Link
                href="/contact"
                onClick={() => toggleMobileMenu()}
                className="block px-4 py-3.5 text-sm font-medium transition-colors rounded-sm hover:bg-neutral-100 focus:outline-none focus:bg-neutral-100 micro-hover text-neutral-900"
              >
                Contact Us
              </Link>
              <Link
                href="/faqs"
                onClick={() => toggleMobileMenu()}
                className="block px-4 py-3.5 text-sm font-medium transition-colors rounded-sm hover:bg-neutral-100 focus:outline-none focus:bg-neutral-100 micro-hover text-neutral-900"
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
