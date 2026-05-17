import { useThemeColors } from '@/hooks/useThemeColors';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSelector } from 'react-redux';



interface NotificationItem {
    id: string;
    title: string;
    message: string;
    time: string;
    type: 'reservation' | 'chat' | 'system';
    isRead: boolean;
}

const mockNotifications: NotificationItem[] = [
    {
        id: '1',
        title: 'Documents validés',
        message: 'L\'agence Al Kawthar a validé votre certificat de vaccination.',
        time: 'Il y a 2h',
        type: 'reservation',
        isRead: false,
    },
    {
        id: '2',
        title: 'Nouveau message',
        message: 'Votre guide Ahmed vous a envoyé un message concernant le départ.',
        time: 'Il y a 5h',
        type: 'chat',
        isRead: false,
    },
    {
        id: '3',
        title: 'Rappel de voyage',
        message: 'Votre départ pour La Mecque est prévu dans 2 jours. Préparez vos bagages !',
        time: 'Hier',
        type: 'system',
        isRead: true,
    },
    {
        id: '4',
        title: 'Offre Spéciale',
        message: 'Découvrez nos nouveaux packs Umrah Ramadan à prix réduit.',
        time: '2 jours',
        type: 'system',
        isRead: true,
    },
];

export default function NotificationScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);

    const getIcon = (type: string) => {
        switch (type) {
            case 'reservation': return { name: 'document-text', color: '#2196F3' };
            case 'chat': return { name: 'chatbubble-ellipses', color: '#4CAF50' };
            default: return { name: 'notifications', color: colors.primary };
        }
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const renderNotification = ({ item }: { item: NotificationItem }) => {
        const iconData = getIcon(item.type);
        return (
            <TouchableOpacity
                style={[styles.notificationCard, { backgroundColor: colors.surface }, !item.isRead && [styles.unreadCard, { borderLeftColor: colors.primary }]]}
                activeOpacity={0.7}
            >
                <View style={[styles.iconBox, { backgroundColor: iconData.color + '15' }]}>
                    <Ionicons name={iconData.name as any} size={22} color={iconData.color} />
                </View>
                <View style={styles.contentBox}>
                    <View style={styles.notifHeader}>
                        <Text style={[styles.notifTitle, { color: colors.textSecondary }, !item.isRead && [styles.unreadText, { color: colors.text }]]}>{item.title}</Text>
                        <Text style={[styles.timeText, { color: colors.textLight }]}>{item.time}</Text>
                    </View>
                    <Text style={[styles.messageText, { color: colors.textSecondary }]} numberOfLines={2}>{item.message}</Text>
                </View>
                {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.background }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
                    <TouchableOpacity onPress={markAllAsRead}>
                        <Text style={[styles.markReadText, { color: colors.primary }]}>Tout lire</Text>
                    </TouchableOpacity>
                </View>

                {notifications.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="notifications-off-outline" size={80} color={colors.textLight} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucune notification</Text>
                        <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Vous serez averti ici dès qu'il y aura du nouveau.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={notifications}
                        keyExtractor={item => item.id}
                        renderItem={renderNotification}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    closeButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    markReadText: {
        fontSize: 13,
        fontWeight: '600',
    },
    listContent: {
        paddingHorizontal: 15,
        paddingBottom: 30,
    },
    notificationCard: {
        flexDirection: 'row',
        padding: 15,
        borderRadius: 15,
        marginBottom: 10,
        alignItems: 'center',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    unreadCard: {
        borderLeftWidth: 4,
    },
    iconBox: {
        width: 46,
        height: 46,
        borderRadius: 23,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    contentBox: {
        flex: 1,
    },
    notifHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    notifTitle: {
        fontSize: 15,
        fontWeight: '500',
    },
    unreadText: {
        fontWeight: 'bold',
    },
    timeText: {
        fontSize: 11,
    },
    messageText: {
        fontSize: 13,
        lineHeight: 18,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 10,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        marginTop: -50,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
    },
    emptySub: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 20,
    },
});
