import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useThemeColors } from '../../hooks/useThemeColors';
import { RootState } from '../../store/store';
import { toggleTheme } from '../../store/themeSlice';

export default function DarkModeScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const dispatch = useDispatch();
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

    const handleToggle = () => dispatch(toggleTheme());

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Mode Sombre</Text>
                    <View style={{ width: 28 }} />
                </View>

                <View style={styles.content}>
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <View style={styles.row}>
                            <View style={styles.leftContent}>
                                <Ionicons name="moon" size={22} color={isDarkMode ? colors.primary : colors.textSecondary} />
                                <View style={styles.textContainer}>
                                    <Text style={[styles.label, { color: colors.text }]}>Activer le mode sombre</Text>
                                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                                        Réduisez l'éblouissement et améliorez le confort visuel.
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                trackColor={{ false: '#D1D1D1', true: colors.accent }}
                                thumbColor={isDarkMode ? colors.primary : '#f4f3f4'}
                                onValueChange={() => { handleToggle(); }}
                                value={isDarkMode}
                            />
                        </View>
                    </View>

                    <View style={styles.previewContainer}>
                        <Text style={[styles.previewTitle, { color: colors.text }]}>Aperçu</Text>
                        <View style={[styles.previewBox, { backgroundColor: colors.surface }]}>
                            <View style={[styles.previewCircle, { backgroundColor: colors.primary }]} />
                            <View style={styles.previewLines}>
                                <View style={[styles.previewLine, { backgroundColor: colors.text, width: '80%' }]} />
                                <View style={[styles.previewLine, { backgroundColor: colors.textSecondary, width: '60%' }]} />
                            </View>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    closeButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
    },
    card: {
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    textContainer: {
        marginLeft: 15,
        flex: 1,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    description: {
        fontSize: 13,
    },
    previewContainer: {
        marginTop: 40,
    },
    previewTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    previewBox: {
        padding: 20,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
    previewCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 15,
    },
    previewLines: {
        flex: 1,
        gap: 8,
    },
    previewLine: {
        height: 8,
        borderRadius: 4,
    },
});
