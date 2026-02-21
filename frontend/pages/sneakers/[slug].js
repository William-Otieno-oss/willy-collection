import { useRouter } from "next/router";
import useSWR from "swr";
import { useState } from "react";
import Layout from "../../components/Layout";
import API_BASE, { getImageUrl } from "../../lib/api";

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function ProductPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [selectedSize, setSelectedSize] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState("");

  const { data } = useSWR(
    () => (slug ? `${API_BASE}/api/sneakers/${slug}` : null),
    fetcher,
  );

  const product = data;

  const getBrandName = (brand) => {
    return typeof brand === "object" ? brand?.name : brand;
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      setCartMessage("Please select a size");
      return;
    }

    if (!product.inStock) {
      setCartMessage("This product is out of stock");
      return;
    }

    setAddingToCart(true);

    try {
      // Get current cart from localStorage
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");

      // Add product to cart
      const cartItem = {
        id: product.id,
        modelName: product.modelName,
        price: product.price,
        size: selectedSize,
        quantity: 1,
        brand: product.brand,
        image: product.images?.[0]?.url,
        slug: product.slug,
      };

      // Check if item with same size already exists
      const existingItem = cart.find(
        (item) => item.id === product.id && item.size === selectedSize,
      );

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push(cartItem);
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      setCartMessage("✓ Added to cart!");

      // Trigger cart update in header
      window.dispatchEvent(
        new CustomEvent("cartUpdated", { detail: { cart } }),
      );

      // Reset message after 2 seconds
      setTimeout(() => {
        setCartMessage("");
        setSelectedSize("");
      }, 2000);
    } catch (e) {
      // Error silently handled, user sees notification via setError()
      setCartMessage("Error adding to cart");
    } finally {
      setAddingToCart(false);
    }
  };
  if (!product)
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-96">
          Loading...
        </div>
      </Layout>
    );
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Images */}
          <div>
            <div className="bg-gray-100 rounded-lg overflow-hidden mb-4">
              {product.images && product.images.length > 0 ? (
                <img
                  src={getImageUrl(product.images[0].url)}
                  alt={`${getBrandName(product.brand)} ${product.modelName}`}
                  className="w-full h-96 object-cover"
                />
              ) : (
                <div className="w-full h-96 bg-gray-200 flex items-center justify-center text-gray-400">
                  No image available
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((img) => (
                  <div
                    key={img.id}
                    className="bg-gray-100 rounded overflow-hidden"
                  >
                    <img
                      src={getImageUrl(img.url)}
                      alt="Thumbnail"
                      className="w-full h-24 object-cover hover:opacity-75 transition-opacity cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div>
            <div className="mb-4">
              <p className="text-sm text-gray-500 uppercase tracking-wide">
                {getBrandName(product.brand)}
              </p>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {product.modelName}
              </h1>
            </div>

            <div className="mb-6 pb-6 border-b border-gray-200">
              <p className="text-4xl font-bold text-gray-900">
                KES{" "}
                {typeof product.price === "string"
                  ? product.price
                  : product.price?.toFixed(0) || "0"}
              </p>
              {product.inStock ? (
                <p className="text-green-600 font-medium mt-2">✓ In Stock</p>
              ) : (
                <p className="text-red-600 font-medium mt-2">Out of Stock</p>
              )}
            </div>

            {product.description && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Description
                </h3>
                <p className="text-gray-600">{product.description}</p>
              </div>
            )}

            {/* Size Selector */}
            {product.stocks && product.stocks.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Select Size
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {product.stocks
                    .map((stock) => stock.size)
                    .sort((a, b) => a - b)
                    .map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`py-2 px-3 border rounded font-medium transition-all ${
                          selectedSize === size
                            ? "bg-gray-900 text-white border-gray-900"
                            : "border-gray-300 text-gray-900 hover:border-gray-900"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                </div>
              </div>
            )}

            <div className="space-y-3 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock || addingToCart}
                className={`w-full py-3 rounded font-semibold transition-all ${
                  !product.inStock || addingToCart
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-gray-900 text-white hover:bg-gray-800"
                }`}
              >
                {addingToCart ? "Adding..." : "Add to Cart"}
              </button>
              {cartMessage && (
                <p
                  className={`text-center text-sm font-medium ${
                    cartMessage.includes("✓")
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {cartMessage}
                </p>
              )}
              <a
                className="w-full block bg-green-600 text-white py-3 rounded font-semibold hover:bg-green-700 transition-colors text-center"
                href={`https://wa.me/?text=Hi%20interested%20in%20${encodeURIComponent(getBrandName(product.brand) + " " + product.modelName)}`}
                target="_blank"
                rel="noreferrer"
              >
                📱 Order via WhatsApp
              </a>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>Need help?</strong> Contact us on WhatsApp or email
                support@willycolection.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
