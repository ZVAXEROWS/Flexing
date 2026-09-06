import { apiClient } from './client';
import { ContentDetail, ContentItem, PaginatedResponse } from '../types';
import { MOCK_CONTENT } from './mockData';

export interface ContentFilterParams {
  genre?: string;
  type?: string;
  query?: string;
  page?: number;
  size?: number;
}

export const fetchContentList = async (params: ContentFilterParams = {}): Promise<PaginatedResponse<ContentItem>> => {
  try {
    const { data } = await apiClient.get<PaginatedResponse<ContentItem>>('/content', { params });
    return data;
  } catch {
    // Filter mock data locally if API is not running
    let filtered = [...MOCK_CONTENT];

    if (params.type && params.type !== 'all') {
      filtered = filtered.filter(item => item.type === params.type);
    }
    if (params.genre && params.genre !== 'all') {
      const genreLower = params.genre.toLowerCase();
      filtered = filtered.filter(item => item.genre.some(g => g.toLowerCase() === genreLower));
    }
    if (params.query) {
      const q = params.query.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(q) || 
        (item.description && item.description.toLowerCase().includes(q))
      );
    }

    const page = params.page || 1;
    const size = params.size || 20;
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / size) || 1;
    const startIdx = (page - 1) * size;
    const paginatedItems = filtered.slice(startIdx, startIdx + size);

    return {
      data: paginatedItems,
      pagination: {
        page,
        size,
        totalItems,
        totalPages
      }
    };
  }
};

export const fetchContentDetail = async (contentId: string): Promise<ContentDetail> => {
  try {
    const { data } = await apiClient.get<ContentDetail>(`/content/${contentId}`);
    return data;
  } catch {
    const found = MOCK_CONTENT.find(item => item.contentId === contentId);
    if (found) {
      return found;
    }
    // Fallback item
    return {
      contentId,
      title: 'Neural Odyssey',
      type: 'movie',
      genre: ['Sci-Fi', 'Adventure'],
      releaseYear: 2024,
      rating: 8.5,
      posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80',
      director: 'K. Tanaka',
      cast: ['Actor A', 'Actor B'],
      description: 'A captivating deep-space and synthetic intelligence experience.',
      duration: 128,
      language: 'English'
    };
  }
};
