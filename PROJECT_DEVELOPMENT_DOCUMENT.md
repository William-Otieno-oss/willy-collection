# Product Requirements Document (PRD)

## 1. Executive Overview

The system is a full‑stack e-commerce platform for selling premium sneakers. It consists of a Next.js frontend and an Express.js backend with PostgreSQL via Prisma. Users can browse products, filter by category/brand/search, add items to a cart persisted in localStorage, and complete a checkout process selecting billing, delivery, and payment options. Administrators log in using email/password to manage products, orders, banners, categories, and brands. The backend provides REST API endpoints under `/api/*`; security is enforced with JWT for admin routes. Static assets and uploads are served via Express. The application is optimized for performance (Lighthouse > 94) and fully accessible (WCAG 2.1 AA).

## 2. Problem Definition

The code implements an e-commerce solution to provide a modern, responsive, accessible, and performant shopping experience for sneaker customers while offering administrators a dashboard to manage inventory and orders. It solves the problem of creating a production‑ready luxury storefront with full sales and management capabilities.

## 3. Full Feature Breakdown

### 3.1 Browsing Products

- **Purpose:** Allow visitors to view sneaker catalog.
- **Trigger:** User navigates to homepage, category page or uses search.
- **Inputs:** Query parameters `category`, `brand`, `search`.
- **Processing logic:** Frontend pages call `/api/sneakers` with filters; backend queries Prisma `sneaker.findMany` with conditions.
- **Output:** JSON array of sneaker objects (slug, name, price, discounts, image URLs).
- **Dependencies:** `frontend/lib/api.js`, `backend/src/routes/sneakers.js`, Prisma schema.
- **Failure handling:** Backend catches errors and logs; returns 500 with message.

### 3.2 Product Detail

- **Purpose:** Show individual sneaker information.
- **Trigger:** User clicks product card or navigates to `/sneakers/[slug]`.
- **Inputs:** URL slug parameter.
- **Processing logic:** Backend route `GET /api/sneakers/:slug` queries `sneaker.findUnique({where:{slug}})`.
- **Output:** Sneaker object with details (description, images, inventory).
- **Dependencies:** same as above.
- **Failure handling:** 404 if not found, 500 on DB error.

### 3.3 Shopping Cart

- **Purpose:** Collect items to purchase.
- **Trigger:** User adds items using `SneakerCard` quick view or buttons.
- **Inputs:** Product ID, quantity.
- **Processing logic:** Frontend updates React state and writes to `localStorage`; calculates totals.
- **Output:** Rendered cart page showing items, quantities, summary.
- **Dependencies:** `frontend/components/CartItem.js`, `lib/cart functions` if present.
- **Failure handling:** Client-side validation ensures nonzero quantity.

### 3.4 Checkout

- **Purpose:** Capture billing/shipping/payment data and create order.
- **Trigger:** User submits checkout form on `/checkout`.
- **Inputs:** Form fields (name, email, address, delivery method, payment method, cart items).
- **Processing logic:** Frontend validates required fields, posts to `POST /api/orders`.
- **Backend:** route validates body, uses Prisma to create order and order items; returns order ID.
- **Output:** Confirmation page, success message.
- **Dependencies:** Backend `orders.js`, Prisma models `Order`, `OrderItem`.
- **Failure handling:** Validation errors return 400; server errors return 500.

### 3.5 User Authentication (Admin)

- **Purpose:** Secure access to admin panel.
- **Trigger:** Admin enters credentials on `/admin/login`.
- **Inputs:** Email, password.
- **Processing logic:** Frontend POST to `/api/auth/login`; backend verifies email format, length, bcrypt compares password, checks `isAdmin`, signs JWT.
- **Output:** JSON with token, user data.
- **Dependencies:** `backend/src/routes/auth.js`, bcrypt, jwt.
- **Failure handling:** Generic 401/403 responses, logging of failed attempts.

### 3.6 Admin Dashboard

- **Purpose:** Provide statistics and quick actions.
- **Trigger:** Logged-in admin visits `/admin/dashboard`.
- **Inputs:** JWT in Authorization header.
- **Processing logic:** `GET /api/admin/stats` queries Prisma aggregations.
- **Output:** JSON with counts (products, orders, revenue, pending).
- **Dependencies:** Auth middleware verifying token.
- **Failure handling:** 401 if token missing/invalid.

### 3.7 Product Management (Admin)

- **Purpose:** Add, edit, delete products.
- **Trigger:** Admin actions on `/admin/products` page.
- **Inputs:** Product data via forms, including image upload via signed S3 key.
- **Processing logic:** CRUD routes in `routes/admin.js` or specific routes; interact with Prisma.
- **Output:** Updated product list.
- **Dependencies:** `backend/routes/s3.js` for upload keys.
- **Failure handling:** Validate fields; return errors 400 or 500.

### 3.8 Order Management (Admin)

- **Purpose:** View and update order statuses.
- **Trigger:** Admin uses `/admin/orders` page.
- **Inputs:** Filter criteria, status changes.
- **Processing logic:** Backend queries orders with filters; `PUT /api/orders/:id` to update.
- **Output:** JSON list of orders or updated order.
- **Dependencies:** `backend/routes/orders.js`.
- **Failure handling:** 404 if order not found; 400 for invalid status.

### 3.9 Category/Brand/Banner Management

- **Purpose:** Manage ancillary catalog data.
- **Trigger:** Admin uses respective admin pages/forms.
- **Inputs:** Names, images.
- **Processing logic:** CRUD endpoints in their routes, using Prisma.
- **Output:** Updated lists.
- **Failure handling:** standard validation.

### 3.10 Health & Readiness Checks

- **Purpose:** Support container orchestration.
- **Trigger:** External service pings `/api/health` and `/ready`.
- **Inputs:** none.
- **Processing logic:** health returns JSON with uptime; ready does simple `SELECT 1` using Prisma.
- **Output:** 200 JSON or 503 if DB error.
- **Dependencies:** Prisma DB connection.
- **Failure handling:** logs error.

### 3.11 File Uploads

- **Purpose:** Allow admins to upload images to S3.
- **Trigger:** Frontend requests signed key via `/api/s3/upload-key`.
- **Inputs:** File name/size.
- **Processing logic:** Backend uses AWS SDK to generate pre-signed POST.
- **Output:** Credentials for upload.
- **Dependencies:** AWS SDK, environment variables.
- **Failure handling:** 500 on error.

### 3.12 Static File Serving

- **Purpose:** Serve uploaded images.
- **Trigger:** Browser requests `/uploads/...`.
- **Inputs:** URL path.
- **Processing logic:** Express static middleware with 1d cache.
- **Output:** File response.

### 3.13 Performance Monitoring

- **Purpose:** Collect web vitals.
- **Trigger:** Frontend API call to `/api/perf-metrics`.
- **Inputs:** Metrics payload.
- **Processing logic:** backend stores/logs metrics (not shown).
- **Output:** 200 OK.

### 3.14 Sitemap Generation

- **Purpose:** SEO.
- **Trigger:** Request to `/api/sitemap.xml`.
- **Inputs:** none.
- **Processing logic:** dynamic building from available routes.
- **Output:** XML sitemap.

### 3.15 Logging & Rate Limiting

- **Purpose:** Security and debugging.
- **Trigger:** Each request.
- **Inputs:** Request context.
- **Processing logic:** `logger.request` middleware logs; `rateLimit` middleware counts requests per IP.
- **Output:** headers for rate limit, logs.
- **Dependencies:** custom logger module.
- **Failure handling:** rate-limit error returned.

## 4. Functional Requirements

- Frontend must support navigation, filtering, and search of products.
- Cart must persist across sessions via localStorage.
- Checkout must collect billing/shipping/payment and create orders.
- Backend must expose REST API endpoints with JSON.
- Admin routes require JWT authentication and `isAdmin` check.
- Rate limits apply globally (default 100 requests per 15m).
- CORS restricts origins to configured list.
- Security headers (CSP, HSTS, etc.) on every response.
- Body parser limit 10mb.
- Static `/uploads` route with 1-day cache.
- Health and readiness endpoints available.
- Errors logged with context.

## 5. Non-Functional Requirements

- Performance: gzip compression, caching, optimized images; Lighthouse target >85.
- Security: CSP, X-Frame-Options, XSS protection, strict referrer policy, permissions policy; JWT HS256 8h.
- Validation: email regex, password length, content-type enforcement.
- Constraints: upload size limits handled by AWS, DB connection check on startup.
- Scalability: ready endpoint for orchestration; static files cached.

## 6. User Roles & Permissions

- **Visitor:** browse products, add to cart, checkout.
- **Admin:** must exist as user with `isAdmin=true`; can login and manage site.
- JWT payload includes `id`, `email`, `isAdmin` and is checked in admin routes.
- Unauthorized requests to admin endpoints return 401/403.

## 7. Data Architecture

### Entities (Prisma schema inferred)

- **User**: id, email, password, name, isAdmin.
- **Sneaker**: id, slug, name, description, price, discount, brandId, categoryId, images...
- **Order**: id, userId?, status, total, deliveryMethod, paymentMethod, billing info, items.
- **OrderItem**: id, orderId, sneakerId, quantity, price.
- **Brand**: id, name, slug.
- **Category**: id, name, slug.
- **Banner**: id, imageUrl, linkUrl, altText.

### Relationships

- Sneaker belongs to Brand and Category.
- Order has many OrderItems; each OrderItem links to a Sneaker.

### Validation Rules

- Email regex validated (<254 chars).
- Password length <500.
- Various route validators ensure required fields.

### Lifecycle

- Creation via admin endpoints or seed scripts.
- Orders created during checkout; status updated by admin.

## 8. System Architecture

### Frontend

- Next.js React with pages routing.
- Components share Tailwind styling.
- API calls via `lib/api.js` using fetch.
- State minimal; cart in localStorage.

### Backend

- Express server set up in `src/server.js`.
- Middleware for logging, CORS, security, rate limiting.
- Routes under `/src/routes` handle logic.
- Database connection via `src/db.js` (Prisma client).
- Helper modules in `middleware` and `utils`.

### API Communication

- Frontend requests `https://<api>/api/*` with JSON payloads.
- JWT Bearer header required for protected routes.

### State Management

- Cart items stored client-side.
- Session state not persisted; JWT for auth.

### External Services

- PostgreSQL database.
- Optional S3 for image storage.
- Potential performance logs endpoint.

## 9. Workflow Mapping

### User Browsing Flow

1. User opens homepage -> GET `/` -> React page fetches products via `/api/sneakers`.
2. Clicks category/brand -> frontend calls same endpoint with filter.
3. Clicks product -> navigate to `/sneakers/[slug]` -> fetch detail.
4. Adds to cart -> front end updates localStorage.

### Checkout Flow

1. Navigate to `/cart`, then `/checkout`.
2. Fill form -> client validation.
3. Submit -> POST `/api/orders` with cart and form data.
4. Backend creates order, returns confirmation.
5. Frontend shows success page.

### Admin Login Flow

1. Navigate to `/admin/login` -> submit credentials.
2. Frontend POST `/api/auth/login`.
3. Backend validates, returns JWT.
4. Frontend stores token (e.g., localStorage) and redirects to dashboard.

### Admin Product/Order Management

1. Dashboard page mounts -> GET `/api/admin/stats`.
2. Products page -> GET `/api/admin/products`, POST/PUT/DELETE as needed.
3. Orders page -> GET `/api/admin/orders?filter=`, PUT `/api/orders/:id`.

### Upload Flow

1. When adding/editing product with image → frontend requests POST `/api/s3/upload-key` -> receives signed data -> uploads directly to S3 -> saves URL in product.

## 10. Edge Cases & Constraints

- Email enumeration prevented by generic error messages in login.
- Password compare wrapped in try/catch; UDP error logs.
- Rate limit returns 429 with headers.
- CORS origin check logs missing origins and rejects unknown.
- Static uploads served without ETag to avoid mismatches.
- Graceful shutdown handles SIGINT/SIGTERM and ensures DB disconnect.
- Readiness check returns 503 if DB unreachable.
- Content type validation middleware rejects non-JSON.
- Body parser limit 10mb prevents large payloads.
- JWT expiry is 8h; expired tokens return 401.
- Admin routes check `isAdmin`; non-admins get 403.

## 11. Business Rules

- Only `isAdmin` users may access admin API.
- Discounts and pricing logic handled client-side; price calculations shown in cart.
- Delivery methods constrained to same-day, next-day, pickup (frontend enforces options).
- Payment methods limited to M-Pesa or Cash on Delivery.
- Order total calculated from cart items and shipping.
- Products are uniquely identified by slug.
- Data seeded via scripts for initial setup.

---

_Document generated from code in workspace._
