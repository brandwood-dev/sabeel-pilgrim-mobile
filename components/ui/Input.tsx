import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: any;
    labelStyle?: any;
    rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<TextInput, InputProps>(({ label, error, style, containerStyle, labelStyle, rightIcon, ...props }, ref) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
            <View style={styles.inputWrapper}>
                <TextInput
                    ref={ref}
                    style={[styles.input, error ? styles.inputError : null, rightIcon ? { paddingRight: 50 } : null, style]}
                    placeholderTextColor="#999"
                    {...props}
                />
                {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
        width: '100%',
    },
    label: {
        marginBottom: 8,
        fontSize: 16,
        fontWeight: '600',
        color: '#2C5F2D',
    },
    inputWrapper: {
        position: 'relative',
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#4A7C59',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    inputError: {
        borderColor: 'red',
    },
    rightIconContainer: {
        position: 'absolute',
        right: 0,
        height: '100%',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 4,
    },
});
