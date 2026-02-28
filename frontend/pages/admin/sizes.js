import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import {
  API_BASE,
  adminFetcher,
  adminPostRequest,
  adminDeleteRequest,
} from "../../lib/api";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { FormInput } from "../../components/Form";
import { EmptyState, LoadingSpinner } from "../../components/Loading";

export default function Sizes() {
  const [sizes, setSizes] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        await load();
      } catch (err) {
        if (err.status === 401) window.location.href = "/admin/login";
      }
    };
    check();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const data = await adminFetcher("/api/admin/sizes");
      setSizes(data || []);
    } catch (err) {
      // Error handled via error state
      if (err.status === 401) window.location.href = "/admin/login";
    } finally {
      setLoading(false);
    }
  }

  async function create() {
    if (!name.trim()) return;
    try {
      await adminPostRequest("/api/admin/sizes", { name });
      setName("");
      load();
    } catch (err) {
      if (err.status === 401) window.location.href = "/admin/login";
    }
  }

  async function remove(id) {
    if (!confirm("Delete this size?")) return;
    try {
      await adminDeleteRequest(`/api/admin/sizes/${id}`);
      load();
    } catch (err) {
      if (err.status === 401) window.location.href = "/admin/login";
    }
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Manage Sizes"
          subtitle="Add and remove available shoe sizes"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Add New Size
            </h2>
            <FormInput
              label="Size Name (e.g., 7, 8, 9, 10)"
              placeholder="Enter size"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && create()}
            />
            <Button
              fullWidth
              variant="primary"
              onClick={create}
              disabled={!name.trim()}
            >
              Add Size
            </Button>
          </Card>

          <div className="lg:col-span-2">
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Available Sizes
                </h2>

                {loading ? (
                  <LoadingSpinner />
                ) : sizes.length === 0 ? (
                  <EmptyState
                    icon="📏"
                    title="No Sizes Yet"
                    description="Add your first shoe size to get started."
                  />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {sizes.map((size) => (
                      <div
                        key={size.id}
                        className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200"
                      >
                        <span className="font-semibold text-gray-900">
                          {size.name}
                        </span>
                        <button
                          onClick={() => remove(size.id)}
                          className="text-red-600 hover:text-red-700 text-lg"
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
