import Layout from "../components/Layout";

export default function Shipping() {
  return (
    <Layout>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              🚚 Shipping & Delivery Policy
            </h1>
            <p className="text-lg text-gray-300">
              Fast, safe, and reliable delivery across Kenya
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-16">
          {/* Delivery Areas */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-gray-900">
              📦 Delivery Areas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-green-50 p-8 rounded-lg border-l-4 border-green-500">
                <h3 className="font-bold text-xl mb-2 text-green-700">
                  Free Delivery
                </h3>
                <p className="text-gray-700 text-lg">Nairobi & Thika</p>
              </div>
              <div className="bg-blue-50 p-8 rounded-lg border-l-4 border-blue-500">
                <h3 className="font-bold text-xl mb-2 text-blue-700">
                  Other Locations
                </h3>
                <p className="text-gray-700">
                  Delivery fee applies based on distance
                </p>
              </div>
            </div>
          </section>

          {/* Delivery Time */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-gray-900">
              ⏱ Delivery Time
            </h2>
            <div className="bg-gray-50 p-8 rounded-lg">
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-xl text-gray-900 mb-2">
                    Nairobi & Thika
                  </h3>
                  <p className="text-gray-700 text-lg">
                    Same day or next day delivery
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-900 mb-2">
                    Other towns
                  </h3>
                  <p className="text-gray-700 text-lg">1 – 3 working days</p>
                </div>
              </div>
            </div>
          </section>

          {/* Order Processing */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-gray-900">
              📥 Order Processing
            </h2>
            <div className="bg-yellow-50 p-8 rounded-lg border-l-4 border-yellow-500">
              <p className="text-gray-700 text-lg">
                Orders are processed immediately after confirmation. You will
                receive a confirmation message once your order is ready for
                dispatch.
              </p>
            </div>
          </section>

          {/* Delivery Charges */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-gray-900">
              💰 Delivery Charges
            </h2>
            <div className="bg-gray-50 p-8 rounded-lg">
              <p className="text-gray-700 text-lg">
                Delivery fees are calculated based on your location and
                communicated before dispatch.
              </p>
            </div>
          </section>

          {/* Failed Deliveries */}
          <section>
            <h2 className="text-3xl font-bold mb-8 text-gray-900">
              🚫 Failed Deliveries
            </h2>
            <div className="bg-red-50 p-8 rounded-lg border-l-4 border-red-500">
              <p className="text-gray-700 text-lg">
                If delivery fails due to incorrect details or customer
                unavailability, re-delivery charges may apply.
              </p>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
