import Link from "next/link";

const BrandSection = ({ brands }) => {
  return (
    <section className="py-32 px-4 sm:px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-24">
          <span className="text-xs font-semibold text-brand/70 uppercase tracking-widest">
            Featured
          </span>
          <h2 className="text-5xl font-semibold mt-6 mb-7 text-neutral-900">
            Shop by Brands
          </h2>
          <p className="text-lg text-neutral-600 max-w-3xl leading-relaxed">
            Explore your favorite brands and exclusive collections in one
            curated destination.
          </p>
        </div>

        {brands.map((brandGroup, idx) => (
          <div key={idx} className="mb-24">
            <h3 className="text-2xl font-semibold mb-10 text-neutral-900">
              {brandGroup.category}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {brandGroup.items.map((brand) => (
                <Link key={brand.slug} href={`/categories/${brand.slug}`}>
                  <div className="group cursor-pointer">
                    <div className="p-6 rounded-lg border border-neutral-200/60 text-center hover:border-brand/40 hover:shadow-sm hover:scale-105 transition-all duration-200 bg-white">
                      <div className="text-4xl mb-3 transition-transform duration-200 group-hover:scale-110">
                        👟
                      </div>
                      <h3 className="text-xs font-medium text-neutral-900 group-hover:text-brand transition-colors duration-200 line-clamp-2">
                        {brand.name}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BrandSection;
