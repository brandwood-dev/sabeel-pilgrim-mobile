import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
    user: any | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
    resetToken: string | null;
}

const initialState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    resetToken: null,
};

// Actual API login thunk
export const login = createAsyncThunk(
    'auth/login',
    async (credentials: any, { rejectWithValue }) => {
        try {
            const response = await authApi.login(credentials);
            if (response.data.accessToken) {
                await AsyncStorage.setItem('token', response.data.accessToken);
            }
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Login failed';
            return rejectWithValue(message);
        }
    }
);

// Actual API signup thunk
export const signup = createAsyncThunk(
    'auth/signup',
    async (userData: any, { rejectWithValue }) => {
        try {
            const response = await authApi.signup(userData);
            if (response.data.accessToken) {
                await AsyncStorage.setItem('token', response.data.accessToken);
            }
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Signup failed';
            return rejectWithValue(message);
        }
    }
);

// Actual API profile update thunk
export const updateProfile = createAsyncThunk(
    'auth/updateProfile',
    async (updateData: any, { rejectWithValue }) => {
        try {
            const response = await authApi.updateProfile(updateData);
            const userFromResponse = response.data.user || response.data;
            // Merge what we sent with what the server returned for a more stable UI
            return { ...updateData, ...userFromResponse };
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Profile update failed';
            return rejectWithValue(message);
        }
    }
);

// Actual API upload photo thunk
export const uploadPhoto = createAsyncThunk(
    'auth/uploadPhoto',
    async (formData: FormData, { rejectWithValue }) => {
        try {
            const response = await authApi.uploadPhoto(formData);
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Photo upload failed';
            return rejectWithValue(message);
        }
    }
);

// Fetch current profile thunk
export const fetchProfile = createAsyncThunk(
    'auth/fetchProfile',
    async (_, { rejectWithValue }) => {
        try {
            const response = await authApi.getProfile();
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Failed to fetch profile';
            return rejectWithValue(message);
        }
    }
);

// Logout thunk
export const performLogout = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await authApi.logout();
            await AsyncStorage.removeItem('token');
            return true;
        } catch (error: any) {
            await AsyncStorage.removeItem('token');
            return rejectWithValue(error.message);
        }
    }
);

// Switch role thunk
export const switchRole = createAsyncThunk(
    'auth/switchRole',
    async (targetRole: string, { rejectWithValue }) => {
        try {
            const response = await authApi.switchRole(targetRole);
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Role switch failed';
            return rejectWithValue(message);
        }
    }
);

// Forgot password thunk
export const forgotPassword = createAsyncThunk(
    'auth/forgotPassword',
    async (email: string, { rejectWithValue }) => {
        try {
            const response = await authApi.forgotPassword(email);
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Failed to send OTP';
            return rejectWithValue(message);
        }
    }
);

// Verify OTP thunk
export const verifyOtp = createAsyncThunk(
    'auth/verifyOtp',
    async ({ token, otp }: { token: string; otp: string }, { rejectWithValue }) => {
        try {
            const response = await authApi.verifyOtp(token, otp);
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'OTP verification failed';
            return rejectWithValue(message);
        }
    }
);

// Reset password thunk
export const resetPassword = createAsyncThunk(
    'auth/resetPassword',
    async ({ token, data }: { token: string; data: any }, { rejectWithValue }) => {
        try {
            const response = await authApi.resetPassword(token, data);
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Password reset failed';
            return rejectWithValue(message);
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (
            state,
            action: PayloadAction<{ user: any; token: string }>
        ) => {
            const { user, token } = action.payload;
            state.user = user;
            state.token = token;
            state.isAuthenticated = true;
            state.loading = false;
            state.error = null;
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.loading = false;
            state.error = null;
            AsyncStorage.removeItem('token').catch(() => {});
        },
        clearError: (state) => {
            state.error = null;
        }
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
                state.token = action.payload.accessToken;
                state.isAuthenticated = true;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string || 'An error occurred';
            })
            .addCase(signup.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(signup.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.accessToken;
                state.isAuthenticated = true;
            })
            .addCase(signup.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string || 'An error occurred';
            })
            .addCase(updateProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.user = state.user 
                    ? { ...state.user, ...(action.payload.user || action.payload) } 
                    : (action.payload.user || action.payload);
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string || 'Profile update failed';
            })
            .addCase(fetchProfile.fulfilled, (state, action) => {
                state.user = state.user ? { ...state.user, ...action.payload } : action.payload;
                state.isAuthenticated = true;
                state.loading = false;
            })
            .addCase(uploadPhoto.fulfilled, (state, action) => {
                if (state.user) {
                    state.user.photo = action.payload.photoUrl;
                }
            })
            .addCase(performLogout.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                state.loading = false;
                state.error = null;
            })
            .addCase(performLogout.rejected, (state) => {
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                state.loading = false;
            })
            .addCase(switchRole.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(switchRole.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                if (action.payload.accessToken) {
                    state.token = action.payload.accessToken;
                    AsyncStorage.setItem('token', action.payload.accessToken).catch(() => { });
                }
            })
            .addCase(switchRole.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(forgotPassword.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(forgotPassword.fulfilled, (state, action) => {
                state.loading = false;
                state.resetToken = action.payload.resetToken;
            })
            .addCase(forgotPassword.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(verifyOtp.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(verifyOtp.fulfilled, (state, action) => {
                state.loading = false;
                state.resetToken = action.payload.resetToken;
            })
            .addCase(verifyOtp.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(resetPassword.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(resetPassword.fulfilled, (state) => {
                state.loading = false;
                state.resetToken = null;
            })
            .addCase(resetPassword.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
});

export const { setCredentials, logout, clearError } = authSlice.actions;

export default authSlice.reducer;

export const selectCurrentUser = (state: any) => state.auth.user;
export const selectCurrentToken = (state: any) => state.auth.token;
export const selectAuthLoading = (state: any) => state.auth.loading;
export const selectAuthError = (state: any) => state.auth.error;
