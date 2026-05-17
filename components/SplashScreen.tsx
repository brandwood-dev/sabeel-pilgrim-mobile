import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    View,
    Modal,
    TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from './ui/Button';
import { useTrans } from '../hooks/useTrans';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { setLanguage } from '../store/uiSlice';
import { colors } from '../theme/colors';


const { width, height } = Dimensions.get('window');

const ONBOARDING_DATA = [
    {
        id: '0',
        title: 'Bienvenue chez Sabeel',
        description: 'Sabeel est votre compagnon idéal pour un pèlerinage serein, sécurisé et spirituellement enrichi, connectant pèlerins, guides et agences.',
        image: require('../assets/images/onboarding/onb1.png'),
    },
    {
        id: '1',
        title: 'Offres Agences Umrah',
        description: 'Explorez une large gamme d\'offres complètes de voyages Umrah proposées par les meilleures agences certifiées.',
        image: require('../assets/images/onboarding/onb2.png'),
    },
    {
        id: '2',
        title: 'Umrah Solo',
        description: 'Planifiez votre Umrah en toute liberté : comparez et réservez vos hôtels, vols et guides privés selon vos préférences.',
        image: require('../assets/images/onboarding/onb3.png'),
    },
    {
        id: '3',
        title: 'Accompagnement & Suivi Familial',
        description: 'Gardez l\'esprit tranquille en suivant la position en temps réel de vos parents durant leur séjour à Makkah.',
        image: require('../assets/images/onboarding/onb4.png'),
    },
    {
        id: '4',
        title: 'Sécurité SOS',
        description: 'Un bouton d\'urgence disponible 24h/24 pour alerter votre guide et les services d\'urgence en un clic.',
        image: require('../assets/images/onboarding/onb5.png'),
    },
];

export function SplashScreen() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { t, language } = useTrans();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showLangSheet, setShowLangSheet] = useState(false);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef<FlatList<any>>(null);

    const isRTL = language === 'ar';

    const viewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems[0]) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    useEffect(() => {
        const interval = setInterval(() => {
            const nextIndex = currentIndex >= ONBOARDING_DATA.length - 1 ? 0 : currentIndex + 1;

            slidesRef.current?.scrollToIndex({
                index: nextIndex,
                animated: true,
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [currentIndex]);

    const renderItem = ({ item }: any) => {
        return (
            <View style={styles.slide}>
                <View style={styles.imageContainer}>
                    <Image source={item.image} style={styles.image} resizeMode="contain" />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{t(item.title)}</Text>
                    <Text style={styles.description}>{t(item.description)}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.langBtn}
                    onPress={() => setShowLangSheet(true)}
                >
                    <Ionicons name="globe-outline" size={18} color="#666" />
                    <Text style={styles.langText}>EN/FR/AR</Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.content, { justifyContent: 'flex-start' }]}>
                <FlatList
                    data={ONBOARDING_DATA}
                    renderItem={renderItem}
                    horizontal
                    inverted={isRTL}
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    bounces={false}
                    keyExtractor={(item) => item.id}
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                        useNativeDriver: false,
                    })}
                    onViewableItemsChanged={viewableItemsChanged}
                    viewabilityConfig={viewConfig}
                    ref={slidesRef}
                    style={{ flexGrow: 0 }}
                    onScrollToIndexFailed={() => {
                        slidesRef.current?.scrollToOffset({
                            offset: currentIndex * width,
                            animated: true,
                        });
                    }}
                />

                <View style={[styles.dotsContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    {ONBOARDING_DATA.map((_, i) => {
                        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                        const dotWidth = scrollX.interpolate({
                            inputRange,
                            outputRange: [10, 20, 10],
                            extrapolate: 'clamp',
                        });
                        const opacity = scrollX.interpolate({
                            inputRange,
                            outputRange: [0.3, 1, 0.3],
                            extrapolate: 'clamp',
                        });
                        return (
                            <Animated.View
                                style={[styles.dot, { width: dotWidth, opacity }]}
                                key={i.toString()}
                            />
                        );
                    })}
                </View>

                <View style={styles.footer}>
                    <View style={styles.buttonContainer}>
                        <Button
                            title={t("Se connecter")}
                            onPress={() => router.push('/(auth)/(screens)/login' as any)}
                            style={{ marginBottom: 0 }}
                        />
                        <Button
                            title={t("Créer un compte")}
                            onPress={() => router.push('/(auth)/(screens)/register' as any)}
                            variant="outline"
                            style={{ marginBottom: 0 }}
                        />
                    </View>
                </View>
            </View>

            {/* Language Selection Sheet */}
            <Modal
                transparent
                visible={showLangSheet}
                animationType="slide"
                onRequestClose={() => setShowLangSheet(false)}
            >
                <TouchableOpacity
                    style={styles.sheetOverlay}
                    activeOpacity={1}
                    onPress={() => setShowLangSheet(false)}
                >
                    <View style={styles.sheetContent}>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.sheetTitle}>{t('Choisir la langue')}</Text>

                        {[
                            { code: 'ar', label: 'العربية' },
                            { code: 'fr', label: 'Français' },
                            { code: 'en', label: 'English' },
                        ].map((lang) => (
                            <TouchableOpacity
                                key={lang.code}
                                style={[
                                    styles.langItem,
                                    language === lang.code && styles.langItemActive
                                ]}
                                onPress={() => {
                                    dispatch(setLanguage(lang.code as any));
                                    setShowLangSheet(false);
                                }}
                            >
                                <Text style={[
                                    styles.langItemText,
                                    language === lang.code && styles.langItemTextActive
                                ]}>
                                    {lang.label}
                                </Text>
                                {language === lang.code && (
                                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        height: 60,
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
    },
    langBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
    },
    langText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '700',
    },
    content: {
        flex: 1,
    },
    slide: {
        width,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 10,
    },
    imageContainer: {
        flex: 0,
        alignItems: 'center',
        width: '100%',
    },
    image: {
        width: width * 1,
        height: width * 1,
    },
    textContainer: {
        alignItems: 'center',
        paddingHorizontal: 35,
        marginTop: 0,
        paddingBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2C5F2D',
        textAlign: 'center',
        marginBottom: 12,
        marginTop: -50,
    },
    description: {
        fontSize: 14,
        color: '#4A7C59',
        textAlign: 'center',
        lineHeight: 20,
    },
    footer: {
        marginTop: 'auto',
        paddingHorizontal: 30,
        paddingBottom: 40,
    },
    dotsContainer: {
        flexDirection: 'row',
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    dot: {
        height: 10,
        borderRadius: 5,
        backgroundColor: '#2C5F2D',
        marginHorizontal: 8,
    },
    buttonContainer: {
        gap: 15,
    },
    loginOption: {
        marginTop: 10,
        alignItems: 'center',
    },
    loginOptionText: {
        color: '#2C5F2D',
        fontSize: 16,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    sheetOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    sheetContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        paddingBottom: 40,
    },
    sheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    sheetTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2C5F2D',
        textAlign: 'center',
        marginBottom: 20,
    },
    langItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginBottom: 8,
        backgroundColor: '#F8F9FA',
    },
    langItemActive: {
        backgroundColor: '#2C5F2D' + '10',
        borderWidth: 1.5,
        borderColor: '#2C5F2D',
    },
    langItemText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    langItemTextActive: {
        color: '#2C5F2D',
        fontWeight: '800',
    },
});

