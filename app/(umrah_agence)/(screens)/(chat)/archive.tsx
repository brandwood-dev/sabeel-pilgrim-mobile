import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, StatusBar, StyleSheet, FlatList, TouchableOpacity, Image, Alert, TextInput } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Swipeable } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';

import { createMessagingSocket } from '@/services/messagingSocket';
import { messagingApi } from '@/services/api';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTrans } from '@/hooks/useTrans';
import { RootState } from '@/store/store';
import { getUserAvatarUrl } from '@/services/media';

const PRIMARY_COLOR = '#2C5F2D';
const DIVIDER_COLOR = '#E8E6D0';

type ConversationType = 'pelerin' | 'agence' | 'guide';

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  type: ConversationType;
}

const DEFAULT_AVATAR = require('../../../../assets/images/user1.jpg');

const formatConversationTimestamp = (value: unknown) => {
  if (!value || typeof value !== 'string') return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const getLastMessagePreview = (conversation: any) => {
  const lastMessage = conversation?.lastMessage;
  if (!lastMessage) return 'Aucun message';
  if (lastMessage?.messageType === 'reservation_request') return 'Nouvelle réservation';
  return String(lastMessage?.content || '').trim() || 'Message sans contenu';
};

const extractConversationsPayload = (responseData: any) => {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.conversations)) return responseData.conversations;
  return [];
};

const getConversationType = (conversation: any): ConversationType => {
  const other = Array.isArray(conversation?.participants)
    ? conversation.participants.find((p: any) => p?.role !== 'pelerin')
    : null;
  const normalizedRole = String(
    other?.role ||
    conversation?.participantRole ||
    conversation?.contactRole ||
    conversation?.type ||
    ''
  ).toLowerCase();

  if (normalizedRole.includes('guide')) return 'guide';
  if (
    normalizedRole.includes('agence') ||
    normalizedRole.includes('agency') ||
    normalizedRole.includes('admin') ||
    conversation?.agencyId ||
    conversation?.agencyDisplayName
  ) return 'agence';
  return 'pelerin';
};

const mapConversation = (conversation: any): Conversation => {
  const other = Array.isArray(conversation?.participants)
    ? conversation.participants.find((p: any) => p?.role !== 'pelerin')
    : null;
  const backendType = String(
    other?.role ||
    conversation?.participantRole ||
    conversation?.contactRole ||
    conversation?.type ||
    ''
  ).toLowerCase();
  const resolvedType: ConversationType =
    backendType.includes('guide') ? 'guide'
      : (backendType.includes('agence') || backendType.includes('agency') || Boolean(conversation?.agencyId || conversation?.agencyDisplayName))
        ? 'agence'
        : getConversationType(conversation);

  return {
    id: String(conversation?.id || ''),
    name: String(
      (conversation?.groupId ? (conversation?.groupName || conversation?.name) : null) ||
      conversation?.agencyDisplayName ||
      other?.fullName ||
      other?.name ||
      conversation?.contactName ||
      conversation?.agencyName ||
      conversation?.guideDisplayName ||
      conversation?.guideName ||
      'Conversation'
    ),
    avatar: getUserAvatarUrl(
      (conversation?.groupId ? conversation?.groupImageUrl : null) ||
      conversation?.agencyImageUrl ||
      other?.profileImageUrl ||
      other?.avatar ||
      conversation?.contactImage ||
      conversation?.guideImageUrl
    ),
    lastMessage: String(conversation?.lastMessageText || '').trim() || getLastMessagePreview(conversation),
    timestamp: formatConversationTimestamp(
      conversation?.lastMessageAt ||
      conversation?.lastMessage?.createdAt ||
      conversation?.updatedAt ||
      conversation?.createdAt
    ),
    unreadCount: Number(conversation?.unreadCount || 0),
    type: resolvedType,
  };
};

export default function ArchiveScreen() {
  const { t } = useTrans();
  const router = useRouter();
  const colors = useThemeColors();
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const backgroundColor = isDarkMode ? '#121212' : '#FFFFFF';
  const surfaceColor = isDarkMode ? '#1E1E1E' : '#FFFFFF';
  const textColor = isDarkMode ? '#F5F5F5' : '#333';
  const textSecondaryColor = isDarkMode ? '#AAAAAA' : '#666';
  const borderColor = isDarkMode ? '#333333' : '#E9ECEF';

  useEffect(() => {
    let socketRef: any = null;
    let isMounted = true;

    const loadArchived = async () => {
      try {
        setLoading(true);
        const response = await messagingApi.getArchivedConversations();
        if (!isMounted) return;
        const next = extractConversationsPayload(response.data)
          .map(mapConversation)
          .filter((c: Conversation) => Boolean(c.id));
        setConversations(next);
      } catch (e: any) {
        if (!isMounted) return;
        Alert.alert('Messagerie', e?.response?.data?.message || e?.message || 'Impossible de charger les archives');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const refresh = async () => {
      try {
        const response = await messagingApi.getArchivedConversations();
        if (!isMounted) return;
        const next = extractConversationsPayload(response.data)
          .map(mapConversation)
          .filter((c: Conversation) => Boolean(c.id));
        setConversations(next);
      } catch {}
    };

    const initSocket = async () => {
      try {
        socketRef = await createMessagingSocket();
        socketRef.on('conversation_archived', refresh);
        socketRef.on('conversation_unarchived', refresh);
        socketRef.on('conversation_deleted', refresh);
      } catch (e) {
        // noop
      }
    };

    loadArchived();
    initSocket();

    return () => {
      isMounted = false;
      if (socketRef) socketRef.disconnect();
    };
  }, []);

  const filteredConversations = useMemo(() => conversations.filter((conv) => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    return conv.name.toLowerCase().includes(normalizedSearch) ||
           conv.lastMessage.toLowerCase().includes(normalizedSearch);
  }), [conversations, searchQuery]);

  const getConversationRoleLabel = (type: ConversationType) => {
    if (type === 'guide') return t('Guide');
    if (type === 'agence') return t('Agence');
    return t('Accompagnant');
  };

  const handleUnarchive = async (conversationId: string) => {
    try {
      await messagingApi.unarchiveConversation(conversationId);
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message || e?.message || "Impossible de désarchiver");
    }
  };

  const handleDelete = async (conversationId: string) => {
    Alert.alert(
      t('Supprimer la discussion'),
      t('Cette action est définitive. Voulez-vous continuer ?'),
      [
        { text: t('Annuler'), style: 'cancel' },
        {
          text: t('Supprimer'), style: 'destructive', onPress: async () => {
            try {
              await messagingApi.deleteConversation(conversationId);
              setConversations((prev) => prev.filter((c) => c.id !== conversationId));
            } catch (e: any) {
              Alert.alert('Erreur', e?.response?.data?.message || e?.message || 'Suppression impossible');
            }
          }
        }
      ]
    );
  };

  const handleOpen = async (conversation: Conversation) => {
    try {
      await messagingApi.unarchiveConversation(conversation.id);
    } catch {}
    router.push({
      pathname: '/(umrah_agence)/(screens)/(chat)/chat_pelerin' as any,
      params: {
        conversationId: conversation.id,
        contactName: conversation.name,
        contactImage: conversation.avatar,
        type: conversation.type,
      }
    });
  };

  const renderRightActions = (id: string) => (
    <View style={styles.swipeActions}>
      <TouchableOpacity style={[styles.swipeButton, { backgroundColor: '#6B7280' }]} onPress={() => handleUnarchive(id)}>
        <Ionicons name="archive-outline" size={22} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.swipeButton, { backgroundColor: '#EF4444' }]} onPress={() => handleDelete(id)}>
        <Ionicons name="trash-outline" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }: { item: Conversation }) => (
    <Swipeable renderRightActions={() => renderRightActions(item.id)}>
      <TouchableOpacity
        style={[styles.chatCard, { backgroundColor: surfaceColor }]}
        onPress={() => handleOpen(item)}
        activeOpacity={0.7}
      >
        <View style={styles.photoContainer}>
          <Image source={item.avatar ? { uri: item.avatar } : DEFAULT_AVATAR} style={[styles.chatPhoto, { backgroundColor: colors.divider }]} />
        </View>
        <View style={styles.chatDetails}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatName, { color: textColor }]} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.chatTime, { color: textSecondaryColor }]}>{item.timestamp}</Text>
          </View>
          <Text style={[styles.lastMessage, { color: textSecondaryColor }]} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          <View style={styles.chatFooter}>
            <View style={[styles.typeBadge, { backgroundColor: `${PRIMARY_COLOR}12` }]}> 
              <Ionicons
                name={item.type === 'guide' ? 'location-outline' : item.type === 'agence' ? 'business-outline' : 'person-outline'}
                size={12}
                color={colors.primary}
              />
              <Text style={[styles.typeBadgeText, { color: colors.primary }]}>{getConversationRoleLabel(item.type)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={backgroundColor} />
      <SafeAreaView style={[styles.container, { backgroundColor }]}> 
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.headerActionButton} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>{t('Archives')}</Text>
          <View style={styles.headerActionButton} />
        </View>

        <View style={styles.searchWrapper}>
          <View style={[styles.searchBar, { backgroundColor: isDarkMode ? '#2D2D2D' : '#F8F9FA', borderColor }]}> 
            <Ionicons name="search-outline" size={20} color={textSecondaryColor} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder={t('Rechercher une discussion archivée...')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={textSecondaryColor}
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={{ color: textSecondaryColor }}>{t('Chargement...')}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            renderItem={renderItem}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="archive-outline" size={64} color={colors.divider} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('Aucune discussion archivée')}</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  headerActionButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  searchWrapper: { paddingHorizontal: 24, marginBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, height: 44, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  chatCard: { flexDirection: 'row', padding: 10, borderRadius: 16, marginBottom: 6 },
  photoContainer: { position: 'relative' },
  chatPhoto: { width: 48, height: 48, borderRadius: 24, backgroundColor: DIVIDER_COLOR },
  chatDetails: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  chatName: { fontSize: 15, fontWeight: 'bold', flex: 1, marginRight: 10 },
  chatTime: { fontSize: 11 },
  chatFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  lastMessage: { flex: 1, fontSize: 13, marginTop: 2 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  typeBadgeText: { fontSize: 10, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  swipeActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, paddingHorizontal: 12 },
  swipeButton: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginVertical: 4 },
});
