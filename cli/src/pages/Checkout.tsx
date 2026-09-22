import { useNavigate } from "react-router-dom";
import { UseCart } from "../context/CartContext";
import { dummyAddressData } from "../assets/assets";
import { useState } from "react";
import type { Address } from "../types";
import { ArrowLeft, CheckIcon, ChevronRightIcon, CreditCardIcon, MapPinIcon } from "lucide-react";
import CheckoutAddress from "../components/Checkout/CheckoutAddress";
import CheckoutPayment from "../components/Checkout/CheckoutPayment";
import CheckoutReview from "../components/Checkout/CheckoutReview";


const Checkout = () => {
    const currency = import.meta.env.VITE_CURRENCY_SYMBOL || "VND";
    const navigate = useNavigate();
    const { items, cartTotal } = UseCart();
    const { user } = { user: { addresses: dummyAddressData } };
    const [step, setStep] = useState("address");
    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState<Address>({
        _id: "",
        label: "Home",
        address: "",
        city: "",
        state: "",
        zip: "",
        isDefault: false,
        lat: 0,
        lng: 0
    });
    const [paymentMethod, setPaymentMethod] = useState("card");
    const deliveryFee = cartTotal > 100000 ? 0 : 30000;
    const tax = cartTotal * 0.08;
    const total = cartTotal + deliveryFee + tax;
    const steps: { key: string, label: string, icon: typeof MapPinIcon }[] = [
        { key: "address", label: "Address", icon: MapPinIcon },
        { key: "payment", label: "Payment", icon: CreditCardIcon },
        { key: "review", label: "Review", icon: CheckIcon }
    ]
    const handlePlaceOrder = async () => {
        setLoading(true);
        navigate("/orders");
    }
    useState(() => {
        if (user?.addresses?.length) {
            const defaultAddr = user.addresses.find((a) => a.isDefault) || user.addresses[0]
            setAddress({
                _id: defaultAddr?._id,
                label: defaultAddr?.label,
                address: defaultAddr?.address,
                city: defaultAddr?.city,
                state: defaultAddr?.state,
                zip: defaultAddr?.zip,
                isDefault: defaultAddr?.isDefault,
                lat: defaultAddr?.lat,
                lng: defaultAddr?.lng
            })
        }
    })
    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-app-cream flex-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-app-green mb-2">Your cart is empty</h2>
                    <p className="text-sm text-app-text-light mb-4">Add some products to checkout</p>
                    <button className="px-5 py-2.5 bg-app-green text-white text-sm font-medium rounded-xl hover:bg-app-green-light transition-colors" onClick={() => navigate("/products")}>Browse all products</button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-app-cream">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-app-text-light hover:text-app-green mb-6 transition-colors">
                    <ArrowLeft className="size-4" />Back
                </button>
                <h1 className="text-2xl font-semibold text-app-green mb-8">Checkout</h1>
                <div className="flex items-center gap-2 mb-8">
                    {steps.map((s, i) => (
                        <div key={s.key} className="flex items-center gap-2">
                            <button onClick={() => setStep(s.key)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${step === s.key ? "bg-app-green text-white" : "bg-white text-app-text-light"}`}>
                                <s.icon className="size-4" />{s.label}
                                {i < steps.length - 1 && <ChevronRightIcon className="size-4 text-app-text-light" />}
                            </button>
                        </div>
                    ))}
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        {step === "address" && <CheckoutAddress address={address} setAddress={setAddress} setStep={setStep} user={user} />}
                        {step === "payment" && <CheckoutPayment paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} setStep={setStep} />}
                        {step === "review" && <CheckoutReview address={address} items={items} handlePlaceOrder={handlePlaceOrder} loading={loading} total={total} />}
                    </div>
                    <div className="bg-white rounded-2xl p-5 h-fit sticky top-24">
                        <h3 className="text-sm font-semibold text-app-green mb-4">Order Summary</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-app-text-light">Subtotal ({items.length} items)</span>
                                <span>{cartTotal.toFixed(0)} {currency}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-app-text-light">Delivery Fee</span>
                                <span>{deliveryFee === 0 ? <span className="text-app-success">Free</span> : `${deliveryFee} ${currency}`}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-app-text-light">Tax</span>
                                <span>{tax.toFixed(0)} {currency}</span>
                            </div>
                            <div className="flex justify-between pt-3 border-t border-app-border text-base font-semibold">
                                <span>Total</span>
                                <span className="text-app-green">{total.toFixed(0)} {currency}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Checkout
