import BookingModal from '@/components/booking/BookingModal';
import GreenDotsLoader from '@/components/common/GreenDotsLoader';
import { Colors } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useThemeColors';
import { agencyApi, reviewsApi } from '@/services/api';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');
const DEFAULT_AGENCY_IMAGE = 'https://images.unsplash.com/photo-1564769625905-aa93094960ea?w=800&q=80';
const AVIS_ICON = require('../../../../assets/images/avis.png');

interface AgencyPack {
    id: string;
    title: string;
    date: string;
    image: string | null;
    price: number;
    description: string;
}

interface AgencyProfileData {
    id: string;
    name: string;
    logo: string | null;
    coverImage: string | null;
    rating: number;
    reviews: number;
    slogan: string;
    stats: { label: string; value: string }[];
    description: string;
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
    latitude: number;
    longitude: number;
    services: string[];
    certifications: string[];
    packs: AgencyPack[];
}

export default function ProfileAgenceScreen() {
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const router = useRouter();
    const params = useLocalSearchParams();
    const agencyId = params.agencyId as string | undefined;
    const agencyName = params.agencyName as string || 'Sabeel Travel';
    const agencyLat = params.agencyLat ? parseFloat(params.agencyLat as string) : 36.8065;
    const agencyLng = params.agencyLng ? parseFloat(params.agencyLng as string) : 10.1815;

    const [agencyReviews, setAgencyReviews] = useState<any[]>([]);
    const [reviewCount, setReviewCount] = useState(0);
    const [averageRating, setAverageRating] = useState(0);
    const [reviewsLoading, setReviewsLoading] = useState(false);

    const [addReviewVisible, setAddReviewVisible] = useState(false);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    const initialAgencyData = useMemo(() => ({
        id: agencyId || '',
        name: agencyName,
        logo: null, // Avoid using base64 from params
        coverImage: null,
        rating: averageRating,
        reviews: reviewCount,
        slogan: 'Agence Umrah certifiée',
        stats: [
            { label: 'Packs', value: '0' },
            { label: 'Avis', value: `${reviewCount}` },
            { label: 'Support', value: '24/7' },
        ],
        description: 'Informations de l’agence en cours de chargement.',
        phone: '',
        whatsapp: '',
        email: '',
        address: (params.address as string) || 'Adresse non disponible',
        latitude: agencyLat,
        longitude: agencyLng,
        services: ['Packs Umrah'],
        certifications: ['Agence vérifiée'],
        packs: [] as AgencyPack[],
    }), [agencyId, agencyName, params.agencyLogo, params.address, agencyLat, agencyLng, averageRating, reviewCount]);

    const [reviewsModalVisible, setReviewsModalVisible] = useState(false);
    const [bookingModalVisible, setBookingModalVisible] = useState(false);
    const [agencyData, setAgencyData] = useState<AgencyProfileData>(initialAgencyData);
    const [loading, setLoading] = useState(Boolean(agencyId));

    const fetchReviews = async () => {
        if (!agencyId) {
            setAgencyReviews([]);
            setAverageRating(0);
            setReviewCount(0);
            return;
        }
        try {
            setReviewsLoading(true);
            const [summaryRes, listRes] = await Promise.all([
                reviewsApi.summaryByTarget({ targetType: 'AGENCE', targetId: agencyId }),
                reviewsApi.listByTarget({ targetType: 'AGENCE', targetId: agencyId }),
            ]);
            setAverageRating(Number(summaryRes.data?.averageRating || 0));
            setReviewCount(Number(summaryRes.data?.reviewsCount || 0));
            setAgencyReviews(Array.isArray(listRes.data?.reviews) ? listRes.data.reviews : []);
        } catch {
            setAgencyReviews([]);
            setAverageRating(0);
            setReviewCount(0);
        } finally {
            setReviewsLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [agencyId]);

    const handleSubmitReview = async () => {
        if (!agencyId) return;
        if (!newComment.trim()) return;
        try {
            setSubmittingReview(true);
            await reviewsApi.createReview({
                targetType: 'AGENCE',
                targetId: agencyId,
                rating: newRating,
                comment: newComment.trim(),
            });
            setAddReviewVisible(false);
            setNewRating(5);
            setNewComment('');
            fetchReviews();
        } finally {
            setSubmittingReview(false);
        }
    };

    useEffect(() => {
        const fetchAgency = async () => {
            if (!agencyId) {
                setAgencyData(initialAgencyData);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await agencyApi.getPublicAgencyById(agencyId);
                const agency = response.data?.agency;
                const packs = Array.isArray(response.data?.packs) ? response.data.packs : [];
                if (!agency) {
                    setLoading(false);
                    return;
                }

                setAgencyData({
                    id: agency.id,
                    name: agency.name || initialAgencyData.name,
                    logo: agency.profileImageUrl || initialAgencyData.logo,
                    coverImage: agency.coverImageUrl || agency.profileImageUrl || initialAgencyData.coverImage,
                    rating: averageRating,
                    reviews: reviewCount,
                    slogan: agency.agencyType || 'Agence Umrah certifiée',
                    stats: [
                        { label: 'Packs', value: `${agency.packsCount || packs.length || 0}` },
                        { label: 'Avis', value: `${reviewCount}` },
                        { label: 'Support', value: agency.phoneNumber ? 'Direct' : '24/7' },
                    ],
                    description: agency.responsibleName
                        ? `${agency.responsibleName}${agency.responsibleTitle ? ` - ${agency.responsibleTitle}` : ''}`
                        : initialAgencyData.description,
                    phone: agency.phoneNumber || '',
                    whatsapp: agency.phoneNumber || '',
                    email: agency.email || '',
                    address: (params.address as string) || initialAgencyData.address,
                    latitude: agencyLat,
                    longitude: agencyLng,
                    services: ['Packs Umrah', agency.agencyType || 'Service agence'].filter(Boolean),
                    certifications: ['Agence vérifiée'],
                    packs: packs.map((pack: any) => ({
                        id: pack.id,
                        title: pack.title || 'Pack Umrah',
                        date: pack.departureDate && pack.arrivalDate
                            ? `${pack.departureDate} - ${pack.arrivalDate}`
                            : pack.departureDate || pack.arrivalDate || 'Dates à confirmer',
                        image: pack.imageUrl || null,
                        price: Number(pack.price || pack.priceAdult || 0),
                        description: pack.description || '',
                    })),
                });
            } catch (error) {
                console.error('Failed to fetch agency profile:', error);
                setAgencyData((current) => current || initialAgencyData);
            } finally {
                setLoading(false);
            }
        };

        fetchAgency();
    }, [agencyId, initialAgencyData, averageRating, reviewCount, params.address, agencyLat, agencyLng]);

    const agencyPacks = agencyData.packs;
    const packDates = agencyPacks.map(p => p.date);

    // Fallback dates if no packs found
    const availableDates = packDates.length > 0 ? packDates : [
        'Hiver 2024',
        'Printemps 2024',
        'Ramadan 2024',
        'Été 2024',
    ];

    const handleBookingSubmit = (date: string, people: string) => {
        const selectedPack = agencyPacks.find(p => p.date === date);
        const packTitle = selectedPack ? selectedPack.title : 'Pack Omra';

        setBookingModalVisible(false);
        router.push({
            pathname: '/(umrah_agence)/(screens)/(chat)/chat_pelerin' as any,
            params: {
                contactName: agencyName,
                bookingDate: date,
                bookingPeople: people,
                packTitle: packTitle,
            }
        });
    };

    const openMap = () => {
        router.push({
            pathname: '/(umrah_agence)/(screens)/(pack_umrah)/map',
            params: {
                lat: agencyData.latitude.toString(),
                lng: agencyData.longitude.toString(),
                agencyName: agencyData.name
            }
        });
    };

    const callAgency = () => {
        Linking.openURL(`tel:${agencyData.phone}`);
    };

    const whatsappAgency = () => {
        const message = `Salem! Je vous contacte via Sabeel à propos de vos services d'agence ${agencyData.name}.`;
        Linking.openURL(`whatsapp://send?phone=${agencyData.whatsapp}&text=${encodeURIComponent(message)}`);
    };

    const emailAgency = () => {
        Linking.openURL(`mailto:${agencyData.email}?subject=Information Omra - ${agencyData.name}`);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {loading ? (
                <GreenDotsLoader fullScreen={true} />
            ) : (
                <>

            {/* Reviews Modal */}
            <Modal
                visible={reviewsModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setReviewsModalVisible(false)}
            >
                <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                    <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Avis & Témoignages</Text>
                        <TouchableOpacity onPress={() => setReviewsModalVisible(false)} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {reviewsLoading ? (
                        <View style={styles.emptyState}>
                            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>Chargement...</Text>
                        </View>
                    ) : agencyReviews.length > 0 ? (
                        <FlatList
                            data={agencyReviews}
                            keyExtractor={(item) => `${item.id}`}
                            renderItem={({ item }) => (
                                <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                                    <View style={styles.reviewHeaderRow}>
                                        <View style={styles.reviewHeaderLeft}>
                                            <View style={[styles.reviewAvatar, { backgroundColor: isDarkMode ? colors.divider : '#F3F4F6' }]}>
                                                <Ionicons name="person" size={18} color={colors.primary} />
                                            </View>
                                            <View>
                                                <Text style={[styles.reviewAuthor, { color: colors.text }]}>
                                                    {`${item.author?.firstName || ''} ${item.author?.lastName || ''}`.trim() || 'Pèlerin'}
                                                </Text>
                                                <Text style={[styles.reviewDate, { color: colors.textSecondary }]}>
                                                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.reviewStarsRow}>
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Ionicons
                                                    key={s}
                                                    name="star"
                                                    size={12}
                                                    color={s <= (item.rating || 0) ? '#F59E0B' : (isDarkMode ? '#444' : '#E5E7EB')}
                                                />
                                            ))}
                                        </View>
                                    </View>
                                    <Text style={[styles.reviewBody, { color: colors.textSecondary }]}>{item.comment}</Text>
                                </View>
                            )}
                            contentContainerStyle={{ paddingBottom: 40, paddingTop: 12 }}
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="chatbubble-ellipses-outline" size={64} color={colors.textLight} />
                            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>Pas d'avis pour le moment</Text>
                        </View>
                    )}
                </View>
            </Modal>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <Image source={agencyData.coverImage ? { uri: agencyData.coverImage } : { uri: DEFAULT_AGENCY_IMAGE }} style={styles.coverImage} />
                    <View style={styles.overlay} />

                    {/* Header Overlay */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.headerRightActions}>
                            <TouchableOpacity onPress={() => setAddReviewVisible(true)} style={styles.iconButton}>
                                <Image source={AVIS_ICON} style={styles.avisIcon} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Profile Card Overlay */}
                <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
                    <View style={[styles.logoContainer, { backgroundColor: colors.surface }]}>
                        <Image source={agencyData.logo ? { uri: agencyData.logo } : { uri: DEFAULT_AGENCY_IMAGE }} style={styles.agencyLogo} />
                    </View>

                    <Text style={[styles.agencyNameTitle, { color: colors.text }]}>{agencyData.name}</Text>

                    <Text style={[styles.agencySlogan, { color: colors.textSecondary }]}>{agencyData.slogan}</Text>

                    <TouchableOpacity
                        style={[styles.ratingBadge, { backgroundColor: isDarkMode ? '#2a2a2a' : '#F3F4F6' }]}
                        onPress={() => setReviewsModalVisible(true)}
                    >
                        <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Ionicons
                                    key={s}
                                    name="star"
                                    size={14}
                                    color={s <= Math.round(agencyData.rating) ? "#F59E0B" : (isDarkMode ? "#444" : "#F3F4F6")}
                                />
                            ))}
                        </View>
                        <Text style={[styles.ratingTextSmall, { color: colors.textSecondary }]}>
                            {agencyData.rating > 0 ? agencyData.rating.toFixed(1) : 'Nouvelle'} ({agencyData.reviews} avis)
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color={colors.textLight} />
                    </TouchableOpacity>

                    {/* Stats Section */}
                    <View style={[styles.statsBar, { backgroundColor: isDarkMode ? colors.background : '#F9F9F9' }]}>
                        {agencyData.stats.map((stat, idx) => (
                            <View key={idx} style={[styles.statItem, idx !== 0 && [styles.statBorder, { borderLeftColor: colors.divider }]]}>
                                <Text style={[styles.statValue, { color: colors.primary }]}>{stat.value}</Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* About Section */}
                <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionTitleMain, { color: colors.text }]}>À propos</Text>
                    <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>{agencyData.description}</Text>
                </View>

                {/* Contact Section */}
                <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionTitleMain, { color: colors.text }]}>Contact direct</Text>
                    <View style={styles.contactGrid}>
                        <TouchableOpacity
                            style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}
                            onPress={() => router.push({
                                pathname: '/(umrah_agence)/(screens)/(chat)/chat_pelerin' as any,
                                params: { contactName: agencyData.name }
                            })}
                        >
                            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
                            <Text style={[styles.contactCardLabel, { color: colors.text }]}>Message</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.contactCard, styles.reserveCard]}
                            onPress={() => setBookingModalVisible(true)}
                        >
                            <Ionicons name="calendar-outline" size={20} color="#fff" />
                            <Text style={[styles.contactCardLabel, styles.reserveCardLabel]}>Réserver</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Services Section */}
                <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionTitleMain, { color: colors.text }]}>Nos Services</Text>
                    <View style={styles.servicesList}>
                        {agencyData.services.map((service, index) => (
                            <View key={index} style={styles.serviceItem}>
                                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                                <Text style={[styles.serviceItemText, { color: colors.textSecondary }]}>{service}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Map Section */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={[styles.sectionTitleMain, { color: colors.text }]}>Localisation</Text>
                        <TouchableOpacity onPress={openMap}>
                            <Text style={[styles.linkText, { color: colors.primary }]}>Voir sur la carte</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.addressText, { color: colors.textSecondary }]}>{agencyData.address}</Text>
                    <TouchableOpacity style={styles.mapCard} onPress={openMap}>
                        <View style={[styles.mapImagePremium, { backgroundColor: colors.divider, justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name="map-outline" size={40} color={colors.textLight} />
                        </View>
                        <View style={styles.mapOverlayPremium}>
                            <View style={[styles.mapButtonPremium, { backgroundColor: colors.primary }]}>
                                <Ionicons name="navigate" size={18} color="#fff" />
                                <Text style={styles.mapButtonText}>Y aller</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            <BookingModal
                visible={bookingModalVisible}
                onClose={() => setBookingModalVisible(false)}
                onSubmit={handleBookingSubmit}
                title="Réserver un Pack"
                dateLabel="Session de départ"
                peopleLabel="Nombre de pèlerins"
                submitLabel="Demander un devis"
                note="L'agence recevra votre demande et vous contactera pour finaliser les détails."
                availableDates={availableDates}
            />

            <Modal
                visible={addReviewVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setAddReviewVisible(false)}
            >
                <View style={styles.reviewModalOverlay}>
                    <View style={[styles.reviewModalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.reviewModalHeader}>
                            <Text style={[styles.reviewModalTitle, { color: colors.text }]}>Ajouter un avis</Text>
                            <TouchableOpacity onPress={() => setAddReviewVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.starsInputRow}>
                            {[1, 2, 3, 4, 5].map((s) => (
                                <TouchableOpacity key={s} onPress={() => setNewRating(s)} activeOpacity={0.8}>
                                    <Ionicons name={s <= newRating ? 'star' : 'star-outline'} size={28} color="#F59E0B" />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput
                            style={[styles.reviewTextArea, { color: colors.text, borderColor: colors.divider }]}
                            placeholder="Écrivez votre avis..."
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            value={newComment}
                            onChangeText={setNewComment}
                        />

                        <TouchableOpacity
                            style={[styles.submitReviewBtn, { backgroundColor: colors.primary, opacity: submittingReview || !newComment.trim() ? 0.6 : 1 }]}
                            activeOpacity={0.85}
                            disabled={submittingReview || !newComment.trim()}
                            onPress={handleSubmitReview}
                        >
                            <Text style={styles.submitReviewText}>{submittingReview ? 'Envoi...' : 'Publier'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    heroSection: {
        height: 220,
        position: 'relative',
    },
    coverImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    header: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 10,
    },
    headerRightActions: {
        flexDirection: 'row',
        gap: 10,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avisIcon: {
        width: 22,
        height: 22,
        resizeMode: 'contain',
        tintColor: '#fff',
    },
    profileCard: {
        marginHorizontal: 20,
        borderRadius: 20,
        padding: 16,
        marginTop: -60,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        alignItems: 'center',
    },
    logoContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        padding: 4,
        marginTop: -60,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    agencyLogo: {
        width: '100%',
        height: '100%',
        borderRadius: 35,
    },
    agencyNameTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 12,
        textAlign: 'center',
    },
    agencySlogan: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 4,
        paddingHorizontal: 10,
        fontStyle: 'italic',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 12,
        gap: 6,
    },
    starsRow: {
        flexDirection: 'row',
        gap: 2,
    },
    ratingTextSmall: {
        fontSize: 13,
        fontWeight: '600',
    },
    statsBar: {
        flexDirection: 'row',
        width: '100%',
        marginTop: 24,
        borderRadius: 16,
        paddingVertical: 15,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statBorder: {
        borderLeftWidth: 1,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 11,
        marginTop: 2,
        textTransform: 'uppercase',
    },
    sectionContainer: {
        paddingHorizontal: 20,
        marginTop: 28,
    },
    contactGrid: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
    },
    contactCard: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        justifyContent: 'center',
        gap: 8,
    },
    reserveCard: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    contactCardLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    reserveCardLabel: {
        color: '#fff',
    },
    sectionTitleMain: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 12,
    },
    linkText: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 13,
    },
    descriptionText: {
        fontSize: 15,
        lineHeight: 24,
    },
    servicesList: {
        gap: 12,
    },
    serviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    serviceItemText: {
        fontSize: 15,
    },
    addressText: {
        fontSize: 14,
        marginBottom: 12,
    },
    mapCard: {
        height: 160,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    mapImagePremium: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    mapOverlayPremium: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapButtonPremium: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        gap: 8,
        elevation: 3,
    },
    mapButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    reviewCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 14,
    },
    reviewHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    reviewHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
        paddingRight: 12,
    },
    reviewAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reviewAuthor: {
        fontSize: 14,
        fontWeight: '700',
    },
    reviewDate: {
        fontSize: 12,
        marginTop: 2,
    },
    reviewStarsRow: {
        flexDirection: 'row',
        gap: 2,
    },
    reviewBody: {
        fontSize: 13,
        lineHeight: 18,
    },
    reviewPreview: {
        marginTop: 4,
    },
    previewStatus: {
        marginHorizontal: 0,
        borderWidth: 1,
    },
    noReviewsBox: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
    },
    noReviewsText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    certItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    certText: {
        fontSize: 14,
        fontWeight: '500',
    },
    lastSection: {
        marginBottom: 40,
    },
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 4,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyStateText: {
        marginTop: 16,
        fontSize: 16,
        textAlign: 'center',
    },
    reviewModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    reviewModalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
    },
    reviewModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    reviewModalTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    starsInputRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    reviewTextArea: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        minHeight: 110,
        textAlignVertical: 'top',
    },
    submitReviewBtn: {
        marginTop: 12,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    submitReviewText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
});
