import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Dimensions, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { getStats, getReviews, getSavedWorkshops, getArtists, getFeaturedArtist, addSavedWorkshop, removeSavedWorkshop } from '../../../src/services/api';
import { bookingApi } from '../../../src/api/bookings';
import { INTEREST_MAP } from '../../../src/constants/touristConstants';
import {
  Calendar, BookOpen, Heart, Star,
  MapPin, Clock, ChevronRight, TrendingUp,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface StatCard { label: string; value: string | number; icon: any; color: string; bg: string }

interface Stats {
  workshopsAttended: number;
  blogsPosted: number;
  reviewsGiven: number;
}

export default function TouristDashboardScreen() {
  const { tourist } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [savedWs, setSavedWs] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sRes, bRes, rRes, wRes, artistsRes, featuredRes] = await Promise.all([
          getStats().catch(() => null),
          bookingApi.getBookingsByEmail(tourist?.email || '').catch(() => null),
          getReviews({ mine: true }).catch(() => null),
          getSavedWorkshops().catch(() => null),
          getArtists(1, 20).catch(() => null),
          getFeaturedArtist().catch(() => null),
        ]);

        if (sRes?.data) setStats(sRes.data.stats);
        if (bRes?.bookings) setBookings(bRes.bookings);
        else if (Array.isArray(bRes)) setBookings(bRes);
        if (rRes?.data) setReviews(rRes.data.reviews || rRes.data || []);

        const savedIds = wRes?.data?.savedWorkshops || [];
        setSavedWs(savedIds);

        // Calculate Recommendations (same logic as webapp)
        const allArtists = artistsRes?.data?.artists || [];
        const featured = featuredRes?.data?.artist || null;
        const interests = tourist?.interests ?? [];

        const recList = [];
        if (featured) recList.push(featured);

        for (const a of allArtists) {
          if (recList.length >= 4) break;
          if (!recList.find((r) => r._id === a._id)) {
            if (interests.includes(a.craftType)) recList.push(a);
          }
        }
        for (const a of allArtists) {
          if (recList.length >= 4) break;
          if (!recList.find((r) => r._id === a._id)) recList.push(a);
        }

        setRecommendations(recList.map(w => ({
          _id: w._id,
          img: w.profilePicUrl || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&auto=format&fit=crop',
          category: INTEREST_MAP[w.craftType]?.label || w.craftType || 'Art',
          title: `${(w.craftType || 'Art').charAt(0).toUpperCase() + (w.craftType || 'Art').slice(1)} Workshop`,
          artisanName: w.fullName,
          location: w.address?.city || w.address?.district || 'Sri Lanka',
          rating: w.rating || 4.5,
          reviews: w.reviewCount || 0
        })));

      } catch (err) {
        console.error('Dashboard fetch error:', err);
      }
      setLoading(false);
    })();
  }, [tourist]);

  const statCards: StatCard[] = [
    { label: 'Bookings', value: bookings.length ?? 0, icon: Calendar, color: '#C65D3B', bg: '#FEF0EB' },
    { label: 'Blogs', value: stats?.blogsPosted ?? 0, icon: BookOpen, color: '#2F5D50', bg: '#EBF4F1' },
    { label: 'Wishlist', value: savedWs.length ?? 0, icon: Heart, color: '#DC2626', bg: '#FEF2F2' },
    { label: 'Reviews', value: stats?.reviewsGiven ?? reviews.length ?? 0, icon: Star, color: '#C9A227', bg: '#FDF8E7' },
  ];

  const toggleSave = async (id: string) => {
    const isSaved = savedWs.includes(id);
    try {
      if (isSaved) {
        setSavedWs(prev => prev.filter(i => i !== id));
        await removeSavedWorkshop(id);
      } else {
        setSavedWs(prev => [...prev, id]);
        await addSavedWorkshop(id);
      }
    } catch {
      // Revert
      if (isSaved) setSavedWs(prev => [...prev, id]);
      else setSavedWs(prev => prev.filter(i => i !== id));
    }
  };

  const upcoming = bookings
    .filter((b: any) => new Date(b.bookingDate) >= new Date())
    .sort((a: any, b: any) => new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime())
    .slice(0, 3);

  if (loading) {
    return (
      <SafeAreaView style={s.safe}><View style={s.loadingWrap}><ActivityIndicator size="large" color="#C65D3B" /></View></SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Welcome Banner */}
        <View style={s.banner}>
          <View style={{ flex: 1 }}>
            <Text style={s.bannerHi}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},</Text>
            <Text style={s.bannerName}>{tourist?.callingName || 'Explorer'} 👋</Text>
            <Text style={s.bannerSub}>Here's your activity overview</Text>
          </View>
          <View style={s.bannerAvatar}>
            {tourist?.profilePicUrl ? (
              <Image source={{ uri: tourist.profilePicUrl }} style={s.bannerAvatarImg} />
            ) : (
              <Text style={s.bannerAvatarText}>{tourist?.initials || '?'}</Text>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsGrid}>
          {statCards.map((sc) => {
            const Icon = sc.icon;
            return (
              <View key={sc.label} style={s.statCard}>
                <View style={[s.statIcon, { backgroundColor: sc.bg }]}>
                  <Icon size={18} color={sc.color} />
                </View>
                <Text style={s.statValue}>{sc.value}</Text>
                <Text style={s.statLabel}>{sc.label}</Text>
              </View>
            );
          })}
        </View>

        {/* Upcoming Bookings */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Upcoming Bookings</Text>
            {upcoming.length > 0 && <Text style={s.seeAll}>See All</Text>}
          </View>
          {upcoming.length === 0 ? (
            <View style={s.emptyCard}>
              <Calendar size={32} color="#D1D5DB" />
              <Text style={s.emptyTitle}>No upcoming bookings</Text>
              <Text style={s.emptySub}>Book a workshop to get started!</Text>
            </View>
          ) : (
            upcoming.map((b: any, i: number) => (
              <View key={b._id || i} style={s.bookingCard}>
                <View style={s.bookingDate}>
                  <Text style={s.bookingDate}>{new Date(b.bookingDate).getDate()}</Text>
                  <Text style={s.bookingMonth}>{new Date(b.bookingDate).toLocaleString('default', { month: 'short' })}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.bookingTitle} numberOfLines={1}>{b.craftName || b.artisanName}</Text>
                  <Text style={s.bookingArtisan} numberOfLines={1}>{b.artisanName}</Text>
                  <View style={s.bookingMeta}>
                    <Clock size={12} color="#9CA3AF" />
                    <Text style={s.bookingMetaText}>{b.bookingTime}</Text>
                  </View>
                  <View style={s.bookingMeta}>
                    <MapPin size={12} color="#9CA3AF" />
                    <Text style={s.bookingMetaText} numberOfLines={1}>{b.location}</Text>
                  </View>
                </View>
                <View style={[s.statusBadge, { backgroundColor: b.status === 'confirmed' ? '#DCFCE7' : '#FEF9C3' }]}>
                  <Text style={[s.statusText, { color: b.status === 'confirmed' ? '#16A34A' : '#CA8A04' }]}>{b.status || 'Pending'}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Recommended For You */}
        {recommendations.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Recommended For You</Text>
              <TouchableOpacity onPress={() => router.push('/tourist/browse')}>
                <Text style={s.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
              {recommendations.map((w) => (
                <TouchableOpacity key={w._id} style={s.recCard} activeOpacity={0.9} onPress={() => router.push(`/artist/${w._id}`)}>
                  <View style={s.recImageWrap}>
                    <Image source={{ uri: w.img }} style={s.recImage} />
                    <View style={s.recTag}>
                      <Text style={s.recTagText}>{w.category}</Text>
                    </View>
                    <TouchableOpacity
                      style={s.recLike}
                      onPress={() => toggleSave(w._id)}
                    >
                      <Heart
                        size={14}
                        color={savedWs.includes(w._id) ? '#DC2626' : '#9CA3AF'}
                        fill={savedWs.includes(w._id) ? '#DC2626' : 'transparent'}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={s.recInfo}>
                    <Text style={s.recTitle} numberOfLines={1}>{w.title}</Text>
                    <Text style={s.recArtisan} numberOfLines={1}>{w.artisanName}</Text>
                    <View style={s.recMeta}>
                      <View style={s.recRating}>
                        <Star size={12} color="#C9A227" fill="#C9A227" />
                        <Text style={s.recRatingText}>{w.rating}</Text>
                        <Text style={s.recReviews}>({w.reviews})</Text>
                      </View>
                      <Text style={s.recLocation}>{w.location}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Quick Actions */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          <View style={s.quickGrid}>
            {[
              { label: 'Write Blog', emoji: '✍️', color: '#2F5D50', bg: '#EBF4F1', route: '/tourist/blogs' },
              { label: 'Browse Artisans', emoji: '🎨', color: '#C65D3B', bg: '#FEF0EB', route: '/tourist/browse' },
              { label: 'My Reviews', emoji: '⭐', color: '#C9A227', bg: '#FDF8E7', route: '/tourist/profile' },
              { label: 'Edit Profile', emoji: '👤', color: '#6366F1', bg: '#EEF2FF', route: '/tourist/profile-edit' },
            ].map(q => (
              <TouchableOpacity key={q.label} style={[s.quickCard, { backgroundColor: q.bg }]} activeOpacity={0.7} onPress={() => router.push(q.route)}>
                <Text style={s.quickEmoji}>{q.emoji}</Text>
                <Text style={[s.quickLabel, { color: q.color }]}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F3EE' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  banner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2F5D50', marginHorizontal: 16, marginTop: 12, borderRadius: 20, padding: 20 },
  bannerHi: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  bannerName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  bannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  bannerAvatar: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  bannerAvatarImg: { width: 52, height: 52, borderRadius: 16 },
  bannerAvatarText: { fontSize: 18, fontWeight: '700', color: '#C9A227' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginTop: 16, gap: 10 },
  statCard: { width: (width - 42) / 2, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 24, fontWeight: '800', color: '#1E1E1E', marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#2F5D50', marginBottom: 12 },
  seeAll: { fontSize: 13, fontWeight: '700', color: '#C65D3B' },
  emptyCard: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 32, borderWidth: 1, borderColor: '#F0F0F0' },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#6B7280', marginTop: 12 },
  emptySub: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  bookingCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0' },
  bookingDate: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#FEF0EB', alignItems: 'center', justifyContent: 'center' },
  bookingDay: { fontSize: 18, fontWeight: '800', color: '#C65D3B' },
  bookingMonth: { fontSize: 10, fontWeight: '600', color: '#C65D3B', textTransform: 'uppercase' },
  bookingTitle: { fontSize: 14, fontWeight: '700', color: '#1E1E1E', marginBottom: 4 },
  bookingArtisan: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  bookingMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  bookingMetaText: { fontSize: 11, color: '#9CA3AF' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  savedCard: { width: 140, backgroundColor: '#fff', borderRadius: 16, padding: 14, marginRight: 10, borderWidth: 1, borderColor: '#F0F0F0' },
  savedTitle: { fontSize: 13, fontWeight: '700', color: '#1E1E1E', marginTop: 8, marginBottom: 4 },
  savedSub: { fontSize: 11, color: '#9CA3AF' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: { width: (width - 42) / 2, borderRadius: 16, padding: 20, alignItems: 'center' },
  quickEmoji: { fontSize: 28, marginBottom: 8 },
  quickLabel: { fontSize: 13, fontWeight: '700' },
  recCard: { width: 220, backgroundColor: '#fff', borderRadius: 20, marginRight: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F0F0' },
  recImageWrap: { width: '100%', height: 120 },
  recImage: { width: '100%', height: '100%' },
  recTag: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(47, 93, 80, 0.9)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  recTagText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  recLike: { position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  recInfo: { padding: 12 },
  recTitle: { fontSize: 14, fontWeight: '700', color: '#1E1E1E', marginBottom: 2 },
  recArtisan: { fontSize: 11, color: '#9CA3AF', marginBottom: 6 },
  recMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recRatingText: { fontSize: 11, fontWeight: '700', color: '#1E1E1E' },
  recReviews: { fontSize: 10, color: '#9CA3AF' },
  recLocation: { fontSize: 10, color: '#2F5D50', fontWeight: '600' },
});
