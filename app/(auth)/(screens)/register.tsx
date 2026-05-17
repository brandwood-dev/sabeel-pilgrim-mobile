import { StyleSheet, Text, View, SafeAreaView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Animated, Modal, Dimensions, ScrollView } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter, Link } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { Button } from '../../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../../../components/ui/Input';

import PhoneInput from 'react-native-phone-number-input';

const { width, height } = Dimensions.get('window');

import { signup, selectAuthError, selectAuthLoading } from '../../../store/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../../store/store';

import { useTrans } from '../../../hooks/useTrans';

const RegisterScreen = () => {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { t, language } = useTrans();
    const [step, setStep] = useState(1);
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const phoneInput = useRef<PhoneInput>(null);

    const isLoading = useSelector(selectAuthLoading);
    const error = useSelector(selectAuthError);
    const isRTL = language === 'ar';

    // Form Data
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(step === 1 ? 1 : 0)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (error) {
            console.error('Registration Error:', error);
        }
    }, [error]);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            })
        ]).start();
    }, [step]);

    const nextStep = () => {
        if (step < 4) {
            fadeAnim.setValue(0);
            slideAnim.setValue(0);
            setStep(step + 1);
        } else {
            handleSignUp();
        }
    };

    const prevStep = () => {
        if (step > 1) {
            fadeAnim.setValue(0);
            slideAnim.setValue(0);
            setStep(step - 1);
        } else {
            router.back();
        }
    };

    const handleSignUp = async () => {
        try {
            const signupData = {
                email,
                phoneNumber: phone,
                password,
                firstName,
                lastName,
                role: 'pelerin', // Default role
            };

            const resultAction = await dispatch(signup(signupData));
            if (signup.fulfilled.match(resultAction)) {
                setSuccessModalVisible(true);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSuccessContinue = () => {
        setSuccessModalVisible(false);
        router.replace('/(umrah_agence)/(screens)/acceuil' as any);
    };

    const renderStepContent = () => {
        const animatedStyle = {
            opacity: fadeAnim,
            transform: [{
                translateX: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [isRTL ? -20 : 20, 0]
                })
            }]
        };

        const textAlign = isRTL ? 'right' : 'left';

        switch (step) {
            case 1:
                return (
                    <Animated.View style={[styles.stepContainer, animatedStyle]}>
                        <Text style={[styles.stepTitle, { textAlign }]}>{t('Quel est votre numéro ?')}</Text>
                        <Text style={[styles.stepSubtitle, { textAlign }]}>{t('Nous vous enverrons un code pour vérifier votre téléphone.')}</Text>
                        <View style={[styles.inputWrapper, { transform: [{ scaleX: isRTL ? -1 : 1 }] }]}>
                            <PhoneInput
                                ref={phoneInput}
                                defaultValue={phone}
                                defaultCode="TN"
                                layout="first"
                                onChangeFormattedText={(text) => setPhone(text)}
                                containerStyle={styles.phoneContainer}
                                textContainerStyle={styles.phoneTextContainer}
                                textInputStyle={[styles.phoneTextInput, { textAlign: 'left' }]} // Phone fields stay LTR
                                placeholder={t("Numéro de téléphone")}
                                autoFocus
                            />
                        </View>

                        <View style={styles.socialContainer}>
                            <View style={[styles.dividerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                <View style={styles.divider} />
                                <Text style={styles.dividerText}>{t("ou s'inscrire avec")}</Text>
                                <View style={styles.divider} />
                            </View>
                            <TouchableOpacity style={[styles.socialButton, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} activeOpacity={0.8}>
                                <Ionicons name="logo-google" size={24} color="#DB4437" />
                                <Text style={styles.socialButtonText}>{t('Continuer avec Google')}</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                );
            case 2:
                return (
                    <Animated.View style={[styles.stepContainer, animatedStyle]}>
                        <Text style={[styles.stepTitle, { textAlign }]}>{t('Et votre email ?')}</Text>
                        <Text style={[styles.stepSubtitle, { textAlign }]}>{t('Pour recevoir vos confirmations de réservation.')}</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={[styles.input, { textAlign }]}
                                placeholder={t("Adresse email")}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoFocus
                            />
                        </View>
                    </Animated.View>
                );
            case 3:
                return (
                    <Animated.View style={[styles.stepContainer, animatedStyle]}>
                        <Text style={[styles.stepTitle, { textAlign }]}>{t('Créez un mot de passe')}</Text>
                        <Text style={[styles.stepSubtitle, { textAlign }]}>{t('Au moins 8 caractères.')}</Text>
                        <View style={styles.inputWrapper}>
                            <Input
                                style={[styles.input, { textAlign }]}
                                placeholder={t("Mot de passe")}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoFocus
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
                        </View>
                    </Animated.View>
                );
            case 4:
                return (
                    <Animated.View style={[styles.stepContainer, animatedStyle]}>
                        <Text style={[styles.stepTitle, { textAlign }]}>{t('Comment vous appelez-vous ?')}</Text>
                        <Text style={[styles.stepSubtitle, { textAlign }]}>{t("C'est ainsi que les autres utilisateurs vous verront.")}</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={[styles.input, { marginBottom: 16, textAlign }]}
                                placeholder={t("Prénom")}
                                value={firstName}
                                onChangeText={setFirstName}
                                autoFocus
                            />
                            <TextInput
                                style={[styles.input, { textAlign }]}
                                placeholder={t("Nom")}
                                value={lastName}
                                onChangeText={setLastName}
                            />
                        </View>
                    </Animated.View>
                );
            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity onPress={prevStep} style={[styles.backButton, { transform: [{ scaleX: isRTL ? -1 : 1 }] }]}>
                    <Ionicons name="chevron-back" size={28} color={Colors.primary} />
                </TouchableOpacity>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {renderStepContent()}
                </ScrollView>

                <View style={styles.footer}>
                    <Button
                        title={step === 4 ? t("Rejoindre Sabeel") : t("Continuer")}
                        onPress={nextStep}
                        style={styles.mainButton}
                    />
                </View>
            </KeyboardAvoidingView>

            <Modal
                transparent={true}
                visible={successModalVisible}
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.successIconCircle}>
                            <Ionicons name="sparkles" size={40} color="#fff" />
                        </View>
                        <Text style={[styles.modalTitle, { textAlign: 'center' }]}>{t('Bienvenue sur Sabeel !')}</Text>
                        <Text style={[styles.modalSubtitle, { textAlign: 'center' }]}>
                            {t('Votre compte a été créé avec succès. Veuillez vous connecter pour commencer votre voyage.')}
                        </Text>
                        <Button
                            title={t("C'est parti")}
                            onPress={handleSuccessContinue}
                            style={styles.modalButton}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default RegisterScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 4,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    stepContainer: {
        width: '100%',
    },
    stepTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    stepSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 24,
        lineHeight: 20,
    },
    inputWrapper: {
        width: '100%',
    },
    input: {
        backgroundColor: '#F7F9FC',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        fontSize: 14,
        color: Colors.text,
        borderWidth: 1,
        borderColor: '#E8EEF5',
    },
    phoneContainer: {
        width: '100%',
        backgroundColor: '#F7F9FC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E8EEF5',
        height: 50,
        overflow: 'hidden',
    },
    phoneTextContainer: {
        backgroundColor: 'transparent',
        paddingVertical: 0,
    },
    phoneTextInput: {
        fontSize: 14,
        color: Colors.text,
        height: 50,
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#F0F3F7',
    },
    mainButton: {
        height: 48,
        borderRadius: 12,
        backgroundColor: Colors.primary,
    },
    socialContainer: {
        marginTop: 40,
        alignItems: 'center',
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        width: '100%',
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#F0F3F7',
    },
    dividerText: {
        paddingHorizontal: 16,
        color: Colors.textLight,
        fontSize: 14,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E8EEF5',
        paddingVertical: 10,
        borderRadius: 12,
        width: '100%',
        gap: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            }
        }),
    },
    socialButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 32,
        alignItems: 'center',
    },
    successIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 12,
    },
    modalSubtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    modalButton: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        backgroundColor: Colors.primary,
    },
});
