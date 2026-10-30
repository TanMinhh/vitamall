import { Link, useNavigate, useParams } from "react-router-dom"
import { UseCart } from "../context/CartContext"
import { useEffect, useState } from "react"
import type { Product } from "../types"
import Loading from "../components/Loading"
import { ArrowLeftIcon, ArrowRightIcon, HomeIcon, LeafIcon, MinusIcon, PlusIcon, ShoppingCartIcon, StarIcon } from "lucide-react"
import ReviewsSection from "../assets/ReviewsSection"
import ProductCard from "../components/ProductCard"
import api from "../config/api"
import { useAuth } from "../context/AuthContext"
import toast from "react-hot-toast"

const ProductPage = () => {
    const currency = import.meta.env.VITE_CURRENCY_SYMBOL || "$"
    const { id } = useParams()
    const navigate = useNavigate()
    const { token } = useAuth()
    const { items, addToCart, updateQuantity, removeFromCart } = UseCart()
    const [product, setProduct] = useState<Product | null>(null)
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [localQuantity, setLocalQuantity] = useState(1)
    const [reviewOrderId, setReviewOrderId] = useState<string | null>(null)
    const [reviewRating, setReviewRating] = useState(0)
    const [reviewText, setReviewText] = useState("")
    const [hasReviewed, setHasReviewed] = useState(false)
    const [reviewRefreshKey, setReviewRefreshKey] = useState(0)

    useEffect(() => {
        setLoading(true)
        setLocalQuantity(1)
        window.scrollTo(0, 0)
        const productRequest = api.get(`/products/${id}`)
        const reviewStatusRequest = token && id
            ? api.get(`/products/${id}/review-status`)
            : Promise.resolve({ data: { eligible: false, orderId: null, review: null } })
        Promise.all([productRequest, reviewStatusRequest])
            .then(([{ data: productData }, { data: reviewStatus }]) => {
                setProduct(productData.product)
                setReviewOrderId(reviewStatus.eligible ? reviewStatus.orderId : null)
                setHasReviewed(!!reviewStatus.review)
                setReviewRating(reviewStatus.review?.rating ?? 0)
                setReviewText(reviewStatus.review?.text ?? "")
                return api.get(`/products?category=${productData.product.category}`)
            }).then(({ data }) => {
                setRelatedProducts(data.products.filter((p: Product) => p.id !== id))
            }).catch(() => navigate("/products")).finally(() => setLoading(false))
    }, [id, navigate, token])

    if (loading) return <Loading />
    if (!product) return null

    const price = Number(product.price)
    const originalPrice = Number(product.originalPrice)
    const discount = Number(product.discount) || (
        originalPrice > price
            ? Math.round(((originalPrice - price) / originalPrice) * 100)
            : 0
    )
    const cartItem = items.find((item) => item.product.id === product.id)
    const inCart = !!cartItem
    const displayQuantity = inCart ? cartItem.quantity : localQuantity
    const categoryLabel = product.category.replace(/-/g, " ")

    const handleMinus = () => {
        if (inCart) {
            if (cartItem.quantity > 1)
                updateQuantity(product.id, cartItem.quantity - 1)
            else
                removeFromCart(product.id)
        } else {
            setLocalQuantity(Math.max(1, localQuantity - 1))
        }
    }

    const handlePlus = () => {
        if (inCart)
            updateQuantity(product.id, cartItem.quantity + 1)
        else
            setLocalQuantity(localQuantity + 1)
    }

    const submitReview = async () => {
        if (!reviewOrderId || !reviewText.trim()) return
        try {
            await api.post(`/products/${product.id}/reviews`, { orderId: reviewOrderId, rating: reviewRating, text: reviewText.trim() })
            setHasReviewed(true)
            const { data } = await api.get(`/products/${product.id}`)
            setProduct(data.product)
            setReviewRefreshKey((key) => key + 1)
            toast.success("Review submitted!")
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Unable to submit review.")
        }
    }

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <nav className="flex items-center gap-2 text-sm text-app-text-light mb-6">
                    <Link to="/" className="hover:text-app-green transition-colors">
                        <HomeIcon className="size-4" />
                    </Link>
                    <span>/</span>
                    <Link to="/products" className="hover:text-app-green transition-colors">
                        Products
                    </Link>
                    <span>/</span>
                    <Link to={`/products?category=${product.category}`} className="hover:text-app-green transition-colors capitalize">
                        {categoryLabel}
                    </Link>
                    <span>/</span>
                    <span className="text-app-green font-medium truncate max-w-[200px]">{product.name}</span>
                </nav>
                <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1.5 text-sm text-app-text-light hover:text-app-green transition-colors">
                    <ArrowLeftIcon className="size-4" />Back
                </button>

                <div className="bg-white/50 rounded-2xl overflow-hidden">
                    <div className="grid md:grid-cols-2 gap-0">
                        <div className="relative flex-center p-8 md:p-12 min-h-[320px] md:min-h-[480px]">
                            <img src={product.image} alt={product.name} className="max-h-[360px] w-auto object-contain" />
                            <div className="absolute top-5 left-5 flex flex-wrap gap-1.5">
                                {product.isOrganic && (
                                    <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-app-green text-white rounded-full">
                                        <LeafIcon className="w-3 h-3"></LeafIcon>
                                        Organic
                                    </span>
                                )}
                                {discount > 0 && (
                                    <span className="px-2.5 py-1 text-xs font-semibold bg-app-orange text-white rounded-full">
                                        {discount}% OFF
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="p-6 md:p-10 flex flex-col justify-center">
                            <span className="text-xs font-medium text-app-text-light tracking-wider mb-2 capitalize">{categoryLabel}</span>
                            <h1 className="text-2xl md:text-3xl font-semibold text-app-green mb-3">{product.name}</h1>
                            {product.rating > 0 && (
                                <div className="flex items-center gap-2 mb-5">
                                    <div className="flex items-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <StarIcon key={star} className={`w-4 h-4 ${star <= Math.round(product.rating) ? "text-app-warning fill-app-warning" : "text-app-border"}`} />
                                        ))}
                                    </div>
                                    <span className="text-sm font-medium">{product.rating}</span>
                                    <span className="text-sm text-app-text-light">({product.reviewCount} reviews)</span>
                                </div>
                            )}
                            <div className="flex items-baseline gap-3 mb-5">
                                <span className="text-3xl md:text-4xl font-semibold text-app-green">{price.toFixed(2)}{currency}</span>
                                {originalPrice > price && (
                                    <span className="text-lg text-app-text-light line-through">{originalPrice.toFixed(2)}{currency}</span>
                                )}
                            </div>
                            <p className="text-sm text-app-text-light leading-relaxed mb-6">{product.description}</p>
                            <div className="mb-6">
                                {product.stock > 0 ? (
                                    <span className="text-sm text-app-success font-medium">✓ In Stock ({product.stock} available)</span>
                                ) : (
                                    <span className="text-sm text-app-error font-medium">Out of Stock</span>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center border border-app-border rounded-xl overflow-hidden">
                                    <button onClick={handleMinus} className="p-3 hover:bg-app-cream transition-colors">
                                        <MinusIcon className="w-4 h-4" />
                                    </button>
                                    <span className="px-5 text-sm font-semibold min-w-[40px] text-center">{displayQuantity}</span>
                                    <button onClick={handlePlus} className="p-3 hover:bg-app-cream transition-colors">
                                        <PlusIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <button onClick={() => { if (!inCart) addToCart(product, localQuantity) }} disabled={product.stock === 0} className={`flex-1 py-3 font-semibold rounded-xl transition-colors flex-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${inCart ? "bg-app-cream text-app-green border border-app-green" : "bg-app-orange text-white hover:bg-app-orange-dark"}`}>
                                    <ShoppingCartIcon className="w-4 h-4" />
                                    {inCart ? "Added to Cart!" : "Add to Cart"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {reviewOrderId && !hasReviewed && (
                    <section className="mt-10 bg-white rounded-2xl p-6">
                        <h2 className="text-xl font-semibold text-app-green mb-2">Review this product</h2>
                        <p className="text-sm text-app-text-light mb-4">You bought this product. How would you rate it?</p>
                        <textarea
                            value={reviewText}
                            onChange={(event) => setReviewText(event.target.value)}
                            placeholder="Write your review"
                            rows={3}
                            className="w-full mb-4 rounded-lg border border-app-border px-3 py-2 text-sm outline-none focus:border-app-green"
                        />
                        <div className="flex items-center gap-3">
                            <span className="w-5 text-sm font-medium text-app-green">{reviewRating}</span>
                            <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        aria-label={`${star} stars`}
                                        onClick={() => setReviewRating(star)}
                                        className="p-1"
                                    >
                                        <StarIcon className={`size-6 ${star <= reviewRating ? "text-app-warning fill-app-warning" : "text-app-border"}`} />
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={submitReview}
                                disabled={!reviewText.trim()}
                                className="px-3 py-2 text-sm rounded-lg bg-app-green text-white disabled:opacity-50"
                            >
                                Submit
                            </button>
                        </div>
                    </section>
                )}
                <ReviewsSection product={product} refreshKey={reviewRefreshKey} />
                {relatedProducts.length > 0 && (
                    <section className="mt-12 mb-44">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-semibold text-app-green">Related Products</h2>
                                <p className="text-sm text-app-text-light mt-1">More from {categoryLabel}</p>
                            </div>
                            <Link className="text-sm font-semibold text-app-orange hover:text-app-orange-dark flex items-center gap-1 transition-colors" to={`/products?category=${product.category}`}>
                                View all <ArrowRightIcon />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 xl:gap-8">
                            {relatedProducts.slice(0, 5).map((pr) => (
                                <ProductCard key={pr.id} product={pr} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    )
}

export default ProductPage
