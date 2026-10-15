# TA Viva Questions & Answers — ShopKart Lab 02

### 1. Why do we use `withCredentials: true`?
**Answer:**
`withCredentials: true` tells Axios (or `fetch` with `credentials: 'include'`) to include HTTP cookies (specifically cross-site or HttpOnly session cookies) along with cross-origin XMLHttpRequests. Without this option, browsers block sending or setting cookies when frontend (`http://localhost:5173`) and backend (`http://localhost:5000`) operate across different origins.

---

### 2. Why can't JavaScript read an HttpOnly cookie?
**Answer:**
Cookies marked with the `HttpOnly` flag are strictly reserved for HTTP requests and cannot be accessed via client-side JavaScript APIs like `document.cookie`. This security mechanism prevents **Cross-Site Scripting (XSS)** attacks, ensuring malicious third-party scripts injected into the browser cannot steal sensitive user authentication tokens.

---

### 3. Why is `/home` called a protected route?
**Answer:**
`/home` is a protected route because access is restricted exclusively to authenticated users with valid session credentials. If an unauthenticated guest user attempts to visit `/home`, the application detects the missing/invalid session token (via `ProtectedRoute` component and `GET /customers/me` API) and automatically redirects them to `/login`.

---

### 4. Why do we fetch `/customers/me` instead of storing the user manually?
**Answer:**
Fetching `/customers/me` directly from the backend acts as the single source of truth for session validation. Storing user state solely in `localStorage` or `sessionStorage` can become stale, tampered with, or out of sync with backend token expiration/revocation. Querying `/customers/me` ensures the HttpOnly cookie is verified server-side on page reloads and state re-hydration.

---

### 5. What is the difference between authentication and authorization?
**Answer:**
* **Authentication (AuthN):** The process of verifying **who a user is** (e.g., verifying email & password during login to issue a session token).
* **Authorization (AuthZ):** The process of determining **what actions or resources a user is permitted to access** once authenticated (e.g., checking if a user has admin privileges to delete products or view other users' data).

---

# TA Viva Questions & Answers — ShopKart Lab 03 (Product Catalog & Discovery)

### 1. Why should product data come from MongoDB instead of being hardcoded in React?
**Answer:**
Hardcoding product data in React embeds static data into the client bundle, requiring a full application rebuild and redeployment whenever products, prices, or inventory change. Storing product data in MongoDB allows dynamic data management (adding/updating/deleting products via APIs), real-time inventory tracking (stock quantities), persistence across user sessions, and efficient server-side operations like indexing, searching, and pagination.

---

### 2. What is the difference between a URL parameter and a query parameter?
**Answer:**
- **URL Parameters (Route Parameters):** Embedded directly into the path structure (e.g., `/products/:id` -> `/products/66d123abc456`). They identify a specific resource uniquely and are essential for route matching.
- **Query Parameters:** Appended at the end of a URL after a `?` in key-value pairs (e.g., `/products?search=keyboard&category=Electronics`). They are optional and used for filtering, sorting, searching, or paginating a collection without altering the route.

---

### 3. When would you use `/products/:id` vs `/products?category=Electronics`?
**Answer:**
- Use `/products/:id` when requesting a **single specific resource** (the details page of one product identified by its unique MongoDB `_id`).
- Use `/products?category=Electronics` when requesting a **filtered subset of a collection** (all products matching the category "Electronics").

---

### 4. How does `.map()` help us render products dynamically?
**Answer:**
`.map()` iterates over an array of product objects returned from the backend and transforms each JavaScript object into a React JSX element (e.g., `<ProductCard key={product._id} product={product} />`). This eliminates hardcoded repetitive code and ensures the UI automatically scales to match however many products are in the database.

---

### 5. Why do we need loading and error states in a frontend application?
**Answer:**
Network requests are asynchronous and take non-zero time to complete or may fail:
- **Loading State:** Provides immediate visual feedback to the user (e.g., spinner or message) so they know an operation is in progress rather than thinking the app is frozen or broken.
- **Error State:** Informs the user gracefully when something goes wrong (e.g., network failure, 500 server error) instead of crashing the UI or showing a blank page.
- **Empty State:** Clarifies that a request succeeded but returned zero results (e.g., no matching products for a search term).

---

### 6. What happens when the backend returns an empty array?
**Answer:**
When the backend returns an empty array `[]` (e.g., `products: []`), the frontend empty-state check (`!loading && !error && products.length === 0`) evaluates to true and displays an empty state ("No products found. Try adjusting your search query or selecting a different category.") rather than leaving an empty void or failing.

---

### 7. Why should search/filtering be handled by the backend instead of filtering a huge dataset only in React?
**Answer:**
- **Performance & Bandwidth:** Transferring thousands of product records over the network to the browser wastes bandwidth, increases load times, and exhausts device memory.
- **Database Optimization:** MongoDB can utilize indexes (e.g., text indexes, compound indexes on category and price) to query millions of records in milliseconds.
- **Pagination & Scalability:** Server-side filtering allows fetching only the relevant subset/page of products, making the application scalable as inventory grows.

---

### 8. Why should API/service logic be separated from UI components?
**Answer:**
Separating API calls into a dedicated service layer (e.g., `src/services/api.js`):
- **Separation of Concerns:** UI components focus purely on user presentation and interaction, while API services handle network protocols, baseURLs, headers, and error parsing.
- **Reusability:** The same API functions can be reused across multiple components without duplicating fetch/axios code.
- **Maintainability:** If backend endpoints, base URLs, or authentication headers change, edits are restricted to the service file rather than touching multiple UI components.

---

# TA Viva Questions & Answers — ShopKart Lab 04 (MongoDB Relationships & Protected APIs)

### 1. Why are we storing ObjectIds instead of Product objects in the wishlist?
**Answer:**
Storing only the `ObjectId` reference keeps the `Product` collection as the single source of truth (SSOT). If product details such as price, image, name, or stock availability update in the database, the wishlist does not contain stale or redundant data. Duplicating embedded product objects into every user's document leads to data inconsistencies, update anomalies, and inflated document sizes.

---

### 2. What does `ref: "Product"` do in Mongoose?
**Answer:**
The `ref` option informs Mongoose which model to associate with the stored `ObjectId`. When Mongoose executes `.populate("wishlist")`, it looks at `ref: "Product"` to query the `products` collection automatically and replace each `ObjectId` with the corresponding matched `Product` document.

---

### 3. What is the difference between embedding and referencing in MongoDB?
**Answer:**
- **Referencing (Normalized Data):** Documents store only the `_id` of documents in another collection (like a Foreign Key in SQL). Ideal for many-to-many or unbounded one-to-many relationships where referenced entities are updated independently (e.g., users wishlisting products).
- **Embedding (Denormalized Data):** Documents store complete sub-documents nested inside themselves. Ideal for tightly-coupled, bounded 1-to-few data that is always read together and rarely edited separately (e.g., shipping addresses on a finalized order).

---

### 4. Why do we use `populate()`?
**Answer:**
Because MongoDB is a non-relational document database, it does not support SQL JOINs directly in the same manner. `populate()` is a Mongoose abstraction that performs an auxiliary query (similar to a `$lookup` aggregation pipeline stage) behind the scenes, resolving `ObjectId` references into full documents before returning the response to the client.

---

### 5. Why should wishlist endpoints be protected?
**Answer:**
A user's wishlist contains private, user-specific data and actions. Without protection (`protect` middleware checking JWT auth), any unauthenticated stranger could view, add, or delete items from accounts, violating data privacy and security.

---

### 6. Why should the server get the user ID from the JWT?
**Answer:**
The JWT is cryptographically signed by the backend using a secret key (`process.env.JWT_SECRET`). Once verified, the server has tamper-proof proof of who the user is. Retrieving the user ID from `decoded.id` guarantees authentic identity without relying on unverified client data.

---

### 7. Why should we not accept `userId` from the client (body or query)?
**Answer:**
Accepting `userId` from client requests introduces an **Insecure Direct Object Reference (IDOR)** vulnerability. A malicious attacker could tamper with the payload to send another user's `userId`, enabling them to read, corrupt, or modify another customer's wishlist without authorization.

---

### 8. How are duplicate wishlist entries prevented?
**Answer:**
On the backend in `addToWishlist`:
1. The server inspects `req.user.wishlist`.
2. It tests if the product `ObjectId` already exists using `.some(id => id.toString() === productId)`.
3. If it exists, the server aborts the insert and returns `HTTP 409 Conflict`.
4. On the frontend, buttons are disabled while saving (`loading` state) to prevent duplicate rapid clicks.

---

### 9. What HTTP status should be returned for a duplicate wishlist request?
**Answer:**
**HTTP 409 Conflict** — This standard HTTP status code signifies that the request could not be completed due to a conflict with the current state of the resource (i.e., the product is already in the user's wishlist).

---

### 10. Why should the Wishlist page fetch from the backend instead of using local state?
**Answer:**
A wishlist is a persistent customer feature. If saved only in local React state or `localStorage`, the data would not synchronize across different devices, would be lost if the user switches browsers or clears cache, and could not be used by backend marketing, inventory alerts, or analytics systems.

---

### 11. Why do we need loading, error, and empty states?
**Answer:**
- **Loading State:** Provides immediate visual feedback to the user while network requests resolve, preventing premature user interactions or confusion.
- **Empty State:** Guides the user when their list is legitimately empty (with a helpful Call to Action such as "Browse Products") rather than displaying a broken or blank screen.
- **Error State:** Clearly communicates network or server failures to the user and provides actionable recovery (such as a "Try Again" retry button) rather than crashing the application.

---

### 12. Why should the wishlist survive a page refresh?
**Answer:**
---

# TA Viva Questions & Answers — ShopKart Lab 05 (Shopping Cart & Global State Management)

### State Management

#### 1. Why does cart state need to be shared globally?
**Answer:**
Cart information is needed across multiple disparate components in the application hierarchy at the same time:
- The **Navbar** needs the total quantity for the badge (`Cart (3)`).
- The **Product Card** and **Product Details** need to know if an item is already in the cart and its current quantity.
- The **Cart Page** displays all cart items, controls quantity, and calculates subtotals.
- The **Order Summary** needs the live subtotal.
If cart state were kept in local component state, passing data via props would cause severe prop drilling or state fragmentation. A global state manager (like React Context API) acts as the single source of truth across the whole UI.

---

#### 2. Why should the Navbar not independently fetch the cart?
**Answer:**
If the Navbar independently fetched the cart:
- Every time a product is added or removed on the Product Card or Cart Page, the Navbar wouldn't know about it without polling, window events, or an explicit trigger.
- Multiple duplicate network requests (`GET /cart`) would fire concurrently when pages load, wasting bandwidth and server resources.
- State could easily become desynchronized (e.g., Navbar showing `Cart (2)` while Cart Page displays 3 items).

---

#### 3. What is the difference between server state and frontend state?
**Answer:**
- **Server State:** Stored remotely in MongoDB, owned and validated by the backend. It is asynchronous, shared across sessions/devices, and can change outside of client control (e.g., product prices, inventory stock).
- **Frontend State:** Stored in browser memory (React Context, component state). It represents the immediate user session and UI status (e.g., open dropdowns, per-item mutation loaders, cached cart entries). Frontend mutations optimistically or reactively update following successful server mutations.

---

#### 4. What is derived state?
**Answer:**
Derived state consists of values that can be computed synchronously from existing state at render time without storing them as independent state variables.
Examples in ShopKart:
- `totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)`
- `subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)`
Storing derived values in database schemas or React state introduces synchronization bugs where the total and individual items get out of sync.

---

#### 5. Why should subtotal not be stored separately?
**Answer:**
- Storing subtotal separately creates redundancy and risk of stale data. If a product's price changes or items are edited, the stored subtotal becomes incorrect unless updated in multiple places.
- Deriving subtotal on-the-fly (`Σ price × quantity`) guarantees 100% mathematical consistency with the current items and their current prices.

---

### Backend

#### 6. Why does cart need quantity while wishlist does not?
**Answer:**
- A **wishlist** is an aspirational bookmark ("I want to save this product for later"); having duplicates or quantities is meaningless.
- A **cart** is a transactional purchase intent ("I want to buy 3 units of this item right now"); inventory allocation, price calculation, and fulfillment strictly depend on the exact count of each item.

---

#### 7. Why should product price not be copied into the cart object?
**Answer:**
In an active cart, copying product price into the user document leads to price staleness:
- If a merchant updates a product's price from ₹2,999 to ₹2,499, a customer with the item in their cart should see the current live price upon checkout.
- By referencing the `Product` model via `ObjectId` and using `.populate()`, the cart always reflects the current product catalog price. (Only when converted into a finalized Order in Lab 06 is an immutable price snapshot taken).

---

#### 8. How do you prevent quantity from exceeding stock?
**Answer:**
Both backend and frontend enforce stock constraints:
- **Backend (authoritative):** In `POST /cart/:productId` and `PATCH /cart/:productId`, the server retrieves the current `Product.findById(productId)` and checks if `newQuantity > product.stock`. If so, the server rejects the request with `HTTP 400 Bad Request` and an explanatory message.
- **Frontend (UX):** The quantity increment button `[+]` is disabled when `item.quantity >= product.stock`, and the Product Card disables "Add to Cart" when `quantity >= product.stock` or when `stock === 0`.

---

#### 9. What happens when the same product is added twice?
**Answer:**
Instead of creating duplicate rows in the cart array (which would confuse order processing), the backend checks if an entry with that `productId` already exists in `req.user.cart`:
- If found, it increments `quantity` by 1 (validating `quantity + 1 <= stock`).
- If not found, it pushes a new cart item `{ product: productId, quantity: 1 }`.

---

#### 10. Why does the server identify the user from JWT?
**Answer:**
Identifying the user via the cryptographically signed JWT token (attached via HttpOnly cookie or Bearer Authorization header) ensures that:
- The user's identity is verified by the backend without trusting client-supplied user IDs.
- Prevents Insecure Direct Object Reference (IDOR) attacks, ensuring customers cannot view, mutate, or tamper with another customer's shopping cart.

---

### React & Frontend

#### 11. How does the cart count update without refreshing the page?
**Answer:**
Because all cart actions (`addToCart`, `updateQuantity`, `removeFromCart`) update the central `cartItems` state inside `CartContext`:
- When `cartItems` state changes, React's reactive rendering engine re-renders all components subscribed to `CartContext`.
- Both the `Navbar` (subscribed via `useCart()`) and the `Cart` page immediately reflect the new `totalCount` and items without any page refresh.

---

#### 12. How do you update only one cart item's loading state?
**Answer:**
By tracking an `itemLoading` object/map keyed by `productId` in state: `itemLoading: { [productId]: boolean }`.
- When an operation begins on product `A`, `itemLoading[productId]` is set to `true`.
- In `CartItem.jsx` or `ProductCard.jsx`, the button checks `itemLoading[product._id]` to render a spinner specifically for that item, leaving all other item steppers interactive.

---

#### 13. What happens if an API mutation fails?
**Answer:**
If an API mutation fails (e.g., network error or stock limit exceeded):
- The catch block captures the error response (`err.response.data.message`).
- Global cart state is not corrupted.
- An inline error message/alert is displayed to the user for feedback.
- If the error is a `401 Unauthorized`, the user is prompted and redirected to `/login`.

---

#### 14. Why is one shared cart state better than separate local copies?
**Answer:**
Multiple independent local copies inevitably drift apart (e.g., product page says 1 in cart, navbar badge says 0, cart page says 2). One shared state guarantees strict consistency: any action anywhere in the application updates the single source of truth, keeping all views synchronized in real time.



