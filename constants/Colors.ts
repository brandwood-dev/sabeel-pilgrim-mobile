const lightPalette = {
    primary: '#2C5F2D',
    secondary: '#4A7C59',
    accent: '#d9ab83',
    background: '#FFFFFF',
    surface: '#ffffff',
    text: '#1a1a1a',
    textSecondary: '#666666',
    textLight: '#999999',
    divider: '#F0F3F7',
    error: '#D32F2F',
    success: '#2E7D32',
    warning: '#F57C00',
    white: '#FFFFFF',
    black: '#000000',
    terracotta: '#E2725B', // Restoring for compatibility
    gold: '#FFD700',      // Restoring for compatibility
    gray: '#CCCCCC',
    lightGray: '#F5F5F5',
};

const darkPalette = {
    primary: '#3E8E41',
    secondary: '#6AA87A',
    accent: '#e5c1a1',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#F5F5F5',
    textSecondary: '#AAAAAA',
    textLight: '#777777',
    divider: '#333333',
    error: '#FF5252',
    success: '#4CAF50',
    warning: '#FFB74D',
    white: '#FFFFFF',
    black: '#000000',
    terracotta: '#FF8A65',
    gold: '#FFD700',
    gray: '#444444',
    lightGray: '#222222',
};

export const Colors = {
    ...lightPalette, // Default for backward compatibility
    light: lightPalette,
    dark: darkPalette,
};
