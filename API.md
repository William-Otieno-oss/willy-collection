# Willy Collection API Documentation

Complete REST API reference for the Willy Collection backend server.

## Base URL

```
http://localhost:4000
```

## Authentication

All protected endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Tokens expire in 15 minutes. Use the `/auth/refresh` endpoint to get a new token.

---

## Authentication Endpoints

### Login
**POST** `/auth/login`

Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "ADMIN"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error (401):**
```json
{
  "error": "Invalid credentials"
}
```

---

### Refresh Token
**POST** `/auth/refresh`

Get a new access token using refresh token (sent in httpOnly cookie).

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error (401):**
```json
{
  "error": "Invalid or expired refresh token"
}
```

---

### Logout
**POST** `/auth/logout`

Logout user and invalidate refresh token.

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

## Sneakers Endpoints

### List Sneakers
**GET** `/api/sneakers`

Retrieve all sneakers with optional filtering and pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `category`: Filter by category slug
- `brand`: Filter by brand slug
- `search`: Search by name
- `minPrice`: Minimum price filter
- `maxPrice`: Maximum price filter

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Air Force 1",
      "slug": "air-force-1",
      "brand": { "id": 1, "name": "Nike", "slug": "nike" },
      "category": { "id": 1, "name": "Classics", "slug": "classics" },
      "price": 120.00,
      "description": "Iconic basketball shoe",
      "images": [
        { "id": 1, "url": "https://s3.amazonaws.com/...", "alt": "Front view" }
      ],
      "stocks": [
        { "id": 1, "size": "7", "quantity": 5, "inStock": true }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50
  }
}
```

---

### Get Sneaker by ID
**GET** `/api/sneakers/:id`

Get detailed information about a specific sneaker.

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Air Force 1",
  "slug": "air-force-1",
  "brand": { "id": 1, "name": "Nike" },
  "category": { "id": 1, "name": "Classics" },
  "price": 120.00,
  "description": "Iconic basketball shoe",
  "images": [ ... ],
  "stocks": [ ... ],
  "createdAt": "2026-02-01T10:00:00Z",
  "updatedAt": "2026-02-28T10:00:00Z"
}
```

---

### Create Sneaker (Admin)
**POST** `/api/sneakers`

Create a new sneaker product (requires ADMIN role).

**Request Body:**
```json
{
  "name": "Jordan 1 Retro",
  "brandId": 2,
  "categoryId": 1,
  "price": 175.00,
  "description": "Iconic James Jordan signature shoe",
  "slug": "jordan-1-retro"
}
```

**Response (201 Created):**
```json
{
  "id": 5,
  "name": "Jordan 1 Retro",
  "price": 175.00,
  ...
}
```

---

### Update Sneaker (Admin)
**PUT** `/api/sneakers/:id`

Update sneaker details (requires ADMIN role).

**Request Body:** (same as create, partial updates allowed)

**Response (200 OK):** Updated sneaker object

---

### Delete Sneaker (Admin)
**DELETE** `/api/sneakers/:id`

Delete a sneaker product (requires ADMIN role).

**Response (200 OK):**
```json
{
  "message": "Sneaker deleted successfully"
}
```

---

## Sizes Endpoints

### List Shoe Sizes
**GET** `/api/sizes`

Get all available shoe sizes.

**Response (200 OK):**
```json
[
  { "id": 1, "size": "5", "label": "US 5" },
  { "id": 2, "size": "6", "label": "US 6" },
  ...
]
```

---

### Create Size (Admin)
**POST** `/api/sizes`

Create a new shoe size (requires ADMIN role).

**Request Body:**
```json
{
  "size": "14",
  "label": "US 14"
}
```

**Response (201 Created):** Size object

---

### Delete Size (Admin)
**DELETE** `/api/sizes/:id`

Delete a shoe size (requires ADMIN role).

**Response (200 OK):**
```json
{
  "message": "Size deleted successfully"
}
```

---

## Stock Management Endpoints

### Get Stock Records for Sneaker
**GET** `/api/sneakers/:id/stocks`

Get stock levels for all sizes of a specific sneaker.

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "sneakerId": 1,
    "sizeId": 1,
    "size": { "id": 1, "size": "7", "label": "US 7" },
    "quantity": 10,
    "inStock": true
  }
]
```

---

### Update Stock (Admin)
**POST** `/api/sneakers/:id/stocks`

Update stock for a sneaker size (requires ADMIN role).

**Request Body:**
```json
{
  "sizeId": 1,
  "quantity": 15
}
```

**Response (200 OK):** Updated stock record

---

## Orders Endpoints

### List User Orders
**GET** `/api/orders`

Get all orders for the authenticated user.

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status (Pending, Processing, Shipped, Delivered)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "userId": 1,
      "status": "Delivered",
      "totalAmount": 350.00,
      "items": [
        {
          "id": 1,
          "sneakerId": 1,
          "size": "7",
          "quantity": 2,
          "price": 120.00
        }
      ],
      "createdAt": "2026-02-01T10:00:00Z"
    }
  ]
}
```

---

### Create Order
**POST** `/api/orders`

Create a new order (requires authentication).

**Request Body:**
```json
{
  "items": [
    {
      "sneakerId": 1,
      "sizeId": 1,
      "quantity": 2
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "userId": 1,
  "status": "Pending",
  "totalAmount": 240.00,
  "items": [ ... ],
  "createdAt": "2026-02-28T10:00:00Z"
}
```

---

### Update Order Status (Admin)
**PUT** `/api/orders/:id/status`

Update order status (requires ADMIN role).

**Request Body:**
```json
{
  "status": "Shipped"
}
```

**Valid Statuses:** Pending, Processing, Shipped, Delivered, Cancelled

**Response (200 OK):** Updated order

---

### Delete Order (Admin)
**DELETE** `/api/orders/:id`

Delete an order (requires ADMIN role).

**Response (200 OK):**
```json
{
  "message": "Order deleted successfully"
}
```

---

## Image Upload Endpoints

### Get Presigned S3 URL
**POST** `/api/presign`

Get a presigned URL for uploading images to S3.

**Request Body:**
```json
{
  "key": "sneakers/1/air-force-1.webp",
  "contentType": "image/webp"
}
```

**Response (200 OK):**
```json
{
  "url": "https://s3.amazonaws.com/willy-bucket/...",
  "fields": { ... }
}
```

---

### Register Image
**POST** `/api/sneakers/:id/images/register`

Register an uploaded image for a sneaker (requires ADMIN role).

**Request Body:**
```json
{
  "s3Key": "sneakers/1/air-force-1.webp",
  "filename": "air-force-1.webp",
  "contentType": "image/webp",
  "checksum": "abc123def456...",
  "url": "/uploads/1772271400531-air-force-1.webp"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "sneakerId": 1,
  "url": "/uploads/1772271400531-air-force-1.webp",
  "s3Key": "sneakers/1/air-force-1.webp"
}
```

---

## Categories Endpoints

### List Categories
**GET** `/api/categories`

Get all product categories.

**Response (200 OK):**
```json
[
  { "id": 1, "name": "Classics", "slug": "classics" },
  { "id": 2, "name": "Jordan", "slug": "jordan" }
]
```

---

## Brands Endpoints

### List Brands
**GET** `/api/brands`

Get all brands.

**Response (200 OK):**
```json
[
  { "id": 1, "name": "Nike", "slug": "nike" },
  { "id": 2, "name": "Adidas", "slug": "adidas" }
]
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate item) |
| 500 | Server Error |

---

## Rate Limiting

All API endpoints are rate-limited to 100 requests per minute per IP address.

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1614556800
```

When rate limit is exceeded:
```
Status: 429 Too Many Requests
```

---

## Example Usage with cURL

### Login
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### List Sneakers
```bash
curl -X GET 'http://localhost:4000/api/sneakers?limit=10&page=1'
```

### Create Order
```bash
curl -X POST http://localhost:4000/api/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"sneakerId": 1, "sizeId": 1, "quantity": 2}
    ]
  }'
```

---

## WebSocket Events (Future)

Real-time features (order updates, inventory changes) will be available via WebSocket at `/api/ws`.

---

**Last Updated:** February 28, 2026  
**API Version:** 1.0.0  
**Status:** Stable
