# 🚀 Quick Start Guide - Hero Carousel & Category Sidebar

Get the new components up and running in 5 minutes.

## Step 1: Install Dependencies

```bash
# From the frontend directory
cd frontend
npm install react-swipeable
```

## Step 2: Apply Database Migration

```bash
# From the backend directory
cd backend
npx prisma migrate deploy
```

## Step 3: Seed Sample Data (Optional but Recommended)

```bash
# From the backend directory (still in backend/)
node scripts/seed-banners.js
```

This creates:

- 4 sample hero banners
- 9 product categories
- Mega-menu items for selected categories

## Step 4: Restart Servers

**Terminal 1 (Backend):**

```bash
cd backend
npm run dev
# or if you have a run script
npm start
```

**Terminal 2 (Frontend):**

```bash
cd frontend
npm run dev
```

## Step 5: View the Components

Open http://localhost:3000 in your browser.

You should see:

1. **Left Sidebar** - Sticky category navigation with hover-based mega-menus
2. **Hero Carousel** - Banner carousel with auto-slide, navigation arrows, and pagination dots

---

## 🎯 Quick Tips

### Add a New Banner

1. Go to `/admin/banners`
2. Fill in the form:
   - Title: Main headline
   - Subtitle: Secondary text
   - Image URL: Direct link to image
   - Link: Where clicking CTA button goes (e.g., `/categories/sneakers`)
   - CTA Text: Button text (default: "Shop Now")
3. Click "Create Banner"
4. New banner should appear in carousel after page refresh

### Add a New Category

1. Go to `/admin/categories`
2. Fill in the form:
   - Name: Category title (e.g., "Men")
   - Click "Generate" to auto-create slug
   - Icon: Emoji (e.g., 👔)
   - Check "Featured" if you want it to show first
3. Click "Create Category"

### Add Mega-Menu Items to Category

1. Go to `/admin/categories`
2. Scroll down to "Add Mega Menu Item"
3. Select the category
4. Enter menu item details:
   - Title: Link text
   - Link: Where it navigates to
   - Icon: Optional emoji
5. Click "Add Menu Item"
6. Hover over category on sidebar to see the new item

---

## 🔍 Verify Everything Works

### Sidebar

- [ ] Desktop: Sticky left sidebar visible
- [ ] Mobile (< 640px): Hamburger menu in top-left
- [ ] Hover sidebar items: See mega-menu dropdown
- [ ] Mobile: Click category shows nested items

### Carousel

- [ ] Images display with proper aspect ratio
- [ ] Auto-advances every 5 seconds
- [ ] Pause on hover (arrow auto-play stops)
- [ ] Previous/Next arrows work
- [ ] Pagination dots change on slide
- [ ] Mobile swipe gestures work

---

## 🛠️ Troubleshooting

### Carousel shows "No banners available"

- Check if seed script ran: `node scripts/seed-banners.js`
- Verify API: Open browser DevTools → Network → check `/api/banners` response

### Sidebar empty

- Run seed script
- Verify categories exist: `GET http://localhost:4000/api/categories`

### Swipe not working on mobile

- Ensure `react-swipeable` is installed
- Try in actual mobile browser (not DevTools mobile mode sometimes works differently)

### Styles look off

- Verify Tailwind CSS is compiled
- Clear browser cache
- Rebuild: `npm run dev` in frontend

---

## 📚 Next Steps

1. **Customize Colors**: Edit Tailwind classes in components
   - Change `orange-500` to your brand color
   - Modify overlay gradient opacity

2. **Add More Banners**: Use `/admin/banners` page

3. **Reorganize Categories**: Use `order` field to reorder display

4. **Update Links**: Make sure all banner and mega-menu links point to real pages

5. **Add Analytics**: Track clicks and impressions (future enhancement)

---

## 📖 Full Documentation

See `HERO_CAROUSEL_IMPLEMENTATION.md` for:

- Detailed API documentation
- Database schema
- Component customization
- Responsive behavior
- Accessibility features
- Performance optimizations

---

## 🎨 Key Features At a Glance

| Feature               | Status | Mobile      | Desktop |
| --------------------- | ------ | ----------- | ------- |
| Auto-advance carousel | ✅     | ✅          | ✅      |
| Pause on hover        | ✅     | N/A         | ✅      |
| Swipe navigation      | ✅     | ✅          | ✅      |
| Pagination dots       | ✅     | ✅          | ✅      |
| Arrow navigation      | ✅     | Hidden      | ✅      |
| Sticky sidebar        | ✅     | N/A         | ✅      |
| Off-canvas menu       | ✅     | ✅          | N/A     |
| Mega-menu dropdowns   | ✅     | Nested list | Hover   |
| Keyboard navigation   | ✅     | ✅          | ✅      |
| Accessibility (ARIA)  | ✅     | ✅          | ✅      |
| Skeleton loading      | ✅     | ✅          | ✅      |
| API-driven            | ✅     | ✅          | ✅      |

---

Enjoy! Click forward and backward through your banners. 🎉
