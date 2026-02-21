import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import { LoadingSpinner, EmptyState } from "../components/Loading";
import { postRequest, validateOrder, APIError } from "../lib/api";

const DELIVERY_OPTIONS = [
  {
    id: "Standard",
    name: "Standard Delivery",
    description: "2-3 business days",
    price: 0,
    icon: "📦",
  },
  {
    id: "Express",
    name: "Express Delivery",
    description: "Next business day",
    price: 500,
    icon: "⚡",
  },
  {
    id: "Pickup",
    name: "Pickup at NextGen Mall",
    description: "South B, Nairobi",
    price: 0,
    icon: "📍",
  },
];

const PAYMENT_METHODS = [
  {
    id: "mpesa",
    name: "M-Pesa",
    description: "Pay securely via M-Pesa",
    icon: "📱",
  },
  {
    id: "cod",
    name: "Cash on Delivery",
    description: "Pay when your order arrives",
    icon: "💵",
  },
];

// Validation helpers
function isValidEmail(email) {
  if (!email) return true; // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function validateCheckoutForm(formData) {
  const errors = {};

  // Full name validation
  if (!formData.fullName || typeof formData.fullName !== "string") {
    errors.fullName = "Full name is required";
  } else {
    const trimmed = formData.fullName.trim();
    if (trimmed.length < 2) {
      errors.fullName = "Full name must be at least 2 characters";
    } else if (trimmed.length > 255) {
      errors.fullName = "Full name is too long";
    }
  }

  // Email validation (optional but if provided, must be valid)
  if (formData.email && !isValidEmail(formData.email.trim())) {
    errors.email = "Please enter a valid email address";
  }

  // Phone validation
  if (!formData.phone || typeof formData.phone !== "string") {
    errors.phone = "Phone number is required";
  } else {
    const trimmed = formData.phone.trim();
    if (trimmed.length < 7) {
      errors.phone = "Phone number must be at least 7 digits";
    } else if (trimmed.length > 50) {
      errors.phone = "Phone number is too long";
    }
  }

  // Address validation
  if (!formData.address || typeof formData.address !== "string") {
    errors.address = "Delivery address is required";
  } else {
    const trimmed = formData.address.trim();
    if (trimmed.length < 2) {
      errors.address = "Address must be at least 2 characters";
    } else if (trimmed.length > 500) {
      errors.address = "Address is too long";
    }
  }

  // Optional city validation
  if (formData.city && formData.city.length > 100) {
    errors.city = "City name is too long";
  }

  // Optional zipCode validation
  if (formData.zipCode && formData.zipCode.length > 20) {
    errors.zipCode = "ZIP code is too long";
  }

  // Optional notes validation
  if (formData.notes && formData.notes.length > 1000) {
    errors.notes = "Order notes are too long (max 1000 characters)";
  }

  return errors;
}

// Validate cart items before submission
function validateCartItems(cart) {
  if (!Array.isArray(cart) || cart.length === 0) {
    return "Cart is empty";
  }

  if (cart.length > 100) {
    return "Too many items in cart (max 100)";
  }

  for (const item of cart) {
    if (typeof item.id !== "number" || item.id < 1) {
      return "Invalid item in cart";
    }
    if (typeof item.price !== "number" || item.price < 0) {
      return "Invalid price in cart";
    }
    if (typeof item.quantity !== "number" || item.quantity < 1 || item.quantity > 100) {
      return "Invalid quantity in cart";
    }
  }

  return null;
}

export default function Checkout() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
    notes: "",
  });

  const [selectedDelivery, setSelectedDelivery] = useState("Standard");
  const [selectedPayment, setSelectedPayment] = useState("cod");

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("cart");
      if (!savedCart) {
        setCart([]);
      } else {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          setCart(parsed);
        } else {
          setCart([]);
        }
      }
    } catch (e) {
      // Error handled via state, user sees UI feedback
      setCart([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const deliveryOption = DELIVERY_OPTIONS.find((d) => d.id === selectedDelivery);

  const subtotal = cart.reduce((sum, item) => {
    const price = Math.max(0, item.price || 0);
    const qty = Math.max(1, item.quantity || 1);
    return sum + price * qty;
  }, 0);

  const tax = Math.round(subtotal * 0.16);
  const deliveryFee = deliveryOption?.price || 0;
  const total = subtotal + tax + deliveryFee;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError("");
    setSuccessMessage("");
    setErrors({});

    // Validate form
    const formErrors = validateCheckoutForm(formData);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    // Validate cart
    const cartError = validateCartItems(cart);
    if (cartError) {
      setGlobalError(cartError);
      return;
    }

    // Validate delivery method
    if (!["Standard", "Express", "Pickup"].includes(selectedDelivery)) {
      setGlobalError("Invalid delivery method selected");
      return;
    }

    // Validate payment method
    if (!["mpesa", "cod"].includes(selectedPayment)) {
      setGlobalError("Invalid payment method selected");
      return;
    }

    setSubmitting(true);

    try {
      // Build order data
      const orderItems = cart.map((item) => ({
        sneakerId: item.id,
        quantity: Math.floor(Math.max(1, Math.min(item.quantity || 1, 100))),
        price: Math.max(0, item.price || 0),
      }));

      const orderData = {
        customerName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        items: orderItems,
        location: formData.address.trim(),
        deliveryMethod: selectedDelivery,
      };

      // Validate against backend expectations
      validateOrder(orderData);

      // Submit order
      const response = await postRequest("/api/orders", orderData);

      if (!response) {
        throw new APIError("No response from server", 500, null);
      }

      if (!response.id) {
        throw new APIError("Invalid response from server", 500, null);
      }

      // Clear cart on success
      localStorage.removeItem("cart");
      setCart([]);

      setSuccessMessage(`✅ Order #${response.id} placed successfully! We'll contact you shortly.`);

      // Redirect after a brief delay
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      // Error displayed to user via setCheckoutError()

      if (error instanceof APIError) {
        if (error.status === 400) {
          setGlobalError("Invalid order data. Please check your inputs.");
        } else if (error.status === 408) {
          setGlobalError("Request timeout. Please check your connection and try again.");
        } else if (error.status === 0) {
          setGlobalError("Network error. Please check your connection and try again.");
        } else {
          setGlobalError(error.message || "Failed to place order. Please try again.");
        }
      } else {
        setGlobalError("An unexpected error occurred. Please try again.");
      }
      setSubmitting(false);
    }
  };

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
          title="Checkout"
          subtitle="Complete your order"
          background={true}
        />
        <div className="max-w-6xl mx-auto px-4 py-20">
          <Card className="p-20 text-center">
            <EmptyState
              icon="🛒"
              title="Your Cart is Empty"
              description="Add some sneakers to your cart before checking out."
              action={
                <button
                  onClick={() => router.push("/")}
                  className="px-8 py-3 bg-accent hover:bg-orange-600 text-gray-900 font-bold rounded-lg transition-all"
                >
                  Continue Shopping
                </button>
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
        title="Secure Checkout"
        subtitle="Complete your sneaker purchase"
        background={true}
      />

      <div className="max-w-7xl mx-auto px-4 py-16">
        {globalError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {globalError}
            <button
              onClick={() => setGlobalError("")}
              className="ml-4 font-semibold hover:text-red-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-8" noValidate>
            {/* Shipping Information */}
            <Card className="p-8 animate-slideUp">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="text-3xl">📦</span> Shipping Information
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all ${
                        errors.fullName
                          ? "border-red-300 focus:ring-red-200"
                          : "border-gray-200 focus:ring-accent"
                      }`}
                      placeholder="Your full name"
                      disabled={submitting}
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all ${
                        errors.email
                          ? "border-red-300 focus:ring-red-200"
                          : "border-gray-200 focus:ring-accent"
                      }`}
                      placeholder="your@email.com"
                      disabled={submitting}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all ${
                      errors.phone
                        ? "border-red-300 focus:ring-red-200"
                        : "border-gray-200 focus:ring-accent"
                    }`}
                    placeholder="+254 797 062 606"
                    disabled={submitting}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Delivery Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all ${
                      errors.address
                        ? "border-red-300 focus:ring-red-200"
                        : "border-gray-200 focus:ring-accent"
                    }`}
                    placeholder="Street address"
                    disabled={submitting}
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      City (Optional)
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all ${
                        errors.city
                          ? "border-red-300 focus:ring-red-200"
                          : "border-gray-200 focus:ring-accent"
                      }`}
                      placeholder="Nairobi"
                      disabled={submitting}
                    />
                    {errors.city && (
                      <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ZIP Code (Optional)
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all ${
                        errors.zipCode
                          ? "border-red-300 focus:ring-red-200"
                          : "border-gray-200 focus:ring-accent"
                      }`}
                      placeholder="00100"
                      disabled={submitting}
                    />
                    {errors.zipCode && (
                      <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Order Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all ${
                      errors.notes
                        ? "border-red-300 focus:ring-red-200"
                        : "border-gray-200 focus:ring-accent"
                    }`}
                    placeholder="Any special delivery instructions..."
                    disabled={submitting}
                  />
                  {errors.notes && (
                    <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Delivery Method */}
            <Card
              className="p-8 animate-slideUp"
              style={{ animationDelay: "100ms" }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="text-3xl">🚚</span> Delivery Method
              </h2>
              <div className="space-y-3">
                {DELIVERY_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedDelivery === option.id
                        ? "border-accent bg-accent/5"
                        : "border-gray-200 hover:border-gray-300"
                    } ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="radio"
                        name="delivery"
                        value={option.id}
                        checked={selectedDelivery === option.id}
                        onChange={(e) => setSelectedDelivery(e.target.value)}
                        className="w-5 h-5"
                        disabled={submitting}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{option.icon}</span>
                          <div>
                            <p className="font-bold text-gray-900">
                              {option.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {option.description}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {option.price === 0 ? "FREE" : `KES ${option.price}`}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </Card>

            {/* Payment Method */}
            <Card
              className="p-8 animate-slideUp"
              style={{ animationDelay: "200ms" }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="text-3xl">💳</span> Payment Method
              </h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedPayment === method.id
                        ? "border-accent bg-accent/5"
                        : "border-gray-200 hover:border-gray-300"
                    } ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={selectedPayment === method.id}
                        onChange={(e) => setSelectedPayment(e.target.value)}
                        className="w-5 h-5"
                        disabled={submitting}
                      />
                      <div className="flex-1 flex items-center gap-3">
                        <span className="text-2xl">{method.icon}</span>
                        <div>
                          <p className="font-bold text-gray-900">
                            {method.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {method.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </Card>
          </form>

          {/* Order Summary */}
          <div>
            <Card className="p-8 sticky top-24 animate-slideInRight space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Order Summary
              </h2>

              {/* Items */}
              <div className="max-h-64 overflow-y-auto space-y-3 pb-6 border-b border-gray-200">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-4 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {item.modelName || item.name || "Item"}
                      </p>
                      <p className="text-gray-600">
                        Size {item.size || "N/A"} × {item.quantity || 1}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      KES {(Math.max(0, item.price || 0) * (item.quantity || 1)).toFixed(0)}
                    </p>
                  </div>
                ))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="+254 797 062 606"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Delivery Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                      placeholder="Nairobi"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                      placeholder="00100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Order Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="Any special delivery instructions..."
                  />
                </div>
              </div>
            </Card>

            {/* Delivery Method */}
            <Card
              className="p-8 animate-slideUp"
              style={{ animationDelay: "100ms" }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="text-3xl">🚚</span> Delivery Method
              </h2>
              <div className="space-y-3">
                {DELIVERY_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedDelivery === option.id
                        ? "border-accent bg-accent/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="radio"
                        name="delivery"
                        value={option.id}
                        checked={selectedDelivery === option.id}
                        onChange={(e) => setSelectedDelivery(e.target.value)}
                        className="w-5 h-5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{option.icon}</span>
                          <div>
                            <p className="font-bold text-gray-900">
                              {option.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {option.description}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {option.price === 0 ? "FREE" : `KES ${option.price}`}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </Card>

            {/* Payment Method */}
            <Card
              className="p-8 animate-slideUp"
              style={{ animationDelay: "200ms" }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="text-3xl">💳</span> Payment Method
              </h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedPayment === method.id
                        ? "border-accent bg-accent/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={selectedPayment === method.id}
                        onChange={(e) => setSelectedPayment(e.target.value)}
                        className="w-5 h-5"
                      />
                      <div className="flex-1 flex items-center gap-3">
                        <span className="text-2xl">{method.icon}</span>
                        <div>
                          <p className="font-bold text-gray-900">
                            {method.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {method.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </Card>
          </form>

          {/* Order Summary */}
          <div>
            <Card className="p-8 sticky top-24 animate-slideInRight space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Order Summary
              </h2>

              {/* Items */}
              <div className="max-h-64 overflow-y-auto space-y-3 pb-6 border-b border-gray-200">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-4 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {item.modelName || item.name}
                      </p>
                      <p className="text-gray-600">
                        Size {item.size} × {item.quantity || 1}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      KES{" "}
                      {((item.price || 0) * (item.quantity || 1)).toFixed(0)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Calculations */}
              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span className="font-semibold">
                    KES {subtotal.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Tax (16%)</span>
                  <span className="font-semibold">KES {tax.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Delivery</span>
                  <span className="font-semibold">
                    {deliveryFee === 0 ? "FREE" : `KES ${deliveryFee}`}
                  </span>
                </div>
              </div>

              <div className="pt-6 border-t-2 border-gray-200">
                <div className="flex justify-between items-baseline mb-8">
                  <span className="text-lg text-gray-700">Total:</span>
                  <span className="text-4xl font-bold text-gray-900">
                    KES {total.toFixed(0)}
                  </span>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={submitting}
                  disabled={submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? "Processing..." : "Complete Order"}
