import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTrans } from '@/hooks/useTrans';
import { SERVER_BASE_URL } from '@/services/api';

const PRIMARY = '#2C5F2D';

interface UmrahPack {
    id: string;
    agencyId?: string;
    agencyName: string;
    agencyLogo: string | null;
    title: string;
    date: string;
    price: number;
    rating: number;
    image: string | null;
    features: string[];
    description?: string;
    address?: string;
}

interface PackCardProps {
    item: UmrahPack;
    isDarkMode: boolean;
    isRTL: boolean;
    isFavorite: (id: string) => boolean;
    onToggleFavorite: (item: UmrahPack) => void;
    onPress: (id: string) => void;
}

const getSafeImageUri = (value: string | null | undefined) => {
    if (!value || typeof value !== 'string') return null;
    const trimmedValue = value.trim();
    if (/^https?:\/\//i.test(trimmedValue) && trimmedValue.length <= 4096) {
        try {
            const url = new URL(trimmedValue);
            const blockedHosts = new Set(['localhost', '127.0.0.1', '10.0.2.2']);
            if (blockedHosts.has(url.hostname)) {
                const server = new URL(SERVER_BASE_URL);
                url.hostname = server.hostname;
                return url.toString();
            }
        } catch {
            // ignore
        }
        return trimmedValue;
    }
    return null;
};

const PackCard: React.FC<PackCardProps> = ({
    item,
    isDarkMode,
    isRTL,
    isFavorite,
    onToggleFavorite,
    onPress,
}) => {
    const { t } = useTrans();
    const TXT = isDarkMode ? '#fff' : '#1C1C1E';
    const TXT_SEC = isDarkMode ? '#8E8E93' : '#636366';
    const CARD = isDarkMode ? '#1C1C1E' : '#FFFFFF';
    const BD = isDarkMode ? '#38383A' : '#E5E5EA';

    return (
        <TouchableOpacity
            style={[styles.packCard, { backgroundColor: CARD, borderColor: BD }]}
            activeOpacity={0.9}
            onPress={() => onPress(item.id)}
        >
            <View style={styles.imageContainer}>
                {getSafeImageUri(item.image) ? (
                    <Image 
                        source={{ uri: getSafeImageUri(item.image)! }} 
                        style={styles.packImage} 
                        cachePolicy="disk"
                        contentFit="cover"
                    />
                ) : (
                    <View style={[styles.packImage, { backgroundColor: '#EEF6EF' }]} />
                )}
                <TouchableOpacity
                    style={[styles.favoriteButton, isRTL ? { left: 10, right: undefined } : { right: 10, left: undefined }]}
                    onPress={() => onToggleFavorite(item)}
                >
                    <Ionicons
                        name={isFavorite(item.id) ? "heart" : "heart-outline"}
                        size={18}
                        color={isFavorite(item.id) ? "#E2725B" : "#fff"}
                    />
                </TouchableOpacity>
                <View style={[styles.ratingBadge, { backgroundColor: 'rgba(255,255,255,0.9)' }, isRTL ? { right: 10, left: undefined, flexDirection: 'row-reverse' } : { left: 10, right: undefined, flexDirection: 'row' }]}>
                    <Ionicons name="star" size={10} color="#FFD700" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
            </View>

            <View style={[styles.packContent, { alignItems: 'stretch' }]}>
                <View style={[styles.agencyHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={[styles.agencyRow, { flex: 1, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        {getSafeImageUri(item.agencyLogo) ? (
                            <Image 
                                source={{ uri: getSafeImageUri(item.agencyLogo)! }} 
                                style={styles.agencyLogo} 
                                cachePolicy="disk"
                                contentFit="cover"
                            />
                        ) : (
                            <View style={[styles.agencyLogo, styles.agencyLogoFallback]}>
                                <Ionicons name="business-outline" size={10} color={PRIMARY} />
                            </View>
                        )}
                        <Text style={[styles.agencyName, { color: TXT_SEC }]} numberOfLines={1}>{item.agencyName}</Text>
                    </View>
                </View>

                <Text style={[styles.packTitle, { color: TXT, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{item.title}</Text>

                <View style={[styles.cardFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={[styles.dateRow, { flex: 1, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Ionicons name="calendar-outline" size={12} color={PRIMARY} />
                        <Text style={[styles.dateText, { color: TXT_SEC }]}>{item.date}</Text>
                    </View>
                    <View style={[styles.priceContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Text style={[styles.priceValue, { color: PRIMARY }]}>{item.price}</Text>
                        <Text style={[styles.priceUnit, { color: PRIMARY }]}>DT</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    packCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
            android: { elevation: 2 },
        }),
    },
    imageContainer: {
        height: 110,
    },
    packImage: {
        width: '100%',
        height: '100%',
    },
    favoriteButton: {
        position: 'absolute',
        top: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    ratingBadge: {
        position: 'absolute',
        bottom: 10,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    ratingText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#000',
    },
    packContent: {
        padding: 10,
    },
    agencyHeader: {
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    agencyRow: {
        alignItems: 'center',
        marginBottom: 6,
        gap: 6,
    },
    agencyLogo: {
        width: 16,
        height: 16,
        borderRadius: 8,
    },
    agencyLogoFallback: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EEF6EF',
    },
    agencyName: {
        fontSize: 12,
        fontWeight: '600',
    },
    packTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
    },
    dateRow: {
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    dateText: {
        fontSize: 11,
    },
    cardFooter: {
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    priceContainer: {
        alignItems: 'baseline',
        gap: 2,
    },
    priceValue: {
        fontSize: 16,
        fontWeight: '800',
    },
    priceUnit: {
        fontSize: 11,
        fontWeight: '600',
    },
    bookBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    bookBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 11,
    },
});

export default PackCard;
