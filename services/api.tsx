import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SERVER_BASE_URL = 'http://192.168.1.100:3001';
const API_BASE_URL = `${SERVER_BASE_URL}/sabeel`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add a request interceptor to add the JWT token to headers
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authApi = {
  signup: (data: any) => api.post('/auth/signup', data),
  login: (data: any) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.patch('/auth/update-profile', data),
  uploadPhoto: (formData: FormData) => api.post('/auth/upload-photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  verifyOtp: (token: string, otp: string) =>
    api.post('/auth/verify-otp', { otp }, { headers: { Authorization: `Bearer ${token}` } }),
  resetPassword: (token: string, data: any) =>
    api.post('/auth/change-password', data, { headers: { Authorization: `Bearer ${token}` } }),
  logout: () => api.post('/auth/logout'),
  updatePassword: (data: any) => api.post('/auth/update-password', data),
  switchRole: (targetRole: string) => api.post('/auth/switch-role', { targetRole }),
  findPilgrimByIdentifier: (identifier: string) => api.get(`/auth/pilgrim/${identifier}`),
  linkPilgrimToAccompagnant: (identifier: string) => api.post('/auth/accompagnant/link-pilgrim', { identifier }),
  getMyAccompaniedPilgrim: () => api.get('/auth/accompagnant/my-pilgrim'),
  sendSupportMessage: (message: string) => api.post('/auth/support', { message }),
};

export const documentsApi = {
  /**
   * Upload a document image for KYC verification.
   * type: 'cin_recto' | 'cin_verso' | 'passport'
   */
  upload: (type: 'cin_recto' | 'cin_verso' | 'passport', imageUri: string) => {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `${type}-${Date.now()}.jpg`,
    } as any);
    return api.post(`/documents/upload/${type}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });
  },

  /** Get all documents for the authenticated user. */
  getMyDocuments: () => api.get('/documents/my'),

  /** Get document upload status (uploaded vs required). */
  getStatus: () => api.get('/documents/status'),
};

export const amadeusApi = {
  searchFlightsToSaudi: (origin: string, date: string) =>
    api.get(`/amadeus/flights/to-saudi`, { params: { origin, date } }),

  searchHotels: (city: string) =>
    api.get(`/amadeus/hotels/city`, { params: { city } }),

  searchHotelsByGeocode: (lat: number, lng: number, radius = 20) =>
    api.get(`/amadeus/hotels/geocode`, { params: { lat, lng, radius } }),

  getPointsOfInterest: (lat: number, lng: number) =>
    api.get(`/amadeus/pois`, { params: { lat, lng } }),

  getHotelOffers: (hotelIds: string) =>
    api.get(`/amadeus/hotels/offers`, { params: { hotelIds } }),
};

const GUIDE_API_BASE_URL = `${SERVER_BASE_URL}/sabeel-guide/auth/public/guides`;
const guideInstance = axios.create({ baseURL: GUIDE_API_BASE_URL, timeout: 8000 });

const PACK_API_BASE_URL = `${SERVER_BASE_URL}/admin-agence/pack-umrah`;
const packInstance = axios.create({
  baseURL: PACK_API_BASE_URL,
  timeout: 15000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

const AGENCY_API_BASE_URL = `${SERVER_BASE_URL}/admin-agence/auth/public/agencies`;
const agencyInstance = axios.create({
  baseURL: AGENCY_API_BASE_URL,
  timeout: 15000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

export const guideApi = {
  getAllGuides: (search?: string, role?: 'freelance' | 'agency') =>
    guideInstance.get('', { params: { search, role } }),
  getGuideById: (id: string) => guideInstance.get(`/${id}`),
};

export const packApi = {
  getPublicPacks: () => axios.get(`${SERVER_BASE_URL}/admin-agence/pack-umrah/public/list`, { timeout: 15000 }),
  getPublicPackById: (id: string) => axios.get(`${SERVER_BASE_URL}/admin-agence/pack-umrah/public/${id}`, { timeout: 15000 }),
};

export const agencyApi = {
  getPublicAgencyById: (id: string) => agencyInstance.get(`/${id}`),
  listPublicAgencies: () => axios.get(`${SERVER_BASE_URL}/admin-agence/auth/public/agencies`, { timeout: 15000 }),
};

export const reservationApi = {
  createReservation: (data: any) => api.post('/reservations', data),
  createGuideReservation: (data: { guideId: string; reservationDate?: string; pilgrimCount: number; paymentType?: string; paymentMode?: string; specialRequests?: string; userName?: string; userEmail?: string; userPhone?: string; userAge?: string; hasDisease?: string; medications?: string; }) => api.post('/reservations/guide', data),
  getMyReservations: () => api.get('/reservations/mine'),
  getAgencyReservations: () => api.get(`${SERVER_BASE_URL}/sabeel/reservations/agency`),
  getGuideReservations: () => api.get('/reservations/guide'),
  acceptReservation: (reservationId: string) => api.post(`/reservations/${reservationId}/accept`),
  rejectReservation: (reservationId: string) => api.post(`/reservations/${reservationId}/reject`),
  acceptGuideReservation: (reservationId: string) => api.post(`/reservations/${reservationId}/accept-guide`),
  rejectGuideReservation: (reservationId: string) => api.post(`/reservations/${reservationId}/reject-guide`),
};

export const walletApi = {
  getMe: () => api.get('/wallet/me'),
  listTransactions: (params: { limit?: number; offset?: number }) =>
    api.get('/wallet/transactions', { params }),
  requestWithdrawal: (payload: { amountCents: number; idempotencyKey: string }) =>
    api.post('/wallet/withdrawal/request', payload),
};

export const paymentsApi = {
  connectOnboardingLink: (payload: { ownerType: 'GUIDE' | 'AGENCY' }) =>
    api.post('/payments/connect/onboarding-link', payload),
  connectStatus: () => api.get('/payments/connect/status'),
  createTopupIntent: (payload: {
    amountCents: number;
    referenceType: string;
    referenceId: string;
    idempotencyKey: string;
  }) => api.post('/payments/topup/create-intent', payload),
  createDirectIntent: (payload: {
    amountCents: number;
    recipientType: 'GUIDE' | 'AGENCY';
    recipientId: string;
    referenceType: string;
    referenceId: string;
    idempotencyKey: string;
  }) => api.post('/payments/direct/create-intent', payload),
  walletPay: (payload: {
    totalAmountCents: number;
    recipientType: 'GUIDE' | 'AGENCY';
    recipientId: string;
    referenceType: string;
    referenceId: string;
    idempotencyKey: string;
  }) => api.post('/payments/wallet-pay', payload),
};

export const messagingApi = {
  getMyConversations: () => api.get(`${SERVER_BASE_URL}/messaging/conversations`),
  getConversationById: (conversationId: string, params?: { limit?: number }) =>
    api.get(`${SERVER_BASE_URL}/messaging/conversations/${conversationId}`, { params }),
  sendMessage: (conversationId: string, data: { content: string }) => api.post(`${SERVER_BASE_URL}/messaging/conversations/${conversationId}/messages`, data),
  getArchivedConversations: () => api.get(`${SERVER_BASE_URL}/messaging/conversations/archived`),
  archiveConversation: (conversationId: string) => api.post(`${SERVER_BASE_URL}/messaging/conversations/${conversationId}/archive`, {}),
  unarchiveConversation: (conversationId: string) => api.post(`${SERVER_BASE_URL}/messaging/conversations/${conversationId}/unarchive`, {}),
  deleteConversation: (conversationId: string) => api.delete(`${SERVER_BASE_URL}/messaging/conversations/${conversationId}`),
  createCompanionConversation: (targetType: 'pelerin' | 'agence' | 'guide', targetId: string) =>
    api.post(`${SERVER_BASE_URL}/messaging/conversations/companion`, { targetType, targetId }),
};

export const trackingApi = {
  upsertMyPosition: (data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    deviceTimestamp?: string;
  }) => api.post(`${SERVER_BASE_URL}/tracking/positions`, data),
  stopSharingMyPosition: () => api.post(`${SERVER_BASE_URL}/tracking/positions/stop`, {}),
  getPilgrimLastPosition: (pilgrimUserId: string) =>
    api.get(`${SERVER_BASE_URL}/tracking/pilgrim/${pilgrimUserId}/last-position`),
  getMyGuideLastPosition: () =>
    api.get(`${SERVER_BASE_URL}/tracking/pilgrim/me/guide-last-position`),
  upsertMyGuidePosition: (data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    deviceTimestamp?: string;
  }) => api.post(`${SERVER_BASE_URL}/tracking/guide/positions`, data),
};

export const reviewsApi = {
  createReview: (data: any) => api.post('/reviews', data),
  getMyReviews: () => api.get('/reviews/mine'),
  getAllReviews: () => api.get('/reviews'),
  deleteReview: (id: string) => api.delete(`/reviews/${id}`),
  feed: (params?: { targetType?: 'AGENCE' | 'GUIDE'; limit?: number; offset?: number }) =>
    api.get('/reviews/feed', { params }),
  listByTarget: (params: { targetType: 'AGENCE' | 'GUIDE'; targetId: string }) =>
    api.get('/reviews/target', { params }),
  summaryByTarget: (params: { targetType: 'AGENCE' | 'GUIDE'; targetId: string }) =>
    api.get('/reviews/target/summary', { params }),
};

export const notificationsApi = {
  listMine: (params?: { limit?: number; offset?: number }) =>
    api.get(`${SERVER_BASE_URL}/notifications/me`, { params }),
  markRead: (id: string) => api.patch(`${SERVER_BASE_URL}/notifications/${id}/read`, {}),
  markAllRead: () => api.post(`${SERVER_BASE_URL}/notifications/me/mark-all-read`, {}),
  clearAll: () => api.delete(`${SERVER_BASE_URL}/notifications/me`),
};

export const sosApi = {
  getMySosContacts: () => api.get(`${SERVER_BASE_URL}/sos/me/contacts`),
};

export default api;
