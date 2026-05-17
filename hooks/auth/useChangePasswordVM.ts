import { useState } from 'react';
import { authApi } from '../../data/repositories/common/authApi';

export const useChangePasswordVM = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleChangePassword = async () => {
        if (!newPassword || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await authApi.changePassword({ newPassword });
            setSuccessMessage('Password changed successfully.');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.message || 'Failed to change password');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        newPassword,
        setNewPassword,
        confirmPassword,
        setConfirmPassword,
        isLoading,
        error,
        successMessage,
        handleChangePassword,
    };
};
