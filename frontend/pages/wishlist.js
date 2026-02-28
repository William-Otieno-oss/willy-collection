import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("wishlist") || "[]");
      setWishlist(Array.isArray(raw) ? raw : []);
    } catch (e) {
      setWishlist([]);
    }
  }, []);

  return (
    <Layout>
      <PageHeader
        title="Wishlist"
        subtitle={`${wishlist.length} item${wishlist.length !== 1 ? "s" : ""} in your wishlist`}
        background={true}
      />

      <div className="max-w-6xl mx-auto px-4 py-16">
        {wishlist.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-lg">Your wishlist is empty.</p>
            <div className="mt-6">
              <Link href="/" legacyBehavior>
                <a>
                  <Button variant="primary">Continue Shopping</Button>
                </a>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {wishlist.map((id) => (
              <Card key={id} className="p-4 flex justify-between items-center">
                <div>
                  <div className="font-semibold">{String(id)}</div>
                  <div className="text-sm text-gray-500">
                    Click to view product
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/sneakers/${encodeURIComponent(String(id))}`}
                    legacyBehavior
                  >
                    <a>
                      <Button variant="primary">View product</Button>
                    </a>
                  </Link>
                  <button
                    onClick={() => {
                      const updated = wishlist.filter((x) => x !== id);
                      setWishlist(updated);
                      localStorage.setItem("wishlist", JSON.stringify(updated));
                      window.dispatchEvent(new Event("wishlistUpdated"));
                    }}
                    className="p-2 text-brand-dark hover:text-brand-light"
                    aria-label="Remove from wishlist"
                  >
                    &times;
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
