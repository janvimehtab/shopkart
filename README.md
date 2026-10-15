# 🛍️ ShopKart — Wishlist Feature Documentation (Lab 04)

Comprehensive guide and technical reference for the production-grade Wishlist system implemented in **ShopKart**.

---

## 📑 Table of Contents
1. [Feature Overview](#-feature-overview)
2. [Technologies & Packages Used](#-technologies--packages-used)
3. [File Structure & Directory Guide](#-file-structure--directory-guide)
4. [Database Architecture & Schema Design](#-database-architecture--schema-design)
5. [Backend Functions & Endpoints](#-backend-functions--endpoints)
   - [Add Product to Wishlist (`addToWishlist`)](#1-add-product-to-wishlist)
   - [Remove Product from Wishlist (`removeFromWishlist`)](#2-remove-product-from-wishlist)
   - [Get User Wishlist with Population (`getWishlist`)](#3-get-user-wishlist-with-populate)
   - [Toggle Wishlist (`toggleWishlist`)](#4-toggle-wishlist-bonus)
6. [Frontend Components & Functions](#-frontend-components--functions)
   - [API Client Layer (`api.js`)](#1-api-client-layer-srcservicesapijs)
   - [Product Card (`ProductCard.jsx`)](#2-product-card-srccomponentsproductcardjsx)
   - [Wishlist Page (`Wishlist.jsx`)](#3-wishlist-page-srcpageswishlistjsx)
   - [Wishlist Card (`WishlistCard.jsx`)](#4-wishlist-card-srccomponentswishlistcardjsx)
   - [Navbar Integration (`Navbar.jsx`)](#5-navbar-srccomponentsnavbarjsx)
7. [Step-by-Step Execution Flows](#-step-by-step-execution-flows)
   - [How Adding to Wishlist Works](#flow-a--adding-a-product-to-wishlist)
   - [How Removing from Wishlist Works](#flow-b--removing-a-product-from-wishlist)
8. [Edge Cases & Error Handling](#-edge-cases--error-handling)
9. [Automated Verification & Test Suite](#-automated-verification--test-suite)

---

## 🎯 Feature Overview

The Wishlist feature allows authenticated ShopKart users to save products they are interested in, view them on a dedicated `/wishlist` page with real-time stock and prices, and remove items when no longer needed.

### Key Highlights:
- **Zero Redundancy**: Stored as MongoDB `ObjectId` references, not embedded objects.
- **Protected APIs**: Authenticated using JSON Web Tokens (JWT) stored in HTTP-only cookies / Bearer headers.
- **Duplicate Prevention**: Backend rejection with `409 Conflict` + UI button disabling while saving.
- **Populated Queries**: Mongoose `.populate()` pulls live product data on demand.
- **Responsive States**: Handles `Default`, `Loading` (`⏳ Saving...`), `Success` (`♥ Added to Wishlist`), `Empty`, and `Error` states.
- **Bonus Extras**: Atomic toggle endpoint (`PATCH /wishlist/:id/toggle`) & live Navbar count badge (`Wishlist (N)`).

---

## 🛠️ Technologies & Packages Used

| Technology / Package | Purpose |
| :--- | :--- |
| **Node.js & Express 5** | REST API server framework and routing |
| **MongoDB & Mongoose 9** | Database and Object Data Modeling (ODM) with Schema references and `.populate()` |
| **jsonwebtoken (JWT)** | Stateless authentication and identity extraction |
| **cookie-parser** | Parsing signed session cookies from request headers |
| **React 18 + Vite 6** | Modern client-side UI rendering with fast HMR |
| **React Router v7** | Client-side routing (`/products`, `/products/:id`, `/wishlist`, `/login`) |
| **Axios** | HTTP requests with `withCredentials: true` |
| **lucide-react** | Clean SVG iconography (`Heart`, `Trash2`, `Loader2`, `AlertCircle`, etc.) |

---

## 📁 File Structure & Directory Guide

```
ShopKart/
├── models/
│   ├── customer.model.js       # Customer schema containing the wishlist ObjectId references array
│   ├── user.model.js           # Re-exports customer.model.js for naming convention consistency
│   └── product.model.js        # Product schema (source of truth for price, image, stock, etc.)
│
├── middlewares/
│   └── auth.middleware.js      # Verifies JWT token and attaches user document to req.user
│
├── controllers/
│   └── wishlist.controller.js  # Core logic: addToWishlist, removeFromWishlist, getWishlist, toggleWishlist
│
├── routes/
│   └── wishlist.routes.js      # Express router mapping HTTP routes to controller methods under /wishlist
│
├── src/
│   ├── services/
│   │   └── api.js              # Centralized Axios client for calling backend wishlist endpoints
│   ├── components/
│   │   ├── Navbar.jsx          # Top navigation bar displaying real-time wishlist count badge
│   │   ├── ProductCard.jsx     # Discovery card with wishlist button and interactive states
│   │   ├── WishlistCard.jsx    # Wishlist card with 'View Details' and 'Remove from Wishlist' actions
│   │   └── ProtectedRoute.jsx  # Guards /wishlist route, redirecting unauthenticated users to /login
│   ├── pages/
│   │   ├── Wishlist.jsx        # Dedicated wishlist page with Loading, Empty, and Error states
│   │   └── Products.jsx        # Product catalog page showing which products are already wishlisted
│   ├── App.jsx                 # Application routes setup & global wishlist count synchronization
│   └── index.css               # Styling for cards, buttons, badges, spinners, and responsive layouts
│
├── test_wishlist_suite.js      # 13 automated test scenarios verifying backend APIs and edge cases
└── index.js                    # Express app entry point mounting routes and starting the server
```

---

## 🗄️ Database Architecture & Schema Design

### 1. Customer Model (`models/customer.model.js`)
The `wishlist` field is defined on the customer schema as an array of ObjectIds referencing the `Product` model:

```javascript
// models/customer.model.js
wishlist: {
  type: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  default: [],
}
```

### Why Reference (`ObjectId`) instead of Embedding Full Product Data?
- **Single Source of Truth (SSOT)**: If a product's price, stock, description, or image changes in the `Product` collection, the wishlist automatically reflects the newest data upon population.
- **Prevents Stale Data & Anomalies**: Duplicating product objects into thousands of user profiles creates massive maintenance overhead and risks showing incorrect prices.
- **Storage Efficiency**: An `ObjectId` requires only 12 bytes of storage compared to hundreds of bytes for a full duplicated product object.

---

## ⚙️ Backend Functions & Endpoints

All controller logic is located in `controllers/wishlist.controller.js` and wired up in `routes/wishlist.routes.js`.

### Authentication Gatekeeper (`middlewares/auth.middleware.js`)
Every `/wishlist` route passes through `protect`:
1. Reads token from cookie (`req.cookies.token`) or header (`Authorization: Bearer <token>`).
2. Verifies token using `jwt.verify(token, process.env.JWT_SECRET)`.
3. Loads customer from database: `req.user = await Customer.findById(decoded.id)`.
4. If missing/invalid, immediately returns `401 Unauthorized`.

---

### 1. Add Product to Wishlist
- **Function**: `addToWishlist(req, res)` in `controllers/wishlist.controller.js`
- **Route**: `POST /wishlist/:productId`
- **Authorization**: Required (`req.user`)

#### How it works:
```javascript
const addToWishlist = async (req, res) => {
  const { productId } = req.params;

  // Step 1: Validate MongoDB ObjectId format
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ success: false, message: "Invalid product ID" });
  }

  // Step 2: Verify product exists in database
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  // Step 3: Prevent duplicate entries
  const isAlreadyWishlisted = req.user.wishlist && req.user.wishlist.some(
    (id) => (id?._id || id).toString() === productId
  );

  if (isAlreadyWishlisted) {
    return res.status(409).json({ success: false, message: "Product already in wishlist" });
  }

  // Step 4: Add reference and persist
  if (!req.user.wishlist) req.user.wishlist = [];
  req.user.wishlist.push(productId);
  await req.user.save();

  return res.status(200).json({ success: true, message: "Product added to wishlist" });
};
```

---

### 2. Remove Product from Wishlist
- **Function**: `removeFromWishlist(req, res)` in `controllers/wishlist.controller.js`
- **Route**: `DELETE /wishlist/:productId`
- **Authorization**: Required (`req.user`)

#### How it works:
```javascript
const removeFromWishlist = async (req, res) => {
  const { productId } = req.params;

  // Step 1: Validate ID
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ success: false, message: "Invalid product ID" });
  }

  // Step 2: Check if product is in user's wishlist
  const isPresent = req.user.wishlist && req.user.wishlist.some(
    (id) => (id?._id || id).toString() === productId
  );

  if (!isPresent) {
    return res.status(404).json({ success: false, message: "Product not in wishlist" });
  }

  // Step 3: Filter out the product reference and persist
  req.user.wishlist = req.user.wishlist.filter(
    (id) => (id?._id || id).toString() !== productId
  );
  await req.user.save();

  return res.status(200).json({ success: true, message: "Product removed from wishlist" });
};
```

---

### 3. Get User Wishlist with `.populate()`
- **Function**: `getWishlist(req, res)` in `controllers/wishlist.controller.js`
- **Route**: `GET /wishlist`
- **Authorization**: Required (`req.user`)

#### How it works:
```javascript
const getWishlist = async (req, res) => {
  // Query authenticated user and populate the wishlist array
  const customer = await Customer.findById(req.user._id).populate({
    path: "wishlist",
    select: "_id name price category image stock description",
  });

  if (!customer) {
    return res.status(404).json({ success: false, message: "Customer not found" });
  }

  // Filter null entries in case a referenced product was deleted from DB
  const wishlist = (customer.wishlist || []).filter((item) => item !== null);

  return res.status(200).json({
    success: true,
    count: wishlist.length,
    wishlist,
  });
};
```

---

### 4. Toggle Wishlist (Bonus)
- **Function**: `toggleWishlist(req, res)` in `controllers/wishlist.controller.js`
- **Route**: `PATCH /wishlist/:productId/toggle`
- **Purpose**: Atomically adds product if absent or removes it if present.

---

## 🖥️ Frontend Components & Functions

### 1. API Client Layer (`src/services/api.js`)
Encapsulates backend HTTP calls using a configured Axios instance with `withCredentials: true`:
- `getWishlist()`: Sends `GET /wishlist`
- `addToWishlist(productId)`: Sends `POST /wishlist/:productId`
- `removeFromWishlist(productId)`: Sends `DELETE /wishlist/:productId`
- `toggleWishlist(productId)`: Sends `PATCH /wishlist/:productId/toggle`

---

### 2. Product Card (`src/components/ProductCard.jsx`)
Displays a product with its wishlist action button and quick-action floating heart.

- **Function**: `handleWishlistClick(e)`
  - Prevents rapid spamming via `loading` state (`if (loading) return`).
  - Calls `addToWishlist(productId)` or `removeFromWishlist(productId)`.
  - Notifies parent component via `onWishlistChange` callback to keep Navbar counter and page state synchronized.
- **States Rendered**:
  - Default: `♡ Add to Wishlist`
  - While request is in progress: `⏳ Saving...` (spinner with button disabled)
  - After success: `♥ Added to Wishlist` (highlighted rose theme)
  - On error: Displays non-intrusive alert text (e.g., prompt to login if 401).

---

### 3. Wishlist Page (`src/pages/Wishlist.jsx`)
Dedicated route at `/wishlist`.

- **Function**: `fetchWishlist()`
  - Executes on page load (`useEffect`).
  - Sets `loading = true` while fetching `GET /wishlist`.
  - Sets `wishlist` array and notifies Navbar count.
  - Catches network or server errors, switching to the error state.
- **Function**: `handleRemove(productId)`
  - Calls `removeFromWishlist(productId)`.
  - Optimistically updates local state: `setWishlist(prev => prev.filter(p => p._id !== productId))`.
  - Synchronizes updated count to Navbar.
- **Lifecycle States Handled**:
  1. **Loading State**: Loader ring with `"Loading your wishlist..."`.
  2. **Empty State**: Rendered when `wishlist.length === 0`:
     - Glowing pulsing heart icon
     - Text: *"Your wishlist is empty — Save products you love and find them here later."*
     - Button: `[ Browse Products ]` navigating to `/products`.
  3. **Error State**: Rendered when API call fails:
     - Warning icon with *"Something went wrong. We couldn't load your wishlist."*
     - Button: `[ Try Again ]` re-triggering `fetchWishlist()`.
  4. **Populated State**: Renders grid of `WishlistCard` items.

---

### 4. Wishlist Card (`src/components/WishlistCard.jsx`)
Renders an individual saved product card:
- Displays image, category badge, product title, Indian Rupee price (`₹`), and stock indicator.
- **Actions**:
  - `[ View Details ]`: Navigates to `/products/:id`.
  - `[ Remove from Wishlist ]`: Triggers `handleRemove()` with loading spinner (`Removing...`).

---

### 5. Navbar (`src/components/Navbar.jsx`)
- Integrates the `Wishlist` link with real-time count badge: `Wishlist (N)`.
- Updates dynamically whenever an item is added or removed across the application.

---

## 🔄 Step-by-Step Execution Flows

### Flow A — Adding a Product to Wishlist
```
User clicks "Add to Wishlist" on ProductCard
   │
   ├── UI sets loading=true, displays "⏳ Saving...", disables button
   │
   ▼
Frontend calls: POST /wishlist/66d123... (with JWT Cookie/Bearer)
   │
   ▼
Backend auth.middleware verifies JWT → sets req.user
   │
   ▼
wishlist.controller: addToWishlist()
   ├── Validates ObjectId syntax (400 if invalid)
   ├── Checks Product collection (404 if not found)
   ├── Checks req.user.wishlist.some(...) (409 if already present)
   ├── Pushes productId to req.user.wishlist
   └── Executes req.user.save() in MongoDB
   │
   ▼
Backend returns: { success: true, message: "Product added to wishlist" }
   │
   ▼
Frontend receives 200/201:
   ├── Sets isWishlisted = true
   ├── Changes button to "♥ Added to Wishlist"
   ├── Updates Navbar count: Wishlist (N + 1)
   └── Sets loading = false
```

---

### Flow B — Removing a Product from Wishlist
```
User clicks "Remove from Wishlist" on WishlistCard
   │
   ├── UI sets removing=true, displays spinner "Removing..."
   │
   ▼
Frontend calls: DELETE /wishlist/66d123... (with JWT Cookie/Bearer)
   │
   ▼
Backend auth.middleware verifies JWT → sets req.user
   │
   ▼
wishlist.controller: removeFromWishlist()
   ├── Validates ObjectId syntax (400 if invalid)
   ├── Checks if productId exists in req.user.wishlist (404 if not present)
   ├── Filters array: req.user.wishlist = req.user.wishlist.filter(...)
   └── Executes req.user.save() in MongoDB
   │
   ▼
Backend returns: { success: true, message: "Product removed from wishlist" }
   │
   ▼
Frontend receives 200:
   ├── Filters out product from Wishlist state: setWishlist(prev => ...)
   ├── Updates Navbar count: Wishlist (N - 1)
   └── If count reaches 0, UI automatically transitions to Empty State
```

---

## 🚨 Edge Cases & Error Handling

| Scenario | HTTP Status | Backend Action | Frontend UX Reaction |
| :--- | :---: | :--- | :--- |
| **Guest user clicks Wishlist** | `401` | Auth middleware halts request | Displays login reminder toast, redirects to `/login` |
| **Malformed Product ID** | `400` | Rejects with `"Invalid product ID"` | Displays error message without crashing |
| **Non-existent Product ID** | `404` | Rejects with `"Product not found"` | Displays warning banner |
| **Product already in Wishlist** | `409` | Duplicate check prevents duplicate insert | Button remains marked as saved, informs user |
| **Product already deleted** | `404` | Removal check fails gracefully | Shows error message |
| **Deleted product referenced** | `200` | `.populate()` returns `null`, filtered out | UI only displays available products |
| **Network failure on Wishlist** | — | Caught in `try...catch` block | Displays Error State with `"Try Again"` retry button |
| **Empty Wishlist (0 items)** | `200` | Returns `{ success: true, count: 0, wishlist: [] }` | Displays Empty State with `"Browse Products"` CTA |

---

## 🧪 Automated Verification & Test Suite

The test suite in `test_wishlist_suite.js` covers 13 end-to-end integration test cases against MongoDB Atlas.

### Running the Test Suite:
```bash
npm test
```

### Verified Test Cases:
1. `GET /wishlist` without token $\rightarrow$ `401 Unauthorized`
2. `POST /wishlist/:id` without token $\rightarrow$ `401 Unauthorized`
3. Dynamic user registration and JWT login
4. `POST /wishlist/notanid` $\rightarrow$ `400 Bad Request`
5. `POST /wishlist/:nonExistentId` $\rightarrow$ `404 Not Found`
6. `POST /wishlist/:validId` $\rightarrow$ `200 Success`
7. Duplicate `POST /wishlist/:validId` $\rightarrow$ `409 Conflict`
8. `GET /wishlist` $\rightarrow$ `200 Success` with populated `name`, `price`, `stock`, `category`
9. `PATCH /wishlist/:id/toggle` (off) $\rightarrow$ `isWishlisted: false`
10. `PATCH /wishlist/:id/toggle` (on) $\rightarrow$ `isWishlisted: true`
11. `DELETE /wishlist/:id` $\rightarrow$ `200 Success`
12. Duplicate `DELETE /wishlist/:id` $\rightarrow$ `404 Not Found`
13. Final `GET /wishlist` $\rightarrow$ `count: 0` (Empty array)

---

# 🛒 ShopKart — Shopping Cart System (Lab 05)

Full-stack, persistent Shopping Cart system with MongoDB backend persistence and centralized React Context API global state management.

## 🎯 Architecture & Data Flow

```
Product Card / Product Details / Cart Page
                  ↓
       CartContext (Global State)
                  ↓
         api.js (Axios Layer)
                  ↓
   Express REST API (/cart Router)
                  ↓
        Auth JWT Middleware
                  ↓
   Cart Controller (Stock Validation)
                  ↓
        MongoDB (User.cart)
                  ↓
Reactive UI Update: Navbar (Count) + Cart Page (Subtotal)
```

## 🔌 API Specification

| Method | Endpoint | Auth | Purpose | Response |
| :--- | :--- | :---: | :--- | :--- |
| `POST` | `/cart/:productId` | ✅ | Add item or increment quantity if exists | `{ success: true, message: "Cart updated", cart: [...] }` |
| `GET` | `/cart` | ✅ | Fetch current user's populated cart | `{ success: true, cart: [...] }` |
| `PATCH` | `/cart/:productId` | ✅ | Update exact item quantity | `{ success: true, message: "Cart updated", cart: [...] }` |
| `DELETE` | `/cart/:productId` | ✅ | Remove item from user's cart | `{ success: true, message: "Product removed from cart", cart: [...] }` |

## 🧮 Derived Values

- **Total Count**: $\sum \text{quantity}$ (displayed in Navbar badge `Cart (3)`)
- **Subtotal**: $\sum (\text{product.price} \times \text{quantity})$
- Neither is stored redundantly in MongoDB, guaranteeing zero price/quantity staleness.

## 🧪 Automated Test Verification

Run all cart integration tests:
```bash
npm run test:cart
```

Verifies all 14 test cases including authentication, quantity updates, stock enforcement, item deletions, and duplicate handling.
