import { useThemeColors } from '@/hooks/useThemeColors';
import { RootState } from '@/store/store';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MapboxGL from '@rnmapbox/maps';
import axios from 'axios';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSelector } from 'react-redux';

// Set Mapbox access token
const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
if (mapboxToken) {
    MapboxGL.setAccessToken(mapboxToken);
} else {
    console.warn('Mapbox access token is not set. Please set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in your .env file.');
}

const { MapView, Camera, PointAnnotation, UserLocation, ShapeSource, LineLayer } = MapboxGL as any;
const { width, height } = Dimensions.get('window');

interface Mosque {
    id: number;
    name: string;
    lat: number;
    lon: number;
    distance?: number;
    address?: string;
}

export default function MosqueScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const cameraRef = useRef<any>(null);

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [mosques, setMosques] = useState<Mosque[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [selectedMosque, setSelectedMosque] = useState<Mosque | null>(null);

    // Navigation / Routing states
    const [routeCoordinates, setRouteCoordinates] = useState<number[][] | null>(null);
    const [loadingRoute, setLoadingRoute] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [routeInfo, setRouteInfo] = useState<{ duration: number; distance: number } | null>(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission d\'accès à la localisation refusée');
                setLoading(false);
                return;
            }

            try {
                let loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                });
                setLocation(loc);
                fetchNearbyMosques(loc.coords.latitude, loc.coords.longitude);
            } catch (error) {
                console.error('Location error:', error);
                setErrorMsg('Impossible d\'obtenir votre position actuelle');
                setLoading(false);
            }
        })();
    }, []);

    // Listen for location changes during navigation
    useEffect(() => {
        let subscription: any;
        if (isNavigating) {
            (async () => {
                subscription = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        distanceInterval: 5,
                        timeInterval: 3000,
                    },
                    (newLoc) => {
                        setLocation(newLoc);
                        if (selectedMosque) {
                            fetchRoute(selectedMosque, newLoc);
                        }
                    }
                );
            })();
        }
        return () => subscription && subscription.remove();
    }, [isNavigating, selectedMosque]);

    const fetchNearbyMosques = async (lat: number, lon: number) => {
        setLoading(true);
        setErrorMsg(null);

        const endpoints = [
            'https://overpass-api.de/api/interpreter',
            'https://overpass.kumi.systems/api/interpreter',
            'https://overpass.openstreetmap.ru/api/interpreter'
        ];

        const query = `[out:json][timeout:25];(nwr(around:3000,${lat},${lon})[amenity=place_of_worship][religion=muslim];);out center;`;

        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(`${endpoint}?data=${encodeURIComponent(query)}`, {
                    timeout: 20000,
                });

                if (response.data && response.data.elements) {
                    const results = response.data.elements.map((el: any) => {
                        const latitude = el.type === 'node' ? el.lat : el.center.lat;
                        const longitude = el.type === 'node' ? el.lon : el.center.lon;

                        return {
                            id: el.id,
                            name: el.tags.name || el.tags['name:ar'] || el.tags['name:fr'] || 'Masjid / Mosquée',
                            lat: latitude,
                            lon: longitude,
                            distance: calculateDistance(lat, lon, latitude, longitude),
                            address: el.tags['addr:full'] || el.tags['addr:street'] || 'Adresse non spécifiée'
                        };
                    });

                    results.sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));
                    setMosques(results);
                    setLoading(false);
                    return;
                }
            } catch (error) {
                console.warn(`Failed to fetch from ${endpoint}:`, error);
            }
        }

        setErrorMsg('Toutes les tentatives de connexion au serveur ont échoué.');
        setLoading(false);
    };

    const fetchRoute = async (mosque: Mosque, currentLoc = location) => {
        if (!currentLoc) return;

        setLoadingRoute(true);
        try {
            const start = `${currentLoc.coords.longitude},${currentLoc.coords.latitude}`;
            const end = `${mosque.lon},${mosque.lat}`;
            const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
            if (!token) {
                console.error("Cannot fetch route: Mapbox access token is missing.");
                return;
            }

            // Mapbox Directions API - using walking profile for shortest pedestrian route
            const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${start};${end}?geometries=geojson&overview=full&access_token=${token}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.routes && data.routes.length > 0) {
                setRouteCoordinates(data.routes[0].geometry.coordinates);
                setRouteInfo({
                    duration: Math.round(data.routes[0].duration / 60),
                    distance: data.routes[0].distance / 1000
                });
            }
        } catch (error) {
            console.error('Error fetching route:', error);
        } finally {
            setLoadingRoute(false);
        }
    };

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const deg2rad = (deg: number) => deg * (Math.PI / 180);

    const handleMosquePress = (mosque: Mosque) => {
        setSelectedMosque(mosque);
        setIsNavigating(false); // Reset navigation when picking a new one
        setRouteCoordinates(null);
        fetchRoute(mosque);

        if (cameraRef.current) {
            cameraRef.current.setCamera({
                centerCoordinate: [mosque.lon, mosque.lat],
                zoomLevel: 15,
                animationDuration: 1000,
            });
        }
    };

    const toggleNavigation = () => {
        const newNavigatingState = !isNavigating;
        setIsNavigating(newNavigatingState);

        if (newNavigatingState && selectedMosque && cameraRef.current) {
            // Re-fetch route to ensure it starts from current exact position
            fetchRoute(selectedMosque);
            // Switch camera to follow mode
            cameraRef.current.setCamera({
                zoomLevel: 18,
                pitch: 60,
                heading: 0,
                animationDuration: 1000,
            });
        } else if (!newNavigatingState && cameraRef.current) {
            // Reset camera tilt
            cameraRef.current.setCamera({
                pitch: 0,
                zoomLevel: 14,
                animationDuration: 1000,
            });
        }
    };

    const stopNavigation = () => {
        setIsNavigating(false);
        setSelectedMosque(null);
        setRouteCoordinates(null);
        setRouteInfo(null);
        if (cameraRef.current) {
            cameraRef.current.setCamera({ pitch: 0, zoomLevel: 14 });
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            <View style={[styles.header, { backgroundColor: colors.surface }]}>
                <TouchableOpacity
                    onPress={() => isNavigating ? stopNavigation() : router.back()}
                    style={styles.backButton}
                    hitSlop={15}
                >
                    <Ionicons name={isNavigating ? "close" : "arrow-back"} size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    {isNavigating ? 'Mode Guidance' : 'Mosquées à proximité'}
                </Text>
                {!isNavigating && (
                    <TouchableOpacity
                        onPress={() => {
                            setSelectedMosque(null);
                            setRouteCoordinates(null);
                            if (location) fetchNearbyMosques(location.coords.latitude, location.coords.longitude);
                        }}
                        style={styles.refreshButton}
                        disabled={loading}
                        hitSlop={15}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <Ionicons name="refresh" size={22} color={colors.primary} />
                        )}
                    </TouchableOpacity>
                )}
            </View>

            {errorMsg ? (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={60} color="#FF4444" />
                    <Text style={[styles.errorText, { color: colors.text }]}>{errorMsg}</Text>
                    <TouchableOpacity
                        style={[styles.retryButton, { backgroundColor: colors.primary }]}
                        onPress={() => location && fetchNearbyMosques(location.coords.latitude, location.coords.longitude)}
                    >
                        <Text style={styles.retryText}>Réessayer</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <View style={styles.mapContainer}>
                        {(loading || loadingRoute) && !isNavigating && (
                            <View style={styles.mapLoadingOverlay}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={[styles.loaderText, { color: '#fff', marginTop: 10 }]}>
                                    {loadingRoute ? 'Optimisation du trajet...' : 'Recherche...'}
                                </Text>
                            </View>
                        )}
                        <MapView
                            style={styles.map}
                            styleURL={isDarkMode ? MapboxGL.StyleURL.Dark : MapboxGL.StyleURL.Street}
                            logoEnabled={false}
                            attributionEnabled={false}
                        >
                            <Camera
                                ref={cameraRef}
                                zoomLevel={14}
                                centerCoordinate={[location?.coords.longitude || 10.1815, location?.coords.latitude || 36.8065]}
                                animationMode={'flyTo'}
                                animationDuration={1000}
                                followUserLocation={isNavigating}
                                followUserMode={isNavigating ? "course" : "normal"}
                            />

                            <UserLocation
                                visible={true}
                                showsUserHeadingIndicator={true}
                                androidRenderMode="gps"
                            />

                            {/* Show Optimized Route Line */}
                            {routeCoordinates && (
                                <ShapeSource
                                    id="routeSource"
                                    shape={{
                                        type: 'Feature',
                                        geometry: {
                                            type: 'LineString',
                                            coordinates: routeCoordinates
                                        }
                                    }}
                                >
                                    <LineLayer
                                        id="routeLine"
                                        style={{
                                            lineColor: isNavigating ? '#4CAF50' : colors.primary,
                                            lineWidth: 6,
                                            lineCap: 'round',
                                            lineJoin: 'round',
                                            lineOpacity: 0.85
                                        }}
                                    />
                                </ShapeSource>
                            )}

                            {!isNavigating && mosques.map((mosque) => (
                                <PointAnnotation
                                    key={`mosque-${mosque.id}`}
                                    id={`mosque-${mosque.id}`}
                                    coordinate={[mosque.lon, mosque.lat]}
                                    onSelected={() => handleMosquePress(mosque)}
                                >
                                    <View style={[
                                        styles.markerContainer,
                                        { backgroundColor: selectedMosque?.id === mosque.id ? '#FF9800' : colors.primary }
                                    ]}>
                                        <FontAwesome5 name="mosque" size={12} color="#fff" />
                                    </View>
                                </PointAnnotation>
                            ))}

                            {/* Marker for selected mosque during navigation */}
                            {isNavigating && selectedMosque && (
                                <PointAnnotation
                                    id="destination-marker"
                                    coordinate={[selectedMosque.lon, selectedMosque.lat]}
                                >
                                    <View style={[styles.markerContainer, { backgroundColor: '#FF9800', width: 40, height: 40, borderRadius: 20 }]}>
                                        <FontAwesome5 name="mosque" size={18} color="#fff" />
                                    </View>
                                </PointAnnotation>
                            )}
                        </MapView>

                        {/* Navigation Stats Overlay */}
                        {isNavigating && routeInfo && (
                            <View style={[styles.navStatsBar, { backgroundColor: colors.surface }]}>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: colors.text }]}>{routeInfo.duration} min</Text>
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Temps restant</Text>
                                </View>
                                <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: colors.text }]}>{routeInfo.distance.toFixed(1)} km</Text>
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Distance</Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.stopNavButton]}
                                    onPress={stopNavigation}
                                >
                                    <Ionicons name="stop" size={24} color="#F44336" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {!isNavigating && selectedMosque && (
                            <View style={[styles.quickInfoCard, { backgroundColor: colors.surface }]}>
                                <View style={styles.quickInfoHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.quickInfoTitle, { color: colors.text }]} numberOfLines={1}>{selectedMosque.name}</Text>
                                        <Text style={[styles.quickInfoAddr, { color: colors.textSecondary }]} numberOfLines={1}>{selectedMosque.address}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setSelectedMosque(null);
                                            setRouteCoordinates(null);
                                        }}
                                        hitSlop={15}
                                    >
                                        <Ionicons name="close-circle" size={28} color={colors.divider} />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.quickInfoFooter}>
                                    <View style={[styles.distBadge, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(44, 95, 45, 0.12)' }]}>
                                        <Ionicons name="walk" size={14} color={colors.primary} />
                                        <Text style={[styles.quickInfoDist, { color: colors.primary }]}>
                                            {routeInfo ? `${routeInfo.duration} min (${routeInfo.distance.toFixed(2)} km)` : `${selectedMosque.distance?.toFixed(2)} km`}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.directionsButton, { backgroundColor: colors.primary }]}
                                        onPress={toggleNavigation}
                                    >
                                        <Ionicons name="navigate" size={16} color="#fff" />
                                        <Text style={styles.directionsText}>Commencer</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    {!isNavigating && (
                        <View style={[styles.listContainer, { backgroundColor: colors.surface }]}>
                            <View style={[styles.dragHandle, { backgroundColor: colors.divider }]} />
                            <View style={styles.listHeaderRow}>
                                <Text style={[styles.listTitle, { color: colors.text }]}>Mosquées Proches</Text>
                                <View style={[styles.countBadge, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : colors.primary + '20' }]}>
                                    <Text style={[styles.countText, { color: colors.primary }]}>{mosques.length}</Text>
                                </View>
                            </View>

                            {mosques.length === 0 && !loading ? (
                                <View style={styles.emptyContainer}>
                                    <MaterialCommunityIcons name="mosque" size={60} color={colors.divider} />
                                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aucune mosquée trouvée à proximité (3km)</Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={mosques}
                                    keyExtractor={(item) => item.id.toString()}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={{ paddingBottom: 30 }}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={[
                                                styles.mosqueItem,
                                                { borderBottomColor: colors.divider },
                                                selectedMosque?.id === item.id && { backgroundColor: colors.primary + '10' }
                                            ]}
                                            onPress={() => handleMosquePress(item)}
                                        >
                                            <View style={[styles.iconBox, { backgroundColor: colors.primary + '10' }]}>
                                                <FontAwesome5 name="mosque" size={18} color={colors.primary} />
                                            </View>
                                            <View style={styles.mosqueInfo}>
                                                <View style={styles.mosqueNameRow}>
                                                    <Text style={[styles.mosqueName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                                                    <Text style={[styles.mosqueDistText, { color: colors.primary }]}>{item.distance?.toFixed(2)} km</Text>
                                                </View>
                                                <Text style={[styles.mosqueAddr, { color: colors.textSecondary }]} numberOfLines={1}>{item.address}</Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={20} color={colors.divider} />
                                        </TouchableOpacity>
                                    )}
                                />
                            )}
                        </View>
                    )}
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    errorText: {
        marginTop: 15,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: '500',
    },
    retryButton: {
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    retryText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        zIndex: 10,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    refreshButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    mapLoadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    markerContainer: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    navStatsBar: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 15,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: '80%',
    },
    stopNavButton: {
        padding: 8,
        marginLeft: 10,
    },
    quickInfoCard: {
        position: 'absolute',
        bottom: 15,
        left: 15,
        right: 15,
        borderRadius: 20,
        padding: 18,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 7.49,
        zIndex: 100,
    },
    quickInfoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    quickInfoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    quickInfoAddr: {
        fontSize: 13,
    },
    quickInfoFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    distBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        gap: 6,
    },
    quickInfoDist: {
        fontSize: 13,
        fontWeight: '700',
    },
    directionsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        gap: 10,
    },
    directionsText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    listContainer: {
        height: height * 0.40,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: 10,
        elevation: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
    },
    dragHandle: {
        width: 40,
        height: 5,
        borderRadius: 2.5,
        alignSelf: 'center',
        opacity: 0.25,
        marginVertical: 10,
    },
    listHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 18,
        gap: 12,
    },
    listTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    countBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
    },
    countText: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    mosqueItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 0.5,
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mosqueInfo: {
        flex: 1,
        marginLeft: 16,
    },
    mosqueNameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    mosqueName: {
        fontSize: 15,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 10,
    },
    mosqueDistText: {
        fontSize: 13,
        fontWeight: '600',
    },
    mosqueAddr: {
        fontSize: 12,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 40,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 15,
        textAlign: 'center',
    },
    loaderText: {
        fontSize: 15,
        textAlign: 'center',
    },
});
