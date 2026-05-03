import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  StarIcon,
  SparklesIcon,
  CameraIcon,
  SendIcon,
  EditIcon,
  Trash2Icon,
  MessageCircleIcon,
  ThumbsUpIcon,
  XIcon,
  CheckIcon,
  BotIcon
} from
  'lucide-react';
import { reviewApi, Review, ReviewStats } from '../services/reviewApi';
import { useAuth } from '../context/AuthContext';
import { aiApi, AiReviewSummary } from '../services/aiApi';

// ── Types ──────────────────────────────────────────────────────
interface ReviewSectionProps {
  context: 'workshop' | 'artisan';
  artisanName?: string;
  workshopName?: string;
}

// ── Star Display ───────────────────────────────────────────────
function StarDisplay({
  rating,
  size = 'md'
}: { rating: number; size?: 'sm' | 'md' | 'lg'; }) {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  };
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) =>
        <StarIcon
          key={s}
          className={`${sizes[size]} transition-colors`}
          style={{
            color: s <= rating ? '#C9A227' : '#E5E7EB',
            fill: s <= rating ? '#C9A227' : '#E5E7EB'
          }} />
      )}
    </div>);
}

// ── Interactive Star Selector ──────────────────────────────────
function StarSelector({
  value,
  onChange
}: { value: number; onChange: (v: number) => void; }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) =>
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110 active:scale-95">
          <StarIcon
            className="w-7 h-7 transition-colors"
            style={{
              color: s <= (hovered || value) ? '#C9A227' : '#D1D5DB',
              fill: s <= (hovered || value) ? '#C9A227' : '#D1D5DB'
            }} />
        </button>
      )}
      {value > 0 &&
        <span className="ml-2 text-sm font-semibold text-gray-600">
          {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][value]}
        </span>
      }
    </div>);
}

// ── AI Summary Card ────────────────────────────────────────────
function AISummaryCard({ 
  loading = false, 
  stats, 
  artisanName, 
  aiSummaryData,
  hasReviews = false
}: { 
  loading?: boolean; 
  stats?: ReviewStats | null; 
  artisanName?: string; 
  aiSummaryData?: AiReviewSummary | null;
  hasReviews?: boolean;
}) {
  const total = stats?.totalReviews || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-2xl overflow-hidden border border-forest/20 bg-gradient-to-br from-forest/5 via-white to-mustard/5 p-6">

      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="ai-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1.5" fill="#2F5D50" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ai-pattern)" />
        </svg>
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-forest flex items-center justify-center">
            <BotIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-forest font-display">
              AI Summary of Visitor Feedback
            </h3>
            <p className="text-xs text-gray-400">
              Generated from {total} reviews
            </p>
          </div>
          <span className="ml-auto flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-forest/10 text-forest">
            <SparklesIcon className="w-3 h-3" /> AI Powered
          </span>
        </div>

        {loading ? (
          <div className="space-y-2.5">
            {[100, 90, 75].map((w, i) =>
              <div key={i} className="h-3 bg-gray-200 rounded-full animate-pulse" style={{ width: `${w}%` }} />
            )}
          </div>
        ) : aiSummaryData ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {aiSummaryData.summary}
            </p>
            {aiSummaryData.highlights && aiSummaryData.highlights.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {aiSummaryData.highlights.map((h, i) => (
                  <span key={i} className="px-2 py-1 text-xs bg-forest/10 text-forest rounded-full">
                    ✓ {h}
                  </span>
                ))}
              </div>
            )}
            {aiSummaryData.cautions && aiSummaryData.cautions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {aiSummaryData.cautions.map((c, i) => (
                  <span key={i} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded-full">
                    ⚠ {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : !hasReviews ? (
          <p className="text-sm text-gray-400 italic leading-relaxed">
            Not enough reviews yet to generate an AI summary. Be the first to share your experience below!
          </p>
        ) : (
          <p className="text-sm text-gray-600 leading-relaxed">
            Visitors consistently highlight the <strong className="text-forest">authentic techniques</strong>
            and hands-on learning experience. {artisanName || 'This artisan'} is praised for their patient
            guidance and deep cultural heritage. Most reviewers recommend this experience for those
            seeking a genuine connection to Sri Lankan craft traditions.
          </p>
        )}
      </div>
    </motion.div>);
}

// ── Add Review Form ────────────────────────────────────────────
function AddReviewForm({
  onSubmit,
  workshopName
}: { onSubmit: (r: any) => Promise<void>; workshopName?: string }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !text.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        rating,
        text,
        workshopName,
        photos: photos.map(url => ({ url, alt: 'Review Photo' }))
      });
      setSubmitted(true);
    } catch (err) {
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckIcon className="w-6 h-6 text-green-600" />
        </div>
        <h4 className="font-bold text-green-800 font-display mb-1">Review Submitted!</h4>
        <p className="text-sm text-green-600">Thank you for sharing your experience.</p>
      </motion.div>);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-lg font-bold text-forest font-display mb-1">Share Your Experience</h3>
      <p className="text-sm text-gray-400 mb-5">Help other travelers by reviewing this workshop</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Your Rating</label>
          <StarSelector value={rating} onChange={setRating} />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Your Review</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Describe your experience..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-mustard focus:border-transparent outline-none text-sm resize-none transition-shadow" />
        </div>

        <button
          type="submit"
          disabled={rating === 0 || !text.trim() || isSubmitting}
          className="w-full py-3 rounded-xl font-bold text-sm text-forest flex items-center justify-center gap-2 transition-all disabled:opacity-40"
          style={{ backgroundColor: '#C9A227' }}>
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>);
}

// ── Single Review Card ─────────────────────────────────────────
function ReviewCard({
  review,
  onEdit,
  onDelete,
  onReply,
  showWorkshop,
  isLoggedIn,
  canReply
}: {
  review: Review;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onReply: (id: string, text: string) => Promise<void>;
  showWorkshop: boolean;
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
      await reviewApi.markHelpful(review.id);
      setHelpful(h => h + 1);
      setMarkedHelpful(true);
    } catch { }
  };

  const handleReply = () => {
    if (!replyText.trim()) return;
    onReply(review.id, replyText);
    setReplyText('');
    setShowReplyForm(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ backgroundColor: review.touristColor || '#2F5D50' }}>
            {review.touristInitials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm">{review.touristName}</span>
              <span className="text-sm">{review.countryFlag}</span>
              <span className="text-xs text-gray-400">{review.country}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <StarDisplay rating={review.rating} size="sm" />
              <span className="text-xs text-gray-400">{new Date(review.datePosted).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {review.isOwn && (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onEdit(review.id)} className="p-1.5 text-gray-400 hover:text-forest rounded-lg"><EditIcon className="w-3.5 h-3.5" /></button>
            <button onClick={() => onDelete(review.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg"><Trash2Icon className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-600 leading-relaxed mb-4">{review.text}</p>

      {review.photos && review.photos.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {review.photos.map((photo, i) => (
            <img key={i} src={photo.url} alt={photo.alt} className="w-20 h-20 rounded-xl object-cover border border-gray-100" />
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
        <button
          onClick={handleHelpful}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${markedHelpful ? 'text-forest' : 'text-gray-400 hover:text-forest'}`}>
          <ThumbsUpIcon className={`w-3.5 h-3.5 ${markedHelpful ? 'fill-forest' : ''}`} />
          Helpful ({helpful})
        </button>

        {canReply && !review.artisanReply && (
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-forest transition-colors ml-auto"
          >
            <MessageCircleIcon className="w-3.5 h-3.5" />
            Reply
          </button>
        )}
      </div>

      <AnimatePresence>
        {showReplyForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 overflow-hidden"
          >
            <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your reply..."
                className="w-full p-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-forest"
                rows={2}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowReplyForm(false)}
                  className="px-3 py-1 text-xs font-bold text-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReply}
                  className="px-3 py-1 text-xs font-bold bg-forest text-white rounded-lg"
                >
                  Post Reply
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {
        review.artisanReply && (
          <div className="mt-4 ml-4 pl-4 border-l-2 border-forest/20">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-forest">Artisan Reply</span>
              <span className="text-xs text-gray-400">{new Date(review.artisanReply.date).toLocaleDateString()}</span>
            </div>
            <p className="text-sm text-gray-600">{review.artisanReply.text}</p>
          </div>
        )
      }
    </motion.div >
  );
}

// ── Main ReviewSection ─────────────────────────────────────────
export function ReviewSection({
  context,
  artisanName,
  workshopName
}: ReviewSectionProps) {
  const { firebaseUser, tourist, artist } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<AiReviewSummary | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setAiSummary(null); // Clear previous summary immediately
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
              reviews: (data.reviews as Review[]).map((r: Review) => ({ rating: r.rating, text: r.text }))
            });
            setAiSummary(summaryData);
          } catch (err) {
            console.error('Failed to fetch AI summary:', err);
          } finally {
            setLoadingAi(false);
          }
        } else {
          setAiSummary(null);
        }
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [context, artisanName, workshopName, sortBy]);

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
    if (window.confirm('Delete this review?')) {
      try {
        await reviewApi.deleteReview(id);
        setReviews(prev => prev.filter(r => r.id !== id));
      } catch (err) {
        alert('Failed to delete review');
      }
    }
  };

  const handleReply = async (id: string, text: string) => {
    try {
      const updated = await reviewApi.reply(id, text);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, artisanReply: updated.artisanReply } : r));
    } catch (err) {
      alert('Failed to post reply. Only the assigned artisan can reply.');
    }
  };

  const isTourist = !!tourist;
  const isArtist = !!artist;

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-forest mb-2 font-display">
          {context === 'artisan' ? `Reviews for ${artisanName || 'this Artisan'}` : 'Workshop Reviews'}
        </h2>
        <p className="text-gray-500 text-sm">Authentic feedback from our community</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center justify-center text-center">
          <span className="text-6xl font-black text-forest font-display">{stats?.overallRating?.toFixed(1) || '0.0'}</span>
          <StarDisplay rating={Math.round(stats?.overallRating || 0)} size="lg" />
          <p className="text-sm text-gray-400 mt-2">{stats?.totalReviews || 0} reviews</p>
        </div>
        <div className="md:col-span-2">
          <AISummaryCard 
            loading={loading || loadingAi} 
            stats={stats} 
            artisanName={artisanName} 
            aiSummaryData={aiSummary} 
            hasReviews={reviews.length > 0}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm font-bold text-gray-600 bg-white border border-gray-100 rounded-lg px-3 py-2 outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>
      </div>

      {isTourist && <AddReviewForm onSubmit={handleNewReview} workshopName={workshopName} />}

      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-gray-400">Loading reviews...</div>
        ) : reviews.length > 0 ? (
          reviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              onEdit={() => { }}
              onDelete={handleDelete}
              onReply={handleReply}
              showWorkshop={context === 'artisan'}
              isLoggedIn={!!firebaseUser}
              canReply={isArtist}
            />
          ))
        ) : (
          <div className="py-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-2xl">
            No reviews yet. Be the first to share your experience!
          </div>
        )}
      </div>
    </section>
  );
}