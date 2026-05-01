import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Star, Edit2, Trash2, MessageCircle, ThumbsUp, Plus } from 'lucide-react-native';
import { reviewApi, Review } from '../../../src/services/reviewApi';
import { BatikBackground } from '../../../src/components/BatikBackground';

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
const STAR_COLOR = '#C9A227';

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          size={size}
          color={STAR_COLOR}
          fill={s <= rating ? STAR_COLOR : 'transparent'}
        />
      ))}
    </View>
  );
}

function ReviewCard({
  review,
  onEdit,
  onDelete,
}: {
  review: Review;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const reviewId = review._id || review.id || '';
  const date = review.datePosted
    ? new Date(review.datePosted).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <View style={s.card}>
      {/* Header row */}
      <View style={s.cardHeader}>
        <View style={s.artistBadge}>
          <Text style={s.artistBadgeText} numberOfLines={1}>{review.artisanName}</Text>
        </View>
        {review.isOwn && (
          <View style={s.actionRow}>
            {review.canEdit && (
              <TouchableOpacity style={s.iconBtn} onPress={onEdit}>
                <Edit2 size={15} color="#2F5D50" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[s.iconBtn, { backgroundColor: '#FEF2F2' }]} onPress={onDelete}>
              <Trash2 size={15} color="#DC2626" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Workshop */}
      {review.workshopName ? (
        <Text style={s.workshopName}>{review.workshopName}</Text>
      ) : null}

      {/* Rating + date */}
      <View style={s.ratingRow}>
        <StarRow rating={review.rating} />
        <Text style={s.ratingLabel}>{RATING_LABELS[review.rating]}</Text>
        <Text style={s.dateText}>{date}</Text>
      </View>

      {/* Review text */}
      <Text style={s.reviewText}>{review.text}</Text>

      {/* Photos */}
      {review.photos && review.photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.photosRow}>
          {review.photos.map((p, i) => (
            <Image key={i} source={{ uri: p.url }} style={s.reviewPhoto} />
          ))}
        </ScrollView>
      )}

      {/* Edited badge */}
      {review.edited && (
        <Text style={s.editedBadge}>Edited</Text>
      )}

      {/* Artisan reply */}
      {review.artisanReply && (
        <View style={s.replyBox}>
          <View style={s.replyHeader}>
            <MessageCircle size={13} color="#2F5D50" />
            <Text style={s.replyLabel}>Artisan Reply</Text>
            <Text style={s.replyDate}>
              {new Date(review.artisanReply.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
          <Text style={s.replyText}>{review.artisanReply.text}</Text>
        </View>
      )}

      {/* Helpful count */}
      <View style={s.helpfulRow}>
        <ThumbsUp size={12} color="#9CA3AF" />
        <Text style={s.helpfulText}>{review.helpful || 0} found helpful</Text>
      </View>
    </View>
  );
}

export default function TouristReviewsScreen() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await reviewApi.getMyReviews();
      setReviews(data.reviews || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [])
  );

  const handleDelete = (id: string) => {
    Alert.alert('Delete Review', 'Are you sure you want to delete this review?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await reviewApi.deleteReview(id);
            setReviews(prev => prev.filter(r => (r._id || r.id) !== id));
          } catch {
            Alert.alert('Error', 'Failed to delete review.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <BatikBackground />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>My Reviews</Text>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => router.push('/tourist/reviews/create')}
        >
          <Plus size={18} color="#fff" />
          <Text style={s.addBtnText}>Write</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#2F5D50" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#2F5D50']} />}
        >
          {reviews.length === 0 ? (
            <View style={s.empty}>
              <Star size={52} color="#D1D5DB" fill="transparent" />
              <Text style={s.emptyTitle}>No reviews yet</Text>
              <Text style={s.emptySubtitle}>Share your workshop experiences with the community.</Text>
              <TouchableOpacity
                style={s.emptyBtn}
                onPress={() => router.push('/tourist/reviews/create')}
              >
                <Text style={s.emptyBtnText}>Write Your First Review</Text>
              </TouchableOpacity>
            </View>
          ) : (
            reviews.map(r => {
              const id = r._id || r.id || '';
              return (
                <ReviewCard
                  key={id}
                  review={r}
                  onEdit={() => router.push({ pathname: '/tourist/reviews/[id]', params: { id } })}
                  onDelete={() => handleDelete(id)}
                />
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F3EE' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1E1E1E' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#C65D3B', paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 12,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  artistBadge: {
    backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10, maxWidth: '70%',
  },
  artistBadgeText: { fontSize: 12, fontWeight: '700', color: '#2F5D50' },
  actionRow: { flexDirection: 'row', gap: 6 },
  iconBtn: {
    width: 30, height: 30, borderRadius: 8, backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center',
  },
  workshopName: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  ratingLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  dateText: { fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' },
  reviewText: { fontSize: 14, color: '#4B5563', lineHeight: 21, marginBottom: 10 },
  photosRow: { marginBottom: 10 },
  reviewPhoto: { width: 72, height: 72, borderRadius: 10, marginRight: 8, backgroundColor: '#F3F4F6' },
  editedBadge: { fontSize: 10, color: '#9CA3AF', marginBottom: 6, fontStyle: 'italic' },
  replyBox: {
    backgroundColor: '#F0FDF4', borderLeftWidth: 3, borderLeftColor: '#2F5D50',
    borderRadius: 10, padding: 10, marginBottom: 8,
  },
  replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  replyLabel: { fontSize: 12, fontWeight: '700', color: '#2F5D50', flex: 1 },
  replyDate: { fontSize: 10, color: '#9CA3AF' },
  replyText: { fontSize: 13, color: '#374151', lineHeight: 19 },
  helpfulRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  helpfulText: { fontSize: 11, color: '#9CA3AF' },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1E1E1E', marginTop: 16, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    marginTop: 24, backgroundColor: '#2F5D50', paddingHorizontal: 24,
    paddingVertical: 14, borderRadius: 14,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
