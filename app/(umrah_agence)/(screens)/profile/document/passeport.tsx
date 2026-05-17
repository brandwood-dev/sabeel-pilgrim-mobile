import React, { useState } from 'react';
import {
    StyleSheet, Text, View, TouchableOpacity,
    Image, ActivityIndicator, ScrollView
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

export default function PasseportScanPage() {
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
    const ERROR = '#d9ab83';

    const [scan, setScan] = useState<ScanResult | null>(null);

    const [alert, setAlert] = useState<{
        visible: boolean; title: string; message: string; type: 'success' | 'error' | 'warning';
    }>({ visible: false, title: '', message: '', type: 'success' });

    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning') => {
        setAlert({ visible: true, title, message, type });
    };

    const localPrecheck = (fileSize?: number): string | null => {
        if (fileSize && fileSize < 10 * 1024) {
            return 'Image trop petite. Prenez une vraie photo du passeport.';
        }
        return null;
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            showAlert('Permission requise', 'Accès à la caméra nécessaire pour scanner votre passeport.', 'error');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [3, 2],
            quality: 0.9,
        });

        if (result.canceled) return;

        const asset = result.assets[0];

        const localError = localPrecheck(asset.fileSize);
        if (localError) {
            showAlert('Image invalide', localError, 'error');
            return;
        }

        setScan({ uri: asset.uri, status: 'loading' });

        try {
            const response = await documentsApi.upload('passport', asset.uri);
            const data = response.data;

            setScan({
                uri: asset.uri,
                status: data.success ? 'success' : 'error',
                isClean: data.kycResult?.isClean,
                kycMessage: data.kycResult?.rejectionReason ?? (data.success ? 'Document clair et valide ✓' : 'Document refusé'),
                brightnessScore: data.kycResult?.brightnessScore,
                sharpnessScore: data.kycResult?.sharpnessScore,
            });

            if (!data.success) {
                showAlert(
                    'Document refusé',
                    data.kycResult?.rejectionReason ?? 'Ce passeport n\'a pas été accepté. Veuillez réessayer.',
                    'error'
                );
            }
        } catch (err: any) {
            setScan({
                uri: asset.uri,
                status: 'error',
                kycMessage: 'Erreur de connexion. Vérifiez votre réseau.',
            });
            showAlert('Erreur réseau', 'Impossible d\'analyser le document. Vérifiez votre connexion.', 'error');
        }
    };

    const handleConfirm = () => {
        if (!scan || scan.status !== 'success') {
            showAlert('Document requis', 'Votre passeport doit être validé (vert) avant de continuer.', 'warning');
            return;
        }
        showAlert('Succès', 'Votre passeport a été vérifié et sauvegardé avec succès !', 'success');
    };

    const borderColor = scan?.status === 'success' ? SUCCESS
        : scan?.status === 'error' ? ERROR
        : BORDER;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: PAGE_BG }]}>
            <View style={[styles.header, { borderBottomColor: BORDER }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={PRIMARY} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: TEXT }]}>Passeport</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.subtitle, { color: TEXT_SEC }]}>
                    Scannez la page biographique de votre passeport (page avec votre photo, nom et MRZ).{'\n'}
                    Notre IA vérifie la qualité et la lisibilité du document.
                </Text>

                {/* Passport scan card */}
                <TouchableOpacity
                    style={[styles.scanCard, { backgroundColor: CARD_BG, borderColor }]}
                    onPress={takePhoto}
                    activeOpacity={0.8}
                    disabled={scan?.status === 'loading'}
                >
                    {scan?.uri ? (
                        <Image source={{ uri: scan.uri }} style={styles.preview} />
                    ) : (
                        <View style={styles.placeholder}>
                            <Ionicons name="book-outline" size={40} color={PRIMARY} />
                            <Text style={[styles.placeholderText, { color: TEXT }]}>Scanner le Passeport</Text>
                            <Text style={[styles.placeholderHint, { color: TEXT_SEC }]}>Page photo + informations</Text>
                        </View>
                    )}

                    {scan?.status === 'loading' && (
                        <View style={styles.overlay}>
                            <ActivityIndicator color="#fff" size="large" />
                            <Text style={styles.overlayText}>Analyse KYC...</Text>
                        </View>
                    )}
                    {scan?.status === 'success' && (
                        <View style={[styles.statusBadge, { backgroundColor: SUCCESS }]}>
                            <Ionicons name="checkmark-circle" size={16} color="#fff" />
                            <Text style={styles.badgeText}>Passeport validé</Text>
                        </View>
                    )}
                    {scan?.status === 'error' && (
                        <View style={[styles.statusBadge, { backgroundColor: ERROR }]}>
                            <Ionicons name="close-circle" size={16} color="#fff" />
                            <Text style={styles.badgeText}>Refusé</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* KYC feedback */}
                {scan?.kycMessage && scan.status !== 'loading' && (
                    <View style={[styles.kycFeedback, {
                        backgroundColor: scan.status === 'success' ? 'rgba(44,95,45,0.07)' : 'rgba(217,171,131,0.1)',
                        borderColor: scan.status === 'success' ? 'rgba(44,95,45,0.2)' : 'rgba(217,171,131,0.3)',
                    }]}>
                        <Ionicons
                            name={scan.status === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                            size={14}
                            color={scan.status === 'success' ? SUCCESS : ERROR}
                        />
                        <Text style={[styles.kycText, { color: scan.status === 'success' ? SUCCESS : ERROR }]}>
                            {scan.kycMessage}
                        </Text>
                        {scan.status === 'error' && (
                            <TouchableOpacity onPress={takePhoto}>
                                <Text style={[styles.retryText, { color: PRIMARY }]}>Réessayer</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Quality scores */}
                {scan?.status === 'success' && scan.brightnessScore !== undefined && (
                    <View style={styles.scoreRow}>
                        <View style={styles.scoreItem}>
                            <Ionicons name="sunny-outline" size={12} color={TEXT_SEC} />
                            <Text style={[styles.scoreText, { color: TEXT_SEC }]}>Luminosité: {scan.brightnessScore}%</Text>
                        </View>
                        <View style={styles.scoreItem}>
                            <Ionicons name="eye-outline" size={12} color={TEXT_SEC} />
                            <Text style={[styles.scoreText, { color: TEXT_SEC }]}>Netteté: {scan.sharpnessScore}%</Text>
                        </View>
                    </View>
                )}

                {/* MRZ tips */}
                <View style={[styles.tipsCard, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
                    <Text style={[styles.tipsTitle, { color: TEXT }]}>
                        <Ionicons name="bulb-outline" size={14} color={PRIMARY} /> Conseils
                    </Text>
                    {[
                        'Tenez votre passeport à plat sur une surface sombre',
                        'Évitez les reflets et les ombres sur le document',
                        'Assurez-vous que les deux lignes MRZ (bas de page) sont visibles',
                        'Éclairage uniforme de préférence naturel',
                    ].map((tip, i) => (
                        <Text key={i} style={[styles.tipText, { color: TEXT_SEC }]}>• {tip}</Text>
                    ))}
                </View>

                <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#1a2e1a' : 'rgba(44,95,45,0.05)' }]}>
                    <Ionicons name="finger-print-outline" size={18} color={PRIMARY} />
                    <Text style={[styles.infoText, { color: TEXT_SEC }]}>
                        Vos données sont chiffrées et stockées de manière sécurisée sur nos serveurs.
                    </Text>
                </View>
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: BORDER }]}>
                <TouchableOpacity
                    style={[styles.confirmBtn, { backgroundColor: scan?.status === 'success' ? PRIMARY : BORDER }]}
                    onPress={handleConfirm}
                    disabled={scan?.status !== 'success'}
                >
                    <Text style={[styles.confirmText, { color: scan?.status === 'success' ? '#fff' : TEXT_SEC }]}>
                        {scan?.status === 'success' ? 'Confirmer ✓' : 'Scannez votre passeport'}
                    </Text>
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
    subtitle: { fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    scanCard: {
        width: '100%', height: 220, borderRadius: 16, borderWidth: 2,
        borderStyle: 'dashed', overflow: 'hidden',
        justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    },
    placeholder: { alignItems: 'center', gap: 6 },
    placeholderText: { fontSize: 14, fontWeight: '700', marginTop: 6 },
    placeholderHint: { fontSize: 11 },
    preview: { width: '100%', height: '100%', resizeMode: 'cover' },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center', justifyContent: 'center', gap: 10,
    },
    overlayText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    statusBadge: {
        position: 'absolute', top: 12, right: 12,
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    kycFeedback: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 8,
    },
    kycText: { flex: 1, fontSize: 12, lineHeight: 16, fontWeight: '600' },
    retryText: { fontSize: 11, fontWeight: '700', textDecorationLine: 'underline' },
    scoreRow: { flexDirection: 'row', gap: 16, marginBottom: 16, paddingLeft: 4 },
    scoreItem: { flexDirection: 'row', gap: 4, alignItems: 'center' },
    scoreText: { fontSize: 11 },
    tipsCard: {
        borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 16, gap: 6,
    },
    tipsTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
    tipText: { fontSize: 12, lineHeight: 18 },
    infoBox: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 12 },
    infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
    footer: { padding: 20, borderTopWidth: StyleSheet.hairlineWidth },
    confirmBtn: { height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    confirmText: { fontSize: 15, fontWeight: '700' },
});
