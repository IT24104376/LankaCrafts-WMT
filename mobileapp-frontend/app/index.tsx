import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

function LogoIcon({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Circle cx="16" cy="16" r="14" fill="#C9A227" opacity={0.2} />
      <Path
        d="M16 4 C10 4 6 10 6 16 C6 22 10 28 16 28 C22 28 26 22 26 16 C26 10 22 4 16 4Z"
        fill="#C9A227"
        opacity={0.6}
      />
      <Path
        d="M16 8 L18 14 L24 14 L19 18 L21 24 L16 20 L11 24 L13 18 L8 14 L14 14 Z"
        fill="#C9A227"
      />
    </Svg>
  );
}

// ── Hero Section ──
function HeroSection() {
  const router = useRouter();
  return (
    <View style={styles.hero}>
      <View style={styles.heroOverlay}>
        <Text style={styles.heroTag}>🇱🇰 Discover Sri Lanka</Text>
        <Text style={styles.heroTitle}>Handcrafted{'\n'}with Heart</Text>
        <Text style={styles.heroSubtitle}>
          Explore authentic Sri Lankan crafts, meet master artisans, and book hands-on workshop
          experiences across the island.
        </Text>
        <TouchableOpacity
          style={styles.heroCta}
          onPress={() => router.push('/register')}
          activeOpacity={0.8}
        >
          <Text style={styles.heroCtaText}>Start Your Journey</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Craft Categories ──
const CRAFTS = [
  { emoji: '🏺', label: 'Pottery' },
  { emoji: '🎨', label: 'Batik' },
  { emoji: '🪵', label: 'Wood Carving' },
  { emoji: '🧵', label: 'Weaving' },
  { emoji: '🎭', label: 'Masks' },
  { emoji: '✨', label: 'Lacquer' },
  { emoji: '💍', label: 'Jewellery' },
  { emoji: '🪡', label: 'Handloom' },
];

function CraftCategoriesSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTag}>EXPLORE</Text>
      <Text style={styles.sectionTitle}>Craft Categories</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4 }}>
        {CRAFTS.map((c) => (
          <View key={c.label} style={styles.craftCard}>
            <Text style={styles.craftEmoji}>{c.emoji}</Text>
            <Text style={styles.craftLabel}>{c.label}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ── How It Works ──
const STEPS = [
  { num: '01', title: 'Browse Artisans', desc: 'Explore master craftspeople across Sri Lanka' },
  { num: '02', title: 'Book a Workshop', desc: 'Choose a date and time that works for you' },
  { num: '03', title: 'Learn & Create', desc: 'Get hands-on experience with traditional crafts' },
  { num: '04', title: 'Share Your Story', desc: 'Write reviews and share your cultural journey' },
];

function HowItWorksSection() {
  return (
    <View style={[styles.section, { backgroundColor: '#fff' }]}>
      <Text style={styles.sectionTag}>HOW IT WORKS</Text>
      <Text style={styles.sectionTitle}>Your Journey in 4 Steps</Text>
      {STEPS.map((s) => (
        <View key={s.num} style={styles.stepCard}>
          <View style={styles.stepNum}>
            <Text style={styles.stepNumText}>{s.num}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stepTitle}>{s.title}</Text>
            <Text style={styles.stepDesc}>{s.desc}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ── CTA Section ──
function CTASection() {
  const router = useRouter();
  return (
    <View style={styles.ctaSection}>
      <LogoIcon size={48} />
      <Text style={styles.ctaTitle}>Ready to Begin?</Text>
      <Text style={styles.ctaSubtitle}>
        Join thousands of cultural explorers discovering the beauty of Sri Lankan craftsmanship.
      </Text>
      <TouchableOpacity
        style={styles.ctaButton}
        onPress={() => router.push('/register')}
        activeOpacity={0.8}
      >
        <Text style={styles.ctaButtonText}>Create Your Account</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/login')} activeOpacity={0.7}>
        <Text style={styles.ctaLogin}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main Home Screen ──
export default function HomeScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Minimal header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LogoIcon size={32} />
          <Text style={styles.headerTitle}>Lanka Crafts</Text>
        </View>
        <TouchableOpacity
          style={styles.headerLogin}
          onPress={() => router.push('/login')}
          activeOpacity={0.8}
        >
          <Text style={styles.headerLoginText}>Sign In</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <HeroSection />
        <CraftCategoriesSection />
        <HowItWorksSection />
        <CTASection />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F3EE' },
  scroll: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2F5D50',
  },
  headerLogin: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#C65D3B',
  },
  headerLoginText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C65D3B',
  },

  // Hero
  hero: {
    height: 380,
    backgroundColor: '#2F5D50',
    justifyContent: 'flex-end',
  },
  heroOverlay: {
    padding: 24,
    paddingBottom: 32,
  },
  heroTag: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C9A227',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 42,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 20,
    marginBottom: 24,
  },
  heroCta: {
    backgroundColor: '#C9A227',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  heroCtaText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2F5D50',
  },

  // Section
  section: {
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  sectionTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#C9A227',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2F5D50',
    marginBottom: 20,
  },

  // Craft cards
  craftCard: {
    width: 100,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  craftEmoji: { fontSize: 28, marginBottom: 8 },
  craftLabel: { fontSize: 12, fontWeight: '600', color: '#2F5D50', textAlign: 'center' },

  // Steps
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  stepNum: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#2F5D50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontSize: 14, fontWeight: '900', color: '#C9A227' },
  stepTitle: { fontSize: 15, fontWeight: '700', color: '#1E1E1E', marginBottom: 2 },
  stepDesc: { fontSize: 12, color: '#6B7280', lineHeight: 17 },

  // CTA
  ctaSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: '#2F5D50',
    marginHorizontal: 20,
    borderRadius: 24,
    marginTop: 8,
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
  },
  ctaButton: {
    backgroundColor: '#C9A227',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    marginBottom: 16,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2F5D50',
  },
  ctaLogin: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
});
