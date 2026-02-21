import Layout from "../components/Layout";

export default function Terms() {
  return (
    <Layout>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              📜 Terms & Conditions
            </h1>
            <p className="text-lg text-gray-300">
              Please read carefully before using our services
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-16">
          <p className="text-lg text-gray-700 mb-12">
            By using our website and services, you agree to the following terms:
          </p>

          {/* Orders */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">🛒 Orders</h2>
            <ul className="space-y-4 text-gray-700 text-lg">
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>All orders must be confirmed before dispatch.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>
                  We reserve the right to cancel orders if product availability
                  changes.
                </span>
              </li>
            </ul>
          </section>

          {/* Pricing */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              💲 Pricing
            </h2>
            <ul className="space-y-4 text-gray-700 text-lg">
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>Prices may change without prior notice.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>
                  Delivery fees are charged separately unless stated otherwise.
                </span>
              </li>
            </ul>
          </section>

          {/* Payments */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              💳 Payments
            </h2>
            <ul className="space-y-4 text-gray-700 text-lg">
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>
                  Payment must be completed as agreed before delivery.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>
                  Cash on delivery is available only in selected areas.
                </span>
              </li>
            </ul>
          </section>

          {/* Returns & Exchanges */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              🔁 Returns & Exchanges
            </h2>
            <ul className="space-y-4 text-gray-700 text-lg">
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>Exchanges allowed only for size issues.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>Requests must be made within 24 hours of delivery.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>Product must be unused and in original packaging.</span>
              </li>
            </ul>
          </section>

          {/* Stock Availability */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              📦 Stock Availability
            </h2>
            <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
              <p className="text-gray-700 text-lg">
                All items are subject to availability.
              </p>
            </div>
          </section>

          {/* Liability */}
          <section>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              ⚠️ Liability
            </h2>
            <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
              <p className="text-gray-700 text-lg">
                willy COLLECTION is not responsible for damages caused after
                product use.
              </p>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
