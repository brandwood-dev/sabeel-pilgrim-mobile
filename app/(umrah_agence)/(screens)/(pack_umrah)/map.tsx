import { useThemeColors } from '@/hooks/useThemeColors';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';

// Set the access token
const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
if (mapboxToken) {
    MapboxGL.setAccessToken(mapboxToken);
} else {
    console.warn('Mapbox access token is not set. Please set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in your .env file.');
}

// Extract components with any cast to avoid type errors
const { MapView, Camera, ShapeSource, LineLayer, VectorSource, PointAnnotation, UserLocation } = MapboxGL as any;

export default function MapScreen() {
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const router = useRouter();
    const params = useLocalSearchParams();
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [route, setRoute] = useState<any>(null);
    const [routeDuration, setRouteDuration] = useState<number | null>(null);
    const [routeDistance, setRouteDistance] = useState<number | null>(null);
    const [isNavigating, setIsNavigating] = useState(false);

    // Parse coords from params or default to Mock (10.196, 36.848)
    const agencyLat = params.lat ? parseFloat(params.lat as string) : 36.848;
    const agencyLng = params.lng ? parseFloat(params.lng as string) : 10.196;
    const agencyCoords = [agencyLng, agencyLat];

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setPermissionDenied(true);
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);

            // Fetch Route if we have user location
            if (location) {
                fetchRoute(location.coords.longitude, location.coords.latitude, agencyCoords[0], agencyCoords[1]);
            }
        })();
    }, [agencyCoords[0], agencyCoords[1]]);

    const fetchRoute = async (startLng: number, startLat: number, endLng: number, endLat: number) => {
        try {
            const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
            if (!token) {
                console.error("Cannot fetch route: Mapbox access token is missing.");
                return;
            }
            const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startLng},${startLat};${endLng},${endLat}?geometries=geojson&overview=full&access_token=${token}`;

            const response = await fetch(url);
            if (!response.ok) {
                console.error("Mapbox API Error:", response.statusText);
                return;
            }
            const json = await response.json();

            if (json.routes && json.routes.length > 0) {
                setRoute(json.routes[0].geometry);
                setRouteDuration(json.routes[0].duration);
                setRouteDistance(json.routes[0].distance);
            }
        } catch (error) {
            console.error("Error fetching route:", error);
        }
    };

    const handleStartNavigation = () => {
        const newNavigatingState = !isNavigating;
        setIsNavigating(newNavigatingState);

        if (newNavigatingState && routeDuration) {
            const minutes = Math.round(routeDuration / 60);
            Speech.speak(`En route vers ${params.agencyName || 'Agence'}. Vous arriverez dans environ ${minutes} minutes.`, { language: 'fr' });
        } else {
            Speech.stop();
        }
    };

    if (!location && !permissionDenied) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Localisation en cours...</Text>
            </View>
        );
    }

    const cameraCenter = location
        ? [(location.coords.longitude + agencyCoords[0]) / 2, (location.coords.latitude + agencyCoords[1]) / 2]
        : agencyCoords;

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                styleURL={isDarkMode ? MapboxGL.StyleURL.Dark : MapboxGL.StyleURL.Street}
                logoEnabled={false}
                attributionEnabled={false}
            >
                {/* @ts-ignore */}
                <Camera
                    zoomLevel={isNavigating ? 18 : 12}
                    centerCoordinate={isNavigating ? undefined : cameraCenter}
                    followUserLocation={isNavigating}
                    followUserMode={isNavigating ? 'course' : 'normal'}
                    pitch={isNavigating ? 60 : 0}
                    animationMode={'flyTo'}
                    animationDuration={2000}
                />

                {/* Route Line */}
                {route && (
                    // @ts-ignore
                    <ShapeSource id="routeSource" shape={route}>
                        <LineLayer
                            id="routeFill"
                            style={{
                                lineColor: 'blue',
                                lineWidth: 5,
                                lineOpacity: 0.7,
                                lineCap: 'round',
                                lineJoin: 'round',
                            }}
                        />
                    </ShapeSource>
                )}

                {/* Show Traffic */}
                <VectorSource id="traffic-source" url="mapbox://mapbox.mapbox-traffic-v1">
                    <LineLayer
                        id="traffic-layer"
                        sourceLayer="traffic"
                        style={{
                            lineWidth: 2,
                            lineColor: [
                                'match',
                                ['get', 'congestion'],
                                'low', '#00ff00',
                                'moderate', '#ffff00',
                                'heavy', '#ff0000',
                                'severe', '#8b0000',
                                '#000000' // default
                            ]
                        }}
                    />
                </VectorSource>

                {/* Agency Marker */}
                <PointAnnotation id="agency-marker" coordinate={agencyCoords}>
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                        {/* CSS Pin (Circle + Triangle) for Stable Rendering */}
                        <View style={{ alignItems: 'center' }}>
                            {/* Pin Head */}
                            <View style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: 'red',
                                borderWidth: 3,
                                borderColor: 'white',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 2
                            }}>
                                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: 'white' }} />
                            </View>
                            {/* Pin Needle/Triangle */}
                            <View style={{
                                width: 0,
                                height: 0,
                                backgroundColor: 'transparent',
                                borderStyle: 'solid',
                                borderLeftWidth: 10,
                                borderRightWidth: 10,
                                borderBottomWidth: 0,
                                borderTopWidth: 16,
                                borderLeftColor: 'transparent',
                                borderRightColor: 'transparent',
                                borderTopColor: 'red',
                                marginTop: -4,
                                zIndex: 1
                            }} />
                            {/* Small Shadow for depth */}
                            <View style={{
                                width: 12,
                                height: 4,
                                borderRadius: 6,
                                backgroundColor: 'rgba(0,0,0,0.2)',
                                marginTop: 2
                            }} />
                        </View>

                        <View style={[styles.callout, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.calloutText, { color: colors.text }]}>{params.agencyName || 'Agence'}</Text>
                        </View>
                    </View>
                </PointAnnotation>

                {/* User Location */}
                {/* @ts-ignore */}
                <UserLocation
                    visible={true}
                    showsUserHeadingIndicator={true}
                    androidRenderMode={'gps'}
                />

            </MapView>

            <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.bottomSheet}>
                {!isNavigating && (
                    <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.infoTitle, { color: colors.text }]}>Trafic en temps réel</Text>
                        <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>
                            Vert: Fluide • Jaune: Modéré • Rouge: Dense
                        </Text>
                        {route && <Text style={{ fontSize: 12, color: colors.primary, marginTop: 5 }}>Itinéraire affiché en bleu</Text>}
                    </View>
                )}

                {isNavigating && routeDuration && (
                    <View style={[styles.infoCard, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface }]}>
                        <View>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.primary }}>
                                {Math.round(routeDuration / 60)} min
                                {routeDistance && <Text style={{ fontSize: 16, fontWeight: 'normal', color: colors.textSecondary }}> • {(routeDistance / 1000).toFixed(1)} km</Text>}
                            </Text>
                            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Durée et distance estimées</Text>
                        </View>
                        <Ionicons name="time" size={24} color={colors.primary} />
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.navButton, { backgroundColor: colors.primary, shadowColor: colors.primary }, isNavigating && { backgroundColor: '#FF4444', shadowColor: '#FF4444' }]}
                    onPress={handleStartNavigation}
                >
                    <Ionicons name={isNavigating ? "stop-circle" : "navigate-circle"} size={24} color="#fff" />
                    <Text style={styles.navButtonText}>
                        {isNavigating ? "Arrêter la navigation" : "Commencer la navigation"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    markerContainer: {
        alignItems: 'center',
    },
    callout: {
        padding: 5,
        borderRadius: 5,
        marginTop: 5,
        elevation: 2,
    },
    calloutText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 40,
        backgroundColor: 'transparent',
        alignItems: 'center',
    },
    infoCard: {
        padding: 15,
        borderRadius: 12,
        elevation: 5,
        width: '100%',
        marginBottom: 15,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    infoDesc: {
        fontSize: 12,
        color: '#666',
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 30,
        width: '100%',
        gap: 10,
        elevation: 5,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    navButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
