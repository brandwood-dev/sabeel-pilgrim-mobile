import { Ionicons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ImageBackground,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useThemeColors } from '../../hooks/useThemeColors';
import { RootState } from '../../store/store';
import { setPrayerTimes } from '../../store/salatSlice';

const GOLD_ACCENT = '#d9ab83';
const PRIMARY_GREEN = '#2C5F2D';

const { width } = Dimensions.get('window');

const PrayerTimerCard = () => {
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

    const dispatch = useDispatch();
    const salatCache = useSelector((state: RootState) => state.salat);

    const [hijriDate, setHijriDate] = useState('');
    const [prayerTimesData, setPrayerTimesData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState({ hours: '00', minutes: '00', seconds: '00' });
    const [nextPrayerIndex, setNextPrayerIndex] = useState(0);
    const [locationName, setLocationName] = useState('Localisation...');

    const lastTriggeredPrayer = useRef<string | null>(null);

    const PRAYER_ORDER = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    const getHijriDateStr = (date: Date) => {
        try {
            const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
            const hijri = new Intl.DateTimeFormat('fr-FR-u-ca-islamic', options).format(date);
            // Capitalize each word (e.g., 27 rajab 1447 -> 27 Rajab 1447)
            return hijri.split(' ').map(w => w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w).join(' ') + " AH";
        } catch (e) {
            return "27 Rajab 1447 AH";
        }
    };

    const getGregorianDateStr = (date: Date) => {
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
        let str = new Intl.DateTimeFormat('fr-FR', options).format(date);
        return str.split(' ').map(w => w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w).join(' ');
    };

    useEffect(() => {
        setHijriDate(getHijriDateStr(new Date()));

        const today = new Date().toISOString().split('T')[0];

        if (salatCache.timings && salatCache.lastFetchedDate === today) {
            setPrayerTimesData(salatCache.timings);
            setLocationName(salatCache.locationName);
            setLoading(false);
        } else {
            (async () => {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    const lat = 36.8065;
                    const long = 10.1815;
                    const locName = "Tunis, Tunisie";
                    setLocationName(locName);
                    fetchPrayerTimes(lat, long, locName);
                    return;
                }

                try {
                    let location = await Location.getCurrentPositionAsync({});
                    const { latitude, longitude } = location.coords;

                    let reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
                    let currentLocName = "Tunisie";
                    if (reverseGeocode.length > 0) {
                        const place = reverseGeocode[0];
                        const city = place.city || place.region || "Ma Position";
                        const country = place.country || "Tunisie";
                        currentLocName = `${city}, ${country}`;
                    }
                    setLocationName(currentLocName);
                    fetchPrayerTimes(latitude, longitude, currentLocName);

                } catch (error) {
                    const lat = 36.8065;
                    const long = 10.1815;
                    const locName = "Tunis, Tunisie";
                    setLocationName(locName);
                    fetchPrayerTimes(lat, long, locName);
                }
            })();
        }

        const interval = setInterval(() => {
            if (prayerTimesData) {
                updateCountdown(new Date(), prayerTimesData);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [prayerTimesData]);

    const fetchPrayerTimes = async (lat: number, long: number, locName: string) => {
        try {
            const response = await fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${long}&method=3`);
            const data = await response.json();
            if (data.code === 200) {
                const timings = data.data.timings;
                const today = new Date().toISOString().split('T')[0];
                
                setPrayerTimesData(timings);
                dispatch(setPrayerTimes({
                    timings,
                    date: today,
                    location: locName
                }));
                setLoading(false);
            }
        } catch (error) {
            setLoading(false);
        }
    };

    const updateCountdown = (now: Date, timings: any) => {
        let nextPrayer = null;
        let nextPrayerTimeDate = null;

        for (const prayer of PRAYER_ORDER) {
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

    const nextPrayerName = PRAYER_ORDER[nextPrayerIndex] || 'Prière';

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color={PRIMARY_GREEN} />
            </View>
        );
    }

    return (
        <View style={styles.outerContainer}>
            <ImageBackground
                source={require('../../assets/images/mosque.jpg')}
                style={styles.container}
                imageStyle={{ borderRadius: 16 }}
            >
                <LinearGradient
                    colors={['rgba(30, 66, 32, 0.85)', 'rgba(44, 95, 45, 0.75)', 'rgba(28, 58, 29, 0.85)']}
                    style={StyleSheet.absoluteFill}
                />
                {/* Header: Location and Next Prayer */}
                <View style={styles.header}>
                    <View style={styles.locationBadge}>
                        <Ionicons name="location-sharp" size={12} color={GOLD_ACCENT} />
                        <Text style={styles.locationText} numberOfLines={1}>{locationName}</Text>
                    </View>
                    <Text style={styles.nextPrayerLabel}>{nextPrayerName} dans</Text>
                </View>

                {/* Countdown */}
                <View style={styles.countdownContainer}>
                    <View style={styles.timeBox}>
                        <Text style={styles.timeValue}>{timeLeft.hours}</Text>
                        <Text style={styles.timeLabel}>HRS</Text>
                    </View>
                    <Text style={styles.timeSeparator}>:</Text>
                    <View style={styles.timeBox}>
                        <Text style={styles.timeValue}>{timeLeft.minutes}</Text>
                        <Text style={styles.timeLabel}>MIN</Text>
                    </View>
                    <Text style={styles.timeSeparator}>:</Text>
                    <View style={styles.timeBox}>
                        <Text style={styles.timeValue}>{timeLeft.seconds}</Text>
                        <Text style={styles.timeLabel}>SEC</Text>
                    </View>
                </View>

                {/* Decorative Mosque Icon */}
                <View style={[styles.mosqueContainer, { left: width / 2 - 40 }]}>
                    <FontAwesome5 name="mosque" size={60} color="rgba(255,255,255,0.1)" />
                </View>
            </ImageBackground>

            {/* Date Strip */}
            <View style={[styles.dateStrip, { backgroundColor: colors.surface }]}>
                <TouchableOpacity>
                    <Ionicons name="chevron-back" size={18} color={isDarkMode ? "#fff" : "#666"} />
                </TouchableOpacity>
                <View style={styles.dateTextContainer}>
                    <Text style={[styles.dateTextGregorian, { color: colors.text }]}>{getGregorianDateStr(new Date())}</Text>
                    <Text style={[styles.dateSeparator, { color: colors.divider }]}>•</Text>
                    <Text style={[styles.dateTextHijri, { color: colors.primary }]}>{hijriDate}</Text>
                </View>
                <TouchableOpacity>
                    <Ionicons name="share-social-outline" size={18} color={isDarkMode ? "#fff" : "#666"} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default PrayerTimerCard;

const styles = StyleSheet.create({
    outerContainer: {
        marginHorizontal: 15,
        marginVertical: 5,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    loadingContainer: {
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(44, 95, 45, 0.05)',
        borderRadius: 16,
        marginHorizontal: 15,
        marginVertical: 10,
    },
    container: {
        padding: 12,
        paddingBottom: 15,
        position: 'relative',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    locationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        maxWidth: '65%',
    },
    locationText: {
        color: '#fff',
        fontSize: 11,
        marginLeft: 5,
        fontWeight: '600',
    },
    nextPrayerLabel: {
        color: GOLD_ACCENT,
        fontSize: 13,
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    countdownContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    timeBox: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        width: 45,
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    timeValue: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    timeLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 8,
        fontWeight: 'bold',
        marginTop: 1,
    },
    timeSeparator: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 20,
        fontWeight: 'bold',
        marginHorizontal: 10,
        marginBottom: 10,
    },
    mosqueContainer: {
        position: 'absolute',
        bottom: -5,
        opacity: 0.4,
        zIndex: 1,
    },
    dateStrip: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    dateTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateTextGregorian: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    dateSeparator: {
        color: 'rgba(0,0,0,0.1)',
        marginHorizontal: 8,
    },
    dateTextHijri: {
        fontSize: 13,
        fontWeight: 'bold',
    },
});
