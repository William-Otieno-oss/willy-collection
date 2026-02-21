import Layout from "../components/Layout";
import { useState } from "react";

export default function FAQs() {
  const [expandedId, setExpandedId] = useState(null);

  const faqs = [
    {
      id: 1,
      question: "Do I need an account to order?",
      answer: "No. You can order directly without creating an account.",
    },
    {
      id: 2,
      question: "Do you deliver outside Nairobi?",
      answer: "Yes. We deliver across Kenya. Delivery charges may apply.",
    },
    {
      id: 3,
      question: "How long does delivery take?",
      answer:
        "Nairobi & Thika: Same day or next day. Other towns: 1 – 3 working days",
    },
    {
      id: 4,
      question: "Can I order via WhatsApp?",
      answer:
        "Yes. You can place your order directly via WhatsApp: 📞 +254 797 062 606",
    },
    {
      id: 5,
      question: "What payment methods do you accept?",
      answer: "We accept M-Pesa and Cash on delivery (in selected areas)",
    },
    {
      id: 6,
      question: "Can I exchange a product?",
      answer:
        "Yes. Size exchanges are allowed within 24 hours if the product is unused and in original packaging.",
    },
  ];

  const toggleExpanded = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              ❓ Frequently Asked Questions
            </h1>
            <p className="text-lg text-gray-300">
              Find answers to common questions about our products and services
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-200"
              >
                {/* Question Button */}
                <button
                  onClick={() => toggleExpanded(faq.id)}
                  className="w-full px-6 py-5 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                  <span
                    className={`text-2xl text-gray-600 flex-shrink-0 transition-transform duration-200 ${
                      expandedId === faq.id ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {/* Answer */}
                {expandedId === faq.id && (
                  <div className="px-6 py-4 bg-white border-t border-gray-200">
                    <p className="text-gray-700 text-lg leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <section className="mt-16 pt-12 border-t border-gray-200">
            <div className="bg-blue-50 p-8 rounded-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Didn't find your answer?
              </h2>
              <p className="text-gray-700 mb-6">
                Contact us directly and we'll be happy to help!
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="tel:+254797062606"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  📞 Call +254 797 062 606
                </a>
                <a
                  href="https://wa.me/254797062606"
                  className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  💬 WhatsApp
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
