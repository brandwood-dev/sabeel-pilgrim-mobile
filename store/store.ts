import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import reviewsReducer from './reviewsSlice';
import themeReducer from './themeSlice';
import umrahReducer from './umrahSlice';
import uiReducer from './uiSlice';
import salatReducer from './salatSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        umrah: umrahReducer,
        reviews: reviewsReducer,
        theme: themeReducer,
        ui: uiReducer,
        salat: salatReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
