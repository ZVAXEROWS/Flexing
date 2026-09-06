import { apiClient } from './client';
import { Rating } from '../types';
import { MOCK_CONTENT } from './mockData';

// Local in-memory store for fallback user ratings
let localUserRatings: Rating[] = [
  { ratingId: 'r-1', contentId: 'c-001', score: 5.0, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { ratingId: 'r-2', contentId: 'c-003', score: 4.5, createdAt: new Date(Date.now() - 172800000).toISOString() }
];

export const submitRating = async (contentId: string, score: number): Promise<Rating> => {
  try {
    const { data } = await apiClient.post<Rating>('/ratings', { contentId, score });
    return data;
  } catch {
    const existingIdx = localUserRatings.findIndex(r => r.contentId === contentId);
    const content = MOCK_CONTENT.find(c => c.contentId === contentId);
    const ratingObj: Rating = {
      ratingId: 'r-' + Math.random().toString(36).substring(2, 9),
      contentId,
      score,
      createdAt: new Date().toISOString(),
      contentTitle: content?.title,
      posterUrl: content?.posterUrl
    };

    if (existingIdx >= 0) {
      localUserRatings[existingIdx] = ratingObj;
    } else {
      localUserRatings.unshift(ratingObj);
    }
    return ratingObj;
  }
};

export const fetchMyRatings = async (): Promise<Rating[]> => {
  try {
    const { data } = await apiClient.get<{ data: Rating[] }>('/ratings/me');
    return data.data.map(r => {
      const content = MOCK_CONTENT.find(c => c.contentId === r.contentId);
      return {
        ...r,
        contentTitle: content?.title || r.contentId,
        posterUrl: content?.posterUrl
      };
    });
  } catch {
    return localUserRatings.map(r => {
      const content = MOCK_CONTENT.find(c => c.contentId === r.contentId);
      return {
        ...r,
        contentTitle: content?.title || r.contentId,
        posterUrl: content?.posterUrl
      };
    });
  }
};

export const deleteRating = async (ratingId: string): Promise<void> => {
  try {
    await apiClient.delete(`/ratings/${ratingId}`);
  } catch {
    localUserRatings = localUserRatings.filter(r => r.ratingId !== ratingId);
  }
};
