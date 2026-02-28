import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";

const TAX_RATE = 0.16;

function safeLoadCart() {
  try {
    const raw = localStorage.getItem("cart");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Basic sanitation: ensure minimal fields exist to avoid runtime errors
    return parsed.map((it) => ({
      id: Number(it.id) || 0,
      modelName: String(it.modelName || it.name || "Unknown"),
      price: Number(it.price) || 0,
      quantity: Math.max(1, Math.floor(Number(it.quantity) || 1)),
      size: String(it.size || "N/A"),
      image:
        it.image || (it.images && it.images[0] && it.images[0].url) || null,
      brand: it.brand || null,
    }));
  } catch (e) {
    return [];
  }
}

export default function Checkout() {
  const router = useRouter();
  const [cart, setCart] = useState([]);

  // form state
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [checkoutRequestId, setCheckoutRequestId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null); // "pending" | "paid" | "failed"
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    setCart(safeLoadCart());
  }, []);

  const subtotal = cart.reduce(
    (s, it) => s + (Number(it.price) || 0) * (it.quantity || 1),
    0,
  );
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setSubmitting(true);
    setOrderError("");
    try {
      if (paymentMethod === "mpesa") {
        // initiate payment before creating order
        const payResp = await fetch("/api/payments/mpesa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: null, // order not created yet, server can create provisional order or attach later
            mpesaNumber,
            amount: cart.reduce((s, it) => s + it.price * it.quantity, 0),
            // alternatively send full cart and create order server-side after payment
            items: cart.map((it) => ({
              sneakerId: it.id,
              price: it.price,
              quantity: it.quantity,
              sneakerName: it.modelName,
              size: it.size,
            })),
            customerName,
            phone,
            location,
          }),
        });
        if (payResp.ok) {
          const data = await payResp.json().catch(() => ({}));
          const reqId = data.checkoutRequestId;
          const ordId = data.orderId;
          setCheckoutRequestId(reqId || null);
          setOrderId(ordId || null);
          setPaymentStatus("pending");
          // start polling endpoint for status
          setPolling(true);
        } else {
          const errdata = await payResp.json().catch(() => ({}));
          setOrderError(errdata.message || "Failed to initiate payment");
        }
      } else {
        const payload = {
          customerName,
          phone,
          location,
          items: cart.map((it) => ({
            sneakerId: it.id,
            price: it.price,
            quantity: it.quantity,
            sneakerName: it.modelName,
            size: it.size,
          })),
        };
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          setOrderSuccess(true);
          setOrderId(data.id || null);
          // clear cart
          localStorage.removeItem("cart");
          window.dispatchEvent(new Event("cartUpdated"));
          // stay on page and show confirmation
        } else {
          const data = await res.json().catch(() => ({}));
          setOrderError(data.error?.message || "Failed to place order");
        }
      }
    } catch (err) {
      setOrderError(err.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  // effect to poll payment status when needed
  useEffect(() => {
    let interval;
    if (polling && checkoutRequestId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/payments/mpesa/status/${encodeURIComponent(
              checkoutRequestId,
            )}`,
          );
          if (res.ok) {
            const data = await res.json().catch(() => ({}));
            if (data.status && data.status !== paymentStatus) {
              setPaymentStatus(data.status);
              if (data.status === "paid") {
                // payment succeeded, clear cart and stop polling
                localStorage.removeItem("cart");
                window.dispatchEvent(new Event("cartUpdated"));
                setOrderSuccess(true);
                setPolling(false);
              }
              if (data.status === "failed") {
                setOrderError("Payment failed. Please try again.");
                setPolling(false);
              }
            }
          }
        } catch (e) {
          // ignore network errors, try again next interval
        }
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [polling, checkoutRequestId, paymentStatus]);

  return (
    <Layout>
      <PageHeader
        title="Checkout"
        subtitle="Review your order"
        background={true}
      />

      <div className="max-w-4xl mx-auto px-4 py-16">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>

          {/* customer form */}
          <form onSubmit={handlePlaceOrder} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Name
              </label>
              <input
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1 block w-full border border-neutral-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-transparent transition-all placeholder:text-neutral-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Phone
              </label>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full border border-neutral-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-transparent transition-all placeholder:text-neutral-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Delivery address / location
              </label>
              <input
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 block w-full border border-neutral-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-transparent transition-all placeholder:text-neutral-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Payment method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mt-1 block w-full border border-neutral-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-transparent transition-all"
              >
                \n <option value="cash">Cash on delivery</option>
                <option value="mpesa">M-Pesa</option>\n{" "}
              </select>
            </div>
            {paymentMethod === "mpesa" && (
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  M-Pesa phone
                </label>
                <input
                  required={paymentMethod === "mpesa"}
                  value={mpesaNumber}
                  onChange={(e) => setMpesaNumber(e.target.value)}
                  className="mt-1 block w-full border border-neutral-300 rounded-lg shadow-sm p-2.5 focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                />
              </div>
            )}
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => router.push("/")}
                variant="secondary"
              >
                Continue Shopping
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting
                  ? paymentMethod === "mpesa"
                    ? "Requesting payment…"
                    : "Placing…"
                  : paymentMethod === "mpesa"
                    ? "Pay with M‑Pesa"
                    : "Place Order"}
              </Button>
            </div>
            {orderError && <p className="text-red-600 text-sm">{orderError}</p>}
            {paymentMethod === "mpesa" && paymentStatus === "pending" && (
              <p className="text-yellow-600 text-sm">
                Payment request sent! Waiting for confirmation...
              </p>
            )}
            {paymentMethod === "mpesa" && paymentStatus === "paid" && (
              <div className="space-y-2">
                <p className="text-green-600 text-sm">
                  Payment successful! Thank you
                  {orderId ? ` (Order #${orderId})` : ""}.
                </p>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => router.push("/")}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            )}
            {paymentMethod !== "mpesa" && orderSuccess && (
              <div className="space-y-2">
                <p className="text-green-600 text-sm">
                  {`Order placed! Thank you${orderId ? ` (Order #${orderId})` : ""}.`}
                </p>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => router.push("/")}
                  >
                    Continue Shopping
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.push("/cart")}
                  >
                    View Cart
                  </Button>
                </div>
              </div>
            )}
          </form>

          {cart.length === 0 ? (
            <p className="text-sm text-gray-600 mb-6">Your cart is empty.</p>
          ) : (
            <div className="space-y-4 mb-6">
              {cart.map((it) => (
                <div key={it.id} className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{it.modelName}</div>
                    <div className="text-xs text-gray-500">Size: {it.size}</div>
                  </div>
                  <div className="text-right">
                    <div>
                      KES{" "}
                      {((Number(it.price) || 0) * (it.quantity || 1)).toFixed(
                        0,
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {it.quantity} × KES {Number(it.price || 0).toFixed(0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-neutral-200 pt-4 space-y-2 mb-6">
            <div className="flex justify-between text-neutral-700">
              <span>Subtotal</span>
              <span className="font-semibold">KES {subtotal.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-neutral-700">
              <span>Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
              <span className="font-semibold">KES {tax.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-gray-900 font-bold text-lg">
              <span>Total</span>
              <span>KES {total.toFixed(0)}</span>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
