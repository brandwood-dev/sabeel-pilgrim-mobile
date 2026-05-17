import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import AppBar from '../(navigation)/app_barr';
import { RootState } from '../../../../store/store';
import Status from './status';

export default function MesAvisPage() {
    const router = useRouter();

    // Get user's reviews from Redux store
    const allReviews = useSelector((state: RootState) => state.reviews.reviews);
    const currentUserId = 1; // TODO: Get from auth state
    const userReviews = allReviews.filter(review => review.userId === currentUserId);

    return (
        <View style={{ flex: 1 }}>
            <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
                <AppBar
                    onMenuPress={() => router.back()}
                    showAvatar={false}
                    showSearch={false}
                    showNotification={false}
                    showSettings={false}
                    title="Mes Avis"
                    backgroundColor="#F5F4DF"
                />

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Section 1: Mon Compte */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>MON COMPTE</Text>
                        <View style={styles.accountCard}>
                            <View style={styles.avatarContainer}>
                                <View style={styles.avatar}>
                                    <Ionicons name="person" size={32} color={Colors.white} />
                                </View>
                            </View>
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>Ameni Aouiti</Text>
                                <Text style={styles.userEmail}>ameni.aouiti@example.com</Text>
                            </View>
                        </View>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Section 2: Mes avis */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>MES AVIS</Text>

                        {userReviews.length === 0 ? (
                            // Empty State
                            <View style={styles.emptyState}>
                                <View style={styles.emptyIconContainer}>
                                    <Ionicons name="chatbubble-outline" size={48} color="#CCC" />
                                </View>
                                <Text style={styles.emptyTitle}>Aucun avis publié</Text>
                                <Text style={styles.emptyMessage}>
                                    Vous n'avez pas encore publié d'avis.{'\n'}
                                    Partagez votre expérience avec la communauté !
                                </Text>
                            </View>
                        ) : (
                            // Reviews List
                            <View style={styles.reviewsList}>
                                {userReviews.map((review) => (
                                    <View key={review.id} style={styles.reviewItem}>
                                        <Status
                                            review={review}
                                            onSharePress={() => console.log('Share', review.id)}
                                            containerStyle={styles.statusContainer}
                                        />
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Bottom Padding */}
                    <View style={{ height: 80 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F4DF',
    },
    content: {
        flex: 1,
        backgroundColor: '#F9F9F9',
    },
    scrollContent: {
        padding: 20,
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#888',
        marginBottom: 12,
        marginLeft: 4,
        letterSpacing: 1,
    },
    accountCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    avatarContainer: {
        marginRight: 16,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a472a',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
    },
    divider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 24,
    },
    emptyState: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    emptyMessage: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        lineHeight: 20,
    },
    reviewsList: {
        gap: 16,
    },
    reviewItem: {
        marginBottom: 0,
    },
    statusContainer: {
        marginHorizontal: 0,
    },
});
