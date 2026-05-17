
export interface Reservation {
    id: string;
    packTitle: string;
    agencyName: string;
    status: 'en_attente' | 'validee' | 'annulee';
    date: string;
    price: string;
    image: any;
    progress: number;
    details: {
        visa: 'done' | 'pending' | 'todo';
        flight: 'done' | 'pending' | 'todo';
        hotel: 'done' | 'pending' | 'todo';
        payment: 'done' | 'pending' | 'todo';
    };
    missingDocuments?: string[];
    timeline?: Array<{
        title: string;
        date: string;
        status: 'done' | 'active' | 'pending';
        icon: string;
    }>;
}

export const reservationService = {
    // Fetch all reservations for the current user
    getReservations: async (): Promise<Reservation[]> => {
        // En attente d'intégration avec l'API réelle
        return [];
    },

    // Get details for a specific reservation
    getReservationById: async (id: string): Promise<Reservation | null> => {
        // const response = await api.get(`/reservations/${id}`);
        // return response.data;

        const reservations = await reservationService.getReservations();
        return reservations.find(r => r.id === id) || null;
    }
};
