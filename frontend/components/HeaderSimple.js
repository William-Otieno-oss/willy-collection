"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

export default function HeaderSimple() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <img
              src="/logo.png"
              alt="willy COLLECTION"
              className="h-10 md:h-12 w-auto"
            />
          </Link>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="flex-1 max-w-md flex items-center gap-2 mx-4 md:mx-6"
          >
            <input
              type="text"
              placeholder="SEARCH BAR"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-offset-0"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded font-medium whitespace-nowrap transition-all duration-300 hover:opacity-90"
            >
              SEARCH
            </button>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-4 md:gap-6">
            {/* Cart Icon */}
            <Link
              href="/cart"
              className="p-2 hover:bg-gray-100 rounded transition-colors"
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
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </Link>

            {/* Contact Link */}
            <Link
              href="/contact"
              className="px-3 py-2 font-medium text-sm md:text-base hover:opacity-80 transition-opacity"
            >
              CONTACT
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
