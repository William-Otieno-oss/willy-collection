import Link from "next/link";

const BrandSection = ({ brands }) => {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <span className="text-sm font-semibold text-accent uppercase tracking-widest">
            Featured
          </span>
          <h2
            className="text-4xl md:text-5xl font-display font-bold mt-3 mb-4"
            style={{ color: "#1c140c" }}
          >
            Shop by Brands
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl">
            Explore your favorite brands and collections
          </p>
        </div>

        {brands.map((brandGroup, idx) => (
          <div key={idx} className="mb-12">
            <h2
              className="text-2xl font-bold mb-8"
              style={{ color: "#1c140c" }}
            >
              {brandGroup.category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {brandGroup.items.map((brand) => (
                <Link key={brand.slug} href={`/categories/${brand.slug}`}>
                  <div className="group cursor-pointer">
                    <div className="p-8 rounded-lg border border-gray-200 text-center hover:border-gray-400 hover:shadow-md transition-all group-hover:bg-gray-50">
                      <div className="text-4xl mb-3">👟</div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
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
