import { Colors } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useThemeColors';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';

interface PaymentMethod {
    id: string;
    title: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    route: string;
    tags: string[];
}

export default function RechargeMenuScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

    const methods: PaymentMethod[] = [
        {
            id: 'card',
            title: 'Carte Bancaire',
            subtitle: 'Mastercard / Visa',
            icon: 'card-outline',
            color: '#1f2937',
            route: '/carte_bancaire',
            tags: ['Instantanné', 'Frais 2%']
        },
        {
            id: 'bank',
            title: 'Virement Bancaire',
            subtitle: 'Wise / Revolut',
            icon: 'globe-outline',
            color: '#0ea5e9',
            route: '/virement_bancaire',
            tags: ['1-2 jours', 'Gratuit']
        },
        {
            id: 'konnect',
            title: 'Transfert Konnect',
            subtitle: 'Konnect → Konnect',
            icon: 'swap-horizontal',
            color: colors.primary,
            route: '/transfert_konnect',
            tags: ['Instantanné', 'Gratuit']
        }
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.primary }]}>Recharger</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Choisissez une méthode pour alimenter votre portefeuille
                </Text>

                <View style={styles.methodsList}>
                    {methods.map((method) => (
                        <TouchableOpacity
                            key={method.id}
                            style={[styles.methodCard, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}
                            onPress={() => router.push(method.route as any)}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? `${method.color}30` : `${method.color}15` }]}>
                                <Ionicons name={method.icon} size={28} color={method.color} />
                            </View>

                            <View style={styles.methodInfo}>
                                <Text style={[styles.methodTitle, { color: colors.text }]}>{method.title}</Text>
                                <Text style={[styles.methodSubtitle, { color: colors.textSecondary }]}>{method.subtitle}</Text>

                                <View style={styles.tagsContainer}>
                                    {method.tags.map((tag, index) => (
                                        <View key={index} style={[styles.tag, { backgroundColor: isDarkMode ? '#2c2c2c' : '#f3f4f6' }]}>
                                            <Text style={[styles.tagText, { color: colors.textSecondary }]}>{tag}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            <Ionicons name="chevron-forward" size={20} color={colors.divider} />
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f7f2',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        backgroundColor: '#f8f7f2',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    backBtn: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.primary,
        flex: 1,
        textAlign: 'center',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    subtitle: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    methodsList: {
        gap: 16,
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    methodInfo: {
        flex: 1,
        gap: 4,
    },
    methodTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    methodSubtitle: {
        fontSize: 13,
        color: '#666',
    },
    tagsContainer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
    },
    tag: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tagText: {
        fontSize: 11,
        color: '#666',
        fontWeight: '500',
    },
});
