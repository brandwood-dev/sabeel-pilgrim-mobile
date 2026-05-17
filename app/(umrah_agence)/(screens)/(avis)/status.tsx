import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Image,
    KeyboardAvoidingView,
    Modal,
    PanResponder,
    Platform,
    ScrollView,
    StyleProp,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useThemeColors } from '../../../../hooks/useThemeColors';
import {
    addComment,
    addReply,
    Comment,
    deleteComment,
    deleteReply,
    deleteReview,
    Review,
    toggleSavePost,
    updateComment,
    updateReply
} from '../../../../store/reviewsSlice';
import { RootState } from '../../../../store/store';

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
    success: '#27AE60',
    danger: '#E74C3C'
};

interface StatusProps {
    review: Review;
    onSharePress: (reviewId: number) => void;
    onDeleteReview?: (reviewId: number) => void;
    currentUserId?: number;
    containerStyle?: StyleProp<ViewStyle>;
    minimal?: boolean;
}

export default function Status({ review, onSharePress, onDeleteReview, currentUserId = 999, containerStyle, minimal = false }: StatusProps) {
    const dispatch = useDispatch();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const colors = useThemeColors();
    const savedPostIds = useSelector((state: RootState) => state.reviews.savedPostIds);
    const isSaved = savedPostIds.includes(review.id);

    // Dynamic colors
    const backgroundColor = isDarkMode ? '#121212' : COLORS.background;
    const surfaceColor = isDarkMode ? '#1E1E1E' : COLORS.white;
    const textColor = isDarkMode ? '#F5F5F5' : COLORS.text;
    const textSecondaryColor = isDarkMode ? '#AAAAAA' : COLORS.lightText;
    const dividerColor = isDarkMode ? '#333333' : COLORS.divider;
    const inputBgColor = isDarkMode ? '#2D2D2D' : '#f0f0f0';
    const modalOverlayColor = isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.6)';

    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    // Comment Modal State
    const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
    const [newComment, setNewComment] = useState('');

    // Edit Comment State
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editCommentText, setEditCommentText] = useState('');

    // Reply State
    const [replyingToCommentId, setReplyingToCommentId] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');

    // Edit Reply State
    const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
    const [editReplyText, setEditReplyText] = useState('');
    const [editingReplyParentId, setEditingReplyParentId] = useState<number | null>(null);

    // Menu State
    const [showMenu, setShowMenu] = useState(false);

    // Pan Responder for swipe to close
    const panY = useRef(new Animated.Value(0)).current;
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return gestureState.dy > 5;
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    panY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100) {
                    // Close modal if swiped down more than 100px
                    setIsCommentModalVisible(false);
                    panY.setValue(0);
                } else {
                    // Snap back to original position
                    Animated.spring(panY, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    const handleLike = () => {
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    };

    const handleOpenComments = () => {
        setIsCommentModalVisible(true);
        panY.setValue(0);
    };

    const handleSubmitComment = () => {
        if (newComment.trim()) {
            const commentPayload: Comment = {
                id: Date.now(),
                userId: currentUserId,
                userName: 'Vous',
                text: newComment,
                timestamp: Date.now(),
                userImage: require('../../../../assets/images/user1.jpg'),
                replies: []
            };

            dispatch(addComment({ reviewId: review.id, comment: commentPayload }));
            setNewComment('');
        }
    };

    const handleEditComment = (commentId: number, currentText: string) => {
        setEditingCommentId(commentId);
        setEditCommentText(currentText);
    };

    const handleSaveEditComment = (commentId: number) => {
        if (editCommentText.trim()) {
            dispatch(updateComment({
                reviewId: review.id,
                commentId,
                newText: editCommentText
            }));
            setEditingCommentId(null);
            setEditCommentText('');
        }
    };

    const handleDeleteComment = (commentId: number) => {
        Alert.alert(
            'Supprimer le commentaire',
            'Êtes-vous sûr de vouloir supprimer ce commentaire ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: () => {
                        dispatch(deleteComment({ reviewId: review.id, commentId }));
                    }
                }
            ]
        );
    };

    const handleReplyToComment = (commentId: number) => {
        setReplyingToCommentId(commentId);
    };

    const handleSubmitReply = (commentId: number) => {
        if (replyText.trim()) {
            const replyPayload: Comment = {
                id: Date.now(),
                userId: currentUserId,
                userName: 'Vous',
                text: replyText,
                timestamp: Date.now(),
                userImage: require('../../../../assets/images/user1.jpg'),
                parentId: commentId
            };

            dispatch(addReply({ reviewId: review.id, commentId, reply: replyPayload }));
            setReplyText('');
            setReplyingToCommentId(null);
        }
    };

    // Reply Edit/Delete Handlers
    const handleEditReply = (replyId: number, currentText: string, parentCommentId: number) => {
        setEditingReplyId(replyId);
        setEditReplyText(currentText);
        setEditingReplyParentId(parentCommentId);
    };

    const handleSaveEditReply = () => {
        if (editReplyText.trim() && editingReplyId && editingReplyParentId) {
            dispatch(updateReply({
                reviewId: review.id,
                commentId: editingReplyParentId,
                replyId: editingReplyId,
                newText: editReplyText
            }));
            setEditingReplyId(null);
            setEditReplyText('');
            setEditingReplyParentId(null);
        }
    };

    const handleDeleteReply = (commentId: number, replyId: number) => {
        Alert.alert(
            'Supprimer la réponse',
            'Êtes-vous sûr de vouloir supprimer cette réponse ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: () => {
                        dispatch(deleteReply({ reviewId: review.id, commentId, replyId }));
                    }
                }
            ]
        );
    };

    const handleDeleteReview = () => {
        Alert.alert(
            'Supprimer le statut',
            'Êtes-vous sûr de vouloir supprimer ce statut ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: () => {
                        dispatch(deleteReview(review.id));
                        if (onDeleteReview) {
                            onDeleteReview(review.id);
                        }
                        setShowMenu(false);
                    }
                }
            ]
        );
    };

    const handleToggleSave = () => {
        dispatch(toggleSavePost(review.id));
    };

    const formatCommentDate = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;

        if (diff < 60000) return 'À l\'instant';
        if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
        if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)} h`;
        return 'Il y a quelques jours';
    };

    return (
        <View style={[styles.reviewCard, { backgroundColor: surfaceColor, borderColor: dividerColor }, containerStyle]}>
            <View style={[styles.cardAccent, { backgroundColor: review.type === 'AGENCE' ? COLORS.primaryGreen : COLORS.secondary }]} />

            <View style={styles.reviewHeader}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={review.image}
                        style={[styles.userProfileImage, { backgroundColor: isDarkMode ? '#333' : '#F0F0F0' }]}
                    />
                    <View style={[styles.onlineIndicator, { borderColor: surfaceColor }]} />
                </View>
                <View style={styles.reviewerInfo}>
                    <Text style={[styles.reviewerName, { color: textColor }]}>{review.name}</Text>
                    <View style={styles.agencyRow}>
                        <FontAwesome5
                            name={review.type === 'AGENCE' ? "building" : "user-tie"}
                            size={12}
                            color={COLORS.primaryGreen}
                        />
                        <Text style={styles.agencyName}>
                            {review.type === 'AGENCE' ? 'Agence: ' : 'Guide: '}{review.entityName}
                        </Text>
                    </View>
                    <Text style={styles.reviewDate}>{review.date}</Text>
                </View>
                <View style={styles.headerRight}>
                {!minimal && (
                    <View style={[styles.ratingBadge, { backgroundColor: isDarkMode ? '#2a2410' : '#FFF9E6' }]}>
                        <FontAwesome5 name="star" size={12} color={COLORS.accent} solid />
                        <Text style={styles.ratingBadgeText}>{review.rating}</Text>
                    </View>
                )}
                    {review.userId === currentUserId && (
                        <TouchableOpacity
                            style={styles.menuButton}
                            onPress={() => setShowMenu(!showMenu)}
                        >
                            <FontAwesome5 name="ellipsis-v" size={16} color={textColor} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Menu Dropdown */}
            {showMenu && review.userId === currentUserId && (
                <View style={[styles.menuDropdown, { backgroundColor: surfaceColor, borderColor: dividerColor }]}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={handleDeleteReview}
                    >
                        <FontAwesome5 name="trash" size={14} color={COLORS.danger} />
                        <Text style={styles.menuItemText}>Supprimer</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Comment Section with Truncation */}
            <View style={styles.textContainer}>
                <Text style={[styles.reviewComment, { color: isDarkMode ? '#D1D1D1' : '#444' }]} numberOfLines={3}>
                    {review.comment}
                </Text>
            </View>

            {/* Reaction Buttons */}
            {!minimal && (
                <View style={styles.reactionContainer}>
                    <TouchableOpacity
                        style={[
                            styles.reactionButton,
                            isLiked && styles.reactionButtonActive,
                        ]}
                        onPress={handleLike}
                    >
                        <FontAwesome5
                            name="heart"
                            size={18}
                            color={isLiked ? '#E74C3C' : (isDarkMode ? colors.accent : COLORS.primaryGreen)}
                            solid={isLiked}
                        />
                        {likeCount > 0 && (
                            <Text style={[styles.reactionCount, { color: isDarkMode ? colors.accent : COLORS.primaryGreen }]}>{likeCount}</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.reactionButton}
                        onPress={handleOpenComments}
                    >
                        <FontAwesome5 name="comment" size={18} color={isDarkMode ? colors.accent : COLORS.primaryGreen} />
                        {(review.comments && review.comments.length > 0) && (
                            <Text style={[styles.reactionCount, { color: isDarkMode ? colors.accent : COLORS.primaryGreen }]}>{review.comments.length}</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.reactionButton}
                        onPress={() => onSharePress(review.id)}
                    >
                        <FontAwesome5 name="share-alt" size={18} color={isDarkMode ? colors.accent : COLORS.primaryGreen} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.reactionButton}
                        onPress={handleToggleSave}
                    >
                        <FontAwesome5
                            name="bookmark"
                            size={18}
                            color={isSaved ? COLORS.accent : (isDarkMode ? colors.accent : COLORS.primaryGreen)}
                            solid={isSaved}
                        />
                    </TouchableOpacity>
                </View>
            )}

            {/* Comment Modal */}
            <Modal
                visible={isCommentModalVisible}
                transparent={true}
                animationType="slide"
                statusBarTranslucent={true}
                onRequestClose={() => setIsCommentModalVisible(false)}
            >
                <TouchableOpacity
                    style={[styles.modalOverlay, { backgroundColor: modalOverlayColor }]}
                    activeOpacity={1}
                    onPress={() => setIsCommentModalVisible(false)}
                >
                    <Animated.View
                        style={[
                            styles.commentModalContent,
                            {
                                transform: [{ translateY: panY }],
                                backgroundColor: surfaceColor
                            }
                        ]}
                        {...panResponder.panHandlers}
                    >
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                            style={{ flex: 1 }}
                            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 130}
                        >
                            <TouchableOpacity activeOpacity={1} style={{ flex: 1 }}>
                                <View style={[styles.modalHandle, { backgroundColor: dividerColor }]} />
                                <View style={[styles.modalHeader, { borderBottomColor: dividerColor }]}>
                                    <Text style={[styles.modalTitle, { color: textColor }]}>Commentaires ({review.comments?.length || 0})</Text>
                                </View>

                                <ScrollView
                                    style={styles.commentsList}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={{ paddingBottom: 20 }}
                                >
                                    {review.comments && review.comments.length > 0 ? (
                                        review.comments.map((comment) => (
                                            <View key={comment.id}>
                                                <View style={styles.commentItem}>
                                                    <Image source={comment.userImage || require('../../../../assets/images/user1.jpg')} style={[styles.commentAvatar, { backgroundColor: isDarkMode ? '#333' : '#F0F0F0' }]} />
                                                    <View style={styles.commentContent}>
                                                        {editingCommentId === comment.id ? (
                                                            // Edit Mode
                                                            <View style={[styles.editCommentContainer, { backgroundColor: inputBgColor, borderColor: dividerColor }]}>
                                                                <TextInput
                                                                    style={[styles.editCommentInput, { color: textColor }]}
                                                                    value={editCommentText}
                                                                    onChangeText={setEditCommentText}
                                                                    multiline
                                                                    autoFocus
                                                                />
                                                                <View style={styles.editActions}>
                                                                    <TouchableOpacity
                                                                        style={styles.editActionButton}
                                                                        onPress={() => setEditingCommentId(null)}
                                                                    >
                                                                        <Text style={styles.editActionCancel}>Annuler</Text>
                                                                    </TouchableOpacity>
                                                                    <TouchableOpacity
                                                                        style={[styles.editActionButton, styles.editActionSave]}
                                                                        onPress={() => handleSaveEditComment(comment.id)}
                                                                    >
                                                                        <Text style={styles.editActionSaveText}>Enregistrer</Text>
                                                                    </TouchableOpacity>
                                                                </View>
                                                            </View>
                                                        ) : (
                                                            // View Mode
                                                            <>
                                                                <View style={[styles.commentTextContainer, { backgroundColor: isDarkMode ? '#2D2D2D' : '#F8F9FA' }]}>
                                                                    <View style={styles.commentHeader}>
                                                                        <Text style={[styles.commentAuthor, { color: textColor }]}>{comment.userName}</Text>
                                                                        <Text style={styles.commentDate}>{formatCommentDate(comment.timestamp)}</Text>
                                                                    </View>
                                                                    <Text style={[styles.commentText, { color: isDarkMode ? '#D1D1D1' : '#2C3E50' }]}>{comment.text}</Text>
                                                                </View>

                                                                {/* Comment Actions */}
                                                                <View style={styles.commentActions}>
                                                                    <TouchableOpacity
                                                                        style={styles.commentActionButton}
                                                                        onPress={() => handleReplyToComment(comment.id)}
                                                                    >
                                                                        <FontAwesome5 name="reply" size={12} color={textSecondaryColor} />
                                                                        <Text style={[styles.commentActionText, { color: textSecondaryColor }]}>Répondre</Text>
                                                                    </TouchableOpacity>

                                                                    {comment.userId === currentUserId && (
                                                                        <>
                                                                            <TouchableOpacity
                                                                                style={styles.commentActionButton}
                                                                                onPress={() => handleEditComment(comment.id, comment.text)}
                                                                            >
                                                                                <FontAwesome5 name="edit" size={12} color={textSecondaryColor} />
                                                                                <Text style={[styles.commentActionText, { color: textSecondaryColor }]}>Modifier</Text>
                                                                            </TouchableOpacity>

                                                                            <TouchableOpacity
                                                                                style={styles.commentActionButton}
                                                                                onPress={() => handleDeleteComment(comment.id)}
                                                                            >
                                                                                <FontAwesome5 name="trash" size={12} color={textSecondaryColor} />
                                                                                <Text style={[styles.commentActionText, { color: textSecondaryColor }]}>Supprimer</Text>
                                                                            </TouchableOpacity>
                                                                        </>
                                                                    )}

                                                                    {/* Post owner can delete any comment on their post */}
                                                                    {review.userId === currentUserId && comment.userId !== currentUserId && (
                                                                        <TouchableOpacity
                                                                            style={styles.commentActionButton}
                                                                            onPress={() => handleDeleteComment(comment.id)}
                                                                        >
                                                                            <FontAwesome5 name="trash" size={12} color={textSecondaryColor} />
                                                                            <Text style={[styles.commentActionText, { color: textSecondaryColor }]}>Supprimer</Text>
                                                                        </TouchableOpacity>
                                                                    )}
                                                                </View>
                                                            </>
                                                        )}
                                                    </View>
                                                </View>

                                                {/* Replies */}
                                                {comment.replies && comment.replies.length > 0 && (
                                                    <View style={styles.repliesContainer}>
                                                        {comment.replies.map((reply) => (
                                                            <View key={reply.id}>
                                                                <View style={styles.replyItem}>
                                                                    <Image source={reply.userImage || require('../../../../assets/images/user1.jpg')} style={styles.replyAvatar} />
                                                                    <View style={styles.replyContent}>
                                                                        {editingReplyId === reply.id ? (
                                                                            // Edit Mode for Reply
                                                                            <View style={styles.editCommentContainer}>
                                                                                <TextInput
                                                                                    style={styles.editCommentInput}
                                                                                    value={editReplyText}
                                                                                    onChangeText={setEditReplyText}
                                                                                    multiline
                                                                                    autoFocus
                                                                                />
                                                                                <View style={styles.editActions}>
                                                                                    <TouchableOpacity
                                                                                        style={styles.editActionButton}
                                                                                        onPress={() => setEditingReplyId(null)}
                                                                                    >
                                                                                        <Text style={styles.editActionCancel}>Annuler</Text>
                                                                                    </TouchableOpacity>
                                                                                    <TouchableOpacity
                                                                                        style={[styles.editActionButton, styles.editActionSave]}
                                                                                        onPress={handleSaveEditReply}
                                                                                    >
                                                                                        <Text style={styles.editActionSaveText}>Enregistrer</Text>
                                                                                    </TouchableOpacity>
                                                                                </View>
                                                                            </View>
                                                                        ) : (
                                                                            // View Mode for Reply
                                                                            <>
                                                                                <View style={styles.replyTextContainer}>
                                                                                    <View style={styles.commentHeader}>
                                                                                        <Text style={styles.commentAuthor}>{reply.userName}</Text>
                                                                                        <Text style={styles.commentDate}>{formatCommentDate(reply.timestamp)}</Text>
                                                                                    </View>
                                                                                    <Text style={styles.commentText}>{reply.text}</Text>
                                                                                </View>

                                                                                {/* Reply Actions */}
                                                                                <View style={styles.commentActions}>
                                                                                    <TouchableOpacity
                                                                                        style={styles.commentActionButton}
                                                                                        onPress={() => handleReplyToComment(comment.id)}
                                                                                    >
                                                                                        <FontAwesome5 name="reply" size={12} color={COLORS.lightText} />
                                                                                        <Text style={styles.commentActionText}>Répondre</Text>
                                                                                    </TouchableOpacity>

                                                                                    {reply.userId === currentUserId && (
                                                                                        <>
                                                                                            <TouchableOpacity
                                                                                                style={styles.commentActionButton}
                                                                                                onPress={() => handleEditReply(reply.id, reply.text, comment.id)}
                                                                                            >
                                                                                                <FontAwesome5 name="edit" size={12} color={COLORS.lightText} />
                                                                                                <Text style={styles.commentActionText}>Modifier</Text>
                                                                                            </TouchableOpacity>

                                                                                            <TouchableOpacity
                                                                                                style={styles.commentActionButton}
                                                                                                onPress={() => handleDeleteReply(comment.id, reply.id)}
                                                                                            >
                                                                                                <FontAwesome5 name="trash" size={12} color={COLORS.lightText} />
                                                                                                <Text style={styles.commentActionText}>Supprimer</Text>
                                                                                            </TouchableOpacity>
                                                                                        </>
                                                                                    )}

                                                                                    {/* Post owner can delete any reply on their post */}
                                                                                    {review.userId === currentUserId && reply.userId !== currentUserId && (
                                                                                        <TouchableOpacity
                                                                                            style={styles.commentActionButton}
                                                                                            onPress={() => handleDeleteReply(comment.id, reply.id)}
                                                                                        >
                                                                                            <FontAwesome5 name="trash" size={12} color={COLORS.lightText} />
                                                                                            <Text style={styles.commentActionText}>Supprimer</Text>
                                                                                        </TouchableOpacity>
                                                                                    )}
                                                                                </View>
                                                                            </>
                                                                        )}
                                                                    </View>
                                                                </View>
                                                            </View>
                                                        ))}
                                                    </View>
                                                )}

                                                {/* Reply Input */}
                                                {replyingToCommentId === comment.id && (
                                                    <View style={[styles.replyInputContainer, { borderTopColor: dividerColor }]}>
                                                        <TextInput
                                                            style={[styles.replyInput, { backgroundColor: inputBgColor, color: textColor }]}
                                                            placeholder="Écrire une réponse..."
                                                            placeholderTextColor={textSecondaryColor}
                                                            value={replyText}
                                                            onChangeText={setReplyText}
                                                            multiline
                                                            autoFocus
                                                        />
                                                        <View style={styles.replyActions}>
                                                            <TouchableOpacity
                                                                style={styles.replyActionButton}
                                                                onPress={() => setReplyingToCommentId(null)}
                                                            >
                                                                <Text style={styles.replyActionCancel}>Annuler</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                style={[styles.replyActionButton, styles.replyActionSend]}
                                                                onPress={() => handleSubmitReply(comment.id)}
                                                                disabled={!replyText.trim()}
                                                            >
                                                                <Text style={styles.replyActionSendText}>Envoyer</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                )}
                                            </View>
                                        ))
                                    ) : (
                                        <View style={styles.emptyComments}>
                                            <Text style={[styles.emptyCommentsText, { color: textColor }]}>Aucun commentaire pour le moment.</Text>
                                            <Text style={[styles.emptyCommentsSubText, { color: textSecondaryColor }]}>Soyez le premier à commenter !</Text>
                                        </View>
                                    )}
                                </ScrollView>

                                <View style={[styles.addCommentContainer, { borderTopColor: dividerColor, backgroundColor: surfaceColor }]}>
                                    <View style={styles.inputRow}>
                                        <Image
                                            source={require('../../../../assets/images/user1.jpg')}
                                            style={[styles.commentAvatarSmall, { backgroundColor: isDarkMode ? '#333' : '#F0F0F0' }]}
                                        />
                                        <View style={[styles.commentInputWrapper, { backgroundColor: inputBgColor, borderColor: dividerColor }]}>
                                            <TextInput
                                                style={[styles.commentInput, { color: textColor }]}
                                                placeholder="Écrire un commentaire..."
                                                placeholderTextColor={textSecondaryColor}
                                                value={newComment}
                                                onChangeText={setNewComment}
                                                multiline
                                            />
                                            <TouchableOpacity
                                                style={[styles.sendButtonInside, !newComment.trim() && styles.sendButtonDisabledFb]}
                                                onPress={handleSubmitComment}
                                                disabled={!newComment.trim()}
                                            >
                                                <FontAwesome5
                                                    name="paper-plane"
                                                    size={18}
                                                    color={newComment.trim() ? (isDarkMode ? colors.accent : COLORS.primaryGreen) : textSecondaryColor}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </KeyboardAvoidingView>
                    </Animated.View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    reviewCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.divider,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        position: 'relative',
        overflow: 'hidden'
    },
    cardAccent: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12
    },
    userProfileImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F0F0F0'
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.success,
        borderWidth: 2,
        borderColor: COLORS.white
    },
    reviewerInfo: {
        flex: 1
    },
    reviewerName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 2
    },
    agencyRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    agencyName: {
        fontSize: 12,
        color: COLORS.primaryGreen,
        fontWeight: '600',
        marginLeft: 4
    },
    reviewDate: {
        fontSize: 11,
        color: COLORS.lightText,
        marginTop: 1
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9E6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8
    },
    ratingBadgeText: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.accent,
        marginLeft: 4
    },
    menuButton: {
        padding: 4
    },
    menuDropdown: {
        position: 'absolute',
        top: 50,
        right: 16,
        backgroundColor: COLORS.white,
        borderRadius: 8,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 1000,
        borderWidth: 1,
        borderColor: COLORS.divider
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        gap: 8
    },
    menuItemText: {
        color: COLORS.danger,
        fontSize: 14,
        fontWeight: '600'
    },
    textContainer: {
        marginBottom: 16
    },
    reviewComment: {
        fontSize: 15,
        lineHeight: 22,
        color: COLORS.text
    },
    reactionContainer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
        paddingTop: 12,
        gap: 20
    },
    reactionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    reactionButtonActive: {},
    reactionCount: {
        fontSize: 14,
        color: COLORS.primaryGreen,
        fontWeight: '600'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    commentModalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '85%',
        paddingTop: 12
    },
    modalHandle: {
        width: 40,
        height: 5,
        backgroundColor: COLORS.divider,
        borderRadius: 2.5,
        alignSelf: 'center',
        marginBottom: 8
    },
    modalHeader: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.text
    },
    commentsList: {
        flex: 1,
        paddingHorizontal: 16
    },
    commentItem: {
        flexDirection: 'row',
        marginTop: 16
    },
    commentAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 12
    },
    commentContent: {
        flex: 1
    },
    commentTextContainer: {
        backgroundColor: '#F0F2F5',
        borderRadius: 16,
        padding: 12
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4
    },
    commentAuthor: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text
    },
    commentDate: {
        fontSize: 11,
        color: COLORS.lightText
    },
    commentText: {
        fontSize: 14,
        lineHeight: 20,
        color: COLORS.text
    },
    commentActions: {
        flexDirection: 'row',
        marginTop: 4,
        paddingLeft: 8,
        gap: 16
    },
    commentActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    commentActionText: {
        fontSize: 12,
        color: COLORS.lightText,
        fontWeight: '600'
    },
    repliesContainer: {
        marginLeft: 48,
        marginTop: 8
    },
    replyItem: {
        flexDirection: 'row',
        marginTop: 12
    },
    replyAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: 8
    },
    replyContent: {
        flex: 1
    },
    replyTextContainer: {
        backgroundColor: '#F0F2F5',
        borderRadius: 12,
        padding: 10
    },
    replyInputContainer: {
        marginLeft: 48,
        marginVertical: 12,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 8,
        borderWidth: 1,
        borderColor: COLORS.divider
    },
    replyInput: {
        fontSize: 14,
        color: COLORS.text,
        maxHeight: 100,
        padding: 8
    },
    replyActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 4,
        gap: 12
    },
    replyActionButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16
    },
    replyActionCancel: {
        fontSize: 13,
        color: COLORS.lightText,
        fontWeight: '600'
    },
    replyActionSend: {
        backgroundColor: COLORS.primaryGreen
    },
    replyActionSendText: {
        fontSize: 13,
        color: COLORS.white,
        fontWeight: '700'
    },
    editCommentContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 8,
        borderWidth: 1,
        borderColor: COLORS.primaryGreen
    },
    editCommentInput: {
        fontSize: 14,
        color: COLORS.text,
        maxHeight: 100,
        padding: 8
    },
    editActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
        gap: 12
    },
    editActionButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16
    },
    editActionCancel: {
        fontSize: 13,
        color: COLORS.lightText,
        fontWeight: '600'
    },
    editActionSave: {
        backgroundColor: COLORS.primaryGreen
    },
    editActionSaveText: {
        fontSize: 13,
        color: COLORS.white,
        fontWeight: '700'
    },
    emptyComments: {
        paddingVertical: 40,
        alignItems: 'center'
    },
    emptyCommentsText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4
    },
    emptyCommentsSubText: {
        fontSize: 14,
        color: COLORS.lightText
    },
    addCommentContainer: {
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
        backgroundColor: COLORS.white,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    commentAvatarSmall: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
    },
    commentInputWrapper: {
        flex: 1,
        backgroundColor: '#F0F2F5',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    commentInput: {
        flex: 1,
        fontSize: 15,
        color: COLORS.text,
        maxHeight: 100,
        padding: 0,
    },
    sendButtonInside: {
        paddingLeft: 10,
        paddingBottom: 2,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leftActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12, // Gap between icons
    },
    fbActionButton: {
        padding: 4,
    },
    gifIcon: {
        borderWidth: 1.5,
        borderColor: COLORS.lightText,
        borderRadius: 4,
        paddingHorizontal: 2,
        paddingVertical: 0,
    },
    gifText: {
        fontSize: 10,
        fontWeight: '900',
        color: COLORS.lightText,
    },
    sendButtonFb: {
        padding: 4,
    },
    sendButtonDisabledFb: {
        opacity: 0.5,
    },
});


