import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import cartReducer from "./cartSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        cart: cartReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

store.subscribe(() => {
    const state = store.getState();
    if (state.auth.token && state.auth.user) {
        localStorage.setItem("auth_token", state.auth.token);
        localStorage.setItem("auth_user", JSON.stringify(state.auth.user));
    } else {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
    }
    localStorage.setItem("app_cart", JSON.stringify(state.cart.items));
});
