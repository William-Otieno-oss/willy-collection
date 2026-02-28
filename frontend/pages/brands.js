import Link from "next/link";
import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import { API_BASE } from "../lib/api";

export default function BrandsPage() {
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/brands`);
        if (!res.ok) return;
        const data = await res.json();
        setBrands(Array.isArray(data) ? data : data?.data || []);
      } catch (e) {
        // Error handled via error state
      }
    };
    fetchBrands();
  }, []);

  return (
    <Layout>
      <div className="bg-gray-50 py-12 px-4 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-brand-dark">
            Shop by Brand
          </h1>
          <div className="flex items-center text-sm text-gray-600">
            <Link href="/">
              <span className="cursor-pointer hover:text-gray-900">Home</span>
            </Link>
            <span className="mx-2">/</span>
            <span>Brands</span>
          </div>
        </div>
      </div>

      <section className="bg-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {brands.map((brand) => (
              <div key={brand.slug} className="group cursor-pointer">
                <Link href={`/brand/${brand.slug}`} legacyBehavior>
                  <a className="block w-full">
                    <div className="p-8 rounded-lg border border-gray-200 text-center hover:border-gray-400 hover:shadow-md transition-all group-hover:bg-gray-50 min-h-32 flex flex-col items-center justify-center w-full">
                      <div className="text-4xl mb-3 flex-shrink-0">🏷️</div>
                      <h3
                        className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-xs w-24"
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {brand.name}
                      </h3>
                    </div>
                  </a>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
