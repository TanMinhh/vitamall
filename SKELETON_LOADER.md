# Product skeleton loader implementation

## Implementation steps

1. Create a reusable `ProductCardSkeleton` component that mirrors the product card's image, title, pricing, and add-to-cart shapes.
2. Use neutral placeholder blocks with `animate-pulse` and `aria-hidden="true"` so the loading state is visually clear without exposing placeholder content to assistive technology.
3. Replace the generic loading spinner in product-grid states with responsive skeleton grids:
   - All products in `cli/src/pages/Products.tsx`
   - Search results in `cli/src/pages/SearchResults.tsx`
   - Flash deals in `cli/src/pages/FlashDeals.tsx`
   - Popular products on the home page in `cli/src/components/Home/PopularProducts.tsx`
4. Render a fixed number of skeleton cards appropriate to each grid so the page layout remains stable while the API request is pending.
5. Keep the existing full-page spinner for the product-detail view because that screen loads a different, non-grid layout.
6. Run the CLI build and lint checks to confirm the new component and loading branches remain type-safe and consistent with the existing UI.