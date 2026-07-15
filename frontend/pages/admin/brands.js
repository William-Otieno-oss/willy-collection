import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import {
  fetcher,
  adminFetcher,
  adminPostRequest,
  adminPutRequest,
  adminDeleteRequest,
} from "../../lib/api";

const emptyForm = {
  name: "",
  slug: "",
  imageUrl: "",
  description: "",
  order: 0,
  featured: false,
};

function slugFromName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminBrands() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const data = await fetcher("/api/brands");
      setBrands(Array.isArray(data) ? data : []);
    } catch {
      setErrorMsg("Network error fetching brands");
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const check = async () => {
      try {
        await adminFetcher("/api/orders?limit=1");
        setAuthenticated(true);
        await fetchBrands();
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
          router.push("/admin/login");
        }
      }
    };
    check();
  }, [router]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? Number(value)
            : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const payload = {
        ...formData,
        slug: formData.slug || slugFromName(formData.name),
      };
      const url = editingId ? `/api/brands/${editingId}` : "/api/brands";

      if (editingId) {
        await adminPutRequest(url, payload);
      } else {
        await adminPostRequest(url, payload);
      }

      setFormData(emptyForm);
      setEditingId(null);
      await fetchBrands();
    } catch (err) {
      setErrorMsg(err.data?.error?.message || err.message || "Failed to save brand");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (brand) => {
    setFormData({
      name: brand.name || "",
      slug: brand.slug || "",
      imageUrl: brand.imageUrl || "",
      description: brand.description || "",
      order: brand.order || 0,
      featured: Boolean(brand.featured),
    });
    setEditingId(brand.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this brand?")) return;
    setErrorMsg("");
    setLoading(true);

    try {
      await adminDeleteRequest(`/api/brands/${id}`);
      await fetchBrands();
    } catch (err) {
      setErrorMsg(
        err.data?.error?.message || err.message || "Failed to delete brand",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) return null;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold mb-8">Manage Brands</h1>
        {errorMsg && (
          <div style={{ color: "#b00", marginBottom: 16, fontWeight: "bold" }}>
            {errorMsg}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">
            {editingId ? "Edit Brand" : "Add New Brand"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Name"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="Slug"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <input
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="Logo URL"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Description"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                name="order"
                type="number"
                value={formData.order}
                onChange={handleChange}
                placeholder="Order"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  name="featured"
                  type="checkbox"
                  checked={formData.featured}
                  onChange={handleChange}
                />
                Featured
              </label>
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
              >
                {editingId ? "Update Brand" : "Create Brand"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormData(emptyForm);
                  }}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-8 py-6 border-b">
            <h2 className="text-2xl font-bold">Brands ({brands.length})</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : brands.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No brands yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      Slug
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map((brand) => (
                    <tr key={brand.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium">
                        {brand.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {brand.slug}
                      </td>
                      <td className="px-6 py-4 text-sm">{brand.order}</td>
                      <td className="px-6 py-4 text-sm">
                        {brand.featured ? "Featured" : "Standard"}
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => handleEdit(brand)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(brand.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
