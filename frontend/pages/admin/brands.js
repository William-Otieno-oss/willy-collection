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

export default function AdminBrands() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    logo: "",
    description: "",
    order: 0,
    active: true,
  });
  const [editingId, setEditingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const check = async () => {
      try {
        await fetchBrands();
        setAuthenticated(true);
      } catch (err) {
        if (err.status === 401) router.push("/admin/login");
      }
    };
    check();
  }, [router]);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      // public endpoint, no auth required
      const response = await fetch(`${API_BASE}/api/brands`);
      const data = await response.json();
      if (data && data.success === false && data.error) {
        setErrorMsg(data.error.message || "Failed to fetch brands");
        setBrands([]);
      } else {
        setBrands(data);
      }
    } catch (error) {
      setErrorMsg("Network error fetching brands");
      setBrands([]);
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
      setLoading(true);
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/brands/${editingId}` : `/api/brands`;
      try {
        if (editingId) {
          await adminPutRequest(url, formData);
        } else {
          await adminPostRequest(url, formData);
        }
        setFormData({
          name: "",
          slug: "",
          logo: "",
          description: "",
          order: 0,
          active: true,
        });
        setEditingId(null);
        fetchBrands();
      } catch (err) {
        setErrorMsg(
          (err.data && err.data.error && err.data.error.message) ||
            "Failed to save brand",
        );
      }
    } catch (err) {
      setErrorMsg("Network error saving brand");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (brand) => {
    setFormData({ ...brand });
    setEditingId(brand.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this brand?")) return;
    setErrorMsg("");
    try {
      setLoading(true);
      try {
        await adminDeleteRequest(`/api/brands/${id}`);
        fetchBrands();
      } catch (err) {
        setErrorMsg(
          (err.data && err.data.error && err.data.error.message) ||
            "Failed to delete brand",
        );
      }
    } catch (err) {
      setErrorMsg("Network error deleting brand");
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) return null;

  return (
    <Layout>
      <h1>Brands</h1>
      {errorMsg && (
        <div style={{ color: "#b00", marginBottom: 16, fontWeight: "bold" }}>
          {errorMsg}
        </div>
      )}
      {/* ...existing code for form and brand list... */}
    </Layout>
  );

  return (
    <Layout>
      <h1>Brands</h1>
      {loading && <div>Loading...</div>}
      <form onSubmit={handleSubmit}>
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Name"
          required
        />
        <input
          name="slug"
          value={formData.slug}
          onChange={handleChange}
          placeholder="Slug"
          required
        />
        <input
          name="logo"
          value={formData.logo}
          onChange={handleChange}
          placeholder="Logo URL"
        />
        <input
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Description"
        />
        <input
          name="order"
          type="number"
          value={formData.order}
          onChange={handleChange}
          placeholder="Order"
        />
        <label>
          <input
            name="active"
            type="checkbox"
            checked={formData.active}
            onChange={handleChange}
          />{" "}
          Active
        </label>
        <button type="submit">{editingId ? "Update" : "Create"}</button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setFormData({
                name: "",
                slug: "",
                logo: "",
                description: "",
                order: 0,
                active: true,
              });
            }}
          >
            Cancel
          </button>
        )}
      </form>
      <ul>
        {brands.map((brand) => (
          <li key={brand.id}>
            {brand.name} ({brand.slug})
            <button onClick={() => handleEdit(brand)}>Edit</button>
            <button onClick={() => handleDelete(brand.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </Layout>
  );
}
