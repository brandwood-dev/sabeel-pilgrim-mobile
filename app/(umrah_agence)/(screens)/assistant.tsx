import { useTrans } from '@/hooks/useTrans';
import { useThemeColors } from '@/hooks/useThemeColors';
import { RootState } from '@/store/store';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useRef, useState, useEffect } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Image,
    PanResponder,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSelector } from 'react-redux';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'assistant';
    timestamp: Date;
}

interface AssistantChatProps {
    onClose: () => void;
}

export default function AssistantChat({ onClose }: AssistantChatProps) {
    const { t, language } = useTrans();
    const isRTL = language === 'ar';
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        setMessages([
            {
                id: '1',
                text: t('Assalamu alaikum! Je suis Sabeel Assistant. Comment puis-je vous aider ?'),
                sender: 'assistant',
                timestamp: new Date()
            }
        ]);
    }, [language]);
    const [inputText, setInputText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

    const [showAttachments, setShowAttachments] = useState(false);

    const toggleAttachments = () => {
        setShowAttachments(!showAttachments);
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            const userMessage: Message = {
                id: Date.now().toString(),
                text: "📷 [Image]",
                sender: 'user',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, userMessage]);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission requise', 'Nous avons besoin de la permission caméra pour prendre une photo !');
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            const userMessage: Message = {
                id: Date.now().toString(),
                text: "📷 [Photo]",
                sender: 'user',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, userMessage]);
        }
    };

    const pickDocument = async () => {
        let result = await DocumentPicker.getDocumentAsync({});
        if (!result.canceled) {
            const userMessage: Message = {
                id: Date.now().toString(),
                text: `📄 [Fichier: ${result.assets[0].name}]`,
                sender: 'user',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, userMessage]);
        }
    };

    const handleAttachmentOption = async (type: string) => {
        setShowAttachments(false);
        switch (type) {
            case 'image':
                await pickImage();
                break;
            case 'camera':
                await takePhoto();
                break;
            case 'file':
                await pickDocument();
                break;
        }
    };

    // Animation for Swipe
    const pan = useRef(new Animated.ValueXY()).current;

    // NOTE: Swipe Up removed as per user request. screenMode state removed.

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only allow vertical drag down
                return gestureState.dy > 0 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
            },
            onPanResponderGrant: () => {
                pan.setOffset({
                    x: (pan.x as any)._value,
                    y: (pan.y as any)._value
                });
            },
            onPanResponderMove: Animated.event(
                [null, { dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (_, gestureState) => {
                pan.flattenOffset();

                if (gestureState.dy > 100) {
                    // Swipe Down -> Close
                    Animated.timing(pan, {
                        toValue: { x: 0, y: Dimensions.get('window').height },
                        duration: 300,
                        useNativeDriver: false
                    }).start(() => onClose());
                } else {
                    // Return to Default
                    Animated.spring(pan, {
                        toValue: { x: 0, y: 0 },
                        useNativeDriver: false
                    }).start();
                }
            }
        })
    ).current;

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [history, setHistory] = useState<{ id: string, title: string }[]>([]); // Mock history

    const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);

    const handleNewChat = () => {
        setMessages([{
            id: Date.now().toString(),
            text: t('Assalamu alaikum! Je suis Sabeel Assistant. Comment puis-je vous aider ?'),
            sender: 'assistant',
            timestamp: new Date()
        }]);
        setIsDrawerOpen(false);
    };

    const handleLongPressMessage = (message: Message) => {
        if (message.sender !== 'user') return;

        Alert.alert(
            "Options du message",
            "Que souhaitez-vous faire ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Modifier",
                    onPress: () => {
                        setInputText(message.text);
                        setEditingMessageId(message.id);
                    }
                },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: () => {
                        setMessages(prev => prev.filter(m => m.id !== message.id));
                    }
                }
            ]
        );
    };

    const handleSendMessage = () => {
        if (!inputText.trim()) return;

        if (editingMessageId) {
            // Find index and truncate
            const editIndex = messages.findIndex(m => m.id === editingMessageId);
            if (editIndex !== -1) {
                // Keep messages up to the edited one
                const startMessages = messages.slice(0, editIndex);
                const updatedMessage: Message = {
                    ...messages[editIndex],
                    text: inputText,
                    timestamp: new Date() // Update timestamp to now
                };

                // New state: [Previous, Updated]
                setMessages([...startMessages, updatedMessage]);

                // Trigger Assistant Response again
                setTimeout(() => {
                    const assistantMessage: Message = {
                        id: (Date.now() + 1).toString(),
                        text: t("Je traite votre demande..."),
                        sender: 'assistant',
                        timestamp: new Date()
                    };
                    setMessages(prev => [...prev, assistantMessage]);
                }, 1000);
            }

            setEditingMessageId(null);
            setInputText('');
            return;
        }

        const userMessage: Message = { id: Date.now().toString(), text: inputText, sender: 'user', timestamp: new Date() };
        setMessages([...messages, userMessage]);
        setInputText('');

        setTimeout(() => {
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: t("Je traite votre demande..."),
                sender: 'assistant',
                timestamp: new Date()
            };
            setMessages((prev) => [...prev, assistantMessage]);
        }, 1000);
    };

    const handleVoiceInput = () => {
        setIsRecording(!isRecording);
        // Here you would implement actual audio recording
        if (!isRecording) {
            console.log("Recording started...");
        } else {
            console.log("Recording stopped...");
            // Mock sending a voice message (as text for now or special bubble)
            const userMessage: Message = { id: Date.now().toString(), text: "🎤 [Message Vocal]", sender: 'user', timestamp: new Date() };
            setMessages([...messages, userMessage]);
        }
    };

    const handleSpeechToSpeech = () => {
        console.log("Starting Speech-to-Speech mode...");
    };

    return (
        <Animated.View
            style={[
                styles.assistantModalContent,
                { transform: [{ translateY: pan.y }], backgroundColor: colors.surface }
            ]}
        >
            {/* Header - Draggable Area */}
            <View
                style={[styles.assistantHeader, { backgroundColor: colors.surface, borderBottomColor: colors.divider, flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                {...panResponder.panHandlers}
            >
                {/* Drag Handle Indicator */}
                <View style={styles.dragHandleContainer}>
                    <View style={[styles.dragHandle, { backgroundColor: colors.divider }]} />
                </View>

                {/* Left: History Menu */}
                <TouchableOpacity onPress={toggleDrawer} style={{ [isRTL ? 'marginLeft' : 'marginRight']: 15 }}>
                    <FontAwesome5 name="history" size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* Center: Title & AI Icon */}
                <View style={{ flex: 1, flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <Image
                        source={require('../../../assets/images/ai.jpg')}
                        style={{ width: 24, height: 24, [isRTL ? 'marginLeft' : 'marginRight']: 8 }}
                        resizeMode="contain"
                        tintColor="#d9ab83"
                    />
                    <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                        <Text style={[styles.assistantTitle, { color: colors.primary }]}>{t('Sabeel Assistant')}</Text>
                        <Text style={[styles.assistantSubtitle, { color: isDarkMode ? colors.textLight : '#d9ab83' }]}>{t('En ligne')}</Text>
                    </View>
                </View>

                {/* Right: Chat Icon (replacing Speech) & NO X */}
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 15 }}>
                    <TouchableOpacity onPress={handleSpeechToSpeech}>
                        <Image
                            source={require('../../../assets/images/chat.jpg')}
                            style={{ width: 24, height: 24 }}
                            resizeMode="contain"
                            tintColor="#d9ab83"
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Sidebar Drawer */}
            {isDrawerOpen && (
                <View style={[styles.drawerOverlay, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={[styles.drawerContent, { backgroundColor: colors.surface, [isRTL ? 'borderTopLeftRadius' : 'borderTopRightRadius']: 25, [isRTL ? 'borderBottomLeftRadius' : 'borderBottomRightRadius']: 25 }]}>
                        <View style={[styles.drawerHeader, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                            <Text style={[styles.drawerTitle, { color: colors.primary }]}>{t('Historique')}</Text>
                            <TouchableOpacity onPress={handleNewChat} style={[styles.newChatButton, { backgroundColor: colors.primary, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                <FontAwesome5 name="plus" size={14} color="#fff" style={{ [isRTL ? 'marginLeft' : 'marginRight']: 5 }} />
                                <Text style={styles.newChatText}>{t('Nouveau Chat')}</Text>
                            </TouchableOpacity>
                        </View>

                        {history.length > 0 ? (
                            <FlatList
                                data={history}
                                keyExtractor={item => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={[styles.historyItem, { borderBottomColor: colors.divider, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                        <FontAwesome5 name="comment" size={14} color={colors.textLight} style={{ [isRTL ? 'marginLeft' : 'marginRight']: 10 }} />
                                        <Text style={[styles.historyItemText, { color: colors.textSecondary }]}>{item.title}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        ) : (
                            <View style={styles.emptyHistory}>
                                <FontAwesome5 name="history" size={40} color={colors.divider} />
                                <Text style={[styles.emptyHistoryText, { color: colors.textLight }]}>{t('Aucun historique de discussion')}</Text>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity
                        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
                        onPress={toggleDrawer}
                    />
                </View>
            )}

            {/* Chat Area */}
            <FlatList
                data={messages}
                keyExtractor={item => item.id}
                style={[styles.chatList, { backgroundColor: isDarkMode ? colors.background : '#f8f7f2' }]}
                contentContainerStyle={{ padding: 15 }}
                renderItem={({ item }) => (
                    <View style={{ alignItems: item.sender === 'user' ? (isRTL ? 'flex-start' : 'flex-end') : (isRTL ? 'flex-end' : 'flex-start'), marginBottom: 10 }}>
                        <TouchableOpacity
                            onLongPress={() => handleLongPressMessage(item)}
                            delayLongPress={500}
                            activeOpacity={0.8}
                            style={[
                                styles.messageBubble,
                                item.sender === 'user'
                                    ? [styles.userBubble, { backgroundColor: colors.primary, [isRTL ? 'borderBottomLeftRadius' : 'borderBottomRightRadius']: 2 }]
                                    : [styles.assistantBubble, { backgroundColor: isDarkMode ? '#2a2a2a' : '#E8E6D0', [isRTL ? 'borderBottomRightRadius' : 'borderBottomLeftRadius']: 2 }]
                            ]}
                        >
                            <Text style={[styles.messageText, { color: item.sender === 'user' ? '#fff' : colors.text, textAlign: isRTL ? 'right' : 'left' }]}>{item.text}</Text>
                        </TouchableOpacity>
                        <Text style={{ fontSize: 10, color: colors.textLight, marginTop: 2, marginHorizontal: 5 }}>
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                )}
            />

            {/* Attachment Menu (Popover) */}
            {showAttachments && (
                <View style={[styles.attachmentMenu, { backgroundColor: colors.surface }]}>
                    <TouchableOpacity style={styles.attachmentOption} onPress={() => handleAttachmentOption('image')}>
                        <View style={[styles.attachmentIconContainer, { backgroundColor: colors.primary + '15' }]}>
                            <FontAwesome5 name="image" size={18} color={colors.primary} />
                        </View>
                        <Text style={[styles.attachmentText, { color: colors.textSecondary }]}>Galerie</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.attachmentOption} onPress={() => handleAttachmentOption('camera')}>
                        <View style={[styles.attachmentIconContainer, { backgroundColor: (isDarkMode ? colors.textLight : '#d9ab83') + '15' }]}>
                            <FontAwesome5 name="camera" size={18} color={isDarkMode ? colors.textLight : '#d9ab83'} />
                        </View>
                        <Text style={[styles.attachmentText, { color: colors.textSecondary }]}>Caméra</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.attachmentOption} onPress={() => handleAttachmentOption('file')}>
                        <View style={[styles.attachmentIconContainer, { backgroundColor: colors.divider }]}>
                            <FontAwesome5 name="file-alt" size={18} color={colors.textSecondary} />
                        </View>
                        <Text style={[styles.attachmentText, { color: colors.textSecondary }]}>Fichier</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Input Area */}
            <View style={[styles.inputArea, { backgroundColor: colors.surface, borderTopColor: colors.divider, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {/* Attachment Button (Plus) */}
                <TouchableOpacity onPress={toggleAttachments} style={[styles.plusButton, { [isRTL ? 'marginLeft' : 'marginRight']: 10 }]}>
                    <FontAwesome5 name={showAttachments ? "times" : "plus"} size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* Input Container (Text + Action Button) */}
                <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? colors.background : '#f5f5f5', flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <TextInput
                        style={[styles.chatInput, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}
                        placeholder={isRecording ? t("Enregistrement...") : t("Posez votre question...")}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholderTextColor={colors.textLight}
                        editable={!isRecording}
                        multiline
                    />

                    {/* Dynamic Action Button (Mic or Send) */}
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            inputText.trim().length > 0 && [styles.sendActionButton, { backgroundColor: colors.primary }],
                            { [isRTL ? 'marginLeft' : 'marginRight']: 4 }
                        ]}
                        onPress={inputText.trim().length > 0 ? handleSendMessage : handleVoiceInput}
                    >
                        <FontAwesome5
                            name={inputText.trim().length > 0 ? (isRTL ? "arrow-down" : "arrow-up") : (isRecording ? "stop" : "microphone")}
                            size={16}
                            color={inputText.trim().length > 0 ? "#fff" : colors.textSecondary}
                            style={isRTL && inputText.trim().length > 0 ? { transform: [{ rotate: '180deg' }] } : {}}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    assistantModalContent: {
        flex: 1,
        marginTop: 100, // Slide up, leaving top space
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    assistantHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
    },
    assistantTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    assistantSubtitle: {
        fontSize: 12,
    },
    chatList: {
        flex: 1,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 15,
        marginBottom: 10,
    },
    userBubble: {
        alignSelf: 'flex-end',
        borderBottomRightRadius: 2,
    },
    assistantBubble: {
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 2,
    },
    messageText: {
        fontSize: 14,
    },
    userMessageText: {
    },
    inputArea: {
        flexDirection: 'row',
        alignItems: 'flex-end', // Align bottom for multiline growth
        padding: 15,
        borderTopWidth: 1,
    },
    plusButton: {
        marginBottom: 12, // Align with input
        marginRight: 10,
        padding: 5,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 25,
        paddingHorizontal: 5, // Padding for buttons inside
        paddingVertical: 2,
        minHeight: 44,
    },
    chatInput: {
        flex: 1,
        fontSize: 14,
        paddingHorizontal: 15,
        paddingVertical: 10,
        maxHeight: 100, // Limit height
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18, // Circle
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 4,
    },
    sendActionButton: {
    },
    // Drag Handle
    dragHandleContainer: {
        position: 'absolute',
        top: 8,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10,
    },
    dragHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
    },
    // Drawer Styles
    drawerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 200, // Higher than everything else inside modal
        flexDirection: 'row',
    },
    // drawerBackdrop removed as it is now inline sibling
    drawerContent: {
        width: '75%',
        height: '100%',
        padding: 20,
        paddingTop: 60, // Space for status bar/header area if needed
        elevation: 10,
        borderTopRightRadius: 25,
        borderBottomRightRadius: 25,
        borderTopLeftRadius: 25,
        borderBottomLeftRadius: 25,
    },
    drawerHeader: {
        marginBottom: 20,
    },
    drawerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    newChatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
    },
    newChatText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
    },
    historyItemText: {
        fontSize: 14,
    },
    emptyHistory: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
    },
    emptyHistoryText: {
        marginTop: 10,
        fontSize: 14,
    },
    // Attachment Menu
    attachmentMenu: {
        position: 'absolute',
        bottom: 80, // Above input area
        left: 20,
        borderRadius: 15,
        padding: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        width: 150,
        zIndex: 50,
    },
    attachmentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 5,
    },
    attachmentIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    attachmentText: {
        fontSize: 14,
        fontWeight: '500',
    },
});
