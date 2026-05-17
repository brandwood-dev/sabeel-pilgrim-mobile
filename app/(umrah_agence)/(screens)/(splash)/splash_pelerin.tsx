import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

const { width, height } = Dimensions.get('window');

export default function SplashPelerin() {
    const router = useRouter();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const textAnim = useRef(new Animated.Value(20)).current;

    const PRIMARY = '#B8860B'; // Gold/Traditional for Pilgrim space
    const SECONDARY = '#2C5F2D'; // Green

    useEffect(() => {
        // Run animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.timing(textAnim, {
                toValue: 0,
                duration: 800,
                delay: 200,
                useNativeDriver: true,
            })
        ]).start();

        // Navigate back to Pilgrim home after 3 seconds
        const timer = setTimeout(() => {
            router.replace('/(umrah_agence)/(screens)/acceuil');
        }, 3200);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <LinearGradient
                colors={isDarkMode ? ['#000000', '#1a1a1a'] : [PRIMARY, SECONDARY]}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <Animated.View style={[
                styles.content,
                {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }]
                }
            ]}>
                <View style={styles.iconCircle}>
                    <Ionicons name="moon" size={80} color="#fff" />
                    <View style={styles.badge}>
                        <Ionicons name="checkmark-circle" size={24} color={PRIMARY} />
                    </View>
                </View>

                <Animated.View style={{ transform: [{ translateY: textAnim }] }}>
                    <Text style={styles.title}>Sabeel</Text>
                    <Text style={styles.subtitle}>Espace Pèlerin</Text>
                    <View style={styles.divider} />
                    <Text style={styles.loadingText}>Retour à votre voyage spirituel...</Text>
                </Animated.View>
            </Animated.View>

            <View style={styles.bottomInfo}>
                <Text style={styles.footerText}>Sabeel © 2026 • Votre compagnon de voyage</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    gradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    content: {
        alignItems: 'center',
    },
    iconCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    badge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#fff',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    title: {
        fontSize: 34,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        marginTop: 5,
        textTransform: 'uppercase',
        letterSpacing: 4,
    },
    divider: {
        width: 40,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 2,
        alignSelf: 'center',
        marginVertical: 20,
    },
    loadingText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    bottomInfo: {
        position: 'absolute',
        bottom: 40,
        width: '100%',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 1,
    }
});
