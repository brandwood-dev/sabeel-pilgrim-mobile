export interface Hotel {
    id: string;
    name: string;
    location: string;
    rating: number;
    price: number;
    image: any;
    distance: string;
    amenities: string[];
    latitude: number;
    longitude: number;
    description?: string;
    images?: any[];
    partnerUrl?: string;
}

export interface Room {
    id: string;
    type: string;
    capacity: number;
    price: number;
    features: string[];
    image: any;
    available: boolean;
}

export const KAABA_COORDINATES = {
    latitude: 21.4225,
    longitude: 39.8262
};

export const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

export default function DummyTypes() { return null; }
