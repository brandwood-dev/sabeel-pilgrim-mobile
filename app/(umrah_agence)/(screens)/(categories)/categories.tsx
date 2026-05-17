import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { clearCategory, setCategory } from '../../../../store/umrahSlice';

const { width } = Dimensions.get('window');

export default function CategoriesScreen() {
    const router = useRouter();
    const dispatch = useDispatch();

    const categories = [
        {
            id: 'standard',
            title: 'Omra Standard',
            description: 'Un équilibre parfait entre confort et prix pour votre pèlerinage.',
            icon: 'kaaba',
            colors: ['#2ECC71', '#27AE60'], // Green
        },
        {
            id: 'vip',
            title: 'Omra VIP',
            description: 'L\'excellence à chaque étape : hôtels de luxe 5*, transport privé et accompagnement personnalisé.',
            icon: 'crown',
            colors: ['#8E44AD', '#2C3E50'], // Purple/Dark
        },
        {
            id: 'economique',
            title: 'Omra Économique',
            description: 'Un voyage spirituel abordable sans compromis sur l\'essentiel.',
            icon: 'piggy-bank',
            colors: ['#F39C12', '#D35400'], // Orange/Gold
        }
    ];

    const handleSelectCategory = (title: string) => {
        dispatch(setCategory(title));
        router.back();
    };

    const handleClearCategory = () => {
        dispatch(clearCategory());
        router.back();
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F4DF" />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <FontAwesome5 name="times" size={20} color="#2C5F2D" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Catégories Omra</Text>
                    <TouchableOpacity onPress={handleClearCategory} style={styles.clearButton}>
                        <FontAwesome5 name="trash" size={18} color="#DB4437" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                    <Text style={styles.subtitle}>
                        Choisissez la formule qui correspond à vos attentes.
                    </Text>

                    <View style={styles.categoriesList}>
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category.id}
                                style={styles.categoryCardWrapper}
                                onPress={() => handleSelectCategory(category.title)}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={['#fff', '#fcfcfc']}
                                    style={styles.categoryCard}
                                >
                                    {/* Left Accent Bar */}
                                    <LinearGradient
                                        colors={category.colors as any}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 0, y: 1 }}
                                        style={styles.accentBar}
                                    />

                                    <View style={styles.cardContent}>
                                        <View style={styles.cardHeader}>
                                            <View style={[styles.iconContainer, { backgroundColor: category.colors[0] + '15' }]}>
                                                <FontAwesome5 name={category.icon} size={20} color={category.colors[1]} />
                                            </View>
                                        </View>

                                        <Text style={styles.categoryTitle}>{category.title}</Text>
                                        <Text style={styles.categoryDescription}>{category.description}</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F4DF',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 15,
        paddingTop: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    clearButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2C5F2D',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 20,
    },
    categoriesList: {
        gap: 20,
    },
    categoryCardWrapper: {
        borderRadius: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        backgroundColor: '#fff',
    },
    categoryCard: {
        flexDirection: 'row',
        borderRadius: 16,
        overflow: 'hidden',
        minHeight: 160,
    },
    accentBar: {
        width: 6,
        height: '100%',
    },
    cardContent: {
        flex: 1,
        padding: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    priceTag: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#2C5F2D',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    categoryDescription: {
        fontSize: 13,
        color: '#777',
        lineHeight: 18,
        marginBottom: 15,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    learnMore: {
        fontSize: 13,
        fontWeight: 'bold',
    },
});
