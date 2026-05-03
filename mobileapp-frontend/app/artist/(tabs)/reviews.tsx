import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, TextInput, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Star, MessageCircle, ThumbsUp, ChevronDown, ChevronUp, Send, Sparkles, Bot } from 'lucide-react-native';
import { reviewApi, Review } from '../../../src/services/reviewApi';
import { aiApi, AiReviewSummary } from '../../../src/services/aiApi';
import { useAuth } from '../../../src/context/AuthContext';
import { BatikBackground } from '../../../src/components/BatikBackground';
import { AISummaryCard } from '../../../src/components/AISummaryCard';

const STAR_COLOR = '#C9A227';
const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Highest Rated', value: 'highest' },
  { label: 'Lowest Rated', value: 'lowest' },
];



function StarRow({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={size} color={STAR_COLOR} fill={s <= rating ? STAR_COLOR : 'transparent'} />
      ))}
    </View>
  );
}

function RatingBar({ stars, count, total }: { stars: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <View style={rb.row}>
      <Text style={rb.label}>{stars}★</Text>
      <View style={rb.barBg}>
        <View style={[rb.barFill, { width: `${pct}%` }]} />
      </View>
      <Text style={rb.count}>{count}</Text>
    </View>
  );
}

const rb = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  label: { fontSize: 11, color: '#6B7280', width: 20, textAlign: 'right' },
  barBg: { flex: 1, height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, backgroundColor: STAR_COLOR, borderRadius: 3 },
  count: { fontSize: 11, color: '#9CA3AF', width: 20 },
});

function ReplyForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (text: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const handle = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await onSubmit(replyText.trim());
      setReplyText('');
    } catch {
      Alert.alert('Error', 'Failed to post reply.');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={rf.box}>
      <TextInput
        style={rf.input}
        value={replyText}
        onChangeText={setReplyText}
        placeholder="Write your reply to this review..."
        placeholderTextColor="#9CA3AF"
        multiline
        textAlignVertical="top"
      />
      <View style={rf.btnRow}>
        <TouchableOpacity style={rf.cancelBtn} onPress={onCancel}>
          <Text style={rf.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[rf.sendBtn, (!replyText.trim() || sending) && { opacity: 0.5 }]}
          onPress={handle}
          disabled={!replyText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Send size={13} color="#fff" />
              <Text style={rf.sendText}>Post Reply</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const rf = StyleSheet.create({
  box: { backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12, marginTop: 10 },
  input: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D1FAE5',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13,
    color: '#1E1E1E', minHeight: 70,
  },
  btnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  cancelText: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#2F5D50', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  sendText: { fontSize: 13, color: '#fff', fontWeight: '700' },
});

function ReviewCard({
  review,
  onReply,
}: {
  review: Review;
  onReply: (id: string, text: string) => Promise<void>;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const reviewId = review._id || review.id || '';
  const date = review.datePosted
    ? new Date(review.datePosted).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <View style={s.card}>
      {/* Tourist info */}
      <View style={s.cardTop}>
        <View style={[s.avatar, { backgroundColor: review.touristColor || '#2F5D50' }]}>
          <Text style={s.avatarText}>{review.touristInitials || '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={s.nameRow}>
            <Text style={s.touristName}>{review.touristName}</Text>
            {review.countryFlag ? <Text style={s.flag}>{review.countryFlag}</Text> : null}
            {review.country ? <Text style={s.country}>{review.country}</Text> : null}
          </View>
          <View style={s.ratingRow}>
            <StarRow rating={review.rating} />
            <Text style={s.dateText}>{date}</Text>
          </View>
        </View>
      </View>

      {/* Workshop */}
      {review.workshopName ? (
        <Text style={s.workshopName}>{review.workshopName}</Text>
      ) : null}

      {/* Review text */}
      <Text style={s.reviewText}>{review.text}</Text>

      {/* Photos */}
      {review.photos && review.photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          {review.photos.map((p, i) => (
            <Image key={i} source={{ uri: p.url }} style={s.photo} />
          ))}
        </ScrollView>
      )}

      {/* Helpful */}
      <View style={s.helpfulRow}>
        <ThumbsUp size={12} color="#9CA3AF" />
        <Text style={s.helpfulText}>{review.helpful || 0} found helpful</Text>
        {review.edited && <Text style={s.editedBadge}> · Edited</Text>}
      </View>

      {/* Artisan reply */}
      {review.artisanReply ? (
        <View style={s.replyBox}>
          <View style={s.replyHeader}>
            <MessageCircle size={12} color="#2F5D50" />
            <Text style={s.replyLabel}>Your Reply</Text>
            <Text style={s.replyDate}>
              {new Date(review.artisanReply.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
          <Text style={s.replyText}>{review.artisanReply.text}</Text>
        </View>
      ) : (
        <>
          <TouchableOpacity
            style={s.replyToggle}
            onPress={() => setShowReplyForm(v => !v)}
            activeOpacity={0.7}
          >
            <MessageCircle size={14} color="#2F5D50" />
            <Text style={s.replyToggleText}>
              {showReplyForm ? 'Cancel Reply' : 'Reply to Review'}
            </Text>
            {showReplyForm ? (
              <ChevronUp size={14} color="#2F5D50" />
            ) : (
              <ChevronDown size={14} color="#2F5D50" />
            )}
          </TouchableOpacity>
          {showReplyForm && (
            <ReplyForm
              onSubmit={async (text) => {
                await onReply(reviewId, text);
                setShowReplyForm(false);
              }}
              onCancel={() => setShowReplyForm(false)}
            />
          )}
        </>
      )}
    </View>
  );
}

export default function ArtistReviewsScreen() {
  const { artist } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<{ totalReviews: number; overallRating: number; ratingDistribution: any[] } | null>(null);
  const [aiSummary, setAiSummary] = useState<AiReviewSummary | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const [showSort, setShowSort] = useState(false);

  const load = useCallback(async () => {
    if (!artist?.fullName) return;
    try {
      const data = await reviewApi.getArtistReviews(artist.fullName, sortBy);
      const fetchedReviews: Review[] = data.reviews || [];
      setReviews(fetchedReviews);
      setStats(data.stats || null);

      if (fetchedReviews.length > 0) {
        setLoadingAi(true);
        setAiSummary(null);
        aiApi
          .summarizeArtistReviews({
            artisanName: artist.fullName,
            reviews: fetchedReviews.map(r => ({ rating: r.rating, text: r.text })),
          })
          .then(summary => setAiSummary(summary))
          .catch(() => setAiSummary(null))
          .finally(() => setLoadingAi(false));
      } else {
        setAiSummary(null);
        setLoadingAi(false);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [artist?.fullName, sortBy]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const handleReply = async (reviewId: string, text: string) => {
    try {
      const updated = await reviewApi.reply(reviewId, text, artist?.fullName);
      setReviews(prev =>
        prev.map(r =>
          (r._id || r.id) === reviewId ? { ...r, artisanReply: updated.artisanReply } : r
        )
      );
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to post reply.');
      throw err;
    }
  };

  const overallRating = stats?.overallRating || 0;
  const totalReviews = stats?.totalReviews || 0;
  const dist = stats?.ratingDistribution || [];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <BatikBackground>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>My Reviews</Text>
          <TouchableOpacity
            style={s.sortBtn}
            onPress={() => setShowSort(v => !v)}
            activeOpacity={0.7}
          >
            <Text style={s.sortBtnText}>
              {SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Sort'}
            </Text>
            {showSort ? <ChevronUp size={14} color="#2F5D50" /> : <ChevronDown size={14} color="#2F5D50" />}
          </TouchableOpacity>
        </View>

        {/* Sort dropdown */}
        {showSort && (
          <View style={s.sortDropdown}>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[s.sortOption, sortBy === opt.value && s.sortOptionActive]}
                onPress={() => { setSortBy(opt.value as any); setShowSort(false); }}
              >
                <Text style={[s.sortOptionText, sortBy === opt.value && s.sortOptionTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color="#2F5D50" />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); load(); }}
                colors={['#2F5D50']}
              />
            }
          >
            {/* Stats card */}
            {totalReviews > 0 && (
              <View style={s.statsCard}>
                <View style={s.statsLeft}>
                  <Text style={s.bigRating}>{overallRating.toFixed(1)}</Text>
                  <StarRow rating={Math.round(overallRating)} size={16} />
                  <Text style={s.totalReviews}>{totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</Text>
                </View>
                <View style={s.statsRight}>
                  {[5, 4, 3, 2, 1].map(stars => {
                    const found = dist.find((d: any) => d.stars === stars);
                    return (
                      <RatingBar
                        key={stars}
                        stars={stars}
                        count={found?.count || 0}
                        total={totalReviews}
                      />
                    );
                  })}
                </View>
              </View>
            )}

            {/* AI Summary */}
            {(totalReviews > 0 || loadingAi) && (
              <AISummaryCard
                loading={loadingAi}
                data={aiSummary}
                totalReviews={totalReviews}
              />
            )}

            {/* Reviews list */}
            {reviews.length === 0 ? (
              <View style={s.empty}>
                <Star size={52} color="#D1D5DB" fill="transparent" />
                <Text style={s.emptyTitle}>No reviews yet</Text>
                <Text style={s.emptySub}>
                  Reviews from tourists will appear here once they visit your workshops.
                </Text>
              </View>
            ) : (
              reviews.map(r => {
                const id = r._id || r.id || '';
                return (
                  <ReviewCard
                    key={id}
                    review={r}
                    onReply={handleReply}
                  />
                );
              })
            )}
          </ScrollView>
        )}
      </BatikBackground>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ddede7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1E1E1E' },
  sortBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB',
  },
  sortBtnText: { fontSize: 12, fontWeight: '700', color: '#2F5D50' },
  sortDropdown: {
    marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden', marginBottom: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  sortOption: { paddingHorizontal: 16, paddingVertical: 12 },
  sortOptionActive: { backgroundColor: '#E8F5E9' },
  sortOptionText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  sortOptionTextActive: { color: '#2F5D50', fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  statsCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18,
    flexDirection: 'row', gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  statsLeft: { alignItems: 'center', justifyContent: 'center', width: 80 },
  bigRating: { fontSize: 40, fontWeight: '900', color: '#1E1E1E', lineHeight: 44 },
  totalReviews: { fontSize: 11, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },
  statsRight: { flex: 1, justifyContent: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  touristName: { fontSize: 14, fontWeight: '700', color: '#1E1E1E' },
  flag: { fontSize: 14 },
  country: { fontSize: 11, color: '#9CA3AF' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  dateText: { fontSize: 11, color: '#9CA3AF' },
  workshopName: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6 },
  reviewText: { fontSize: 14, color: '#4B5563', lineHeight: 21, marginBottom: 10 },
  photo: { width: 72, height: 72, borderRadius: 10, marginRight: 8, backgroundColor: '#F3F4F6' },
  helpfulRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  helpfulText: { fontSize: 11, color: '#9CA3AF' },
  editedBadge: { fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' },
  replyBox: {
    backgroundColor: '#F0FDF4', borderLeftWidth: 3, borderLeftColor: '#2F5D50',
    borderRadius: 10, padding: 10, marginTop: 4,
  },
  replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  replyLabel: { fontSize: 12, fontWeight: '700', color: '#2F5D50', flex: 1 },
  replyDate: { fontSize: 10, color: '#9CA3AF' },
  replyText: { fontSize: 13, color: '#374151', lineHeight: 19 },
  replyToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, marginTop: 4,
  },
  replyToggleText: { fontSize: 13, fontWeight: '600', color: '#2F5D50', flex: 1 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1E1E1E', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },
});
