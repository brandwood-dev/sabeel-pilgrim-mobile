import BookingModal from '@/components/booking/BookingModal';
import GreenDotsLoader from '@/components/common/GreenDotsLoader';
import { useThemeColors } from '@/hooks/useThemeColors';
import { RootState } from '@/store/store';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Platform,
    TextInput,
    RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTrans } from '@/hooks/useTrans';
import { toggleGuideFavorite } from '@/store/umrahSlice';

const PRIMARY_COLOR = '#2C5F2D';

const DEFAULT_GUIDE_IMAGE = require('../../../assets/images/user1.jpg');

import { guideApi, reservationApi } from '@/services/api';
import { useFocusEffect } from '@react-navigation/native';

export function GuideList({
    searchQuery: externalQuery,
}: {
    searchQuery?: string;
}) {
    const { t } = useTrans();
    const router = useRouter();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const CARD = isDarkMode ? '#1C1C1E' : '#FFFFFF';
    const TXT = isDarkMode ? '#fff' : '#1C1C1E';
    const TXT_SEC = isDarkMode ? '#8E8E93' : '#636366';
    const BD = isDarkMode ? '#38383A' : '#E5E5EA';
    const dispatch = useDispatch();
    const guideFavorites = useSelector((state: RootState) => (state.umrah as any).guideFavorites || []);
    const [bookingModalVisible, setBookingModalVisible] = useState(false);
    const [selectedGuide, setSelectedGuide] = useState<any | null>(null);
    const [guides, setGuides] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(externalQuery || '');
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState(t('Tous'));

    const FILTERS = [
        { label: t('Tous'), icon: 'grid-outline' },
        { label: t('Mieux Notés'), icon: 'star-outline' },
        { label: t('Prix Croissant'), icon: 'trending-up-outline' },
        { label: t('Plus Expérimentés'), icon: 'ribbon-outline' }
    ];

    const filteredGuides = guides.filter((guide) => {
        const query = searchQuery.toLowerCase();
        const matchesQuery = (
            guide.firstName?.toLowerCase().includes(query) ||
            guide.lastName?.toLowerCase().includes(query) ||
            guide.specialties?.some((s: string) => s.toLowerCase().includes(query)) ||
            guide.languages?.some((l: string) => l.toLowerCase().includes(query))
        );
        return matchesQuery;
    }).sort((a, b) => {
        if (activeFilter === t('Mieux Notés')) return (b.rating || 0) - (a.rating || 0);
        if (activeFilter === t('Prix Croissant')) return (a.pricePerDay || 0) - (b.pricePerDay || 0);
        if (activeFilter === t('Plus Expérimentés')) return (b.experience || 0) - (a.experience || 0);
        return 0;
    });

    useFocusEffect(
        React.useCallback(() => {
            fetchGuides();
        }, [])
    );

    const fetchGuides = async (mode: 'initial' | 'refresh' = 'initial') => {
        try {
            if (mode === 'initial') setLoading(true);
            if (mode === 'refresh') setRefreshing(true);
            const response = await guideApi.getAllGuides('', 'freelance');
            setGuides(response.data);
        } catch (error) {
            console.error('Failed to fetch guides:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => fetchGuides('refresh');

    const isFavorite = (id: string) => guideFavorites.some((g: any) => g.id === id);
    const handleToggleFavorite = (guide: any) => {
        dispatch(toggleGuideFavorite({
            id: guide.id,
            firstName: guide.firstName,
            lastName: guide.lastName,
            languages: guide.languages || [],
            experience: guide.experience || 0,
            pricePerDay: guide.pricePerDay || 0,
            specialties: guide.specialties || [],
            location: guide.location || '',
            photoUrl: guide.photoUrl || null,
        } as any));
    };

    const handleBookingClick = (guide: any) => {
        setSelectedGuide(guide);
        setBookingModalVisible(true);
    };

    const handleBookingSubmit = async (date: string, people: string) => {
        if (!selectedGuide) {
            return;
        }

        try {
            setBookingModalVisible(false);

            const response = await reservationApi.createGuideReservation({
                guideId: selectedGuide.id,
                reservationDate: date,
                pilgrimCount: Number(people) || 1,
            });

            const conversationId = response.data?.conversation?.id;
            if (!conversationId) {
                throw new Error('Conversation introuvable');
            }

            router.push({
                pathname: '/(umrah_agence)/(screens)/(chat)/chat_pelerin' as any,
                params: {
                    conversationId,
                    contactName: `${selectedGuide.firstName} ${selectedGuide.lastName}`,
                    contactImage: selectedGuide.photoUrl || '',
                    type: 'guide',
                }
            });
        } catch (error: any) {
            Alert.alert('Erreur', error?.response?.data?.message || error?.message || 'Impossible de créer la réservation.');
        }
    };

    const handleChatPress = (guide: any) => {
        router.push({
            pathname: '/(umrah_agence)/(screens)/(chat)/chat_pelerin' as any,
            params: {
                conversationId: guide.id,
                contactName: `${guide.firstName} ${guide.lastName}`,
                type: 'guide',
            }
        });
    };

    const handleGuidePress = (guide: any) => {
        router.push({
            pathname: '/(umrah_agence)/(screens)/profile/profile_guide',
            params: {
                guideId: guide.id,
                guideName: `${guide.firstName} ${guide.lastName}`,
                guideRating: (guide.rating || 5.0).toString(),
                guideReviews: (guide.reviews || 0).toString(),
                guideExperience: (guide.experience || 0).toString(),
                guidePrice: (guide.pricePerDay || 0).toString(),
                guideLanguages: (guide.languages || []).join(','),
                guideSpecialties: (guide.specialties || []).join(','),
                guideLocation: guide.location || '',
                guideBio: guide.bio || '',
                guidePhoto: guide.photoUrl || '',
            }
        });
    };

    if (loading && guides.length === 0) {
        return <GreenDotsLoader fullScreen={true} />;
    }

    const uniqueLanguages = Array.from(
        new Set(
            guides
                .flatMap((g) => (Array.isArray(g.languages) ? g.languages : []))
                .filter(Boolean)
                .map((l) => `${l}`.trim())
        ),
    ).slice(0, 8);

    return (
        <View style={{ flex: 1, backgroundColor: isDarkMode ? '#000' : '#F8F9FA' }}>
            <FlatList
                data={filteredGuides}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="transparent"
                        colors={['transparent']}
                    />
                }
                ListHeaderComponent={() => (
                    <View style={styles.listHeader}>
                        {refreshing && (
                            <View style={styles.refreshLoaderRow}>
                                <GreenDotsLoader fullScreen={false} style={{ backgroundColor: 'transparent' }} />
                            </View>
                        )}
                        <View style={[styles.searchContainer, { backgroundColor: CARD, borderColor: BD }]}>
                            <Ionicons name="search-outline" size={20} color={TXT_SEC} />
                            <TextInput
                                placeholder={t('Rechercher un guide, une spécialité...')}
                                placeholderTextColor={TXT_SEC}
                                style={[styles.searchInput, { color: TXT }]}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery !== '' && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-circle" size={18} color={TXT_SEC} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickSelectors}>
                            {FILTERS.map((f) => (
                                <TouchableOpacity
                                    key={f.label}
                                    style={[styles.quickBubble, { backgroundColor: activeFilter === f.label ? PRIMARY_COLOR : CARD, borderColor: BD }]}
                                    onPress={() => setActiveFilter(f.label)}
                                >
                                    <Ionicons name={f.icon as any} size={16} color={activeFilter === f.label ? '#FFF' : PRIMARY_COLOR} />
                                    <Text style={[styles.quickBubbleText, { color: activeFilter === f.label ? '#FFF' : TXT }]}>{f.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
                ListFooterComponent={() => <View style={{ height: 20 }} />}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={[styles.profileCard, { backgroundColor: CARD, borderColor: BD }]}
                        activeOpacity={0.9}
                        onPress={() => handleGuidePress(item)}
                    >
                        <View style={styles.profileImageContainer}>
                            {item.photoUrl ? (
                                <Image source={{ uri: item.photoUrl }} style={styles.profileAvatar} />
                            ) : (
                                <Image source={DEFAULT_GUIDE_IMAGE} style={styles.profileAvatar} />
                            )}
                            <View style={styles.profileRatingBadge}>
                                <Ionicons name="star" size={10} color="#FFB01F" />
                                <Text style={styles.profileRatingText}>{item.rating || 5.0}</Text>
                            </View>
                        </View>

                        <View style={styles.profileInfo}>
                            <View style={styles.profileMainRow}>
                                <Text style={[styles.profileName, { color: TXT }]} numberOfLines={1}>
                                    {`${item.firstName} ${item.lastName}`}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => handleToggleFavorite(item)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={isFavorite(item.id) ? 'heart' : 'heart-outline'}
                                        size={20}
                                        color={isFavorite(item.id) ? '#E11D48' : TXT_SEC}
                                    />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.profileDetailsRow}>
                                <View style={styles.profileDetail}>
                                    <Ionicons name="ribbon-outline" size={12} color={PRIMARY_COLOR} />
                                    <Text style={[styles.profileDetailText, { color: TXT_SEC }]}>
                                        {item.experience || 0} {t("ans")}
                                    </Text>
                                </View>
                                <View style={styles.profileDetail}>
                                    <Ionicons name="language-outline" size={12} color={PRIMARY_COLOR} />
                                    <Text style={[styles.profileDetailText, { color: TXT_SEC }]} numberOfLines={1}>
                                        {item.languages?.slice(0, 2).join(', ')}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.profileFooter}>
                                <View style={styles.profilePriceContainer}>
                                    <Text style={[styles.profilePriceValue, { color: PRIMARY_COLOR }]}>{item.pricePerDay || 0}</Text>
                                    <Text style={[styles.profilePriceUnit, { color: PRIMARY_COLOR }]}>TND</Text>
                                </View>
                                <TouchableOpacity 
                                    style={[styles.profileActionBtn, { backgroundColor: PRIMARY_COLOR }]}
                                    onPress={() => handleBookingClick(item)}
                                >
                                    <Text style={styles.profileActionBtnText}>{t('Réserver')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={64} color={BD} />
                        <Text style={[styles.emptyText, { color: TXT }]}>{t('Aucun guide trouvé')}</Text>
                        <Text style={[styles.emptySubtext, { color: TXT_SEC }]}>{t("Essayez d'ajuster vos filtres de recherche")}</Text>
                    </View>
                }
            />

            <BookingModal
                visible={bookingModalVisible}
                onClose={() => setBookingModalVisible(false)}
                onSubmit={handleBookingSubmit}
                title={selectedGuide ? t('Réserver') + ` ${selectedGuide.name}` : t("Réserver un Guide")}
                dateLabel={t("Choisir une date")}
                peopleLabel={t("Nombre de personnes")}
                submitLabel={t("Envoyer la demande")}
                note={t("Le guide recevra votre demande et pourra l'accepter ou la refuser.")}
            />
        </View>
    );
}

const ss = StyleSheet.create({
    langRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    langText: { fontSize: 13 },
    bookText: { color: '#fff', fontWeight: '700', fontSize: 14 }
});

export default function GuidesScreen() {
    const { t } = useTrans();
    const router = useRouter();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const headerInk = isDarkMode ? '#fff' : '#000';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#000' : '#F8F9FA' }}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
            {/* Header */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingVertical: 12,
                backgroundColor: isDarkMode ? '#1C1C1E' : '#fff'
            }}>
                <TouchableOpacity onPress={() => router.back()} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="arrow-back" size={24} color={headerInk} />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: headerInk, textAlign: 'center' }}>{t('Guides Privés')}</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/(umrah_agence)/(screens)/favoris')} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="heart-outline" size={24} color={headerInk} />
                </TouchableOpacity>
            </View>
            <GuideList />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        paddingBottom: 20,
    },
    listHeader: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
    },
    refreshLoaderRow: {
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 15,
        borderWidth: 1,
        marginBottom: 10,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        paddingVertical: 0,
    },
    quickSelectors: {
        flexDirection: 'row',
        marginTop: 10,
    },
    quickBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        marginRight: 10,
        gap: 6,
    },
    quickBubbleText: {
        fontSize: 13,
        fontWeight: '600',
    },
    profileCard: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
            android: { elevation: 2 },
        }),
    },
    profileImageContainer: {
        position: 'relative',
    },
    profileAvatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#F3F4F6',
    },
    profileRatingBadge: {
        position: 'absolute',
        bottom: -4,
        alignSelf: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    profileRatingText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#000',
    },
    profileInfo: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'space-between',
    },
    profileMainRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    profileName: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    profileDetailsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
    },
    profileDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    profileDetailText: {
        fontSize: 12,
        fontWeight: '500',
    },
    profileFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    profilePriceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
    },
    profilePriceValue: {
        fontSize: 18,
        fontWeight: '800',
    },
    profilePriceUnit: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    profileActionBtn: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 8,
    },
    profileActionBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '700',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        marginTop: 6,
    },
});
