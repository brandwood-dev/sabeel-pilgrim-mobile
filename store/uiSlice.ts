import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
    isBottomNavVisible: boolean;
    language: 'fr' | 'en' | 'ar';
    unreadMessagesCount: number;
}

const initialState: UIState = {
    isBottomNavVisible: true,
    language: 'fr',
    unreadMessagesCount: 0,
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setBottomNavVisibility: (state, action: PayloadAction<boolean>) => {
            state.isBottomNavVisible = action.payload;
        },
        setLanguage: (state, action: PayloadAction<'fr' | 'en' | 'ar'>) => {
            state.language = action.payload;
        },
        setUnreadMessagesCount: (state, action: PayloadAction<number>) => {
            state.unreadMessagesCount = Math.max(0, Number(action.payload) || 0);
        },
    },
});

export const { setBottomNavVisibility, setLanguage, setUnreadMessagesCount } = uiSlice.actions;
export default uiSlice.reducer;
