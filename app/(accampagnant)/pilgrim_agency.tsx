import { authApi, agencyApi } from '@/services/api';
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

export default function PilgrimAgencyScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [ctx, setCtx] = useState<any>(null);
    const [agencyDetails, setAgencyDetails] = useState<any>(null);

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

            const agencyId = payload?.agency?.id;
            if (agencyId) {
                try {
                    const agencyResponse = await agencyApi.getPublicAgencyById(String(agencyId));
                    setAgencyDetails(agencyResponse.data);
                } catch {
                    setAgencyDetails(null);
                }
            } else {
                setAgencyDetails(null);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Fonction pour retourner à la page profil
    const goToProfile = () => {
        router.push('/(accampagnant)/profile');
    };

    // Fonction pour appeler l'agence
    const callAgency = (phone: string) => {
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        }
    };

    // Fonction pour envoyer un email à l'agence
    const emailAgency = (email: string) => {
        if (email) {
            Linking.openURL(`mailto:${email}`);
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

    const agency = ctx?.agency || null;

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
                <Text style={[styles.headerTitle, { color: textColor }]}>Agence du pèlerin</Text>
                <View style={styles.headerBtn} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {!agency ? (
                    <View style={[styles.emptyCard, { backgroundColor: surfaceColor, borderColor: dividerColor }]}>
                        <Ionicons name="business-outline" size={36} color={colors.primary} />
                        <Text style={[styles.emptyTitle, { color: textColor }]}>Aucune agence</Text>
                        <Text style={[styles.emptyText, { color: textSecondaryColor }]}>Aucune agence n'est associée au pèlerin lié.</Text>
                    </View>
                ) : (
                    <View style={[styles.card, { backgroundColor: surfaceColor, borderColor: dividerColor }]}>
                        {/* Header avec photo et nom */}
                        <View style={styles.headerSection}>
                            <View style={styles.avatarContainer}>
                                <Image
                                    source={
                                        agency?.logo
                                            ? { uri: agency.logo }
                                            : require('../../assets/images/agence.jpg')
                                    }
                                    style={styles.avatar}
                                />
                            </View>
                            <View style={styles.titleContainer}>
                                <Text style={[styles.title, { color: textColor }]} numberOfLines={2}>
                                    {String(agency?.agencyName || agency?.fullName || agency?.name || 'Agence')}
                                </Text>
                                {agency?.licenseNumber && (
                                    <Text style={[styles.subtitle, { color: textSecondaryColor }]}>
                                        Licence: {agency.licenseNumber}
                                    </Text>
                                )}
                            </View>
                        </View>

                        {/* Informations de contact */}
                        <View style={[styles.contactSection, { borderTopColor: dividerColor }]}>
                            <Text style={[styles.sectionTitle, { color: textColor }]}>Contact</Text>
                            
                            {agency?.phone && (
                                <TouchableOpacity 
                                    style={[styles.contactRow, { borderBottomColor: dividerColor }]}
                                    onPress={() => callAgency(agency.phone)}
                                >
                                    <View style={styles.contactInfo}>
                                        <Ionicons name="call" size={16} color={colors.primary} />
                                        <Text style={[styles.contactText, { color: textColor }]}>
                                            {agency.phone}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color={textSecondaryColor} />
                                </TouchableOpacity>
                            )}

                            {agency?.email && (
                                <TouchableOpacity 
                                    style={[styles.contactRow, { borderBottomColor: dividerColor }]}
                                    onPress={() => emailAgency(agency.email)}
                                >
                                    <View style={styles.contactInfo}>
                                        <Ionicons name="mail" size={16} color={colors.primary} />
                                        <Text style={[styles.contactText, { color: textColor }]}>
                                            {agency.email}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color={textSecondaryColor} />
                                </TouchableOpacity>
                            )}

                             <View style={[styles.contactRow, { borderBottomColor: dividerColor }]}>
                                 <View style={styles.contactInfo}>
                                     <Ionicons name="business-outline" size={16} color={colors.primary} />
                                     <Text style={[styles.contactText, { color: textColor }]}>
                                         Numéro d'agence: {agency?.agencyCode || '—'}
                                     </Text>
                                 </View>
                             </View>

                            <TouchableOpacity 
                                style={[styles.contactRow, { borderBottomColor: dividerColor }]}
                                onPress={() => {
                                    router.push({
                                        pathname: '/(accampagnant)/chat_accompagnant' as any,
                                        params: {
                                            targetId: agency.id,
                                            targetType: 'agence',
                                            contactName: agency.agencyName || agency.fullName || 'Agence',
                                            contactImage: agency.logo || '',
                                        }
                                    });
                                }}
                            >
                                <View style={styles.contactInfo}>
                                    <Ionicons name="chatbubble-ellipses" size={16} color={colors.primary} />
                                    <Text style={[styles.contactText, { color: textColor }]}>
                                        Envoyer un message
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={textSecondaryColor} />
                            </TouchableOpacity>
                        </View>

                        {/* Description et détails */}
                        {(agencyDetails?.description || agencyDetails?.bio || agency?.address) && (
                            <View style={[styles.detailsSection, { borderTopColor: dividerColor }]}>
                                <Text style={[styles.sectionTitle, { color: textColor }]}>À propos</Text>
                                
                                {agencyDetails?.description || agencyDetails?.bio ? (
                                    <Text style={[styles.descriptionText, { color: textSecondaryColor }]}>
                                        {String(agencyDetails?.description || agencyDetails?.bio || '').trim()}
                                    </Text>
                                ) : null}

                                {agencyDetails?.address && (
                                    <View style={styles.addressRow}>
                                        <Ionicons name="location" size={16} color={colors.primary} />
                                        <Text style={[styles.addressText, { color: textSecondaryColor }]}>
                                            {agencyDetails.address}
                                        </Text>
                                    </View>
                                )}

                                {agencyDetails?.website && (
                                    <TouchableOpacity 
                                        style={styles.websiteRow}
                                        onPress={() => Linking.openURL(agencyDetails.website)}
                                    >
                                        <Ionicons name="globe" size={16} color={colors.primary} />
                                        <Text style={[styles.websiteText, { color: colors.primary }]}>
                                            Site web
                                        </Text>
                                        <Ionicons name="open-outline" size={14} color={colors.primary} />
                                    </TouchableOpacity>
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
    contactSection: {
        paddingTop: 16,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 12,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    contactInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    contactText: {
        fontSize: 14,
        fontWeight: '600',
    },
    detailsSection: {
        paddingTop: 16,
        marginTop: 4,
    },
    descriptionText: {
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 20,
        marginBottom: 16,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    addressText: {
        fontSize: 13,
        fontWeight: '500',
        flex: 1,
    },
    websiteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-start',
    },
    websiteText: {
        fontSize: 13,
        fontWeight: '600',
    },
});
