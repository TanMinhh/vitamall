import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import type { User } from "../types";
import api from "../config/api";

interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
}

interface AuthResponse {
    user: User;
    token: string;
}

interface Credentials {
    email: string;
    password: string;
}

interface RegistrationData extends Credentials {
    name: string;
}

const getStoredAuth = (): Pick<AuthState, "user" | "token"> => {
    const token = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");

    if (!token || !storedUser) {
        return { user: null, token: null };
    }

    try {
        return { user: JSON.parse(storedUser) as User, token };
    } catch (error) {
        if (error instanceof SyntaxError) {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
            return { user: null, token: null };
        }
        throw error;
    }
};

const storedAuth = getStoredAuth();

const getErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
        return error.response?.data?.message || error.message || fallback;
    }
    return error instanceof Error ? error.message : fallback;
};

export const login = createAsyncThunk<AuthResponse, Credentials, { rejectValue: string }>(
    "auth/login",
    async (credentials, { rejectWithValue }) => {
        try {
            const { data } = await api.post<AuthResponse>("/auth/login", credentials);
            return data;
        } catch (error: unknown) {
            return rejectWithValue(getErrorMessage(error, "Login failed"));
        }
    }
);

export const register = createAsyncThunk<AuthResponse, RegistrationData, { rejectValue: string }>(
    "auth/register",
    async (registrationData, { rejectWithValue }) => {
        try {
            const { data } = await api.post<AuthResponse>("/auth/register", registrationData);
            return data;
        } catch (error: unknown) {
            return rejectWithValue(getErrorMessage(error, "Registration failed"));
        }
    }
);

const initialState: AuthState = {
    ...storedAuth,
    loading: false,
    error: null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.error = null;
        },
        updateUser: (state, action: PayloadAction<Partial<User>>) => {
            if (!state.user) {
                return;
            }
            state.user = { ...state.user, ...action.payload };
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Login failed";
            })
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Registration failed";
            });
    },
});

export const { logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
