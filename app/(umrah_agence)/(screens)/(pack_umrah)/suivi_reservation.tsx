import { useThemeColors } from '@/hooks/useThemeColors';
import { Reservation, reservationService } from '@/services/reservation.service';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSelector } from 'react-redux';
import { useTrans } from '@/hooks/useTrans';

const { width } = Dimensions.get('window');
const PRIMARY_COLOR = '#2C5F2D';
const BACKGROUND_COLOR = '#f8f7f2';

export default function SuiviReservationScreen() {
    const { t, language } = useTrans();
    const isRTL = language === 'ar';
    const router = useRouter();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [history, setHistory] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await reservationService.getReservations();
            setReservations(data.filter(r => r.status !== 'validee' || r.progress < 1));
            setHistory(data.filter(r => r.status === 'validee' && r.progress === 1));
        } catch (error) {
            console.error('Error fetching reservations:', error);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'ongoing', title: t('En cours') },
        { id: 'history', title: t('Historique') },
    ];

    const flatListRef = React.useRef<FlatList>(null);

    const handleTabPress = (index: number) => {
        setActiveTabIndex(index);
        flatListRef.current?.scrollToIndex({ index, animated: true });
    };

    const onMomentumScrollEnd = (e: any) => {
        const offset = e.nativeEvent.contentOffset.x;
        const index = Math.round(offset / width);
        setActiveTabIndex(index);
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'en_attente': return t('En cours');
            case 'validee': return t('Confirmée');
            case 'annulee': return t('Annulée');
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'en_attente': return '#F57C00';
            case 'validee': return colors.success;
            case 'annulee': return colors.error;
            default: return colors.textSecondary;
        }
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.surface }]}>
                <Ionicons name="document-text-outline" size={80} color={colors.textLight} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('Aucune réservation')}</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t("Vous n'avez pas encore de réservations en cours. Commencez votre voyage spirituel dès maintenant.")}
            </Text>
            <TouchableOpacity
                style={[styles.exploreButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/(umrah_agence)/(screens)/(pack_umrah)/explorer_umrah')}
            >
                <Text style={styles.exploreButtonText}>{t('Découvrir les Packs Umrah')}</Text>
                <Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={18} color="#fff" />
            </TouchableOpacity>
        </View>
    );

    const renderReservationItem = ({ item }: { item: Reservation }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface }]}
            activeOpacity={0.9}
            onPress={() => router.push({
                pathname: '/(umrah_agence)/(screens)/(pack_umrah)/details_suivi',
                params: { id: item.id }
            })}
        >
            <View style={styles.cardHeader}>
                <Image source={item.image} style={styles.cardImage} />
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {getStatusLabel(item.status)}
                    </Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <Text style={[styles.packTitle, { color: colors.text }]}>{item.packTitle}</Text>
                <View style={styles.agencyRow}>
                    <Ionicons name="business-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.agencyName, { color: colors.textSecondary }]}>{item.agencyName}</Text>
                </View>

                <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                        <Text style={[styles.infoLabel, { color: colors.textLight }]}>{t('Date du voyage')}</Text>
                        <Text style={[styles.infoValue, { color: colors.text }]}>{item.date}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={[styles.infoLabel, { color: colors.textLight }]}>{t('Prix total')}</Text>
                        <Text style={[styles.infoValue, { color: colors.text }]}>{item.price}</Text>
                    </View>
                </View>

                <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                        <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>{t('Progression du dossier')}</Text>
                        <Text style={[styles.progressPercent, { color: colors.primary }]}>{Math.round(item.progress * 100)}%</Text>
                    </View>
                    <View style={[styles.progressBarBg, { backgroundColor: colors.divider, overflow: 'hidden' }]}>
                        <View style={[styles.progressBarFill, { width: `${item.progress * 100}%`, backgroundColor: colors.primary }]} />
                    </View>
                </View>
            </View>

            <View style={[styles.cardFooter, { borderTopColor: colors.divider }]}>
                <TouchableOpacity style={styles.detailsButton}>
                    <Text style={[styles.detailsButtonText, { color: colors.primary }]}>
                        {item.progress < 1 ? t('Suivre votre réservation') : t('Consulter les détails')}
                    </Text>
                    <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color={colors.primary} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const renderReservationList = (data: Reservation[], type: 'ongoing' | 'history') => {
        if (data.length === 0) return renderEmptyState();
        return (
            <FlatList
                data={data}
                keyExtractor={item => item.id}
                renderItem={renderReservationItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={type === 'history' ? (
                    <Text style={styles.historyNote}>{t('Ces voyages sont terminés. Vous pouvez consulter les détails ou télécharger vos reçus.')}</Text>
                ) : null}
            />
        );
    };

    const renderTabItem = ({ index }: { index: number }) => {
        if (loading) {
            return (
                <View style={[styles.tabContentContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ marginTop: 10, color: colors.textSecondary }}>{t('Chargement...')}</Text>
                </View>
            );
        }
        return (
            <View style={styles.tabContentContainer}>
                {index === 0 ? renderReservationList(reservations, 'ongoing') : renderReservationList(history, 'history')}
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={activeTabIndex === 0 ? colors.text === '#F5F5F5' ? "light-content" : "dark-content" : "dark-content"} backgroundColor={colors.background} />
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.header, { backgroundColor: colors.background }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name={isRTL ? "arrow-forward" : "close"} size={28} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>{t('Suivi Réservation')}</Text>
                    <View style={{ width: 28 }} />
                </View>

                <View style={[styles.tabContainer, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
                    {tabs.map((tab, index) => (
                        <TouchableOpacity
                            key={tab.id}
                            style={styles.tabButton}
                            onPress={() => handleTabPress(index)}
                        >
                            <Text style={[
                                styles.tabText,
                                { color: activeTabIndex === index ? colors.primary : colors.textSecondary },
                                activeTabIndex === index && styles.activeTabText
                            ]}>
                                {tab.title}
                            </Text>
                            {activeTabIndex === index && <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />}
                        </TouchableOpacity>
                    ))}
                </View>

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
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    tabContainer: { flexDirection: 'row', borderBottomWidth: 1 },
    tabButton: { flex: 1, alignItems: 'center', paddingVertical: 14, position: 'relative' },
    tabText: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase' },
    activeTabText: { fontWeight: '800' },
    activeIndicator: { position: 'absolute', bottom: 0, height: 3, width: '60%', borderRadius: 3 },
    tabContentContainer: { width: width, flex: 1 },
    listContent: { padding: 20, paddingBottom: 40 },
    card: { borderRadius: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, overflow: 'hidden' },
    cardHeader: { position: 'relative', height: 140 },
    cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    statusBadge: { position: 'absolute', top: 15, right: 15, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    cardBody: { padding: 20 },
    packTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    agencyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
    agencyName: { fontSize: 14 },
    infoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    infoItem: { flex: 1 },
    infoLabel: { fontSize: 12, marginBottom: 4 },
    infoValue: { fontSize: 14, fontWeight: '600' },
    progressSection: { marginTop: 10 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressLabel: { fontSize: 13 },
    progressPercent: { fontSize: 13, fontWeight: 'bold' },
    progressBarBg: { height: 8, borderRadius: 4 },
    progressBarFill: { height: '100%', borderRadius: 4 },
    cardFooter: { padding: 15, borderTopWidth: 1, alignItems: 'center' },
    detailsButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    detailsButtonText: { fontSize: 14, fontWeight: 'bold' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    emptyIconContainer: { width: 150, height: 150, borderRadius: 75, justifyContent: 'center', alignItems: 'center', marginBottom: 30, elevation: 4 },
    emptyTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
    emptyText: { textAlign: 'center', lineHeight: 22, marginBottom: 40 },
    exploreButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, paddingVertical: 15, borderRadius: 30, gap: 10, elevation: 3 },
    exploreButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    historyNote: { textAlign: 'center', fontSize: 12, marginTop: 10, fontStyle: 'italic' },
});
