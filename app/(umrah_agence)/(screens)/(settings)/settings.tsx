import { ProfileMenuItem } from '@/components/lists/ProfileMenuItem';
import { Button } from '@/components/ui/Button';
import { useThemeColors } from '@/hooks/useThemeColors';
import { logout } from '@/store/authSlice';
import { AppDispatch, RootState } from '@/store/store';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import AppBar from '../(navigation)/app_barr';

export default function SettingsPage() {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

    // Dynamic colors for theme switching
    const backgroundColor = isDarkMode ? '#121212' : '#F5F4DF';
    const contentBackgroundColor = isDarkMode ? '#121212' : '#F9F9F9';
    const surfaceColor = isDarkMode ? '#1E1E1E' : '#FFFFFF';
    const textColor = isDarkMode ? '#FFFFFF' : '#1a1a1a';
    const textSecondaryColor = isDarkMode ? '#D1D1D1' : '#888';

    // Preferences State
    const [seniorMode, setSeniorMode] = useState(false);
    const [locationSharing, setLocationSharing] = useState(true);
    const [notifications, setNotifications] = useState(true);

    const handleLogout = () => {
        Alert.alert(
            "Déconnexion",
            "Êtes-vous sûr de vouloir vous déconnecter ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Déconnexion",
                    style: "destructive",
                    onPress: () => dispatch(logout())
                }
            ]
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: backgroundColor }}>
            <SafeAreaView style={[styles.container, { backgroundColor: backgroundColor }]} edges={['bottom', 'left', 'right']}>
                <AppBar
                    onMenuPress={() => router.back()}
                    showAvatar={false}
                    showBackButton={true}
                    showSearch={false}
                    showNotification={false}
                    showSettings={false}
                    title="Paramètres"
                    backgroundColor={isDarkMode ? surfaceColor : "#F5F4DF"}
                />

                <ScrollView
                    style={[styles.content, { backgroundColor: contentBackgroundColor }]}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Security & Preferences Section */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>PARAMÈTRES ET SÉCURITÉ</Text>
                        <View style={[styles.sectionContent, { backgroundColor: surfaceColor }]}>
                            <ProfileMenuItem
                                icon="location-outline"
                                label="Partage de localisation"
                                type="toggle"
                                value={locationSharing}
                                onValueChange={setLocationSharing}
                            />
                            <ProfileMenuItem
                                icon="notifications-outline"
                                label="Notifications push"
                                type="toggle"
                                value={notifications}
                                onValueChange={setNotifications}
                            />
                            <ProfileMenuItem
                                icon="accessibility-outline"
                                label="Mode Senior"
                                type="toggle"
                                value={seniorMode}
                                onValueChange={setSeniorMode}
                            />
                            <ProfileMenuItem
                                icon="lock-closed-outline"
                                label="Changer le mot de passe"
                                onPress={() => console.log('Change Password')}
                            />
                            <ProfileMenuItem
                                icon="language-outline"
                                label="Langue de l'application"
                                onPress={() => console.log('Language')}
                            />
                        </View>
                    </View>

                    {/* Support & legal Section */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>SUPPORT ET LÉGAL</Text>
                        <View style={[styles.sectionContent, { backgroundColor: surfaceColor }]}>
                            <ProfileMenuItem
                                icon="help-circle-outline"
                                label="Aide & Support"
                                onPress={() => console.log('Help')}
                            />
                            <ProfileMenuItem
                                icon="information-circle-outline"
                                label="À propos de nous"
                                onPress={() => console.log('About')}
                            />
                            <ProfileMenuItem
                                icon="shield-checkmark-outline"
                                label="Politique de confidentialité"
                                onPress={() => console.log('Privacy')}
                            />
                            <ProfileMenuItem
                                icon="document-outline"
                                label="Conditions d'utilisation"
                                onPress={() => console.log('Terms')}
                            />
                            <ProfileMenuItem
                                icon="share-social-outline"
                                label="Partager l'application"
                                onPress={() => console.log('Share')}
                            />
                        </View>
                    </View>

                    {/* Logout Button */}
                    <View style={styles.footer}>
                        <Button
                            title="Se déconnecter"
                            onPress={handleLogout}
                            style={styles.logoutButton}
                        />
                        <Text style={[styles.version, { color: isDarkMode ? '#777' : '#AAA' }]}>Version 1.0.0</Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    scrollContent: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        marginLeft: 4,
        letterSpacing: 1,
    },
    sectionContent: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    footer: {
        marginTop: 10,
        marginBottom: 100,
        alignItems: 'center',
    },
    logoutButton: {
        backgroundColor: '#D9534F',
        width: '100%',
        marginBottom: 16,
    },
    version: {
        fontSize: 12,
    },
});
