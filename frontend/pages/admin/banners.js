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

export default function AdminBanners() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    imageUrl: "",
    link: "",
    ctaText: "Shop Now",
    order: 0,
    active: true,
  });
  const [editingId, setEditingId] = useState(null);

  // Check authentication on mount
  useEffect(() => {
    const check = async () => {
      try {
        await adminFetcher("/api/orders?limit=1");
        setAuthenticated(true);
        await fetchBanners();
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
          router.push("/admin/login");
        }
      }
    };
    check();
  }, [router]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const data = await fetcher(`/api/banners`);
      setBanners(data);
      // Note: fetcher throws on error, so we only reach here on success
    } catch (error) {
      setErrorMsg("Network error fetching banners");
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

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
    try {
      const url = editingId ? `/api/banners/${editingId}` : "/api/banners";

      try {
        if (editingId) {
          await adminPutRequest(url, formData);
        } else {
          await adminPostRequest(url, formData);
        }
        await fetchBanners();
        resetForm();
      } catch (err) {
        setErrorMsg(
          (err.data && err.data.error && err.data.error.message) ||
            "Failed to save banner",
        );
        return;
      }
    } catch (error) {
      setErrorMsg("Network error saving banner");
    }
  };

  const handleEdit = (banner) => {
    setFormData(banner);
    setEditingId(banner.id);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    setErrorMsg("");
    try {
      try {
        await adminDeleteRequest(`/api/banners/${id}`);
        await fetchBanners();
      } catch (err) {
        setErrorMsg(
          (err.data && err.data.error && err.data.error.message) ||
            "Failed to delete banner",
        );
        return;
      }
    } catch (error) {
      setErrorMsg("Network error deleting banner");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      description: "",
      imageUrl: "",
      link: "",
      ctaText: "Shop Now",
      order: 0,
      active: true,
    });
    setEditingId(null);
  };

  if (!authenticated) return null;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold mb-8">Manage Banners</h1>
        {errorMsg && (
          <div style={{ color: "#b00", marginBottom: 16, fontWeight: "bold" }}>
            {errorMsg}
          </div>
        )}
        {/* Form Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">
            {editingId ? "Edit Banner" : "Add New Banner"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Summer Collection"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subtitle
                </label>
                <input
                  type="text"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Discover the latest"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Banner description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL *
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link
                </label>
                <input
                  type="text"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., /categories/sneakers"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CTA Text
                </label>
                <input
                  type="text"
                  name="ctaText"
                  value={formData.ctaText}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Shop Now"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order
                </label>
                <input
                  type="number"
                  name="order"
                  value={formData.order}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="active"
                id="active"
                checked={formData.active}
                onChange={handleChange}
                className="w-4 h-4 text-orange-500 rounded"
              />
              <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                Active
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
              >
                {editingId ? "Update Banner" : "Create Banner"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Banners List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-8 py-6 border-b">
            <h2 className="text-2xl font-bold">Banners ({banners.length})</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : banners.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No banners yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      Link
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
                  {banners.map((banner) => (
                    <tr key={banner.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium">
                        {banner.title}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {banner.imageUrl && (
                          <img
                            src={banner.imageUrl}
                            alt={banner.title}
                            className="h-12 w-12 object-cover rounded"
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {banner.link || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm">{banner.order}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            banner.active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {banner.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => handleEdit(banner)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
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
