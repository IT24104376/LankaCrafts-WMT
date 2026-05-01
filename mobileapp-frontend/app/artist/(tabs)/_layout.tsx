import React from 'react';
import { Tabs } from 'expo-router';
import {
  Home as HomeIcon,
  Package,
  Calendar,
  Settings,
  UserCircle,
} from 'lucide-react-native';


const TAB_COLOR_ACTIVE = '#2F5D50';
const TAB_COLOR_INACTIVE = '#9CA3AF';

export default function ArtistTabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => {
        // Hide tab bar on login and register screens
        const hideTabBar = route.name === 'login' || route.name === 'register';
        return {
          headerShown: false,
          tabBarActiveTintColor: TAB_COLOR_ACTIVE,
          tabBarInactiveTintColor: TAB_COLOR_INACTIVE,
          tabBarStyle: hideTabBar
            ? { display: 'none' }
            : {
                backgroundColor: '#fff',
                borderTopWidth: 1,
                borderTopColor: '#F0F0F0',
                height: 68,
                paddingBottom: 8,
                paddingTop: 6,
                elevation: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
              },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        };
      }}
    >
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <UserCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="crafts"
        options={{
          title: 'Crafts',
          tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, size }) => <HomeIcon size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}