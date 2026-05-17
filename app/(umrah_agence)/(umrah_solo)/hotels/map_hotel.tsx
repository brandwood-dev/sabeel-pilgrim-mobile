import { useThemeColors } from '@/hooks/useThemeColors';
import { RootState } from '@/store/store';
import { toggleHotelFavorite } from '@/store/umrahSlice';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Ionicons from '@expo/vector-icons/Ionicons';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Hotel, KAABA_COORDINATES, MAPBOX_TOKEN } from './types';

// Set Mapbox token
MapboxGL.setAccessToken(MAPBOX_TOKEN);

const { MapView, Camera, PointAnnotation, ShapeSource, LineLayer, UserLocation } = MapboxGL as any;

const PRIMARY_COLOR = '#2C5F2D';
const ACCENT_COLOR = '#d9ab83';
const TERRACOTTA = '#E2725B';
const BACKGROUND_COLOR = '#f8f7f2';
const TEXT_LIGHT = '#666';

const { width, height } = Dimensions.get('window');

const mockHotels: Hotel[] = [];

export default function MapHotelScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const params = useLocalSearchParams();

    // Parse dynamic hotels from search screen
    const [hotelsToShow, setHotelsToShow] = useState<Hotel[]>(mockHotels);
    const hotelIds = params.hotelIds as string;

    useEffect(() => {
        if (hotelIds) {
            // For now, we still need mock data logic or a real API call
            // Since we only have IDs, we should ideally fetch them from an API
            // As a temporary fix to prevent the crash, we filter from a local list if possible
            // or just show the selected one if it's a single hotel
        }
    }, [hotelIds]);

    // Check if we're showing a single hotel from details page
    const showSingleHotel = params.hotelId ? true : false;
    const showRoute = params.showRoute === 'true';
    const singleHotelData = useMemo(() => showSingleHotel ? {
        id: params.hotelId as string,
        name: params.name as string,
        location: params.location as string || 'Mecca',
        rating: parseFloat(params.rating as string) || 4,
        price: parseFloat(params.price as string) || 0,
        image: typeof params.image === 'object' ? params.image : { uri: params.image === 'mock' ? 'https://loremflickr.com/800/600/hotel' : params.image },
        distance: params.distance as string || '0 m',
        latitude: parseFloat(params.latitude as string) || 21.4225,
        longitude: parseFloat(params.longitude as string) || 39.8262,
        partnerUrl: params.partnerUrl as string || 'https://www.booking.com',
    } as Hotel : null, [params.hotelId, params.name, params.location, params.rating, params.price, params.image, params.distance, params.latitude, params.longitude, params.partnerUrl]);

    const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(singleHotelData);

    const [mapLoading, setMapLoading] = useState(true);
    const [showRouteOnMap, setShowRouteOnMap] = useState(showRoute);
    const [routeCoordinates, setRouteCoordinates] = useState<number[][]>([]);
    const [routeDistance, setRouteDistance] = useState<string>('');
    const [routeDuration, setRouteDuration] = useState<string>('');
    const [loadingRoute, setLoadingRoute] = useState(false);
    const [cityName, setCityName] = useState<string>('City centre');
    const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
    const [showUserLocation, setShowUserLocation] = useState(false);
    const [mapStyle, setMapStyle] = useState<string>('mapbox://styles/mapbox/outdoors-v12');
    const [showStyleModal, setShowStyleModal] = useState(false);
    const cameraRef = useRef<any>(null);
    const dispatch = useDispatch();
    const hotelFavorites = useSelector((state: RootState) => state.umrah.hotelFavorites);
    const [clickedLocation, setClickedLocation] = useState<{ latitude: number, longitude: number } | null>(null);

    // Real-time navigation states
    const [isNavigating, setIsNavigating] = useState(false);
    const [remainingDistance, setRemainingDistance] = useState<string>('');
    const [remainingTime, setRemainingTime] = useState<string>('');
    const [currentInstruction, setCurrentInstruction] = useState<string>('Démarrez la navigation');
    const [navigationSteps, setNavigationSteps] = useState<any[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const locationSubscription = useRef<any>(null);

    // Check if current hotel is in favorites
    const isFavorite = selectedHotel && hotelFavorites.some((fav: any) => fav.id === selectedHotel.id);

    const renderStars = (rating: number) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <FontAwesome5
                    key={i}
                    name="star"
                    size={10}
                    solid={i <= rating}
                    color={i <= rating ? '#F59E0B' : '#D1D5DB'}
                    style={{ marginRight: 2 }}
                />
            );
        }
        return stars;
    };

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    };

    const deg2rad = (deg: number): number => {
        return deg * (Math.PI / 180);
    };

    const getDistanceToHaram = (): string => {
        if (!selectedHotel) return '0 m';
        if (routeDistance) return routeDistance;
        const distance = calculateDistance(selectedHotel.latitude, selectedHotel.longitude, KAABA_COORDINATES.latitude, KAABA_COORDINATES.longitude);
        if (distance < 1) return `${Math.round(distance * 1000)} m`;
        return `${distance.toFixed(2)} km`;
    };

    const getCityName = async (latitude: number, longitude: number) => {
        try {
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.features && data.features.length > 0) {
                const place = data.features.find((f: any) => f.place_type.includes('place') || f.place_type.includes('locality'));
                setCityName(place ? place.text : data.features[0].place_name.split(',')[0]);
            }
        } catch (error) {
            console.error('Error getting city name:', error);
        }
    };

    const handleMapPress = async (event: any) => {
        try {
            if (!event || !event.geometry || !event.geometry.coordinates) return;
            const { coordinates } = event.geometry;
            const [longitude, latitude] = coordinates;
            setClickedLocation({ latitude, longitude });
            await getCityName(latitude, longitude);
            if (cameraRef.current) cameraRef.current.setCamera({ centerCoordinate: [longitude, latitude], zoomLevel: 14, animationDuration: 500 });
        } catch (error) {
            console.error('Error handling map press:', error);
        }
    };

    const getUserLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission refusée', 'Veuillez autoriser l\'accès à votre position');
                return;
            }
            const location = await Location.getCurrentPositionAsync({});
            setUserLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
            setShowUserLocation(true);
            if (cameraRef.current) cameraRef.current.setCamera({ centerCoordinate: [location.coords.longitude, location.coords.latitude], zoomLevel: 15, animationDuration: 1000 });
        } catch (error) {
            Alert.alert('Erreur', 'Impossible d\'obtenir votre position');
        }
    };

    const handleCityCenterClick = () => {
        if (cameraRef.current) cameraRef.current.setCamera({ centerCoordinate: [KAABA_COORDINATES.longitude, KAABA_COORDINATES.latitude], zoomLevel: 14, animationDuration: 1000 });
    };

    const mapStyles = [
        { name: 'Default', url: 'mapbox://styles/mapbox/outdoors-v12', icon: 'map-outline' },
        { name: 'Dark', url: 'mapbox://styles/mapbox/dark-v11', icon: 'moon-outline' },
        { name: 'Satellite', url: 'mapbox://styles/mapbox/satellite-streets-v12', icon: 'planet' },
    ];

    const handleStyleChange = (styleUrl: string) => {
        setMapStyle(styleUrl);
        setShowStyleModal(false);
    };

    useEffect(() => {
        getCityName(KAABA_COORDINATES.latitude, KAABA_COORDINATES.longitude);
    }, []);

    const handleToggleFavorite = () => {
        if (!selectedHotel) return;
        const img: any = (selectedHotel as any).image;
        const safeImageUri = typeof img === 'string' ? img : (img && typeof img === 'object' && img.uri ? img.uri : null);

        const images: any[] | undefined = (selectedHotel as any).images;
        const imagesArray = Array.isArray(images)
            ? images
                .map((v: any) => typeof v === 'string' ? v : (v && typeof v === 'object' && v.uri ? v.uri : null))
                .filter((u: any) => typeof u === 'string') as string[]
            : undefined;

        const hotelForFavorite = {
            id: selectedHotel.id,
            name: selectedHotel.name,
            location: selectedHotel.location,
            rating: selectedHotel.rating,
            price: selectedHotel.price,
            image: safeImageUri as string | null,
            distance: selectedHotel.distance,
            amenities: selectedHotel.amenities || [],
            latitude: selectedHotel.latitude,
            longitude: selectedHotel.longitude,
            description: selectedHotel.description,
            images: imagesArray,
            partnerUrl: selectedHotel.partnerUrl,
        };
        dispatch(toggleHotelFavorite(hotelForFavorite));
    };

    const handleShareHotel = async () => {
        if (!selectedHotel) return;
        try {
            const shareUrl = `sabeel://hotels/map_hotel?hotelId=${selectedHotel.id}&name=${encodeURIComponent(selectedHotel.name)}`;
            await Share.share({
                message: `Découvrez cet hôtel: ${selectedHotel.name}\nNote: ${selectedHotel.rating}/5\nPrix: TND ${selectedHotel.price}\n\n${shareUrl}`,
                title: `Partager ${selectedHotel.name}`,
            });
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de partager cet hôtel');
        }
    };

    const fetchRoute = async () => {
        if (!selectedHotel) return;
        setLoadingRoute(true);
        try {
            const start = `${selectedHotel.longitude},${selectedHotel.latitude}`;
            const end = `${KAABA_COORDINATES.longitude},${KAABA_COORDINATES.latitude}`;
            const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${start};${end}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                setRouteCoordinates(route.geometry.coordinates);
                setRouteDistance(route.distance < 1000 ? `${Math.round(route.distance)} m` : `${(route.distance / 1000).toFixed(2)} km`);
                setRouteDuration(`${Math.round(route.duration / 60)} min`);
                setShowRouteOnMap(true);
            }
        } catch (error) {
            console.error('Error fetching route:', error);
        } finally {
            setLoadingRoute(false);
        }
    };

    const routeGeoJSON = routeCoordinates.length > 0 ? { type: 'Feature', geometry: { type: 'LineString', coordinates: routeCoordinates } } : null;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.mapContainer}>
                {mapLoading && (<View style={[styles.mapLoading, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /><Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement de la carte...</Text></View>)}
                <MapView
                    style={styles.map}
                    styleURL={mapStyle}
                    logoEnabled={false}
                    attributionEnabled={false}
                    onDidFinishLoadingMap={() => setMapLoading(false)}
                    onPress={handleMapPress}
                >
                    <Camera
                        ref={cameraRef}
                        zoomLevel={selectedHotel ? 15 : 13}
                        centerCoordinate={[
                            selectedHotel?.longitude || KAABA_COORDINATES.longitude, 
                            selectedHotel?.latitude || KAABA_COORDINATES.latitude
                        ]}
                        animationMode={'flyTo'}
                        animationDuration={1000}
                    />
                    {showUserLocation && <UserLocation visible={true} />}
                    {showRouteOnMap && selectedHotel && (
                        <ShapeSource id="routeSource" shape={routeGeoJSON as any}>
                            <LineLayer id="routeLine" style={{ lineColor: PRIMARY_COLOR, lineWidth: 3, lineCap: 'round', lineJoin: 'round' }} />
                        </ShapeSource>
                    )}
                    {hotelsToShow.map((hotel) => (
                        <PointAnnotation
                            key={hotel.id}
                            id={`hotel-${hotel.id}`}
                            coordinate={[hotel.longitude, hotel.latitude]}
                            onSelected={() => setSelectedHotel(hotel)}
                        >
                            <TouchableOpacity
                                style={[styles.priceMarker, selectedHotel?.id === hotel.id && styles.priceMarkerSelected]}
                                onPress={() => {
                                    setSelectedHotel(hotel);
                                    if (cameraRef.current) cameraRef.current.setCamera({ centerCoordinate: [hotel.longitude, hotel.latitude], zoomLevel: 15, animationDuration: 500 });
                                }}
                            >
                                <Text style={[styles.priceMarkerText, selectedHotel?.id === hotel.id && styles.priceMarkerTextSelected]}>
                                    TND {hotel.price}
                                </Text>
                            </TouchableOpacity>
                        </PointAnnotation>
                    ))}
                    <PointAnnotation id="kaaba-marker" coordinate={[KAABA_COORDINATES.longitude, KAABA_COORDINATES.latitude]}><View style={styles.kaabaMarker}><Ionicons name="moon" size={20} color="#fff" /></View></PointAnnotation>
                    {clickedLocation && (
                        <PointAnnotation id="clicked-location" coordinate={[clickedLocation.longitude, clickedLocation.latitude]}>
                            <View style={styles.clickedLocationMarker}><Ionicons name="location" size={28} color={PRIMARY_COLOR} /></View>
                        </PointAnnotation>
                    )}
                </MapView>

                <View style={styles.floatingHeader}>
                    <TouchableOpacity onPress={() => router.back()} style={[styles.floatingBackButton, { backgroundColor: colors.surface }]}><Ionicons name="close" size={28} color={colors.text} /></TouchableOpacity>
                    <TouchableOpacity style={[styles.cityBadge, { backgroundColor: colors.surface }]} onPress={handleCityCenterClick}><Ionicons name="location" size={18} color={colors.primary} /><Text style={[styles.cityText, { color: colors.text }]}>{cityName}</Text></TouchableOpacity>
                    <View style={styles.floatingActions}>
                        <TouchableOpacity style={[styles.floatingActionButton, { backgroundColor: colors.surface }]} onPress={handleToggleFavorite}><Ionicons name={isFavorite ? "heart" : "heart-outline"} size={22} color={isFavorite ? TERRACOTTA : colors.text} /></TouchableOpacity>
                        <TouchableOpacity style={[styles.floatingActionButton, { backgroundColor: colors.surface, marginLeft: 10 }]} onPress={handleShareHotel}><Ionicons name="share-social-outline" size={22} color={colors.text} /></TouchableOpacity>
                    </View>
                </View>

                <View style={styles.mapControls}>
                    <TouchableOpacity style={[styles.controlButton, { backgroundColor: colors.surface }]} onPress={() => setShowStyleModal(true)}><Ionicons name="map" size={24} color={colors.text} /></TouchableOpacity>
                    <TouchableOpacity style={[styles.controlButton, { backgroundColor: colors.surface, marginTop: 12 }]} onPress={getUserLocation}><Ionicons name="navigate" size={24} color={colors.primary} /></TouchableOpacity>
                </View>
            </View>

            <Modal visible={showStyleModal} transparent={true} animationType="fade" onRequestClose={() => setShowStyleModal(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowStyleModal(false)}>
                    <View style={[styles.styleModal, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.styleModalTitle, { color: colors.text }]}>Style de carte</Text>
                        {mapStyles.map((style, index) => (
                            <TouchableOpacity key={index} style={[styles.styleOption, mapStyle === style.url && { backgroundColor: 'rgba(0,0,0,0.05)' }]} onPress={() => handleStyleChange(style.url)}>
                                <Ionicons name={style.icon as any} size={24} color={mapStyle === style.url ? colors.primary : colors.text} />
                                <Text style={[styles.styleOptionText, { color: colors.text }, mapStyle === style.url && { color: colors.primary, fontWeight: '700' }]}>{style.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            <View style={styles.carouselContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={hotelsToShow}
                    keyExtractor={(item) => `card-${item.id}`}
                    snapToInterval={width - 50}
                    decelerationRate="fast"
                    contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity 
                            style={[styles.carouselCard, { backgroundColor: colors.surface, borderColor: selectedHotel?.id === item.id ? ACCENT_COLOR : colors.divider, borderWidth: selectedHotel?.id === item.id ? 2 : 1 }]}
                            onPress={() => {
                                setSelectedHotel(item);
                                if (cameraRef.current) cameraRef.current.setCamera({ centerCoordinate: [item.longitude, item.latitude], zoomLevel: 15, animationDuration: 1000 });
                            }}
                        >
                            <Image source={item.image} style={styles.carouselImage} />
                            <View style={styles.carouselInfo}>
                                <Text style={[styles.carouselName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                                <View style={styles.carouselRating}>{renderStars(item.rating)}</View>
                                <View style={styles.carouselFooter}>
                                    <Text style={[styles.carouselPrice, { color: colors.primary }]}>TND {item.price}</Text>
                                    <Text style={[styles.carouselDist, { color: colors.textSecondary }]}>{item.distance}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    mapContainer: { flex: 1, position: 'relative' },
    map: { flex: 1 },
    mapLoading: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    loadingText: { marginTop: 10, fontSize: 14 },
    priceMarker: { backgroundColor: PRIMARY_COLOR, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 2, borderColor: '#fff' },
    priceMarkerSelected: { backgroundColor: ACCENT_COLOR },
    priceMarkerText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    priceMarkerTextSelected: { color: '#000' },
    kaabaMarker: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
    userLocationMarker: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(59, 130, 246, 0.2)', justifyContent: 'center', alignItems: 'center' },
    userLocationDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#3B82F6', borderWidth: 2, borderColor: '#fff' },
    clickedLocationMarker: { justifyContent: 'center', alignItems: 'center' },
    floatingHeader: { position: 'absolute', top: 50, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 100 },
    floatingBackButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    cityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, elevation: 4 },
    cityText: { fontSize: 15, fontWeight: '600', marginLeft: 4 },
    floatingActions: { flexDirection: 'row', alignItems: 'center' },
    floatingActionButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    mapControls: { position: 'absolute', right: 16, top: height / 4, zIndex: 100 },
    controlButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    styleModal: { width: width * 0.8, borderRadius: 20, padding: 20 },
    styleModalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15 },
    styleOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10 },
    styleOptionText: { fontSize: 16, marginLeft: 12, flex: 1 },
    carouselContainer: { position: 'absolute', bottom: 30, left: 0, right: 0, paddingBottom: 10 },
    carouselCard: { flex: 1, width: width - 60, height: 120, borderRadius: 20, flexDirection: 'row', padding: 10, elevation: 8, shadowColor: '#000', shadowOpacity: 0.2 },
    carouselImage: { width: 100, height: 100, borderRadius: 15 },
    carouselInfo: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
    carouselName: { fontSize: 16, fontWeight: '700' },
    carouselRating: { flexDirection: 'row' },
    carouselFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    carouselPrice: { fontSize: 15, fontWeight: '800' },
    carouselDist: { fontSize: 12 }
});
