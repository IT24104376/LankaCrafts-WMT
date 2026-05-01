import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, FlatList, Dimensions, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/context/AuthContext';
import { getArtists, getFeaturedArtist } from '../../../src/services/api';
import { Search, MapPin, Star, ArrowRight, Heart } from 'lucide-react-native';

const { width } = Dimensions.get('window');

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

export default function TouristHomeScreen() {
  const { tourist } = useAuth();
  const router = useRouter();
  const [featured, setFeatured] = useState<any>(null);
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [fRes, aRes] = await Promise.all([
          getFeaturedArtist().catch(() => null),
          getArtists(1, 6).catch(() => null),
        ]);
        if (fRes?.data) setFeatured(fRes.data.artist || fRes.data);
        if (aRes?.data) setArtists(aRes.data.artists || []);
      } catch { }
      setLoading(false);
    })();
  }, []);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Welcome */}
        <View style={s.welcome}>
          <View>
            <Text style={s.welcomeHi}>Welcome back,</Text>
            <Text style={s.welcomeName}>{tourist?.callingName || 'Explorer'} 👋</Text>
          </View>
          <TouchableOpacity style={s.avatar} onPress={() => router.push('/tourist/(tabs)/profile')}>
            {tourist?.profilePicUrl ? (
              <Image source={{ uri: tourist.profilePicUrl }} style={s.avatarImg} />
            ) : (
              <Text style={s.avatarText}>{tourist?.initials || '?'}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Search */}
        <TouchableOpacity style={s.searchBar} activeOpacity={0.8}>
          <Search size={18} color="#9CA3AF" />
          <Text style={s.searchPlaceholder}>Search artisans, crafts, workshops...</Text>
        </TouchableOpacity>

        {/* Book a Workshop Banner */}
        <TouchableOpacity
          style={s.bookBanner}
          onPress={() => router.push('/tourist/bookings/book-workshop')}
          activeOpacity={0.85}>
          <View>
            <Text style={s.bookBannerTag}>EXPERIENCE SRI LANKA</Text>
            <Text style={s.bookBannerTitle}>Book a Workshop</Text>
            <Text style={s.bookBannerSub}>Learn directly from master artisans</Text>
          </View>
          <View style={s.bookBannerIcon}>
            <Text style={{ fontSize: 32 }}></Text>
          </View>
        </TouchableOpacity>

        {/* Craft Categories */}
        <View style={s.section}>
          <Text style={s.sectionTag}>EXPLORE</Text>
          <Text style={s.sectionTitle}>Craft Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CRAFTS.map(c => (
              <TouchableOpacity key={c.label} style={s.craftCard} activeOpacity={0.7}>
                <Text style={s.craftEmoji}>{c.emoji}</Text>
                <Text style={s.craftLabel}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Artisan */}
        {featured && (
          <View style={s.section}>
            <Text style={s.sectionTag}>FEATURED</Text>
            <Text style={s.sectionTitle}>Artisan Spotlight</Text>
            <View style={s.featuredCard}>
              <View style={s.featuredTop}>
                <View style={s.featuredAvatar}>
                  <Text style={s.featuredInitials}>{featured.initials || '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.featuredName}>{featured.fullName || featured.callingName}</Text>
                  <Text style={s.featuredCraft}>{featured.craftType}</Text>
                  <View style={s.ratingRow}>
                    <Star size={14} color="#C9A227" fill="#C9A227" />
                    <Text style={s.ratingText}>{featured.rating?.toFixed(1) || '4.8'}</Text>
                    <Text style={s.ratingCount}>({featured.reviewCount || 0} reviews)</Text>
                  </View>
                </View>
              </View>
              <Text style={s.featuredBio} numberOfLines={2}>{featured.bio}</Text>
            </View>
          </View>
        )}

        {/* Browse Artisans */}
        {artists.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View>
                <Text style={s.sectionTag}>ARTISANS</Text>
                <Text style={s.sectionTitle}>Discover Artisans</Text>
              </View>
              <TouchableOpacity>
                <Text style={s.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {artists.map((a: any, i: number) => (
                <View key={a._id || i} style={s.artisanCard}>
                  <View style={s.artisanAvatar}>
                    <Text style={s.artisanInitials}>{a.initials || '?'}</Text>
                  </View>
                  <Text style={s.artisanName} numberOfLines={1}>{a.callingName || a.fullName}</Text>
                  <Text style={s.artisanCraft} numberOfLines={1}>{a.craftType}</Text>
                  <View style={s.artisanRating}>
                    <Star size={12} color="#C9A227" fill="#C9A227" />
                    <Text style={s.artisanRatingText}>{a.rating?.toFixed(1) || '–'}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Map Teaser */}
        <View style={s.mapTeaser}>
          <MapPin size={24} color="#C9A227" />
          <Text style={s.mapTitle}>Explore on the Map</Text>
          <Text style={s.mapSubtitle}>Discover artisan workshops across Sri Lanka</Text>
          <TouchableOpacity style={s.mapBtn} onPress={() => router.push('/tourist/(tabs)/dashboard')} activeOpacity={0.8}>
            <Text style={s.mapBtnText}>Open Dashboard Map</Text>
            <ArrowRight size={16} color="#2F5D50" />
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator size="large" color="#C65D3B" style={{ marginTop: 24 }} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  bookBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#C65D3B', marginHorizontal: 20, marginTop: 16, borderRadius: 20, padding: 20 },
  bookBannerTag: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 2, marginBottom: 4 },
  bookBannerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  bookBannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  bookBannerIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  safe: { flex: 1, backgroundColor: '#F6F3EE' },
  welcome: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  welcomeHi: { fontSize: 13, color: '#9CA3AF' },
  welcomeName: { fontSize: 22, fontWeight: '800', color: '#2F5D50' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#C65D3B', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginTop: 12, marginBottom: 8, backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#F0F0F0' },
  searchPlaceholder: { fontSize: 14, color: '#C0C0C0' },
  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionTag: { fontSize: 10, fontWeight: '800', color: '#C9A227', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#2F5D50', marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  seeAll: { fontSize: 13, fontWeight: '700', color: '#C65D3B', marginBottom: 16 },
  craftCard: { width: 90, backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: '#F0F0F0' },
  craftEmoji: { fontSize: 24, marginBottom: 6 },
  craftLabel: { fontSize: 11, fontWeight: '600', color: '#2F5D50', textAlign: 'center' },
  featuredCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#F0F0F0' },
  featuredTop: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  featuredAvatar: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#2F5D50', alignItems: 'center', justifyContent: 'center' },
  featuredInitials: { fontSize: 18, fontWeight: '800', color: '#C9A227' },
  featuredName: { fontSize: 16, fontWeight: '700', color: '#1E1E1E', marginBottom: 2 },
  featuredCraft: { fontSize: 12, color: '#C65D3B', fontWeight: '600', marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, fontWeight: '700', color: '#1E1E1E' },
  ratingCount: { fontSize: 11, color: '#9CA3AF' },
  featuredBio: { fontSize: 13, color: '#6B7280', lineHeight: 19 },
  artisanCard: { width: 130, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  artisanAvatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#EBF4F1', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  artisanInitials: { fontSize: 16, fontWeight: '700', color: '#2F5D50' },
  artisanName: { fontSize: 13, fontWeight: '700', color: '#1E1E1E', marginBottom: 2 },
  artisanCraft: { fontSize: 11, color: '#9CA3AF', marginBottom: 4 },
  artisanRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  artisanRatingText: { fontSize: 12, fontWeight: '600', color: '#1E1E1E' },
  mapTeaser: { alignItems: 'center', backgroundColor: '#2F5D50', margin: 20, borderRadius: 24, padding: 28 },
  mapTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 12, marginBottom: 6 },
  mapSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 20, textAlign: 'center' },
  mapBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#C9A227', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14 },
  mapBtnText: { fontSize: 13, fontWeight: '700', color: '#2F5D50' },
});
