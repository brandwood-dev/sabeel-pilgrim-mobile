import { useThemeColors } from '@/hooks/useThemeColors';
import { useTrans } from '@/hooks/useTrans';
import { RootState } from '@/store/store';
import { toggleHotelFavorite } from '@/store/umrahSlice';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Platform,
    ActivityIndicator
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Hotel } from './types';

const { width } = Dimensions.get('window');

const PRIMARY = '#2C5F2D';
const TERRACOTTA = '#E2725B';

const mockHotels: Hotel[] = [];

export function HotelList({
    searchQuery: externalQuery,
    filter
}: {
    searchQuery?: string;
    filter?: { rating: number | null, location: string }
}) {
    const router = useRouter();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const dispatch = useDispatch();
    const hotelFavorites = useSelector((state: RootState) => state.umrah.hotelFavorites);
    const { t, language, translateDynamic } = useTrans();

    const [hotels, setHotels] = React.useState<Hotel[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [selectedCity, setSelectedCity] = React.useState('Makkah');

    const REGIONS = {
        'Makkah': { code: 'JED', lat: 21.4225, lng: 39.8262 },
        'Madinah': { code: 'MED', lat: 24.4672, lng: 39.6111 },
        'Jeddah': { code: 'JED', lat: 21.5433, lng: 39.1728 },
        'Taif': { code: 'TIF', lat: 21.2703, lng: 40.4158 },
        'Al Jumum': { lat: 21.6167, lng: 39.7 },
        'Bahrah': { lat: 21.4111, lng: 39.4674 },
        'Jabal An Nur': { lat: 21.4580, lng: 39.8571 },
    };

    const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    };

    const fetchAmadeusHotels = async (cityName: string) => {
        setLoading(true);
        try {
            const { amadeusApi } = await import('@/services/api');
            const region: any = REGIONS[cityName as keyof typeof REGIONS];
            
            let response;
            if (region && region.code) {
                response = await amadeusApi.searchHotels(region.code);
            } else {
                response = await amadeusApi.searchHotelsByGeocode(region.lat, region.lng, 10);
            }

            const hotelList = Array.isArray(response) ? response : (response as any).data || [];
            
            const hotelIds = hotelList.slice(0, 15).map((h: any) => h.hotelId).join(',');
            let offers: any[] = [];
            if (hotelIds) {
                try {
                    const offersRes = await amadeusApi.getHotelOffers(hotelIds);
                    offers = Array.isArray(offersRes) ? offersRes : (offersRes as any).data || [];
                } catch (e) {
                    console.log('Could not fetch hotel offers');
                }
            }

            const targetCoords = { lat: region.lat, lng: region.lng };
            const mapped: Hotel[] = hotelList.map((h: any) => {
                const offer = offers.find((o: any) => o.hotel.hotelId === h.hotelId);
                const googlePhotos = offer?.hotel?.google_photos || h.google_photos || [];
                const photoUrl = googlePhotos[0] || offer?.hotel?.media?.[0]?.uri || 
                                `https://loremflickr.com/800/600/hotel,luxury,lobby?lock=${h.hotelId ? h.hotelId.split('').reduce((a:any,b:any)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0) : 0}`;
                
                const dist = getDistanceInMeters(h.geoCode?.latitude || targetCoords.lat, h.geoCode?.longitude || targetCoords.lng, targetCoords.lat, targetCoords.lng);

                return {
                    id: h.hotelId,
                    name: h.name,
                    location: cityName,
                    rating: offer?.hotel?.google_rating || h.google_rating || 4 + Math.floor(Math.random() * 2),
                    price: offer ? Math.round(parseFloat(offer.offers[0].price.total)) : 180 + Math.floor(Math.random() * 400),
                    image: { uri: photoUrl },
                    distance: dist < 1000 ? `${dist} m de ${cityName}` : `${(dist/1000).toFixed(1)} km de ${cityName}`,
                    amenities: offer?.hotel?.amenities?.slice(0, 6) || ['wifi', 'snowflake', 'coffee'],
                    description: offer?.hotel?.description?.text || `Découvrez le confort à ${cityName} dans cet établissement de prestige.`,
                    latitude: h.geoCode?.latitude || targetCoords.lat,
                    longitude: h.geoCode?.longitude || targetCoords.lng,
                    partnerUrl: `https://www.booking.com/searchresults.fr.html?ss=${encodeURIComponent(h.name)}`,
                    images: googlePhotos.length > 0 ? googlePhotos.map((url: string) => ({ uri: url })) : [],
                };
            }).sort((a: any, b: any) => {
                const distA = parseInt(a.distance);
                const distB = parseInt(b.distance);
                return distA - distB;
            });

            setHotels(mapped);
        } catch (error) {
            console.error('Error fetching hotels:', error);
            setHotels(mockHotels.filter(h => h.location === cityName));
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchAmadeusHotels(selectedCity);
    }, [selectedCity]);

    const filteredHotels = hotels.filter(hotel => {
        const query = (externalQuery || '').toLowerCase();
        return hotel.name.toLowerCase().includes(query) || hotel.location.toLowerCase().includes(query);
    });

    const isFavorite = (id: string) => hotelFavorites.some((fav: any) => fav.id === id);

    const handleToggleFavorite = (hotel: Hotel) => {
        dispatch(toggleHotelFavorite(hotel));
    };

    const TXT = isDarkMode ? '#fff' : '#1C1C1E';
    const TXT_SEC = isDarkMode ? '#8E8E93' : '#636366';
    const CARD = isDarkMode ? '#1C1C1E' : '#FFFFFF';
    const BD = isDarkMode ? '#38383A' : '#E5E5EA';

    const CityTabs = () => (
        <View style={{ marginTop: 12 }}>
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={Object.keys(REGIONS)}
                keyExtractor={(item) => item}
                contentContainerStyle={{ gap: 8, paddingLeft: 20 }}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={[styles.tab, selectedCity === item && { backgroundColor: PRIMARY }]} 
                        onPress={() => setSelectedCity(item)}
                    >
                        <Text style={[styles.tabText, selectedCity === item && { color: '#fff' }]}>{t(item)}</Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: isDarkMode ? '#000' : '#F8F9FA' }}>
            <FlatList
                data={filteredHotels}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={() => (
                    <View style={styles.listHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 }}>
                            <Text style={[styles.listHeaderTitle, { color: TXT }]}>{t('Hôtels')}</Text>
                            <TouchableOpacity 
                                onPress={() => router.push({
                                    pathname: '/(umrah_agence)/(umrah_solo)/hotels/map_hotel',
                                    params: { 
                                         hotelIds: filteredHotels.slice(0, 50).map(h => h.id).join(',')
                                    }
                                })}
                                style={[styles.mapHeaderBtn, { backgroundColor: PRIMARY + '15' }]}
                            >
                                <Ionicons name="map" size={18} color={PRIMARY} />
                                <Text style={[styles.mapHeaderBtnText, { color: PRIMARY }]}>{t('Carte')}</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <CityTabs />
                        {loading && <ActivityIndicator size="small" color={PRIMARY} style={{ marginTop: 15 }} />}
                    </View>
                )}
                renderItem={({ item }) => {
                    const navigateToDetails = () => {
                        router.push({
                            pathname: '/(umrah_agence)/(umrah_solo)/hotels/details_hotels',
                            params: {
                                id: item.id,
                                name: item.name,
                                location: item.location,
                                rating: item.rating.toString(),
                                distance: item.distance,
                                price: item.price.toString(),
                                latitude: item.latitude.toString(),
                                longitude: item.longitude.toString(),
                                partnerUrl: item.partnerUrl || 'https://www.booking.com',
                            }
                        });
                    };

                    return (
                        <TouchableOpacity
                            style={[styles.card, { backgroundColor: CARD, borderColor: BD }]}
                            activeOpacity={0.9}
                            onPress={navigateToDetails}
                        >
                            <View style={styles.cardHorizontal}>
                                <View style={styles.imageContainer}>
                                    <Image source={item.image} style={styles.cardImage} />
                                    <View style={[styles.ratingBadge, { backgroundColor: isDarkMode ? '#3a361a' : '#FFF9C4' }]}>
                                        <Ionicons name="star" size={10} color="#FFD700" />
                                        <Text style={[styles.ratingText, { color: isDarkMode ? '#FFD700' : '#F57F17' }]}>{item.rating}</Text>
                                    </View>
                                </View>

                                <View style={styles.cardContent}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Text style={[styles.hotelTitle, { color: TXT }]} numberOfLines={1}>{item.name}</Text>
                                        <TouchableOpacity onPress={() => handleToggleFavorite(item)}>
                                            <Ionicons
                                                name={isFavorite(item.id) ? "heart" : "heart-outline"}
                                                size={18}
                                                color={isFavorite(item.id) ? TERRACOTTA : TXT_SEC}
                                            />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.locationRow}>
                                        <Ionicons name="location" size={12} color={PRIMARY} />
                                        <Text style={[styles.locationText, { color: TXT_SEC }]} numberOfLines={1}>{item.location} • {item.distance}</Text>
                                    </View>

                                    <View style={styles.priceContainer}>
                                        <Text style={[styles.priceValue, { color: PRIMARY }]}>{item.price} {t('DT')}</Text>
                                        <Text style={[styles.priceUnit, { color: TXT_SEC }]}>{t('/ nuit')}</Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );
}

export default function HotelsScreen() {
    const { t } = useTrans();
    const router = useRouter();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

    return (
        <View style={{ flex: 1, backgroundColor: isDarkMode ? '#000' : '#F8F9FA' }}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: isDarkMode ? '#38383A' : '#E5E5EA',
                backgroundColor: isDarkMode ? '#1C1C1E' : '#fff'
            }}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
                    <Ionicons name="arrow-back" size={24} color={PRIMARY} />
                </TouchableOpacity>
                <Text style={{ fontSize: 17, fontWeight: '700', color: PRIMARY, marginLeft: 12 }}>{t('Hôtels Umrah')}</Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                    onPress={() => router.push('/(umrah_agence)/(umrah_solo)/hotels/map_hotel')}
                    style={{ padding: 8 }}
                >
                    <Ionicons name="map-outline" size={22} color={PRIMARY} />
                </TouchableOpacity>
            </View>
            <HotelList />
        </View>
    );
}

const styles = StyleSheet.create({
    listHeader: {
        paddingTop: 10,
        paddingBottom: 12,
    },
    listHeaderTitle: {
        fontSize: 20,
        fontWeight: '800',
    },
    listContent: {
        paddingBottom: 100,
        paddingTop: 4,
    },
    mapHeaderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        gap: 4,
    },
    mapHeaderBtnText: {
        fontSize: 12,
        fontWeight: '700',
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 15,
        backgroundColor: '#F2F2F7',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
    },
    card: {
        marginHorizontal: 16,
        marginBottom: 10,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
            android: { elevation: 1 },
        }),
    },
    cardHorizontal: {
        flexDirection: 'row',
        height: 100,
    },
    imageContainer: {
        width: 100,
        height: 100,
        position: 'relative',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    favoriteButton: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 4,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '700',
    },
    cardContent: {
        flex: 1,
        padding: 10,
        justifyContent: 'space-between',
    },
    hotelTitle: {
        fontSize: 15,
        fontWeight: '700',
        flex: 1,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    locationText: {
        fontSize: 12,
    },
    priceContainer: {
        flexDirection: 'row',
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
});
