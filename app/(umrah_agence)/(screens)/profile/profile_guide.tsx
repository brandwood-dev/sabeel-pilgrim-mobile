import BookingModal from '@/components/booking/BookingModal';
import { useThemeColors } from '@/hooks/useThemeColors';
import { guideApi, reservationApi, reviewsApi } from '@/services/api';
import { RootState } from '@/store/store';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Platform
} from 'react-native';
import { useSelector } from 'react-redux';

const PRIMARY_COLOR = '#2C5F2D';
const ACCENT_COLOR = '#d9ab83';
const BACKGROUND_COLOR = '#f8f7f2';
const TEXT_LIGHT = '#666';
const AVIS_ICON = require('../../../../assets/images/avis.png');
const DEFAULT_GUIDE_COVER = 'https://images.unsplash.com/photo-1564769625905-aa93094960ea?w=800&q=80';

export default function GuideProfileScreen() {
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const router = useRouter();
    const params = useLocalSearchParams();

    const {
        guideId,
        guideName,
        guideExperience,
        guidePrice,
        guideLanguages,
        guideSpecialties,
        guideLocation,
        guideUmrahPackages,
        guideBio,
        guidePhoto,
    } = params;


    const languages = typeof guideLanguages === 'string' ? guideLanguages.split(',') : [];
    const specialties = typeof guideSpecialties === 'string' ? guideSpecialties.split(',') : [];
    const umrahPackages = typeof guideUmrahPackages === 'string' ? guideUmrahPackages.split(',') : [];

    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingStatus, setBookingStatus] = useState<'idle' | 'pending' | 'accepted' | 'refused'>('idle');

    const [reviews, setReviews] = useState<any[]>([]);
    const [reviewsCount, setReviewsCount] = useState(0);
    const [averageRating, setAverageRating] = useState(0);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsModalVisible, setReviewsModalVisible] = useState(false);

    const [addReviewVisible, setAddReviewVisible] = useState(false);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    const [guideDetails, setGuideDetails] = useState<any | null>(null);
    const [guideDetailsLoading, setGuideDetailsLoading] = useState(false);

    // Mock available dates (in real app, this would come from API)
    const availableDates = [
        '2024-02-15',
        '2024-02-20',
        '2024-02-25',
        '2024-03-01',
        '2024-03-10',
        '2024-03-15',
        '2024-03-20',
    ];

    const handleChatPress = () => {
        router.push({
            pathname: '/(umrah_agence)/(screens)/(chat)/chat_pelerin' as any,
            params: {
                conversationId: guideId,
                contactName: guideName,
                type: 'guide'
            }
        });
    };

    const handleBookingSubmit = async (date: string, people: string) => {
        if (!guideId || typeof guideId !== 'string') return;

        try {
            setBookingStatus('pending');
            setShowBookingModal(false);

            const response = await reservationApi.createGuideReservation({
                guideId,
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
                    contactName: guideName,
                    contactImage: guidePhoto,
                    type: 'guide'
                }
            });
        } catch (error: any) {
            setBookingStatus('idle');
            Alert.alert('Erreur', error?.response?.data?.message || error?.message || 'Impossible de créer la réservation.');
        }
    };

    const fetchReviews = async () => {
        if (!guideId || typeof guideId !== 'string') return;
        try {
            setReviewsLoading(true);
            const [summaryRes, listRes] = await Promise.all([
                reviewsApi.summaryByTarget({ targetType: 'GUIDE', targetId: guideId }),
                reviewsApi.listByTarget({ targetType: 'GUIDE', targetId: guideId }),
            ]);
            setAverageRating(Number(summaryRes.data?.averageRating || 0));
            setReviewsCount(Number(summaryRes.data?.reviewsCount || 0));
            setReviews(Array.isArray(listRes.data?.reviews) ? listRes.data.reviews : []);
        } catch (e) {
            setAverageRating(0);
            setReviewsCount(0);
            setReviews([]);
        } finally {
            setReviewsLoading(false);
        }
    };

    const fetchGuideDetails = async () => {
        if (!guideId || typeof guideId !== 'string') return;
        try {
            setGuideDetailsLoading(true);
            const res = await guideApi.getGuideById(guideId);
            setGuideDetails(res.data?.guide ?? res.data ?? null);
        } catch {
            setGuideDetails(null);
        } finally {
            setGuideDetailsLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
        fetchGuideDetails();
    }, [guideId]);

    const aboutTextValue = `${
        guideDetails?.about ||
        guideDetails?.bio ||
        guideDetails?.description ||
        guideBio ||
        ''
    }`.trim();

    const handleSubmitReview = async () => {
        if (!guideId || typeof guideId !== 'string') return;
        if (!newComment.trim()) return;
        try {
            setSubmittingReview(true);
            await reviewsApi.createReview({
                targetType: 'GUIDE',
                targetId: guideId,
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

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <Image
                        source={guidePhoto ? { uri: guidePhoto as string } : { uri: DEFAULT_GUIDE_COVER }}
                        style={styles.coverImage}
                    />
                    <View style={styles.overlay} />

                    {/* Header */}
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

                {/* Profile Section */}
                <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
                    <View style={[styles.logoContainer, { backgroundColor: colors.surface }]}>
                        <Image
                            source={guidePhoto
                                ? { uri: guidePhoto as string }
                                : { uri: `https://ui-avatars.com/api/?name=${guideName || 'Guide'}&background=2C5F2D&color=fff&size=200&bold=true` }
                            }
                            style={styles.profileImagePremium}
                        />
                        <View style={[styles.verifiedBadgePremium, { backgroundColor: isDarkMode ? colors.primary : ACCENT_COLOR }]}>
                            <Ionicons name="checkmark-circle" size={24} color="#fff" />
                        </View>
                    </View>

                    <Text style={[styles.guideNameTitle, { color: colors.text }]}>{guideName}</Text>

                    <Text style={[styles.guideSlogan, { color: colors.textSecondary }]}>{guideLocation || 'Guide privé'}</Text>

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
                                    color={s <= Math.round(averageRating) ? "#F59E0B" : (isDarkMode ? "#444" : "#F3F4F6")}
                                />
                            ))}
                        </View>
                        <Text style={[styles.ratingTextSmall, { color: colors.textSecondary }]}>
                            {averageRating > 0 ? averageRating.toFixed(1) : 'Nouvelle'} ({reviewsCount} avis)
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color={colors.textLight} />
                    </TouchableOpacity>

                    {/* Booking Status */}
                    {bookingStatus === 'pending' && (
                        <View style={[styles.statusBanner, { backgroundColor: isDarkMode ? '#2d2610' : '#FEF3C7' }]}>
                            <Ionicons name="time-outline" size={20} color="#F59E0B" />
                            <Text style={[styles.statusText, { color: isDarkMode ? '#F59E0B' : '#92400E' }]}>Demande en attente de réponse</Text>
                        </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.contactGrid}>
                        <TouchableOpacity
                            style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}
                            onPress={handleChatPress}
                        >
                            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
                            <Text style={[styles.contactCardLabel, { color: colors.text }]}>Message</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.contactCard, styles.reserveCard]}
                            onPress={() => setShowBookingModal(true)}
                            disabled={bookingStatus === 'pending'}
                        >
                            <Ionicons name="calendar-outline" size={20} color="#fff" />
                            <Text style={[styles.contactCardLabel, styles.reserveCardLabel]}>Réserver</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Stats Section */}
                    <View style={[styles.statsBar, { backgroundColor: isDarkMode ? colors.background : '#F9F9F9' }]}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: colors.primary }]}>{`${guideExperience || 0}`}</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Exp.</Text>
                        </View>
                        <View style={[styles.statItem, styles.statBorder, { borderLeftColor: colors.divider }]}>
                            <Text style={[styles.statValue, { color: colors.primary }]}>{`${reviewsCount}`}</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avis</Text>
                        </View>
                        <View style={[styles.statItem, styles.statBorder, { borderLeftColor: colors.divider }]}>
                            <Text style={[styles.statValue, { color: colors.primary }]}>{`${languages.length}`}</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Lang.</Text>
                        </View>
                    </View>
                </View>

                {/* About Card */}
                <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionTitleMain, { color: colors.text }]}>À propos</Text>
                    <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                        {aboutTextValue || (guideDetailsLoading ? 'Chargement...' : 'À propos non disponible')}
                    </Text>
                </View>

                {/* Info Cards */}
                <View style={styles.infoSection}>
                    <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                        <View style={styles.infoCardHeader}>
                            <Ionicons name="cash-outline" size={24} color={colors.primary} />
                            <Text style={[styles.infoCardTitle, { color: colors.text }]}>Tarif</Text>
                        </View>
                        <Text style={[styles.priceText, { color: colors.primary }]}>{guidePrice} TND</Text>
                        <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>par jour</Text>
                    </View>

                    <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                        <View style={styles.infoCardHeader}>
                            <Ionicons name="airplane-outline" size={24} color={colors.primary} />
                            <Text style={[styles.infoCardTitle, { color: colors.text }]}>Formules Omra</Text>
                        </View>
                        <View style={styles.packagesList}>
                            {umrahPackages.map((pkg, index) => (
                                <View key={index} style={styles.packageChip}>
                                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                                    <Text style={[styles.packageChipText, { color: colors.text }]}>{pkg}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                        <View style={styles.infoCardHeader}>
                            <Ionicons name="language-outline" size={24} color={colors.primary} />
                            <Text style={[styles.infoCardTitle, { color: colors.text }]}>Langues</Text>
                        </View>
                        <View style={styles.languagesList}>
                            {languages.map((lang, index) => (
                                <View key={index} style={[styles.languageChip, { backgroundColor: isDarkMode ? '#1a2a1a' : `${colors.primary}15` }]}>
                                    <Text style={[styles.languageChipText, { color: colors.primary }]}>{lang}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                        <View style={styles.infoCardHeader}>
                            <Ionicons name="star-outline" size={24} color={colors.primary} />
                            <Text style={[styles.infoCardTitle, { color: colors.text }]}>Spécialités</Text>
                        </View>
                        <View style={styles.specialtiesList}>
                            {specialties.map((spec, index) => (
                                <View key={index} style={[styles.specialtyChip, { backgroundColor: isDarkMode ? '#2d2610' : '#FEF3C7' }]}>
                                    <Text style={[styles.specialtyChipText, { color: isDarkMode ? '#F59E0B' : '#92400E' }]}>{spec}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

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
                    ) : reviews.length > 0 ? (
                        <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingTop: 12 }}>
                            {reviews.map((review) => (
                                <View key={review.id} style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                                    <View style={styles.reviewHeaderRow}>
                                        <View style={styles.reviewHeaderLeft}>
                                            <View style={[styles.reviewAvatar, { backgroundColor: isDarkMode ? colors.divider : '#F3F4F6' }]}>
                                                <Ionicons name="person" size={18} color={colors.primary} />
                                            </View>
                                            <View>
                                                <Text style={[styles.reviewAuthor, { color: colors.text }]}>
                                                    {`${review.author?.firstName || ''} ${review.author?.lastName || ''}`.trim() || 'Pèlerin'}
                                                </Text>
                                                <Text style={[styles.reviewDate, { color: colors.textSecondary }]}>
                                                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.reviewStarsRow}>
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Ionicons
                                                    key={s}
                                                    name="star"
                                                    size={12}
                                                    color={s <= (review.rating || 0) ? '#F59E0B' : (isDarkMode ? '#444' : '#E5E7EB')}
                                                />
                                            ))}
                                        </View>
                                    </View>
                                    <Text style={[styles.reviewBody, { color: colors.textSecondary }]}>{review.comment}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="chatbubble-ellipses-outline" size={64} color={colors.textLight} />
                            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>Pas d'avis pour le moment</Text>
                        </View>
                    )}
                </View>
            </Modal>

            {/* Booking Modal */}
            <BookingModal
                visible={showBookingModal}
                onClose={() => setShowBookingModal(false)}
                onSubmit={handleBookingSubmit}
                title="Réserver une Omra"
                dateLabel="Choisir une date"
                peopleLabel="Nombre de personnes"
                submitLabel="Envoyer la demande"
                note="Le guide recevra votre demande et pourra l'accepter ou la refuser. Vous serez notifié de sa réponse."
                availableDates={availableDates}
            />

            <Modal
                visible={addReviewVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setAddReviewVisible(false)}
            >
                <View style={styles.reviewModalOverlay}>
                    <View style={[styles.reviewModalContent, { backgroundColor: colors.surface }]}
                    >
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    modalContainer: {
        flex: 1,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        gap: 10,
    },
    emptyStateText: {
        fontSize: 14,
        textAlign: 'center',
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
        width: 80,
        height: 80,
        borderRadius: 40,
        padding: 4,
        marginTop: -60,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        position: 'relative',
    },
    profileImagePremium: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
    },
    verifiedBadgePremium: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        borderRadius: 14,
        padding: 2,
        elevation: 3,
    },
    guideNameTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 12,
        textAlign: 'center',
    },
    guideSlogan: {
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
        fontSize: 12,
        fontWeight: '600',
    },
    statsBar: {
        width: '100%',
        marginTop: 16,
        flexDirection: 'row',
        borderRadius: 16,
        paddingVertical: 12,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statBorder: {
        borderLeftWidth: 1,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
    },
    statLabel: {
        fontSize: 12,
        marginTop: 2,
    },
    sectionContainer: {
        marginTop: 16,
        marginHorizontal: 20,
    },
    sectionTitleMain: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 8,
    },
    descriptionText: {
        fontSize: 14,
        lineHeight: 20,
    },
    contactGrid: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
        width: '100%',
    },
    contactCard: {
        flex: 1,
        borderRadius: 16,
        paddingVertical: 14,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    contactCardLabel: {
        fontSize: 13,
        fontWeight: '700',
    },
    reserveCard: {
        backgroundColor: PRIMARY_COLOR,
        borderWidth: 0,
    },
    reserveCardLabel: {
        color: '#fff',
    },
    reviewHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    reviewHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    reviewAvatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reviewAuthor: {
        fontSize: 14,
        fontWeight: '700',
    },
    reviewStarsRow: {
        flexDirection: 'row',
        gap: 2,
        marginLeft: 10,
    },
    reviewBody: {
        fontSize: 14,
        lineHeight: 20,
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    imageContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: ACCENT_COLOR,
        borderRadius: 16,
        elevation: 3,
    },
    guideName: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 4,
    },
    locationText: {
        fontSize: 14,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    addReviewBtn: {
        marginLeft: 10,
    },
    ratingText: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 6,
    },
    reviewsText: {
        fontSize: 14,
        marginLeft: 4,
    },
    experienceText: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 16,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '500',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    chatButtonLarge: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    chatButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    bookButtonLarge: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PRIMARY_COLOR,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    bookButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    infoSection: {
        padding: 16,
        gap: 12,
    },
    infoCard: {
        borderRadius: 12,
        padding: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    infoCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    infoCardTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    priceText: {
        fontSize: 28,
        fontWeight: '700',
    },
    priceLabel: {
        fontSize: 14,
    },
    packagesList: {
        gap: 8,
    },
    packageChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 4,
    },
    packageChipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    languagesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    languageChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    languageChipText: {
        fontSize: 13,
        fontWeight: '500',
    },
    specialtiesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    specialtyChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    specialtyChipText: {
        fontSize: 13,
        fontWeight: '500',
    },
    aboutText: {
        fontSize: 14,
        lineHeight: 20,
    },
    reviewsSection: {
        padding: 16,
    },
    reviewsLoadingBox: {
        paddingVertical: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    reviewCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    reviewerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    reviewerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reviewerName: {
        fontSize: 14,
        fontWeight: '600',
    },
    reviewDate: {
        fontSize: 12,
    },
    reviewRating: {
        flexDirection: 'row',
        gap: 2,
    },
    reviewComment: {
        fontSize: 14,
        lineHeight: 20,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
        marginTop: 8,
    },
    datesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    dateChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    dateChipSelected: {
        backgroundColor: `${PRIMARY_COLOR}15`,
        borderColor: PRIMARY_COLOR,
    },
    dateChipText: {
        fontSize: 14,
        fontWeight: '500',
        color: TEXT_LIGHT,
    },
    dateChipTextSelected: {
        color: PRIMARY_COLOR,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1F2937',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 16,
    },
    submitButton: {
        backgroundColor: PRIMARY_COLOR,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    submitButtonDisabled: {
        backgroundColor: '#D1D5DB',
        elevation: 0,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalNote: {
        fontSize: 12,
        color: TEXT_LIGHT,
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 18,
    },
});
