import React, { createContext, useContext, useRef, useState } from 'react';
import { DrawerLayout } from 'react-native-gesture-handler';

interface DrawerContextType {
    openDrawer: () => void;
    closeDrawer: () => void;
    drawerRef: React.RefObject<DrawerLayout | null>;
    isDrawerOpen: boolean;
    setIsDrawerOpen: (open: boolean) => void;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export const DrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const drawerRef = useRef<DrawerLayout>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const openDrawer = () => {
        setIsDrawerOpen(true);
        drawerRef.current?.openDrawer();
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
        drawerRef.current?.closeDrawer();
    };

    return (
        <DrawerContext.Provider value={{ openDrawer, closeDrawer, drawerRef, isDrawerOpen, setIsDrawerOpen }}>
            {children}
        </DrawerContext.Provider>
    );
};

export const useDrawer = () => {
    const context = useContext(DrawerContext);
    if (!context) {
        throw new Error('useDrawer must be used within a DrawerProvider');
    }
    return context;
};
