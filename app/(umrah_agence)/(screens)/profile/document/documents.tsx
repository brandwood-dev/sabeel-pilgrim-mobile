import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

export default function DocumentsPage() {
    const router = useRouter();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

    const PAGE_BG = isDarkMode ? '#111111' : '#F4F5F7';
    const CARD_BG = isDarkMode ? '#1C1C1E' : '#FFFFFF';
    const TEXT = isDarkMode ? '#FFFFFF' : '#111827';
    const TEXT_SEC = isDarkMode ? '#8A8A8E' : '#6B7280';
    const BORDER = isDarkMode ? '#3A3A3C' : '#E5E7EB';
    const PRIMARY = colors.primary;

    // Simulation de status (à lier avec Redux/API plus tard)
    const verifiedStatus = { passeport: false, cin: false };
    const uploadedCount = Object.values(verifiedStatus).filter(v => v).length;
    const totalDocs = 2;

    return (
        <SafeAreaView style={[ds.container, { backgroundColor: PAGE_BG }]}>
            {/* Header */}
            <View style={[ds.header, { backgroundColor: PAGE_BG, borderBottomColor: BORDER }]}>
                <TouchableOpacity
                    onPress={() => router.replace('/(umrah_agence)/(screens)/profile/profile' as any)}
                    style={ds.closeBtn}
                >
                    <Ionicons name="chevron-back" size={24} color={PRIMARY} />
                </TouchableOpacity>
                <Text style={[ds.headerTitle, { color: TEXT }]}>Mes documents</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView contentContainerStyle={ds.content} showsVerticalScrollIndicator={false}>
                {/* Status Card au haut */}
                <TouchableOpacity
                    style={[ds.statusCard, { backgroundColor: CARD_BG, borderColor: BORDER }]}
                    onPress={() => router.push('/(umrah_agence)/(screens)/profile/document/status' as any)}
                    activeOpacity={0.8}
                >
                    <View style={ds.statusLabel}>
                        <View style={[ds.statusDot, { backgroundColor: uploadedCount === totalDocs ? '#10B981' : '#F59E0B' }]} />
                        <Text style={[ds.statusTitle, { color: TEXT }]}>État de vérification</Text>
                    </View>
                    <View style={ds.statusRight}>
                        <Text style={[ds.statusText, { color: PRIMARY }]}>{uploadedCount}/{totalDocs} Téléchargés</Text>
                        <Ionicons name="chevron-forward" size={16} color={TEXT_SEC} />
                    </View>
                </TouchableOpacity>

                <Text style={[ds.subtitle, { color: TEXT_SEC }]}>
                    Vérifiez votre identité pour accéder à tous les services.
                </Text>

                {/* Passeport Card */}
                <TouchableOpacity
                    style={[ds.docCard, { backgroundColor: CARD_BG, borderColor: BORDER }]}
                    onPress={() => router.push('/(umrah_agence)/(screens)/profile/document/passeport' as any)}
                    activeOpacity={0.85}
                >
                    <View style={[ds.docIcon, { backgroundColor: isDarkMode ? '#242424' : '#F0FDF4' }]}>
                        <Ionicons name="book-outline" size={22} color={PRIMARY} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[ds.docTitle, { color: TEXT }]}>Passeport</Text>
                        <Text style={[ds.docDesc, { color: TEXT_SEC }]}>Scannez votre passeport</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={TEXT_SEC} />
                </TouchableOpacity>

                {/* CIN Card */}
                <TouchableOpacity
                    style={[ds.docCard, { backgroundColor: CARD_BG, borderColor: BORDER }]}
                    onPress={() => router.push('/(umrah_agence)/(screens)/profile/document/cin' as any)}
                    activeOpacity={0.85}
                >
                    <View style={[ds.docIcon, { backgroundColor: isDarkMode ? '#242424' : '#F0FDF4' }]}>
                        <Ionicons name="card-outline" size={22} color={PRIMARY} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[ds.docTitle, { color: TEXT }]}>Carte d'identité (CIN)</Text>
                        <Text style={[ds.docDesc, { color: TEXT_SEC }]}>Recto et Verso requis</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={TEXT_SEC} />
                </TouchableOpacity>

                {/* Info note */}
                <View style={[ds.infoBox, { backgroundColor: isDarkMode ? '#1a2e1a' : '#F0FDF4', borderColor: PRIMARY + '20' }]}>
                    <Ionicons name="information-circle-outline" size={16} color={PRIMARY} />
                    <Text style={[ds.infoText, { color: TEXT_SEC }]}>
                        Vos documents sont sécurisés. La vérification prend 24h.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const ds = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, paddingTop: -20
    },
    closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '700' },
    content: { padding: 16 },

    // Status Card
    statusCard: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 16,
    },
    statusLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusTitle: { fontSize: 13, fontWeight: '600' },
    statusRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusText: { fontSize: 12, fontWeight: '700' },

    subtitle: { fontSize: 12, lineHeight: 18, marginBottom: 16, textAlign: 'center' },

    docCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: 12, borderRadius: 14, marginBottom: 12, borderWidth: 1,
    },
    docIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    docTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
    docDesc: { fontSize: 11 },

    infoBox: {
        flexDirection: 'row', gap: 8, padding: 12, borderRadius: 12,
        borderWidth: 1, marginTop: 10,
    },
    infoText: { flex: 1, fontSize: 11, lineHeight: 16 },
});

