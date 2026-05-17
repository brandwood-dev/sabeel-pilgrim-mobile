import { authApi } from '../../services/api';

export class AuthRepositoryImpl {
    async forgotPassword(email: string) {
        try {
            const response = await authApi.forgotPassword(email);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || error.message || 'Forgot password request failed');
        }
    }

    async register(data: any) {
        try {
            const response = await authApi.signup(data);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || error.message || 'Registration failed');
        }
    }
}

