import { apiClient } from './client';
import { AlgorithmType, Recommendation, RecommendationResponse } from '../types';
import { MOCK_RECOMMENDATIONS, MOCK_CONTENT } from './mockData';

export interface RecommendationOptions {
  algorithm?: AlgorithmType;
  limit?: number;
  type?: string;
  genre?: string;
}

export const fetchRecommendations = async (options: RecommendationOptions = {}): Promise<Recommendation[]> => {
  const algo = options.algorithm || 'mf';
  try {
    const { data } = await apiClient.get<RecommendationResponse>('/recommendations', {
      params: options,
    });
    // Enrich with mock media metadata if missing
    return data.recommendations.map(rec => ({
      ...rec,
      item: rec.item || MOCK_CONTENT.find(c => c.contentId === rec.contentId)
    }));
  } catch {
    const recs = MOCK_RECOMMENDATIONS[algo] || MOCK_RECOMMENDATIONS.mf;
    const limit = options.limit || 10;
    return recs.slice(0, limit);
  }
};

export const fetchSimilarContent = async (contentId: string, limit = 4): Promise<Recommendation[]> => {
  try {
    const { data } = await apiClient.get<RecommendationResponse>(`/recommendations/similar/${contentId}`, {
      params: { limit }
    });
    return data.recommendations.map(rec => ({
      ...rec,
      item: rec.item || MOCK_CONTENT.find(c => c.contentId === rec.contentId)
    }));
  } catch {
    const others = MOCK_CONTENT.filter(c => c.contentId !== contentId);
    return others.slice(0, limit).map((c, idx) => ({
      rank: idx + 1,
      contentId: c.contentId,
      title: c.title,
      score: +(0.95 - idx * 0.05).toFixed(2),
      reason: `Similar themes & genre affinity (${c.genre.join(', ')})`,
      item: c
    }));
  }
};
