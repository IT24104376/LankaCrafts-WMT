import React from 'react';
import { Stack } from 'expo-router';

export default function TouristLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="profile-edit" />
      <Stack.Screen name="blog-edit/[id]" />
    </Stack>
  );
}
