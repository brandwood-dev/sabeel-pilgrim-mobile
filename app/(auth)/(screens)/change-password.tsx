import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View, ImageBackground, Image, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useDispatch, useSelector } from 'react-redux';
import { resetPassword, clearError } from '../../../store/authSlice';
import { AppDispatch, RootState } from '../../../store/store';
import { CustomAlert } from '../../../components/ui/CustomAlert';

export default function ChangePasswordScreen() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [alert, setAlert] = useState<{ visible: boolean; title: string; message: string; type: 'success' | 'error' }>({
        visible: false,
        title: '',
        message: '',
        type: 'success'
    });
    
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { loading, resetToken } = useSelector((state: RootState) => state.auth);

    const handleChangePassword = async () => {
        if (!newPassword || !confirmPassword) {
            setAlert({
                visible: true,
                title: 'Erreur',
                message: 'Veuillez remplir tous les champs',
                type: 'error'
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            setAlert({
                visible: true,
                title: 'Erreur',
                message: 'Les mots de passe ne correspondent pas',
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

        const resultAction = await dispatch(resetPassword({
            token: resetToken,
            data: { newPassword, confirmPassword }
        }));

        if (resetPassword.fulfilled.match(resultAction)) {
            setAlert({
                visible: true,
                title: 'Succès',
                message: 'Votre mot de passe a été modifié avec succès',
                type: 'success'
            });
        } else {
            setAlert({
                visible: true,
                title: 'Erreur',
                message: resultAction.payload as string || 'Échec du changement de mot de passe',
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
                                <Text style={styles.title}>Nouveau mot de passe</Text>
                                <Text style={styles.subtitle}>Créez un mot de passe sécurisé pour votre compte</Text>
                            </View>

                            <View style={styles.formContainer}>
                                <Input
                                    label="Mot de passe"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry={!showPassword}
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

                                <Input
                                    label="Confirmer"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                    rightIcon={
                                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                            <Ionicons 
                                                name={showConfirmPassword ? "eye-off" : "eye"} 
                                                size={22} 
                                                color="#2C5F2D" 
                                            />
                                        </TouchableOpacity>
                                    }
                                />

                                <Button
                                    title="Changer"
                                    onPress={handleChangePassword}
                                    loading={loading}
                                    style={styles.button}
                                />
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
                onClose={() => {
                    setAlert({ ...alert, visible: false });
                    if (alert.type === 'success') {
                        router.replace('/login' as any);
                    }
                }}
                onAction={() => {
                    setAlert({ ...alert, visible: false });
                    if (alert.type === 'success') {
                        router.replace('/login' as any);
                    }
                }}
                actionLabel={alert.type === 'success' ? 'Retour au Login' : 'D\'accord'}
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
    button: {
        marginTop: 10,
    },
});
