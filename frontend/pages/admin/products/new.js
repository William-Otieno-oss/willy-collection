import { useState, useEffect } from "react";
import Layout from "../../../components/Layout";
import API_BASE from "../../../lib/api";
import Router from "next/router";

export default function NewProduct() {
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState({
    brandId: "",
    modelName: "",
    description: "",
    price: "",
    categories: [],
    colors: [],
    featured: false,
    inStock: true,
  });
  const [images, setImages] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploading, setUploading] = useState(false);

  function handleFile(e) {
    setImages(e.target.files);
  }
  function toggleCategory(c) {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(c)
        ? f.categories.filter((x) => x !== c)
        : [...f.categories, c],
    }));
  }

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/brands`);
        if (!res.ok) {
          console.error("Failed to fetch brands", res.status);
          return;
        }
        const data = await res.json();
        // API returns array OR { data } depending on backend; normalize
        const brandsList = Array.isArray(data) ? data : data?.data || [];
        setBrands(brandsList || []);
        if (brandsList && brandsList.length && !form.brandId) {
          setForm((f) => ({ ...f, brandId: String(brandsList[0].id) }));
        }
      } catch (e) {
        console.error("Failed to load brands", e);
      }
    };
    fetchBrands();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setUploading(true);
    setUploadProgress({});

    // Get auth token from localStorage (login saves it as 'admin_token')
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("admin_token")
        : null;

    if (!token) {
      setUploading(false);
      alert("Not authenticated. Please log in first.");
      return;
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    // create product first without images
    const payload = {
      brandId: form.brandId ? parseInt(form.brandId) : null,
      modelName: form.modelName,
      description: form.description,
      price: parseFloat(form.price || 0),
      categories: form.categories,
      colors: form.colors,
      featured: form.featured,
      inStock: form.inStock,
    };
    const res = await fetch(`${API_BASE}/api/sneakers`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setUploading(false);
      return alert("Error creating product");
    }
    const created = await res.json();
    // upload images directly to S3 via presigned URLs and register
    if (images && images.length) {
      const files = Array.from(images);
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        try {
          // compute checksum early so we can show progress while uploading
          const ab = await f.arrayBuffer();
          const hash = await crypto.subtle.digest("SHA-256", ab);
          const checksum = Array.from(new Uint8Array(hash))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

          // presign
          const key = `sneakers/${created.id}/${Date.now()}-${f.name.replace(/[^a-zA-Z0-9.\-]/g, "_")}`;
          const presignRes = await fetch(`${API_BASE}/api/s3/presign`, {
            method: "POST",
            headers,
            body: JSON.stringify({ key, contentType: f.type }),
          });
          if (!presignRes.ok) {
            const error = await presignRes.json().catch(() => ({}));
            throw new Error(
              `Presign failed: ${presignRes.status} ${error.error || "unknown error"}`,
            );
          }
          const presignData = await presignRes.json();
          const url = presignData.url;

          if (!url) {
            throw new Error("Presign returned no URL");
          }

          await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("PUT", url);
            xhr.setRequestHeader("Content-Type", f.type);
            xhr.upload.onprogress = (ev) => {
              if (ev.lengthComputable) {
                const pct = Math.round((ev.loaded / ev.total) * 100);
                setUploadProgress((p) => ({ ...p, [i]: pct }));
              }
            };
            xhr.onload = async () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                // register with checksum
                try {
                  const registerRes = await fetch(
                    `${API_BASE}/api/sneakers/${created.id}/images/register`,
                    {
                      method: "POST",
                      headers: headers,
                      body: JSON.stringify({
                        s3Key: key,
                        filename: f.name,
                        contentType: f.type,
                        checksum,
                      }),
                    },
                  );
                  if (!registerRes.ok) {
                    const error = await registerRes.json().catch(() => ({}));
                    console.error(
                      `Register failed: ${registerRes.status}`,
                      error,
                    );
                  }
                } catch (e) {
                  console.error("Register error:", e);
                }
              } else {
                reject(new Error(`Upload to MinIO failed: HTTP ${xhr.status}`));
              }
              resolve();
            };
            xhr.onerror = () => {
              reject(new Error("Upload to MinIO failed - network error"));
            };
            xhr.ontimeout = () => {
              reject(new Error("Upload to MinIO timed out"));
            };
            xhr.send(f);
          });
        } catch (err) {
          const errorMsg = err.message || "Unknown error";
          console.error(`File ${f.name} upload failed:`, err);
          alert(`Upload failed for ${f.name}: ${errorMsg}`);
        }
      }
    }
    setUploading(false);
    setUploadProgress({});
    alert("Product created! Redirecting...");
    Router.push("/admin/products");
  }

  return (
    <Layout>
      <h1 className="text-2xl mb-4">Add Product</h1>
      <form onSubmit={submit} className="space-y-3 max-w-xl">
        <div>
          <label>Brand</label>
          <select
            value={form.brandId}
            onChange={(e) =>
              setForm((f) => ({ ...f, brandId: e.target.value }))
            }
            className="w-full p-2 border"
          >
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Model name</label>
          <input
            value={form.modelName}
            onChange={(e) =>
              setForm((f) => ({ ...f, modelName: e.target.value }))
            }
            className="w-full p-2 border"
          />
        </div>
        <div>
          <label>Price</label>
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            className="w-full p-2 border"
          />
        </div>
        <div>
          <label>Description</label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className="w-full p-2 border"
          />
        </div>
        <div>
          <label>Categories (example)</label>
          <div className="space-x-2">
            {["Men", "Women", "Kids", "Sports", "Official", "Slip-ons"].map(
              (c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => toggleCategory(c)}
                  className={`px-2 py-1 border ${form.categories.includes(c) ? "bg-gray-200" : ""}`}
                >
                  {c}
                </button>
              ),
            )}
          </div>
        </div>
        <div>
          <label>Images</label>
          <input
            type="file"
            multiple
            onChange={handleFile}
            disabled={uploading}
          />
          {images && images.length > 0 && (
            <div className="mt-2">
              <div className="text-sm">Selected: {images.length} file(s)</div>
              <div className="mt-2 space-y-2">
                {uploading &&
                  Array.from(images).map((f, idx) => (
                    <div key={idx} className="border p-2 rounded bg-gray-50">
                      <div className="text-xs font-mono text-gray-600 mb-1">
                        {f.name}
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded">
                        <div
                          className="bg-blue-500 h-2 rounded transition-all"
                          style={{ width: `${uploadProgress[idx] || 0}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {uploadProgress[idx] || 0}%
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) =>
                setForm((f) => ({ ...f, featured: e.target.checked }))
              }
            />{" "}
            Featured
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={form.inStock}
              onChange={(e) =>
                setForm((f) => ({ ...f, inStock: e.target.checked }))
              }
            />{" "}
            In stock
          </label>
        </div>
        <div>
          <button className="bg-black text-white px-4 py-2">Create</button>
        </div>
      </form>
    </Layout>
  );
}
