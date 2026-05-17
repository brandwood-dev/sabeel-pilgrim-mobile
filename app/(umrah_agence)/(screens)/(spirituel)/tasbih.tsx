import { useThemeColors } from '@/hooks/useThemeColors';
import { RootState } from '@/store/store';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    PanResponder,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSelector } from 'react-redux';

const { width, height } = Dimensions.get('window');

interface TasbihItem {
    id: string;
    title: string;
    arabic: string;
    target: number;
}

const TASBIH_EXAMPLES: TasbihItem[] = [
    { id: '1', title: 'Subhan Allah', arabic: 'سُبْحَانَ ٱللَّٰهِ', target: 33 },
    { id: '2', title: 'Alhamdulillah', arabic: 'ٱلْحَمْدُ لِلَّٰهِ', target: 33 },
    { id: '3', title: 'Allahu Akbar', arabic: 'ٱللَّٰهُ أَكْبَرُ', target: 33 },
    { id: '4', title: 'La ilaha illa Allah', arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ', target: 100 },
    { id: '5', title: 'Astaghfirullah', arabic: 'أَسْتَغْفِرُ ٱللَّٰهَ', target: 100 },
];

export default function TasbihScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

    const [selectedTasbih, setSelectedTasbih] = useState<TasbihItem>(TASBIH_EXAMPLES[0]);
    const [count, setCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [beadAnim] = useState(new Animated.Value(0));

    const handleIncrement = useCallback(() => {
        setCount(prev => prev + 1);
        setTotalCount(prev => prev + 1);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Animate bead
        beadAnim.setValue(0);
        Animated.spring(beadAnim, {
            toValue: 100,
            friction: 4,
            tension: 50,
            useNativeDriver: true,
        }).start(() => {
            beadAnim.setValue(0);
        });
    }, [beadAnim]);

    const resetCount = () => {
        setCount(0);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    };

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderRelease: (evt, gestureState) => {
            if (gestureState.dy > 20 || Math.abs(gestureState.dx) < 20) {
                handleIncrement();
            }
        },
    });

    const renderBead = (index: number) => {
        const translateY = beadAnim.interpolate({
            inputRange: [0, 100],
            outputRange: [index * 60, (index + 1) * 60],
        });

        const opacity = beadAnim.interpolate({
            inputRange: [0, 100],
            outputRange: [1, index === 4 ? 0 : 1],
        });

        return (
            <Animated.View
                key={index}
                style={[
                    styles.bead,
                    {
                        backgroundColor: colors.primary,
                        transform: [{ translateY }],
                        opacity,
                    }
                ]}
            >
                <View style={styles.beadHighlight} />
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Tasbih</Text>
                <TouchableOpacity onPress={resetCount} style={styles.resetIcon}>
                    <MaterialCommunityIcons name="refresh" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {/* Selection List */}
                <View style={styles.horizontalListContainer}>
                    <FlatList
                        data={TASBIH_EXAMPLES}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.itemChip,
                                    { borderColor: colors.divider },
                                    selectedTasbih.id === item.id && { backgroundColor: colors.primary, borderColor: colors.primary }
                                ]}
                                onPress={() => {
                                    setSelectedTasbih(item);
                                    setCount(0);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.itemChipText,
                                        { color: colors.textSecondary },
                                        selectedTasbih.id === item.id && { color: '#fff' }
                                    ]}
                                >
                                    {item.title}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                {/* Main Counter Display */}
                <View style={styles.counterSection}>
                    <Text style={[styles.arabicText, { color: colors.primary }]}>
                        {selectedTasbih.arabic}
                    </Text>
                    <View style={styles.countCircle}>
                        <Text style={[styles.countNumber, { color: colors.text }]}>{count}</Text>
                        <Text style={[styles.targetText, { color: colors.textSecondary }]}>/ {selectedTasbih.target}</Text>
                    </View>
                    <Text style={[styles.totalCountText, { color: colors.textSecondary }]}>
                        Total: {totalCount}
                    </Text>
                </View>

                {/* Interactive Masbha Area */}
                <View style={styles.masbhaArea} {...panResponder.panHandlers}>
                    <View style={[styles.string, { backgroundColor: colors.divider }]} />
                    <View style={styles.beadsContainer}>
                        {[0, 1, 2, 3, 4].map(renderBead)}
                    </View>

                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={handleIncrement}
                        style={styles.touchOverlay}
                    >
                        <View style={[styles.clickHint, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                            <Ionicons name="finger-print" size={30} color={colors.primary} />
                            <Text style={[styles.hintText, { color: colors.textSecondary }]}>Tapez ou Glissez</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    resetIcon: {
        padding: 5,
    },
    content: {
        flex: 1,
    },
    horizontalListContainer: {
        height: 60,
        marginTop: 10,
    },
    listContent: {
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    itemChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 10,
        backgroundColor: 'transparent',
    },
    itemChipText: {
        fontSize: 14,
        fontWeight: '600',
    },
    counterSection: {
        alignItems: 'center',
        marginTop: 30,
    },
    arabicText: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        fontFamily: 'System', // Use a proper handwriting font if available
    },
    countCircle: {
        width: 150,
        height: 150,
        borderRadius: 75,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(44, 95, 45, 0.1)',
    },
    countNumber: {
        fontSize: 48,
        fontWeight: 'bold',
    },
    targetText: {
        fontSize: 16,
        marginTop: -5,
    },
    totalCountText: {
        fontSize: 14,
        marginTop: 15,
    },
    masbhaArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    string: {
        width: 4,
        height: '80%',
        position: 'absolute',
        borderRadius: 2,
    },
    beadsContainer: {
        height: 300,
        width: 60,
        alignItems: 'center',
        overflow: 'hidden',
    },
    bead: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        position: 'absolute',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    beadHighlight: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        position: 'absolute',
        top: 8,
        left: 10,
    },
    touchOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 40,
    },
    clickHint: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 30,
        borderWidth: 1,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    hintText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
