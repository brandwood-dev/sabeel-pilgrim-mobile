import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function DocumentStatusPage() {
    const router = useRouter();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

    const PAGE_BG = isDarkMode ? '#111111' : '#F4F5F7';
    const CARD_BG = isDarkMode ? '#1C1C1E' : '#FFFFFF';
    const TEXT = isDarkMode ? '#FFFFFF' : '#111827';
    const TEXT_SEC = isDarkMode ? '#8A8A8E' : '#6B7280';
    const BORDER = isDarkMode ? '#3A3A3C' : '#E5E7EB';
    const PRIMARY = colors.primary;

    // Simulation logic (to be linked to real state)
    const docs = [
        { id: 1, name: 'Passeport', status: 'pending', icon: 'book' },
        { id: 2, name: 'Carte d\'identité (Recto)', status: 'missing', icon: 'card' },
        { id: 3, name: 'Carte d\'identité (Verso)', status: 'missing', icon: 'card' },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: PAGE_BG }]}>
            <View style={[styles.header, { borderBottomColor: BORDER }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={PRIMARY} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: TEXT }]}>État des documents</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.summaryCard, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryVal, { color: PRIMARY }]}>1</Text>
                        <Text style={[styles.summaryLabel, { color: TEXT_SEC }]}>Uploadés</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: BORDER }]} />
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryVal, { color: '#F59E0B' }]}>2</Text>
                        <Text style={[styles.summaryLabel, { color: TEXT_SEC }]}>Restants</Text>
                    </View>
                </View>

                {docs.map((doc) => (
                    <View key={doc.id} style={[styles.docItem, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
                        <View style={[styles.docIcon, { backgroundColor: isDarkMode ? '#242424' : '#F9FAFB' }]}>
                            <Ionicons name={doc.icon as any} size={20} color={doc.status === 'missing' ? TEXT_SEC : PRIMARY} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.docName, { color: TEXT }]}>{doc.name}</Text>
                            <Text style={[styles.docStatusLabel, { color: doc.status === 'missing' ? '#EF4444' : '#10B981' }]}>
                                {doc.status === 'missing' ? 'Non fourni' : 'En attente de vérification'}
                            </Text>
                        </View>
                        {doc.status === 'missing' ? (
                            <TouchableOpacity onPress={() => router.back()} style={[styles.addBtn, { borderColor: PRIMARY }]}>
                                <Text style={[styles.addBtnText, { color: PRIMARY }]}>Ajouter</Text>
                            </TouchableOpacity>
                        ) : (
                            <Ionicons name="time-outline" size={20} color="#F59E0B" />
                        )}
                    </View>
                ))}

                <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#1a221a' : '#F0FDF4' }]}>
                    <Ionicons name="information-circle-outline" size={18} color={PRIMARY} />
                    <Text style={[styles.infoText, { color: TEXT_SEC }]}>
                        Nous analysons vos documents. Si un document est rejeté, vous recevrez une notification.
                    </Text>
                </View>
            </ScrollView>
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
    content: { padding: 16 },
    
    summaryCard: { 
        flexDirection: 'row', padding: 20, borderRadius: 16, borderWidth: 1, 
        marginBottom: 24, justifyContent: 'space-around', alignItems: 'center' 
    },
    summaryItem: { alignItems: 'center' },
    summaryVal: { fontSize: 24, fontWeight: '800' },
    summaryLabel: { fontSize: 11, fontWeight: '600', marginTop: 4 },
    divider: { width: 1, height: 40 },

    docItem: {
        flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
        borderRadius: 14, borderWidth: 1, marginBottom: 12,
    },
    docIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    docName: { fontSize: 14, fontWeight: '700' },
    docStatusLabel: { fontSize: 12, fontWeight: '500', marginTop: 2 },
    addBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
    addBtnText: { fontSize: 12, fontWeight: '600' },

    infoBox: { flexDirection: 'row', gap: 10, padding: 16, borderRadius: 12, marginTop: 12 },
    infoText: { flex: 1, fontSize: 11, lineHeight: 18 },
});
