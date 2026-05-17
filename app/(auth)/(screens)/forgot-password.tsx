import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View, ImageBackground, Image, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useDispatch, useSelector } from 'react-redux';
import { forgotPassword, clearError } from '../../../store/authSlice';
import { AppDispatch, RootState } from '../../../store/store';
import { CustomAlert } from '../../../components/ui/CustomAlert';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [alert, setAlert] = useState<{ visible: boolean; title: string; message: string; type: 'success' | 'error' }>({
        visible: false,
        title: '',
        message: '',
        type: 'success'
    });
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error } = useSelector((state: RootState) => state.auth);

    const handleForgotPassword = async () => {
        if (!email) {
            setAlert({
                visible: true,
                title: 'Erreur',
                message: 'Veuillez entrer votre email',
                type: 'error'
            });
            return;
        }
        
        const resultAction = await dispatch(forgotPassword(email));
        if (forgotPassword.fulfilled.match(resultAction)) {
            router.push({
                pathname: '/otp' as any,
                params: { email }
            });
        } else {
            setAlert({
                visible: true,
                title: 'Erreur',
                message: resultAction.payload as string || 'Une erreur est survenue',
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
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../../../assets/images/logText.jpg')}
                                style={styles.logo}
                            />
                        </View>

                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.title}>Réinitialiser</Text>
                                <Text style={styles.subtitle}>Saisissez votre e-mail pour recevoir un code</Text>
                            </View>

                            <View style={styles.formContainer}>
                                <Input
                                    label="Email"
                                    placeholder="votre@email.com"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />

                                <Button
                                    title="Envoyer le code"
                                    onPress={handleForgotPassword}
                                    loading={loading}
                                    style={styles.button}
                                />

                                <View style={styles.footer}>
                                    <Link href="/login" asChild>
                                        <TouchableOpacity>
                                            <Text style={styles.linkText}>Retour à la connexion</Text>
                                        </TouchableOpacity>
                                    </Link>
                                </View>
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
        marginTop: 0,
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
        lineHeight: 18,
    },
    formContainer: {
        gap: 4,
    },
    footer: {
        marginTop: 16,
        alignItems: 'center',
    },
    linkText: {
        color: '#2C5F2D',
        fontWeight: 'bold',
        fontSize: 13,
        textDecorationLine: 'underline',
    },
    button: {
        marginTop: 10,
    },
});
