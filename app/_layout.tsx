import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFonts } from 'expo-font';
import { Stack, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { store } from '../store/store';

import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { Platform, View, I18nManager, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
// import * as Updates from 'expo-updates'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { fetchProfile } from '../store/authSlice';
import { AppDispatch, RootState } from '../store/store';
import { setUnreadMessagesCount } from '../store/uiSlice';
import { AppSplashScreen } from '../components/ui/AppSplashScreen';
import { useThemeColors } from '../hooks/useThemeColors';
import { ensureNotificationSetup, presentLocalMessageNotification } from '../services/localNotifications';
import { createMessagingSocket } from '../services/messagingSocket';
import { io } from 'socket.io-client/dist/socket.io.js';
import * as Location from 'expo-location';
import { trackingApi } from '../services/api';
import { pruneIncomingOffers, putIncomingOffer } from '../services/callCache';
import { Audio } from 'expo-av';

function AppContent() {
    const segments = useSegments();
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { isAuthenticated, loading, user } = useSelector((state: RootState) => state.auth);
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const language = useSelector((state: RootState) => state.ui.language);
    const unreadMessagesCount = useSelector((state: RootState) => state.ui.unreadMessagesCount);

    const unreadMessagesCountRef = useRef(0);
    const sosSoundRef = useRef<Audio.Sound | null>(null);
    const lastSosEnRouteAtRef = useRef<number>(0);
    const [sosEnRouteVisible, setSosEnRouteVisible] = useState(false);

    useEffect(() => {
        unreadMessagesCountRef.current = Number(unreadMessagesCount) || 0;
    }, [unreadMessagesCount]);

    useEffect(() => {
        return () => {
            try {
                if (sosSoundRef.current) {
                    sosSoundRef.current.stopAsync().catch(() => {});
                    sosSoundRef.current.unloadAsync().catch(() => {});
                    sosSoundRef.current = null;
                }
            } catch (e) {
                // ignore
            }
        };
    }, []);

    useEffect(() => {
        // Initialize notifications
        ensureNotificationSetup().catch(err => {
            console.warn('[RootLayout] Failed to setup notifications', err);
        });

        // Background/Terminated notification handler
        let responseListener: any = null;
        
        const setupNotificationListeners = async () => {
            try {
                const Notifications = await import('expo-notifications');
                
                // Listen for notification clicks (Background/Terminated)
                responseListener = Notifications.addNotificationResponseReceivedListener(async response => {
                    const data = response.notification.request.content.data;
                    
                    if (data.type === 'chat' && data.conversationId) {
                        router.push({
                            pathname: '/(umrah_agence)/(screens)/(chat)/chat_pelerin' as any,
                            params: { conversationId: String(data.conversationId) }
                        });
                    } else if (data.type === 'reservation' && data.reservationId) {
                        router.push({
                            pathname: '/(umrah_agence)/(screens)/(pack_umrah)/suivi_reservation' as any,
                            params: { reservationId: String(data.reservationId) }
                        });
                    }
                });
            } catch (err) {
                console.warn('[Notifications] Error setting up listeners', err);
            }
        };

        setupNotificationListeners();

        return () => {
            if (responseListener && responseListener.remove) {
                responseListener.remove();
            }
        };
    }, []);

    // Global Socket for Notifications
    useEffect(() => {
        if (!isAuthenticated || !user?.id) return;

        let socket: any = null;
        let isMounted = true;

        const connectNotificationSocket = async () => {
            try {
                const { SERVER_BASE_URL } = await import('../services/api');
                const token = await AsyncStorage.getItem('token');
                
                socket = io(`${SERVER_BASE_URL}/notifications`, {
                    transports: ['websocket'],
                    auth: { token }
                });

                socket.on('connect', () => {
                    console.log('[NotificationsSocket] Connected');
                });

                socket.on('new_notification', (payload: any) => {
                    console.log('[NotificationsSocket] Received:', payload);

                    const pType = String(payload?.data?.type || payload?.type || '').toLowerCase();
                    if (pType === 'sos_status') {
                        const status = String(payload?.data?.status || '').toLowerCase();
                        const targetPilgrimId = String(payload?.data?.pilgrimUserId || '').trim();
                        const myId = String(user?.id || '').trim();

                        if (status === 'in_progress' && targetPilgrimId && myId && targetPilgrimId === myId) {
                            const now = Date.now();
                            if (now - (lastSosEnRouteAtRef.current || 0) > 15000) {
                                lastSosEnRouteAtRef.current = now;

                                try {
                                    setSosEnRouteVisible(true);
                                    setTimeout(() => setSosEnRouteVisible(false), 8000);
                                } catch (e) {
                                    // ignore
                                }

                                (async () => {
                                    try {
                                        if (sosSoundRef.current) {
                                            await sosSoundRef.current.stopAsync().catch(() => {});
                                            await sosSoundRef.current.unloadAsync().catch(() => {});
                                            sosSoundRef.current = null;
                                        }
                                        await Audio.setAudioModeAsync({
                                            playsInSilentModeIOS: true,
                                            staysActiveInBackground: false,
                                            shouldDuckAndroid: true,
                                            playThroughEarpieceAndroid: false,
                                        });
                                        const { sound } = await Audio.Sound.createAsync(
                                            require('../assets/images/sonne.mp3'),
                                            { shouldPlay: true, isLooping: false, volume: 1.0 },
                                        );
                                        sosSoundRef.current = sound;
                                        setTimeout(() => {
                                            try {
                                                if (sosSoundRef.current) {
                                                    sosSoundRef.current.unloadAsync().catch(() => {});
                                                    sosSoundRef.current = null;
                                                }
                                            } catch (e) {
                                                // ignore
                                            }
                                        }, 4000);
                                    } catch (e) {
                                        // ignore
                                    }
                                })();
                            }
                        }
                    } else {
                        presentLocalMessageNotification({
                            title: payload.title,
                            body: payload.body,
                            data: payload.data
                        });
                    }

                    // Let screens refresh instantly (e.g. accompagnant alert center)
                    try {
                        DeviceEventEmitter.emit('app:new_notification', payload);
                    } catch (e) {}
                });

                socket.on('disconnect', () => {
                    console.log('[NotificationsSocket] Disconnected');
                });
            } catch (err) {
                console.error('[NotificationsSocket] Connection failed', err);
            }
        };

        connectNotificationSocket();

        return () => {
            isMounted = false;
            if (socket) socket.disconnect();
        };
    }, [isAuthenticated, user?.id]);

    // Global Messaging Socket: incoming calls (Guide -> Pilgrim)
    useEffect(() => {
        if (!isAuthenticated || !user?.id) return;
        if (user?.activeRole !== 'pelerin' && user?.activeRole !== 'accompagnant') return;

        let socketRef: any = null;
        let isMounted = true;

        const connect = async () => {
            try {
                socketRef = await createMessagingSocket();

                socketRef.on('call_offer', (payload: any) => {
                    if (!isMounted) return;
                    if (!payload?.callId || !payload?.fromUserId) return;

                    pruneIncomingOffers();
                    if (payload?.sdp) {
                        putIncomingOffer({
                            callId: String(payload.callId),
                            fromUserId: String(payload.fromUserId),
                            fromRole: payload.fromRole ? String(payload.fromRole) : '',
                            sdp: payload.sdp,
                            metadata: payload.metadata || null,
                        });
                    }

                    router.push({
                        pathname: '/(umrah_agence)/(screens)/call' as any,
                        params: {
                            callId: String(payload.callId),
                            fromUserId: String(payload.fromUserId),
                            fromRole: payload.fromRole ? String(payload.fromRole) : '',
                            name: payload?.metadata?.name ? String(payload.metadata.name) : '',
                            photo: payload?.metadata?.photo ? String(payload.metadata.photo) : '',
                            type: 'receiver',
                        }
                    });
                });
            } catch (e) {
                // ignore
            }
        };

        connect();

        return () => {
            isMounted = false;
            if (socketRef) socketRef.disconnect();
            socketRef = null;
        };
    }, [isAuthenticated, user?.id, user?.activeRole]);

    // Global Messaging Socket: unread badge updates (all roles)
    useEffect(() => {
        if (!isAuthenticated || !user?.id) return;

        let socketRef: any = null;
        let isMounted = true;

        const connect = async () => {
            try {
                socketRef = await createMessagingSocket();
                socketRef.on('message_created', (payload: any) => {
                    if (!isMounted) return;
                    const message = payload?.message;
                    const senderId = message?.senderUserId ? String(message.senderUserId) : '';
                    const currentUserId = user?.id ? String(user.id) : '';

                    if (!senderId || !currentUserId) return;
                    if (senderId === currentUserId) return;

                    const next = (unreadMessagesCountRef.current || 0) + 1;
                    unreadMessagesCountRef.current = next;
                    dispatch(setUnreadMessagesCount(next));
                });
            } catch (e) {
                // ignore
            }
        };

        connect();
        return () => {
            isMounted = false;
            if (socketRef) socketRef.disconnect();
            socketRef = null;
        };
    }, [dispatch, isAuthenticated, user?.id]);

    // Global Location Sharing (Pilgrim -> Backend)
    useEffect(() => {
        if (!isAuthenticated || !user?.id) return;
        if (user?.activeRole !== 'pelerin') return;
        if (!user?.shareLocation) return;

        console.log('[Tracking] start watcher', {
            userId: String(user?.id),
            activeRole: String(user?.activeRole),
            shareLocation: !!user?.shareLocation,
        });

        let subscription: Location.LocationSubscription | null = null;
        let cancelled = false;
        let lastSentAt = 0;
        let firstLogged = false;
        let lastSentCoord: { latitude: number; longitude: number } | null = null;
        let kfLat: number | null = null;
        let kfLng: number | null = null;
        let pLat = 0;
        let pLng = 0;

        const toRad = (v: number) => (v * Math.PI) / 180;
        const distanceMeters = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
            const R = 6371000;
            const dLat = toRad(b.latitude - a.latitude);
            const dLon = toRad(b.longitude - a.longitude);
            const lat1 = toRad(a.latitude);
            const lat2 = toRad(b.latitude);
            const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
            return 2 * R * Math.asin(Math.sqrt(x));
        };

        const start = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                console.log('[Tracking] foreground permission status:', status);
                if (status !== 'granted') {
                    return;
                }

                subscription = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.BestForNavigation,
                        timeInterval: 1000,
                        distanceInterval: 0,
                    },
                    async (pos) => {
                        if (cancelled) return;

                        if (!firstLogged) {
                            firstLogged = true;
                            console.log('[Tracking] first position event received');
                        }

                        const now = Date.now();
                        if (now - lastSentAt < 1000) return;
                        lastSentAt = now;

                        const coords = pos?.coords;
                        if (!coords) return;

                        // Filter GPS jitter when user is basically stationary.
                        // Typical GPS drift is a few meters even if the phone doesn't move.
                        const accuracy = typeof coords.accuracy === 'number' ? coords.accuracy : null;
                        if (accuracy !== null && accuracy > 25) {
                            return;
                        }

                        const speed = typeof coords.speed === 'number' ? coords.speed : null;

                        const acc = accuracy !== null ? Math.max(accuracy, 5) : 15;
                        const sigmaLat = acc / 111111;
                        const cosLat = Math.cos(toRad(coords.latitude)) || 1;
                        const sigmaLng = acc / (111111 * cosLat);
                        const rLat = sigmaLat * sigmaLat;
                        const rLng = sigmaLng * sigmaLng;
                        const qLat = (0.7 / 111111) * (0.7 / 111111);
                        const qLng = (0.7 / (111111 * cosLat)) * (0.7 / (111111 * cosLat));

                        if (kfLat === null || kfLng === null) {
                            kfLat = coords.latitude;
                            kfLng = coords.longitude;
                            pLat = rLat;
                            pLng = rLng;
                        } else {
                            pLat = pLat + qLat;
                            pLng = pLng + qLng;
                            const kLat = pLat / (pLat + rLat);
                            const kLng = pLng / (pLng + rLng);
                            kfLat = kfLat + kLat * (coords.latitude - kfLat);
                            kfLng = kfLng + kLng * (coords.longitude - kfLng);
                            pLat = (1 - kLat) * pLat;
                            pLng = (1 - kLng) * pLng;
                        }

                        const filtered = { latitude: kfLat, longitude: kfLng };

                        if (lastSentCoord) {
                            const d = distanceMeters(lastSentCoord, filtered);
                            const goodAcc = acc <= 10;
                            const threshold = goodAcc ? 6 : 15;
                            const isMoving = (speed !== null && speed > 1.2) || d > threshold;
                            if (!isMoving) {
                                return;
                            }
                        }

                        try {
                            await trackingApi.upsertMyPosition({
                                latitude: filtered.latitude,
                                longitude: filtered.longitude,
                                accuracy: coords.accuracy ?? undefined,
                                speed: coords.speed ?? undefined,
                                heading: coords.heading ?? undefined,
                                deviceTimestamp: pos?.timestamp ? new Date(pos.timestamp).toISOString() : undefined,
                            });

                            lastSentCoord = { latitude: filtered.latitude, longitude: filtered.longitude };
                        } catch (e) {
                            console.log('[Tracking] upsertMyPosition failed', e);
                        }
                    },
                );

                console.log('[Tracking] watchPositionAsync subscribed');
            } catch (e) {
                console.log('[Tracking] watchPositionAsync failed to start', e);
            }
        };

        start();

        return () => {
            cancelled = true;
            if (subscription) {
                subscription.remove();
                subscription = null;
            }
        };
    }, [isAuthenticated, user?.id, user?.activeRole, user?.shareLocation]);

    // Emit stop-sharing to backend so guide map updates in real time (gray marker)
    useEffect(() => {
        if (!isAuthenticated || !user?.id) return;
        if (user?.activeRole !== 'pelerin') return;

        // We only want to notify backend when the user transitions from true -> false
        // (avoids spamming on every render)
        const prevRef = (globalThis as any).__prevShareLocationRef || { current: undefined };
        (globalThis as any).__prevShareLocationRef = prevRef;
        const prev = prevRef.current;
        prevRef.current = user?.shareLocation;

        if (prev === true && user?.shareLocation === false) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            trackingApi.stopSharingMyPosition();
        }
    }, [isAuthenticated, user?.id, user?.activeRole, user?.shareLocation]);

    useEffect(() => {
        const isRTL = language === 'ar';
        if (I18nManager.isRTL !== isRTL) {
            I18nManager.allowRTL(isRTL);
            I18nManager.forceRTL(isRTL);
            // On some platforms, a reload is needed for RTL to take full effect
            // If you want immediate effect, you might need Updates.reloadAsync()
            // but that might be disruptive. Let's try without it first as standard RN behavior.
        }
    }, [language]);

    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (token && !isAuthenticated) {
                    const user = await dispatch(fetchProfile()).unwrap();
                    
                    const inAuthGroup = segments[0] === '(auth)';
                    const isIndex = !segments[0] || (segments[0] as any) === 'index';
                    if (inAuthGroup || isIndex) {
                        const targetPath = user.activeRole === 'accompagnant' 
                            ? '/(accampagnant)/home' 
                            : '/(umrah_agence)/(screens)/acceuil';
                        router.replace(targetPath as any);
                    }
                }
            } catch (e) {
                console.log('Session rehydration failed', e);
            } finally {
                // Wait a bit more to see the splash animation
                setTimeout(() => {
                    setIsInitializing(false);
                }, 1500);
            }
        };
        checkSession();
    }, []);

    if (isInitializing) {
        return <AppSplashScreen />;
    }


    const inAuthGroup = segments[0] === '(auth)';
    const isIndex = !segments[0];
    const backgroundColor = (inAuthGroup || isIndex) ? (isDarkMode ? colors.background : '#FFFFFF') : colors.background;

    const isSplashScreen = (segments as string[]).length === 0 || (segments as string[]).includes('index');
    // For all auth screens, we want full screen backgrounds
    const safeEdges = (inAuthGroup || isSplashScreen) ? [] : (['top', 'left', 'right'] as any);


    return (
        <View style={{ flex: 1, backgroundColor }}>
            <StatusBar style={isDarkMode ? "light" : "dark"} translucent={true} backgroundColor="transparent" />
            <SafeAreaView style={{ flex: 1 }} edges={safeEdges}>
                {sosEnRouteVisible ? (
                    <View
                        style={{
                            position: 'absolute',
                            top: 12,
                            left: 12,
                            right: 12,
                            zIndex: 9999,
                            borderRadius: 14,
                            paddingVertical: 12,
                            paddingHorizontal: 14,
                            backgroundColor: isDarkMode ? 'rgba(17, 24, 39, 0.92)' : 'rgba(255, 255, 255, 0.98)',
                            borderWidth: 1,
                            borderColor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <MaterialCommunityIcons name="navigation" size={18} color={isDarkMode ? '#FB923C' : '#F97316'} />
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontWeight: '800', color: isDarkMode ? '#fff' : '#111827' }}>
                                    Le guide est en route
                                </Text>
                                <Text style={{ marginTop: 2, color: isDarkMode ? '#D1D5DB' : '#374151', fontWeight: '600' }}>
                                    Reste stable dans votre position
                                </Text>
                            </View>
                        </View>
                    </View>
                ) : null}
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(umrah_agence)" />
                    <Stack.Screen name="(accampagnant)" />
                </Stack>
            </SafeAreaView>
        </View>
    );
}


export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        ...FontAwesome5.font,
        ...Ionicons.font,
        ...MaterialCommunityIcons.font,
    });

    useEffect(() => {
        if (Platform.OS === 'android') {
            NavigationBar.setVisibilityAsync('hidden');
            NavigationBar.setBehaviorAsync('overlay-swipe');
        }
    }, []);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Provider store={store}>
                <SafeAreaProvider>
                    <AppContent />
                </SafeAreaProvider>
            </Provider>
        </GestureHandlerRootView>
    );
}
