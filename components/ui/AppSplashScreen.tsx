import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const AppSplashScreen = () => {
    const fadeAnim = useRef(new Animated.Value(0)).current; 
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View style={[
                styles.logoContainer,
                { 
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }]
                }
            ]}>
                <Image 
                    source={require('../../assets/images/logText.jpg')} 
                    style={styles.logo}
                    resizeMode="contain"
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        width: width * 0.7,
        height: width * 0.7,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: '100%',
        height: '100%',
    },
});
