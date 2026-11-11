# Global State Management - Context API

## 1. Authentication Context

Defined in [`cli/src/context/AuthContext.tsx`](./cli/src/context/AuthContext.tsx).

### Provider

`AuthProvider` manages:

- `user`
- `token`
- `loading`
- `login`
- `register`
- `logout`
- `updateUser`

Authentication data is persisted in `localStorage`.

### Consumer hook

`useAuth()` accesses the authentication context.

### Functions and components using `useAuth()`

| File | Function/component | Context values used |
|---|---|---|
| [`Navbar.tsx`](./cli/src/components/Navbar.tsx) | `Navbar` | `user`, `logout` |
| [`ProtectedRoute.tsx`](./cli/src/components/ProtectedRoute.tsx) | `ProtectedRoute` | `user`, `loading` |
| [`Login.tsx`](./cli/src/pages/Login.tsx) | `Login` | `login`, `register` |
| [`Addresses.tsx`](./cli/src/pages/Addresses.tsx) | `Addresses` | `updateUser` |
| [`AddressCard.tsx`](./cli/src/components/AddressCard.tsx) | `AddressCard` | `updateUser` |
| [`Checkout.tsx`](./cli/src/pages/Checkout.tsx) | `Checkout` | `user` |
| [`ProductPage.tsx`](./cli/src/pages/ProductPage.tsx) | `ProductPage` | `token` |
| [`ReviewsSection.tsx`](./cli/src/assets/ReviewsSection.tsx) | `ReviewsSection` | `user`, `token` |
| [`AdminLayout.tsx`](./cli/src/pages/admin/AdminLayout.tsx) | `AdminLayout` | `user` |

### Responsibilities

- Login and registration
- User session persistence
- Protected route checks
- Admin access checks
- Review request authorization
- User address updates
- Logout handling

## 2. Shopping Cart Context

Defined in [`cli/src/context/CartContext.tsx`](./cli/src/context/CartContext.tsx).

### Provider

`CartProvider` manages:

- Cart items
- Adding products
- Removing products
- Updating quantities
- Clearing the cart
- Cart count
- Cart total
- Cart sidebar visibility

Cart data is persisted in `localStorage` using the `app_cart` key.

### Consumer hook

`UseCart()` accesses the cart context.

### Functions and components using `UseCart()`

| File | Function/component | Context values used |
|---|---|---|
| [`Navbar.tsx`](./cli/src/components/Navbar.tsx) | `Navbar` | `cartCount`, `setIsCartOpen` |
| [`ProductCard.tsx`](./cli/src/components/ProductCard.tsx) | `ProductCard` | `addToCart` |
| [`CartSidebar.tsx`](./cli/src/components/CartSidebar.tsx) | `CartSidebar` | Items, totals, quantity operations, visibility |
| [`ProductPage.tsx`](./cli/src/pages/ProductPage.tsx) | `ProductPage` | Items, add, update, remove |
| [`Checkout.tsx`](./cli/src/pages/Checkout.tsx) | `Checkout` | Items, total, clear cart |
| [`MyOrders.tsx`](./cli/src/pages/MyOrders.tsx) | `MyOrders` | `clearCart` |

### Responsibilities

- Add products from product cards
- Manage product quantities
- Remove products
- Display the cart count in the navbar
- Display and control the cart sidebar
- Calculate cart subtotal and total
- Clear the cart after checkout or order processing

## 3. Provider Hierarchy

Configured in [`cli/src/main.tsx`](./cli/src/main.tsx):

```text
BrowserRouter
└── AuthProvider
    └── CartProvider
        └── App
```

All routes and components rendered inside `App` can access both contexts.