import React from 'react';
import { Recommendation } from '../types';
import { ContentCard } from './ContentCard';
import { Sparkles } from 'lucide-react';

interface RecommendationListProps {
  recommendations: Recommendation[];
  isLoading?: boolean;
}

export const RecommendationList: React.FC<RecommendationListProps> = ({ recommendations, isLoading }) => {
  if (isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {[1, 2, 3, 4].map((n) => (
          <div key={n} style={{ height: '360px' }} className="skeleton" />
        ))}
      </div>
    );
  }

  if (!recommendations.length) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          background: 'rgba(15, 23, 42, 0.5)',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border-subtle)',
        }}
      >
        <Sparkles size={28} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Rate a few titles to train your personalized recommendations model.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
      {recommendations.map((rec) => {
        if (!rec.item) return null;
        return (
          <ContentCard
            key={rec.contentId}
            item={rec.item}
            score={rec.score}
            reason={rec.reason}
          />
        );
      })}
    </div>
  );
};
