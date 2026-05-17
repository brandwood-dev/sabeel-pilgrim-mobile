import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    PanResponder,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { addComment, Comment } from '../store/reviewsSlice';
import { RootState } from '../store/store';

// Sabeel Theme Colors
const COLORS = {
    primary: '#B8860B',
    primaryGreen: '#2C5F2D',
    secondary: '#DAA520',
    accent: '#D4AF37',
    background: '#FDFBF7',
    white: '#FFFFFF',
    text: '#2C3E50',
    lightText: '#999999',
    divider: '#E0E0E0',
    success: '#27AE60'
};

const { height } = Dimensions.get('window');

interface CommentModalProps {
    visible: boolean;
    onClose: () => void;
    reviewId: number | null;
}

export default function CommentModal({ visible, onClose, reviewId }: CommentModalProps) {
    const dispatch = useDispatch();
    const [commentText, setCommentText] = useState('');
    const slideAnim = useRef(new Animated.Value(height)).current;

    // Get Review Data from Redux
    const reviews = useSelector((state: RootState) => state.reviews.reviews);
    const review = reviews.find(r => r.id === reviewId);
    const comments = review?.comments || [];

    useEffect(() => {
        if (visible) {
            // Slide Up
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            // Slide Down
            Animated.timing(slideAnim, {
                toValue: height,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const handleClose = () => {
        Animated.timing(slideAnim, {
            toValue: height,
            duration: 300,
            useNativeDriver: true,
        }).start(() => onClose());
    };

    const handleSubmit = () => {
        if (commentText.trim() && reviewId) {
            const newComment: Comment = {
                id: Date.now(),
                userId: 999, // Current User ID (mock)
                userName: 'Vous',
                text: commentText.trim(),
                timestamp: Date.now(),
                // userImage: require('../assets/images/user1.jpg') // Add user image if available
            };

            dispatch(addComment({ reviewId, comment: newComment }));
            setCommentText('');
        }
    };

    // Pan Responder for Swipe Down to Close
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return gestureState.dy > 10; // Only capture if moving down
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    slideAnim.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 150) {
                    handleClose();
                } else {
                    Animated.spring(slideAnim, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;


    if (!visible && !reviewId) return null;

    return (
        <Modal
            transparent
            visible={visible}
            onRequestClose={handleClose}
            animationType="none"
        >
            <View style={styles.overlay}>
                {/* Touchable area to close by clicking outside */}
                <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />

                <Animated.View
                    style={[
                        styles.container,
                        { transform: [{ translateY: slideAnim }] }
                    ]}
                >
                    <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
                        <View style={styles.dragHandle} />
                    </View>

                    <View style={styles.header}>
                        <Text style={styles.title}>Commentaires ({comments.length})</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <FontAwesome5 name="times" size={18} color="#999" />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={comments}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.commentList}
                        renderItem={({ item }) => (
                            <View style={styles.commentItem}>
                                <View style={styles.avatarPlaceholder}>
                                    <FontAwesome5 name="user" size={12} color={COLORS.white} />
                                </View>
                                <View style={styles.commentContent}>
                                    <View style={styles.commentHeader}>
                                        <Text style={styles.userName}>{item.userName}</Text>
                                        <Text style={styles.timeAgo}>Il y a un instant</Text>
                                    </View>
                                    <Text style={styles.commentText}>{item.text}</Text>
                                </View>
                            </View>
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>Soyez le premier à commenter !</Text>
                            </View>
                        }
                    />

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
                    >
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Ajouter un commentaire..."
                                placeholderTextColor="#999"
                                value={commentText}
                                onChangeText={setCommentText}
                                multiline
                            />
                            <TouchableOpacity
                                style={[styles.sendButton, { backgroundColor: commentText.trim() ? COLORS.primaryGreen : '#ccc' }]}
                                onPress={handleSubmit}
                                disabled={!commentText.trim()}
                            >
                                <FontAwesome5 name="paper-plane" size={14} color="white" />
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    backdrop: {
        flex: 1,
    },
    container: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '70%', // Take up 70% of screen
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    dragHandleContainer: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 10,
    },
    dragHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#E0E0E0',
        borderRadius: 2.5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    commentList: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        marginTop: 2,
    },
    commentContent: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 10,
        borderTopLeftRadius: 2,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    userName: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.text,
    },
    timeAgo: {
        fontSize: 10,
        color: '#999',
    },
    commentText: {
        fontSize: 13,
        color: '#444',
        lineHeight: 18,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 30,
    },
    emptyText: {
        color: '#999',
        fontSize: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: 'white',
        paddingBottom: Platform.OS === 'ios' ? 30 : 15,
    },
    input: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        maxHeight: 100,
        marginRight: 10,
        color: COLORS.text,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
