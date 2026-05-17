import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Button } from '../../../components/ui/Button';

const { width } = Dimensions.get('window');

export default function QRPelerinScreen() {
    const router = useRouter();
    // In a real app, this would be the user's unique ID
    const pilgrimId = "SABEEL-789-QZ";

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <FontAwesome5 name="arrow-left" size={20} color="#2C5F2D" />
                </TouchableOpacity>
                <Text style={styles.title}>Mon Identifiant</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>Partagez ce code</Text>
                    <Text style={styles.infoSubtitle}>
                        Laissez votre accompagnant scanner ce QR code pour lier vos comptes.
                    </Text>

                    <View style={styles.qrContainer}>
                        <QRCode
                            value={pilgrimId}
                            size={200}
                            color="#2C5F2D"
                            backgroundColor="white"
                        />
                    </View>

                    <View style={styles.idBadge}>
                        <Text style={styles.idLabel}>ID Pèlerin :</Text>
                        <Text style={styles.idValue}>{pilgrimId}</Text>
                    </View>
                </View>

                <View style={styles.featureList}>
                    <View style={styles.featureItem}>
                        <View style={styles.featureIcon}>
                            <FontAwesome5 name="map-marker-alt" size={16} color="#2C5F2D" />
                        </View>
                        <Text style={styles.featureText}>Partage de position en temps réel actif</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <View style={styles.featureIcon}>
                            <FontAwesome5 name="shield-alt" size={16} color="#2C5F2D" />
                        </View>
                        <Text style={styles.featureText}>Sécurité renforcée durant votre séjour</Text>
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <Button
                    title="Accéder à l'accueil"
                    onPress={() => router.replace('/(umrah_agence)/(screens)/acceuil')}
                    style={styles.mainButton}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F4DF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    backButton: {
        padding: 8,
        marginRight: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2C5F2D',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#2C5F2D',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#E8E6D0',
    },
    infoTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2C5F2D',
        marginBottom: 8,
    },
    infoSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 20,
    },
    qrContainer: {
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E8E6D0',
        marginBottom: 24,
    },
    idBadge: {
        flexDirection: 'row',
        backgroundColor: '#F5F4DF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    idLabel: {
        fontSize: 14,
        color: '#4A7C59',
        fontWeight: '600',
        marginRight: 8,
    },
    idValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2C5F2D',
        letterSpacing: 1,
    },
    featureList: {
        marginTop: 40,
        gap: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(44, 95, 45, 0.05)',
        padding: 12,
        borderRadius: 12,
    },
    featureIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    featureText: {
        fontSize: 14,
        color: '#2C5F2D',
        fontWeight: '500',
    },
    footer: {
        padding: 24,
        paddingBottom: 40,
    },
    mainButton: {
        height: 56,
        borderRadius: 16,
    },
});
