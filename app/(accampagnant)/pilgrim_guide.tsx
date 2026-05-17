import { authApi, guideApi } from '@/services/api';
import { useThemeColors } from '@/hooks/useThemeColors';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
    RefreshControl,
    Image,
    Linking,
} from 'react-native';
import { useSelector } from 'react-redux';

export default function PilgrimGuideScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [ctx, setCtx] = useState<any>(null);
    const [guideDetails, setGuideDetails] = useState<any>(null);

    const backgroundColor = isDarkMode ? '#111111' : '#FFFFFF';
    const surfaceColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
    const textColor = isDarkMode ? '#FFFFFF' : '#111827';
    const textSecondaryColor = isDarkMode ? '#8A8A8E' : '#6B7280';
    const dividerColor = isDarkMode ? '#2C2C2E' : '#F3F4F6';

    const fetchData = useCallback(async () => {
        try {
            const response = await authApi.getMyAccompaniedPilgrim();
            const payload = response.data;
            setCtx(payload);

            const guideId = payload?.guide?.id;
            if (guideId) {
                try {
                    const guideResponse = await guideApi.getGuideById(String(guideId));
                    setGuideDetails(guideResponse.data);
                } catch {
                    setGuideDetails(null);
                }
            } else {
                setGuideDetails(null);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Fonction pour retourner à la page profil
    const goToProfile = () => {
        router.push('/(accampagnant)/profile');
    };

    // Fonction pour appeler le guide
    const callGuide = (phone: string) => {
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        }
    };

    // Fonction pour envoyer un email au guide
    const emailGuide = (email: string) => {
        if (email) {
            Linking.openURL(`mailto:${email}`);
        }
    };

    // Fonction pour envoyer un message WhatsApp
    const whatsappGuide = (phone: string) => {
        if (phone) {
            Linking.openURL(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`);
        }
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await fetchData();
        } finally {
            setRefreshing(false);
        }
    }, [fetchData]);

    const guide = ctx?.guide || null;

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor }]}>
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <View style={[styles.header, { borderBottomColor: dividerColor }]}
            >
                <TouchableOpacity onPress={goToProfile} style={styles.headerBtn}>
                    <Ionicons name="arrow-back" size={22} color={textColor} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: textColor }]}>Guide du pèlerin</Text>
                <View style={styles.headerBtn} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {!guide ? (
                    <View style={[styles.emptyCard, { backgroundColor: surfaceColor, borderColor: dividerColor }]}>
                        <Ionicons name="map-outline" size={36} color={colors.primary} />
                        <Text style={[styles.emptyTitle, { color: textColor }]}>Aucun guide</Text>
                        <Text style={[styles.emptyText, { color: textSecondaryColor }]}>Aucun guide n'est associé au pèlerin lié.</Text>
                    </View>
                ) : (
                    <View style={[styles.card, { backgroundColor: surfaceColor, borderColor: dividerColor }]}>
                        {/* Header avec photo et nom */}
                        <View style={styles.headerSection}>
                            <View style={styles.avatarContainer}>
                                <Image
                                    source={
                                        guide?.photo
                                            ? { uri: guide.photo }
                                            : require('../../assets/images/user2.jpg')
                                    }
                                    style={styles.avatar}
                                />
                            </View>
                            <View style={styles.titleContainer}>
                                <Text style={[styles.title, { color: textColor }]} numberOfLines={2}>
                                    {String(guide?.fullName || `${guide?.firstName || ''} ${guide?.lastName || ''}`).trim() || 'Guide'}
                                </Text>
                                {guide?.specialization && (
                                    <Text style={[styles.subtitle, { color: textSecondaryColor }]}>
                                        {guide.specialization}
                                    </Text>
                                )}
                            </View>
                        </View>

                        {/* Informations détaillées */}
                        <View style={[styles.detailsSection, { borderTopColor: dividerColor }]}>
                            <Text style={[styles.sectionTitle, { color: textColor }]}>Informations</Text>
                            
                            {guide?.phone && (
                                <View style={[styles.infoRow, { borderBottomColor: dividerColor }]}>
                                    <View style={styles.infoLeft}>
                                        <Ionicons name="call-outline" size={16} color={colors.primary} />
                                        <Text style={[styles.label, { color: textSecondaryColor }]}>Téléphone</Text>
                                    </View>
                                    <Text style={[styles.value, { color: textColor }]}>
                                        {guide.phone}
                                    </Text>
                                </View>
                            )}

                            {guide?.email && (
                                <View style={[styles.infoRow, { borderBottomColor: dividerColor }]}>
                                    <View style={styles.infoLeft}>
                                        <Ionicons name="mail-outline" size={16} color={colors.primary} />
                                        <Text style={[styles.label, { color: textSecondaryColor }]}>Email</Text>
                                    </View>
                                    <Text style={[styles.value, { color: textColor }]} numberOfLines={1}>
                                        {guide.email}
                                    </Text>
                                </View>
                            )}

                            {guide?.languages && (
                                <View style={[styles.infoRow, { borderBottomColor: dividerColor }]}>
                                    <View style={styles.infoLeft}>
                                        <Ionicons name="language-outline" size={16} color={colors.primary} />
                                        <Text style={[styles.label, { color: textSecondaryColor }]}>Langues</Text>
                                    </View>
                                    <Text style={[styles.value, { color: textColor }]}>
                                        {Array.isArray(guide.languages) ? guide.languages.join(', ') : guide.languages}
                                    </Text>
                                </View>
                            )}

                            <TouchableOpacity 
                                style={[styles.infoRow, { borderBottomColor: dividerColor }]}
                                onPress={() => {
                                    router.push({
                                        pathname: '/(accampagnant)/chat_accompagnant' as any,
                                        params: {
                                            targetId: guide.id,
                                            targetType: 'guide',
                                            contactName: guide.fullName || `${guide.firstName || ''} ${guide.lastName || ''}`.trim(),
                                            contactImage: guide.photo || '',
                                        }
                                    });
                                }}
                            >
                                <View style={styles.infoLeft}>
                                    <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.primary} />
                                    <Text style={[styles.label, { color: textSecondaryColor }]}>
                                        Envoyer un message
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={textSecondaryColor} />
                            </TouchableOpacity>
                        </View>

                        {/* Bio et expérience */}
                        {(guideDetails?.bio || guideDetails?.description || guideDetails?.experience) && (
                            <View style={[styles.bioSection, { borderTopColor: dividerColor }]}>
                                <Text style={[styles.sectionTitle, { color: textColor }]}>À propos</Text>
                                
                                {guideDetails?.bio || guideDetails?.description ? (
                                    <Text style={[styles.bioText, { color: textSecondaryColor }]}>
                                        {String(guideDetails?.bio || guideDetails?.description || '').trim()}
                                    </Text>
                                ) : null}

                                {guideDetails?.experience && (
                                    <View style={styles.experienceRow}>
                                        <Ionicons name="card-outline" size={16} color={colors.primary} />
                                        <Text style={[styles.experienceText, { color: textSecondaryColor }]}>
                                            {guideDetails.experience}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '800' },
    content: { padding: 16, paddingBottom: 40 },
    card: {
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
    },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    title: { flex: 1, fontSize: 16, fontWeight: '800' },
    infoRow: {
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
    },
    label: { fontSize: 12, fontWeight: '700' },
    value: { fontSize: 12, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
    moreBox: {
        marginTop: 18,
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
    },
    moreTitle: { fontSize: 13, fontWeight: '800', marginBottom: 8 },
    moreText: { fontSize: 12, fontWeight: '600', lineHeight: 18 },
    emptyCard: {
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        alignItems: 'center',
        gap: 10,
    },
    emptyTitle: { fontSize: 16, fontWeight: '800' },
    emptyText: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
    headerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 20,
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
        backgroundColor: '#F3F4F6',
    },
    avatar: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    titleContainer: {
        flex: 1,
    },
    subtitle: {
        marginTop: 4,
        fontSize: 12,
        fontWeight: '600',
    },
    actionsSection: {
        paddingTop: 16,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 12,
    },
    actionsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 12,
        minHeight: 44,
    },
    actionBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    detailsSection: {
        paddingTop: 16,
        marginTop: 4,
    },
    infoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    bioSection: {
        paddingTop: 16,
        marginTop: 4,
    },
    bioText: {
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 20,
        marginBottom: 16,
    },
    experienceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    experienceText: {
        fontSize: 13,
        fontWeight: '500',
        flex: 1,
    },
});
