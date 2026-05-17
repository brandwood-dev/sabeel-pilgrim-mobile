import { Ionicons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

interface BottomNavigationProps {
    activeTab: string;
}

interface TabItem {
    name: string;
    icon: string;
    route: string;
    isCenter?: boolean;
    iconLib?: 'ionicons' | 'fontawesome';
}

const Colors = {
    primary: '#2C5F2D',
    secondary: '#d9ab83',
    gold: '#d9ab83',
    red: '#DB4437',
    white: '#FFFFFF',
    grey: '#999999',
    background: '#FFFFFF',
};

export default function BottomNavigation({ activeTab }: BottomNavigationProps) {
    const router = useRouter();
    const colors = useThemeColors();
    const isBottomNavVisible = useSelector((state: RootState) => state.ui.isBottomNavVisible);

    const posAnim = React.useRef(new Animated.Value(0)).current; // 0 visible, 1 hidden

    React.useEffect(() => {
        Animated.spring(posAnim, {
            toValue: isBottomNavVisible ? 0 : 1,
            useNativeDriver: true,
            tension: 40,
            friction: 8,
        }).start();
    }, [isBottomNavVisible, posAnim]);

    const tabs: TabItem[] = [
        { name: 'Accueil', icon: 'home', route: '/(accampagnant)/home' },
        { name: 'Alertes', icon: 'bell', route: '/(accampagnant)/notifications', iconLib: 'fontawesome' },
        { name: 'Suivi', icon: 'map-marked-alt', route: '/(accampagnant)/map_tracking', isCenter: true },
        { name: 'Messages', icon: 'comments', route: '/(accampagnant)/messagerie' },
        { name: 'Profil', icon: 'user-circle', route: '/(accampagnant)/profile' },
    ];

    const getIconName = (name: string, focused: boolean): any => {
        switch (name) {
            case 'Accueil': return focused ? 'home' : 'home-outline';
            case 'Suivi': return focused ? 'map' : 'map-outline';
            case 'Alertes': return focused ? 'notifications' : 'notifications-outline';
            case 'Messages': return focused ? 'chatbubbles' : 'chatbubbles-outline';
            case 'Profil': return focused ? 'person-circle' : 'person-circle-outline';
            default: return 'help-circle';
        }
    };

    const handlePress = (tab: TabItem) => {
        if (tab.route) {
            router.push(tab.route as any);
        }
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: posAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                    transform: [
                        {
                            translateY: posAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 90] }),
                        },
                    ],
                },
            ]}
            pointerEvents={isBottomNavVisible ? 'auto' : 'none'}
        >
            <View style={styles.container}>
                <View style={[
                    styles.tabBar,
                    { backgroundColor: colors.surface }
                ]}>
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.name;

                        if (tab.isCenter) {
                            return (
                                <TouchableOpacity
                                    key={tab.name}
                                    style={styles.centerIconContainerWrapper}
                                    onPress={() => handlePress(tab)}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={isActive ? ['#2C5F2D', '#4A7C59'] : [colors.accent, colors.accent]}
                                        style={[
                                            styles.gradientContainer,
                                            { borderColor: colors.background },
                                            isActive && styles.gradientContainerActive,
                                            isActive && { shadowColor: '#2C5F2D' },
                                        ]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        <FontAwesome5
                                            name={tab.icon}
                                            size={24}
                                            color="#FFFFFF"
                                        />
                                    </LinearGradient>
                                    <Text
                                        style={[
                                            styles.centerTabLabel,
                                            { color: isActive ? '#2C5F2D' : colors.accent },
                                        ]}
                                    >
                                        {tab.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        }

                        return (
                            <TouchableOpacity
                                key={tab.name}
                                style={styles.tabItem}
                                onPress={() => handlePress(tab)}
                                activeOpacity={0.6}
                            >
                                <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
                                    {tab.iconLib === 'fontawesome' ? (
                                        <FontAwesome5
                                            name={tab.icon as any}
                                            size={20}
                                            color={isActive ? colors.primary : colors.textLight}
                                        />
                                    ) : (
                                        <Ionicons
                                            name={getIconName(tab.name, isActive)}
                                            size={24}
                                            color={isActive ? colors.primary : colors.textLight}
                                        />
                                    )}
                                </View>
                                <Text style={[styles.tabLabel, { color: isActive ? colors.primary : colors.textLight }]}>
                                    {tab.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create<any>({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    tabBar: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 25,
        left: 20,
        right: 20,
        height: 70,
        borderRadius: 25,
        justifyContent: 'space-around',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    tabItem: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 70,
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: 'transparent',
    },
    iconContainerActive: {
        backgroundColor: Platform.OS === 'ios' ? '#F0F0F0' : 'transparent',
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2,
        letterSpacing: 0.3,
        marginBottom: 5,
    },
    centerIconContainerWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 45,
        height: 100,
        width: 70,
        zIndex: 10,
    },
    gradientContainer: {
        width: 58,
        height: 58,
        borderRadius: 29,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        elevation: 10,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
    gradientContainerActive: {
        transform: [{ scale: 1.1 }],
    },
    centerTabLabel: {
        fontSize: 10,
        fontWeight: '700',
        marginTop: 4,
        letterSpacing: 0.3,
        position: 'absolute',
        bottom: 5,
    },
});
