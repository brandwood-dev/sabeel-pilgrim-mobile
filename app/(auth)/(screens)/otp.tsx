import React, { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, ImageBackground, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../../components/ui/Button';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { verifyOtp, clearError } from '../../../store/authSlice';
import { AppDispatch, RootState } from '../../../store/store';
import { CustomAlert } from '../../../components/ui/CustomAlert';

export default function OtpScreen() {
    const [otp, setOtp] = useState('');
    const [alert, setAlert] = useState<{ visible: boolean; title: string; message: string; type: 'success' | 'error' }>({
        visible: false,
        title: '',
        message: '',
        type: 'success'
    });
    const router = useRouter();
    const { email } = useLocalSearchParams<{ email: string }>();
    const dispatch = useDispatch<AppDispatch>();
    const { loading, resetToken } = useSelector((state: RootState) => state.auth);

    const inputRefs = useRef<Array<TextInput | null>>([]);

    const handleInputChange = (text: string, index: number) => {
        if (text.length > 1) {
            text = text[text.length - 1];
        }

        const otpArray = otp.padEnd(4, ' ').split('');
        otpArray[index] = text;
        const newPin = otpArray.join('').trim();
        setOtp(newPin);

        if (text && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                const otpArray = otp.padEnd(4, ' ').split('');
                otpArray[index - 1] = ' '; 
                setOtp(otpArray.join('').trim());
                inputRefs.current[index - 1]?.focus();
            }
        }
    };

    const handleVerify = async () => {
        if (otp.length < 4) {
            setAlert({
                visible: true,
                title: 'Erreur',
                message: 'Veuillez entrer le code à 4 chiffres',
                type: 'error'
            });
            return;
        }

        if (!resetToken) {
            setAlert({
                visible: true,
                title: 'Erreur',
                message: 'Session expirée, veuillez recommencer',
                type: 'error'
            });
            setTimeout(() => {
                router.replace('/forgot-password' as any);
            }, 1500);
            return;
        }

        const resultAction = await dispatch(verifyOtp({ token: resetToken, otp }));
        if (verifyOtp.fulfilled.match(resultAction)) {
            router.push('/change-password' as any);
        } else {
            setAlert({
                visible: true,
                title: 'Erreur',
                message: resultAction.payload as string || 'Code invalide',
                type: 'error'
            });
        }
    };

    return (
        <View style={styles.container}>
            <ImageBackground
                source={require('../../../assets/images/back.png')}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
            />
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                >
                    <ScrollView 
                        contentContainerStyle={{ flexGrow: 1, paddingTop: 40, paddingHorizontal: 24, paddingBottom: 40 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../../../assets/images/logText.jpg')}
                                style={styles.logo}
                            />
                        </View>

                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.title}>Vérification</Text>
                                <Text style={styles.subtitle}>Un code a été envoyé à {email}</Text>
                            </View>

                            <View style={styles.inputContainer}>
                                {[0, 1, 2, 3].map((_, index) => {
                                    const digit = otp[index] || '';
                                    return (
                                        <TextInput
                                            key={index}
                                            ref={(ref) => { inputRefs.current[index] = ref; }}
                                            style={[
                                                styles.input,
                                                digit !== ' ' && digit !== '' ? styles.inputFilled : null,
                                            ]}
                                            maxLength={1}
                                            keyboardType="number-pad"
                                            value={digit}
                                            onChangeText={(value) => handleInputChange(value, index)}
                                            onKeyPress={(e) => handleKeyPress(e, index)}
                                            selectTextOnFocus
                                            selectionColor="#2C5F2D"
                                        />
                                    );
                                })}
                            </View>

                            <Button
                                title="Vérifier"
                                onPress={handleVerify}
                                loading={loading}
                                style={styles.button}
                            />

                            <View style={styles.footer}>
                                <TouchableOpacity onPress={() => router.back()}>
                                    <Text style={styles.resendText}>Modifier l'email</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>

            <CustomAlert 
                visible={alert.visible}
                title={alert.title}
                message={alert.message}
                type={alert.type}
                onClose={() => setAlert({ ...alert, visible: false })}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 0,
        marginBottom: -20,
    },
    logo: {
        width: 150,
        height: 150,
        resizeMode: 'contain',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 24,
        shadowColor: '#1a472a',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#2C5F2D',
        alignItems: 'center',
    },
    cardHeader: {
        marginBottom: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 6,
        color: '#1a472a',
    },
    subtitle: {
        fontSize: 13,
        color: '#6B8E23',
        fontWeight: '600',
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 24,
    },
    input: {
        width: 50,
        height: 50,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
        backgroundColor: '#F9F9F9',
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2C5F2D',
    },
    inputFilled: {
        backgroundColor: '#FFFFFF',
        borderColor: '#2C5F2D',
    },
    button: {
        width: '100%',
    },
    footer: {
        marginTop: 16,
    },
    resendText: {
        color: '#2C5F2D',
        fontWeight: 'bold',
        fontSize: 13,
        textDecorationLine: 'underline',
    },
});
