const DEFAULT_DEV_API_BASE = "http://localhost:4000";
const RAW_API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const API_BASE = (
  RAW_API_BASE ||
  (process.env.NODE_ENV === "development" ? DEFAULT_DEV_API_BASE : "")
).replace(/\/+$/, "");

export default API_BASE;
export { API_BASE };

export function resolveApiUrl(url) {
  if (!url || typeof url !== "string") return API_BASE || "";
  if (/^https?:\/\//i.test(url)) return url;
  const path = url.startsWith("/") ? url : `/${url}`;
  return API_BASE ? `${API_BASE}${path}` : path;
}

export function getImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") return null;
  if (/^(https?:)?\/\//i.test(imageUrl) || imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  const path = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  if (path.startsWith("/uploads/") && API_BASE) {
    return `${API_BASE}${path}`;
  }
  return path;
}

function clearExpiredAuth() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("admin");
  } catch {
    // Ignore storage failures; auth state is owned by HTTP-only cookies.
  }
}

function hasHeader(headers, name) {
  return Object.keys(headers).some(
    (key) => key.toLowerCase() === name.toLowerCase(),
  );
}

function isNativeBody(body) {
  return (
    (typeof FormData !== "undefined" && body instanceof FormData) ||
    (typeof URLSearchParams !== "undefined" &&
      body instanceof URLSearchParams) ||
    (typeof Blob !== "undefined" && body instanceof Blob) ||
    (typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer)
  );
}

function buildFetchOptions(options, signal) {
  const { headers: optionHeaders = {}, body: optionBody, ...rest } = options;
  const headers = { ...optionHeaders };
  let body = optionBody;

  if (body !== undefined && body !== null && !isNativeBody(body)) {
    if (typeof body === "object") {
      body = JSON.stringify(body);
    }
    if (!hasHeader(headers, "Content-Type")) {
      headers["Content-Type"] = "application/json";
    }
  }

  return {
    credentials: "include",
    ...rest,
    signal,
    headers,
    ...(body !== undefined ? { body } : {}),
  };
}

async function fetchWithTimeout(url, options = {}, timeout = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(
      resolveApiUrl(url),
      buildFetchOptions(options, controller.signal),
    );

    clearTimeout(timeoutId);

    if (!response) {
      throw new APIError("No response from server", 0, null);
    }

    let data = null;
    const contentType = response.headers.get("content-type") || "";
    if (response.status !== 204 && contentType.includes("application/json")) {
      data = await response.json().catch(() => null);
    } else if (response.status !== 204) {
      data = await response.text().catch(() => null);
    }

    if (!response.ok) {
      if (response.status === 401) {
        clearExpiredAuth();
      }

      const serverError = data?.error;
      const errorMessage =
        (typeof serverError === "string" && serverError) ||
        serverError?.message ||
        data?.message ||
        response.statusText ||
        `HTTP ${response.status}`;
      throw new APIError(errorMessage, response.status, data);
    }

    return { status: response.status, data };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof APIError) {
      throw error;
    }

    if (error.name === "AbortError") {
      throw new APIError("Request timeout", 408, null);
    }

    if (error instanceof TypeError) {
      throw new APIError("Network error", 0, null);
    }

    throw new APIError(error.message || "Unknown error", 500, null);
  }
}

async function refreshTokenIfNeeded() {
  await fetchWithTimeout("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  });
}

export async function fetcher(url) {
  const { data } = await fetchWithTimeout(url);

  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

export async function adminFetcher(url, options = {}) {
  try {
    await refreshTokenIfNeeded();
  } catch (refreshErr) {
    if (
      refreshErr instanceof APIError &&
      (refreshErr.status === 401 || refreshErr.status === 403)
    ) {
      throw refreshErr;
    }
  }

  const result = await fetchWithTimeout(url, {
    ...options,
    credentials: "include",
  });
  return result.data;
}

function assertRequestBody(body) {
  if (body === undefined || body === null) {
    throw new APIError("Invalid request body", 400, null);
  }
}

export async function postRequest(url, body) {
  assertRequestBody(body);
  const { data } = await fetchWithTimeout(url, {
    method: "POST",
    body,
  });
  return data;
}

export async function adminPostRequest(url, body) {
  assertRequestBody(body);
  const { data } = await fetchWithTimeout(url, {
    method: "POST",
    credentials: "include",
    body,
  });
  return data;
}

export async function adminPutRequest(url, body) {
  assertRequestBody(body);
  const { data } = await fetchWithTimeout(url, {
    method: "PUT",
    credentials: "include",
    body,
  });
  return data;
}

export async function adminDeleteRequest(url) {
  const { data } = await fetchWithTimeout(url, {
    method: "DELETE",
    credentials: "include",
  });
  return data;
}

export function validateOrder(order) {
  if (!order || typeof order !== "object") {
    throw new APIError("Invalid order object", 400, null);
  }

  const { customerName, phone, items, location, deliveryMethod } = order;

  if (
    !customerName ||
    typeof customerName !== "string" ||
    customerName.trim().length < 2 ||
    customerName.length > 255
  ) {
    throw new APIError("Invalid customer name", 400, null);
  }

  if (
    !phone ||
    typeof phone !== "string" ||
    phone.trim().length < 7 ||
    phone.length > 50
  ) {
    throw new APIError("Invalid phone number", 400, null);
  }

  if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
    throw new APIError("Invalid items array (1-100 items required)", 400, null);
  }

  for (const item of items) {
    if (!item || typeof item !== "object") {
      throw new APIError("Invalid item in order", 400, null);
    }

    if (typeof item.sneakerId !== "number" || item.sneakerId < 1) {
      throw new APIError("Invalid sneaker ID", 400, null);
    }

    if (
      typeof item.quantity !== "number" ||
      item.quantity < 1 ||
      item.quantity > 100
    ) {
      throw new APIError("Invalid quantity (1-100 per item)", 400, null);
    }

    if (typeof item.price !== "number" || item.price < 0) {
      throw new APIError("Invalid price", 400, null);
    }
  }

  if (!location || typeof location !== "string" || location.trim().length < 2) {
    throw new APIError("Invalid location", 400, null);
  }

  if (
    !deliveryMethod ||
    typeof deliveryMethod !== "string" ||
    !["Standard", "Express", "Pickup"].includes(deliveryMethod)
  ) {
    throw new APIError("Invalid delivery method", 400, null);
  }

  return true;
}

export class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.data = data;
  }
}
