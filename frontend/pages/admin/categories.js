import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import {
  API_BASE,
  adminFetcher,
  adminPostRequest,
  adminPutRequest,
  adminDeleteRequest,
  APIError,
} from "../../lib/api";

export default function AdminCategories() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    icon: "",
    description: "",
    order: 0,
    featured: false,
  });
  const [editingId, setEditingId] = useState(null);
  const [megaMenuForm, setMegaMenuForm] = useState({
    selectedCategoryId: null,
    title: "",
    link: "",
    icon: "",
    order: 0,
  });

  // Check authentication on mount
  useEffect(() => {
    const check = async () => {
      try {
        await fetchCategories();
        setAuthenticated(true);
      } catch (err) {
        if (err.status === 401) router.push("/admin/login");
      }
    };
    check();
  }, [router]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      // Error handled via error state
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

  const handleMegaMenuChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMegaMenuForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? Number(value)
            : value,
    }));
  };

  const handleGenerateSlug = () => {
    const slug = formData.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
    setFormData((prev) => ({ ...prev, slug }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId
        ? `/api/categories/${editingId}`
        : `/api/categories`;

      try {
        if (editingId) {
          await adminPutRequest(url, formData);
        } else {
          await adminPostRequest(url, formData);
        }
        await fetchCategories();
        resetForm();
      } catch (err) {
        alert(
          "Error saving category: " + (err.data?.error?.message || err.message),
        );
      }
    } catch (error) {
      // Error handled via error state
      alert("Error saving category: " + error.message);
    }
  };

  const handleAddMegaMenuItem = async (e) => {
    e.preventDefault();

    if (!megaMenuForm.selectedCategoryId || !megaMenuForm.title) {
      alert("Please select a category and enter a title");
      return;
    }

    try {
      try {
        await adminPostRequest(
          `/api/categories/${megaMenuForm.selectedCategoryId}/mega-menu`,
          {
            title: megaMenuForm.title,
            link: megaMenuForm.link || null,
            icon: megaMenuForm.icon || null,
            order: megaMenuForm.order,
          },
        );
      } catch (err) {
        throw err;
      }

      await fetchCategories();
      setMegaMenuForm({
        selectedCategoryId: null,
        title: "",
        link: "",
        icon: "",
        order: 0,
      });
    } catch (error) {
      // Error handled via error state
      alert("Error adding mega-menu item: " + error.message);
    }
  };

  const handleEdit = (category) => {
    setFormData(category);
    setEditingId(category.id);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    setErrorMsg("");
    try {
      try {
        await adminDeleteRequest(`/api/categories/${id}`);
        await fetchCategories();
      } catch (err) {
        setErrorMsg(
          (err.data && err.data.error && err.data.error.message) ||
            "Failed to delete category",
        );
      }
    } catch (error) {
      setErrorMsg("Network error deleting category");
    }
  };

  const handleDeleteMegaMenuItem = async (itemId) => {
    if (!confirm("Are you sure?")) return;
    setErrorMsg("");
    try {
      try {
        await adminDeleteRequest(`/api/categories/mega-menu/${itemId}`);
        await fetchCategories();
      } catch (err) {
        setErrorMsg(
          (err.data && err.data.error && err.data.error.message) ||
            "Failed to delete mega-menu item",
        );
      }
    } catch (error) {
      setErrorMsg("Network error deleting mega-menu item");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      icon: "",
      description: "",
      order: 0,
      featured: false,
    });
    setEditingId(null);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold mb-8">Manage Categories</h1>
        {errorMsg && (
          <div style={{ color: "#b00", marginBottom: 16, fontWeight: "bold" }}>
            {errorMsg}
          </div>
        )}
        {/* Category Form */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">
            {editingId ? "Edit Category" : "Add New Category"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Men"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., men-shoes"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateSlug}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon (emoji, SVG, or image URL)
                </label>
                <input
                  type="text"
                  name="icon"
                  value={formData.icon}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., 👔"
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
                placeholder="Category description"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="featured"
                id="featured"
                checked={formData.featured}
                onChange={handleChange}
                className="w-4 h-4 text-orange-500 rounded"
              />
              <label htmlFor="featured" className="ml-2 text-sm text-gray-700">
                Featured
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
              >
                {editingId ? "Update Category" : "Create Category"}
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

        {/* Mega Menu Items Form */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Add Mega Menu Item</h2>

          <form onSubmit={handleAddMegaMenuItem} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="selectedCategoryId"
                value={megaMenuForm.selectedCategoryId || ""}
                onChange={handleMegaMenuChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Menu Item Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={megaMenuForm.title}
                  onChange={handleMegaMenuChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Running Shoes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link
                </label>
                <input
                  type="text"
                  name="link"
                  value={megaMenuForm.link}
                  onChange={handleMegaMenuChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., /categories/sneakers?type=running"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon
                </label>
                <input
                  type="text"
                  name="icon"
                  value={megaMenuForm.icon}
                  onChange={handleMegaMenuChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., 🏃"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order
                </label>
                <input
                  type="number"
                  name="order"
                  value={megaMenuForm.order}
                  onChange={handleMegaMenuChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
            >
              Add Menu Item
            </button>
          </form>
        </div>

        {/* Categories List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-8 py-6 border-b">
            <h2 className="text-2xl font-bold">
              Categories ({categories.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No categories yet
            </div>
          ) : (
            <div className="divide-y">
              {categories.map((category) => (
                <div key={category.id} className="p-8 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold">
                        {category.icon && (
                          <span className="mr-2">{category.icon}</span>
                        )}
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Slug:{" "}
                        <code className="bg-gray-100 px-2 py-1 rounded">
                          {category.slug}
                        </code>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Mega Menu Items */}
                  {category.megaMenuItems?.length > 0 && (
                    <div className="mt-6 bg-gray-50 rounded p-4">
                      <h4 className="font-semibold text-sm mb-3">
                        Mega Menu Items:
                      </h4>
                      <ul className="space-y-2">
                        {category.megaMenuItems.map((item) => (
                          <li
                            key={item.id}
                            className="flex justify-between items-center text-sm"
                          >
                            <span>
                              {item.icon && (
                                <span className="mr-2">{item.icon}</span>
                              )}
                              {item.title}
                            </span>
                            <button
                              onClick={() => handleDeleteMegaMenuItem(item.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
