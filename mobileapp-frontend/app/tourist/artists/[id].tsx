import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Alert, Dimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/context/AuthContext';
import { getArtistById, getPublicCrafts } from '../../../src/services/api';
import { reviewApi, Review } from '../../../src/services/reviewApi';
import { aiApi, AiReviewSummary } from '../../../src/services/aiApi';
import { BatikBackground } from '../../../src/components/BatikBackground';
import { Star, MapPin, Calendar, ArrowLeft, ShoppingBag, MessageCircle, ThumbsUp, Plus, Bot, Sparkles } from 'lucide-react-native';

const STAR_COLOR = '#C9A227';

function StarRow({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} size={size} color={STAR_COLOR} fill={n <= rating ? STAR_COLOR : 'transparent'} />
      ))}
    </View>
  );
}

function AISummaryCard({
  loading,
  data,
  totalReviews,
}: {
  loading: boolean;
  data: AiReviewSummary | null;
  totalReviews: number;
}) {
  return (
    <View style={ai.card}>
      <View style={ai.header}>
        <View style={ai.iconBox}>
          <Bot size={16} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ai.title}>AI Summary of Visitor Feedback</Text>
          <Text style={ai.subtitle}>Generated from {totalReviews} review{totalReviews !== 1 ? 's' : ''}</Text>
        </View>
        <View style={ai.badge}>
          <Sparkles size={11} color="#2F5D50" />
          <Text style={ai.badgeText}>AI</Text>
        </View>
      </View>

      {loading ? (
        <View style={ai.skeleton}>
          {[100, 88, 70].map((w, i) => (
            <View key={i} style={[ai.skeletonLine, { width: `${w}%` as any }]} />
          ))}
        </View>
      ) : data ? (
        <View>
          <Text style={ai.summary}>{data.summary}</Text>
          {data.highlights && data.highlights.length > 0 && (
            <View style={ai.tagRow}>
              {data.highlights.map((h, i) => (
                <View key={i} style={ai.highlightTag}>
                  <Text style={ai.highlightText}>✓ {h}</Text>
                </View>
              ))}
            </View>
          )}
          {data.cautions && data.cautions.length > 0 && (
            <View style={ai.tagRow}>
              {data.cautions.map((c, i) => (
                <View key={i} style={ai.cautionTag}>
                  <Text style={ai.cautionText}>⚠ {c}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : (
        <Text style={ai.emptyText}>
          Not enough reviews yet to generate an AI summary. Be the first to share your experience!
        </Text>
      )}
    </View>
  );
}

const ai = StyleSheet.create({
  card: {
    backgroundColor: '#F0FDF4', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#BBF7D0', marginBottom: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  iconBox: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: '#2F5D50', alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 12, fontWeight: '700', color: '#2F5D50' },
  subtitle: { fontSize: 10, color: '#6B7280', marginTop: 1 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#DCFCE7', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#2F5D50' },
  summary: { fontSize: 13, color: '#374151', lineHeight: 20 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 7 },
  highlightTag: { backgroundColor: '#DCFCE7', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  highlightText: { fontSize: 10, color: '#166534', fontWeight: '600' },
  cautionTag: { backgroundColor: '#FEF2F2', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  cautionText: { fontSize: 10, color: '#DC2626', fontWeight: '600' },
  skeleton: { gap: 7 },
  skeletonLine: { height: 9, backgroundColor: '#D1FAE5', borderRadius: 5 },
  emptyText: { fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' },
});

const { width } = Dimensions.get('window');

export default function TouristArtistProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tourist } = useAuth();
  const router = useRouter();

  const [artist, setArtist] = useState<any>(null);
  const [crafts, setCrafts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<{ totalReviews: number; overallRating: number } | null>(null);
  const [aiSummary, setAiSummary] = useState<AiReviewSummary | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loading, setLoading] = useState(true);
  const [craftsLoading, setCraftsLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadArtist();
      loadCrafts();
    }
  }, [id]);

  useEffect(() => {
    if (artist?.fullName) loadReviews(artist.fullName);
  }, [artist?.fullName]);

  const loadArtist = async () => {
    try {
      setLoading(true);
      const res = await getArtistById(id as string);
      const artistData = res.data?.artist || res.data;
      setArtist(artistData);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to load artist profile');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadCrafts = async () => {
    try {
      setCraftsLoading(true);
      const res = await getPublicCrafts(1, 50, undefined, undefined, id as string);
      setCrafts(res.data?.crafts || []);
    } catch (err) {
      console.error('Failed to load crafts:', err);
    } finally {
      setCraftsLoading(false);
    }
  };

  const loadReviews = async (artisanName: string) => {
    try {
      setReviewsLoading(true);
      const data = await reviewApi.getArtistReviews(artisanName, 'newest');
      const fetchedReviews: Review[] = data.reviews || [];
      setReviews(fetchedReviews);
      setReviewStats(data.stats || null);

      if (fetchedReviews.length > 0) {
        setLoadingAi(true);
        setAiSummary(null);
        aiApi
          .summarizeArtistReviews({
            artisanName,
            reviews: fetchedReviews.map(r => ({ rating: r.rating, text: r.text })),
          })
          .then(summary => setAiSummary(summary))
          .catch(() => setAiSummary(null))
          .finally(() => setLoadingAi(false));
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleBookWorkshop = () => {
    // Navigate to book workshop with artist preselected
    router.push({
      pathname: '/tourist/bookings/book-workshop',
      params: { artistId: artist._id, artistName: artist.fullName, craftType: artist.craftType }
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <BatikBackground />
        <View style={s.center}>
          <ActivityIndicator size="large" color="#2F5D50" />
        </View>
      </SafeAreaView>
    );
  }

  if (!artist) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <BatikBackground />
        <View style={s.center}>
          <Text style={s.errorText}>Artist not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.backLink}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

   return (
     <SafeAreaView style={s.safe} edges={['top']}>
       <BatikBackground />
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#2F5D50" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Artisan Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        {/* Cover & Avatar */}
        <View style={s.coverSection}>
          <View style={s.cover} />
          <View style={s.avatarWrapper}>
            {artist.profilePicUrl ? (
              <Image source={{ uri: artist.profilePicUrl }} style={s.avatar} />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Text style={s.avatarText}>{artist.initials || 'A'}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Info Card */}
        <View style={s.card}>
          <Text style={s.name}>{artist.fullName || 'Unknown'}</Text>
          <Text style={s.handle}>@{artist.callingName || artist.fullName?.toLowerCase().replace(/\s+/g, '') || 'artist'}</Text>

          <View style={s.badgeRow}>
            <View style={s.badge}>
              <Text style={s.badgeText}>{artist.craftType || 'Craft Artist'}</Text>
            </View>
          </View>

          {artist.bio ? <Text style={s.bio}>{artist.bio}</Text> : null}

          <View style={s.divider} />

          {/* Stats */}
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statValue}>★ {artist.rating?.toFixed(1) || '0.0'}</Text>
              <Text style={s.statLabel}>Rating</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statValue}>{artist.reviewCount || 0}</Text>
              <Text style={s.statLabel}>Reviews</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statValue}>{artist.workshopsConducted || 0}</Text>
              <Text style={s.statLabel}>Workshops</Text>
            </View>
          </View>

          <View style={s.divider} />

          {/* Location */}
          <View style={s.detailRow}>
            <MapPin size={16} color="#9CA3AF" />
            <Text style={s.detailText}>
              {[artist.address?.city, artist.address?.district, artist.address?.province].filter(Boolean).join(', ') || 'Location not specified'}
            </Text>
          </View>

          {/* Contact Info */}
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Email</Text>
            <Text style={s.detailValue}>{artist.email || 'Not provided'}</Text>
          </View>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Phone</Text>
            <Text style={s.detailValue}>{artist.phone || 'Not provided'}</Text>
          </View>

          <TouchableOpacity style={s.bookBtn} onPress={handleBookWorkshop}>
            <Calendar size={18} color="#fff" />
            <Text style={s.bookBtnText}>Book a Workshop</Text>
          </TouchableOpacity>
        </View>

        {/* Crafts Section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Crafts by {artist.callingName?.split(' ')[0] || 'this Artisan'}</Text>
          {craftsLoading ? (
            <ActivityIndicator size="small" color="#2F5D50" style={{ marginTop: 20 }} />
          ) : crafts.length === 0 ? (
            <View style={s.emptyCrafts}>
              <ShoppingBag size={48} color="#D1D5DB" />
              <Text style={s.emptyCraftsText}>No crafts listed yet</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.craftsRow}>
              {crafts.map((craft: any) => (
                <TouchableOpacity key={craft._id} style={s.craftCard} onPress={() => router.push(`/tourist/crafts/${craft._id}`)}>
                  <Image source={{ uri: craft.images?.[0] || 'https://via.placeholder.com/150' }} style={s.craftImage} />
                  <View style={s.craftInfo}>
                    <Text style={s.craftName} numberOfLines={1}>{craft.name}</Text>
                    <Text style={s.craftPrice}>LKR {craft.price.toLocaleString()}</Text>
                    {craft.stock > 0 ? (
                      <Text style={s.craftStock}>In Stock</Text>
                    ) : (
                      <Text style={s.craftOut}>Out of Stock</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Reviews Section */}
        <View style={s.section}>
          <View style={s.reviewsSectionHeader}>
            <Text style={s.sectionTitle}>
              Reviews {reviewStats ? `(${reviewStats.totalReviews})` : ''}
            </Text>
            {tourist && (
              <TouchableOpacity
                style={s.writeReviewBtn}
                onPress={() =>
                  router.push({
                    pathname: '/tourist/reviews/create',
                    params: { artisanName: artist.fullName },
                  })
                }
              >
                <Plus size={14} color="#fff" />
                <Text style={s.writeReviewBtnText}>Write Review</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Overall rating summary */}
          {reviewStats && reviewStats.totalReviews > 0 && (
            <View style={s.ratingSummary}>
              <Text style={s.bigRating}>{reviewStats.overallRating.toFixed(1)}</Text>
              <View>
                <StarRow rating={Math.round(reviewStats.overallRating)} size={16} />
                <Text style={s.totalReviewsText}>{reviewStats.totalReviews} reviews</Text>
              </View>
            </View>
          )}

          {/* AI Summary */}
          {!reviewsLoading && (reviewStats?.totalReviews ?? 0) > 0 && (
            <AISummaryCard
              loading={loadingAi}
              data={aiSummary}
              totalReviews={reviewStats?.totalReviews ?? 0}
            />
          )}

          {reviewsLoading ? (
            <ActivityIndicator size="small" color="#2F5D50" style={{ marginTop: 16 }} />
          ) : reviews.length === 0 ? (
            <View style={s.emptyReviews}>
              <Star size={40} color="#D1D5DB" fill="transparent" />
              <Text style={s.emptyReviewsText}>No reviews yet</Text>
              {tourist && (
                <Text style={s.beFirstText}>Be the first to share your experience!</Text>
              )}
            </View>
          ) : (
            reviews.map(review => {
              const reviewId = review._id || review.id || '';
              const date = review.datePosted
                ? new Date(review.datePosted).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                : '';
              return (
                <View key={reviewId} style={s.reviewCard}>
                  {/* Tourist info */}
                  <View style={s.reviewTop}>
                    <View style={[s.reviewAvatar, { backgroundColor: review.touristColor || '#2F5D50' }]}>
                      <Text style={s.reviewAvatarText}>{review.touristInitials || '?'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={s.reviewNameRow}>
                        <Text style={s.reviewerName}>{review.touristName}</Text>
                        {review.countryFlag ? <Text style={{ fontSize: 13 }}>{review.countryFlag}</Text> : null}
                      </View>
                      <View style={s.reviewRatingRow}>
                        <StarRow rating={review.rating} />
                        <Text style={s.reviewDate}>{date}</Text>
                      </View>
                    </View>
                  </View>

                  <Text style={s.reviewText}>{review.text}</Text>

                  {/* Review photos */}
                  {review.photos && review.photos.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                      {review.photos.map((p, pi) => (
                        <Image key={pi} source={{ uri: p.url }} style={s.reviewPhoto} />
                      ))}
                    </ScrollView>
                  )}

                  {/* Helpful */}
                  <View style={s.reviewFooter}>
                    <ThumbsUp size={11} color="#9CA3AF" />
                    <Text style={s.reviewHelpful}>{review.helpful || 0} helpful</Text>
                  </View>

                  {/* Artisan reply */}
                  {review.artisanReply && (
                    <View style={s.artisanReplyBox}>
                      <View style={s.replyHeaderRow}>
                        <MessageCircle size={12} color="#2F5D50" />
                        <Text style={s.replyHeaderText}>Artisan Reply</Text>
                        <Text style={s.replyHeaderDate}>
                          {new Date(review.artisanReply.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                      </View>
                      <Text style={s.replyBodyText}>{review.artisanReply.text}</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F3EE' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
   errorText: { fontSize: 16, color: '#6B7280', marginBottom: 12 },
   backLink: { fontSize: 15, color: '#2F5D50', fontWeight: '600' },
   detailText: { fontSize: 14, color: '#4B5563', fontWeight: '500' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F6F3EE' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E1E1E' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  content: { paddingBottom: 40 },
  coverSection: { marginBottom: 0 },
  cover: { height: 120, backgroundColor: '#2F5D50', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  avatarWrapper: { marginTop: -60, marginLeft: 20, marginBottom: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#fff' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#2F5D50', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#fff' },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginHorizontal: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  name: { fontSize: 24, fontWeight: '800', color: '#1E1E1E', marginBottom: 2 },
  handle: { fontSize: 14, color: '#9CA3AF', marginBottom: 12 },
  badgeRow: { flexDirection: 'row', marginBottom: 12 },
  badge: { backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  badgeText: { fontSize: 13, fontWeight: '600', color: '#2F5D50' },
  bio: { fontSize: 15, color: '#4B5563', lineHeight: 22, marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4 },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#1E1E1E' },
  statLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#F3F4F6' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  detailLabel: { fontSize: 13, color: '#9CA3AF', width: 60 },
  detailValue: { fontSize: 14, color: '#1E1E1E', fontWeight: '500', flex: 1 },
  bookBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#C65D3B', borderRadius: 14, paddingVertical: 16, marginTop: 8 },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  section: { paddingHorizontal: 16, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#2F5D50', marginBottom: 12 },
  craftsRow: { flexDirection: 'row', gap: 12 },
  craftCard: { width: 150, backgroundColor: '#fff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  craftImage: { width: '100%', height: 100, borderRadius: 12, backgroundColor: '#F3F4F6', marginBottom: 8 },
  craftInfo: { gap: 4 },
  craftName: { fontSize: 14, fontWeight: '700', color: '#1E1E1E' },
  craftPrice: { fontSize: 14, fontWeight: '600', color: '#2F5D50' },
  craftStock: { fontSize: 11, color: '#166534' },
  craftOut: { fontSize: 11, color: '#DC2626' },
  emptyCrafts: { alignItems: 'center', paddingVertical: 40 },
  emptyCraftsText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  // Reviews
  reviewsSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  writeReviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#C65D3B', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  writeReviewBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  ratingSummary: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  bigRating: { fontSize: 40, fontWeight: '900', color: '#1E1E1E' },
  totalReviewsText: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  emptyReviews: { alignItems: 'center', paddingVertical: 32 },
  emptyReviewsText: { fontSize: 14, color: '#9CA3AF', marginTop: 10, fontWeight: '600' },
  beFirstText: { fontSize: 13, color: '#C9A227', marginTop: 4 },
  reviewCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  reviewTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  reviewAvatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  reviewNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reviewerName: { fontSize: 13, fontWeight: '700', color: '#1E1E1E' },
  reviewRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  reviewDate: { fontSize: 10, color: '#9CA3AF' },
  reviewText: { fontSize: 13, color: '#4B5563', lineHeight: 20, marginBottom: 8 },
  reviewPhoto: { width: 64, height: 64, borderRadius: 10, marginRight: 8, backgroundColor: '#F3F4F6' },
  reviewFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  reviewHelpful: { fontSize: 11, color: '#9CA3AF' },
  artisanReplyBox: { backgroundColor: '#F0FDF4', borderLeftWidth: 3, borderLeftColor: '#2F5D50', borderRadius: 10, padding: 10, marginTop: 6 },
  replyHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  replyHeaderText: { fontSize: 11, fontWeight: '700', color: '#2F5D50', flex: 1 },
  replyHeaderDate: { fontSize: 10, color: '#9CA3AF' },
  replyBodyText: { fontSize: 12, color: '#374151', lineHeight: 18 },
});
