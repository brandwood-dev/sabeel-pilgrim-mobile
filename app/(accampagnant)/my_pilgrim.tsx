import { authApi } from '@/services/api';
import { getUserAvatarUrl } from '@/services/media';
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
    Image,
    ScrollView,
    RefreshControl,
} from 'react-native';
import { useSelector } from 'react-redux';

export default function MyPilgrimScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<any>(null);

    const backgroundColor = isDarkMode ? '#111111' : '#FFFFFF';
    const surfaceColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
    const textColor = isDarkMode ? '#FFFFFF' : '#111827';
    const textSecondaryColor = isDarkMode ? '#8A8A8E' : '#6B7280';
    const dividerColor = isDarkMode ? '#2C2C2E' : '#F3F4F6';

    const fetchData = useCallback(async () => {
        try {
            const response = await authApi.getMyAccompaniedPilgrim();
            setData(response.data);
        } finally {
            setLoading(false);
        }
    }, []);

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

    const pilgrim = data?.pilgrim;

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
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <Ionicons name="arrow-back" size={22} color={textColor} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: textColor }]}>Mon pèlerin</Text>
                <View style={styles.headerBtn} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {!pilgrim ? (
                    <View style={[styles.emptyCard, { backgroundColor: surfaceColor, borderColor: dividerColor }]}>
                        <Ionicons name="link-outline" size={36} color={colors.primary} />
                        <Text style={[styles.emptyTitle, { color: textColor }]}>Aucun pèlerin lié</Text>
                        <Text style={[styles.emptyText, { color: textSecondaryColor }]}>Veuillez lier un pèlerin via l'ID ou le QR Code.</Text>
                    </View>
                ) : (
                    <View style={[styles.card, { backgroundColor: surfaceColor, borderColor: dividerColor }]}>
                        <View style={styles.pilgrimRow}>
                            <Image
                                source={{ uri: getUserAvatarUrl(pilgrim?.photo) || `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(String(pilgrim?.firstName || 'P'))}+${encodeURIComponent(String(pilgrim?.lastName || ''))}&backgroundColor=2C5F2D&textColor=ffffff` }}
                                style={styles.avatar}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.name, { color: textColor }]}>{String(`${pilgrim?.firstName || ''} ${pilgrim?.lastName || ''}`).trim() || 'Pèlerin'}</Text>
                                <Text style={[styles.sub, { color: textSecondaryColor }]}>{pilgrim?.uniqueIdentifier ? String(pilgrim.uniqueIdentifier) : ''}</Text>
                            </View>
                        </View>

                        <View style={[styles.infoRow, { borderTopColor: dividerColor }]}
                        >
                            <Text style={[styles.label, { color: textSecondaryColor }]}>Partage localisation</Text>
                            <Text style={[styles.value, { color: textColor }]}>{pilgrim?.shareLocation ? 'Activé' : 'Désactivé'}</Text>
                        </View>
                        <View style={[styles.infoRow, { borderTopColor: dividerColor }]}
                        >
                            <Text style={[styles.label, { color: textSecondaryColor }]}>Groupe</Text>
                            <Text style={[styles.value, { color: textColor }]}>{data?.group?.name ? String(data.group.name) : '—'}</Text>
                        </View>

                        <View style={styles.ctaRow}>
                            <TouchableOpacity
                                style={[styles.cta, { backgroundColor: colors.primary, flex: 1 }]}
                                onPress={() => router.push('/(accampagnant)/map_tracking')}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="map-outline" size={18} color="#fff" />
                                <Text style={styles.ctaText}>Position</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.cta, { backgroundColor: colors.secondary, flex: 1 }]}
                                onPress={() => {
                                    router.push({
                                        pathname: '/(accampagnant)/chat_accompagnant' as any,
                                        params: {
                                            targetId: pilgrim.id,
                                            targetType: 'pelerin',
                                            contactName: `${pilgrim.firstName || ''} ${pilgrim.lastName || ''}`.trim(),
                                            contactImage: pilgrim.photo || '',
                                        }
                                    });
                                }}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
                                <Text style={styles.ctaText}>Message</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Carte Agence */}
                {data?.agency && (
                    <View style={[styles.card, { backgroundColor: surfaceColor, borderColor: dividerColor, marginTop: 16 }]}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="business-outline" size={20} color={colors.primary} />
                            <Text style={[styles.sectionTitle, { color: textColor }]}>Agence</Text>
                        </View>
                        
                        <View style={styles.entityRow}>
                            <View style={styles.entityInfo}>
                                <Text style={[styles.entityName, { color: textColor }]}>{String(data.agency.name || '').trim()}</Text>
                                <Text style={[styles.entitySub, { color: textSecondaryColor }]}>
                                    {data.agency.licenseNumber ? `Licence: ${data.agency.licenseNumber}` : 'Aucune licence'}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.viewBtn, { borderColor: colors.primary }]}
                                onPress={() => router.push('/(accampagnant)/pilgrim_agency')}
                            >
                                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Carte Guide */}
                {data?.guide && (
                    <View style={[styles.card, { backgroundColor: surfaceColor, borderColor: dividerColor, marginTop: 16 }]}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="person-outline" size={20} color={colors.primary} />
                            <Text style={[styles.sectionTitle, { color: textColor }]}>Guide</Text>
                        </View>
                        
                        <View style={styles.entityRow}>
                            <View style={styles.entityInfo}>
                                <Text style={[styles.entityName, { color: textColor }]}>
                                    {String(`${data.guide.firstName || ''} ${data.guide.lastName || ''}`).trim()}
                                </Text>
                                <Text style={[styles.entitySub, { color: textSecondaryColor }]}>
                                    {data.guide.phoneNumber ? `📱 ${data.guide.phoneNumber}` : 'Aucun téléphone'}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.viewBtn, { borderColor: colors.primary }]}
                                onPress={() => router.push('/(accampagnant)/pilgrim_guide')}
                            >
                                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
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
    pilgrimRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E5E7EB' },
    name: { fontSize: 16, fontWeight: '800' },
    sub: { marginTop: 2, fontSize: 12, fontWeight: '600' },
    infoRow: {
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    label: { fontSize: 12, fontWeight: '700' },
    value: { fontSize: 12, fontWeight: '700' },
    ctaRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 18,
    },
    cta: {
        height: 48,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    ctaText: { color: '#fff', fontSize: 14, fontWeight: '800' },
    emptyCard: {
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        alignItems: 'center',
        gap: 10,
    },
    emptyTitle: { fontSize: 16, fontWeight: '800' },
    emptyText: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    entityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    entityInfo: {
        flex: 1,
    },
    entityName: {
        fontSize: 15,
        fontWeight: '700',
    },
    entitySub: {
        marginTop: 2,
        fontSize: 12,
        fontWeight: '500',
    },
    viewBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
