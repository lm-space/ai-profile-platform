import React from 'react';

interface HeroProps {
  onStartChat?: () => void;
}

export function Hero({ onStartChat }: HeroProps) {
  return (
    <div className="hero">
      <div className="hero-content">
        <div className="hero-badge">Tech Architect | Elamurugan Nallathambi</div>

        <h1 className="hero-title">
          Chat with <span className="gradient-text">Ela</span>
        </h1>

        <p className="hero-subtitle">
          Explore architecture, scalable systems, and 14+ years of cloud & eCommerce expertise
        </p>

        <div className="hero-stats">
          <div className="stat">
            <div className="stat-number">14+</div>
            <div className="stat-label">Years Experience</div>
          </div>
          <div className="stat">
            <div className="stat-number">200+</div>
            <div className="stat-label">Projects Delivered</div>
          </div>
          <div className="stat">
            <div className="stat-number">AWS</div>
            <div className="stat-label">Cloud Expert</div>
          </div>
        </div>

        <p className="hero-description">
          Ask about enterprise architecture, Magento/Adobe Commerce, cloud infrastructure,
          team leadership, or anything tech-related. Ela's here to share insights and explore ideas.
        </p>
      </div>

      <div className="hero-background">
        <div className="neural-network">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`node node-${i}`}></div>
          ))}
          <svg className="connections" viewBox="0 0 300 300">
            <line x1="50" y1="50" x2="150" y2="150" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
            <line x1="150" y1="50" x2="100" y2="150" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
            <line x1="250" y1="100" x2="150" y2="150" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
            <line x1="150" y1="150" x2="200" y2="250" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
          </svg>
        </div>
      </div>
    </div>
  );
}
