import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    SafeAreaView,
    Image,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useTrans } from '@/hooks/useTrans';
import { useThemeColors } from '@/hooks/useThemeColors';

const { width } = Dimensions.get('window');

export default function AboutPage() {
    const router = useRouter();
    const { t, language } = useTrans();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const isRTL = language === 'ar';

    const TEXT_COLOR = isDarkMode ? '#FFFFFF' : '#111827';
    const TEXT_SEC = isDarkMode ? '#8A8A8E' : '#6B7280';
    const CARD_BG = isDarkMode ? '#1C1C1E' : '#FFFFFF';
    const BACKGROUND = isDarkMode ? '#000000' : '#F4F5F7';

    const objectives = [
        { title: t('Sérénité'), icon: 'leaf-outline' },
        { title: t('Innovation'), icon: 'flash-outline' },
        { title: t('Accompagnement'), icon: 'heart-outline' },
        { title: t('Excellence'), icon: 'ribbon-outline' },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: BACKGROUND }]}>
            <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity 
                    onPress={() => router.back()} 
                    style={[styles.backBtn, { transform: [{ scaleX: isRTL ? -1 : 1 }] }]}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: TEXT_COLOR }]}>{t('À propos de Sabeel')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.imageHeader}>
                    <Image 
                        source={require('@/assets/images/icon.png')} 
                        style={styles.logo} 
                        resizeMode="contain"
                    />
                    <Text style={[styles.appName, { color: colors.primary }]}>SABEEL</Text>
                    <Text style={[styles.appVersion, { color: TEXT_SEC }]}>{t('L\'excellence au service du sacré')}</Text>
                </View>

                <View style={[styles.card, { backgroundColor: CARD_BG }]}>
                    <Text style={[styles.cardTitle, { color: colors.primary, textAlign: isRTL ? 'right' : 'left' }]}>{t('Notre Identité')}</Text>
                    <Text style={[styles.cardDesc, { color: TEXT_COLOR, textAlign: isRTL ? 'right' : 'left' }]}>
                        {t('Sabeel est bien plus qu\'une application ; c\'est un écosystème numérique dédié à l\'accompagnement spirituel. Nous fusionnons tradition et innovation pour offrir aux pèlerins une expérience de voyage fluide, sécurisée et profondément inspirante.')}
                    </Text>
                </View>

                <View style={[styles.card, { backgroundColor: CARD_BG }]}>
                    <Text style={[styles.cardTitle, { color: colors.primary, textAlign: isRTL ? 'right' : 'left' }]}>{t('Notre Mission')}</Text>
                    <Text style={[styles.cardDesc, { color: TEXT_COLOR, textAlign: isRTL ? 'right' : 'left' }]}>
                        {t('Nous œuvrons pour éliminer les barrières logistiques et techniques du pèlerinage. Notre mission est de permettre à chaque pèlerin de se concentrer pleinement sur l\'essentiel : sa dévotion et son élévation spirituelle.')}
                    </Text>
                </View>

                <View style={[styles.card, { backgroundColor: CARD_BG }]}>
                    <Text style={[styles.cardTitle, { color: colors.primary, textAlign: isRTL ? 'right' : 'left' }]}>{t('Valeurs Fondamentales')}</Text>
                    <View style={styles.objectivesGrid}>
                        {objectives.map((obj, i) => (
                            <View key={i} style={[styles.objectiveItem, { backgroundColor: isDarkMode ? '#2C2C2E' : '#F9FAFB' }]}>
                                <Ionicons name={obj.icon as any} size={24} color={colors.primary} />
                                <Text style={[styles.objectiveText, { color: TEXT_COLOR }]}>{obj.title}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={[styles.card, { backgroundColor: CARD_BG }]}>
                    <Text style={[styles.cardTitle, { color: colors.primary, textAlign: isRTL ? 'right' : 'left' }]}>{t('Vision Future')}</Text>
                    <Text style={[styles.cardDesc, { color: TEXT_COLOR, textAlign: isRTL ? 'right' : 'left' }]}>
                        {t('Nous aspirons à devenir le standard mondial du pèlerinage connecté, en bâtissant un pont technologique entre les agences de voyages et les pèlerins pour une organisation d\'une qualité sans précédent.')}
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerHeart, { color: TEXT_SEC }]}>
                        {t('Fait avec ❤️ pour les pèlerins')}
                    </Text>
                    <Text style={[styles.footerCopyright, { color: TEXT_SEC }]}>
                        © 2024 Sabeel Platform. {t('Tous droits réservés.')}
                    </Text>
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
        height: 60,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    imageHeader: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: 'rgba(44, 95, 45, 0.03)',
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 10,
    },
    appName: {
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: 4,
    },
    appVersion: {
        fontSize: 14,
        marginTop: 5,
        fontWeight: '500',
    },
    card: {
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 24,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 12,
    },
    cardDesc: {
        fontSize: 15,
        lineHeight: 24,
    },
    objectivesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    objectiveItem: {
        width: '47%',
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    objectiveText: {
        fontSize: 12,
        fontWeight: '700',
        marginTop: 8,
        textAlign: 'center',
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
        paddingBottom: 20,
    },
    footerHeart: {
        fontSize: 14,
        fontWeight: '600',
    },
    footerCopyright: {
        fontSize: 11,
        marginTop: 5,
    },
});
