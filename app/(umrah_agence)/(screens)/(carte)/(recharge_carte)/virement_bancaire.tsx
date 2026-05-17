import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const COMPANY_BANK_DETAILS = {
    bankName: 'Banque Zitouna',
    iban: 'TN59 1000 0123 4567 8901 2345',
    bic: 'BKTNTNPP',
    beneficiary: 'SABEEL TRAVEL'
};

interface ConfirmationData {
    amount: string;
    proofReference: string;
}

type ScreenStep = 'amount' | 'confirmation' | 'success';

export default function VirementBancaireScreen() {
    const router = useRouter();
    const [step, setStep] = useState<ScreenStep>('amount');
    const [isLoading, setIsLoading] = useState(false);
    const [amount, setAmount] = useState('');
    const [proofReference, setProofReference] = useState('');
    const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);
    const [transactionId, setTransactionId] = useState('');

    const validateForm = (): boolean => {
        if (!amount || parseFloat(amount) <= 0) return false;
        if (proofReference.trim().length < 4) return false;
        return true;
    };

    const handleConfirmRecharge = async () => {
        if (!validateForm()) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }

        setIsLoading(true);
        try {
            setTimeout(() => {
                const txId = `VIR${Date.now()}`;
                setTransactionId(txId);
                setConfirmationData({
                    amount,
                    proofReference
                });
                setIsLoading(false);
                setStep('success');
            }, 2000);
        } catch (error) {
            setIsLoading(false);
            Alert.alert('Erreur', 'Une erreur est survenue.');
        }
    };

    const generateReceiptHtml = () => {
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
                  <div class="title">Reçu de Virement Bancaire</div>
                </div>
                <div class="amount-box">
                  <div class="label">Montant crédité</div>
                  <div class="amount">${amount} DT</div>
                </div>
                <div class="details">
                  <div class="row">
                    <span class="row-label">Ref. Client</span>
                    <span class="row-value">${proofReference}</span>
                  </div>
                  <div class="row">
                    <span class="row-label">Date</span>
                    <span class="row-value">${date}</span>
                  </div>
                  <div class="row">
                    <span class="row-label">Transaction ID</span>
                    <span class="row-value">${transactionId}</span>
                  </div>
                  <div class="row">
                    <span class="row-label">Statut</span>
                    <span class="row-value" style="color: #10b981;">Succès</span>
                  </div>
                </div>
                <div class="footer">
                  <p>Ce document est un justificatif de transaction généré électroniquement.</p>
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
                    <Text style={styles.headerTitle}>Virement Enregistré</Text>
                    <TouchableOpacity onPress={() => router.replace('/recharge')} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={[styles.content, styles.successContent]}>
                    <View style={styles.successIcon}>
                        <Ionicons name="checkmark-circle" size={80} color="#10b981" />
                    </View>
                    <Text style={styles.successTitle}>Demande Reçue</Text>
                    <Text style={styles.successSubtitle}>Nous validerons votre recharge dès réception des fonds.</Text>
                    <View style={styles.successDetails}>
                        <View style={styles.successRow}>
                            <Text style={styles.successLabel}>Montant</Text>
                            <Text style={styles.successValue}>{confirmationData.amount} DT</Text>
                        </View>
                        <View style={styles.successRow}>
                            <Text style={styles.successLabel}>Votre Référence</Text>
                            <Text style={styles.successValue}>{confirmationData.proofReference}</Text>
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
                            <Text style={styles.confirmLabel}>Référence</Text>
                            <Text style={styles.confirmText}>{proofReference}</Text>
                        </View>
                    </View>
                </ScrollView>
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmRecharge} disabled={isLoading}>
                        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Confirmer</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Virement Bancaire</Text>
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

                <View style={styles.bankInfoCard}>
                    <Text style={styles.bankInfoTitle}>Effectuez votre virement vers :</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Banque</Text>
                        <Text style={styles.detailValue}>{COMPANY_BANK_DETAILS.bankName}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Bénéficiaire</Text>
                        <Text style={styles.detailValue}>{COMPANY_BANK_DETAILS.beneficiary}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>IBAN</Text>
                        <Text style={styles.detailValueMono}>{COMPANY_BANK_DETAILS.iban}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>BIC</Text>
                        <Text style={styles.detailValueMono}>{COMPANY_BANK_DETAILS.bic}</Text>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Référence du virement</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: Ref bancaire ou Nom complet"
                        value={proofReference}
                        onChangeText={setProofReference}
                    />
                    <Text style={styles.helperText}>Saisissez la référence après avoir effectué le virement.</Text>
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
    bankInfoCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#eee' },
    bankInfoTitle: { fontWeight: '600', marginBottom: 15 },
    detailRow: { marginBottom: 10 },
    detailLabel: { fontSize: 12, color: '#999' },
    detailValue: { fontWeight: '500' },
    detailValueMono: { fontWeight: '600', fontFamily: 'monospace' },
    inputGroup: { marginBottom: 15 },
    label: { fontSize: 14, color: '#333', marginBottom: 5 },
    input: { backgroundColor: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', fontSize: 16 },
    helperText: { fontSize: 12, color: '#999', marginTop: 5 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#f8f7f2', borderTopWidth: 1, borderTopColor: '#eee' },
    confirmBtn: { backgroundColor: Colors.primary, padding: 18, borderRadius: 15, alignItems: 'center' },
    confirmBtnDisabled: { opacity: 0.5 },
    confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    confirmCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 20 },
    confirmRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    confirmLabel: { color: '#666' },
    confirmAmount: { fontWeight: 'bold', fontSize: 18, color: Colors.primary },
    confirmText: { fontWeight: '500' },
    successContent: { alignItems: 'center' },
    successIcon: { marginBottom: 20 },
    successTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
    successSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
    successDetails: { width: '100%', backgroundColor: '#fff', padding: 20, borderRadius: 12 },
    successRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    successLabel: { color: '#666' },
    successValue: { fontWeight: '600' },
    footerDouble: { flexDirection: 'row', gap: 10 },
    downloadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderColor: Colors.primary, borderWidth: 1, borderRadius: 15, padding: 15 },
    downloadBtnText: { color: Colors.primary, fontWeight: 'bold', marginLeft: 8 }
});
