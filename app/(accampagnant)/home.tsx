import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import BottomNavigation from './bottom_navigation';
import { authApi } from '@/services/api';
import { getUserAvatarUrl } from '@/services/media';

const { width } = Dimensions.get('window');

export default function AccompagnantHomeScreen() {
    const router = useRouter();

    const [pilgrimCtx, setPilgrimCtx] = useState<any>(null);

    const fetchPilgrimCtx = useCallback(async () => {
        try {
            const response = await authApi.getMyAccompaniedPilgrim();
            setPilgrimCtx(response.data);
        } catch {
            setPilgrimCtx(null);
        }
    }, []);

    useEffect(() => {
        fetchPilgrimCtx();
    }, [fetchPilgrimCtx]);

    const pilgrim = pilgrimCtx?.pilgrim;
    const pilgrimName = pilgrim ? String(`${pilgrim?.firstName || ''} ${pilgrim?.lastName || ''}`).trim() : '';
    const pilgrimIdentifier = pilgrim?.uniqueIdentifier ? String(pilgrim.uniqueIdentifier) : '';
    const pilgrimAvatarUrl = pilgrim?.photo ? getUserAvatarUrl(pilgrim.photo) : '';

    const stats = [
        { id: '1', title: 'Distance', value: '1.2 km', icon: 'walk', lib: 'material', color: '#4A7C59' },
        { id: '2', title: 'Batterie', value: '85%', icon: 'battery-80', lib: 'material', color: '#2C5F2D' },
        { id: '3', title: 'État', value: 'En marche', icon: 'heart-pulse', lib: 'material', color: '#B8860B' },
    ];

    const prayerTimes = [
        { name: 'Fajr', time: '05:12', active: false },
        { name: 'Dhuhr', time: '12:24', active: true },
        { name: 'Asr', time: '15:45', active: false },
        { name: 'Maghrib', time: '18:10', active: false },
        { name: 'Isha', time: '19:40', active: false },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>As-salaam alaykum,</Text>
                        <Text style={styles.subtitle}>Superviseur Sabeel</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.notifButton}
                        onPress={() => router.push('/(accampagnant)/notifications')}
                    >
                        <Ionicons name="notifications-outline" size={24} color="#2C5F2D" />
                        <View style={styles.badge} />
                    </TouchableOpacity>
                </View>

                {/* Verse of the Day / Spiritual Quote */}
                <TouchableOpacity style={styles.spiritualCard} activeOpacity={0.9}>
                    <LinearGradient
                        colors={['#fdfcf0', '#f8f7e5']}
                        style={styles.spiritualGradient}
                    >
                        <View style={styles.spiritualHeader}>
                            <MaterialCommunityIcons name="book-open-variant" size={20} color="#B8860B" />
                            <Text style={styles.spiritualTitle}>Invocation du jour</Text>
                        </View>
                        <Text style={styles.spiritualText}>
                            "Ô Seigneur, facilite ce voyage pour nos pèlerins et accepte leurs œuvres de piété."
                        </Text>
                        <View style={styles.spiritualFooter}>
                            <Text style={styles.spiritualRef}>Doua pour le voyage</Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Pilgrim Info Card Enhanced */}
                <Text style={styles.sectionTitle}>Votre Pèlerin</Text>
                <TouchableOpacity
                    activeOpacity={0.95}
                    onPress={() => router.push('/(accampagnant)/map_tracking')}
                >
                    <LinearGradient
                        colors={['#2C5F2D', '#4A7C59']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.pilgrimCard}
                    >
                        <View style={styles.pilgrimMainInfo}>
                            <View style={styles.avatarContainer}>
                                <Image
                                    source={
                                        pilgrimAvatarUrl
                                            ? { uri: pilgrimAvatarUrl }
                                            : require('../../assets/images/user2.jpg')
                                    }
                                    style={styles.pilgrimAvatar}
                                />
                                <View style={styles.onlineIndicator} />
                            </View>
                            <View style={styles.pilgrimDetails}>
                                <Text style={styles.pilgrimName}>{pilgrimName || 'Aucun pèlerin lié'}</Text>
                                <Text style={styles.pilgrimId}>{pilgrimIdentifier || ''}</Text>
                                <View style={styles.liveTag}>
                                    <View style={styles.liveDot} />
                                    <Text style={styles.liveLabel}>DIRECT</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.progressSection}>
                            <View style={styles.progressHeader}>
                                <Text style={styles.progressTitle}>Progression de l'Omra</Text>
                                <Text style={styles.progressValue}>70%</Text>
                            </View>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: '70%' }]} />
                            </View>
                            <Text style={styles.currentStep}>Étape actuelle : Tawaf al-Ifadah</Text>
                        </View>

                        <View style={styles.pilgrimCardFooter}>
                            <View style={styles.locationInfo}>
                                <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.locationText}>Près de la Station Al-Haram</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.trackButton}
                                onPress={() => router.push('/(accampagnant)/map_tracking')}
                            >
                                <Text style={styles.trackButtonText}>Localiser</Text>
                                <Ionicons name="chevron-forward" size={14} color="#2C5F2D" />
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Agency & Guide Section */}
                {(pilgrimCtx?.agency || pilgrimCtx?.guide) && (
                    <>
                        <Text style={styles.sectionTitle}>Services du Pèlerin</Text>
                        <View style={styles.servicesGrid}>
                            {pilgrimCtx?.agency && (
                                <TouchableOpacity
                                    style={styles.serviceCard}
                                    activeOpacity={0.9}
                                    onPress={() => router.push('/(accampagnant)/pilgrim_agency')}
                                >
                                    <View style={styles.serviceIcon}>
                                        <Ionicons name="business" size={20} color="#2C5F2D" />
                                    </View>
                                    <Text style={styles.serviceTitle}>Agence</Text>
                                    <Text style={styles.serviceName} numberOfLines={1}>
                                        {String(pilgrimCtx.agency.name || '').trim()}
                                    </Text>
                                    <View style={styles.serviceArrow}>
                                        <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
                                    </View>
                                </TouchableOpacity>
                            )}
                            
                            {pilgrimCtx?.guide && (
                                <TouchableOpacity
                                    style={styles.serviceCard}
                                    activeOpacity={0.9}
                                    onPress={() => router.push('/(accampagnant)/pilgrim_guide')}
                                >
                                    <View style={styles.serviceIcon}>
                                        <Ionicons name="person" size={20} color="#B8860B" />
                                    </View>
                                    <Text style={styles.serviceTitle}>Guide</Text>
                                    <Text style={styles.serviceName} numberOfLines={1}>
                                        {String(`${pilgrimCtx.guide.firstName || ''} ${pilgrimCtx.guide.lastName || ''}`).trim()}
                                    </Text>
                                    <View style={styles.serviceArrow}>
                                        <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                    </>
                )}

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    {stats.map((stat) => (
                        <View key={stat.id} style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: stat.color + '10' }]}>
                                {stat.lib === 'material' ? (
                                    <MaterialCommunityIcons name={stat.icon as any} size={22} color={stat.color} />
                                ) : (
                                    <FontAwesome5 name={stat.icon as any} size={18} color={stat.color} />
                                )}
                            </View>
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statTitle}>{stat.title}</Text>
                        </View>
                    ))}
                </View>

                {/* Prayer Times Section */}
                <View style={styles.prayerSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Horaires de Prière</Text>
                        <Text style={styles.cityText}>Makkah</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.prayerList}>
                        {prayerTimes.map((prayer, idx) => (
                            <View
                                key={idx}
                                style={[styles.prayerCard, prayer.active && styles.activePrayerCard]}
                            >
                                <Text style={[styles.prayerName, prayer.active && styles.activeText]}>{prayer.name}</Text>
                                <Text style={[styles.prayerTime, prayer.active && styles.activeText]}>{prayer.time}</Text>
                                {prayer.active && <View style={styles.activeDot} />}
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* Quick Actions */}
                <Text style={styles.sectionTitle}>Actions de Supervision</Text>
                <View style={styles.actionsGrid}>
                    <TouchableOpacity style={styles.actionCard}>
                        <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
                            <Ionicons name="call" size={22} color="#1976D2" />
                        </View>
                        <Text style={styles.actionText}>Appeler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(accampagnant)/messagerie')}>
                        <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
                            <Ionicons name="chatbubble-ellipses" size={22} color="#2E7D32" />
                        </View>
                        <Text style={styles.actionText}>Message</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionCard}>
                        <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
                            <MaterialCommunityIcons name="file-document-multiple" size={22} color="#EF6C00" />
                        </View>
                        <Text style={styles.actionText}>Documents</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionCard, styles.sosAction]}
                        onPress={() => router.push('/(accampagnant)/notifications')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#FFEBEE' }]}>
                            <MaterialCommunityIcons name="alert-octagon" size={22} color="#D32F2F" />
                        </View>
                        <Text style={[styles.actionText, { color: '#D32F2F' }]}>Alertes SOS</Text>
                    </TouchableOpacity>
                </View>

                {/* Info Tip */}
                <View style={styles.tipCard}>
                    <Ionicons name="bulb" size={20} color="#B8860B" />
                    <Text style={styles.tipText}>
                        Saviez-vous ? Vous pouvez recevoir des notifications push si le niveau de batterie de votre pèlerin descend sous 20%.
                    </Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            <BottomNavigation activeTab="Accueil" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 120,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 10,
    },
    greeting: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    subtitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1F2937',
        marginTop: 2,
    },
    notifButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f0f0f0',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    badge: {
        position: 'absolute',
        top: 14,
        right: 14,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#DC2626',
        borderWidth: 2,
        borderColor: '#fff',
    },
    spiritualCard: {
        marginBottom: 24,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f0eec9',
    },
    spiritualGradient: {
        padding: 20,
    },
    spiritualHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    spiritualTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#B8860B',
    },
    spiritualText: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 22,
        fontStyle: 'italic',
        fontWeight: '500',
    },
    spiritualFooter: {
        marginTop: 12,
        alignItems: 'flex-end',
    },
    spiritualRef: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 16,
    },
    pilgrimCard: {
        borderRadius: 28,
        padding: 24,
        marginBottom: 24,
        elevation: 12,
        shadowColor: '#2C5F2D',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
    },
    pilgrimMainInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    pilgrimAvatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    onlineIndicator: {
        position: 'absolute',
        right: 2,
        bottom: 2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#4ADE80',
        borderWidth: 3,
        borderColor: '#2C5F2D',
    },
    pilgrimDetails: {
        flex: 1,
    },
    pilgrimName: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    pilgrimId: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        marginTop: 2,
        fontWeight: '600',
    },
    liveTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#ff4b4b',
        marginRight: 6,
    },
    liveLabel: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    progressSection: {
        backgroundColor: 'rgba(0,0,0,0.1)',
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    progressTitle: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    progressValue: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 3,
        marginBottom: 10,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 3,
    },
    currentStep: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 11,
        fontStyle: 'italic',
    },
    pilgrimCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    locationText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        fontWeight: '500',
    },
    trackButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        elevation: 4,
    },
    trackButtonText: {
        color: '#2C5F2D',
        fontSize: 13,
        fontWeight: 'bold',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    statCard: {
        backgroundColor: '#fff',
        width: (width - 40 - 24) / 3,
        padding: 16,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f0f0f0',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    statIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 15,
        fontWeight: '800',
        color: '#111827',
    },
    statTitle: {
        fontSize: 10,
        color: '#6B7280',
        marginTop: 4,
        fontWeight: '600',
    },
    prayerSection: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cityText: {
        fontSize: 12,
        color: '#B8860B',
        fontWeight: 'bold',
        backgroundColor: '#fdfcf0',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    prayerList: {
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    prayerCard: {
        backgroundColor: '#f9f9fb',
        padding: 16,
        borderRadius: 20,
        marginRight: 12,
        alignItems: 'center',
        width: width * 0.22,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    activePrayerCard: {
        backgroundColor: '#2C5F2D',
        borderColor: '#2C5F2D',
        elevation: 8,
        shadowColor: '#2C5F2D',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    prayerName: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
        marginBottom: 6,
    },
    prayerTime: {
        fontSize: 14,
        color: '#111827',
        fontWeight: 'bold',
    },
    activeText: {
        color: '#FFFFFF',
    },
    activeDot: {
        marginTop: 6,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#FFFFFF',
    },
    servicesGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    serviceCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    serviceIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    serviceTitle: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
        marginBottom: 4,
    },
    serviceName: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '700',
        marginBottom: 8,
    },
    serviceArrow: {
        alignSelf: 'flex-end',
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 32,
    },
    actionCard: {
        width: (width - 40 - 12) / 2,
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f0f0f0',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    actionIcon: {
        width: 52,
        height: 52,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#374151',
    },
    sosAction: {
        borderColor: '#FEE2E2',
    },
    tipCard: {
        flexDirection: 'row',
        backgroundColor: '#fdfcf0',
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        gap: 16,
        borderWidth: 1,
        borderColor: '#f0eec9',
    },
    tipText: {
        flex: 1,
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
        fontWeight: '500',
    },
});

