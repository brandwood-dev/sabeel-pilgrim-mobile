import React, { useState } from 'react';
import {
    StyleSheet, Text, View, TouchableOpacity,
    Image, ActivityIndicator, ScrollView, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useThemeColors } from '@/hooks/useThemeColors';
import { CustomAlert } from '@/components/ui/CustomAlert';
import { documentsApi } from '@/services/api';

type ScanStatus = 'idle' | 'loading' | 'success' | 'error';

interface ScanResult {
    uri: string;
    status: ScanStatus;
    kycMessage?: string;
    isClean?: boolean;
    brightnessScore?: number;
    sharpnessScore?: number;
}

export default function CINScanPage() {
    const router = useRouter();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

    const PAGE_BG = isDarkMode ? '#111111' : '#F4F5F7';
    const CARD_BG = isDarkMode ? '#1C1C1E' : '#FFFFFF';
    const TEXT = isDarkMode ? '#FFFFFF' : '#111827';
    const TEXT_SEC = isDarkMode ? '#8A8A8E' : '#6B7280';
    const BORDER = isDarkMode ? '#3A3A3C' : '#E5E7EB';
    const PRIMARY = colors.primary;
    const SUCCESS = '#2C5F2D';
    const WARNING = '#d9ab83';
    const ERROR = '#d9ab83';

    const [recto, setRecto] = useState<ScanResult | null>(null);
    const [verso, setVerso] = useState<ScanResult | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [alert, setAlert] = useState<{
        visible: boolean; title: string; message: string; type: 'success' | 'error' | 'warning';
    }>({ visible: false, title: '', message: '', type: 'success' });

    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning') => {
        setAlert({ visible: true, title, message, type });
    };

    /**
     * Performs a local pre-check before uploading:
     * - Checks image filesize (too small = might be blank)
     * Returns null if the image seems valid, or an error message.
     */
    const localPrecheck = (fileSize?: number): string | null => {
        if (fileSize && fileSize < 10 * 1024) { // < 10KB
            return 'Image trop petite ou vide. Prenez une vraie photo du document.';
        }
        return null;
    };

    const takePhoto = async (side: 'recto' | 'verso') => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            showAlert('Permission requise', 'Accès à la caméra nécessaire pour scanner votre carte.', 'error');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [3, 2],
            quality: 0.9,
        });

        if (result.canceled) return;

        const asset = result.assets[0];

        // Local pre-check
        const localError = localPrecheck(asset.fileSize);
        if (localError) {
            showAlert('Image invalide', localError, 'error');
            return;
        }

        // Set loading state
        const loadingResult: ScanResult = { uri: asset.uri, status: 'loading' };
        if (side === 'recto') setRecto(loadingResult);
        else setVerso(loadingResult);

        // Upload to backend for real KYC analysis
        try {
            const docType = side === 'recto' ? 'cin_recto' : 'cin_verso';
            const response = await documentsApi.upload(docType, asset.uri);
            const data = response.data;

            const scanResult: ScanResult = {
                uri: asset.uri,
                status: data.success ? 'success' : 'error',
                isClean: data.kycResult?.isClean,
                kycMessage: data.kycResult?.rejectionReason ?? (data.success ? 'Document clair et lisible ✓' : 'Document refusé'),
                brightnessScore: data.kycResult?.brightnessScore,
                sharpnessScore: data.kycResult?.sharpnessScore,
            };

            if (side === 'recto') setRecto(scanResult);
            else setVerso(scanResult);

            if (!data.success) {
                showAlert(
                    'Document refusé',
                    data.kycResult?.rejectionReason ?? 'Ce document n\'a pas été accepté. Veuillez réessayer.',
                    'error'
                );
            }
        } catch (err: any) {
            const errorResult: ScanResult = {
                uri: asset.uri,
                status: 'error',
                kycMessage: 'Erreur de connexion. Vérifiez votre réseau.',
            };
            if (side === 'recto') setRecto(errorResult);
            else setVerso(errorResult);
            showAlert('Erreur réseau', 'Impossible d\'analyser le document. Vérifiez votre connexion.', 'error');
        }
    };

    const handleConfirm = () => {
        if (!recto || recto.status !== 'success' || !verso || verso.status !== 'success') {
            showAlert('Incomplet', 'Les deux faces de la carte doivent être acceptées (vertes) avant de continuer.', 'warning');
            return;
        }
        showAlert('Succès', 'Votre carte d\'identité a été vérifiée et sauvegardée avec succès !', 'success');
    };

    const renderCard = (label: string, side: 'recto' | 'verso', data: ScanResult | null) => {
        const borderColor = data?.status === 'success' ? SUCCESS
            : data?.status === 'error' ? ERROR
            : BORDER;

        return (
            <View>
                <TouchableOpacity
                    style={[styles.scanCard, { backgroundColor: CARD_BG, borderColor }]}
                    onPress={() => takePhoto(side)}
                    activeOpacity={0.8}
                    disabled={data?.status === 'loading'}
                >
                    {data?.uri ? (
                        <Image source={{ uri: data.uri }} style={styles.preview} />
                    ) : (
                        <View style={styles.placeholder}>
                            <Ionicons name="camera-outline" size={32} color={PRIMARY} />
                            <Text style={[styles.placeholderText, { color: TEXT }]}>{label}</Text>
                            <Text style={[styles.placeholderHint, { color: TEXT_SEC }]}>Appuyez pour prendre une photo</Text>
                        </View>
                    )}

                    {/* Overlay status badge */}
                    {data?.status === 'loading' && (
                        <View style={styles.overlay}>
                            <ActivityIndicator color="#fff" size="large" />
                            <Text style={styles.overlayText}>Analyse KYC...</Text>
                        </View>
                    )}
                    {data?.status === 'success' && (
                        <View style={[styles.statusBadge, { backgroundColor: SUCCESS }]}>
                            <Ionicons name="checkmark-circle" size={16} color="#fff" />
                            <Text style={styles.badgeText}>Validé</Text>
                        </View>
                    )}
                    {data?.status === 'error' && (
                        <View style={[styles.statusBadge, { backgroundColor: ERROR }]}>
                            <Ionicons name="close-circle" size={16} color="#fff" />
                            <Text style={styles.badgeText}>Refusé</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* KYC feedback */}
                {data?.kycMessage && data.status !== 'loading' && (
                    <View style={[styles.kycFeedback, {
                        backgroundColor: data.status === 'success' ? 'rgba(44,95,45,0.07)' : 'rgba(217,171,131,0.1)',
                        borderColor: data.status === 'success' ? 'rgba(44,95,45,0.2)' : 'rgba(217,171,131,0.3)',
                    }]}>
                        <Ionicons
                            name={data.status === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                            size={14}
                            color={data.status === 'success' ? SUCCESS : ERROR}
                        />
                        <Text style={[styles.kycText, { color: data.status === 'success' ? SUCCESS : ERROR }]}>
                            {data.kycMessage}
                        </Text>
                        {data.status === 'error' && (
                            <TouchableOpacity onPress={() => takePhoto(side)}>
                                <Text style={[styles.retryText, { color: PRIMARY }]}>Réessayer</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Scores */}
                {data?.status === 'success' && data.brightnessScore !== undefined && (
                    <View style={styles.scoreRow}>
                        <View style={styles.scoreItem}>
                            <Ionicons name="sunny-outline" size={12} color={TEXT_SEC} />
                            <Text style={[styles.scoreText, { color: TEXT_SEC }]}>Luminosité: {data.brightnessScore}%</Text>
                        </View>
                        <View style={styles.scoreItem}>
                            <Ionicons name="eye-outline" size={12} color={TEXT_SEC} />
                            <Text style={[styles.scoreText, { color: TEXT_SEC }]}>Netteté: {data.sharpnessScore}%</Text>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    const bothValid = recto?.status === 'success' && verso?.status === 'success';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: PAGE_BG }]}>
            <View style={[styles.header, { borderBottomColor: BORDER }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={PRIMARY} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: TEXT }]}>Carte d'identité (CIN)</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.subtitle, { color: TEXT_SEC }]}>
                    Prenez des photos nettes du recto et du verso de votre pièce d'identité.
                    Notre IA vérifie automatiquement la qualité.
                </Text>

                <Text style={[styles.sectionLabel, { color: TEXT }]}>Face Recto</Text>
                {renderCard('Scanner le Recto', 'recto', recto)}

                <View style={{ height: 20 }} />

                <Text style={[styles.sectionLabel, { color: TEXT }]}>Face Verso</Text>
                {renderCard('Scanner le Verso', 'verso', verso)}

                <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#1a2e1a' : 'rgba(44,95,45,0.05)' }]}>
                    <Ionicons name="shield-checkmark-outline" size={18} color={PRIMARY} />
                    <Text style={[styles.infoText, { color: TEXT_SEC }]}>
                        Vos documents sont chiffrés et stockés de manière sécurisée. Ils ne sont utilisés que pour la vérification d'identité.
                    </Text>
                </View>
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: BORDER }]}>
                <TouchableOpacity
                    style={[styles.confirmBtn, { backgroundColor: bothValid ? PRIMARY : BORDER }]}
                    onPress={handleConfirm}
                    disabled={!bothValid || submitting}
                >
                    {submitting
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={[styles.confirmText, { color: bothValid ? '#fff' : TEXT_SEC }]}>
                            {bothValid ? 'Confirmer ✓' : 'Scannez les deux faces'}
                          </Text>
                    }
                </TouchableOpacity>
            </View>

            <CustomAlert
                visible={alert.visible}
                title={alert.title}
                message={alert.message}
                type={alert.type}
                onClose={() => {
                    setAlert({ ...alert, visible: false });
                    if (alert.type === 'success') router.back();
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 16, fontWeight: '700' },
    content: { padding: 20, paddingBottom: 40 },
    subtitle: { fontSize: 13, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
    sectionLabel: { fontSize: 13, fontWeight: '700', marginBottom: 10, letterSpacing: 0.5 },
    scanCard: {
        width: '100%', height: 180, borderRadius: 16, borderWidth: 2,
        borderStyle: 'dashed', overflow: 'hidden',
        justifyContent: 'center', alignItems: 'center',
    },
    placeholder: { alignItems: 'center', gap: 6 },
    placeholderText: { fontSize: 14, fontWeight: '700', marginTop: 4 },
    placeholderHint: { fontSize: 11 },
    preview: { width: '100%', height: '100%', resizeMode: 'cover' },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center', justifyContent: 'center', gap: 10,
    },
    overlayText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    statusBadge: {
        position: 'absolute', top: 10, right: 10,
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    kycFeedback: {
        marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8,
        padding: 10, borderRadius: 10, borderWidth: 1,
    },
    kycText: { flex: 1, fontSize: 12, lineHeight: 16, fontWeight: '600' },
    retryText: { fontSize: 11, fontWeight: '700', textDecorationLine: 'underline' },
    scoreRow: { flexDirection: 'row', gap: 16, marginTop: 6, paddingLeft: 4 },
    scoreItem: { flexDirection: 'row', gap: 4, alignItems: 'center' },
    scoreText: { fontSize: 11 },
    infoBox: {
        flexDirection: 'row', gap: 10, padding: 14,
        borderRadius: 12, marginTop: 24,
    },
    infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
    footer: { padding: 20, borderTopWidth: StyleSheet.hairlineWidth },
    confirmBtn: { height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    confirmText: { fontSize: 15, fontWeight: '700' },
});
