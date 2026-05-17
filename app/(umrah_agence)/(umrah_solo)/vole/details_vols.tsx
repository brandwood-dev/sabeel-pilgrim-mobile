import { useThemeColors } from '@/hooks/useThemeColors';
import { RootState } from '@/store/store';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    Linking,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSelector } from 'react-redux';
import { useTrans } from '@/hooks/useTrans';

const PRIMARY_COLOR = '#2C5F2D';
const ACCENT_COLOR = '#97BC62';
const TEXT_DARK = '#1F2937';
const TEXT_LIGHT = '#6B7280';
const BACKGROUND_COLOR = '#F9FAFB';

export default function FlightDetails() {
    const router = useRouter();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const params = useLocalSearchParams();
    const { t } = useTrans();

    // Récupérer les données du vol depuis les paramètres
    const flight = {
        id: params.id as string,
        airline: params.airline as string,
        departureTime: params.departureTime as string,
        arrivalTime: params.arrivalTime as string,
        departureAirport: params.departureAirport as string,
        arrivalAirport: params.arrivalAirport as string,
        departureCity: params.departureCity as string,
        arrivalCity: params.arrivalCity as string,
        duration: params.duration as string,
        stops: params.stops as string,
        price: params.price as string,
        date: params.date as string,
        flightNumber: params.flightNumber as string || 'SV1234',
        aircraft: params.aircraft as string || 'Boeing 777-300ER',
        cabinClass: params.cabinClass as string || 'Économique',
        baggage: params.baggage as string || '23 kg',
        bookingUrl: params.bookingUrl as string,
    };

    const handleBookFlight = () => {
        if (flight.bookingUrl) {
            Linking.openURL(flight.bookingUrl);
        } else {
            // URL par défaut basée sur la compagnie
            const airlineUrls: { [key: string]: string } = {
                'Saudi Airlines': 'https://www.saudia.com',
                'Air France': 'https://www.airfrance.fr',
                'Emirates': 'https://www.emirates.com',
                'Turkish Airlines': 'https://www.turkishairlines.com',
                'Qatar Airways': 'https://www.qatarairways.com',
                'EgyptAir': 'https://www.egyptair.com',
            };

            const url = airlineUrls[flight.airline] || 'https://www.google.com/flights';
            Linking.openURL(url);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.background }]}>
                    <Ionicons name="arrow-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t('Détails du vol')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Airline Info Card */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                    <View style={styles.airlineHeader}>
                        <View style={[styles.logoContainer, { backgroundColor: colors.background, borderColor: colors.primary }]}>
                            <Text style={[styles.logoText, { color: colors.primary }]}>{flight.airline.substring(0, 2).toUpperCase()}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.airlineName, { color: colors.text }]}>{flight.airline}</Text>
                            <Text style={[styles.flightNumber, { color: colors.textSecondary }]}>{t('Vol')} {flight.flightNumber}</Text>
                        </View>
                        <View style={styles.priceTag}>
                            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>{t('Prix Total (GDS)')}</Text>
                            <Text style={[styles.priceValue, { color: colors.primary }]}>{params.price} {params.currency || '€'}</Text>
                            {params.currency !== 'EUR' && (
                                <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>{params.priceEur} € {t('(Converti)')}</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Flight Route Card */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{t('Itinéraire')}</Text>
                    <Text style={[styles.dateText, { color: colors.textSecondary }]}>{flight.date}</Text>

                    <View style={styles.routeTimeline}>
                        {/* Departure */}
                        <View style={styles.timelinePoint}>
                            <Text style={[styles.timeText, { color: colors.text }]}>{flight.departureTime}</Text>
                            <Text style={[styles.airportCode, { color: colors.primary }]}>{flight.departureAirport}</Text>
                            <Text style={[styles.cityText, { color: colors.textSecondary }]}>{flight.departureCity}</Text>
                        </View>

                        {/* Route Line */}
                        <View style={styles.routeLineContainer}>
                            <View style={[styles.durationBadge, { backgroundColor: colors.background }]}>
                                <Ionicons name="time-outline" size={14} color={colors.primary} />
                                <Text style={[styles.durationText, { color: colors.text }]}>{flight.duration}</Text>
                            </View>
                            <View style={styles.routeLine}>
                                <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
                                <View style={[styles.dashedLine, { backgroundColor: colors.divider }]} />
                                <Ionicons name="airplane" size={20} color={colors.primary} style={styles.planeIcon} />
                                <View style={[styles.dashedLine, { backgroundColor: colors.divider }]} />
                                <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
                            </View>
                            {flight.stops !== t('Direct') && (
                                <Text style={[styles.stopsText, { color: colors.textSecondary }]}>{flight.stops}</Text>
                            )}
                        </View>

                        {/* Arrival */}
                        <View style={styles.timelinePoint}>
                            <Text style={[styles.timeText, { color: colors.text }]}>{flight.arrivalTime}</Text>
                            <Text style={[styles.airportCode, { color: colors.primary }]}>{flight.arrivalAirport}</Text>
                            <Text style={[styles.cityText, { color: colors.textSecondary }]}>{flight.arrivalCity}</Text>
                        </View>
                    </View>
                </View>

                {/* Flight Details Card */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{t('Informations du vol')}</Text>

                    <View style={[styles.detailRow, { borderBottomColor: colors.divider }]}>
                        <View style={styles.detailItem}>
                            <Ionicons name="airplane-outline" size={20} color={colors.primary} />
                            <Text style={[styles.detailLabel, { color: colors.text }]}>{t('Appareil')}</Text>
                        </View>
                        <Text style={[styles.detailValue, { color: colors.text }]}>{flight.aircraft}</Text>
                    </View>

                    <View style={[styles.detailRow, { borderBottomColor: colors.divider }]}>
                        <View style={styles.detailItem}>
                            <Ionicons name="business-outline" size={20} color={colors.primary} />
                            <Text style={[styles.detailLabel, { color: colors.text }]}>{t('Classe')}</Text>
                        </View>
                        <Text style={[styles.detailValue, { color: colors.text }]}>{params.cabin || 'ECONOMY'}</Text>
                    </View>
 
                    <View style={[styles.detailRow, { borderBottomColor: colors.divider }]}>
                        <View style={styles.detailItem}>
                            <Ionicons name="bag-handle-outline" size={20} color={colors.primary} />
                            <Text style={[styles.detailLabel, { color: colors.text }]}>{t('Bagages')}</Text>
                        </View>
                        <Text style={[styles.detailValue, { color: colors.text }]}>{params.baggage || '0 PC'}</Text>
                    </View>

                    <View style={[styles.detailRow, { borderBottomColor: colors.divider }]}>
                        <View style={styles.detailItem}>
                            <Ionicons name="swap-horizontal-outline" size={20} color={colors.primary} />
                            <Text style={[styles.detailLabel, { color: colors.text }]}>{t('Escales')}</Text>
                        </View>
                        <Text style={[styles.detailValue, { color: colors.text }]}>
                            {flight.stops} {params.stopoverCityName ? `(${params.stopoverCityName})` : ''}
                        </Text>
                    </View>
                </View>

                {/* Services Included */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{t('Services inclus')}</Text>

                    <View style={styles.serviceItem}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                        <Text style={[styles.serviceText, { color: colors.text }]}>{t('Repas à bord')}</Text>
                    </View>

                    <View style={styles.serviceItem}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                        <Text style={[styles.serviceText, { color: colors.text }]}>{t('Divertissement en vol')}</Text>
                    </View>

                    <View style={styles.serviceItem}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                        <Text style={[styles.serviceText, { color: colors.text }]}>{t('Wi-Fi disponible')}</Text>
                    </View>

                    <View style={styles.serviceItem}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                        <Text style={[styles.serviceText, { color: colors.text }]}>{t('Sélection de siège gratuite')}</Text>
                    </View>
                </View>

                {/* Important Info */}
                <View style={[styles.infoCard, { backgroundColor: isDarkMode ? 'rgba(37, 99, 235, 0.1)' : '#EFF6FF', borderColor: isDarkMode ? 'rgba(37, 99, 235, 0.3)' : '#BFDBFE' }]}>
                    <Ionicons name="information-circle" size={24} color="#2563EB" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.infoTitle, { color: isDarkMode ? '#60A5FA' : '#1E40AF' }]}>{t('Information importante')}</Text>
                        <Text style={[styles.infoText, { color: isDarkMode ? '#93C5FD' : '#1E40AF' }]}>
                            {t("Veuillez arriver à l'aéroport au moins 3 heures avant le départ pour les vols internationaux.")}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Button */}
            <View style={[styles.bottomContainer, { backgroundColor: colors.surface, borderTopColor: colors.divider }]}>
                <TouchableOpacity style={[styles.bookButton, { backgroundColor: colors.primary }]} onPress={handleBookFlight}>
                    <Ionicons name="globe-outline" size={20} color="#fff" />
                    <Text style={styles.bookButtonText}>{t('Réserver sur')} {flight.airline}</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: TEXT_DARK,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: TEXT_DARK,
        marginBottom: 16,
    },
    airlineHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 2,
        borderColor: PRIMARY_COLOR,
    },
    logoText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: PRIMARY_COLOR,
    },
    airlineName: {
        fontSize: 16,
        fontWeight: '700',
        color: TEXT_DARK,
    },
    flightNumber: {
        fontSize: 12,
        color: TEXT_LIGHT,
        marginTop: 2,
    },
    priceTag: {
        alignItems: 'flex-end',
    },
    priceLabel: {
        fontSize: 10,
        color: TEXT_LIGHT,
        marginBottom: 2,
    },
    priceValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: PRIMARY_COLOR,
    },
    dateText: {
        fontSize: 12,
        color: TEXT_LIGHT,
        marginBottom: 16,
    },
    routeTimeline: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    timelinePoint: {
        alignItems: 'center',
        flex: 1,
    },
    timeText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: TEXT_DARK,
        marginBottom: 4,
    },
    airportCode: {
        fontSize: 14,
        fontWeight: '700',
        color: PRIMARY_COLOR,
        marginBottom: 4,
    },
    cityText: {
        fontSize: 11,
        color: TEXT_LIGHT,
        textAlign: 'center',
    },
    routeLineContainer: {
        flex: 2,
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    durationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 8,
    },
    durationText: {
        fontSize: 11,
        fontWeight: '600',
        color: TEXT_DARK,
        marginLeft: 4,
    },
    routeLine: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    routeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: PRIMARY_COLOR,
    },
    dashedLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 4,
    },
    planeIcon: {
        marginHorizontal: 4,
    },
    stopsText: {
        fontSize: 10,
        color: TEXT_LIGHT,
        marginTop: 4,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 14,
        color: TEXT_DARK,
        marginLeft: 10,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: TEXT_DARK,
    },
    serviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    serviceText: {
        fontSize: 14,
        color: TEXT_DARK,
        marginLeft: 10,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E40AF',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 12,
        color: '#1E40AF',
        lineHeight: 18,
    },
    bottomContainer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    bookButton: {
        backgroundColor: PRIMARY_COLOR,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        elevation: 3,
        shadowColor: PRIMARY_COLOR,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    bookButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginHorizontal: 10,
    },
});
