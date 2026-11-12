import { useEffect, useState } from "react"
import type { Product } from "../types"
import { Link, useSearchParams } from "react-router-dom";
import { Home, Search } from "lucide-react";
import ProductCard from "../components/ProductCard";
import ProductCardSkeleton from "../components/ProductCardSkeleton";
import api from "../config/api";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import { debounce } from "../utils/debounce";

const SEARCH_DEBOUNCE_MS = 300;

const SearchResults = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const query = searchParams.get("q") || "";
    useEffect(() => {
        const normalizedQuery = query.trim();
        if (normalizedQuery.length < 2) {
            setProducts([]);
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        const loadResults = debounce(async () => {
            setLoading(true);
            try {
                const response = await api.get(
                    `/products?search=${encodeURIComponent(normalizedQuery)}`,
                    { signal: controller.signal },
                );
                setProducts(response.data.products);
            } catch (error: unknown) {
                if (!controller.signal.aborted) {
                    const message = error instanceof AxiosError
                        ? error.response?.data?.message || error.message
                        : error instanceof Error
                            ? error.message
                            : "Unable to search products";
                    toast.error(message);
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }, SEARCH_DEBOUNCE_MS);
        loadResults();

        return () => {
            loadResults.cancel();
            controller.abort();
        };
    }, [query]);

    return (
        <div className="min-h-screen bg-app-cream">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <nav className="flex items-center gap-2 text-sm text-app-text-light mb-6">
                    <Link to="/" className="hover:text-app-green transition-colors">
                        <Home className="size-4" />
                    </Link>
                    <span>/</span>
                    <span className="text-app-green font-medium">Search Results</span>
                </nav>
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-app-green mb-1">Results for "{query}"</h1>
                    <p>{loading ? "Searching..." : `${products.length} items found`}</p>
                </div>
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" aria-label="Loading products">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <ProductCardSkeleton key={index} />
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20">
                        <Search className="size-16 text-app-border mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-app-green mb-2">No results found</h2>
                        <p className="text-sm text-app-text-light mb-6 max-w-md mx-auto">We couldn't find any products matching "{query}". <br />Try a different search one.</p>
                        <Link to="/products" className="inline-flex px-5 py-2.5 bg-app-green text-white text-sm font-medium rounded-lg">Browse all products</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default SearchResults
