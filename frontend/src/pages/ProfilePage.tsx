import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useMyRatings, useDeleteRating } from '../hooks/useRatings';
import { Link } from 'react-router-dom';
import { User, Star, Trash2, Check } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const { data: ratings = [], isLoading: isRatingsLoading } = useMyRatings();
  const deleteRatingMutation = useDeleteRating();

  const [username, setUsername] = useState(user?.username || '');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(user?.preferences?.genres || ['Sci-Fi', 'Tech']);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const availableGenres = ['Sci-Fi', 'Action', 'Drama', 'Tech', 'Comedy', 'Thriller', 'Horror', 'Biography'];

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      username,
      preferences: { genres: selectedGenres },
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleDeleteRating = (ratingId: string) => {
    deleteRatingMutation.mutate(ratingId);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto 5rem', padding: '0 2rem' }}>
      {/* Header Profile Summary */}
      <div
        className="glass-panel"
        style={{
          padding: '2.5rem',
          marginBottom: '2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--grad-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: 800,
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{user?.username || 'Explorer Profile'}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '2px' }}>{user?.email}</p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
              <span
                style={{
                  background: 'rgba(6, 182, 212, 0.15)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  color: 'var(--accent-cyan)',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {ratings.length} Titles Rated
              </span>
              <span
                style={{
                  background: 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  color: 'var(--primary)',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                Model Active: MF + KNN + NCF
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 420px) 1fr', gap: '2.5rem' }}>
        {/* Left Column: Preferences & Profile Form */}
        <div>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} color="var(--primary)" /> Profile & Taste Preferences
            </h3>

            {savedSuccess && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: 'var(--accent-emerald)',
                  padding: '0.6rem 0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Check size={14} /> Profile & preferences updated successfully!
              </div>
            )}

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                  Tuned Genres
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {availableGenres.map((g) => {
                    const isSelected = selectedGenres.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggleGenre(g)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 12px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.8rem',
                          fontWeight: isSelected ? 600 : 500,
                          color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                          background: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                          border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                        }}
                      >
                        {isSelected && <Check size={12} />}
                        <span>{g}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button type="submit" className="glow-btn-primary" style={{ marginTop: '0.5rem' }}>
                Save Preferences
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Rating History List */}
        <div>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Star size={18} color="#fbbf24" /> Your Submitted Ratings
              </h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{ratings.length} Total</span>
            </div>

            {isRatingsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[1, 2, 3].map((n) => (
                  <div key={n} style={{ height: '70px' }} className="skeleton" />
                ))}
              </div>
            ) : ratings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)' }}>
                <p>You haven't rated any content yet.</p>
                <Link to="/" style={{ color: 'var(--primary)', fontWeight: 600, display: 'inline-block', marginTop: '0.5rem' }}>
                  Explore catalogue to start rating
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {ratings.map((rating) => (
                  <div
                    key={rating.ratingId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.875rem 1.25rem',
                      background: 'rgba(15, 23, 42, 0.6)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {rating.posterUrl && (
                        <img
                          src={rating.posterUrl}
                          alt={rating.contentTitle}
                          style={{ width: '40px', height: '54px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                      )}
                      <div>
                        <Link
                          to={`/content/${rating.contentId}`}
                          style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}
                        >
                          {rating.contentTitle || `Item #${rating.contentId}`}
                        </Link>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                          <Star size={14} fill="#fbbf24" color="#fbbf24" />
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24' }}>
                            {rating.score.toFixed(1)} / 5.0
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteRating(rating.ratingId)}
                      title="Remove rating"
                      style={{
                        color: 'var(--text-muted)',
                        padding: '6px',
                        borderRadius: 'var(--radius-sm)',
                        transition: 'color var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-rose)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
