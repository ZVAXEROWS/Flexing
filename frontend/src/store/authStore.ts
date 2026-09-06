import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthTokens } from '../types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  setAuth: (user: User, tokens: AuthTokens) => void;
  clearAuth: () => void;
  updateUser: (partial: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: {
        userId: 'usr-demo-42',
        username: 'Alex Explorer',
        email: 'alex@example.com',
        preferences: { genres: ['Sci-Fi', 'Tech', 'Drama'] },
        createdAt: '2026-06-11T12:00:00Z'
      },
      tokens: {
        accessToken: 'demo_init_token',
        refreshToken: 'demo_init_refresh',
        expiresIn: 3600,
        tokenType: 'Bearer'
      },
      isAuthenticated: true,

      setAuth: (user, tokens) => set({ user, tokens, isAuthenticated: true }),
      clearAuth: () => set({ user: null, tokens: null, isAuthenticated: false }),
      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
    }),
    {
      name: 'auth-storage',
    }
  )
);
