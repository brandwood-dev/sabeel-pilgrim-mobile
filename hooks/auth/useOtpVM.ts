import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { authApi } from '../../data/repositories/common/authApi';

export const useOtpVM = () => {
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { email } = useLocalSearchParams<{ email: string }>();

    const handleVerifyOtp = async () => {
        if (!otp) {
            setError('Please enter the OTP code');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await authApi.verifyOtp(email || '', otp);
            // Navigate to Change Password on success
            router.push({
                pathname: '/change-password',
                params: { email, otp } // Pass context if needed
            });
        } catch (err: any) {
            setError(err.message || 'Invalid OTP code');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        otp,
        setOtp,
        isLoading,
        error,
        handleVerifyOtp,
    };
};
