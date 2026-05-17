import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UmrahPack {
    id: string;
    agencyName: string;
    agencyLogo: string | null; // Keep as URL string
    title: string;
    date: string;
    price: number;
    rating: number;
    image: string | null; // Keep as URL string
    features: string[];
}

interface Hotel {
    id: string;
    name: string;
    location: string;
    rating: number;
    price: number;
    image: string | null; // Keep as URL string
    distance: string;
    amenities: string[];
    latitude: number;
    longitude: number;
    description?: string;
    images?: string[]; // Keep as URL strings
    partnerUrl?: string;
}

interface GuideFavorite {
    id: string;
    firstName?: string;
    lastName?: string;
    languages?: string[];
    experience?: number;
    pricePerDay?: number;
    specialties?: string[];
    location?: string;
    photoUrl?: string | null;
}

interface UmrahState {
    selectedCategory: string | null;
    favorites: UmrahPack[];
    hotelFavorites: Hotel[];
    guideFavorites: GuideFavorite[];
}

const initialState: UmrahState = {
    selectedCategory: null,
    favorites: [],
    hotelFavorites: [],
    guideFavorites: [],
};

const umrahSlice = createSlice({
    name: 'umrah',
    initialState,
    reducers: {
        setCategory(state, action: PayloadAction<string>) {
            state.selectedCategory = action.payload;
        },
        clearCategory(state) {
            state.selectedCategory = null;
        },
        toggleFavorite(state, action: PayloadAction<UmrahPack>) {
            const index = state.favorites.findIndex(pack => pack.id === action.payload.id);
            if (index >= 0) {
                state.favorites.splice(index, 1);
            } else {
                state.favorites.push(action.payload);
            }
        },
        toggleHotelFavorite(state, action: PayloadAction<Hotel>) {
            const index = state.hotelFavorites.findIndex(hotel => hotel.id === action.payload.id);
            if (index >= 0) {
                state.hotelFavorites.splice(index, 1);
            } else {
                state.hotelFavorites.push(action.payload);
            }
        },

        toggleGuideFavorite(state, action: PayloadAction<GuideFavorite>) {
            const index = state.guideFavorites.findIndex(guide => guide.id === action.payload.id);
            if (index >= 0) {
                state.guideFavorites.splice(index, 1);
            } else {
                state.guideFavorites.push(action.payload);
            }
        },
    },
});

export const { setCategory, clearCategory, toggleFavorite, toggleHotelFavorite, toggleGuideFavorite } = umrahSlice.actions;
export default umrahSlice.reducer;
