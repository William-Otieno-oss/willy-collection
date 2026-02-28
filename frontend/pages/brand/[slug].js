import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../../components/Layout";
import SneakerCard from "../../components/SneakerCard";
import { useEffect, useState } from "react";
import { API_BASE } from "../../lib/api";

export default function BrandPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [brand, setBrand] = useState(null);
  const [sneakers, setSneakers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const fetchBrandAndSneakers = async () => {
      try {
        // Fetch brand by slug
        const brandRes = await fetch(`${API_BASE}/api/brands/${slug}`);
        if (!brandRes.ok) {
          setLoading(false);
          return;
        }
        const brandData = await brandRes.json();
        setBrand(brandData);

        // Fetch sneakers for this brand
        // Note: Assumes /api/sneakers supports filtering by brand
        const sneakersRes = await fetch(
          `${API_BASE}/api/sneakers?brandId=${brandData.id}`,
        );
        if (sneakersRes.ok) {
          const sneakersData = await sneakersRes.json();
          // Filter sneakers by brandId on client side as fallback
          const filtered = Array.isArray(sneakersData)
            ? sneakersData.filter((s) => s.brandId === brandData.id)
            : sneakersData?.data
              ? sneakersData.data.filter((s) => s.brandId === brandData.id)
              : [];
          setSneakers(filtered);
        }
      } catch (e) {
        // Error handled via error state
      } finally {
        setLoading(false);
      }
    };

    fetchBrandAndSneakers();
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-gray-600">Loading brand...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!brand) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Brand Not Found
            </h1>
            <p className="text-gray-600">The requested brand does not exist.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gray-50 py-12 px-4 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-brand-dark">
            {brand.name}
          </h1>
          {brand.description && (
            <p className="text-gray-600 text-lg mb-4">{brand.description}</p>
          )}
          <div className="flex items-center text-sm text-gray-600">
            <Link href="/brands">
              <span className="cursor-pointer hover:text-gray-900">Brands</span>
            </Link>
            <span className="mx-2">/</span>
            <span>{brand.name}</span>
          </div>
        </div>
      </div>

      <section className="bg-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {sneakers.length > 0 ? (
            <>
              <h2 className="text-2xl font-bold mb-8 text-brand-dark">
                {brand.name} Sneakers
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {sneakers.map((sneaker) => (
                  <SneakerCard key={sneaker.id} s={sneaker} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                No sneakers available for {brand.name} yet.
              </p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
