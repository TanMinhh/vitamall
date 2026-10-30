import { useEffect, useState } from "react";
import type { Product, Review } from "../types";
import { StarIcon, ThumbsUpIcon } from "lucide-react";
import api from "../config/api";
import { useAuth } from "../context/AuthContext";

export default function ReviewsSection({ product, refreshKey }: { product: Product; refreshKey: number }) {
    const { user, token } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);

    useEffect(() => {
        api.get(`/products/${product.id}/reviews`)
            .then(({ data }) => setReviews(data.reviews))
            .catch(() => setReviews([]));
    }, [product.id, token, refreshKey]);

    const displayReviews = reviews.map((review) => ({
        id: review.id,
        name: review.user.name,
        avatar: review.user.avatar || review.user.name.slice(0, 2).toUpperCase(),
        rating: review.rating,
        text: review.text,
        date: new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        helpful: review.helpful,
        helpfulByCurrentUser: review.helpfulByCurrentUser,
        userId: review.user.id,
    }));

    if (displayReviews.length === 0) return null;

    // Rating breakdown
    const breakdown = [0, 0, 0, 0, 0];
    displayReviews.forEach((review) => breakdown[review.rating - 1]++);
    breakdown.reverse();

    const maxCount = Math.max(...breakdown, 1);

    const toggleHelpful = async (reviewId: string) => {
        if (!token) return;
        const { data } = await api.post(`/products/reviews/${reviewId}/helpful`);
        setReviews((previous) => previous.map((review) => review.id === reviewId
            ? { ...review, helpful: data.helpful, helpfulByCurrentUser: data.helpfulByCurrentUser }
            : review));
    };

    return (
        <section className="mt-10 ">
            <h2 className="text-2xl font-semibold text-app-green mb-6">Customer Reviews</h2>

            <div className="bg-white/50 rounded-2xl p-6 md:p-8">
                {/* Summary row */}
                <div className="flex flex-col md:flex-row gap-8 mb-8 pb-8 border-b border-app-border">
                    {/* Average */}
                    <div className="flex-center flex-col md:min-w-[160px] lg:w-1/3">
                        <span className="text-5xl font-semibold text-app-green">{product.rating}</span>
                        <div className="flex items-center gap-0.5 mt-2 mb-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <StarIcon key={s} className={`size-4 ${s <= Math.round(product.rating) ? "text-app-warning fill-app-warning" : "text-app-border"}`} />
                            ))}
                        </div>
                        <span className="text-sm text-zinc-600">{product.reviewCount} reviews</span>
                    </div>

                    {/* Breakdown bars */}
                    <div className="flex-1 space-y-2">
                        {breakdown.map((count, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-sm text-zinc-600 w-8 text-right">{5 - i} ★</span>
                                <div className="flex-1 h-2.5 bg-app-border rounded-full overflow-hidden">
                                    <div className="h-full bg-app-warning rounded-full transition-all duration-500" style={{ width: `${(count / maxCount) * 100}%` }} />
                                </div>
                                <span className="text-xs text-zinc-600 w-6">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Individual reviews */}
                <div className="space-y-6">
                    {displayReviews.map((review) => (
                        <div key={review.id} className="flex gap-4">
                            <div className="size-10 rounded-full bg-app-green/10 text-app-green flex-center shrink-0 text-sm font-semibold">
                                {review.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center flex-wrap gap-2 mb-1">
                                    <span className="text-sm font-semibold text-app-text">{review.name}</span>
                                    <span className="text-xs text-zinc-600">·</span>
                                    <span className="text-xs text-zinc-600">{review.date}</span>
                                </div>
                                <div className="flex items-center gap-0.5 mb-2">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <StarIcon key={s} className={`size-3.5 ${s <= review.rating ? "text-app-warning fill-app-warning" : "text-app-border"}`} />
                                    ))}
                                </div>
                                <p className="text-sm text-zinc-600 leading-relaxed">{review.text || "Rated this product after purchase."}</p>
                                <button
                                    onClick={() => toggleHelpful(review.id)}
                                    disabled={!token || user?.id === review.userId}
                                    title={user?.id === review.userId ? "You cannot like your own review" : undefined}
                                    className={`mt-2 flex items-center gap-1.5 text-xs transition-colors ${review.helpfulByCurrentUser ? "text-app-green" : "text-zinc-600 hover:text-app-green"} disabled:cursor-not-allowed disabled:opacity-60`}
                                >
                                    <ThumbsUpIcon className={`size-3.5 ${review.helpfulByCurrentUser ? "fill-current" : ""}`} /> Helpful ({review.helpful})
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}