import { Tabs } from 'expo-router';
import React from 'react';
import BottomNavigation from './bottom_navigation';

export default function AccompagnantLayout() {
    return (
        <Tabs
            screenOptions={{ headerShown: false }}
            tabBar={(props) => {
                const routeName = props.state.routes[props.state.index].name;
                const tabMap: { [key: string]: string } = {
                    'home': 'Accueil',
                    'map_tracking': 'Suivi',
                    'notifications': 'Alertes',
                    'messagerie': 'Messages',
                    'profile': 'Profil',
                };
                
                const hideOn = ['qr_scanner', 'chat_accompagnant', 'my_pilgrim', 'pilgrim_agency', 'pilgrim_guide'];
                if (hideOn.includes(routeName)) return null;
                
                return <BottomNavigation activeTab={tabMap[routeName] || 'Accueil'} />;
            }}
        >
            <Tabs.Screen name="home" />
            <Tabs.Screen name="notifications" />
            <Tabs.Screen name="map_tracking" />
            <Tabs.Screen name="messagerie" />
            <Tabs.Screen name="profile" />
            <Tabs.Screen name="qr_scanner" options={{ tabBarStyle: { display: 'none' } }} />
        </Tabs>
    );
}
