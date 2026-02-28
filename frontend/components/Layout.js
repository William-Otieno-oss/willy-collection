import Header from "./Header";
import Link from "next/link";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Footer() {
  const footerSections = [
    {
      title: "Contact us",
      links: [
        { label: "+254 797 062 606", href: "tel:+254797062606", icon: "📞" },
        {
          label: "willycolection4@gmail.com",
          href: "mailto:willycolection4@gmail.com",
          icon: "📧",
        },
        { label: "South B, NextGen Mall – Nairobi", href: null, icon: "📍" },
        { label: "8:00 AM – 8:00 PM", href: null, icon: "🕐" },
      ],
    },
    {
      title: "About",
      links: [
        { label: "Shipping policy", href: "/shipping" },
        { label: "Terms & conditions", href: "/terms" },
        { label: "Contact us", href: "/contact" },
        { label: "About us", href: "/about" },
        { label: "FAQs", href: "/faqs" },
      ],
    },
    {
      title: "Quick Links",
      links: [
        { label: "Offers", href: "/" },
        { label: "Shop by brand", href: "/brands" },
        { label: "Featured categories", href: "#" },
        { label: "Shopping guide", href: "#" },
        { label: "Delivery locations", href: "#" },
        { label: "Blog", href: "/blog" },
      ],
    },
    {
      title: "Categories",
      links: [
        { label: "Men", href: "/categories/men-shoes" },
        { label: "Women", href: "/categories/women-shoes" },
        { label: "Kids", href: "/categories/kids-shoes" },
        { label: "Sneakers", href: "/categories/sneakers" },
        { label: "Sports", href: "/categories/sport-shoes" },
        { label: "Canvas", href: "/categories/canvas-shoes" },
        { label: "Official", href: "/categories/official-shoes" },
        { label: "Boots", href: "/categories/boots" },
        { label: "Slip-Ons", href: "/categories/slip-on-shoes" },
      ],
    },
  ];

  return (
    <footer className="bg-gradient-to-b from-gray-950 to-black text-white mt-20">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {footerSections.map((section, idx) => (
            <div
              key={idx}
              className="animate-slideUp"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <h3 className="font-display font-bold text-lg mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {section.title}
              </h3>
              <ul className="space-y-4">
                {section.links.map((link, linkIdx) =>
                  link.href ? (
                    <li key={linkIdx}>
                      <Link href={link.href}>
                        <span className="text-gray-300 hover:text-accent transition-colors duration-300 cursor-pointer flex items-center gap-2 group">
                          {link.icon && <span>{link.icon}</span>}
                          <span className="group-hover:translate-x-1 transition-transform duration-300">
                            {link.label}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ) : (
                    <li
                      key={linkIdx}
                      className="text-gray-300 flex items-center gap-2"
                    >
                      {link.icon && <span>{link.icon}</span>}
                      <span>{link.label}</span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-800"></div>

      {/* Bottom Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Social Links */}
          <div className="flex items-center gap-6 justify-center md:justify-start">
            <span className="text-sm text-gray-400">Follow us:</span>
            <div className="flex gap-4">
              {[
                {
                  name: "Facebook",
                  href: "https://facebook.com/willycollection.ke",
                  icon: "f",
                },
                {
                  name: "Instagram",
                  href: "https://instagram.com/willycollection.ke",
                  icon: "📷",
                },
                {
                  name: "TikTok",
                  href: "https://tiktok.com/@willycollection.ke",
                  icon: "🎵",
                },
                {
                  name: "WhatsApp",
                  href: "https://wa.me/254797062606",
                  icon: "💬",
                },
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-gray-800 hover:bg-accent text-gray-300 hover:text-gray-900 rounded-lg transition-all duration-300 group transform hover:scale-110"
                  title={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="flex items-center justify-center gap-4">
            <span className="text-sm text-gray-400 hidden sm:inline">
              Payments:
            </span>
            <div className="flex gap-3">
              <div className="px-3 py-2 bg-gray-800 rounded-lg text-xs font-semibold text-orange-400">
                M-Pesa
              </div>
              <div className="px-3 py-2 bg-gray-800 rounded-lg text-xs font-semibold text-green-400">
                Cash
              </div>
            </div>
          </div>

          {/* Newsletter CTA */}
          <div className="flex justify-center md:justify-end">
            <a
              href="https://wa.me/254797062606"
              className="px-6 py-3 bg-gradient-to-r from-accent to-orange-600 hover:from-orange-600 hover:to-red-600 text-gray-900 font-semibold rounded-lg transition-all duration-300 flex items-center gap-2 group transform hover:scale-105"
            >
              <span>💬</span>
              <span>Message us</span>
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-800 px-4 sm:px-6 lg:px-8 py-8 bg-black/50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex flex-col items-center text-center">
            <p className="text-sm text-gray-400">
              <span className="font-semibold text-gray-300">
                willy COLLECTION
              </span>{" "}
              👟 – Premium sneakers & footwear delivery across Kenya
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            © 2026 All rights reserved. | Crafted with ❤️ for sneaker
            enthusiasts
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Developed by William Otieno Dancun
          </p>
        </div>
      </div>
    </footer>
  );
}
