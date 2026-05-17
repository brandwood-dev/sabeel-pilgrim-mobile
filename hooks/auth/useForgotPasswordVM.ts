import { useState } from 'react';
import { AuthRepositoryImpl } from '../../data/repositories/AuthRepositoryImpl';

export const useForgotPasswordVM = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const authRepository = new AuthRepositoryImpl();

    const handleForgotPassword = async () => {
        if (!email) {
            setError('Please enter your email');
            return;
        }
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await authRepository.forgotPassword(email);
            setSuccessMessage('Password reset link sent to your email.');
        } catch (err: any) {
            setError(err.message || 'Failed to send reset link');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        email,
        setEmail,
        isLoading,
        error,
        successMessage,
        handleForgotPassword,
    };
};
