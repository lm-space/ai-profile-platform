import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

interface Slide {
  id: number;
  component: React.ReactNode;
}

const SlideshowApp: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const autoPlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Particles for background animation
  const particlesRef = useRef<Array<{ x: number; y: number; color: string }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize particles
  useEffect(() => {
    const particles = [];
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: ['accent', 'accent2', 'accent3'][Math.floor(Math.random() * 3)],
      });
    }
    particlesRef.current = particles;
  }, []);

  // Auto-play logic
  useEffect(() => {
    if (!isAutoPlay || isHovering) {
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current);
      }
      return;
    }

    autoPlayTimeoutRef.current = setTimeout(() => {
      nextSlide();
    }, 6000); // Change slide every 6 seconds

    return () => {
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current);
      }
    };
  }, [isAutoPlay, isHovering, currentSlide]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === ' ') {
        e.preventDefault();
        setIsAutoPlay((prev) => !prev);
      }
      if (e.key === 'Escape') {
        window.location.href = '/';
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nextSlide, prevSlide]);

  // Touch swipe support
  const touchStartRef = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStartRef.current - touchEnd;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
  };

  const progress = ((currentSlide + 1) / slides.length) * 100;

  return (
    <div
      className="slideshow-container"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      ref={containerRef}
    >
      {/* Background */}
      <div className="slideshow-bg"></div>

      {/* Particles */}
      {particlesRef.current.map((particle, idx) => (
        <div
          key={idx}
          className={`particle ${particle.color}`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animation: `float ${8 + idx % 4}s ease-in-out infinite`,
            animationDelay: `${idx * 0.2}s`,
          }}
        ></div>
      ))}

      {/* Slides */}
      <div className="slides-wrapper">
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`slide ${idx === currentSlide ? 'active' : ''}`}
          >
            <div className="slide-content">{slide.component}</div>
          </div>
        ))}
      </div>

      {/* Exit Button */}
      <button
        className="exit-btn"
        onClick={() => (window.location.href = '/')}
        title="Exit (Esc)"
      >
        ✕
      </button>

      {/* Auto-play Indicator */}
      {isAutoPlay && (
        <div className="autoplay-indicator">
          <div className="autoplay-dot"></div>
          <span>Auto-playing</span>
        </div>
      )}

      {/* Controls */}
      <div className="slideshow-controls">
        <button
          className="control-btn"
          onClick={prevSlide}
          disabled={currentSlide === 0}
          title="Previous (←)"
        >
          ←
        </button>
        <div className="progress-info">
          {currentSlide + 1} / {slides.length}
        </div>
        <button
          className="control-btn"
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          title="Next (→)"
        >
          →
        </button>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar" style={{ width: `${progress}%` }}></div>
    </div>
  );
};

// Slide Components
const Slide1Opening: React.FC = () => (
  <>
    <div className="name-reveal">Elamurugan Nallathambi</div>
    <div className="subtitle">Senior Technical Manager & Enterprise Solution Architect</div>
    <div className="stats">
      <div className="stat-box">
        <span className="stat-number">19+</span>
        <span className="stat-label">Years Experience</span>
      </div>
      <div className="stat-box">
        <span className="stat-number">200+</span>
        <span className="stat-label">Stores Delivered</span>
      </div>
      <div className="stat-box">
        <span className="stat-number">10+</span>
        <span className="stat-label">Teams Led</span>
      </div>
    </div>
  </>
);

const Slide2Philosophy: React.FC = () => (
  <>
    <h2 style={{ marginBottom: '2rem' }}>The Philosophy</h2>
    <div className="philosophy-grid">
      <div className="philosophy-card">
        <div className="philosophy-icon">💻</div>
        <h3>Code-First</h3>
        <p>Every decision rooted in clean, maintainable code</p>
      </div>
      <div className="philosophy-card">
        <div className="philosophy-icon">⚙️</div>
        <h3>Automate Everything</h3>
        <p>Eliminate repetition, maximize efficiency</p>
      </div>
      <div className="philosophy-card">
        <div className="philosophy-icon">🌱</div>
        <h3>No-Boundary Learning</h3>
        <p>Master across languages, frameworks, and domains</p>
      </div>
      <div className="philosophy-card">
        <div className="philosophy-icon">⚡</div>
        <h3>Performance is a Feature</h3>
        <p>Speed and reliability are non-negotiable</p>
      </div>
    </div>
  </>
);

const Slide3Timeline: React.FC = () => (
  <>
    <h2 style={{ marginBottom: '2rem' }}>The Journey</h2>
    <div className="timeline-container">
      <div className="timeline-item">
        <div className="timeline-dot"></div>
        <div className="timeline-content">
          <div className="timeline-year">2008-2010</div>
          <div className="timeline-company">Web Development Agency</div>
          <div className="timeline-role">Full-Stack LAMP Developer</div>
        </div>
      </div>
      <div className="timeline-item">
        <div className="timeline-dot"></div>
        <div className="timeline-content">
          <div className="timeline-year">2010-2011</div>
          <div className="timeline-company">Enterprise Services Firm</div>
          <div className="timeline-role">Magento Developer & ERP Integration</div>
        </div>
      </div>
      <div className="timeline-item">
        <div className="timeline-dot"></div>
        <div className="timeline-content">
          <div className="timeline-year">2011-2017</div>
          <div className="timeline-company">Self-Employed — eCommerce Consultancy</div>
          <div className="timeline-role">Founder & Lead Architect (22+ person team, 200+ stores)</div>
        </div>
      </div>
      <div className="timeline-item">
        <div className="timeline-dot"></div>
        <div className="timeline-content">
          <div className="timeline-year">2017-2019</div>
          <div className="timeline-company">Digital Commerce Agency</div>
          <div className="timeline-role">Architect / Full Stack Lead (30+ web apps)</div>
        </div>
      </div>
      <div className="timeline-item">
        <div className="timeline-dot"></div>
        <div className="timeline-content">
          <div className="timeline-year">2019-Present</div>
          <div className="timeline-company">Global Technology Consultancy</div>
          <div className="timeline-role">Senior Technical Manager & Enterprise Architect</div>
        </div>
      </div>
    </div>
  </>
);

const Slide4Numbers: React.FC = () => (
  <>
    <h2 style={{ marginBottom: '2rem' }}>By The Numbers</h2>
    <div className="numbers-grid">
      <div className="number-card">
        <span className="number-value">200+</span>
        <span className="number-label">eCommerce Stores Shipped</span>
      </div>
      <div className="number-card">
        <span className="number-value">500K+</span>
        <span className="number-label">Peak Daily Visitors Served</span>
      </div>
      <div className="number-card">
        <span className="number-value">&lt;2s</span>
        <span className="number-label">Load Time Achieved</span>
      </div>
      <div className="number-card">
        <span className="number-value">70%</span>
        <span className="number-label">Page Load Improvement (6s to &lt;2s)</span>
      </div>
      <div className="number-card">
        <span className="number-value">60%</span>
        <span className="number-label">Incident Response Time Reduction</span>
      </div>
      <div className="number-card">
        <span className="number-value">Zero</span>
        <span className="number-label">Downtime Platform Migrations</span>
      </div>
    </div>
  </>
);

const Slide5Enterprise: React.FC = () => (
  <>
    <div className="project-highlight">
      <h2 className="project-title">Fortune 500 Industrial Packaging</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Enterprise B2B/B2C Commerce Platform with Deep SAP ECC Integration
      </p>
      <div className="project-details">
        <div className="detail-item">
          <div className="detail-label">Team Size</div>
          <div className="detail-value">16 Engineers, 4 Tracks</div>
        </div>
        <div className="detail-item">
          <div className="detail-label">Platform</div>
          <div className="detail-value">Magento Commerce + Azure + AEM</div>
        </div>
        <div className="detail-item">
          <div className="detail-label">Integration</div>
          <div className="detail-value">SAP IDoc/BAPI, EDI X12, Worldpay</div>
        </div>
        <div className="detail-item">
          <div className="detail-label">Architecture</div>
          <div className="detail-value">Azure Logic Apps + Service Bus + .NET</div>
        </div>
      </div>
    </div>
  </>
);

const Slide6Healthcare: React.FC = () => (
  <>
    <div className="achievement-list">
      <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>
        Health & Wellness eCommerce Platform
      </h2>
      <div className="achievement-item">
        <div className="achievement-icon">📈</div>
        <div className="achievement-content">
          <h4>70% Page Load Improvement (6s to &lt;2s)</h4>
          <p>GraphQL optimization, CloudFront edge caching, Brotli compression, and code splitting</p>
        </div>
      </div>
      <div className="achievement-item">
        <div className="achievement-icon">⚙️</div>
        <div className="achievement-content">
          <h4>Zero Downtime Migration — Magento 1 to Headless Magento 2</h4>
          <p>Migrated on AWS EKS with multi-AZ Aurora, Terraform IaC, and HPA autoscaling</p>
        </div>
      </div>
      <div className="achievement-item">
        <div className="achievement-icon">🎯</div>
        <div className="achievement-content">
          <h4>Headless Commerce on Kubernetes</h4>
          <p>Node.js/Express microservices on ECS/Fargate, decoupled React frontend</p>
        </div>
      </div>
    </div>
  </>
);

const Slide7DataAI: React.FC = () => (
  <>
    <h2 style={{ marginBottom: '2rem' }}>Data & AI</h2>
    <div className="tech-showcase">
      <div className="tech-section">
        <h3>Enterprise Pricing & Analytics Platform</h3>
        <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
          Built Spark ETL pipelines and Delta Lake analytics for Fortune 500 consumer products pricing optimization
        </p>
        <div className="tech-tags">
          <span className="tech-tag">Databricks</span>
          <span className="tech-tag">Apache Spark</span>
          <span className="tech-tag">Delta Lake</span>
          <span className="tech-tag">Unity Catalog</span>
        </div>
      </div>
      <div className="tech-section">
        <h3>Education Data Analytics Platform</h3>
        <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
          ETL pipelines aggregating NCES, census, and assessment data for 800+ school districts
        </p>
        <div className="tech-tags">
          <span className="tech-tag">Angular / D3.js</span>
          <span className="tech-tag">ETL Pipelines</span>
          <span className="tech-tag">SQL Server</span>
          <span className="tech-tag">Tableau</span>
        </div>
      </div>
      <div className="tech-section">
        <h3>RAG & Conversational AI</h3>
        <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
          Production RAG pipelines with vector databases, embeddings, and LLM-powered personal assistant apps
        </p>
        <div className="tech-tags">
          <span className="tech-tag">OpenAI / Claude</span>
          <span className="tech-tag">RAG Pipelines</span>
          <span className="tech-tag">Vector DB</span>
          <span className="tech-tag">LangChain</span>
        </div>
      </div>
    </div>
  </>
);

const Slide7bAgentic: React.FC = () => (
  <>
    <h2 style={{ marginBottom: '2rem' }}>Agentic AI Engineering</h2>
    <div className="tech-showcase">
      <div className="tech-section">
        <h3>Production MCP Servers</h3>
        <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
          Live Cloudflare Worker exposing 31 Model Context Protocol tools — memory,
          semantic search, ingestion, consolidation — on D1 + R2 + Vectorize, with
          OAuth and per-session Durable Objects
        </p>
        <div className="tech-tags">
          <span className="tech-tag">MCP</span>
          <span className="tech-tag">Vectorize</span>
          <span className="tech-tag">Durable Objects</span>
          <span className="tech-tag">AI Gateway</span>
        </div>
      </div>
      <div className="tech-section">
        <h3>Multi-Agent Systems &amp; Harnesses</h3>
        <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
          Six agent protocols implemented end to end; ADK orchestrator delegating to
          specialist agents over A2A with request-ID tracing across every hop
        </p>
        <div className="tech-tags">
          <span className="tech-tag">A2A</span>
          <span className="tech-tag">AG-UI</span>
          <span className="tech-tag">Google ADK</span>
          <span className="tech-tag">LangGraph</span>
        </div>
      </div>
      <div className="tech-section">
        <h3>Fine-Tuning &amp; Evaluation</h3>
        <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
          One-command dataset → train → evaluate → report pipeline. Custom harness
          scoring tool-argument accuracy, refusal accuracy, and fabricated IDs as a
          countable hallucination metric
        </p>
        <div className="tech-tags">
          <span className="tech-tag">Unsloth</span>
          <span className="tech-tag">Qwen2.5</span>
          <span className="tech-tag">Eval Harness</span>
          <span className="tech-tag">Guardrails</span>
        </div>
      </div>
    </div>
  </>
);

const AI_CAPABILITIES = [
  'Harness Design', 'Context Engineering', 'Loop Engineering', 'Graph Engineering',
  'MCP', 'Stateless MCP', 'Agentic AI', 'Multi-Agent Systems', 'RAG 2.0',
  'Memory Layers', 'Tool Use', 'Function Calling', 'Vector DBs', 'Fine-Tuning',
  'Evaluation Frameworks', 'Guardrails', 'Observability', 'Prompt Optimization',
  'Synthetic Data', 'Distillation', 'AI Gateways', 'Cost Optimization'
];

const Slide7cCapabilities: React.FC = () => (
  <>
    <h2 style={{ marginBottom: '1rem' }}>The AI Engineering Surface</h2>
    <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)', maxWidth: '52rem' }}>
      Not a reading list — each of these is something I've shipped, measured, or been
      burned by. Ask the agent about any one of them.
    </p>
    <div className="tech-tags" style={{ maxWidth: '62rem', lineHeight: 2.2 }}>
      {AI_CAPABILITIES.map(cap => (
        <span className="tech-tag" key={cap}>{cap}</span>
      ))}
    </div>
  </>
);

const Slide8Stack: React.FC = () => (
  <>
    <h2 style={{ marginBottom: '2rem' }}>The Tech Stack</h2>
    <div className="stack-grid">
      <div className="stack-item">
        <div className="stack-icon">🐘</div>
        <div className="stack-name">PHP</div>
      </div>
      <div className="stack-item">
        <div className="stack-icon">⚡</div>
        <div className="stack-name">Node.js</div>
      </div>
      <div className="stack-item">
        <div className="stack-icon">☕</div>
        <div className="stack-name">Java</div>
      </div>
      <div className="stack-item">
        <div className="stack-icon">.NET</div>
        <div className="stack-name">C#</div>
      </div>
      <div className="stack-item">
        <div className="stack-icon">🐍</div>
        <div className="stack-name">Python</div>
      </div>
      <div className="stack-item">
        <div className="stack-icon">☁️</div>
        <div className="stack-name">AWS</div>
      </div>
      <div className="stack-item">
        <div className="stack-icon">🔵</div>
        <div className="stack-name">Azure</div>
      </div>
      <div className="stack-item">
        <div className="stack-icon">🐳</div>
        <div className="stack-name">Kubernetes</div>
      </div>
    </div>
  </>
);

const Slide9Framework: React.FC = () => (
  <>
    <div className="framework-card">
      <h3>Custom MVC eCommerce Framework</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        Built from the ground up to power enterprise-scale stores
      </p>
      <div className="framework-features">
        <div className="feature-badge">XML Layout System</div>
        <div className="feature-badge">100K+ SKU Support</div>
        <div className="feature-badge">SAP Integration</div>
        <div className="feature-badge">High Performance</div>
      </div>
    </div>
  </>
);

const Slide10Credentials: React.FC = () => (
  <>
    <h2 style={{ marginBottom: '2rem' }}>Certifications</h2>
    <div className="credentials-grid">
      <div className="credential-card">
        <div className="credential-icon">🏆</div>
        <div className="credential-name">AWS Solutions Architect</div>
        <div className="credential-issuer">Amazon Web Services</div>
      </div>
      <div className="credential-card">
        <div className="credential-icon">🎯</div>
        <div className="credential-name">Adobe Commerce Certified Developer Plus</div>
        <div className="credential-issuer">Adobe/Magento</div>
      </div>
      <div className="credential-card">
        <div className="credential-icon">✨</div>
        <div className="credential-name">Enterprise Solutions Architect</div>
        <div className="credential-issuer">Cognizant Technology Solutions</div>
      </div>
    </div>
  </>
);

const Slide11Testimonials: React.FC = () => (
  <>
    <h2 style={{ marginBottom: '2rem' }}>What They Say</h2>
    <div className="testimonials-container">
      <div className="testimonial">
        <div className="testimonial-quote">
          "Any project involving Ela, I knew would be our best."
        </div>
        <div className="testimonial-author">— International IT Consultant</div>
      </div>
      <div className="testimonial">
        <div className="testimonial-quote">
          "Whenever anyone had any issue with bugs, architecture, or implementation — we asked Ela."
        </div>
        <div className="testimonial-author">— CTO, Fleet Services Company</div>
      </div>
    </div>
  </>
);

const Slide12Connect: React.FC = () => (
  <>
    <div className="connect-container">
      <h2 className="connect-title">Let's Connect</h2>
      <p className="connect-subtitle">Ready to solve complex problems together</p>
      <div className="contact-links">
        <a
          href="mailto:elamurugan.nallathambi@gmail.com"
          className="contact-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          📧 Email
        </a>
        <a
          href="https://linkedin.com/in/elamurugan"
          className="contact-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          💼 LinkedIn
        </a>
        <a
          href="/"
          className="contact-link"
        >
          🏠 Portfolio
        </a>
      </div>
      <button
        className="cta-button"
        onClick={() => (window.location.href = '/contact')}
      >
        Get in Touch
      </button>
    </div>
  </>
);

// Slides array
const slides: Slide[] = [
  { id: 1, component: <Slide1Opening /> },
  { id: 2, component: <Slide2Philosophy /> },
  { id: 3, component: <Slide3Timeline /> },
  { id: 4, component: <Slide4Numbers /> },
  { id: 5, component: <Slide5Enterprise /> },
  { id: 6, component: <Slide6Healthcare /> },
  { id: 7, component: <Slide7DataAI /> },
  { id: 8, component: <Slide7bAgentic /> },
  { id: 9, component: <Slide7cCapabilities /> },
  { id: 10, component: <Slide8Stack /> },
  { id: 11, component: <Slide9Framework /> },
  { id: 12, component: <Slide10Credentials /> },
  { id: 13, component: <Slide11Testimonials /> },
  { id: 14, component: <Slide12Connect /> },
];

// Mount app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<SlideshowApp />);
}
