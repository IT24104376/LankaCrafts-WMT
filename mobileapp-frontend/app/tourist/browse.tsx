import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Dimensions, Image, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getArtists } from '../../src/services/api';
import { ArrowLeft, Search, MapPin, Star } from 'lucide-react-native';
import { BatikBackground } from '../../src/components/BatikBackground';

const { width } = Dimensions.get('window');

export default function BrowseArtisansScreen() {
  const router = useRouter();
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchArtistsList = async () => {
    try {
      // Fetching up to 100 artists for the browse page
      const res = await getArtists(1, 100);
      const list = res.data?.artists || res.data || [];
      setArtists(Array.isArray(list) ? list : []);
    } catch {
      setArtists([]);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchArtistsList();
      setLoading(false);
    })();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchArtistsList();
    setRefreshing(false);
  }, []);

  const filteredArtists = artists.filter(a => {
    const term = searchQuery.toLowerCase();
    const name = (a.fullName || a.callingName || '').toLowerCase();
    const craft = (a.craftType || '').toLowerCase();
    const city = (a.address?.city || '').toLowerCase();
    return name.includes(term) || craft.includes(term) || city.includes(term);
  });

  return (
    <BatikBackground>
      <SafeAreaView style={s.safe} edges={['top']}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ArrowLeft size={20} color="#2F5D50" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Browse Artisans</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Search Bar */}
        <View style={s.searchContainer}>
          <View style={s.searchBar}>
            <Search size={18} color="#9CA3AF" />
            <TextInput
              style={s.searchInput}
              placeholder="Search by name, craft, or city..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C65D3B" />}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#C65D3B" style={{ marginTop: 40 }} />
          ) : filteredArtists.length === 0 ? (
            <View style={s.emptyCard}>
              <Search size={40} color="#E5E7EB" />
              <Text style={s.emptyTitle}>No artisans found</Text>
              <Text style={s.emptySub}>
                We couldn't find any artisans matching your search.
              </Text>
            </View>
          ) : (
            <View style={s.grid}>
              {filteredArtists.map((artist: any, idx: number) => {
                const name = artist.fullName || artist.callingName || 'Artisan';
                const initials = name.charAt(0);
                const craft = artist.craftType ? artist.craftType.charAt(0).toUpperCase() + artist.craftType.slice(1) : 'Craft';
                const city = artist.address?.city || 'Sri Lanka';
                const pic = artist.profilePicUrl || null;

                // Dummy ratings if missing
                const rating = artist.rating || (Math.random() * 1.5 + 3.5).toFixed(1);
                const reviewCount = artist.reviewCount || Math.floor(Math.random() * 50) + 5;

                return (
                  <TouchableOpacity key={artist._id || idx} style={s.card} activeOpacity={0.9} onPress={() => router.push(`/artist/profile/${artist._id}`)}>
                    {pic ? (
                      <Image source={{ uri: pic }} style={s.cardImage} resizeMode="cover" />
                    ) : (
                      <View style={[s.cardImage, s.cardImageFallback]}>
                        <Text style={s.fallbackInitials}>{initials}</Text>
                      </View>
                    )}

                    <View style={s.cardBody}>
                      <Text style={s.cardCraft} numberOfLines={1}>{craft}</Text>
                      <Text style={s.cardName} numberOfLines={1}>{name}</Text>

                      <View style={s.cardMetaRow}>
                        <View style={s.cardMetaItem}>
                          <MapPin size={12} color="#9CA3AF" />
                          <Text style={s.cardMetaText} numberOfLines={1}>{city}</Text>
                        </View>
                        <View style={s.cardMetaItem}>
                          <Star size={12} color="#C9A227" fill="#C9A227" />
                          <Text style={s.cardMetaText}>{rating} ({reviewCount})</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </BatikBackground>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'transparent',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#EBF4F1', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#2F5D50' },

  searchContainer: { backgroundColor: 'transparent', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F9FAFB', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: '#E5E7EB'
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1E1E1E' },

  emptyCard: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 40, marginTop: 24, borderWidth: 1, borderColor: '#F0F0F0' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#6B7280', marginTop: 16 },
  emptySub: { fontSize: 13, color: '#9CA3AF', marginTop: 6, textAlign: 'center', lineHeight: 19 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  card: {
    width: (width - 32 - 16) / 2, // 2 columns, padding 16, gap 16
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  cardImage: { width: '100%', height: 140 },
  cardImageFallback: { backgroundColor: '#2F5D50', alignItems: 'center', justifyContent: 'center' },
  fallbackInitials: { fontSize: 48, fontWeight: '800', color: '#C9A227' },

  cardBody: { padding: 12 },
  cardCraft: { fontSize: 11, fontWeight: '700', color: '#C65D3B', textTransform: 'uppercase', marginBottom: 4 },
  cardName: { fontSize: 15, fontWeight: '800', color: '#1E1E1E', marginBottom: 8 },

  cardMetaRow: { gap: 6 },
  cardMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMetaText: { fontSize: 11, color: '#6B7280', flex: 1 },
});
