import AppBar from '@/app/(umrah_agence)/(screens)/(navigation)/app_barr';
import { useThemeColors } from '@/hooks/useThemeColors';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter, useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSelector } from 'react-redux';
import { useTrans } from '@/hooks/useTrans';

// --- Types & Constants ---
const PRIMARY_GREEN = '#2C5F2D';
const LIGHT_BEIGE = '#f8f7f2';
const GOLD_ACCENT = '#d9ab83';

interface GridItem {
    id: string;
    title: string;
    icon: string;
    iconLib: 'ionicons' | 'fontawesome' | 'material';
    route?: string;
}

export default function SpirituelleScreen() {
    const router = useRouter();
    const segments = useSegments();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const { t, language } = useTrans();
    const isRTL = language === 'ar';

    const GRID_ITEMS: GridItem[] = [
        { id: '1', title: t('Coran'), icon: 'book-open-page-variant', iconLib: 'material', route: '/(umrah_agence)/(screens)/(spirituel)/quran' },
        { id: '2', title: t('Adhkar'), icon: 'hands-pray', iconLib: 'material', route: '/(umrah_agence)/(screens)/(spirituel)/adhkar' },
        { id: '3', title: t('Tasbih'), icon: 'rosary', iconLib: 'fontawesome', route: '/(umrah_agence)/(screens)/(spirituel)/tasbih' },
        { id: '4', title: t('Qibla'), icon: 'compass', iconLib: 'ionicons', route: '/(umrah_agence)/(screens)/(spirituel)/qibla' },
        { id: '5', title: t('Douaa'), icon: 'praying-hands', iconLib: 'fontawesome' },
        { id: '6', title: t('Mosquées'), icon: 'mosque', iconLib: 'fontawesome', route: '/(umrah_agence)/(screens)/(spirituel)/mosque' },
        { id: '7', title: t('Umrah'), icon: 'kaaba', iconLib: 'fontawesome', route: '/(umrah_agence)/(screens)/(spirituel)/umrah_info' },
        { id: '8', title: t('Calendrier'), icon: 'calendar-month', iconLib: 'material', route: '/(umrah_agence)/(screens)/(spirituel)/calender' },
    ];

    // State
    const [hijriDate, setHijriDate] = useState('');
    const [prayerTimesData, setPrayerTimesData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState({ hours: '00', minutes: '00', seconds: '00' });
    const [nextPrayerIndex, setNextPrayerIndex] = useState(0);
    const [locationName, setLocationName] = useState(t('Localisation...'));

    // Adhan Logic (REFINED)
    const [activeAdhan, setActiveAdhan] = useState<{ prayer: string, isPlaying: boolean } | null>(null);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const lastTriggeredPrayer = useRef<string | null>(null);

    // Adhan toggles
    const [adhanSettings, setAdhanSettings] = useState<{ [key: string]: boolean }>({
        Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true,
    });

    const DEFAULT_PRAYER_TIMES = [
        { id: 'Fajr', name: t('Fajr'), time: '--:--', period: 'AM', icon: 'weather-sunset-up' },
        { id: 'Sunrise', name: t('Shuruq'), time: '--:--', period: 'AM', icon: 'weather-sunny' },
        { id: 'Dhuhr', name: t('Dhuhr'), time: '--:--', period: 'PM', icon: 'weather-sunny' },
        { id: 'Asr', name: t('Asr'), time: '--:--', period: 'PM', icon: 'weather-partly-cloudy' },
        { id: 'Maghrib', name: t('Maghrib'), time: '--:--', period: 'PM', icon: 'weather-sunset-down' },
        { id: 'Isha', name: t('Isha'), time: '--:--', period: 'PM', icon: 'weather-night' },
    ];

    // Cleanup Sound
    useEffect(() => {
        return () => {
            if (sound) sound.unloadAsync();
        };
    }, [sound]);

    // --- Helpers ---
    const getHijriDateStr = (date: Date) => {
        try {
            const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
            const locale = language === 'ar' ? 'ar-SA' : language === 'en' ? 'en-US' : 'fr-FR';
            return new Intl.DateTimeFormat(`${locale}-u-ca-islamic`, options).format(date);
        } catch (e) {
            return language === 'ar' ? "١٧ رجب ١٤٤٧" : "17 Rajab 1447";
        }
    };

    const getGregorianDateStr = (date: Date) => {
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
        const locale = language === 'ar' ? 'ar-SA' : language === 'en' ? 'en-US' : 'fr-FR';
        return new Intl.DateTimeFormat(locale, options).format(date);
    };

    // --- Effects: Location & API ---
    useEffect(() => {
        setHijriDate(getHijriDateStr(new Date()));

        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLocationName(t("Permission refusée"));
                fetchPrayerTimes(36.8065, 10.1815);
                return;
            }

            try {
                let location = await Location.getCurrentPositionAsync({});
                const { latitude, longitude } = location.coords;

                let reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
                if (reverseGeocode.length > 0) {
                    const place = reverseGeocode[0];
                    const city = place.city || place.region || t("Ma Position");
                    const country = place.country || "";
                    setLocationName(`${city}, ${country}`);
                }

                fetchPrayerTimes(latitude, longitude);

            } catch (error) {
                console.log("Loc Error", error);
                setLocationName(t("Tunis, Tunisie"));
                fetchPrayerTimes(36.8065, 10.1815);
            }
        })();

        const interval = setInterval(() => {
            if (prayerTimesData) {
                updateCountdown(new Date(), prayerTimesData);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [prayerTimesData, language]);

    const fetchPrayerTimes = async (lat: number, long: number) => {
        try {
            const response = await fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${long}&method=3`);
            const data = await response.json();
            if (data.code === 200) {
                setPrayerTimesData(data.data.timings);
                setLoading(false);
            }
        } catch (error) {
            console.error("Error fetching prayer times:", error);
            setLoading(false);
        }
    };

    // --- Audio Logic ---
    const playAdhan = async (prayerName: string) => {
        if (sound) await sound.unloadAsync();

        try {
            const adhanUrl = 'https://www.islamcan.com/audio/adhan/azan1.mp3';

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: adhanUrl },
                { shouldPlay: true }
            );

            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setActiveAdhan(null); // Finish = Window Close
                    newSound.unloadAsync();
                }
            });

            setSound(newSound);
            setActiveAdhan({ prayer: prayerName, isPlaying: true });

        } catch (error) {
            console.log("Error playing adhan", error);
            // Visual fallback only (1 min) if audio fails
            setActiveAdhan({ prayer: prayerName, isPlaying: false });
            setTimeout(() => setActiveAdhan(null), 60000);
        }
    };

    const stopAdhan = async () => {
        if (sound) {
            await sound.stopAsync();
            await sound.unloadAsync();
            setSound(null);
        }
        setActiveAdhan(null);
    };

    const updateCountdown = (now: Date, timings: any) => {
        const prayerOrder = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

        // 1. Check Triggers
        for (const prayer of prayerOrder) {
            const timeStr = timings[prayer];
            if (!timeStr) continue;
            const [hours, minutes] = timeStr.split(':').map(Number);
            const pTime = new Date(now);
            pTime.setHours(hours, minutes, 0, 0);

            // Exact trigger: 0-2000ms after prayer time
            const diffMs = now.getTime() - pTime.getTime();

            if (diffMs >= 0 && diffMs < 2000) {
                const triggerId = `${prayer}-${pTime.getDate()}`;
                if (lastTriggeredPrayer.current !== triggerId) {
                    lastTriggeredPrayer.current = triggerId;

                    if (adhanSettings[prayer]) {
                        playAdhan(prayer);
                    } else {
                        // Muted: Visual only (1 min)
                        setActiveAdhan({ prayer, isPlaying: false });
                        setTimeout(() => setActiveAdhan(null), 60000);
                    }
                }
            }
        }

        // 2. Next Prayer Calc
        let nextPrayer = null;
        let nextPrayerTimeDate = null;
        for (const prayer of prayerOrder) {
            const timeStr = timings[prayer];
            if (!timeStr) continue;
            const [hours, minutes] = timeStr.split(':').map(Number);
            const pTime = new Date(now);
            pTime.setHours(hours, minutes, 0);

            if (pTime > now) {
                nextPrayer = prayer;
                nextPrayerTimeDate = pTime;
                break;
            }
        }

        if (!nextPrayer) {
            nextPrayer = 'Fajr';
            const [hours, minutes] = timings['Fajr'].split(':').map(Number);
            nextPrayerTimeDate = new Date(now);
            nextPrayerTimeDate.setDate(nextPrayerTimeDate.getDate() + 1);
            nextPrayerTimeDate.setHours(hours, minutes, 0);
        }

        const prayerIndexMap: { [key: string]: number } = {
            'Fajr': 0, 'Sunrise': 1, 'Dhuhr': 2, 'Asr': 3, 'Maghrib': 4, 'Isha': 5
        };

        setNextPrayerIndex(prayerIndexMap[nextPrayer] || 0);

        let diff = nextPrayerTimeDate!.getTime() - now.getTime();
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeLeft({
            hours: String(h).padStart(2, '0'),
            minutes: String(m).padStart(2, '0'),
            seconds: String(s).padStart(2, '0'),
        });
    };

    const toggleAdhanSetting = async (prayerId: string) => {
        // If playing currently, stop it
        if (activeAdhan && activeAdhan.prayer === prayerId) {
            await stopAdhan();
            return;
        }

        setAdhanSettings(prev => ({
            ...prev,
            [prayerId]: !prev[prayerId]
        }));
    };

    // --- Render ---

    const renderGridItem = (item: GridItem) => (
        <TouchableOpacity
            key={item.id}
            style={styles.gridItem}
            activeOpacity={0.7}
            onPress={() => item.route && router.push(item.route as any)}
        >
            <View style={[styles.gridIconContainer, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                {item.iconLib === 'ionicons' && <Ionicons name={item.icon as any} size={24} color={colors.primary} />}
                {item.iconLib === 'fontawesome' && <FontAwesome5 name={item.icon as any} size={20} color={colors.primary} />}
                {item.iconLib === 'material' && <MaterialCommunityIcons name={item.icon as any} size={24} color={colors.primary} />}
            </View>
            <Text style={[styles.gridTitle, { color: colors.text }]}>{item.title}</Text>
        </TouchableOpacity>
    );

    const getDisplayPrayers = () => {
        if (!prayerTimesData) return DEFAULT_PRAYER_TIMES;
        return [
            { id: 'Fajr', name: t('Fajr'), time: prayerTimesData.Fajr, icon: 'weather-sunset-up' },
            { id: 'Sunrise', name: t('Shuruq'), time: prayerTimesData.Sunrise, icon: 'weather-sunny' },
            { id: 'Dhuhr', name: t('Dhuhr'), time: prayerTimesData.Dhuhr, icon: 'weather-sunny' },
            { id: 'Asr', name: t('Asr'), time: prayerTimesData.Asr, icon: 'weather-partly-cloudy' },
            { id: 'Maghrib', name: t('Maghrib'), time: prayerTimesData.Maghrib, icon: 'weather-sunset-down' },
            { id: 'Isha', name: t('Isha'), time: prayerTimesData.Isha, icon: 'weather-night' },
        ];
    };

    const displayPrayers = getDisplayPrayers();
    const nextPrayerName = displayPrayers[nextPrayerIndex]?.name || t('Prière');

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? colors.surface : "#1e4220"} />
            
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.appBarWrapper}>
                    <AppBar
                        onMenuPress={() => router.back()}
                        showAvatar={false}
                        showCloseButton={true}
                        showSearch={false}
                        showNotification={true}
                        backgroundColor="transparent"
                    />
                </View>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

                    {/* 1. Header with Real Location & Timer */}
                    <LinearGradient
                        colors={['#1e4220', '#2C5F2D', '#4A7C59']}
                        style={styles.headerGradient}
                    >
                        <View style={{ height: 60 }} />

                        <View style={styles.headerContent}>
                            <View style={[styles.prayerHeaderTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                <View style={[styles.locationBadge, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                    <Ionicons name="location-sharp" size={12} color={GOLD_ACCENT} />
                                    <Text style={styles.locationText}>{locationName}</Text>
                                </View>
                                <Text style={styles.nextPrayerLabel}>
                                    {activeAdhan ? t('Adhan en cours...') : `${t(nextPrayerName)} ${t('dans')}`}
                                </Text>
                            </View>

                            {/* Countdown or Adhan Active Box */}
                            {activeAdhan ? (
                                <TouchableOpacity
                                    style={[styles.adhanActiveBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                                    onPress={stopAdhan}
                                    activeOpacity={0.8}
                                >
                                    <MaterialCommunityIcons name="volume-high" size={40} color="#fff" />
                                    <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                                        <Text style={styles.adhanActiveText}>{t('Appel à la Prière')}</Text>
                                        <Text style={{ color: '#eee', fontSize: 12 }}>{t('Appuyez pour couper le son')}</Text>
                                    </View>
                                </TouchableOpacity>
                            ) : (
                                <View style={[styles.countdownContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                    <View style={styles.timeBox}>
                                        <Text style={styles.timeValue}>{timeLeft.hours}</Text>
                                        <Text style={styles.timeLabel}>{t('Heures')}</Text>
                                    </View>
                                    <Text style={styles.timeSeparator}>:</Text>
                                    <View style={styles.timeBox}>
                                        <Text style={styles.timeValue}>{timeLeft.minutes}</Text>
                                        <Text style={styles.timeLabel}>{t('Min')}</Text>
                                    </View>
                                    <Text style={styles.timeSeparator}>:</Text>
                                    <View style={styles.timeBox}>
                                        <Text style={styles.timeValue}>{timeLeft.seconds}</Text>
                                        <Text style={styles.timeLabel}>{t('Sec')}</Text>
                                    </View>
                                </View>
                            )}

                            <View style={styles.mosqueContainer}>
                                <FontAwesome5 name="mosque" size={60} color="rgba(255,255,255,0.2)" />
                            </View>
                        </View>
                    </LinearGradient>

                    {/* 2. Real Date Strip */}
                    <View style={[styles.dateStrip, { backgroundColor: colors.surface, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <TouchableOpacity style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}>
                            <Ionicons name="chevron-back" size={18} color={isDarkMode ? "#fff" : "#666"} />
                        </TouchableOpacity>
                        <View style={[styles.dateTextContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <Text style={[styles.dateTextGregorian, { color: colors.text }]}>{getGregorianDateStr(new Date())}</Text>
                            <Text style={[styles.dateSeparator, { color: colors.divider }]}>•</Text>
                            <Text style={[styles.dateTextHijri, { color: colors.primary }]}>{hijriDate}</Text>
                        </View>
                        <TouchableOpacity><Ionicons name="share-social-outline" size={18} color={isDarkMode ? "#fff" : "#666"} /></TouchableOpacity>
                    </View>

                    {/* 3. Prayer List */}
                    <View style={styles.prayerTimesContainer}>
                        {loading ? (
                            <ActivityIndicator size="small" color={colors.primary} style={{ padding: 20 }} />
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.prayerTimesList, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                {displayPrayers.map((prayer, index) => {
                                    const isNext = index === nextPrayerIndex;
                                    const isAdhanOn = adhanSettings[prayer.id] || false;
                                    // Highlight active prayer logic: If active adhan, highlight that one
                                    const isActiveAdhanPrayer = activeAdhan?.prayer === prayer.id;
                                    const cardActive = isNext || isActiveAdhanPrayer;

                                    return (
                                        <View key={prayer.id} style={[styles.prayerCard, { backgroundColor: colors.surface, borderColor: colors.divider }, cardActive && styles.prayerCardActive]}>
                                            <TouchableOpacity
                                                style={[styles.adhanToggle, isRTL ? { left: 5, right: undefined } : { right: 5, left: undefined }]}
                                                onPress={() => toggleAdhanSetting(prayer.id)}
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            >
                                                <Ionicons
                                                    name={isAdhanOn ? "volume-high" : "volume-mute"}
                                                    size={16}
                                                    color={cardActive ? '#fff' : (isAdhanOn ? colors.primary : colors.divider)}
                                                />
                                            </TouchableOpacity>

                                            <Text style={[styles.prayerName, { color: colors.textSecondary }, cardActive && styles.textActive]}>{prayer.name}</Text>

                                            <MaterialCommunityIcons
                                                name={prayer.icon as any}
                                                size={20}
                                                color={cardActive ? '#fff' : GOLD_ACCENT}
                                                style={{ marginVertical: 4 }}
                                            />
                                            <Text style={[styles.prayerTime, { color: colors.text }, cardActive && styles.textActive]}>{prayer.time}</Text>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        )}
                    </View>

                    {/* 4. Grid Features */}
                    <View style={styles.gridSection}>
                        <Text style={[styles.gridSectionTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>{t('Services')}</Text>
                        <View style={[styles.gridContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            {GRID_ITEMS.map((item) => renderGridItem(item))}
                        </View>
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: LIGHT_BEIGE,
    },
    appBarWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    scrollView: {
        flex: 1,
    },
    bottomNavContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    headerGradient: {
        paddingTop: 0,
        paddingBottom: 25,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        alignItems: 'center',
    },
    headerContent: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    prayerHeaderTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        alignItems: 'center',
        marginBottom: 10,
    },
    locationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        gap: 5,
    },
    locationText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    nextPrayerLabel: {
        color: GOLD_ACCENT,
        fontSize: 14,
        fontWeight: 'bold',
    },
    countdownContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 5,
        zIndex: 2,
    },
    timeBox: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        width: 50,
        height: 50,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    timeValue: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    timeLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 9,
        textTransform: 'uppercase',
    },
    timeSeparator: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: -10,
    },
    adhanActiveBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(217, 171, 131, 0.3)',
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: GOLD_ACCENT,
        gap: 15,
        zIndex: 2,
    },
    adhanActiveText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    mosqueContainer: {
        position: 'absolute',
        bottom: -20,
        opacity: 0.6,
        zIndex: 1,
    },
    dateStrip: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        marginTop: -20,
        marginBottom: 20,
    },
    dateTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateTextGregorian: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#333',
        textTransform: 'capitalize',
    },
    dateSeparator: {
        color: '#ccc',
    },
    dateTextHijri: {
        fontSize: 13,
        color: PRIMARY_GREEN,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    prayerTimesContainer: {
        marginBottom: 20,
    },
    prayerTimesList: {
        paddingHorizontal: 20,
        gap: 10,
    },
    prayerCard: {
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        minWidth: 68,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        borderWidth: 1,
        borderColor: '#eee',
    },
    prayerCardActive: {
        backgroundColor: PRIMARY_GREEN,
        borderColor: PRIMARY_GREEN,
    },
    adhanToggle: {
        position: 'absolute',
        top: 5,
        right: 5,
        zIndex: 10,
        padding: 2,
    },
    prayerName: {
        fontSize: 11,
        fontWeight: '600',
        color: '#666',
        marginTop: 15,
    },
    prayerTime: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 2,
    },
    textActive: {
        color: '#fff',
    },
    gridSection: {
        paddingHorizontal: 20,
    },
    gridSectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 15,
        marginLeft: 5,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 20,
    },
    gridItem: {
        alignItems: 'center',
        width: '23%',
    },
    gridIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        borderWidth: 1,
        borderColor: '#E8E6D0',
    },
    gridTitle: {
        fontSize: 10,
        fontWeight: '500',
        color: '#444',
        textAlign: 'center',
    },
});
