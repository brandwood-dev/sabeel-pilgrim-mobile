import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    SectionList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    RefreshControl,
    DeviceEventEmitter,
} from 'react-native';
import BottomNavigation from './bottom_navigation';
import { notificationsApi } from '@/services/api';

export default function AccompagnantNotificationsScreen() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [items, setItems] = useState<any[]>([]);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await notificationsApi.listMine({ limit: 100, offset: 0 });
            const list = Array.isArray(res?.data?.items)
                ? res.data.items
                : (Array.isArray(res?.data) ? res.data : []);
            setItems(list);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        const sub = DeviceEventEmitter.addListener('app:new_notification', () => {
            fetchNotifications();
        });
        return () => {
            sub.remove();
        };
    }, [fetchNotifications]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await fetchNotifications();
        } finally {
            setRefreshing(false);
        }
    }, [fetchNotifications]);

    const sections = useMemo(() => {
        const now = new Date();
        const isSameDay = (a: Date, b: Date) =>
            a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

        const today: any[] = [];
        const earlier: any[] = [];

        for (const n of items || []) {
            const createdAt = n?.createdAt ? new Date(n.createdAt) : null;
            if (createdAt && isSameDay(createdAt, now)) today.push(n);
            else earlier.push(n);
        }

        const out: Array<{ title: string; data: any[] }> = [];
        if (today.length) out.push({ title: "Aujourd'hui", data: today });
        if (earlier.length) out.push({ title: 'Plus tôt', data: earlier });
        return out;
    }, [items]);

    const toTime = (iso?: any) => {
        try {
            const d = iso ? new Date(iso) : null;
            if (!d || Number.isNaN(d.getTime())) return '';
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    const renderItem = ({ item }: any) => {
        const type = String(item?.data?.type || '').toLowerCase();
        const urgent = type === 'sos' || type === 'sos_alert';
        const read = !!item?.readAt;
        const time = toTime(item?.createdAt);

        const lat = item?.data?.location?.latitude ?? item?.data?.latitude;
        const lng = item?.data?.location?.longitude ?? item?.data?.longitude;
        const focusLat = lat !== undefined && lat !== null ? Number(lat) : NaN;
        const focusLng = lng !== undefined && lng !== null ? Number(lng) : NaN;

        return (
            <TouchableOpacity
            style={[styles.notifCard, !read && styles.unreadCard]}
            onPress={() => {
                if (urgent) {
                    if (Number.isFinite(focusLat) && Number.isFinite(focusLng)) {
                        router.push({
                            pathname: '/(accampagnant)/map_tracking',
                            params: {
                                focusLat: String(focusLat),
                                focusLng: String(focusLng),
                                focusPilgrimId: item?.data?.pilgrim?.id ? String(item.data.pilgrim.id) : '',
                            },
                        } as any);
                    } else {
                        router.push('/(accampagnant)/map_tracking');
                    }
                }
            }}
            activeOpacity={0.7}
        >
            <View style={[
                styles.iconWrapper,
                { backgroundColor: urgent ? '#FEE2E2' : (type === 'location' ? '#E0F2F1' : '#FFF8E1') }
            ]}>
                <MaterialCommunityIcons
                    name={urgent ? 'alert-octagon' : (type === 'location' ? 'map-marker-radius' : 'bell')}
                    size={22}
                    color={urgent ? '#DC2626' : (type === 'location' ? '#2C5F2D' : '#F59E0B')}
                />
            </View>
            <View style={styles.notifContent}>
                <View style={styles.notifHeader}>
                    <Text style={[styles.notifTitle, urgent && styles.urgentText]}>{String(item?.title || 'Notification')}</Text>
                    <View style={styles.timeRow}>
                        <Text style={styles.notifTime}>{time}</Text>
                        {!read && <View style={styles.unreadDot} />}
                    </View>
                </View>
                <Text style={styles.notifMessage} numberOfLines={2}>{String(item?.body || '')}</Text>
                {urgent && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                            if (item?.id) {
                                notificationsApi.markRead(String(item.id)).finally(() => fetchNotifications());
                            }
                            router.push('/(accampagnant)/map_tracking');
                        }}
                    >
                        <Text style={styles.actionButtonText}>Intervenir Immédiatement</Text>
                        <Ionicons name="chevron-forward" size={14} color="#fff" />
                    </TouchableOpacity>
                )}
            </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Centre d'Alertes</Text>
                    <Text style={styles.headerSubtitle}>Supervision en temps réel</Text>
                </View>
                <TouchableOpacity
                    style={styles.clearButton}
                    activeOpacity={0.6}
                    onPress={async () => {
                        try {
                            await notificationsApi.markAllRead();
                        } catch {
                            // ignore
                        }
                        fetchNotifications();
                    }}
                >
                    <Ionicons name="checkmark-done" size={24} color="#2C5F2D" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color="#2C5F2D" />
                </View>
            ) : (
            <SectionList
                sections={sections}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                renderSectionHeader={({ section: { title } }) => (
                    <Text style={styles.sectionHeader}>{title}</Text>
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                stickySectionHeadersEnabled={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="notifications-off-outline" size={60} color="#E5E7EB" />
                        </View>
                        <Text style={styles.emptyTitle}>Tout est calme</Text>
                        <Text style={styles.emptyDesc}>Vous n'avez aucune nouvelle alerte pour le moment.</Text>
                    </View>
                }
            />
            )}

            <BottomNavigation activeTab="Alertes" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
        marginTop: 2,
    },
    clearButton: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '800',
        color: '#9CA3AF',
        marginTop: 24,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 120,
    },
    notifCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 16,
        marginBottom: 12,
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    unreadCard: {
        backgroundColor: '#FBFCFD',
        borderColor: '#EBF2FF',
        borderLeftWidth: 4,
        borderLeftColor: '#2C5F2D',
    },
    iconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    notifContent: {
        flex: 1,
    },
    notifHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    notifTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1F2937',
    },
    urgentText: {
        color: '#DC2626',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    notifTime: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    unreadDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#2C5F2D',
    },
    notifMessage: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
        fontWeight: '500',
    },
    actionButton: {
        backgroundColor: '#DC2626',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginTop: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-start',
        elevation: 4,
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyContainer: {
        marginTop: 80,
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#374151',
        marginBottom: 8,
    },
    emptyDesc: {
        color: '#9CA3AF',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
});
