# Throttling and Debouncing Methods for Search Engine

## Goal

Keep the existing search URL and API contract:

```text
/search?q=<query>
GET /api/products?search=<query>
```

Add protection at both request boundaries:

- **Debounce the client search input** so typing does not start a search for every
  keystroke.
- **Throttle search requests on the API** so one client cannot continuously
  consume database capacity.

The client debounce improves UX and reduces normal traffic. The server throttle is still required because browser-side controls can be bypassed.

## Default Idea

| Setting | Default | Reason |
| --- | ---: | --- |
| Client debounce delay | `300 ms` | Wait for a short typing pause before searching |
| Minimum query length | `2` characters | Avoid expensive searches for empty/one-character input |
| Server window | `1,000 ms` | One search request per client per second |
| Server burst | `3` requests | Allow a small burst while changing filters or navigating |
| Query length limit | `100` characters | Bound database work and reject abusive input |
| Stale request handling | `AbortController` | Do not render results from an older query |

Use a `429 Too Many Requests` response with a `Retry-After` header when the
server throttle rejects a request.

## Migration steps

### 1. Add a reusable client debounce helper

Create `cli/src/utils/debounce.ts`. The helper should return a function with a `cancel()` method so React effects can clean up pending timers.

```ts
export const debounce = <T extends (...args: never[]) => void>(
    callback: T,
    delay: number,
) => {
    let timer: ReturnType<typeof setTimeout> | undefined

    const debounced = (...args: Parameters<T>) => {
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => callback(...args), delay)
    }

    debounced.cancel = () => {
        if (timer) clearTimeout(timer)
        timer = undefined
    }

    return debounced
}
```

### 2. Debounce the search input in `cli/src/components/Navbar.tsx`

Keep the current submit behavior for keyboard accessibility and direct navigation. Add a debounced callback for any future live-search suggestions or result prefetching; do not navigate on every keystroke.

```tsx
const SEARCH_DEBOUNCE_MS = 300

const debouncedSearch = useMemo(
    () => debounce((value: string) => {
        const query = value.trim()
        if (query.length >= 2) {
            // Optional: prefetch suggestions/results here.
            // The form submit remains the canonical navigation action.
        }
    }, SEARCH_DEBOUNCE_MS),
    [],
)

useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch])
```

Call `debouncedSearch(e.target.value)` from the input `onChange` handler. Keep
`handleSearch` as the immediate action when the user submits the form.

### 3. Make result loading cancelable and debounced in
`cli/src/pages/SearchResults.tsx`

The current effect requests results immediately whenever `q` changes. Replace it with a delayed request and cancel both the timer and the previous Axios request:

```tsx
useEffect(() => {
    const normalizedQuery = query.trim()
    if (normalizedQuery.length < 2) {
        setProducts([])
        setLoading(false)
        return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
        setLoading(true)
        try {
            const response = await api.get(
                `/products?search=${encodeURIComponent(normalizedQuery)}`,
                { signal: controller.signal },
            )
            setProducts(response.data.products)
        } catch (error: unknown) {
            if (!controller.signal.aborted) {
                toast.error(error instanceof Error ? error.message : "Unable to search products")
            }
        } finally {
            if (!controller.signal.aborted) setLoading(false)
        }
    }, 300)

    return () => {
        clearTimeout(timer)
        controller.abort()
    }
}, [query])
```

Treat an aborted request as expected cleanup, not as a user-visible error. Normalize the query before sending it so equivalent values do not create different searches.

### 4. Add server-side search throttling

Create `server/middleware/searchThrottle.ts`. Track only bounded, short-lived request state. Prefer the authenticated user ID when available; otherwise use the normalized client IP. In a multi-instance deployment, replace the in-memory map with Redis or another shared store before scaling horizontally.

The middleware should:

1. Apply only to requests containing `req.query.search`.
2. Reject queries longer than `100` characters with `400`.
3. Allow at most `3` requests in a rolling one-second window per client.
4. Return `429` and `Retry-After: 1` when the limit is exceeded.
5. Periodically remove expired entries to prevent unbounded memory growth.

Example response:

```json
{
  "message": "Too many search requests. Please try again shortly."
}
```

### 5. Attach the throttle to the product search route

In `server/routes/productRoutes.ts`, apply the middleware only to the
collection endpoint, before `getProducts`:

```ts
import searchThrottle from "../middleware/searchThrottle.js"

productRouter.get("/", searchThrottle, getProducts)
```

Do not throttle product detail, review, admin, or flash-deal routes.

### 6. Normalize and validate the API query

In `server/controllers/productController.ts`:

- Trim `search` before passing it to Prisma.
- Ignore a missing or shorter-than-two-character search term.
- Use the validated, bounded value in the existing
  `name: { contains, mode: "insensitive" }` filter.
- Preserve the existing `{ products }` response shape.

The controller should not silently turn an invalid oversized query into a successful search; return the validation error from the middleware instead.

## Completion criteria

- Typing does not issue one API request per keystroke.
- Only the latest search result can update the result grid.
- Search traffic is limited server-side with an explicit `429` response.
- Existing submitted searches, URLs, response shapes, and non-search product
  routes continue to work.

## Old and new search mechanics

### Old search flow

1. The user types in the navbar search box.
2. No API request is made while typing.
3. On form submission, the application navigates to
   `/search?q=<query>`.
4. `SearchResults` immediately calls
   `GET /api/products?search=<query>`.
5. The server queries Prisma using a case-insensitive product-name search.
6. If the query changes, another request can start immediately.
7. Previous requests are not canceled, so a slower older response could
   overwrite newer results.

### New search flow

1. The user types and submits the search form as before.
2. The application still navigates to `/search?q=<query>`.
3. `SearchResults` trims and validates the query. Queries shorter than two
   characters return no results without an API call.
4. The API request waits 300 ms before starting.
5. If the query changes during that delay, the previous timer is cleared.
6. If an earlier request is already running, `AbortController` cancels it so
   its response cannot update the screen.
7. The server trims the search text and rejects values longer than 100
   characters.
8. The server tracks requests by authenticated user or IP address and allows
   up to three search requests per second.
9. Excess requests receive `429 Too Many Requests` with `Retry-After: 1`.

### Behavioral comparison

| Area | Old system | New system |
| --- | --- | --- |
| Request timing | Immediate after navigation | Delayed by 300 ms |
| Rapid query changes | Multiple requests can run | Previous timer/request is canceled |
| Stale results | Possible | Prevented |
| Minimum query | None | Two characters |
| Maximum query | None | 100 characters |
| Server protection | None | Three requests per second per client |
| Abuse response | Requests reach the database | `429 Too Many Requests` |
| API contract | `/api/products?search=` | Unchanged |

### Implementation clarification

The current implementation debounces the result-page API request, not the navbar input itself. The navbar only starts a search after form submission, so typing does not produce API requests. The debounce protects the request when the search query changes, while the server throttle remains necessary because client-side controls can be bypassed.