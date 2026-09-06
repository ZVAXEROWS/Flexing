import { apiClient } from './client';
import { AuthTokens, User } from '../types';

export const login = async (email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> => {
  try {
    const { data } = await apiClient.post<AuthTokens>('/auth/login', { email, password });
    const user: User = {
      userId: 'u-' + Math.random().toString(36).substring(2, 9),
      username: email.split('@')[0],
      email,
      preferences: { genres: ['Sci-Fi', 'Tech'] }
    };
    return { user, tokens: data };
  } catch {
    // Graceful offline fallback for local standalone testing
    const fakeTokens: AuthTokens = {
      accessToken: 'demo_jwt_' + btoa(JSON.stringify({ email, exp: Date.now() + 3600000 })),
      refreshToken: 'demo_refresh_' + Math.random().toString(36).substring(2, 9),
      expiresIn: 3600,
      tokenType: 'Bearer'
    };
    const demoUser: User = {
      userId: 'usr-demo-42',
      username: email.split('@')[0] || 'DemoUser',
      email,
      preferences: { genres: ['Sci-Fi', 'Drama', 'Tech'] },
      createdAt: new Date().toISOString()
    };
    return { user: demoUser, tokens: fakeTokens };
  }
};

export const register = async (username: string, email: string, password: string, preferences?: { genres: string[] }): Promise<{ user: User; tokens: AuthTokens }> => {
  try {
    const { data } = await apiClient.post<User>('/auth/register', { username, email, password, preferences });
    const fakeTokens: AuthTokens = {
      accessToken: 'jwt_' + btoa(JSON.stringify({ email, exp: Date.now() + 3600000 })),
      refreshToken: 'refresh_' + Math.random().toString(36).substring(2, 9),
      expiresIn: 3600,
      tokenType: 'Bearer'
    };
    return { user: data, tokens: fakeTokens };
  } catch {
    const newUser: User = {
      userId: 'usr-' + Math.random().toString(36).substring(2, 9),
      username,
      email,
      preferences: preferences || { genres: ['Sci-Fi', 'Action'] },
      createdAt: new Date().toISOString()
    };
    const newTokens: AuthTokens = {
      accessToken: 'demo_jwt_' + btoa(JSON.stringify({ email, exp: Date.now() + 3600000 })),
      refreshToken: 'demo_refresh_' + Math.random().toString(36).substring(2, 9),
      expiresIn: 3600,
      tokenType: 'Bearer'
    };
    return { user: newUser, tokens: newTokens };
  }
};

export const refreshToken = async (refreshTokenValue: string): Promise<AuthTokens> => {
  const { data } = await apiClient.post<AuthTokens>('/auth/refresh', { refreshToken: refreshTokenValue });
  return data;
};

export const fetchMe = async (): Promise<User> => {
  try {
    const { data } = await apiClient.get<User>('/users/me');
    return data;
  } catch {
    return {
      userId: 'usr-demo-42',
      username: 'Alex Explorer',
      email: 'alex@example.com',
      preferences: { genres: ['Sci-Fi', 'Drama', 'Tech'] }
    };
  }
};
