# Phase 2 — Frontend UI: React + TypeScript SPA

## Goal

Build the user-facing React + TypeScript application that authenticates users, displays the content catalogue, and shows personalised recommendations by consuming the Phase 1 gateway API.

---

## Prerequisites

- ✅ **Phase 1 complete** — gateway running on `:8080`, ML service on `:8000`
- Node.js ≥ 20 LTS + npm ≥ 10
- Docker Compose v2

---

## Step-by-Step Setup

### 1. Initialise the React + TypeScript Project

From the repo root:

```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install
```

Install additional dependencies:

```bash
npm install \
  @tanstack/react-query \
  react-router-dom \
  axios \
  zustand
```

Install dev dependencies:

```bash
npm install -D \
  @types/react \
  @types/react-dom \
  eslint \
  prettier
```

---

### 2. Project Structure

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── api/
│   │   ├── auth.ts          # login, register, refresh
│   │   ├── content.ts       # fetch content list, detail
│   │   ├── recommendations.ts
│   │   └── events.ts        # post interaction events
│   ├── components/
│   │   ├── ContentCard.tsx
│   │   ├── RecommendationList.tsx
│   │   ├── Navbar.tsx
│   │   └── RatingWidget.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useRecommendations.ts
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── ContentDetailPage.tsx
│   │   └── ProfilePage.tsx
│   ├── store/
│   │   └── authStore.ts     # Zustand auth state
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
└── package.json
```

---

### 3. Configure Vite Proxy

`vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
```

---

### 4. Type Definitions

`src/types/index.ts`:

```typescript
export interface User {
  userId: string;
  username: string;
  email: string;
}

export interface ContentItem {
  contentId: string;
  title: string;
  type: 'movie' | 'show' | 'podcast';
  genre: string[];
  releaseYear: number;
  rating: number;
  posterUrl: string;
}

export interface Recommendation {
  rank: number;
  contentId: string;
  title: string;
  score: number;
  reason: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
```

---

### 5. API Layer

`src/api/auth.ts`:

```typescript
import axios from 'axios';
import type { AuthTokens, User } from '../types';

const BASE = '/api';

export const login = async (email: string, password: string): Promise<AuthTokens> => {
  const { data } = await axios.post(`${BASE}/auth/login`, { email, password });
  return data;
};

export const register = async (username: string, email: string, password: string): Promise<User> => {
  const { data } = await axios.post(`${BASE}/auth/register`, { username, email, password });
  return data;
};

export const refreshToken = async (refreshToken: string): Promise<AuthTokens> => {
  const { data } = await axios.post(`${BASE}/auth/refresh`, { refreshToken });
  return data;
};
```

`src/api/recommendations.ts`:

```typescript
import axios from 'axios';
import type { Recommendation } from '../types';

export const fetchRecommendations = async (
  token: string,
  options: { algorithm?: string; limit?: number } = {}
): Promise<Recommendation[]> => {
  const { data } = await axios.get('/api/recommendations', {
    headers: { Authorization: `Bearer ${token}` },
    params: options,
  });
  return data.recommendations;
};
```

---

### 6. Auth State (Zustand)

`src/store/authStore.ts`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthTokens } from '../types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  setAuth: (user: User, tokens: AuthTokens) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      setAuth: (user, tokens) => set({ user, tokens }),
      clearAuth: () => set({ user: null, tokens: null }),
    }),
    { name: 'auth-storage' }
  )
);
```

---

### 7. Key Pages

#### `LoginPage.tsx`

- Form with email + password inputs
- Calls `login()` API, stores tokens in Zustand
- Redirects to `/` on success

#### `HomePage.tsx`

- Fetches `GET /api/content` (paginated catalogue)
- Fetches `GET /api/recommendations` for the logged-in user
- Renders two sections: **"For You"** (recommendations) + **"Browse All"** (catalogue grid)

#### `ContentDetailPage.tsx`

- Fetches `GET /api/content/:id`
- Shows full metadata
- Includes `<RatingWidget>` to POST to `/api/ratings`
- Posts a `view` event to `/api/events` on mount

---

### 8. Interaction Event Posting

On each page view or user action, emit an event to keep recommendations fresh:

```typescript
// src/api/events.ts
export const postEvent = async (
  token: string,
  eventType: string,
  contentId: string
) => {
  await axios.post(
    '/api/events',
    { eventType, contentId, timestamp: new Date().toISOString() },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};
```

---

### 9. React Query Integration

Wrap the app in `QueryClientProvider` and use `useQuery` for data fetching:

```typescript
// src/App.tsx (excerpt)
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
```

---

### 10. Dockerfile for Frontend

`frontend/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

`frontend/nginx.conf`:

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri /index.html;
  }

  location /api/ {
    proxy_pass http://gateway:8080/;
  }
}
```

Add to `docker-compose.yml`:

```yaml
  frontend:
    build: ./frontend
    ports: ["3000:80"]
    depends_on: [gateway]
```

---

### 11. Run Locally (Dev Mode)

```bash
# Terminal 1 — backend stack
docker compose up postgres gateway ml-service

# Terminal 2 — frontend dev server with HMR
cd frontend
npm run dev
# → http://localhost:3000
```

---

## Definition of Done

- [ ] `npm run dev` starts the frontend on port 3000
- [ ] User can register and log in; JWT is stored and used for subsequent requests
- [ ] Home page displays a content grid from `GET /api/content`
- [ ] Recommendations section shows personalised content from `GET /api/recommendations`
- [ ] User can rate a content item (1–5 stars) via `POST /api/ratings`
- [ ] Viewing a content page emits a `view` event to `POST /api/events`
- [ ] Frontend Docker image builds and runs correctly
- [ ] `docker compose up` starts full stack (frontend + gateway + ML + DB)
- [ ] No TypeScript compilation errors (`npm run build` succeeds)
