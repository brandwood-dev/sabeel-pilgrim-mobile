import { Ionicons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemeColors } from '../../../../hooks/useThemeColors';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

interface BottomNavigationProps {
    activeTab?: string;
    transparent?: boolean;
}

interface TabItem {
    name: string;
    icon: string;
    route: string | null;
    isCenter?: boolean;
    iconLib?: 'ionicons' | 'fontawesome';
}

const Colors = {
    primary: '#4A7C59',
    secondary: '#d9ab83',
    gold: '#d9ab83',
    red: '#DB4437',
    white: '#FFFFFF',
    grey: '#999999',
    background: '#F2F2F2',
};

import { useTrans } from '../../../../hooks/useTrans';

export default function BottomNavigation({ activeTab = 'Accueil', transparent = false }: BottomNavigationProps) {
    const router = useRouter();
    const colors = useThemeColors();
    const { t } = useTrans();
    const unreadMessagesCount = useSelector((state: RootState) => state.ui.unreadMessagesCount);

    const tabs: (TabItem & { id: string })[] = [
        { id: 'Accueil', name: t('Accueil'), icon: 'home', route: '/(umrah_agence)/(screens)/acceuil' },
        { id: 'Umrah', name: t('Umrah'), icon: 'business', route: '/(umrah_agence)/(screens)/umrah' },
        { id: 'Aide', name: t('Aide'), icon: 'alert-circle', route: '/(umrah_agence)/(screens)/(sos)/sos', isCenter: true },
        { id: 'Messages', name: t('Messages'), icon: 'chatbubbles', route: '/(umrah_agence)/(screens)/(chat)/chat_acceuil' },
        { id: 'Profil', name: t('Profil'), icon: 'person', route: '/(umrah_agence)/(screens)/profile/profile' },
    ];

    const getIconName = (id: string, focused: boolean): any => {
        switch (id) {
            case 'Accueil': return focused ? 'home' : 'home-outline';
            case 'Messages': return focused ? 'chatbubbles' : 'chatbubbles-outline';
            case 'Aide': return focused ? 'alert-circle' : 'alert-circle-outline';
            case 'Umrah': return focused ? 'business' : 'business-outline';
            case 'Profil': return focused ? 'person' : 'person-outline';
            default: return 'help-circle';
        }
    };

    const handlePress = (tab: typeof tabs[0]) => {
        if (tab.route) {
            router.replace(tab.route as any);
        }
    };

    return (
        <View style={styles.container}>
            <View style={[
                styles.tabBar,
                { 
                    backgroundColor: transparent ? 'transparent' : colors.surface,
                    flexDirection: 'row' // Always LTR for icons as requested
                },
                transparent && { elevation: 0, shadowOpacity: 0, borderTopWidth: 0 }
            ]}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id || activeTab === tab.name;

                    if (tab.isCenter) {
                        return (
                            <TouchableOpacity
                                key={tab.id}
                                style={styles.centerIconContainerWrapper}
                                onPress={() => handlePress(tab)}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={isActive ? ['#DB4437', '#ff6b6b'] : [colors.accent, colors.accent]}
                                    style={[
                                        styles.gradientContainer,
                                        { borderColor: colors.background },
                                        isActive && styles.gradientContainerActive,
                                        isActive && { shadowColor: '#DB4437' }
                                    ]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Image
                                        source={require('@/assets/images/sos.jpg')}
                                        style={styles.sosIcon}
                                        resizeMode="contain"
                                    />
                                </LinearGradient>
                                <Text style={[
                                    styles.centerTabLabel,
                                    { color: isActive ? '#DB4437' : colors.accent }
                                ]}>
                                    {tab.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    }

                    return (
                        <TouchableOpacity
                            key={tab.id}
                            style={styles.tabItem}
                            onPress={() => handlePress(tab)}
                            activeOpacity={0.6}
                        >
                            <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
                                {tab.id === 'Accueil' ? (
                                    <Image
                                        source={require('@/assets/images/acceuil.jpg')}
                                        style={[
                                            styles.accueilIcon,
                                            { tintColor: isActive ? colors.primary : colors.textLight }
                                        ]}
                                        resizeMode="contain"
                                    />
                                ) : tab.id === 'Umrah' ? (
                                    <Image
                                        source={require('@/assets/images/kaba.png')}
                                        style={[
                                            styles.umrahIcon,
                                            { tintColor: isActive ? colors.primary : colors.textLight }
                                        ]}
                                        resizeMode="contain"
                                    />
                                ) : tab.id === 'Messages' ? (
                                    <>
                                        <Ionicons
                                            name={getIconName(tab.id, isActive)}
                                            size={24}
                                            color={isActive ? colors.primary : colors.textLight}
                                        />
                                        {unreadMessagesCount > 0 ? (
                                            <View style={[styles.messagesBadge, { backgroundColor: colors.primary }]}>
                                                <Text style={styles.messagesBadgeText} numberOfLines={1}>
                                                    {unreadMessagesCount > 99 ? '99+' : String(unreadMessagesCount)}
                                                </Text>
                                            </View>
                                        ) : null}
                                    </>
                                ) : (
                                    <Ionicons
                                        name={getIconName(tab.id, isActive)}
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
    customIcon: {
        width: 32,
        height: 32,
    },
    messageIcon: {
        width: 22,
        height: 22,
    },
    umrahIcon: {
        width: 24,
        height: 24,
    },
    accueilIcon: {
        width: 28,
        height: 28,
    },
    agenceIcon: {
        width: 36,
        height: 36,
    },
    customIconActive: {
        opacity: 1,
    },
    sosIcon: {
        width: 30,
        height: 30,
        tintColor: '#FFFFFF',
    },
    messagesBadge: {
        position: 'absolute',
        top: -4,
        right: -6,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    messagesBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
    },
});
