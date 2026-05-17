import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import React from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSelector } from 'react-redux';
import { useThemeColors } from '../../../../hooks/useThemeColors';
import { RootState } from '../../../../store/store';
import { useTrans } from '../../../../hooks/useTrans';


interface AppBarProps {
    onMenuPress: () => void;
    onSettingsPress?: () => void;
    onNotificationPress?: () => void;
    onFilterPress?: () => void;
    showAvatar?: boolean;
    showSearch?: boolean;
    showNotification?: boolean;
    showFilter?: boolean;
    showSettings?: boolean;
    showBackButton?: boolean;
    showCloseButton?: boolean;
    showCreateGroup?: boolean;
    onCreateGroupPress?: () => void;
    avatarSource?: any;
    searchQuery?: string;
    onSearchChange?: (text: string) => void;
    title?: string;
    backgroundColor?: string;
}

export default function AppBar({
    onMenuPress,
    onSettingsPress,
    onNotificationPress,
    onFilterPress,
    showAvatar = true,
    showSearch = true,
    showNotification = true,
    showFilter = false,
    showSettings = false,
    showBackButton = false,
    showCloseButton = false,
    showCreateGroup = false,
    onCreateGroupPress,
    avatarSource,

    searchQuery,
    onSearchChange,
    title,
    backgroundColor: customBackgroundColor,
}: AppBarProps) {
    const { t, language } = useTrans();
    const colors = useThemeColors();
    const isRTL = language === 'ar';
    const backgroundColor = customBackgroundColor || colors.background;
    // Read real user data from Redux
    const user = useSelector((state: RootState) => state.auth.user);
    const firstName = user?.firstName || 'U';
    const lastName = user?.lastName || '';
    const fallbackAvatar = `https://api.dicebear.com/7.x/initials/png?seed=${firstName}+${lastName}&backgroundColor=2C5F2D&textColor=ffffff`;
    const resolvedAvatar = user?.photo ? { uri: user.photo } : { uri: fallbackAvatar };
    const avatarToShow = avatarSource ?? resolvedAvatar;

    return (
        <View style={[styles.headerContainer, { backgroundColor }]}>
            <View style={[styles.headerTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {/* Left Section: Menu/Avatar */}
                <View style={[styles.leftSection, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    {showAvatar && (
                        <TouchableOpacity onPress={onMenuPress} style={[styles.menuButton, { transform: [{ scaleX: isRTL ? -1 : 1 }] }]}>
                            <Image
                                source={avatarToShow}
                                style={styles.headerAvatar}
                            />
                        </TouchableOpacity>
                    )}

                    {!showAvatar && showBackButton && (
                        <TouchableOpacity onPress={onMenuPress} style={[styles.menuButton, { transform: [{ scaleX: isRTL ? -1 : 1 }] }]}>
                            <FontAwesome5 name="arrow-left" size={22} color={colors.primary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Title in the middle */}
                <View style={[styles.titleContainer, { alignItems: 'center' }]}>
                    <Text style={[styles.titleText, { color: colors.text, textAlign: 'center' }]}>
                        {title ? t(title) : 'Sabeel'}
                    </Text>
                </View>

                {/* Right Section: Settings & Notification */}
                <View style={[styles.rightSection, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    {showCreateGroup && (
                        <TouchableOpacity
                            onPress={onCreateGroupPress}
                            style={[styles.notificationButton, { marginRight: 5, backgroundColor: colors.surface }]}
                        >
                            <FontAwesome5 name="users" size={18} color={colors.primary} />
                            <FontAwesome5 name="plus" size={10} color={colors.primary} style={{ position: 'absolute', bottom: 8, right: 6 }} />
                        </TouchableOpacity>
                    )}

                    {showSettings && (
                        <TouchableOpacity onPress={onSettingsPress} style={styles.menuButton}>
                            <FontAwesome5 name="cog" size={22} color={colors.primary} />
                        </TouchableOpacity>
                    )}

                    {showNotification && (
                        <TouchableOpacity
                            style={[styles.notificationButton, { backgroundColor: colors.surface }, showSettings && { marginLeft: 10 }]}
                            onPress={onNotificationPress}
                        >
                            <FontAwesome5 name="bell" size={20} color={colors.text} />
                        </TouchableOpacity>
                    )}

                    {showFilter && (
                        <TouchableOpacity
                            style={[styles.notificationButton, { backgroundColor: colors.surface }, showSettings && { marginLeft: 10 }]}
                            onPress={onFilterPress}
                        >
                            <FontAwesome5 name="filter" size={20} color={colors.primary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Second Row: Search Bar */}
            {showSearch && (
                <View style={styles.searchWrapper}>
                    <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.divider, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <FontAwesome5 name="search" size={16} color={colors.textLight} style={[styles.searchIcon, { marginHorizontal: 8, marginRight: isRTL ? 0 : 8 }]} />
                        <TextInput
                            placeholder={t("Rechercher...")}
                            style={[styles.searchInput, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}
                            placeholderTextColor={colors.textLight}
                            value={searchQuery}
                            onChangeText={onSearchChange}
                        />
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        zIndex: 10,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 10,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 40,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 40,
        justifyContent: 'flex-end',
    },
    menuButton: {
        padding: 5,
    },
    headerAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1.5,
    },
    searchWrapper: {
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        paddingVertical: 0,
    },
    notificationButton: {
        width: 34,
        height: 34,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 17,
        backgroundColor: '#fff',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
    },
    titleContainer: {
        flex: 1,
        marginHorizontal: 12,
        justifyContent: 'center',
    },
    titleText: {
        fontSize: 22,
        fontWeight: 'bold',
    },
});
