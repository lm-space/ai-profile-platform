import React, { useEffect } from 'react';
import mermaid from 'mermaid';
import ReactDOM from 'react-dom/client';

function DiagramPage() {
  const [diagram, setDiagram] = React.useState<{
    type: string;
    syntax: string;
    title: string;
  } | null>(null);
  const [showSyntax, setShowSyntax] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copyStatus, setCopyStatus] = React.useState<'ready' | 'copied'>('ready');

  useEffect(() => {
    // Extract diagram data from URL parameters
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') || 'flowchart';
    const syntax = params.get('syntax') ? decodeURIComponent(params.get('syntax')!) : '';
    const title = params.get('title') ? decodeURIComponent(params.get('title')!) : 'Diagram';

    if (!syntax) {
      setError('No diagram data provided');
      return;
    }

    // Set page title to the diagram title
    document.title = title;

    setDiagram({ type, syntax, title });

    // Initialize Mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: false,
        nodeSpacing: 60,
        rankSpacing: 60,
        curve: 'linear'
      },
      sequence: {
        useMaxWidth: true
      },
      logLevel: 'error'
    });
  }, []);

  useEffect(() => {
    if (!diagram?.syntax) return;

    // Render diagram
    setTimeout(async () => {
      try {
        await mermaid.run();
        setError(null);
      } catch (err) {
        console.error('Mermaid render error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
      }
    }, 0);
  }, [diagram]);

  const handleCopySyntax = async () => {
    if (!diagram?.syntax) return;
    try {
      await navigator.clipboard.writeText(diagram.syntax);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('ready'), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadSvg = () => {
    if (!diagram?.syntax) return;
    try {
      const svgElement = document.querySelector('.mermaid svg');
      if (!svgElement) {
        setError('Diagram not rendered yet. Please wait.');
        return;
      }

      const svgString = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${diagram.title.replace(/\s+/g, '-')}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download SVG:', err);
      setError('Failed to download SVG');
    }
  };

  if (!diagram) {
    return (
      <div className="diagram-page">
        <div className="error-message">
          {error || 'Loading diagram...'}
        </div>
      </div>
    );
  }

  return (
    <div className="diagram-page">
      <div className="diagram-header">
        <a href="/">← Back to Chat</a>
        <div className="diagram-info">
          <h1>{diagram.title}</h1>
          <span className="diagram-type-badge">{diagram.type}</span>
        </div>
      </div>

      <div className="diagram-controls">
        <button
          className="diagram-btn"
          onClick={() => setShowSyntax(!showSyntax)}
        >
          {showSyntax ? '📋 Hide Syntax' : '📋 Show Syntax'}
        </button>
        <button className="diagram-btn" onClick={handleCopySyntax}>
          {copyStatus === 'copied' ? '✓ Copied!' : '📋 Copy Syntax'}
        </button>
        <button className="diagram-btn" onClick={handleDownloadSvg}>
          ⬇️ Download SVG
        </button>
      </div>

      {showSyntax && <pre id="syntax-box">{diagram.syntax}</pre>}

      {error && (
        <div className="error-message">
          ⚠️ {error}
          <details style={{ marginTop: '1rem' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>Show syntax</summary>
            <pre style={{ fontSize: '12px', marginTop: '0.5rem' }}>
              {diagram.syntax}
            </pre>
          </details>
        </div>
      )}

      <div className="diagram-container">
        {!error && <pre className="mermaid">{diagram.syntax}</pre>}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<DiagramPage />);
