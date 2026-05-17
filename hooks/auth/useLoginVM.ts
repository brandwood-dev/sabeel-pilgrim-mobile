import { login, selectAuthError, selectAuthLoading } from '@/store/authSlice';
import { AppDispatch } from '@/store/store';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export const useLoginVM = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();

    const isLoading = useSelector(selectAuthLoading);
    const error = useSelector(selectAuthError);

    const handleLogin = async () => {
        if (!email || !password) {
            return;
        }

        try {
            const resultAction = await dispatch(login({ email, password }));
            if (login.fulfilled.match(resultAction)) {
                const user = resultAction.payload.user;
                const role = user?.activeRole;
                
                const targetPath = role === 'accompagnant' 
                    ? '/(accampagnant)/home' 
                    : '/(umrah_agence)/(screens)/acceuil';
                    
                router.replace(targetPath as any);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return {
        email,
        setEmail,
        password,
        setPassword,
        isLoading,
        error,
        handleLogin,
    };
};
