import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTrans } from '../../hooks/useTrans';
import { useThemeColors } from '../../hooks/useThemeColors';

interface ProfileMenuItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress?: () => void;
    type?: 'button' | 'toggle';
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    color?: string;
}

export const ProfileMenuItem: React.FC<ProfileMenuItemProps> = ({
    icon,
    label,
    onPress,
    type = 'button',
    value,
    onValueChange,
    color
}) => {
    const colors = useThemeColors();
    const { language } = useTrans();
    const isRTL = language === 'ar';
    const activeColor = color || colors.primary;

    return (
        <TouchableOpacity
            style={[
                styles.container, 
                { 
                    borderBottomColor: colors.divider,
                    flexDirection: isRTL ? 'row-reverse' : 'row'
                }
            ]}
            onPress={type === 'button' ? onPress : undefined}
            disabled={type === 'toggle'}
            activeOpacity={0.7}
        >
            <View style={[
                styles.iconContainer, 
                { 
                    backgroundColor: activeColor + '15',
                    marginRight: isRTL ? 0 : 10,
                    marginLeft: isRTL ? 10 : 0
                }
            ]}>
                <Ionicons name={icon} size={18} color={activeColor} />
            </View>


            <Text style={[
                styles.label, 
                { 
                    color: colors.text,
                    textAlign: isRTL ? 'right' : 'left'
                }
            ]}>{label}</Text>

            {type === 'toggle' ? (
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: colors.divider, true: activeColor + '80' }}
                    thumbColor={value ? activeColor : '#f4f3f4'}
                />
            ) : (
                <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={18} color="#ccc" />
            )}

        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    iconContainer: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    label: {
        flex: 1,
        fontSize: 13,
        fontWeight: '500',
    },

});
