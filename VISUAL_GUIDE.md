# Visual Implementation Guide

## 🎨 Component Layout

### Desktop View (1024px+)

```
┌─────────────────────────────────────────────────────────────────┐
│                          HEADER                                  │
│  Logo  Search Bar  Cart  Contact                                │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┬──────────────────────────────────────────────┐
│                  │                                               │
│   SIDEBAR        │         HERO CAROUSEL                         │
│   (w-48)         │                                               │
│                  │  [Banner Image with Text Overlay]             │
│  Men             │  Title: "Summer Collection"                   │
│  > Running       │  Subtitle: "Discover the latest kicks"        │
│  > Casual        │  CTA Button: "Shop Now" (orange)              │
│                  │                                               │
│  Women           │  ◄  [Slide 2/4]  ●●○○                  ►      │
│  > Formal        │                                               │
│  > Athletic      │                                               │
│                  │                                               │
│  Sneakers        │                                               │
│  > Running       │                                               │
│  > Basketball    │                                               │
│  > Limited Ed.   │                                               │
│                  │                                               │
│  ... (more)      │                                               │
│                  │                                               │
│  (sticky)        │                                               │
│                  │                                               │
└──────────────────┴──────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     PRODUCTS GRID                                │
│  [Product] [Product] [Product] [Product]                         │
│  [Product] [Product] [Product] [Product]                         │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile View (<640px)

```
┌─────────────────────────────┐
│  ☰  Logo  Search  🛒        │ (Header)
└─────────────────────────────┘

┌─────────────────────────────┐
│                             │
│   [Banner Image]            │ (HeroCarousel)
│                             │ (full width, h-96)
│   Summer Collection         │
│                             │
│   ◄  ●  ○  ○  ○  ►          │
│                             │
└─────────────────────────────┘

              ↓

┌─────────────────────────────┐
│  ☰  Products Grid           │ (When drawer closed)
│  [Product]                  │
│  [Product]                  │
└─────────────────────────────┘


═════════════════════════════════════════════════════════════════

          ☰ Drawer Open (Full Screen)
┌─────────────────────────────┐
│ Categories         [✕]      │
├─────────────────────────────┤
│ Men                         │ (Click to expand)
│   > All Men Shoes           │
│   > Casual                  │
│   > Athletic                │
│                             │
│ Women                       │
│   > All Women Shoes         │
│   > Formal                  │
│                             │
│ Kids                        │
│ Sneakers                    │
│ ...                         │
│                             │
└─────────────────────────────┘

[Dark overlay behind drawer]
```

---

## 🔄 Data Flow Diagram

### Hero Carousel Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│ HeroCarousel Component Mounts                                │
└──────────────────────────────────────────┬───────────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────┐
                    │ useEffect Hook Triggered             │
                    │ (on component mount)                 │
                    └──────────────────────┬───────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────┐
                    │ Fetch /api/banners                   │
                    │ setLoading(true)                     │
                    └──────────────────────┬───────────────┘
                                           │
                ┌──────────────────────────┼───────────────────┐
                │                          │                   │
         Error │                      Success               Timeout
                │                          │                   │
                ▼                          ▼                   ▼
        ┌─────────────┐         ┌──────────────────┐   ┌─────────────┐
        │ setError()  │         │ setBanners(data) │   │ setError()  │
        │ Show Toast  │         │ setLoading(false)│   │ Retry UI    │
        └─────────────┘         └────────┬─────────┘   └─────────────┘
                                         │
                                         ▼
                        ┌────────────────────────────────┐
                        │ Component Re-renders            │
                        │ Maps banners to slides          │
                        │ Sets up auto-play timer (5s)    │
                        └────────────────┬─────────────────┘
                                         │
                                         ▼
                        ┌────────────────────────────────┐
                        │ Every 5s: Advance Slide         │
                        │ currentSlide = (prev + 1) % len │
                        │ Re-render with new slide         │
                        └────────────────┬─────────────────┘
                                         │
                        ┌────────────────┼────────────────┐
                        │                │                │
                   User Hovers..    User Swipes..   User Clicks..
                        │                │                │
                        ▼                ▼                ▼
                  Pause Auto-play  Next/Prev Slide  Go to Specific
                  Resume after 8s  Update currentSlide  Set slide
```

### Category Sidebar Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│ CategorySidebar Component Mounts                              │
└──────────────────────────────────────────┬───────────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────┐
                    │ useEffect Hook Triggered             │
                    │ Fetch /api/categories                │
                    └──────────────────────┬───────────────┘
                                           │
                                           ▼
                        ┌────────────────────────────────┐
                        │ Parse Response                  │
                        │ {name, slug, megaMenuItems[]}   │
                        │ setCategories(data)             │
                        └────────────────┬─────────────────┘
                                         │
                                         ▼
                        ┌────────────────────────────────┐
                        │ Render Desktop Sidebar          │
                        │ OR Mobile Hamburger Menu         │
                        │ (based on screen size)          │
                        └────────────────┬─────────────────┘
                                         │
                ┌──────────────────────────────────────────┐
                │   User Interaction                       │
                └──────┬───────────┬───────────────┬──────┐
                       │           │               │      │
                   Desktop     Mobile         Keyboard  Click
                   Hover      Toggle         (Escape)   Item
                       │           │               │      │
                       ▼           ▼               ▼      ▼
            ┌────────────────┐  ┌──────────┐  ┌──────┐  Navigate
            │ setOpenMenu =  │  │setMobile │  │Close │  to Link
            │ categoryId     │  │Open(true)│  │Menu  │
            └────────┬───────┘  └─────┬────┘  └──┬───┘
                     │                │          │
                     ▼                ▼          ▼
        ┌────────────────────┐  ┌──────────┐  └► Continue..
        │ Render Mega-Menu   │  │Off-canvas│
        │ Position: absolute │  │Drawer    │
        │ left-full, top-0   │  │animated  │
        └────────────────────┘  └──────────┘
```

---

## 🏗️ Component Hierarchy

```
HeroCarousel
├── CategorySidebar (imported)
│   ├── Skeleton Loader (while loading)
│   ├── Mobile Hamburger Button
│   ├── Mobile Off-Canvas Menu
│   │   └── CategoryList
│   │       └── MegaMenuItem[] (nested)
│   └── Desktop Sticky Sidebar
│       └── CategoryList
│           ├── Category Item
│           │   └── MegaMenu Dropdown
│           │       └── MegaMenuItem[] (dropdown)
│           └── (repeat for each category)
├── Carousel Container
│   ├── Skeleton Loader (while loading)
│   └── Slide[] (map)
│       ├── Image (Next.js Image)
│       ├── Overlay (gradient)
│       └── Content
│           ├── Title
│           ├── Subtitle
│           ├── Description
│           └── CTA Button
├── Controls
│   ├── Left Arrow Button
│   ├── Right Arrow Button
│   └── Pagination Dots[]
└── Error Message (if failed)
```

---

## 📊 Database Schema (Entity Relationship)

```
┌──────────────────────────┐
│      Banner              │
├──────────────────────────┤
│ id (PK)                  │
│ title                    │
│ subtitle                 │
│ description              │
│ imageUrl                 │
│ link                     │
│ ctaText                  │
│ order                    │
│ active                   │
│ createdAt                │
│ updatedAt                │
└──────────────────────────┘
   (Standalone entity)


┌──────────────────────────┐         ┌──────────────────────────┐
│      Category            │ 1    N  │    MegaMenuItem          │
├──────────────────────────┤◄────────┤──────────────────────────┤
│ id (PK)                  │         │ id (PK)                  │
│ name                     │         │ title                    │
│ slug (UNIQUE)            │         │ link                     │
│ icon                     │         │ icon                     │
│ description              │         │ order                    │
│ order                    │         │ categoryId (FK)          │
│ featured                 │         │ createdAt                │
│ createdAt                │         └──────────────────────────┘
│ updatedAt                │
└──────────────────────────┘

Relationships:
- Banner: No relationships (independent)
- Category: Has many MegaMenuItems (1:N)
- MegaMenuItem: Belongs to one Category (N:1)
- Delete Category: Cascade delete MegaMenuItems
```

---

## 🔌 API Endpoint Structure

```
/api/banners
├── GET  /                    (list all active banners)
├── GET  /:id                 (get single banner)
├── POST /                    (create - admin only)
├── PUT  /:id                 (update - admin only)
└── DELETE /:id               (delete - admin only)

/api/categories
├── GET  /                    (list all categories)
├── GET  /featured            (list featured only)
├── GET  /:slug               (get by slug)
├── POST /                    (create - admin only)
├── PUT  /:id                 (update - admin only)
├── DELETE /:id               (delete - admin only)
└── /mega-menu
    ├── POST  /:categoryId/mega-menu       (add item)
    ├── PUT   /:itemId                     (update item)
    └── DELETE /:itemId                    (delete item)
```

---

## 📱 Responsive Breakpoints

```
Mobile              Tablet         Desktop         Large Desktop
0─────────640px ─── 768px ────── 1024px ───────── 1280px ─────→

[Mobile Only]       [Tablet+]     [Desktop+]
- Off-canvas        - Sticky      - Visible
  hamburger           sidebar       sidebar
- Full-width        - Full-width  - w-48
  carousel          carousel      carousel

Text Sizing:
- Mobile: text-3xl   → Tablet: text-5xl → Desktop: text-6xl

Carousel Height:
- Mobile: h-96 (384px)
- Tablet: md:h-[500px] (500px)
- Desktop: lg:h-[600px] (600px)

Grid Columns:
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3-4 columns
```

---

## 🎯 Component State Diagram

### HeroCarousel States

```
┌─────────────────┐
│ INITIAL STATE   │
├─────────────────┤
│ loading: true   │
│ banners: []     │
│ currentSlide: 0 │
│ isAutoPlay: true│
└────────┬────────┘
         │
         ▼
    ┌─────────────────┐
    │  LOADING STATE  │
    │ (Skeleton UI)   │
    └────────┬────────┘
             │
             ▼ (fetch complete)
    ┌─────────────────┐
    │  LOADED STATE   │
    ├─────────────────┤
    │ loading: false  │
    │ banners: [...]  │
    │ Shows carousel  │
    └────────┬────────┘
             │
      ┌──────┼──────┐
      │      │      │
   Auto    User   Click
   Play   Hover   Arrow
      │      │      │
      ▼      ▼      ▼
  Update  Pause   Update
  Slide   Timer  currentSlide
      │      │      │
      └──────┴──────┘
         │
         └──► PLAYING STATE (continues)
              (currentSlide updates every 5s)

Error Path:
fetch fails → setError() → Show error UI → Can retry
```

### CategorySidebar States

```
┌──────────────────┐
│ INITIAL STATE    │
├──────────────────┤
│ loading: true    │
│ categories: []   │
│ mobileOpen: false│
│ openMenu: null   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ LOADING STATE    │
│ (Skeleton UI)    │
└────────┬─────────┘
         │
         ▼ (fetch complete)
┌──────────────────────────┐
│ LOADED STATE             │
├──────────────────────────┤
│ loading: false           │
│ categories: [...]        │
│                          │
│ ┌─────────────────────┐  │
│ │ Desktop Path        │  │
│ │ sidebar visible     │  │
│ │ (hidden md:flex)    │  │
│ │                     │  │
│ │ openMenu triggers   │  │
│ │ mega-menu dropdown  │  │
│ └─────────────────────┘  │
│                          │
│ ┌─────────────────────┐  │
│ │ Mobile Path         │  │
│ │ hamburger visible   │  │
│ │ (md:hidden)         │  │
│ │                     │  │
│ │ Click hamburger     │  │
│ │ → mobileOpen: true  │  │
│ │ → Show off-canvas   │  │
│ │ → Lock scroll       │  │
│ └─────────────────────┘  │
└──────────────────────────┘
    │
    └─┬─────────────────────┐
      │                     │
   Hover (Desktop)     Click (Mobile)
      │                     │
      ▼                     ▼
 setOpenMenu()      setMobileOpen()
 Show Mega-Menu     Drawer animated
      │                     │
      └─┬─────────────────┬─┘
        │                 │
        │              User clicks item
        │              or presses Escape
        │                 │
        └─────────┬───────┘
                  │
            Reset State
            (close menu)
```

---

## ⏱️ Event Timeline - Auto-Advance Carousel

```
Time:     0s                5s                10s               15s
          │                 │                 │                 │
Slide 1:  ███████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
Slide 2:  ░░░░░░░░░░░░░░░░░███████████████████░░░░░░░░░░░░░░░░░
Slide 3:  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░███████████████████
          │                 │                 │                 │
          START             ADVANCE           ADVANCE           ADVANCE
          Timer             currentSlide++    currentSlide++     currentSlide++

If User Hovers (at 3s):
          │                 │                 │                 │
Timeline: START      PAUSE(3s)                          RESUME PAUSE RESUME
                            │                            │
                        Hover              mouseLeave    │
                      isAutoPlay = false    (after 8s)   Restart timer
                      (timer cleared)       isAutoPlay = true
```

---

## 📲 Mobile Swipe Gesture Detection

```
Touch Start (0ms)
│
├─ Record: touchStart X position
│
Touch Move (50ms, 100ms, 150ms, ...)
│
├─ Track: current X position
├─ Calculate: deltaX = currentX - startX
│
Touch End (500ms)
│
├─ Check: |deltaX| > 50px (delta threshold)
│
├─ If deltaX > 50 (swiped RIGHT)
│  └─ prevSlide() → currentSlide--
│
└─ If deltaX < -50 (swiped LEFT)
   └─ nextSlide() → currentSlide++

React-Swipeable Config:
{
  onSwipedLeft: nextSlide,      // Swipe → →
  onSwipedRight: prevSlide,     // Swipe ← ←
  trackMouse: false,             // Don't track mouse on desktop
  delta: 50                       // Minimum 50px swipe
}
```

---

## 🔐 Admin Authentication Flow

```
User visits /admin/banners
           │
           ▼
   ┌───────────────────┐
   │ Page Renders      │
   │ (Client-side)     │
   └───────┬───────────┘
           │
           ▼
   ┌───────────────────────────┐
   │ User fills banner form    │
   │ Clicks "Create Banner"    │
   └───────┬───────────────────┘
           │
           ▼
   ┌──────────────────────────────────────┐
   │ POST /api/banners                   │
   │ + Request Body (banner data)        │
   │ + Headers (Content-Type: JSON)      │
   └───────┬──────────────────────────────┘
           │
           ▼ (Backend)
   ┌──────────────────────────────────────┐
   │ adminAuth Middleware                │
   │ Checks: Bearer token / Session      │
   └───────┬──────────────────────────────┘
           │
       ┌───┴────┐
   Valid │        │ Invalid
       │        │
       ▼        ▼
    ┌──┐    ┌─────────────────────┐
    │✓ │    │ 401 Unauthorized    │
    └─┬┘    │ OR 403 Forbidden    │
      │     └─────────────────────┘
      ▼
   Validate Input
   prisma.banner.create()
      │
   ┌──┴──┐
   │Success
   │
   ▼
Return: { id, title, ... }
   │
   ▼ (Frontend)
fetchBanners() (refresh list)
   │
   ▼
UI Updates
"Banner created ✓"
```

---

This visual guide should help you understand:

- How components are structured
- How data flows through the system
- How interactions trigger state changes
- How responsive design works
- How API calls work
- How everything connects together

For more details, refer to the detailed documentation files! 📚
