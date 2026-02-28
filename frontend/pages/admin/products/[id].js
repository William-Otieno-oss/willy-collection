import { useEffect, useState } from "react";
import Layout from "../../../components/Layout";
import {
  API_BASE,
  getImageUrl,
  adminFetcher,
  adminPostRequest,
  adminPutRequest,
  adminDeleteRequest,
  APIError,
} from "../../../lib/api";
import { useRouter } from "next/router";

export default function EditProduct() {
  const router = useRouter();
  const { id } = router.query;
  const [authenticated, setAuthenticated] = useState(false);
  const [s, setS] = useState(null);
  const [sizes, setSizes] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [newStock, setNewStock] = useState({
    sizeId: "",
    quantity: 0,
    rangeStart: "",
    rangeEnd: "",
    rangeQty: 0,
  });
  const [newImages, setNewImages] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [perFileProgress, setPerFileProgress] = useState({});
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await adminFetcher("/api/sneakers?limit=1");
        setAuthenticated(true);
        if (id) load();
      } catch (err) {
        if (err.status === 401) {
          router.push("/admin/login");
        }
      }
    };
    checkAuth();
  }, [id, router]);

  async function load() {
    try {
      const item = await adminFetcher(`/api/sneakers/${id}`);
      if (!item) {
        setNotFound(true);
        setS(null);
        return;
      }
      setS(item);
      setNotFound(false);

      const sizesData = await adminFetcher("/api/admin/sizes");
      setSizes(Array.isArray(sizesData) ? sizesData : []);

      // stocks may be part of item response; if not, fetch separately
      const stocksList = item.stocks || [];
      setStocks(stocksList);
    } catch (err) {
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
    // decide whether to add a single size or a range
    let toAdd = [];
    const qty = parseInt(newStock.quantity, 10);
    if (newStock.rangeStart && newStock.rangeEnd) {
      const start = parseInt(newStock.rangeStart, 10);
      const end = parseInt(newStock.rangeEnd, 10);
      const rqty = parseInt(newStock.rangeQty, 10);
      if (!start || !end || isNaN(rqty) || rqty < 0 || start > end) {
        return;
      }
      // build ordered list from sizes
      const ordered = [...sizes]
        .map((sz) => ({ id: sz.id, num: parseFloat(sz.name) || NaN }))
        .filter((z) => !isNaN(z.num))
        .sort((a, b) => a.num - b.num);
      const startIdx = ordered.findIndex((z) => z.id === start);
      const endIdx = ordered.findIndex((z) => z.id === end);
      if (startIdx < 0 || endIdx < 0) return;
      const rangeIds = ordered.slice(startIdx, endIdx + 1).map((z) => z.id);
      toAdd = rangeIds.map((sid) => ({ sizeId: sid, quantity: rqty }));
    } else if (newStock.sizeId) {
      const sid = parseInt(newStock.sizeId, 10);
      if (!sid || isNaN(qty) || qty < 0) return;
      toAdd = [{ sizeId: sid, quantity: qty }];
    }

    if (toAdd.length === 0) return;

    const body = { stocks: toAdd };
    try {
      const updated = await adminPostRequest(
        `/api/admin/sneakers/${id}/stocks`,
        body,
      );
      setStocks((s) => [...s, ...updated]);
      setNewStock({
        sizeId: "",
        quantity: 0,
        rangeStart: "",
        rangeEnd: "",
        rangeQty: 0,
      });
    } catch (err) {
      console.error("Failed to save stock", err);
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

    // use XMLHttpRequest so we can get per-file progress as well
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const formData = new FormData();
        formData.append("images", f);

        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", `${API_BASE}/api/sneakers/${id}`);
          // ensure cookies are included in cross-origin requests (different port)
          xhr.withCredentials = true;
          // cookies are also generally sent automatically for same-site
          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) {
              const pct = Math.round((ev.loaded / ev.total) * 100);
              setPerFileProgress((p) => ({ ...p, [i]: pct }));
            }
          };
          xhr.onload = async () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`HTTP ${xhr.status}: ${xhr.responseText}`));
            }
          };
          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(formData);
        });
      }

      // all files uploaded, refresh state
      const full = await adminFetcher(`/api/sneakers/${s.slug}`);
      setS(full);
      setNewImages(null);
      alert("Images uploaded successfully");
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload error: " + err.message);
    } finally {
      setUploading(false);
      setPerFileProgress({});
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
    try {
      await adminPutRequest(`/api/sneakers/${id}`, form);
      alert("Product updated");
    } catch (err) {
      alert("Update failed");
    }
  }

  async function deleteImage(imgId) {
    if (!confirm("Delete image?")) return;
    try {
      await adminDeleteRequest(`/api/sneakers/images/${imgId}`);
      setS((prev) => ({
        ...prev,
        images: prev.images.filter((i) => i.id !== imgId),
      }));
    } catch {
      alert("Failed to delete");
    }
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
    try {
      await adminPostRequest(`/api/sneakers/${id}/images/order`, {
        order: imgs.map((i) => i.id),
      });
    } catch (err) {
      console.error("Failed to persist image order", err);
    }
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
                <img
                  src={getImageUrl(img.url)}
                  onError={(e) => {
                    e.target.src = "/placeholder.png";
                  }}
                  className="w-32 h-24 object-cover"
                />
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
                    <li key={idx} className="mb-1">
                      {f.name} ({Math.round(f.size / 1024)} KB)
                      {uploading && (
                        <div className="w-full bg-gray-200 h-1 rounded mt-1">
                          <div
                            className="bg-green-500 h-1 rounded transition-all"
                            style={{ width: `${perFileProgress[idx] || 0}%` }}
                          />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {uploading && !newImages && (
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
              <option value="">Size</option>
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
            {/* range inputs */}
            <select
              value={newStock.rangeStart || ""}
              onChange={(e) =>
                setNewStock((n) => ({ ...n, rangeStart: e.target.value }))
              }
              className="p-2 border mr-2"
            >
              <option value="">From</option>
              {sizes.map((sz) => (
                <option key={sz.id} value={sz.id}>
                  {sz.name}
                </option>
              ))}
            </select>
            <select
              value={newStock.rangeEnd || ""}
              onChange={(e) =>
                setNewStock((n) => ({ ...n, rangeEnd: e.target.value }))
              }
              className="p-2 border mr-2"
            >
              <option value="">To</option>
              {sizes.map((sz) => (
                <option key={sz.id} value={sz.id}>
                  {sz.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Qty each"
              value={newStock.rangeQty}
              onChange={(e) =>
                setNewStock((n) => ({
                  ...n,
                  rangeQty: parseInt(e.target.value),
                }))
              }
              className="p-2 border mr-2 w-20"
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
