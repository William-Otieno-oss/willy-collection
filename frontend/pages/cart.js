import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import { EmptyState, LoadingSpinner } from "../components/Loading";
import { getImageUrl } from "../lib/api";

// Max quantity per item to prevent DoS
const MAX_QUANTITY_PER_ITEM = 100;
const MAX_ITEMS_IN_CART = 100;
const MAX_PRICE_VALUE = 999999.99;
const TAX_RATE = 0.16;

// Validate cart item structure
function validateCartItem(item) {
  if (!item || typeof item !== "object") {
    return false;
  }

  if (typeof item.id !== "number" || item.id < 1) {
    return false;
  }

  if (!item.modelName || typeof item.modelName !== "string") {
    return false;
  }

  if (typeof item.price !== "number" || item.price < 0 || item.price > MAX_PRICE_VALUE) {
    return false;
  }

  if (!item.size || typeof item.size !== "string") {
    return false;
  }

  const quantity = item.quantity || 1;
  if (typeof quantity !== "number" || quantity < 1 || quantity > MAX_QUANTITY_PER_ITEM) {
    return false;
  }

  return true;
}

// Sanitize cart data from localStorage
function sanitizeCart(rawCart) {
  if (!Array.isArray(rawCart)) {
    return [];
  }

  return rawCart
    .filter(validateCartItem)
    .slice(0, MAX_ITEMS_IN_CART)
    .map((item) => ({
      ...item,
      quantity: Math.min(Math.max(Math.floor(item.quantity || 1), 1), MAX_QUANTITY_PER_ITEM),
      price: Math.min(Math.max(Math.floor(item.price), 0), MAX_PRICE_VALUE),
    }));
}

export default function Cart() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState("");

  const getBrandName = (brand) => {
    if (!brand) return "Unknown";
    return typeof brand === "object" ? brand?.name : String(brand);
  };

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("cart");
      if (!savedCart) {
        setCart([]);
      } else {
        const parsedCart = JSON.parse(savedCart);
        const sanitized = sanitizeCart(parsedCart);
        setCart(sanitized);
        // Save sanitized version back to localStorage
        if (sanitized.length !== parsedCart.length) {
          localStorage.setItem("cart", JSON.stringify(sanitized));
        }
      }
    } catch (e) {
      // Error silently handled, cart state preserved
      setCart([]);
      setError("Failed to load cart. Starting fresh.");
      localStorage.removeItem("cart");
    } finally {
      setLoading(false);
    }
  }, []);

  const removeFromCart = (itemId) => {
    if (typeof itemId !== "number" || itemId < 1) {
      return;
    }

    setRemoving(itemId);
    setTimeout(() => {
      const updated = cart.filter((item) => item.id !== itemId);
      setCart(updated);
      try {
        localStorage.setItem("cart", JSON.stringify(updated));
      } catch (e) {
        // Error handled, cart state maintained
        setError("Failed to update cart.");
      }
      setRemoving(null);
    }, 300);
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (typeof itemId !== "number" || itemId < 1) {
      return;
    }

    const quantity = Math.floor(newQuantity);
    if (quantity < 1) {
      removeFromCart(itemId);
      return;
    }

    if (quantity > MAX_QUANTITY_PER_ITEM) {
      setError(`Maximum quantity is ${MAX_QUANTITY_PER_ITEM}`);
      return;
    }

    const updated = cart.map((item) =>
      item.id === itemId ? { ...item, quantity } : item,
    );
    setCart(updated);
    try {
      localStorage.setItem("cart", JSON.stringify(updated));
    } catch (e) {
      console.error("Cart save error:", e);
      setError("Failed to update cart quantity.");
    }
  };

  const subtotal = cart.reduce((sum, item) => {
    const price = Math.max(0, Math.min(item.price || 0, MAX_PRICE_VALUE));
    const quantity = Math.max(1, Math.min(item.quantity || 1, MAX_QUANTITY_PER_ITEM));
    return sum + price * quantity;
  }, 0);

  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax;

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner overlay={false} />
      </Layout>
    );
  }

  if (cart.length === 0) {
    return (
      <Layout>
        <PageHeader
          title="Shopping Cart"
          subtitle="Your cart is currently empty"
          background={true}
        />
        <div className="max-w-6xl mx-auto px-4 py-20">
          <Card className="p-20 text-center">
            <EmptyState
              icon="🛍️"
              title="Your Cart is Empty"
              description="Start exploring our premium sneaker collection and find your perfect pair."
              action={
                <Link href="/" legacyBehavior>
                  <a>
                    <Button variant="primary" size="lg">
                      🔝 Continue Shopping
                    </Button>
                  </a>
                </Link>
              }
            />
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title="Shopping Cart"
        subtitle={`${cart.length} item${cart.length !== 1 ? "s" : ""} in your cart`}
        background={true}
      />

      <div className="max-w-7xl mx-auto px-4 py-16">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
            <button
              onClick={() => setError("")}
              className="ml-4 font-semibold hover:text-red-900"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {cart.map((item, idx) => (
                <div
                  key={item.id}
                  className={`
                    animate-slideUp transition-all duration-300
                    ${removing === item.id ? "opacity-50 scale-95" : "opacity-100"}
                  `}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <Card className="p-6 hover:shadow-lg transition-all duration-300">
                    <div className="flex gap-6">
                      {/* Product Image */}
                      <div className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 group">
                        <img
                          src={
                            getImageUrl(item.image) ||
                            getImageUrl(item.images?.[0]?.url) ||
                            "/placeholder.png"
                          }
                          alt={item.modelName || item.name || "Sneaker"}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = "/placeholder.png";
                          }}
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="text-xs text-gray-500 uppercase font-semibold tracking-widest">
                                {getBrandName(item.brand)}
                              </p>
                              <h3 className="text-lg font-bold text-gray-900 mt-1">
                                {item.modelName || item.name || "Unknown"}
                              </h3>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500 hover:text-red-700"
                              aria-label="Remove from cart"
                              disabled={removing === item.id}
                            >
                              <svg
                                className="w-5 h-5"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                              </svg>
                            </button>
                          </div>
                          <p className="text-sm text-gray-600">
                            Size:{" "}
                            <span className="font-semibold text-gray-900">
                              {item.size || "N/A"}
                            </span>
                          </p>
                        </div>

                        {/* Quantity Control */}
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  (item.quantity || 1) - 1,
                                )
                              }
                              className="px-3 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
                              aria-label="Decrease quantity"
                              disabled={removing === item.id || item.quantity <= 1}
                            >
                              −
                            </button>
                            <span className="px-4 py-2 font-semibold text-gray-900 min-w-[2rem] text-center">
                              {item.quantity || 1}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  (item.quantity || 1) + 1,
                                )
                              }
                              className="px-3 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
                              aria-label="Increase quantity"
                              disabled={removing === item.id || (item.quantity || 1) >= MAX_QUANTITY_PER_ITEM}
                            >
                              +
                            </button>
                          </div>
                          {(item.quantity || 1) >= MAX_QUANTITY_PER_ITEM && (
                            <span className="text-xs text-gray-500">Max reached</span>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex flex-col justify-between items-end">
                        <div className="text-right">
                          <p className="text-3xl font-bold text-gray-900">
                            KES {(Math.max(0, item.price || 0) * (item.quantity || 1)).toFixed(0)}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            KES {Math.max(0, item.price || 0).toFixed(0)} each
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>

            {/* Continue Shopping Link */}
            <div className="mt-8">
              <Link href="/" legacyBehavior>
                <a className="text-accent hover:text-orange-600 font-semibold flex items-center gap-2 group inline-flex">
                  <span className="group-hover:-translate-x-1 transition-transform">
                    ←
                  </span>
                  Continue Shopping
                </a>
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="p-8 sticky top-24 animate-slideInRight">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">
                Order Summary
              </h2>

              <div className="space-y-4 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span className="font-semibold">
                    KES {subtotal.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
                  <span className="font-semibold">KES {tax.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Delivery</span>
                  <span className="font-semibold text-green-600">FREE</span>
                </div>
              </div>

              <div className="my-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-baseline">
                  <span className="text-lg text-gray-700">Total:</span>
                  <span className="text-4xl font-bold text-gray-900">
                    KES {total.toFixed(0)}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => router.push("/checkout")}
                variant="primary"
                size="lg"
                fullWidth
                className="mb-4"
              >
                Proceed to Checkout
              </Button>

              <Button
                onClick={() => router.push("/")}
                variant="secondary"
                size="lg"
                fullWidth
              >
                Continue Shopping
              </Button>

              {/* Trust Badges */}
              <div className="mt-8 pt-8 border-t border-gray-100 space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-lg">🛡️</span>
                  <span>Secure checkout with SSL encryption</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-lg">🚚</span>
                  <span>Free delivery across Kenya</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-lg">💬</span>
                  <span>24/7 customer support</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Delivery</span>
                  <span className="font-semibold text-green-600">FREE</span>
                </div>
              </div>

              <div className="my-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-baseline">
                  <span className="text-lg text-gray-700">Total:</span>
                  <span className="text-4xl font-bold text-gray-900">
                    KES {total.toFixed(0)}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => router.push("/checkout")}
                variant="primary"
                size="lg"
                fullWidth
                className="mb-4"
              >
                Proceed to Checkout
              </Button>

              <Button
                onClick={() => router.push("/")}
                variant="secondary"
                size="lg"
                fullWidth
              >
                Continue Shopping
              </Button>

              {/* Trust Badges */}
              <div className="mt-8 pt-8 border-t border-gray-100 space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-lg">🛡️</span>
                  <span>Secure checkout with SSL encryption</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-lg">🚚</span>
                  <span>Free delivery across Kenya</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-lg">💬</span>
                  <span>24/7 customer support</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
