import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import navigationItems from "../lib/navigationItems";

export default function Sidebar({ items, width = "w-48", onCategoryHover }) {
  const navItems = items && items.length ? items : navigationItems;
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const toggleRef = useRef(null);

  // Initialize from persisted state
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebarOpen");
      if (saved === "true") setOpen(true);
    } catch (e) {
      // ignore
    }
  }, []);

  // Persist open state
  useEffect(() => {
    try {
      localStorage.setItem("sidebarOpen", open ? "true" : "false");
    } catch (e) {}
  }, [open]);

  // Lock body scroll when off-canvas is open (restore on close)
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Focus trap + escape handling when open
  useEffect(() => {
    if (!open) return;
    const node = panelRef.current;
    if (!node) return;

    const focusableSelector =
      'a, button, input, [tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(
      node.querySelectorAll(focusableSelector),
    ).filter((el) => !el.hasAttribute("disabled"));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (first) first.focus();

    function onKeyDown(e) {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (e.key === "Tab") {
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      {/* Mobile toggle button (visible on small screens) */}
      <div className="md:hidden absolute top-4 left-4 z-40">
        <button
          ref={toggleRef}
          onClick={() => setOpen(true)}
          aria-label="Open categories"
          aria-expanded={open}
          aria-controls="offcanvas-categories"
          className="p-3 bg-white/90 rounded-md shadow-sm micro-hover"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Off-canvas panel for mobile */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50" role="presentation">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <div
            id="offcanvas-categories"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Categories"
            className="relative w-64 h-full bg-white shadow-xl py-4 overflow-auto animate-menuOpen"
          >
            <div className="px-4 pb-4 flex items-center justify-between">
              <div className="font-semibold text-sm">Categories</div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close categories"
                className="p-2 micro-hover"
              >
                ✕
              </button>
            </div>
            <nav className="px-2" aria-label="Categories list">
              {navItems.map((cat, idx) => (
                <Link
                  key={cat.slug || cat.href}
                  href={cat.href || `/categories/${cat.slug}`}
                  legacyBehavior
                >
                  <a
                    className="menu-item block px-5 py-3 text-sm transition-colors hover:bg-gray-50 focus:outline-none focus:bg-gray-100"
                    style={{
                      borderBottom:
                        idx !== navItems.length - 1
                          ? "1px solid #f3f4f6"
                          : "none",
                      animationDelay: `${idx * 45}ms`,
                    }}
                    onClick={() => setOpen(false)}
                  >
                    {cat.name}
                  </a>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop/Tablet sidebar */}
      <aside
        className={`${width} hidden md:flex flex-col border-r border-gray-200 md:sticky md:top-20`}
        aria-label="Categories sidebar"
      >
        {navItems.map((cat, idx) => (
          <Link
            key={cat.slug || cat.href}
            href={cat.href || `/categories/${cat.slug}`}
          >
            <span
              className={`block px-5 py-3 text-sm hover:underline hover:opacity-90 cursor-pointer transition-all duration-200 ${
                idx !== navItems.length - 1 ? "border-b border-gray-100" : ""
              }`}
              onMouseEnter={() => onCategoryHover?.(cat.name)}
              onMouseLeave={() => onCategoryHover?.(null)}
            >
              {cat.name}
            </span>
          </Link>
        ))}
      </aside>
    </>
  );
}
