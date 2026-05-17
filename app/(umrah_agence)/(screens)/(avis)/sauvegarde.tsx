import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import Status from './status';

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
};

export default function SavedPostsScreen() {
    const router = useRouter();
    const savedPostIds = useSelector((state: RootState) => state.reviews.savedPostIds);
    const allReviews = useSelector((state: RootState) => state.reviews.reviews);

    // Filter reviews to show only saved posts
    const savedPosts = allReviews.filter(review => savedPostIds.includes(review.id));

    const handleShare = (reviewId: number) => {
        // Share functionality (can be implemented later)
        console.log('Share review:', reviewId);
    };

    const renderSavedPost = ({ item: review }: { item: typeof savedPosts[0] }) => (
        <Status
            review={review}
            onSharePress={handleShare}
            currentUserId={999}
        />
    );

    return (
        <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Custom Header */}
            <View style={styles.customHeader}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <FontAwesome5 name="arrow-left" size={20} color={COLORS.primaryGreen} />
                </TouchableOpacity>
                <Text style={styles.customHeaderTitle}>Posts Sauvegardés</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                {savedPosts.length > 0 ? (
                    <FlatList
                        data={savedPosts}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderSavedPost}
                        contentContainerStyle={styles.listContent}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <FontAwesome5 name="bookmark" size={60} color={COLORS.divider} />
                        <Text style={styles.emptyText}>Aucun post sauvegardé</Text>
                        <Text style={styles.emptySubText}>
                            Les posts que vous sauvegardez apparaîtront ici
                        </Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    customHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.background,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    backButton: {
        padding: 4,
        width: 40,
    },
    customHeaderTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primaryGreen,
        flex: 1,
        textAlign: 'center',
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    listContent: {
        paddingTop: 10,
        paddingBottom: 20,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        marginTop: 20,
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        textAlign: 'center',
    },
    emptySubText: {
        marginTop: 8,
        fontSize: 14,
        color: COLORS.lightText,
        textAlign: 'center',
    },
});
