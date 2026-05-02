import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { getReviews } from '../../src/services/api';
import { ArrowLeft, Star, MessageSquare, Calendar } from 'lucide-react-native';
import { BatikBackground } from '../../src/components/BatikBackground';

const { width } = Dimensions.get('window');

export default function MyReviewsScreen() {
  const router = useRouter();
  const { tourist } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReviews = async () => {
    try {
      const res = await getReviews({ mine: true });
      const list = res.data?.reviews || res.data || [];
      setReviews(Array.isArray(list) ? list : []);
    } catch {
      setReviews([]);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchReviews();
      setLoading(false);
    })();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReviews();
    setRefreshing(false);
  }, []);

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return ''; }
  };

  const renderStars = (rating: number) => {
    return (
      <View style={s.starsRow}>
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            size={14}
            color={i <= rating ? '#C9A227' : '#E5E7EB'}
            fill={i <= rating ? '#C9A227' : 'transparent'}
          />
        ))}
      </View>
    );
  };

  return (
    <BatikBackground>
      <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft size={20} color="#2F5D50" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Reviews</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Stats Summary */}
      <View style={s.statsBar}>
        <View style={s.statItem}>
          <Text style={s.statValue}>{reviews.length}</Text>
          <Text style={s.statLabel}>Total Reviews</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statValue}>
            {reviews.length > 0
              ? (reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
              : '—'}
          </Text>
          <Text style={s.statLabel}>Avg Rating</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C65D3B" />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#C65D3B" style={{ marginTop: 40 }} />
        ) : reviews.length === 0 ? (
          <View style={s.emptyCard}>
            <Star size={40} color="#E5E7EB" />
            <Text style={s.emptyTitle}>No reviews yet</Text>
            <Text style={s.emptySub}>
              After attending a workshop, you can leave a review for the artisan!
            </Text>
          </View>
        ) : (
          reviews.map((review: any, idx: number) => (
            <View key={review._id || idx} style={s.reviewCard}>
              {/* Top: artisan name + rating */}
              <View style={s.reviewTop}>
                <View style={{ flex: 1 }}>
                  <Text style={s.reviewArtisan} numberOfLines={1}>
                    {review.artisanName || review.artistName || 'Workshop Review'}
                  </Text>
                  <Text style={s.reviewCraft} numberOfLines={1}>
                    {review.craftType || review.workshopName || ''}
                  </Text>
                </View>
                {renderStars(review.rating || 0)}
              </View>

              {/* Review Body */}
              {review.comment || review.text ? (
                <View style={s.reviewBody}>
                  <MessageSquare size={14} color="#9CA3AF" style={{ marginTop: 2 }} />
                  <Text style={s.reviewText}>{review.comment || review.text}</Text>
                </View>
              ) : null}

              {/* Date */}
              <View style={s.reviewFooter}>
                <Calendar size={12} color="#9CA3AF" />
                <Text style={s.reviewDate}>{formatDate(review.createdAt)}</Text>
              </View>
            </View>
          ))
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

  // Stats Bar
  statsBar: {
    flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12,
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F0F0F0',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#C9A227', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: '#F0F0F0', marginHorizontal: 12 },

  // Empty
  emptyCard: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 40, marginTop: 24, borderWidth: 1, borderColor: '#F0F0F0' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#6B7280', marginTop: 16 },
  emptySub: { fontSize: 13, color: '#9CA3AF', marginTop: 6, textAlign: 'center', lineHeight: 19 },

  // Review Card
  reviewCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 12,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  reviewTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  reviewArtisan: { fontSize: 15, fontWeight: '700', color: '#1E1E1E', marginBottom: 2 },
  reviewCraft: { fontSize: 12, color: '#C65D3B', fontWeight: '600' },
  starsRow: { flexDirection: 'row', gap: 2 },

  reviewBody: { flexDirection: 'row', gap: 8, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, marginBottom: 10 },
  reviewText: { flex: 1, fontSize: 13, color: '#6B7280', lineHeight: 19 },

  reviewFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reviewDate: { fontSize: 11, color: '#9CA3AF' },
});
