import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DeviceEventEmitter, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { trackingApi } from '@/services/api';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

const resolveMapboxToken = () => {
  const fromEnv = String(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '').trim();
  if (fromEnv) return fromEnv;
  const extra = (Constants?.expoConfig as any)?.extra || (Constants as any)?.manifest?.extra || {};
  const fromExtra = String(extra?.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || extra?.MAPBOX_ACCESS_TOKEN || '').trim();
  return fromExtra;
};

const mapboxToken = resolveMapboxToken();
if (mapboxToken) {
  MapboxGL.setAccessToken(mapboxToken);
} else {
  console.warn('[GuideTracking] Mapbox access token is missing. Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in your app config/.env');
}

const DEFAULT_CENTER: [number, number] = [39.8262, 21.4225];

export default function GuideTrackingScreen() {
  const router = useRouter();
  const cameraRef = useRef<any>(null);
  const authUserId = useSelector((state: RootState) => String(state.auth.user?.id || '').trim());

  const [myCoords, setMyCoords] = useState<[number, number] | null>(null);
  const [guideCoords, setGuideCoords] = useState<[number, number] | null>(null);
  const [distanceM, setDistanceM] = useState<number | null>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  const haversineMeters = useCallback((a: number[], b: number[]) => {
    try {
      const toRad = (v: number) => (v * Math.PI) / 180;
      const R = 6371000;
      const lat1 = toRad(Number(a[1]));
      const lat2 = toRad(Number(b[1]));
      const dLat = lat2 - lat1;
      const dLon = toRad(Number(b[0]) - Number(a[0]));
      const sinDLat = Math.sin(dLat / 2);
      const sinDLon = Math.sin(dLon / 2);
      const aa = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
      const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
      return R * c;
    } catch (e) {
      return null;
    }
  }, []);

  const fetchRoute = useCallback(async (start: number[], end: number[]) => {
    const accessToken = mapboxToken;
    if (!accessToken) return;

    // Prefer driving-traffic when available to approximate traffic impact
    const profile = 'mapbox/driving-traffic';
    const url = `https://api.mapbox.com/directions/v5/${profile}/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&overview=full&access_token=${accessToken}`;

    try {
      const response = await fetch(url);
      const json = await response.json();
      const route = json?.routes?.[0];
      const geometry = route?.geometry;
      if (!geometry) return;

      setRouteData({
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry, properties: {} }],
      });

      const distanceKm = typeof route?.distance === 'number' ? route.distance / 1000 : NaN;
      const durationMin = typeof route?.duration === 'number' ? route.duration / 60 : NaN;
      if (Number.isFinite(distanceKm) && Number.isFinite(durationMin)) {
        setRouteInfo({
          distance: distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(2)} km`,
          duration: `${Math.round(durationMin)} min`,
        });
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (mounted) {
          setMyCoords([current.coords.longitude, current.coords.latitude]);
        }

        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 4000, distanceInterval: 10 },
          (pos) => {
            if (!mounted) return;
            setMyCoords([pos.coords.longitude, pos.coords.latitude]);
          },
        );
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
      if (sub) sub.remove();
    };
  }, []);

  const syncGuide = useCallback(async () => {
    try {
      const res = await trackingApi.getMyGuideLastPosition();
      const p = res?.data?.position;
      const lat = p?.latitude !== undefined && p?.latitude !== null ? Number(p.latitude) : NaN;
      const lng = p?.longitude !== undefined && p?.longitude !== null ? Number(p.longitude) : NaN;
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        setGuideCoords([lng, lat]);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    syncGuide();
    const id = setInterval(syncGuide, 5000);
    return () => clearInterval(id);
  }, [syncGuide]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('app:new_notification', (payload: any) => {
      try {
        const type = String(payload?.data?.type || payload?.type || '').toLowerCase();
        if (type !== 'sos_status') return;
        const status = String(payload?.data?.status || '').toLowerCase();
        const targetPilgrimId = String(payload?.data?.pilgrimUserId || '').trim();
        if (targetPilgrimId && authUserId && targetPilgrimId !== authUserId) return;
        if (status === 'resolved') {
          router.back();
        }
      } catch {
        // ignore
      }
    });

    return () => {
      try {
        sub.remove();
      } catch {
        // ignore
      }
    };
  }, [router, authUserId]);

  useEffect(() => {
    if (!myCoords || !guideCoords) return;
    const d = haversineMeters(myCoords, guideCoords);
    if (typeof d === 'number' && Number.isFinite(d)) {
      setDistanceM(d);
    }
  }, [myCoords, guideCoords, haversineMeters]);

  useEffect(() => {
    if (!myCoords || !guideCoords) return;
    fetchRoute(guideCoords, myCoords);
  }, [myCoords, guideCoords, fetchRoute]);

  const center = useMemo(() => {
    return guideCoords || myCoords || DEFAULT_CENTER;
  }, [guideCoords, myCoords]);

  useEffect(() => {
    if (!cameraRef.current) return;
    try {
      cameraRef.current.setCamera({
        centerCoordinate: center,
        zoomLevel: 15.5,
        animationDuration: 800,
      } as any);
    } catch {
      // ignore
    }
  }, [center]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Suivre le guide</Text>
        <View style={{ width: 64 }} />
      </View>

      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          Distance: {distanceM === null ? '—' : distanceM < 1000 ? `${Math.round(distanceM)} m` : `${(distanceM / 1000).toFixed(2)} km`}
        </Text>
        {routeInfo ? (
          <Text style={styles.infoSubText}>Trajet: {routeInfo.distance} • {routeInfo.duration}</Text>
        ) : null}
      </View>

      <MapboxGL.MapView style={styles.map} styleURL={MapboxGL.StyleURL.Street}>
        <MapboxGL.Camera ref={cameraRef} centerCoordinate={center} zoomLevel={15.5} />

        {routeData ? (
          <MapboxGL.ShapeSource id="routeSource" shape={routeData}>
            <MapboxGL.LineLayer
              id="routeLineBg"
              style={{ lineColor: '#1D4ED8', lineWidth: 10, lineOpacity: 0.25, lineCap: 'round', lineJoin: 'round' }}
            />
            <MapboxGL.LineLayer
              id="routeLine"
              style={{ lineColor: '#2563EB', lineWidth: 6, lineOpacity: 0.95, lineCap: 'round', lineJoin: 'round' }}
            />
          </MapboxGL.ShapeSource>
        ) : null}

        {myCoords ? (
          <MapboxGL.PointAnnotation id="me" coordinate={myCoords} />
        ) : null}

        {guideCoords ? (
          <MapboxGL.PointAnnotation id="guide" coordinate={guideCoords} />
        ) : null}
      </MapboxGL.MapView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  backText: { fontSize: 13, fontWeight: '700', color: '#111827' },
  title: { fontSize: 16, fontWeight: '800', color: '#111827' },
  infoBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  infoText: { fontSize: 14, fontWeight: '700', color: '#111827' },
  infoSubText: { marginTop: 4, fontSize: 12, fontWeight: '600', color: '#374151' },
  map: { flex: 1 },
});
