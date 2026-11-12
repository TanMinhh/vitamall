import axios from "axios";
import toast from "react-hot-toast";

const SESSION_REDIRECT_DELAY = 5_000;

const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL
})

// Inject JWT Token from localStorage into every request
api.interceptors.request.use((config) => {
    const isDeliveryRequest = config.url?.includes("/delivery/");
    const token = localStorage.getItem(isDeliveryRequest ? "delivery_token" : "auth_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
})

// Handle authentic errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const isDeliveryRequest = error.config?.url?.includes("/delivery/");
            const expiredAt = error.response.data?.expiredAt;
            const loginPath = isDeliveryRequest ? "/delivery/login" : "/login";

            if (isDeliveryRequest) {
                localStorage.removeItem("delivery_token");
                localStorage.removeItem("delivery_partner");
            } else {
                localStorage.removeItem("auth_token");
                localStorage.removeItem("auth_user");
            }

            if (expiredAt) {
                const formattedExpiredAt = new Date(expiredAt).toLocaleString();
                toast.error(`Your session expired at ${formattedExpiredAt}. Please sign in again after 5 seconds.`, {
                    id: "session-expired",
                    duration: SESSION_REDIRECT_DELAY,
                });
            }

            if (window.location.pathname !== loginPath) {
                window.setTimeout(() => {
                    window.location.href = loginPath;
                }, SESSION_REDIRECT_DELAY);
            }
        }
        return Promise.reject(error);
    }
)

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && error.config?.url?.includes("/delivery/")) {
            const expiredAt = error.response.data?.expiredAt;
            localStorage.removeItem("delivery_token");
            localStorage.removeItem("delivery_partner");

            if (expiredAt) {
                const formattedExpiredAt = new Date(expiredAt).toLocaleString();
                toast.error(`Your session expired at ${formattedExpiredAt}. Please sign in again.`, {
                    id: "session-expired",
                    duration: SESSION_REDIRECT_DELAY,
                });
            }

            if (window.location.pathname !== "/delivery/login") {
                window.setTimeout(() => {
                    window.location.href = "/delivery/login";
                }, SESSION_REDIRECT_DELAY);
            }
        }
        return Promise.reject(error);
    }
)

export default api;