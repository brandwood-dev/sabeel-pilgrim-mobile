import { useThemeColors } from '@/hooks/useThemeColors';
import { useTrans } from '@/hooks/useTrans';
import { authApi, paymentsApi, reservationApi } from '@/services/api';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Image } from 'expo-image';
import {
    KeyboardAvoidingView,
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
import { useSelector } from 'react-redux';

const ADVANCE_RATE = 0.2;
const APP_COMMISSION_RATE = 0.05;

const getParamValue = (value: string | string[] | undefined) => {
    if (Array.isArray(value)) {
        return typeof value[0] === 'string' ? value[0] : '';
    }
    return typeof value === 'string' ? value : '';
};

const sanitizeRouteParam = (value: string, fallback = '') => {
    if (!value) return fallback;
    const trimmedValue = value.trim();
    if (trimmedValue.length > 500 || /%2B|%2F|data:image|base64/i.test(trimmedValue)) {
        return fallback;
    }
    return trimmedValue;
};

const formatMoney = (value: number) => `${Number(value || 0).toFixed(2)} TND`;

const buildPaymentLabel = (mode: 'online' | 'onsite') =>
    mode === 'online' ? 'Paiement en ligne (Acompte Wallet)' : 'Paiement sur place (Acompte)';

export default function ReservationGuideScreen() {
    const { t } = useTrans();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const user = useSelector((state: RootState) => state.auth.user);
    const router = useRouter();
    const params = useLocalSearchParams();

    const guideId = getParamValue(params.guideId);
    const guideName = sanitizeRouteParam(getParamValue(params.guideName), 'Guide privé');
    const guidePrice = Number(getParamValue(params.guidePrice) || 0);
    const guidePhoto = getParamValue(params.guidePhoto);

    const [form, setForm] = useState({
        fullName: user?.fullName || user?.name || user?.username || '',
        email: user?.email || '',
        phone: user?.phone || '',
        age: user?.age ? String(user.age) : '',
        reservationDate: '',
        passengers: '1',
        days: '1',
        hasDisease: 'no',
        medications: '',
        paymentMode: 'online' as 'online' | 'onsite',
        specialRequests: '',
    });

    useEffect(() => {
        const fetchRealProfile = async () => {
            try {
                const response = await authApi.getProfile();
                const profile = response.data;
                if (profile) {
                    setForm(prev => ({
                        ...prev,
                        fullName: prev.fullName || profile.fullName || ((profile.firstName || '') + ' ' + (profile.lastName || '')).trim() || profile.name || profile.username || '',
                        email: prev.email || profile.email || '',
                        phone: prev.phone || profile.phoneNumber || profile.phone || '',
                        age: prev.age || (profile.age ? String(profile.age) : ''),
                    }));
                }
            } catch (error) {
                console.error('[ReservationGuide] Failed to fetch real profile', error);
                // Fallback to Redux store
                if (user) {
                    setForm(prev => ({
                        ...prev,
                        fullName: prev.fullName || user.fullName || user.name || user.username || '',
                        email: prev.email || user.email || '',
                        phone: prev.phone || user.phone || '',
                        age: prev.age || (user.age ? String(user.age) : ''),
                    }));
                }
            }
        };

        fetchRealProfile();
    }, [user]);

    const pilgrimCount = Math.max(1, Number(form.passengers) || 1);
    const daysCount = Math.max(1, Number(form.days) || 1);
    const totalPrice = useMemo(() => guidePrice * daysCount * pilgrimCount, [guidePrice, daysCount, pilgrimCount]);
    const advanceAmount = useMemo(() => Number((totalPrice * ADVANCE_RATE).toFixed(2)), [totalPrice]);
    const remainingAmount = useMemo(() => Math.max(0, Number((totalPrice - advanceAmount).toFixed(2))), [totalPrice, advanceAmount]);
    const appCommissionAmount = useMemo(() => Number((advanceAmount * APP_COMMISSION_RATE).toFixed(2)), [advanceAmount]);
    const paymentType = buildPaymentLabel(form.paymentMode);
    const hasDisease = form.hasDisease === 'yes';
    const cardShadowColor = isDarkMode ? '#000000' : colors.primary;

    const [submitting, setSubmitting] = useState(false);
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [alreadyReservedModalVisible, setAlreadyReservedModalVisible] = useState(false);
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [successParams, setSuccessParams] = useState<any>(null);
    const [activeAlertModalVisible, setActiveAlertModalVisible] = useState(false);
    const [activeAlertMessage, setActiveAlertMessage] = useState('');
    const [validationModalVisible, setValidationModalVisible] = useState(false);
    const [existingReservations, setExistingReservations] = useState<any[]>([]);
    const [reservationsLoading, setReservationsLoading] = useState(true);

    // Check for existing guide reservations on mount
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await reservationApi.getMyReservations();
                const items = Array.isArray(res?.data) ? res.data : [];
                if (mounted) {
                    setExistingReservations(items);
                }
            } catch (error) {
                console.error('[ReservationGuide] failed to load reservations', error);
            } finally {
                if (mounted) {
                    setReservationsLoading(false);
                }
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const alreadyReservedThisGuide = useMemo(() => {
        if (!guideId) return null;
        return existingReservations.find(
            (r: any) => String(r.guideId || '') === String(guideId) && (r.status === 'pending' || r.status === 'accepted')
        );
    }, [existingReservations, guideId]);

    const hasAnyActiveGuideReservation = useMemo(() => {
        return existingReservations.some(
            (r: any) => String(r.kind || '').toLowerCase() === 'guide' && (r.status === 'pending' || r.status === 'accepted')
        );
    }, [existingReservations]);

    useEffect(() => {
        if (!reservationsLoading) {
            if (alreadyReservedThisGuide) {
                setAlreadyReservedModalVisible(true);
            } else if (hasAnyActiveGuideReservation) {
                setActiveAlertMessage(t('Vous ne pouvez pas réserver plus d\'un guide privé actif à la fois.'));
                setActiveAlertModalVisible(true);
            }
        }
    }, [reservationsLoading, alreadyReservedThisGuide, hasAnyActiveGuideReservation]);

    const handleInputChange = (field: keyof typeof form, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const buildPayload = () => ({
        guideId,
        userName: form.fullName.trim(),
        userEmail: form.email.trim(),
        userPhone: form.phone.trim(),
        userAge: form.age.trim(),
        reservationDate: form.reservationDate.trim(),
        pilgrimCount,
        days: String(daysCount),
        hasDisease: String(hasDisease),
        medications: form.medications.trim(),
        paymentType: form.paymentMode === 'online' ? 'Wallet' : 'Onsite',
        paymentMode: form.paymentMode,
        specialRequests: form.specialRequests.trim(),
    });

    const handleSubmit = async () => {
        if (!form.fullName || !form.phone || !form.age || !form.reservationDate || !form.days) {
            setValidationModalVisible(true);
            return;
        }

        if (alreadyReservedThisGuide) {
            setAlreadyReservedModalVisible(true);
            return;
        }

        if (hasAnyActiveGuideReservation) {
            setActiveAlertMessage(t('Vous avez déjà un guide privé réservé. Vous ne pouvez pas en réserver un autre.'));
            setActiveAlertModalVisible(true);
            return;
        }

        if (form.paymentMode === 'online') {
            setConfirmModalVisible(true);
            return;
        }

        await createReservationAndNavigate();
    };

    const createReservationAndNavigate = async () => {
        try {
            setSubmitting(true);
            const payload = buildPayload();
            const response = await reservationApi.createGuideReservation(payload);
            const reservation = response.data?.reservation;
            const conversation = response.data?.conversation;

            setSuccessParams({
                contactName: reservation?.guideName || guideName,
                conversationId: conversation?.id,
                reservationId: reservation?.id,
                fromReservation: 'true',
                type: 'guide',
            });
            setSuccessModalVisible(true);
        } catch (error: any) {
            const responseData = error?.response?.data;
            const message = responseData?.message || error?.message || t('Impossible d\'envoyer la réservation.');
            setActiveAlertMessage(message);
            setActiveAlertModalVisible(true);
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmAndBook = async () => {
        setConfirmModalVisible(false);
        try {
            setSubmitting(true);
            const payload = buildPayload();
            const response = await reservationApi.createGuideReservation(payload);
            const reservation = response.data?.reservation;
            const conversation = response.data?.conversation;

            if (reservation?.id) {
                try {
                    const advanceCents = Math.floor(advanceAmount * 100);
                    await paymentsApi.walletPay({
                        totalAmountCents: advanceCents,
                        recipientType: 'GUIDE',
                        recipientId: guideId,
                        referenceType: 'reservation',
                        referenceId: String(reservation.id),
                        idempotencyKey: `guide-res-${reservation.id}-${Date.now()}`,
                    });
                } catch (payError: any) {
                    setSubmitting(false);
                    const msg = payError?.response?.data?.message || payError?.message || '';
                    if (msg.toLowerCase().includes('insufficient')) {
                        Alert.alert(
                            t('Solde insuffisant'),
                            t('Votre solde wallet est insuffisant pour cet acompte. Veuillez recharger votre portefeuille.'),
                            [
                                { text: t('Annuler'), style: 'cancel' },
                                {
                                    text: t('Recharger'),
                                    onPress: () => router.push('/(umrah_agence)/(screens)/(carte)/recharge' as any),
                                },
                            ]
                        );
                    } else {
                        Alert.alert(t('Paiement refusé'), msg || t('Impossible de payer cet acompte.'));
                    }
                    return;
                }
            }

            setSuccessParams({
                contactName: reservation?.guideName || guideName,
                conversationId: conversation?.id,
                reservationId: reservation?.id,
                fromReservation: 'true',
                type: 'guide',
            });
            setSuccessModalVisible(true);
        } catch (error: any) {
            const responseData = error?.response?.data;
            const message = responseData?.message || error?.message || t('Impossible d\'envoyer la réservation.');
            setActiveAlertMessage(message);
            setActiveAlertModalVisible(true);
        } finally {
            setSubmitting(false);
        }
    };

    const handleGoToChat = () => {
        setAlreadyReservedModalVisible(false);
        if (alreadyReservedThisGuide) {
            router.replace({
                pathname: '/(umrah_agence)/(screens)/(chat)/chat_pelerin' as any,
                params: {
                    contactName: alreadyReservedThisGuide.guideName || guideName,
                    conversationId: alreadyReservedThisGuide.conversationId,
                    reservationId: alreadyReservedThisGuide.id,
                    fromReservation: 'true',
                    type: 'guide',
                }
            });
        }
    };

    const handleSuccessOk = () => {
        setSuccessModalVisible(false);
        if (successParams) {
            router.replace({
                pathname: '/(umrah_agence)/(screens)/(chat)/chat_pelerin' as any,
                params: successParams,
            });
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { borderBottomColor: colors.divider }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t('Réserver un guide')}</Text>
                <View style={{ width: 32 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Guide Card summary */}
                    <View style={[
                        styles.heroCard,
                        {
                            backgroundColor: colors.surface,
                            borderColor: colors.divider,
                            shadowColor: cardShadowColor,
                        }
                    ]}>
                        <View style={styles.heroBadge}>
                            <Ionicons name="sparkles-outline" size={14} color={colors.primary} />
                            <Text style={[styles.heroBadgeText, { color: colors.primary }]}>{t('Guide privé dédié')}</Text>
                        </View>
                        <Text style={[styles.summaryTitle, { color: colors.text }]}>{guideName}</Text>
                        <Text style={[styles.heroDescription, { color: colors.textSecondary }]}>
                            {t('Engagez votre guide privé et complétez les étapes de réservation ci-dessous.')}
                        </Text>
                        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                        <View style={[styles.heroPriceBox, { backgroundColor: `${colors.primary}12` }]}>
                            <Text style={[styles.heroPriceLabel, { color: colors.textSecondary }]}>{t('Tarif du guide')}</Text>
                            <Text style={[styles.heroPriceValue, { color: colors.primary }]}>{formatMoney(guidePrice)} / jour</Text>
                        </View>
                    </View>

                    {/* Step 1: Coordinates */}
                    <View style={styles.stepSection}>
                        <View style={styles.stepHeader}>
                            <View style={[styles.stepBadge, { backgroundColor: `${colors.primary}15` }]}>
                                <Text style={[styles.stepBadgeText, { color: colors.primary }]}>Étape 1</Text>
                            </View>
                            <View style={styles.stepHeaderText}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Vos coordonnées')}</Text>
                                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                                    {t('Ces informations sont pré-remplies à partir de votre profil.')}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.stepCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('Nom complet *')}</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.divider, color: colors.text }]}
                                    placeholder={t('Nom et prénom')}
                                    placeholderTextColor={colors.textLight}
                                    value={form.fullName}
                                    onChangeText={(val) => handleInputChange('fullName', val)}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('Téléphone *')}</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.divider, color: colors.text }]}
                                    placeholder="Ex: +216 25 123 456"
                                    placeholderTextColor={colors.textLight}
                                    keyboardType="phone-pad"
                                    value={form.phone}
                                    onChangeText={(val) => handleInputChange('phone', val)}
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('Âge *')}</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.background, borderColor: colors.divider, color: colors.text }]}
                                        placeholder="Ex: 40"
                                        placeholderTextColor={colors.textLight}
                                        keyboardType="numeric"
                                        value={form.age}
                                        onChangeText={(val) => handleInputChange('age', val)}
                                    />
                                </View>

                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('Pèlerins *')}</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.background, borderColor: colors.divider, color: colors.text }]}
                                        placeholder="Ex: 1"
                                        placeholderTextColor={colors.textLight}
                                        keyboardType="numeric"
                                        value={form.passengers}
                                        onChangeText={(val) => handleInputChange('passengers', val)}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Step 2: Booking details */}
                    <View style={styles.stepSection}>
                        <View style={styles.stepHeader}>
                            <View style={[styles.stepBadge, { backgroundColor: `${colors.primary}15` }]}>
                                <Text style={[styles.stepBadgeText, { color: colors.primary }]}>Étape 2</Text>
                            </View>
                            <View style={styles.stepHeaderText}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Détails de la réservation')}</Text>
                                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                                    {t('Choisissez votre date d\'arrivée ou de début de l\'Omra.')}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.stepCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1.5 }]}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('Date de réservation *')}</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.background, borderColor: colors.divider, color: colors.text }]}
                                        placeholder="Ex: 2026-06-15"
                                        placeholderTextColor={colors.textLight}
                                        value={form.reservationDate}
                                        onChangeText={(val) => handleInputChange('reservationDate', val)}
                                    />
                                </View>

                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('Nombre de jours *')}</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.background, borderColor: colors.divider, color: colors.text }]}
                                        placeholder="Ex: 5"
                                        placeholderTextColor={colors.textLight}
                                        keyboardType="numeric"
                                        value={form.days}
                                        onChangeText={(val) => handleInputChange('days', val)}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('Demandes spéciales')}</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea, { backgroundColor: colors.background, borderColor: colors.divider, color: colors.text }]}
                                    placeholder={t('Besoins particuliers, fauteuil roulant, etc.')}
                                    placeholderTextColor={colors.textLight}
                                    multiline
                                    numberOfLines={3}
                                    value={form.specialRequests}
                                    onChangeText={(val) => handleInputChange('specialRequests', val)}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Step 3: Medical questions */}
                    <View style={styles.stepSection}>
                        <View style={styles.stepHeader}>
                            <View style={[styles.stepBadge, { backgroundColor: `${colors.primary}15` }]}>
                                <Text style={[styles.stepBadgeText, { color: colors.primary }]}>Étape 3</Text>
                            </View>
                            <View style={styles.stepHeaderText}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('État de santé')}</Text>
                                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                                    {t('Pour adapter l\'assistance pendant les rituels de l\'Omra.')}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.stepCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                            <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 12 }]}>
                                {t('Avez-vous des maladies chroniques ?')}
                            </Text>
                            <View style={styles.optionRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.optionButton,
                                        { borderColor: colors.divider },
                                        form.hasDisease === 'no' && { borderColor: colors.primary, backgroundColor: `${colors.primary}10` },
                                    ]}
                                    onPress={() => handleInputChange('hasDisease', 'no')}
                                >
                                    <Ionicons
                                        name={form.hasDisease === 'no' ? 'radio-button-on' : 'radio-button-off'}
                                        size={20}
                                        color={form.hasDisease === 'no' ? colors.primary : colors.textSecondary}
                                    />
                                    <Text style={[styles.optionText, { color: colors.text }]}>{t('Non')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.optionButton,
                                        { borderColor: colors.divider },
                                        form.hasDisease === 'yes' && { borderColor: colors.primary, backgroundColor: `${colors.primary}10` },
                                    ]}
                                    onPress={() => handleInputChange('hasDisease', 'yes')}
                                >
                                    <Ionicons
                                        name={form.hasDisease === 'yes' ? 'radio-button-on' : 'radio-button-off'}
                                        size={20}
                                        color={form.hasDisease === 'yes' ? colors.primary : colors.textSecondary}
                                    />
                                    <Text style={[styles.optionText, { color: colors.text }]}>{t('Oui')}</Text>
                                </TouchableOpacity>
                            </View>

                            {hasDisease && (
                                <View style={[styles.inputGroup, { marginTop: 16 }]}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('Médicaments ou traitement suivi *')}</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.background, borderColor: colors.divider, color: colors.text }]}
                                        placeholder={t('Spécifiez vos médicaments')}
                                        placeholderTextColor={colors.textLight}
                                        value={form.medications}
                                        onChangeText={(val) => handleInputChange('medications', val)}
                                    />
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Step 4: Payment method selection */}
                    <View style={styles.stepSection}>
                        <View style={styles.stepHeader}>
                            <View style={[styles.stepBadge, { backgroundColor: `${colors.primary}15` }]}>
                                <Text style={[styles.stepBadgeText, { color: colors.primary }]}>Étape 4</Text>
                            </View>
                            <View style={styles.stepHeaderText}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Mode de paiement (Acompte)')}</Text>
                                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                                    {t('Un acompte de 20% est requis pour confirmer votre réservation.')}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.stepCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                            <TouchableOpacity
                                style={[
                                    styles.paymentButton,
                                    { borderColor: colors.divider, backgroundColor: colors.background },
                                    form.paymentMode === 'online' && { borderColor: colors.primary, backgroundColor: `${colors.primary}10` },
                                ]}
                                onPress={() => handleInputChange('paymentMode', 'online')}
                            >
                                <View style={styles.paymentButtonLeft}>
                                    <Ionicons
                                        name={form.paymentMode === 'online' ? 'radio-button-on' : 'radio-button-off'}
                                        size={20}
                                        color={form.paymentMode === 'online' ? colors.primary : colors.textSecondary}
                                    />
                                    <View style={{ marginLeft: 12 }}>
                                        <Text style={[styles.paymentTitle, { color: colors.text }]}>{t('Paiement en ligne via Wallet')}</Text>
                                        <Text style={[styles.paymentDesc, { color: colors.textSecondary }]}>
                                            {t('Payer l\'acompte immédiatement via votre solde.')}
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="card-outline" size={24} color={colors.primary} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.paymentButton,
                                    { borderColor: colors.divider, backgroundColor: colors.background, marginTop: 12 },
                                    form.paymentMode === 'onsite' && { borderColor: colors.primary, backgroundColor: `${colors.primary}10` },
                                ]}
                                onPress={() => handleInputChange('paymentMode', 'onsite')}
                            >
                                <View style={styles.paymentButtonLeft}>
                                    <Ionicons
                                        name={form.paymentMode === 'onsite' ? 'radio-button-on' : 'radio-button-off'}
                                        size={20}
                                        color={form.paymentMode === 'onsite' ? colors.primary : colors.textSecondary}
                                    />
                                    <View style={{ marginLeft: 12 }}>
                                        <Text style={[styles.paymentTitle, { color: colors.text }]}>{t('Paiement sur place')}</Text>
                                        <Text style={[styles.paymentDesc, { color: colors.textSecondary }]}>
                                            {t('Confirmer maintenant et régler l\'acompte au guide.')}
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="cash-outline" size={24} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Booking Price Breakdown */}
                    <View style={[styles.priceCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                        <Text style={[styles.priceCardTitle, { color: colors.text }]}>{t('Détail du prix')}</Text>
                        <View style={[styles.divider, { backgroundColor: colors.divider, marginVertical: 12 }]} />

                        <View style={styles.priceRow}>
                            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>{t('Tarif journalier')}</Text>
                            <Text style={[styles.priceVal, { color: colors.text }]}>{formatMoney(guidePrice)}</Text>
                        </View>

                        <View style={styles.priceRow}>
                            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>{t('Durée de réservation')}</Text>
                            <Text style={[styles.priceVal, { color: colors.text }]}>{daysCount} {t('jours')}</Text>
                        </View>

                        <View style={styles.priceRow}>
                            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>{t('Nombre de pèlerins')}</Text>
                            <Text style={[styles.priceVal, { color: colors.text }]}>{pilgrimCount} {t('personnes')}</Text>
                        </View>

                        <View style={styles.priceRow}>
                            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>{t('Prix total')}</Text>
                            <Text style={[styles.priceVal, { color: colors.text, fontWeight: '700' }]}>{formatMoney(totalPrice)}</Text>
                        </View>

                        <View style={styles.priceRow}>
                            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>{t('Acompte requis (20%)')}</Text>
                            <Text style={[styles.priceVal, { color: colors.primary, fontWeight: '800' }]}>{formatMoney(advanceAmount)}</Text>
                        </View>

                        <View style={styles.priceRow}>
                            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>{t('Montant restant')}</Text>
                            <Text style={[styles.priceVal, { color: colors.text }]}>{formatMoney(remainingAmount)}</Text>
                        </View>
                    </View>

                </ScrollView>

                {/* Stable Fixed Footer */}
                <View style={[styles.fixedFooter, { backgroundColor: colors.surface, borderTopColor: colors.divider }]}>
                    <TouchableOpacity
                        style={[
                            styles.submitBtn,
                            { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }
                        ]}
                        disabled={submitting}
                        onPress={handleSubmit}
                    >
                        <Text style={styles.submitBtnText}>
                            {submitting ? t('Traitement en cours...') : t('Confirmer la réservation')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Confirm payment modal */}
            <Modal
                visible={confirmModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setConfirmModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
                        <TouchableOpacity
                            style={styles.modalCloseBtn}
                            onPress={() => setConfirmModalVisible(false)}
                        >
                            <Ionicons name="close" size={22} color={colors.textSecondary} />
                        </TouchableOpacity>

                        <View style={styles.modalIconWrap}>
                            <View style={[styles.modalIconCircle, { backgroundColor: 'rgba(44, 95, 45, 0.1)' }]}>
                                <Ionicons name="wallet-outline" size={28} color={colors.primary} />
                            </View>
                        </View>

                        <Text style={[styles.modalTitle, { color: colors.text, textAlign: 'center', marginTop: 12 }]}>
                            {t('Confirmer le paiement')}
                        </Text>
                        <Text style={[styles.modalSub, { color: colors.textSecondary, textAlign: 'center', marginTop: 8, marginHorizontal: 20 }]}>
                            {t('Un montant de')} <Text style={{ fontWeight: 'bold', color: colors.text }}>{formatMoney(advanceAmount)}</Text> {t('sera débité de votre portefeuille pour régler l\'acompte.')}
                        </Text>

                        <View style={styles.modalDetailBox}>
                            <View style={styles.modalDetailRow}>
                                <Text style={[styles.modalDetailLabel, { color: colors.textSecondary }]}>{t('Bénéficiaire')}</Text>
                                <Text style={[styles.modalDetailVal, { color: colors.text }]}>{guideName}</Text>
                            </View>
                            <View style={[styles.divider, { backgroundColor: colors.divider, marginVertical: 8 }]} />
                            <View style={styles.modalDetailRow}>
                                <Text style={[styles.modalDetailLabel, { color: colors.textSecondary }]}>{t('Acompte total')}</Text>
                                <Text style={[styles.modalDetailVal, { color: colors.primary, fontWeight: '700' }]}>{formatMoney(advanceAmount)}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.modalCta, { backgroundColor: colors.primary, marginTop: 24, width: '100%' }]}
                            onPress={handleConfirmAndBook}
                        >
                            <Text style={styles.modalCtaText}>
                                {t('Payer et réserver')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Validation Alert Modal */}
            <Modal
                visible={validationModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setValidationModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
                        <TouchableOpacity
                            style={styles.modalCloseBtn}
                            onPress={() => setValidationModalVisible(false)}
                        >
                            <Ionicons name="close" size={22} color={colors.textSecondary} />
                        </TouchableOpacity>

                        <View style={styles.modalIconWrap}>
                            <View style={[styles.modalIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                                <Ionicons name="information-circle" size={28} color="#EF4444" />
                            </View>
                        </View>

                        <Text style={[styles.modalTitle, { color: colors.text, textAlign: 'center', marginTop: 12 }]}>
                            {t('Champs requis')}
                        </Text>
                        <Text style={[styles.modalSub, { color: colors.textSecondary, textAlign: 'center', marginTop: 8, marginHorizontal: 20 }]}>
                            {t('Veuillez remplir votre nom complet, votre numéro de téléphone, votre âge et la date de réservation pour continuer.')}
                        </Text>

                        <TouchableOpacity
                            style={[styles.modalCta, { backgroundColor: colors.primary, marginTop: 24, width: '100%' }]}
                            onPress={() => setValidationModalVisible(false)}
                        >
                            <Text style={styles.modalCtaText}>
                                {t('D\'accord')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Active Reservation Alert Modal */}
            <Modal
                visible={activeAlertModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setActiveAlertModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
                        <TouchableOpacity
                            style={styles.modalCloseBtn}
                            onPress={() => setActiveAlertModalVisible(false)}
                        >
                            <Ionicons name="close" size={22} color={colors.textSecondary} />
                        </TouchableOpacity>

                        <View style={styles.modalIconWrap}>
                            <View style={[styles.modalIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                                <Ionicons name="warning" size={28} color="#F59E0B" />
                            </View>
                        </View>

                        <Text style={[styles.modalTitle, { color: colors.text, textAlign: 'center', marginTop: 12 }]}>
                            {t('Réservation indisponible')}
                        </Text>
                        <Text style={[styles.modalSub, { color: colors.textSecondary, textAlign: 'center', marginTop: 8, marginHorizontal: 20 }]}>
                            {activeAlertMessage || t('Vous ne pouvez pas effectuer cette réservation pour le moment.')}
                        </Text>

                        <TouchableOpacity
                            style={[styles.modalCta, { backgroundColor: colors.primary, marginTop: 24, width: '100%' }]}
                            onPress={() => setActiveAlertModalVisible(false)}
                        >
                            <Text style={styles.modalCtaText}>
                                {t('Compris')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Already Reserved Guide Modal */}
            <Modal
                visible={alreadyReservedModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setAlreadyReservedModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalIconWrap}>
                            <View style={[styles.modalIconCircle, { backgroundColor: 'rgba(44, 95, 45, 0.1)' }]}>
                                <Ionicons name="checkmark-done-circle-outline" size={32} color={colors.primary} />
                            </View>
                        </View>

                        <Text style={[styles.modalTitle, { color: colors.text, textAlign: 'center', marginTop: 12 }]}>
                            {t('Demande déjà envoyée')}
                        </Text>
                        <Text style={[styles.modalSub, { color: colors.textSecondary, textAlign: 'center', marginTop: 8, marginHorizontal: 20 }]}>
                            {t('Vous avez déjà une demande active avec ce guide. Vous pouvez discuter directement via la messagerie.')}
                        </Text>

                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' }}>
                            <TouchableOpacity
                                style={[styles.modalCta, { backgroundColor: colors.border, flex: 1 }]}
                                onPress={() => setAlreadyReservedModalVisible(false)}
                            >
                                <Text style={[styles.modalCtaText, { color: colors.text }]}>
                                    {t('Retour')}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalCta, { backgroundColor: colors.primary, flex: 1.5 }]}
                                onPress={handleGoToChat}
                            >
                                <Text style={styles.modalCtaText}>
                                    {t('Voir le chat')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Success Modal */}
            <Modal
                visible={successModalVisible}
                transparent
                animationType="slide"
                onRequestClose={handleSuccessOk}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalIconWrap}>
                            <View style={[styles.modalIconCircle, { backgroundColor: 'rgba(58, 125, 68, 0.1)' }]}>
                                <Ionicons name="checkmark-circle" size={32} color={colors.primary} />
                            </View>
                        </View>

                        <Text style={[styles.modalTitle, { color: colors.text, textAlign: 'center', marginTop: 12 }]}>
                            {t('Réservation réussie !')}
                        </Text>
                        <Text style={[styles.modalSub, { color: colors.textSecondary, textAlign: 'center', marginTop: 8, marginHorizontal: 20 }]}>
                            {t('Votre demande de réservation a été transmise avec succès au guide.')}
                        </Text>

                        <View style={[styles.infoNotice, { backgroundColor: colors.background, borderColor: colors.divider, marginTop: 20, width: '100%' }]}>
                            <Ionicons name="person-outline" size={16} color={colors.primary} />
                            <Text style={[styles.infoNoticeText, { color: colors.textSecondary, fontSize: 13, marginLeft: 8 }]}>
                                {guideName} — {t('Tarif')}: {formatMoney(guidePrice)}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.modalCta, { backgroundColor: colors.primary, marginTop: 24, width: '100%' }]}
                            onPress={handleSuccessOk}
                        >
                            <Text style={styles.modalCtaText}>
                                {t('OK')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    heroCard: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 20,
        marginVertical: 16,
        elevation: 4,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(44, 95, 45, 0.08)',
        marginBottom: 12,
        gap: 4,
    },
    heroBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    summaryTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 8,
    },
    heroDescription: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 16,
    },
    divider: {
        height: 1,
        width: '100%',
    },
    heroPriceBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 16,
    },
    heroPriceLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    heroPriceValue: {
        fontSize: 16,
        fontWeight: '800',
    },
    stepSection: {
        marginBottom: 24,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        gap: 12,
    },
    stepBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    stepBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    stepHeaderText: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    sectionSubtitle: {
        fontSize: 12,
        marginTop: 2,
        lineHeight: 16,
    },
    stepCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 14,
        fontSize: 14,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    textArea: {
        height: 90,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    optionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    optionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 46,
        borderRadius: 12,
        borderWidth: 1.5,
        gap: 8,
    },
    optionText: {
        fontSize: 14,
        fontWeight: '600',
    },
    paymentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 14,
        borderWidth: 1.5,
    },
    paymentButtonLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    paymentTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    paymentDesc: {
        fontSize: 11,
        marginTop: 2,
    },
    priceCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginBottom: 24,
    },
    priceCardTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    priceLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    priceVal: {
        fontSize: 13,
        fontWeight: '600',
    },
    fixedFooter: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
        borderTopWidth: 1,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    submitBtn: {
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        alignItems: 'center',
        maxHeight: '90%',
    },
    modalCloseBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
    },
    modalIconWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    modalIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    modalSub: {
        fontSize: 13,
        lineHeight: 18,
    },
    modalDetailBox: {
        width: '100%',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 16,
        marginTop: 20,
        backgroundColor: '#F9FAFB',
    },
    modalDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalDetailLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    modalDetailVal: {
        fontSize: 13,
        fontWeight: '600',
    },
    modalCta: {
        height: 50,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCtaText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    infoNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    infoNoticeText: {
        fontWeight: '600',
    },
});
