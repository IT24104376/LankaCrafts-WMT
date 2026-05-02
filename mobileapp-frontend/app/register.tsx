import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Compass, Palette, ShieldCheck, ArrowRight } from 'lucide-react-native';
import Svg, { Circle, Path } from 'react-native-svg';

const ROLES = [
  {
    key: 'tourist', label: 'Tourist', tag: 'Explorer', Icon: Compass,
    color: '#C65D3B', bg: '#FEF0EB', route: '/tourist/register' as const,
    desc: 'Discover Sri Lankan crafts, book hands-on workshops, and share your cultural journey.',
    features: ['Browse & book workshops', 'Message artisans directly', 'Write travel blogs'],
  },
  {
    key: 'artist', label: 'Artist', tag: 'Artisan', Icon: Palette,
    color: '#2F5D50', bg: '#EBF4F1', route: '/' as const, popular: true,
    desc: 'Showcase your craft, host workshops for tourists, and grow your artisan business.',
    features: ['Create your artisan profile', 'Host & manage workshops', 'Chat with tourists'],
  },
  {
    key: 'admin', label: 'Admin', tag: 'Platform', Icon: ShieldCheck,
    color: '#C9A227', bg: '#FDF8E7', route: '/' as const,
    desc: 'Manage the Lanka Crafts platform, verify artisans, and oversee user activity.',
    features: ['Verify artisan profiles', 'Manage platform users', 'Analytics & reports'],
  },
];

export default function RegisterSelectScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Svg width={48} height={48} viewBox="0 0 32 32" fill="none" style={{ alignSelf: 'center' }}>
          <Circle cx="16" cy="16" r="14" fill="#C9A227" opacity={0.15} />
          <Path d="M16 4 C10 4 6 10 6 16 C6 22 10 28 16 28 C22 28 26 22 26 16 C26 10 22 4 16 4Z" fill="#C9A227" opacity={0.5} />
          <Path d="M16 8 L18 14 L24 14 L19 18 L21 24 L16 20 L11 24 L13 18 L8 14 L14 14 Z" fill="#C9A227" />
        </Svg>
        <View style={s.badge}><Text style={s.badgeText}>Join Lanka Crafts</Text></View>
        <Text style={s.title}>How would you like to join?</Text>
        <Text style={s.subtitle}>Choose your role to get started.</Text>

        {ROLES.map((r) => {
          const Icon = r.Icon;
          return (
            <View key={r.key} style={s.card}>
              {r.popular && (
                <View style={s.popularBadge}><Text style={s.popularText}>Most Popular</Text></View>
              )}
              <View style={[s.iconWrap, { backgroundColor: r.bg }]}>
                <Icon size={28} color={r.color} />
              </View>
              <View style={[s.tagWrap, { backgroundColor: r.bg }]}>
                <Text style={[s.tagText, { color: r.color }]}>{r.tag}</Text>
              </View>
              <Text style={s.cardTitle}>{r.label}</Text>
              <Text style={s.cardDesc}>{r.desc}</Text>
              {r.features.map((f) => (
                <View key={f} style={s.featureRow}>
                  <View style={[s.dot, { backgroundColor: r.color }]} />
                  <Text style={s.featureText}>{f}</Text>
                </View>
              ))}
              <TouchableOpacity
                style={[s.cardBtn, { backgroundColor: r.color }]}
                onPress={() => router.push(r.route)}
                activeOpacity={0.8}
              >
                <Text style={s.cardBtnText}>Register as {r.label}</Text>
                <ArrowRight size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={s.loginRow}>
          <Text style={s.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={s.loginLink}>Sign in here</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F3EE' },
  scroll: { padding: 24, paddingBottom: 48, alignItems: 'center' },
  badge: { backgroundColor: '#C9A227', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginTop: 16, marginBottom: 12 },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#2F5D50', letterSpacing: 1, textTransform: 'uppercase' },
  title: { fontSize: 28, fontWeight: '900', color: '#2F5D50', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 28 },
  card: {
    width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 24,
    marginBottom: 16, borderWidth: 1, borderColor: '#F0F0F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 3,
  },
  popularBadge: { position: 'absolute', top: -12, alignSelf: 'center', left: '35%', backgroundColor: '#2F5D50', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 4 },
  popularText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  iconWrap: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  tagWrap: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 8 },
  tagText: { fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  cardTitle: { fontSize: 22, fontWeight: '900', color: '#2F5D50', marginBottom: 8 },
  cardDesc: { fontSize: 13, color: '#6B7280', lineHeight: 19, marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  featureText: { fontSize: 13, color: '#4B5563' },
  cardBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 16, marginTop: 16,
  },
  cardBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  loginRow: { flexDirection: 'row', marginTop: 12 },
  loginText: { fontSize: 13, color: '#9CA3AF' },
  loginLink: { fontSize: 13, fontWeight: '700', color: '#C65D3B' },
});
