import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"
import type { Order } from "../types";
import Loading from "../components/Loading";
import { ArrowLeftIcon, EyeOffIcon, MapPinIcon, PhoneIcon, StarIcon } from "lucide-react";
import OrderOTP from "../components/OrderTracking/OrderOTP";
import LiveMap from "../components/OrderTracking/LiveMap";
import OrderTimeLine from "../components/OrderTracking/OrderTimeLine";
import api from "../config/api";
import toast from "react-hot-toast";


const OrderTracking = () => {
    const currency = import.meta.env.VITE_CURRENCY_SYMBOL || "$";
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);
    const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [ratings, setRatings] = useState<Record<string, number>>({});
    const [reviewTexts, setReviewTexts] = useState<Record<string, string>>({});
    const [submittedRatings, setSubmittedRatings] = useState<Record<string, boolean>>({});
    const [reviewingProduct, setReviewingProduct] = useState<string | null>(null);

    useEffect(() => {
        api.get(`/orders/${id}`).then((result) => {
            setOrder(result.data.order)
            setSubmittedRatings(
                Object.fromEntries((result.data.reviewedProductIds ?? []).map((productId: string) => [productId, true]))
            )
        }).catch(() => navigate("/orders")).finally(() => setLoading(false))
    }, [id, navigate])

    //Update live location every 10 second
    useEffect(() => {
        if (!order || ["Delivered", "Cancelled", "Placed"].includes(order.status)) return;
        const fetchLocation = async () => {
            try {
                const { data } = await api.get(`/orders/${id}/location`);
                if (data.liveLocation?.lat && data.liveLocation?.lng && data.liveLocation.updatedAt) {
                    setLiveLocation({
                        lat: data.liveLocation.lat,
                        lng: data.liveLocation.lng
                    })
                }
                if (data.status && data.status !== order.status) {
                    setOrder((previous) => previous ? { ...previous, status: data.status } : previous);
                }
            } catch (error) {
                console.log(error);
            }
        }
        fetchLocation();
        const interval = setInterval(fetchLocation, 10000);
        return () => clearInterval(interval);
    }, [id, order, order?.status]);

    if (loading) return <Loading />
    if (!order) return null

    const submitReview = async (productId: string) => {
        const rating = ratings[productId];
        const text = reviewTexts[productId]?.trim();
        if (rating === undefined || !text) return;
        try {
            await api.post(`/products/${productId}/reviews`, { orderId: order.id, rating, text });
            setSubmittedRatings((previous) => ({ ...previous, [productId]: true }));
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Unable to submit review.");
        }
    };

    return (
        <div className="min-h-screen mb-20 bg-app-cream">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <button onClick={() => navigate("/orders")} className="flex items-center gap-2 text-sm text-app-text-light hover:text-app-green mb-6 transition-colors">
                    <ArrowLeftIcon className="size-4" />Back to Orders
                </button>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-app-green">Order #{order!.id.slice(-8).toUpperCase()}</h1>
                        <p className="test-sm text-app-text-light mt-1">Place on {new Date(order!.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                    </div>
                    <span className={`px-4 py-1.5 text-sm font-semibold rounded-full ${order!.status === "Delivered" ? "bg-green-100 text-green-700" : order!.status === "Cancelled" ? "bg-red-100 text-red-700" : "bg-app-orange/10 text-app-orange"}`}>
                        {order!.status}
                    </span>
                </div>
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <OrderOTP order={order} />
                        <LiveMap order={order} liveLocation={liveLocation} />
                        <OrderTimeLine order={order} />
                        {order?.deliveryPartner && order.status !== "Delivered" && order.status !== "Cancelled" && (
                            <div className="bg-white rounded-2xl p-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-11 rounded-full bg-app-green flex-center">
                                        <span className="text-white font-semibold text-sm">
                                            {order.deliveryPartner.name.charAt(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <p>{order.deliveryPartner.name}</p>
                                        <p className="text-xs text-app-text-light capitalize">{order.deliveryPartner.vehicleType} • Delivery Partner</p>
                                    </div>
                                </div>
                                <a href={`tel:${order.deliveryPartner.phone}`} className="p-2.5 bg-app-cream rounded-xl hover:bg-app-cream-dark transition-colors">
                                    <PhoneIcon className="size-4 text-app-green" />
                                </a>
                            </div>
                        )}
                    </div>
                    <div className="space-y-5">
                        <div className="bg-white rounded-2xl p-5">
                            <h3 className="text-sm font-semibold text-app-green mb-3 flex items-center gap-2">
                                <MapPinIcon className="size-4" />Delivery Address
                            </h3>
                            <p className="text-sm text-app-text-light leading-relaxed">
                                {order?.shippingAddress.label}
                                <br />
                                {order?.shippingAddress.address}
                                <br />
                                {order?.shippingAddress.city}, {order?.shippingAddress.state}
                                <br />
                                {order?.shippingAddress.zip}
                            </p>
                        </div>
                        <div className="bg-white rounded-2xl p-5">
                            <h3 className="text-sm font-semibold text-app-green mb-3">Items ({order?.items.length})</h3>
                            <div className="space-y-3">
                                {order?.items.map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 flex-wrap">
                                        <img src={item.image} alt={item.name} className="size-10 rounded-lg object-cover"></img>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-app-green truncate">{item.name}</p>
                                            <p className="text-xs text-app-text-light">x{item.quantity}</p>
                                        </div>
                                        <span className="text-sm font-semibold">
                                            {(item.price * item.quantity).toFixed(2)}{currency}
                                        </span>
                                        {order.status === "Delivered" && (
                                            <div className="basis-full flex items-center justify-between gap-3 pt-1">
                                                {submittedRatings[item.product] ? (
                                                    <span className="text-xs text-app-success">Reviewed</span>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => setReviewingProduct(reviewingProduct === item.product ? null : item.product)}
                                                            aria-label={reviewingProduct === item.product ? "Hide review" : "Rate this product"}
                                                            title={reviewingProduct === item.product ? "Hide review" : "Rate this product"}
                                                            className="text-xs font-medium text-app-orange hover:text-app-orange-dark"
                                                        >
                                                            {reviewingProduct === item.product ? <EyeOffIcon className="size-4" /> : "Rate this product"}
                                                        </button>
                                                        {reviewingProduct === item.product && (
                                                            <div className="basis-full flex flex-col items-end gap-2">
                                                                <textarea
                                                                    value={reviewTexts[item.product] ?? ""}
                                                                    onChange={(event) => setReviewTexts((previous) => ({ ...previous, [item.product]: event.target.value }))}
                                                                    placeholder="Write your review"
                                                                    rows={2}
                                                                    className="w-full rounded-lg border border-app-border px-3 py-2 text-sm outline-none focus:border-app-green"
                                                                />
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex items-center">
                                                                        <span className="w-5 text-sm font-medium text-app-green">{ratings[item.product] ?? 0}</span>
                                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                                            <button
                                                                                key={star}
                                                                                type="button"
                                                                                aria-label={`${star} stars`}
                                                                                onClick={() => setRatings((previous) => ({ ...previous, [item.product]: star }))}
                                                                                className="p-0.5"
                                                                            >
                                                                                <StarIcon className={`size-4 ${star <= (ratings[item.product] ?? 0) ? "text-app-warning fill-app-warning" : "text-app-border"}`} />
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                    <button
                                                                        onClick={() => submitReview(item.product)}
                                                                        disabled={ratings[item.product] === undefined || !reviewTexts[item.product]?.trim()}
                                                                        className="px-2.5 py-1 text-xs rounded-lg bg-green-800 text-white hover:bg-green-700/90 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                                                                    >
                                                                        Submit
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-3 border-t border-app-border space-y-1.5 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-app-text-light">Subtotal</span>
                                    <span>{order?.subtotal.toFixed(2)}{currency}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-app-text-light">Delivery</span>
                                    <span>{order?.deliveryFee === 0 ? "Free" : `${order?.deliveryFee.toFixed(2)}${currency}`}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-app-text-light">Tax</span>
                                    <span>{order?.tax.toFixed(2)}{currency}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-app-border font-semibold text-app-green">
                                    <span>Total</span>
                                    <span>{order?.total.toFixed(2)}{currency}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OrderTracking
