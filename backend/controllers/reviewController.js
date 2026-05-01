import { Review } from '../models/Review.js';
import Tourist from '../models/Tourist.js';

const getActor = (req) => ({
  email: String(req.headers['x-user-email'] || req.user?.email || req.admin?.email || '')
    .trim()
    .toLowerCase(),
  role: String(req.headers['x-user-role'] || req.user?.role || req.admin?.role || '').trim().toLowerCase(),
  username: String(req.headers['x-username'] || req.user?.username || req.admin?.name || '')
    .trim()
    .toLowerCase(),
  artistName: String(req.headers['x-artist-name'] || '').trim()
});

const initialsFrom = (value) =>
  String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || 'U';

const displayNameFrom = ({ username, email }) => {
  if (username) return username;
  if (!email) return 'Tourist';
  return email.split('@')[0];
};

const parseIncomingRating = (body) => {
  const candidate = body?.rating ?? body?.stars ?? body?.score ?? body?.value;
  const n = Number(String(candidate ?? '').trim());
  if (Number.isFinite(n)) return Math.max(1, Math.min(5, n));
  return null;
};

const parseIncomingText = (body) => {
  const candidate =
    body?.text ??
    body?.reviewText ??
    body?.comment ??
    body?.content ??
    '';
  const text = String(candidate).trim();
  return text || null;
};

const isLongEnoughText = (value) => String(value || '').trim().length >= 3;

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const canEditByTime = (createdAt) =>
  Date.now() - new Date(createdAt).getTime() <= EDIT_WINDOW_MS;

const buildReviewQuery = (query) => {
  const filter = {};

  if (query.context === 'artisan' && query.artisanName) {
    filter.artisanName = query.artisanName;
  }
  if (query.context === 'workshop' && query.workshopName) {
    filter.workshopName = query.workshopName;
  }
  if (query.status && query.status !== 'all') {
    filter.status = query.status;
  } else if (query.includeHidden !== 'true') {
    filter.status = { $ne: 'removed' };
  }

  return filter;
};

const getSort = (sortBy) => {
  if (sortBy === 'highest') return { rating: -1, createdAt: -1 };
  if (sortBy === 'lowest') return { rating: 1, createdAt: -1 };
  return { createdAt: -1 };
};

const normalizeReview = (reviewDoc, actor = { email: '', role: '' }) => ({
  id: reviewDoc._id.toString(),
  authorEmail: reviewDoc.authorEmail,
  touristName: reviewDoc.touristName,
  touristInitials: reviewDoc.touristInitials,
  touristColor: reviewDoc.touristColor,
  country: reviewDoc.country,
  countryFlag: reviewDoc.countryFlag,
  artisanName: reviewDoc.artisanName,
  workshopName: reviewDoc.workshopName,
  rating: reviewDoc.rating,
  text: reviewDoc.text,
  photos: reviewDoc.photos,
  status: reviewDoc.status,
  flagReason: reviewDoc.flagReason,
  reportCount: reviewDoc.reportCount,
  helpful: reviewDoc.helpful,
  edited: reviewDoc.edited,
  isOwn: !!actor.email && reviewDoc.authorEmail === actor.email,
  canEdit: !!actor.email && reviewDoc.authorEmail === actor.email && canEditByTime(reviewDoc.createdAt),
  artisanReply: reviewDoc.artisanReply
    ? {
      text: reviewDoc.artisanReply.text,
      date: reviewDoc.artisanReply.date
    }
    : null,
  datePosted: reviewDoc.createdAt,
  createdAt: reviewDoc.createdAt,
  updatedAt: reviewDoc.updatedAt
});

export const getReviews = async (req, res) => {
  const actor = getActor(req);
  const filter = buildReviewQuery(req.query);
  if (req.query.mine === 'true' && actor.email) {
    filter.authorEmail = actor.email;
  }
  const sort = getSort(req.query.sortBy);
  const reviews = await Review.find(filter).sort(sort);

  const total = reviews.length;
  const avgRating = total
    ? Number(
      (
        reviews.reduce((sum, review) => sum + review.rating, 0) / total
      ).toFixed(1)
    )
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((review) => review.rating === stars).length;
    const pct = total ? Math.round((count / total) * 100) : 0;
    return { stars, count, pct };
  });

  res.json({
    reviews: reviews.map((r) => normalizeReview(r, actor)),
    stats: {
      totalReviews: total,
      overallRating: avgRating,
      ratingDistribution
    }
  });
};

export const getAdminReviews = async (req, res) => {
  const actor = getActor(req);
  const {
    search = '',
    status = 'all',
    rating = 'all',
    workshop = 'all',
    sortBy = 'newest'
  } = req.query;

  const filter = {};
  if (status !== 'all') filter.status = status;
  if (rating !== 'all') filter.rating = Number(rating);
  if (workshop !== 'all') filter.workshopName = workshop;

  if (search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { touristName: regex },
      { artisanName: regex },
      { workshopName: regex },
      { text: regex }
    ];
  }

  const reviews = await Review.find(filter).sort(getSort(sortBy));

  res.json({
    reviews: reviews.map((r) => normalizeReview(r, actor)),
    workshops: ['all', ...new Set(reviews.map((review) => review.workshopName))]
  });
};

export const createReview = async (req, res) => {
  const actor = getActor(req);
  if (!actor.email || !actor.role) {
    return res.status(401).json({ message: 'Please log in to submit a review.' });
  }
  if (actor.role !== 'tourist') {
    return res.status(403).json({ message: 'Only tourists can submit reviews.' });
  }

  const artisanName = String(req.body?.artisanName || '')
    .trim() || 'Unknown Artisan';
  const workshopName = String(req.body?.workshopName || '')
    .trim() || 'Unknown Workshop';
  const rawRating = req.body?.rating ?? req.body?.stars ?? req.body?.score ?? req.body?.value;
  const rating = parseIncomingRating(req.body);
  const text = parseIncomingText(req.body);
  const photos = Array.isArray(req.body?.photos) ? req.body.photos : [];

  if (rating == null) {
    return res.status(400).json({
      message: 'rating is required (1 to 5).',
      received: rawRating ?? null
    });
  }
  if (!text) {
    return res.status(400).json({
      message: 'text is required.',
      received: {
        text: req.body?.text ?? null,
        reviewText: req.body?.reviewText ?? null,
        comment: req.body?.comment ?? null,
        content: req.body?.content ?? null
      }
    });
  }
  if (!isLongEnoughText(text)) {
    return res.status(400).json({ message: 'Review text must be at least 3 characters.' });
  }

  const touristName = displayNameFrom(actor);
  try {
    const review = await Review.create({
      ...req.body,
      artisanName,
      workshopName,
      rating,
      text,
      photos,
      authorEmail: actor.email,
      touristName,
      touristInitials: initialsFrom(touristName),
      isOwn: true
    });

    // Update Tourist stats
    try {
      await Tourist.findOneAndUpdate(
        { email: actor.email },
        { 
          $inc: { reviewsGiven: 1 },
          $push: { reviews: review._id.toString() }
        }
      );
    } catch (statsErr) {
      console.error('Failed to update tourist review stats:', statsErr);
      // We don't fail the request if just stats update fails, but we log it
    }

    return res.status(201).json(normalizeReview(review, actor));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('createReview failed:', error);
    return res.status(400).json({ message: 'Invalid review payload.' });
  }
};

export const updateReview = async (req, res) => {
  const actor = getActor(req);
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ message: 'Review not found' });
  if (!actor.email || review.authorEmail !== actor.email) {
    return res.status(403).json({ message: 'You can edit only your own reviews.' });
  }
  if (!canEditByTime(review.createdAt)) {
    return res.status(403).json({ message: 'You can edit a review only within 24 hours of posting.' });
  }

  const incomingRating = parseIncomingRating(req.body);
  const incomingText = parseIncomingText(req.body);
  if (incomingRating != null) review.rating = incomingRating;
  if (incomingText) {
    if (!isLongEnoughText(incomingText)) {
      return res.status(400).json({ message: 'Review text must be at least 3 characters.' });
    }
    review.text = incomingText;
  }
  if (Array.isArray(req.body.photos)) review.photos = req.body.photos;
  review.edited = true;

  const saved = await review.save();
  res.json(normalizeReview(saved, actor));
};

export const deleteReview = async (req, res) => {
  const actor = getActor(req);
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ message: 'Review not found' });
  if (!actor.email || !actor.role) {
    return res.status(401).json({ message: 'Please log in first.' });
  }
  const isAdmin = actor.role === 'admin';
  const isOwner = review.authorEmail === actor.email;
  if (!isAdmin && !isOwner) {
    return res.status(403).json({ message: 'You can delete only your own reviews.' });
  }

  await review.deleteOne();
  res.status(204).send();
};

export const replyToReview = async (req, res) => {
  const actor = getActor(req);
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ message: 'Review not found' });
  if (actor.role !== 'artist' || !actor.email) {
    return res.status(403).json({ message: 'Only artists can reply to reviews.' });
  }
  if (!actor.artistName || actor.artistName !== review.artisanName) {
    return res.status(403).json({ message: 'You can reply only to reviews for your own profile.' });
  }
  if (!req.body.text?.trim()) {
    return res.status(400).json({ message: 'Reply text is required' });
  }

  review.artisanReply = { text: req.body.text.trim(), date: new Date() };
  const saved = await review.save();
  res.json(normalizeReview(saved, actor));
};

export const markHelpful = async (req, res) => {
  const actor = getActor(req);
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { $inc: { helpful: 1 } },
    { new: true }
  );
  if (!review) return res.status(404).json({ message: 'Review not found' });
  res.json(normalizeReview(review, actor));
};

export const moderateReview = async (req, res) => {
  const actor = getActor(req);
  if (actor.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can moderate reviews.' });
  }
  const { action, flagReason = '' } = req.body;
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ message: 'Review not found' });

  if (action === 'hide') review.status = 'hidden';
  if (action === 'remove') review.status = 'removed';
  if (action === 'restore') review.status = 'active';
  if (action === 'spam') {
    review.status = 'flagged';
    review.flagReason = flagReason || 'Marked as spam by admin';
    review.reportCount += 1;
  }

  const saved = await review.save();
  res.json(normalizeReview(saved, actor));
};
