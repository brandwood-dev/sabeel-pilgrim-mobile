import { useThemeColors } from '@/hooks/useThemeColors';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React from 'react';
import {
    Alert,
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

export default function DetailsSuiviScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

    const allMockReservations = [
        {
            id: '1',
            packTitle: 'Umrah Premium Janvier',
            agencyName: 'Al Kawthar Travel',
            status: 'en_attente',
            date: '15 Jan 2026',
            price: '2800 DT',
            image: 'https://images.unsplash.com/photo-1564769625905-aa93094960ea?w=800&q=80',
            progress: 0.35,
            missingDocuments: ['Photo d\'identité', 'Certificat de vaccination Meningocoque', 'Passeport original'],
            timeline: [
                { title: 'Réservation effectuée', date: '01 Jan 2026', status: 'done', icon: 'checkmark-circle' },
                { title: 'Paiement partiel reçu', date: '02 Jan 2026', status: 'done', icon: 'card' },
                { title: 'Vérification des documents', date: 'En cours', status: 'active', icon: 'document-text' },
                { title: 'Demande de Visa', date: 'À venir', status: 'pending', icon: 'earth' },
                { title: 'Confirmation Vol & Hôtel', date: 'À venir', status: 'pending', icon: 'airplane' },
            ]
        },
        {
            id: '2',
            packTitle: 'Umrah Economique Ramadan',
            agencyName: 'Sabil Voyages',
            status: 'validee',
            date: '12 Fév 2026',
            price: '1950 DT',
            image: 'https://images.unsplash.com/photo-1596120064627-4fb8c59a7b45?w=800&q=80',
            progress: 1.0,
            missingDocuments: [],
            timeline: [
                { title: 'Réservation effectuée', date: '10 Déc 2025', status: 'done', icon: 'checkmark-circle' },
                { title: 'Paiement total reçu', date: '12 Déc 2025', status: 'done', icon: 'card' },
                { title: 'Visa validé', date: '20 Déc 2025', status: 'done', icon: 'earth' },
                { title: 'Confirmation Vol & Hôtel', date: '05 Jan 2026', status: 'done', icon: 'airplane' },
                { title: 'Dossier Complet', date: 'Prêt', status: 'done', icon: 'mail-open' },
            ]
        },
        {
            id: '101',
            packTitle: 'Umrah Mawlid 2024',
            agencyName: 'Makkah Tours',
            status: 'validee',
            date: '10 Oct 2024',
            price: '3200 DT',
            image: 'https://images.unsplash.com/photo-1542816404-3908f2a82977?w=800&q=80',
            progress: 1.0,
            missingDocuments: [],
            timeline: [
                { title: 'Voyage Terminé', date: '25 Oct 2024', status: 'done', icon: 'ribbon' },
                { title: 'Arrivée à Médine', date: '18 Oct 2024', status: 'done', icon: 'bus' },
                { title: 'Départ Tunis', date: '10 Oct 2024', status: 'done', icon: 'airplane' },
            ]
        }
    ];

    // Find the specific reservation or fallback to first one
    const reservation = allMockReservations.find(r => r.id === id) || allMockReservations[0];

    const generatePDF = async () => {
        const html = `
            <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
                        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2C5F2D; padding-bottom: 20px; margin-bottom: 30px; }
                        .logo { font-size: 28px; font-weight: bold; color: #2C5F2D; }
                        .receipt-info { text-align: right; font-size: 12px; color: #666; }
                        .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #1a1a1a; }
                        .section { margin-bottom: 25px; }
                        .section-title { font-size: 16px; font-weight: bold; color: #2C5F2D; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
                        .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
                        .detail-label { color: #666; }
                        .detail-value { font-weight: 600; }
                        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 15px; font-size: 12px; font-weight: bold; background-color: ${reservation.status === 'validee' ? '#E8F5E9' : '#FFF3E0'}; color: ${reservation.status === 'validee' ? '#2E7D32' : '#E65100'}; }
                        .signatures { margin-top: 60px; display: flex; justify-content: space-between; }
                        .signature-box { width: 45%; text-align: center; border-top: 1px solid #ccc; padding-top: 10px; }
                        .signature-img { font-family: 'Brush Script MT', cursive; font-size: 24px; color: #555; margin-bottom: 5px; }
                        .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo">SABEEL</div>
                        <div class="receipt-info">
                            <div>Reçu No: REC-${reservation.id}-${Date.now().toString().slice(-4)}</div>
                            <div>Date d'émission: ${new Date().toLocaleDateString('fr-FR')}</div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="title">${reservation.packTitle}</div>
                        <div class="status-badge">${reservation.status === 'validee' ? 'RÉSERVATION CONFIRMÉE' : 'EN COURS DE TRAITEMENT'}</div>
                    </div>

                    <div class="section">
                        <div class="section-title">Détails de la Réservation</div>
                        <div class="detail-row"><span class="detail-label">Agence de voyage:</span> <span class="detail-value">${reservation.agencyName}</span></div>
                        <div class="detail-row"><span class="detail-label">Date du voyage:</span> <span class="detail-value">${reservation.date}</span></div>
                        <div class="detail-row"><span class="detail-label">Prix Total:</span> <span class="detail-value">${reservation.price}</span></div>
                        <div class="detail-row"><span class="detail-label">ID Passager:</span> <span class="detail-value">USR-99283</span></div>
                    </div>

                    <div class="section">
                        <div class="section-title">État d'avancement</div>
                        <div class="detail-row"><span class="detail-label">Progression du dossier:</span> <span class="detail-value">${Math.round(reservation.progress * 100)}%</span></div>
                    </div>

                    <div class="signatures">
                        <div class="signature-box">
                            <div class="signature-img">Sabeel App</div>
                            <div style="font-size: 12px; font-weight: bold;">Cachet Sabeel</div>
                            <div style="font-size: 10px; color: #888;">Document certifié numériquement</div>
                        </div>
                        <div class="signature-box">
                            <div class="signature-img">${reservation.agencyName}</div>
                            <div style="font-size: 12px; font-weight: bold;">Signature Agence</div>
                            <div style="font-size: 10px; color: #888;">Partenaire Sabeel Officiel</div>
                        </div>
                    </div>

                    <div class="footer">
                        <p>Ce document constitue une preuve officielle de votre réservation via l'application Sabeel. Pour toute assistance, veuillez contacter le support Sabeel ou votre agence de voyage directement.</p>
                        <p>&copy; 2026 Sabeel Umrah Platform. Tous droits réservés.</p>
                    </div>
                </body>
            </html>
        `;

        try {
            const { uri } = await Print.printToFileAsync({ html });
            console.log('File has been saved to:', uri);
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            Alert.alert('Erreur', "Impossible de générer le reçu pour le moment.");
            console.error(error);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header Image with Back Button */}
                <View style={styles.imageHeader}>
                    <Image source={{ uri: reservation.image }} style={styles.headerImage} />
                    <SafeAreaView style={styles.headerOverlay}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.headerBadge}>
                            <Text style={styles.headerBadgeText}>Dossier #{reservation.id}</Text>
                        </View>
                    </SafeAreaView>
                </View>

                {/* Main Content */}
                <View style={[styles.content, { backgroundColor: colors.background }]}>
                    <View style={styles.titleSection}>
                        <Text style={[styles.packTitle, { color: colors.text }]}>{reservation.packTitle}</Text>
                        <Text style={[styles.agencyName, { color: colors.primary }]}>{reservation.agencyName}</Text>
                    </View>

                    {/* Progress Card */}
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <View style={styles.cardHeader}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Avancement Global</Text>
                            <Text style={[styles.progressPercent, { color: colors.primary }]}>{Math.round(reservation.progress * 100)}%</Text>
                        </View>
                        <View style={[styles.progressBarBg, { backgroundColor: colors.divider }]}>
                            <View style={[styles.progressBarFill, { width: `${reservation.progress * 100}%`, backgroundColor: colors.primary }]} />
                        </View>
                        <Text style={[styles.progressNote, { color: colors.textSecondary }]}>Votre dossier est en cours de traitement par l'agence.</Text>
                    </View>

                    {/* Missing Documents Section */}
                    {reservation.missingDocuments.length > 0 && (
                        <View style={[styles.card, styles.alertCard, isDarkMode ? { backgroundColor: '#3d1a1a', borderColor: '#8b2e2e' } : { backgroundColor: '#FFF8F8', borderColor: '#FFCDD2' }]}>
                            <View style={styles.alertHeader}>
                                <Ionicons name="warning" size={20} color={isDarkMode ? "#ef9a9a" : "#D32F2F"} />
                                <Text style={[styles.alertTitle, { color: isDarkMode ? "#ef9a9a" : "#D32F2F" }]}>Documents Manquants</Text>
                            </View>
                            <Text style={[styles.alertNote, { color: colors.textSecondary }]}>Veuillez déposer ces documents à l'agence dès que possible :</Text>
                            {reservation.missingDocuments.map((doc, index) => (
                                <View key={index} style={styles.docItem}>
                                    <Ionicons name="close-circle-outline" size={16} color={isDarkMode ? "#ef9a9a" : "#D32F2F"} />
                                    <Text style={[styles.docText, { color: colors.text }]}>{doc}</Text>
                                </View>
                            ))}
                            <TouchableOpacity
                                style={[styles.contactAgencyButton, { borderTopColor: isDarkMode ? '#8b2e2e' : '#FFCDD2' }]}
                                onPress={() => router.push({
                                    pathname: '/(umrah_agence)/(screens)/(chat)/chat_pelerin' as any,
                                    params: { contactName: reservation.agencyName }
                                })}
                            >
                                <Ionicons name="chatbubble-ellipses-outline" size={18} color={isDarkMode ? "#ef9a9a" : "#D32F2F"} />
                                <Text style={[styles.contactAgencyText, { color: isDarkMode ? "#ef9a9a" : "#D32F2F" }]}>Contacter l'agence</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Steps Timeline */}
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Étapes de votre voyage</Text>
                        <View style={styles.timeline}>
                            {reservation.timeline.map((step, index) => (
                                <View key={index} style={styles.timelineItem}>
                                    <View style={styles.timelineLeft}>
                                        <View style={[
                                            styles.timelineDot,
                                            { backgroundColor: isDarkMode ? colors.divider : '#eee' },
                                            step.status === 'done' && [styles.dotDone, { backgroundColor: colors.primary }],
                                            step.status === 'active' && [styles.dotActive, { borderColor: colors.primary, backgroundColor: colors.surface }],
                                        ]}>
                                            <Ionicons
                                                name={step.icon as any}
                                                size={14}
                                                color={step.status === 'done' ? '#fff' : (step.status === 'active' ? colors.primary : colors.textLight)}
                                            />
                                        </View>
                                        {index !== reservation.timeline.length - 1 && <View style={[styles.timelineLine, { backgroundColor: colors.divider }]} />}
                                    </View>
                                    <View style={styles.timelineRight}>
                                        <Text style={[styles.stepTitle, { color: colors.textSecondary }, step.status === 'active' && [styles.activeStepTitle, { color: colors.primary }]]}>
                                            {step.title}
                                        </Text>
                                        <Text style={[styles.stepDate, { color: colors.textSecondary }]}>{step.date}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Practical Info */}
                    <View style={styles.infoSection}>
                        <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
                            <Ionicons name="calendar-outline" size={24} color={colors.primary} />
                            <View>
                                <Text style={[styles.infoBoxLabel, { color: colors.textSecondary }]}>Date de départ</Text>
                                <Text style={[styles.infoBoxValue, { color: colors.text }]}>{reservation.date}</Text>
                            </View>
                        </View>
                        <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
                            <Ionicons name="cash-outline" size={24} color={colors.primary} />
                            <View>
                                <Text style={[styles.infoBoxLabel, { color: colors.textSecondary }]}>Montant Total</Text>
                                <Text style={[styles.infoBoxValue, { color: colors.text }]}>{reservation.price}</Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity style={[styles.mainActionButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={generatePDF}>
                        <Text style={styles.mainActionButtonText}>Télécharger le reçu</Text>
                        <Ionicons name="download-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    imageHeader: {
        height: 250,
        width: '100%',
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerBadge: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    headerBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    content: {
        paddingHorizontal: 20,
        marginTop: -30,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 25,
    },
    titleSection: {
        marginBottom: 20,
    },
    packTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    agencyName: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 4,
    },
    card: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    progressPercent: {
        fontSize: 20,
        fontWeight: '900',
    },
    progressBarBg: {
        height: 10,
        borderRadius: 5,
        marginBottom: 12,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 5,
    },
    progressNote: {
        fontSize: 12,
        fontStyle: 'italic',
    },
    alertCard: {
        borderWidth: 1,
    },
    alertHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    alertTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    alertNote: {
        fontSize: 13,
        marginBottom: 12,
    },
    docItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    docText: {
        fontSize: 14,
        fontWeight: '500',
    },
    contactAgencyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#FFCDD2',
    },
    contactAgencyText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    timeline: {
        marginTop: 5,
    },
    timelineItem: {
        flexDirection: 'row',
        minHeight: 60,
    },
    timelineLeft: {
        alignItems: 'center',
        marginRight: 15,
    },
    timelineDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    dotDone: {
    },
    dotActive: {
        borderWidth: 2,
    },
    timelineLine: {
        width: 2,
        flex: 1,
    },
    timelineRight: {
        paddingTop: 4,
    },
    stepTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    activeStepTitle: {
        fontWeight: 'bold',
    },
    stepDate: {
        fontSize: 12,
        marginTop: 2,
    },
    infoSection: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 20,
    },
    infoBox: {
        flex: 1,
        borderRadius: 15,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        elevation: 1,
    },
    infoBoxLabel: {
        fontSize: 10,
    },
    infoBoxValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    mainActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 15,
        gap: 10,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    mainActionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
