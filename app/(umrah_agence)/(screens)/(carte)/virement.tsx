import { Colors } from '@/constants/Colors';
import { authApi } from '@/data/repositories/common/authApi';
import { useThemeColors } from '@/hooks/useThemeColors';
import { selectCurrentUser } from '@/store/authSlice';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Print from 'expo-print';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';

interface Recipient {
    id: number;
    name: string;
    iban: string;
}

export default function VirementScreen() {
    const router = useRouter();
    const user = useSelector(selectCurrentUser);
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

    // Form State
    const [beneficiaryName, setBeneficiaryName] = useState('');
    const [iban, setIban] = useState('');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: formulaire, 2: confirmation, 3: succès
    const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);

    // Auth State
    const [showBiometric, setShowBiometric] = useState(false);
    const [authStep, setAuthStep] = useState<'method' | 'otp'>('method');
    const [otpCode, setOtpCode] = useState('');
    const [authError, setAuthError] = useState<string | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(false);

    // Mock de contacts/destinataires récents
    const recentRecipients: Recipient[] = [
        { id: 1, name: 'Ahmed Ben Ali', iban: 'TN59 1000 0123 4567 8901 2345' },
        { id: 2, name: 'Fatima Mahjoub', iban: 'TN59 1000 0000 9876 5432 1098' },
        { id: 3, name: 'Mohamed Khaled', iban: 'TN59 1000 0555 1234 5678 9012' },
    ];

    const validateIban = (value: string) => {
        const ibanRegex = /^TN\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/;
        return value.trim().length > 0 && ibanRegex.test(value);
    };

    const validateName = (value: string) => {
        return value.trim().length >= 3;
    };

    const validateAmount = () => {
        const num = parseFloat(amount);
        return !isNaN(num) && num > 0 && num <= 10000; // Limite max 10000 TND
    };

    const handleSelectRecipient = (rec: Recipient) => {
        setBeneficiaryName(rec.name);
        setIban(rec.iban);
        setSelectedRecipient(rec);
    };

    const handleContinue = () => {
        if (!validateName(beneficiaryName)) {
            Alert.alert('Erreur', 'Veuillez entrer un nom valide (min 3 caractères)');
            return;
        }
        if (!validateIban(iban)) {
            Alert.alert('Erreur', 'Veuillez entrer un IBAN valide (TN59...)');
            return;
        }
        if (!validateAmount()) {
            Alert.alert('Erreur', 'Montant invalide (max 10 000 TND)');
            return;
        }
        setStep(2);
    };

    const handleConfirmTransfer = () => {
        // Reset auth state and show modal
        setAuthStep('method');
        setOtpCode('');
        setAuthError(null);
        setShowBiometric(true);
    };

    const performTransfer = async () => {
        setShowBiometric(false);
        setIsLoading(true);
        try {
            // Simulation d'appel API
            setTimeout(() => {
                setIsLoading(false);
                setStep(3);
            }, 2000);
        } catch (error) {
            setIsLoading(false);
            Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
        }
    };

    // Auth Functions
    const handleSendOtp = async () => {
        const email = user?.email || 'test@example.com';
        setIsAuthLoading(true);
        setAuthError(null);
        try {
            await authApi.sendOtp(email);
            setAuthStep('otp');
        } catch (err: any) {
            setAuthError(err.message || "Erreur lors de l'envoi du code");
        } finally {
            setIsAuthLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otpCode || otpCode.length < 4) {
            setAuthError("Veuillez entrer le code valide");
            return;
        }
        const email = user?.email || 'test@example.com';
        setIsAuthLoading(true);
        setAuthError(null);
        try {
            await authApi.verifyOtp(email, otpCode);
            performTransfer();
        } catch (err: any) {
            setAuthError(err.message || "Code invalide");
        } finally {
            setIsAuthLoading(false);
        }
    };

    const handleBiometricAuth = async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            if (!hasHardware) {
                Alert.alert('Erreur', 'Biométrie non disponible');
                return;
            }
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Confirmer le virement',
                fallbackLabel: 'Utiliser le code',
            });

            if (result.success) {
                performTransfer();
            }
        } catch (error) {
            console.error('Biometric auth error:', error);
        }
    };

    const handleNewTransfer = () => {
        setBeneficiaryName('');
        setIban('');
        setAmount('');
        setReason('');
        setSelectedRecipient(null);
        setStep(1);
    };

    const generateReceiptHtml = () => {
        return `
            <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                <style>
                  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
                  .header { text-align: center; margin-bottom: 30px; }
                  .logo { font-size: 24px; font-weight: bold; color: ${Colors.primary}; margin-bottom: 5px; }
                  .title { font-size: 18px; color: #666; }
                  .amount-box { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 10px; margin-bottom: 30px; }
                  .amount { font-size: 36px; font-weight: bold; color: ${Colors.primary}; }
                  .label { font-size: 14px; color: #999; margin-bottom: 5px; }
                  .details { border-top: 1px solid #eee; padding-top: 20px; }
                  .row { display: flex; justify-content: space-between; margin-bottom: 15px; }
                  .row-label { color: #666; }
                  .row-value { font-weight: 600; }
                  .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; }
                </style>
              </head>
              <body>
                <div class="header">
                  <div class="logo">Sabeel</div>
                  <div class="title">Reçu de Virement</div>
                </div>

                <div class="amount-box">
                  <div class="label">Montant envoyé</div>
                  <div class="amount">${amount} TND</div>
                </div>

                <div class="details">
                  <div class="row">
                    <span class="row-label">Bénéficiaire</span>
                    <span class="row-value">${beneficiaryName}</span>
                  </div>
                  <div class="row">
                    <span class="row-label">IBAN</span>
                    <span class="row-value">${iban}</span>
                  </div>
                  <div class="row">
                    <span class="row-label">Date</span>
                    <span class="row-value">${new Date().toLocaleString('fr-FR')}</span>
                  </div>
                   <div class="row">
                    <span class="row-label">Motif</span>
                    <span class="row-value">${reason || '-'}</span>
                  </div>
                  <div class="row">
                    <span class="row-label">Référence</span>
                    <span class="row-value">VIR-${Date.now()}</span>
                  </div>
                  <div class="row">
                    <span class="row-label">Statut</span>
                    <span class="row-value" style="color: #f59e0b;">En cours de traitement</span>
                  </div>
                </div>

                <div class="footer">
                  <p>Ce document est un justificatif de transaction généré électroniquement.</p>
                  <p>Sabeel App - Agence Umrah</p>
                </div>
              </body>
            </html>
        `;
    };

    const handleDownloadReceipt = async () => {
        try {
            const html = generateReceiptHtml();
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            Alert.alert('Erreur', "Impossible de générer le reçu");
            console.error(error);
        }
    };

    // Écran 1: Formulaire de saisie
    if (step === 1) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.primary }]}>Effectuer un virement</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    {/* Solde */}
                    <View style={[styles.balanceCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Solde disponible</Text>
                        <Text style={[styles.balanceAmount, { color: colors.primary }]}>847.50 TND</Text>
                    </View>

                    {/* Destinataires récents */}
                    {recentRecipients.length > 0 && (
                        <View style={styles.recentSection}>
                            <View style={styles.recentHeader}>
                                <Text style={[styles.recentTitle, { color: colors.text }]}>Destinataires récents</Text>
                                <TouchableOpacity>
                                    <Text style={[styles.recentLink, { color: colors.primary }]}>Voir tous</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.recentList}>
                                {recentRecipients.map((rec) => (
                                    <TouchableOpacity
                                        key={rec.id}
                                        style={[styles.recentCard, { backgroundColor: colors.surface }]}
                                        onPress={() => handleSelectRecipient(rec)}
                                    >
                                        <View style={[styles.recentAvatar, { backgroundColor: colors.primary }]}>
                                            <Text style={styles.recentAvatarText}>
                                                {rec.name.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={styles.recentInfo}>
                                            <Text style={[styles.recentName, { color: colors.text }]}>{rec.name}</Text>
                                            <Text style={[styles.recentIban, { color: colors.textSecondary }]}>
                                                {rec.iban.slice(0, 8)}...{rec.iban.slice(-4)}
                                            </Text>
                                        </View>
                                        {selectedRecipient?.id === rec.id && (
                                            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Formulaire */}
                    <View style={styles.form}>
                        {/* Bénéficiaire Name */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Nom du bénéficiaire</Text>
                            <View style={[styles.inputContainer, { backgroundColor: isDarkMode ? '#2c2c2c' : '#fff' }, beneficiaryName && styles.inputContainerFilled]}>
                                <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Nom complet"
                                    placeholderTextColor={colors.textSecondary}
                                    value={beneficiaryName}
                                    onChangeText={setBeneficiaryName}
                                />
                                {beneficiaryName && validateName(beneficiaryName) && (
                                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                                )}
                            </View>
                        </View>

                        {/* IBAN */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Code IBAN</Text>
                            <View style={[styles.inputContainer, { backgroundColor: isDarkMode ? '#2c2c2c' : '#fff' }, iban && styles.inputContainerFilled]}>
                                <Ionicons name="card-outline" size={20} color={colors.textSecondary} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="TN59 1000 ..."
                                    placeholderTextColor={colors.textSecondary}
                                    value={iban}
                                    onChangeText={setIban}
                                    maxLength={30}
                                />
                                {iban && validateIban(iban) && (
                                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                                )}
                            </View>
                            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                                Format: TN59 1000 XXXX XXXX XXXX XXXX
                            </Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Montant (DT)</Text>
                            <View style={[styles.inputContainer, { backgroundColor: isDarkMode ? '#2c2c2c' : '#fff' }, amount && styles.inputContainerFilled]}>
                                <Ionicons name="cash-outline" size={20} color={colors.textSecondary} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="0.00"
                                    placeholderTextColor={colors.textSecondary}
                                    keyboardType="decimal-pad"
                                    value={amount}
                                    onChangeText={setAmount}
                                />
                                {amount && validateAmount() && (
                                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                                )}
                            </View>
                            {amount && !validateAmount() && (
                                <Text style={styles.errorText}>Montant invalide (max 10 000 TND)</Text>
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Motif (Optionnel)</Text>
                            <View style={[styles.inputContainer, { backgroundColor: isDarkMode ? '#2c2c2c' : '#fff' }]}>
                                <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Ex: Aide pour Umrah"
                                    placeholderTextColor={colors.textSecondary}
                                    value={reason}
                                    onChangeText={setReason}
                                />
                            </View>
                        </View>
                    </View>
                </ScrollView>

                {/* Bouton Continuer */}
                <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.divider }]}>
                    <TouchableOpacity
                        style={[
                            styles.button,
                            { backgroundColor: colors.primary },
                            (!validateName(beneficiaryName) || !validateIban(iban) || !validateAmount()) && styles.buttonDisabled
                        ]}
                        onPress={handleContinue}
                        disabled={!validateName(beneficiaryName) || !validateIban(iban) || !validateAmount()}
                    >
                        <Text style={styles.buttonText}>Continuer</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Écran 2: Confirmation
    if (step === 2) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
                    <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.primary }]}>Confirmer le virement</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <View style={[styles.confirmationCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.confirmTitle, { color: colors.text }]}>Résumé du virement</Text>

                        <View style={styles.confirmSection}>
                            <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>De</Text>
                            <View style={styles.confirmValue}>
                                <Ionicons name="wallet-outline" size={18} color={colors.primary} />
                                <View>
                                    <Text style={[styles.confirmValueText, { color: colors.text }]}>Mon portefeuille</Text>
                                    <Text style={[styles.confirmValueSubtext, { color: colors.textSecondary }]}>847.50 TND disponible</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.arrowContainer}>
                            <View style={[styles.arrowLine, { backgroundColor: colors.divider }]} />
                            <Ionicons name="arrow-down" size={24} color={colors.primary} />
                            <View style={[styles.arrowLine, { backgroundColor: colors.divider }]} />
                        </View>

                        <View style={styles.confirmSection}>
                            <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>Vers</Text>
                            <View style={styles.confirmValue}>
                                <Ionicons name="person-circle-outline" size={18} color="#10b981" />
                                <View>
                                    <Text style={[styles.confirmValueText, { color: colors.text }]}>
                                        {beneficiaryName}
                                    </Text>
                                    <Text style={[styles.confirmValueSubtext, { color: colors.textSecondary }]}>
                                        {iban}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

                        <View style={styles.confirmRow}>
                            <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>Montant</Text>
                            <Text style={[styles.confirmAmount, { color: colors.primary }]}>{amount} TND</Text>
                        </View>

                        {reason ? (
                            <View style={styles.confirmRow}>
                                <Text style={styles.confirmLabel}>Motif</Text>
                                <Text style={styles.confirmText}>{reason}</Text>
                            </View>
                        ) : null}

                        <View style={styles.confirmRow}>
                            <Text style={styles.confirmLabel}>Frais</Text>
                            <Text style={styles.confirmText}>Gratuit</Text>
                        </View>

                        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

                        <View style={styles.confirmRow}>
                            <Text style={[styles.confirmLabelBold, { color: colors.text }]}>Total à envoyer</Text>
                            <Text style={[styles.confirmAmountBold, { color: colors.primary }]}>{amount} TND</Text>
                        </View>
                    </View>

                    {/* Conditions */}
                    <View style={[styles.termsBox, { backgroundColor: isDarkMode ? '#2c2c2c' : '#f9fafb' }]}>
                        <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
                        <Text style={[styles.termsText, { color: colors.textSecondary }]}>
                            En confirmant, vous acceptez de transférer {amount} TND vers le bénéficiaire indiqué.
                            Cette action ne peut pas être annulée.
                        </Text>
                    </View>
                </ScrollView>

                <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.divider }]}>
                    <TouchableOpacity
                        style={[styles.buttonSecondary, { borderColor: colors.primary }]}
                        onPress={() => setStep(1)}
                        disabled={isLoading}
                    >
                        <Text style={[styles.buttonSecondaryText, { color: colors.primary }]}>Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.primary }, isLoading && styles.buttonDisabled]}
                        onPress={handleConfirmTransfer}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.buttonText}>Envoyer les fonds</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Biometric/Auth Modal */}
                <Modal
                    visible={showBiometric}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowBiometric(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                            <TouchableOpacity
                                style={styles.modalClose}
                                onPress={() => setShowBiometric(false)}
                            >
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>

                            {authStep === 'method' ? (
                                <>
                                    <View style={styles.biometricIconContainer}>
                                        <Ionicons name="shield-checkmark-outline" size={48} color={colors.primary} />
                                    </View>

                                    <Text style={[styles.modalTitle, { color: colors.text }]}>Validation requise</Text>
                                    <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
                                        Veuillez confirmer votre identité pour valider ce virement de {amount} TND
                                    </Text>

                                    <TouchableOpacity style={[styles.biometricBtn, { backgroundColor: colors.primary }]} onPress={handleBiometricAuth}>
                                        <Ionicons name="finger-print-outline" size={20} color="#fff" />
                                        <Text style={styles.biometricBtnText}>Empreinte digitale</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.biometricBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary }]}
                                        onPress={handleSendOtp}
                                    >
                                        {isAuthLoading ? (
                                            <ActivityIndicator color={colors.primary} />
                                        ) : (
                                            <>
                                                <Ionicons name="mail-outline" size={20} color={colors.primary} />
                                                <Text style={[styles.biometricBtnText, { color: colors.primary }]}>Code par Email</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <View style={styles.biometricIconContainer}>
                                        <Ionicons name="mail-open-outline" size={48} color={colors.primary} />
                                    </View>

                                    <Text style={[styles.modalTitle, { color: colors.text }]}>Code de vérification</Text>
                                    <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
                                        Un code a été envoyé à {user?.email || 'votre email'}.
                                    </Text>

                                    <TextInput
                                        style={[styles.otpInput, { backgroundColor: isDarkMode ? '#2c2c2c' : '#f5f5f5', color: colors.text }]}
                                        placeholder="Entrez le code"
                                        placeholderTextColor={colors.textSecondary}
                                        value={otpCode}
                                        onChangeText={(text) => {
                                            setOtpCode(text);
                                            setAuthError(null);
                                        }}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                    />

                                    {authError && <Text style={styles.errorTextCentered}>{authError}</Text>}

                                    <TouchableOpacity style={[styles.biometricBtn, { backgroundColor: colors.primary }]} onPress={handleVerifyOtp}>
                                        {isAuthLoading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={styles.biometricBtnText}>Valider le virement</Text>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={() => setAuthStep('method')}>
                                        <Text style={styles.cancelText}>Retour</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                </Modal>
            </View>
        );
    }

    // Écran 3: Succès
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
                <View style={{ width: 40 }} />
                <Text style={[styles.headerTitle, { color: colors.primary }]}>Virement effectué</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                    <Ionicons name="close" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={[styles.content, styles.successContent]}>
                <View style={styles.successIcon}>
                    <Ionicons name="checkmark-circle" size={80} color="#10b981" />
                </View>

                <Text style={[styles.successTitle, { color: colors.text }]}>Virement réussi!</Text>
                <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
                    Votre virement de {amount} TND a été envoyé avec succès
                </Text>

                <View style={[styles.successDetails, { backgroundColor: colors.surface }]}>
                    <View style={styles.successRow}>
                        <Text style={[styles.successLabel, { color: colors.textSecondary }]}>Bénéficiaire</Text>
                        <Text style={[styles.successValue, { color: colors.text }]}>
                            {beneficiaryName}
                        </Text>
                    </View>

                    <View style={styles.successRow}>
                        <Text style={[styles.successLabel, { color: colors.textSecondary }]}>Montant</Text>
                        <Text style={[styles.successValue, { color: colors.primary }]}>{amount} TND</Text>
                    </View>

                    <View style={styles.successRow}>
                        <Text style={[styles.successLabel, { color: colors.textSecondary }]}>Date</Text>
                        <Text style={[styles.successValue, { color: colors.text }]}>
                            {new Date().toLocaleDateString('fr-FR')}
                        </Text>
                    </View>

                    <View style={styles.successRow}>
                        <Text style={[styles.successLabel, { color: colors.textSecondary }]}>Statut</Text>
                        <View style={[styles.statusBadge, { backgroundColor: isDarkMode ? '#3a2d1a' : '#fff9eb', borderColor: '#f59e0b' }]}>
                            <Ionicons name="time-outline" size={14} color="#f59e0b" />
                            <Text style={[styles.statusText, { color: '#f59e0b' }]}>En attente (1-2 jours)</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.nextStepsBox, { backgroundColor: isDarkMode ? '#2c2c2c' : '#f0f9ff', borderColor: isDarkMode ? colors.divider : '#bae6fd' }]}>
                    <Text style={[styles.nextStepsTitle, { color: isDarkMode ? colors.text : '#0369a1' }]}>Prochaines étapes</Text>
                    <View style={styles.step}>
                        <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                            <Text style={styles.stepNumberText}>1</Text>
                        </View>
                        <Text style={[styles.stepText, { color: colors.text }]}>Vérification de la transaction</Text>
                    </View>
                    <View style={styles.step}>
                        <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                            <Text style={styles.stepNumberText}>2</Text>
                        </View>
                        <Text style={[styles.stepText, { color: colors.text }]}>Traitement par le système bancaire</Text>
                    </View>
                    <View style={styles.step}>
                        <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                            <Text style={styles.stepNumberText}>3</Text>
                        </View>
                        <Text style={[styles.stepText, { color: colors.text }]}>Réception par le bénéficiaire</Text>
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.divider }]}>
                <TouchableOpacity style={[styles.buttonSecondary, { borderColor: colors.primary }]} onPress={handleDownloadReceipt}>
                    <Ionicons name="download-outline" size={20} color={colors.primary} />
                    <Text style={[styles.buttonSecondaryText, { color: colors.primary }]}>Télécharger reçu</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleNewTransfer}>
                    <Text style={styles.buttonText}>Nouveau virement</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f7f2',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        backgroundColor: '#f8f7f2',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    backBtn: {
        padding: 8,
        marginLeft: -8,
    },
    closeBtn: {
        padding: 8,
        marginRight: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.primary,
        flex: 1,
        textAlign: 'center',
    },
    content: {
        padding: 20,
        paddingBottom: 120,
    },
    successContent: {
        alignItems: 'center',
        paddingBottom: 100,
    },
    balanceCard: {
        backgroundColor: Colors.white,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    balanceLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    balanceAmount: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.primary,
    },
    recentSection: {
        marginBottom: 24,
    },
    recentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    recentTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    recentLink: {
        fontSize: 12,
        color: Colors.primary,
        fontWeight: '600',
    },
    recentList: {
        gap: 8,
    },
    recentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        gap: 12,
    },
    recentAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    recentAvatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    recentInfo: {
        flex: 1,
    },
    recentName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1f2937',
    },
    recentIban: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    form: {
        gap: 20,
        marginBottom: 24,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        height: 52,
        gap: 12,
    },
    inputContainerFilled: {
        borderColor: '#10b981',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1f2937',
        height: '100%',
    },
    helperText: {
        fontSize: 11,
        color: '#999',
        marginLeft: 4,
    },
    errorText: {
        fontSize: 11,
        color: '#ef4444',
        marginLeft: 4,
    },
    infoBox: {
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    infoText: {
        fontSize: 13,
        color: '#0ea5e9',
        flex: 1,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingBottom: 24,
        backgroundColor: '#f8f7f2',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 14,
        gap: 8,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    buttonSecondary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.primary,
        gap: 8,
    },
    buttonSecondaryText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.primary,
    },
    confirmationCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    confirmTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 20,
    },
    confirmSection: {
        marginBottom: 12,
    },
    confirmLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 8,
        fontWeight: '600',
    },
    confirmLabelBold: {
        fontSize: 14,
        color: '#1f2937',
        fontWeight: '700',
    },
    confirmValue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#f9fafb',
        padding: 12,
        borderRadius: 10,
    },
    confirmValueText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    confirmValueSubtext: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    arrowContainer: {
        alignItems: 'center',
        marginVertical: 16,
    },
    arrowLine: {
        width: 2,
        height: 8,
        backgroundColor: '#e5e7eb',
    },
    divider: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginVertical: 12,
    },
    confirmRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    confirmAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.primary,
    },
    confirmAmountBold: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.primary,
    },
    confirmText: {
        fontSize: 14,
        color: '#1f2937',
        fontWeight: '500',
    },
    termsBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        padding: 12,
        borderRadius: 12,
        gap: 10,
    },
    termsText: {
        fontSize: 12,
        color: '#6366f1',
        flex: 1,
        lineHeight: 18,
    },
    successIcon: {
        marginBottom: 24,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 8,
    },
    successSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 32,
        textAlign: 'center',
    },
    successDetails: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    successRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    successLabel: {
        fontSize: 13,
        color: '#666',
    },
    successValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    statusText: {
        fontSize: 12,
        color: '#f59e0b',
        fontWeight: '600',
    },
    nextStepsBox: {
        width: '100%',
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 16,
    },
    nextStepsTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 12,
    },
    step: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumberText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
    },
    stepText: {
        fontSize: 13,
        color: '#666',
        flex: 1,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 28,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
    },
    modalClose: {
        position: 'absolute',
        top: 12,
        right: 12,
        padding: 6,
    },
    biometricIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(44, 95, 45, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 10,
        textAlign: 'center',
    },
    modalDesc: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    biometricBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        width: '100%',
        marginBottom: 12,
        gap: 8,
    },
    biometricBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    otpInput: {
        width: '100%',
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        paddingHorizontal: 16,
        fontSize: 20,
        textAlign: 'center',
        letterSpacing: 4,
        marginBottom: 16,
        color: '#1f2937',
    },
    errorTextCentered: {
        fontSize: 12,
        color: '#ef4444',
        marginBottom: 16,
        textAlign: 'center',
    },
    cancelText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
        marginTop: 8,
    },
});
