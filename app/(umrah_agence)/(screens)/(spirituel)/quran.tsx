import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SURAH_DATA } from './surahData';

import { useThemeColors } from '@/hooks/useThemeColors';
import { RootState } from '@/store/store';
import { useSelector } from 'react-redux';

// --- Constants ---
const PRIMARY_GREEN = '#2C5F2D';
const GOLD_ACCENT = '#d9ab83';
const LIGHT_BEIGE = '#f8f7f2';

export default function QuranScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

    // --- State ---
    const [viewMode, setViewMode] = useState<'list' | 'reader'>('list');
    const [surahs, setSurahs] = useState<any[]>(SURAH_DATA);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    // Reader State
    const [activeSurah, setActiveSurah] = useState<any>(null);
    const [surahContent, setSurahContent] = useState<any[]>([]);
    const [versesLoading, setVersesLoading] = useState(false);

    // Audio State
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackStatus, setPlaybackStatus] = useState<any>(null);
    const [isBuffering, setIsBuffering] = useState(false);
    const [currentPlayingVerse, setCurrentPlayingVerse] = useState<number>(0);

    // History
    const [lastRead, setLastRead] = useState<any>(null);

    // --- Effects ---
    useEffect(() => {
        loadLastRead();

        // Setup Audio Mode
        Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
        });

        return () => {
            if (sound) sound.unloadAsync();
        };
    }, []);

    const loadLastRead = async () => {
        try {
            const saved = await AsyncStorage.getItem('lastReadSurah');
            if (saved) {
                setLastRead(JSON.parse(saved));
            }
        } catch (e) {
            console.log("Storage load error", e);
        }
    };

    const saveLastRead = async (surah: any) => {
        try {
            await AsyncStorage.setItem('lastReadSurah', JSON.stringify(surah));
            setLastRead(surah);
        } catch (e) {
            console.log("Storage save error", e);
        }
    };

    // Convert Latin numbers to Arabic-Indic numerals
    const toArabicNumerals = (num: string | number): string => {
        const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        return String(num).replace(/[0-9]/g, (digit) => arabicNumerals[parseInt(digit)]);
    };

    // --- Logic: Search ---
    const handleSearch = (text: string) => {
        setSearchQuery(text);
        if (text.trim() === '') {
            setSurahs(SURAH_DATA);
        } else {
            const filtered = SURAH_DATA.filter(s =>
                s.name_simple.toLowerCase().includes(text.toLowerCase()) ||
                s.translated_name.toLowerCase().includes(text.toLowerCase())
            );
            setSurahs(filtered);
        }
    };

    // --- Logic: Open Reader ---
    // Fetch Verses from Quran.com API
    const openSurah = async (surah: any) => {
        setActiveSurah(surah);
        setViewMode('reader');
        setVersesLoading(true);
        saveLastRead(surah);

        try {
            // Fetch verses with Arabic text (text_uthmani) only
            // IMPORTANT: We must explicitly request text_uthmani in the fields parameter
            const url = `https://api.quran.com/api/v4/verses/by_chapter/${surah.id}?language=fr&words=false&fields=text_uthmani&per_page=300`;
            console.log('Fetching verses from:', url);

            const response = await fetch(url);
            const data = await response.json();

            console.log('API Response:', data);
            console.log('Verses count:', data.verses?.length);

            if (data.verses && data.verses.length > 0) {
                setSurahContent(data.verses);
                console.log('First verse:', data.verses[0]);
                console.log('Arabic text:', data.verses[0].text_uthmani);
            } else {
                console.log('No verses found in response');
                Alert.alert("Erreur", "Aucun verset trouvé pour cette sourate.");
            }
        } catch (error) {
            console.error("Error loading verses:", error);
            Alert.alert("Erreur", "Impossible de charger les versets. Vérifiez votre connexion.");
        } finally {
            setVersesLoading(false);
        }
    };

    const bookmarkVerse = async (verse: any) => {
        const bookmark = {
            ...activeSurah,
            lastVerseKey: verse.verse_key,
            lastVerseIndex: verse.id
        };
        saveLastRead(bookmark);
        Alert.alert("Marque-page", `Vous avez marqué l'Ayah ${verse.verse_key.split(':')[1]}`);
    };

    // --- Logic: Audio Player ---
    const toggleAudio = async () => {
        if (isPlaying) {
            await sound?.pauseAsync();
            setIsPlaying(false);
        } else {
            if (sound) {
                await sound.playAsync();
                setIsPlaying(true);
            } else {
                playSurahAudio();
            }
        }
    };

    const playSurahAudio = async () => {
        if (!activeSurah) return;
        setIsBuffering(true);

        try {
            // 1. Get Audio URL for Chapter
            // Reciter 7 = Mishary Rashid Alafasy
            const response = await fetch(`https://api.quran.com/api/v4/chapter_recitations/7/${activeSurah.id}`);
            const data = await response.json();
            const audioUrl = data.audio_file?.audio_url;

            if (!audioUrl) {
                Alert.alert("Désolé", "Audio non disponible pour cette sourate.");
                setIsBuffering(false);
                return;
            }

            // 2. Load & Play
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: audioUrl },
                { shouldPlay: true },
                onPlaybackStatusUpdate
            );

            setSound(newSound);
            setIsPlaying(true);
            setIsBuffering(false);

        } catch (error) {
            console.error("Audio error", error);
            Alert.alert("Erreur", "Impossible de lire l'audio.");
            setIsBuffering(false);
        }
    };

    const onPlaybackStatusUpdate = (status: any) => {
        if (status.isLoaded) {
            setPlaybackStatus(status);
            setIsPlaying(status.isPlaying);
            setIsBuffering(status.isBuffering);

            // Calculate current verse based on playback position with weighted timing
            if (status.durationMillis && surahContent.length > 0) {
                const progress = status.positionMillis / status.durationMillis;

                // Calculate total text length of all verses
                const totalTextLength = surahContent.reduce((sum, verse) => {
                    const text = verse.text_uthmani || verse.text_indopak || verse.text_imlaei || '';
                    return sum + text.length;
                }, 0);

                // Find which verse we're currently at based on cumulative text length
                let cumulativeLength = 0;
                let currentVerse = 0;

                for (let i = 0; i < surahContent.length; i++) {
                    const text = surahContent[i].text_uthmani || surahContent[i].text_indopak || surahContent[i].text_imlaei || '';
                    const verseWeight = text.length / totalTextLength;
                    cumulativeLength += verseWeight;

                    if (progress <= cumulativeLength) {
                        currentVerse = i;
                        break;
                    }
                }

                setCurrentPlayingVerse(currentVerse);
            }

            if (status.didJustFinish) {
                setIsPlaying(false);
                setCurrentPlayingVerse(0);
                // Optionally reset position
                sound?.setPositionAsync(0);
            }
        } else if (status.error) {
            console.log(`Player Error: ${status.error}`);
        }
    };

    const formatTime = (millis: number) => {
        if (!millis) return "00:00";
        const minutes = Math.floor(millis / 60000);
        const seconds = ((millis % 60000) / 1000).toFixed(0);
        return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
    };

    // --- Renders ---

    // 1. Surah List Item
    const renderSurahItem = ({ item, index }: { item: any, index: number }) => (
        <TouchableOpacity
            style={[styles.surahCard, { backgroundColor: colors.surface }]}
            onPress={() => openSurah(item)}
            activeOpacity={0.7}
        >
            <View style={[styles.surahNumberBox, { backgroundColor: isDarkMode ? 'rgba(217,171,131,0.1)' : 'rgba(44,95,45,0.1)' }]}>
                <Text style={[styles.surahNumber, { color: isDarkMode ? GOLD_ACCENT : PRIMARY_GREEN }]}>{item.id}</Text>
            </View>
            <View style={styles.surahInfo}>
                <Text style={[styles.surahNameSimple, { color: colors.text }]}>{item.name_simple}</Text>
                <Text style={[styles.surahTranslation, { color: colors.textSecondary }]}>{item.translated_name}</Text>
            </View>
            <View style={styles.surahArabicBox}>
                <Text style={[styles.surahNameArabic, { color: colors.primary }]}>{item.name_arabic}</Text>
                <Text style={[styles.versesCount, { color: colors.textSecondary }]}>{item.verses_count} Versets</Text>
            </View>
        </TouchableOpacity>
    );

    // 2. Header (Last Read)
    const renderLastRead = () => {
        if (!lastRead) return null;
        const verseNum = lastRead.lastVerseKey ? lastRead.lastVerseKey.split(':')[1] : '1';

        return (
            <TouchableOpacity
                style={styles.lastReadCard}
                onPress={() => openSurah(lastRead)}
                activeOpacity={0.9}
            >
                <LinearGradient
                    colors={[PRIMARY_GREEN, '#3A7D3A']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.lastReadGradient}
                >
                    <View style={styles.lastReadContent}>
                        <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                                <Ionicons name="time-outline" size={14} color={GOLD_ACCENT} style={{ marginRight: 5 }} />
                                <Text style={styles.lastReadLabel}>Continuer la lecture</Text>
                            </View>
                            <Text style={styles.lastReadTitle}>Surah {lastRead.name_simple}</Text>
                            <Text style={styles.lastReadSub}>Ayah {verseNum}</Text>
                        </View>
                        <Ionicons name="bookmark" size={32} color={GOLD_ACCENT} style={{ opacity: 0.8 }} />
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    // 3. Reader View (Detail)
    if (viewMode === 'reader' && activeSurah) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#fdfbf7' }]}>
                <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#1a1a1a" : "#fff"} />

                {/* Header Reader */}
                <View style={[styles.readerHeader, { backgroundColor: isDarkMode ? '#1a1a1a' : '#fff', borderBottomColor: colors.divider }]}>
                    <TouchableOpacity onPress={() => {
                        setViewMode('list');
                        if (isPlaying) {
                            sound?.stopAsync();
                            setIsPlaying(false);
                        }
                    }}>
                        <Ionicons name="arrow-back" size={24} color={colors.primary} />
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={[styles.readerTitle, { color: colors.primary }]}>{activeSurah.name_simple}</Text>
                        <Text style={[styles.readerSub, { color: colors.textSecondary }]}>{activeSurah.translated_name}</Text>
                    </View>
                    <TouchableOpacity onPress={toggleAudio}>
                        {isBuffering ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={32} color={colors.primary} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Progress Bar (if playing) */}
                {playbackStatus && (
                    <View style={styles.audioProgress}>
                        <View style={[styles.progressBarIds, { width: `${(playbackStatus.positionMillis / playbackStatus.durationMillis) * 100}%` }]} />
                        <Text style={styles.progressText}>
                            {formatTime(playbackStatus.positionMillis)} / {formatTime(playbackStatus.durationMillis)}
                        </Text>
                    </View>
                )}

                {/* Verses List */}
                {versesLoading ? (
                    <View style={styles.centerLoading}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={{ marginTop: 10, color: colors.textSecondary }}>Chargement de la Sourate...</Text>
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={[styles.mushafPage, { backgroundColor: isDarkMode ? '#1a1a1a' : '#fdfbf7' }]}
                        showsVerticalScrollIndicator={false}
                        removeClippedSubviews={true}
                    >
                        {/* Decorative Page Border */}
                        <View style={[styles.mushafBorder, { backgroundColor: isDarkMode ? '#2c2c2c' : '#fff', borderColor: colors.primary }]}>
                            {/* Corner Ornaments */}
                            <Text style={[styles.cornerTopLeft, { color: colors.primary }]}>╔</Text>
                            <Text style={[styles.cornerTopRight, { color: colors.primary }]}>╗</Text>
                            <Text style={[styles.cornerBottomLeft, { color: colors.primary }]}>╚</Text>
                            <Text style={[styles.cornerBottomRight, { color: colors.primary }]}>╝</Text>

                            {/* Top Decorative Ornament */}
                            <View style={styles.ornamentTop}>
                                <Text style={[styles.ornamentText, { color: colors.primary }]}>۞ ۩ ۞</Text>
                            </View>

                            {/* Bismillah - Special handling for Al-Fatiha */}
                            {activeSurah.id === 1 ? (
                                // For Al-Fatiha: Show Bismillah as verse (1)
                                <View style={styles.bismillahContainer}>
                                    <View style={styles.bismillahDivider}>
                                        <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
                                        <Text style={[styles.dividerOrnament, { color: GOLD_ACCENT }]}>❁</Text>
                                        <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
                                    </View>
                                    <Text style={[styles.mushafContinuousText, { color: colors.text }]}>
                                        بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                                        {'  '}
                                        <Text style={[styles.verseNumberInline, { color: GOLD_ACCENT }]}>﴿١﴾</Text>
                                        {'  '}
                                    </Text>
                                    <View style={styles.bismillahDivider}>
                                        <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
                                        <Text style={[styles.dividerOrnament, { color: GOLD_ACCENT }]}>❁</Text>
                                        <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
                                    </View>
                                </View>
                            ) : activeSurah.id !== 9 && (
                                // For other surahs (except At-Tawbah): Show Bismillah without number
                                <View style={styles.bismillahContainer}>
                                    <View style={styles.bismillahDivider}>
                                        <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
                                        <Text style={[styles.dividerOrnament, { color: GOLD_ACCENT }]}>❁</Text>
                                        <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
                                    </View>
                                    <Text style={[styles.mushafBismillahTop, { color: colors.primary }]}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</Text>
                                    <View style={styles.bismillahDivider}>
                                        <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
                                        <Text style={[styles.dividerOrnament, { color: GOLD_ACCENT }]}>❁</Text>
                                        <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
                                    </View>
                                </View>
                            )}

                            {/* Verses - Chunked for performance */}
                            <View style={styles.versesContainer}>
                                {/* Split verses into chunks of 10 for better performance */}
                                {/* For Al-Fatiha, skip the first verse (Bismillah) since it's shown above */}
                                {Array.from({
                                    length: Math.ceil((surahContent.length - (activeSurah.id === 1 ? 1 : 0)) / 10)
                                }, (_, chunkIndex) => {
                                    const startIdx = chunkIndex * 10 + (activeSurah.id === 1 ? 1 : 0);
                                    const endIdx = Math.min(startIdx + 10, surahContent.length);
                                    const chunkVerses = surahContent.slice(startIdx, endIdx);

                                    return (
                                        <Text key={`chunk-${chunkIndex}`} style={styles.mushafContinuousText}>
                                            {chunkVerses.map((item, index) => {
                                                const globalIndex = startIdx + index;
                                                const isBookmarked = lastRead?.lastVerseKey === item.verse_key;
                                                const isCurrentlyPlaying = isPlaying && currentPlayingVerse === globalIndex;
                                                const verseNumber = item.verse_key?.split(':')[1] || '1';
                                                const arabicVerseNumber = toArabicNumerals(verseNumber);
                                                const arabicText = item.text_uthmani || item.text_indopak || item.text_imlaei || '';

                                                return (
                                                    <Text
                                                        key={item.id}
                                                        style={[
                                                            { color: colors.text },
                                                            isCurrentlyPlaying && styles.verseTextPlaying,
                                                            isBookmarked && styles.verseTextBookmarked
                                                        ]}
                                                    >
                                                        {arabicText}
                                                        {'  '}
                                                        <Text
                                                            style={[
                                                                styles.verseNumberInline,
                                                                { color: GOLD_ACCENT },
                                                                isBookmarked && styles.verseNumberInlineBookmarked,
                                                                isCurrentlyPlaying && styles.verseNumberPlaying
                                                            ]}
                                                            onPress={() => bookmarkVerse(item)}
                                                        >
                                                            ﴿{arabicVerseNumber}﴾
                                                        </Text>
                                                        {'  '}
                                                    </Text>
                                                );
                                            })}
                                        </Text>
                                    );
                                })}
                            </View>

                            {/* Traditional Closing - Sadaqa Allahu Al-Adhim */}
                            <View style={[styles.mushafClosing, { borderTopColor: colors.divider }]}>
                                <Text style={[styles.mushafClosingText, { color: colors.primary }]}>صَدَقَ اللهُ الْعَظِيمْ</Text>
                            </View>
                        </View>
                    </ScrollView>
                )}
            </SafeAreaView>
        );
    }

    // --- Main List View ---
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

            {/* Main Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Saint Coran</Text>
                    <TouchableOpacity>
                        <Ionicons name="settings-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={[styles.searchContainer, { backgroundColor: isDarkMode ? '#2c2c2c' : '#fff' }]}>
                    <Ionicons name="search" size={20} color={isDarkMode ? colors.textSecondary : "#999"} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Rechercher une sourate..."
                        placeholderTextColor={isDarkMode ? colors.textSecondary : "#999"}
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                </View>
            </View>

            {/* Content List */}
            <FlatList
                data={surahs}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={renderLastRead}
                renderItem={renderSurahItem}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: LIGHT_BEIGE,
    },
    header: {
        backgroundColor: PRIMARY_GREEN,
        paddingTop: 50,
        paddingBottom: 25,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 45,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: '#333',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
    },
    // Last Read
    lastReadCard: {
        marginBottom: 25,
        borderRadius: 15,
        elevation: 4,
        shadowColor: PRIMARY_GREEN,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        overflow: 'hidden',
    },
    lastReadGradient: {
        padding: 20,
    },
    lastReadContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lastReadLabel: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    lastReadTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    lastReadSub: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
    },
    // Surah Item
    surahCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    surahNumberBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(44,95,45,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    surahNumber: {
        color: PRIMARY_GREEN,
        fontWeight: 'bold',
        fontSize: 14,
    },
    surahInfo: {
        flex: 1,
    },
    surahNameSimple: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    surahTranslation: {
        fontSize: 12,
        color: '#888',
    },
    surahArabicBox: {
        alignItems: 'flex-end',
    },
    surahNameArabic: {
        fontSize: 20,
        color: PRIMARY_GREEN,
        fontWeight: 'bold',
        writingDirection: 'rtl',
        textAlign: 'right',
    },
    versesCount: {
        fontSize: 10,
        color: '#999',
        marginTop: 4,
    },
    // Reader Styles
    readerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    readerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: PRIMARY_GREEN,
    },
    readerSub: {
        fontSize: 12,
        color: '#888',
    },
    centerLoading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    versesList: {
        padding: 20,
    },
    verseContainer: {
        marginBottom: 25,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.03)',
        paddingBottom: 20,
    },
    mushafVerseContainer: {
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(217, 171, 131, 0.2)',
    },
    verseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    verseNumberBadge: {
        backgroundColor: 'rgba(217, 171, 131, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: GOLD_ACCENT,
        marginBottom: 8,
        alignSelf: 'flex-start',
    },
    verseNumberBadgeBookmarked: {
        backgroundColor: GOLD_ACCENT,
        borderColor: PRIMARY_GREEN,
    },
    verseNumberText: {
        fontSize: 11,
        color: PRIMARY_GREEN,
        fontWeight: 'bold',
    },
    verseArabic: {
        fontSize: 26,
        color: '#333',
        textAlign: 'right',
        lineHeight: 45,
        fontFamily: 'System',
    },
    bismillahContainer: {
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10,
        paddingVertical: 10,
    },
    bismillahText: {
        fontSize: 24,
        color: PRIMARY_GREEN,
        fontWeight: '600',
    },
    audioProgress: {
        paddingHorizontal: 0,
        height: 3,
        backgroundColor: '#eee',
        width: '100%',
    },
    progressBarIds: {
        height: '100%',
        backgroundColor: GOLD_ACCENT,
    },
    progressText: {
        position: 'absolute',
        top: 5,
        right: 10,
        fontSize: 10,
        color: '#888',
    },
    verseTranslation: {
        fontSize: 14,
        color: '#666',
        marginTop: 15,
        lineHeight: 22,
        fontStyle: 'italic',
    },
    bookmarkedContainer: {
        backgroundColor: 'rgba(217, 171, 131, 0.1)', // Light Gold
        padding: 10,
        borderRadius: 10,
        marginHorizontal: -10,
        borderColor: GOLD_ACCENT,
        borderWidth: 1,
    },
    // --- Mushaf Styles ---
    mushafPage: {
        paddingHorizontal: 10,
        paddingVertical: 15,
        backgroundColor: '#fdfbf7', // Parchment color
        minHeight: '100%',
    },
    mushafBorder: {
        borderWidth: 3,
        borderColor: PRIMARY_GREEN,
        borderRadius: 12,
        padding: 15,
        marginHorizontal: 5,
        marginVertical: 8,
        backgroundColor: '#fff',
        shadowColor: PRIMARY_GREEN,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 4,
        position: 'relative',
    },
    ornamentTop: {
        alignItems: 'center',
        marginBottom: 12,
        marginTop: 3,
    },
    ornamentText: {
        fontSize: 22,
        color: PRIMARY_GREEN,
        letterSpacing: 6,
        fontWeight: 'bold',
    },
    bismillahDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
        width: '80%',
    },
    dividerLine: {
        flex: 1,
        height: 1.5,
        backgroundColor: PRIMARY_GREEN,
        opacity: 0.5,
    },
    dividerOrnament: {
        fontSize: 16,
        color: GOLD_ACCENT,
        marginHorizontal: 10,
        fontWeight: 'bold',
    },
    cornerTopLeft: {
        position: 'absolute',
        top: -6,
        left: -6,
        fontSize: 28,
        color: PRIMARY_GREEN,
        fontWeight: 'bold',
        zIndex: 10,
    },
    cornerTopRight: {
        position: 'absolute',
        top: -6,
        right: -6,
        fontSize: 28,
        color: PRIMARY_GREEN,
        fontWeight: 'bold',
        zIndex: 10,
    },
    cornerBottomLeft: {
        position: 'absolute',
        bottom: -6,
        left: -6,
        fontSize: 28,
        color: PRIMARY_GREEN,
        fontWeight: 'bold',
        zIndex: 10,
    },
    cornerBottomRight: {
        position: 'absolute',
        bottom: -6,
        right: -6,
        fontSize: 28,
        color: PRIMARY_GREEN,
        fontWeight: 'bold',
        zIndex: 10,
    },
    mushafHeader: {
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
    },
    surahTitleBox: {
        borderWidth: 3,
        borderColor: GOLD_ACCENT,
        paddingVertical: 15,
        paddingHorizontal: 60,
        backgroundColor: LIGHT_BEIGE,
        marginBottom: 10,
        borderRadius: 10,
        shadowColor: GOLD_ACCENT,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 4,
    },
    mushafSurahTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: PRIMARY_GREEN,
        textAlign: 'center',
        writingDirection: 'rtl',
        letterSpacing: 1,
    },
    mushafBismillah: {
        fontSize: 20,
        color: PRIMARY_GREEN,
        marginBottom: 15,
        fontWeight: '700',
        textAlign: 'center',
        writingDirection: 'rtl',
        letterSpacing: 0.6,
    },
    mushafBismillahTop: {
        fontSize: 22,
        color: PRIMARY_GREEN,
        fontWeight: '700',
        textAlign: 'center',
        writingDirection: 'rtl',
        letterSpacing: 1,
        paddingVertical: 8,
    },
    mushafTextWrapper: {
        padding: 20,
        borderWidth: 3,
        borderColor: GOLD_ACCENT,
        borderRadius: 10,
        backgroundColor: '#fff',
        marginHorizontal: 5,
        shadowColor: GOLD_ACCENT,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 4,
    },
    versesContainer: {
        paddingVertical: 10,
    },
    mushafContinuousText: {
        fontSize: 20,
        color: '#000',
        textAlign: 'center',
        lineHeight: 40,
        writingDirection: 'rtl',
        fontWeight: '600',
        letterSpacing: 0.4,
    },
    verseTextPlaying: {
        backgroundColor: 'rgba(217, 171, 131, 0.2)',
    },
    verseTextBookmarked: {
        backgroundColor: 'rgba(44, 95, 45, 0.08)',
    },
    verseBlock: {
        marginBottom: 20,
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 8,
    },
    verseBlockPlaying: {
        backgroundColor: 'rgba(217, 171, 131, 0.25)',
        borderWidth: 2,
        borderColor: GOLD_ACCENT,
    },
    verseBlockBookmarked: {
        backgroundColor: 'rgba(44, 95, 45, 0.08)',
        borderWidth: 1,
        borderColor: PRIMARY_GREEN,
    },
    verseCenteredText: {
        fontSize: 24,
        color: '#000',
        textAlign: 'center',
        lineHeight: 48,
        writingDirection: 'rtl',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    verseNumberCentered: {
        color: GOLD_ACCENT,
        fontSize: 22,
        fontWeight: 'bold',
        paddingHorizontal: 6,
    },
    verseNumberBookmarked: {
        color: '#fff',
        backgroundColor: PRIMARY_GREEN,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    mushafVerseText: {
        fontSize: 18,
        color: '#000',
        textAlign: 'right',
        lineHeight: 36,
        marginBottom: 3,
        writingDirection: 'rtl',
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    verseEndSymbol: {
        color: GOLD_ACCENT,
        fontSize: 22,
        fontWeight: 'bold',
    },
    verseNumberInline: {
        color: GOLD_ACCENT,
        fontSize: 18,
        fontWeight: 'bold',
        paddingHorizontal: 4,
    },
    verseNumberInlineBookmarked: {
        color: '#fff',
        backgroundColor: PRIMARY_GREEN,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    verseNumberPlaying: {
        backgroundColor: GOLD_ACCENT,
        color: PRIMARY_GREEN,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    mushafVerseBookmarked: {
        backgroundColor: 'rgba(217, 171, 131, 0.15)',
        padding: 10,
        borderRadius: 8,
        marginHorizontal: -10,
    },
    mushafClosing: {
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 40,
        paddingVertical: 15,
    },
    mushafClosingText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: PRIMARY_GREEN,
        textAlign: 'center',
        writingDirection: 'rtl',
        letterSpacing: 1,
    }
});
