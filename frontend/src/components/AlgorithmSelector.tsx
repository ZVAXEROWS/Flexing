import React from 'react';
import { AlgorithmType } from '../types';
import { Sparkles, Network, Cpu } from 'lucide-react';

interface AlgorithmSelectorProps {
  selected: AlgorithmType;
  onChange: (algo: AlgorithmType) => void;
}

export const AlgorithmSelector: React.FC<AlgorithmSelectorProps> = ({ selected, onChange }) => {
  const algorithms: { id: AlgorithmType; name: string; icon: React.ReactNode; tooltip: string }[] = [
    {
      id: 'mf',
      name: 'Matrix Factorization (MF)',
      icon: <Sparkles size={16} />,
      tooltip: 'SVD Latent Factor decomposition for high personalization accuracy',
    },
    {
      id: 'knn',
      name: 'KNN Collaborative',
      icon: <Network size={16} />,
      tooltip: 'K-Nearest Neighbors user & item cosine similarity clustering',
    },
    {
      id: 'ncf',
      name: 'Neural CF (Deep Learning)',
      icon: <Cpu size={16} />,
      tooltip: 'Multi-layer Perceptron capturing non-linear user-item interactions',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Sparkles size={14} color="var(--primary)" /> AI Model:
        </span>
        <div
          style={{
            display: 'inline-flex',
            background: 'rgba(15, 23, 42, 0.85)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            gap: '4px',
          }}
        >
          {algorithms.map((algo) => {
            const isSelected = selected === algo.id;
            return (
              <button
                key={algo.id}
                type="button"
                onClick={() => onChange(algo.id)}
                title={algo.tooltip}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: isSelected ? 600 : 500,
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  background: isSelected ? 'var(--grad-primary)' : 'transparent',
                  boxShadow: isSelected ? '0 2px 10px rgba(139, 92, 246, 0.35)' : 'none',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {algo.icon}
                <span>{algo.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
