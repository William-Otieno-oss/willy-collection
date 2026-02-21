const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default API_BASE;
export { API_BASE };

export function getImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") return null;
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${API_BASE}${imageUrl}`;
}

// Get admin token from localStorage
function getAdminToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

// Check if token is expired
function isTokenExpired() {
  if (typeof window === "undefined") return true;
  const expiresAt = localStorage.getItem("admin_token_expires");
  if (!expiresAt) return true;
  return parseInt(expiresAt) <= Date.now();
}

// Clear expired auth
function clearExpiredAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_token_expires");
}

// Generic fetch with error handling and timeout
async function fetchWithTimeout(url, options = {}, timeout = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    // Validate response
    if (!response) {
      throw new APIError("No response from server", 0, null);
    }

    let data = null;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json().catch(() => null);
    } else {
      data = await response.text().catch(() => null);
    }

    if (!response.ok) {
      if (response.status === 401) {
        clearExpiredAuth();
      }
      const errorMessage =
        data?.error || data?.message || `HTTP ${response.status}`;
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

// Public API fetch
export async function fetcher(url) {
  try {
    const { data } = await fetchWithTimeout(API_BASE + url);

    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    // Throw API error for caller to handle
    return [];
  }
}

// Admin API fetch with auth token
export async function adminFetcher(url, options = {}) {
  const token = getAdminToken();

  if (!token) {
    throw new APIError("No authentication token", 401, null);
  }

  if (isTokenExpired()) {
    clearExpiredAuth();
    throw new APIError("Session expired", 401, null);
  }

  try {
    return await fetchWithTimeout(API_BASE + url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      clearExpiredAuth();
    }
    throw error;
  }
}

// POST request (public)
export async function postRequest(url, body) {
  if (!body || typeof body !== "object") {
    throw new APIError("Invalid request body", 400, null);
  }

  try {
    const { data } = await fetchWithTimeout(API_BASE + url, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return data;
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError(error.message, 500, null);
  }
}

// POST request (admin)
export async function adminPostRequest(url, body) {
  if (!body || typeof body !== "object") {
    throw new APIError("Invalid request body", 400, null);
  }

  const token = getAdminToken();
  if (!token) {
    throw new APIError("No authentication token", 401, null);
  }

  if (isTokenExpired()) {
    clearExpiredAuth();
    throw new APIError("Session expired", 401, null);
  }

  try {
    const { data } = await fetchWithTimeout(API_BASE + url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    return data;
  } catch (error) {
    if (
      error instanceof APIError &&
      (error.status === 401 || error.status === 403)
    ) {
      clearExpiredAuth();
    }
    if (error instanceof APIError) throw error;
    throw new APIError(error.message, 500, null);
  }
}

// PUT request (admin)
export async function adminPutRequest(url, body) {
  if (!body || typeof body !== "object") {
    throw new APIError("Invalid request body", 400, null);
  }

  const token = getAdminToken();
  if (!token) {
    throw new APIError("No authentication token", 401, null);
  }

  if (isTokenExpired()) {
    clearExpiredAuth();
    throw new APIError("Session expired", 401, null);
  }

  try {
    const { data } = await fetchWithTimeout(API_BASE + url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    return data;
  } catch (error) {
    if (
      error instanceof APIError &&
      (error.status === 401 || error.status === 403)
    ) {
      clearExpiredAuth();
    }
    if (error instanceof APIError) throw error;
    throw new APIError(error.message, 500, null);
  }
}

// DELETE request (admin)
export async function adminDeleteRequest(url) {
  const token = getAdminToken();
  if (!token) {
    throw new APIError("No authentication token", 401, null);
  }

  if (isTokenExpired()) {
    clearExpiredAuth();
    throw new APIError("Session expired", 401, null);
  }

  try {
    const { data } = await fetchWithTimeout(API_BASE + url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  } catch (error) {
    if (
      error instanceof APIError &&
      (error.status === 401 || error.status === 403)
    ) {
      clearExpiredAuth();
    }
    if (error instanceof APIError) throw error;
    throw new APIError(error.message, 500, null);
  }
}

// Validate order object
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
