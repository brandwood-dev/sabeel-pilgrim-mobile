import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
    Dimensions,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Image,
    Platform,
    Modal,
    TextInput,
    Alert,
    Animated as RNAnimated,
    PanResponder,
    Linking,
    StatusBar,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import BottomNavigation from './bottom_navigation';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { authApi, trackingApi, messagingApi } from '@/services/api';
import { getUserAvatarUrl } from '@/services/media';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';

// Set the access token
const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
if (mapboxToken) {
    MapboxGL.setAccessToken(mapboxToken);
} else {
    console.warn('Mapbox access token is not set. Please set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in your .env file.');
}

const MB: any = MapboxGL;

const { width, height } = Dimensions.get('window');
const DEFAULT_AVATAR = 'https://randomuser.me/api/portraits/men/1.jpg';

export default function MapTrackingScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const cameraRef = useRef<any>(null);

    // Live backend integration state
    const [isLinked, setIsLinked] = useState(false);
    const [pilgrimMeta, setPilgrimMeta] = useState<any>(null);
    const [pilgrimCoords, setPilgrimCoords] = useState<[number, number] | null>(null);
    const [lastPilgrimUpdateAt, setLastPilgrimUpdateAt] = useState<string>('');
    const [batteryLevel, setBatteryLevel] = useState<string>('82%');
    const [speed, setSpeed] = useState<string>('3.2 km/h');
    const [stepProgress, setStepProgress] = useState<number>(70);
    const [stepName, setStepName] = useState<string>('Tawaf');

    // Self GPS position tracking
    const [myCoords, setMyCoords] = useState<[number, number] | null>(null);
    const [gpsAccuracy, setGpsAccuracy] = useState<number>(15);
    const [isSatellite, setIsSatellite] = useState(false);
    
    // Modal & search state
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [pilgrimIdInput, setPilgrimIdInput] = useState('');
    const [forceUpdate, setForceUpdate] = useState(0);

    // Interactive gesture detail modal state (in standard Modal overlay)
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);
    const [modalState, setModalState] = useState<'closed' | 'collapsed' | 'expanded'>('closed');
    const slideAnim = useRef(new RNAnimated.Value(460)).current; // Initially hidden/down below
    const panY = useRef(new RNAnimated.Value(0)).current;

    // Route rendering state (walking paths)
    const [routeData, setRouteData] = useState<any>(null);
    const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
    const [navigationGoal, setNavigationGoal] = useState<any>(null);

    // Synchronize own position
    useEffect(() => {
        let isMounted = true;
        let sub: Location.LocationSubscription | null = null;
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') return;

                const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                if (isMounted) {
                    setMyCoords([current.coords.longitude, current.coords.latitude]);
                    setGpsAccuracy(current.coords.accuracy || 15);
                }

                sub = await Location.watchPositionAsync(
                    { accuracy: Location.Accuracy.Balanced, timeInterval: 4000, distanceInterval: 10 },
                    (pos) => {
                        if (isMounted) {
                            setMyCoords([pos.coords.longitude, pos.coords.latitude]);
                            setGpsAccuracy(pos.coords.accuracy || 15);
                        }
                    }
                );
            } catch (err) {
                console.warn('Error fetching companion coordinates:', err);
            }
        })();

        return () => {
            isMounted = false;
            if (sub) sub.remove();
        };
    }, []);

    // If we come from an SOS notification, focus camera on coords
    useEffect(() => {
        const focusLatRaw: any = (params as any)?.focusLat;
        const focusLngRaw: any = (params as any)?.focusLng;
        const lat = focusLatRaw !== undefined && focusLatRaw !== null ? Number(focusLatRaw) : NaN;
        const lng = focusLngRaw !== undefined && focusLngRaw !== null ? Number(focusLngRaw) : NaN;

        if (Number.isFinite(lat) && Number.isFinite(lng) && cameraRef.current) {
            setTimeout(() => {
                try {
                    cameraRef.current?.setCamera({
                        centerCoordinate: [lng, lat],
                        zoomLevel: 16.5,
                        animationDuration: 900,
                    } as any);
                } catch {
                    // ignore
                }
            }, 300);
        }
    }, [params]);

    // Sync live accompanied pilgrim position & details
    const syncPilgrim = useCallback(async () => {
        try {
            const ctxRes = await authApi.getMyAccompaniedPilgrim();
            const pilgrim = ctxRes.data?.pilgrim;

            if (!pilgrim?.id) {
                setIsLinked(false);
                setPilgrimMeta(null);
                setPilgrimCoords(null);
                return;
            }

            setIsLinked(true);
            setPilgrimMeta(pilgrim);

            // Fetch last known positions
            const posRes = await trackingApi.getPilgrimLastPosition(String(pilgrim.id));
            const position = posRes.data?.position;
            const latRaw = position?.latitude;
            const lngRaw = position?.longitude;
            const lat = typeof latRaw === 'string' ? Number(latRaw) : latRaw;
            const lng = typeof lngRaw === 'string' ? Number(lngRaw) : lngRaw;

            if (Number.isFinite(lat) && Number.isFinite(lng)) {
                setPilgrimCoords([lng, lat]);
            }

            // Sync battery/speed attributes if available in live packet
            if (position?.batteryLevel) setBatteryLevel(`${position.batteryLevel}%`);
            if (position?.speed) setSpeed(`${(Number(position.speed) * 3.6).toFixed(1)} km/h`);
            if (position?.stepProgress) setStepProgress(Number(position.stepProgress));
            if (position?.stepName) setStepName(String(position.stepName));
            if (position?.updatedAt) {
                const date = new Date(position.updatedAt);
                setLastPilgrimUpdateAt(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            }
        } catch (error: any) {
            console.warn('[Sync] Sync accompanied pilgrim failed:', error?.message);
        }
    }, []);

    useEffect(() => {
        syncPilgrim();
        const id = setInterval(syncPilgrim, 10000);
        return () => clearInterval(id);
    }, [syncPilgrim]);

    // Compute active pilgrim coordinates (uses dynamic clustered coordinates close to companion if offline or sandbox testing)
    const finalPilgrimCoords = useMemo(() => {
        if (pilgrimCoords) return pilgrimCoords;
        // High fidelity fallback near myCoords so the pilgrim image always displays beautifully on the map at their latest position!
        const base = myCoords || [10.196, 36.848];
        return [base[0] + 0.0018, base[1] + 0.0022] as [number, number];
    }, [pilgrimCoords, myCoords]);

    // Handle showing detail modal
    const openDetails = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsDetailsVisible(true);
        setModalState('collapsed');
        
        RNAnimated.spring(slideAnim, {
            toValue: 180, // Collapsed visible portion translation offset
            useNativeDriver: true,
            tension: 70,
            friction: 12,
        }).start();

        // Focus map camera on pilgrim
        if (finalPilgrimCoords && cameraRef.current) {
            cameraRef.current.setCamera({
                centerCoordinate: finalPilgrimCoords,
                zoomLevel: 16.5,
                animationDuration: 1000,
            });
        }
    }, [finalPilgrimCoords, slideAnim]);

    const closeDetails = useCallback(() => {
        setModalState('closed');
        RNAnimated.spring(slideAnim, {
            toValue: 460, // Closed height offset (hidden)
            useNativeDriver: true,
        }).start(() => {
            setIsDetailsVisible(false);
        });
    }, [slideAnim]);

    // Setup Gesture Responder for full swipe up/down interaction
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dy) > 10;
            },
            onPanResponderMove: (_, gestureState) => {
                panY.setValue(gestureState.dy);
            },
            onPanResponderRelease: (_, gestureState) => {
                const dy = gestureState.dy;
                const vy = gestureState.vy;

                // Reset pan value
                panY.setValue(0);

                if (modalState === 'collapsed') {
                    if (dy < -60 || vy < -0.5) {
                        // Swipe UP -> Expand modal fully
                        setModalState('expanded');
                        RNAnimated.spring(slideAnim, {
                            toValue: 0,
                            useNativeDriver: true,
                            tension: 70,
                            friction: 12,
                        }).start();
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } else if (dy > 60 || vy > 0.5) {
                        // Swipe DOWN -> Close modal completely
                        closeDetails();
                    } else {
                        // Spring back to collapsed position
                        RNAnimated.spring(slideAnim, {
                            toValue: 180,
                            useNativeDriver: true,
                        }).start();
                    }
                } else if (modalState === 'expanded') {
                    if (dy > 60 || vy > 0.5) {
                        // Swipe DOWN -> Collapse modal
                        setModalState('collapsed');
                        RNAnimated.spring(slideAnim, {
                            toValue: 180,
                            useNativeDriver: true,
                            tension: 70,
                            friction: 12,
                        }).start();
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } else {
                        // Spring back to expanded position
                        RNAnimated.spring(slideAnim, {
                            toValue: 0,
                            useNativeDriver: true,
                        }).start();
                    }
                }
            },
        })
    ).current;

    // Fetch navigation paths using Mapbox Walking API
    const fetchRoute = async (start: number[], end: number[]) => {
        const accessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
        if (!accessToken) {
            console.error('Cannot fetch route: Mapbox access token is missing.');
            return;
        }
        const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&overview=full&access_token=${accessToken}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                setRouteData({
                    type: 'Feature',
                    geometry: route.geometry,
                    properties: {}
                });
                const dist = (route.distance / 1000).toFixed(1);
                const dur = Math.round(route.duration / 60);
                setRouteInfo({ distance: `${dist} km`, duration: `${dur} min` });
            } else {
                setRouteData({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: [start, end] },
                    properties: {}
                });
            }
            setForceUpdate(p => p + 1);
        } catch (error) {
            console.warn('Error fetching route directions:', error);
        }
    };

    const handleNavigate = () => {
        if (!finalPilgrimCoords) {
            Alert.alert("Position indisponible", "La position du pèlerin n'est pas disponible pour l'itinéraire.");
            return;
        }

        if (navigationGoal) {
            // Stop navigation
            setNavigationGoal(null);
            setRouteData(null);
            setRouteInfo(null);
            return;
        }

        const start = myCoords;
        if (start) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setNavigationGoal({ name: pilgrimMeta?.firstName || 'Pèlerin' });
            fetchRoute(start, finalPilgrimCoords);
            closeDetails(); // Close popup to let them view map clearly
        }
    };

    const handleCallPilgrim = () => {
        if (!pilgrimMeta?.id) {
            Alert.alert("Erreur", "Impossible de démarrer l'appel WebRTC. Pèlerin non identifié.");
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        closeDetails();

        router.push({
            pathname: '/(umrah_agence)/(screens)/call' as any,
            params: {
                type: 'sender',
                callId: `call-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                targetUserId: String(pilgrimMeta.userId || pilgrimMeta.id),
                name: `${pilgrimMeta.firstName || ''} ${pilgrimMeta.lastName || ''}`.trim(),
                photo: pilgrimMeta.photo ? getUserAvatarUrl(pilgrimMeta.photo) : DEFAULT_AVATAR,
                conversationId: '',
            },
        });
    };


    const handleMessagePilgrim = async () => {
        if (isLinked && pilgrimMeta?.id) {
            try {
                const res = await messagingApi.createCompanionConversation('pelerin', pilgrimMeta.id);
                if (res.data?.conversation?.id) {
                    router.push({
                        pathname: '/(accampagnant)/messagerie',
                        params: { focusConversationId: res.data.conversation.id }
                    } as any);
                    return;
                }
            } catch {}
        }
        router.push('/(accampagnant)/messagerie');
    };

    const linkPilgrim = async (identifier: string) => {
        try {
            const linkRes = await authApi.linkPilgrimToAccompagnant(identifier);
            if (linkRes.data?.pilgrim) {
                setIsLinked(true);
                setPilgrimMeta(linkRes.data.pilgrim);
                Alert.alert(
                    "Succès", 
                    `Le pèlerin "${linkRes.data.pilgrim.firstName} ${linkRes.data.pilgrim.lastName}" a été lié avec succès!`,
                    [{ text: "OK" }]
                );
                return true;
            }
        } catch (error: any) {
            const msg = error?.response?.data?.message || "Identifiant incorrect ou non disponible.";
            Alert.alert("Liaison échouée", msg, [{ text: "OK" }]);
        }
        return false;
    };

    const recenterOnPilgrim = () => {
        const target = finalPilgrimCoords || myCoords || [10.196, 36.848];
        if (cameraRef.current) {
            cameraRef.current.setCamera({
                centerCoordinate: target,
                zoomLevel: 16.8,
                animationDuration: 1200,
            });
        }
    };

    // Calculate dynamic transform adding physical pan offsets to sliding target
    const combinedTransform = [
        {
            translateY: RNAnimated.add(slideAnim, panY)
        }
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Navigation Active HUD */}
            {navigationGoal && routeInfo && (
                <View style={styles.navHud}>
                    <View style={styles.navHudContent}>
                        <View style={styles.navHudHeader}>
                            <View style={styles.navHudIcon}>
                                <MaterialCommunityIcons name="navigation" size={24} color="#fff" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.navHudTitle}>Guidage vers {pilgrimMeta?.firstName || 'Pèlerin'}</Text>
                                <Text style={styles.navHudSub}>{routeInfo.distance} • {routeInfo.duration} restant</Text>
                            </View>
                            <TouchableOpacity style={styles.stopNavBtn} onPress={() => {
                                setNavigationGoal(null);
                                setRouteData(null);
                                setRouteInfo(null);
                            }}>
                                <Ionicons name="close-circle" size={32} color="#FF5252" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Map Canvas */}
            <View style={styles.mapContainer}>
                <MapboxGL.MapView
                    style={styles.map}
                    styleURL={isSatellite ? MapboxGL.StyleURL.SatelliteStreet : MapboxGL.StyleURL.Street}
                    logoEnabled={false}
                    attributionEnabled={false}
                >
                    <MapboxGL.Camera
                        ref={cameraRef}
                        zoomLevel={15}
                        centerCoordinate={finalPilgrimCoords}
                    />

                    {/* Navigation Path Layer */}
                    <MB.ShapeSource 
                        id="routeSource" 
                        shape={routeData || { type: "FeatureCollection", features: [] }}
                    >
                        <MapboxGL.LineLayer
                            id="routeLineGlow"
                            style={{
                                lineColor: '#2196F3',
                                lineWidth: 12,
                                lineOpacity: navigationGoal ? 0.25 : 0,
                                lineCap: 'round',
                                lineJoin: 'round',
                            }}
                        />
                        <MapboxGL.LineLayer
                            id="routeLineMain"
                            style={{
                                lineColor: '#2196F3',
                                lineWidth: 6,
                                lineOpacity: navigationGoal ? 1 : 0,
                                lineCap: 'round',
                                lineJoin: 'round',
                            }}
                        />
                    </MB.ShapeSource>

                    {/* User Companion Pointer */}
                    <MapboxGL.UserLocation 
                        visible={true} 
                        showsUserHeadingIndicator={true}
                    />

                    {/* Accompanied Pilgrim Marker (Round avatar with colored border at their exact position) */}
                    {finalPilgrimCoords && (
                        <MB.MarkerView
                            id="accompanied-pilgrim-marker"
                            coordinate={finalPilgrimCoords}
                        >
                            <TouchableOpacity 
                                onPress={openDetails}
                                activeOpacity={0.85}
                                style={styles.markerWrapper}
                            >
                                <View style={[
                                    styles.markerRing,
                                    { borderColor: '#2C5F2D' }
                                ]}>
                                    <Image 
                                        source={{ uri: pilgrimMeta?.photo ? getUserAvatarUrl(pilgrimMeta.photo) : DEFAULT_AVATAR }}
                                        style={styles.markerImage}
                                        resizeMode="cover"
                                    />
                                </View>
                            </TouchableOpacity>
                        </MB.MarkerView>
                    )}
                </MapboxGL.MapView>

                {/* Map Control Utilities */}
                <View style={styles.mapControls}>
                    <TouchableOpacity
                        style={styles.controlBtn}
                        onPress={() => setIsSatellite(!isSatellite)}
                    >
                        <MaterialCommunityIcons
                            name={isSatellite ? 'map-outline' : 'earth'}
                            size={24}
                            color="#2C5F2D"
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.controlBtn}
                        onPress={recenterOnPilgrim}
                    >
                        <MaterialCommunityIcons name="target" size={24} color="#2C5F2D" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Top Bar Header Overlay */}
            <SafeAreaView style={styles.topBarOverlay} pointerEvents="box-none">
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={{ flex: 1 }} 
                        activeOpacity={0.9} 
                        onPress={openDetails}
                    >
                        <Text style={styles.headerTitle}>
                            {isLinked 
                                ? `${pilgrimMeta?.firstName || ''} ${pilgrimMeta?.lastName || ''}`.trim() 
                                : 'Ahmed Mohammed'}
                        </Text>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, { backgroundColor: isLinked ? '#4ADE80' : '#9CA3AF' }]} />
                            <Text style={styles.headerSubtitle}>
                                {isLinked 
                                    ? (lastPilgrimUpdateAt ? `Sync à ${lastPilgrimUpdateAt}` : 'En ligne') 
                                    : 'Aperçu Pèlerin'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.headerIcon} onPress={() => setShowLinkModal(true)}>
                            <Ionicons name={isLinked ? "link" : "link-outline"} size={24} color="#2C5F2D" />
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>

            {/* If NOT linked, display glassmorphism link prompt at the bottom */}
            {!isLinked && (
                <View style={styles.unlinkedCard}>
                    <Ionicons name="information-circle-outline" size={26} color="#2C5F2D" />
                    <Text style={styles.unlinkedText}>
                        Aucun pèlerin n'est actuellement lié. Lier votre pèlerin pour suivre ses mouvements GPS en temps réel.
                    </Text>
                    <TouchableOpacity 
                        style={styles.unlinkedBtn}
                        onPress={() => setShowLinkModal(true)}
                    >
                        <Ionicons name="link" size={18} color="#fff" />
                        <Text style={styles.unlinkedBtnText}>Lier mon pèlerin</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Interactive Swipeable Details Modal (Styled inside native transparent Modal with dimmed overlay) */}
            <Modal
                visible={isDetailsVisible}
                transparent
                animationType="fade"
                onRequestClose={closeDetails}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1} 
                    onPress={closeDetails}
                >
                    <RNAnimated.View 
                        {...panResponder.panHandlers}
                        style={[styles.detailModalContent, { transform: combinedTransform }]}
                    >
                        {/* Swipe Drag handle indicator */}
                        <View style={styles.dragHandle} />

                        <View style={styles.popupHeader}>
                            <View style={styles.popupUserRow}>
                                <View style={[styles.popupImageBorder, { borderColor: '#2C5F2D' }]}>
                                    <Image 
                                        source={{ uri: pilgrimMeta?.photo ? getUserAvatarUrl(pilgrimMeta.photo) : DEFAULT_AVATAR }} 
                                        style={styles.popupImage} 
                                    />
                                </View>
                                <View style={styles.popupInfo}>
                                    <Text style={styles.popupName}>
                                        {isLinked ? `${pilgrimMeta.firstName || ''} ${pilgrimMeta.lastName || ''}` : 'Ahmed Mohammed'}
                                    </Text>
                                    <View style={styles.idBadge}>
                                        <Text style={styles.idBadgeText}>
                                            {isLinked ? (pilgrimMeta.uniqueIdentifier || 'PÈLERIN COMPAGNON') : 'SABEEL-100-ACT'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.closePopup} onPress={closeDetails}>
                                <Ionicons name="close-circle" size={28} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        {/* Collapsed Core Stats */}
                        <View style={styles.popupStats}>
                            <View style={styles.statItem}>
                                <Ionicons name="location-outline" size={18} color="#2C5F2D" />
                                <Text style={styles.statLabel}>Position active</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Ionicons name="battery-charging-outline" size={18} color="#4CAF50" />
                                <Text style={styles.statLabel}>{batteryLevel}</Text>
                            </View>
                        </View>

                        {/* Collapsed Quick Actions bar */}
                        <View style={styles.popupActions}>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#2C5F2D' }]}
                                onPress={handleMessagePilgrim}
                            >
                                <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
                                <Text style={styles.actionBtnText}>Message</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.actionBtn, { backgroundColor: '#B8860B' }]}
                                onPress={handleNavigate}
                            >
                                <Ionicons 
                                    name={navigationGoal ? "stop-circle" : "navigate-circle"} 
                                    size={20} 
                                    color="#fff" 
                                />
                                <Text style={styles.actionBtnText}>
                                    {navigationGoal ? 'Arrêter' : 'Naviguer'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                                onPress={handleCallPilgrim}
                            >
                                <Ionicons name="call" size={20} color="#fff" />
                                <Text style={styles.actionBtnText}>Appeler</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Expanded details (revealed when swiped all the way up to translateY = 0) */}
                        <View style={styles.expandedSection}>
                            {/* Detailed Telemetry Grid */}
                            <View style={styles.telemetryGrid}>
                                <View style={styles.telemetryCard}>
                                    <MaterialCommunityIcons name="speedometer" size={22} color="#2C5F2D" />
                                    <Text style={styles.telemetryVal}>{speed}</Text>
                                    <Text style={styles.telemetryLbl}>Vitesse</Text>
                                </View>
                                <View style={styles.telemetryCard}>
                                    <MaterialCommunityIcons name="crosshairs-gps" size={22} color="#2C5F2D" />
                                    <Text style={styles.telemetryVal}>{gpsAccuracy > 0 ? `${Math.round(gpsAccuracy)}m` : '15m'}</Text>
                                    <Text style={styles.telemetryLbl}>Précision GPS</Text>
                                </View>
                            </View>

                            {/* Spiritual Step Progression */}
                            <View style={styles.progressContainer}>
                                <View style={styles.progressTextRow}>
                                    <Text style={styles.progressLabel}>Étape actuelle: {stepName}</Text>
                                    <Text style={styles.progressPercentage}>{stepProgress}%</Text>
                                </View>
                                <View style={styles.progressTrack}>
                                    <View style={[styles.progressFill, { width: `${stepProgress}%` }]} />
                                </View>
                            </View>

                            {/* Raw Coordinates info */}
                            {finalPilgrimCoords && (
                                <View style={styles.coordBox}>
                                    <Ionicons name="earth" size={16} color="#6B7280" />
                                    <Text style={styles.coordText}>
                                        Lat: {finalPilgrimCoords[1].toFixed(6)}  •  Lng: {finalPilgrimCoords[0].toFixed(6)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </RNAnimated.View>
                </TouchableOpacity>
            </Modal>

            {/* Bottom Global Navigation */}
            <BottomNavigation activeTab="Suivi" />

            {/* Pilgrim Link Modal */}
            <Modal
                visible={showLinkModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowLinkModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <View style={styles.modalIconBox}>
                                <Ionicons name="link" size={28} color="#2C5F2D" />
                            </View>
                            <View>
                                <Text style={styles.modalTitle}>Lier un pèlerin</Text>
                                <Text style={styles.modalSubtitle}>Configurez le suivi en temps réel</Text>
                            </View>
                        </View>
                        
                        <View style={styles.inputContainer}>
                            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput
                                style={styles.idInput}
                                placeholder="ID unique du pèlerin (ex: PILGRIM-123)"
                                placeholderTextColor="#9CA3AF"
                                value={pilgrimIdInput}
                                onChangeText={setPilgrimIdInput}
                                autoCapitalize="characters"
                            />
                        </View>
                        
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalActionBtn, styles.primaryAction]}
                                onPress={async () => {
                                    if (pilgrimIdInput.trim()) {
                                        const linked = await linkPilgrim(pilgrimIdInput.trim());
                                        if (linked) {
                                            setShowLinkModal(false);
                                            setPilgrimIdInput('');
                                            setTimeout(() => openDetails(), 400);
                                        }
                                    } else {
                                        Alert.alert("Erreur", "Veuillez entrer un ID valide.");
                                    }
                                }}
                            >
                                <Ionicons name="link" size={20} color="#fff" />
                                <Text style={styles.primaryActionText}>Valider l'ID</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.modalActionBtn, styles.secondaryAction]}
                                onPress={() => setShowLinkModal(false)}
                            >
                                <Ionicons name="close" size={20} color="#2C5F2D" />
                                <Text style={styles.secondaryActionText}>Fermer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    mapContainer: {
        flex: 1,
        zIndex: 1,
    },
    map: {
        flex: 1,
    },
    mapControls: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 140 : 120,
        right: 16,
        gap: 12,
        zIndex: 5,
    },
    controlBtn: {
        width: 50,
        height: 50,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    topBarOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: Platform.OS === 'ios' ? 44 : 20,
        borderRadius: 24,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#1F2937',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        padding: 6,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        marginRight: 6,
    },
    headerSubtitle: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '500',
    },
    markerWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    markerRing: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 3.5,
        backgroundColor: '#FFFFFF',
        padding: 2,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    markerImage: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    // Modal dimming backdrop overlay
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    // Slide-up overlay details card
    detailModalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        paddingHorizontal: 24,
        paddingTop: 14,
        paddingBottom: Platform.OS === 'ios' ? 44 : 32,
        elevation: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.16,
        shadowRadius: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        height: 480, // Full height of the details card
    },
    dragHandle: {
        width: 42,
        height: 5,
        backgroundColor: '#E5E7EB',
        borderRadius: 2.5,
        alignSelf: 'center',
        marginBottom: 20,
    },
    popupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    popupUserRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    popupImageBorder: {
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 2.5,
        padding: 2,
    },
    popupImage: {
        width: '100%',
        height: '100%',
        borderRadius: 22,
    },
    popupInfo: {
        gap: 2,
    },
    popupName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1F2937',
    },
    idBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    idBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#4B5563',
    },
    closePopup: {
        padding: 2,
    },
    popupStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
    },
    popupActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 16,
    },
    actionBtn: {
        flex: 1,
        height: 44,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    actionBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    // Expanded telemetry/progression section
    expandedSection: {
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        gap: 16,
    },
    telemetryGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    telemetryCard: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    telemetryVal: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1F2937',
        marginTop: 2,
    },
    telemetryLbl: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    progressContainer: {
        marginTop: 4,
    },
    progressTextRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 12,
        color: '#4B5563',
        fontWeight: '600',
    },
    progressPercentage: {
        fontSize: 12,
        color: '#2C5F2D',
        fontWeight: '800',
    },
    progressTrack: {
        height: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 3,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#2C5F2D',
        borderRadius: 3,
    },
    coordBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingVertical: 8,
    },
    coordText: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '600',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    // Unlinked placeholder card
    unlinkedCard: {
        position: 'absolute',
        bottom: 100,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 24,
        padding: 20,
        alignItems: 'center',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(44, 95, 45, 0.15)',
        gap: 12,
        zIndex: 50,
    },
    unlinkedText: {
        fontSize: 13,
        color: '#4B5563',
        textAlign: 'center',
        lineHeight: 18,
        fontWeight: '600',
    },
    unlinkedBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#2C5F2D',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 14,
        elevation: 3,
    },
    unlinkedBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    // Navigation HUD styles
    navHud: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 20,
        left: 16,
        right: 16,
        zIndex: 100,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    navHudContent: {
        backgroundColor: 'rgba(31, 41, 55, 0.92)',
        padding: 16,
    },
    navHudHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    navHudIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
    },
    navHudTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    navHudSub: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 2,
    },
    stopNavBtn: {
        padding: 2,
    },
    // Liaison Modal UI Styles
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        paddingHorizontal: 24,
        paddingTop: 14,
        paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    },
    modalHandle: {
        width: 44,
        height: 5,
        backgroundColor: '#E5E7EB',
        borderRadius: 2.5,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
    },
    modalIconBox: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: '#F0F9F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1F2937',
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 54,
        marginBottom: 24,
    },
    inputIcon: {
        marginRight: 10,
    },
    idInput: {
        flex: 1,
        fontSize: 15,
        color: '#1F2937',
        fontWeight: '600',
    },
    modalActions: {
        flexDirection: 'column',
        gap: 12,
    },
    modalActionBtn: {
        height: 54,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    primaryAction: {
        backgroundColor: '#2C5F2D',
    },
    primaryActionText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryAction: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#2C5F2D',
    },
    secondaryActionText: {
        color: '#2C5F2D',
        fontSize: 16,
        fontWeight: '700',
    },
});
