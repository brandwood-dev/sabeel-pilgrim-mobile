import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DrawerItem } from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image } from 'expo-image';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

interface MenuItem {
    label: string;
    icon: string;
    onPress: () => void;
    isIonicon?: boolean;
}
import { RootState } from '../../../../store/store';
import { toggleTheme } from '../../../../store/themeSlice';
import { useTrans } from '../../../../hooks/useTrans';
import { useThemeColors } from '../../../../hooks/useThemeColors';

const PRIMARY_COLOR = '#2C5F2D';
const SECONDARY_COLOR = '#4A7C59';
const ACCENT_COLOR = '#d9ab83';
const TERRACOTTA = '#E2725B';
const BACKGROUND_COLOR = '#f8f7f2'; // Match home page background
const TEXT_LIGHT = '#666';
const DIVIDER_COLOR = '#E8E6D0';

export default function CustomDrawer(props: any) {
    const router = useRouter();
    const dispatch = useDispatch();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const { language } = useTrans();
    const isRTL = language === 'ar';
    const toggleDarkMode = () => dispatch(toggleTheme());

    return (
        <LinearGradient
            colors={isDarkMode ? ['#121212', '#1a1a1a', '#1e1e1e'] : ['#f8f7f2', '#f5f4e8', '#f2f1e0']}
            style={[
                styles.container,
                isRTL ? styles.containerRTL : styles.containerLTR,
            ]}
        >
            <View style={styles.scrollContent}>

                {/* Header Section */}
                <HeaderSection router={router} props={props} />

                {/* Navigation Sections */}
                <GeneralSection router={router} props={props} />
                <AppearanceSection isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

            </View>
        </LinearGradient>
    );
}

// ============ COMPONENTS ============

function HeaderSection({ router, props }: any) {
    const { t, language } = useTrans();
    const isRTL = language === 'ar';
    const user = useSelector((state: RootState) => state.auth.user);
    const firstName = user?.firstName || t('Pèlerin');
    const lastName = user?.lastName || '';
    const fullName = user ? `${firstName} ${lastName}`.trim() : t('Pèlerin');
    const fallbackAvatar = `https://api.dicebear.com/7.x/initials/png?seed=${firstName}+${lastName}&backgroundColor=2C5F2D&textColor=ffffff`;
    const avatarUri = user?.photo ? user.photo : fallbackAvatar;

    const handleProfilePress = () => {
        if (props.navigation?.closeDrawer) {
            props.navigation.closeDrawer();
        }
        router.push('/(umrah_agence)/(screens)/profile/profile');
    };

    return (
        <TouchableOpacity
            style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            onPress={handleProfilePress}
            activeOpacity={0.8}
        >
            <View style={[styles.avatarContainer, { marginRight: isRTL ? 0 : 16, marginLeft: isRTL ? 16 : 0 }]}>
                <Image
                    source={{ uri: avatarUri }}
                    style={styles.avatarImage}
                    contentFit="cover"
                    cachePolicy="disk"
                />
            </View>
            <View style={[styles.headerContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                <Text style={[styles.userName, { textAlign: isRTL ? 'right' : 'left' }]}>{fullName}</Text>
                <Text style={[styles.userRole, { textAlign: isRTL ? 'right' : 'left' }]}>{t('Connecté')}</Text>
            </View>
        </TouchableOpacity>
    );
}


function GeneralSection({ router, props }: any) {
    const { t, language } = useTrans();
    const isRTL = language === 'ar';

    const handleNavigation = (path: string) => {
        if (props.navigation?.closeDrawer) {
            props.navigation.closeDrawer();
        }
        router.push(path as any);
    };

    const menuItems: MenuItem[] = [
        {
            label: t('Accueil'),
            icon: 'home',
            isIonicon: false,
            onPress: () => handleNavigation('/(umrah_agence)/(screens)/acceuil'),
        },
        {
            label: t('Suivi Réservation'),
            icon: 'box-open',
            isIonicon: false,
            onPress: () => handleNavigation('/(umrah_agence)/(screens)/(pack_umrah)/suivi_reservation'),
        },
        {
            label: t('Planning Umrah'),
            icon: 'calendar-alt',
            isIonicon: false,
            onPress: () => handleNavigation('/(umrah_agence)/(screens)/(planning_umrah)/planning'),
        },
        {
            label: t('Spirituelle'),
            icon: 'mosque',
            isIonicon: false,
            onPress: () => handleNavigation('/(umrah_agence)/(screens)/(spirituel)/spirituelle'),
        },
    ];

    const colors = useThemeColors();
    return (
        <Section title={t("Général")}>
            {menuItems.map((item, index) => (
                <TouchableOpacity
                    key={index}
                    onPress={item.onPress}
                    style={[
                        styles.customDrawerItem,
                        { flexDirection: isRTL ? 'row-reverse' : 'row' }
                    ]}
                >
                    <View style={styles.iconBox}>
                        {item.isIonicon ? (
                            <Ionicons
                                name={item.icon as any}
                                size={18}
                                color={colors.primary}
                            />
                        ) : (
                            <FontAwesome5
                                name={item.icon as any}
                                size={18}
                                color={colors.primary}
                            />
                        )}
                    </View>
                    <Text 
                        style={[
                            styles.customLabel, 
                            { 
                                textAlign: isRTL ? 'right' : 'left', 
                                color: colors.text
                            }
                        ]}
                    >
                        {item.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </Section>
    );
}

function AppearanceSection({ isDarkMode, toggleDarkMode }: any) {
    const { t, language } = useTrans();
    const isRTL = language === 'ar';
    const colors = useThemeColors();

    return (
        <View style={styles.appearanceContainer}>
            <View style={[styles.switchRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.switchLabelContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Ionicons name="moon" size={18} color={colors.textLight} />
                    <Text style={[styles.switchLabel, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}>{t('Mode Sombre')}</Text>
                </View>
                <Switch
                    trackColor={{ false: '#D1D1D1', true: ACCENT_COLOR }}
                    thumbColor={isDarkMode ? PRIMARY_COLOR : '#f4f3f4'}
                    ios_backgroundColor="#D1D1D1"
                    onValueChange={toggleDarkMode}
                    value={isDarkMode}
                    style={{ transform: [{ scale: 0.85 }] }}
                />
            </View>
        </View>
    );
}

function Section({ title, children }: any) {
    const { language } = useTrans();
    const isRTL = language === 'ar';
    return (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
            <View style={styles.sectionContent}>
                {children}
            </View>
        </View>
    );
}

function FooterSection() {
    return null;
}

// ============ STYLES ============

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
    },
    containerLTR: {
        borderTopRightRadius: 22,
        borderBottomRightRadius: 22,
    },
    containerRTL: {
        borderTopLeftRadius: 22,
        borderBottomLeftRadius: 22,
    },
    scrollContent: {
        paddingTop: 10,
        paddingBottom: 5,
    },

    // Header Styles - Enlarged
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 24,
        borderBottomWidth: 1,
        borderBottomColor: DIVIDER_COLOR,
        marginBottom: 10,
        backgroundColor: 'rgba(44, 95, 45, 0.05)', // Subtle background to highlight
    },
    avatarContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: `${PRIMARY_COLOR}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: PRIMARY_COLOR,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    headerContent: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: '800',
        color: PRIMARY_COLOR,
        marginBottom: 4,
    },
    userRole: {
        fontSize: 13,
        color: TEXT_LIGHT,
        fontWeight: '500',
    },

    // Section Styles - Minimized
    section: {
        marginBottom: 0,
        borderBottomWidth: 1,
        borderBottomColor: DIVIDER_COLOR,
        paddingVertical: 0,
    },
    sectionTitle: {
        fontSize: 9, // Reduced font size
        fontWeight: '700',
        color: ACCENT_COLOR,
        paddingHorizontal: 16,
        marginBottom: 2,
        marginTop: 2, // Reduced margin
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    sectionContent: {
        paddingHorizontal: 0,
    },

    // Custom Drawer Item Styles
    customDrawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginHorizontal: 8,
        marginVertical: 2,
        gap: 15,
    },
    iconBox: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: 'rgba(44, 95, 45, 0.05)',
    },
    customLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.2,
    },

    // Switch Styles
    appearanceContainer: {
        paddingTop: 8,
        paddingBottom: 10,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8, 
        paddingHorizontal: 16,
        marginHorizontal: 8,
        marginTop: 4,
        minHeight: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    switchLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    switchLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
});
