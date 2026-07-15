import { useState, useEffect } from "react";
import Layout from "../../../components/Layout";
import Router from "next/router";
import {
  API_BASE,
  adminPostRequest,
  adminFetcher,
} from "../../../lib/api";

export default function NewProduct() {
  const [brands, setBrands] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [initialStocks, setInitialStocks] = useState([]); // { sizeId, quantity }
  const [newStock, setNewStock] = useState({ sizeId: "", quantity: 0 });

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
    const init = async () => {
      try {
        // verify admin session
        await adminFetcher("/api/sneakers?limit=1");
      } catch (err) {
        if (err.status === 401) {
          Router.push("/admin/login");
          return;
        }
      }

      // now load brands
      try {
        const res = await fetch(`${API_BASE}/api/brands`);
        if (!res.ok) {
          console.error("Failed to fetch brands", res.status);
          return;
        }
        const data = await res.json();
        const brandsList = Array.isArray(data) ? data : data?.data || [];
        setBrands(brandsList || []);
        if (brandsList && brandsList.length && !form.brandId) {
          setForm((f) => ({ ...f, brandId: String(brandsList[0].id) }));
        }
      } catch (e) {
        console.error("Failed to load brands", e);
      }

      // load sizes for stock management
      try {
        const res2 = await adminFetcher("/api/admin/sizes");
        setSizes(Array.isArray(res2) ? res2 : []);
      } catch (e) {
        console.error("Failed to load sizes", e);
      }
    };
    init();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setUploading(true);
    setUploadProgress({});

    try {
      // create product first without images using admin helper
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
      const created = await adminPostRequest("/api/sneakers", payload);

      // after creation, add any initial stock entries
      if (initialStocks.length > 0) {
        try {
          await adminPostRequest(`/api/admin/sneakers/${created.id}/stocks`, {
            stocks: initialStocks,
          });
        } catch (err) {
          console.error("Failed to add initial stocks", err);
        }
      }

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
            const presignData = await adminPostRequest("/api/s3/presign", {
              key,
              contentType: f.type,
            });
            const url = presignData.url;

            // if using local upload endpoint, make sure our access token cookie is
            // still valid.  adminPostRequest already triggers a refresh, but the
            // PUT itself doesn't, so refresh again for safety to avoid 401s on
            // long-running uploads.
            if (presignData.isLocal) {
              await fetch(`${API_BASE}/api/auth/refresh`, {
                method: "POST",
                credentials: "include",
              });
            }

            if (!url) {
              throw new Error("Presign returned no URL");
            }

            await new Promise((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.open("PUT", url);
              // cross-origin PUTs (backend on port 4000) won't automatically send
              // cookies unless we request credentials explicitly.  the presign
              // response may return a local-upload endpoint which requires the
              // admin access_token cookie, so we must opt in here.
              xhr.withCredentials = true;

              // include content type for both S3 and local endpoints
              xhr.setRequestHeader("Content-Type", f.type);
              if (presignData.isLocal) {
                // server uses this header to determine desired filename when
                // writing to disk.  it also uses the cookie for adminAuth.
                xhr.setRequestHeader("x-upload-key", key);
              }
              xhr.upload.onprogress = (ev) => {
                if (ev.lengthComputable) {
                  const pct = Math.round((ev.loaded / ev.total) * 100);
                  setUploadProgress((p) => ({ ...p, [i]: pct }));
                }
              };
              xhr.onload = async () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                  // register with checksum and supply the exact url we used
                  try {
                    // prepare registration body; only include url for local uploads
                    const body = {
                      s3Key: key,
                      filename: f.name,
                      contentType: f.type,
                      checksum,
                    };
                    if (presignData.isLocal) {
                      const basename = key.split("/").pop();
                      body.url = `/uploads/${basename}`;
                    }
                    const registerRes = await fetch(
                      `${API_BASE}/api/sneakers/${created.id}/images/register`,
                      {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(body),
                      },
                    );
                    if (!registerRes.ok) {
                      const error = await registerRes.json().catch(() => ({}));
                      const msg =
                        error.error || error.message || registerRes.statusText;
                      console.error(
                        `Register failed: ${registerRes.status} ${msg}`,
                        error,
                      );
                      // propagate failure
                      return reject(new Error(`Register failed: ${msg}`));
                    }
                  } catch (e) {
                    console.error("Register error:", e);
                    return reject(new Error(`Register error: ${e.message}`));
                  }
                } else {
                  // include server message if present for better debugging
                  const respText = xhr.responseText || "";
                  return reject(
                    new Error(
                      `Upload to storage failed: HTTP ${xhr.status} ${respText}`,
                    ),
                  );
                }
                resolve();
              };
              xhr.onerror = () => {
                reject(new Error("Upload to storage failed - network error"));
              };
              xhr.ontimeout = () => {
                reject(new Error("Upload to storage timed out"));
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

      alert("Product created! Redirecting...");
      Router.push("/admin/products");
    } catch (submissionError) {
      console.error("Submit error", submissionError);
      alert("Error creating product: " + submissionError.message);
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
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

        {/* --- size/stock management --- */}
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <h3 className="font-semibold mb-2">Available Sizes / Quantities</h3>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1">
              <label className="block text-xs">Size</label>
              <select
                value={newStock.sizeId}
                onChange={(e) =>
                  setNewStock((s) => ({ ...s, sizeId: e.target.value }))
                }
                className="w-full p-2 border"
              >
                <option value="">Select size</option>
                {sizes.map((sz) => (
                  <option key={sz.id} value={sz.id}>
                    {sz.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label className="block text-xs">Qty</label>
              <input
                type="number"
                min="0"
                value={newStock.quantity}
                onChange={(e) =>
                  setNewStock((s) => ({ ...s, quantity: e.target.value }))
                }
                className="w-full p-2 border"
              />
            </div>
            <div>
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={() => {
                  const sid = parseInt(newStock.sizeId, 10);
                  const qty = parseInt(newStock.quantity, 10);
                  if (!sid || isNaN(qty) || qty < 0) return;
                  setInitialStocks((arr) => {
                    const existing = arr.find((s) => s.sizeId === sid);
                    if (existing) {
                      // update quantity
                      return arr.map((s) =>
                        s.sizeId === sid ? { ...s, quantity: qty } : s,
                      );
                    }
                    return [...arr, { sizeId: sid, quantity: qty }];
                  });
                  setNewStock({ sizeId: "", quantity: 0 });
                }}
              >
                Add
              </button>
            </div>
          </div>

          {/* range selection */}
          <div className="flex flex-wrap items-end gap-2 mb-2">
            <div className="flex-1">
              <label className="block text-xs">From size</label>
              <select
                value={newStock.rangeStart || ""}
                onChange={(e) =>
                  setNewStock((s) => ({ ...s, rangeStart: e.target.value }))
                }
                className="w-full p-2 border"
              >
                <option value="">-- select --</option>
                {sizes.map((sz) => (
                  <option key={sz.id} value={sz.id}>
                    {sz.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs">To size</label>
              <select
                value={newStock.rangeEnd || ""}
                onChange={(e) =>
                  setNewStock((s) => ({ ...s, rangeEnd: e.target.value }))
                }
                className="w-full p-2 border"
              >
                <option value="">-- select --</option>
                {sizes.map((sz) => (
                  <option key={sz.id} value={sz.id}>
                    {sz.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label className="block text-xs">Qty each</label>
              <input
                type="number"
                min="0"
                value={newStock.rangeQty || 0}
                onChange={(e) =>
                  setNewStock((s) => ({ ...s, rangeQty: e.target.value }))
                }
                className="w-full p-2 border"
              />
            </div>
            <div>
              <button
                type="button"
                className="px-4 py-2 bg-green-600 text-white rounded"
                onClick={() => {
                  const start = parseInt(newStock.rangeStart, 10);
                  const end = parseInt(newStock.rangeEnd, 10);
                  const qty = parseInt(newStock.rangeQty, 10);
                  if (!start || !end || isNaN(qty) || qty < 0 || start > end)
                    return;
                  const ordered = [...sizes]
                    .map((sz) => ({
                      id: sz.id,
                      num: parseFloat(sz.name) || NaN,
                    }))
                    .filter((z) => !isNaN(z.num))
                    .sort((a, b) => a.num - b.num);
                  const startIdx = ordered.findIndex((z) => z.id === start);
                  const endIdx = ordered.findIndex((z) => z.id === end);
                  if (startIdx < 0 || endIdx < 0) return;
                  const rangeIds = ordered
                    .slice(startIdx, endIdx + 1)
                    .map((z) => z.id);
                  setInitialStocks((arr) => {
                    const copy = [...arr];
                    rangeIds.forEach((sid) => {
                      const existing = copy.find((s) => s.sizeId === sid);
                      if (existing) {
                        existing.quantity = qty;
                      } else {
                        copy.push({ sizeId: sid, quantity: qty });
                      }
                    });
                    return copy;
                  });
                  setNewStock((s) => ({
                    ...s,
                    rangeStart: "",
                    rangeEnd: "",
                    rangeQty: 0,
                  }));
                }}
              >
                Add range
              </button>
            </div>
          </div>

          {initialStocks.length > 0 && (
            <div className="mt-3">
              <ul className="space-y-1">
                {initialStocks.map((s) => {
                  const szName = sizes.find((z) => z.id === s.sizeId)?.name;
                  return (
                    <li
                      key={s.sizeId}
                      className="flex items-center justify-between"
                    >
                      <span>
                        {szName || s.sizeId}: {s.quantity}
                      </span>
                      <button
                        type="button"
                        className="text-red-600 text-xs"
                        onClick={() =>
                          setInitialStocks((arr) =>
                            arr.filter((x) => x.sizeId !== s.sizeId),
                          )
                        }
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div>
          <button className="bg-black text-white px-4 py-2">Create</button>
        </div>
      </form>
    </Layout>
  );
}
