import { useThemeColors } from '@/hooks/useThemeColors';
import { messagingApi } from '@/services/api';
import { createMessagingSocket } from '@/services/messagingSocket';
import { presentLocalMessageNotification } from '@/services/localNotifications';
import { RootState } from '@/store/store';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    View
} from 'react-native';
import { useSelector } from 'react-redux';
import { getUserAvatarUrl } from '@/services/media';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIMARY_COLOR = '#2C5F2D';
const BACKGROUND_COLOR = '#f8f7f2';
const TEXT_LIGHT = '#666';
const DEFAULT_AVATAR = require('../../../../assets/images/user1.jpg');

type ConversationType = 'agence' | 'guide' | 'pelerin';

interface ChatMessage {
    id: string;
    text: string;
    timestamp: string;
    isSent: boolean;
    type: 'text' | 'reservation_request' | 'reservation_status' | 'system';
    reservation?: {
        pilgrimName?: string;
        pilgrimEmail?: string;
        pilgrimPhone?: string;
        age?: number | null;
        pilgrimCount?: number;
        hasDisease?: boolean;
        medications?: string;
        notes?: string;
        paymentType?: string;
        totalPrice?: number;
        advanceAmount?: number;
        remainingAmount?: number;
        packageName?: string;
        reservationDate?: string;
        status?: string;
    } | null;
}

const formatTime = (value?: string | Date) => {
    if (!value) {
        return '';
    }

    return new Date(value).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

const getRoleLabel = (type?: string) => {
    if (type === 'guide') {
        return 'Guide';
    }

    if (type === 'agence') {
        return 'Agence';
    }

    return 'Accompagnant';
};

const getReservationStatus = (conversation: any, reservationMessage?: ChatMessage) => {
    const reservationStatus = reservationMessage?.reservation?.status;

    if (reservationStatus) {
        return reservationStatus;
    }

    if (!conversation?.reservationId) {
        return null;
    }

    return conversation?.isLocked ? 'pending' : 'accepted';
};

const mapBackendMessage = (message: any, currentUserId?: string): ChatMessage => {
    // Use a persistent ID if available, otherwise fallback to temporary ID or timestamp
    const id = message?.id ? String(message.id) : (message?._id ? String(message._id) : `msg-${Date.now()}-${Math.random()}`);
    
    return {
        id,
        text: String(message?.content || ''),
        timestamp: formatTime(message?.createdAt),
        isSent: Boolean(currentUserId) ? message?.senderUserId === currentUserId : message?.senderRole !== 'agence',
        type: message?.messageType || 'text',
        reservation: message?.metadata?.reservation || null,
    };
};

export default function ChatPelerinScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const currentUserId = useSelector((state: RootState) => state.auth.user?.id);

    const backgroundColor = isDarkMode ? '#121212' : '#FFFFFF';
    const surfaceColor = isDarkMode ? '#1E1E1E' : '#FFFFFF';
    const textColor = isDarkMode ? '#F5F5F5' : '#1F2937';
    const textSecondaryColor = isDarkMode ? '#AAAAAA' : '#666';
    const inputBackgroundColor = isDarkMode ? '#2D2D2D' : '#F8F9FA';
    const borderColor = isDarkMode ? '#333333' : '#E5E7EB';

    const contactName = typeof params.contactName === 'string' ? params.contactName : 'Discussion';
    const contactImage = typeof params.contactImage === 'string' ? params.contactImage : '';
    const conversationId = typeof params.conversationId === 'string' ? params.conversationId : '';
    const [conversation, setConversation] = useState<any>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [initialLoadDone, setInitialLoadDone] = useState(false);

    const listRef = React.useRef<FlatList<ChatMessage> | null>(null);

    const scrollToBottom = () => {
        try {
            listRef.current?.scrollToEnd({ animated: true });
        } catch {
            // ignore
        }
    };

    const cacheKey = useMemo(() => `@chat_messages_cache:${String(conversationId || '')}`, [conversationId]);

    useEffect(() => {
        if (!conversationId) {
            return;
        }

        let socketRef: any = null;
        let isMounted = true;

        const loadFromCache = async () => {
            try {
                const cached = await AsyncStorage.getItem(cacheKey);
                if (!cached || !isMounted) return;
                const parsed = JSON.parse(cached);
                if (parsed?.conversation) {
                    setConversation(parsed.conversation);
                }
                if (Array.isArray(parsed?.messages)) {
                    setMessages(parsed.messages);
                }
                setLoading(false);
            } catch {
                // ignore
            }
        };

        const saveToCache = async (nextConversation: any, nextMessages: ChatMessage[]) => {
            try {
                await AsyncStorage.setItem(cacheKey, JSON.stringify({ conversation: nextConversation, messages: nextMessages }));
            } catch {
                // ignore
            }
        };

        const syncConversation = async (isInitial = false) => {
            try {
                if (isInitial && !initialLoadDone) {
                    loadFromCache();
                }
                const response = await messagingApi.getConversationById(conversationId);
                if (!isMounted) return;

                const newConversation = response.data?.conversation || null;
                const newMessages = (response.data?.messages || []).map((item: any) => mapBackendMessage(item, currentUserId));
                
                setConversation(newConversation);
                setMessages(newMessages);
                saveToCache(newConversation, newMessages);
            } catch (error) {
                console.error('[ChatPelerin] sync failed', error);
            } finally {
                if (isMounted && isInitial) {
                    setLoading(false);
                    setInitialLoadDone(true);
                }
            }
        };

        const setupSocket = async () => {
            try {
                socketRef = await createMessagingSocket();
                socketRef.emit('join_conversation', { conversationId });

                socketRef.on('message_created', (payload: any) => {
                    if (!payload?.conversation?.id || !payload?.message) return;
                    if (String(payload.conversation.id) !== String(conversationId)) return;
                    const nextMessage = mapBackendMessage(payload.message, currentUserId);
                    setConversation(payload.conversation || null);
                    setMessages((prev) => prev.some((item) => item.id === nextMessage.id) ? prev : [...prev, nextMessage]);
                });

                socketRef.on('reservation_updated', (payload: any) => {
                    if (payload?.conversation?.id !== conversationId) return;
                    setConversation((prev: any) => ({ ...prev, ...(payload.conversation || {}) }));
                    if (payload?.message) {
                        const nextMessage = mapBackendMessage(payload.message, currentUserId);
                        setMessages((prev) => prev.some((item) => item.id === nextMessage.id) ? prev : [...prev, nextMessage]);
                    }
                });
            } catch (error) {
                console.error('[ChatPelerin] socket setup failed', error);
            }
        };

        syncConversation(true);
        setupSocket();

        return () => {
            isMounted = false;
            if (socketRef) socketRef.disconnect();
        };
    }, [conversationId, currentUserId]);

    const reservationMessage = useMemo(
        () => [...messages].reverse().find((item) => item.type === 'reservation_request' && item.reservation),
        [messages]
    );

    const reservationStatus = getReservationStatus(conversation, reservationMessage);
    const hasReservation = Boolean(conversation?.reservationId || reservationMessage?.reservation);
    const isConversationLocked = reservationStatus === 'pending';
    const canSendMessages = !hasReservation || reservationStatus === 'accepted' || !conversation?.isLocked;

    const conversationType = useMemo<ConversationType>(() => {
        if (typeof params.type === 'string' && params.type) return params.type as ConversationType;
        if (conversation?.guideId) return 'guide';
        if (conversation?.agencyId) return 'agence';
        return 'pelerin';
    }, [params.type, conversation]);

    const contactImageResolved = useMemo(() => {
        const isGroupConversation = Boolean(conversation?.groupId || conversation?.freelanceGroupId) && !conversation?.pilgrimUserId;
        const candidate = isGroupConversation
            ? (conversation?.groupImageUrl || conversation?.packImageUrl || contactImage)
            : conversationType === 'guide'
                ? (conversation?.guideImageUrl || contactImage)
                : conversationType === 'agence'
                    ? (conversation?.agencyImageUrl || contactImage)
                    : (conversation?.pilgrimImageUrl || contactImage);
        return getUserAvatarUrl(candidate) || '';
    }, [conversationType, conversation?.groupId, conversation?.freelanceGroupId, conversation?.pilgrimUserId, conversation?.groupImageUrl, conversation?.packImageUrl, conversation?.guideImageUrl, conversation?.agencyImageUrl, conversation?.pilgrimImageUrl, contactImage]);

    const roleLabel = getRoleLabel(conversationType);

    const handleSendMessage = async () => {
        if (!inputText.trim() || !conversationId) {
            return;
        }

        const messageText = inputText.trim();
        setInputText('');

        // Optimistic update
        const temporaryId = `temp-${Date.now()}`;
        const optimisticMessage: ChatMessage = {
            id: temporaryId,
            text: messageText,
            timestamp: formatTime(new Date()),
            isSent: true,
            type: 'text',
        };

        setMessages((prev) => [...prev, optimisticMessage]);

        try {
            const response = await messagingApi.sendMessage(conversationId, { content: messageText });
            const nextMessage = mapBackendMessage(response.data?.message, currentUserId);
            
            // Replace optimistic message with real one
            setMessages((prev) => 
                prev.map((msg) => msg.id === temporaryId ? nextMessage : msg)
            );
            
            setConversation(response.data?.conversation || null);
        } catch (error: any) {
            // Remove optimistic message on failure
            setMessages((prev) => prev.filter((msg) => msg.id !== temporaryId));
            // Restore input text
            setInputText(messageText);
            
            Alert.alert(
                'Envoi échoué',
                error?.response?.data?.message || error?.message || 'Impossible d\'envoyer le message.'
            );
        }
    };

    const renderReservationCard = (item: ChatMessage) => {
        if (!item.reservation) {
            return null;
        }

        const reservationCardStatus = item.reservation.status || reservationStatus || (isConversationLocked ? 'pending' : 'accepted');

        return (
            <View style={[styles.messageContainer, styles.fullWidthMessage]}>
                <View style={[styles.reservationCard, { backgroundColor: surfaceColor, borderColor: colors.primary }]}> 
                    <View style={styles.reservationHeader}>
                        <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                        <Text style={[styles.reservationTitle, { color: colors.primary }]}>Demande de réservation</Text>
                    </View>

                    <View style={styles.reservationRows}>
                        <Text style={[styles.reservationLine, { color: textColor }]}>Pack : {item.reservation.packageName || 'Pack Umrah'}</Text>
                        <Text style={[styles.reservationLine, { color: textColor }]}>Date : {item.reservation.reservationDate || '-'}</Text>
                        <Text style={[styles.reservationLine, { color: textColor }]}>Pèlerins : {item.reservation.pilgrimCount || 1}</Text>
                        {item.reservation.pilgrimName ? <Text style={[styles.reservationLine, { color: textColor }]}>Client : {item.reservation.pilgrimName}</Text> : null}
                        {item.reservation.pilgrimPhone ? <Text style={[styles.reservationLine, { color: textColor }]}>Téléphone : {item.reservation.pilgrimPhone}</Text> : null}
                        {item.reservation.pilgrimEmail ? <Text style={[styles.reservationLine, { color: textColor }]}>Email : {item.reservation.pilgrimEmail}</Text> : null}
                        {item.reservation.paymentType ? <Text style={[styles.reservationLine, { color: textColor }]}>Paiement : {item.reservation.paymentType}</Text> : null}
                        {item.reservation.totalPrice ? <Text style={[styles.reservationLine, { color: textColor }]}>Total : {item.reservation.totalPrice} DT</Text> : null}
                        {item.reservation.notes ? <Text style={[styles.reservationLine, { color: textColor }]}>Note : {item.reservation.notes}</Text> : null}
                    </View>

                    <View style={[
                        styles.reservationStatus,
                        reservationCardStatus === 'accepted' ? styles.statusAccepted : reservationCardStatus === 'rejected' ? styles.statusRejected : styles.statusPending,
                    ]}>
                        <Text style={[
                            styles.reservationStatusText,
                            reservationCardStatus === 'accepted' ? styles.statusAcceptedText : reservationCardStatus === 'rejected' ? styles.statusRejectedText : styles.statusPendingText,
                        ]}>
                            {reservationCardStatus === 'accepted' ? 'Réservation acceptée' : reservationCardStatus === 'rejected' ? 'Réservation refusée' : 'En attente de validation'}
                        </Text>
                    </View>
                    <Text style={[styles.reservationTimestamp, { color: textSecondaryColor }]}>{item.timestamp}</Text>
                </View>
            </View>
        );
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        if (item.type === 'reservation_request' && item.reservation) {
            return renderReservationCard(item);
        }

        return (
            <View style={[styles.messageContainer, item.isSent ? styles.sentMessage : styles.receivedMessage]}>
                <View style={[
                    styles.messageBubble,
                    item.isSent ? [styles.sentBubble, { backgroundColor: colors.primary }] : [styles.receivedBubble, { backgroundColor: surfaceColor, borderColor }],
                ]}>
                    <Text style={[styles.messageText, item.isSent ? styles.sentText : { color: textColor }]}>{item.text}</Text>
                    <Text style={[styles.timestamp, { color: item.isSent ? 'rgba(255,255,255,0.8)' : textSecondaryColor }]}>{item.timestamp}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}> 
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={backgroundColor} />

            <View style={[styles.header, { backgroundColor: surfaceColor, borderBottomColor: borderColor }]}> 
                <TouchableOpacity 
                    onPress={() => {
                        if (router.canGoBack()) {
                            router.back();
                        } else {
                            router.replace('/(umrah_agence)/(screens)/acceuil' as any);
                        }
                    }} 
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color={textColor} />
                </TouchableOpacity>

                <View style={styles.headerInfo}>
                    <Image 
                        source={contactImageResolved ? { uri: contactImageResolved } : DEFAULT_AVATAR} 
                        style={styles.headerAvatar} 
                        onError={() => {
                            console.log('[ChatPelerin] header avatar load failed', { conversationId, contactImageResolved });
                        }}
                    />
                    <View style={styles.headerTextContainer}>
                        <Text style={[styles.headerName, { color: textColor }]}>{contactName}</Text>
                        <Text style={[styles.headerStatus, { color: colors.primary }]}>{roleLabel}</Text>
                    </View>
                </View>

                {conversation?.guideId ? (
                    <TouchableOpacity
                        style={styles.moreButton}
                        onPress={() => {
                            router.push({
                                pathname: '/(umrah_agence)/(screens)/call' as any,
                                params: {
                                    type: 'sender',
                                    callId: `call-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                                    targetUserId: String(conversation.guideId),
                                    name: contactName,
                                    photo: contactImageResolved,
                                    conversationId: String(conversationId),
                                },
                            });
                        }}
                    >
                        <Ionicons name="call" size={22} color={textColor} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.moreButton}>
                        <Ionicons name="ellipsis-vertical" size={22} color={textColor} />
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                ref={listRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesList}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubbles-outline" size={60} color={borderColor} />
                        <Text style={[styles.emptyText, { color: textColor }]}>{loading ? 'Chargement...' : 'Aucun message'}</Text>
                        <Text style={[styles.emptySubtext, { color: textSecondaryColor }]}>Cette conversation affichera vos échanges réels.</Text>
                    </View>
                }
            />

            {canSendMessages ? (
                <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={35}>
                    <View style={[styles.inputContainer, { backgroundColor: surfaceColor, borderTopColor: borderColor, paddingBottom: 24 }]}> 
                        <TouchableOpacity
                            style={[styles.scrollDownButton, { backgroundColor: surfaceColor, borderColor: borderColor }]}
                            onPress={scrollToBottom}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="chevron-down" size={18} color={colors.primary} />
                        </TouchableOpacity>
                        <TextInput
                            style={[styles.input, { backgroundColor: inputBackgroundColor, color: textColor }]}
                            placeholder="Écrire un message..."
                            placeholderTextColor={textSecondaryColor}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, { backgroundColor: inputText.trim() ? colors.primary : colors.divider }]}
                            onPress={handleSendMessage}
                            disabled={!inputText.trim()}
                        >
                            <Ionicons name="send" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            ) : (
                <View style={[styles.blockedContainer, { backgroundColor: surfaceColor, borderTopColor: borderColor }]}> 
                    <View style={[styles.blockedNotice, { backgroundColor: isDarkMode ? '#2d2610' : '#FEF3C7' }]}> 
                        <Ionicons name={hasReservation ? 'time-outline' : 'lock-closed-outline'} size={18} color={isDarkMode ? '#F59E0B' : '#92400E'} />
                        <Text style={[styles.blockedText, { color: isDarkMode ? '#F59E0B' : '#92400E' }]}>
                            {hasReservation
                                ? reservationStatus === 'rejected'
                                    ? 'Cette réservation a été refusée. Vous ne pouvez pas envoyer de messages sur cette demande.'
                                    : 'La réservation est en attente. Les messages seront débloqués après acceptation.'
                                : 'Aucune réservation active pour cette discussion.'}
                        </Text>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BACKGROUND_COLOR,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 4,
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: '#E5E7EB',
    },
    headerTextContainer: {
        flex: 1,
    },
    headerName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    headerStatus: {
        fontSize: 12,
        fontWeight: '600',
    },
    moreButton: {
        padding: 4,
    },
    messagesList: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexGrow: 1,
    },
    messageContainer: {
        marginVertical: 4,
        maxWidth: '82%',
    },
    fullWidthMessage: {
        maxWidth: '100%',
    },
    sentMessage: {
        alignSelf: 'flex-end',
    },
    receivedMessage: {
        alignSelf: 'flex-start',
    },
    messageBubble: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    sentBubble: {
        borderBottomRightRadius: 4,
    },
    receivedBubble: {
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
        marginBottom: 4,
    },
    sentText: {
        color: '#fff',
    },
    timestamp: {
        fontSize: 11,
        alignSelf: 'flex-end',
    },
    reservationCard: {
        borderWidth: 1.5,
        borderRadius: 16,
        padding: 14,
    },
    reservationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    reservationTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    reservationRows: {
        gap: 6,
    },
    reservationLine: {
        fontSize: 14,
        lineHeight: 20,
    },
    reservationStatus: {
        marginTop: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        alignItems: 'center',
    },
    statusPending: {
        backgroundColor: '#FEF3C7',
    },
    statusAccepted: {
        backgroundColor: '#D1FAE5',
    },
    statusRejected: {
        backgroundColor: '#FEE2E2',
    },
    reservationStatusText: {
        fontSize: 13,
        fontWeight: '700',
    },
    statusPendingText: {
        color: '#92400E',
    },
    statusAcceptedText: {
        color: '#065F46',
    },
    statusRejectedText: {
        color: '#991B1B',
    },
    reservationTimestamp: {
        fontSize: 11,
        marginTop: 10,
        alignSelf: 'flex-end',
    },
    scrollDownButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        marginRight: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        borderTopWidth: 1,
    },
    input: {
        flex: 1,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        maxHeight: 100,
        marginRight: 8,
    },
    sendButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
    },
    blockedContainer: {
        borderTopWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    blockedNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 10,
    },
    blockedText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 14,
    },
    emptySubtext: {
        fontSize: 14,
        marginTop: 4,
        textAlign: 'center',
    },
});
