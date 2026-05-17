import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';

interface InfoCardProps {
    label: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
    color?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({ label, value, icon, color = Colors.primary }) => {
    return (
        <View style={styles.container}>
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.value}>{value}</Text>
                <Text style={styles.label}>{label}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 4,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    value: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    label: {
        fontSize: 12,
        color: '#666',
    },
});
