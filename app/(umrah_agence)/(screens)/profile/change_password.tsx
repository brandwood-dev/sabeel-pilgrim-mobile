import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useTrans } from '@/hooks/useTrans';

function PasswordField({
    label, value, onChangeText, show, onToggle, placeholder, isDarkMode, TEXT, TEXT_SEC, BORDER
}: { label: string; value: string; onChangeText: (t: string) => void; show: boolean; onToggle: () => void; placeholder: string; isDarkMode: boolean; TEXT: string; TEXT_SEC: string; BORDER: string }) {
    return (
        <View style={cpw.fieldWrap}>
            <Text style={[cpw.label, { color: TEXT_SEC }]}>{label}</Text>
            <View style={[cpw.inputWrap, { backgroundColor: isDarkMode ? '#2C2C2E' : '#F9FAFB', borderColor: BORDER }]}>
                <TextInput
                    style={[cpw.input, { color: TEXT }]}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={!show}
                    placeholder={placeholder}
                    placeholderTextColor={TEXT_SEC}
                    autoCapitalize="none"
                />
                <TouchableOpacity onPress={onToggle} style={cpw.eyeBtn}>
                    <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={TEXT_SEC} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default function ChangePasswordPage() {
    const router = useRouter();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const { t } = useTrans();

    const PAGE_BG = isDarkMode ? '#111111' : '#F4F5F7';
    const CARD_BG = isDarkMode ? '#1C1C1E' : '#FFFFFF';
    const TEXT = isDarkMode ? '#FFFFFF' : '#111827';
    const TEXT_SEC = isDarkMode ? '#8A8A8E' : '#6B7280';
    const BORDER = isDarkMode ? '#3A3A3C' : '#E5E7EB';
    const PRIMARY = colors.primary;

    const [current, setCurrent] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const strength = newPwd.length === 0 ? 0 : newPwd.length < 6 ? 1 : newPwd.length < 10 ? 2 : 3;
    const strengthColor = ['#ccc', '#EF4444', '#F59E0B', '#22C55E'][strength];
    const strengthLabel = ['', t('Faible'), t('Moyen'), t('Fort')][strength];

    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!current || !newPwd || !confirm) {
            Alert.alert(t('Erreur'), t('Veuillez remplir tous les champs.'));
            return;
        }
        if (newPwd !== confirm) {
            Alert.alert(t('Erreur'), t('Les mots de passe ne correspondent pas.'));
            return;
        }
        if (newPwd.length < 8) {
            Alert.alert(t('Erreur'), t('Le mot de passe doit contenir au moins 8 caractères.'));
            return;
        }

        setLoading(true);
        try {
            const { authApi } = await import('@/services/api');
            await authApi.updatePassword({
                currentPassword: current,
                newPassword: newPwd,
                confirmPassword: confirm,
            });

            Alert.alert(t('Succès'), t('Mot de passe modifié avec succès.'), [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            const msg = error.response?.data?.message || t('Une erreur est survenue');
            Alert.alert(t('Erreur'), msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[cpw.container, { backgroundColor: PAGE_BG }]}>
            {/* Header */}
            <View style={[cpw.header, { backgroundColor: PAGE_BG, borderBottomColor: BORDER }]}>
                <TouchableOpacity onPress={() => router.back()} style={cpw.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Ionicons name="close" size={26} color={PRIMARY} />
                </TouchableOpacity>
                <Text style={[cpw.headerTitle, { color: TEXT }]}>{t('Changer le mot de passe')}</Text>
                <View style={{ width: 36 }} />
            </View>

            <View style={cpw.content}>
                {/* Lock icon */}
                <View style={[cpw.iconWrap, { backgroundColor: isDarkMode ? '#1a2e1a' : '#F0FDF4' }]}>
                    <Ionicons name="lock-closed" size={32} color={PRIMARY} />
                </View>
                <Text style={[cpw.subtitle, { color: TEXT_SEC }]}>
                    {t("Choisissez un mot de passe fort d'au moins 8 caractères.")}
                </Text>

                <View style={[cpw.card, { backgroundColor: CARD_BG }]}>
                    <PasswordField
                        label={t("Mot de passe actuel")}
                        value={current}
                        onChangeText={setCurrent}
                        show={showCurrent}
                        onToggle={() => setShowCurrent(!showCurrent)}
                        placeholder="••••••••"
                        isDarkMode={isDarkMode}
                        TEXT={TEXT}
                        TEXT_SEC={TEXT_SEC}
                        BORDER={BORDER}
                    />
                    <View style={[cpw.divider, { backgroundColor: BORDER }]} />
                    <PasswordField
                        label={t("Nouveau mot de passe")}
                        value={newPwd}
                        onChangeText={setNewPwd}
                        show={showNew}
                        onToggle={() => setShowNew(!showNew)}
                        placeholder="••••••••"
                        isDarkMode={isDarkMode}
                        TEXT={TEXT}
                        TEXT_SEC={TEXT_SEC}
                        BORDER={BORDER}
                    />

                    {/* Strength bar */}
                    {newPwd.length > 0 && (
                        <View style={cpw.strengthWrap}>
                            <View style={cpw.strengthBars}>
                                {[1, 2, 3].map(i => (
                                    <View
                                        key={i}
                                        style={[cpw.strengthBar, { backgroundColor: strength >= i ? strengthColor : BORDER }]}
                                    />
                                ))}
                            </View>
                            <Text style={[cpw.strengthLabel, { color: strengthColor }]}>{strengthLabel}</Text>
                        </View>
                    )}

                    <View style={[cpw.divider, { backgroundColor: BORDER }]} />
                    <PasswordField
                        label={t("Confirmer le mot de passe")}
                        value={confirm}
                        onChangeText={setConfirm}
                        show={showConfirm}
                        onToggle={() => setShowConfirm(!showConfirm)}
                        placeholder="••••••••"
                        isDarkMode={isDarkMode}
                        TEXT={TEXT}
                        TEXT_SEC={TEXT_SEC}
                        BORDER={BORDER}
                    />

                    {/* Match indicator */}
                    {confirm.length > 0 && (
                        <View style={cpw.matchRow}>
                            <Ionicons
                                name={newPwd === confirm ? 'checkmark-circle' : 'close-circle'}
                                size={16}
                                color={newPwd === confirm ? '#22C55E' : '#EF4444'}
                            />
                            <Text style={[cpw.matchText, { color: newPwd === confirm ? '#22C55E' : '#EF4444' }]}>
                                {newPwd === confirm ? t('Les mots de passe correspondent') : t('Les mots de passe ne correspondent pas')}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Rules */}
                <View style={[cpw.rulesCard, { backgroundColor: CARD_BG }]}>
                    {[
                        t('Au moins 8 caractères'),
                        t('Une lettre majuscule'),
                        t('Un chiffre'),
                        t('Un caractère spécial (recommandé)'),
                    ].map((rule, i) => (
                        <View key={i} style={cpw.ruleRow}>
                            <Ionicons name="ellipse" size={6} color={TEXT_SEC} />
                            <Text style={[cpw.ruleText, { color: TEXT_SEC }]}>{rule}</Text>
                        </View>
                    ))}
                </View>

                <TouchableOpacity 
                    style={[cpw.saveBtn, { backgroundColor: PRIMARY, opacity: loading ? 0.7 : 1 }]} 
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <Text style={cpw.saveBtnText}>{t('Modification en cours...')}</Text>
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            <Text style={cpw.saveBtnText}>{t('Enregistrer le mot de passe')}</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const cpw = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
    },
    closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '700' },
    content: { padding: 16 },
    iconWrap: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 16, marginBottom: 12 },
    subtitle: { textAlign: 'center', fontSize: 13, lineHeight: 20, marginBottom: 20 },
    card: { borderRadius: 16, overflow: 'hidden', marginBottom: 14 },
    fieldWrap: { padding: 14 },
    label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
    inputWrap: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 12, borderWidth: 1, paddingHorizontal: 12,
    },
    input: { flex: 1, fontSize: 15, paddingVertical: 12 },
    eyeBtn: { padding: 4 },
    divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
    strengthWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 12 },
    strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
    strengthBar: { flex: 1, height: 4, borderRadius: 2 },
    strengthLabel: { fontSize: 12, fontWeight: '600' },
    matchRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingBottom: 12 },
    matchText: { fontSize: 12 },
    rulesCard: { borderRadius: 14, padding: 14, marginBottom: 20, gap: 8 },
    ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    ruleText: { fontSize: 13 },
    saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 15, borderRadius: 16,
    },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
