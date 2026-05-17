import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeColors } from '@/hooks/useThemeColors';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

export default function AgencyPage() {
    const router = useRouter();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

    const PAGE_BG = isDarkMode ? '#111111' : '#F4F5F7';
    const CARD_BG = isDarkMode ? '#1C1C1E' : '#FFFFFF';
    const TEXT = isDarkMode ? '#FFFFFF' : '#111827';
    const TEXT_SEC = isDarkMode ? '#8A8A8E' : '#6B7280';
    const BORDER = isDarkMode ? '#3A3A3C' : '#E5E7EB';
    const PRIMARY = colors.primary;

    // TODO: load from Redux/API
    const agency: any = null;

    return (
        <SafeAreaView style={[ags.container, { backgroundColor: PAGE_BG }]}>
            {/* Header */}
            <View style={[ags.header, { backgroundColor: PAGE_BG, borderBottomColor: BORDER }]}>
                <TouchableOpacity onPress={() => router.replace('/(umrah_agence)/(screens)/profile/profile' as any)} style={ags.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Ionicons name="chevron-back" size={26} color={PRIMARY} />
                </TouchableOpacity>
                <Text style={[ags.headerTitle, { color: TEXT }]}>Mon agence</Text>

                <View style={{ width: 36 }} />
            </View>

            <View style={ags.content}>
                {!agency ? (
                    <View style={[ags.emptyCard, { backgroundColor: CARD_BG }]}>
                        <View style={[ags.emptyIcon, { backgroundColor: isDarkMode ? '#1a2e1a' : '#F0FDF4' }]}>
                            <Ionicons name="business-outline" size={44} color={PRIMARY} />
                        </View>
                        <Text style={[ags.emptyTitle, { color: TEXT }]}>Aucune agence associée</Text>
                        <Text style={[ags.emptyDesc, { color: TEXT_SEC }]}>
                            Vous n'êtes pas encore associé(e) à une agence de voyage Umrah.{'\n'}
                            Explorez les agences disponibles ou entrez un code d'invitation.
                        </Text>

                        {/* Input code */}
                        <TouchableOpacity style={[ags.primaryBtn, { backgroundColor: PRIMARY }]}>
                            <Ionicons name="enter-outline" size={18} color="#fff" />
                            <Text style={ags.primaryBtnText}>Entrer un code d'invitation</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[ags.outlineBtn, { borderColor: PRIMARY }]}>
                            <Ionicons name="search-outline" size={18} color={PRIMARY} />
                            <Text style={[ags.outlineBtnText, { color: PRIMARY }]}>Explorer les agences</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={[ags.agencyCard, { backgroundColor: CARD_BG }]}>
                        <View style={[ags.agencyIcon, { backgroundColor: PRIMARY + '22' }]}>
                            <Ionicons name="business" size={32} color={PRIMARY} />
                        </View>
                        <Text style={[ags.agencyName, { color: TEXT }]}>{agency.name}</Text>
                        <Text style={[ags.agencySub, { color: TEXT_SEC }]}>{agency.location}</Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const ags = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, paddingTop: -20,
    },
    closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '700' },
    content: { padding: 16 },
    emptyCard: { borderRadius: 20, padding: 36, alignItems: 'center', marginTop: 20 },
    emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
    emptyDesc: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    primaryBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 22, paddingVertical: 13, borderRadius: 14, marginBottom: 10, width: '100%', justifyContent: 'center',
    },
    primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    outlineBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 22, paddingVertical: 13, borderRadius: 14,
        borderWidth: 1.5, width: '100%', justifyContent: 'center',
    },
    outlineBtnText: { fontWeight: '600', fontSize: 14 },
    agencyCard: { borderRadius: 20, padding: 28, alignItems: 'center', marginTop: 20 },
    agencyIcon: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    agencyName: { fontSize: 18, fontWeight: '700' },
    agencySub: { fontSize: 13, marginTop: 4 },
});
