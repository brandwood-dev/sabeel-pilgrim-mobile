import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Linking,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View,
    Image,
    KeyboardAvoidingView,
} from 'react-native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTrans } from '@/hooks/useTrans';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import AssistantChat from '../assistant';
import { sosApi } from '@/services/api';
import { createSosSocket } from '@/services/sosSocket';

const EMERGENCY_RED = '#DC2626';
const EMERGENCY_LIGHT = '#FEE2E2';

interface EmergencyContact {
    id: string;
    name: string;
    role: 'guide' | 'companion' | 'emergency' | 'embassy';
    phone: string;
    icon: string;
    available: boolean;
}

export default function SOSScreen() {
    const router = useRouter();
    const { t, language } = useTrans();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const isRTL = language === 'ar';
    const insets = useSafeAreaInsets();

    const PRIMARY_COLOR = colors.primary;
    const BACKGROUND_COLOR = colors.background;
    const [alertSent, setAlertSent] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [showSOSSheet, setShowSOSSheet] = useState(false);
    const [showSuccessSheet, setShowSuccessSheet] = useState(false);
    const [showLocationSheet, setShowLocationSheet] = useState(false);
    const [locationAddress, setLocationAddress] = useState<string>(t('Localisation...'));
    const [isUpdatingLocation, setIsUpdatingLocation] = useState(true);
    const [assistantModal, setAssistantModal] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const sosSocketRef = useRef<any>(null);
    const [contactsLoading, setContactsLoading] = useState(true);
    const [contacts, setContacts] = useState<EmergencyContact[]>([]);

    useEffect(() => {
        let mounted = true;

        const fetchContacts = async () => {
            setContactsLoading(true);
            try {
                const res = await sosApi.getMySosContacts();
                const data = res?.data || {};

                const next: EmergencyContact[] = [];

                const guidePhone = String(data?.guide?.phone || data?.guide?.phoneNumber || '').trim();
                const guideName = String(data?.guide?.fullName || `${data?.guide?.firstName || ''} ${data?.guide?.lastName || ''}`)
                    .trim();
                if (guideName || guidePhone) {
                    next.push({
                        id: String(data?.guide?.id || 'guide'),
                        name: guideName || t('Guide'),
                        role: 'guide',
                        phone: guidePhone || '—',
                        icon: 'map-marked-alt',
                        available: !!guidePhone,
                    });
                }

                const agencyPhone = String(data?.agency?.phoneNumber || '').trim();
                const agencyName = String(data?.agency?.agencyName || data?.agency?.fullName || '').trim();
                if (agencyName || agencyPhone) {
                    next.push({
                        id: String(data?.agency?.id || 'agency'),
                        name: agencyName || t('Agence'),
                        role: 'companion',
                        phone: agencyPhone || '—',
                        icon: 'users',
                        available: !!agencyPhone,
                    });
                }

                const accs = Array.isArray(data?.accompagnants) ? data.accompagnants : [];
                for (const a of accs) {
                    const phone = String(a?.phoneNumber || '').trim();
                    const name = String(`${a?.firstName || ''} ${a?.lastName || ''}`).trim();
                    if (!name && !phone) continue;
                    next.push({
                        id: String(a?.id || Math.random()),
                        name: name || t('Accompagnant'),
                        role: 'companion',
                        phone: phone || '—',
                        icon: 'users',
                        available: !!phone,
                    });
                }

                // Keep local emergency numbers
                next.push(
                    {
                        id: '997',
                        name: 'Urgences (997)',
                        role: 'emergency',
                        phone: '997',
                        icon: 'ambulance',
                        available: true,
                    },
                    {
                        id: '999',
                        name: 'Police (999)',
                        role: 'emergency',
                        phone: '999',
                        icon: 'shield-alt',
                        available: true,
                    },
                );

                if (mounted) {
                    setContacts(next);
                }
            } catch (e) {
                if (mounted) {
                    setContacts([]);
                }
            } finally {
                if (mounted) {
                    setContactsLoading(false);
                }
            }
        };

        const connectSosSocket = async () => {
            try {
                const s = await createSosSocket();
                if (!mounted) {
                    s.disconnect();
                    return;
                }
                sosSocketRef.current = s;
            } catch {
                // ignore
            }
        };

        fetchContacts();
        connectSosSocket();

        return () => {
            mounted = false;
            if (sosSocketRef.current) {
                sosSocketRef.current.disconnect();
                sosSocketRef.current = null;
            }
        };
    }, [t]);

    // Fetch real location
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLocationAddress(t('Ma Position'));
                setIsUpdatingLocation(false);
                return;
            }

            try {
                let location = await Location.getCurrentPositionAsync({});
                const [place] = await Location.reverseGeocodeAsync({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });

                if (place) {
                    const city = place.city || place.region || '';
                    const country = place.country || '';
                    setLocationAddress(`${city}${city && country ? ', ' : ''}${country}`);
                } else {
                    setLocationAddress(t('Ma Position'));
                }
            } catch (error) {
                console.error('Error getting location:', error);
                setLocationAddress(t('Ma Position'));
            } finally {
                setIsUpdatingLocation(false);
            }
        })();
    }, []);

    // Pulsing animation for SOS button
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    const handleEmergencyAlert = () => {
        setShowSOSSheet(true);
    };

    const sendEmergencyAlert = async () => {
        try {
            // Force high accuracy GPS
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Erreur', t('Veuillez activer la localisation'));
                return;
            }

            let location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
            });

            const payload = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy,
                deviceTimestamp: new Date(location.timestamp).toISOString(),
            };

            // Vibrate device
            Vibration.vibrate([0, 500, 200, 500]);

            const socket = sosSocketRef.current;
            if (socket && socket.connected) {
                socket.emit('trigger', payload);
            }

            // Show success message
            setAlertSent(true);
            setShowSOSSheet(false);
            setTimeout(() => {
                setShowSuccessSheet(true);
            }, 500);
        } catch (e) {
            Alert.alert('Erreur', t("Impossible d'envoyer l'alerte"));
        }
    };

    const handleCallContact = (contact: EmergencyContact) => {
        Alert.alert(
            `${t('Aide')} - ${contact.name}`,
            `${t('Voulez-vous appeler')} ${contact.phone} ?`,
            [
                {
                    text: t('Annuler'),
                    style: 'cancel',
                },
                {
                    text: t('Appeler'),
                    onPress: () => {
                        const phoneUrl = `tel:${contact.phone.replace(/\s/g, '')}`;
                        Linking.openURL(phoneUrl).catch(() => {
                            Alert.alert('Erreur', 'Impossible d\'ouvrir le composeur téléphonique');
                        });
                    },
                },
            ]
        );
    };

    const handleShareLocation = () => {
        setShowLocationSheet(true);
    };

    const confirmShareLocation = () => {
        setShowLocationSheet(false);
        setTimeout(() => {
            Alert.alert(
                `📍 ${t('Emplacement')}`,
                t('Votre position a été partagée avec les services de secours et votre guide.'),
                [{ text: 'OK' }]
            );
        }, 500);
    };

    return (
        <View style={{ flex: 1 }}>
            <SafeAreaView style={[styles.container, { backgroundColor: BACKGROUND_COLOR }]}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={[styles.headerContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <MaterialIcons name="emergency" size={32} color={EMERGENCY_RED} />
                            <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('SOS Urgence')}</Text>
                        </View>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Location Display */}
                    <View style={[styles.locationCard, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: isDarkMode ? '#1C1C1E' : '#fff' }]}>
                        <Ionicons name="location" size={18} color={PRIMARY_COLOR} />
                        <View style={[styles.locationText, { alignItems: isRTL ? 'flex-end' : 'flex-start', marginHorizontal: 12 }]}>
                            <Text style={styles.locationLabel}>{t('Position actuelle')}</Text>
                            <Text style={[styles.locationValue, { color: isDarkMode ? '#fff' : '#333' }]}>{locationAddress}</Text>
                        </View>
                    </View>

                    {/* Emergency Alert Button */}
                    <View style={styles.emergencySection}>
                        <Text style={styles.sectionSubtitle}>
                            {t('Appuyez pour prévenir votre guide et les services d\'urgence.')}
                        </Text>

                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                            <TouchableOpacity
                                style={[
                                    styles.emergencyButton,
                                    alertSent && styles.emergencyButtonSent,
                                ]}
                                onPress={handleEmergencyAlert}
                                activeOpacity={0.8}
                            >
                                <MaterialIcons
                                    name="emergency"
                                    size={40}
                                    color="#fff"
                                    style={styles.emergencyIcon}
                                />
                                <Text style={styles.emergencyButtonText}>
                                    {alertSent ? t('SOS ENVOYÉE') : t('ALERTE SOS')}
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>

                    {/* Share Location Button */}
                    <TouchableOpacity
                        style={[styles.shareLocationButton, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: isDarkMode ? '#1C1C1E' : '#fff' }]}
                        onPress={handleShareLocation}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="share-social" size={18} color={PRIMARY_COLOR} />
                        <Text style={styles.shareLocationText}>{t('Partager ma position')}</Text>
                    </TouchableOpacity>

                    {/* Emergency Contacts */}
                    <View style={styles.contactsSection}>
                        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#333', textAlign: isRTL ? 'right' : 'left' }]}>{t('Contacts d\'urgence')}</Text>
                        <Text style={[styles.sectionSubtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                            {t('Appel rapide en cas de besoin')}
                        </Text>

                        {contactsLoading ? null : contacts.map((contact) => (
                            <TouchableOpacity
                                key={contact.id}
                                style={[styles.contactCard, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: isDarkMode ? '#1C1C1E' : '#fff' }]}
                                onPress={() => handleCallContact(contact)}
                                activeOpacity={0.7}
                            >
                                <View
                                    style={[
                                        styles.contactIconContainer,
                                        contact.role === 'emergency' && styles.emergencyIconBg,
                                        isRTL ? { marginLeft: 12, marginRight: 0 } : { marginRight: 12, marginLeft: 0 }
                                    ]}
                                >
                                    <FontAwesome5
                                        name={contact.icon as any}
                                        size={20}
                                        color={
                                            contact.role === 'emergency'
                                                ? EMERGENCY_RED
                                                : PRIMARY_COLOR
                                        }
                                    />
                                </View>
                                <View style={[styles.contactInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                                    <Text style={[styles.contactName, { color: isDarkMode ? '#fff' : '#333' }]}>{contact.name}</Text>
                                    <Text style={styles.contactPhone}>{contact.phone}</Text>
                                </View>
                                <View style={[styles.contactAction, { backgroundColor: isDarkMode ? '#2C2C2E' : `${PRIMARY_COLOR}15` }]}>
                                    <Ionicons name="call" size={24} color={PRIMARY_COLOR} />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Emergency Instructions */}
                    <View style={[styles.instructionsCard, { backgroundColor: isDarkMode ? '#1C1C1E' : '#fff' }]}>
                        <View style={[styles.instructionsHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <Ionicons name="information-circle" size={24} color={PRIMARY_COLOR} />
                            <Text style={styles.instructionsTitle}>{t('Information importante')}</Text>
                        </View>
                        <View style={[styles.instructionsList, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                            <Text style={[styles.instructionItem, { color: isDarkMode ? '#bbb' : '#333', textAlign: isRTL ? 'right' : 'left' }]}>
                                • {t('RESTER CALME')}
                            </Text>
                            <Text style={[styles.instructionItem, { color: isDarkMode ? '#bbb' : '#333', textAlign: isRTL ? 'right' : 'left' }]}>
                                • {t('Décrivez votre situation clairement')}
                            </Text>
                            <Text style={[styles.instructionItem, { color: isDarkMode ? '#bbb' : '#333', textAlign: isRTL ? 'right' : 'left' }]}>
                                • {t('Partagez votre position exacte')}
                            </Text>
                            <Text style={[styles.instructionItem, { color: isDarkMode ? '#bbb' : '#333', textAlign: isRTL ? 'right' : 'left' }]}>
                                • {t('Attendez l\'aide à un endroit visible')}
                            </Text>
                        </View>
                    </View>
                    <View style={{ height: 80 }} />
                </ScrollView>

                {/* SOS Confirmation Sheet */}
                <Modal visible={showSOSSheet} transparent animationType="slide" onRequestClose={() => setShowSOSSheet(false)}>
                    <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setShowSOSSheet(false)}>
                        <TouchableOpacity activeOpacity={1} style={[styles.actionSheet, { backgroundColor: isDarkMode ? '#1C1C1E' : '#fff', paddingBottom: insets.bottom + 24 }]}>
                            <View style={[styles.sheetHandle, { backgroundColor: isDarkMode ? '#2C2C2E' : '#E5E7EB' }]} />
                            <TouchableOpacity style={styles.sheetClose} onPress={() => setShowSOSSheet(false)}>
                                <Ionicons name="close" size={22} color={isDarkMode ? '#8A8A8E' : '#6B7280'} />
                            </TouchableOpacity>

                            <View style={[styles.sheetIconWrap, { backgroundColor: isDarkMode ? '#2C2C2E' : 'rgba(220,38,38,0.1)' }]}>
                                <MaterialIcons name="emergency" size={36} color={EMERGENCY_RED} />
                            </View>

                            <Text style={[styles.sheetTitle, { color: isDarkMode ? '#fff' : '#111827' }]}>{t('SOS Urgence')}</Text>
                            <Text style={[styles.sheetDesc, { color: isDarkMode ? '#8A8A8E' : '#6B7280' }]}>
                                {t('Voulez-vous envoyer une alerte d\'urgence à votre guide et vos accompagnants ?\nIls recevront votre position GPS actuelle.')}
                            </Text>

                            <TouchableOpacity style={[styles.sheetPrimaryBtn, { backgroundColor: EMERGENCY_RED }]} onPress={sendEmergencyAlert}>
                                <MaterialIcons name="emergency" size={20} color="#fff" />
                                <Text style={styles.sheetPrimaryBtnText}>{t('Envoyer l\'alerte')}</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>

                {/* Location Share Sheet */}
                <Modal visible={showLocationSheet} transparent animationType="slide" onRequestClose={() => setShowLocationSheet(false)}>
                    <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setShowLocationSheet(false)}>
                        <TouchableOpacity activeOpacity={1} style={[styles.actionSheet, { backgroundColor: isDarkMode ? '#1C1C1E' : '#fff', paddingBottom: insets.bottom + 24 }]}>
                            <View style={[styles.sheetHandle, { backgroundColor: isDarkMode ? '#2C2C2E' : '#E5E7EB' }]} />
                            <TouchableOpacity style={styles.sheetClose} onPress={() => setShowLocationSheet(false)}>
                                <Ionicons name="close" size={22} color={isDarkMode ? '#8A8A8E' : '#6B7280'} />
                            </TouchableOpacity>

                            <View style={[styles.sheetIconWrap, { backgroundColor: isDarkMode ? '#1a2e1a' : 'rgba(44,95,45,0.1)' }]}>
                                <Ionicons name="location" size={36} color={PRIMARY_COLOR} />
                            </View>

                            <Text style={[styles.sheetTitle, { color: isDarkMode ? '#fff' : '#111827' }]}>{t('Partager ma position')}</Text>
                            <Text style={[styles.sheetDesc, { color: isDarkMode ? '#8A8A8E' : '#6B7280' }]}>
                                {t('Votre position sera partagée en temps réel avec votre accompagnateur pour assurer votre sécurité.')}
                            </Text>

                            <TouchableOpacity style={[styles.sheetPrimaryBtn, { backgroundColor: PRIMARY_COLOR }]} onPress={confirmShareLocation}>
                                <Ionicons name="share-social" size={20} color="#fff" />
                                <Text style={styles.sheetPrimaryBtnText}>{t('Partager la position')}</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>

                {/* SOS Success Sheet */}
                <Modal visible={showSuccessSheet} transparent animationType="slide" onRequestClose={() => { setShowSuccessSheet(false); setAlertSent(false); }}>
                    <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => { setShowSuccessSheet(false); setAlertSent(false); }}>
                        <TouchableOpacity activeOpacity={1} style={[styles.actionSheet, { backgroundColor: isDarkMode ? '#1C1C1E' : '#fff', paddingBottom: insets.bottom + 24 }]}>
                            <View style={[styles.sheetHandle, { backgroundColor: isDarkMode ? '#2C2C2E' : '#E5E7EB' }]} />
                            <TouchableOpacity style={styles.sheetClose} onPress={() => { setShowSuccessSheet(false); setAlertSent(false); }}>
                                <Ionicons name="close" size={22} color={isDarkMode ? '#8A8A8E' : '#6B7280'} />
                            </TouchableOpacity>

                            <View style={[styles.sheetIconWrap, { backgroundColor: isDarkMode ? '#1A3F1F' : 'rgba(22,163,74,0.1)' }]}>
                                <Ionicons name="checkmark-circle-outline" size={36} color="#16A34A" />
                            </View>

                            <Text style={[styles.sheetTitle, { color: isDarkMode ? '#fff' : '#111827' }]}>{t('ALERTE SOS ENVOYÉE')}</Text>
                            <Text style={[styles.sheetDesc, { color: isDarkMode ? '#8A8A8E' : '#6B7280' }]}>
                                {t('Votre position a été partagée avec les services de secours et votre guide.')}
                            </Text>

                            <TouchableOpacity style={[styles.sheetPrimaryBtn, { backgroundColor: '#16A34A' }]} onPress={() => { setShowSuccessSheet(false); setAlertSent(false); }}>
                                <Ionicons name="checkmark" size={20} color="#fff" />
                                <Text style={styles.sheetPrimaryBtnText}>{t('OK')}</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>
            </SafeAreaView>

            {/* Assistant FAB */}
            <TouchableOpacity
                style={[styles.assistantFab, { backgroundColor: colors.surface, borderColor: colors.accent, zIndex: 9999, elevation: 10 }]}
                onPress={() => setAssistantModal(true)}
            >
                <Image
                    source={require('../../../../assets/images/ai.jpg')}
                    style={{ width: '60%', height: '60%' }}
                    resizeMode="contain"
                    tintColor={colors.accent}
                />
            </TouchableOpacity>

            {/* Assistant Modal */}
            <Modal
                visible={assistantModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setAssistantModal(false)}
            >
                <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
                    <AssistantChat onClose={() => setAssistantModal(false)} />
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: EMERGENCY_RED,
    },
    locationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E8E6D0',
    },
    locationText: {
        marginLeft: 12,
        flex: 1,
    },
    locationLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    locationValue: {
        fontSize: 15,
        fontWeight: '600',
    },
    emergencySection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    emergencyButton: {
        backgroundColor: EMERGENCY_RED,
        width: 160,
        height: 160,
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: EMERGENCY_RED,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    emergencyButtonSent: {
        backgroundColor: '#16A34A',
    },
    emergencyIcon: {
        marginBottom: 5,
    },
    emergencyButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
        textAlign: 'center',
    },
    shareLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 2,
        borderColor: '#2C5F2D',
        gap: 8,
    },
    shareLocationText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2C5F2D',
    },
    contactsSection: {
        marginBottom: 24,
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E8E6D0',
    },
    contactIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(44, 95, 45, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emergencyIconBg: {
        backgroundColor: EMERGENCY_LIGHT,
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    contactPhone: {
        fontSize: 13,
        color: '#666',
    },
    contactAction: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    instructionsCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E8E6D0',
        marginBottom: 20,
    },
    instructionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2C5F2D',
    },
    instructionsList: {
        gap: 8,
    },
    instructionItem: {
        fontSize: 14,
        lineHeight: 20,
    },
    // Action Sheet Styles
    sheetOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    actionSheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingTop: 12,
        alignItems: 'center',
    },
    sheetHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        marginBottom: 20,
    },
    sheetClose: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sheetIconWrap: {
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    sheetTitle: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 12,
        textAlign: 'center',
    },
    sheetDesc: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 32,
        paddingHorizontal: 10,
    },
    sheetPrimaryBtn: {
        flexDirection: 'row',
        width: '100%',
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    sheetPrimaryBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    assistantFab: {
        position: 'absolute',
        bottom: 120,
        right: 20,
        zIndex: 100,
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
});
