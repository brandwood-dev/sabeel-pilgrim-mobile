import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useProfileVM } from '@/hooks/profile/useProfileVM';
import { Image } from 'expo-image';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeColors } from '@/hooks/useThemeColors';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

import { useTrans } from '@/hooks/useTrans';

export default function PersonalInfoPage() {
    const { t } = useTrans();
    const GENRES = [t('Inconnu'), t('Homme'), t('Femme')];
    const { user, handleUpdateProfile, handlePickAndUploadImage, isUploading } = useProfileVM();
    const router = useRouter();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

    const PAGE_BG = isDarkMode ? '#111111' : '#F4F5F7';
    const CARD_BG = isDarkMode ? '#1C1C1E' : '#FFFFFF';
    const TEXT = isDarkMode ? '#FFFFFF' : '#111827';
    const TEXT_SEC = isDarkMode ? '#8A8A8E' : '#6B7280';
    const INPUT_BG = isDarkMode ? '#2C2C2E' : '#F9FAFB';
    const BORDER = isDarkMode ? '#3A3A3C' : '#E5E7EB';
    const PRIMARY = colors.primary;

    // Form state — pre-filled from user
    const [prenom, setPrenom] = useState(user?.firstName || '');
    const [nom, setNom] = useState(user?.lastName || '');
    const [genre, setGenre] = useState(user?.gender || 'Inconnu');
    const [nationalite, setNationalite] = useState(user?.nationality || '');
    // Date: null until user explicitly selects one
    const [dateNaissance, setDateNaissance] = useState<Date | null>(
        user?.dateOfBirth ? new Date(user.dateOfBirth) : null
    );
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [adresse, setAdresse] = useState(user?.address || '');
    const [ville, setVille] = useState(user?.city || '');
    const [pays, setPays] = useState(user?.country || '');
    const [telephone, setTelephone] = useState(user?.phoneNumber || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [languages, setLanguages] = useState(user?.languages?.join(', ') || '');
    const [isSaving, setIsSaving] = useState(false);

    // Sync form with user data when it loads
    useEffect(() => {
        if (user) {
            setPrenom(user.firstName || '');
            setNom(user.lastName || '');
            setGenre(user.gender || 'Inconnu');
            setNationalite(user.nationality || '');
            setDateNaissance(user.dateOfBirth ? new Date(user.dateOfBirth) : null);
            setAdresse(user.address || '');
            setVille(user.city || '');
            setPays(user.country || '');
            setTelephone(user.phoneNumber || '');
            setBio(user.bio || '');
            setLanguages(user.languages?.join(', ') || '');
        }
    }, [user]);

    // Genre picker
    const [showGenrePicker, setShowGenrePicker] = useState(false);

    // Countries
    const [allCountries, setAllCountries] = useState<string[]>([]);
    const [countriesLoading, setCountriesLoading] = useState(false);
    const [showPaysPicker, setShowPaysPicker] = useState(false);
    const [countrySearch, setCountrySearch] = useState('');

    // Fetch countries from RestCountries API (names in French)
    useEffect(() => {
        const fetchCountries = async () => {
            setCountriesLoading(true);
            try {
                const res = await fetch('https://restcountries.com/v3.1/all?fields=name,translations');
                const data = await res.json();
                const raw: string[] = data
                    .map((c: any) => c.translations?.fra?.common || c.name?.common || '')
                    .filter(Boolean);
                const names: string[] = [...new Set<string>(raw)]
                    .sort((a, b) => a.localeCompare(b, 'fr'));

                setAllCountries(names);
            } catch {
                // fallback list if API fails
                setAllCountries([
                    'Algérie', 'Maroc', 'Tunisie', 'France', 'Arabie Saoudite',
                    'Égypte', 'Mauritanie', 'Sénégal', 'Turquie', 'Autre',
                ]);
            } finally {
                setCountriesLoading(false);
            }
        };
        fetchCountries();
    }, []);

    const filteredCountries = allCountries.filter(c =>
        c.toLowerCase().includes(countrySearch.toLowerCase())
    );

    const formatDate = (d: Date) =>
        `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;

    const handleClose = () => {
        router.replace('/(umrah_agence)/(screens)/profile/profile' as any);
    };


    const handleSave = async () => {
        setIsSaving(true);
        try {
            const success = await handleUpdateProfile({
                firstName: prenom,
                lastName: nom,
                gender: genre,
                nationality: nationalite,
                dateOfBirth: dateNaissance ? dateNaissance.toISOString() : undefined,
                address: adresse,
                city: ville,
                country: pays,
                phoneNumber: telephone,
            });
            if (success) handleClose();
        } finally {
            setIsSaving(false);
        }
    };



    // Avatar
    const firstName = user?.firstName || 'U';
    const lastName = user?.lastName || '';
    const fallbackAvatar = `https://api.dicebear.com/7.x/initials/png?seed=${firstName}+${lastName}&backgroundColor=2C5F2D&textColor=ffffff`;
    const avatarUri = user?.photo ? user.photo : fallbackAvatar;

    // ────────── sub-components ──────────

    const GenrePickerModal = () => (
        <Modal visible={showGenrePicker} transparent animationType="slide" onRequestClose={() => setShowGenrePicker(false)}>
            <View style={ps.sheetOverlay}>
                <View style={[ps.sheet, { backgroundColor: CARD_BG }]}>
                    <View style={[ps.sheetHandle, { backgroundColor: BORDER }]} />
                    <View style={ps.sheetHeader}>
                        <Text style={[ps.sheetTitle, { color: TEXT }]}>{t('Choisir le genre')}</Text>
                        <TouchableOpacity onPress={() => setShowGenrePicker(false)}>
                            <Ionicons name="close" size={22} color={TEXT_SEC} />
                        </TouchableOpacity>
                    </View>
                    {GENRES.map((item) => (
                        <TouchableOpacity
                            key={item}
                            style={[ps.sheetItem, { borderBottomColor: BORDER }]}
                            onPress={() => { setGenre(item); setShowGenrePicker(false); }}
                        >
                            <Text style={[ps.sheetItemText, { color: item === genre ? PRIMARY : TEXT }]}>{t(item)}</Text>
                            {item === genre && <Ionicons name="checkmark" size={20} color={PRIMARY} />}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </Modal>
    );

    const CountryPickerModal = () => (
        <Modal visible={showPaysPicker} transparent animationType="slide" onRequestClose={() => setShowPaysPicker(false)}>
            <View style={ps.sheetOverlay}>
                <View style={[ps.countrySheet, { backgroundColor: CARD_BG }]}>
                    <View style={[ps.sheetHandle, { backgroundColor: BORDER }]} />
                    <View style={ps.sheetHeader}>
                        <Text style={[ps.sheetTitle, { color: TEXT }]}>{t('Choisir le pays')}</Text>
                        <TouchableOpacity onPress={() => { setShowPaysPicker(false); setCountrySearch(''); }}>
                            <Ionicons name="close" size={22} color={TEXT_SEC} />
                        </TouchableOpacity>
                    </View>
                    {/* Search */}
                    <View style={[ps.countrySearchWrap, { backgroundColor: INPUT_BG, borderColor: BORDER }]}>
                        <Ionicons name="search" size={16} color={TEXT_SEC} style={{ marginRight: 8 }} />
                        <TextInput
                            style={[ps.countrySearchInput, { color: TEXT }]}
                            placeholder={t('Rechercher un pays...')}
                            placeholderTextColor={TEXT_SEC}
                            value={countrySearch}
                            onChangeText={setCountrySearch}
                        />
                    </View>
                    {countriesLoading ? (
                        <ActivityIndicator color={PRIMARY} style={{ marginTop: 20 }} />
                    ) : (
                        <FlatList
                            data={filteredCountries}
                            keyExtractor={(item, index) => `${item}-${index}`}

                            keyboardShouldPersistTaps="handled"
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[ps.sheetItem, { borderBottomColor: BORDER }]}
                                    onPress={() => {
                                        setPays(item);
                                        setShowPaysPicker(false);
                                        setCountrySearch('');
                                    }}
                                >
                                    <Text style={[ps.sheetItemText, { color: item === pays ? PRIMARY : TEXT }]}>{t(item)}</Text>
                                    {item === pays && <Ionicons name="checkmark" size={20} color={PRIMARY} />}
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={[ps.container, { backgroundColor: PAGE_BG }]}>
            {/* ── Header ── */}
            <View style={[ps.header, { backgroundColor: PAGE_BG, borderBottomColor: BORDER }]}>
                <TouchableOpacity onPress={handleClose} style={ps.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Ionicons name="chevron-back" size={26} color={PRIMARY} />
                </TouchableOpacity>
                <Text style={[ps.headerTitle, { color: TEXT }]}>{t('Informations personnelles')}</Text>


                <View style={{ width: 36 }} />
            </View>

            {/* ── Scrollable content ── */}
            <ScrollView
                contentContainerStyle={ps.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Avatar centré avec badge caméra */}
                <View style={ps.avatarSection}>
                    <TouchableOpacity
                        style={ps.avatarWrap}
                        onPress={handlePickAndUploadImage}
                        activeOpacity={0.85}
                    >
                        <Image source={{ uri: user?.photo || `https://ui-avatars.com/api/?name=${prenom || 'User'}&background=2C5F2D&color=fff&size=200&bold=true` }} style={ps.avatarImage} cachePolicy="disk" />
                        <View style={[ps.cameraBadge, { backgroundColor: PRIMARY }]}>
                            {isUploading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={16} color="#fff" />}
                        </View>
                    </TouchableOpacity>
                    <Text style={[ps.identifiantText, { color: TEXT_SEC }]}>{t('ID Sabeel : ')}{user?.uniqueIdentifier || '...'}</Text>
                </View>

                {/* ── Identité ── */}
                <Text style={[ps.section, { color: TEXT_SEC }]}>{t('IDENTITÉ')}</Text>
                <View style={[ps.card, { backgroundColor: CARD_BG }]}>

                    {/* Prénom */}
                    <View style={ps.row}>
                        <Text style={[ps.label, { color: TEXT_SEC }]}>{t('Prénom')}</Text>
                        <TextInput
                            style={[ps.input, { backgroundColor: INPUT_BG, color: TEXT, borderColor: BORDER }]}
                            value={prenom}
                            onChangeText={setPrenom}
                            placeholder={t('Votre prénom')}
                            placeholderTextColor={TEXT_SEC}
                        />
                    </View>
                    <View style={[ps.sep, { backgroundColor: BORDER }]} />

                    {/* Nom */}
                    <View style={ps.row}>
                        <Text style={[ps.label, { color: TEXT_SEC }]}>{t('Nom')}</Text>
                        <TextInput
                            style={[ps.input, { backgroundColor: INPUT_BG, color: TEXT, borderColor: BORDER }]}
                            value={nom}
                            onChangeText={setNom}
                            placeholder={t('Votre nom')}
                            placeholderTextColor={TEXT_SEC}
                        />
                    </View>
                    <View style={[ps.sep, { backgroundColor: BORDER }]} />

                    {/* Genre */}
                    <TouchableOpacity style={ps.row} onPress={() => setShowGenrePicker(true)}>
                        <Text style={[ps.label, { color: TEXT_SEC }]}>{t('Genre')}</Text>
                        <View style={ps.rowRight}>
                            <Text style={[ps.value, { color: genre === 'Inconnu' ? TEXT_SEC : TEXT }]}>{t(genre)}</Text>
                            <Ionicons name="chevron-forward" size={18} color={TEXT_SEC} />
                        </View>
                    </TouchableOpacity>
                    <View style={[ps.sep, { backgroundColor: BORDER }]} />

                    {/* Date de naissance */}
                    <TouchableOpacity style={ps.row} onPress={() => setShowDatePicker(true)}>
                        <Text style={[ps.label, { color: TEXT_SEC }]}>{t('Date de naissance')}</Text>
                        <View style={ps.rowRight}>
                            <Text style={[ps.value, { color: dateNaissance ? TEXT : TEXT_SEC }]}>
                                {dateNaissance ? formatDate(dateNaissance!) : t('Non renseignée')}
                            </Text>
                            <Ionicons name="calendar-outline" size={18} color={PRIMARY} />
                        </View>
                    </TouchableOpacity>
                    <View style={[ps.sep, { backgroundColor: BORDER }]} />

                    {/* Nationalité */}
                    <View style={ps.row}>
                        <Text style={[ps.label, { color: TEXT_SEC }]}>{t('Nationalité')}</Text>
                        <TextInput
                            style={[ps.input, { backgroundColor: INPUT_BG, color: TEXT, borderColor: BORDER }]}
                            value={nationalite}
                            onChangeText={setNationalite}
                            placeholder={t('Votre nationalité')}
                            placeholderTextColor={TEXT_SEC}
                        />
                    </View>
                </View>

                {/* ── Coordonnées ── */}
                <Text style={[ps.section, { color: TEXT_SEC }]}>{t('COORDONNÉES')}</Text>
                <View style={[ps.card, { backgroundColor: CARD_BG }]}>

                    {/* Téléphone */}
                    <View style={ps.row}>
                        <Text style={[ps.label, { color: TEXT_SEC }]}>{t('Téléphone')}</Text>
                        <TextInput
                            style={[ps.input, { backgroundColor: INPUT_BG, color: TEXT, borderColor: BORDER }]}
                            value={telephone}
                            onChangeText={setTelephone}
                            placeholder="+213 ..."
                            placeholderTextColor={TEXT_SEC}
                            keyboardType="phone-pad"
                        />
                    </View>
                    <View style={[ps.sep, { backgroundColor: BORDER }]} />

                    {/* Adresse */}
                    <View style={ps.row}>
                        <Text style={[ps.label, { color: TEXT_SEC }]}>{t('Adresse')}</Text>
                        <TextInput
                            style={[ps.input, { backgroundColor: INPUT_BG, color: TEXT, borderColor: BORDER }]}
                            value={adresse}
                            onChangeText={setAdresse}
                            placeholder={t('Rue, numéro...')}
                            placeholderTextColor={TEXT_SEC}
                        />
                    </View>
                    <View style={[ps.sep, { backgroundColor: BORDER }]} />

                    {/* Ville */}
                    <View style={ps.row}>
                        <Text style={[ps.label, { color: TEXT_SEC }]}>{t('Ville')}</Text>
                        <TextInput
                            style={[ps.input, { backgroundColor: INPUT_BG, color: TEXT, borderColor: BORDER }]}
                            value={ville}
                            onChangeText={setVille}
                            placeholder={t('Votre ville')}
                            placeholderTextColor={TEXT_SEC}
                        />
                    </View>
                    <View style={[ps.sep, { backgroundColor: BORDER }]} />

                    {/* Pays — avec API countries */}
                    <TouchableOpacity style={ps.row} onPress={() => setShowPaysPicker(true)}>
                        <Text style={[ps.label, { color: TEXT_SEC }]}>{t('Pays')}</Text>
                        <View style={ps.rowRight}>
                            {countriesLoading && !pays ? (
                                <ActivityIndicator size="small" color={PRIMARY} style={{ marginRight: 6 }} />
                            ) : (
                                <Text style={[ps.value, { color: pays ? TEXT : TEXT_SEC }]}>
                                    {t(pays) || t('Choisir un pays')}
                                </Text>
                            )}
                            <Ionicons name="chevron-forward" size={18} color={TEXT_SEC} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* ── À propos ── */}
                <Text style={[ps.section, { color: TEXT_SEC }]}>{t('À PROPOS')}</Text>
                <View style={[ps.card, { backgroundColor: CARD_BG }]}>
                    <View style={ps.row}>
                        <Text style={[ps.label, { color: TEXT_SEC }]}>{t('Biographie')}</Text>
                        <TextInput
                            style={[ps.input, { backgroundColor: INPUT_BG, color: TEXT, borderColor: BORDER, height: 80, textAlignVertical: 'top' }]}
                            value={bio}
                            onChangeText={setBio}
                            placeholder={t('Dites-nous en un peu plus sur vous...')}
                            placeholderTextColor={TEXT_SEC}
                            multiline
                        />
                    </View>
                    <View style={[ps.sep, { backgroundColor: BORDER }]} />
                    <View style={ps.row}>
                        <Text style={[ps.label, { color: TEXT_SEC }]}>{t('Langues')}</Text>
                        <TextInput
                            style={[ps.input, { backgroundColor: INPUT_BG, color: TEXT, borderColor: BORDER }]}
                            value={languages}
                            onChangeText={setLanguages}
                            placeholder={t('Français, Arabe, Anglais...')}
                            placeholderTextColor={TEXT_SEC}
                        />
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>


            {/* ── Footer fixe ── */}
            <View style={[ps.footer, { backgroundColor: PAGE_BG, borderTopColor: BORDER }]}>
                <TouchableOpacity
                    style={[ps.saveBtn, { backgroundColor: PRIMARY, opacity: isSaving ? 0.7 : 1 }]}
                    onPress={handleSave}
                    activeOpacity={0.85}
                    disabled={isSaving}
                >
                    {isSaving
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={ps.saveBtnText}>{t('Enregistrer')}</Text>
                    }
                </TouchableOpacity>
            </View>

            {/* Date Picker */}
            {showDatePicker && (
                <DateTimePicker
                    value={dateNaissance || new Date(2000, 0, 1)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={new Date()}
                    onChange={(_, date) => {
                        setShowDatePicker(false);
                        if (date) setDateNaissance(date);
                    }}
                />
            )}

            <GenrePickerModal />
            <CountryPickerModal />
        </SafeAreaView>
    );
}

const ps = StyleSheet.create({
    container: { flex: 1 },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth, paddingTop: -20,
    },
    closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 15, fontWeight: '700', letterSpacing: 0.1 },


    content: { paddingHorizontal: 16, paddingTop: 16 },

    // Avatar
    avatarSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    identifiantText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 10,
    },
    avatarWrap: { position: 'relative' },
    avatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#2C5F2D' },


    cameraBadge: {
        position: 'absolute', bottom: 2, right: 2,
        width: 28, height: 28, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#fff',
    },
    avatarHint: { fontSize: 11, marginTop: 8 },


    // Form
    section: {
        fontSize: 10, fontWeight: '700', letterSpacing: 0.9,

        marginBottom: 8, marginLeft: 4, marginTop: 16,
    },
    card: { borderRadius: 16, overflow: 'hidden', marginBottom: 4 },
    row: {
        paddingHorizontal: 16, paddingVertical: 14,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    label: { fontSize: 13, fontWeight: '500', flex: 1 },

    value: { fontSize: 13, fontWeight: '500', textAlign: 'right' },

    rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    input: {
        flex: 1.5, fontSize: 13, textAlign: 'right',

        paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: 8, borderWidth: 1,
    },
    sep: { height: StyleSheet.hairlineWidth, marginLeft: 16 },

    // Footer
    footer: {
        paddingHorizontal: 16, paddingVertical: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 13, borderRadius: 16,
    },

    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },


    // Bottom sheet
    sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
    countrySheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
    sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
    sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sheetTitle: { fontSize: 16, fontWeight: '700' },

    sheetItem: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
    },
    sheetItemText: { fontSize: 14 },


    // Country search
    countrySearchWrap: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
        marginBottom: 12,
    },
    countrySearchInput: { flex: 1, fontSize: 13 },

});
