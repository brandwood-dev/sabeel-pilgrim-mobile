import { useThemeColors } from '@/hooks/useThemeColors';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

const HIJRI_MONTHS = [
    'مُحَرَّم', 'صَفَر', 'رَبِيع ٱلْأَوَّل', 'رَبِيع ٱلثَّانِي',
    'جُمَادَىٰ ٱلأُولَىٰ', 'جُمَادَىٰ ٱلْآخِرَة', 'رَجَب', 'شَعْبَان',
    'رَمَضَان', 'شَوَّال', 'ذُو ٱلْقَعْدَة', 'ذُو ٱلْحِجَّة'
];

const WEEKDAYS = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

export default function CalendarScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

    const [viewDate, setViewDate] = useState(new Date()); // The date we are currently viewing
    const [today, setToday] = useState(new Date()); // Actual real-time today
    const [hijriState, setHijriState] = useState({
        day: 0,
        month: 0,
        year: 0,
        monthName: '',
        firstDayWeekday: 0,
        daysInMonth: 30
    });
    const [loading, setLoading] = useState(true);

    // Update real-time today every minute
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            if (!isNaN(now.getTime())) {
                setToday(now);
            }
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        calculateHijriMonth(viewDate);
    }, [viewDate]);

    // Robust Hijri Parts Extraction
    const getHijriParts = (date: Date) => {
        if (!date || isNaN(date.getTime())) {
            return { day: 1, month: 6, year: 1447 }; // Fallback
        }

        try {
            // Using a more standard fallback approach for Intl
            // Some RN environments prefer 'ar-TN-u-ca-islamic' or just 'en-u-ca-islamic'
            const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric'
            });
            const parts = formatter.formatToParts(date);
            const d = parseInt(parts.find(p => p.type === 'day')?.value || '1', 10);
            const m = parseInt(parts.find(p => p.type === 'month')?.value || '1', 10) - 1;
            const y = parseInt(parts.find(p => p.type === 'year')?.value || '1447', 10);

            return {
                day: isNaN(d) ? 1 : d,
                month: isNaN(m) ? 6 : m,
                year: isNaN(y) ? 1447 : y
            };
        } catch (e) {
            // Manual fallback calculation (simplified tabular calendar) if Intl fails completely
            // 1 Rajab 1447 is approx Jan 16, 2026
            const baseGregorian = new Date(2026, 0, 16); // Jan 16
            const diffDays = Math.floor((date.getTime() - baseGregorian.getTime()) / (1000 * 60 * 60 * 24));

            // This is just a rough estimate to avoid crash, actual lunar cycles vary
            const estimatedTotalDays = 1447 * 354 + 6 * 30 + 1 + diffDays;
            const year = Math.floor(estimatedTotalDays / 354);
            const month = 6; // Mocking current state
            const day = Math.max(1, (diffDays % 30) + 1);

            return { day, month, year };
        }
    };

    const calculateHijriMonth = (date: Date) => {
        if (!date || isNaN(date.getTime())) return;

        setLoading(true);
        try {
            const currentParts = getHijriParts(date);

            // Find the 1st day of this Hijri month by stepping back
            let firstDayGregorian = new Date(date);
            let safety = 0;
            let tempParts = currentParts;

            while (tempParts.day > 1 && safety < 35) {
                firstDayGregorian.setDate(firstDayGregorian.getDate() - 1);
                tempParts = getHijriParts(firstDayGregorian);
                safety++;
            }

            const firstDayWeekday = firstDayGregorian.getDay();

            // Determine if month has 29 or 30 days
            // Check day 30 days after the 1st
            const test30th = new Date(firstDayGregorian);
            test30th.setDate(firstDayGregorian.getDate() + 29);
            const testParts = getHijriParts(test30th);
            const daysInMonth = (testParts.day === 30 || testParts.day === 1) ? 30 : 29;

            setHijriState({
                day: currentParts.day,
                month: currentParts.month,
                year: currentParts.year,
                monthName: HIJRI_MONTHS[currentParts.month] || 'رجب',
                firstDayWeekday,
                daysInMonth
            });
        } catch (e) {
            console.error("Hijri display update error:", e);
        } finally {
            setLoading(false);
        }
    };

    const changeMonth = (offset: number) => {
        const nextDate = new Date(viewDate);
        if (isNaN(nextDate.getTime())) return;

        // Step by 29 then 30 to move approx 1 Hijri month accurately
        nextDate.setDate(viewDate.getDate() + (offset * 30));
        if (!isNaN(nextDate.getTime())) {
            setViewDate(nextDate);
        }
    };

    const renderCalendarDays = () => {
        const { firstDayWeekday, daysInMonth, year, month } = hijriState;
        const todayParts = getHijriParts(today);
        const isCurrentMonth = todayParts.year === year && todayParts.month === month;

        const cells = [];

        // Weekday offset
        for (let i = 0; i < firstDayWeekday; i++) {
            cells.push(<View key={`empty-${i}`} style={styles.dayCell} />);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const isToday = isCurrentMonth && i === todayParts.day;
            const isCursor = !isToday && i === hijriState.day;

            cells.push(
                <View key={i} style={styles.dayCell}>
                    <View style={[
                        styles.dayCircle,
                        isToday && { backgroundColor: colors.primary },
                        isCursor && { borderColor: colors.primary, borderWidth: 1 }
                    ]}>
                        <Text style={[
                            styles.dayText,
                            { color: colors.text },
                            isToday && { color: '#fff' }
                        ]}>
                            {i}
                        </Text>
                    </View>
                </View>
            );
        }
        return cells;
    };

    const currentHijri = getHijriParts(today);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            {/* Real-time Ticker Header */}
            <View style={[styles.topRealTimeBar, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                <View style={styles.tickerRow}>
                    <Ionicons name="time-outline" size={14} color={colors.primary} />
                    <Text style={[styles.realTimeText, { color: colors.text }]}>
                        {today.toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <View style={styles.tickerDot} />
                    <Text style={[styles.realTimeText, { color: colors.text }]}>
                        {currentHijri.day} {HIJRI_MONTHS[currentHijri.month]} {currentHijri.year} هـ
                    </Text>
                </View>
            </View>

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>التقويم الإسلامي</Text>
                <TouchableOpacity onPress={() => setViewDate(new Date())} style={styles.todayButton}>
                    <Text style={{ color: colors.primary, fontWeight: 'bold' }}>اليوم</Text>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={{ height: 300, justifyContent: 'center' }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <View style={styles.content}>
                        {/* Interactive Islamic Month Selector */}
                        <View style={[styles.monthCard, { backgroundColor: colors.surface }]}>
                            <View style={styles.monthHeader}>
                                <TouchableOpacity onPress={() => changeMonth(-1)} hitSlop={15}>
                                    <Ionicons name="chevron-forward" size={24} color={colors.primary} />
                                </TouchableOpacity>
                                <View style={styles.monthTitleContainer}>
                                    <Text style={[styles.monthName, { color: colors.text }]}>{hijriState.monthName}</Text>
                                    <Text style={[styles.yearText, { color: colors.primary }]}>{hijriState.year} هـ</Text>
                                </View>
                                <TouchableOpacity onPress={() => changeMonth(1)} hitSlop={15}>
                                    <Ionicons name="chevron-back" size={24} color={colors.primary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.weekdaysContainer}>
                                {WEEKDAYS.map((day, index) => (
                                    <View key={index} style={styles.weekdayCell}>
                                        <Text style={[styles.weekdayText, { color: colors.textSecondary }]}>{day}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.daysGrid}>
                                {renderCalendarDays()}
                            </View>
                        </View>

                        {/* Traditional Islamic Context Details */}
                        <View style={[styles.detailSection, { backgroundColor: colors.surface }]}>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailValue, { color: colors.text }]}>
                                    {today.toLocaleDateString('ar-TN', { weekday: 'long' })}
                                </Text>
                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>اليوم</Text>
                            </View>
                            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailValue, { color: colors.text }]}>
                                    {viewDate.toLocaleDateString('ar-TN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </Text>
                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>الميلادي</Text>
                            </View>
                        </View>

                        {/* Islamic Events and Benefits */}
                        <View style={styles.eventsSection}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>أهم الأحداث الإسلامية</Text>
                            <View style={[styles.eventItem, { backgroundColor: colors.surface }]}>
                                <View style={styles.eventDateBox}>
                                    <Text style={styles.eventDateText}>27</Text>
                                    <Text style={styles.eventMonthText}>رجب</Text>
                                </View>
                                <View style={styles.eventInfo}>
                                    <Text style={[styles.eventTitle, { color: colors.text }]}>الإسراء والمعراج</Text>
                                    <Text style={[styles.eventStatus, { color: colors.secondary }]}>ذكرى معجزة النبي ﷺ</Text>
                                </View>
                                <Ionicons name="star" size={20} color={colors.primary} />
                            </View>

                            <View style={[styles.eventItem, { backgroundColor: colors.surface, marginTop: 10 }]}>
                                <View style={[styles.eventDateBox, { backgroundColor: colors.secondary }]}>
                                    <Text style={styles.eventDateText}>1</Text>
                                    <Text style={styles.eventMonthText}>رمضان</Text>
                                </View>
                                <View style={styles.eventInfo}>
                                    <Text style={[styles.eventTitle, { color: colors.text }]}>بداية شهر الصيام</Text>
                                    <Text style={[styles.eventStatus, { color: colors.textSecondary }]}>ينتظره المسلمون بشوق</Text>
                                </View>
                                <Ionicons name="moon" size={20} color={colors.primary} />
                            </View>
                        </View>
                    </View>
                )}
                <View style={{ height: 80 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topRealTimeBar: {
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    tickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    tickerDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#ccc',
    },
    realTimeText: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 15,
    },
    backButton: {
        padding: 5,
    },
    todayButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(44, 95, 45, 0.1)',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    content: {
        paddingHorizontal: 20,
    },
    monthCard: {
        borderRadius: 24,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        marginBottom: 20,
    },
    monthHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 25,
    },
    monthTitleContainer: {
        alignItems: 'center',
    },
    monthName: {
        fontSize: 26,
        fontWeight: 'bold',
    },
    yearText: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
    },
    weekdaysContainer: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        marginBottom: 15,
        paddingHorizontal: 5,
    },
    weekdayCell: {
        width: (width - 90) / 7,
        alignItems: 'center',
    },
    weekdayText: {
        fontSize: 14,
        fontWeight: '800',
    },
    daysGrid: {
        flexDirection: 'row-reverse',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: (width - 80) / 7,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    detailSection: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 25,
    },
    detailRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    detailValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        width: '100%',
        opacity: 0.5,
    },
    eventsSection: {
        marginTop: 5,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'right',
    },
    eventItem: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        padding: 15,
        borderRadius: 20,
        gap: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    eventDateBox: {
        width: 55,
        height: 55,
        borderRadius: 14,
        backgroundColor: '#2C5F2D',
        justifyContent: 'center',
        alignItems: 'center',
    },
    eventDateText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    eventMonthText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    eventInfo: {
        flex: 1,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'right',
    },
    eventStatus: {
        fontSize: 13,
        marginTop: 2,
        textAlign: 'right',
    },
});
