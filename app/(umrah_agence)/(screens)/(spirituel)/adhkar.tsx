import { useThemeColors } from '@/hooks/useThemeColors';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

// --- Constants ---
const PRIMARY_GREEN = '#2C5F2D';
const GOLD_ACCENT = '#d9ab83';
const LIGHT_BEIGE = '#fdfbf7';

// API URL
const ADHKAR_API_URL = 'https://raw.githubusercontent.com/rn0x/Adhkar-json/main/adhkar.json';

export default function AdhkarScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
    const [expandedDhikr, setExpandedDhikr] = useState<number | null>(null);
    const [adhkarData, setAdhkarData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch Adhkar from API
    useEffect(() => {
        fetchAdhkar();
    }, []);

    const fetchAdhkar = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(ADHKAR_API_URL);
            const data = await response.json();
            setAdhkarData(data);
        } catch (err) {
            console.error('Error fetching adhkar:', err);
            setError('Impossible de charger les adhkar');
        } finally {
            setLoading(false);
        }
    };

    // Get main categories from API data
    const getMainCategories = () => {
        if (!adhkarData || adhkarData.length === 0) return [];

        // Define main categories with their filters
        const mainCategories = [
            {
                id: 1,
                title: 'أذكار الصباح والمساء',
                titleFr: 'Matin et Soir',
                icon: 'sunny-outline',
                color: ['#2C5F2D', '#4A7C59'],
                filter: (item: any) => item.category === 'أذكار الصباح والمساء'
            },
            {
                id: 2,
                title: 'أذكار بعد الصلاة',
                titleFr: 'Après la prière',
                icon: 'hand-left-outline',
                color: ['#d9ab83', '#c49968'],
                filter: (item: any) => item.category === 'أذكار بعد السلام من الصلاة المفروضة'
            },
            {
                id: 3,
                title: 'أذكار النوم',
                titleFr: 'Avant de dormir',
                icon: 'bed-outline',
                color: ['#2C5F2D', '#4A7C59'],
                filter: (item: any) => item.category === 'أذكار النوم'
            },
            {
                id: 4,
                title: 'أذكار الاستيقاظ',
                titleFr: 'Au réveil',
                icon: 'alarm-outline',
                color: ['#d9ab83', '#c49968'],
                filter: (item: any) => item.category === 'أذكار الاستيقاظ من النوم'
            },
            {
                id: 5,
                title: 'أدعية قرآنية',
                titleFr: 'Invocations coraniques',
                icon: 'book-outline',
                color: ['#2C5F2D', '#4A7C59'],
                filter: (item: any) => item.category === 'أدعية قرآنية'
            },
            {
                id: 6,
                title: 'أذكار متنوعة',
                titleFr: 'Invocations diverses',
                icon: 'apps-outline',
                color: ['#d9ab83', '#c49968'],
                // Collect all other categories
                filter: (item: any) => ![
                    'أذكار الصباح والمساء',
                    'أذكار بعد السلام من الصلاة المفروضة',
                    'أذكار النوم',
                    'أذكار الاستيقاظ من النوم',
                    'أدعية قرآنية'
                ].includes(item.category)
            },
        ];

        return mainCategories.map(cat => ({
            ...cat,
            count: adhkarData.filter(cat.filter).reduce((sum, item) => sum + (item.array?.length || 0), 0)
        }));
    };

    // Get filtered adhkar for selected category
    const getFilteredAdhkar = () => {
        if (!selectedCategory) return [];

        const filteredCategories = adhkarData.filter(selectedCategory.filter);
        const allAdhkar: any[] = [];

        filteredCategories.forEach(cat => {
            if (cat.array) {
                cat.array.forEach((dhikr: any) => {
                    allAdhkar.push({
                        ...dhikr,
                        categoryName: cat.category
                    });
                });
            }
        });

        return allAdhkar;
    };

    // --- Render Category Card ---
    const renderCategoryCard = ({ item }: { item: any }) => {
        const borderColor = item.id % 2 === 0 ? GOLD_ACCENT : PRIMARY_GREEN;

        return (
            <TouchableOpacity
                style={[styles.categoryCard, { borderBottomWidth: 4, borderBottomColor: borderColor, backgroundColor: colors.surface }]}
                onPress={() => setSelectedCategory(item)}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={item.color}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.categoryGradient}
                >
                    <View style={styles.categoryIcon}>
                        <Ionicons name={item.icon as any} size={34} color="#fff" />
                    </View>
                    <Text style={styles.categoryTitleAr}>{item.title}</Text>
                    <Text style={styles.categoryTitleFr}>{item.titleFr}</Text>
                    {item.count > 0 && (
                        <View style={styles.countBadgeSmall}>
                            <Text style={[styles.countBadgeText, { color: isDarkMode ? GOLD_ACCENT : PRIMARY_GREEN }]}>{item.count}</Text>
                        </View>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    // --- Render Dhikr Item ---
    const renderDhikrItem = ({ item }: { item: any }) => {
        const isExpanded = expandedDhikr === item.id;
        const leftBorderColor = item.id % 2 === 0 ? PRIMARY_GREEN : GOLD_ACCENT;

        return (
            <TouchableOpacity
                style={[styles.dhikrCard, { borderLeftColor: leftBorderColor, backgroundColor: colors.surface, borderTopColor: colors.divider, borderRightColor: colors.divider, borderBottomColor: colors.divider }]}
                onPress={() => setExpandedDhikr(isExpanded ? null : item.id)}
                activeOpacity={0.9}
            >
                <View style={styles.dhikrHeader}>
                    <View style={[styles.dhikrNumber, { backgroundColor: leftBorderColor }]}>
                        <Text style={styles.dhikrNumberText}>{item.id}</Text>
                    </View>
                    {item.count > 1 && (
                        <View style={styles.countBadge}>
                            <Text style={styles.countText}>×{item.count}</Text>
                        </View>
                    )}
                </View>

                <Text style={[styles.dhikrArabic, { color: colors.text }]}>{item.text}</Text>

                {isExpanded && item.categoryName && (
                    <View style={styles.categoryNameBadge}>
                        <Ionicons name="bookmark-outline" size={12} color={GOLD_ACCENT} />
                        <Text style={styles.categoryNameText}>{item.categoryName}</Text>
                    </View>
                )}

                <View style={[styles.expandIcon, { bottom: 12 }]}>
                    <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={20}
                        color={leftBorderColor}
                    />
                </View>
            </TouchableOpacity>
        );
    };

    // --- Detail View ---
    if (selectedCategory) {
        const filteredAdhkar = getFilteredAdhkar();

        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
                <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

                {/* Header with Islamic Pattern */}
                <LinearGradient
                    colors={[PRIMARY_GREEN, '#4A7C59']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                        <Text style={styles.headerTitle}>{selectedCategory.title}</Text>
                        <Text style={styles.headerSubtitle}>{selectedCategory.titleFr}</Text>
                    </View>
                    <TouchableOpacity onPress={fetchAdhkar}>
                        <Ionicons name="refresh-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                </LinearGradient>

                {/* Adhkar List */}
                {loading ? (
                    <View style={styles.centerLoading}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement...</Text>
                    </View>
                ) : filteredAdhkar.length === 0 ? (
                    <View style={styles.centerLoading}>
                        <Ionicons name="alert-circle-outline" size={48} color="#999" />
                        <Text style={styles.emptyText}>Aucune invocation disponible</Text>
                    </View>
                ) : (
                    <FlatList
                        key="detail-list"
                        data={filteredAdhkar}
                        keyExtractor={(item, index) => `dhikr-${item.id}-${index}`}
                        renderItem={renderDhikrItem}
                        contentContainerStyle={styles.dhikrList}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </SafeAreaView>
        );
    }

    // --- Main Categories View ---
    const mainCategories = getMainCategories();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

            {/* Header with Islamic Pattern */}
            <LinearGradient
                colors={[PRIMARY_GREEN, '#4A7C59']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={styles.headerTitle}>الأذكار</Text>
                    <Text style={styles.headerSubtitle}>Invocations Islamiques</Text>
                </View>
                <TouchableOpacity onPress={fetchAdhkar}>
                    <Ionicons name="refresh-outline" size={22} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            {/* Loading or Error State */}
            {loading ? (
                <View style={styles.centerLoading}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement des adhkar...</Text>
                </View>
            ) : error ? (
                <View style={styles.centerLoading}>
                    <Ionicons name="cloud-offline-outline" size={64} color="#999" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchAdhkar}>
                        <Text style={styles.retryButtonText}>Réessayer</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                /* Categories Grid */
                <FlatList
                    key="categories-grid"
                    data={mainCategories}
                    keyExtractor={(item) => `category-${item.id}`}
                    renderItem={renderCategoryCard}
                    numColumns={2}
                    contentContainerStyle={styles.categoriesGrid}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: LIGHT_BEIGE,
    },
    header: {
        paddingTop: 50,
        paddingBottom: 25,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 8,
        shadowColor: PRIMARY_GREEN,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 3,
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 3,
    },
    categoriesGrid: {
        padding: 15,
        paddingBottom: 30,
    },
    categoryCard: {
        flex: 1,
        margin: 8,
        borderRadius: 18,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        borderWidth: 2,
        borderColor: '#fff',
    },
    categoryGradient: {
        padding: 20,
        alignItems: 'center',
        minHeight: 180,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    categoryIcon: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 3,
        borderColor: '#fff',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    categoryTitleAr: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 5,
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    categoryTitleFr: {
        fontSize: 12,
        color: '#fff',
        textAlign: 'center',
        fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    countBadgeSmall: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    countBadgeText: {
        color: PRIMARY_GREEN,
        fontSize: 11,
        fontWeight: 'bold',
    },
    dhikrList: {
        padding: 15,
        paddingBottom: 30,
    },
    dhikrCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 15,
        borderLeftWidth: 5,
        borderTopWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 3,
        borderTopColor: '#f5f5f5',
        borderRightColor: '#e0e0e0',
        borderBottomColor: '#d0d0d0',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    dhikrHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    dhikrNumber: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        borderWidth: 2,
        borderColor: '#fff',
    },
    dhikrNumberText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    countBadge: {
        backgroundColor: GOLD_ACCENT,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        elevation: 2,
        shadowColor: GOLD_ACCENT,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    countText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    dhikrArabic: {
        fontSize: 20,
        color: '#1a1a1a',
        textAlign: 'right',
        lineHeight: 38,
        fontWeight: '600',
        writingDirection: 'rtl',
        paddingVertical: 5,
    },
    categoryNameBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        gap: 5,
    },
    categoryNameText: {
        fontSize: 11,
        color: GOLD_ACCENT,
        fontWeight: '600',
    },
    expandIcon: {
        position: 'absolute',
        bottom: 12,
        right: 12,
    },
    centerLoading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 14,
        color: '#666',
    },
    errorText: {
        marginTop: 15,
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    emptyText: {
        marginTop: 15,
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 20,
        backgroundColor: PRIMARY_GREEN,
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
