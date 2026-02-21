import { useEffect, useState } from "react";
import Layout from "../../../components/Layout";
import API_BASE from "../../../lib/api";
import { useRouter } from "next/router";

export default function EditProduct() {
  const router = useRouter();
  const { id } = router.query;
  const [authenticated, setAuthenticated] = useState(false);
  const [s, setS] = useState(null);
  const [sizes, setSizes] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [newStock, setNewStock] = useState({ sizeId: "", quantity: 0 });
  const [newImages, setNewImages] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [perFileProgress, setPerFileProgress] = useState({});
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // Check authentication on mount
    const token = localStorage.getItem("admin_token");
    const expiresAt = localStorage.getItem("admin_token_expires");

    if (!token || !expiresAt || parseInt(expiresAt) <= Date.now()) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_token_expires");
      router.push("/admin/login");
      return;
    }

    setAuthenticated(true);
    if (id) load();
  }, [id, router]);

  async function load() {
    try {
      const res = await fetch(`${API_BASE}/api/sneakers`);
      const list = await res.json();
      const item = list.find((x) => x.id === parseInt(id));

      if (!item) {
        setNotFound(true);
        setS(null);
        return;
      }

      setS(item);
      setNotFound(false);

      const r2 = await fetch(`${API_BASE}/api/admin/sizes`);
      const sizesData = await r2.json();
      setSizes(Array.isArray(sizesData) ? sizesData : []);

      const r3 = await fetch(`${API_BASE}/api/sneakers/${item.slug}`);
      const full = await r3.json();
      setStocks(full.stocks || []);
    } catch (err) {
      // Error handled via error state
      setSizes([]);
      setStocks([]);
      setNotFound(true);
    }
  }

  function getBrandName(b) {
    if (!b) return "";
    return typeof b === "object" ? b.name : b;
  }

  async function saveStock() {
    const body = {
      stocks: [{ sizeId: newStock.sizeId, quantity: newStock.quantity }],
    };
    const res = await fetch(`${API_BASE}/api/admin/sneakers/${id}/stocks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = await res.json();
      setStocks((s) => [...s, ...updated]);
      setNewStock({ sizeId: "", quantity: 0 });
    }
  }

  function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    const maxSize = 5 * 1024 * 1024; // 5MB
    const invalid = files.find(
      (f) => !f.type.startsWith("image/") || f.size > maxSize,
    );
    if (invalid) return alert("All files must be images and under 5MB each");
    setNewImages(files);
  }

  async function uploadImages() {
    setUploading(true);
    setUploadProgress(0);
    setPerFileProgress({});
    const files = Array.from(newImages);
    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));

    try {
      // Get auth token from localStorage (login saves it as 'admin_token')
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("admin_token")
          : null;

      if (!token) {
        alert("Not logged in. Please login first.");
        setUploading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/api/sneakers/${id}`, {
        method: "PUT",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (res.ok) {
        setUploading(false);
        setUploadProgress(0);
        setPerFileProgress({});
        // refresh data
        const r = await fetch(`${API_BASE}/api/sneakers/${s.slug}`);
        const full = await r.json();
        setS(full);
        setNewImages(null);
        alert("Images uploaded successfully");
      } else {
        alert("Upload failed: " + (await res.text()));
        setUploading(false);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload error: " + err.message);
      setUploading(false);
    }
  }

  if (!authenticated) {
    return (
      <Layout>
        <div>Redirecting...</div>
      </Layout>
    );
  }

  if (notFound) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-gray-600 text-lg mb-4">Product not found</p>
          <button
            onClick={() => router.push("/admin/products")}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Back to Products
          </button>
        </div>
      </Layout>
    );
  }

  if (!s) {
    return (
      <Layout>
        <div>Loading...</div>
      </Layout>
    );
  }

  async function updateProduct(e) {
    e.preventDefault();
    const form = new URLSearchParams();
    form.append("brand", s.brand);
    form.append("modelName", s.modelName);
    form.append("description", s.description || "");
    form.append("price", String(s.price || 0));
    form.append("categories", JSON.stringify(s.categories || []));
    form.append("colors", JSON.stringify(s.colors || []));
    form.append("featured", s.featured ? "true" : "false");
    form.append("inStock", s.inStock ? "true" : "false");
    const res = await fetch(`${API_BASE}/api/sneakers/${id}`, {
      method: "PUT",
      body: form,
    });
    if (res.ok) alert("Product updated");
    else alert("Update failed");
  }

  async function deleteImage(imgId) {
    if (!confirm("Delete image?")) return;
    const res = await fetch(`${API_BASE}/api/sneakers/images/${imgId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setS((prev) => ({
        ...prev,
        images: prev.images.filter((i) => i.id !== imgId),
      }));
    } else alert("Failed to delete");
  }

  function onDragStart(e, imgId) {
    setDraggingId(imgId);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e) {
    e.preventDefault();
  }

  async function onDrop(e, overId) {
    e.preventDefault();
    if (!draggingId) return;
    if (draggingId === overId) return setDraggingId(null);
    const imgs = Array.from(s.images);
    const fromIndex = imgs.findIndex((i) => i.id === draggingId);
    const toIndex = imgs.findIndex((i) => i.id === overId);
    if (fromIndex < 0 || toIndex < 0) return setDraggingId(null);
    const [moved] = imgs.splice(fromIndex, 1);
    imgs.splice(toIndex, 0, moved);
    setS((p) => ({ ...p, images: imgs }));
    setDraggingId(null);
    // persist order
    await fetch(`${API_BASE}/api/sneakers/${id}/images/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ order: imgs.map((i) => i.id) }),
    });
  }

  return (
    <Layout>
      <h1 className="text-2xl mb-4">
        Edit {getBrandName(s.brand)} {s.modelName}
      </h1>

      <form onSubmit={updateProduct} className="mb-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block">Brand</label>
            <input
              className="w-full p-2 border"
              value={getBrandName(s.brand)}
              onChange={(e) => setS((p) => ({ ...p, brand: e.target.value }))}
            />
          </div>
          <div>
            <label className="block">Model</label>
            <input
              className="w-full p-2 border"
              value={s.modelName}
              onChange={(e) =>
                setS((p) => ({ ...p, modelName: e.target.value }))
              }
            />
          </div>
        </div>
        <div>
          <label className="block">Price</label>
          <input
            type="number"
            className="w-full p-2 border"
            value={s.price}
            onChange={(e) =>
              setS((p) => ({ ...p, price: parseFloat(e.target.value) }))
            }
          />
        </div>
        <div>
          <label className="block">Description</label>
          <textarea
            className="w-full p-2 border"
            value={s.description || ""}
            onChange={(e) =>
              setS((p) => ({ ...p, description: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              className="mr-2"
              checked={s.featured}
              onChange={(e) =>
                setS((p) => ({ ...p, featured: e.target.checked }))
              }
            />{" "}
            Featured
          </label>
          <label className="inline-flex items-center ml-4">
            <input
              type="checkbox"
              className="mr-2"
              checked={s.inStock}
              onChange={(e) =>
                setS((p) => ({ ...p, inStock: e.target.checked }))
              }
            />{" "}
            In stock
          </label>
        </div>
        <div>
          <button className="bg-black text-white px-4 py-2">Save</button>
        </div>
      </form>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h2 className="font-semibold">Images</h2>
          <div className="space-y-2">
            {s.images?.map((img) => (
              <div
                key={img.id}
                className="flex items-center gap-2"
                draggable
                onDragStart={(e) => onDragStart(e, img.id)}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, img.id)}
              >
                <div className="cursor-move p-1">☰</div>
                <img src={img.url} className="w-32 h-24 object-cover" />
                <div>
                  <button
                    onClick={() => deleteImage(img.id)}
                    className="text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <input
              type="file"
              multiple
              onChange={handleFiles}
              disabled={uploading}
            />
            {newImages && (
              <div className="mt-2">
                <div className="text-sm">Selected:</div>
                <ul className="list-disc ml-6 text-sm">
                  {newImages.map((f, idx) => (
                    <li key={idx}>
                      {f.name} ({Math.round(f.size / 1024)} KB)
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {uploading && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="text-sm font-semibold text-blue-900">
                  Uploading images...
                </div>
                <div className="mt-2 animate-pulse">
                  <div className="h-2 bg-blue-300 rounded"></div>
                </div>
              </div>
            )}
            <div className="mt-2">
              <button
                onClick={uploadImages}
                disabled={uploading}
                className={`px-3 py-1 ${uploading ? "bg-gray-400" : "bg-green-600 text-white"}`}
              >
                {uploading ? "Uploading..." : "Upload Images"}
              </button>
            </div>
          </div>
        </div>
        <div>
          <h2 className="font-semibold">Stock per size</h2>
          <div className="space-y-2">
            {stocks.map((st) => (
              <div
                key={st.id}
                className="flex items-center justify-between border p-2"
              >
                <div>
                  {sizes.find((x) => x.id === st.sizeId)?.name || st.sizeId}
                </div>
                <div>{st.quantity}</div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <select
              value={newStock.sizeId}
              onChange={(e) =>
                setNewStock((n) => ({ ...n, sizeId: e.target.value }))
              }
              className="p-2 border mr-2"
            >
              <option value="">Select size</option>
              {sizes.map((sz) => (
                <option key={sz.id} value={sz.id}>
                  {sz.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={newStock.quantity}
              onChange={(e) =>
                setNewStock((n) => ({
                  ...n,
                  quantity: parseInt(e.target.value),
                }))
              }
              className="p-2 border mr-2"
            />
            <button
              onClick={saveStock}
              className="bg-blue-600 text-white px-3 py-1"
            >
              Save Stock
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
