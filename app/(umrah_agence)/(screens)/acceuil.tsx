import { Ionicons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Status from './(avis)/status';
import AppBar from './(navigation)/app_barr';
import AssistantChat from './assistant';
import { useTrans } from '../../../hooks/useTrans';

const { width } = Dimensions.get('window');

const MOCK_DOUAA = [
    { id: '1', text: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ", source: "سورة البقرة", icon: 'pray' },
    { id: '2', text: "رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ", source: "سورة إبراهيم", icon: 'hands' },
    { id: '3', text: "سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ", source: "أذكار", icon: 'moon' },
];

import { useDrawer } from '@/context/DrawerContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';

import PrayerTimerCard from '../../../components/spirituel/PrayerTimerCard';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { AppDispatch, RootState } from '../../../store/store';
import { fetchProfile } from '../../../store/authSlice';
import { reviewsApi } from '@/services/api';


// Sabeel Theme Colors - Consistent with Post Screen
const COLORS = {
    primary: '#B8860B',
    primaryGreen: '#2C5F2D',
    secondary: '#DAA520',
    accent: '#D4AF37',
    background: '#f8f7f2', // Updated to match solo.tsx/Colors.ts
    white: '#FFFFFF',
    text: '#2C3E50',
    lightText: '#999999',
    divider: '#E0E0E0',
    success: '#27AE60'
};

export default function AcceuilScreen() {
    const { t } = useTrans();
    const router = useRouter();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const selectedCategory = useSelector((state: RootState) => state.umrah.selectedCategory);
    const user = useSelector((state: RootState) => state.auth.user);
    const dispatch = useDispatch<AppDispatch>();
    const { openDrawer } = useDrawer();
    const [activeTab, setActiveTab] = useState('Accueil');

    // Load profile each time screen focuses to keep name & photo dynamic
    useFocusEffect(
        React.useCallback(() => {
            dispatch(fetchProfile()).catch(() => {});
        }, [dispatch])
    );


    const [reactCounts, setReactCounts] = useState<{ [key: number]: { like: number; comment: number; share: number } }>({});
    const [userReactions, setUserReactions] = useState<{ [key: number]: string | null }>({});
    const [shareModal, setShareModal] = useState(false);
    const [assistantModal, setAssistantModal] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const params = useLocalSearchParams();

    // Animation for the profile highlight
    const highlightAnim = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (params.showProfileHighlight === 'true') {
            Animated.spring(highlightAnim, {
                toValue: 1,
                tension: 20,
                friction: 7,
                useNativeDriver: true,
            }).start();
        }
    }, [params.showProfileHighlight]);

    // Moved chat logic to AssistantChat component

    const lastScrollY = useRef(0);
    const { width } = Dimensions.get('window');

    // --- MOCK STATE FOR NEW FEATURES ---
    const [alerts, setAlerts] = useState<{ id: number; type: string; message: string; action: string; }[]>([]);

    const assistantMessages = [
        { id: '1', title: t('Besoin d’aide pour choisir ?'), subtitle: t('Laissez-nous vous guider'), intent: 'help_choose', icon: 'question-circle', color: '#4A90E2' },
        { id: '2', title: t('Quel est votre budget ?'), subtitle: t('Trouvons l’offre idéale'), intent: 'budget_match', icon: 'money-bill-wave', color: '#27AE60' },
        { id: '3', title: t('Comparez les packs'), subtitle: t('Simplement et rapidement'), intent: 'compare_packs', icon: 'balance-scale', color: '#F39C12' },
    ];

    const carouselRef = useRef<FlatList>(null);
    const [carouselIndex, setCarouselIndex] = useState(0);

    // Auto-scroll carousel effect
    React.useEffect(() => {
        const interval = setInterval(() => {
            if (carouselRef.current) {
                let nextIndex = carouselIndex + 1;
                if (nextIndex >= assistantMessages.length) {
                    nextIndex = 0;
                }
                carouselRef.current.scrollToIndex({ index: nextIndex, animated: true });
                setCarouselIndex(nextIndex);
            }
        }, 5000); // Change every 5 seconds
        return () => clearInterval(interval);
    }, [carouselIndex]);

    const handleAssistantAction = (intent: string) => {
        // Navigate to Assistant with intent
        router.push('/(umrah_agence)/(screens)/assistant');
        console.log('Assistant Intent:', intent);
    };

    const renderAlerts = () => {
        if (alerts.length === 0) return null;
        return (
            <View style={styles.alertsContainer}>
                {alerts.map(alert => (
                    <View key={alert.id} style={[styles.alertCard, alert.type === 'warning' ? [styles.alertWarning, { backgroundColor: isDarkMode ? '#4A2B10' : '#FDEDEC' }] : [styles.alertInfo, { backgroundColor: isDarkMode ? '#1A2F3E' : '#EBF5FB' }]]}>
                        <View style={styles.alertContent}>
                            <FontAwesome5 name={alert.type === 'warning' ? 'exclamation-triangle' : 'info-circle'} size={16} color={alert.type === 'warning' ? '#D35400' : colors.primary} />
                            <Text style={[styles.alertText, { color: colors.text }]}>{alert.message}</Text>
                        </View>
                        <TouchableOpacity style={[styles.alertButton, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.alertButtonText, { color: alert.type === 'warning' ? '#D35400' : colors.primary }]}>{alert.action}</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        );
    };


    const renderAssistantCarousel = () => {
        return (
            <View style={styles.carouselContainer}>
                <FlatList
                    ref={carouselRef}
                    data={assistantMessages}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={item => item.id}
                    onScroll={(e) => {
                        const contentOffsetX = e.nativeEvent.contentOffset.x;
                        const currentIndex = Math.round(contentOffsetX / (width - 40));
                        setCarouselIndex(currentIndex);
                    }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.carouselItem, { width: width - 40 }]} // Adjust width for padding
                            onPress={() => handleAssistantAction(item.intent)}
                        >
                            <LinearGradient
                                colors={isDarkMode ? ['#1e1e1e', '#2a2a2a'] : ['#fff', '#f9f9f9']}
                                style={[styles.carouselCard, { borderColor: colors.divider }]}
                            >
                                <View style={[styles.carouselIcon, { backgroundColor: item.color + '20' }]}>
                                    <FontAwesome5 name={item.icon} size={20} color={item.color} />
                                </View>
                                <View style={styles.carouselText}>
                                    <Text style={[styles.carouselTitle, { color: colors.text }]}>{item.title}</Text>
                                    <Text style={[styles.carouselSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
                                </View>
                                <FontAwesome5 name="chevron-right" size={14} color={colors.textLight} />
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                />
                <View style={styles.carouselPagination}>
                    {assistantMessages.map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.paginationDot,
                                i === carouselIndex ? styles.paginationDotActive : null
                            ]}
                        />
                    ))}
                </View>
            </View>
        );
    };
    const handleShare = (reviewId: number) => {
        setShareModal(true);
    };

    const handleReaction = (reviewId: number, reactionType: string) => {
        const currentReaction = userReactions[reviewId];
        const newReaction = currentReaction === reactionType ? null : reactionType;

        setUserReactions({
            ...userReactions,
            [reviewId]: newReaction,
        });

        setReactCounts({
            ...reactCounts,
            [reviewId]: {
                like: (reactCounts[reviewId]?.like || 0) + (newReaction === 'like' ? (currentReaction === 'like' ? -1 : 1) : (currentReaction === 'like' ? -1 : 0)),
                comment: reactCounts[reviewId]?.comment || 0,
                share: reactCounts[reviewId]?.share || 0,
            },
        });
    };

    const [realReviews, setRealReviews] = useState<any[]>([]);

    const fetchRealReviews = async () => {
        try {
            const res = await reviewsApi.feed();
            if (res.data && Array.isArray(res.data.reviews)) {
                const mapped = res.data.reviews.map((r: any) => {
                    const authorName = `${r.author?.firstName || ''} ${r.author?.lastName || ''}`.trim() || 'Pèlerin';
                    let avatarSource = require('../../../assets/images/user1.jpg');
                    if (r.author?.photo) {
                        const photoUrl = r.author.photo.startsWith('http') 
                            ? r.author.photo 
                            : `http://192.168.1.14:3001${r.author.photo}`;
                        avatarSource = { uri: photoUrl };
                    }
                    return {
                        id: r.id,
                        name: authorName,
                        entityName: r.targetName || (r.targetType === 'AGENCE' ? 'Agence' : 'Guide'),
                        type: r.targetType,
                        rating: Number(r.rating || 5),
                        comment: r.comment || '',
                        image: avatarSource,
                        date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                        }) : 'Récemment',
                        timestamp: r.createdAt ? new Date(r.createdAt).getTime() : Date.now(),
                        userId: r.author?.id || r.authorUserId || '',
                        comments: r.comments || []
                    };
                });
                setRealReviews(mapped);
            }
        } catch (err) {
            console.error('[Acceuil] Failed to fetch real reviews', err);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchRealReviews();
        }, [])
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
                {/* AppBar Component */}
                <AppBar
                    onMenuPress={openDrawer}
                    showAvatar={true}
                    showSearch={true}
                    showNotification={true}
                />


                {/* Scrollable Content */}
                <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.welcomeSection}>
                        <Text style={[styles.welcomeGreeting, { color: colors.text }]}>
                            {t('Salam, ')}<Text style={[styles.welcomeLabel, { color: colors.text }]}>{user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : t('vous')}</Text>
                        </Text>


                    </View>

                    {/* Profile Completion Highlight */}
                    {params.showProfileHighlight === 'true' && (
                        <Animated.View style={[
                            styles.highlightBanner,
                            {
                                opacity: highlightAnim,
                                transform: [{
                                    translateY: highlightAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [-20, 0]
                                    })
                                }]
                            }
                        ]}>
                            <View style={styles.highlightContent}>
                                <View style={styles.highlightIconContainer}>
                                    <Ionicons name="person-circle" size={32} color={colors.primary} />
                                </View>
                                <View style={styles.highlightTextContainer}>
                                    <Text style={[styles.highlightTitle, { color: colors.text }]}>{t('Complétez votre profil')}</Text>
                                    <Text style={[styles.highlightSubtitle, { color: colors.textSecondary }]}>{t('Plus que quelques étapes pour débloquer toutes les fonctionnalités.')}</Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.highlightButton, { backgroundColor: colors.primary }]}
                                    onPress={() => router.push('/(umrah_agence)/(screens)/profile/profile')}
                                >
                                    <Text style={styles.highlightButtonText}>Go</Text>
                                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    )}

                    {/* Action Cards Container */}
                    <View style={styles.actionCardsContainer}>
                        {/* Left Large Green Card - Sabeel Wallet */}
                        <TouchableOpacity
                            style={styles.largeCard}
                            onPress={() => router.push('/(umrah_agence)/(screens)/(carte)/portfeuille')}
                        >
                            <View style={styles.walletCard}>
                                <View style={styles.walletHeader}>
                                    <FontAwesome5 name="wallet" size={18} color="#fff" />
                                </View>
                                <View style={styles.walletFooter}>
                                    <Text style={styles.walletLabel}>Sabeel Wallet</Text>
                                    <Text style={styles.walletAmount}>1.250,00 €</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Right Section */}
                        <View style={styles.rightActionSection}>
                            {/* Top Right Card - Formules */}
                            <TouchableOpacity
                                style={styles.mediumCard}
                                onPress={() => router.push('/(umrah_agence)/(screens)/(categories)/categories')}
                            >
                                <View style={styles.formulesCard}>
                                    <View style={styles.iconCircleCream}>
                                        <FontAwesome5 name="cubes" size={18} color="#d9ab83" solid />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.actionCardText}>{t('Formules')}</Text>
                                        <Text style={styles.actionCardSubtitle} numberOfLines={2}>
                                            {t('Vols, Logement, Guide, Pack avec Agence')}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            {/* Bottom Row - Logement, Vols & Guide */}
                            <View style={styles.bottomActionRow}>
                                <TouchableOpacity
                                    style={[styles.smallActionCard, { flex: 2.5 }]}
                                    onPress={() => { /* Navigate to Logement */ }}
                                >
                                    <View style={[styles.actionCardInner, { backgroundColor: '#fff' }]}>
                                        <FontAwesome5 name="bed" size={14} color="#1a472a" solid />
                                        <Text style={styles.smallActionCardText}>{t('LOGEMENT')}</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.smallActionCard, { flex: 2.5 }]}
                                    onPress={() => { /* Navigate to Vols */ }}
                                >
                                    <View style={[styles.actionCardInner, { backgroundColor: '#fff' }]}>
                                        <FontAwesome5 name="plane" size={14} color="#d9ab83" solid />
                                        <Text style={styles.smallActionCardText}>{t('VOLS')}</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.smallActionCard, { flex: 2.5 }]}
                                    onPress={() => { /* Navigate to Guide */ }}
                                >
                                    <View style={[styles.actionCardInner, { backgroundColor: '#fff' }]}>
                                        <FontAwesome5 name="user-alt" size={14} color="#1a472a" solid />
                                        <Text style={styles.smallActionCardText}>{t('GUIDE')}</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* 1. Alerts Section (Hidden if empty) */}
                    {renderAlerts()}

                    {/* Spiritual Section (Prayer Timer) */}
                    <Text style={[styles.sectionHeaderMini, { color: colors.text }]}>{t('Spirituelle')}</Text>
                    <PrayerTimerCard />

                    {/* Adhkar & Douaa Horizontal Cards */}
                    <View style={styles.douaaSection}>
                        <FlatList
                            data={MOCK_DOUAA}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => item.id}
                            snapToInterval={width - 50}
                            decelerationRate="fast"
                            contentContainerStyle={{ paddingHorizontal: 15, gap: 12 }}
                            renderItem={({ item }) => (
                                <LinearGradient
                                    colors={isDarkMode ? ['#2c2c2c', '#1e1e1e'] : ['#FDFBF7', '#F5F2EA']}
                                    style={[styles.douaaCard, { borderColor: colors.divider }]}
                                >
                                    <View style={styles.douaaHeader}>
                                        <FontAwesome5 name={item.icon} size={14} color={COLORS.primaryGreen} />
                                        <Text style={[styles.douaaSource, { color: colors.textSecondary }]}>{item.source}</Text>
                                    </View>
                                    <Text style={[styles.douaaText, { color: colors.text, textAlign: 'right', writingDirection: 'rtl' }]} numberOfLines={3}>
                                        "{item.text}"
                                    </Text>
                                </LinearGradient>
                            )}
                        />
                    </View>

                    {/* 3. Assistant Section */}
                    <Text style={[styles.sectionHeaderMini, { color: colors.text }]}>{t('Assistant Sabeel')}</Text>
                    {renderAssistantCarousel()}

                    {/* Spacer */}
                    <View style={{ height: 10 }} />

                    {/* Reviews Section */}
                    <View style={styles.reviewsSection}>
                        <View style={{ marginBottom: 15 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                                <Text style={[styles.sectionHeaderMini, { color: colors.text, opacity: 0.8, paddingHorizontal: 0, marginBottom: 0 }]}>{t('AVIS PÈLERINS')}</Text>
                                <TouchableOpacity
                                    onPress={() => router.push('/(umrah_agence)/(screens)/(avis)/post')}
                                >
                                    <Text style={[styles.seeMoreText, { color: '#d9ab83', textTransform: 'uppercase', fontWeight: 'bold' }]}>{t('VOIR PLUS')}</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.reviewsSubtitle, { color: colors.textSecondary }]}>
                                {t("Ce que les autres pèlerins disent sur les agences")}
                            </Text>
                        </View>

                        <FlatList
                            data={realReviews}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => `${item.id}`}
                            contentContainerStyle={styles.reviewsList}
                            renderItem={({ item: review }) => (
                                <View style={{ width: width - 40, marginRight: 15 }}>
                                    {/* Wrapped in a fixed width view for horizontal scroll */}
                                    <Status
                                        review={review}
                                        onSharePress={handleShare}
                                        currentUserId={user?.id}
                                        containerStyle={{
                                            marginHorizontal: 0,
                                            width: '100%',
                                            height: 180,
                                            backgroundColor: '#fff',
                                            borderWidth: 0,
                                            elevation: 0
                                        }}
                                        minimal={true}
                                    />
                                </View>
                            )}
                        />
                    </View>
                    {/* Bottom Padding for Scroll */}
                    <View style={{ height: 120 }} />
                </ScrollView>
            </SafeAreaView>

            {/* Share Modal */}
            <Modal
                visible={shareModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShareModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.shareModal, { backgroundColor: colors.surface }]}>
                        <View style={styles.shareModalHeader}>
                            <Text style={[styles.shareModalTitle, { color: colors.text }]}>Partager cet avis</Text>
                            <TouchableOpacity onPress={() => setShareModal(false)}>
                                <FontAwesome5 name="times" size={20} color={colors.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.shareOptions}>
                            <TouchableOpacity style={[styles.shareOption, { backgroundColor: isDarkMode ? '#2D2D2D' : '#F5F4DF' }]}>
                                <FontAwesome5 name="facebook" size={24} color="#1877F2" />
                                <Text style={styles.shareOptionText}>Facebook</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.shareOption, { backgroundColor: isDarkMode ? '#2D2D2D' : '#F5F4DF' }]}>
                                <FontAwesome5 name="whatsapp" size={24} color="#25D366" />
                                <Text style={styles.shareOptionText}>WhatsApp</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.shareOption, { backgroundColor: isDarkMode ? '#2D2D2D' : '#F5F4DF' }]}>
                                <FontAwesome5 name="twitter" size={24} color="#1DA1F2" />
                                <Text style={styles.shareOptionText}>Twitter</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.shareOption, { backgroundColor: isDarkMode ? '#2D2D2D' : '#F5F4DF' }]}>
                                <FontAwesome5 name="copy" size={24} color={colors.textSecondary} />
                                <Text style={[styles.shareOptionText, { color: colors.text }]}>Copier le lien</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>




            {/* Assistant Modal (Popup) */}
            <Modal
                visible={assistantModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setAssistantModal(false)}
            >
                <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
                    {/* Use the extracted component */}
                    <AssistantChat onClose={() => setAssistantModal(false)} />
                </KeyboardAvoidingView>
            </Modal>
            {/* Assistant FAB */}
            <TouchableOpacity
                style={[styles.assistantFab, { backgroundColor: colors.surface, borderColor: colors.accent }]}
                onPress={() => setAssistantModal(true)}
            >
                <Image
                    source={require('../../../assets/images/ai.jpg')}
                    style={{ width: '60%', height: '60%' }}
                    resizeMode="contain"
                    tintColor={colors.accent}
                />
            </TouchableOpacity>

        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background, // Updated background
    },
    headerContainer: {
        paddingHorizontal: 15,
        paddingTop: 0, // Minimized to 0
        paddingBottom: 5,
        backgroundColor: '#f8f7f2',
        zIndex: 10,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 0,
    },
    menuButton: {
        padding: 5,
        marginLeft: -5,
    },
    headerAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#2C5F2D',
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 18,
        marginHorizontal: 12,
        paddingHorizontal: 10,
        height: 36,
        elevation: 1, // Reduced elevation
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, // More subtle shadow
        shadowRadius: 1,
        borderWidth: 1,
        borderColor: '#E0E0E0', // subtle border for definition
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        paddingVertical: 0,
    },
    notificationButton: {
        width: 34,
        height: 34,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 17,
        backgroundColor: '#fff',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
    },
    // FAB Styles
    assistantFab: {
        position: 'absolute',
        bottom: 120, // Increased spacing from bottom nav
        right: 20,
        zIndex: 100,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        // Container styles
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Removed sosText style as it's no longer used
    scrollContent: {
        flex: 1,
    },

    // --- New Features Styles ---
    alertsContainer: {
        paddingHorizontal: 15,
        marginTop: 15,
        gap: 10,
    },
    alertCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
    },
    alertWarning: {
        backgroundColor: '#FDEDEC',
        borderColor: '#FADBD8',
    },
    alertInfo: {
        backgroundColor: '#EBF5FB',
        borderColor: '#D6EAF8',
    },
    alertContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    alertText: {
        fontSize: 12,
        color: '#333',
        fontWeight: '600',
    },
    alertButton: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: '#fff',
        borderRadius: 15,
    },
    alertButtonText: {
        fontSize: 10,
        fontWeight: 'bold',
    },

    statusBannerContainer: {
        paddingHorizontal: 15,
        marginTop: 15,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    statusIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    statusTextContainer: {
        flex: 1,
    },
    statusTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    statusMessage: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 11,
    },
    statusButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusButtonText: {
        color: '#1a472a',
        fontSize: 10,
        fontWeight: 'bold',
    },

    carouselContainer: {
        marginTop: 15,
        marginBottom: 10,
    },
    carouselItem: {
        paddingHorizontal: 5,
        paddingLeft: 20,
    },
    carouselCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
        elevation: 1,
    },
    carouselIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    carouselText: {
        flex: 1,
    },
    carouselTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#333',
    },
    carouselSubtitle: {
        fontSize: 11,
        color: '#777',
    },
    carouselPagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 8,
        gap: 5,
    },
    paginationDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#ccc',
    },
    paginationDotActive: {
        backgroundColor: '#2C5F2D',
        width: 12,
    },

    actionCardsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        height: 180,
        gap: 12,
        marginTop: 10,
        marginBottom: 15,
    },
    largeCard: {
        flex: 1,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#1e4220',
    },
    walletCard: {
        flex: 1,
        padding: 20,
        justifyContent: 'space-between',
    },
    walletHeader: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    walletFooter: {
        gap: 4,
    },
    walletLabel: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
        opacity: 0.9,
    },
    walletAmount: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    rightActionSection: {
        flex: 1.8,
        gap: 12,
    },
    mediumCard: {
        flex: 1,
        backgroundColor: '#F1EFED',
        borderRadius: 24,
        padding: 15,
        justifyContent: 'center',
    },
    formulesCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconCircleCream: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(139, 125, 107, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionCardText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2C3E50',
    },
    actionCardSubtitle: {
        fontSize: 9,
        color: '#777',
        marginTop: 2,
        lineHeight: 12,
    },
    bottomActionRow: {
        flex: 1.3,
        flexDirection: 'row',
        gap: 6,
    },
    smallActionCard: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
    },
    actionCardInner: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
        padding: 4,
    },
    smallActionCardText: {
        fontSize: 7.5,
        fontWeight: '900',
        color: '#2C3E50',
        textAlign: 'center',
    },



    // Reviews Section
    reviewsSection: {
        paddingHorizontal: 15,
        paddingTop: 10,
        paddingBottom: 20,
    },
    reviewsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a472a',
        marginBottom: 5,
    },
    reviewsSubtitle: {
        fontSize: 12,
        color: '#999',
        marginBottom: 8,
    },
    reviewsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    seeMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    douaaSection: {
        marginTop: 5,
        marginBottom: 5,
    },
    douaaCard: {
        width: width - 60,
        padding: 12,
        borderRadius: 15,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    douaaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    douaaSource: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    douaaText: {
        fontSize: 13,
        lineHeight: 18,
        fontStyle: 'italic',
        fontWeight: '500',
    },
    seeMoreText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2C5F2D',
    },
    reviewsList: {
        paddingRight: 15,
    },
    reviewCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 16,
        marginRight: 12,
        width: 300,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    reviewHeader: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    userProfileImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
        backgroundColor: '#E0E0E0',
    },
    reviewerInfo: {
        flex: 1,
    },
    reviewerName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a472a',
    },

    reviewDate: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    ratingValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2C5F2D',
        marginLeft: 6,
    },
    reviewComment: {
        fontSize: 13,
        color: '#555',
        lineHeight: 20,
        marginBottom: 14,
    },
    reactionContainer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        paddingTop: 12,
        justifyContent: 'space-around',
    },
    reactionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    reactionText: {
        fontSize: 11,
        color: '#999',
        fontWeight: '500',
        marginLeft: 6,
    },
    reactionButtonActive: {
        backgroundColor: 'rgba(44, 95, 45, 0.1)',
    },
    reactionTextActive: {
        color: '#2C5F2D',
    },
    welcomeSection: {
        paddingHorizontal: 15,
        paddingTop: 10,
        paddingBottom: 5,
    },
    welcomeGreeting: {
        fontSize: 18,
        fontWeight: '500',
    },
    welcomeLabel: {
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    sectionHeaderMini: {
        fontSize: 14,
        fontWeight: '700',
        paddingHorizontal: 20,
        marginTop: 15,
        marginBottom: 5,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        opacity: 0.8,
    },
    sectionSubtitle: {
        fontSize: 12,
        marginTop: 1,
        opacity: 0.7,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    shareModal: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 25,
        paddingBottom: 40,
    },
    shareModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    shareModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a472a',
    },
    shareOptions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    shareOption: {
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 15,
    },
    shareOptionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2C5F2D',
        marginTop: 8,
        textAlign: 'center',
    },
    // Assistant Modal Styles
    assistantModalContent: {
        flex: 1,
        marginTop: 100, // Slide up, leaving top space
        backgroundColor: '#fff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    assistantHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
    },
    assistantTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2C5F2D',
    },
    assistantSubtitle: {
        fontSize: 12,
        color: '#d9ab83',
    },
    chatList: {
        flex: 1,
        backgroundColor: '#f8f7f2',
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 15,
        marginBottom: 10,
    },
    userBubble: {
        backgroundColor: '#2C5F2D', // Green for user
        alignSelf: 'flex-end',
        borderBottomRightRadius: 2,
    },
    assistantBubble: {
        backgroundColor: '#E8E6D0', // Beige for assistant
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 2,
    },
    messageText: {
        fontSize: 14,
        color: '#333',
    },
    inputArea: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    chatInput: {
        flex: 1,
        height: 44,
        backgroundColor: '#f5f5f5',
        borderRadius: 22,
        paddingHorizontal: 15,
        marginRight: 10,
        color: '#333',
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#d9ab83',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // New Review Card Styles
    cardAccent: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    avatarContainer: {
        position: 'relative',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 0,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.success,
        borderWidth: 2,
        borderColor: '#fff',
    },
    agencyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 2,
    },
    agencyName: {
        fontSize: 10,
        color: COLORS.primaryGreen,
        fontWeight: '600',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF9E7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 4,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    ratingBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.accent,
    },
    // Highlight Banner Styles
    highlightBanner: {
        marginHorizontal: 15,
        marginTop: 5,
        backgroundColor: '#fff',
        borderRadius: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: '#F0F7F2',
        overflow: 'hidden',
    },
    highlightContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    highlightIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F0F7F2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    highlightTextContainer: {
        flex: 1,
    },
    highlightTitle: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    highlightSubtitle: {
        fontSize: 12,
        marginTop: 2,
        lineHeight: 16,
    },
    highlightButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 4,
    },
    highlightButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },
});

