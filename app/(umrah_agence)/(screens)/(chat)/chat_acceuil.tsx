import { createMessagingSocket } from '@/services/messagingSocket';
import { messagingApi } from '@/services/api';
import { SERVER_BASE_URL } from '@/services/api';
import { useThemeColors } from '@/hooks/useThemeColors';
import { RootState } from '@/store/store';
import { presentLocalMessageNotification } from '@/services/localNotifications';
import { setUnreadMessagesCount } from '@/store/uiSlice';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    InteractionManager,
    Platform,
    ScrollView,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Modal,
    KeyboardAvoidingView,
    Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useDrawer } from '@/context/DrawerContext';
import { useTrans } from '@/hooks/useTrans';
import { useFocusEffect } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import AssistantChat from '../assistant';
import GreenDotsLoader from '@/components/common/GreenDotsLoader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserAvatarUrl } from '@/services/media';

const CONVERSATIONS_CACHE_KEY = '@conversations_cache_v2';

const PRIMARY_COLOR = '#2C5F2D';
const DIVIDER_COLOR = '#E8E6D0';

type ConversationType = 'pelerin' | 'agence' | 'guide';
type FilterType = 'all' | 'agence' | 'guide' | 'accompagnant';

interface Conversation {
    id: string;
    name: string;
    avatar: string;
    lastMessage: string;
    timestamp: string;
    sortTs: number;
    unreadCount: number;
    type: ConversationType;
}

const DEFAULT_AVATAR = require('../../../../assets/images/user1.jpg');

const getConversationType = (conversation: any): ConversationType => {
    const otherParticipant = Array.isArray(conversation?.participants)
        ? conversation.participants.find((participant: any) => participant?.role !== 'pelerin')
        : null;
    const normalizedRole = String(
        otherParticipant?.role ||
        conversation?.participantRole ||
        conversation?.contactRole ||
        conversation?.type ||
        ''
    ).toLowerCase();

    if (normalizedRole.includes('guide') || conversation?.guideId || conversation?.guideDisplayName) {
        return 'guide';
    }

    if (
        normalizedRole.includes('agence') ||
        normalizedRole.includes('agency') ||
        normalizedRole.includes('admin') ||
        conversation?.agencyId ||
        conversation?.agencyDisplayName
    ) {
        return 'agence';
    }

    return 'pelerin';
};


const formatConversationTimestamp = (value: unknown) => {
    if (!value || typeof value !== 'string') {
        return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const getConversationSortTs = (conversation: any) => {
    const raw =
        conversation?.lastMessageAt ||
        conversation?.lastMessage?.createdAt ||
        conversation?.updatedAt ||
        conversation?.createdAt ||
        null;
    const ms = raw ? Date.parse(String(raw)) : NaN;
    return Number.isFinite(ms) ? ms : 0;
};

const getLastMessagePreview = (conversation: any) => {
    const lastMessage = conversation?.lastMessage;

    if (!lastMessage) {
        return 'Aucun message';
    }

    if (lastMessage?.messageType === 'reservation_request') {
        return 'Nouvelle réservation';
    }

    return String(lastMessage?.content || '').trim() || 'Message sans contenu';
};

const extractConversationsPayload = (responseData: any) => {
    if (Array.isArray(responseData)) {
        return responseData;
    }

    if (Array.isArray(responseData?.conversations)) {
        return responseData.conversations;
    }

    return [];
};

const mapConversation = (conversation: any): Conversation => {
    const otherParticipant = Array.isArray(conversation?.participants)
        ? conversation.participants.find((participant: any) => participant?.role !== 'pelerin')
        : null;
    const backendType = String(
        otherParticipant?.role ||
        conversation?.participantRole ||
        conversation?.contactRole ||
        conversation?.type ||
        ''
    ).toLowerCase();
    const isGroupConversation = Boolean(conversation?.groupId || conversation?.freelanceGroupId) && !conversation?.pilgrimUserId;
    const isGuidePilgrimDm = Boolean(conversation?.guideId) && Boolean(conversation?.pilgrimUserId);
    const isAgencyConversation = Boolean(conversation?.agencyId || conversation?.agencyDisplayName) || backendType.includes('agence') || backendType.includes('agency');

    const resolvedType: ConversationType =
        isGroupConversation
            ? 'guide'
            : isGuidePilgrimDm
                ? 'guide'
                : isAgencyConversation
                    ? 'agence'
                    : backendType.includes('guide') || Boolean(conversation?.guideId || conversation?.guideDisplayName)
                        ? 'guide'
                        : getConversationType(conversation);

    const avatarCandidate = isGroupConversation
        ? (conversation?.groupImageUrl || conversation?.packImageUrl || '')
        : resolvedType === 'guide'
            ? (conversation?.guideImageUrl || otherParticipant?.profileImageUrl || otherParticipant?.avatar || conversation?.contactImage)
            : resolvedType === 'agence'
                ? (conversation?.agencyImageUrl || otherParticipant?.profileImageUrl || otherParticipant?.avatar || conversation?.contactImage)
                : (otherParticipant?.profileImageUrl || otherParticipant?.avatar || conversation?.contactImage);

    return {
        id: String(conversation?.id || ''),
        name: String(
            (isGroupConversation ? (conversation?.groupName || conversation?.name) : null) ||
            conversation?.agencyDisplayName ||
            otherParticipant?.fullName ||
            otherParticipant?.name ||
            conversation?.contactName ||
            conversation?.agencyName ||
            conversation?.guideDisplayName ||
            conversation?.guideName ||
            'Conversation'
        ),
        avatar: getUserAvatarUrl(avatarCandidate),
        lastMessage: String(conversation?.lastMessageText || '').trim() || getLastMessagePreview(conversation),
        timestamp: formatConversationTimestamp(
            conversation?.lastMessageAt ||
            conversation?.lastMessage?.createdAt ||
            conversation?.updatedAt ||
            conversation?.createdAt
        ),
        sortTs: getConversationSortTs(conversation),
        unreadCount: Number(conversation?.unreadCount || 0),
        type: resolvedType,
    };
};

const dedupeConversationsById = (items: Conversation[]) => {
    const seen = new Set<string>();
    return items.filter((item) => {
        const id = String(item?.id || '');
        if (!id) return false;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
    });
};

export default function ChatScreen() {
    const { t } = useTrans();
    const router = useRouter();
    const { openDrawer } = useDrawer();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const user = useSelector((state: RootState) => state.auth.user);
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState<FilterType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
    const [assistantModal, setAssistantModal] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{
        visible: boolean;
        type: 'archive' | 'delete';
        conversationId: string;
    }>({ visible: false, type: 'archive', conversationId: '' });

    const backgroundColor = isDarkMode ? '#121212' : '#FFFFFF';
    const surfaceColor = isDarkMode ? '#1E1E1E' : '#FFFFFF';
    const textColor = isDarkMode ? '#F5F5F5' : '#333';
    const textSecondaryColor = isDarkMode ? '#AAAAAA' : '#666';
    const borderColor = isDarkMode ? '#333333' : '#E9ECEF';
    const inputBackgroundColor = isDarkMode ? '#2D2D2D' : '#F8F9FA';
    const firstName = user?.firstName || 'U';
    const lastName = user?.lastName || '';
    const fallbackAvatar = `https://api.dicebear.com/7.x/initials/png?seed=${firstName}+${lastName}&backgroundColor=2C5F2D&textColor=ffffff`;
    const userAvatar = getUserAvatarUrl(user?.photo) || fallbackAvatar;

    const saveToCache = async (data: Conversation[]) => {
        try {
            await AsyncStorage.setItem(CONVERSATIONS_CACHE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Error saving conversations to cache', e);
        }
    };

    const loadFromCache = async () => {
        try {
            const cached = await AsyncStorage.getItem(CONVERSATIONS_CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                const list = Array.isArray(parsed) ? parsed : [];
                list.sort((a: any, b: any) => (Number(b?.sortTs) || 0) - (Number(a?.sortTs) || 0));
                setConversations(list);
                setLoading(false); // If we have cache, we might want to still refresh but show content
            }
        } catch (e) {
            console.error('Error loading conversations from cache', e);
        }
    };

    useEffect(() => {
        let socketRef: any = null;
        let isMounted = true;

        const syncGlobalUnread = (items: Conversation[]) => {
            const total = items.reduce((acc, c) => acc + (Number(c?.unreadCount) || 0), 0);
            dispatch(setUnreadMessagesCount(total));
        };

        const loadConversations = async () => {
            try {
                if (conversations.length === 0) {
                    // Start showing cached data ASAP (don't block on network)
                    loadFromCache();
                    setLoading(true);
                }
                const response = await messagingApi.getMyConversations();
                if (!isMounted) {
                    return;
                }

                const nextConversations = extractConversationsPayload(response.data)
                    .map(mapConversation)
                    .filter((item: Conversation) => Boolean(item.id));

                nextConversations.sort((a: any, b: any) => (Number(b?.sortTs) || 0) - (Number(a?.sortTs) || 0));

                const uniqueConversations = dedupeConversationsById(nextConversations);

                setConversations(uniqueConversations);
                saveToCache(uniqueConversations);
                syncGlobalUnread(uniqueConversations);
            } catch (error: any) {
                if (!isMounted) {
                    return;
                }

                console.error('[ChatAccueil] failed to load conversations', {
                    message: error?.message,
                    code: error?.code,
                    baseUrl: SERVER_BASE_URL,
                    url: error?.config?.url,
                    method: error?.config?.method,
                    status: error?.response?.status,
                    data: error?.response?.data,
                });
                Alert.alert(
                    'Messagerie indisponible',
                    error?.response?.data?.message || error?.message || 'Impossible de charger les conversations.'
                );
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        const initSocket = async () => {
            try {
                socketRef = await createMessagingSocket();

                const refreshConversations = async () => {
                    try {
                        const response = await messagingApi.getMyConversations();
                        if (!isMounted) {
                            return;
                        }

                        const nextConversations = extractConversationsPayload(response.data)
                            .map(mapConversation)
                            .filter((item: Conversation) => Boolean(item.id));

                        nextConversations.sort((a: any, b: any) => (Number(b?.sortTs) || 0) - (Number(a?.sortTs) || 0));

                        const uniqueConversations = dedupeConversationsById(nextConversations);

                        setConversations(uniqueConversations);
                        syncGlobalUnread(uniqueConversations);
                        saveToCache(uniqueConversations);
                    } catch (error) {
                        console.error('[ChatAccueil] failed to refresh conversations', {
                            message: (error as any)?.message,
                            code: (error as any)?.code,
                            baseUrl: SERVER_BASE_URL,
                            url: (error as any)?.config?.url,
                            method: (error as any)?.config?.method,
                            status: (error as any)?.response?.status,
                            data: (error as any)?.response?.data,
                        });
                    }
                };

                socketRef.on('message_created', (payload: any) => {
                    if (!payload?.conversation?.id || !payload?.message) {
                        return;
                    }
                    const convId = String(payload.conversation.id);
                    const senderId = payload?.message?.senderUserId;
                    // Skip local notification/unread bump for own messages
                    if (senderId && senderId === user?.id) {
                        refreshConversations();
                        return;
                    }

                    setUnreadMap((prev) => ({
                        ...prev,
                        [convId]: (prev[convId] || 0) + 1,
                    }));

                    const title =
                        payload?.conversation?.groupName ||
                        payload?.conversation?.agencyDisplayName ||
                        payload?.conversation?.guideDisplayName ||
                        t('Nouveau message');
                    const body = payload?.message?.content || t('Vous avez reçu un message');
                    presentLocalMessageNotification({ title, body, data: { conversationId: convId } }).catch(() => {});

                    refreshConversations();
                });
                socketRef.on('reservation_updated', refreshConversations);
                socketRef.on('conversation_created', refreshConversations);
                socketRef.on('conversation_archived', refreshConversations);
                socketRef.on('conversation_unarchived', refreshConversations);
                socketRef.on('conversation_deleted', refreshConversations);
                socketRef.on('reservation_created', refreshConversations);
            } catch (error) {
                console.error('[ChatAccueil] socket init failed', error);
            }
        };

        loadConversations();
        initSocket();

        return () => {
            isMounted = false;
            if (socketRef) {
                socketRef.disconnect();
            }
        };
    }, []);

    // Also refresh when screen regains focus (e.g., returning from reservation or chat)
    useFocusEffect(
        React.useCallback(() => {
            let isActive = true;
            const fetchOnFocus = async () => {
                try {
                    const response = await messagingApi.getMyConversations();
                    if (!isActive) return;
                    const nextConversations = extractConversationsPayload(response.data)
                        .map(mapConversation)
                        .filter((item: Conversation) => Boolean(item.id));

                    nextConversations.sort((a: any, b: any) => (Number(b?.sortTs) || 0) - (Number(a?.sortTs) || 0));

                    const uniqueConversations = dedupeConversationsById(nextConversations);
                    setConversations(uniqueConversations);
                    const total = uniqueConversations.reduce((acc: number, c: Conversation) => acc + (Number(c?.unreadCount) || 0), 0);
                    dispatch(setUnreadMessagesCount(total));
                    saveToCache(uniqueConversations);
                } catch (e) {
                    // noop
                }
            };
            fetchOnFocus();
            return () => { isActive = false; };
        }, [dispatch])
    );

    const filteredConversations = useMemo(() => {
        return conversations
            .filter((conv) => {
                const normalizedSearch = searchQuery.trim().toLowerCase();
                const matchesSearch =
                    conv.name.toLowerCase().includes(normalizedSearch) ||
                    conv.lastMessage.toLowerCase().includes(normalizedSearch);
                const matchesFilter =
                    activeTab === 'all' ||
                    (activeTab === 'agence' && conv.type === 'agence') ||
                    (activeTab === 'guide' && conv.type === 'guide') ||
                    (activeTab === 'accompagnant' && conv.type === 'pelerin');
                return matchesSearch && matchesFilter;
            })
            .sort((a: any, b: any) => (Number(b?.sortTs) || 0) - (Number(a?.sortTs) || 0));
    }, [conversations, searchQuery, activeTab]);

    const handleConversationPress = (conversationId: string) => {
        const conversation = conversations.find(conv => conv.id === conversationId);
        if (conversation) {
            router.push({
                pathname: '/(umrah_agence)/(screens)/(chat)/chat_pelerin' as any,
                params: {
                    conversationId: conversation.id,
                    contactName: conversation.name,
                    contactImage: conversation.avatar || '',
                    type: conversation.type,
                }
            });

            InteractionManager.runAfterInteractions(() => {
                setUnreadMap((prev) => ({ ...prev, [conversationId]: 0 }));

                const convUnread = (unreadMap[conversationId] || 0) + (conversation.unreadCount || 0);
                if (convUnread > 0) {
                    const total = conversations.reduce(
                        (acc: number, c: Conversation) => acc + (Number(c?.unreadCount) || 0),
                        0,
                    );
                    dispatch(setUnreadMessagesCount(Math.max(0, total - convUnread)));
                }
            });
        }
    };

    const getFilterLabel = (tab: FilterType | ConversationType) => {
        if (tab === 'all') {
            return t('Tous');
        }
        if (tab === 'accompagnant' || tab === 'pelerin') {
            return t('Accompagnant');
        }

        if (tab === 'guide') {
            return t('Guide');
        }

        return t('Agence');
    };

    const getConversationRoleLabel = (type: ConversationType) => {
        if (type === 'guide') {
            return t('Guide');
        }

        if (type === 'agence') {
            return t('Agence');
        }

        return t('Accompagnant');
    };

    const filters: FilterType[] = ['all', 'agence', 'guide', 'accompagnant'];

    const handleArchive = (conversationId: string) => {
        setConfirmModal({ visible: true, type: 'archive', conversationId });
    };

    const handleDelete = (conversationId: string) => {
        setConfirmModal({ visible: true, type: 'delete', conversationId });
    };

    const executeConfirmAction = async () => {
        const { type, conversationId } = confirmModal;
        setConfirmModal({ visible: false, type, conversationId: '' });

        try {
            if (type === 'archive') {
                await messagingApi.archiveConversation(conversationId);
            } else {
                await messagingApi.deleteConversation(conversationId);
            }

            setConversations((prev) => prev.filter((c) => c.id !== conversationId));
            setUnreadMap((prev) => ({ ...prev, [conversationId]: 0 }));
        } catch (e: any) {
            Alert.alert(t('Erreur'), e?.response?.data?.message || e?.message || t("L'action a échoué"));
        }
    };

    const renderRightActions = (id: string) => (
        <View style={styles.swipeActions}>
            <TouchableOpacity style={[styles.swipeButton, { backgroundColor: '#6B7280' }]} onPress={() => handleArchive(id)}>
                <Ionicons name="archive-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.swipeButton, { backgroundColor: '#EF4444' }]} onPress={() => handleDelete(id)}>
                <Ionicons name="trash-outline" size={22} color="#fff" />
            </TouchableOpacity>
        </View>
    );

    const renderConversationSwipe = ({ item }: { item: Conversation }) => {
        const displayUnread = (unreadMap[item.id] || 0) + (item.unreadCount || 0);
        return (
            <Swipeable renderRightActions={() => renderRightActions(item.id)}>
                <TouchableOpacity
                    style={[styles.chatCard, { backgroundColor: surfaceColor }]}
                    onPress={() => handleConversationPress(item.id)}
                    activeOpacity={0.7}
                >
                    <View style={styles.photoContainer}>
                        <Image 
                            source={item.avatar ? { uri: item.avatar } : DEFAULT_AVATAR} 
                            style={[styles.chatPhoto, { backgroundColor: colors.divider }]} 
                            onError={() => {
                                console.log('[Chat] avatar load failed', { conversationId: item.id, avatar: item.avatar });
                            }}
                        />
                        {displayUnread > 0 && <View style={[styles.onlineBadge, { borderColor: surfaceColor }]} />}
                    </View>
                    <View style={styles.chatDetails}>
                        <View style={styles.chatHeader}>
                            <Text style={[styles.chatName, { color: textColor }]} numberOfLines={1}>{item.name}</Text>
                            <Text style={[styles.chatTime, { color: textSecondaryColor }]}>{item.timestamp}</Text>
                        </View>
                        <Text
                            style={[
                                styles.lastMessage,
                                { color: textSecondaryColor },
                                displayUnread > 0 && styles.unreadMessage,
                            ]}
                            numberOfLines={1}
                        >
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
                            {displayUnread > 0 ? (
                                <View style={styles.unreadBadge}>
                                    <Text style={styles.unreadCount}>{displayUnread > 99 ? '99+' : displayUnread}</Text>
                                </View>
                            ) : null}
                        </View>
                    </View>
                </TouchableOpacity>
            </Swipeable>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: backgroundColor }}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={backgroundColor} />
            <SafeAreaView style={[styles.container, { backgroundColor: backgroundColor }]}> 
                <View style={styles.topHeader}>
                    <TouchableOpacity style={[styles.headerAvatarButton, { borderColor: colors.primary }]} onPress={openDrawer} activeOpacity={0.7}>
                        <Image source={{ uri: userAvatar }} style={styles.headerAvatar} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: textColor }]}>{t('Messages')}</Text>
                    <TouchableOpacity style={styles.headerActionButton} onPress={() => router.push('/(umrah_agence)/(screens)/(chat)/archive' as any)} activeOpacity={0.7}>
                        <Ionicons name="archive-outline" size={22} color={textColor} />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchWrapper}>
                    <View style={[styles.searchBar, { backgroundColor: inputBackgroundColor, borderColor }]}> 
                        <Ionicons name="search-outline" size={20} color={textSecondaryColor} />
                        <TextInput
                            style={[styles.searchInput, { color: textColor }]}
                            placeholder={t('Rechercher une conversation...')}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor={textSecondaryColor}
                        />
                    </View>
                </View>

                <View style={[styles.filterWrapper, { backgroundColor }]}> 
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.filterScroll}
                        contentContainerStyle={styles.filterContent}
                    >
                        {filters.map((filter) => (
                            <TouchableOpacity
                                key={filter}
                                style={[
                                    styles.filterChip,
                                    { backgroundColor: isDarkMode ? '#252525' : '#F1F3F5', borderColor },
                                    activeTab === filter && { backgroundColor: colors.primary, borderColor: colors.primary },
                                ]}
                                onPress={() => setActiveTab(filter)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    { color: isDarkMode ? '#D1D5DB' : textSecondaryColor },
                                    activeTab === filter && styles.activeFilterChipText,
                                ]}>
                                    {getFilterLabel(filter)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {loading && conversations.length === 0 ? (
                    <View style={styles.loadingContainer}>
                        <GreenDotsLoader fullScreen={false} />
                    </View>
                ) : (
                <FlatList
                    data={filteredConversations}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    renderItem={renderConversationSwipe}
                    initialNumToRender={12}
                    maxToRenderPerBatch={12}
                    windowSize={7}
                    removeClippedSubviews={Platform.OS === 'android'}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubbles-outline" size={64} color={colors.divider} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('Aucune conversation')}</Text>
                            <Text style={[styles.emptySubtext, { color: textSecondaryColor }]}>
                                {t('Vos conversations apparaîtront ici')}
                            </Text>
                        </View>
                    }
                />
                )}
            </SafeAreaView>
            
            {/* Assistant FAB */}
            <TouchableOpacity
                style={[styles.assistantFab, { backgroundColor: surfaceColor, borderColor: colors.accent, zIndex: 9999, elevation: 10 }]}
                onPress={() => setAssistantModal(true)}
            >
                <Image
                    source={require('../../../../assets/images/ai.jpg')}
                    style={{ width: '60%', height: '60%' }}
                    resizeMode="contain"
                    tintColor={colors.accent}
                />
            </TouchableOpacity>

            {/* Assistant Modal */}
            <Modal
                visible={assistantModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setAssistantModal(false)}
            >
                <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
                    <AssistantChat onClose={() => setAssistantModal(false)} />
                </KeyboardAvoidingView>
            </Modal>

            <Modal
                visible={confirmModal.visible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setConfirmModal({ ...confirmModal, visible: false })}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setConfirmModal({ ...confirmModal, visible: false })}
                >
                    <View style={[styles.confirmModalContent, { backgroundColor: surfaceColor }]}
                        onStartShouldSetResponder={() => true}
                    >
                        <View style={styles.modalIndicator} />
                        <Text style={[styles.confirmModalTitle, { color: textColor }]}
                        >
                            {confirmModal.type === 'archive' ? t('Archiver la discussion') : t('Supprimer la discussion')}
                        </Text>
                        <Text style={[styles.confirmModalMessage, { color: textSecondaryColor }]}
                        >
                            {confirmModal.type === 'archive'
                                ? t('Voulez-vous archiver cette conversation ? Elle pourra être retrouvée dans vos archives.')
                                : t('Cette action est définitive. Voulez-vous vraiment supprimer cette discussion ?')}
                        </Text>

                        <View style={styles.confirmModalActions}>
                            <TouchableOpacity
                                style={[
                                    styles.confirmBtn,
                                    { backgroundColor: confirmModal.type === 'archive' ? PRIMARY_COLOR : '#EF4444' },
                                ]}
                                onPress={executeConfirmAction}
                            >
                                <Text style={styles.confirmBtnText}>
                                    {confirmModal.type === 'archive' ? t('Archiver') : t('Supprimer')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.cancelBtn, { backgroundColor: isDarkMode ? '#333' : '#F3F4F6' }]}
                                onPress={() => setConfirmModal({ ...confirmModal, visible: false })}
                            >
                                <Text style={[styles.cancelBtnText, { color: isDarkMode ? '#AAA' : '#4B5563' }]}>
                                    {t('Annuler')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
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
    headerAvatarButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 2,
    },
    headerAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: 18,
        backgroundColor: DIVIDER_COLOR,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    headerActionButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
    },
    searchWrapper: {
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
    },
    filterWrapper: {
        paddingVertical: 8,
    },
    filterScroll: {
        maxHeight: 50,
        marginTop: 5,
        marginBottom: 5,
    },
    filterContent: {
        paddingHorizontal: 20,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 18,
        borderWidth: 1,
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '600',
    },
    activeFilterChipText: {
        color: '#fff',
    },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
    chatCard: {
        flexDirection: 'row',
        padding: 10,
        borderRadius: 16,
        marginBottom: 6,
    },
    photoContainer: {
        position: 'relative',
    },
    chatPhoto: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: DIVIDER_COLOR,
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#fff',
    },
    chatDetails: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    chatName: {
        fontSize: 15,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 10,
    },
    chatTime: {
        fontSize: 11,
    },
    chatFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    lastMessage: {
        flex: 1,
        fontSize: 13,
        marginTop: 2,
    },
    unreadMessage: { fontWeight: '600' },
    unreadBadge: { backgroundColor: PRIMARY_COLOR, width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    unreadCount: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
    swipeActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 8,
        paddingHorizontal: 12,
    },
    swipeButton: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 4,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
    },
    typeBadgeText: {
        fontSize: 10,
        fontWeight: '600',
    },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 18, fontWeight: '600', marginTop: 16 },
    emptySubtext: { fontSize: 14, marginTop: 8, textAlign: 'center' },
    assistantFab: {
        position: 'absolute',
        bottom: 120,
        right: 20,
        zIndex: 100,
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    confirmModalContent: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalIndicator: {
        width: 40,
        height: 5,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 20,
    },
    confirmModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    confirmModalMessage: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    confirmModalActions: {
        gap: 12,
    },
    confirmBtn: {
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelBtn: {
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtnText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
