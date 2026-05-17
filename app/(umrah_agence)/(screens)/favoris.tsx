import { useThemeColors } from '@/hooks/useThemeColors';
import { RootState } from '@/store/store';
import { toggleFavorite, toggleHotelFavorite, toggleGuideFavorite } from '@/store/umrahSlice';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTrans } from '@/hooks/useTrans';

const { width } = Dimensions.get('window');

export default function FavorisScreen() {
    const { t, language } = useTrans();
    const isRTL = language === 'ar';
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const router = useRouter();
    const dispatch = useDispatch();
    const favorites = useSelector((state: RootState) => state.umrah.favorites);
    const hotelFavorites = useSelector((state: RootState) => state.umrah.hotelFavorites);
    const guideFavorites = useSelector((state: RootState) => (state.umrah as any).guideFavorites || []);
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const flatListRef = React.useRef<FlatList>(null);

    const tabs = [
        { id: 'umrah', title: t('Umrah') },
        { id: 'hotels', title: t('Hôtels') },
        { id: 'guides', title: t('Guides') },
    ];

    const handleRemoveFavorite = (pack: any) => {
        dispatch(toggleFavorite(pack));
    };

    const handleTabPress = (index: number) => {
        setActiveTabIndex(index);
        flatListRef.current?.scrollToIndex({ index, animated: true });
    };

    const onMomentumScrollEnd = (e: any) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / width);
        setActiveTabIndex(index);
    };

    const renderEmptyState = (type: 'umrah' | 'hotels' | 'guides') => (
        <View style={styles.tabContentContainer}>
            <View style={styles.emptyContainer}>
                <Ionicons name="heart-dislike-outline" size={80} color={colors.textLight} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('Aucun favori')}</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {type === 'umrah'
                        ? t("Vous n'avez pas encore ajouté de packs à vos favoris.")
                        : type === 'hotels'
                            ? t("Vous n'avez pas encore d'hôtels favoris.")
                            : t("Vous n'avez pas encore de guides favoris.")}
                </Text>
                <TouchableOpacity
                    style={[styles.exploreButton, { backgroundColor: colors.primary }]}
                    onPress={() => router.push(
                        type === 'umrah'
                            ? '/(umrah_agence)/(screens)/(pack_umrah)/explorer_umrah'
                            : type === 'hotels'
                                ? '/(umrah_agence)/(umrah_solo)/hotels/hotels'
                                : '/(umrah_agence)/(umrah_solo)/guides'
                    )}
                >
                    <Text style={styles.exploreButtonText}>
                        {type === 'umrah' ? t('Explorer les offres') : type === 'hotels' ? t('Explorer les hôtels') : t('Explorer les guides')}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderPackItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface }]} activeOpacity={0.9}>
            <Image source={item.image} style={styles.cardImage} />
            <View style={styles.cardContent}>
                <View style={styles.headerRow}>
                    <View style={styles.agencyInfo}>
                        <FontAwesome5 name="mosque" size={10} color={colors.primary} />
                        <Text style={[styles.agencyName, { color: colors.textSecondary }]} numberOfLines={1}>{item.agencyName}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveFavorite(item)}>
                        <Ionicons name="trash-outline" size={18} color="#FF4444" />
                    </TouchableOpacity>
                </View>

                <Text style={[styles.packTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>

                <View style={styles.footerRow}>
                    <Text style={[styles.priceValue, { color: colors.primary }]}>{item.price} DT</Text>
                    <View style={[styles.ratingBadge, { backgroundColor: isDarkMode ? '#3a361a' : '#FFF9C4' }]}>
                        <Ionicons name="star" size={10} color="#FFD700" />
                        <Text style={[styles.ratingText, { color: isDarkMode ? '#FFD700' : '#F57F17' }]}>{item.rating}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderGuideItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface }]}
            activeOpacity={0.9}
            onPress={() => router.push({
                pathname: '/(umrah_agence)/(screens)/profile/profile_guide',
                params: {
                    guideId: item.id,
                    guideName: `${item.firstName || ''} ${item.lastName || ''}`.trim(),
                    guideExperience: (item.experience || 0).toString(),
                    guidePrice: (item.pricePerDay || 0).toString(),
                    guideLanguages: (item.languages || []).join(','),
                    guideSpecialties: (item.specialties || []).join(','),
                    guideLocation: item.location || '',
                    guidePhoto: item.photoUrl || '',
                }
            })}
        >
            <Image source={item.photoUrl ? { uri: item.photoUrl } : require('../../../assets/images/user1.jpg')} style={styles.cardImage} />
            <View style={styles.cardContent}>
                <View style={styles.headerRow}>
                    <View style={styles.agencyInfo}>
                        <Ionicons name="person" size={10} color={colors.primary} />
                        <Text style={[styles.agencyName, { color: colors.textSecondary }]} numberOfLines={1}>
                            {`${item.firstName || ''} ${item.lastName || ''}`.trim() || t('Guide')}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => dispatch(toggleGuideFavorite(item))}>
                        <Ionicons name="trash-outline" size={18} color="#FF4444" />
                    </TouchableOpacity>
                </View>

                <Text style={[styles.packTitle, { color: colors.text }]} numberOfLines={1}>{t('Guide Privé')}</Text>

                <View style={styles.footerRow}>
                    <Text style={[styles.priceValue, { color: colors.primary }]}>{item.pricePerDay || 0} DT</Text>
                    <View style={[styles.ratingBadge, { backgroundColor: isDarkMode ? '#3a361a' : '#FFF9C4' }]}>
                        <Ionicons name="time-outline" size={10} color={colors.primary} />
                        <Text style={[styles.ratingText, { color: isDarkMode ? '#FFD700' : '#2C5F2D' }]}>{item.experience || 0} {t('ans')}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderTabItem = ({ item, index }: { item: any, index: number }) => {
        if (index === 0) { // Umrah Tab
            return (
                <View style={styles.tabContentContainer}>
                    {favorites.length === 0 ? (
                        renderEmptyState('umrah')
                    ) : (
                        <FlatList
                            data={favorites}
                            keyExtractor={item => item.id}
                            renderItem={renderPackItem}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            numColumns={2}
                            columnWrapperStyle={styles.columnWrapper}
                        />
                    )}
                </View>
            );
        } else if (index === 1) { // Hotels Tab
            return (
                <View style={styles.tabContentContainer}>
                    {hotelFavorites.length === 0 ? (
                        renderEmptyState('hotels')
                    ) : (
                        <FlatList
                            data={hotelFavorites}
                            keyExtractor={item => item.id}
                            renderItem={renderHotelItem}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            numColumns={2}
                            columnWrapperStyle={styles.columnWrapper}
                        />
                    )}
                </View>
            );
        } else { // Guides Tab
            return (
                <View style={styles.tabContentContainer}>
                    {guideFavorites.length === 0 ? (
                        renderEmptyState('guides')
                    ) : (
                        <FlatList
                            data={guideFavorites}
                            keyExtractor={item => item.id}
                            renderItem={renderGuideItem}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            numColumns={2}
                            columnWrapperStyle={styles.columnWrapper}
                        />
                    )}
                </View>
            );
        }
    };

    const renderHotelItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface }]}
            activeOpacity={0.9}
            onPress={() => router.push({
                pathname: '/(umrah_agence)/(umrah_solo)/hotels/details_hotels',
                params: {
                    id: item.id,
                }
            })}
        >
            <Image source={item.image} style={styles.cardImage} />
            <View style={styles.cardContent}>
                <View style={styles.headerRow}>
                    <View style={styles.agencyInfo}>
                        <Ionicons name="location" size={10} color={colors.primary} />
                        <Text style={[styles.agencyName, { color: colors.textSecondary }]} numberOfLines={1}>{item.location}</Text>
                    </View>
                    <TouchableOpacity onPress={() => dispatch(toggleHotelFavorite(item))}>
                        <Ionicons name="trash-outline" size={18} color="#FF4444" />
                    </TouchableOpacity>
                </View>

                <Text style={[styles.packTitle, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>

                <View style={styles.footerRow}>
                    <Text style={[styles.priceValue, { color: colors.primary }]}>{item.price} DT</Text>
                    <View style={[styles.ratingBadge, { backgroundColor: isDarkMode ? '#3a361a' : '#FFF9C4' }]}>
                        <Ionicons name="star" size={10} color="#FFD700" />
                        <Text style={[styles.ratingText, { color: isDarkMode ? '#FFD700' : '#F57F17' }]}>{item.rating}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
            <SafeAreaView style={styles.safeArea}>
                {/* Custom Header with X button */}
                <View style={[styles.headerContainer, { backgroundColor: colors.background, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                        <Ionicons name={isRTL ? "arrow-forward" : "close"} size={28} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>{t('Mes Favoris')}</Text>
                    <View style={{ width: 28 }} />
                </View>

                {/* Tabs Division */}
                <View style={[styles.tabContainer, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
                    {tabs.map((tab, index) => (
                        <TouchableOpacity
                            key={tab.id}
                            style={styles.tabButton}
                            onPress={() => handleTabPress(index)}
                        >
                            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTabIndex === index && [styles.activeTabText, { color: colors.primary }]]}>
                                {tab.title}
                            </Text>
                            {activeTabIndex === index && <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Swipeable Content */}
                <FlatList
                    ref={flatListRef}
                    data={tabs}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={onMomentumScrollEnd}
                    renderItem={renderTabItem}
                    keyExtractor={(item) => item.id}
                />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 15,
    },
    closeButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        position: 'relative',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    activeTabText: {
        fontWeight: '800',
    },
    activeIndicator: {
        position: 'absolute',
        bottom: 0,
        height: 3,
        width: '60%',
        borderRadius: 3,
    },
    tabContentContainer: {
        width: width,
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingBottom: 150, // Higher offset for better centering
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
    },
    emptyText: {
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22,
    },
    exploreButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
    },
    exploreButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    listContent: {
        paddingBottom: 20,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        paddingHorizontal: 15,
    },
    // Card Styles
    card: {
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
        width: (width - 45) / 2,
    },
    cardImage: {
        width: '100%',
        height: 100,
        resizeMode: 'cover',
    },
    cardContent: {
        padding: 10,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    agencyInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
    },
    agencyName: {
        fontSize: 10,
        fontWeight: '600',
        flex: 1,
    },
    packTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        gap: 2,
    },
    ratingText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
});
