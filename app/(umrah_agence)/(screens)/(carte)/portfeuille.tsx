import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTrans } from '@/hooks/useTrans';
import { walletApi } from '@/services/api';
import { CustomAlert } from '@/components/ui/CustomAlert';
import { useFocusEffect } from 'expo-router';

type Wallet = {
  id: string;
  currency: string;
  availableBalance: number;
  pendingBalance: number;
};

type Tx = {
  id: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
  fromWalletId?: string | null;
  toWalletId?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  stripeObjectType?: string | null;
  stripeObjectId?: string | null;
  stripeEventId?: string | null;
  metadata?: any;
};

const formatMoney = (amountCents?: number, currency?: string) => {
  const amount = typeof amountCents === 'number' ? amountCents : 0;
  const cur = String(currency || 'TND').toUpperCase();
  const divisor = cur === 'TND' ? 1000 : 100;
  return `${(amount / divisor).toFixed(2)} ${cur}`;
};

const formatDate = (value?: string) => {
  if (!value) return '';
  const ms = Date.parse(String(value));
  if (!Number.isFinite(ms)) return String(value);
  return new Date(ms).toLocaleDateString();
};

const isIncoming = (tx: Tx, walletId?: string) => {
  if (!walletId) return false;
  return String(tx.toWalletId || '') === String(walletId);
};

const shortTypeLabel = (txType: string) => {
  const t = String(txType || '').toUpperCase();
  if (t.includes('WITHDRAWAL')) return 'Retrait';
  if (t.includes('EARNING')) return 'Revenu';
  if (t.includes('PAYMENT')) return 'Paiement';
  if (t.includes('TOPUP')) return 'Recharge';
  if (t.includes('REFUND')) return 'Remboursement';
  if (t.includes('COMMISSION')) return 'Commission';
  return t || 'Transaction';
};

const buildIdempotencyKey = () => {
  return `mob-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export default function PortfeuilleScreen() {
  const { t } = useTrans();
  const colors = useThemeColors() as any;
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txPreview, setTxPreview] = useState<Tx[]>([]);

  const [hasCard, setHasCard] = useState(false);
  const [cardDetailsVisible, setCardDetailsVisible] = useState(false);

  const [withdrawSheetVisible, setWithdrawSheetVisible] = useState(false);
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

  const load = async () => {
    try {
      const [meRes, txRes] = await Promise.all([
        walletApi.getMe(),
        walletApi.listTransactions({ limit: 5, offset: 0 }),
      ]);

      const w = meRes?.data?.wallet || null;
      setWallet(w);

      const items = Array.isArray(txRes?.data?.items) ? txRes.data.items : [];
      setTxPreview(items);

      const hasTopup = items.some(
        (t: Tx) =>
          String(t.type).toUpperCase().includes('TOPUP') &&
          String(t.status).toUpperCase() === 'SUCCEEDED'
      );
      setHasCard(hasTopup);
    } catch (e: any) {
      setAlertConfig({
        visible: true,
        title: t('Erreur'),
        message: typeof e === 'string' ? e : t('Impossible de charger le wallet.'),
        type: 'error',
        actionLabel: "D'accord",
        onAction: undefined,
      });
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        await load();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const headerBalance = useMemo(() => {
    const available = wallet?.availableBalance || 0;
    const pending = wallet?.pendingBalance || 0;
    return {
      availableText: formatMoney(available, wallet?.currency),
      pendingText: formatMoney(pending, wallet?.currency),
    };
  }, [wallet?.availableBalance, wallet?.pendingBalance, wallet?.currency]);

  const openWithdraw = () => {
    const available = wallet?.availableBalance || 0;
    if (available <= 0) {
      setAlertConfig({
        visible: true,
        title: t('Solde insuffisant'),
        message: t('Votre solde disponible est de 0 TND.'),
        type: 'warning',
        actionLabel: "D'accord",
        onAction: undefined,
      });
      return;
    }
    setWithdrawAmount('');
    setWithdrawSheetVisible(true);
  };

  const confirmWithdraw = async () => {
    const amountTND = Number(String(withdrawAmount || '').replace(',', '.'));
    if (!Number.isFinite(amountTND) || amountTND <= 0) {
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

    const amountCents = Math.floor(amountTND * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
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

    const available = wallet?.availableBalance || 0;
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

    setAlertConfig({
      visible: true,
      title: t('Confirmer le retrait'),
      message: `${t('Voulez-vous retirer')} ${formatMoney(amountCents, wallet?.currency)} ? ${t('Le traitement peut prendre jusqu\'à 48h.')}`,
      type: 'warning',
      actionLabel: t('Confirmer'),
      onAction: async () => {
        setWithdrawLoading(true);
        try {
          await walletApi.requestWithdrawal({
            amountCents,
            idempotencyKey: buildIdempotencyKey(),
          });

          setWithdrawSheetVisible(false);
          setAlertConfig({
            visible: true,
            title: t('Demande envoyée'),
            message: t('Votre demande de retrait a été envoyée. Traitement sous 48h max.'),
            type: 'success',
            actionLabel: "D'accord",
            onAction: undefined,
          });

          await load();
        } catch (e: any) {
          setAlertConfig({
            visible: true,
            title: t('Erreur'),
            message: typeof e === 'string' ? e : t('Impossible de demander le retrait.'),
            type: 'error',
            actionLabel: "D'accord",
            onAction: undefined,
          });
        } finally {
          setWithdrawLoading(false);
        }
      },
    });
  };

  const renderTx = ({ item }: { item: Tx }) => {
    const incoming = isIncoming(item, wallet?.id);
    const amountText = formatMoney(item.amount, item.currency);
    const sign = incoming ? '+' : '-';
    const txColor = incoming ? colors.primary : '#EF4444';

    return (
      <TouchableOpacity
        style={[styles.txItem, { backgroundColor: colors.surface }]}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.txIconWrap,
            {
              backgroundColor: incoming
                ? 'rgba(76, 175, 80, 0.12)'
                : 'rgba(239, 68, 68, 0.12)',
            },
          ]}
        >
          <Ionicons
            name={incoming ? 'arrow-down' : 'arrow-up'}
            size={18}
            color={txColor}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.txTitle, { color: colors.text }]}>
            {shortTypeLabel(item.type)}
          </Text>
          <Text style={[styles.txSub, { color: colors.textSecondary }]}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.txAmount, { color: txColor }]}>
            {sign} {amountText}
          </Text>
          <Text
            style={[
              styles.txStatus,
              { color: colors.textSecondary },
            ]}
          >
            {String(item.status || '').toLowerCase()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('Portefeuille')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.centerText, { color: colors.textSecondary }]}>
            {t('Chargement...')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={txPreview}
          keyExtractor={(it) => String(it?.id || Math.random())}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={{
            padding: 18,
            paddingBottom: 28 + insets.bottom,
          }}
          ListHeaderComponent={
            <View>
              <View
                style={[
                  styles.walletCard,
                  { backgroundColor: colors.surface },
                ]}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View>
                    <Text
                      style={[
                        styles.walletLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {t('Solde disponible')}
                    </Text>
                    <Text
                      style={[
                        styles.walletBalance,
                        { color: colors.text },
                      ]}
                    >
                      {headerBalance.availableText}
                    </Text>
                    <Text
                      style={[
                        styles.walletPending,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {t('En attente')}: {headerBalance.pendingText}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: 'rgba(76, 175, 80, 0.15)',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: colors.text },
                      ]}
                    >
                      {t('Actif')}
                    </Text>
                  </View>
                </View>

                <View style={styles.walletActionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={() => {
                      if (hasCard) {
                        setCardDetailsVisible(true);
                        return;
                      }
                      router.push('/carte_bancaire' as any);
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="card-outline" size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>
                      {hasCard ? t('Card liée') : t('Ajouter carte')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      { backgroundColor: '#EF4444' },
                    ]}
                    onPress={openWithdraw}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="cash-outline" size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>{t('Retirer')}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.sectionHeader}>
                <Text
                  style={[styles.sectionTitle, { color: colors.text }]}
                >
                  {t('Transactions')}
                </Text>
                <TouchableOpacity activeOpacity={0.8}>
                  <Text
                    style={[
                      styles.sectionAction,
                      { color: colors.primary },
                    ]}
                  >
                    {t('Voir tout')}
                  </Text>
                </TouchableOpacity>
              </View>

              {txPreview.length === 0 ? (
                <View
                  style={[
                    styles.emptyCard,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Ionicons
                    name="receipt-outline"
                    size={34}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[styles.emptyTitle, { color: colors.text }]}
                  >
                    {t('Aucune transaction')}
                  </Text>
                  <Text
                    style={[
                      styles.emptySub,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t('Vos revenus, retraits et mouvements apparaîtront ici.')}
                  </Text>
                </View>
              ) : null}
            </View>
          }
          renderItem={renderTx}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={cardDetailsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCardDetailsVisible(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setCardDetailsVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                paddingBottom: insets.bottom + 20,
              },
            ]}
            onPress={() => {}}
          >
            <View
              style={[
                styles.sheetHandle,
                { backgroundColor: '#E5E7EB' },
              ]}
            />
            <TouchableOpacity
              style={styles.sheetClose}
              onPress={() => setCardDetailsVisible(false)}
            >
              <Ionicons
                name="close"
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <Text
              style={[styles.sheetTitle, { color: colors.text }]}
            >
              {t('Carte bancaire')}
            </Text>
            <Text
              style={[styles.sheetSub, { color: colors.textSecondary }]}
            >
              {t('Votre carte est liée pour les recharges.')}
            </Text>

            <TouchableOpacity
              style={[
                styles.primaryCta,
                { backgroundColor: colors.primary, marginTop: 6 },
              ]}
              onPress={() => {
                setCardDetailsVisible(false);
                router.push('/carte_bancaire' as any);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryCtaText}>{t('Nouvelle recharge')}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={withdrawSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWithdrawSheetVisible(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setWithdrawSheetVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                paddingBottom: insets.bottom + 20,
              },
            ]}
          >
            <View
              style={[
                styles.sheetHandle,
                { backgroundColor: '#E5E7EB' },
              ]}
            />
            <TouchableOpacity
              style={styles.sheetClose}
              onPress={() => setWithdrawSheetVisible(false)}
            >
              <Ionicons
                name="close"
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <Text
              style={[styles.sheetTitle, { color: colors.text }]}
            >
              {t('Retrait')}
            </Text>
            <Text
              style={[styles.sheetSub, { color: colors.textSecondary }]}
            >
              {t('Entrez le montant à retirer (TND). Traitement sous 48h max.')}
            </Text>

            <View
              style={[
                styles.inputWrap,
                { borderColor: colors.border || '#E5E7EB' },
              ]}
            >
              <Text
                style={[
                  styles.inputPrefix,
                  { color: colors.text },
                ]}
              >
                TND
              </Text>
              <TextInput
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                style={[
                  styles.amountInput,
                  { color: colors.text },
                ]}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.primaryCta,
                {
                  backgroundColor: colors.primary,
                  opacity: withdrawLoading ? 0.7 : 1,
                },
              ]}
              onPress={confirmWithdraw}
              disabled={withdrawLoading}
            >
              {withdrawLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryCtaText}>
                  Confirmer le retrait
                </Text>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
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
          setAlertConfig((p) => ({
            ...p,
            visible: false,
            onAction: undefined,
          }));
          if (action) action();
        }}
      />
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
    paddingBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1f2937',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  centerText: {
    fontWeight: '700',
  },
  walletCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 5 },
    }),
  },
  walletLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  walletBalance: {
    fontSize: 26,
    fontWeight: '900',
    marginTop: 6,
  },
  walletPending: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '800',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  walletActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  sectionAction: {
    fontSize: 12,
    fontWeight: '900',
  },
  emptyCard: {
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  emptySub: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  txItem: {
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  txIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  txSub: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '800',
  },
  txAmount: {
    fontSize: 13,
    fontWeight: '900',
  },
  txStatus: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetClose: {
    position: 'absolute',
    top: 14,
    right: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 6,
  },
  sheetSub: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 14,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 14,
  },
  inputPrefix: {
    fontSize: 14,
    fontWeight: '900',
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
  },
  primaryCta: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
});
