import { ContentDetail, Recommendation } from '../types';

export const MOCK_CONTENT: ContentDetail[] = [
  {
    contentId: 'c-001',
    title: 'Interstellar',
    type: 'movie',
    genre: ['Sci-Fi', 'Drama', 'Adventure'],
    releaseYear: 2014,
    rating: 8.7,
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80',
    director: 'Christopher Nolan',
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'],
    description: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
    duration: 169,
    language: 'English'
  },
  {
    contentId: 'c-002',
    title: 'Cyber Nexus 2099',
    type: 'show',
    genre: ['Sci-Fi', 'Action', 'Thriller'],
    releaseYear: 2024,
    rating: 9.1,
    posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1600&auto=format&fit=crop&q=80',
    director: 'Denis Villeneuve',
    cast: ['Oscar Isaac', 'Rebecca Ferguson', 'Timothée Chalamet'],
    description: 'In a neon-drenched metropolis governed by rogue neural networks, a syndicate detective uncovers an artificial consciousness predicting human mortality in real-time.',
    duration: 55,
    language: 'English'
  },
  {
    contentId: 'c-003',
    title: 'Arrival',
    type: 'movie',
    genre: ['Sci-Fi', 'Drama', 'Mystery'],
    releaseYear: 2016,
    rating: 7.9,
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=80',
    director: 'Denis Villeneuve',
    cast: ['Amy Adams', 'Jeremy Renner', 'Forest Whitaker'],
    description: 'A linguist works with the military to communicate with alien lifeforms after twelve mysterious spacecraft appear around the world.',
    duration: 116,
    language: 'English'
  },
  {
    contentId: 'c-004',
    title: 'The AI Frontier',
    type: 'podcast',
    genre: ['Tech', 'Education', 'Science'],
    releaseYear: 2025,
    rating: 8.9,
    posterUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&auto=format&fit=crop&q=80',
    director: 'Dr. Sarah Vance',
    cast: ['Dr. Sarah Vance', 'Geoffrey Hinton', 'Yann LeCun'],
    description: 'Deep-dive conversations exploring the bleeding edge of artificial intelligence, neural embeddings, quantum computing, and autonomous agency.',
    duration: 65,
    language: 'English'
  },
  {
    contentId: 'c-005',
    title: 'Blade Runner: Nexus',
    type: 'movie',
    genre: ['Sci-Fi', 'Neo-Noir', 'Thriller'],
    releaseYear: 2023,
    rating: 8.8,
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1600&auto=format&fit=crop&q=80',
    director: 'Ridley Scott',
    cast: ['Harrison Ford', 'Ryan Gosling', 'Ana de Armas'],
    description: 'A young blade runner unearths a long-buried secret that has the potential to plunge what is left of society into chaos.',
    duration: 164,
    language: 'English'
  },
  {
    contentId: 'c-006',
    title: 'Solaris Protocol',
    type: 'show',
    genre: ['Sci-Fi', 'Mystery', 'Drama'],
    releaseYear: 2024,
    rating: 8.4,
    posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=80',
    director: 'Andrei Tarkovsky Jr.',
    cast: ['Alexander Skarsgård', 'Noomi Rapace'],
    description: 'Cosmonauts orbiting a sentient oceanic world begin experiencing hallucinations driven by their deepest subconscious regrets.',
    duration: 48,
    language: 'English'
  },
  {
    contentId: 'c-007',
    title: 'Silicon Mind Audio Lab',
    type: 'podcast',
    genre: ['Tech', 'Culture'],
    releaseYear: 2026,
    rating: 8.2,
    posterUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1600&auto=format&fit=crop&q=80',
    director: 'Elena Rostova',
    cast: ['Elena Rostova', 'Guest Innovators'],
    description: 'Discussions about distributed microservices, C++ low latency engines, Akka stream processing, and large scale data architecture.',
    duration: 42,
    language: 'English'
  },
  {
    contentId: 'c-008',
    title: 'Oppenheimer',
    type: 'movie',
    genre: ['Biography', 'Drama', 'History'],
    releaseYear: 2023,
    rating: 8.9,
    posterUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
    director: 'Christopher Nolan',
    cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon'],
    description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
    duration: 180,
    language: 'English'
  }
];

export const MOCK_RECOMMENDATIONS: Record<string, Recommendation[]> = {
  mf: [
    {
      rank: 1,
      contentId: 'c-002',
      title: 'Cyber Nexus 2099',
      score: 0.98,
      reason: 'Matrix Factorization latent factor match with your Sci-Fi preferences',
      item: MOCK_CONTENT[1]
    },
    {
      rank: 2,
      contentId: 'c-003',
      title: 'Arrival',
      score: 0.94,
      reason: 'Strong correlation with Christopher Nolan & Denis Villeneuve directing styles',
      item: MOCK_CONTENT[2]
    },
    {
      rank: 3,
      contentId: 'c-005',
      title: 'Blade Runner: Nexus',
      score: 0.91,
      reason: 'Decomposed user-item vector similarity (91% affinity)',
      item: MOCK_CONTENT[4]
    },
    {
      rank: 4,
      contentId: 'c-004',
      title: 'The AI Frontier',
      score: 0.86,
      reason: 'Emerging interest in AI & Future Science podcasts',
      item: MOCK_CONTENT[3]
    }
  ],
  knn: [
    {
      rank: 1,
      contentId: 'c-005',
      title: 'Blade Runner: Nexus',
      score: 0.96,
      reason: 'KNN: Users with similar watch history rated this 5 stars',
      item: MOCK_CONTENT[4]
    },
    {
      rank: 2,
      contentId: 'c-001',
      title: 'Interstellar',
      score: 0.95,
      reason: 'KNN: Closest cosine neighbor to top Sci-Fi favorites',
      item: MOCK_CONTENT[0]
    },
    {
      rank: 3,
      contentId: 'c-006',
      title: 'Solaris Protocol',
      score: 0.89,
      reason: 'KNN: Cluster cluster-alpha neighborhood alignment',
      item: MOCK_CONTENT[5]
    }
  ],
  ncf: [
    {
      rank: 1,
      contentId: 'c-002',
      title: 'Cyber Nexus 2099',
      score: 0.99,
      reason: 'Neural Collaborative Filtering: Multi-layer perceptron high non-linear affinity',
      item: MOCK_CONTENT[1]
    },
    {
      rank: 2,
      contentId: 'c-004',
      title: 'The AI Frontier',
      score: 0.93,
      reason: 'NCF: Cross-genre interaction pattern (Sci-Fi Movie → Tech Audio)',
      item: MOCK_CONTENT[3]
    },
    {
      rank: 3,
      contentId: 'c-008',
      title: 'Oppenheimer',
      score: 0.90,
      reason: 'NCF: Deep embedding overlap with high-stakes intellectual dramas',
      item: MOCK_CONTENT[7]
    }
  ]
};
