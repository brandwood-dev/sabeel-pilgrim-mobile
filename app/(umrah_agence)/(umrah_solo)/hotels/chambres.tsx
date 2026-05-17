import { useThemeColors } from '@/hooks/useThemeColors';
import { RootState } from '@/store/store';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    Linking,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSelector } from 'react-redux';
import { Room } from './types';

const PRIMARY_COLOR = '#2C5F2D';
const BACKGROUND_COLOR = '#f8f7f2';
const TEXT_LIGHT = '#666';

const { width } = Dimensions.get('window');

// Mock room data
const mockRooms: Room[] = [
    {
        id: '1',
        type: 'Chambre Standard Double',
        capacity: 2,
        price: 150,
        features: ['wifi', 'tv', 'coffee'],
        image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
        available: true,
    },
    {
        id: '2',
        type: 'Chambre Deluxe Twin',
        capacity: 2,
        price: 200,
        features: ['wifi', 'tv', 'coffee', 'bath'],
        image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80',
        available: true,
    },
    {
        id: '3',
        type: 'Suite Familiale',
        capacity: 4,
        price: 350,
        features: ['wifi', 'tv', 'coffee', 'bath', 'concierge-bell'],
        image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
        available: true,
    },
    {
        id: '4',
        type: 'Chambre Triple',
        capacity: 3,
        price: 250,
        features: ['wifi', 'tv', 'coffee', 'snowflake'],
        image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80',
        available: true,
    },
];

export default function ChambresScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const params = useLocalSearchParams();
    const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

    const hotelName = params.hotelName as string || 'Hôtel';
    const hotelPrice = parseFloat(params.hotelPrice as string) || 0;
    const partnerUrl = params.partnerUrl as string || 'https://www.booking.com';

    const handleBookRoom = (room: Room) => {
        Linking.openURL(partnerUrl);
    };

    const renderRoomCard = ({ item }: { item: Room }) => (
        <TouchableOpacity
            style={[
                styles.roomCard,
                { backgroundColor: colors.surface, borderColor: 'transparent' },
                selectedRoom === item.id && { borderColor: colors.primary }
            ]}
            onPress={() => setSelectedRoom(item.id)}
            activeOpacity={0.9}
        >
            <Image source={{ uri: item.image }} style={styles.roomImage} resizeMode="cover" />
            <View style={styles.roomContent}>
                <View style={styles.roomHeader}>
                    <Text style={[styles.roomType, { color: colors.text }]}>{item.type}</Text>
                    {item.available && (
                        <View style={[styles.availableBadge, { backgroundColor: `${colors.primary}20` }]}>
                            <Text style={[styles.availableText, { color: colors.primary }]}>Disponible</Text>
                        </View>
                    )}
                </View>

                <View style={styles.roomCapacity}>
                    <Ionicons name="people" size={16} color={colors.textSecondary} />
                    <Text style={[styles.capacityText, { color: colors.textSecondary }]}>{item.capacity} personnes</Text>
                </View>

                <View style={styles.roomFeatures}>
                    {item.features.map((feature, index) => (
                        <View key={index} style={[styles.featureIcon, { backgroundColor: `${colors.primary}15` }]}>
                            <FontAwesome5 name={feature as any} size={12} color={colors.primary} />
                        </View>
                    ))}
                </View>

                <View style={[styles.roomFooter, { borderTopColor: colors.divider }]}>
                    <View>
                        <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Par nuit</Text>
                        <Text style={[styles.price, { color: colors.primary }]}>{item.price} TND</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.selectButton, { backgroundColor: colors.primary }]}
                        onPress={() => handleBookRoom(item)}
                    >
                        <Text style={styles.selectButtonText}>Réserver</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>{hotelName}</Text>
                    <Text style={styles.headerSubtitle}>Sélectionnez votre chambre</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Rooms List */}
            <FlatList
                data={mockRooms}
                keyExtractor={(item) => item.id}
                renderItem={renderRoomCard}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <Text style={[styles.listHeaderTitle, { color: colors.text }]}>{mockRooms.length} chambres disponibles</Text>
                        <Text style={[styles.listHeaderSubtitle, { color: colors.textSecondary }]}>À partir de {hotelPrice} TND par nuit</Text>
                    </View>
                }
            />
        </View>
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
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 15,
        backgroundColor: PRIMARY_COLOR,
    },
    backButton: {
        padding: 4,
    },
    headerInfo: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 2,
    },
    listContent: {
        padding: 16,
    },
    listHeader: {
        marginBottom: 20,
    },
    listHeaderTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    listHeaderSubtitle: {
        fontSize: 14,
        color: TEXT_LIGHT,
    },
    roomCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    roomCardSelected: {
        borderColor: PRIMARY_COLOR,
    },
    roomImage: {
        width: '100%',
        height: 180,
    },
    roomContent: {
        padding: 16,
    },
    roomHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    roomType: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        flex: 1,
        marginRight: 8,
    },
    availableBadge: {
        backgroundColor: `${PRIMARY_COLOR}20`,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    availableText: {
        fontSize: 11,
        color: PRIMARY_COLOR,
        fontWeight: '600',
    },
    roomCapacity: {
        flexDirection: 'row',
        alignItems: 'center',
        // gap: 6, // REMOVED - not supported
        marginBottom: 12,
    },
    capacityText: {
        fontSize: 14,
        color: TEXT_LIGHT,
    },
    roomFeatures: {
        flexDirection: 'row',
        // gap: 8, // REMOVED - not supported
        marginBottom: 16,
    },
    featureIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: `${PRIMARY_COLOR}15`,
        justifyContent: 'center',
        alignItems: 'center',
    },
    roomFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    priceLabel: {
        fontSize: 12,
        color: TEXT_LIGHT,
        marginBottom: 4,
    },
    price: {
        fontSize: 24,
        fontWeight: 'bold',
        color: PRIMARY_COLOR,
    },
    selectButton: {
        backgroundColor: PRIMARY_COLOR,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        elevation: 2,
        shadowColor: PRIMARY_COLOR,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    selectButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
