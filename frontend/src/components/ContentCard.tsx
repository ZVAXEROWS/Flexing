import React from 'react';
import { Link } from 'react-router-dom';
import { ContentItem } from '../types';
import { Play, Star, Film, Tv, Radio } from 'lucide-react';
import { RatingWidget } from './RatingWidget';

interface ContentCardProps {
  item: ContentItem;
  score?: number;
  reason?: string;
}

export const ContentCard: React.FC<ContentCardProps> = ({ item, score, reason }) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'movie':
        return <Film size={12} />;
      case 'show':
        return <Tv size={12} />;
      case 'podcast':
        return <Radio size={12} />;
      default:
        return <Film size={12} />;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        transition: 'transform var(--transition-normal), box-shadow var(--transition-normal), border-color var(--transition-normal)',
        position: 'relative',
      }}
      className="content-card"
    >
      {/* Poster Image & Overlay Container */}
      <div style={{ position: 'relative', paddingTop: '140%', width: '100%', overflow: 'hidden', background: '#111827' }}>
        <img
          src={item.posterUrl}
          alt={item.title}
          loading="lazy"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease',
          }}
        />

        {/* Type Badge */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {getTypeIcon(item.type)}
          <span>{item.type}</span>
        </div>

        {/* AI Score Badge if present */}
        {score !== undefined && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
            }}
          >
            {Math.round(score * 100)}% Match
          </div>
        )}

        {/* Hover Quick Action Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(9, 12, 21, 0.95) 0%, rgba(9, 12, 21, 0.4) 60%, transparent 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '1rem',
            opacity: 0,
            transition: 'opacity 0.25s ease',
          }}
          className="card-overlay"
        >
          <Link
            to={`/content/${item.contentId}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              background: '#ffffff',
              color: '#090c15',
              fontWeight: 700,
              fontSize: '0.85rem',
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '0.5rem',
              boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)',
            }}
          >
            <Play size={16} fill="#090c15" /> Explore
          </Link>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <RatingWidget contentId={item.contentId} size="sm" showText={false} />
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', flexGrow: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
          <Link
            to={`/content/${item.contentId}`}
            style={{
              fontWeight: 600,
              fontSize: '0.95rem',
              color: 'var(--text-primary)',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={item.title}
          >
            {item.title}
          </Link>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.releaseYear}</span>
        </div>

        {/* Rating & Genres */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600, color: '#fbbf24' }}>
            <Star size={14} fill="#fbbf24" color="#fbbf24" />
            <span>{item.rating.toFixed(1)}</span>
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {item.genre.slice(0, 2).map((g) => (
              <span
                key={g}
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: 'var(--text-secondary)',
                }}
              >
                {g}
              </span>
            ))}
          </div>
        </div>

        {/* AI Recommendation Reason */}
        {reason && (
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--accent-cyan)',
              marginTop: '4px',
              lineHeight: 1.2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontStyle: 'italic',
            }}
          >
            💡 {reason}
          </p>
        )}
      </div>

      <style>{`
        .content-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: rgba(139, 92, 246, 0.4);
        }
        .content-card:hover img {
          transform: scale(1.06);
        }
        .content-card:hover .card-overlay {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};
