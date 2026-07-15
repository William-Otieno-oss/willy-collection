import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import {
  getImageUrl,
  adminFetcher,
  adminDeleteRequest,
} from "../../lib/api";
import Link from "next/link";
import Button from "../../components/Button";
import Card from "../../components/Card";
import PageHeader from "../../components/PageHeader";
import Badge from "../../components/Badge";
import { EmptyState, LoadingSpinner } from "../../components/Loading";

export default function ProductsAdmin() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  function getBrandName(b) {
    if (!b) return "";
    return typeof b === "object" ? b.name : b;
  }

  async function load() {
    try {
      setLoading(true);
      const data = await adminFetcher("/api/sneakers");
      if (Array.isArray(data)) {
        setItems(data);
      } else if (data && Array.isArray(data.data)) {
        setItems(data.data);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const check = async () => {
      try {
        // Attempt a simple admin fetch to validate the cookie-based session
        await adminFetcher("/api/sneakers?limit=1");
        setAuthenticated(true);
        load();
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
          router.push("/admin/login");
        }
      }
    };
    check();
  }, [router]);

  async function deleteProduct(id) {
    if (!confirm("Delete this product? This action cannot be undone.")) return;
    setDeletingId(id);
    try {
      await adminDeleteRequest(`/api/sneakers/${id}`);
      load();
    } catch (err) {
      alert("Delete failed: " + (err.message || err));
    } finally {
      setDeletingId(null);
    }
  }

  const filteredItems = items.filter((item) => {
    const brandName = getBrandName(item.brand);
    return (
      item.modelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brandName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <Layout>
      <PageHeader
        title="Manage Products"
        subtitle="View, edit, and manage your sneaker inventory"
        background={true}
      />

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Action Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 animate-slideUp">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>
          <Link href="/admin/products/new">
            <Button variant="primary" size="lg">
              + Add New Product
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card
            className="p-4 animate-slideUp"
            style={{ animationDelay: "50ms" }}
          >
            <p className="text-gray-600 text-sm font-medium mb-1">
              Total Products
            </p>
            <p className="text-3xl font-bold text-gray-900">{items.length}</p>
          </Card>
          <Card
            className="p-4 animate-slideUp"
            style={{ animationDelay: "100ms" }}
          >
            <p className="text-gray-600 text-sm font-medium mb-1">Showing</p>
            <p className="text-3xl font-bold text-accent">
              {filteredItems.length}
            </p>
          </Card>
          <Card
            className="p-4 animate-slideUp"
            style={{ animationDelay: "150ms" }}
          >
            <p className="text-gray-600 text-sm font-medium mb-1">
              Total Value
            </p>
            <p className="text-3xl font-bold text-green-600">
              KES {items.reduce((sum, p) => sum + (p.price || 0), 0).toFixed(0)}
            </p>
          </Card>
        </div>

        {/* Products Grid */}
        {loading ? (
          <LoadingSpinner />
        ) : filteredItems.length === 0 && searchTerm === "" ? (
          <Card className="p-12 text-center">
            <EmptyState
              icon="👟"
              title="No Products Yet"
              description="Start building your inventory by adding your first product."
              action={
                <Link href="/admin/products/new">
                  <Button variant="primary" size="lg">
                    Create Your First Product
                  </Button>
                </Link>
              }
            />
          </Card>
        ) : filteredItems.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-600 text-lg">
              No products found matching &quot;{searchTerm}&quot;
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((product, idx) => (
              <Card
                key={product.id}
                hoverable
                className="p-0 overflow-hidden animate-slideUp"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Product Image */}
                <div className="h-40 bg-gray-100 overflow-hidden flex items-center justify-center">
                  {product.images?.[0]?.url ? (
                    <img
                      src={getImageUrl(product.images[0].url)}
                      alt={product.modelName}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      onError={(e) => {
                        e.target.src = "/placeholder.svg";
                      }}
                    />
                  ) : (
                    <div className="text-gray-400 text-center">
                      <p className="text-4xl mb-2">📷</p>
                      <p className="text-sm">No image</p>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">
                        {getBrandName(product.brand)}
                      </p>
                      <h3 className="text-lg font-bold text-gray-900">
                        {product.modelName}
                      </h3>
                    </div>
                    {product.images?.length > 0 && (
                      <Badge variant="info" size="sm">
                        {product.images.length} imgs
                      </Badge>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
                    <div>
                      <p className="text-xs text-gray-600">Price</p>
                      <p className="text-2xl font-bold text-gray-900">
                        KES {product.price?.toFixed(0) || "0"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Status</p>
                      <Badge variant="success" size="sm">
                        Active
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="flex-1"
                    >
                      <Button size="sm" variant="secondary" fullWidth>
                        Edit
                      </Button>
                    </Link>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      disabled={deletingId === product.id}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === product.id ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
