import { useThemeColors } from '@/hooks/useThemeColors';
import { RootState } from '@/store/store';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSelector } from 'react-redux';

const { width, height } = Dimensions.get('window');

interface FormationStep {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    dua?: string;
    tips: string[];
}

// Formation Umrah - Contenu éducatif complet
// Les images peuvent être remplacées par vos propres photos/vidéos
const FORMATION_DATA: FormationStep[] = [
    {
        id: '1',
        title: 'Introduction & Niyyah',
        description: 'La première étape de l\'Umrah commence par l\'intention pure (Niyyah) et la préparation spirituelle. L\'intention doit être faite dans le cœur avant de franchir le Miqat.',
        imageUrl: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800',
        dua: 'لَبَّيْكَ اللَّهُمَّ عُمْرَة\n(Labbayka Allāhumma Umrah)',
        tips: [
            'Prendre un bain complet (Ghusl) avant l\'Ihram',
            'Se couper les ongles et enlever les poils indésirables',
            'Porter des vêtements d\'Ihram propres et blancs',
            'Faire l\'intention dans le cœur avant le Miqat',
            'Réciter la Talbiyah après l\'intention'
        ],
    },
    {
        id: '2',
        title: 'L\'Ihram & Talbiyah',
        description: 'Porter les vêtements de l\'Ihram et entrer dans l\'état de sacralisation. Les hommes portent deux pièces de tissu blanc non cousu, les femmes leurs vêtements habituels.',
        imageUrl: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800',
        dua: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ\n(Labbayk Allahumma Labbayk)',
        tips: [
            'Éviter les parfums et les huiles parfumées',
            'Ne pas se couvrir la tête (hommes)',
            'Ne pas porter de vêtements cousus (hommes)',
            'Rester patient et calme',
            'Répéter fréquemment la Talbiyah',
            'Éviter les disputes et les mauvais comportements'
        ],
    },
    {
        id: '3',
        title: 'Le Tawaf',
        description: 'Circuler autour de la Kaaba sept fois dans le sens inverse des aiguilles d\'une montre. C\'est le pilier principal de l\'Umrah.',
        imageUrl: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800',
        dua: 'بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ\n(Bismillāhi Allāhu Akbar)',
        tips: [
            'Commencer au niveau de la Pierre Noire (Hajar Al-Aswad)',
            'Garder la Kaaba sur votre gauche',
            'Faire 7 tours complets',
            'Toucher ou pointer la Pierre Noire à chaque tour si possible',
            'Faire 2 Rak\'ah derrière Maqam Ibrahim après le Tawaf',
            'Boire de l\'eau de Zamzam',
            'Faire des invocations pendant le Tawaf'
        ],
    },
    {
        id: '4',
        title: 'Le Sa\'i',
        description: 'Parcourir la distance entre les collines de Safa et Marwa sept fois, en commençant à Safa et en terminant à Marwa.',
        imageUrl: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800',
        dua: 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللَّهِ\n(Inna s-Safā wa-l-Marwah min sha\'ā\'iri-llah)',
        tips: [
            'Commencer à Safa en récitant le verset du Coran',
            'Marcher normalement, sauf entre les feux verts (hommes courent)',
            'Faire 7 trajets (Safa→Marwa = 1, Marwa→Safa = 2, etc.)',
            'Faire beaucoup de Douas et d\'invocations',
            'Terminer à Marwa (7ème trajet)',
            'Pas besoin de Wudu pour le Sa\'i'
        ],
    },
    {
        id: '5',
        title: 'Halq ou Taqsir',
        description: 'La dernière étape consiste à se couper ou raccourcir les cheveux pour sortir de l\'état d\'Ihram et compléter l\'Umrah.',
        imageUrl: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800',
        dua: 'الْحَمْدُ لِلَّهِ\n(Alhamdulillah)',
        tips: [
            'Halq (raser) est préférable pour les hommes',
            'Taqsir (raccourcir) est permis',
            'Les femmes coupent une petite mèche (longueur d\'un doigt)',
            'Après cela, l\'Ihram est terminé',
            'Vous pouvez reprendre vos vêtements normaux',
            'Félicitations ! Votre Umrah est acceptée insha\'Allah',
            'Faites des Douas pour vous et vos proches'
        ],
    },
];

const FormationCard = ({ item, isActive, isDarkMode, colors }: { item: FormationStep, isActive: boolean, isDarkMode: boolean, colors: any }) => {
    const [showTips, setShowTips] = useState(false);

    return (
        <View style={styles.cardContainer}>
            {/* Background Image */}
            <Image
                source={{ uri: item.imageUrl }}
                style={styles.backgroundImage}
                resizeMode="cover"
            />

            {/* Overlay Gradient */}
            <LinearGradient
                colors={['rgba(0,0,0,0.7)', 'transparent', 'rgba(0,0,0,0.85)']}
                style={styles.gradientOverlay}
            />

            {/* Content */}
            <ScrollView
                style={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContentContainer}
            >
                <View style={styles.contentOverlay}>
                    <View style={styles.textSection}>
                        <View style={styles.stepBadge}>
                            <Text style={styles.stepNumber}>Étape {item.id}</Text>
                        </View>

                        <Text style={styles.stepTitle}>{item.title}</Text>
                        <Text style={styles.stepDescription}>{item.description}</Text>

                        {item.dua && (
                            <View style={styles.duaCard}>
                                <View style={styles.duaHeader}>
                                    <MaterialCommunityIcons name="book-open-variant" size={20} color="#FFD700" />
                                    <Text style={styles.duaLabel}>Invocation</Text>
                                </View>
                                <Text style={styles.duaText}>{item.dua}</Text>
                            </View>
                        )}

                        {/* Tips Section */}
                        <View style={styles.tipsSection}>
                            <View style={styles.tipsHeader}>
                                <Ionicons name="bulb" size={20} color="#FFD700" />
                                <Text style={styles.tipsHeaderText}>Conseils Pratiques</Text>
                            </View>
                            {item.tips.map((tip, idx) => (
                                <View key={idx} style={styles.tipRow}>
                                    <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                                    <Text style={styles.tipText}>{tip}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Sidebar Actions */}
                    <View style={styles.sidebar}>
                        <TouchableOpacity style={styles.sideButton}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="share-social" size={22} color="#fff" />
                            </View>
                            <Text style={styles.sideText}>Partager</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.sideButton}>
                            <View style={styles.iconCircle}>
                                <MaterialCommunityIcons name="bookmark-outline" size={22} color="#fff" />
                            </View>
                            <Text style={styles.sideText}>Sauver</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default function UmrahInfoScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    const [activeIndex, setActiveIndex] = useState(0);

    const onViewableItemsChanged = React.useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index);
        }
    }).current;

    const viewabilityConfig = React.useRef({
        itemVisiblePercentThreshold: 50
    }).current;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: '#000' }]}>
            <StatusBar barStyle="light-content" translucent />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Sabeel Academy</Text>
                    <Text style={styles.headerSubtitle}>Formation Complète Umrah</Text>
                </View>
                <View style={styles.countBadgeHeader}>
                    <Text style={styles.countTextHeader}>{activeIndex + 1}/{FORMATION_DATA.length}</Text>
                </View>
            </View>

            <FlatList
                data={FORMATION_DATA}
                keyExtractor={(item) => item.id}
                pagingEnabled
                horizontal
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                snapToInterval={width}
                snapToAlignment="center"
                decelerationRate="fast"
                renderItem={({ item, index }) => (
                    <FormationCard
                        item={item}
                        isActive={index === activeIndex}
                        isDarkMode={isDarkMode}
                        colors={colors}
                    />
                )}
            />

            {/* Progress Dots */}
            <View style={styles.dotsContainer}>
                {FORMATION_DATA.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            index === activeIndex && styles.dotActive
                        ]}
                    />
                ))}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 40 : 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        zIndex: 1000,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTextContainer: {
        flex: 1,
        marginLeft: 15,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
    },
    countBadgeHeader: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    countTextHeader: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    cardContainer: {
        width: width,
        height: height,
        backgroundColor: '#000',
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.3,
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    scrollContent: {
        flex: 1,
    },
    scrollContentContainer: {
        paddingTop: 100,
        paddingBottom: 100,
    },
    contentOverlay: {
        paddingHorizontal: 20,
        flexDirection: 'row',
    },
    textSection: {
        flex: 1,
    },
    stepBadge: {
        backgroundColor: 'rgba(255,215,0,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.5)',
    },
    stepNumber: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: 'bold',
    },
    stepTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    stepDescription: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 20,
    },
    duaCard: {
        backgroundColor: 'rgba(255,215,0,0.1)',
        padding: 15,
        borderRadius: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
    },
    duaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 8,
    },
    duaLabel: {
        color: '#FFD700',
        fontSize: 14,
        fontWeight: 'bold',
    },
    duaText: {
        color: '#fff',
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'right',
        fontWeight: '600',
    },
    tipsSection: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    tipsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        gap: 8,
    },
    tipsHeaderText: {
        color: '#FFD700',
        fontSize: 16,
        fontWeight: 'bold',
    },
    tipRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        gap: 10,
    },
    tipText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        lineHeight: 20,
        flex: 1,
    },
    sidebar: {
        alignItems: 'center',
        marginLeft: 15,
        gap: 20,
        marginTop: 60,
    },
    sideButton: {
        alignItems: 'center',
    },
    iconCircle: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    sideText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    dotsContainer: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    dotActive: {
        backgroundColor: '#FFD700',
        width: 24,
    },
});
