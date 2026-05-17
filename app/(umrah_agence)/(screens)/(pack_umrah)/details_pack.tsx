import { useThemeColors } from '@/hooks/useThemeColors';
import { packApi, agencyApi } from '@/services/api';
import { RootState } from '@/store/store';
import { toggleFavorite } from '@/store/umrahSlice';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Image } from 'expo-image';
import {
    Dimensions,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import GreenDotsLoader from '@/components/common/GreenDotsLoader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useTrans } from '@/hooks/useTrans';

const { width } = Dimensions.get('window');

const getParamValue = (value: string | string[] | undefined): string => {
    if (Array.isArray(value)) {
        return typeof value[0] === 'string' ? value[0] : '';
    }

    return typeof value === 'string' ? value : '';
};

// Only allow http(s) URLs of reasonable length to prevent base64/data URIs from crashing the app
const getSafeImageUri = (value: string | null | undefined): string | null => {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!/^https?:\/\//i.test(trimmed)) return null;
    // Allow long Minio/AWS presigned URLs but still cap to avoid worst-case blobs
    if (trimmed.length > 4096) return null;
    return trimmed;
};

const pickFirstValidUrl = (val: any): string | null => {
    const s = getSafeImageUri(typeof val === 'string' ? val : null);
    if (s) return s;
    if (Array.isArray(val)) {
        for (const v of val) {
            const u = getSafeImageUri(typeof v === 'string' ? v : null);
            if (u) return u;
        }
    }
    return null;
};

const getPackPrimaryImage = (pack: any): string | null => {
    return (
        pickFirstValidUrl(pack?.imageUrl) ||
        pickFirstValidUrl(pack?.image) ||
        pickFirstValidUrl(pack?.mainImageUrl) ||
        pickFirstValidUrl(pack?.images) ||
        pickFirstValidUrl(pack?.imagesUrls) ||
        pickFirstValidUrl(pack?.gallery) ||
        pickFirstValidUrl(pack?.media) ||
        null
    );
};

interface PackDetail {
    id: string;
    agencyId?: string;
    title: string;
    agencyName: string;
    agencyLogo: string | null;
    price: number;
    rating: number;
    date: string;
    image: string | null;
    features: string[];
    description: string;
    program: { day: string; title: string; desc: string }[];
    agencyLocation: {
        address: string;
        distance: string;
    };
}

const parseFeatures = (value: unknown): string[] => {
    if (typeof value !== 'string' || !value.trim()) {
        return [];
    }

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
    } catch {
        return [];
    }
};

const buildPackFeatures = (pack: any, t: (value: string) => string) => {
    const features: string[] = [];

    if (pack.volDirect) features.push(t('Vol Direct'));
    if (pack.hasEscale) features.push(t('Vol avec escale'));
    if (pack.visaInclus) features.push(t('Visa Inclus'));
    if (pack.transfert) features.push(t('Transfert Inclus'));
    if (pack.hotelMekkah) features.push(`${t('Hôtel Makkah')} ${pack.hotelMekkahStars || ''}`.trim());
    if (pack.hotelMedina) features.push(`${t('Hôtel Médine')} ${pack.hotelMedinaStars || ''}`.trim());
    if (pack.guideName) features.push(`${t('Guide')} ${pack.guideName}`);

    return features;
};

const mapProgram = (program: any[] | null | undefined, t: (value: string) => string) => {
    if (!Array.isArray(program) || program.length === 0) {
        return [
            { day: t('Jour 1'), title: t('Programme à confirmer'), desc: t('Le programme détaillé sera communiqué par l’agence.') },
        ];
    }

    // Cap the number of rendered program entries to avoid heavy UI if backend returns huge arrays
    return program.slice(0, 20).map((entry, index) => ({
        day: entry.day || `${t('Jour')} ${index + 1}`,
        title: entry.title || t('Étape du voyage'),
        desc: entry.description || t('Détails à confirmer'),
    }));
};

const mapBackendPack = (pack: any, t: (value: string) => string): PackDetail => ({
    id: pack.id,
    agencyId: pack.agencyId || undefined,
    title: pack.title || t('Pack Umrah'),
    agencyName: pack.agencyName || t('Agence partenaire'),
    agencyLogo: getSafeImageUri(pack.agencyLogo) || null,
    price: Number(pack.price || pack.priceAdult || pack.priceSharedRoom || 0),
    rating: 4.8,
    date: pack.departureDate && pack.arrivalDate
        ? `${pack.departureDate} - ${pack.arrivalDate}`
        : pack.departureDate || pack.arrivalDate || t('Dates à confirmer'),
    image: getPackPrimaryImage(pack),
    features: buildPackFeatures(pack, t),
    description: pack.description || t('Description non disponible pour le moment.'),
    program: mapProgram(pack.program, t),
    agencyLocation: {
        address: pack.agencyAddress || t('Adresse non disponible'),
        distance: t('Distance non disponible'),
    },
});

const ensurePackDetail = (pack: Partial<PackDetail> | null | undefined, t: (value: string) => string): PackDetail => ({
    id: pack?.id || '',
    agencyId: pack?.agencyId,
    title: pack?.title || t('Pack Umrah'),
    agencyName: pack?.agencyName || t('Agence partenaire'),
    agencyLogo: pack?.agencyLogo || null,
    price: Number(pack?.price || 0),
    rating: Number(pack?.rating || 4.8),
    date: pack?.date || t('Dates à confirmer'),
    image: pack?.image || null,
    features: Array.isArray(pack?.features) ? pack!.features : [],
    description: pack?.description || t('Description non disponible pour le moment.'),
    program: Array.isArray(pack?.program) && pack?.program.length > 0
        ? pack.program
        : [{ day: t('Jour 1'), title: t('Programme à confirmer'), desc: t('Le programme détaillé sera communiqué par l’agence.') }],
    agencyLocation: {
        address: pack?.agencyLocation?.address || t('Adresse non disponible'),
        distance: pack?.agencyLocation?.distance || t('Distance non disponible'),
    },
});

export default function DetailsPackScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const dispatch = useDispatch();
    const colors = useThemeColors();
    const favorites = useSelector((state: RootState) => state.umrah.favorites);
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const { t, language } = useTrans();
    const isRTL = language === 'ar';
    const packId = getParamValue(params.id);
    const agencyIdParam = getParamValue(params.agencyId);
    const titleParam = getParamValue(params.title);
    const agencyNameParam = getParamValue(params.agencyName);
    const agencyLogoParam = getParamValue(params.agencyLogo);
    const priceParam = getParamValue(params.price);
    const ratingParam = getParamValue(params.rating);
    const dateParam = getParamValue(params.date);
    const imageParam = getParamValue(params.image);
    const featuresParam = getParamValue(params.features);
    const descriptionParam = getParamValue(params.description);
    const addressParam = getParamValue(params.address);
    const initialPack = useMemo(() => ({
        id: packId,
        agencyId: agencyIdParam || undefined,
        title: titleParam || t('Pack Umrah'),
        agencyName: agencyNameParam || t('Agence partenaire'),
        agencyLogo: agencyLogoParam || null,
        price: Number(priceParam || 0),
        rating: Number(ratingParam || 4.8),
        date: dateParam || t('Dates à confirmer'),
        image: imageParam || null,
        features: parseFeatures(featuresParam),
        description: descriptionParam || t('Description non disponible pour le moment.'),
        program: [{ day: t('Jour 1'), title: t('Programme à confirmer'), desc: t('Le programme détaillé sera communiqué par l’agence.') }],
        agencyLocation: {
            address: addressParam || t('Adresse non disponible'),
            distance: t('Distance non disponible'),
        },
    }), [packId, agencyIdParam, titleParam, agencyNameParam, agencyLogoParam, priceParam, ratingParam, dateParam, imageParam, featuresParam, descriptionParam, addressParam, language]);
    const hasPrefetchedPackData = Boolean(
        initialPack.title !== t('Pack Umrah') ||
        initialPack.image ||
        initialPack.features.length > 0 ||
        initialPack.description !== t('Description non disponible pour le moment.')
    );
    const [pack, setPack] = useState<PackDetail | null>(initialPack.id ? ensurePackDetail(initialPack, t) : null);
    const [loading, setLoading] = useState(Boolean(initialPack.id) && !hasPrefetchedPackData);

    console.log('[DetailsPack] render', {
        rawParams: params,
        packId,
        agencyIdParam,
        titleParam,
        priceParam,
        imageParam,
        hasPrefetchedPackData,
        loading,
        hasPackState: Boolean(pack),
    });

    useEffect(() => {
        const fetchPack = async () => {
            try {
                if (!packId) {
                    console.log('[DetailsPack] missing packId in params');
                    setPack(null);
                    setLoading(false);
                    return;
                }

                setLoading(true);

                console.log('[DetailsPack] fetching pack by id', { packId });
                const response = await packApi.getPublicPackById(packId);
                console.log('[DetailsPack] fetched pack response', {
                    hasData: Boolean(response?.data),
                    hasPack: Boolean(response?.data?.pack),
                });
                
                if (response.data?.pack) {
                    setPack(ensurePackDetail(mapBackendPack(response.data.pack, t), t));
                } else {
                    setPack(null);
                }
            } catch (error) {
                console.error('Failed to fetch pack details:', error);
                setPack(null);
            } finally {
                setLoading(false);
            }
        };

        fetchPack();
    }, [packId, language]);

    const item = ensurePackDetail(pack || initialPack, t);
    const safeImageUri = useMemo(() => getSafeImageUri(item.image), [item.image]);
    const safeAgencyLogoUri = useMemo(() => getSafeImageUri(item.agencyLogo), [item.agencyLogo]);
    console.log('[DetailsPack] derived item', {
        id: item.id,
        agencyId: item.agencyId,
        title: item.title,
        price: item.price,
        hasImage: Boolean(safeImageUri),
        featuresCount: item.features.length,
        programCount: item.program.length,
    });
    const timelineDotSpacingStyle = isRTL ? styles.timelineDotRTL : styles.timelineDotLTR;
    const timelineLinePositionStyle = isRTL ? styles.timelineLineRTL : styles.timelineLineLTR;

    const isFav = favorites.some((fav: any) => fav.id === item.id);

    // Fallback: only enrich missing agency logo from agency public profile (do not replace pack image)
    useEffect(() => {
        const enrichMediaFromAgency = async () => {
            try {
                if (!item.agencyId) return;
                const needsLogo = !safeAgencyLogoUri;
                if (!needsLogo) return;

                const resp = await agencyApi.getPublicAgencyById(item.agencyId);
                const ag = resp?.data?.agency || {};
                const nextLogo = getSafeImageUri(ag.profileImageUrl) || getSafeImageUri(ag.coverImageUrl) || null;
                if (nextLogo) setPack((prev) => ensurePackDetail({ ...(prev || item), agencyLogo: nextLogo }, t));
            } catch (e) {
                // silent fallback
            }
        };

        enrichMediaFromAgency();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item.agencyId, safeAgencyLogoUri]);

    const handleToggleFavorite = () => {
        dispatch(toggleFavorite({
            id: item.id,
            title: item.title,
            price: item.price,
            rating: item.rating,
            image: safeImageUri,
            agencyName: item.agencyName,
            agencyLogo: safeAgencyLogoUri,
            date: item.date,
            features: item.features
        }));
    };

    const handleShare = async () => {
        try {
            const packLink = `https://sabeel.tn/pack/${item.id}`;
            const result = await Share.share({
                message: `${t('Découvrez ce pack Umrah exceptionnel avec')} ${item.agencyName} : ${item.title} ${t('à')} ${item.price} DT ! \n${packLink}`,
                url: packLink, // iOS support
                title: item.title
            });
        } catch (error: any) {
            alert(error.message);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

            {loading ? (
                <View style={styles.loadingContainer}>
                    <GreenDotsLoader fullScreen={false} />
                </View>
            ) : !item.id ? (
                <View style={styles.loadingContainer}>
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('Pack introuvable')}</Text>
                </View>
            ) : (
                <>
                    <View style={styles.imageContainer}>
                        {safeImageUri ? (
                            <Image 
                                source={{ uri: safeImageUri }} 
                                style={styles.heroImage} 
                                cachePolicy="disk"
                                contentFit="cover"
                            />
                        ) : (
                            <View style={[styles.heroImage, { backgroundColor: '#EEF6EF' }]} />
                        )}
                        <View style={styles.overlay} />

                        <SafeAreaView style={styles.headerSafeArea}>
                            <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                <TouchableOpacity
                                    style={styles.iconButton}
                                    onPress={() => router.back()}
                                >
                                    <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color="#fff" />
                                </TouchableOpacity>
                                <View style={[styles.headerRight, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                    <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
                                        <Ionicons name="share-social-outline" size={24} color="#fff" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.iconButton, isRTL ? { marginRight: 15 } : styles.headerRightButtonSpacer]} onPress={handleToggleFavorite}>
                                        <Ionicons
                                            name={isFav ? "heart" : "heart-outline"}
                                            size={24}
                                            color={isFav ? '#E2725B' : "#fff"}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </SafeAreaView>
                    </View>

                    <View style={[styles.contentContainer, { backgroundColor: colors.background }]}>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                            <View style={[styles.titleSection, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                                <TouchableOpacity
                                    style={[styles.agencyContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                                    onPress={() => {
                                        if (!item.agencyId) {
                                            return;
                                        }

                                        router.push({
                                            pathname: '/(umrah_agence)/(screens)/profile/profile_agence',
                                            params: {
                                                agencyId: item.agencyId,
                                                agencyName: item.agencyName,
                                                // We avoid passing the agencyLogo here as it can be a large base64
                                                address: item.agencyLocation.address,
                                            }
                                        });
                                    }}
                                >
                                    <View style={[styles.agencyLogoWrapper, { backgroundColor: colors.surface }]}>
                                        {safeAgencyLogoUri ? (
                                            <Image 
                                                source={{ uri: safeAgencyLogoUri }} 
                                                style={styles.agencyLogoImage} 
                                                cachePolicy="disk"
                                                contentFit="cover"
                                            />
                                        ) : (
                                            <Ionicons name="business-outline" size={16} color={colors.primary} />
                                        )}
                                    </View>
                                    <Text style={[styles.agencyNameHighlight, isRTL ? { marginRight: 10, color: colors.primary } : [styles.agencyLogoSpacer, { color: colors.primary }]]}>{item.agencyName}</Text>
                                </TouchableOpacity>
                                <Text style={[styles.packTitleLarge, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>{item.title}</Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                <View style={[styles.infoItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                    <View style={[styles.iconBox, { backgroundColor: colors.surface }]}>
                                        <Ionicons name="calendar" size={20} color={colors.primary} />
                                    </View>
                                    <View style={isRTL ? { alignItems: 'flex-end', marginRight: 12 } : [styles.infoItemIconSpacer, { alignItems: 'flex-start' }]}>
                                        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('Date')}</Text>
                                        <Text style={[styles.infoValue, { color: colors.text }]}>{item.date}</Text>
                                    </View>
                                </View>
                                <View style={[styles.infoItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                    <View style={[styles.iconBox, { backgroundColor: colors.surface }]}>
                                        <Ionicons name="pricetag" size={20} color="#2E7D32" />
                                    </View>
                                    <View style={isRTL ? { alignItems: 'flex-end', marginRight: 12 } : [styles.infoItemIconSpacer, { alignItems: 'flex-start' }]}>
                                        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('Prix / Personne')}</Text>
                                        <Text style={[styles.infoValue, { color: colors.primary }]}>{item.price} DT</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <Text style={[styles.sectionTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>{t('Inclus dans le pack')}</Text>
                            <View style={[styles.featuresGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                {item.features.map((feature, index) => (
                                    <View key={index} style={[styles.featureItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                        <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
                                        <Text style={[styles.featureText, isRTL ? { marginRight: 8, color: colors.textSecondary, textAlign: 'right' } : [styles.featureIconSpacer, { color: colors.textSecondary, textAlign: 'left' }]]}>{feature}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.divider} />

                            <Text style={[styles.sectionTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>{t('Description')}</Text>
                            <Text style={[styles.descriptionText, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{item.description}</Text>

                            <View style={styles.divider} />

                            <Text style={[styles.sectionTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>{t('Programme')}</Text>
                            {item.program.map((day, idx) => (
                                <View key={idx} style={[styles.programItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                    <View style={[styles.timelineDot, timelineDotSpacingStyle, { backgroundColor: colors.primary }]} />
                                    {idx !== item.program.length - 1 && <View style={[styles.timelineLine, timelineLinePositionStyle, { backgroundColor: colors.divider }]} />}
                                    <View style={[styles.programContent, { backgroundColor: colors.surface, alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                                        <Text style={[styles.programDay, { color: colors.primary }]}>{day.day}</Text>
                                        <Text style={[styles.programTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>{day.title}</Text>
                                        <Text style={[styles.programDesc, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{day.desc}</Text>
                                    </View>
                                </View>
                            ))}

                            <View style={{ height: 100 }} />
                        </ScrollView>

                        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.divider, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                                <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>{t('Total à payer')}</Text>
                                <Text style={[styles.totalPrice, { color: colors.primary }]}>{item.price} DT</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.bookButton, { backgroundColor: colors.primary, flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                                onPress={() => {
                                    const reservationPath = '/(umrah_agence)/(screens)/(pack_umrah)/reservation_pack';
                                    const reservationParams = {
                                        id: item.id,
                                        agencyId: item.agencyId || '',
                                        title: item.title,
                                        agencyName: item.agencyName,
                                        price: String(item.price),
                                        date: item.date,
                                        // On ne passe plus l'image ou le logo ici car ils peuvent être massifs (base64)
                                    };
                                    router.push({
                                        pathname: reservationPath as any,
                                        params: reservationParams
                                    });
                                }}
                            >
                                <Text style={styles.bookButtonText}>{t('Réserver maintenant')}</Text>
                                <Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={20} color="#fff" style={isRTL ? { marginRight: 10 } : styles.bookButtonArrowSpacer} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        backgroundColor: '#FFFFFF',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'center',
    },
    imageContainer: {
        height: 300,
        width: '100%',
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    headerSafeArea: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    headerRight: {
        flexDirection: 'row',
    },
    headerRightButtonSpacer: {
        marginLeft: 15,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        flex: 1,
        marginTop: -30,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        overflow: 'hidden',
    },
    scrollContent: {
        padding: 20,
    },
    titleSection: {
        marginBottom: 24,
    },
    agencyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    agencyLogoSpacer: {
        marginLeft: 10,
    },
    agencyLogoWrapper: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    agencyLogoImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    agencyNameHighlight: {
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    packTitleLarge: {
        fontSize: 28,
        fontWeight: '900',
        lineHeight: 34,
        marginBottom: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    infoItemIconSpacer: {
        marginLeft: 12,
    },
    iconBox: {
        width: 45,
        height: 45,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
        marginHorizontal: -7.5,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '45%',
        marginHorizontal: 7.5,
        marginBottom: 12,
    },
    featureIconSpacer: {
        marginLeft: 8,
    },
    featureText: {
        fontSize: 14,
    },
    descriptionText: {
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 20,
    },
    programItem: {
        flexDirection: 'row',
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: 5,
        zIndex: 1,
    },
    timelineDotLTR: {
        marginRight: 15,
    },
    timelineDotRTL: {
        marginLeft: 15,
    },
    timelineLine: {
        position: 'absolute',
        top: 17,
        bottom: -20,
        width: 2,
    },
    timelineLineLTR: {
        left: 15,
    },
    timelineLineRTL: {
        right: 15,
    },
    programContent: {
        flex: 1,
        padding: 15,
        borderRadius: 12,
    },
    programDay: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    programTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    programDesc: {
        fontSize: 13,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingVertical: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    totalLabel: {
        fontSize: 12,
    },
    totalPrice: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    bookButton: {
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 5,
    },
    bookButtonArrowSpacer: {
        marginLeft: 10,
    },
    bookButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
});
