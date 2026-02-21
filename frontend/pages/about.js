import Layout from "../components/Layout";

export default function About() {
  return (
    <Layout>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              About willy COLLECTION
            </h1>
            <p className="text-lg text-gray-300">
              Kenya-based footwear brand dedicated to offering high-quality
              sneakers and stylish shoes
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-16">
          {/* About Us */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">
              Who We Are
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              willy COLLECTION is a Kenya-based footwear brand dedicated to
              offering high-quality sneakers and stylish shoes at fair and
              affordable prices. We specialize in trendy, durable, and
              comfortable footwear carefully sourced to meet our customers'
              style and comfort needs.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Our mission is to provide premium footwear with honest pricing,
              reliable service, and excellent customer support. Whether you're
              looking for everyday sneakers, sports shoes, or official footwear,
              willy COLLECTION is your trusted plug.
            </p>
          </section>

          {/* Location */}
          <section className="mb-16 bg-gray-50 p-8 rounded-lg">
            <p className="text-lg text-gray-700 mb-4">
              <span className="text-2xl mr-3">📍</span>
              <strong>Located at South B – NextGen Mall</strong>, we deliver
              across Kenya and offer easy ordering through our website and
              WhatsApp.
            </p>
          </section>

          {/* Why Choose Us */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-gray-900">
              Why Choose willy COLLECTION?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-start gap-4">
                <span className="text-3xl">✔</span>
                <div>
                  <h3 className="font-bold text-xl mb-2">
                    Quality Sneakers & Footwear
                  </h3>
                  <p className="text-gray-700">
                    Carefully curated selection of premium footwear
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-3xl">✔</span>
                <div>
                  <h3 className="font-bold text-xl mb-2">
                    Affordable & Fair Prices
                  </h3>
                  <p className="text-gray-700">
                    Great quality at competitive prices
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-3xl">✔</span>
                <div>
                  <h3 className="font-bold text-xl mb-2">
                    Multiple Sizes & Styles
                  </h3>
                  <p className="text-gray-700">
                    Wide variety to suit every taste
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-3xl">✔</span>
                <div>
                  <h3 className="font-bold text-xl mb-2">
                    Fast & Reliable Delivery
                  </h3>
                  <p className="text-gray-700">Quick delivery across Kenya</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-3xl">✔</span>
                <div>
                  <h3 className="font-bold text-xl mb-2">
                    Friendly Customer Service
                  </h3>
                  <p className="text-gray-700">Always ready to assist you</p>
                </div>
              </div>
            </div>
          </section>

          {/* Brands */}
          <section>
            <h2 className="text-3xl font-bold mb-8 text-gray-900">
              Featured Brands
            </h2>
            <div className="bg-gray-50 p-8 rounded-lg">
              <div className="flex flex-wrap gap-6">
                {[
                  "Nike",
                  "Adidas",
                  "Naked Wolfe",
                  "Louis Vuitton",
                  "Alexander McQueen",
                  "Clarks",
                ].map((brand) => (
                  <span
                    key={brand}
                    className="text-lg font-semibold text-gray-700"
                  >
                    • {brand}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
