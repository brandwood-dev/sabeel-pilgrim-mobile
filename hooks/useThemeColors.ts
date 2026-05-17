import { useSelector } from 'react-redux';
import { Colors } from '../constants/Colors';
import { RootState } from '../store/store';

export const useThemeColors = () => {
    const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
    return isDarkMode ? Colors.dark : Colors.light;
};

export const useIsDarkMode = () => {
    return useSelector((state: RootState) => state.theme.isDarkMode);
};
