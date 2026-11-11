import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CartItem, Product } from "../types";
import type { RootState } from "./store";

interface CartState {
    items: CartItem[];
    isCartOpen: boolean;
}

const getStoredItems = (): CartItem[] => {
    const saved = localStorage.getItem("app_cart");
    if (!saved) {
        return [];
    }

    try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed as CartItem[] : [];
    } catch (error) {
        if (error instanceof SyntaxError) {
            localStorage.removeItem("app_cart");
            return [];
        }
        throw error;
    }
};

const initialState: CartState = {
    items: getStoredItems(),
    isCartOpen: false,
};

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        addToCart: (state, action: PayloadAction<{ product: Product; quantity?: number }>) => {
            const { product, quantity = 1 } = action.payload;
            const existing = state.items.find((item) => item.product.id === product.id);

            if (existing) {
                existing.quantity += quantity;
            } else {
                state.items.push({ product, quantity });
            }

            state.isCartOpen = true;
        },
        removeFromCart: (state, action: PayloadAction<string>) => {
            state.items = state.items.filter((item) => item.product.id !== action.payload);
        },
        updateQuantity: (state, action: PayloadAction<{ productId: string; quantity: number }>) => {
            const { productId, quantity } = action.payload;
            if (quantity <= 0) {
                state.items = state.items.filter((item) => item.product.id !== productId);
            } else {
                const item = state.items.find((cartItem) => cartItem.product.id === productId);
                if (item) {
                    item.quantity = quantity;
                }
            }
        },
        clearCart: (state) => {
            state.items = [];
            state.isCartOpen = false;
        },
        setIsCartOpen: (state, action: PayloadAction<boolean>) => {
            state.isCartOpen = action.payload;
        },
    },
});

export const selectCartCount = (state: RootState) =>
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0);

export const selectCartTotal = (state: RootState) =>
    state.cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

export const { addToCart, removeFromCart, updateQuantity, clearCart, setIsCartOpen } = cartSlice.actions;
export default cartSlice.reducer;
