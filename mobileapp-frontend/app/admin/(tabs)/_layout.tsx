import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { LayoutDashboard, UserCheck, Users, Star, BarChart2 } from 'lucide-react-native';
import { useAuth } from '../../../src/context/AuthContext';
import { View, ActivityIndicator } from 'react-native';

const ACTIVE = '#C9A227';
const INACTIVE = 'rgba(255,255,255,0.4)';

export default function AdminTabsLayout() {
  const { isAdminAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#2F5D50', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#C9A227" size="large" />
      </View>
    );
  }

  if (!isAdminAuthenticated) {
    return <Redirect href="/admin/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: '#2F5D50',
          borderTopWidth: 0,
          height: 68,
          paddingBottom: 8,
          paddingTop: 6,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="artisans"
        options={{
          title: 'Artisans',
          tabBarIcon: ({ color, size }) => <UserCheck size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tourists"
        options={{
          title: 'Tourists',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reviews"
        options={{
          title: 'Reviews',
          tabBarIcon: ({ color, size }) => <Star size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => <BarChart2 size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
