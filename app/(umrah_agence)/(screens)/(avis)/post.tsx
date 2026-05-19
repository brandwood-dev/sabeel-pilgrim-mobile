import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    FlatList,
    Image,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';

import { useSelector } from 'react-redux';
import { useThemeColors } from '../../../../hooks/useThemeColors';
import { agencyApi, guideApi, reviewsApi, authApi } from '@/services/api';
import { RootState } from '../../../../store/store';

// Sabeel Theme Colors - Removed Brown Tones
const COLORS = {
    primary: '#B8860B', // Keep primary as Gold/Bronze per app theme, but avoid dirt-brown
    primaryGreen: '#2C5F2D', // Sabeel Green (Main Brand Color)
    secondary: '#DAA520', // Golden Rod
    accent: '#D4AF37', // Gold 
    background: '#FDFBF7', // Warm Beige (Keep consistency)
    white: '#FFFFFF',
    text: '#2C3E50',
    lightText: '#999999',
    divider: '#E0E0E0',
    success: '#27AE60'
};

export default function PostScreen() {
    const router = useRouter();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const colors = useThemeColors();

    // Dynamic colors
    const backgroundColor = isDarkMode ? '#121212' : COLORS.background;
    const contentBackgroundColor = isDarkMode ? '#121212' : '#f5f5f5';
    const surfaceColor = isDarkMode ? '#1E1E1E' : '#FFFFFF';
    const textColor = isDarkMode ? '#F5F5F5' : COLORS.text;
    const textSecondaryColor = isDarkMode ? '#AAAAAA' : COLORS.lightText;
    const dividerColor = isDarkMode ? '#333333' : COLORS.divider;
    const inputBgColor = isDarkMode ? '#2D2D2D' : '#f9f9f9';
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'AGENCE' | 'GUIDE'>('ALL');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const [shareModal, setShareModal] = useState(false);
    const [publishModal, setPublishModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [feedReviews, setFeedReviews] = useState<any[]>([]);
    const [agencies, setAgencies] = useState<Array<{ id: string; name: string }>>([]);
    const [guides, setGuides] = useState<Array<{ id: string; name: string }>>([]);

    // New Post State
    const [newPost, setNewPost] = useState({
        type: 'AGENCE' as 'AGENCE' | 'GUIDE',
        targetId: '',
        targetName: '',
        rating: 5,
        comment: '',
    });
    const [showEntitySelector, setShowEntitySelector] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);

    const fetchUserProfile = async () => {
        try {
            const res = await authApi.getProfile();
            if (res.data) {
                setUserProfile(res.data);
            }
        } catch (err) {
            console.error('[PostScreen] Failed to fetch user profile', err);
        }
    };

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchFeed = async () => {
        try {
            setLoading(true);
            const res = await reviewsApi.feed(typeFilter === 'ALL' ? undefined : { targetType: typeFilter as any });
            setFeedReviews(Array.isArray(res.data?.reviews) ? res.data.reviews : []);
        } catch {
            setFeedReviews([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchEntities = async () => {
        try {
            const [agRes, gRes] = await Promise.all([
                agencyApi.listPublicAgencies(),
                guideApi.getAllGuides('', 'freelance'),
            ]);
            setAgencies(Array.isArray(agRes.data?.agencies) ? agRes.data.agencies : []);
            const nextGuides = Array.isArray(gRes.data)
                ? gRes.data.map((g: any) => ({
                    id: g.id,
                    name: `${g.firstName || ''} ${g.lastName || ''}`.trim() || 'Guide',
                }))
                : [];
            setGuides(nextGuides);
        } catch {
            setAgencies([]);
            setGuides([]);
        }
    };

    useEffect(() => {
        fetchFeed();
    }, [typeFilter]);

    useEffect(() => {
        fetchEntities();
    }, []);

    // Filter reviews based on search, date, and type
    const filteredReviews = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        const now = Date.now();
        return feedReviews.filter((review: any) => {
            const targetName = `${review.targetName || ''}`.toLowerCase();
            const authorName = `${review.author?.firstName || ''} ${review.author?.lastName || ''}`.trim().toLowerCase();
            const matchesSearch = q === '' || targetName.includes(q) || authorName.includes(q);

            let matchesDate = true;
            const createdAtTs = review.createdAt ? new Date(review.createdAt).getTime() : 0;
            if (dateFilter === 'week') matchesDate = now - createdAtTs <= 7 * 24 * 60 * 60 * 1000;
            if (dateFilter === 'month') matchesDate = now - createdAtTs <= 30 * 24 * 60 * 60 * 1000;
            if (dateFilter === 'year') matchesDate = now - createdAtTs <= 365 * 24 * 60 * 60 * 1000;

            return matchesSearch && matchesDate;
        });
    }, [feedReviews, searchQuery, dateFilter]);

    // Publish new post
    const handlePublish = async () => {
        if (!newPost.targetId || !newPost.comment.trim()) return;
        try {
            await reviewsApi.createReview({
                targetType: newPost.type,
                targetId: newPost.targetId,
                rating: newPost.rating,
                comment: newPost.comment.trim(),
            });
            setPublishModal(false);
            setShowEntitySelector(false);
            setNewPost({ type: 'AGENCE', targetId: '', targetName: '', rating: 5, comment: '' });
            fetchFeed();
        } catch {
            // ignore
        }
    };

    const handleShare = (reviewId: number) => {
        setShareModal(true);
    };

    const onChangeDate = (event: DateTimePickerEvent, date?: Date) => {
        const currentDate = date || new Date();
        setSelectedDate(currentDate);
        setShowDatePicker(false);
        // Here you could add logic to filter by specific date if needed
    };

    const renderReviewCard = ({ item: review }: { item: any }) => (
        <View style={[styles.reviewCard, { backgroundColor: surfaceColor, borderColor: dividerColor }]}>
            <View style={styles.reviewHeaderRow}>
                <View style={styles.reviewHeaderLeft}>
                    <Image
                        source={
                            review.author?.photo
                                ? { uri: review.author.photo.startsWith('http') ? review.author.photo : `http://192.168.1.14:3001${review.author.photo}` }
                                : require('../../../../assets/images/user1.jpg')
                        }
                        style={[styles.reviewAvatar, { borderColor: dividerColor }]}
                    />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.reviewAuthor, { color: textColor }]} numberOfLines={1}>
                            {`${review.author?.firstName || ''} ${review.author?.lastName || ''}`.trim() || 'Pèlerin'}
                        </Text>
                        <Text style={[styles.reviewMeta, { color: textSecondaryColor }]} numberOfLines={1}>
                            {review.targetName || ''}
                        </Text>
                    </View>
                </View>
                <View style={styles.reviewStarsRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                        <FontAwesome5
                            key={s}
                            name="star"
                            size={14}
                            color={s <= (review.rating || 0) ? (isDarkMode ? colors.accent : COLORS.accent) : dividerColor}
                            solid={s <= (review.rating || 0)}
                        />
                    ))}
                </View>
            </View>
            <Text style={[styles.reviewText, { color: textColor }]}>{review.comment}</Text>
            <View style={styles.reviewFooterRow}>
                <Text style={[styles.reviewDateText, { color: textSecondaryColor }]}>
                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                </Text>
                <TouchableOpacity onPress={() => handleShare(0)}>
                    <FontAwesome5 name="share" size={14} color={textSecondaryColor} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={backgroundColor} />

            {/* Explorer Umrah Style Header */}
            <View style={[styles.header, { backgroundColor, borderBottomColor: dividerColor }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={isDarkMode ? "#fff" : "#1C1C1E"} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <Text style={[styles.headerTitle, { color: isDarkMode ? "#fff" : "#1C1C1E" }]}>Avis & Témoignages</Text>
                </View>
                {/* Spacer to keep title centered */}
                <View style={{ width: 40 }} />
            </View>

            {/* Content */}
            <View style={[styles.content, { backgroundColor: contentBackgroundColor }]}>
                <FlatList
                    data={filteredReviews}
                    keyExtractor={(item) => `${item.id}`}
                    renderItem={renderReviewCard}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={
                        <View style={styles.headerSectionContainer}>
                            {/* Filters Section (Tout | Agences | Guides | Date) */}
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.quickSelectors}
                                contentContainerStyle={styles.quickSelectorsContent}
                            >
                                <TouchableOpacity
                                    style={[
                                        styles.quickBubble,
                                        { backgroundColor: typeFilter === 'ALL' ? COLORS.primaryGreen : surfaceColor, borderColor: dividerColor }
                                    ]}
                                    onPress={() => setTypeFilter('ALL')}
                                >
                                    <Text style={[styles.quickBubbleText, { color: typeFilter === 'ALL' ? '#FFF' : textColor }]}>Tout</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.quickBubble,
                                        { backgroundColor: typeFilter === 'AGENCE' ? COLORS.primaryGreen : surfaceColor, borderColor: dividerColor }
                                    ]}
                                    onPress={() => setTypeFilter('AGENCE')}
                                >
                                    <Text style={[styles.quickBubbleText, { color: typeFilter === 'AGENCE' ? '#FFF' : textColor }]}>Agences</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.quickBubble,
                                        { backgroundColor: typeFilter === 'GUIDE' ? COLORS.primaryGreen : surfaceColor, borderColor: dividerColor }
                                    ]}
                                    onPress={() => setTypeFilter('GUIDE')}
                                >
                                    <Text style={[styles.quickBubbleText, { color: typeFilter === 'GUIDE' ? '#FFF' : textColor }]}>Guides Privés</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.quickBubble, { backgroundColor: surfaceColor, borderColor: dividerColor }]}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Ionicons name="calendar-outline" size={18} color={COLORS.primaryGreen} />
                                    <Text style={[styles.quickBubbleText, { color: textColor }]}>
                                        {new Date().toLocaleDateString()}
                                    </Text>
                                </TouchableOpacity>
                            </ScrollView>

                            {/* Search Bar - Below Filters */}
                            <View style={[styles.searchContainer, { backgroundColor: surfaceColor, borderColor: dividerColor }]}>
                                <Ionicons name="search-outline" size={20} color={textSecondaryColor} />
                                <TextInput
                                    placeholder="Rechercher un avis..."
                                    placeholderTextColor={textSecondaryColor}
                                    style={[styles.searchInput, { color: textColor }]}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                                {searchQuery !== '' && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <Ionicons name="close-circle" size={18} color={textSecondaryColor} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Create Post Section - After Search Bar */}
                            <TouchableOpacity
                                style={[styles.createPostSection, { backgroundColor: surfaceColor, borderColor: dividerColor }]}
                                onPress={() => setPublishModal(true)}
                                activeOpacity={0.7}
                            >
                                <Image
                                    source={
                                        userProfile?.photo
                                            ? { uri: userProfile.photo.startsWith('http') ? userProfile.photo : `http://192.168.1.14:3001${userProfile.photo}` }
                                            : require('../../../../assets/images/user1.jpg')
                                    }
                                    style={[styles.createPostAvatar, { borderColor: dividerColor }]}
                                />
                                <View style={[styles.createPostInput, { backgroundColor: inputBgColor, borderColor: dividerColor }]}>
                                    <Text style={[styles.createPostPlaceholder, { color: textSecondaryColor }]}>
                                        Partager votre expérience...
                                    </Text>
                                </View>
                                <Ionicons name="create-outline" size={22} color={COLORS.primaryGreen} />
                            </TouchableOpacity>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={new Date()}
                                    mode="date"
                                    display="default"
                                    onChange={onChangeDate}
                                />
                            )}

                            {/* Reviews count */}
                            <View style={styles.reviewsCountRow}>
                                <Text style={[styles.reviewsCountText, { color: textColor }]}>
                                    {filteredReviews.length} Avis
                                </Text>
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <FontAwesome5 name="search" size={40} color={dividerColor} />
                            <Text style={[styles.emptyText, { color: textSecondaryColor }]}>{loading ? 'Chargement...' : 'Aucun avis trouvé'}</Text>
                        </View>
                    }
                />
            </View>

            {/* Publish Modal */}
            <Modal
                visible={publishModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setPublishModal(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                    <View style={[styles.publishModal, { backgroundColor: surfaceColor }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: dividerColor }]}>
                            <Text style={[styles.modalTitle, { color: textColor }]}>Publier un avis</Text>
                            <TouchableOpacity onPress={() => setPublishModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.primaryGreen} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent}>
                            {/* Entity Type Selection */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: textColor }]}>Type d'avis</Text>
                                <View style={styles.radioGroup}>
                                    <TouchableOpacity
                                        style={[
                                            styles.radioButton,
                                            { backgroundColor: inputBgColor, borderColor: dividerColor },
                                            newPost.type === 'AGENCE' && [styles.radioButtonActive, { backgroundColor: isDarkMode ? '#1a2a1a' : '#E8F5E9', borderColor: isDarkMode ? colors.accent : COLORS.primaryGreen }]
                                        ]}
                                        onPress={() => {
                                            setNewPost({ ...newPost, type: 'AGENCE', targetId: '', targetName: '' });
                                            setShowEntitySelector(false);
                                        }}
                                    >
                                        <Text style={[styles.radioButtonText, { color: textSecondaryColor }, newPost.type === 'AGENCE' && { color: isDarkMode ? colors.accent : COLORS.primaryGreen }]}>Agence</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.radioButton,
                                            { backgroundColor: inputBgColor, borderColor: dividerColor },
                                            newPost.type === 'GUIDE' && [styles.radioButtonActive, { backgroundColor: isDarkMode ? '#1a2a1a' : '#E8F5E9', borderColor: isDarkMode ? colors.accent : COLORS.primaryGreen }]
                                        ]}
                                        onPress={() => {
                                            setNewPost({ ...newPost, type: 'GUIDE', targetId: '', targetName: '' });
                                            setShowEntitySelector(false);
                                        }}
                                    >
                                        <Text style={[styles.radioButtonText, { color: textSecondaryColor }, newPost.type === 'GUIDE' && { color: isDarkMode ? colors.accent : COLORS.primaryGreen }]}>Guide Privé</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Entity Name Selection */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: textColor }]}>{newPost.type === 'AGENCE' ? 'Choisir une agence' : 'Choisir un guide'}</Text>
                                <TouchableOpacity
                                    style={[styles.input, { backgroundColor: inputBgColor, borderColor: dividerColor, justifyContent: 'center' }]}
                                    onPress={() => setShowEntitySelector(!showEntitySelector)}
                                >
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={{ color: newPost.targetName ? textColor : textSecondaryColor }}>
                                            {newPost.targetName || (newPost.type === 'AGENCE' ? "Sélectionner une agence" : "Sélectionner un guide")}
                                        </Text>
                                        <FontAwesome5 name={showEntitySelector ? "chevron-up" : "chevron-down"} size={14} color={textSecondaryColor} />
                                    </View>
                                </TouchableOpacity>

                                {showEntitySelector && (
                                    <View style={[styles.selectorDropdown, { backgroundColor: inputBgColor, borderColor: dividerColor }]}>
                                        <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 200 }}>
                                            {(newPost.type === 'AGENCE' ? agencies : guides).map((item: any) => (
                                                <TouchableOpacity
                                                    key={item.id}
                                                    style={[styles.selectorItem, { borderBottomColor: dividerColor }]}
                                                    onPress={() => {
                                                        setNewPost({ ...newPost, targetId: item.id, targetName: item.name });
                                                        setShowEntitySelector(false);
                                                    }}
                                                >
                                                    <Text style={[styles.selectorItemText, { color: textColor }]}>{item.name}</Text>
                                                    {newPost.targetId === item.id && (
                                                        <FontAwesome5 name="check" size={12} color={isDarkMode ? colors.accent : COLORS.primaryGreen} />
                                                    )}
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>

                            {/* Rating */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: textColor }]}>Note</Text>
                                <View style={styles.ratingInput}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <TouchableOpacity
                                            key={star}
                                            onPress={() => setNewPost({ ...newPost, rating: star })}
                                        >
                                            <Ionicons
                                                name={star <= newPost.rating ? "star" : "star-outline"}
                                                size={30}
                                                color={star <= newPost.rating ? COLORS.accent : (isDarkMode ? '#333' : '#E0E0E0')}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Comment */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: textColor }]}>Votre avis</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea, { backgroundColor: inputBgColor, borderColor: dividerColor, color: textColor }]}
                                    placeholder="Partagez votre expérience..."
                                    placeholderTextColor={textSecondaryColor}
                                    value={newPost.comment}
                                    onChangeText={(text) => setNewPost({ ...newPost, comment: text })}
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />
                            </View>

                            {/* Publish Button */}
                            <TouchableOpacity
                                style={[styles.publishButton, { backgroundColor: isDarkMode ? colors.accent : COLORS.primaryGreen }]}
                                onPress={handlePublish}
                            >
                                <Text style={[styles.publishButtonText, { color: isDarkMode ? '#121212' : 'white' }]}>Publier</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Share Modal */}
            <Modal
                visible={shareModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShareModal(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                    <View style={[styles.shareModal, { backgroundColor: surfaceColor }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: dividerColor }]}>
                            <Text style={[styles.modalTitle, { color: textColor }]}>Partager cet avis</Text>
                            <TouchableOpacity onPress={() => setShareModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.primaryGreen} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.shareOptions}>
                            <TouchableOpacity style={styles.shareOption}>
                                <Ionicons name="logo-facebook" size={28} color="#1877F2" />
                                <Text style={styles.shareOptionText}>Facebook</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.shareOption}>
                                <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
                                <Text style={styles.shareOptionText}>WhatsApp</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.shareOption}>
                                <Ionicons name="logo-twitter" size={28} color="#1DA1F2" />
                                <Text style={styles.shareOptionText}>Twitter</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.shareOption}>
                                <Ionicons name="copy-outline" size={28} color={textSecondaryColor} />
                                <Text style={[styles.shareOptionText, { color: textColor }]}>Copier le lien</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
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
        textAlign: 'center',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerSectionContainer: {
        paddingTop: 10,
    },
    quickSelectors: {
        marginTop: 10,
        marginBottom: 10,
    },
    quickSelectorsContent: {
        paddingHorizontal: 20,
        gap: 10,
    },
    quickBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        gap: 6,
    },
    quickBubbleText: {
        fontSize: 14,
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === 'ios' ? 12 : 8,
        borderRadius: 15,
        borderWidth: 1,
        marginHorizontal: 20,
        marginBottom: 16,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        paddingVertical: 0,
    },
    listContent: {
        paddingBottom: 20,
    },
    reviewsCountRow: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    reviewsCountText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    createPostSection: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 15,
        borderWidth: 1,
    },
    createPostAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 1,
        marginRight: 12,
    },
    createPostInput: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        marginRight: 10,
    },
    createPostPlaceholder: {
        fontSize: 14,
    },
    reviewCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        marginHorizontal: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    reviewHeader: {
        flexDirection: 'row',
        marginBottom: 12,
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
        flex: 1,
        paddingRight: 10,
    },
    reviewAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        marginRight: 10,
        borderWidth: 1,
    },
    reviewAuthor: {
        fontSize: 14,
        fontWeight: '700',
    },
    reviewMeta: {
        fontSize: 12,
        marginTop: 2,
    },
    cardAccent: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: COLORS.primaryGreen,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    avatarContainer: {
        position: 'relative',
    },
    userProfileImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
        borderWidth: 1,
        borderColor: COLORS.divider,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 12,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.success,
        borderWidth: 2,
        borderColor: '#fff',
    },
    reviewerInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    reviewerName: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
    },
    agencyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 2,
    },
    agencyName: {
        fontSize: 12,
        color: COLORS.primaryGreen,
        fontWeight: '600',
    },
    reviewDate: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF9E7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        gap: 4,
        height: 28,
    },
    reviewStarsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    ratingBadgeText: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.accent,
    },
    reviewText: {
        fontSize: 14,
        lineHeight: 20,
        marginTop: 2,
        marginBottom: 12,
    },
    reviewFooterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 10,
    },
    reviewDateText: {
        fontSize: 12,
    },
    reviewComment: {
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
        marginBottom: 15,
    },
    reactionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 12,
        marginTop: 5,
    },
    reactionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        padding: 4,
    },
    reactionButtonActive: {
        // backgroundColor: '#FFF0F0',
    },
    reactionCount: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.primaryGreen,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    publishModal: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '85%',
    },
    shareModal: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    modalContent: {
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        height: 50,
    },
    selectorDropdown: {
        borderWidth: 1,
        borderRadius: 8,
        marginTop: 5,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    selectorItem: {
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    selectorItemText: {
        fontSize: 14,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    radioGroup: {
        flexDirection: 'row',
        gap: 15,
    },
    radioButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#eee',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    radioButtonActive: {
        backgroundColor: '#E8F5E9',
        borderColor: COLORS.primaryGreen,
    },
    radioButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    radioButtonTextActive: {
        color: COLORS.primaryGreen,
    },
    ratingInput: {
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'center',
        paddingVertical: 10,
    },
    publishButton: {
        backgroundColor: COLORS.primaryGreen,
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    publishButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    shareOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
        justifyContent: 'center',
        paddingVertical: 10,
    },
    shareOption: {
        alignItems: 'center',
        gap: 8,
        minWidth: 70,
    },
    shareOptionText: {
        fontSize: 12,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        marginTop: 10,
        color: COLORS.lightText,
        fontSize: 14,
    },
});
