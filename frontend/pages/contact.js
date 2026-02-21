import Layout from "../components/Layout";
import Link from "next/link";

export default function Contact() {
  return (
    <Layout>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              📞 Contact willy COLLECTION
            </h1>
            <p className="text-lg text-gray-300">
              Get in touch with us for any inquiries
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-16">
          {/* Contact Information */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-12 text-gray-900">
              Get in Touch
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {/* Location */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-lg">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">
                  📍 Location
                </h3>
                <p className="text-gray-700 text-lg mb-2">
                  South B, NextGen Mall
                </p>
                <p className="text-gray-700 text-lg">Nairobi, Kenya</p>
              </div>

              {/* Operating Hours */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-lg">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">
                  🕒 Operating Hours
                </h3>
                <p className="text-gray-700 text-lg">Monday - Sunday</p>
                <p className="text-gray-700 text-lg font-semibold">
                  8:00 AM – 8:00 PM
                </p>
              </div>

              {/* Phone */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-lg">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">
                  📞 Phone / WhatsApp
                </h3>
                <a
                  href="tel:+254797062606"
                  className="text-lg font-semibold text-purple-600 hover:text-purple-800 transition-colors"
                >
                  +254 797 062 606
                </a>
              </div>

              {/* Email */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-lg">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">
                  📧 Email
                </h3>
                <a
                  href="mailto:willycolection4@gmail.com"
                  className="text-lg font-semibold text-orange-600 hover:text-orange-800 transition-colors break-all"
                >
                  willycolection4@gmail.com
                </a>
              </div>
            </div>
          </section>

          {/* How to Order */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-gray-900">
              How to Order
            </h2>

            <div className="bg-gray-50 p-8 rounded-lg">
              <p className="text-gray-700 text-lg mb-6">
                For faster service via WhatsApp, kindly send us:
              </p>

              <ul className="space-y-4 text-gray-700 text-lg">
                <li className="flex items-center gap-3">
                  <span className="text-2xl">👟</span>
                  <span>Shoe name</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-2xl">📏</span>
                  <span>Size</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-2xl">📍</span>
                  <span>Location</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Quick Links */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-gray-900">
              Quick Links
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/about" legacyBehavior>
                <a className="bg-blue-50 hover:bg-blue-100 p-6 rounded-lg cursor-pointer transition-colors block">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    About Us
                  </h3>
                  <p className="text-gray-600">
                    Learn more about willy COLLECTION
                  </p>
                </a>
              </Link>

              <Link href="/shipping" legacyBehavior>
                <a className="bg-green-50 hover:bg-green-100 p-6 rounded-lg cursor-pointer transition-colors block">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    Shipping Policy
                  </h3>
                  <p className="text-gray-600">
                    Learn about our delivery options
                  </p>
                </a>
              </Link>

              <Link href="/terms" legacyBehavior>
                <a className="bg-purple-50 hover:bg-purple-100 p-6 rounded-lg cursor-pointer transition-colors block">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    Terms & Conditions
                  </h3>
                  <p className="text-gray-600">View our terms of service</p>
                </a>
              </Link>

              <Link href="/faqs" legacyBehavior>
                <a className="bg-orange-50 hover:bg-orange-100 p-6 rounded-lg cursor-pointer transition-colors block">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">FAQs</h3>
                  <p className="text-gray-600">Frequently asked questions</p>
                </a>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
