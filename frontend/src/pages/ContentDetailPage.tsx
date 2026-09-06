import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useContentDetail } from '../hooks/useContent';
import { useSimilarContent } from '../hooks/useRecommendations';
import { RatingWidget } from '../components/RatingWidget';
import { ContentCard } from '../components/ContentCard';
import { postEvent } from '../api/events';
import { ArrowLeft, Star, Clock, Sparkles } from 'lucide-react';

export const ContentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: item, isLoading, isError } = useContentDetail(id);
  const { data: similar = [] } = useSimilarContent(id, 4);

  useEffect(() => {
    if (id) {
      // Emit view interaction event for the Scala stream processor & ML model
      postEvent('view', id, 0, { source: 'detail_page' });
    }
  }, [id]);

  if (isLoading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem' }}>
        <div style={{ height: '400px' }} className="skeleton" />
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
        <h2>Content not found</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 2rem' }}>
          We could not locate the media item with ID: {id}
        </p>
        <Link to="/" className="glow-btn-primary">
          <ArrowLeft size={16} /> Back to Catalogue
        </Link>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '5rem' }}>
      {/* Immersive Backdrop Header */}
      <div
        style={{
          position: 'relative',
          minHeight: '440px',
          width: '100%',
          display: 'flex',
          alignItems: 'flex-end',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <img
          src={item.backdropUrl || item.posterUrl}
          alt={item.title}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 25%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(9, 12, 21, 0.4) 0%, rgba(9, 12, 21, 0.85) 65%, #090c15 100%)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 10, maxWidth: '1440px', margin: '0 auto', width: '100%', padding: '2rem' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              fontWeight: 600,
              background: 'rgba(15, 23, 42, 0.8)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.5rem',
            }}
          >
            <ArrowLeft size={16} /> Back to Explore
          </Link>

          <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.75rem' }}>{item.title}</h1>

          {/* Quick Tags */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span
              style={{
                background: 'var(--primary)',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              {item.type}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{item.releaseYear}</span>
            {item.duration && (
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} /> {item.duration} mins
              </span>
            )}
            <span style={{ color: '#fbbf24', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Star size={14} fill="#fbbf24" color="#fbbf24" /> {item.rating.toFixed(1)} / 10
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Info */}
      <div
        style={{
          maxWidth: '1440px',
          margin: '2rem auto 0',
          padding: '0 2rem',
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 340px) 1fr',
          gap: '2.5rem',
        }}
      >
        {/* Left Column: Poster + Interactive Rating Card */}
        <div>
          <img
            src={item.posterUrl}
            alt={item.title}
            style={{
              width: '100%',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.5rem',
            }}
          />

          {/* User Rating Action Card */}
          <div
            style={{
              background: 'var(--bg-card)',
              padding: '1.5rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Your Rating & Taste Profile
            </span>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Rating this title tunes your recommendation model in real-time.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.25rem' }}>
              <RatingWidget contentId={item.contentId} size="lg" />
            </div>
          </div>
        </div>

        {/* Right Column: Synopsis, Cast, Metadata & Similar Recommendations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Synopsis */}
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Synopsis</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '1.05rem' }}>
              {item.description || 'No detailed description available.'}
            </p>
          </div>

          {/* Cast & Details Info */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.25rem',
              background: 'rgba(15, 23, 42, 0.5)',
              padding: '1.5rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {item.director && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Director / Creator
                </span>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '2px' }}>{item.director}</p>
              </div>
            )}
            {item.cast && item.cast.length > 0 && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Featuring
                </span>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '2px' }}>{item.cast.join(', ')}</p>
              </div>
            )}
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Genres
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                {item.genre.map((g) => (
                  <span
                    key={g}
                    style={{
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
            {item.language && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Language
                </span>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '2px' }}>{item.language}</p>
              </div>
            )}
          </div>

          {/* Similar Items Row (Item-Item Collaborative & Content Similarity) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Sparkles size={18} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>More Like This (C++ Vector Similarity)</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {similar.map((sim) => {
                if (!sim.item) return null;
                return <ContentCard key={sim.contentId} item={sim.item} score={sim.score} reason={sim.reason} />;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
