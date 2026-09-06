import { useQuery } from '@tanstack/react-query';
import { fetchContentList, fetchContentDetail, ContentFilterParams } from '../api/content';

export const useContentList = (params: ContentFilterParams = {}) => {
  return useQuery({
    queryKey: ['content', params],
    queryFn: () => fetchContentList(params),
    staleTime: 1000 * 60 * 5, // 5 mins
  });
};

export const useContentDetail = (contentId?: string) => {
  return useQuery({
    queryKey: ['content', contentId],
    queryFn: () => fetchContentDetail(contentId!),
    enabled: !!contentId,
    staleTime: 1000 * 60 * 10,
  });
};
