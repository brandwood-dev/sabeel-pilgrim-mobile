import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, ViewStyle } from 'react-native';

interface GreenDotsLoaderProps {
    fullScreen?: boolean;
    overlay?: boolean;
    size?: number;
    color?: string;
    style?: ViewStyle;
}

const DEFAULT_COLOR = '#2E7D32';

export default function GreenDotsLoader({
    fullScreen = false,
    overlay = false,
    size = 12,
    color = DEFAULT_COLOR,
    style,
}: GreenDotsLoaderProps) {
    const firstDot = useRef(new Animated.Value(0.35)).current;
    const secondDot = useRef(new Animated.Value(0.35)).current;
    const thirdDot = useRef(new Animated.Value(0.35)).current;
    const animations = useMemo(() => [firstDot, secondDot, thirdDot], [firstDot, secondDot, thirdDot]);

    useEffect(() => {
        const loops = animations.map((animation, index) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(index * 180),
                    Animated.timing(animation, {
                        toValue: 1,
                        duration: 320,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(animation, {
                        toValue: 0.35,
                        duration: 320,
                        easing: Easing.in(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.delay(220),
                ]),
            ),
        );

        loops.forEach((loop) => loop.start());

        return () => {
            loops.forEach((loop) => loop.stop());
        };
    }, [animations]);

    const containerStyles = useMemo(
        () => [
            styles.container,
            fullScreen && styles.fullScreen,
            overlay && styles.overlay,
            style,
        ],
        [fullScreen, overlay, style],
    );

    return (
        <View style={containerStyles} pointerEvents={overlay ? 'auto' : 'box-none'}>
            <View style={styles.dotsRow}>
                {animations.map((animation, index) => (
                    <Animated.View
                        key={index}
                        style={[
                            styles.dot,
                            index > 0 ? styles.dotSpacing : null,
                            {
                                width: size,
                                height: size,
                                borderRadius: size / 2,
                                backgroundColor: color,
                                opacity: animation,
                                transform: [
                                    {
                                        scale: animation.interpolate({
                                            inputRange: [0.35, 1],
                                            outputRange: [0.82, 1.18],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    fullScreen: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
    },
    dotsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dot: {},
    dotSpacing: {
        marginLeft: 10,
    },
});
