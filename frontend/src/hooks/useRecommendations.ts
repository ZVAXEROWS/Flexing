import { useQuery } from '@tanstack/react-query';
import { fetchRecommendations, fetchSimilarContent, RecommendationOptions } from '../api/recommendations';

export const useRecommendations = (options: RecommendationOptions = {}) => {
  return useQuery({
    queryKey: ['recommendations', options],
    queryFn: () => fetchRecommendations(options),
    staleTime: 1000 * 60 * 3,
  });
};

export const useSimilarContent = (contentId?: string, limit = 4) => {
  return useQuery({
    queryKey: ['similar-content', contentId, limit],
    queryFn: () => fetchSimilarContent(contentId!, limit),
    enabled: !!contentId,
    staleTime: 1000 * 60 * 10,
  });
};
