const ProductCardSkeleton = () => {
    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow" aria-hidden="true">
            <div className="aspect-square bg-app-cream-dark animate-pulse" />
            <div className="p-3.5 space-y-3">
                <div className="h-4 w-4/5 rounded bg-app-cream-dark animate-pulse" />
                <div className="h-3 w-2/5 rounded bg-app-cream-dark animate-pulse" />
                <div className="flex items-center justify-between">
                    <div className="h-5 w-2/5 rounded bg-app-cream-dark animate-pulse" />
                    <div className="size-9 rounded-full bg-app-cream-dark animate-pulse" />
                </div>
            </div>
        </div>
    )
}

export default ProductCardSkeleton
