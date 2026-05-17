import { useThemeColors } from '@/hooks/useThemeColors';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    FlatList,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useTrans } from '@/hooks/useTrans';

const { width } = Dimensions.get('window');

interface PlanningStep {
    id: string;
    day: number;
    title: string;
    description: string;
    location: string;
    time?: string;
    type: 'travel' | 'ritual' | 'stay';
    isCompleted: boolean;
}

const mockPlanning: PlanningStep[] = [
    {
        id: '1',
        day: 1,
        title: 'Départ de Tunis',
        description: 'Vol vers Jeddah avec Tunisair. Transfert vers La Mecque.',
        location: 'Aéroport Tunis-Carthage',
        time: '10:00',
        type: 'travel',
        isCompleted: true,
    },
    {
        id: '2',
        day: 1,
        title: 'Arrivée & Omra',
        description: 'Installation à l\'hôtel et accomplissement de la Omra.',
        location: 'Masjid Al-Haram',
        time: '20:00',
        type: 'ritual',
        isCompleted: true,
    },
    {
        id: '3',
        day: 2,
        title: 'Séjour à La Mecque',
        description: 'Temps libre pour la prière et les ibadats.',
        location: 'Makkah Hotel',
        type: 'stay',
        isCompleted: false,
    },
    {
        id: '4',
        day: 5,
        title: 'Ziyarats Makkah',
        description: 'Visite des lieux saints (Mont Arafat, Mina, Muzdalifah).',
        location: 'La Mecque',
        time: '08:00',
        type: 'ritual',
        isCompleted: false,
    },
    {
        id: '5',
        day: 8,
        title: 'Départ vers Médine',
        description: 'Transport en bus climatisé vers la ville du Prophète.',
        location: 'Médine',
        time: '14:00',
        type: 'travel',
        isCompleted: false,
    },
];

export default function PlanningScreen() {
    const { t, language } = useTrans();
    const isRTL = language === 'ar';
    const router = useRouter();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const [activeDay, setActiveDay] = useState(1);

    const renderTimeStep = ({ item, index }: { item: PlanningStep; index: number }) => (
        <View style={styles.stepContainer}>
            <View style={styles.leftLineContainer}>
                <View style={[styles.dot, item.isCompleted ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                    {item.isCompleted && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                {index !== mockPlanning.length - 1 && <View style={[styles.line, { backgroundColor: colors.divider }]} />}
            </View>

            <View style={[styles.stepContent, { backgroundColor: colors.surface }]}>
                <View style={[styles.stepHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Text style={[styles.dayText, { color: colors.primary }]}>{t('Jour')} {item.day}</Text>
                    {item.time && <Text style={[styles.timeText, { color: colors.textSecondary }]}>{item.time}</Text>}
                </View>
                <Text style={[styles.stepTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>{item.title}</Text>
                <Text style={[styles.stepDescription, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{item.description}</Text>
                <View style={[styles.locationRow, { borderTopColor: colors.divider, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Ionicons name="location-outline" size={14} color={colors.primary} />
                    <Text style={[styles.locationText, { color: colors.primary }]}>{item.location}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.background, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                        <Ionicons name={isRTL ? "arrow-forward" : "close"} size={28} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>{t('Planning Umrah')}</Text>
                    <View style={{ width: 28 }} />
                </View>

                {/* Summary Card */}
                <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
                    <View style={[styles.summaryInfo, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('Progression du voyage')}</Text>
                        <Text style={[styles.summaryValue, { color: colors.primary }]}>2 / 12 {t('Jours')}</Text>
                    </View>
                    <View style={[styles.progressBarBg, { backgroundColor: colors.divider, overflow: 'hidden' }]}>
                        <View style={[styles.progressBarFill, { width: '20%', backgroundColor: colors.primary, alignSelf: isRTL ? 'flex-end' : 'flex-start' }]} />
                    </View>
                    <Text style={[styles.summarySubtext, { color: colors.textLight, textAlign: isRTL ? 'right' : 'left' }]}>{t('Prochaine étape')} : Ziyarats Makkah ({t('Demain')})</Text>
                </View>

                {/* Timeline List */}
                <FlatList
                    data={mockPlanning}
                    keyExtractor={item => item.id}
                    renderItem={renderTimeStep}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 15,
    },
    closeButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    summaryCard: {
        margin: 20,
        padding: 20,
        borderRadius: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    summaryInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    progressBarBg: {
        height: 10,
        borderRadius: 5,
        marginBottom: 12,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 5,
    },
    summarySubtext: {
        fontSize: 12,
        fontStyle: 'italic',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    stepContainer: {
        flexDirection: 'row',
        marginBottom: 0,
    },
    leftLineContainer: {
        width: 30,
        alignItems: 'center',
    },
    dot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#eee',
        borderWidth: 2,
        borderColor: '#ddd',
        zIndex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dotCompleted: {
    },
    line: {
        width: 2,
        flex: 1,
        backgroundColor: '#eee',
        marginVertical: -2,
    },
    stepContent: {
        flex: 1,
        marginLeft: 15,
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 15,
        marginBottom: 20,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
    },
    stepHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    dayText: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    timeText: {
        fontSize: 12,
        fontWeight: '500',
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    stepDescription: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 10,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingTop: 8,
        borderTopWidth: 1,
    },
    locationText: {
        fontSize: 12,
        fontWeight: '500',
    },
});
