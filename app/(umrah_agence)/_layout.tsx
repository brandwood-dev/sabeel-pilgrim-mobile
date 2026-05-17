import { Stack, useSegments } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import BottomNavigation from './(screens)/(navigation)/bottom_navigation';
import { DrawerLayout } from 'react-native-gesture-handler';
import CustomDrawer from './(screens)/(navigation)/drower';
import { DrawerProvider, useDrawer } from '@/context/DrawerContext';
import { BlurView } from 'expo-blur';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

import { useTrans } from '../../hooks/useTrans';

export default function AgenceLayout() {
    return (
        <DrawerProvider>
            <AgenceLayoutContent />
        </DrawerProvider>
    );
}

function AgenceLayoutContent() {
    const segments = useSegments();
    const { drawerRef, isDrawerOpen, setIsDrawerOpen, closeDrawer } = useDrawer();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const { t, language } = useTrans();
    const isRTL = language === 'ar';

    const path = segments.slice(1).join('/');
    const tabMap: Record<string, string> = {
        '(screens)/acceuil': 'Accueil',
        '(screens)/(chat)/chat_acceuil': 'Messages',
        '(screens)/(sos)/sos': 'Aide',
        '(screens)/umrah': 'Umrah',
        '(screens)/profile/profile': 'Profil',
    };

    const isBottomNavVisible = useSelector((state: RootState) => state.ui.isBottomNavVisible);

    const activeTab = tabMap[path];
    const navShouldShow = !!activeTab;
    const shouldRenderBottomNav = navShouldShow;
    const navAnim = React.useRef(new Animated.Value(1)).current;

    React.useEffect(() => {
        Animated.spring(navAnim, {
            toValue: (shouldRenderBottomNav && isBottomNavVisible) ? 1 : 0,
            useNativeDriver: true,
            tension: 40,
            friction: 8,
        }).start();
    }, [shouldRenderBottomNav, isBottomNavVisible]);

    // Automatically close the drawer and prevent it from appearing on sub-pages
    React.useEffect(() => {
        // If we move away from a main tab, force the drawer to close physically
        if (!navShouldShow) {
            drawerRef.current?.closeDrawer();
            if (isDrawerOpen) {
                setIsDrawerOpen(false);
            }
        }
    }, [path, navShouldShow]);

    // Ensure it starts closed on mount
    React.useEffect(() => {
       drawerRef.current?.closeDrawer();
       setIsDrawerOpen(false);
    }, []);

    return (
        <DrawerLayout
            ref={drawerRef}
            drawerWidth={navShouldShow ? 320 : 0.1} // Physically minimize width to 0.1 on subpages to avoid any phantom display
            drawerPosition={isRTL ? "right" : "left"}
            drawerType="front"
            drawerBackgroundColor="transparent"
            enableTrackpadTwoFingerGesture={false}
            drawerLockMode={navShouldShow ? 'unlocked' : 'locked-closed'} // Unlock on tabs for swipe, lock elsewhere
            edgeWidth={navShouldShow ? 24 : 0}
            renderNavigationView={() => (
                navShouldShow ? (
                    <View style={styles.drawerWrapper}>
                        <CustomDrawer navigation={{ closeDrawer }} />
                    </View>
                ) : (
                    <View />
                )
            )}
            onDrawerSlide={(status) => {
                // Keep the blur state in sync with the physical slide
                if (status > 0.01 && !isDrawerOpen) setIsDrawerOpen(true);
                if (status <= 0.01 && isDrawerOpen) setIsDrawerOpen(false);
            }}
            onDrawerOpen={() => {
                // Only ALLOW state update if we are on a top-level tab
                if (navShouldShow) {
                   setIsDrawerOpen(true);
                } else {
                   drawerRef.current?.closeDrawer();
                }
            }}
            onDrawerClose={() => setIsDrawerOpen(false)}
        >
            <View style={styles.container}>
                <View style={styles.content}>
                    <Stack screenOptions={{
                        headerShown: false,
                        animation: 'none'
                    }} />
                </View>

                {shouldRenderBottomNav && (
                    <Animated.View 
                        style={[
                            styles.navContainer,
                            {
                                opacity: navAnim,
                                transform: [{
                                    translateY: navAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [100, 0]
                                    })
                                }]
                            }
                        ]}
                    >
                        <BottomNavigation activeTab={t(activeTab) as any} />
                    </Animated.View>
                )}

                {/* The blur view only appears when isDrawerOpen is true and we ARE on a nav page */}
                {isDrawerOpen && navShouldShow && (
                    <BlurView
                        intensity={20}
                        tint={isDarkMode ? 'dark' : 'light'}
                        style={StyleSheet.absoluteFill}
                    />
                )}
            </View>
        </DrawerLayout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    drawerWrapper: {
        flex: 1,
        marginVertical: 10,
    },
    content: {
        flex: 1,
    },
    navContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100, // Adjusted to accommodate the floating nav design
        pointerEvents: 'box-none',
    },
});
