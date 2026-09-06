import React from 'react';
import { Link } from 'react-router-dom';
import { ContentItem } from '../types';
import { Play, Info, Sparkles, Star } from 'lucide-react';

interface HeroBannerProps {
  item?: ContentItem;
  matchScore?: number;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ item, matchScore }) => {
  if (!item) return null;

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '480px',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        marginBottom: '2.5rem',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'flex-end',
      }}
    >
      {/* Dynamic Backdrop */}
      <img
        src={item.backdropUrl || item.posterUrl}
        alt={item.title}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 20%',
        }}
      />

      {/* Deep Gradients for cinematic contrast */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, #090c15 0%, rgba(9, 12, 21, 0.85) 45%, rgba(9, 12, 21, 0.2) 100%), linear-gradient(180deg, transparent 40%, #090c15 100%)',
        }}
      />

      {/* Content Info */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '2.5rem',
          maxWidth: '680px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* Spotlight Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--grad-primary)',
              color: '#ffffff',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <Sparkles size={13} />
            #1 AI Spotlight Match
          </div>

          {matchScore && (
            <span
              style={{
                color: 'var(--accent-cyan)',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {Math.round(matchScore * 100)}% Recommendation Affinity
            </span>
          )}
        </div>

        {/* Title */}
        <h1 style={{ fontSize: '2.75rem', lineHeight: 1.1, fontWeight: 800 }}>{item.title}</h1>

        {/* Metadata */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24', fontWeight: 600 }}>
            <Star size={16} fill="#fbbf24" color="#fbbf24" /> {item.rating.toFixed(1)}
          </span>
          <span>•</span>
          <span>{item.releaseYear}</span>
          <span>•</span>
          <span style={{ textTransform: 'capitalize' }}>{item.type}</span>
          <span>•</span>
          <span>{item.genre.join(', ')}</span>
        </div>

        {/* Synopsis */}
        {item.description && (
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.95rem',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.description}
          </p>
        )}

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          <Link to={`/content/${item.contentId}`} className="glow-btn-primary">
            <Play size={18} fill="#ffffff" /> Watch / Stream Now
          </Link>
          <Link to={`/content/${item.contentId}`} className="glow-btn-secondary">
            <Info size={18} /> Details & Ratings
          </Link>
        </div>
      </div>
    </div>
  );
};
