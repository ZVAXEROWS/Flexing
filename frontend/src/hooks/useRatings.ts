import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMyRatings, submitRating, deleteRating } from '../api/ratings';
import { postEvent } from '../api/events';

export const useMyRatings = () => {
  return useQuery({
    queryKey: ['my-ratings'],
    queryFn: fetchMyRatings,
    staleTime: 1000 * 60 * 2,
  });
};

export const useSubmitRating = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contentId, score }: { contentId: string; score: number }) => {
      const res = await submitRating(contentId, score);
      // Emit event for real-time model retraining
      postEvent('rate', contentId, 0, { score });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-ratings'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
};

export const useDeleteRating = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ratingId: string) => deleteRating(ratingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-ratings'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
};
