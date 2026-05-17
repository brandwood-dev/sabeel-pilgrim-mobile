import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Vibration } from 'react-native';
import { authApi } from '../../data/repositories/common/authApi';

export type RegisterStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type OmraType = 'individuelle' | 'agence';

export const useRegisterVM = () => {
    const router = useRouter();

    // Steps
    const [step, setStep] = useState<RegisterStep>(1);

    // Step 1: Role Selection
    const [role, setRole] = useState<'pelerin' | 'guide' | 'accampagnant' | null>(null);

    // Step 2: Omra Type (Only for Pelerin)
    const [omraType, setOmraType] = useState<OmraType | null>(null);

    // Step 3 & 4: Email
    const [email, setEmail] = useState('');
    const [emailOtp, setEmailOtp] = useState('');
    const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
    const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);

    // Step 5 & 6: Phone
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneOtp, setPhoneOtp] = useState('');
    const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);
    const [isVerifyingPhoneOtp, setIsVerifyingPhoneOtp] = useState(false);

    // Step 6: Password
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Step 7: Personal Info
    const [fullName, setFullName] = useState(''); // Nom
    const [firstName, setFirstName] = useState(''); // Prenom
    const [birthDate, setBirthDate] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false); // New state
    const [address, setAddress] = useState('');
    const [country, setCountry] = useState('');
    const [nationality, setNationality] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);

    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || new Date();
        setShowDatePicker(Platform.OS === 'ios');
        // Format to DD/MM/YYYY
        const day = currentDate.getDate().toString().padStart(2, '0');
        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        const year = currentDate.getFullYear();
        setBirthDate(`${day}/${month}/${year}`);

        if (Platform.OS !== 'ios') {
            setShowDatePicker(false);
        }
    };

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Timer
    const [timer, setTimer] = useState(60);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    useEffect(() => {
        let interval: any;
        if (isTimerRunning && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0 && isTimerRunning) {
            setIsTimerRunning(false);
            Vibration.vibrate(); // Vibrate when timer hits 0
        } else if (timer === 0) {
            setIsTimerRunning(false);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timer]);

    // --- Actions ---

    // Step 1: Role Selection
    const selectRole = (selectedRole: 'pelerin' | 'guide' | 'accampagnant') => {
        setRole(selectedRole);
        setStep(2); // Go to Email
    };

    // Step 2 Logic
    const selectOmraType = (type: OmraType) => {
        setOmraType(type);
        setStep(3); // Go to Email
    };

    // Step 2: Send Email OTP
    const handleSendEmailOtp = async () => {
        if (!email.includes('@')) {
            setError('Email invalide');
            return;
        }
        setIsSendingEmailOtp(true);
        setError(null);
        try {
            // Mock send OTP
            await new Promise(resolve => setTimeout(resolve, 1000));
            setTimer(60);
            setIsTimerRunning(true);
            setStep(3);
        } catch (err) {
            setError('Erreur lors de l\'envoi du code');
        } finally {
            setIsSendingEmailOtp(false);
        }
    };

    // Step 3: Verify Email OTP
    const handleVerifyEmailOtp = async () => {
        if (timer === 0) {
            setError('Code expiré. Veuillez renvoyer le code.');
            return;
        }
        if (emailOtp.length < 4) {
            setError('Code invalide');
            return;
        }
        setIsVerifyingEmailOtp(true);
        setError(null);
        try {
            // Mock verify OTP
            await new Promise(resolve => setTimeout(resolve, 1000));
            setIsTimerRunning(false); // Stop timer on success
            setStep(4);
        } catch (err) {
            setError('Code incorrect');
        } finally {
            setIsVerifyingEmailOtp(false);
        }
    };

    const handleResendEmailOtp = async () => {
        setTimer(60);
        setIsTimerRunning(true);
        setError(null);
        // Simulate resend
        handleSendEmailOtp();
    };


    // Step 4: Send Phone OTP
    const handleSendPhoneOtp = async () => {
        if (phoneNumber.length < 8) {
            setError('Numéro invalide');
            return;
        }
        setIsSendingPhoneOtp(true);
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setTimer(60);
            setIsTimerRunning(true);
            setStep(5);
        } catch (err) {
            setError('Erreur lors de l\'envoi du code');
        } finally {
            setIsSendingPhoneOtp(false);
        }
    };

    // Step 5: Verify Phone OTP
    const handleVerifyPhoneOtp = async () => {
        if (timer === 0) {
            setError('Code expiré. Veuillez renvoyer le code.');
            return;
        }
        if (phoneOtp.length < 4) {
            setError('Code invalide');
            return;
        }
        setIsVerifyingPhoneOtp(true);
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setIsTimerRunning(false); // Stop timer
            setStep(6);
        } catch (err) {
            setError('Code incorrect');
        } finally {
            setIsVerifyingPhoneOtp(false);
        }
    };

    const handleResendPhoneOtp = async () => {
        setTimer(60);
        setIsTimerRunning(true);
        setError(null);
        handleSendPhoneOtp();
    };

    // Step 6: Validate Password and Go Next
    const handlePasswordNext = () => {
        if (!password || password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }
        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }
        setError(null);
        setStep(7);
    };

    // Step 7: Final Registration
    const handleRegister = async () => {
        if (!acceptTerms) {
            setError('Veuillez accepter les conditions');
            return;
        }
        if (!fullName || !firstName || !birthDate || !address || !country || !nationality) {
            setError('Merci de remplir tous les champs');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const data = {
                role,
                omraType: role === 'pelerin' ? omraType : undefined,
                email,
                phoneNumber,
                password,
                fullName,
                firstName,
                birthDate,
                address,
                country,
                nationality
            };
            await authApi.register(data);
            router.replace('/(auth)/(screens)/login');
        } catch (err: any) {
            setError(err.message || 'Inscription échouée');
        } finally {
            setIsLoading(false);
        }
    };

    // Navigation helpers
    const prevStep = () => {
        if (step > 1) {
            if (step === 3 && role !== 'pelerin') {
                setStep(1); // Skip Omra Type if not Pelerin
            } else {
                setStep((s) => (s - 1) as RegisterStep);
            }
            setError(null);
        }
    };

    return {
        step,
        role, selectRole,
        omraType, selectOmraType,

        email, setEmail,
        emailOtp, setEmailOtp,
        isSendingEmailOtp, handleSendEmailOtp,
        isVerifyingEmailOtp, handleVerifyEmailOtp, handleResendEmailOtp,

        phoneNumber, setPhoneNumber,
        phoneOtp, setPhoneOtp,
        isSendingPhoneOtp, handleSendPhoneOtp,
        isVerifyingPhoneOtp, handleVerifyPhoneOtp, handleResendPhoneOtp,

        password, setPassword,
        confirmPassword, setConfirmPassword,
        handlePasswordNext,

        fullName, setFullName,
        firstName, setFirstName,
        birthDate, setBirthDate,
        address, setAddress,
        country, setCountry,
        nationality, setNationality,
        acceptTerms, setAcceptTerms,
        showDatePicker, setShowDatePicker, onDateChange, // Export new props

        isLoading,
        error,
        timer, // Export timer
        handleRegister,
        prevStep
    };
};
