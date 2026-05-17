import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline';
}

export const Button: React.FC<ButtonProps> = ({ title, loading, variant = 'primary', style, ...props }) => {
    const getBackgroundColor = () => {
        if (props.disabled) return '#A0BFA8'; // disabled green
        switch (variant) {
            case 'primary': return '#2C5F2D';
            case 'secondary': return '#4A7C59';
            case 'outline': return 'transparent';
            default: return '#2C5F2D';
        }
    };

    const getTextColor = () => {
        if (variant === 'outline') return '#2C5F2D';
        return '#fff';
    };

    return (
        <TouchableOpacity
            style={[
                styles.container,
                { backgroundColor: getBackgroundColor(), borderWidth: variant === 'outline' ? 1 : 0, borderColor: '#2C5F2D' },
                style
            ]}
            disabled={loading || props.disabled}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        marginBottom: 16,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
});
