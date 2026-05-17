import { useThemeColors } from '@/hooks/useThemeColors';
import { messagingApi } from '@/services/api';
import { createMessagingSocket } from '@/services/messagingSocket';
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
    View,
    Platform
} from 'react-native';
import { useSelector } from 'react-redux';
import { getUserAvatarUrl } from '@/services/media';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIMARY_COLOR = '#2C5F2D';
const BACKGROUND_COLOR = '#f8f7f2';
const DEFAULT_AVATAR = require('../../assets/images/user1.jpg');

interface ChatMessage {
    id: string;
    text: string;
    timestamp: string;
    isSent: boolean;
    type: string;
}

const formatTime = (value?: string | Date) => {
    if (!value) return '';
    return new Date(value).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

const mapBackendMessage = (message: any, currentUserId?: string): ChatMessage => {
    const id = message?.id ? String(message.id) : `msg-${Date.now()}-${Math.random()}`;
    return {
        id,
        text: String(message?.content || ''),
        timestamp: formatTime(message?.createdAt),
        isSent: message?.senderUserId === currentUserId,
        type: message?.messageType || 'text',
    };
};

export default function ChatAccompagnantScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const user = useSelector((state: RootState) => state.auth.user);
    const currentUserId = user?.id;

    const backgroundColor = isDarkMode ? '#121212' : '#FFFFFF';
    const surfaceColor = isDarkMode ? '#1E1E1E' : '#FFFFFF';
    const textColor = isDarkMode ? '#F5F5F5' : '#1F2937';
    const textSecondaryColor = isDarkMode ? '#AAAAAA' : '#666';
    const inputBackgroundColor = isDarkMode ? '#2D2D2D' : '#F8F9FA';
    const borderColor = isDarkMode ? '#333333' : '#E5E7EB';

    const [conversationId, setConversationId] = useState<string>(typeof params.conversationId === 'string' ? params.conversationId : '');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [conversation, setConversation] = useState<any>(null);

    const contactName = typeof params.contactName === 'string' ? params.contactName : 'Discussion';
    const contactImage = typeof params.contactImage === 'string' ? params.contactImage : '';
    const targetId = typeof params.targetId === 'string' ? params.targetId : '';
    const targetType = typeof params.targetType === 'string' ? params.targetType as any : 'pelerin';

    const listRef = React.useRef<FlatList<ChatMessage> | null>(null);

    const scrollToBottom = () => {
        setTimeout(() => {
            listRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    useEffect(() => {
        let socketRef: any = null;
        let isMounted = true;

        const syncConversation = async () => {
            if (!conversationId) {
                setLoading(false);
                return;
            }

            try {
                const response = await messagingApi.getConversationById(conversationId);
                if (!isMounted) return;

                setConversation(response.data?.conversation);
                const backendMessages = (response.data?.messages || []).map((m: any) => mapBackendMessage(m, currentUserId));
                setMessages(backendMessages);
            } catch (error) {
                console.error('[ChatAccompagnant] sync failed', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        const setupSocket = async () => {
            if (!conversationId) return;
            try {
                socketRef = await createMessagingSocket();
                socketRef.emit('join_conversation', { conversationId });

                socketRef.on('message_created', (payload: any) => {
                    if (String(payload.conversation?.id) === String(conversationId)) {
                        const nextMessage = mapBackendMessage(payload.message, currentUserId);
                        setMessages((prev) => prev.some(m => m.id === nextMessage.id) ? prev : [...prev, nextMessage]);
                        scrollToBottom();
                    }
                });
            } catch (error) {
                console.error('[ChatAccompagnant] socket setup failed', error);
            }
        };

        syncConversation();
        setupSocket();

        return () => {
            isMounted = false;
            if (socketRef) socketRef.disconnect();
        };
    }, [conversationId, currentUserId]);

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const messageText = inputText.trim();
        setInputText('');

        try {
            let activeConvId = conversationId;

            // Create conversation if it doesn't exist
            if (!activeConvId) {
                if (!targetId || !targetType) {
                    Alert.alert('Erreur', 'Impossible de créer la conversation : informations manquantes.');
                    return;
                }
                const convResponse = await messagingApi.createCompanionConversation(targetType, targetId);
                activeConvId = convResponse.data?.conversation?.id;
                setConversationId(activeConvId);
                setConversation(convResponse.data?.conversation);
            }

            const response = await messagingApi.sendMessage(activeConvId, { content: messageText });
            const nextMessage = mapBackendMessage(response.data?.message, currentUserId);
            setMessages((prev) => [...prev, nextMessage]);
            scrollToBottom();
        } catch (error: any) {
            setInputText(messageText);
            Alert.alert('Erreur', error?.response?.data?.message || 'Impossible d\'envoyer le message.');
        }
    };

    const handleStartCall = () => {
        const callTargetUserId = String(targetId || conversation?.targetUserId || conversation?.pelerinId || conversation?.guideId || '');
        if (!callTargetUserId) {
            Alert.alert("Erreur", "Impossible de démarrer l'appel WebRTC. Destinataire introuvable.");
            return;
        }

        router.push({
            pathname: '/(umrah_agence)/(screens)/call' as any,
            params: {
                type: 'sender',
                callId: `call-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                targetUserId: callTargetUserId,
                name: contactName,
                photo: contactImage || (conversation?.photo ? getUserAvatarUrl(conversation.photo) : ''),
                conversationId: String(conversationId || ''),
            },
        });
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => (
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

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={backgroundColor} />

            <View style={[styles.header, { backgroundColor: surfaceColor, borderBottomColor: borderColor }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={textColor} />
                </TouchableOpacity>

                <View style={styles.headerInfo}>
                    <Image
                        source={contactImage ? { uri: contactImage } : DEFAULT_AVATAR}
                        style={styles.headerAvatar}
                    />
                    <View style={styles.headerTextContainer}>
                        <Text style={[styles.headerName, { color: textColor }]}>{contactName}</Text>
                        <Text style={[styles.headerStatus, { color: colors.primary }]}>
                            {targetType === 'guide' ? 'Guide' : targetType === 'agence' ? 'Agence' : 'Pèlerin'}
                        </Text>
                    </View>
                </View>

                {/* WebRTC Call Button */}
                <TouchableOpacity onPress={handleStartCall} style={{ padding: 6, marginRight: 4 }}>
                    <Ionicons name="call" size={22} color={colors.primary} />
                </TouchableOpacity>
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
                        <Text style={[styles.emptyText, { color: textColor }]}>
                            {loading ? 'Chargement...' : 'Aucun message'}
                        </Text>
                        <Text style={[styles.emptySubtext, { color: textSecondaryColor }]}>
                            Démarrer la discussion avec {contactName}.
                        </Text>
                    </View>
                }
                onContentSizeChange={scrollToBottom}
            />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
                <View style={[styles.inputContainer, { backgroundColor: surfaceColor, borderTopColor: borderColor, paddingBottom: Platform.OS === 'ios' ? 30 : 15 }]}>
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
    backButton: { padding: 4, marginRight: 12 },
    headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    headerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: '#E5E7EB' },
    headerTextContainer: { flex: 1 },
    headerName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
    headerStatus: { fontSize: 12, fontWeight: '600' },
    messagesList: { paddingHorizontal: 16, paddingVertical: 12, flexGrow: 1 },
    messageContainer: { marginVertical: 4, maxWidth: '82%' },
    sentMessage: { alignSelf: 'flex-end' },
    receivedMessage: { alignSelf: 'flex-start' },
    messageBubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderWidth: 1, borderColor: 'transparent' },
    sentBubble: { borderBottomRightRadius: 4 },
    receivedBubble: { borderBottomLeftRadius: 4 },
    messageText: { fontSize: 15, lineHeight: 20, marginBottom: 4 },
    sentText: { color: '#fff' },
    timestamp: { fontSize: 11, alignSelf: 'flex-end' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
    input: { flex: 1, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100, marginRight: 8 },
    sendButton: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, fontWeight: '600', marginTop: 14 },
    emptySubtext: { fontSize: 14, marginTop: 4, textAlign: 'center' },
});
