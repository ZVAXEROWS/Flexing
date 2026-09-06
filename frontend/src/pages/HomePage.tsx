import React, { useState } from 'react';
import { useRecommendations } from '../hooks/useRecommendations';
import { useContentList } from '../hooks/useContent';
import { HeroBanner } from '../components/HeroBanner';
import { RecommendationList } from '../components/RecommendationList';
import { AlgorithmSelector } from '../components/AlgorithmSelector';
import { ContentCard } from '../components/ContentCard';
import { AlgorithmType } from '../types';
import { Sparkles, Grid, Film, Tv, Radio, Layers } from 'lucide-react';

interface HomePageProps {
  searchQuery?: string;
}

export const HomePage: React.FC<HomePageProps> = ({ searchQuery }) => {
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('mf');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');

  const { data: recommendations = [], isLoading: isRecsLoading } = useRecommendations({
    algorithm,
    limit: 4,
  });

  const { data: contentData, isLoading: isContentLoading } = useContentList({
    type: selectedType === 'all' ? undefined : selectedType,
    genre: selectedGenre === 'all' ? undefined : selectedGenre,
    query: searchQuery,
  });

  const spotlightItem = recommendations[0]?.item || contentData?.data[0];
  const genres = ['all', 'Sci-Fi', 'Drama', 'Action', 'Tech', 'Thriller', 'Biography'];

  const typeTabs: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Formats', icon: <Layers size={14} /> },
    { id: 'movie', label: 'Movies', icon: <Film size={14} /> },
    { id: 'show', label: 'TV Shows', icon: <Tv size={14} /> },
    { id: 'podcast', label: 'Podcasts', icon: <Radio size={14} /> },
  ];

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem 2rem 4rem' }}>
      {/* Hero Spotlight Section */}
      {!searchQuery && (
        <HeroBanner item={spotlightItem} matchScore={recommendations[0]?.score} />
      )}

      {/* AI Recommendation Stream Section */}
      {!searchQuery && (
        <section style={{ marginBottom: '3.5rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} color="var(--primary)" />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Personalized For You</h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
                Real-time recommendations powered by polyglot C++ vector similarity & Python ML pipelines.
              </p>
            </div>

            {/* Model switch */}
            <AlgorithmSelector selected={algorithm} onChange={setAlgorithm} />
          </div>

          <RecommendationList recommendations={recommendations} isLoading={isRecsLoading} />
        </section>
      )}

      {/* Catalogue Grid Section */}
      <section>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Grid size={20} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {searchQuery ? `Search results for "${searchQuery}"` : 'Browse Catalogue'}
            </h2>
          </div>

          {/* Type Filter Tabs */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(15, 23, 42, 0.7)',
              padding: '4px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              gap: '4px',
            }}
          >
            {typeTabs.map((tab) => {
              const isSelected = selectedType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedType(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    fontWeight: isSelected ? 600 : 500,
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    background: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Genre Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {genres.map((g) => {
            const isSelected = selectedGenre === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGenre(g)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  fontWeight: isSelected ? 600 : 500,
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  background: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.04)',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {g === 'all' ? 'All Genres' : g}
              </button>
            );
          })}
        </div>

        {/* Content Items */}
        {isContentLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} style={{ height: '360px' }} className="skeleton" />
            ))}
          </div>
        ) : contentData?.data.length === 0 ? (
          <div
            style={{
              padding: '3rem',
              textAlign: 'center',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No media matches your filter criteria.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {contentData?.data.map((item) => (
              <ContentCard key={item.contentId} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
