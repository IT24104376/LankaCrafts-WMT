import api from '../api/axiosInstance';

export interface ReviewPhoto {
  url: string;
  alt: string;
}

export interface ArtisanReply {
  text: string;
  date: string;
}

export interface Review {
  _id: string;
  id?: string;
  authorEmail?: string;
  touristName: string;
  touristInitials: string;
  touristColor: string;
  country: string;
  countryFlag: string;
  artisanName: string;
  workshopName: string;
  rating: number;
  text: string;
  photos: ReviewPhoto[];
  status: 'active' | 'hidden' | 'flagged' | 'removed';
  flagReason?: string;
  reportCount: number;
  helpful: number;
  edited: boolean;
  isOwn: boolean;
  canEdit?: boolean;
  artisanReply?: ArtisanReply | null;
  datePosted: string;
}

export interface ReviewStats {
  totalReviews: number;
  overallRating: number;
  ratingDistribution: Array<{ stars: number; count: number; pct: number }>;
}

export const reviewApi = {
  getReviews: (params: Record<string, string | boolean | undefined>) =>
    api.get('/reviews', { params }).then(res => res.data),

  getMyReviews: () =>
    api
      .get('/reviews', { params: { mine: 'true', sortBy: 'newest', includeHidden: 'true' } })
      .then(res => res.data),

  getArtistReviews: (artisanName: string, sortBy = 'newest') =>
    api
      .get('/reviews', { params: { context: 'artisan', artisanName, sortBy } })
      .then(res => res.data),

  createReview: (body: Record<string, unknown>) =>
    api.post('/reviews', body).then(res => res.data),

  updateReview: (id: string, body: Record<string, unknown>) =>
    api.patch(`/reviews/${id}`, body).then(res => res.data),

  deleteReview: (id: string) =>
    api.delete(`/reviews/${id}`).then(res => res.data),

  reply: (id: string, text: string, artistName?: string) =>
    api
      .post(`/reviews/${id}/reply`, { text }, {
        headers: artistName ? { 'x-artist-name': artistName } : {},
      })
      .then(res => res.data),

  markHelpful: (id: string) =>
    api.post(`/reviews/${id}/helpful`).then(res => res.data),
};
