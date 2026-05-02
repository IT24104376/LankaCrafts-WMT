import api from '../api/axiosInstance';

export interface AiReviewSummary {
  artisanName: string;
  summary: string;
  providerNote?: string;
  highlights?: string[];
  cautions?: string[];
  ratingBreakdown?: {
    avgRating: number;
    total: number;
    distribution: Array<{ stars: number; count: number }>;
  } | null;
}

export const aiApi = {
  summarizeArtistReviews: (body: {
    artisanName: string;
    reviews: Array<{ rating: number; text: string }>;
  }) =>
    api.post<AiReviewSummary>('/ai/review-summary', body).then(res => res.data),
};
