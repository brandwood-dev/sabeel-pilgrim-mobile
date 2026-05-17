import { switchRole } from '@/store/authSlice';
import { ProfileMenuItem } from '@/components/lists/ProfileMenuItem';
import { useThemeColors } from '@/hooks/useThemeColors';
import { reviewsApi } from '@/services/api';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';

import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Image } from 'expo-image';
import {
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    TextInput,
} from 'react-native';

import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useProfileVM } from '@/hooks/profile/useProfileVM';
import { useFocusEffect } from '@react-navigation/native';
import { useDrawer } from '@/context/DrawerContext';
import { useDispatch } from 'react-redux';
import { setBottomNavVisibility } from '@/store/uiSlice';
import { setDarkMode } from '@/store/themeSlice';
import { useTrans } from '@/hooks/useTrans';

const { width, height } = Dimensions.get('window');

const COLLAPSED_THRESHOLD = 110;

const PENDING_PILGRIM_IDENTIFIER_KEY = 'pending_pilgrim_identifier';

export default function ProfilePage() {
    const { t, language } = useTrans();
    const isRTL = language === 'ar';
    const { user, handlePickAndUploadImage, handleLogout, loadProfile, handleUpdateProfile } = useProfileVM();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { openDrawer } = useDrawer();
    const dispatch = useDispatch();

    const [showLinkPilgrimModal, setShowLinkPilgrimModal] = useState(false);
    const [linkPilgrimIdentifier, setLinkPilgrimIdentifier] = useState('');
    const [isLinkingPilgrim, setIsLinkingPilgrim] = useState(false);

    const USER_NAME = user ? `${user.firstName} ${user.lastName}` : t('Chargement...');
    const USER_AVATAR = user?.photo || `https://ui-avatars.com/api/?name=${user?.firstName || 'User'}&background=2C5F2D&color=fff&size=200&bold=true`;

    useFocusEffect(
        React.useCallback(() => {
            loadProfile();
        }, [loadProfile])
    );

    useFocusEffect(
        React.useCallback(() => {
            const syncPendingIdentifier = async () => {
                try {
                    const pending = await AsyncStorage.getItem(PENDING_PILGRIM_IDENTIFIER_KEY);
                    if (pending) {
                        await AsyncStorage.removeItem(PENDING_PILGRIM_IDENTIFIER_KEY);
                        setLinkPilgrimIdentifier(String(pending));
                        setShowLinkPilgrimModal(true);
                    }
                } catch {
                    // ignore
                }
            };

            syncPendingIdentifier();
        }, [])
    );
    const isBottomNavVisible = useSelector((state: RootState) => state.ui.isBottomNavVisible);

    const flatListRef = useRef<FlatList>(null);

    const [activeTab, setActiveTab] = useState(0);
    const [image, setImage] = useState<string | null>(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [switchVisible, setSwitchVisible] = useState(false);
    const [showLogoutSheet, setShowLogoutSheet] = useState(false);
    const [showLocationSheet, setShowLocationSheet] = useState(false);
    const [showDeleteSheet, setShowDeleteSheet] = useState(false);
    const [agreeDelete, setAgreeDelete] = useState(false);

    // Toggles for settings
    const [notifEnabled, setNotifEnabled] = useState(true);
    const [darkModeLocal, setDarkModeLocal] = useState(isDarkMode);
    const [locationEnabled, setLocationEnabled] = useState(true);
    const [supportMessage, setSupportMessage] = useState('');
    const [isSendingSupport, setIsSendingSupport] = useState(false);

    // ── Scroll / Animations ───────────────────────────────────────────────────
    const scrollY = useRef(new Animated.Value(0)).current;
    const switchAnim = useRef(new Animated.Value(0)).current;
    const posAnim = useRef(new Animated.Value(0)).current; // 0: bottom 120, 1: bottom 35 (via translateY)

    const HEADER_TALL = 220 + insets.top;
    const HEADER_SHORT = 65 + insets.top;


    const HEADER_FIXED = 160 + insets.top;
    const borderOpacity = scrollY.interpolate({
        inputRange: [COLLAPSED_THRESHOLD * 0.8, COLLAPSED_THRESHOLD],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    // ── Theme tokens ─────────────────────────────────────────────────────────
    const PAGE_BG = isDarkMode ? '#111111' : '#F4F5F7';
    const CARD_BG = isDarkMode ? '#1C1C1E' : '#FFFFFF';
    const TEXT = isDarkMode ? '#FFFFFF' : '#111827';
    const TEXT_SEC = isDarkMode ? '#8A8A8E' : '#6B7280';
    const DIVIDER = isDarkMode ? '#2C2C2E' : '#E5E7EB';
    const PRIMARY = colors.primary;

    const [myReviewsLoading, setMyReviewsLoading] = useState(false);
    const [myReviews, setMyReviews] = useState<any[]>([]);

    const fetchMyReviews = async () => {
        try {
            setMyReviewsLoading(true);
            const res = await reviewsApi.myReviews();
            setMyReviews(Array.isArray(res.data?.reviews) ? res.data.reviews : []);
        } catch {
            setMyReviews([]);
        } finally {
            setMyReviewsLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchMyReviews();
        }, [])
    );

    // ── Handlers ──────────────────────────────────────────────────────────────
    const pickImage = handlePickAndUploadImage;

    const switchTab = (index: number) => {

        setActiveTab(index);
        flatListRef.current?.scrollToIndex({ index, animated: true });
    };

    const handleHorizontalScroll = (e: any) => {
        const idx = Math.round(e.nativeEvent.contentOffset.x / width);
        setActiveTab(idx);
    };

    const lastScrollY = useRef(0);
    const handleVerticalScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        {
            useNativeDriver: false,
            listener: (e: any) => {
                const y = e.nativeEvent.contentOffset.y;
                const isScrollingDown = y > lastScrollY.current;

                if (isScrollingDown && y > 100) {
                    // Show Button, Hide Tabs
                    if (!switchVisible) {
                        setSwitchVisible(true);
                        Animated.spring(switchAnim, {
                            toValue: 1,
                            useNativeDriver: true,
                            tension: 40,
                            friction: 8,
                        }).start();
                    }
                    dispatch(setBottomNavVisibility(false));
                } else if (!isScrollingDown || y < 50) {
                    // Hide Button, Show Tabs
                    if (switchVisible) {
                        setSwitchVisible(false);
                        Animated.spring(switchAnim, {
                            toValue: 0,
                            useNativeDriver: true,
                            tension: 40,
                            friction: 8,
                        }).start();
                    }
                    dispatch(setBottomNavVisibility(true));
                }
                lastScrollY.current = y;
            },
        }
    );

    const handleThemeToggle = (value: boolean) => {
        setDarkModeLocal(value);
        dispatch(setDarkMode(value));
    };

    const handleLocationToggle = async (value: boolean) => {
        setLocationEnabled(value);
        const success = await handleUpdateProfile({ shareLocation: value });
        if (!success) {
            setLocationEnabled(!value);
        }
    };

    // Effect to sync state when user loads
    React.useEffect(() => {
        if (user) {
            setLocationEnabled(!!user.shareLocation);
        }
    }, [user]);

    const openLinkPilgrimModal = () => {
        setLinkPilgrimIdentifier('');
        setShowLinkPilgrimModal(true);
    };

    const openQrScannerForLink = () => {
        router.push('/(accampagnant)/qr_scanner?flow=link');
    };

    const confirmLinkPilgrimAndSwitch = async () => {
        if (isLinkingPilgrim) return;

        const identifier = String(linkPilgrimIdentifier || '').trim();
        if (!identifier) {
            Alert.alert('Erreur', "Veuillez saisir l'ID du pèlerin ou scanner un QR code.");
            return;
        }

        setIsLinkingPilgrim(true);
        try {
            const { authApi } = await import('@/services/api');
            await authApi.linkPilgrimToAccompagnant(identifier);
            await (dispatch as any)(switchRole('accompagnant')).unwrap();
            setShowLinkPilgrimModal(false);
            router.push('/(umrah_agence)/(screens)/(splash)/splash_accompagnant');
        } catch (err: any) {
            const message = err?.response?.data?.message || err || "Impossible d'associer ce pèlerin.";
            Alert.alert('Erreur', String(message));
        } finally {
            setIsLinkingPilgrim(false);
        }
    };

    const handleSwitchMode = () => {
        openLinkPilgrimModal();
    };

    useFocusEffect(
        React.useCallback(() => {
            // Keep tabs visible initially
            dispatch(setBottomNavVisibility(true));
            Animated.spring(posAnim, { toValue: 0, useNativeDriver: true, tension: 40, friction: 8 }).start();
            return () => {
                // Ensure tabs are visible when leaving profile
                dispatch(setBottomNavVisibility(true));
            };
        }, [dispatch])
    );

    // Sync posAnim with isBottomNavVisible
    React.useEffect(() => {
        Animated.spring(posAnim, {
            toValue: isBottomNavVisible ? 0 : 1,
            useNativeDriver: true,
            tension: 40,
            friction: 8,
        }).start();
    }, [isBottomNavVisible]);

    const onLogoutPress = () => setShowLogoutSheet(true);
    const handleDeleteAccount = () => { setAgreeDelete(false); setShowDeleteSheet(true); };

    const confirmLogout = async () => {
        setShowLogoutSheet(false);
        await handleLogout();
        router.replace('/(auth)/(screens)/login');
    };


    const confirmDelete = () => {
        if (!agreeDelete) return;
        setShowDeleteSheet(false);
        // TODO: API delete call
        Alert.alert('Compte supprimé', 'Votre compte a été définitivement supprimé.');
        router.replace('/(auth)/(screens)/login');
    };

    const handleSendSupport = async () => {
        if (!supportMessage.trim()) {
            Alert.alert(t('Info'), t('Veuillez saisir un message avant d\'envoyer.'));
            return;
        }

        setIsSendingSupport(true);
        try {
            const { authApi } = await import('@/services/api');
            await authApi.sendSupportMessage(supportMessage);
            Alert.alert(t('Succès'), t('Votre message a été envoyé avec succès. Notre équipe vous répondra bientôt.'));
            setSupportMessage('');
            setShowSupportModal(false);
        } catch (err) {
            console.error('Support send error:', err);
            Alert.alert('Erreur', "Désolé, nous n'avons pas pu envoyer votre message. Vérifiez votre connexion.");
        } finally {
            setIsSendingSupport(false);
        }
    };

    const avatarUri = image ?? USER_AVATAR;

    // ── Tab: Mon Compte ───────────────────────────────────────────────────────
    const renderMonCompte = () => (
        <Animated.ScrollView
            style={{ flex: 1, backgroundColor: PAGE_BG }}
            contentContainerStyle={{
                paddingTop: HEADER_FIXED + 5,
                paddingHorizontal: 16,
                paddingBottom: 200,
            }}
            showsVerticalScrollIndicator={false}
            onScroll={handleVerticalScroll}
            scrollEventThrottle={16}
        >
            {/* ── MON COMPTE ── */}
            <Text style={[ss.sectionLabel, { color: TEXT_SEC }]}>{t('MON COMPTE')}</Text>
            <View style={[ss.card, { backgroundColor: CARD_BG }]}>
                <ProfileMenuItem
                    icon="person-circle-outline"
                    label={t('Informations personnelles')}
                    onPress={() => router.push('/(umrah_agence)/(screens)/profile/personal_info')}
                />
                <View style={[ss.sep, { backgroundColor: DIVIDER }]} />
                <ProfileMenuItem
                    icon="document-text-outline"
                    label={t('Mes documents')}
                    onPress={() => router.push('/(umrah_agence)/(screens)/profile/document/documents')}
                />
                <View style={[ss.sep, { backgroundColor: DIVIDER }]} />
                <ProfileMenuItem
                    icon="card-outline"
                    label={t('Paiement')}
                    onPress={() => router.push('/(umrah_agence)/(screens)/(carte)/portfeuille' as any)}
                />

                <View style={[ss.sep, { backgroundColor: DIVIDER }]} />
                <ProfileMenuItem
                    icon="bookmark-outline"
                    label={t('Éléments sauvegardés')}
                    onPress={() => router.push('/(umrah_agence)/(screens)/(avis)/sauvegarde')}
                />
            </View>

            {/* ── RELATIONS & SERVICES ── */}
            <Text style={[ss.sectionLabel, { color: TEXT_SEC }]}>{t('RELATIONS & SERVICES')}</Text>
            <View style={[ss.card, { backgroundColor: CARD_BG }]}>
                <ProfileMenuItem
                    icon="people-outline"
                    label={t('Mes compagnons')}
                    onPress={() => router.push('/(umrah_agence)/(screens)/profile/companions')}
                />
                <View style={[ss.sep, { backgroundColor: DIVIDER }]} />
                <ProfileMenuItem
                    icon="business-outline"
                    label={t('Mon agence')}
                    onPress={() => router.push('/(umrah_agence)/(screens)/profile/agency')}
                />
                <View style={[ss.sep, { backgroundColor: DIVIDER }]} />
                <ProfileMenuItem
                    icon="qr-code-outline"
                    label={t('Mon Code QR & Identifiant')}
                    onPress={() => setShowQRModal(true)}
                />
            </View>

            {/* ── PARAMÈTRES ── */}
            <Text style={[ss.sectionLabel, { color: TEXT_SEC }]}>{t('PARAMÈTRES')}</Text>
            <View style={[ss.card, { backgroundColor: CARD_BG }]}>
                <ProfileMenuItem
                    icon="lock-closed-outline"
                    label={t('Changer le mot de passe')}
                    onPress={() => router.push('/(umrah_agence)/(screens)/profile/change_password')}
                />
                <View style={[ss.sep, { backgroundColor: DIVIDER }]} />
                <ProfileMenuItem
                    icon="globe-outline"
                    label={t("Langue de l'application")}
                    onPress={() => router.push('/(umrah_agence)/(screens)/profile/language')}
                />
                <View style={[ss.sep, { backgroundColor: DIVIDER }]} />

                <ProfileMenuItem
                    icon="moon-outline"
                    label={t('Mode sombre')}
                    type="toggle"
                    value={darkModeLocal}
                    onValueChange={handleThemeToggle}
                />
                <View style={[ss.sep, { backgroundColor: DIVIDER }]} />
                <ProfileMenuItem
                    icon="location-outline"
                    label={t('Partager ma position')}
                    onPress={() => setShowLocationSheet(true)}
                />
            </View>

            {/* ── CONFIDENTIALITÉ & AIDE ── */}
            <Text style={[ss.sectionLabel, { color: TEXT_SEC }]}>{t('INFORMATIONS')}</Text>
            <View style={[ss.card, { backgroundColor: CARD_BG }]}>
                <ProfileMenuItem
                    icon="shield-checkmark-outline"
                    label={t('Confidentialité')}
                    onPress={() => router.push('/(umrah_agence)/(screens)/profile/privacy')}
                />
                <View style={[ss.sep, { backgroundColor: DIVIDER }]} />
                <ProfileMenuItem
                    icon="help-buoy-outline"
                    label={t('FAQ')}
                    onPress={() => setShowSupportModal(true)}
                />
                <View style={[ss.sep, { backgroundColor: DIVIDER }]} />
                <ProfileMenuItem
                    icon="help-circle-outline"
                    label={t('Aide & Support')}
                    onPress={() => router.push('/(umrah_agence)/(screens)/profile/support')}
                />
                <View style={[ss.sep, { backgroundColor: DIVIDER }]} />
                <ProfileMenuItem
                    icon="information-circle-outline"
                    label={t('À propos de Sabeel')}
                    onPress={() => router.push('/(umrah_agence)/(screens)/profile/about')}
                />
            </View>

            {/* ── COMPTE ── */}
            <Text style={[ss.sectionLabel, { color: TEXT_SEC }]}>{t('COMPTE')}</Text>
            <View style={[ss.card, { backgroundColor: CARD_BG }]}>
                <ProfileMenuItem
                    icon="log-out-outline"
                    label={t('Se déconnecter')}
                    onPress={onLogoutPress}
                />
                <View style={[ss.sep, { backgroundColor: DIVIDER }]} />
                <ProfileMenuItem
                    icon="trash-outline"
                    label={t('Supprimer le compte')}
                    onPress={handleDeleteAccount}
                />
            </View>

            <View style={ss.versionContainer}>
                <Text style={[ss.versionText, { color: TEXT_SEC }]}>Sabeel V1.0.0</Text>
            </View>

        </Animated.ScrollView>
    );

    // ── Tab: Mes Avis ─────────────────────────────────────────────────────────
    const renderMesAvis = () => (
        <Animated.ScrollView
            style={{ flex: 1, backgroundColor: PAGE_BG }}
            contentContainerStyle={{
                paddingTop: HEADER_FIXED + 5,
                paddingHorizontal: 16,
                paddingBottom: 140,
            }}
            showsVerticalScrollIndicator={false}
            onScroll={handleVerticalScroll}
            scrollEventThrottle={16}
        >
            {myReviewsLoading ? (
                <View style={[ss.emptyCard, { backgroundColor: CARD_BG }]}> 
                    <Text style={[ss.emptyText, { color: TEXT_SEC }]}>Chargement...</Text>
                </View>
            ) : myReviews.length === 0 ? (
                <View style={[ss.emptyCard, { backgroundColor: CARD_BG }]}>
                    <View style={[ss.emptyIcon, { backgroundColor: isDarkMode ? '#1a2e1a' : '#F0FDF4' }]}>
                        <Ionicons name="chatbubbles-outline" size={40} color={PRIMARY} />
                    </View>
                    <Text style={[ss.emptyTitle, { color: TEXT }]}>Aucun avis publié</Text>
                    <Text style={[ss.emptyText, { color: TEXT_SEC }]}>
                        Partagez vos expériences avec la communauté Sabeel.
                    </Text>
                    <TouchableOpacity
                        style={[ss.emptyBtn, { backgroundColor: PRIMARY }]}
                        onPress={() => router.push('/(umrah_agence)/(screens)/(avis)/post')}
                    >
                        <Ionicons name="add" size={18} color="#fff" />
                        <Text style={ss.emptyBtnText}>Rédiger un avis</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={{ gap: 12, marginTop: 10 }}>
                    {myReviews.map((r) => (
                        <View key={r.id} style={[ss.myReviewCard, { backgroundColor: CARD_BG, borderColor: DIVIDER }]}>
                            <View style={ss.myReviewHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[ss.myReviewTarget, { color: TEXT }]} numberOfLines={1}>
                                        {r.targetName}
                                    </Text>
                                    <Text style={[ss.myReviewDate, { color: TEXT_SEC }]}>
                                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}
                                    </Text>
                                </View>
                                <View style={ss.myReviewStars}>
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <Ionicons
                                            key={i}
                                            name="star"
                                            size={14}
                                            color={i <= (r.rating || 0) ? '#F59E0B' : (isDarkMode ? '#444' : '#E5E7EB')}
                                        />
                                    ))}
                                </View>
                            </View>
                            <Text style={[ss.myReviewComment, { color: TEXT_SEC }]} numberOfLines={4}>
                                {r.comment}
                            </Text>
                        </View>
                    ))}

                    <TouchableOpacity
                        style={[ss.emptyBtn, { backgroundColor: PRIMARY, alignSelf: 'center', marginTop: 10 }]}
                        onPress={() => router.push('/(umrah_agence)/(screens)/(avis)/post')}
                    >
                        <Ionicons name="add" size={18} color="#fff" />
                        <Text style={ss.emptyBtnText}>Rédiger un avis</Text>
                    </TouchableOpacity>
                </View>
            )}
        </Animated.ScrollView>
    );

    const tabs = [
        { id: 0, content: renderMonCompte() },
        { id: 1, content: renderMesAvis() },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            <SafeAreaView style={{ flex: 1, backgroundColor: PAGE_BG }} edges={['bottom']}>

                {/* ════════ ANIMATED HEADER ════════ */}
                <Animated.View
                    style={[
                        ss.header,
                        {
                            height: HEADER_FIXED,
                            backgroundColor: PAGE_BG,
                            paddingTop: insets.top - 30,
                        },
                    ]}
                >
                    {/* ── Top bar ── */}
                    <View style={ss.topBar}>
                        <View style={{ width: 4 }} />
                    </View>

                    {/* ── Expanded profile ── */}
                    <Animated.View style={[ss.expandedSection, { marginTop: -35 }]}>
                        <TouchableOpacity onPress={pickImage} activeOpacity={0.85} style={ss.avatarWrap}>
                            <Image source={{ uri: avatarUri }} style={ss.avatar} cachePolicy="disk" />
                            <View style={[ss.cameraBadge, { backgroundColor: PRIMARY }]}>
                                <Ionicons name="camera" size={13} color="#fff" />
                            </View>
                        </TouchableOpacity>


                        {/* Name */}
                        <Text style={[ss.userName, { color: TEXT }]}>{USER_NAME}</Text>


                    </Animated.View>

                    {/* ── Tab bar ── */}
                    <View style={[ss.tabBar, { borderTopWidth: 0, backgroundColor: PAGE_BG }]}>
                        {[t('Mon Compte'), t('Mes avis')].map((label, i) => (
                            <TouchableOpacity
                                key={i}
                                style={ss.tabBtn}
                                onPress={() => switchTab(i)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    ss.tabLabel,
                                    {
                                        color: activeTab === i ? PRIMARY : TEXT_SEC,
                                        fontWeight: activeTab === i ? '700' : '500',
                                    },
                                ]}>
                                    {label}
                                </Text>
                                {activeTab === i && (
                                    <View style={[ss.tabIndicator, { backgroundColor: PRIMARY }]} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>


                </Animated.View>

                {/* ════════ SWIPEABLE CONTENT ════════ */}
                <FlatList
                    ref={flatListRef}
                    data={tabs}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleHorizontalScroll}
                    scrollEventThrottle={16}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={{ width }}>{item.content}</View>
                    )}
                />

                {/* ═════ QR Modal ═════ */}
                <Modal visible={showQRModal} transparent animationType="slide" onRequestClose={() => setShowQRModal(false)}>
                    <View style={ss.modalOverlay}>
                        <View style={[ss.modalSheet, { backgroundColor: CARD_BG }]}>
                            <View style={[ss.sheetHandle, { backgroundColor: DIVIDER }]} />
                            <TouchableOpacity style={ss.modalClose} onPress={() => setShowQRModal(false)}>
                                <Ionicons name="close" size={22} color={TEXT_SEC} />
                            </TouchableOpacity>
                            <Text style={[ss.modalTitle, { color: TEXT }]}>Mon QR Code</Text>
                            <Text style={[ss.modalSub, { color: TEXT_SEC }]}>
                                Présentez ce code à votre accompagnateur pour être identifié.
                            </Text>
                            <View style={[ss.qrWrap, { shadowColor: isDarkMode ? '#000' : '#aaa' }]}>
                                <QRCode
                                    value={JSON.stringify({
                                        id: user?.uniqueIdentifier,
                                        firstName: user?.firstName,
                                        lastName: user?.lastName
                                    })}
                                    size={200}
                                    color={PRIMARY}
                                    backgroundColor="#fff"
                                />
                            </View>
                            <View style={[ss.idBadge, { backgroundColor: isDarkMode ? '#1a2e1a' : '#F0FDF4' }]}>
                                <Text style={[ss.idText, { color: PRIMARY }]}>ID : {user?.uniqueIdentifier || t('Chargement...')}</Text>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* ═════ Support / FAQ Modal ═════ */}
                <Modal
                    visible={showSupportModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => { if (!isSendingSupport) setShowSupportModal(false); }}
                >
                    <View style={ss.modalOverlay}>
                        <View style={[ss.modalSheet, { backgroundColor: CARD_BG, height: height * 0.7, paddingBottom: 0 }]}>
                            <View style={[ss.sheetHandle, { backgroundColor: DIVIDER }]} />
                            <TouchableOpacity
                                style={ss.modalClose}
                                onPress={() => setShowSupportModal(false)}
                                disabled={isSendingSupport}
                            >
                                <Ionicons name="close" size={22} color={TEXT_SEC} />
                            </TouchableOpacity>

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                                <View style={{ alignItems: 'center', marginVertical: 10 }}>
                                    <View style={[ss.sheetIconWrap, { backgroundColor: PRIMARY + '15', marginBottom: 15 }]}>
                                        <Ionicons name="headset-outline" size={24} color={PRIMARY} />
                                    </View>
                                    <Text style={[ss.modalTitle, { color: TEXT, textAlign: 'center' }]}>{t('Centre de support Sabeel')}</Text>
                                    <Text style={[ss.modalSub, { color: TEXT_SEC, textAlign: 'center', paddingHorizontal: 20 }]}>
                                        {t('Vous rencontrez une difficulté ? Transmettez-nous votre demande.')}
                                    </Text>
                                </View>

                                {/* Contact Form */}
                                <View style={{ marginTop: 10 }}>
                                    <Text style={[ss.inputLabel, { color: TEXT_SEC, textAlign: isRTL ? 'right' : 'left' }]}>{t('Votre message')}</Text>
                                    <View style={[ss.textArea, { backgroundColor: isDarkMode ? '#2C2C2E' : '#F9FAFB', borderColor: DIVIDER, borderRadius: 16, marginTop: 8 }]}>
                                        <TextInput
                                            multiline
                                            numberOfLines={6}
                                            placeholder={t('En quoi pouvons-nous vous aider ?')}
                                            placeholderTextColor={TEXT_SEC}
                                            value={supportMessage}
                                            onChangeText={setSupportMessage}
                                            editable={!isSendingSupport}
                                            style={[ss.textInput, { color: TEXT, textAlign: isRTL ? 'right' : 'left', height: 100, padding: 10, fontSize: 13 }]}
                                        />
                                    </View>
                                </View>
                            </ScrollView>

                            {/* Footer for Send Button */}
                            <View style={{ width: '100%', paddingBottom: insets.bottom + 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: DIVIDER }}>
                                <TouchableOpacity
                                    style={[ss.confirmBtn, { backgroundColor: isSendingSupport ? DIVIDER : PRIMARY }]}
                                    onPress={handleSendSupport}
                                    disabled={isSendingSupport}
                                >
                                    {isSendingSupport ? (
                                        <Animated.View style={{ transform: [{ rotate: '45deg' }] }}>
                                            <Ionicons name="sync" size={18} color={TEXT_SEC} />
                                        </Animated.View>
                                    ) : (
                                        <Ionicons name="send" size={18} color="#fff" style={{ marginHorizontal: 8 }} />
                                    )}
                                    <Text style={ss.confirmBtnText}>
                                        {isSendingSupport ? t('Envoi...') : t('Envoyer')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>

            {/* ════════ FLOATING SWITCH BUTTON ════════ */}
            <Animated.View
                pointerEvents={switchVisible ? 'auto' : 'none'}
                style={[
                    ss.floatBtn,
                    {
                        opacity: switchAnim,
                        bottom: 120,
                        transform: [
                            {
                                translateY: switchAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [80, 0],
                                }),
                            },
                            {
                                translateY: posAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 85], // Move down by 85px to reach bottom 35
                                }),
                            }
                        ],
                    },
                ]}
            >
                <TouchableOpacity
                    style={[ss.switchBtn, { backgroundColor: colors.secondary }]}
                    onPress={handleSwitchMode}
                    activeOpacity={0.88}
                >
                    <Ionicons name="people" size={17} color="#fff" />
                    <Text style={ss.switchBtnText}>Devenir Accompagnant</Text>
                </TouchableOpacity>
            </Animated.View>

            <Modal
                visible={showLinkPilgrimModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowLinkPilgrimModal(false)}
            >
                <TouchableOpacity
                    style={ss.sheetOverlay}
                    activeOpacity={1}
                    onPress={() => setShowLinkPilgrimModal(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[ss.actionSheet, { backgroundColor: CARD_BG, paddingBottom: insets.bottom + 24 }]}
                    >
                        <View style={[ss.sheetHandle, { backgroundColor: DIVIDER }]} />

                        <TouchableOpacity style={ss.modalClose} onPress={() => setShowLinkPilgrimModal(false)}>
                            <Ionicons name="close" size={22} color={TEXT_SEC} />
                        </TouchableOpacity>

                        <Text style={[ss.sheetTitle, { color: TEXT }]}>Lier un pèlerin</Text>
                        <Text style={[ss.sheetDesc, { color: TEXT_SEC }]}>Saisissez l'ID du pèlerin ou scannez son QR code.</Text>

                        <View style={[ss.inputContainer, { backgroundColor: isDarkMode ? '#2C2C2E' : '#F9FAFB', borderColor: DIVIDER }]}>
                            <Ionicons name="key-outline" size={18} color={TEXT_SEC} style={{ marginRight: 10 }} />
                            <TextInput
                                style={[ss.idInput, { color: TEXT }]}
                                placeholder="ID du pèlerin"
                                placeholderTextColor={TEXT_SEC}
                                value={linkPilgrimIdentifier}
                                onChangeText={setLinkPilgrimIdentifier}
                                autoCapitalize="characters"
                            />
                        </View>

                        <TouchableOpacity
                            style={[ss.sheetPrimaryBtn, { backgroundColor: PRIMARY, opacity: isLinkingPilgrim ? 0.7 : 1 }]}
                            onPress={confirmLinkPilgrimAndSwitch}
                            disabled={isLinkingPilgrim}
                        >
                            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                            <Text style={ss.sheetPrimaryBtnText}>{isLinkingPilgrim ? 'Validation...' : 'Valider et continuer'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[ss.sheetPrimaryBtn, { backgroundColor: colors.secondary, marginTop: 12 }]}
                            onPress={openQrScannerForLink}
                            disabled={isLinkingPilgrim}
                        >
                            <Ionicons name="qr-code-outline" size={18} color="#fff" />
                            <Text style={ss.sheetPrimaryBtnText}>Scanner QR Code</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* ════════ LOGOUT / DELETE SHEETS ════════ */}
            <Modal visible={showLogoutSheet} transparent animationType="slide" onRequestClose={() => setShowLogoutSheet(false)}>
                <TouchableOpacity style={ss.sheetOverlay} activeOpacity={1} onPress={() => setShowLogoutSheet(false)}>
                    <TouchableOpacity activeOpacity={1} style={[ss.actionSheet, { backgroundColor: CARD_BG, paddingBottom: insets.bottom + 24 }]}>
                        <View style={[ss.sheetHandle, { backgroundColor: DIVIDER }]} />
                        <TouchableOpacity style={ss.modalClose} onPress={() => setShowLogoutSheet(false)}>
                            <Ionicons name="close" size={22} color={TEXT_SEC} />
                        </TouchableOpacity>
                        {/* Icon */}
                        <View style={[ss.sheetIconWrap, { backgroundColor: isDarkMode ? '#2C2C2E' : 'rgba(44,95,45,0.1)' }]}>
                            <Ionicons name="log-out-outline" size={30} color={PRIMARY} />
                        </View>
                        <Text style={[ss.sheetTitle, { color: TEXT }]}>Se déconnecter</Text>
                        <Text style={[ss.sheetDesc, { color: TEXT_SEC }]}>
                            Vous serez déconnecté(e) de votre compte Sabeel.{'\n'}
                            Vos données restent sauvegardées.
                        </Text>
                        <TouchableOpacity style={[ss.sheetPrimaryBtn, { backgroundColor: PRIMARY }]} onPress={confirmLogout}>
                            <Ionicons name="log-out-outline" size={18} color="#fff" />
                            <Text style={ss.sheetPrimaryBtnText}>Se déconnecter</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            <Modal visible={showLocationSheet} transparent animationType="slide" onRequestClose={() => setShowLocationSheet(false)}>
                <TouchableOpacity style={ss.sheetOverlay} activeOpacity={1} onPress={() => setShowLocationSheet(false)}>
                    <TouchableOpacity activeOpacity={1} style={[ss.actionSheet, { backgroundColor: CARD_BG, paddingBottom: insets.bottom + 24 }]}>
                        <View style={[ss.sheetHandle, { backgroundColor: DIVIDER }]} />
                        <TouchableOpacity style={ss.modalClose} onPress={() => setShowLocationSheet(false)}>
                            <Ionicons name="close" size={22} color={TEXT_SEC} />
                        </TouchableOpacity>
                        {/* Icon */}
                        <View style={[ss.sheetIconWrap, { backgroundColor: isDarkMode ? '#2C2C2E' : 'rgba(44,95,45,0.1)' }]}>
                            <Ionicons name="location-outline" size={30} color={PRIMARY} />
                        </View>
                        <Text style={[ss.sheetTitle, { color: TEXT }]}>{t('Partager ma position')}</Text>
                        <Text style={[ss.sheetDesc, { color: TEXT_SEC }]}>
                            {locationEnabled 
                                ? t("Le partage de position est actuellement activé. Votre agence peut vous localiser en cas de besoin.")
                                : t("Le partage de position est actuellement désactivé. Activez-le pour permettre à votre agence de vous assister au mieux.")}
                        </Text>
                        <TouchableOpacity 
                            style={[ss.sheetPrimaryBtn, { backgroundColor: locationEnabled ? '#EF4444' : PRIMARY }]} 
                            onPress={() => {
                                handleLocationToggle(!locationEnabled);
                                setShowLocationSheet(false);
                            }}
                        >
                            <Ionicons name={locationEnabled ? "location" : "location-outline"} size={18} color="#fff" />
                            <Text style={ss.sheetPrimaryBtnText}>
                                {locationEnabled ? t('Désactiver le partage') : t('Activer le partage')}
                            </Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            <Modal visible={showDeleteSheet} transparent animationType="slide" onRequestClose={() => setShowDeleteSheet(false)}>
                <TouchableOpacity style={ss.sheetOverlay} activeOpacity={1} onPress={() => setShowDeleteSheet(false)}>
                    <TouchableOpacity activeOpacity={1} style={[ss.actionSheet, { backgroundColor: CARD_BG, paddingBottom: insets.bottom + 24 }]}>
                        <View style={[ss.sheetHandle, { backgroundColor: DIVIDER }]} />
                        <TouchableOpacity style={ss.modalClose} onPress={() => setShowDeleteSheet(false)}>
                            <Ionicons name="close" size={22} color={TEXT_SEC} />
                        </TouchableOpacity>
                        {/* Icon */}
                        <View style={[ss.sheetIconWrap, { backgroundColor: isDarkMode ? '#2C2C2E' : '#F5F5F5' }]}>
                            <Ionicons name="trash-outline" size={30} color={TEXT} />
                        </View>
                        <Text style={[ss.sheetTitle, { color: TEXT }]}>Supprimer le compte</Text>
                        <Text style={[ss.sheetDesc, { color: TEXT_SEC }]}>
                            ⚠️ Cette action est <Text style={{ fontWeight: '700', color: TEXT }}>irréversible</Text>.{'\n'}
                            Toutes vos données seront définitivement supprimées : profil, documents, avis, compagnons.
                        </Text>

                        {/* Agree checkbox */}
                        <TouchableOpacity
                            style={[ss.agreeRow, { backgroundColor: agreeDelete ? (isDarkMode ? '#2C2C2E' : '#F5F5F5') : (isDarkMode ? '#1A1A1A' : '#F9FAFB'), borderColor: agreeDelete ? TEXT : DIVIDER }]}
                            onPress={() => setAgreeDelete(!agreeDelete)}
                            activeOpacity={0.8}
                        >
                            <View style={[ss.checkbox, { borderColor: agreeDelete ? TEXT : DIVIDER, backgroundColor: agreeDelete ? TEXT : 'transparent' }]}>
                                {agreeDelete && <Ionicons name="checkmark" size={13} color={CARD_BG} />}
                            </View>
                            <Text style={[ss.agreeText, { color: TEXT }]}>
                                Je comprends et j'accepte de supprimer définitivement mon compte
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[ss.sheetPrimaryBtn, { backgroundColor: agreeDelete ? TEXT : DIVIDER }]}
                            onPress={confirmDelete}
                            disabled={!agreeDelete}
                        >
                            <Ionicons name="trash-outline" size={18} color={agreeDelete ? CARD_BG : TEXT_SEC} />
                            <Text style={[ss.sheetPrimaryBtnText, { color: agreeDelete ? CARD_BG : TEXT_SEC }]}>Supprimer mon compte</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const ss = StyleSheet.create({
    // ── Header ───────────────────────────────────────────────────────────────
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,          // Never animate zIndex (RN crash)
        overflow: 'hidden',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
            android: { elevation: 3 },
        }),
    },
    headerBorder: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: StyleSheet.hairlineWidth,
    },
    // Top bar
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 46,
    },
    topBarBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    topBarCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    collapsedInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    topBarAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    topBarName: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.1,
    },

    expandedSection: {
        alignItems: 'center',
        paddingTop: 0,
        marginTop: -32,
    },

    avatarWrap: {
        position: 'relative',
        marginBottom: 2,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#2C5F2D',
    },


    cameraBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },


    userName: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 4,
        letterSpacing: 0.1,
    },


    // Tab bar
    tabBar: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        position: 'relative',
    },
    tabLabel: {
        fontSize: 12,
    },

    tabIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 16,
        right: 16,
        height: 2.5,
        borderRadius: 2,
    },
    // ── Section cards ────────────────────────────────────────────────────────
    sectionLabel: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1.1,
        marginBottom: 6,
        marginLeft: 4,
        marginTop: 14,
    },
    card: {
        borderRadius: 16,
        overflow: 'hidden',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
            android: { elevation: 2 },
        }),
    },
    sep: {
        height: StyleSheet.hairlineWidth,
        marginLeft: 56,
    },

    // ── Empty avis ──────────────────────────────────────────────────────────
    emptyCard: {
        borderRadius: 20,
        padding: 36,
        alignItems: 'center',
        marginTop: 20,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 6,
    },

    emptyText: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 22,
    },

    emptyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 22,
        paddingVertical: 11,
        borderRadius: 12,
    },
    emptyBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },

    // ── Mes avis list ───────────────────────────────────────────────────────
    myReviewCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 14,
    },
    myReviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
        gap: 10,
    },
    myReviewTarget: {
        fontSize: 14,
        fontWeight: '700',
    },
    myReviewDate: {
        fontSize: 12,
        marginTop: 2,
    },
    myReviewStars: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    myReviewComment: {
        fontSize: 13,
        lineHeight: 18,
    },
    // ── QR Modal ─────────────────────────────────────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 12,
        paddingHorizontal: 28,
        paddingBottom: 44,
        alignItems: 'center',
    },
    sheetHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        marginBottom: 12,
    },
    modalClose: {
        position: 'absolute',
        top: 16,
        right: 20,
        padding: 4,
    },
    modalTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 6,
        marginTop: 8,
    },

    modalSub: {
        fontSize: 11,
        textAlign: 'center',
        lineHeight: 16,
        marginBottom: 16,
    },

    qrWrap: {
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 20,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    idBadge: {
        paddingHorizontal: 22,
        paddingVertical: 10,
        borderRadius: 12,
    },
    idText: {
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 1,
    },

    // ── Floating switch button ────────────────────────────────────────────────
    floatBtn: {
        position: 'absolute',
        left: 32,
        right: 32,
        zIndex: 100,
    },
    switchBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 18,

        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 12 },
            android: { elevation: 10 },
        }),
    },
    switchBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
        letterSpacing: 0.2,

    },
    // ── Action bottom sheets ──────────────────────────────────────────────────
    sheetOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    actionSheet: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 12,
        paddingHorizontal: 24,
    },
    sheetIconWrap: {
        width: 50,
        height: 50,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop: 8,
        marginBottom: 12,
    },
    sheetTitle: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },

    sheetDesc: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 20,
    },

    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 14,
        height: 52,
        marginBottom: 14,
    },

    idInput: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        height: '100%',
    },

    sheetPrimaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 13,
        borderRadius: 16,
        marginBottom: 10,
    },

    sheetPrimaryBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },

    sheetCancelBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 11,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 8,
    },

    sheetCancelText: {
        fontSize: 14,
        fontWeight: '600',
    },

    // Agree row (delete account)
    agreeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1.5,
        marginBottom: 16,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    agreeText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 17,
        fontWeight: '500',
    },

    versionContainer: {
        marginTop: 40,
        alignItems: 'center',
        paddingBottom: 20,
    },
    versionText: {
        fontSize: 12,
        fontWeight: '500',
        letterSpacing: 0.5,
        opacity: 0.8,
    },
    // Support Modal Specific Styles
    textArea: {
        borderRadius: 16,
        padding: 12,
        borderWidth: 1.5,
        marginTop: 8,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 4,
        marginLeft: 4,
    },
    textInput: {
        fontSize: 13,
        lineHeight: 18,
    },
    confirmBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 11,
        borderRadius: 14,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    confirmBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    cancelBtn: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    cancelBtnText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
