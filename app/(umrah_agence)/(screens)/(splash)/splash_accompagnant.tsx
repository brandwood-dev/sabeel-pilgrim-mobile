import React, { useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Animated,
    Dimensions,
    StatusBar,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function SplashAccompagnant() {
    const router = useRouter();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Start animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 20,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: true,
                })
            ),
            Animated.timing(progressAnim, {
                toValue: 1,
                duration: 2500,
                useNativeDriver: false,
            })
        ]).start();

        // Navigate directly to tracking as requested after a delay
        const timer = setTimeout(() => {
            router.replace('/(accampagnant)/map_tracking');
        }, 2800);

        return () => clearTimeout(timer);
    }, []);

    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const BLUE_THEME = '#102A43'; // Sleek premium deep blue/slate color for companions

    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#111111' : BLUE_THEME }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }]
                    }
                ]}
            >
                <View style={styles.iconContainer}>
                    <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                        <View style={styles.outerCircle} />
                    </Animated.View>

                    <View style={styles.innerIcon}>
                        <MaterialCommunityIcons name="account-group" size={60} color="#fff" />
                    </View>
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.title}>
                        Sabeel Family
                    </Text>
                    <Text style={styles.subtitle}>
                        Transition vers l'Espace Accompagnant
                    </Text>
                    <Text style={styles.description}>
                        Connexion au suivi en temps réel...
                    </Text>
                </View>

                <View style={styles.loaderContainer}>
                    <Animated.View
                        style={[
                            styles.loadingBar,
                            {
                                width: progressAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', '100%'],
                                })
                            }
                        ]}
                    />
                </View>
            </Animated.View>
            
            <View style={styles.footerContainer}>
                <Text style={styles.footerText}>Sabeel © 2026 • Design Premium</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 180,
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    outerCircle: {
        width: 180,
        height: 180,
        borderRadius: 90,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
        borderStyle: 'dashed',
    },
    innerIcon: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#fff',
        textAlign: 'center',
        letterSpacing: 4,
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginTop: 8,
        letterSpacing: 1.5,
    },
    description: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        marginTop: 6,
        fontStyle: 'italic',
    },
    loaderContainer: {
        width: width * 0.6,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 2,
        marginTop: 50,
        overflow: 'hidden',
    },
    loadingBar: {
        height: '100%',
        backgroundColor: '#D4AF37', // Beautiful golden accent color
        borderRadius: 2,
    },
    footerContainer: {
        position: 'absolute',
        bottom: 40,
        width: '100%',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 1,
    }
});
