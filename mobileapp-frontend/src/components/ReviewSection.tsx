import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Star,
  Camera,
  Send,
  Edit2,
  Trash2,
  MessageCircle,
  ThumbsUp,
  X,
  CheckCircle2,
} from 'lucide-react-native';
import { reviewApi, Review, ReviewStats } from '../services/reviewApi';
import { useAuth } from '../context/AuthContext';
import { aiApi, AiReviewSummary } from '../services/aiApi';
import { AISummaryCard } from './AISummaryCard';

// ── Types ──────────────────────────────────────────────────────
interface ReviewSectionProps {
  context: 'workshop' | 'artisan';
  artisanName?: string;
  workshopName?: string;
}

const STAR_COLOR = '#C9A227';
const FOREST_COLOR = '#2F5D50';

// ── Star Display ───────────────────────────────────────────────
function StarDisplay({
  rating,
  size = 16
}: { rating: number; size?: number; }) {
  return (
    <View style={styles.starDisplay}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          color={s <= rating ? STAR_COLOR : '#E5E7EB'}
          fill={s <= rating ? STAR_COLOR : '#E5E7EB'}
        />
      ))}
    </View>
  );
}

// ── Interactive Star Selector ──────────────────────────────────
function StarSelector({
  value,
  onChange
}: { value: number; onChange: (v: number) => void; }) {
  return (
    <View style={styles.starSelector}>
      {[1, 2, 3, 4, 5].map((s) => (
        <TouchableOpacity
          key={s}
          onPress={() => onChange(s)}
          style={styles.starButton}
        >
          <Star
            size={28}
            color={s <= value ? STAR_COLOR : '#D1D5DB'}
            fill={s <= value ? STAR_COLOR : '#D1D5DB'}
          />
        </TouchableOpacity>
      ))}
      {value > 0 && (
        <Text style={styles.starValueLabel}>
          {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][value]}
        </Text>
      )}
    </View>
  );
}

// ── Add Review Form ────────────────────────────────────────────
function AddReviewForm({
  onSubmit,
  workshopName
}: { onSubmit: (r: any) => Promise<void>; workshopName?: string }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0 || !text.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        rating,
        text,
        workshopName,
        photos: [] // Mobile version will handle photos later if needed
      });
      setSubmitted(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.successCard}>
        <View style={styles.successIconBox}>
          <CheckCircle2 size={24} color="#166534" />
        </View>
        <Text style={styles.successTitle}>Review Submitted!</Text>
        <Text style={styles.successSubtitle}>Thank you for sharing your experience.</Text>
      </View>
    );
  }

  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>Share Your Experience</Text>
      <Text style={styles.formSubtitle}>Help other travelers by reviewing this workshop</Text>

      <View style={styles.formGroup}>
        <Text style={styles.fieldLabel}>Your Rating</Text>
        <StarSelector value={rating} onChange={setRating} />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.fieldLabel}>Your Review</Text>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Describe your experience..."
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />
      </View>

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={rating === 0 || !text.trim() || isSubmitting}
        style={[
          styles.submitButton,
          (rating === 0 || !text.trim() || isSubmitting) && { opacity: 0.4 }
        ]}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Review</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ── Single Review Card ─────────────────────────────────────────
function ReviewCard({
  review,
  onDelete,
  onReply,
  isLoggedIn,
  canReply
}: {
  review: Review;
  onDelete: (id: string) => void;
  onReply: (id: string, text: string) => Promise<void>;
  isLoggedIn: boolean;
  canReply: boolean;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [helpful, setHelpful] = useState(review.helpful || 0);
  const [markedHelpful, setMarkedHelpful] = useState(false);

  const handleHelpful = async () => {
    if (markedHelpful || !isLoggedIn) return;
    try {
      await reviewApi.markHelpful(review._id);
      setHelpful(h => h + 1);
      setMarkedHelpful(true);
    } catch { }
  };

  const handleReply = () => {
    if (!replyText.trim()) return;
    onReply(review._id, replyText);
    setReplyText('');
    setShowReplyForm(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(review._id) }
      ]
    );
  };


  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerInfo}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: review.touristColor || FOREST_COLOR }
            ]}
          >
            <Text style={styles.avatarText}>{review.touristInitials}</Text>
          </View>
          <View>
            <View style={styles.nameRow}>
              <Text style={styles.reviewerName}>{review.touristName}</Text>
              <Text style={styles.countryFlag}>{review.countryFlag}</Text>
              <Text style={styles.countryName}>{review.country}</Text>
            </View>
            <View style={styles.ratingRow}>
              <StarDisplay rating={review.rating} size={12} />
              <Text style={styles.reviewDate}>{new Date(review.datePosted).toLocaleDateString()}</Text>
            </View>
          </View>
        </View>

        {review.isOwn && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <Trash2 size={16} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.reviewText}>{review.text}</Text>

      {review.photos && review.photos.length > 0 && (
        <View style={styles.photoContainer}>
          {review.photos.map((photo, i) => (
            <Image key={i} source={{ uri: photo.url }} style={styles.reviewPhoto} />
          ))}
        </View>
      )}

      <View style={styles.reviewFooter}>
        <TouchableOpacity
          onPress={handleHelpful}
          style={styles.helpfulBtn}
        >
          <ThumbsUp
            size={14}
            color={markedHelpful ? FOREST_COLOR : '#9CA3AF'}
            fill={markedHelpful ? FOREST_COLOR : 'transparent'}
          />
          <Text
            style={[
              styles.footerText,
              markedHelpful && { color: FOREST_COLOR }
            ]}
          >
            Helpful ({helpful})
          </Text>
        </TouchableOpacity>

        {canReply && !review.artisanReply && (
          <TouchableOpacity
            onPress={() => setShowReplyForm(!showReplyForm)}
            style={styles.replyBtn}
          >
            <MessageCircle size={14} color="#9CA3AF" />
            <Text style={styles.footerText}>Reply</Text>
          </TouchableOpacity>
        )}
      </View>

      {showReplyForm && (
        <View style={styles.replyForm}>
          <TextInput
            value={replyText}
            onChangeText={setReplyText}
            placeholder="Write your reply..."
            multiline
            style={styles.replyInput}
          />
          <View style={styles.replyActions}>
            <TouchableOpacity onPress={() => setShowReplyForm(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleReply} style={styles.postReplyBtn}>
              <Text style={styles.postReplyText}>Post Reply</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {review.artisanReply && (
        <View style={styles.artisanReply}>
          <View style={styles.replyHeader}>
            <Text style={styles.artisanReplyLabel}>Artisan Reply</Text>
            <Text style={styles.reviewDate}>{new Date(review.artisanReply.date).toLocaleDateString()}</Text>
          </View>
          <Text style={styles.artisanReplyText}>{review.artisanReply.text}</Text>
        </View>
      )}
    </View>
  );
}

// ── Main ReviewSection ─────────────────────────────────────────
export function ReviewSection({
  context,
  artisanName,
  workshopName
}: ReviewSectionProps) {
  const { tourist, artist, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<AiReviewSummary | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');

  useEffect(() => {
    fetchReviews();
  }, [context, artisanName, workshopName, sortBy]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setAiSummary(null);
      const data = await reviewApi.getReviews({
        context,
        artisanName: artisanName || '',
        workshopName: workshopName || '',
        sortBy
      });
      setReviews(data.reviews || []);
      setStats(data.stats || null);

      if (data.reviews && data.reviews.length > 0) {
        try {
          setLoadingAi(true);
          const summaryData = await aiApi.summarizeArtistReviews({
            artisanName: artisanName || 'this artisan',
            reviews: data.reviews.map((r: Review) => ({ rating: r.rating, text: r.text }))
          });
          setAiSummary(summaryData);
        } catch (err) {
          console.error('Failed to fetch AI summary:', err);
        } finally {
          setLoadingAi(false);
        }
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewReview = async (body: any) => {
    try {
      const newReview = await reviewApi.createReview({ ...body, context, artisanName });
      setReviews(prev => [newReview, ...prev]);
    } catch (err) {
      console.error('Failed to create review:', err);
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await reviewApi.deleteReview(id);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      Alert.alert('Error', 'Failed to delete review');
    }
  };

  const handleReply = async (id: string, text: string) => {
    try {
      const updated = await reviewApi.reply(id, text);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, artisanReply: updated.artisanReply } : r));
    } catch (err) {
      Alert.alert('Error', 'Failed to post reply. Only the assigned artisan can reply.');
    }
  };

  const isTourist = !!tourist;
  const isArtist = !!artist;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {context === 'artisan' ? `Reviews for ${artisanName || 'this Artisan'}` : 'Workshop Reviews'}
        </Text>
        <Text style={styles.subtitle}>Authentic feedback from our community</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.ratingCard}>
          <Text style={styles.overallRating}>{stats?.overallRating?.toFixed(1) || '0.0'}</Text>
          <StarDisplay rating={Math.round(stats?.overallRating || 0)} size={20} />
          <Text style={styles.totalReviews}>{stats?.totalReviews || 0} reviews</Text>
        </View>
        <View style={styles.aiCardWrapper}>
          <AISummaryCard
            loading={loading || loadingAi}
            data={aiSummary}
            totalReviews={stats?.totalReviews || 0}
          />
        </View>
      </View>

      {isTourist && <AddReviewForm onSubmit={handleNewReview} workshopName={workshopName} />}

      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator size="large" color={FOREST_COLOR} style={{ marginVertical: 40 }} />
        ) : reviews.length > 0 ? (
          reviews.map(review => (
            <ReviewCard
              key={review._id}
              review={review}
              onDelete={handleDelete}
              onReply={handleReply}
              isLoggedIn={isAuthenticated}
              canReply={isArtist}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No reviews yet. Be the first to share your experience!</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 24 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: FOREST_COLOR, marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#6B7280' },
  statsGrid: { gap: 16, marginBottom: 24 },
  ratingCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  overallRating: { fontSize: 48, fontWeight: '900', color: FOREST_COLOR },
  starDisplay: { flexDirection: 'row', gap: 2, marginVertical: 4 },
  totalReviews: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  aiCardWrapper: { flex: 1 },

  formCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 24 },
  formTitle: { fontSize: 18, fontWeight: '800', color: FOREST_COLOR, marginBottom: 4 },
  formSubtitle: { fontSize: 13, color: '#9CA3AF', marginBottom: 20 },
  formGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 },
  starSelector: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  starButton: { padding: 2 },
  starValueLabel: { marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#4B5563' },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: STAR_COLOR,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  successCard: { backgroundColor: '#F0FDF4', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#DCFCE7', marginBottom: 24 },
  successIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  successTitle: { fontSize: 16, fontWeight: '800', color: '#166534', marginBottom: 4 },
  successSubtitle: { fontSize: 14, color: '#15803D' },

  reviewCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 16 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  reviewerInfo: { flexDirection: 'row', gap: 12, flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reviewerName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  countryFlag: { fontSize: 14, marginHorizontal: 2 },
  countryName: { fontSize: 12, color: '#9CA3AF' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  reviewDate: { fontSize: 11, color: '#9CA3AF' },
  deleteBtn: { padding: 4 },
  reviewText: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 12 },
  photoContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  reviewPhoto: { width: 70, height: 70, borderRadius: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  reviewFooter: { flexDirection: 'row', alignItems: 'center', gap: 16, borderTopWidth: 1, borderTopColor: '#F9FAFB', paddingTop: 12 },
  helpfulBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  replyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 'auto' },
  footerText: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },

  replyForm: { marginTop: 12, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12 },
  replyInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 8, fontSize: 13, minHeight: 60, textAlignVertical: 'top' },
  replyActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 8 },
  cancelText: { fontSize: 12, fontWeight: '700', color: '#9CA3AF' },
  postReplyBtn: { backgroundColor: FOREST_COLOR, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  postReplyText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  artisanReply: { marginTop: 12, marginLeft: 12, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: '#E5E7EB' },
  artisanReplyLabel: { fontSize: 12, fontWeight: '800', color: FOREST_COLOR },
  artisanReplyText: { fontSize: 13, color: '#4B5563', marginTop: 2 },

  emptyState: { paddingVertical: 40, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed', borderRadius: 20 },
  emptyText: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' },
  listContainer: { marginTop: 8 },
  replyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
});


