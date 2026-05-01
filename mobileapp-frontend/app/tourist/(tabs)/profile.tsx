import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Dimensions, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/context/AuthContext';
import { getStats, getReviews, getMyBlogs, getSavedWorkshops, getArtistById } from '../../../src/services/api';
import { bookingApi } from '../../../src/api/bookings';
import { INTEREST_MAP, REGIONS_MAP } from '../../../src/constants/touristConstants';
import {
  Settings, Edit3, MapPin, Globe, Calendar, BookOpen,
  Heart, Star, LogOut, ChevronRight, Mail, CreditCard,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function TouristProfileScreen() {
  const { tourist, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sRes, rRes, bRes, blogsRes, savedRes] = await Promise.all([
          getStats().catch(() => null),
          getReviews({ mine: true }).catch(() => null),
          bookingApi.getBookingsByEmail(tourist?.email || '').catch(() => null),
          getMyBlogs().catch(() => null),
          getSavedWorkshops().catch(() => null),
        ]);
        if (sRes?.data) setStats(sRes.data.stats || sRes.data);
        if (rRes?.data) setReviews(rRes.data.reviews || rRes.data || []);
        if (bRes?.bookings) setBookings(bRes.bookings);
        else if (Array.isArray(bRes)) setBookings(bRes);
        if (blogsRes?.data) setBlogs(blogsRes.data.blogs || []);

        const savedIds: string[] = savedRes?.data?.savedWorkshops || [];
        if (savedIds.length > 0) {
          const artistPromises = savedIds.slice(0, 5).map(id =>
            getArtistById(id).then(res => res.data?.artist).catch(() => null)
          );
          const artists = await Promise.all(artistPromises);
          setWishlist(artists.filter(Boolean).map(a => ({
            id: a._id || a.id,
            img: a.profilePicUrl || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&auto=format&fit=crop',
            name: `${(a.craftType || 'Art').charAt(0).toUpperCase() + (a.craftType || 'Art').slice(1)} Workshop`,
            artisan: a.fullName,
            location: a.address?.city || 'Sri Lanka'
          })));
        }
      } catch { }
      setLoading(false);
    })();
  }, [tourist]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); router.replace('/'); } },
    ]);
  };

  if (loading) {
    return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color="#C65D3B" /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header bar */}
        <View style={s.headerBar}>
          <Text style={s.headerTitle}>Profile</Text>
          <View style={s.headerActions}>
            <TouchableOpacity onPress={() => router.push('/tourist/profile-edit')} style={s.headerBtn}>
              <Edit3 size={18} color="#2F5D50" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={s.headerBtn}>
              <LogOut size={18} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Banner */}
        <View style={s.banner}>
          <View style={s.avatarWrap}>
            {tourist?.profilePicUrl ? (
              <Image source={{ uri: tourist.profilePicUrl }} style={s.avatarImg} />
            ) : (
              <View style={s.avatarFallback}>
                <Text style={s.avatarText}>{tourist?.initials || '?'}</Text>
              </View>
            )}
          </View>
          <Text style={s.fullName}>{tourist?.fullName || 'Tourist'}</Text>
          <Text style={s.callingName}>@{tourist?.callingName || 'explorer'}</Text>
          <View style={s.metaRow}>
            <View style={s.metaItem}>
              <Mail size={12} color="#9CA3AF" />
              <Text style={s.metaText}>{tourist?.email || '–'}</Text>
            </View>
            <View style={s.metaItem}>
              <Globe size={12} color="#9CA3AF" />
              <Text style={s.metaText}>{tourist?.country || '–'}</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={s.statsRow}>
          {[
            { label: 'Bookings', val: bookings.length ?? 0, icon: Calendar, color: '#C65D3B' },
            { label: 'Blogs', val: stats?.blogsPosted ?? 0, icon: BookOpen, color: '#2F5D50' },
            { label: 'Reviews', val: stats?.reviewsGiven ?? reviews.length, icon: Star, color: '#C9A227' },
          ].map(st => (
            <View key={st.label} style={s.statBox}>
              <st.icon size={16} color={st.color} />
              <Text style={s.statVal}>{st.val}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* Interests */}
        {tourist?.interests && tourist.interests.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Interests</Text>
            <View style={s.chipRow}>
              {tourist.interests.map(id => {
                const interest = INTEREST_MAP[id];
                return (
                  <View key={id} style={s.chip}>
                    <Text style={s.chipText}>{interest?.emoji || '🎨'} {interest?.label || id}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Preferred Regions */}
        {tourist?.preferredRegions && tourist.preferredRegions.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Preferred Regions</Text>
            <View style={s.chipRow}>
              {tourist.preferredRegions.map(id => {
                const region = REGIONS_MAP[id];
                return (
                  <View key={id} style={[s.chip, { backgroundColor: '#EBF4F1', borderColor: '#C8E6DF' }]}>
                    <Text style={[s.chipText, { color: '#2F5D50' }]}>{region?.emoji || '📍'} {region?.label || id}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Address */}
        {tourist?.address && (tourist.address.line1 || tourist.address.city) && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Address</Text>
            <View style={s.addressCard}>
              <MapPin size={16} color="#C65D3B" />
              <Text style={s.addressText}>
                {[tourist.address.line1, tourist.address.line2, tourist.address.city, tourist.address.postalCode].filter(Boolean).join(', ')}
              </Text>
            </View>
          </View>
        )}

        {/* ID */}
        {tourist?.idNumber && (
          <View style={s.section}>
            <View style={s.infoRow}>
              <CreditCard size={16} color="#9CA3AF" />
              <View>
                <Text style={s.infoLabel}>ID / Passport</Text>
                <Text style={s.infoValue}>{tourist.idNumber}</Text>
              </View>
            </View>
          </View>
        )}

        {/* My Wishlist */}
        {wishlist.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>My Wishlist</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {wishlist.map((w) => (
                <TouchableOpacity key={w.id} style={s.wishCard} activeOpacity={0.8} onPress={() => router.push(`/artist/${w.id}`)}>
                  <Image source={{ uri: w.img }} style={s.wishImg} />
                  <View style={s.wishInfo}>
                    <Text style={s.wishName} numberOfLines={1}>{w.name}</Text>
                    <Text style={s.wishArtisan} numberOfLines={1}>{w.artisan}</Text>
                    <Text style={s.wishLoc}>{w.location}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* My Blogs */}
        {blogs.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>My Blogs</Text>
            {blogs.slice(0, 3).map((b) => (
              <View key={b._id} style={s.blogMiniCard}>
                <View style={[s.blogStatus, { backgroundColor: b.status === 'draft' ? '#FEF9C3' : '#DCFCE7' }]}>
                  <Text style={[s.blogStatusText, { color: b.status === 'draft' ? '#CA8A04' : '#16A34A' }]}>{b.status}</Text>
                </View>
                <View style={s.blogMiniContent}>
                  <Text style={s.blogMiniTitle} numberOfLines={1}>{b.title}</Text>
                  <Text style={s.blogMiniDate}>{new Date(b.createdAt).toLocaleDateString()}</Text>
                </View>
                <TouchableOpacity onPress={() => router.push(`/tourist/blogs/edit/${b._id}`)}>
                  <Edit3 size={16} color="#C65D3B" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Recent Reviews */}
        {reviews.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Recent Reviews</Text>
            {reviews.slice(0, 3).map((r: any, i: number) => (
              <View key={r._id || i} style={s.reviewCard}>
                <View style={s.reviewHeader}>
                  <View style={s.ratingStars}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} size={12} color="#C9A227" fill={n <= (r.rating || 0) ? '#C9A227' : 'transparent'} />
                    ))}
                  </View>
                  <Text style={s.reviewDate}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={s.reviewText} numberOfLines={2}>{r.text || r.comment}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action buttons */}
        <View style={s.section}>
          <TouchableOpacity style={s.editBtn} onPress={() => router.push('/tourist/profile-edit')} activeOpacity={0.8}>
            <Edit3 size={18} color="#fff" />
            <Text style={s.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F3EE' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#2F5D50' },
  headerActions: { flexDirection: 'row', gap: 12 },
  headerBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F0F0F0' },
  banner: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 24, borderWidth: 1, borderColor: '#F0F0F0' },
  avatarWrap: { width: 80, height: 80, borderRadius: 24, overflow: 'hidden', marginBottom: 12 },
  avatarImg: { width: 80, height: 80, borderRadius: 24 },
  avatarFallback: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#C65D3B', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  fullName: { fontSize: 20, fontWeight: '800', color: '#1E1E1E', marginBottom: 2 },
  callingName: { fontSize: 13, color: '#9CA3AF', marginBottom: 12 },
  metaRow: { flexDirection: 'row', gap: 20 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#6B7280' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 16 },
  statBox: { flex: 1, alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginHorizontal: 4, borderWidth: 1, borderColor: '#F0F0F0' },
  statVal: { fontSize: 20, fontWeight: '800', color: '#1E1E1E', marginTop: 6 },
  statLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2F5D50', marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, backgroundColor: '#FEF0EB', borderWidth: 1, borderColor: '#FDDCD2' },
  chipText: { fontSize: 12, color: '#C65D3B', fontWeight: '600' },
  addressCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  addressText: { flex: 1, fontSize: 13, color: '#4B5563', lineHeight: 19 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  infoLabel: { fontSize: 11, color: '#9CA3AF' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1E1E1E' },
  reviewCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0' },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  ratingStars: { flexDirection: 'row', gap: 2 },
  reviewDate: { fontSize: 11, color: '#9CA3AF' },
  reviewText: { fontSize: 13, color: '#4B5563', lineHeight: 18 },
  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#C65D3B', paddingVertical: 14, borderRadius: 16 },
  editBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  wishCard: { width: 150, backgroundColor: '#fff', borderRadius: 16, marginRight: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F0F0' },
  wishImg: { width: '100%', height: 90 },
  wishInfo: { padding: 10 },
  wishName: { fontSize: 12, fontWeight: '700', color: '#1E1E1E', marginBottom: 2 },
  wishArtisan: { fontSize: 10, color: '#9CA3AF', marginBottom: 4 },
  wishLoc: { fontSize: 10, color: '#1A6B6B', fontWeight: '600' },
  blogMiniCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0' },
  blogStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  blogStatusText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  blogMiniContent: { flex: 1 },
  blogMiniTitle: { fontSize: 14, fontWeight: '700', color: '#1E1E1E', marginBottom: 2 },
  blogMiniDate: { fontSize: 11, color: '#9CA3AF' },
});
