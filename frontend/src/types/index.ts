export type ContentType = 'movie' | 'show' | 'podcast';
export type AlgorithmType = 'mf' | 'knn' | 'ncf';

export interface UserPreferences {
  genres?: string[];
  language?: string;
}

export interface User {
  userId: string;
  username: string;
  email: string;
  preferences?: UserPreferences;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType?: string;
}

export interface ContentItem {
  contentId: string;
  title: string;
  type: ContentType;
  genre: string[];
  releaseYear: number;
  rating: number;
  posterUrl: string;
  backdropUrl?: string;
  description?: string;
  duration?: number;
  director?: string;
  cast?: string[];
  language?: string;
}

export interface ContentDetail extends ContentItem {
  director: string;
  cast: string[];
  description: string;
  duration: number;
  language: string;
}

export interface Recommendation {
  rank: number;
  contentId: string;
  title: string;
  score: number;
  reason: string;
  item?: ContentItem;
}

export interface RecommendationResponse {
  userId: string;
  algorithm: AlgorithmType;
  generatedAt: string;
  recommendations: Recommendation[];
}

export interface Rating {
  ratingId: string;
  userId?: string;
  contentId: string;
  score: number;
  createdAt?: string;
  contentTitle?: string;
  posterUrl?: string;
}

export interface Pagination {
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export type EventType = 'view' | 'click' | 'rate' | 'complete' | 'skip';

export interface InteractionEvent {
  eventType: EventType;
  contentId: string;
  duration?: number;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}
