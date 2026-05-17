import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    Dimensions,
    Modal,
    KeyboardAvoidingView,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTrans } from '@/hooks/useTrans';
import { LinearGradient } from 'expo-linear-gradient';
import { useDrawer } from '@/context/DrawerContext';
import AssistantChat from './assistant';

const { width } = Dimensions.get('window');

export default function UmrahHubScreen() {
    const router = useRouter();
    const { openDrawer } = useDrawer();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const user = useSelector((state: RootState) => state.auth.user);
    const { t } = useTrans();

    const [assistantModal, setAssistantModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const PRIMARY_GREEN = '#2C5F2D';
    const BEIGE = '#d9ab83';
    const GOLD = '#D4AF37';
    const BG = isDarkMode ? '#121212' : '#FFFFFF';
    const CARD_BG = isDarkMode ? '#1C1C1E' : '#F9F9F9';
    const TXT = isDarkMode ? '#FFFFFF' : '#2C3E50';
    const TXT_SEC = isDarkMode ? '#8E8E93' : '#7F8C8D';

    const firstName = user?.firstName || 'U';
    const lastName = user?.lastName || '';
    const fallbackAvatar = `https://api.dicebear.com/7.x/initials/png?seed=${firstName}+${lastName}&backgroundColor=2C5F2D&textColor=ffffff`;
    const userAvatar = user?.photo ? user.photo : fallbackAvatar;

    const handleNavigate = (route: string) => {
        if (route) router.push(route as any);
    };

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <SafeAreaView style={[styles.container, { backgroundColor: BG }]} edges={['left', 'right', 'bottom']}>
                
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerAvatarButton} onPress={openDrawer}>
                        <Image source={{ uri: userAvatar }} style={styles.headerAvatar} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: TXT }]}>{t('Services Umrah')}</Text>
                    <TouchableOpacity style={styles.headerBtn}>
                        <Ionicons name="notifications-outline" size={24} color={TXT} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Search Bar */}
                    <View style={styles.searchWrapper}>
                        <View style={[styles.searchBar, { backgroundColor: CARD_BG, borderColor: isDarkMode ? '#333' : '#E9ECEF' }]}>
                            <Ionicons name="search-outline" size={20} color={TXT_SEC} />
                            <TextInput
                                style={[styles.searchInput, { color: TXT }]}
                                placeholder={t('Rechercher un service...')}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholderTextColor={TXT_SEC}
                            />
                        </View>
                    </View>

                    {/* Main Choice 1: Pack Agence */}
                    <View style={styles.sectionHeader}>
                        <Ionicons name="business" size={18} color={PRIMARY_GREEN} />
                        <Text style={[styles.sectionLabel, { color: TXT }]}>{t('Formule avec Agences')}</Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.mainCardContainer} 
                        activeOpacity={0.9}
                        onPress={() => handleNavigate('/(umrah_agence)/(screens)/(pack_umrah)/explorer_umrah')}
                    >
                        <LinearGradient
                            colors={[PRIMARY_GREEN, '#1e4220']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.mainCard}
                        >
                            <View style={styles.mainCardContent}>
                                <View style={styles.mainCardHeader}>
                                    <View style={[styles.iconCircle, { backgroundColor: BEIGE + '25' }]}>
                                        <FontAwesome5 name="kaaba" size={22} color={BEIGE} />
                                    </View>
                                    <View style={[styles.badge, { backgroundColor: BEIGE }]}>
                                        <Text style={styles.badgeText}>{t('Tout-en-un')}</Text>
                                    </View>
                                </View>
                                
                                <View style={styles.mainCardBody}>
                                    <Text style={styles.mainCardTitle}>{t('Packs Complets')}</Text>
                                    <Text style={styles.mainCardDesc}>
                                        {t('Vivez une expérience sereine avec nos agences partenaires : Vols, Hôtels, Visas et Guide inclus.')}
                                    </Text>
                                </View>
                                
                                <View style={styles.mainCardFooter}>
                                    <Text style={styles.exploreBtnText}>{t('Explorer les offres')}</Text>
                                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                                </View>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Main Choice 2: Umrah Solo */}
                    <View style={styles.soloSectionHeader}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="person" size={18} color={PRIMARY_GREEN} />
                            <Text style={[styles.sectionLabel, { color: TXT, marginBottom: 0 }]}>{t('Umrah en Solo')}</Text>
                        </View>
                        <Text style={[styles.soloHelperText, { color: TXT_SEC }]}>{t('Composez vous-même votre voyage')}</Text>
                    </View>

                    <View style={styles.gridContainer}>
                        {/* Hotels */}
                        <TouchableOpacity 
                            style={[styles.gridCard, { backgroundColor: CARD_BG }]}
                            onPress={() => handleNavigate('/(umrah_agence)/(umrah_solo)/hotels/hotels')}
                        >
                            <View style={[styles.gridIconContainer, { backgroundColor: '#E2725B15' }]}>
                                <Ionicons name="business" size={20} color="#E2725B" />
                            </View>
                            <View style={styles.gridTextContainer}>
                                <Text style={[styles.gridCardTitle, { color: TXT }]}>{t('Hôtels')}</Text>
                                <Text style={[styles.gridCardSub, { color: TXT_SEC }]} numberOfLines={1}>{t('Dormir à Makkah/Médine')}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={14} color={TXT_SEC} style={styles.gridArrow} />
                        </TouchableOpacity>

                        {/* Vols */}
                        <TouchableOpacity 
                            style={[styles.gridCard, { backgroundColor: CARD_BG }]}
                            onPress={() => handleNavigate('/(umrah_agence)/(umrah_solo)/vole/vole')}
                        >
                            <View style={[styles.gridIconContainer, { backgroundColor: '#3B82F615' }]}>
                                <Ionicons name="airplane" size={20} color="#3B82F6" />
                            </View>
                            <View style={styles.gridTextContainer}>
                                <Text style={[styles.gridCardTitle, { color: TXT }]}>{t('Vols')}</Text>
                                <Text style={[styles.gridCardSub, { color: TXT_SEC }]} numberOfLines={1}>{t('Trouver un billet')}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={14} color={TXT_SEC} style={styles.gridArrow} />
                        </TouchableOpacity>

                        {/* Guides */}
                        <TouchableOpacity 
                            style={[styles.gridCard, { backgroundColor: CARD_BG }]}
                            onPress={() => handleNavigate('/(umrah_agence)/(umrah_solo)/guides')}
                        >
                            <View style={[styles.gridIconContainer, { backgroundColor: '#F59E0B15' }]}>
                                <Ionicons name="person" size={20} color="#F59E0B" />
                            </View>
                            <View style={styles.gridTextContainer}>
                                <Text style={[styles.gridCardTitle, { color: TXT }]}>{t('Guide Privé')}</Text>
                                <Text style={[styles.gridCardSub, { color: TXT_SEC }]} numberOfLines={1}>{t('Soutien spirituel')}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={14} color={TXT_SEC} style={styles.gridArrow} />
                        </TouchableOpacity>

                        {/* Transport */}
                        <TouchableOpacity 
                            style={[styles.gridCard, { backgroundColor: CARD_BG }]}
                            onPress={() => {}}
                        >
                            <View style={[styles.gridIconContainer, { backgroundColor: GOLD + '15' }]}>
                                <MaterialCommunityIcons name="bus-side" size={20} color={GOLD} />
                            </View>
                            <View style={styles.gridTextContainer}>
                                <Text style={[styles.gridCardTitle, { color: TXT }]}>{t('Transport')}</Text>
                                <Text style={[styles.gridCardSub, { color: TXT_SEC }]} numberOfLines={1}>{t('Navettes & Taxis')}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={14} color={TXT_SEC} style={styles.gridArrow} />
                        </TouchableOpacity>
                    </View>

                    {/* Spacer for FAB */}
                    <View style={{ height: 100 }} />
                </ScrollView>

            </SafeAreaView>

            {/* Assistant FAB */}
            <TouchableOpacity
                style={[styles.assistantFab, { backgroundColor: colors.surface, borderColor: colors.accent, zIndex: 9999, elevation: 10 }]}
                onPress={() => setAssistantModal(true)}
            >
                <Image
                    source={require('../../../assets/images/ai.jpg')}
                    style={{ width: '60%', height: '60%' }}
                    contentFit="contain"
                    tintColor={colors.accent}
                />
            </TouchableOpacity>

            {/* Assistant Modal */}
            <Modal
                visible={assistantModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setAssistantModal(false)}
            >
                <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
                    <AssistantChat onClose={() => setAssistantModal(false)} />
                </KeyboardAvoidingView>
            </Modal>
        </View>
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
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 10,
    },
    headerAvatarButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: '#2C5F2D',
    },
    headerAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: 18,
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    searchWrapper: {
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
    },
    introSection: {
        marginTop: 10,
        marginBottom: 20,
    },
    mainTitle: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 6,
    },
    subTitle: {
        fontSize: 14,
        lineHeight: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 10,
        marginBottom: 12,
    },
    sectionLabel: {
        fontSize: 17,
        fontWeight: '800',
    },
    mainCardContainer: {
        marginBottom: 25,
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#2C5F2D',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    mainCard: {
        padding: 20,
    },
    mainCardContent: {
        gap: 12,
    },
    mainCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    mainCardBody: {
        gap: 6,
    },
    mainCardTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    mainCardDesc: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 13,
        lineHeight: 18,
    },
    mainCardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    exploreBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    soloSectionHeader: {
        marginBottom: 12,
    },
    soloHelperText: {
        fontSize: 12,
        marginTop: 2,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 20,
    },
    gridCard: {
        width: '48%',
        padding: 14,
        borderRadius: 18,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
        flexDirection: 'column',
    },
    gridIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    gridTextContainer: {
        flex: 1,
    },
    gridCardTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    gridCardSub: {
        fontSize: 10,
    },
    gridArrow: {
        position: 'absolute',
        top: 14,
        right: 12,
    },
    assistantFab: {
        position: 'absolute',
        bottom: 120,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
});
