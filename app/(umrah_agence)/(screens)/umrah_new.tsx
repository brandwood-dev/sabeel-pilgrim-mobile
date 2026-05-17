import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ScrollView,
    Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTrans } from '@/hooks/useTrans';
import { useDrawer } from '@/context/DrawerContext';

const { width } = Dimensions.get('window');

export default function UmrahHubScreen() {
    const router = useRouter();
    const { openDrawer } = useDrawer();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const user = useSelector((state: RootState) => state.auth.user);
    const { t } = useTrans();

    const PRIMARY = '#2C5F2D';
    const CARD = isDarkMode ? '#1C1C1E' : '#FFFFFF';
    const BD = isDarkMode ? '#38383A' : '#E5E5EA';
    const TXT = isDarkMode ? '#fff' : '#1C1C1E';
    const TXT_SEC = isDarkMode ? '#8E8E93' : '#636366';
    const BG = isDarkMode ? '#121212' : '#F8F9FA';
    const inputBg = isDarkMode ? '#2D2D2D' : '#F8F9FA';

    const [showSoloServices, setShowSoloServices] = useState(false);

    const mainOptions = [
        {
            id: 'packs',
            title: t('Pack Complet avec Agence'),
            description: t('Simplifiez votre Umrah avec un pack tout inclus : vols, hôtel, visa et guide. Idéal pour une première expérience sans stress.'),
            icon: 'briefcase',
            gradient: ['#2C5F2D', '#4A7C59'] as const,
            route: '/(umrah_agence)/(screens)/(pack_umrah)/explorer_umrah',
            badge: t('Recommandé'),
            features: [t('Vols + Hôtel'), t('Visa inclus'), t('Guide francophone')],
        },
        {
            id: 'solo',
            title: t('Organiser en Solo'),
            description: t('Construisez votre voyage sur mesure. Réservez séparément vos vols, hôtes et guides selon vos préférences.'),
            icon: 'compass',
            gradient: ['#E2725B', '#F4A261'] as const,
            route: null,
            badge: null,
            features: [t('Flexibilité totale'), t('Prix sur mesure'), t('Personnalisable')],
        },
    ];

    const soloServices = [
        {
            id: 'hotels',
            title: t('Hôtels'),
            subtitle: t('Près de la Kaaba'),
            description: t('Makkah & Médine'),
            icon: 'business',
            color: '#E2725B',
            route: '/(umrah_agence)/(umrah_solo)/hotels/hotels',
        },
        {
            id: 'vols',
            title: t('Vols'),
            subtitle: t('Meilleurs tarifs'),
            description: t('Directs & escales'),
            icon: 'airplane',
            color: '#3B82F6',
            route: '/(umrah_agence)/(umrah_solo)/vole/vole',
        },
        {
            id: 'guide',
            title: t('Guide Privé'),
            subtitle: t('Accompagnement'),
            description: t('Francophone 24/7'),
            icon: 'person',
            color: '#F59E0B',
            route: '/(umrah_agence)/(umrah_solo)/guides',
        },
    ];

    const handleOptionPress = (option: typeof mainOptions[0]) => {
        if (option.id === 'solo') {
            setShowSoloServices(!showSoloServices);
        } else if (option.route) {
            router.push(option.route as any);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: BG }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBtn} onPress={openDrawer}>
                    <Ionicons name="menu-outline" size={28} color={TXT} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: TXT }]}>{t('Umrah')}</Text>
                <TouchableOpacity style={styles.headerBtn}>
                    <Ionicons name="notifications-outline" size={24} color={TXT} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Info Section */}
                <View style={styles.infoSection}>
                    <Text style={[styles.sectionLabel, { color: PRIMARY }]}>{t('VOTRE VOYAGE SACRÉ')}</Text>
                    <Text style={[styles.mainTitle, { color: TXT }]}>{t('Comment souhaitez-vous organiser votre Umrah ?')}</Text>
                    <Text style={[styles.subTitle, { color: TXT_SEC }]}>
                        {t('Optez pour la simplicité d\'un pack tout inclus ou créez votre voyage personnalisé.')}
                    </Text>
                </View>

                {/* Main Options Cards */}
                <View style={styles.mainOptionsContainer}>
                    {mainOptions.map((option) => (
                        <TouchableOpacity 
                            key={option.id}
                            style={styles.mainOptionCard}
                            onPress={() => handleOptionPress(option)}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={option.gradient}
                                style={styles.gradientCard}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                {option.badge && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{option.badge}</Text>
                                    </View>
                                )}
                                <View style={styles.iconCircle}>
                                    <Ionicons name={option.icon as any} size={32} color="#fff" />
                                </View>
                                <Text style={styles.cardTitle}>{option.title}</Text>
                                <Text style={styles.cardDescription}>{option.description}</Text>
                                
                                <View style={styles.featuresContainer}>
                                    {option.features.map((feature, idx) => (
                                        <View key={idx} style={styles.featureItem}>
                                            <Ionicons name="checkmark-circle" size={14} color="#fff" />
                                            <Text style={styles.featureText}>{feature}</Text>
                                        </View>
                                    ))}
                                </View>

                                <View style={styles.ctaContainer}>
                                    <Text style={styles.ctaText}>
                                        {option.id === 'packs' ? t('Explorer les packs →') : t('Voir les services →')}
                                    </Text>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Solo Services Section - Show when solo is selected */}
                {showSoloServices && (
                    <View style={styles.servicesSection}>
                        <Text style={[styles.sectionTitle, { color: TXT }]}>{t('Services à la carte')}</Text>
                        <Text style={[styles.sectionSubtitle, { color: TXT_SEC }]}>
                            {t('Composez votre voyage sur mesure')}
                        </Text>

                        <View style={styles.servicesGrid}>
                            {soloServices.map((service) => (
                                <TouchableOpacity 
                                    key={service.id}
                                    style={[styles.serviceCard, { backgroundColor: CARD, borderColor: BD }]}
                                    onPress={() => router.push(service.route as any)}
                                    activeOpacity={0.8}
                                >
                                    <View style={[styles.serviceIconContainer, { backgroundColor: service.color + '15' }]}>
                                        <Ionicons name={service.icon as any} size={24} color={service.color} />
                                    </View>
                                    <View style={styles.serviceTextContainer}>
                                        <Text style={[styles.serviceTitle, { color: TXT }]}>{service.title}</Text>
                                        <Text style={[styles.serviceSubtitle, { color: service.color }]}>{service.subtitle}</Text>
                                        <Text style={[styles.serviceDescription, { color: TXT_SEC }]}>{service.description}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={TXT_SEC} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Help Card */}
                <View style={[styles.helpCard, { backgroundColor: inputBg, borderColor: BD }]}>
                    <View style={styles.helpIconContainer}>
                        <Ionicons name="help-circle-outline" size={32} color={PRIMARY} />
                    </View>
                    <View style={styles.helpTextContainer}>
                        <Text style={[styles.helpTitle, { color: TXT }]}>{t('Besoin d\'aide pour choisir ?')}</Text>
                        <Text style={[styles.helpDescription, { color: TXT_SEC }]}>
                            {t('Notre équipe vous guide pour trouver la meilleure option selon votre budget et vos besoins.')}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
    },
    headerBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    infoSection: {
        marginTop: 10,
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.2,
        marginBottom: 8,
    },
    mainTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
        lineHeight: 28,
    },
    subTitle: {
        fontSize: 14,
        lineHeight: 20,
    },
    mainOptionsContainer: {
        gap: 16,
        marginBottom: 24,
    },
    mainOptionCard: {
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    gradientCard: {
        padding: 24,
        minHeight: 220,
    },
    badge: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    cardDescription: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 18,
        marginBottom: 16,
    },
    featuresContainer: {
        gap: 6,
        marginBottom: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    featureText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    ctaContainer: {
        marginTop: 'auto',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
    },
    ctaText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    servicesSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        marginBottom: 16,
    },
    servicesGrid: {
        gap: 12,
    },
    serviceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    serviceIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    serviceTextContainer: {
        flex: 1,
    },
    serviceTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    serviceSubtitle: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 2,
    },
    serviceDescription: {
        fontSize: 11,
    },
    helpCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        marginTop: 8,
    },
    helpIconContainer: {
        marginRight: 16,
    },
    helpTextContainer: {
        flex: 1,
    },
    helpTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    helpDescription: {
        fontSize: 12,
        lineHeight: 16,
    },
});
