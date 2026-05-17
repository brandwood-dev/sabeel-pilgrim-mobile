import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Platform,
    ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { RootState } from '@/store/store';
import { useTrans } from '@/hooks/useTrans';
import { useDrawer } from '@/context/DrawerContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import AppBar from '../(screens)/(navigation)/app_barr';
import { GuideList } from './guides';
import { HotelList } from './hotels/hotels';
import { FlightList } from './vole/vole';

const { width } = Dimensions.get('window');

// PROFESSIONAL CHART COLORS (MATCHING PROFILE)
const PRIMARY = '#2C5F2D';
const CARD_BG = '#FFFFFF';
const PAGE_BG = '#F8F9FA';
const TEXT = '#1C1C1E';
const TEXT_SEC = '#636366';
const DIVIDER = '#E5E5EA';

interface HotelFilter {
    rating: number | null;
    location: string;
}

interface FlightFilter {
    stops: 'All' | 'Direct' | '1 Escale' | '2 Escales';
    priceRange: number[];
    date: string | null;
    departureCountry: string;
    arrivalCountry: string;
}

interface GuideFilter {
    rating: number | null;
}

export default function SoloUmrahScreen() {
    const { t, language } = useTrans();
    const router = useRouter();
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const isRTL = language === 'ar';

    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const flatListRef = useRef<FlatList>(null);
    const { openDrawer } = useDrawer();
    const [showFilterSheet, setShowFilterSheet] = useState(false);

    // Dynamic Colors based on mode
    const BG = isDarkMode ? '#000' : PAGE_BG;
    const CARD = isDarkMode ? '#1C1C1E' : CARD_BG;
    const TXT = isDarkMode ? '#fff' : TEXT;
    const TXT_SEC = isDarkMode ? '#8E8E93' : TEXT_SEC;
    const BD = isDarkMode ? '#38383A' : DIVIDER;

    // Filter states
    const [hotelFilter, setHotelFilter] = useState<HotelFilter>({ rating: null, location: 'All' });
    const [flightFilter, setFlightFilter] = useState<FlightFilter>({
        stops: 'All',
        priceRange: [400, 3000],
        date: new Date().toISOString().split('T')[0],
        departureCountry: 'CDG', // This will act as origin city
        arrivalCountry: 'JED'
    });
    const [guideFilter, setGuideFilter] = useState<GuideFilter>({ rating: null });

    const tabs = [
        { id: 0, title: t('Hôtels'), icon: 'bed-outline', iconActive: 'bed' },
        { id: 1, title: t('Vols'), icon: 'airplane-outline', iconActive: 'airplane' },
        { id: 2, title: t('Guides'), icon: 'people-outline', iconActive: 'people' },
    ];

    const components = [
        <HotelList key="hotels" searchQuery={searchQuery} filter={hotelFilter} />,
        <FlightList key="flights" searchQuery={searchQuery} filter={flightFilter} />,
        <GuideList key="guides" searchQuery={searchQuery} filter={guideFilter} />,
    ];

    const handleTabPress = (index: number) => {
        setActiveTabIndex(index);
        flatListRef.current?.scrollToIndex({ index, animated: true });
    };

    const onMomentumScrollEnd = (e: any) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / width);
        setActiveTabIndex(index);
    };

    const formatSummaryDate = (dateStr: string) => {
        const date = new Date(dateStr || Date.now());
        const locale = language === 'ar' ? 'ar-SA' : language === 'en' ? 'en-US' : 'fr-FR';
        return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
    };

    return (
        <View style={[ss.container, { backgroundColor: BG }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            <View style={ss.main}>
                {/* Header with Uber-style Search */}
                <View style={[ss.header, { borderBottomColor: BD }]}>
                    <AppBar
                        onMenuPress={openDrawer}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        showNotification={false}
                        showFilter={true}
                        onFilterPress={() => setShowFilterSheet(true)}
                        backgroundColor="transparent"
                    />

                    {/* Modern Tab Bar */}
                    <View style={[ss.tabContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        {tabs.map((tab, index) => {
                            const active = activeTabIndex === index;
                            return (
                                <TouchableOpacity
                                    key={tab.id}
                                    onPress={() => handleTabPress(index)}
                                    style={[ss.tabBtn, active && { borderBottomColor: PRIMARY }]}
                                >
                                    <Ionicons
                                        name={(active ? tab.iconActive : tab.icon) as any}
                                        size={20}
                                        color={active ? PRIMARY : TXT_SEC}
                                    />
                                    <Text style={[ss.tabText, { color: active ? PRIMARY : TXT_SEC, fontWeight: active ? '700' : '500' }]}>
                                        {tab.title}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Selected Flight Summary Bar - New */}
                    {activeTabIndex === 1 && (
                        <TouchableOpacity style={[ss.flightSummaryBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={() => setShowFilterSheet(true)}>
                            <View style={[ss.summarySection, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                <Ionicons name="airplane" size={16} color={PRIMARY} />
                                <Text style={[ss.summaryText, { color: TXT }]}>{flightFilter.departureCountry}</Text>
                            </View>
                            <Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={14} color={TXT_SEC} />
                            <View style={[ss.summarySection, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                <Ionicons name="calendar-outline" size={16} color={PRIMARY} />
                                <Text style={[ss.summaryText, { color: TXT }]}>{formatSummaryDate(flightFilter.date!)}</Text>
                            </View>
                            <View style={[ss.editBadge, isRTL ? { marginRight: 'auto', marginLeft: 0 } : { marginLeft: 'auto', marginRight: 0 }]}><Text style={ss.editBadgeText}>{t('Modifier')}</Text></View>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Content */}
                <FlatList
                    ref={flatListRef}
                    data={components}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={({ item }) => (
                        <View style={{ width, flex: 1 }}>
                            {item}
                        </View>
                    )}
                    onMomentumScrollEnd={onMomentumScrollEnd}
                    style={{ flex: 1 }}
                    inverted={isRTL}
                />
            </View>

            {/* BOTTOM SHEET FILTERS */}
            <Modal visible={showFilterSheet} transparent animationType="slide" onRequestClose={() => setShowFilterSheet(false)}>
                <TouchableOpacity style={ss.sheetOverlay} activeOpacity={1} onPress={() => setShowFilterSheet(false)}>
                    <TouchableOpacity activeOpacity={1} style={[ss.actionSheet, { backgroundColor: CARD, paddingBottom: insets.bottom + 24 }]}>
                        <View style={[ss.sheetHandle, { backgroundColor: BD }]} />

                        <TouchableOpacity style={[ss.sheetClose, isRTL ? { left: 24, right: undefined } : { right: 24, left: undefined }]} onPress={() => setShowFilterSheet(false)}>
                            <Ionicons name="close" size={24} color={TXT_SEC} />
                        </TouchableOpacity>

                        <Text style={[ss.sheetTitle, { color: TXT, textAlign: isRTL ? 'right' : 'left' }]}>
                            {t('Filtres')} {tabs[activeTabIndex].title}
                        </Text>

                        <View style={ss.sheetContent}>
                            {activeTabIndex === 0 && ( // Hotels
                                <View>
                                    <Text style={[ss.label, { color: TXT_SEC, textAlign: isRTL ? 'right' : 'left' }]}>{t('Emplacement')}</Text>
                                    <View style={[ss.filterGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                        {['All', 'Makkah', 'Madinah'].map((loc) => (
                                            <TouchableOpacity
                                                key={loc}
                                                style={[ss.filterChip, { borderColor: BD }, hotelFilter.location === loc && { backgroundColor: PRIMARY, borderColor: PRIMARY }]}
                                                onPress={() => setHotelFilter({ ...hotelFilter, location: loc })}
                                            >
                                                <Text style={[ss.chipText, { color: hotelFilter.location === loc ? '#fff' : TXT_SEC }]}>
                                                    {loc === 'All' ? t('Tous') : t(loc)}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {activeTabIndex === 1 && ( // Flights
                                <View>
                                    <Text style={[ss.label, { color: TXT_SEC, textAlign: isRTL ? 'right' : 'left' }]}>{t('Ville de départ')}</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }} contentContainerStyle={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                                        <View style={[ss.filterGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                            {['CDG', 'TUN', 'CAS', 'ALG', 'DXB', 'CAI', 'LON', 'FRA', 'MAD'].map((city) => (
                                                <TouchableOpacity
                                                    key={city}
                                                    style={[ss.filterChip, { borderColor: BD }, flightFilter.departureCountry === city && { backgroundColor: PRIMARY, borderColor: PRIMARY }]}
                                                    onPress={() => setFlightFilter({ ...flightFilter, departureCountry: city })}
                                                >
                                                    <Text style={[ss.chipText, { color: flightFilter.departureCountry === city ? '#fff' : TXT_SEC }]}>
                                                        {city}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </ScrollView>

                                    <Text style={[ss.label, { color: TXT_SEC, textAlign: isRTL ? 'right' : 'left' }]}>{t('Date du voyage')}</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }} contentContainerStyle={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                                        <View style={[ss.calendarStrip, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                            {Array.from({ length: 14 }, (_, i) => {
                                                const d = new Date();
                                                d.setDate(d.getDate() + i);
                                                const dStr = d.toISOString().split('T')[0];
                                                const locale = language === 'ar' ? 'ar-SA' : language === 'en' ? 'en-US' : 'fr-FR';
                                                return (
                                                    <TouchableOpacity
                                                        key={i}
                                                        style={[ss.dateCard, { borderColor: BD }, flightFilter.date === dStr && { backgroundColor: PRIMARY, borderColor: PRIMARY }]}
                                                        onPress={() => setFlightFilter({ ...flightFilter, date: dStr })}
                                                    >
                                                        <Text style={[ss.dateDay, { color: flightFilter.date === dStr ? '#fff' : TXT_SEC }]}>{d.toLocaleDateString(locale, { weekday: 'short' })}</Text>
                                                        <Text style={[ss.dateNum, { color: flightFilter.date === dStr ? '#fff' : TXT }]}>{d.getDate()}</Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </ScrollView>

                                    <Text style={[ss.label, { color: TXT_SEC, textAlign: isRTL ? 'right' : 'left' }]}>{t('Escales')}</Text>
                                    <View style={[ss.filterGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                        {['All', 'Direct', '1 Escale'].map((stop) => (
                                            <TouchableOpacity
                                                key={stop}
                                                style={[ss.filterChip, { borderColor: BD }, flightFilter.stops === stop && { backgroundColor: PRIMARY, borderColor: PRIMARY }]}
                                                onPress={() => setFlightFilter({ ...flightFilter, stops: stop as any })}
                                            >
                                                <Text style={[ss.chipText, { color: flightFilter.stops === stop ? '#fff' : TXT_SEC }]}>
                                                    {stop === 'All' ? t('Tous') : t(stop)}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {activeTabIndex === 2 && ( // Guides
                                <View>
                                    <Text style={[ss.label, { color: TXT_SEC, textAlign: isRTL ? 'right' : 'left' }]}>{t('Note minimum')}</Text>
                                    <View style={[ss.filterGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                        {[null, 5, 4, 3].map((val) => (
                                            <TouchableOpacity
                                                key={val ? val.toString() : 'all'}
                                                style={[ss.filterChip, { borderColor: BD }, guideFilter.rating === val && { backgroundColor: PRIMARY, borderColor: PRIMARY }]}
                                                onPress={() => setGuideFilter({ ...guideFilter, rating: val })}
                                            >
                                                <Text style={[ss.chipText, { color: guideFilter.rating === val ? '#fff' : TXT_SEC }]}>
                                                    {val === null ? t('Tous') : `${val} ★ +`}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[ss.mainBtn, { backgroundColor: PRIMARY }]}
                            onPress={() => setShowFilterSheet(false)}
                        >
                            <Text style={ss.mainBtnText}>{t('Voir les résultats')}</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const ss = StyleSheet.create({
    container: {
        flex: 1,
    },
    main: {
        flex: 1,
    },
    header: {
        backgroundColor: 'transparent',
        borderBottomWidth: 1,
        paddingTop: Platform.OS === 'ios' ? 44 : 10,
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 8,
        marginTop: 5,
    },
    tabBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabText: {
        fontSize: 14,
    },
    flightSummaryBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: 'rgba(44, 95, 45, 0.05)',
        gap: 12,
    },
    summarySection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    summaryText: {
        fontSize: 14,
        fontWeight: '600',
    },
    editBadge: {
        backgroundColor: PRIMARY,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    editBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    bottomNavWrap: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    // BOTTOM SHEET STYLES
    sheetOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    actionSheet: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: 12,
        paddingHorizontal: 24,
    },
    sheetHandle: {
        width: 40,
        height: 5,
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 16,
    },
    sheetClose: {
        position: 'absolute',
        top: 20,
        zIndex: 10,
    },
    sheetTitle: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 20,
        marginTop: 10,
    },
    sheetContent: {
        marginBottom: 32,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    filterGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1.5,
    },
    calendarStrip: {
        flexDirection: 'row',
        gap: 10,
    },
    dateCard: {
        width: 55,
        height: 70,
        borderRadius: 15,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateDay: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 4,
    },
    dateNum: {
        fontSize: 18,
        fontWeight: '800',
    },
    chipText: {
        fontSize: 14,
        fontWeight: '600',
    },
    mainBtn: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
