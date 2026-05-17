import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SalatState {
    timings: any | null;
    lastFetchedDate: string | null;
    locationName: string;
}

const initialState: SalatState = {
    timings: null,
    lastFetchedDate: null,
    locationName: 'Localisation...',
};

const salatSlice = createSlice({
    name: 'salat',
    initialState,
    reducers: {
        setPrayerTimes: (state, action: PayloadAction<{ timings: any, date: string, location: string }>) => {
            state.timings = action.payload.timings;
            state.lastFetchedDate = action.payload.date;
            state.locationName = action.payload.location;
        },
        clearCache: (state) => {
            state.timings = null;
            state.lastFetchedDate = null;
        }
    },
});

export const { setPrayerTimes, clearCache } = salatSlice.actions;
export default salatSlice.reducer;
