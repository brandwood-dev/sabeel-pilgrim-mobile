import { createSlice } from '@reduxjs/toolkit';

interface ThemeState {
    isDarkMode: boolean;
}

const initialState: ThemeState = {
    isDarkMode: false,
};

const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        toggleTheme: (state) => {
            state.isDarkMode = !state.isDarkMode;
        },
        setDarkMode: (state, action) => {
            state.isDarkMode = action.payload;
        },
    },
});

export const { toggleTheme, setDarkMode } = themeSlice.actions;
export default themeSlice.reducer;
