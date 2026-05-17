import { useThemeColors } from '@/hooks/useThemeColors';
import { RootState } from '@/store/store';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    FlatList,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Platform,
    Dimensions,
    ScrollView,
    ActivityIndicator,
    TextInput
} from 'react-native';
import { useSelector } from 'react-redux';
import { useTrans } from '@/hooks/useTrans';

const { width } = Dimensions.get('window');
const PRIMARY = '#2C5F2D';

interface Flight {
    id: string;
    airline: string;
    logo: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    price: number;
    currency: string;
    priceEur: number;
    stops: 'Direct' | '1 Escale' | '2 Escales';
    departureAirport: string;
    departureAirportCode: string;
    departureCountry: string;
    arrivalAirport: string;
    arrivalAirportCode: string;
    arrivalCountry: string;
    date: string;
    departureCity?: string;
    arrivalCity?: string;
    stopoverCity?: string;
    stopoverCityName?: string;
    flightNumber?: string;
    cabin?: string;
    baggage?: string;
}

const COUNTRY_MAP: { [key: string]: string } = {
    'CDG': 'France', 'TUN': 'Tunisie', 'CAS': 'Maroc', 'LON': 'UK', 'FRA': 'Allemagne', 
    'MAD': 'Espagne', 'DXB': 'Émirats', 'CAI': 'Égypte', 'ALG': 'Algérie'
};

const FILTERS = ['All', 'Direct', '1 Escale', '2 Escales'];

export default function FlightList() {
    const router = useRouter();
    const { t } = useTrans();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

    const [flights, setFlights] = useState<Flight[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    const TXT = isDarkMode ? '#fff' : '#1C1C1E';
    const TXT_SEC = isDarkMode ? '#8E8E93' : '#636366';
    const CARD = isDarkMode ? '#1C1C1E' : '#FFFFFF';
    const BD = isDarkMode ? '#38383A' : '#E5E5EA';
    const inputBackgroundColor = isDarkMode ? '#2D2D2D' : '#F8F9FA';
    const borderColor = isDarkMode ? '#333333' : '#E9ECEF';

    const fetchFlights = async (origin: string, date: string) => {
        if (!origin || !date) return;
        setLoading(true);
        try {
            const { amadeusApi } = await import('@/services/api');
            const response = await amadeusApi.searchFlightsToSaudi(origin, date);
            const { data, dictionaries } = response.data;
            
            const mapped: Flight[] = data.map((fo: any) => {
                const it = fo.itineraries[0];
                const segment = it.segments[0];
                const lastSegment = it.segments[it.segments.length - 1];
                const carrierName = dictionaries.carriers[segment.carrierCode] || segment.carrierCode;
                
                const rawPrice = parseFloat(fo.price.grandTotal || fo.price.total);
                const currency = fo.price.currency;
                
                let priceEur = 0;
                if (currency === 'EUR') {
                    priceEur = Math.round(rawPrice);
                } else if (currency === 'TND') {
                    priceEur = Math.round(rawPrice * 0.3);
                } else {
                    priceEur = Math.round(rawPrice * 0.95);
                }

                const depTime = segment.departure.at.split('T')[1].substring(0, 5);
                const arrTime = lastSegment.arrival.at.split('T')[1].substring(0, 5);

                const stopCode = it.segments.length > 1 ? it.segments[0].arrival.iataCode : undefined;
                
                const travelerPricing = fo.travelerPricings[0];
                const fareDetails = travelerPricing.fareDetailsBySegment[0];
                const cabin = fareDetails.cabin;
                const baggage = fareDetails.includedCheckedBags?.quantity || '0';

                return {
                    id: fo.id,
                    airline: carrierName,
                    logo: segment.carrierCode,
                    departureTime: depTime,
                    arrivalTime: arrTime,
                    duration: it.duration.replace('PT', '').toLowerCase(),
                    price: rawPrice,
                    currency: currency,
                    priceEur: priceEur,
                    stops: it.segments.length === 1 ? t('Direct') : `${it.segments.length - 1} ${t('Escale')}`,
                    departureAirport: dictionaries.locations[segment.departure.iataCode]?.cityCode || segment.departure.iataCode,
                    departureAirportCode: segment.departure.iataCode,
                    departureCountry: COUNTRY_MAP[segment.departure.iataCode] || 'International',
                    arrivalAirport: dictionaries.locations[lastSegment.arrival.iataCode]?.cityCode || lastSegment.arrival.iataCode,
                    arrivalAirportCode: lastSegment.arrival.iataCode,
                    arrivalCountry: 'Saudi Arabia',
                    date: new Date(segment.departure.at.split('T')[0]).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
                    departureCity: dictionaries.locations[segment.departure.iataCode]?.cityName || segment.departure.iataCode,
                    arrivalCity: dictionaries.locations[lastSegment.arrival.iataCode]?.cityName || lastSegment.arrival.iataCode,
                    stopoverCity: stopCode,
                    stopoverCityName: stopCode ? (dictionaries.locations[stopCode]?.cityName || stopCode) : undefined,
                    flightNumber: segment.carrierCode + segment.number,
                    cabin: cabin,
                    baggage: `${baggage} PC`
                };
            });
            setFlights(mapped);
        } catch (error) {
            console.error('Error fetching flights:', error);
            setFlights([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFlights('PAR', new Date().toISOString().split('T')[0]);
    }, []);

    const filteredFlights = flights.filter(flight => {
        const query = searchQuery.toLowerCase();
        const matchesQuery = flight.airline.toLowerCase().includes(query) ||
            flight.departureCity?.toLowerCase().includes(query) ||
            flight.arrivalCity?.toLowerCase().includes(query);
        
        const matchesStops = activeFilter === 'All' || flight.stops.includes(activeFilter);
        return matchesQuery && matchesStops;
    });

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#000' : '#F8F9FA' }}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={TXT} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: TXT }]}>{t('Vols Umrah')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.searchWrapper}>
                <View style={[styles.searchBar, { backgroundColor: inputBackgroundColor, borderColor }]}>
                    <Ionicons name="search-outline" size={20} color={TXT_SEC} />
                    <TextInput
                        style={[styles.searchInput, { color: TXT }]}
                        placeholder={t('Rechercher un vol...')}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={TXT_SEC}
                    />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
                    {FILTERS.map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[
                                styles.filterChip,
                                { backgroundColor: CARD, borderColor: BD },
                                activeFilter === f && { backgroundColor: PRIMARY, borderColor: PRIMARY }
                            ]}
                            onPress={() => setActiveFilter(f)}
                        >
                            <Text style={[styles.filterChipText, { color: TXT_SEC }, activeFilter === f && { color: '#fff' }]}>
                                {t(f)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading && (
                <View style={styles.loaderOverlay}>
                    <ActivityIndicator size="large" color={PRIMARY} />
                    <Text style={{ color: TXT_SEC, marginTop: 10, fontWeight: '600' }}>{t('Synchronisation GDS (Prix réels)...')}</Text>
                </View>
            )}

            <FlatList
                data={filteredFlights}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: CARD, borderColor: BD }]}
                        activeOpacity={0.8}
                        onPress={() => router.push({
                            pathname: '/(umrah_agence)/(umrah_solo)/vole/details_vols',
                            params: {
                                id: item.id,
                                airline: item.airline,
                                departureTime: item.departureTime,
                                arrivalTime: item.arrivalTime,
                                departureAirport: item.departureAirportCode,
                                arrivalAirport: item.arrivalAirportCode,
                                departureCity: item.departureCity || '',
                                arrivalCity: item.arrivalCity || '',
                                duration: item.duration,
                                stops: item.stops,
                                price: item.price.toString(),
                                currency: item.currency,
                                priceEur: item.priceEur.toString(),
                                date: item.date,
                                flightNumber: item.flightNumber,
                                cabin: item.cabin || 'ECONOMY',
                                baggage: item.baggage || '0 PC'
                            }
                        })}
                    >
                        <View style={styles.cardTop}>
                            <View style={styles.airlineWrap}>
                                <View style={[styles.logoBox, { backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7' }]}>
                                    <Text style={[styles.logoTxt, { color: PRIMARY }]}>{item.logo}</Text>
                                </View>
                                <View>
                                    <Text style={[styles.airlineName, { color: TXT }]}>{item.airline}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Ionicons name="briefcase-outline" size={12} color={PRIMARY} />
                                        <Text style={[styles.dateTxt, { color: TXT_SEC }]}>{item.cabin} • {item.baggage}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.priceWrap}>
                                <Text style={[styles.priceVal, { color: PRIMARY }]}>{item.price} {item.currency}</Text>
                                <Text style={[styles.priceEur, { color: TXT_SEC }]}>{item.priceEur} € ({t('Net')})</Text>
                            </View>
                        </View>

                        <View style={styles.timelineWrap}>
                            <View style={styles.timePoint}>
                                <Text style={[styles.timeTxt, { color: TXT }]}>{item.departureTime}</Text>
                                <Text style={[styles.codeTxt, { color: PRIMARY }]}>{item.departureAirportCode}</Text>
                            </View>

                            <View style={styles.pathWrap}>
                                <Text style={[styles.durationTxt, { color: TXT_SEC }]}>{item.duration}</Text>
                                <View style={styles.lineBox}>
                                    <View style={[styles.dot, { backgroundColor: BD }]} />
                                    <View style={[styles.line, { backgroundColor: BD }]} />
                                    <Ionicons name="airplane" size={16} color={PRIMARY} />
                                    <View style={[styles.line, { backgroundColor: BD }]} />
                                    <View style={[styles.dot, { backgroundColor: BD }]} />
                                </View>
                                <Text style={[ss.stopTxt, { color: item.stops === t('Direct') ? '#16A34A' : '#D97706' }]}>
                                    {item.stops} {item.stopoverCityName ? `(${item.stopoverCityName})` : ''}
                                </Text>
                            </View>

                            <View style={styles.timePoint}>
                                <Text style={[styles.timeTxt, { color: TXT }]}>{item.arrivalTime}</Text>
                                <Text style={[styles.codeTxt, { color: PRIMARY }]}>{item.arrivalAirportCode}</Text>
                            </View>
                        </View>

                        <View style={[styles.cardFooter, { borderTopColor: BD }]}>
                            <Text style={[styles.footerInfo, { color: TXT_SEC }]}>
                                <Ionicons name="location-outline" size={12} /> {item.departureCity} ➔ {item.arrivalCity}
                            </Text>
                            <View style={[ss.infoBadge, { backgroundColor: 'rgba(44, 95, 45, 0.1)' }]}>
                                <Text style={[ss.infoBadgeText, { color: PRIMARY }]}>{t('Meilleur prix GDS')}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    !loading ? (
                    <View style={styles.emptyWrap}>
                        <Ionicons name="airplane-outline" size={60} color={BD} />
                        <Text style={[styles.emptyTxt, { color: TXT }]}>{t('Aucun vol trouvé')}</Text>
                        <Text style={{ color: TXT_SEC, textAlign: 'center', marginTop: 8 }}>{t('Vérifiez les tarifs sur Turkish Airlines Direct.')}</Text>
                    </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
}

const ss = StyleSheet.create({
    stopTxt: { fontSize: 9, fontWeight: '700', marginTop: 2 },
    infoBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    infoBadgeText: { fontSize: 10, fontWeight: '700' }
});

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 15,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    searchWrapper: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        borderWidth: 1,
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
    },
    filterScroll: {
        marginBottom: 5,
    },
    filterContent: {
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '600',
    },
    listContent: { paddingVertical: 8, paddingBottom: 120 },
    card: { marginHorizontal: 16, marginBottom: 12, borderRadius: 18, padding: 12, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    airlineWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    logoBox: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    logoTxt: { fontSize: 11, fontWeight: '800' },
    airlineName: { fontSize: 14, fontWeight: '700' },
    dateTxt: { fontSize: 10 },
    priceWrap: { alignItems: 'flex-end' },
    priceVal: { fontSize: 16, fontWeight: '800' },
    priceEur: { fontSize: 11 },
    timelineWrap: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
    timePoint: { alignItems: 'center', width: 60 },
    timeTxt: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
    codeTxt: { fontSize: 12, fontWeight: '600' },
    pathWrap: { flex: 1, alignItems: 'center', paddingTop: 2 },
    durationTxt: { fontSize: 10, fontWeight: '600', marginBottom: 2 },
    lineBox: { flexDirection: 'row', alignItems: 'center', gap: 4, width: '85%' },
    line: { flex: 1, height: 1.2 },
    dot: { width: 4, height: 4, borderRadius: 2 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1 },
    footerInfo: { fontSize: 10, fontWeight: '500' },
    emptyWrap: { alignItems: 'center', paddingTop: 100, paddingHorizontal: 40 },
    emptyTxt: { fontSize: 16, fontWeight: '700', marginTop: 16 },
    loaderOverlay: { paddingVertical: 20, alignItems: 'center' }
});
