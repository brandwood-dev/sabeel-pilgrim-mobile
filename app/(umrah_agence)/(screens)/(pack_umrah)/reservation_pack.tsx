import { useThemeColors } from '@/hooks/useThemeColors';
import { reservationApi } from '@/services/api';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image } from 'expo-image';
import {
    Alert,
    KeyboardAvoidingView,
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
    if (!value) {
        return fallback;
    }

    const trimmedValue = value.trim();
    const looksSuspiciouslyLong = trimmedValue.length > 500;
    const looksEncoded = /%2B|%2F|data:image|base64/i.test(trimmedValue);

    if (looksSuspiciouslyLong || looksEncoded) {
        console.warn('[ReservationPack] ignored suspicious route param', {
            preview: trimmedValue.slice(0, 80),
            length: trimmedValue.length,
            looksSuspiciouslyLong,
            looksEncoded,
        });
        return fallback;
    }

    return trimmedValue;
};

const sanitizeOptionalMediaParam = (value: string) => {
    if (!value) {
        return '';
    }

    const trimmedValue = value.trim();
    if (/^https?:\/\//i.test(trimmedValue) && trimmedValue.length <= 1000) {
        return trimmedValue;
    }

    console.warn('[ReservationPack] ignored chat media param', {
        preview: trimmedValue.slice(0, 80),
        length: trimmedValue.length,
    });
    return '';
};

const formatMoney = (value: number) => `${Number(value || 0).toFixed(2)} DT`;

const buildPaymentLabel = (mode: 'online' | 'onsite') =>
    mode === 'online' ? 'Paiement en ligne (Acompte)' : 'Paiement sur place (Acompte)';

export default function ReservationPackScreen() {
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const router = useRouter();
    const params = useLocalSearchParams();
    const id = getParamValue(params.id);
    const agencyId = getParamValue(params.agencyId);
    const title = sanitizeRouteParam(getParamValue(params.title), 'Pack Umrah');
    const agencyName = sanitizeRouteParam(getParamValue(params.agencyName), 'Agence partenaire');
    const date = sanitizeRouteParam(getParamValue(params.date), 'Dates à confirmer');
    const unitPrice = Number(getParamValue(params.price) || 0);

    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        age: '',
        passengers: '1',
        hasDisease: 'no',
        medications: '',
        paymentMode: 'online' as 'online' | 'onsite',
        specialRequests: '',
    });

    const pilgrimCount = Math.max(1, Number(form.passengers) || 1);
    const totalPrice = useMemo(() => unitPrice * pilgrimCount, [unitPrice, pilgrimCount]);
    const advanceAmount = useMemo(() => Number((totalPrice * ADVANCE_RATE).toFixed(2)), [totalPrice]);
    const remainingAmount = useMemo(() => Math.max(0, Number((totalPrice - advanceAmount).toFixed(2))), [totalPrice, advanceAmount]);
    const appCommissionAmount = useMemo(() => Number((advanceAmount * APP_COMMISSION_RATE).toFixed(2)), [advanceAmount]);
    const paymentType = buildPaymentLabel(form.paymentMode);
    const hasDisease = form.hasDisease === 'yes';
    const cardShadowColor = isDarkMode ? '#000000' : colors.primary;
    const [submitting, setSubmitting] = useState(false);

    console.log('[ReservationPack] render', {
        id,
        agencyId,
        title,
        agencyName,
        date,
        unitPrice,
        pilgrimCount,
        totalPrice,
    });

    const handleInputChange = (field: string, value: string) => {
        setForm({ ...form, [field]: value });
    };

    const handleSubmit = async () => {
        console.log('[ReservationPack] submit pressed', {
            form,
            id,
            agencyId,
            title,
            unitPrice,
            pilgrimCount,
            paymentType,
        });

        if (!form.fullName || !form.phone || !form.age) {
            console.log('[ReservationPack] validation failed', {
                fullName: form.fullName,
                phone: form.phone,
                age: form.age,
            });
            alert('Veuillez remplir le nom, le téléphone et l\'âge.');
            return;
        }

        try {
            setSubmitting(true);

            const payload = {
                packId: id,
                agencyId,
                reservationDate: date,
                userName: form.fullName,
                userEmail: form.email,
                userPhone: form.phone,
                userAge: form.age,
                pilgrimCount: pilgrimCount,
                hasDisease: hasDisease ? 'true' : 'false',
                medications: form.medications,
                specialRequests: form.specialRequests,
                paymentType,
                paymentMode: form.paymentMode,
                unitPrice: unitPrice.toFixed(2),
                totalPrice: totalPrice.toFixed(2),
                advanceAmount: advanceAmount.toFixed(2),
                remainingAmount: remainingAmount.toFixed(2),
                appCommissionAmount: appCommissionAmount.toFixed(2),
                appCommissionRate: String(APP_COMMISSION_RATE * 100),
            };

            console.log('[ReservationPack] createReservation payload', payload);

            const response = await reservationApi.createReservation(payload);

            const reservation = response.data?.reservation;
            const conversation = response.data?.conversation;
            const chatParams = {
                contactName: reservation?.agencyName || agencyName,
                conversationId: conversation?.id,
                reservationId: reservation?.id,
                fromReservation: 'true',
                // On ne passe aucune donnée de formulaire ou d'image ici pour éviter les crashs
            };

            setSubmitting(false);

            router.replace({
                pathname: '/(umrah_agence)/(screens)/(chat)/chat_pelerin' as any,
                params: chatParams
            });
        } catch (error: any) {
            console.error('[ReservationPack] createReservation failed', {
                message: error?.message,
                responseData: error?.response?.data,
                stack: error?.stack,
            });
            Alert.alert(
                'Réservation indisponible',
                error?.response?.data?.message || error?.message || 'Impossible d\'envoyer la réservation pour le moment.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Confirmation de Réservation</Text>
                <View style={{ width: 32 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.contentWrapper}>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
                                <Text style={[styles.heroBadgeText, { color: colors.primary }]}>Réservation guidée</Text>
                            </View>
                            <Text style={[styles.summaryTitle, { color: colors.text }]}>{title}</Text>
                            <Text style={[styles.heroDescription, { color: colors.textSecondary }]}>Complétez les étapes ci-dessous pour envoyer un dossier clair à l'agence et recevoir une réponse plus rapide.</Text>
                            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                            <View style={styles.heroMetaRow}>
                                <View style={styles.heroMetaItem}>
                                    <Ionicons name="business-outline" size={16} color={colors.primary} />
                                    <Text style={[styles.heroMetaText, { color: colors.text }]}>{agencyName}</Text>
                                </View>
                                <View style={styles.heroMetaItem}>
                                    <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                                    <Text style={[styles.heroMetaText, { color: colors.text }]}>{date}</Text>
                                </View>
                            </View>
                            <View style={[styles.heroPriceBox, { backgroundColor: `${colors.primary}12` }]}>
                                <Text style={[styles.heroPriceLabel, { color: colors.textSecondary }]}>Prix par pèlerin</Text>
                                <Text style={[styles.heroPriceValue, { color: colors.primary }]}>{formatMoney(unitPrice)}</Text>
                            </View>
                        </View>

                        <View style={styles.stepSection}>
                            <View style={styles.stepHeader}>
                                <View style={[styles.stepBadge, { backgroundColor: `${colors.primary}15` }]}>
                                    <Text style={[styles.stepBadgeText, { color: colors.primary }]}>Étape 1</Text>
                                </View>
                                <View style={styles.stepHeaderText}>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Vos coordonnées</Text>
                                    <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Ces informations permettent à l'agence de vous contacter rapidement pour confirmer la réservation.</Text>
                                </View>
                            </View>

                            <View style={[styles.stepCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>Nom complet du responsable *</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.background, borderColor: colors.divider, color: colors.text }]}
                                        placeholder="Entrez votre nom et prénom"
                                        placeholderTextColor={colors.textLight}
                                        value={form.fullName}
                                        onChangeText={(val) => handleInputChange('fullName', val)}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>Téléphone *</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.background, borderColor: colors.divider, color: colors.text }]}
                                        placeholder="Ex: +216 25 123 456"
                                        placeholderTextColor={colors.textLight}
                                        keyboardType="phone-pad"
                                        value={form.phone}
                                        onChangeText={(val) => handleInputChange('phone', val)}
                                    />
                                    <Text style={[styles.helperText, { color: colors.textLight }]}>Numéro utilisé par l'agence pour vous rappeler ou confirmer votre dossier.</Text>
                                </View>

                                <View style={[styles.inputGroup, styles.inputGroupLast]}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.background, borderColor: colors.divider, color: colors.text }]}
                                        placeholder="Ex: mail@exemple.com"
                                        placeholderTextColor={colors.textLight}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        value={form.email}
                                        onChangeText={(val) => handleInputChange('email', val)}
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.stepSection}>
                            <View style={styles.stepHeader}>
                                <View style={[styles.stepBadge, { backgroundColor: `${colors.primary}15` }]}>
                                    <Text style={[styles.stepBadgeText, { color: colors.primary }]}>Étape 2</Text>
                                </View>
                                <View style={styles.stepHeaderText}>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Informations du voyage</Text>
                                    <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Ajoutez les détails essentiels pour aider l'agence à préparer le séjour dans de bonnes conditions.</Text>
                                </View>
                            </View>

                            <View style={[styles.stepCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>Âge *</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.background, borderColor: colors.divider, color: colors.text }]}
                                        placeholder="Ex: 45"
                                        placeholderTextColor={colors.textLight}
                                        keyboardType="numeric"
                                        value={form.age}
                                        onChangeText={(val) => handleInputChange('age', val)}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>Nombre de pèlerins</Text>
                                    <Text style={[styles.helperText, { color: colors.textLight }]}>Indiquez le nombre total de personnes à inscrire dans cette demande.</Text>
                                    <View style={[styles.passengersContainer, { backgroundColor: colors.background, borderColor: colors.divider }]}>
                                        <TouchableOpacity
                                            style={[styles.countButton, { backgroundColor: colors.surface, borderColor: colors.divider }]}
                                            onPress={() => handleInputChange('passengers', Math.max(1, parseInt(form.passengers) - 1).toString())}
                                        >
                                            <Ionicons name="remove" size={20} color={colors.primary} />
                                        </TouchableOpacity>
                                        <View style={styles.passengerCountBox}>
                                            <Text style={[styles.passengersCount, { color: colors.text }]}>{form.passengers}</Text>
                                            <Text style={[styles.passengerCountLabel, { color: colors.textSecondary }]}>pèlerin(s)</Text>
                                        </View>
                                        <TouchableOpacity
                                            style={[styles.countButton, { backgroundColor: colors.surface, borderColor: colors.divider }]}
                                            onPress={() => handleInputChange('passengers', (parseInt(form.passengers) + 1).toString())}
                                        >
                                            <Ionicons name="add" size={20} color={colors.primary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>État de santé</Text>
                                    <Text style={[styles.helperText, { color: colors.textLight }]}>Partagez seulement les informations utiles pour l'accompagnement pendant le voyage.</Text>
                                    <View style={styles.optionsRow}>
                                        <TouchableOpacity
                                            style={[
                                                styles.optionChip,
                                                { borderColor: colors.divider, backgroundColor: colors.background },
                                                form.hasDisease === 'no' && { borderColor: colors.primary, backgroundColor: `${colors.primary}15` }
                                            ]}
                                            onPress={() => handleInputChange('hasDisease', 'no')}
                                        >
                                            <Text style={[styles.optionChipText, { color: form.hasDisease === 'no' ? colors.primary : colors.textSecondary }]}>Bonne santé</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.optionChip,
                                                { borderColor: colors.divider, backgroundColor: colors.background },
                                                form.hasDisease === 'yes' && { borderColor: colors.primary, backgroundColor: `${colors.primary}15` }
                                            ]}
                                            onPress={() => handleInputChange('hasDisease', 'yes')}
                                        >
                                            <Text style={[styles.optionChipText, { color: form.hasDisease === 'yes' ? colors.primary : colors.textSecondary }]}>Maladie signalée</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>Médicaments / besoins médicaux</Text>
                                    <TextInput
                                        style={[styles.input, styles.textArea, { backgroundColor: colors.background, borderColor: colors.divider, color: colors.text }]}
                                        placeholder="Ex: Insuline, fauteuil roulant, diabète..."
                                        placeholderTextColor={colors.textLight}
                                        multiline
                                        numberOfLines={3}
                                        value={form.medications}
                                        onChangeText={(val) => handleInputChange('medications', val)}
                                    />
                                    <Text style={[styles.helperText, { color: colors.textLight }]}>Ces détails aident l'agence à prévoir l'assistance nécessaire.</Text>
                                </View>

                                <View style={[styles.inputGroup, styles.inputGroupLast]}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>Demandes spécifiques</Text>
                                    <TextInput
                                        style={[styles.input, styles.textArea, { backgroundColor: colors.background, borderColor: colors.divider, color: colors.text }]}
                                        placeholder="Repas, hébergement, assistance ou autre précision utile"
                                        placeholderTextColor={colors.textLight}
                                        multiline
                                        numberOfLines={3}
                                        value={form.specialRequests}
                                        onChangeText={(val) => handleInputChange('specialRequests', val)}
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.stepSection}>
                            <View style={styles.stepHeader}>
                                <View style={[styles.stepBadge, { backgroundColor: `${colors.primary}15` }]}>
                                    <Text style={[styles.stepBadgeText, { color: colors.primary }]}>Étape 3</Text>
                                </View>
                                <View style={styles.stepHeaderText}>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Mode de paiement</Text>
                                    <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Choisissez la façon la plus simple pour verser votre acompte et réserver votre place.</Text>
                                </View>
                            </View>

                            <View style={styles.optionsRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.paymentCard,
                                        { borderColor: colors.divider, backgroundColor: colors.surface },
                                        form.paymentMode === 'online' && { borderColor: colors.primary, backgroundColor: `${colors.primary}12` }
                                    ]}
                                    onPress={() => handleInputChange('paymentMode', 'online')}
                                >
                                    <View style={[styles.paymentIconWrap, { backgroundColor: `${colors.primary}15` }]}>
                                        <Ionicons name="card-outline" size={20} color={colors.primary} />
                                    </View>
                                    <Text style={[styles.paymentTitle, { color: colors.text }]}>Paiement en ligne</Text>
                                    <Text style={[styles.paymentSubtitle, { color: colors.textSecondary }]}>Vous réglez l'acompte dès maintenant pour accélérer la validation.</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.paymentCard,
                                        { borderColor: colors.divider, backgroundColor: colors.surface },
                                        form.paymentMode === 'onsite' && { borderColor: colors.primary, backgroundColor: `${colors.primary}12` }
                                    ]}
                                    onPress={() => handleInputChange('paymentMode', 'onsite')}
                                >
                                    <View style={[styles.paymentIconWrap, { backgroundColor: `${colors.primary}15` }]}>
                                        <Ionicons name="business-outline" size={20} color={colors.primary} />
                                    </View>
                                    <Text style={[styles.paymentTitle, { color: colors.text }]}>Paiement présentiel</Text>
                                    <Text style={[styles.paymentSubtitle, { color: colors.textSecondary }]}>Vous confirmez d'abord la demande puis vous payez l'acompte auprès de l'agence.</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.financialCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                                <View style={styles.financialHeader}>
                                    <Text style={[styles.financialTitle, { color: colors.text }]}>Résumé du paiement</Text>
                                    <Text style={[styles.financialCaption, { color: colors.textSecondary }]}>Montants estimatifs pour aider le pèlerin à comprendre chaque étape.</Text>
                                </View>
                                <View style={styles.financialRow}>
                                    <Text style={[styles.financialLabel, { color: colors.textSecondary }]}>Type de paiement</Text>
                                    <Text style={[styles.financialValue, { color: colors.text }]}>{paymentType}</Text>
                                </View>
                                <View style={styles.financialRow}>
                                    <Text style={[styles.financialLabel, { color: colors.textSecondary }]}>Prix total</Text>
                                    <Text style={[styles.financialValue, { color: colors.text }]}>{formatMoney(totalPrice)}</Text>
                                </View>
                                <View style={styles.financialRow}>
                                    <Text style={[styles.financialLabel, { color: colors.textSecondary }]}>Acompte ({ADVANCE_RATE * 100}% estimé)</Text>
                                    <Text style={[styles.financialStrongValue, { color: colors.primary }]}>{formatMoney(advanceAmount)}</Text>
                                </View>
                                <View style={styles.financialRow}>
                                    <Text style={[styles.financialLabel, { color: colors.textSecondary }]}>Reste à payer</Text>
                                    <Text style={[styles.financialValue, { color: colors.text }]}>{formatMoney(remainingAmount)}</Text>
                                </View>
                                <View style={[styles.financialRow, styles.financialRowLast]}>
                                    <Text style={[styles.financialLabel, { color: colors.textSecondary }]}>Commission Sabeel (5%)</Text>
                                    <Text style={[styles.financialStrongValue, { color: colors.primary }]}>{formatMoney(appCommissionAmount)}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={[styles.infoNotice, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
                            <Text style={[styles.infoNoticeText, { color: colors.textSecondary }]}>Après validation, votre demande complète sera envoyée à l'agence avec vos informations, le mode de paiement choisi et le résumé du montant à régler.</Text>
                        </View>
                    </ScrollView>

                    <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.divider }]}>
                        <View style={styles.footerTopRow}>
                            <View>
                                <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>Acompte à prévoir</Text>
                                <Text style={[styles.footerAmount, { color: colors.primary }]}>{formatMoney(advanceAmount)}</Text>
                            </View>
                            <View style={styles.footerSummaryRight}>
                                <Text style={[styles.footerMiniText, { color: colors.textSecondary }]}>{pilgrimCount} pèlerin(s)</Text>
                                <Text style={[styles.footerMiniText, { color: colors.textSecondary }]}>{formatMoney(totalPrice)} au total</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: colors.primary, shadowColor: colors.primary }, submitting && { opacity: 0.7 }]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            <Text style={styles.submitButtonText}>{submitting ? 'Envoi en cours...' : 'Envoyer la réservation'}</Text>
                        </TouchableOpacity>
                        <Text style={[styles.disclaimer, { color: colors.textLight }]}>
                            Vérifiez vos informations avant de confirmer. L'agence recevra votre demande immédiatement.
                        </Text>
                    </View>
                </View>
            </KeyboardAvoidingView>
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
    contentWrapper: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 220,
    },
    heroCard: {
        borderRadius: 16,
        padding: 18,
        marginBottom: 24,
        borderWidth: 1,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
        elevation: 4,
    },
    heroBadge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: 'rgba(46, 125, 50, 0.08)',
        marginBottom: 14,
    },
    heroBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 6,
    },
    summaryTitle: {
        fontSize: 19,
        fontWeight: '900',
        marginBottom: 6,
    },
    heroDescription: {
        fontSize: 12,
        lineHeight: 19,
        marginBottom: 16,
    },
    divider: {
        height: 1,
        marginBottom: 12,
    },
    heroMetaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    heroMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 18,
        marginBottom: 8,
    },
    heroMetaText: {
        fontSize: 12,
        marginLeft: 6,
    },
    heroPriceBox: {
        borderRadius: 14,
        padding: 14,
    },
    heroPriceLabel: {
        fontSize: 11,
        marginBottom: 4,
    },
    heroPriceValue: {
        fontSize: 20,
        fontWeight: '900',
    },
    stepSection: {
        marginBottom: 24,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    stepBadge: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        marginRight: 12,
    },
    stepBadgeText: {
        fontSize: 11,
        fontWeight: '800',
    },
    stepHeaderText: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 12,
        lineHeight: 18,
    },
    stepCard: {
        borderWidth: 1,
        borderRadius: 18,
        padding: 16,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputGroupLast: {
        marginBottom: 0,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    passengersContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 8,
        borderRadius: 16,
        borderWidth: 1,
        width: '100%',
    },
    countButton: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    passengerCountBox: {
        alignItems: 'center',
    },
    passengersCount: {
        fontSize: 20,
        fontWeight: '900',
        textAlign: 'center',
    },
    passengerCountLabel: {
        fontSize: 11,
        marginTop: 2,
    },
    optionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
        marginBottom: 8,
    },
    optionChip: {
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginHorizontal: 6,
        marginBottom: 12,
    },
    optionChipText: {
        fontSize: 12,
        fontWeight: '700',
    },
    paymentCard: {
        flex: 1,
        minWidth: '46%',
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
        marginHorizontal: 6,
        marginBottom: 12,
    },
    paymentIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    paymentTitle: {
        fontSize: 13,
        fontWeight: '800',
        marginTop: 10,
        marginBottom: 6,
    },
    paymentSubtitle: {
        fontSize: 11,
        lineHeight: 16,
    },
    financialCard: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        marginTop: 8,
    },
    financialHeader: {
        marginBottom: 14,
    },
    financialTitle: {
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 4,
    },
    financialCaption: {
        fontSize: 11,
        lineHeight: 16,
    },
    financialRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    financialRowLast: {
        marginBottom: 0,
    },
    financialLabel: {
        fontSize: 12,
        flex: 1,
        paddingRight: 12,
    },
    financialValue: {
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'right',
    },
    financialStrongValue: {
        fontSize: 14,
        fontWeight: '800',
        textAlign: 'right',
    },
    infoNotice: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        marginBottom: 8,
    },
    infoNoticeText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 18,
        marginLeft: 10,
    },
    footer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        borderTopWidth: 1,
        paddingHorizontal: 20,
        paddingTop: 6,
        paddingBottom: 14,
    },
    footerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    footerLabel: {
        fontSize: 11,
        marginBottom: 2,
    },
    footerAmount: {
        fontSize: 18,
        fontWeight: '900',
    },
    footerSummaryRight: {
        alignItems: 'flex-end',
    },
    footerMiniText: {
        fontSize: 11,
        lineHeight: 16,
    },
    submitButton: {
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
    },
    disclaimer: {
        fontSize: 11,
        textAlign: 'center',
        marginTop: 4,
        lineHeight: 15,
    },
    helperText: {
        fontSize: 11,
        marginTop: 6,
        fontStyle: 'italic',
    }
});
