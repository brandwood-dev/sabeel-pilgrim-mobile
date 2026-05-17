import { useDrawer } from '@/context/DrawerContext';
import { packApi, reviewsApi } from '@/services/api';
import { RootState } from '@/store/store';
import { toggleFavorite } from '@/store/umrahSlice';
import { useTrans } from '@/hooks/useTrans';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    FlatList,
    Platform,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Modal,
    ScrollView,
    TextInput,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import GreenDotsLoader from '@/components/common/GreenDotsLoader';
import PackCard from '@/components/umrah/PackCard';

const PRIMARY = '#2C5F2D';

interface UmrahPack {
    id: string;
    agencyId?: string;
    agencyName: string;
    agencyLogo: string | null;
    title: string;
    date: string;
    price: number;
    rating: number;
    image: string | null;
    features: string[];
    description?: string;
    address?: string;
}

type AgencyRatingSummary = {
    averageRating: number;
    reviewsCount: number;
};

const getSafeImageUri = (value: string | null | undefined) => {
    if (!value || typeof value !== 'string') {
        return null;
    }

    const trimmedValue = value.trim();
    // Allow full URLs including localhost/IP from backend; cap length to avoid base64-like blobs
    if (/^https?:\/\//i.test(trimmedValue) && trimmedValue.length <= 4096) {
        return trimmedValue;
    }

    return null;
};

const buildPackFeatures = (pack: any, t: (value: string) => string) => {
    const features: string[] = [];

    if (pack.volDirect) features.push(t('Vol Direct'));
    if (pack.hasEscale) features.push(t('Vol avec escale'));
    if (pack.visaInclus) features.push(t('Visa Inclus'));
    if (pack.transfert) features.push(t('Transfert Inclus'));
    if (pack.hotelMekkah) features.push(`${t('Hôtel Makkah')} ${pack.hotelMekkahStars || ''}`.trim());
    if (pack.hotelMedina) features.push(`${t('Hôtel Médine')} ${pack.hotelMedinaStars || ''}`.trim());
    if (pack.guideName) features.push(`${t('Guide')} ${pack.guideName}`);

    return features.slice(0, 4);
};

const mapBackendPack = (pack: any, t: (value: string) => string): UmrahPack => ({
    id: pack.id,
    agencyId: pack.agencyId || undefined,
    agencyName: pack.agencyName || t('Agence partenaire'),
    agencyLogo: pack.agencyLogo || null,
    title: pack.title || t('Pack Umrah'),
    date: pack.departureDate && pack.arrivalDate
        ? `${pack.departureDate} - ${pack.arrivalDate}`
        : pack.departureDate || pack.arrivalDate || t('Dates à confirmer'),
    price: Number(pack.price || pack.priceAdult || pack.priceSharedRoom || 0),
    rating: Number(pack.rating || 0),
    image: pack.imageUrl || null,
    features: buildPackFeatures(pack, t),
    description: pack.description || t('Description non disponible pour le moment.'),
    address: pack.agencyAddress || t('Adresse non disponible'),
});

export default function ExplorerUmrahScreen() {
    const router = useRouter();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const dispatch = useDispatch();
    const favorites = useSelector((state: RootState) => state.umrah.favorites);
    const { openDrawer } = useDrawer();
    const { t, language } = useTrans();
    const isRTL = language === 'ar';

    const FILTERS = [
        { label: t('Tous'), icon: 'grid-outline' },
        { label: t('Prix Croissant'), icon: 'trending-up-outline' },
        { label: t('Prix Décroissant'), icon: 'trending-down-outline' },
        { label: t('Mieux Notés'), icon: 'star-outline' },
        { label: t('Plus Récents'), icon: 'time-outline' }
    ];

    const [activeFilter, setActiveFilter] = useState(t('Tous'));
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [selectedAgency, setSelectedAgency] = useState<string | null>(null);
    const [packs, setPacks] = useState<UmrahPack[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [agencyRatings, setAgencyRatings] = useState<Record<string, AgencyRatingSummary>>({});

    const TXT = isDarkMode ? '#fff' : '#1C1C1E';
    const TXT_SEC = isDarkMode ? '#8E8E93' : '#636366';
    const CARD = isDarkMode ? '#1C1C1E' : '#FFFFFF';
    const BD = isDarkMode ? '#38383A' : '#E5E5EA';

    const fetchPacks = async (mode: 'initial' | 'refresh' = 'initial') => {
        try {
            if (mode === 'initial') setLoading(true);
            if (mode === 'refresh') setRefreshing(true);

            const response = await packApi.getPublicPacks();
            const nextPacks = Array.isArray(response.data?.packs)
                ? response.data.packs.map((pack: any) => mapBackendPack(pack, t))
                : [];

            // IMPORTANT perf: Do not do per-pack detail fetch here (N+1). Backend already maps imageUrl/agencyLogo.
            // If imageUrl is missing from backend, it should be fixed server-side.
            setPacks(nextPacks);
        } catch (error) {
            console.error('Failed to fetch public packs:', error);
            setPacks([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchAgencyRatings = async (agencyIds: string[]) => {
        const unique = Array.from(new Set(agencyIds.filter(Boolean)));
        if (unique.length === 0) {
            setAgencyRatings({});
            return;
        }

        try {
            const results = await Promise.all(
                unique.map(async (agencyId) => {
                    try {
                        const summaryRes = await reviewsApi.summaryByTarget({ targetType: 'AGENCE', targetId: agencyId });
                        return {
                            agencyId,
                            averageRating: Number(summaryRes.data?.averageRating || 0),
                            reviewsCount: Number(summaryRes.data?.reviewsCount || 0),
                        };
                    } catch {
                        return { agencyId, averageRating: 0, reviewsCount: 0 };
                    }
                })
            );

            const next: Record<string, AgencyRatingSummary> = {};
            results.forEach((r) => {
                next[r.agencyId] = { averageRating: r.averageRating, reviewsCount: r.reviewsCount };
            });
            setAgencyRatings(next);
        } catch {
            setAgencyRatings({});
        }
    };

    useEffect(() => {
        fetchPacks('initial');
    }, [language]);

    useEffect(() => {
        const agencyIds = packs.map((p) => p.agencyId).filter((id): id is string => Boolean(id));
        fetchAgencyRatings(agencyIds);
    }, [packs.length]);

    const handleRefresh = () => fetchPacks('refresh');

    const AGENCIES = Array.from(new Set(packs.map(p => p.agencyName).filter(Boolean)));

    const ratedPacks = packs.map((pack) => {
        const agencyId = pack.agencyId;
        if (!agencyId) return pack;
        const rating = agencyRatings[agencyId]?.averageRating;
        return {
            ...pack,
            rating: typeof rating === 'number' ? rating : pack.rating,
        };
    });

    const filteredPacks = ratedPacks.filter(pack => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = pack.title.toLowerCase().includes(query) || pack.agencyName.toLowerCase().includes(query);
        const matchesAgency = !selectedAgency || pack.agencyName === selectedAgency;
        return matchesSearch && matchesAgency;
    }).sort((a, b) => {
        if (activeFilter === t('Prix Croissant')) return a.price - b.price;
        if (activeFilter === t('Prix Décroissant')) return b.price - a.price;
        if (activeFilter === t('Mieux Notés')) return b.rating - a.rating;
        return 0;
    });

    const isFavorite = (id: string) => favorites.some(p => p.id === id);

    const handleToggleFavorite = (pack: UmrahPack) => {
        // Sanitize media fields before storing in Redux to avoid base64/state bloat
        dispatch(toggleFavorite({
            ...pack,
            image: getSafeImageUri(pack.image),
            agencyLogo: getSafeImageUri(pack.agencyLogo),
        } as UmrahPack));
    };

    const handleOpenPack = (id: string) => {
        try {
            // ONLY pass the ID to the details page
            router.push({
                pathname: "/(umrah_agence)/(screens)/(pack_umrah)/details_pack" as any,
                params: { id }
            });
        } catch (error) {
            console.error('Failed to navigate to pack details:', error);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#000' : '#F8F9FA' }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
            <View style={styles.mainContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={isDarkMode ? "#fff" : "#1C1C1E"} />
                    </TouchableOpacity>
                    <View style={styles.titleContainer}>
                        <Text style={[styles.headerTitle, { color: isDarkMode ? "#fff" : "#1C1C1E" }]}>{t('Packs Umrah')}</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/(umrah_agence)/(screens)/favoris')} style={styles.favoriteHeaderBtn}>
                        <Ionicons name="heart-outline" size={24} color={PRIMARY} />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <GreenDotsLoader fullScreen={false} />
                    </View>
                ) : (
                <FlatList
                    data={filteredPacks}
                    keyExtractor={item => item.id}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor="transparent"
                            colors={['transparent']}
                        />
                    }
                    initialNumToRender={4}
                    maxToRenderPerBatch={4}
                    windowSize={5}
                    removeClippedSubviews
                    updateCellsBatchingPeriod={50}
                    getItemLayout={(data, index) => ({ length: 260, offset: 260 * index, index })}
                    ListHeaderComponent={() => (
                        <View style={styles.titleSection}>
                            {refreshing && (
                                <View style={styles.refreshLoaderRow}>
                                    <GreenDotsLoader fullScreen={false} style={{ backgroundColor: 'transparent' }} />
                                </View>
                            )}
                            <View style={[styles.searchContainer, { backgroundColor: CARD, borderColor: BD }]}>
                                <Ionicons name="search-outline" size={20} color={TXT_SEC} />
                                <TextInput
                                    placeholder={t('Rechercher un pack ou une agence...')}
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

                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickSelectors} contentContainerStyle={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                                <TouchableOpacity
                                    style={[styles.quickBubble, { backgroundColor: activeFilter === t('Tous') ? PRIMARY : CARD, borderColor: BD }]}
                                    onPress={() => {
                                        setActiveFilter(t('Tous'));
                                        setSelectedAgency(null);
                                    }}
                                >
                                    <Text style={[styles.quickBubbleText, { color: activeFilter === t('Tous') ? '#FFF' : TXT }]}>{t('Tous')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.quickBubble, { backgroundColor: CARD, borderColor: selectedAgency ? PRIMARY : BD }]}
                                    onPress={() => setShowFilterModal(true)}
                                >
                                    <Ionicons name="options-outline" size={16} color={PRIMARY} />
                                    <Text style={[styles.quickBubbleText, { color: TXT }]}>{activeFilter !== t('Tous') ? activeFilter : t('Filtrer')}</Text>
                                </TouchableOpacity>

                                {AGENCIES.map(agency => (
                                    <TouchableOpacity
                                        key={agency}
                                        style={[styles.quickBubble, { backgroundColor: selectedAgency === agency ? PRIMARY : CARD, borderColor: BD }]}
                                        onPress={() => setSelectedAgency(selectedAgency === agency ? null : agency)}
                                    >
                                        <Text style={[styles.quickBubbleText, { color: selectedAgency === agency ? '#FFF' : TXT }]}>{agency}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                    renderItem={({ item }) => (
                        <PackCard
                            item={item}
                            isDarkMode={isDarkMode}
                            isRTL={isRTL}
                            isFavorite={isFavorite}
                            onToggleFavorite={handleToggleFavorite}
                            onPress={handleOpenPack}
                        />
                    )}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="briefcase-outline" size={44} color={TXT_SEC} />
                            <Text style={[styles.emptyTitle, { color: TXT }]}>{t('Aucun pack disponible')}</Text>
                            <Text style={[styles.emptySubtitle, { color: TXT_SEC }]}>{t('Aucune offre Umrah visible pour le moment.')}</Text>
                        </View>
                    }
                />
                )}
            </View>

            <Modal
                visible={showFilterModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowFilterModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlayClickable}
                    activeOpacity={1}
                    onPress={() => setShowFilterModal(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: CARD }]}>
                        <View style={[styles.modalHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <Text style={[styles.modalTitle, { color: TXT }]}>{t('Organiser par')}</Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                <Ionicons name="close" size={24} color={TXT_SEC} />
                            </TouchableOpacity>
                        </View>
                        {FILTERS.map((f) => (
                            <TouchableOpacity
                                key={f.label}
                                style={[styles.modalFilterItem, { backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7', flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                                onPress={() => {
                                    setActiveFilter(f.label);
                                    setShowFilterModal(false);
                                }}
                            >
                                <View style={[styles.modalFilterLabel, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                    <Ionicons name={f.icon as any} size={20} color={activeFilter === f.label ? PRIMARY : TXT_SEC} />
                                    <Text style={[styles.modalFilterText, { color: activeFilter === f.label ? PRIMARY : TXT }]}>{f.label}</Text>
                                </View>
                                {activeFilter === f.label && <Ionicons name="checkmark-circle" size={22} color={PRIMARY} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 15,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    favoriteHeaderBtn: {
        padding: 4,
    },
    mainContent: {
        flex: 1,
    },
    titleSection: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    mainTitle: {
        fontSize: 20,
        fontWeight: '800',
    },
    subTitle: {
        fontSize: 12,
        marginTop: 2,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 15,
        borderWidth: 1,
        marginBottom: 16,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        paddingVertical: 0,
    },
    quickSelectors: {
        marginTop: 16,
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
    listContainer: {
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    refreshLoaderRow: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 10,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    emptyTitle: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: '700',
    },
    emptySubtitle: {
        marginTop: 6,
        fontSize: 13,
        textAlign: 'center',
    },
    packCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
            android: { elevation: 2 },
        }),
    },
    imageContainer: {
        height: 110,
    },
    packImage: {
        width: '100%',
        height: '100%',
    },
    favoriteButton: {
        position: 'absolute',
        top: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    ratingBadge: {
        position: 'absolute',
        bottom: 10,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    ratingText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#000',
    },
    packContent: {
        padding: 10,
    },
    agencyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    agencyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 6,
    },
    agencyLogo: {
        width: 16,
        height: 16,
        borderRadius: 8,
    },
    agencyLogoFallback: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EEF6EF',
    },
    agencyName: {
        fontSize: 12,
        fontWeight: '600',
    },
    packTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    dateText: {
        fontSize: 11,
    },
    featureContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginBottom: 12,
    },
    featureTag: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    featureText: {
        fontSize: 10,
        fontWeight: '600',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    priceLabel: {
        fontSize: 10,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
    },
    priceValue: {
        fontSize: 16,
        fontWeight: '800',
    },
    priceUnit: {
        fontSize: 11,
        fontWeight: '600',
    },
    bookBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    bookBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 11,
    },
    modalOverlayClickable: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    modalFilterItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    modalFilterText: {
        fontSize: 16,
        fontWeight: '600',
    },
    modalFilterLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
});
