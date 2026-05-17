import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    SafeAreaView,
    I18nManager
} from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { setLanguage } from '@/store/uiSlice';
import { useTrans } from '@/hooks/useTrans';
// Removed expo-updates import to prevent native module crashes

type Lang = 'fr' | 'ar' | 'en';

const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
];

export default function MiniLanguagePage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { t, language } = useTrans();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const PRIMARY = '#2C5F2D';

    const [selected, setSelected] = useState<Lang>(language as Lang);

    const handleSave = async () => {
        dispatch(setLanguage(selected));
        
        const isRTL = selected === 'ar';
        if (I18nManager.isRTL !== isRTL) {
            I18nManager.allowRTL(isRTL);
            I18nManager.forceRTL(isRTL);
            
            Alert.alert(
                t('Succès'),
                t('L\'application doit être redémarrée pour appliquer les changements de direction (RTL). Redémarrer maintenant ?'),
                [
                    { text: t('Plus tard'), onPress: () => router.back() },
                    { 
                        text: t('OK'), 
                        onPress: async () => {
                            Alert.alert(
                                t("Info"), 
                                t("Veuillez redémarrer l'application manuellement pour appliquer les changements de direction (RTL).")
                            );
                            router.back();
                        } 
                    }
                ]
            );
        } else {
            Alert.alert(
                t('Succès'),
                t('Langue mise à jour.'),
                [{ text: 'OK', onPress: () => router.back() }]
            );
        }
    };

    const CARD_BG = isDarkMode ? '#1C1C1E' : '#FFFFFF';
    const TEXT = isDarkMode ? '#FFFFFF' : '#111827';
    const BORDER = isDarkMode ? '#333' : '#E5E7EB';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#000' : '#F8F9FA' }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ transform: [{ scaleX: language === 'ar' ? -1 : 1 }] }}>
                    <Ionicons name="chevron-back" size={24} color={PRIMARY} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: TEXT }]}>{t('Langue')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.centeredContent}>
                <View style={[styles.miniCard, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
                    <Text style={[styles.cardTitle, { color: TEXT }]}>{t('Choisir la langue')}</Text>
                    
                    {LANGUAGES.map((lang, idx) => (
                        <TouchableOpacity 
                            key={lang.code}
                            style={[
                                styles.row,
                                selected === lang.code && { backgroundColor: PRIMARY + '10' },
                                { flexDirection: language === 'ar' ? 'row-reverse' : 'row' }
                            ]}
                            onPress={() => setSelected(lang.code)}
                        >
                            <Text style={[styles.flag, { [language === 'ar' ? 'marginLeft' : 'marginRight']: 12 }]}>{lang.flag}</Text>
                            <Text style={[styles.label, { color: TEXT, fontWeight: selected === lang.code ? '700' : '500', textAlign: language === 'ar' ? 'right' : 'left' }]}>
                                {lang.label}
                            </Text>
                            {selected === lang.code && (
                                <Ionicons name="checkmark-circle" size={18} color={PRIMARY} />
                            )}
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity style={[styles.btn, { backgroundColor: PRIMARY }]} onPress={handleSave}>
                        <Text style={styles.btnText}>{t('Confirmer')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 15,
    },
    title: { fontSize: 18, fontWeight: '700' },
    centeredContent: {
        flex: 1, justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 50,
    },
    miniCard: {
        borderRadius: 24, padding: 20, borderWidth: 1,
        elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 8,
    },
    cardTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
    row: {
        alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8,
    },
    flag: { fontSize: 20 },
    label: { flex: 1, fontSize: 15 },
    btn: {
        marginTop: 15, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
