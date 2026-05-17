import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface CardDetails {
    cardNumber: string;
    cardHolder: string;
    expiryDate: string;
    cvv: string;
}

interface ConfirmationData {
    amount: string;
    cardDetails: CardDetails;
}

type ScreenStep = 'amount' | 'confirmation' | 'success';

export default function CarteBancaireScreen() {
    const router = useRouter();
    const [step, setStep] = useState<ScreenStep>('amount');
    const [isLoading, setIsLoading] = useState(false);
    const [amount, setAmount] = useState('');
    const [cardDetails, setCardDetails] = useState<CardDetails>({
        cardNumber: '',
        cardHolder: '',
        expiryDate: '',
        cvv: ''
    });
    const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);
    const [transactionId, setTransactionId] = useState('');

    const formatCardNumber = (value: string): string => {
        return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
    };

    const formatExpiryDate = (value: string): string => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length >= 2) {
            return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
        }
        return cleaned;
    };

    const validateCardDetails = (): boolean => {
        const { cardNumber, cardHolder, expiryDate, cvv } = cardDetails;
        return cardNumber.length >= 16 && cardHolder.trim().length > 0 && expiryDate.length >= 5 && cvv.length >= 3;
    };

    const validateForm = (): boolean => {
        if (!amount || parseFloat(amount) <= 0) return false;
        return validateCardDetails();
    };

    const calculateFees = (): number => {
        const baseAmount = parseFloat(amount) || 0;
        return baseAmount * 0.02;
    };

    const calculateTotal = (): number => {
        const baseAmount = parseFloat(amount) || 0;
        return baseAmount * 1.02;
    };

    const handleConfirmRecharge = async () => {
        if (!validateForm()) {
            Alert.alert('Erreur', 'Veuillez compléter tous les champs obligatoires');
            return;
        }

        setIsLoading(true);
        try {
            // Simulation
            setTimeout(() => {
                const txId = `TXN${Date.now()}`;
                setTransactionId(txId);
                setConfirmationData({
                    amount,
                    cardDetails
                });
                setIsLoading(false);
                setStep('success');
            }, 2000);
        } catch (error) {
            setIsLoading(false);
            Alert.alert('Erreur', 'Une erreur est survenue.');
        }
    };

    const handleNewRecharge = () => {
        setStep('amount');
        setAmount('');
        setCardDetails({ cardNumber: '', cardHolder: '', expiryDate: '', cvv: '' });
        setConfirmationData(null);
        setTransactionId('');
    };

    const generateReceiptHtml = () => {
        const fees = calculateFees();
        const total = calculateTotal();
        const date = new Date().toLocaleString('fr-FR');

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
                  <div class="title">Reçu de Recharge - Carte Bancaire</div>
                </div>

                <div class="amount-box">
                  <div class="label">Montant crédité</div>
                  <div class="amount">${amount} DT</div>
                </div>

                <div class="details">
                  <div class="row">
                    <span class="row-label">Frais (2%)</span>
                    <span class="row-value">${fees.toFixed(2)} DT</span>
                  </div>
                   <div class="row">
                    <span class="row-label">Total Débité</span>
                    <span class="row-value">${total.toFixed(2)} DT</span>
                  </div>
                  <div class="row">
                    <span class="row-label">Date</span>
                    <span class="row-value">${date}</span>
                  </div>
                  <div class="row">
                    <span class="row-label">Référence</span>
                    <span class="row-value">${transactionId}</span>
                  </div>
                  <div class="row">
                    <span class="row-label">Statut</span>
                    <span class="row-value" style="color: #10b981;">Succès</span>
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
        }
    };

    if (step === 'success' && confirmationData) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={{ width: 40 }} />
                    <Text style={styles.headerTitle}>Recharge réussie</Text>
                    <TouchableOpacity onPress={() => router.replace('/recharge')} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={[styles.content, styles.successContent]}>
                    <View style={styles.successIcon}>
                        <Ionicons name="checkmark-circle" size={80} color="#10b981" />
                    </View>
                    <Text style={styles.successTitle}>Paiement réussi!</Text>
                    <View style={styles.successDetails}>
                        <View style={styles.successRow}>
                            <Text style={styles.successLabel}>Montant</Text>
                            <Text style={styles.successValue}>{confirmationData.amount} DT</Text>
                        </View>
                        <View style={styles.successRow}>
                            <Text style={styles.successLabel}>ID Transaction</Text>
                            <Text style={styles.successValue}>{transactionId}</Text>
                        </View>
                    </View>
                </ScrollView>
                <View style={[styles.footer, styles.footerDouble]}>
                    <TouchableOpacity style={styles.downloadBtn} onPress={handleDownloadReceipt}>
                        <Ionicons name="download-outline" size={20} color={Colors.primary} />
                        <Text style={styles.downloadBtnText}>Télécharger reçu</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.confirmBtn} onPress={() => router.replace('/recharge')}>
                        <Text style={styles.confirmBtnText}>Retour</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (step === 'confirmation' && amount) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setStep('amount')} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Confirmation</Text>
                    <View style={{ width: 40 }} />
                </View>
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.confirmCard}>
                        <View style={styles.confirmRow}>
                            <Text style={styles.confirmLabel}>Montant</Text>
                            <Text style={styles.confirmAmount}>{amount} DT</Text>
                        </View>
                        <View style={styles.confirmRow}>
                            <Text style={styles.confirmLabel}>Frais (2%)</Text>
                            <Text style={styles.confirmText}>{calculateFees().toFixed(2)} DT</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.confirmRow}>
                            <Text style={styles.confirmLabelBold}>Total</Text>
                            <Text style={styles.confirmAmountBold}>{calculateTotal().toFixed(2)} DT</Text>
                        </View>
                        <View style={styles.cardPreview}>
                            <Text style={styles.cardPreviewLabel}>Carte</Text>
                            <Text>{cardDetails.cardNumber.slice(0, 4)} **** **** {cardDetails.cardNumber.slice(-4)}</Text>
                        </View>
                    </View>
                </ScrollView>
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmRecharge} disabled={isLoading}>
                        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Payer</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Step Amount & Form
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Carte Bancaire</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.amountSection}>
                    <Text style={styles.amountLabel}>Montant</Text>
                    <View style={styles.amountInputContainer}>
                        <Text style={styles.amountCurrency}>DT</Text>
                        <TextInput
                            style={styles.amountInput}
                            placeholder="0.00"
                            keyboardType="decimal-pad"
                            value={amount}
                            onChangeText={setAmount}
                        />
                    </View>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Numéro de carte</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0000 0000 0000 0000"
                            keyboardType="numeric"
                            maxLength={19}
                            value={formatCardNumber(cardDetails.cardNumber)}
                            onChangeText={(t) => setCardDetails({ ...cardDetails, cardNumber: t.replace(/\s/g, '') })}
                        />
                    </View>
                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={styles.label}>Exp (MM/YY)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="MM/YY"
                                maxLength={5}
                                value={formatExpiryDate(cardDetails.expiryDate)}
                                onChangeText={(t) => setCardDetails({ ...cardDetails, expiryDate: t })}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>CVV</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="123"
                                maxLength={4}
                                secureTextEntry
                                value={cardDetails.cvv}
                                onChangeText={(t) => setCardDetails({ ...cardDetails, cvv: t })}
                            />
                        </View>
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Titulaire</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Nom complet"
                            value={cardDetails.cardHolder}
                            onChangeText={(t) => setCardDetails({ ...cardDetails, cardHolder: t })}
                        />
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.confirmBtn, !validateForm() && styles.confirmBtnDisabled]}
                    onPress={() => setStep('confirmation')}
                    disabled={!validateForm()}
                >
                    <Text style={styles.confirmBtnText}>Continuer</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f7f2' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#f8f7f2' },
    backBtn: { padding: 8 },
    closeBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.primary },
    content: { padding: 20, paddingBottom: 100 },
    amountSection: { marginBottom: 20 },
    amountLabel: { fontSize: 14, color: '#666', marginBottom: 8 },
    amountInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
    amountCurrency: { fontSize: 20, fontWeight: '600', color: Colors.primary, marginRight: 10 },
    amountInput: { flex: 1, fontSize: 24, fontWeight: '700', color: '#1f2937' },
    form: { gap: 15 },
    inputGroup: { marginBottom: 15 },
    label: { fontSize: 14, color: '#333', marginBottom: 5 },
    input: { backgroundColor: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', fontSize: 16 },
    row: { flexDirection: 'row', marginBottom: 15 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#f8f7f2', borderTopWidth: 1, borderTopColor: '#eee' },
    confirmBtn: { backgroundColor: Colors.primary, padding: 18, borderRadius: 15, alignItems: 'center' },
    confirmBtnDisabled: { opacity: 0.5 },
    confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    confirmCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 20 },
    confirmRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    confirmLabel: { color: '#666' },
    confirmAmount: { fontWeight: 'bold', fontSize: 18, color: Colors.primary },
    confirmText: { fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
    confirmLabelBold: { fontWeight: 'bold', fontSize: 16 },
    confirmAmountBold: { fontWeight: 'bold', fontSize: 20, color: Colors.primary },
    cardPreview: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee' },
    cardPreviewLabel: { fontSize: 12, color: '#999', marginBottom: 5 },
    successContent: { alignItems: 'center' },
    successIcon: { marginBottom: 20 },
    successTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 30 },
    successDetails: { width: '100%', backgroundColor: '#fff', padding: 20, borderRadius: 12 },
    successRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    successLabel: { color: '#666' },
    successValue: { fontWeight: '600' },
    footerDouble: { flexDirection: 'row', gap: 10 },
    downloadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderColor: Colors.primary, borderWidth: 1, borderRadius: 15, padding: 15 },
    downloadBtnText: { color: Colors.primary, fontWeight: 'bold', marginLeft: 8 }
});
