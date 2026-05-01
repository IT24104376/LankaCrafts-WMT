import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BatikBackground } from '../src/components/BatikBackground';
import { ArrowRight, UserCircle, Palette, Shield } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function UnifiedLoginScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <BatikBackground />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowRight size={24} color="#2F5D50" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIconPlaceholder}>
              <Text style={{ fontSize: 32 }}>🇱🇰</Text>
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Select your account type to sign in</Text>
          </View>

          <View style={styles.cardsContainer}>
            {/* Tourist Login */}
            <TouchableOpacity 
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => router.push('/tourist/login')}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#EBF4F1' }]}>
                <UserCircle size={32} color="#2F5D50" />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>Tourist</Text>
                <Text style={styles.cardSubtitle}>Explore crafts and book workshops</Text>
              </View>
              <ArrowRight size={20} color="#9CA3AF" />
            </TouchableOpacity>

             {/* Artisan Login */}
             <TouchableOpacity 
               style={styles.card}
               activeOpacity={0.8}
               onPress={() => router.push('/artist/login')}
             >
              <View style={[styles.iconContainer, { backgroundColor: '#FEF0EB' }]}>
                <Palette size={32} color="#C65D3B" />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>Artisan</Text>
                <Text style={styles.cardSubtitle}>Manage your workshops and profile</Text>
              </View>
              <ArrowRight size={20} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Admin Login */}
            <TouchableOpacity 
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => alert('Admin portal coming soon!')}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#F3F4F6' }]}>
                <Shield size={32} color="#4B5563" />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>Administrator</Text>
                <Text style={styles.cardSubtitle}>System management portal</Text>
              </View>
              <ArrowRight size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F3EE' },
  container: { flex: 1, paddingHorizontal: 24 },
  header: { paddingVertical: 16 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  content: { flex: 1, justifyContent: 'center', paddingBottom: 40 },
  logoContainer: { alignItems: 'center', marginBottom: 48 },
  logoIconPlaceholder: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  title: { fontSize: 28, fontWeight: '800', color: '#1E1E1E', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  cardsContainer: { gap: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  iconContainer: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  cardTextContainer: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1E1E1E', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: '#6B7280' },
});
