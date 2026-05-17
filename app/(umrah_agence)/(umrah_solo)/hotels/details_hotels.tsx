import { Colors } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTrans } from '@/hooks/useTrans';
import { RootState } from '@/store/store';
import { toggleHotelFavorite } from '@/store/umrahSlice';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react';
import {
    Dimensions,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

const PRIMARY_COLOR = '#2C5F2D';
const ACCENT_COLOR = '#d9ab83';
const TERRACOTTA = '#E2725B';
const BACKGROUND_COLOR = '#f8f7f2';
const TEXT_LIGHT = '#666';

const { width } = Dimensions.get('window');

export default function HotelDetailsScreen() {
    const router = useRouter();
    const dispatch = useDispatch();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const hotelFavorites = useSelector((state: RootState) => state.umrah.hotelFavorites);
    const params = useLocalSearchParams();
    const { t } = useTrans();
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // Parse hotel data from params
    const hotelName = params.name as string || t('Hôtel');
    const hotelRating = parseFloat(params.rating as string) || 5;
    const hotelDistance = params.distance as string || '500 m';
    const extractDistanceNumber = (distanceStr: string): number => {
        // Extract number from distance string (e.g., "500 m" -> 500, "1.2 km" -> 1.2)
        const match = distanceStr.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : 0;
    };

    const hotelDistanceNum = extractDistanceNumber(hotelDistance);
    const hotelPrice = parseFloat(params.price as string) || 0;
    const hotelLat = parseFloat(params.latitude as string) || 21.4225;
    const hotelLng = parseFloat(params.longitude as string) || 39.8262;
    const partnerUrl = params.partnerUrl as string || 'https://www.booking.com';

    // Handle dynamic images from Amadeus & Google
    const hotelImagesParam = params.images as string;
    const hotelImages = useMemo(() => {
        if (hotelImagesParam) {
            try {
                return JSON.parse(hotelImagesParam);
            } catch (e) {
                console.error('[HotelDetails] Failed to parse images param', e);
            }
        }
        return [
            params.image && params.image !== 'mock' ? { uri: params.image as string } : { uri: 'https://images.unsplash.com/photo-1564769625905-aa93094960ea?w=800&q=80' }
        ];
    }, [hotelImagesParam, params.image]);

    const hotelObj = useMemo(() => ({
        id: params.id as string || hotelName,
        name: hotelName,
        location: params.location as string || 'Mecca',
        rating: hotelRating,
        price: hotelPrice,
        image: hotelImages[0],
        distance: hotelDistance,
        amenities: [],
        latitude: hotelLat,
        longitude: hotelLng,
        partnerUrl,
    }), [params.id, hotelName, params.location, hotelRating, hotelPrice, hotelImages, hotelDistance, hotelLat, hotelLng, partnerUrl]);

    const isFav = hotelFavorites.some((fav: any) => fav.id === hotelObj.id);

    const handleToggleFavorite = () => {
        dispatch(toggleHotelFavorite(hotelObj));
    };

    const renderStars = (rating: number) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <FontAwesome5
                    key={i}
                    name="star"
                    size={14}
                    solid={i <= rating}
                    color={i <= rating ? '#F59E0B' : '#D1D5DB'}
                    style={{ marginRight: 2 }}
                />
            );
        }
        return stars;
    };

    const hotelDescription = params.description as string || "Profitez d'un séjour spirituel dans un cadre luxueux avec toutes les commodités nécessaires pour votre Omra. Cet établissement est idéalement situé pour faciliter vos déplacements vers la Mosquée Sacrée.";
    const hotelAmenitiesStr = params.amenities as string;
    const hotelAmenities = useMemo(() => {
        if (hotelAmenitiesStr) {
            try {
                return JSON.parse(hotelAmenitiesStr);
            } catch (e) {
                console.error('[HotelDetails] Failed to parse amenities param', e);
            }
        }
        return [];
    }, [hotelAmenitiesStr]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Image Gallery */}
                <View style={styles.galleryContainer}>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={(e) => {
                            const index = Math.round(e.nativeEvent.contentOffset.x / width);
                            setActiveImageIndex(index);
                        }}
                        scrollEventThrottle={16}
                    >
                        {hotelImages.map((image: any, index: number) => (
                            <Image key={index} source={image} style={styles.galleryImage} resizeMode="cover" />
                        ))}
                    </ScrollView>

                    {/* Floating Header Actions */}
                    <View style={styles.floatingHeader}>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.headerRight}>
                            <TouchableOpacity style={styles.iconButton}>
                                <Ionicons name="share-social-outline" size={24} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconButton} onPress={handleToggleFavorite}>
                                <Ionicons
                                    name={isFav ? "heart" : "heart-outline"}
                                    size={24}
                                    color={isFav ? '#E2725B' : "#fff"}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Pagination Dots */}
                    <View style={styles.paginationContainer}>
                        {hotelImages.map((_: any, index: number) => (
                            <View
                                key={index}
                                style={[styles.paginationDot, activeImageIndex === index && styles.paginationDotActive]}
                            />
                        ))}
                    </View>
                </View>

                {/* Hotel Info */}
                <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.hotelName, { color: colors.text }]}>{hotelName}</Text>
                    <View style={styles.ratingRow}>
                        {renderStars(hotelRating)}
                        <Text style={[styles.ratingText, { color: colors.textSecondary }]}>({hotelRating})</Text>
                    </View>
                    <View style={styles.locationRow}>
                        <Ionicons name="location-sharp" size={16} color={colors.primary} />
                        <Text style={[styles.distanceText, { color: colors.primary }]}>{hotelDistance}</Text>
                    </View>
                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                        {hotelDescription}
                    </Text>
                </View>

                {/* Amenities Chip Section */}
                {hotelAmenities.length > 0 && (
                    <View style={[styles.facilitiesCard, { backgroundColor: colors.surface, marginTop: 12 }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Équipements du séjour')}</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {hotelAmenities.map((amenity: string, idx: number) => (
                                <View key={idx} style={{ backgroundColor: colors.primary + '10', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                                    <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600' }}>{amenity.replace(/_/g, ' ')}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Reviews Section */}
                <View style={[styles.reviewsCard, { backgroundColor: colors.surface }]}>
                    <View style={styles.reviewHeader}>
                        <View style={[styles.scoreContainer, { backgroundColor: colors.primary }]}>
                            <Text style={styles.scoreNumber}>7.4</Text>
                        </View>
                        <View style={styles.scoreInfo}>
                            <Text style={[styles.scoreLabel, { color: colors.text }]}>{t('Bien')}</Text>
                            <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>124 {t('commentaires')}</Text>
                        </View>
                    </View>
                </View>

                {/* Map Section */}
                <View style={[styles.mapCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Itinéraire vers la Kaaba')}</Text>
                    <TouchableOpacity
                        style={[styles.mapPlaceholder, { backgroundColor: colors.background }]}
                        onPress={() => router.push({
                            pathname: '/(umrah_agence)/(umrah_solo)/hotels/map_hotel',
                            params: {
                                hotelId: 'current',
                                name: hotelName,
                                rating: hotelRating.toString(),
                                distance: hotelDistance,
                                price: hotelPrice.toString(),
                                latitude: hotelLat.toString(),
                                longitude: hotelLng.toString(),
                                partnerUrl,
                                showRoute: 'true',
                            }
                        })}
                    >
                        <View style={[styles.mapImage, { backgroundColor: colors.divider, justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name="map-outline" size={40} color={colors.textLight} />
                        </View>
                        <View style={styles.mapOverlay}>
                            <View style={[styles.mapOverlayButton, { backgroundColor: colors.surface }]}>
                                <Ionicons name="map" size={20} color={colors.primary} />
                                <Text style={[styles.mapOverlayText, { color: colors.primary }]}>{t('Voir sur la carte')}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Travellers Asking Section */}
                <View style={[styles.faqCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Questions fréquentes')}</Text>
                    <View style={styles.faqItem}>
                        <View style={styles.faqQuestion}>
                            <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} />
                            <Text style={[styles.faqQuestionText, { color: colors.text }]}>{t('Servent-ils le petit-déjeuner?')}</Text>
                        </View>
                        <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{t('Oui, disponible sur demande.')}</Text>
                    </View>
                </View>

                {/* Facilities Section */}
                <View style={[styles.facilitiesCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("Politiques de l'établissement")}</Text>
                    <View style={styles.facilitiesList}>
                        <View style={styles.facilityRow}>
                            <Ionicons name="people" size={20} color={colors.textSecondary} />
                            <Text style={[styles.facilityRowText, { color: colors.text }]}>{t("Enfants : Les lits d'appoint sont disponibles selon l'âge.")}</Text>
                        </View>
                        <View style={styles.facilityRow}>
                            <Ionicons name="time" size={20} color={colors.textSecondary} />
                            <Text style={[styles.facilityRowText, { color: colors.text }]}>{t('Check-in flexible selon disponibilité.')}</Text>
                        </View>
                    </View>
                </View>

                {/* Policies Section */}
                <View style={[styles.policiesCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Politiques')}</Text>
                    <View style={[styles.policyItem, { borderBottomColor: colors.divider }]}>
                        <Text style={[styles.policyLabel, { color: colors.textSecondary }]}>{t('Check-in')}</Text>
                        <Text style={[styles.policyValue, { color: colors.text }]}>{t("A partir de 14:00 jusqu'à 00:00")}</Text>
                    </View>
                    <View style={[styles.policyItem, { borderBottomColor: colors.divider }]}>
                        <Text style={[styles.policyLabel, { color: colors.textSecondary }]}>{t('Check-out')}</Text>
                        <Text style={[styles.policyValue, { color: colors.text }]}>{t("De 00:00 jusqu'à 12:00")}</Text>
                    </View>
                    <View style={[styles.policyHighlight, { borderBottomColor: colors.divider }]}>
                        <View style={[styles.freeBadge, { backgroundColor: colors.success }]}>
                            <Text style={styles.freeBadgeText}>{t('GRATUIT')}</Text>
                        </View>
                        <Text style={[styles.policyHighlightText, { color: colors.text }]}>{t('Le WiFi est disponible partout et est gratuit.')}</Text>
                    </View>
                    <View style={[styles.policyHighlight, { borderBottomColor: colors.divider }]}>
                        <View style={[styles.freeBadge, { backgroundColor: colors.success }]}>
                            <Text style={styles.freeBadgeText}>{t('GRATUIT')}</Text>
                        </View>
                        <Text style={[styles.policyHighlightText, { color: colors.text }]}>{t('Parking privé gratuit possible sur place (réservation requise).')}</Text>
                    </View>
                    <View style={[styles.policyBadge, { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5' }]}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        <Text style={styles.policyBadgeText}>{t('Pas de frais de carte de crédit')}</Text>
                    </View>
                </View>

                {/* Children and Extra Beds */}
                <View style={[styles.childrenCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Enfants et lits supplémentaires')}</Text>
                    <Text style={[styles.childrenText, { color: colors.text }]}>{t('Les enfants de tous âges sont les bienvenus.')}</Text>
                    <Text style={[styles.childrenText, { color: colors.text }]}>
                        {t('Les enfants de 13 ans et plus seront facturés comme des adultes dans cet établissement.')}
                    </Text>
                    <Text style={[styles.childrenNote, { color: colors.textSecondary }]}>
                        {t("Pour voir les tarifs et informations d'occupation corrects, veuillez ajouter le nombre d'enfants de votre groupe et leurs ages a votre recherche.")}
                    </Text>
                    <TouchableOpacity style={styles.seeAllLink}>
                        <Text style={[styles.seeAllText, { color: colors.secondary }]}>{t('Voir toutes les politiques')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Bottom Padding */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Sticky Bottom CTA */}
            <View style={[styles.bottomCTA, { backgroundColor: colors.surface, borderTopColor: colors.divider }]}>
                <View style={styles.priceContainer}>
                    <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>{t('À partir de')}</Text>
                    <Text style={[styles.price, { color: colors.primary }]}>{hotelPrice} TND</Text>
                    <Text style={[styles.priceSubtext, { color: colors.textSecondary }]}>{t('par nuit')}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.bookButton, { backgroundColor: colors.primary }]}
                    onPress={() => router.push({
                        pathname: '/(umrah_agence)/(umrah_solo)/hotels/chambres',
                        params: {
                            hotelName,
                            hotelPrice: hotelPrice.toString(),
                            partnerUrl,
                        }
                    })}
                >
                    <Text style={styles.bookButtonText}>{t('Voir les chambres')}</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BACKGROUND_COLOR,
    },
    floatingHeader: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 10,
    },
    headerRight: {
        flexDirection: 'row',
        gap: 15,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    galleryContainer: {
        position: 'relative',
    },
    galleryImage: {
        width: width,
        height: 280,
    },
    paginationContainer: {
        position: 'absolute',
        bottom: 15,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        marginHorizontal: 3,
    },
    paginationDotActive: {
        backgroundColor: '#fff',
        width: 24,
    },
    infoCard: {
        backgroundColor: '#fff',
        padding: 20,
        marginTop: -20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    hotelName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    ratingText: {
        fontSize: 14,
        color: TEXT_LIGHT,
        marginLeft: 6,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    distanceText: {
        fontSize: 14,
        color: PRIMARY_COLOR,
        fontWeight: '600',
        marginLeft: 4,
    },
    description: {
        fontSize: 14,
        color: TEXT_LIGHT,
        lineHeight: 22,
    },
    mapCard: {
        backgroundColor: '#fff',
        padding: 20,
        marginTop: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
    },
    mapPlaceholder: {
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#F3F4F6',
    },
    mapImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        opacity: 0.6,
    },
    mapOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapOverlayButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    mapOverlayText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: PRIMARY_COLOR,
        marginLeft: 8,
    },
    reviewsCard: {
        backgroundColor: '#fff',
        padding: 20,
        marginTop: 12,
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    scoreContainer: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: PRIMARY_COLOR,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    scoreNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    scoreInfo: {
        flex: 1,
    },
    scoreLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 2,
    },
    reviewCount: {
        fontSize: 13,
        color: TEXT_LIGHT,
    },
    faqCard: {
        backgroundColor: '#fff',
        padding: 20,
        marginTop: 12,
    },
    faqItem: {
        marginBottom: 12,
    },
    faqQuestion: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    faqQuestionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        flex: 1,
        marginLeft: 8,
    },
    faqAnswer: {
        fontSize: 14,
        color: TEXT_LIGHT,
        lineHeight: 20,
        paddingLeft: 28,
    },
    descriptionCard: {
        backgroundColor: '#fff',
        padding: 20,
        marginTop: 12,
    },
    descriptionText: {
        fontSize: 14,
        color: TEXT_LIGHT,
        lineHeight: 22,
        marginBottom: 12,
    },
    seeAllLink: {
        paddingVertical: 8,
    },
    seeAllText: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '600',
    },
    readMoreLink: {
        paddingVertical: 4,
    },
    readMoreText: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '600',
    },
    facilitiesList: {
        paddingBottom: 12,
    },
    facilityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    facilityRowText: {
        fontSize: 14,
        color: '#1F2937',
        marginLeft: 12,
    },
    policyHighlight: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    freeBadge: {
        backgroundColor: '#10B981',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginRight: 12,
    },
    freeBadgeText: {
        fontSize: 11,
        color: '#fff',
        fontWeight: 'bold',
    },
    policyHighlightText: {
        flex: 1,
        fontSize: 13,
        color: '#1F2937',
        lineHeight: 20,
    },
    childrenCard: {
        backgroundColor: '#fff',
        padding: 20,
        marginTop: 12,
    },
    childrenText: {
        fontSize: 14,
        color: '#1F2937',
        lineHeight: 22,
        marginBottom: 8,
    },
    childrenNote: {
        fontSize: 13,
        color: TEXT_LIGHT,
        lineHeight: 20,
        marginBottom: 12,
        fontStyle: 'italic',
    },
    facilitiesCard: {
        backgroundColor: '#fff',
        padding: 20,
        marginTop: 12,
    },
    policiesCard: {
        backgroundColor: '#fff',
        padding: 20,
        marginTop: 12,
    },
    policyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    policyLabel: {
        fontSize: 14,
        color: TEXT_LIGHT,
    },
    policyValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    policyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        padding: 12,
        backgroundColor: '#ECFDF5',
        borderRadius: 8,
    },
    policyBadgeText: {
        fontSize: 13,
        color: '#10B981',
        fontWeight: '600',
        marginLeft: 8,
    },
    bottomCTA: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    priceContainer: {
        flex: 1,
    },
    priceLabel: {
        fontSize: 12,
        color: TEXT_LIGHT,
    },
    price: {
        fontSize: 24,
        fontWeight: 'bold',
        color: PRIMARY_COLOR,
    },
    priceSubtext: {
        fontSize: 11,
        color: TEXT_LIGHT,
    },
    bookButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: PRIMARY_COLOR,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        elevation: 3,
        shadowColor: PRIMARY_COLOR,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    bookButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
    },
});
