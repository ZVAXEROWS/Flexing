import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { useSubmitRating } from '../hooks/useRatings';

interface RatingWidgetProps {
  contentId: string;
  initialScore?: number;
  onRated?: (score: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const RatingWidget: React.FC<RatingWidgetProps> = ({
  contentId,
  initialScore = 0,
  onRated,
  size = 'md',
  showText = true,
}) => {
  const [rating, setRating] = useState<number>(initialScore);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const submitRatingMutation = useSubmitRating();

  const handleRate = async (score: number) => {
    setRating(score);
    await submitRatingMutation.mutateAsync({ contentId, score });
    if (onRated) onRated(score);
  };

  const starSizes = {
    sm: 16,
    md: 22,
    lg: 28,
  };

  const activeValue = hoverRating !== null ? hoverRating : rating;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFilled = activeValue >= starIndex;
          const isHalf = activeValue >= starIndex - 0.5 && activeValue < starIndex;

          return (
            <button
              key={starIndex}
              type="button"
              onClick={() => handleRate(starIndex)}
              onMouseEnter={() => setHoverRating(starIndex)}
              onMouseLeave={() => setHoverRating(null)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                transition: 'transform 0.15s ease',
                transform: hoverRating === starIndex ? 'scale(1.2)' : 'scale(1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={`Rate ${starIndex} stars`}
            >
              <Star
                size={starSizes[size]}
                fill={isFilled || isHalf ? '#fbbf24' : 'transparent'}
                color={isFilled || isHalf ? '#f59e0b' : '#64748b'}
                strokeWidth={1.75}
              />
            </button>
          );
        })}
      </div>

      {showText && (
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: rating > 0 ? '#fbbf24' : '#94a3b8', minWidth: '2.5rem' }}>
          {rating > 0 ? `${rating.toFixed(1)} ★` : 'Rate'}
        </span>
      )}
      {submitRatingMutation.isPending && (
        <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Saving...</span>
      )}
    </div>
  );
};
