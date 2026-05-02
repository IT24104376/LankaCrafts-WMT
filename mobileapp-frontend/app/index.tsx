import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Logo from '../src/components/Logo';
import { BatikBackground } from '../src/components/BatikBackground';
import {
  Home,
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  UserCircle,
  MessageSquare,
  Bot,
  Package,
  Calendar,
  Star,
} from 'lucide-react-native';
import { useAuth } from '../src/context/AuthContext';

const { width } = Dimensions.get('window');

// ── Hero Section ──
function HeroSection({ isLoggedIn, userRole }: { isLoggedIn: boolean, userRole?: 'tourist' | 'artist' }) {
  const router = useRouter();

  if (isLoggedIn) {
    const dashboardRoute = userRole === 'artist' ? '/artist/(tabs)/profile' : '/tourist';

    return (
      <View style={styles.hero}>
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTag}>🇱🇰 Discover Sri Lanka</Text>
          <Text style={styles.heroTitle}>Handcrafted{'\n'}with Heart</Text>
          <Text style={styles.heroSubtitle}>
            Explore authentic Sri Lankan crafts, meet master artisans, and book hands-on workshop
            experiences across the island.
          </Text>
          {!isLoggedIn && (
            <TouchableOpacity
              style={styles.heroCta}
              onPress={() => router.push('/register')}
              activeOpacity={0.8}
            >
              <Text style={styles.heroCtaText}>Start Your Journey</Text>
            </TouchableOpacity>
          )}
          {isLoggedIn && (
            <TouchableOpacity
              style={styles.heroCta}
              onPress={() => router.push(dashboardRoute as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.heroCtaText}>Go to Dashboard</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }
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
function CTASection({ isLoggedIn, userRole }: { isLoggedIn: boolean; userRole?: 'tourist' | 'artist' }) {
  const router = useRouter();

  if (isLoggedIn) {
    const dashboardRoute = userRole === 'artist' ? '/artist/(tabs)/profile' : '/tourist';

    return (
      <View style={styles.ctaSection}>
        <Logo size={48} />
        <Text style={styles.ctaTitle}>Welcome Back!</Text>
        <Text style={styles.ctaSubtitle}>
          {userRole === 'artist'
            ? "Manage your crafts, bookings, and schedule your workshops with ease."
            : "Continue your cultural journey. Browse artisans, manage bookings, or share your experiences."}
        </Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push(dashboardRoute as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaButtonText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.ctaSection}>
      <Logo size={48} />
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

// ── Bottom Nav Bar (shown when logged in) ──
const TOURIST_NAV_ITEMS = [
  { key: 'home', label: 'Home', icon: Home, route: '/tourist' },
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/tourist/dashboard' },
  { key: 'bookings', label: 'Bookings', icon: CalendarDays, route: '/tourist/bookings' },
  { key: 'blogs', label: 'Blogs', icon: BookOpen, route: '/tourist/blogs' },
  { key: 'inbox', label: 'Inbox', icon: MessageSquare, route: '/tourist/inbox' },
  { key: 'profile', label: 'Profile', icon: UserCircle, route: '/tourist/profile' },
];

const ARTIST_NAV_ITEMS = [
  { key: 'profile', label: 'Profile', icon: UserCircle, route: '/artist/profile' },
  { key: 'crafts', label: 'Crafts', icon: Package, route: '/artist/crafts' },
  { key: 'bookings', label: 'Bookings', icon: Calendar, route: '/artist/bookings' },
  { key: 'reviews', label: 'Reviews', icon: Star, route: '/artist/reviews' },
  { key: 'schedule', label: 'Schedule', icon: Home, route: '/artist/schedule' },
];

function BottomNavBar({ userRole }: { userRole: 'tourist' | 'artist' }) {
  const router = useRouter();
  const items = userRole === 'artist' ? ARTIST_NAV_ITEMS : TOURIST_NAV_ITEMS;

  return (
    <View style={styles.bottomNav}>
      {items.map((item) => {
        const IconComp = item.icon;
        return (
          <TouchableOpacity
            key={item.key}
            style={styles.navItem}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
          >
            <IconComp size={22} color="#9CA3AF" />
            <Text style={styles.navLabel}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Profile Avatar ──
function ProfileAvatar({ profilePicUrl, initials }: { profilePicUrl?: string; initials?: string }) {
  if (profilePicUrl) {
    return (
      <Image
        source={{ uri: profilePicUrl }}
        style={styles.avatarImage}
      />
    );
  }
  return (
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarInitials}>{initials || '?'}</Text>
    </View>
  );
}

// ── Main Home Screen ──
export default function HomeScreen() {
  const router = useRouter();
  const { loading, token, tourist, artist, isAuthenticated } = useAuth();

  const isLoggedIn = isAuthenticated && (!!tourist || !!artist);
  const profilePicUrl = tourist?.profilePicUrl || artist?.profilePicUrl;
  const initials = tourist?.initials || artist?.initials || '?';

  const userRole = artist ? 'artist' : 'tourist';

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <BatikBackground>
          <ActivityIndicator size="large" color="#2F5D50" />
          <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 14 }}>Loading...</Text>
        </BatikBackground>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Logo size={32} />
          <Text style={styles.headerTitle}>Lanka Crafts</Text>
        </View>

        {isLoggedIn ? (
          <TouchableOpacity
            onPress={() => router.push((userRole === 'artist' ? '/artist/profile' : '/tourist/profile') as any)}
            activeOpacity={0.8}
          >
            <ProfileAvatar profilePicUrl={profilePicUrl} initials={initials} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.headerLogin}
            onPress={() => router.push('/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.headerLoginText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: isLoggedIn ? 80 : 40 }}
      >
        <BatikBackground>
          <HeroSection isLoggedIn={isLoggedIn} userRole={userRole} />
          <CraftCategoriesSection />
          <HowItWorksSection />
          <CTASection isLoggedIn={isLoggedIn} userRole={userRole} />
        </BatikBackground>
      </ScrollView>

      {/* Bottom Nav Bar - only when logged in */}
      {isLoggedIn && <BottomNavBar userRole={userRole} />}
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

  // Profile Avatar
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#C9A227',
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2F5D50',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#C9A227',
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
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

  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 6,
    paddingBottom: 8,
    height: 68,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 2,
  },
});
