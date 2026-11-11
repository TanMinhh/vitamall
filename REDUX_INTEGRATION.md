# Redux Integration

## 1. Overview

Originally used React Context API for two shared state domains:

- Authentication state
- Shopping cart state

The frontend now uses Redux Toolkit with typed React Redux hooks. Component-specific state, such as form fields, checkout steps, menus, and review inputs, remains local to the component.

The migration affects the frontend only.

## 2. Previous Architecture

The previous provider hierarchy was:

```text
BrowserRouter
└── AuthProvider
    └── CartProvider
        └── App
```

The previous implementation was located in:

- `cli/src/context/AuthContext.tsx`
- `cli/src/context/CartContext.tsx`

Authentication consumers used `useAuth()`. Cart consumers used `UseCart()`.

## 3. Current Redux Architecture

The current hierarchy is:

```text
BrowserRouter
└── Redux Provider
    └── App
```

Redux files:

| File | Responsibility |
|---|---|
| [`cli/src/store/store.ts`](./cli/src/store/store.ts) | Configures the Redux store and persistence subscription |
| [`cli/src/store/authSlice.ts`](./cli/src/store/authSlice.ts) | Authentication state, login, registration, logout, and user updates |
| [`cli/src/store/cartSlice.ts`](./cli/src/store/cartSlice.ts) | Cart items, cart actions, visibility, and derived selectors |
| [`cli/src/store/hooks.ts`](./cli/src/store/hooks.ts) | Typed `useAppDispatch` and `useAppSelector` hooks |
| [`cli/src/main.tsx`](./cli/src/main.tsx) | Provides the Redux store to the application |

Redux dependencies are declared in [`cli/package.json`](./cli/package.json):

- `@reduxjs/toolkit`
- `react-redux`

## 4. Migration Steps

### Step 1: Install dependencies

Run the command from the frontend directory:

```powershell
cd F:\VitaMall\cli
npm install @reduxjs/toolkit react-redux
```

### Step 2: Create the store

Configure the store with two reducers:

```text
auth
cart
```

The store exports `RootState` and `AppDispatch` types.

### Step 3: Create the authentication slice

Authentication behavior moved from the old context into `authSlice.ts`:

- `login`
- `register`
- `logout`
- `updateUser`
- Session restoration from `localStorage`

API operations use Redux Toolkit `createAsyncThunk`.

Authentication state contains:

```ts
{
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}
```

### Step 4: Create the cart slice

Cart behavior moved from the old context into `cartSlice.ts`:

- `addToCart`
- `removeFromCart`
- `updateQuantity`
- `clearCart`
- `setIsCartOpen`

The following values are derived with selectors rather than stored separately:

- `selectCartCount`
- `selectCartTotal`

This avoids duplicated state and keeps totals consistent with cart items.

### Step 5: Add typed hooks

Components use:

```ts
const dispatch = useAppDispatch();
const user = useAppSelector((state) => state.auth.user);
```

Typed hooks prevent repeated manual `RootState` and `AppDispatch` typing.

### Step 6: Replace the providers

[`cli/src/main.tsx`](./cli/src/main.tsx) now wraps the application with React Redux `Provider` and the configured store. The old `AuthProvider` and `CartProvider` were removed.

### Step 7: Migrate consumers

Authentication consumers were migrated in:

- [`cli/src/components/Navbar.tsx`](./cli/src/components/Navbar.tsx)
- [`cli/src/components/ProtectedRoute.tsx`](./cli/src/components/ProtectedRoute.tsx)
- [`cli/src/pages/Login.tsx`](./cli/src/pages/Login.tsx)
- [`cli/src/pages/Addresses.tsx`](./cli/src/pages/Addresses.tsx)
- [`cli/src/components/AddressCard.tsx`](./cli/src/components/AddressCard.tsx)
- [`cli/src/pages/Checkout.tsx`](./cli/src/pages/Checkout.tsx)
- [`cli/src/pages/ProductPage.tsx`](./cli/src/pages/ProductPage.tsx)
- [`cli/src/assets/ReviewsSection.tsx`](./cli/src/assets/ReviewsSection.tsx)
- [`cli/src/pages/admin/AdminLayout.tsx`](./cli/src/pages/admin/AdminLayout.tsx)

Cart consumers were migrated in:

- [`cli/src/components/Navbar.tsx`](./cli/src/components/Navbar.tsx)
- [`cli/src/components/ProductCard.tsx`](./cli/src/components/ProductCard.tsx)
- [`cli/src/components/CartSidebar.tsx`](./cli/src/components/CartSidebar.tsx)
- [`cli/src/pages/ProductPage.tsx`](./cli/src/pages/ProductPage.tsx)
- [`cli/src/pages/Checkout.tsx`](./cli/src/pages/Checkout.tsx)
- [`cli/src/pages/MyOrders.tsx`](./cli/src/pages/MyOrders.tsx)

### Step 8: Preserve persistence

The Redux store subscription persists:

- Authentication data under `auth_token` and `auth_user`
- Cart data under `app_cart`

This preserves the old refresh behavior.

## 5. Functional Effects of the Migration

### Authentication

The following behavior should remain unchanged:

- Login stores the token and user
- Registration stores the token and user
- Refresh restores the session
- Logout clears persisted authentication
- Protected routes redirect unauthenticated users
- Admin routes check `user.isAdmin`

Authentication errors are now also represented by `state.auth.error`.

### Shopping cart

The following behavior should remain unchanged:

- Products can be added from product cards and product pages
- Existing products increase quantity
- Quantities can be incremented or decremented
- Zero quantity removes an item
- Cart totals and count are derived from current items
- Cart contents survive a page refresh
- Checkout and order flows can clear the cart

### Component rendering

Components now subscribe to selected Redux state instead of receiving the complete context value. For example, a component that only selects `cartCount` does not need the complete cart object.

The actual performance benefit depends on selector usage and component structure. Redux is not automatically faster in every case.

## 6. Comparison Test Cases

The following cases compare the old Context implementation with the Redux implementation. Expected business behavior should be identical.

| Test case | Old Context behavior | Redux behavior | Expected result |
|---|---|---|---|
| Login | `AuthContext.login` calls the API and updates provider state | `login` thunk calls the API and updates `auth` state | User and token are available after success |
| Registration | `AuthContext.register` stores returned credentials | `register` thunk stores returned credentials | User is authenticated after success |
| Session refresh | Provider reads `auth_token` and `auth_user` | Store initializes from the same keys | Session remains active after refresh |
| Logout | Context clears state and local storage | `logout` reducer clears state; store subscription clears storage | User becomes unauthenticated |
| Protected route | `ProtectedRoute` reads context user/loading | `ProtectedRoute` selects Redux user/loading | Unauthenticated users are redirected |
| Admin authorization | `AdminLayout` reads `user.isAdmin` from context | `AdminLayout` selects `state.auth.user` | Non-admin users cannot access admin pages |
| Add cart item | Context callback updates items and opens sidebar | `addToCart` reducer updates items and opens sidebar | Item is added and sidebar opens |
| Add duplicate item | Context callback increases existing quantity | Redux reducer increases existing quantity | No duplicate line item is created |
| Update quantity | Context callback updates or removes item | Redux reducer updates or removes item | Quantity and item removal match |
| Cart count | Provider calculates count from items | `selectCartCount` calculates count from items | Count is identical |
| Cart total | Provider calculates total from items | `selectCartTotal` calculates total from items | Total is identical |
| Cart refresh | Context effect persists items | Store subscription persists items | Cart remains after refresh |
| Checkout clear | Context `clearCart` empties cart | Redux `clearCart` empties cart | Cart is empty after successful order |

## 7. Efficiency Comparison

### What should be measured

Use React DevTools Profiler or Redux DevTools to compare:

1. Number of components rendered when adding an item.
2. Number of components rendered when changing quantity.
3. Time to complete login and cart actions.
4. Time to restore state after refresh.
5. Number of API requests.
6. Memory usage during normal navigation.

Example manual profiling sequence:

1. Open the home page.
2. Start a React Profiler recording.
3. Add a product from `ProductCard`.
4. Stop the recording and record affected components.
5. Repeat with the old implementation if it is available in a separate branch.
6. Repeat for quantity updates, cart opening, logout, and checkout.

### Expected efficiency differences

| Area | Context API | Redux Toolkit |
|---|---|---|
| Small state updates | Usually efficient for a small number of consumers | Efficient when selectors are narrow |
| Broad provider updates | A provider value change can notify all consumers | Components subscribe to selected store state |
| Derived values | Recalculated in provider render | Calculated by selectors |
| Persistence | Usually handled by provider effects | Centralized through store subscription or middleware |
| Async state | Manually managed | Structured with thunks and pending/fulfilled/rejected states |
| Debugging | Limited action history | Redux DevTools action and state history |
| Startup cost | Lower | Slightly higher due to Redux runtime and store setup |
| Bundle size | Smaller | Larger because of Redux packages |

Redux may reduce unnecessary updates when selectors are narrow, but it does not guarantee fewer renders. Returning a large object from one selector or changing many store fields can still cause re-renders.

## 8. Advantages and Disadvantages

### React Context API

#### Advantages

- Built into React
- Minimal setup
- Less code for small shared state
- Easy to understand for simple providers
- No additional runtime dependency
- Appropriate for theme, locale, or simple authentication state

#### Disadvantages

- Provider values can cause broad consumer updates
- Async actions and error handling are manually structured
- State transitions are less standardized
- No built-in action history or Redux DevTools equivalent
- Multiple contexts can become difficult to coordinate
- Testing often requires rendering providers

### Redux Toolkit

#### Advantages

- Centralized and predictable state management
- Clear actions and reducer transitions
- Redux DevTools support
- Typed selectors and dispatch
- Standardized async handling with `createAsyncThunk`
- Reducers can be tested independently
- Scales well for wishlist, coupons, notifications, filters, payments, and admin state
- Derived state can be shared through selectors
- Persistence can be centralized

#### Disadvantages

- More files and concepts
- Additional dependencies and bundle size
- Migration requires updating many consumers
- Small state changes can be more verbose
- Poorly designed selectors can still cause unnecessary renders
- Redux is unnecessary for purely local component state
- Async side effects still require careful error and loading handling

## 9. Validation Results

The migration was validated with:

```powershell
cd F:\VitaMall\cli
npm run build
```

The production build succeeds.

The complete existing ESLint command reports pre-existing issues in unrelated files, primarily explicit `any` types and React effect warnings. Redux-specific files pass focused lint validation.