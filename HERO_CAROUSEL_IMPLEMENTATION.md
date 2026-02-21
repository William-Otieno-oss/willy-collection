# Hero Carousel & Category Sidebar Implementation

This document outlines the enterprise-grade implementation of Jumia.co.ke-inspired components for your website.

## 🎯 Overview

Two main components have been implemented:

1. **HeroCarousel** - Dynamic hero banner carousel with API integration
2. **CategorySidebar** - Sticky/off-canvas category navigation with mega-menu dropdowns

Both components are fully API-driven, fully responsive, and production-ready.

---

## 📦 Components

### 1. HeroCarousel (`frontend/components/HeroCarousel.js`)

A responsive hero carousel that fetches banners dynamically from the backend API.

#### Features:

- ✅ Auto-slide with smooth transitions (5-second interval)
- ✅ Navigation arrows + pagination dots
- ✅ Pause on hover, resume on mouse leave
- ✅ Swipe support on mobile devices
- ✅ Skeleton loading placeholder
- ✅ Fully responsive breakpoints (mobile, tablet, desktop)
- ✅ ARIA labels and accessibility features
- ✅ Touch-optimized buttons and controls

#### Usage:

```javascript
import HeroCarousel from "../components/HeroCarousel";

export default function HomePage() {
  return <HeroCarousel />;
}
```

#### API Integration:

- **Endpoint**: `GET /api/banners`
- **Response Format**:

```json
[
  {
    "id": 1,
    "title": "Summer Collection",
    "subtitle": "Discover the latest",
    "description": "Limited edition sneakers",
    "imageUrl": "https://example.com/image.jpg",
    "link": "/categories/sneakers",
    "ctaText": "Shop Now",
    "order": 0,
    "active": true,
    "createdAt": "2026-02-16T...",
    "updatedAt": "2026-02-16T..."
  }
]
```

---

### 2. CategorySidebar (`frontend/components/CategorySidebar.js`)

A sticky desktop sidebar and off-canvas mobile menu featuring category navigation with mega-menu dropdowns.

#### Features:

- ✅ Sticky desktop sidebar (sticky top-20)
- ✅ Mobile off-canvas slide-in behavior
- ✅ Hover-based mega-menu dropdowns
- ✅ Smooth animations
- ✅ Keyboard navigation (Escape to close, Tab cycling)
- ✅ Scroll locking when mobile menu is open
- ✅ Skeleton loading state
- ✅ Fully keyboard accessible (ARIA labels)
- ✅ Touch-optimized for mobile devices

#### Usage:

```javascript
import CategorySidebar from "../components/CategorySidebar";

export default function HomePage() {
  return <CategorySidebar />;
}
```

#### API Integration:

- **Endpoint**: `GET /api/categories`
- **Response Format**:

```json
[
  {
    "id": 1,
    "name": "Men",
    "slug": "men-shoes",
    "icon": "👔",
    "description": "Men's sneakers",
    "order": 0,
    "featured": true,
    "megaMenuItems": [
      {
        "id": 1,
        "title": "All Men Shoes",
        "link": "/categories/men-shoes",
        "icon": "👟",
        "order": 0,
        "categoryId": 1,
        "createdAt": "2026-02-16T..."
      }
    ],
    "createdAt": "2026-02-16T...",
    "updatedAt": "2026-02-16T..."
  }
]
```

---

## 🗄️ Database Schema

### Banner Model

```prisma
model Banner {
  id          Int       @id @default(autoincrement())
  title       String    // Main heading
  subtitle    String?   // Secondary heading
  description String?   // Additional text
  imageUrl    String    // Background image URL
  link        String?   // CTA navigation link
  ctaText     String?   @default("Shop Now")
  order       Int       @default(0)
  active      Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### Category Model

```prisma
model Category {
  id          Int            @id @default(autoincrement())
  name        String         // Display name
  slug        String         @unique
  icon        String?        // Emoji, SVG, or image URL
  description String?
  order       Int            @default(0)
  featured    Boolean        @default(false)
  megaMenuItems MegaMenuItem[]
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}
```

### MegaMenuItem Model

```prisma
model MegaMenuItem {
  id          Int       @id @default(autoincrement())
  title       String    // Menu item label
  link        String?   // Navigation link
  icon        String?   // Optional icon
  order       Int       @default(0)
  category    Category  @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  categoryId  Int
  createdAt   DateTime  @default(now())
}
```

---

## 🔧 Backend API Endpoints

### Banners

#### Get All Active Banners

```
GET /api/banners
```

Returns array of all active banners sorted by order.

#### Get Single Banner

```
GET /api/banners/:id
```

#### Create Banner (Admin Only)

```
POST /api/banners
Content-Type: application/json

{
  "title": "...",
  "subtitle": "...",
  "description": "...",
  "imageUrl": "https://...",
  "link": "/categories/...",
  "ctaText": "...",
  "order": 0,
  "active": true
}
```

#### Update Banner (Admin Only)

```
PUT /api/banners/:id
Content-Type: application/json

{
  "title": "...",
  "active": false
}
```

#### Delete Banner (Admin Only)

```
DELETE /api/banners/:id
```

---

### Categories

#### Get All Categories

```
GET /api/categories
```

Returns all categories with their mega-menu items.

#### Get Featured Categories Only

```
GET /api/categories/featured
```

#### Get Single Category

```
GET /api/categories/:slug
```

#### Create Category (Admin Only)

```
POST /api/categories
Content-Type: application/json

{
  "name": "Men",
  "slug": "men-shoes",
  "icon": "👔",
  "description": "...",
  "order": 0,
  "featured": true
}
```

#### Update Category (Admin Only)

```
PUT /api/categories/:id
```

#### Delete Category (Admin Only)

```
DELETE /api/categories/:id
```

#### Add Mega Menu Item to Category (Admin Only)

```
POST /api/categories/:categoryId/mega-menu
Content-Type: application/json

{
  "title": "Running Shoes",
  "link": "/categories/sneakers?type=running",
  "icon": "🏃",
  "order": 0
}
```

#### Update Mega Menu Item (Admin Only)

```
PUT /api/categories/mega-menu/:itemId
```

#### Delete Mega Menu Item (Admin Only)

```
DELETE /api/categories/mega-menu/:itemId
```

---

## 🚀 Setup & Installation

### 1. Install Dependencies

**Frontend:**

```bash
cd frontend
npm install react-swipeable
```

**Backend:**
The new routes are already imported in `backend/src/server.js`.

### 2. Run Database Migration

```bash
cd backend
npx prisma migrate deploy
```

### 3. Seed Sample Data (Optional)

```bash
# From backend directory
node scripts/seed-banners.js
```

This will create:

- 4 sample banners
- 9 sample categories (Men, Women, Kids, Sneakers, Sports, Canvas, Official, Boots, Slip-Ons)
- Mega-menu items for Men and Sneakers categories

### 4. Update Homepage

Your `frontend/pages/index.js` has been updated to use the new components:

```javascript
// Old: import CarouselSection from "../components/CarouselSection";
// New:
import HeroCarousel from "../components/HeroCarousel";

export default function Home() {
  return (
    <Layout>
      <HeroCarousel />
      {/* ... rest of homepage */}
    </Layout>
  );
}
```

---

## 📱 Responsive Behavior

### Desktop (1024px+)

- **Sidebar**: Sticky, takes 192px width (w-48)
- **Carousel**: Flex-1, fills remaining width
- **Mega Menu**: Dropdown on hover, positioned absolutely to the right
- **Pagination Dots**: 10-12px size with gaps
- **Content**: Max-width for text content (max-w-xl)

### Tablet (640px - 1023px)

- **Sidebar**: Still sticky desktop mode
- **Carousel**: Responsive image sizes
- **Text**: text-5xl headings
- **Buttons**: px-10 py-4 with proper touch targets

### Mobile (<640px)

- **Sidebar**: Off-canvas toggle (hamburger menu from top-left)
- **Carousel**: Full bleed, height h-96
- **Mega Menu**: Nested list in mobile menu, not dropdown
- **Arrows**: Hidden by default (space constrained)
- **Pagination**: Smaller dots for mobile
- **Text**: Responsive sizing (text-3xl down from text-6xl)
- **Content**: px-6 padding

---

## 🎨 Customization

### Change Carousel Auto-Advance Interval

In `HeroCarousel.js`, line ~60:

```javascript
// Change 5000 to desired milliseconds
setInterval(() => {
  setCurrentSlide((prev) => (prev + 1) % banners.length);
}, 5000); // ← Change this
```

### Modify Overlay Gradient

In `HeroCarousel.js`, line ~130:

```javascript
// Change colors/opacity
<div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-black/40"></div>
```

### Adjust Sidebar Width

In `CategorySidebar.js` and `HeroCarousel.js`:

```javascript
// Change 192px (w-48) to desired width
<aside className="... md:w-48 ...">
```

### Customize Mega Menu Position

In `CategorySidebar.js`, mega menu component:

```javascript
// Change positioning
<div className="absolute left-full top-0 ml-0 ...">
```

---

## 🛠️ Admin Dashboard

Two admin pages have been created for managing content:

### Banners Admin

**URL**: `/admin/banners`

Features:

- Create, read, update, delete banners
- Form validation
- Image URL input
- Order/display control
- Active/Inactive toggle

### Categories Admin

**URL**: `/admin/categories`

Features:

- Manage categories
- Auto-generate slugs from category names
- Add category icons (emoji support)
- Manage mega-menu items
- Reorder categories and menu items
- Feature flag for categories

---

## 🔐 Authentication

All POST, PUT, DELETE endpoints for banners and categories require admin authentication via the `adminAuth` middleware.

Ensure your admin user is properly authenticated before making API requests.

---

## 📊 Performance Optimizations

1. **Image Optimization**: Uses Next.js `Image` component with:
   - Responsive sizes
   - Quality: 90 (balanced quality/size)
   - Lazy loading for non-priority slides
   - Priority rendering for first image

2. **Skeleton Loading**: Loading state shows placeholder while fetching

3. **API Caching**: Implement SWR or React Query for client-side caching (future enhancement)

4. **Code Splitting**: Components use dynamic imports for below-fold sections

5. **CSS-in-JS**: Minimal inline styles, uses Tailwind utility classes

---

## ♿ Accessibility

- **ARIA Labels**: All interactive elements have descriptive labels
- **Keyboard Navigation**:
  - Arrow buttons: Focus with outline
  - Pagination dots: Focusable, `aria-current` for active
  - Sidebar: Escape to close modal
  - Mobile menu: Tab cycling with focus trap
- **Semantic HTML**: `<nav>`, `<button>`, `<section>` with proper roles
- **Color Contrast**: Text overlays maintain WCAG AA compliance

---

## 🐛 Common Issues & Solutions

### Banners Not Loading

1. Ensure backend is running: `npm run dev` from backend directory
2. Check API endpoint: `GET http://localhost:4000/api/banners`
3. Verify no banners in database: Run seed script

### Sidebar Categories Empty

1. Verify categories exist in database
2. Check console for API errors (Network tab)
3. Run: `node scripts/seed-banners.js`

### Mobile Menu Not Opening

1. Check viewport is actually mobile (<768px)
2. Inspect hamburger button click handler
3. Verify `mobileOpen` state is updating

---

## 📚 File Structure

```
backend/
├── src/
│   ├── routes/
│   │   ├── banners.js          ← NEW
│   │   ├── categories.js        ← NEW
│   │   └── ...
│   └── server.js                ← UPDATED
├── prisma/
│   ├── schema.prisma            ← UPDATED (new models)
│   └── migrations/
│       └── 20260216_.../migration.sql  ← NEW
└── scripts/
    └── seed-banners.js          ← NEW

frontend/
├── components/
│   ├── HeroCarousel.js          ← NEW
│   ├── CategorySidebar.js       ← NEW
│   └── ...
├── pages/
│   ├── index.js                 ← UPDATED
│   └── admin/
│       ├── banners.js           ← NEW
│       └── categories.js        ← NEW
├── lib/
│   └── navigationItems.js       ← Now deprecated (using API)
└── package.json                 ← UPDATED
```

---

## 🚢 Deployment Checklist

- [ ] Run `npx prisma migrate deploy` on production
- [ ] Seed initial banners/categories via API
- [ ] Test banner carousel on all devices
- [ ] Test category sidebar on mobile and desktop
- [ ] Verify admin pages are protected with auth
- [ ] Clear browser cache and service worker
- [ ] Test keyboard navigation
- [ ] Verify ARIA attributes with screen reader

---

## 📝 Future Enhancements

1. **Carousel Batch Loading**: Load multiple banners on user scroll
2. **Banner Analytics**: Track impressions and clicks
3. **Category Grouping**: Display categories in columns (Jumia-style)
4. **Search Integration**: Add search in mega-menu
5. **Drag-to-Reorder**: Admin interface for reordering
6. **Image Upload**: Direct S3 upload for banners
7. **A/B Testing**: Test different banner versions
8. **Internationalization**: Multi-language support for categories

---

## 📞 Support

For issues or questions:

1. Check console for errors
2. Verify API endpoints are responding
3. Ensure database migrations are applied
4. Check admin authentication tokens

---

Good luck! 🚀
