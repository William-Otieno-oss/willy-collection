import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import API_BASE from "../lib/api";

// Skeleton loader for sidebar
const SidebarSkeleton = () => (
  <div className="hidden md:flex md:w-48 flex-col border-r border-neutral-200 sticky top-20 max-h-[calc(100vh-80px)] overflow-y-auto bg-white">
    {[...Array(8)].map((_, i) => (
      <div
        key={i}
        className="px-5 py-3 border-b border-neutral-100"
      >
        <div className="h-4 bg-neutral-200 rounded animate-pulse"></div>
      </div>
    ))}
  </div>
);

// Mega menu dropdown component
const MegaMenu = ({ category, isOpen, onClose }) => {
  const menuRef = useRef(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !category.megaMenuItems?.length) return null;

  return (
    <div
      ref={menuRef}
      className="absolute left-full top-0 ml-0 bg-white border border-neutral-200/60 shadow-xs rounded-sm min-w-max z-40 overflow-hidden"
      role="menu"
      aria-label={`${category.name} submenu`}
    >
      <div className="py-2">
        {category.megaMenuItems.map((item, idx) => (
          <Link
            key={idx}
            href={item.link || "#"}
            onClick={() => onClose()}
            legacyBehavior
          >
            <a
              className="flex items-center gap-3 px-6 py-3.5 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-brand transition-colors focus:outline-none focus:bg-neutral-50"
              role="menuitem"
            >
              {item.icon && (
                <span className="text-lg" title={item.icon}>
                  {item.icon}
                </span>
              )}
              <span>{item.title}</span>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default function CategorySidebar({ isLoading = false }) {
  const [categories, setCategories] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);
  const [loading, setLoading] = useState(isLoading);
  const [error, setError] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const toggleRef = useRef(null);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/api/categories`);
        if (!response.ok) throw new Error("Failed to fetch categories");
        const data = await response.json();
        setCategories(data);
        setError(null);
      } catch (err) {
        // Error handled silently, sidebar shows default categories
        setError(err.message);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target) &&
        !toggleRef.current?.contains(e.target)
      ) {
        setMobileOpen(false);
      }
    };

    if (mobileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [mobileOpen]);

  // Keyboard navigation for mobile
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
        toggleRef.current?.focus();
      }
    };

    if (mobileOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [mobileOpen]);

  if (loading) return <SidebarSkeleton />;

  return (
    <>
      {/* Mobile Menu Toggle */}
      <div className="md:hidden absolute top-16 left-0 z-30">
        <button
          ref={toggleRef}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle categories menu"
          aria-expanded={mobileOpen}
          aria-controls="mobile-categories-menu"
          className="p-3 bg-white border rounded-r-sm shadow-xs hover:bg-neutral-50 transition-colors"
        >
          <svg
            className="w-5 h-5 text-neutral-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
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

      {/* Mobile Off-Canvas Menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40" role="presentation">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <nav
            id="mobile-categories-menu"
            ref={mobileMenuRef}
            className="absolute left-0 top-0 w-64 h-screen bg-white shadow-xl overflow-y-auto animate-slideIn"
            role="navigation"
            aria-label="Categories"
          >
            <div className="px-5 py-4 border-b border-neutral-200/60 flex items-center justify-between">
              <h2 className="font-semibold text-neutral-900">
                Categories
              </h2>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="text-neutral-600 hover:text-neutral-900"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <ul className="py-2">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link href={`/categories/${cat.slug}`} legacyBehavior>
                    <a
                      className="block px-5 py-3.5 text-neutral-700 hover:bg-neutral-50 hover:text-brand transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      {cat.icon && <span className="mr-2">{cat.icon}</span>}
                      {cat.name}
                    </a>
                  </Link>
                  {cat.megaMenuItems?.length > 0 && (
                    <ul className="bg-neutral-50 border-l-2 border-brand">
                      {cat.megaMenuItems.map((item, idx) => (
                        <li key={idx}>
                          <Link href={item.link || "#"} legacyBehavior>
                            <a
                              className="block px-8 py-2 text-sm text-neutral-600 hover:text-brand transition-colors"
                              onClick={() => setMobileOpen(false)}
                            >
                              {item.title}
                            </a>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex md:w-48 flex-col border-r border-neutral-200/60 sticky top-20 max-h-[calc(100vh-80px)] overflow-y-auto bg-white shadow-xs"
        role="navigation"
        aria-label="Product categories"
      >
        {categories.length === 0 ? (
          <div className="p-5 text-center text-neutral-500 text-sm">
            {error ? `Error: ${error}` : "No categories available"}
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100/50">
            {categories.map((category) => (
              <li key={category.id} className="relative group">
                <Link href={`/categories/${category.slug}`} legacyBehavior>
                  <a
                    className="flex items-center justify-between px-5 py-4 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-brand transition-colors focus:outline-none focus:bg-neutral-50"
                    onMouseEnter={() =>
                      category.megaMenuItems?.length > 0 &&
                      setOpenMenu(category.id)
                    }
                    onMouseLeave={() => setOpenMenu(null)}
                  >
                    <div className="flex items-center gap-2">
                      {category.icon && (
                        <span className="text-lg" title={category.name}>
                          {category.icon}
                        </span>
                      )}
                      <span>{category.name}</span>
                    </div>
                  </a>
                </Link>

                {/* Mega Menu Dropdown */}
                {category.megaMenuItems?.length > 0 && (
                  <MegaMenu
                    category={category}
                    isOpen={openMenu === category.id}
                    onClose={() => setOpenMenu(null)}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </aside>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
