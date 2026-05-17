import { useThemeColors } from '@/hooks/useThemeColors';
import { RootState } from '@/store/store';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');
const COMPASS_SIZE = width * 0.85;

// Constants for Kaaba
const KAABA_LAT = 21.422487;
const KAABA_LNG = 39.826206;

export default function QiblaScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [heading, setHeading] = useState<number>(0);
    const [qiblaDir, setQiblaDir] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [cityName, setCityName] = useState<string>('Localisation...');

    // Animation values
    const spinAnim = useRef(new Animated.Value(0)).current;
    const lastHeading = useRef<number>(0);
    const [animatedHeading, setAnimatedHeading] = useState<number>(0);

    useEffect(() => {
        (async () => {
            // Request permissions
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission d\'accès à la localisation refusée');
                setLoading(false);
                return;
            }

            // Get initial location
            try {
                let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                setLocation(loc);

                // Reverse geocode
                let reverse = await Location.reverseGeocodeAsync({
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude
                });
                if (reverse.length > 0) {
                    setCityName(`${reverse[0].city || 'Mecca'}, ${reverse[0].country || 'Saudi Arabia'}`);
                }

                // Calculate Qibla
                const qDir = calculateQibla(loc.coords.latitude, loc.coords.longitude);
                setQiblaDir(qDir);

                // Start watching heading
                await Location.watchHeadingAsync((headingData) => {
                    let newHeading = headingData.magHeading;

                    // Shortest path interpolation logic
                    let diff = newHeading - (lastHeading.current % 360);
                    if (diff > 180) diff -= 360;
                    if (diff < -180) diff += 360;

                    const targetHeading = lastHeading.current + diff;
                    lastHeading.current = targetHeading;

                    setHeading(newHeading);
                    setAnimatedHeading(targetHeading);
                });

                setLoading(false);
            } catch (error) {
                console.error(error);
                setErrorMsg('Erreur lors du chargement de la boussole');
                setLoading(false);
            }
        })();
    }, []);

    // Formula for Qibla calculation
    const calculateQibla = (lat: number, lng: number) => {
        const phiK = (KAABA_LAT * Math.PI) / 180.0;
        const lambdaK = (KAABA_LNG * Math.PI) / 180.0;
        const phi = (lat * Math.PI) / 180.0;
        const lambda = (lng * Math.PI) / 180.0;

        const qibla = Math.atan2(
            Math.sin(lambdaK - lambda),
            Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda)
        );

        let finalAngle = (qibla * 180.0) / Math.PI;
        // Normalize to 0-360
        finalAngle = (finalAngle + 360) % 360;
        return finalAngle;
    };

    // Update animation when heading changes
    useEffect(() => {
        Animated.spring(spinAnim, {
            toValue: -animatedHeading,
            useNativeDriver: true,
            friction: 10,
            tension: 20,
        }).start();
    }, [animatedHeading]);

    const spin = spinAnim.interpolate({
        inputRange: [-10000, 10000],
        outputRange: ['-10000deg', '10000deg'],
    });

    const qiblaRotation = spinAnim.interpolate({
        inputRange: [-10000, 10000],
        outputRange: [`${qiblaDir - 10000}deg`, `${qiblaDir + 10000}deg`],
    });

    // Determine current facing status with 5 degree tolerance
    const angleDiff = Math.abs((heading % 360) - (qiblaDir % 360));
    const isFacingQibla = angleDiff < 5 || angleDiff > 355;

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Initialisation de la boussole...</Text>
            </View>
        );
    }

    if (errorMsg) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <Ionicons name="alert-circle" size={64} color="#FF5252" />
                <Text style={[styles.errorText, { color: colors.text }]}>{errorMsg}</Text>
                <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
                    <Text style={styles.retryText}>Retour</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Qibla</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Location Info */}
            <View style={styles.locationContainer}>
                <View style={styles.cityBadge}>
                    <Ionicons name="location" size={16} color={colors.primary} />
                    <Text style={[styles.cityName, { color: colors.text }]}>{cityName}</Text>
                </View>
                <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                    Tenez votre téléphone à plat pour plus de précision
                </Text>
            </View>

            {/* Compass Container */}
            <View style={styles.compassWrapper}>
                <View style={[styles.statusFeedback, { opacity: isFacingQibla ? 1 : 0 }]}>
                    <LinearGradient
                        colors={[isDarkMode ? '#2C5F2D' : '#4CAF50', 'transparent']}
                        style={styles.glow}
                    />
                </View>

                {/* Static Ring */}
                <View style={[styles.outerRing, { borderColor: colors.divider, backgroundColor: colors.surface }]}>
                    {/* Direction N, E, S, W */}
                    <Text style={[styles.dirText, { top: 10, color: '#FF5252', fontWeight: 'bold' }]}>N</Text>
                    <Text style={[styles.dirText, { bottom: 10, color: colors.textSecondary }]}>S</Text>
                    <Text style={[styles.dirText, { right: 10, color: colors.textSecondary }]}>E</Text>
                    <Text style={[styles.dirText, { left: 10, color: colors.textSecondary }]}>W</Text>
                </View>

                {/* Rotating Compass Body */}
                <Animated.View style={[styles.compassBody, { transform: [{ rotate: spin }] }]}>
                    <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} viewBox="0 0 100 100">
                        {/* Compass Markings */}
                        {[...Array(72)].map((_, i) => (
                            <Line
                                key={i}
                                x1="50"
                                y1="5"
                                x2="50"
                                y2={i % 2 === 0 ? "10" : "8"}
                                stroke={i % 18 === 0 ? (isDarkMode ? '#fff' : '#333') : (isDarkMode ? '#555' : '#ccc')}
                                strokeWidth={i % 18 === 0 ? "1.5" : "0.5"}
                                transform={`rotate(${i * 5}, 50, 50)`}
                            />
                        ))}

                        {/* Degrees Labels */}
                        {[0, 90, 180, 270].map((deg, i) => (
                            <SvgText
                                key={deg}
                                x="50"
                                y="18"
                                fill={isDarkMode ? '#888' : '#999'}
                                fontSize="4"
                                textAnchor="middle"
                                transform={`rotate(${deg}, 50, 50)`}
                            >
                                {deg}°
                            </SvgText>
                        ))}

                        {/* Center Circle Decor */}
                        <Circle cx="50" cy="50" r="2" fill={colors.primary} />
                    </Svg>
                </Animated.View>

                {/* Qibla Needle (always pointing to Kaaba) */}
                <Animated.View style={[styles.needleWrapper, { transform: [{ rotate: qiblaRotation }] }]}>
                    <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} viewBox="0 0 100 100">
                        <Path
                            d="M50 15 L55 45 L50 40 L45 45 Z"
                            fill={colors.primary}
                        />
                        {/* Kaaba Icon at the tip */}
                        <G transform="translate(43, 18) scale(0.6)">
                            <Path
                                d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"
                                fill={isFacingQibla ? '#fff' : 'transparent'}
                            />
                        </G>
                    </Svg>
                </Animated.View>

                {/* Static Fixed Indicator (Top) */}
                <View style={styles.fixedIndicator}>
                    <View style={[styles.triangle, { borderBottomColor: colors.primary }]} />
                </View>
            </View>

            {/* Results Info */}
            <View style={styles.resultContainer}>
                <View style={[styles.resultCard, { backgroundColor: colors.surface }]}>
                    <View style={styles.resultItem}>
                        <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Direction Qibla</Text>
                        <Text style={[styles.resultValue, { color: colors.primary }]}>{Math.round(qiblaDir)}°</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                    <View style={styles.resultItem}>
                        <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Votre Orientation</Text>
                        <Text style={[styles.resultValue, { color: colors.text }]}>{Math.round(heading)}°</Text>
                    </View>
                </View>

                <View style={[styles.statusBanner, { backgroundColor: isFacingQibla ? 'rgba(44, 95, 45, 0.1)' : 'transparent', borderColor: isFacingQibla ? '#2C5F2D' : 'transparent' }]}>
                    {isFacingQibla ? (
                        <>
                            <MaterialCommunityIcons name="check-decagram" size={24} color="#2C5F2D" />
                            <Text style={[styles.statusText, { color: '#2C5F2D' }]}>Vous êtes face à la Kaaba</Text>
                        </>
                    ) : (
                        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                            Tournez pour aligner la flèche
                        </Text>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    locationContainer: {
        alignItems: 'center',
        marginTop: 10,
        paddingHorizontal: 30,
    },
    cityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: 'rgba(44, 95, 45, 0.05)',
        marginBottom: 8,
    },
    cityName: {
        marginLeft: 6,
        fontSize: 14,
        fontWeight: '600',
    },
    hintText: {
        fontSize: 12,
        textAlign: 'center',
    },
    compassWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    statusFeedback: {
        position: 'absolute',
        width: COMPASS_SIZE + 40,
        height: COMPASS_SIZE + 40,
        borderRadius: (COMPASS_SIZE + 40) / 2,
        overflow: 'hidden',
        alignItems: 'center',
        top: '50%',
        marginTop: -(COMPASS_SIZE + 40) / 2,
    },
    glow: {
        width: '100%',
        height: '50%',
    },
    outerRing: {
        width: COMPASS_SIZE + 20,
        height: COMPASS_SIZE + 20,
        borderRadius: (COMPASS_SIZE + 20) / 2,
        borderWidth: 1,
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    dirText: {
        position: 'absolute',
        fontSize: 14,
    },
    compassBody: {
        width: COMPASS_SIZE,
        height: COMPASS_SIZE,
    },
    needleWrapper: {
        position: 'absolute',
        width: COMPASS_SIZE,
        height: COMPASS_SIZE,
    },
    fixedIndicator: {
        position: 'absolute',
        top: '50%',
        marginTop: -(COMPASS_SIZE / 2) - 15,
        alignItems: 'center',
    },
    triangle: {
        width: 0,
        height: 0,
        backgroundColor: "transparent",
        borderStyle: "solid",
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 15,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
    },
    resultContainer: {
        paddingHorizontal: 20,
        paddingBottom: 50,
        alignItems: 'center',
    },
    resultCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 30,
        width: '100%',
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    resultItem: {
        flex: 1,
        alignItems: 'center',
    },
    resultLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    resultValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    divider: {
        width: 1,
        height: '100%',
        backgroundColor: '#eee',
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'transparent',
        gap: 8,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    loadingText: {
        marginTop: 15,
        textAlign: 'center',
    },
    errorText: {
        marginTop: 15,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
    },
    retryText: {
        color: '#fff',
        fontWeight: 'bold',
    }
});
