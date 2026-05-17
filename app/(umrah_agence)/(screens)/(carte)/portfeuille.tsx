import { Colors } from '@/constants/Colors';
import { authApi } from '@/data/repositories/common/authApi';
import { useThemeColors } from '@/hooks/useThemeColors';
import { CustomAlert } from '@/components/ui/CustomAlert';
import { walletApi } from '@/services/api';
import { selectCurrentUser } from '@/store/authSlice';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';

export default function PortfeuilleScreen() {
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const router = useRouter();
    const user = useSelector(selectCurrentUser);
    const [showBiometric, setShowBiometric] = useState(false);
    const [isCodeVisible, setIsCodeVisible] = useState(false);
    const [selectedTab, setSelectedTab] = useState('overview');

    const [walletLoading, setWalletLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [wallet, setWallet] = useState<{ id: string; currency: string; availableBalance: number; pendingBalance: number } | null>(null);
    const [transactions, setTransactions] = useState<any[]>([]);

    const [withdrawVisible, setWithdrawVisible] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawLoading, setWithdrawLoading] = useState(false);

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'success' as 'success' | 'error' | 'warning',
        actionLabel: undefined as string | undefined,
        onAction: undefined as undefined | (() => void),
    });

    // Auth State
    const [authStep, setAuthStep] = useState<'method' | 'otp'>('method');
    const [otpCode, setOtpCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const formatMoney = (amountCents?: number, currency?: string) => {
        const amount = typeof amountCents === 'number' ? amountCents : 0;
        const cur = String(currency || 'MAD').toUpperCase();
        return `${(amount / 100).toFixed(2)} ${cur}`;
    };

    const formatDate = (value?: string) => {
        if (!value) return '';
        const ms = Date.parse(String(value));
        if (!Number.isFinite(ms)) return String(value);
        return new Date(ms).toLocaleDateString();
    };

    const shortTypeLabel = (txType: string) => {
        const t = String(txType || '').toUpperCase();
        if (t.includes('WITHDRAWAL')) return 'Withdraw';
        if (t.includes('PAYMENT')) return 'Payment';
        if (t.includes('TOPUP')) return 'Recharge';
        if (t.includes('REFUND')) return 'Refund';
        return t || 'Transaction';
    };

    const isIncoming = (tx: any, walletId?: string) => {
        if (!walletId) return false;
        return String(tx?.toWalletId || '') === String(walletId);
    };

    const viewTransactions = useMemo(() => {
        const walletId = wallet?.id;
        return (Array.isArray(transactions) ? transactions : []).map((t: any) => {
            const incoming = isIncoming(t, walletId);
            const amountText = formatMoney(Number(t?.amount || 0), String(t?.currency || wallet?.currency || 'MAD'));
            return {
                id: String(t?.id || ''),
                raw: t,
                type: incoming ? 'credit' : 'debit',
                title: shortTypeLabel(String(t?.type || '')),
                amount: `${incoming ? '+' : '-'} ${amountText}`,
                date: formatDate(String(t?.createdAt || '')),
                status: String(t?.status || '').toLowerCase() || 'completed',
            };
        });
    }, [transactions, wallet?.currency, wallet?.id]);

    const buildIdempotencyKey = () => {
        return `mob-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    };

    const loadWallet = async () => {
        const [meRes, txRes] = await Promise.all([
            walletApi.getMe(),
            walletApi.listTransactions({ limit: 20, offset: 0 }),
        ]);

        const w = meRes?.data?.wallet || null;
        setWallet(w);

        const items = Array.isArray(txRes?.data?.items) ? txRes.data.items : [];
        setTransactions(items);
    };

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            setWalletLoading(true);
            try {
                await loadWallet();
            } catch (e: any) {
                if (!mounted) return;
                setAlertConfig({
                    visible: true,
                    title: 'Erreur',
                    message: e?.response?.data?.message || e?.message || 'Impossible de charger le wallet.',
                    type: 'error',
                    actionLabel: "D'accord",
                    onAction: undefined,
                });
            } finally {
                if (mounted) setWalletLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await loadWallet();
        } catch {
            // ignore
        } finally {
            setRefreshing(false);
        }
    };

    const openWithdraw = () => {
        const available = Number(wallet?.availableBalance || 0);
        if (available <= 0) {
            setAlertConfig({
                visible: true,
                title: 'Solde insuffisant',
                message: 'Votre solde disponible est insuffisant.',
                type: 'warning',
                actionLabel: "D'accord",
                onAction: undefined,
            });
            return;
        }
        setWithdrawAmount('');
        setWithdrawVisible(true);
    };

    const confirmWithdraw = async () => {
        const amountMAD = Number(String(withdrawAmount || '').replace(',', '.'));
        if (!Number.isFinite(amountMAD) || amountMAD <= 0) {
            setAlertConfig({
                visible: true,
                title: 'Montant invalide',
                message: 'Veuillez saisir un montant valide.',
                type: 'warning',
                actionLabel: "D'accord",
                onAction: undefined,
            });
            return;
        }

        const amountCents = Math.floor(amountMAD * 100);
        const available = Number(wallet?.availableBalance || 0);
        if (amountCents > available) {
            setAlertConfig({
                visible: true,
                title: 'Solde insuffisant',
                message: `Maximum retrait: ${formatMoney(available, wallet?.currency)}`,
                type: 'warning',
                actionLabel: "D'accord",
                onAction: undefined,
            });
            return;
        }

        setWithdrawLoading(true);
        try {
            await walletApi.requestWithdrawal({
                amountCents,
                idempotencyKey: buildIdempotencyKey(),
            });

            setWithdrawVisible(false);
            setAlertConfig({
                visible: true,
                title: 'Demande envoyée',
                message: 'Votre demande de retrait a été envoyée. Traitement sous 48h max.',
                type: 'success',
                actionLabel: "D'accord",
                onAction: undefined,
            });
            await loadWallet();
        } catch (e: any) {
            setAlertConfig({
                visible: true,
                title: 'Erreur',
                message: e?.response?.data?.message || e?.message || 'Impossible de demander le retrait.',
                type: 'error',
                actionLabel: "D'accord",
                onAction: undefined,
            });
        } finally {
            setWithdrawLoading(false);
        }
    };

    const resetAuthState = () => {
        setAuthStep('method');
        setOtpCode('');
        setError(null);
        setIsLoading(false);
    };

    const handleEyeClick = () => {
        resetAuthState();
        setShowBiometric(true);
    };

    const handleSendOtp = async () => {
        const email = user?.email || 'test@example.com';

        setIsLoading(true);
        setError(null);
        try {
            await authApi.sendOtp(email);
            setAuthStep('otp');
        } catch (err: any) {
            setError(err.message || "Erreur lors de l'envoi du code");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otpCode || otpCode.length < 4) {
            setError("Veuillez entrer le code valide");
            return;
        }

        const email = user?.email || 'test@example.com';

        setIsLoading(true);
        setError(null);
        try {
            await authApi.verifyOtp(email, otpCode);
            setShowBiometric(false);
            setIsCodeVisible(true);
            setTimeout(() => setIsCodeVisible(false), 5000);
        } catch (err: any) {
            setError(err.message || "Code invalide");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBiometricAuth = async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            if (!hasHardware) {
                setShowBiometric(false);
                setIsCodeVisible(true);
                setTimeout(() => setIsCodeVisible(false), 5000);
                return;
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authentification requise',
                fallbackLabel: 'Utiliser le code',
            });

            if (result.success) {
                setShowBiometric(false);
                setIsCodeVisible(true);
                setTimeout(() => setIsCodeVisible(false), 5000);
            }
        } catch (error) {
            console.error('Biometric auth error:', error);
            setShowBiometric(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface }]}>
                    <FontAwesome5 name="times" size={20} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.primary }]}>Portefeuille</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Compact Wallet Card */}
                <View style={styles.cardWrapper}>
                    <LinearGradient
                        colors={[Colors.primary, '#3d7c4a', '#8b7e56']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.walletCard}
                    >
                        {/* Decorative Background */}
                        <View style={styles.cardBg1} />
                        <View style={styles.cardBg2} />

                        <View style={styles.cardContent}>
                            <View style={styles.chipContainer}>
                                <View style={styles.chip} />
                            </View>

                            <View style={styles.balanceContainer}>
                                <Text style={styles.balanceLabel}>SOLDE DISPONIBLE</Text>
                                <Text style={styles.balanceAmount}>
                                    {walletLoading
                                        ? '...'
                                        : formatMoney(Number(wallet?.availableBalance || 0), wallet?.currency)}
                                </Text>
                            </View>

                            <View style={styles.detailsRow}>
                                <View>
                                    <Text style={styles.detailLabel}>TYPE</Text>
                                    <Text style={styles.detailValue}>Pèlerin</Text>
                                </View>
                                <View>
                                    <Text style={styles.detailLabel}>EXP</Text>
                                    <Text style={styles.detailValue}>12/25</Text>
                                </View>
                                <View style={styles.statusBadge}>
                                    <Text style={styles.statusText}>Non Validée</Text>
                                </View>
                            </View>

                            <View style={styles.cardNumberRow}>
                                <Text style={styles.cardNumber}>
                                    {isCodeVisible ? 'TN59 1234 5678 9012 3456' : '•••• •••• •••• 4829'}
                                </Text>
                                <TouchableOpacity onPress={handleEyeClick} style={styles.eyeBtn}>
                                    <Ionicons
                                        name={isCodeVisible ? 'eye-outline' : 'eye-off-outline'}
                                        size={20}
                                        color={Colors.white}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Quick Actions */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.primary }]}
                        onPress={() => router.push('/recharge' as any)}
                    >
                        <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                        <Text style={[styles.actionText, { color: colors.primary }]}>Recharger</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.primary }]}
                        onPress={() => router.push('/carte_bancaire' as any)}
                    >
                        <Ionicons name="card-outline" size={24} color={colors.primary} />
                        <Text style={[styles.actionText, { color: colors.primary }]}>Add Card</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.primary }]}
                        onPress={openWithdraw}
                    >
                        <Ionicons name="cash-outline" size={24} color={colors.primary} />
                        <Text style={[styles.actionText, { color: colors.primary }]}>Withdraw</Text>
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={[styles.tabsContainer, { backgroundColor: colors.surface }]}>
                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 'overview' && { backgroundColor: colors.primary }]}
                        onPress={() => setSelectedTab('overview')}
                    >
                        <Text style={[styles.tabText, selectedTab === 'overview' && { color: Colors.white }]}>
                            Aperçu
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 'history' && { backgroundColor: colors.primary }]}
                        onPress={() => setSelectedTab('history')}
                    >
                        <Text style={[styles.tabText, selectedTab === 'history' && { color: Colors.white }]}>
                            Historique
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Content */}
                {selectedTab === 'overview' ? (
                    <View>
                        {/* Stats Card */}
                        <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>CE MOIS</Text>
                                <Text style={[styles.statValuePositive, { color: colors.primary }]}>+450.00 DT</Text>
                                <Text style={[styles.statChange, { color: colors.primary }]}>↑ 12%</Text>
                            </View>
                            <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>DÉPENSES</Text>
                                <Text style={styles.statValueNegative}>-230.80 DT</Text>
                                <Text style={styles.statChangeNegative}>↓ 8%</Text>
                            </View>
                        </View>

                        {/* Recent Transactions */}
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Transactions récentes</Text>
                        <View style={styles.transactionsList}>
                            {viewTransactions.slice(0, 3).map(tx => (
                                <TransactionCard key={tx.id} transaction={tx} colors={colors} />
                            ))}
                        </View>
                    </View>
                ) : (
                    <View>
                        {/* Filters */}
                        <View style={styles.filterRow}>
                            {['Tous', 'Crédits', 'Débits'].map(label => (
                                <TouchableOpacity key={label} style={styles.filterBtn}>
                                    <Text style={styles.filterText}>{label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* All Transactions */}
                        <View style={styles.transactionsList}>
                            {viewTransactions.map(tx => (
                                <TransactionCardFull key={tx.id} transaction={tx} colors={colors} />
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>

            <Modal
                visible={withdrawVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setWithdrawVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}
                    >
                        <TouchableOpacity
                            style={styles.modalClose}
                            onPress={() => setWithdrawVisible(false)}
                        >
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>

                        <View style={styles.biometricIconContainer}>
                            <Ionicons name="cash-outline" size={48} color={colors.primary} />
                        </View>

                        <Text style={[styles.modalTitle, { color: colors.text }]}>Retrait</Text>
                        <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>Saisissez le montant à retirer (MAD).</Text>

                        <TextInput
                            style={[styles.otpInput, { backgroundColor: isDarkMode ? '#2c2c2c' : '#f5f5f5', color: colors.text }]}
                            placeholder="0.00"
                            placeholderTextColor={colors.textSecondary}
                            value={withdrawAmount}
                            onChangeText={setWithdrawAmount}
                            keyboardType="decimal-pad"
                        />

                        <TouchableOpacity
                            style={[styles.biometricBtn, { backgroundColor: colors.primary, opacity: withdrawLoading ? 0.7 : 1 }]}
                            onPress={confirmWithdraw}
                            disabled={withdrawLoading}
                        >
                            {withdrawLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.biometricBtnText}>Confirmer</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                actionLabel={alertConfig.actionLabel}
                onAction={alertConfig.onAction}
                onClose={() => {
                    const action = alertConfig.onAction;
                    setAlertConfig((p) => ({ ...p, visible: false, onAction: undefined }));
                    if (action) action();
                }}
            />

            {/* Biometric Modal */}
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

                                <Text style={[styles.modalTitle, { color: colors.text }]}>Authentification requise</Text>
                                <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
                                    Choisissez une méthode pour afficher le code IBAN complet
                                </Text>

                                <TouchableOpacity style={[styles.biometricBtn, { backgroundColor: colors.primary }]} onPress={handleBiometricAuth}>
                                    <Ionicons name="finger-print-outline" size={20} color="#fff" />
                                    <Text style={styles.biometricBtnText}>Empreinte digitale</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.biometricBtn, { backgroundColor: Colors.white, borderWidth: 1, borderColor: colors.primary }]}
                                    onPress={handleSendOtp}
                                >
                                    {isLoading ? (
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
                                        setError(null);
                                    }}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                />

                                {error && <Text style={styles.errorText}>{error}</Text>}

                                <TouchableOpacity style={styles.biometricBtn} onPress={handleVerifyOtp}>
                                    {isLoading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.biometricBtnText}>Valider</Text>
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

function TransactionCard({ transaction, colors }: any) {
    return (
        <View style={styles.transactionCard}>
            <View
                style={[
                    styles.txIcon,
                    transaction.type === 'credit' ? styles.txIconCredit : styles.txIconDebit,
                ]}
            >
                <Ionicons
                    name={transaction.type === 'credit' ? "arrow-down" : "arrow-up"}
                    size={18}
                    color={transaction.type === 'credit' ? colors.primary : colors.terracotta}
                />
            </View>
            <View style={styles.txDetails}>
                <Text style={[styles.txTitle, { color: colors.text }]}>{transaction.title}</Text>
                <Text style={[styles.txDate, { color: colors.textSecondary }]}>{transaction.date}</Text>
            </View>
            <Text
                style={[
                    styles.txAmount,
                    transaction.type === 'credit' ? { color: colors.primary } : { color: colors.terracotta },
                ]}
            >
                {transaction.amount} DT
            </Text>
        </View>
    );
}

function TransactionCardFull({ transaction, colors }: any) {
    return (
        <View style={styles.transactionCard}>
            <View
                style={[
                    styles.txIcon,
                    transaction.type === 'credit' ? styles.txIconCredit : styles.txIconDebit,
                ]}
            >
                <Ionicons
                    name={transaction.type === 'credit' ? "arrow-down" : "arrow-up"}
                    size={18}
                    color={transaction.type === 'credit' ? colors.primary : colors.terracotta}
                />
            </View>
            <View style={styles.txDetails}>
                <Text style={[styles.txTitle, { color: colors.text }]}>{transaction.title}</Text>
                <Text style={[styles.txDate, { color: colors.textSecondary }]}>{transaction.date}</Text>
            </View>
            <View style={styles.txRight}>
                <Text
                    style={[
                        styles.txAmount,
                        transaction.type === 'credit' ? { color: colors.primary } : { color: colors.terracotta },
                    ]}
                >
                    {transaction.amount} DT
                </Text>
                <View
                    style={[
                        styles.statusPill,
                        transaction.status === 'pending' && styles.statusPillPending,
                    ]}
                >
                    <Text style={styles.statusPillText}>
                        {transaction.status === 'completed' ? 'Complété' : 'En attente'}
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f7f2', // Soft beige/off-white background
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#f8f7f2',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.primary,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },

    // Card Styles
    cardWrapper: {
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
    },
    walletCard: {
        borderRadius: 18,
        padding: 18,
        minHeight: 180,
        overflow: 'hidden',
        position: 'relative',
    },
    cardBg1: {
        position: 'absolute',
        width: 150,
        height: 150,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 150,
        top: -50,
        right: -30,
    },
    cardBg2: {
        position: 'absolute',
        width: 100,
        height: 100,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 100,
        bottom: -20,
        left: 10,
    },
    chipContainer: {
        position: 'absolute',
        top: 16,
        left: 16,
    },
    chip: {
        width: 40,
        height: 28,
        backgroundColor: Colors.gold,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#d97706',
    },
    cardContent: {
        zIndex: 1,
    },
    balanceContainer: {
        marginBottom: 14,
        marginTop: 4,
    },
    balanceLabel: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 10,
        fontWeight: '600',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    balanceAmount: {
        color: Colors.white,
        fontSize: 28,
        fontWeight: '700',
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 12,
    },
    detailLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 8,
        fontWeight: '600',
        marginBottom: 3,
    },
    detailValue: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: '600',
    },
    statusBadge: {
        backgroundColor: 'rgba(226, 114, 91, 0.3)', // Terracotta translucent
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(226, 114, 91, 0.5)',
    },
    statusText: {
        color: Colors.white,
        fontSize: 9,
        fontWeight: '700',
    },
    cardNumberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardNumber: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 1,
        fontFamily: 'monospace',
    },
    eyeBtn: {
        padding: 6,
    },

    // Actions
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 18,
    },
    actionBtn: {
        flex: 1,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.primary, // Changed to width 1 for cleaner look
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: 'center',
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.primary,
    },

    // Tabs
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    tabActive: {
        backgroundColor: Colors.primary,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#999',
    },
    tabTextActive: {
        color: Colors.white,
    },

    // Stats
    statsCard: {
        backgroundColor: Colors.white,
        borderRadius: 14,
        padding: 16,
        flexDirection: 'row',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    statItem: {
        flex: 1,
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(0,0,0,0.08)',
        marginHorizontal: 12,
    },
    statLabel: {
        fontSize: 10,
        color: '#999',
        fontWeight: '600',
        marginBottom: 6,
    },
    statValuePositive: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.primary,
        marginBottom: 3,
    },
    statValueNegative: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ef4444',
        marginBottom: 3,
    },
    statChange: {
        fontSize: 11,
        color: Colors.primary,
        fontWeight: '600',
    },
    statChangeNegative: {
        fontSize: 11,
        color: '#ef4444',
        fontWeight: '600',
    },

    // Section
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 10,
    },

    // Transactions
    transactionsList: {
        gap: 8,
        marginBottom: 24,
    },
    transactionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    txIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    txIconCredit: {
        backgroundColor: 'rgba(44, 95, 45, 0.1)', // Light green
    },
    txIconDebit: {
        backgroundColor: 'rgba(226, 114, 91, 0.1)', // Light terracotta
    },
    txDetails: {
        flex: 1,
    },
    txTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 2,
    },
    txDate: {
        fontSize: 11,
        color: '#999',
    },
    txAmount: {
        fontSize: 13,
        fontWeight: '700',
    },
    amountCredit: {
        color: Colors.primary,
    },
    amountDebit: {
        color: Colors.terracotta,
    },
    txRight: {
        alignItems: 'flex-end',
        gap: 4,
    },
    statusPill: {
        backgroundColor: 'rgba(44, 95, 45, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
    },
    statusPillPending: {
        backgroundColor: 'rgba(249, 115, 22, 0.15)',
    },
    statusPillText: {
        fontSize: 9,
        fontWeight: '600',
        color: Colors.primary,
    },

    // Filters
    filterRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    filterBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 16,
    },
    filterText: {
        color: Colors.white,
        fontSize: 11,
        fontWeight: '600',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalContent: {
        backgroundColor: Colors.white,
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
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    biometricBtn: {
        flexDirection: 'row',
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 12,
        alignItems: 'center',
        gap: 10,
        width: '100%',
        justifyContent: 'center',
        marginBottom: 12,
    },
    biometricBtnText: {
        color: Colors.white,
        fontSize: 15,
        fontWeight: '700',
    },
    cancelText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600',
        paddingVertical: 10,
    },
    otpInput: {
        width: '100%',
        height: 50,
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 20,
        textAlign: 'center',
        fontWeight: '700',
        letterSpacing: 2,
        marginBottom: 16,
        color: '#1f2937',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 12,
        marginBottom: 16,
        textAlign: 'center',
    },
});

