import useSWR from "swr";
import Link from "next/link";
import Layout from "../components/Layout";
import SneakerCard from "../components/SneakerCard";
import { API_BASE } from "../lib/api";

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function OffersPage() {
  const { data } = useSWR(`${API_BASE}/api/sneakers`, fetcher);
  const products = data || [];

  // Filter products on sale
  const offeredProducts = products.filter((p) => p.onSale);

  return (
    <Layout>
      {/* Page Header */}
      <div className="bg-gray-50 py-12 px-4 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-brand-dark">Offers</h1>
          <div className="flex items-center text-sm text-gray-600">
            <Link href="/" className="cursor-pointer hover:text-gray-900">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span>Offers</span>
          </div>
        </div>
      </div>

      {/* Offers Grid */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600 mb-8">
            Showing {offeredProducts.length} products on offer
          </p>

          {offeredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {offeredProducts.map((product) => (
                <SneakerCard key={product.id} s={product} onSale={true} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="text-gray-600 text-lg mb-4">
                No products on offer at the moment
              </p>
              <Link href="/">
                <button className="px-6 py-2 rounded font-semibold transition-opacity hover:opacity-90 bg-brand text-brand-dark">
                  Continue Shopping
                </button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
