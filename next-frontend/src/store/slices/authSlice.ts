/**
 * Auth Slice - Manages authentication state
 * Handles user data, token, and authentication status
 */

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { authService } from "@/services/authService";
import { tokenService } from "@/services/tokenService";

export interface User {
    id: number | string;
    name: string;
    email: string;
    phone?: string | null;
    type?: string | null;
    kyc_status?: string;
    kyc_notes?: string | null;
    kyc_comments_enabled?: boolean;
    [key: string]: any; // Allow additional user properties
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    token: tokenService.getToken(),
    isAuthenticated: !!tokenService.getToken(),
    isLoading: false,
    error: null,
};

// Async thunk to fetch current user
export const fetchUser = createAsyncThunk(
    "auth/fetchUser",
    async (_, { rejectWithValue }) => {
        try {
            const response = await authService.me();
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to fetch user"
            );
        }
    }
);

// Async thunk for login
export const login = createAsyncThunk(
    "auth/login",
    async (
        credentials: { email: string; password: string; remember?: boolean },
        { rejectWithValue }
    ) => {
        try {
            const response = await authService.login(credentials);
            const token = response.data.access_token;
            
            // If login failed (no token), throw error to be caught below
            if (!token) {
                throw new Error("No access token received from login");
            }
            
            tokenService.setToken(token);
            
            // Fetch user after login
            const userResponse = await authService.me();
            return { token, user: userResponse.data };
        } catch (error: any) {
            // Extract error message from backend response
            // Backend may return: { message: "...", error: "...", statusCode: 401 }
            // Priority: response.data.message > response.data.error > error.message > fallback
            const errorMessage = 
                error?.response?.data?.message || 
                error?.response?.data?.error || 
                error?.message || 
                "Login failed";
            
            return rejectWithValue(errorMessage);
        }
    }
);

// Async thunk for register
export const register = createAsyncThunk(
    "auth/register",
    async (data: any, { rejectWithValue }) => {
        try {
            const response = await authService.register(data);
            const token = response.data.access_token;
            if (token) {
                tokenService.setToken(token);
            }
            // Fetch user after registration
            const userResponse = await authService.me();
            return { token, user: userResponse.data };
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Registration failed"
            );
        }
    }
);

// Async thunk for OTP verification
export const verifyOtp = createAsyncThunk(
    "auth/verifyOtp",
    async (data: { email: string; code: string }, { rejectWithValue }) => {
        try {
            const response = await authService.verifyOtp(data);
            const token = response.data.access_token;
            if (token) {
                tokenService.setToken(token);
            }
            // Fetch user after OTP verification
            const userResponse = await authService.me();
            return { token, user: userResponse.data };
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "OTP verification failed"
            );
        }
    }
);

// Async thunk for logout
export const logout = createAsyncThunk(
    "auth/logout",
    async (_, { dispatch }) => {
        // CRITICAL: Clear Redux state FIRST, before redirect
        // This prevents header from showing user info during logout
        dispatch(clearAuth());

        // Then call authService.logout() which handles redirect
        await authService.logout();
        // Redirect handled by authService
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<User | null>) => {
            state.user = action.payload;
            state.isAuthenticated = !!action.payload;
        },
        setToken: (state, action: PayloadAction<string | null>) => {
            state.token = action.payload;
            state.isAuthenticated = !!action.payload;
            if (action.payload) {
                tokenService.setToken(action.payload);
            } else {
                tokenService.removeToken();
            }
        },
        clearAuth: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = null;
            tokenService.removeToken();
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch user
            .addCase(fetchUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
                state.error = null;
            })
            .addCase(fetchUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                state.isAuthenticated = false;
                state.user = null;
            })
            // Login
            .addCase(login.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.token = action.payload.token;
                state.user = action.payload.user;
                state.isAuthenticated = true;
                state.error = null;
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                state.isAuthenticated = false;
            })
            // Register
            .addCase(register.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.isLoading = false;
                state.token = action.payload.token;
                state.user = action.payload.user;
                state.isAuthenticated = true;
                state.error = null;
            })
            .addCase(register.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                state.isAuthenticated = false;
            })
            // OTP Verification
            .addCase(verifyOtp.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(verifyOtp.fulfilled, (state, action) => {
                state.isLoading = false;
                state.token = action.payload.token;
                state.user = action.payload.user;
                state.isAuthenticated = true;
                state.error = null;
            })
            .addCase(verifyOtp.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                state.isAuthenticated = false;
            })
            // Logout
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                state.error = null;
            });
    },
});

export const { setUser, setToken, clearAuth, setLoading, setError } =
    authSlice.actions;
export default authSlice.reducer;
