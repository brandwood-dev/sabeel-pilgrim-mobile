import { Ionicons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Link, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View, ImageBackground, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useLoginVM } from '../../../hooks/auth/useLoginVM';
import { CustomAlert } from '../../../components/ui/CustomAlert';
import { useDispatch } from 'react-redux';
import { clearError } from '../../../store/authSlice';
import { AppDispatch } from '../../../store/store';
import { useIsFocused } from '@react-navigation/native';

import { useTrans } from '../../../hooks/useTrans';

export default function LoginScreen() {
    const { email, setEmail, password, setPassword, isLoading, error, handleLogin } = useLoginVM();
    const router = useRouter();
    const { t, language } = useTrans();
    const dispatch = useDispatch<AppDispatch>();
    const isFocused = useIsFocused();
    const [showPassword, setShowPassword] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const passwordRef = React.useRef<TextInput>(null);

    const isRTL = language === 'ar';

    useEffect(() => {
        // Only show alert if screen is focused and there's an error
        if (error && isFocused) {
            setAlertVisible(true);
        }
    }, [error, isFocused]);

    const handleCloseAlert = () => {
        setAlertVisible(false);
        dispatch(clearError());
    };

    // Make error message more user-friendly
    const getFriendlyErrorMessage = (err: string) => {
        if (!err) return '';
        if (err.toLowerCase().includes('unauthorized') || err.toLowerCase().includes('invalid')) {
            return t('Email ou mot de passe incorrect. Veuillez vérifier vos informations.');
        }
        return err;
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
                        contentContainerStyle={{ flexGrow: 1, paddingTop: 20, paddingHorizontal: 24, paddingBottom: 40 }}
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
                                <Text style={styles.title}>{t('Bienvenue')}</Text>
                                <Text style={styles.subtitle}>{t('Connectez-vous pour continuer')}</Text>
                            </View>

                            <View style={styles.formContainer}>
                                <Input
                                    label={t("Email")}
                                    placeholder="votre@email.com"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    returnKeyType="next"
                                    onSubmitEditing={() => passwordRef.current?.focus()}
                                    blurOnSubmit={false}
                                    style={{ textAlign: isRTL ? 'right' : 'left' }}
                                />

                                <Input
                                    ref={passwordRef}
                                    label={t("Mot de passe")}
                                    placeholder="••••••••"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    returnKeyType="done"
                                    onSubmitEditing={handleLogin}
                                    style={{ textAlign: isRTL ? 'right' : 'left' }}
                                    rightIcon={
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                            <Ionicons 
                                                name={showPassword ? "eye-off" : "eye"} 
                                                size={22} 
                                                color="#2C5F2D" 
                                            />
                                        </TouchableOpacity>
                                    }

                                />

                                <View style={[styles.optionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                    <View style={{ flex: 1 }} />
                                    <Link href="/forgot-password" asChild>
                                        <TouchableOpacity>
                                            <Text style={styles.forgotPasswordText}>{t('Mot de passe oublié ?')}</Text>
                                        </TouchableOpacity>
                                    </Link>
                                </View>

                                <Button
                                    title={t("Se connecter")}
                                    onPress={handleLogin}
                                    loading={isLoading}
                                    style={styles.button}
                                />

                                <View style={[styles.dividerContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                    <View style={styles.dividerLine} />
                                    <Text style={styles.dividerText}>{t('OU')}</Text>
                                    <View style={styles.dividerLine} />
                                </View>

                                <View style={[styles.footer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                    <Text style={styles.footerText}>{t("Vous n'avez pas de compte ? ")}</Text>
                                    <Link href="/register" asChild>
                                        <TouchableOpacity>
                                            <Text style={styles.linkText}>{t("S'inscrire")}</Text>
                                        </TouchableOpacity>
                                    </Link>
                                </View>
                            </View>
                        </View>

                        <View style={styles.quoteContainer}>
                            <Text style={styles.quoteText}>
                                ﴿وَمَا أُمِرُوا إِلَّا لِيَعْبُدُوا اللَّهَ مُخْلِصِينَ لَهُ الدِّينَ﴾
                            </Text>
                            <Text style={styles.quoteReference}>— سورة البينة ٥</Text>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>

            <CustomAlert 
                visible={alertVisible}
                title={t("Erreur de connexion")}
                message={getFriendlyErrorMessage(error || '')}
                type="error"
                onClose={handleCloseAlert}
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
        marginBottom: -18,
    },
    logo: {
        width: 160,
        height: 160,
        resizeMode: 'contain',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 20,
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
        marginBottom: 13,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 4,
        color: '#1a472a',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 13,
        color: '#6B8E23',
        fontWeight: '600',
        letterSpacing: 0.2,
        opacity: 0.8,
    },
    formContainer: {
        gap: 0,
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 12,
        marginTop: 4,
    },
    forgotPasswordText: {
        color: '#4A7C59',
        fontSize: 12,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    button: {
        marginTop: 5,
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#6B8E23',
        fontSize: 12,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        color: '#666',
        fontSize: 12,
    },
    linkText: {
        color: '#2C5F2D',
        fontWeight: 'bold',
        fontSize: 12,
        textDecorationLine: 'underline',
    },
    quoteContainer: {
        marginTop: 20,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    quoteText: {
        fontSize: 15,
        color: '#4A7C59',
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: 4,
        lineHeight: 20,
    },
    quoteReference: {
        fontSize: 12,
        color: '#6B8E23',
        fontWeight: '600',
    },
});
