import CustomDrawer from '@/app/(umrah_agence)/(screens)/(navigation)/drower';
import { ProfileMenuItem } from '@/components/lists/ProfileMenuItem';
import { useThemeColors } from '@/hooks/useThemeColors';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Image,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { DrawerLayout } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { switchRole } from '@/store/authSlice';
import { setBottomNavVisibility } from '@/store/uiSlice';
import { useFocusEffect } from '@react-navigation/native';

import { useProfileVM } from '@/hooks/profile/useProfileVM';

export default function CompanionProfileScreen() {
    const { user, handleLogout: vmLogout, handlePickAndUploadImage } = useProfileVM();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const dispatch = useDispatch();

    const drawerRef = useRef<DrawerLayout | null>(null);

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [switchVisible, setSwitchVisible] = useState(false);
    const [showLogoutSheet, setShowLogoutSheet] = useState(false);
    const [showDeleteSheet, setShowDeleteSheet] = useState(false);
    const [agreeDelete, setAgreeDelete] = useState(false);
    
    // Get current user display info
    const USER_NAME = user ? `${user.firstName} ${user.lastName}` : 'Ameni Aouiti';
    const USER_AVATAR = user?.photo || `https://ui-avatars.com/api/?name=Ameni+Aouiti&background=2C5F2D&color=fff&size=200&bold=true`;
    const COLLAPSED_THRESHOLD = 110;


    // Toggles for settings
    const [darkModeLocal, setDarkModeLocal] = useState(isDarkMode);

    // ── Scroll / Animations ───────────────────────────────────────────────────
    const scrollY = useRef(new Animated.Value(0)).current;
    const switchAnim = useRef(new Animated.Value(0)).current;

    // UI configuration to match main profile exactly
    const HEADER_FIXED = 160 + insets.top;

    // ── Theme tokens ─────────────────────────────────────────────────────────
    const PAGE_BG = isDarkMode ? '#111111' : '#FFFFFF';
    const CARD_BG = isDarkMode ? '#1C1C1E' : '#FFFFFF';
    const TEXT = isDarkMode ? '#FFFFFF' : '#111827';
    const TEXT_SEC = isDarkMode ? '#8A8A8E' : '#6B7280';
    const DIVIDER = isDarkMode ? '#2C2C2E' : '#F3F4F6';
    const PRIMARY = colors.primary;

    // ── Handlers ──────────────────────────────────────────────────────────────
    const closeDrawer = () => {
        setIsDrawerOpen(false);
        drawerRef.current?.closeDrawer();
    };

    const pickImage = handlePickAndUploadImage;

    useFocusEffect(
        React.useCallback(() => {
            dispatch(setBottomNavVisibility(true));
            return () => {
                dispatch(setBottomNavVisibility(true));
            };
        }, [dispatch])
    );

    const lastScrollY = useRef(0);
    const handleVerticalScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        {
            useNativeDriver: false,
            listener: (e: any) => {
                const y = e.nativeEvent.contentOffset.y;
                const isScrollingDown = y > lastScrollY.current;

                if (isScrollingDown && y > 100) {
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

    const handleSwitchMode = async () => {
        try {
            await (dispatch as any)(switchRole('pelerin')).unwrap();
            router.push('/(umrah_agence)/(screens)/(splash)/splash_pelerin');
        } catch (err: any) {
            Alert.alert('Erreur', err || 'Échec du changement de rôle');
        }
    };

    const handleLogout = () => setShowLogoutSheet(true);
    const handleDeleteAccount = () => { setAgreeDelete(false); setShowDeleteSheet(true); };

    const confirmLogout = async () => {
        setShowLogoutSheet(false);
        await vmLogout();
        router.replace('/(auth)/(screens)/login');
    };


    const confirmDelete = () => {
        if (!agreeDelete) return;
        setShowDeleteSheet(false);
        router.replace('/(auth)/(screens)/login');
    };

    const avatarUri = USER_AVATAR;

    // ── Render Items ──────────────────────────────────────────────────────────
    const renderCompanionContent = () => (
        <Animated.ScrollView
            style={{ flex: 1, backgroundColor: PAGE_BG }}
            contentContainerStyle={{
                paddingTop: HEADER_FIXED + 5,
                paddingHorizontal: 16,
                paddingBottom: 220,
            }}
            showsVerticalScrollIndicator={false}
            onScroll={handleVerticalScroll}
            scrollEventThrottle={16}
        >
            {/* ── MON COMPTE ── */}
            <Text style={[ss.sectionLabel, { color: TEXT_SEC, marginTop: 10 }]}>MON COMPTE</Text>
            <View style={[ss.card, { backgroundColor: CARD_BG }]}>
                <ProfileMenuItem
                    icon="person-circle-outline"
                    label="Informations personnelles"
                    onPress={() => { }}
                />
            </View>

            {/* ── RELATIONS & SERVICES (Companion structure) ── */}
            <Text style={[ss.sectionLabel, { color: TEXT_SEC }]}>RELATIONS & SERVICES</Text>
            <View style={[ss.card, { backgroundColor: CARD_BG }]}>
                <ProfileMenuItem
                    icon="people-outline"
                    label="Mes pèlerins"
                    onPress={() => router.push('/(accampagnant)/my_pilgrim')}
                />
                <View style={[ss.sep, { backgroundColor: DIVIDER }]} />
                <ProfileMenuItem
                    icon="business-outline"
                    label="L'agence de mon pèlerin"
                    onPress={() => router.push('/(accampagnant)/pilgrim_agency')}
                />
                <View style={[ss.sep, { backgroundColor: DIVIDER }]} />
                <ProfileMenuItem
                    icon="map-outline"
                    label="Le guide de mon pèlerin"
                    onPress={() => router.push('/(accampagnant)/pilgrim_guide')}
                />
            </View>

            {/* ── PARAMÈTRES ── */}
            <Text style={[ss.sectionLabel, { color: TEXT_SEC }]}>PARAMÈTRES</Text>
            <View style={[ss.card, { backgroundColor: CARD_BG }]}>
                <ProfileMenuItem
                    icon="moon-outline"
                    label="Mode sombre"
                    type="toggle"
                    value={darkModeLocal}
                    onValueChange={setDarkModeLocal}
                />
            </View>

            {/* ── COMPTE ── */}
            <Text style={[ss.sectionLabel, { color: TEXT_SEC }]}>COMPTE</Text>
            <View style={[ss.card, { backgroundColor: CARD_BG }]}>
                <ProfileMenuItem
                    icon="log-out-outline"
                    label="Se déconnecter"
                    onPress={handleLogout}
                />
                <View style={[ss.sep, { backgroundColor: DIVIDER }]} />
                <ProfileMenuItem
                    icon="trash-outline"
                    label="Supprimer le compte"
                    onPress={handleDeleteAccount}
                />
            </View>

            <View style={ss.versionContainer}>
                <Text style={[ss.versionText, { color: TEXT_SEC }]}>Sabeel V1.0.0 (Accompagnant)</Text>
            </View>
        </Animated.ScrollView>
    );

    return (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            <DrawerLayout
                ref={drawerRef}
                drawerWidth={300}
                drawerPosition="left"
                drawerType="front"
                drawerBackgroundColor="transparent"
                renderNavigationView={() => (
                    <CustomDrawer navigation={{ closeDrawer: () => drawerRef.current?.closeDrawer() }} />
                )}
                onDrawerClose={closeDrawer}
            >
                {isDrawerOpen && (
                    <BlurView
                        intensity={20}
                        tint={isDarkMode ? 'dark' : 'light'}
                        style={StyleSheet.absoluteFill}
                    />
                )}

                <SafeAreaView style={{ flex: 1, backgroundColor: PAGE_BG }} edges={['bottom']}>

                    {/* ════════ ANIMATED HEADER ════════ */}
                    <Animated.View
                        style={[
                            ss.header,
                            {
                                height: HEADER_FIXED,
                                backgroundColor: PAGE_BG,
                                paddingTop: insets.top - 40,
                            },
                        ]}
                    >
                        {/* ── Top bar ── */}
                        <View style={ss.topBar}>
                        </View>

                        {/* ── Expanded profile ── */}
                        <Animated.View style={[ss.expandedSection, { marginTop: -35 }]}>
                            <TouchableOpacity onPress={pickImage} activeOpacity={0.85} style={ss.avatarWrap}>
                                <Image source={{ uri: avatarUri }} style={[ss.avatar, { borderColor: PRIMARY }]} />
                                <View style={[ss.cameraBadge, { backgroundColor: PRIMARY, borderColor: PAGE_BG }]}>
                                    <Ionicons name="camera" size={11} color="#fff" />
                                </View>
                            </TouchableOpacity>

                            <Text style={[ss.userName, { color: TEXT }]}>{USER_NAME}</Text>
                        </Animated.View>
                    </Animated.View>

                    {/* ════════ MAIN CONTENT ═══════ */}
                    <View style={{ flex: 1 }}>
                        {renderCompanionContent()}
                    </View>

                </SafeAreaView>

                {/* ════════ FLOATING SWITCH BUTTON ════════ */}
                <Animated.View
                    pointerEvents={switchVisible ? 'auto' : 'none'}
                    style={[
                        ss.floatBtn,
                        {
                            opacity: switchAnim,
                            bottom: 120,
                            transform: [{
                                translateY: switchAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [80, 0],
                                }),
                            }],
                        },
                    ]}
                >
                    <TouchableOpacity
                        style={[ss.switchBtn, { backgroundColor: colors.secondary }]}
                        onPress={handleSwitchMode}
                        activeOpacity={0.88}
                    >
                        <Ionicons name="person" size={17} color="#fff" />
                        <Text style={ss.switchBtnText}>Retourner à devenir pèlerin</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* ════════ LOGOUT / DELETE SHEETS ════════ */}
                <Modal visible={showLogoutSheet} transparent animationType="slide" onRequestClose={() => setShowLogoutSheet(false)}>
                    <TouchableOpacity style={ss.sheetOverlay} activeOpacity={1} onPress={() => setShowLogoutSheet(false)}>
                        <TouchableOpacity activeOpacity={1} style={[ss.actionSheet, { backgroundColor: CARD_BG, paddingBottom: insets.bottom + 24 }]}>
                            <View style={[ss.sheetHandle, { backgroundColor: DIVIDER }]} />
                            <TouchableOpacity style={ss.modalClose} onPress={() => setShowLogoutSheet(false)}>
                                <Ionicons name="close" size={22} color={TEXT_SEC} />
                            </TouchableOpacity>
                            <View style={[ss.sheetIconWrap, { backgroundColor: isDarkMode ? '#2C2C2E' : 'rgba(44,95,45,0.1)' }]}>
                                <Ionicons name="log-out-outline" size={30} color={PRIMARY} />
                            </View>
                            <Text style={[ss.sheetTitle, { color: TEXT }]}>Se déconnecter</Text>
                            <Text style={[ss.sheetDesc, { color: TEXT_SEC }]}>Vous allez être déconnecté de votre espace accompagnant.</Text>
                            <TouchableOpacity style={[ss.sheetPrimaryBtn, { backgroundColor: PRIMARY }]} onPress={confirmLogout}>
                                <Ionicons name="log-out-outline" size={18} color="#fff" />
                                <Text style={ss.sheetPrimaryBtnText}>Se déconnecter</Text>
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
                            <View style={[ss.sheetIconWrap, { backgroundColor: isDarkMode ? '#2C2C2E' : '#F5F5F5' }]}>
                                <Ionicons name="trash-outline" size={30} color={TEXT} />
                            </View>
                            <Text style={[ss.sheetTitle, { color: TEXT }]}>Supprimer le compte</Text>
                            <TouchableOpacity
                                style={[ss.agreeRow, { backgroundColor: agreeDelete ? (isDarkMode ? '#2C2C2E' : '#F5F5F5') : (isDarkMode ? '#1A1A1A' : '#F9FAFB'), borderColor: agreeDelete ? TEXT : DIVIDER }]}
                                onPress={() => setAgreeDelete(!agreeDelete)}
                            >
                                <View style={[ss.checkbox, { borderColor: agreeDelete ? TEXT : DIVIDER, backgroundColor: agreeDelete ? TEXT : 'transparent' }]}>
                                    {agreeDelete && <Ionicons name="checkmark" size={13} color={CARD_BG} />}
                                </View>
                                <Text style={[ss.agreeText, { color: TEXT }]}>Je confirme la suppression de mon compte</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[ss.sheetPrimaryBtn, { backgroundColor: agreeDelete ? TEXT : DIVIDER }]} onPress={confirmDelete} disabled={!agreeDelete}>
                                <Ionicons name="trash-outline" size={18} color={agreeDelete ? CARD_BG : TEXT_SEC} />
                                <Text style={[ss.sheetPrimaryBtnText, { color: agreeDelete ? CARD_BG : TEXT_SEC }]}>Supprimer mon compte</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>
            </DrawerLayout>
        </View>
    );
}

const ss = StyleSheet.create({
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        overflow: 'hidden',
    },
    headerBorder: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: StyleSheet.hairlineWidth,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 46,
    },
    topBarBtn: {
        width: 40,
        height: 40,
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
        fontSize: 15,
        fontWeight: '700',
    },
    expandedSection: {
        alignItems: 'center',
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
    },
    userName: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 4,
    },
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
        paddingVertical: 14,
        borderRadius: 18,
    },
    switchBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    // Action sheets
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
    sheetHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 12,
    },
    modalClose: {
        position: 'absolute',
        top: 16,
        right: 20,
        padding: 4,
    },
    sheetIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop: 8,
        marginBottom: 12,
    },
    sheetTitle: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    sheetDesc: {
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    sheetPrimaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 15,
        borderRadius: 16,
        marginBottom: 10,
    },
    sheetPrimaryBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
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
        fontSize: 13,
    },
    versionContainer: {
        marginTop: 40,
        alignItems: 'center',
        paddingBottom: 20,
    },
    versionText: {
        fontSize: 12,
        fontWeight: '500',
    },
});
