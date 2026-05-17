import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Modal,
} from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { setLanguage } from '@/store/uiSlice';
import { useTrans } from '@/hooks/useTrans';

type Lang = 'fr' | 'en' | 'ar';

const LANGUAGES: { code: Lang; label: string; native: string; flag: string }[] = [
    { code: 'ar', label: 'Arabe', native: 'العربية', flag: '🇸🇦' },
    { code: 'fr', label: 'Français', native: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'Anglais', native: 'English', flag: '🇬🇧' },
];

export default function LanguagePage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const currentLanguage = useSelector((state: RootState) => state.ui.language);
    const { t, language: hookLanguage } = useTrans();
    const isRTL = hookLanguage === 'ar';

    const PAGE_BG = isDarkMode ? '#111111' : '#F4F5F7';
    const CARD_BG = isDarkMode ? '#1C1C1E' : '#FFFFFF';
    const TEXT = isDarkMode ? '#FFFFFF' : '#111827';
    const TEXT_SEC = isDarkMode ? '#8A8A8E' : '#6B7280';
    const BORDER = isDarkMode ? '#3A3A3C' : '#E5E7EB';
    const PRIMARY = colors.primary;

    const [selected, setSelected] = useState<Lang>(currentLanguage || 'fr');
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSave = () => {
        dispatch(setLanguage(selected));
        setShowSuccess(true);
    };

    return (
        <SafeAreaView style={[lg.container, { backgroundColor: PAGE_BG }]}>
            {/* Header */}
            <View style={[lg.header, { backgroundColor: PAGE_BG, borderBottomColor: BORDER, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity onPress={() => router.back()} style={lg.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Ionicons name={isRTL ? "arrow-forward" : "close"} size={26} color={PRIMARY} />
                </TouchableOpacity>
                <Text style={[lg.headerTitle, { color: TEXT }]}>{t('Langue de l\'application')}</Text>
                <View style={{ width: 36 }} />
            </View>

            <View style={lg.content}>
                <Text style={[lg.subtitle, { color: TEXT_SEC }]}>
                    {t('Sélectionnez votre langue de préférence pour l\'ensemble de l\'application.')}
                </Text>

                <View style={[lg.card, { backgroundColor: CARD_BG, borderColor: BORDER, borderWidth: 1 }]}>
                    {LANGUAGES.map((lang, idx) => (
                        <React.Fragment key={lang.code}>
                            <TouchableOpacity
                                style={[
                                    lg.langRow,
                                    selected === lang.code && { backgroundColor: PRIMARY + '0F' },
                                    { flexDirection: isRTL ? 'row-reverse' : 'row' }
                                ]}
                                onPress={() => setSelected(lang.code)}
                                activeOpacity={0.75}
                            >
                                <Text style={lg.flag}>{lang.flag}</Text>
                                <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                                    <Text style={[lg.langLabel, { color: TEXT }]}>{lang.native}</Text>
                                </View>
                                {selected === lang.code && (
                                    <Ionicons name="checkmark-circle" size={22} color={PRIMARY} />
                                )}
                            </TouchableOpacity>
                            {idx < LANGUAGES.length - 1 && (
                                <View style={[lg.sep, { backgroundColor: BORDER }]} />
                            )}
                        </React.Fragment>
                    ))}
                </View>

                <TouchableOpacity style={[lg.saveBtn, { backgroundColor: PRIMARY }]} onPress={handleSave}>
                    <Text style={lg.saveBtnText}>{t('Appliquer le changement')}</Text>
                </TouchableOpacity>
            </View>

            {/* Success Modal */}
            <Modal visible={showSuccess} transparent animationType="slide" onRequestClose={() => setShowSuccess(false)}>
                <TouchableOpacity style={lg.sheetOverlay} activeOpacity={1} onPress={() => { setShowSuccess(false); router.back(); }}>
                    <View style={[lg.actionSheet, { backgroundColor: CARD_BG }]}>
                        <View style={[lg.sheetHandle, { backgroundColor: BORDER }]} />
                        
                        <View style={[lg.sheetIconWrap, { backgroundColor: PRIMARY + '15' }]}>
                            <Ionicons name="language-outline" size={32} color={PRIMARY} />
                        </View>
                        
                        <Text style={[lg.sheetTitle, { color: TEXT }]}>
                            {t('Langue modifiée')}
                        </Text>
                        <Text style={[lg.sheetDesc, { color: TEXT_SEC }]}>
                            {t('Les menus et les données seront désormais affichés dans la langue choisie.')}
                        </Text>

                        <TouchableOpacity 
                            style={[lg.sheetBtn, { backgroundColor: PRIMARY }]} 
                            onPress={() => { setShowSuccess(false); router.back(); }}
                        >
                            <Text style={lg.sheetBtnText}>{t('Continuer')}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const lg = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth,
    },
    closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '700' },
    content: { padding: 20 },
    subtitle: { textAlign: 'center', fontSize: 13, color: '#6B7280', marginBottom: 20 },
    card: { borderRadius: 12, overflow: 'hidden', marginBottom: 24 },
    langRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 14,
    },
    flag: { fontSize: 24 },
    langLabel: { fontSize: 15, fontWeight: '600' },
    sep: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
    saveBtn: {
        alignItems: 'center', justifyContent: 'center',
        paddingVertical: 14, borderRadius: 12,
    },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    actionSheet: {
        borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, alignItems: 'center',
        paddingBottom: 40,
    },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, marginBottom: 20 },
    sheetIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    sheetTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
    sheetDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 20 },
    sheetBtn: { width: '100%', paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
    sheetBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
