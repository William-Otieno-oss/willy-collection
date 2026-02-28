const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default API_BASE;
export { API_BASE };

export function getImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") return null;
  // absolute URL already
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;

  // ensure API_BASE has no trailing slash
  let base = API_BASE || "";
  if (!base && typeof window !== "undefined") {
    base = window.location.origin;
  }
  if (base.endsWith("/")) base = base.slice(0, -1);
  // ensure imageUrl begins with slash
  if (!imageUrl.startsWith("/")) imageUrl = "/" + imageUrl;

  return base + imageUrl;
}

// Access token is now stored in an HTTP-only cookie set by the server.
// JavaScript cannot read it directly, so we avoid using localStorage entirely.
// Refreshes are handled by calling the /api/auth/refresh endpoint; the server
// rotates both the refresh and access cookies automatically. Responses still
// include the token for backward compatibility, but client code should ignore
// storing it.

async function refreshTokenIfNeeded() {
  // This helper can be invoked prior to making an authenticated request.  It
  // simply calls the refresh endpoint; if the cookie has expired or is
  // invalid the request will return 401 and we propagate that.
  try {
    await fetchWithTimeout(API_BASE + "/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
  } catch (err) {
    // propagate for callers to handle (e.g. redirect to login)
    throw err;
  }
}

// Generic fetch with error handling and timeout
async function fetchWithTimeout(url, options = {}, timeout = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      credentials: "include", // send cookies for auth
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
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
  const { data } = await fetchWithTimeout(API_BASE + url);

  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

// Admin API fetch – relies on HTTP-only cookie for authentication.
// The server will read the access_token cookie (or Authorization header if
// the caller passes one) and verify accordingly.  We still propagate errors
// so callers can handle 401/403 and redirect to login.
export async function adminFetcher(url, options = {}) {
  try {
    // ensure access token is current; if refresh cookie has expired this call will
    // return 401 and propagate the error so callers can redirect to login.
    try {
      await refreshTokenIfNeeded();
    } catch (refreshErr) {
      // if refresh fails due to 401/expired cookie, bubble up so page logic
      // can handle redirect to login
      if (refreshErr instanceof APIError && refreshErr.status === 401) {
        throw refreshErr;
      }
      // otherwise ignore and continue; the following fetch may still succeed
    }

    const result = await fetchWithTimeout(API_BASE + url, {
      ...options,
      credentials: "include",
    });
    // return only data for convenience, similar to fetcher
    return result.data;
  } catch (error) {
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

// POST request (admin) – cookies authenticate
export async function adminPostRequest(url, body) {
  if (!body || typeof body !== "object") {
    throw new APIError("Invalid request body", 400, null);
  }

  try {
    const { data } = await fetchWithTimeout(API_BASE + url, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify(body),
    });
    return data;
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError(error.message, 500, null);
  }
}

// PUT request (admin) – cookies authenticate
export async function adminPutRequest(url, body) {
  if (!body || typeof body !== "object") {
    throw new APIError("Invalid request body", 400, null);
  }

  try {
    const { data } = await fetchWithTimeout(API_BASE + url, {
      method: "PUT",
      credentials: "include",
      body: JSON.stringify(body),
    });
    return data;
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError(error.message, 500, null);
  }
}

// DELETE request (admin) – cookies authenticate
export async function adminDeleteRequest(url) {
  try {
    const { data } = await fetchWithTimeout(API_BASE + url, {
      method: "DELETE",
      credentials: "include",
    });
    return data;
  } catch (error) {
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
