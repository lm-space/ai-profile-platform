import React, { useEffect, useLayoutEffect } from 'react';
import mermaid from 'mermaid';

interface DiagramViewerProps {
  syntax: string;
  title: string;
  type: string;
}

// Initialize Mermaid once at module level (not per-component-mount)
let mermaidInitialized = false;
function ensureMermaidInit() {
  if (mermaidInitialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    flowchart: {
      useMaxWidth: false,
      htmlLabels: false,
      nodeSpacing: 60,
      rankSpacing: 60,
      curve: 'linear'
    },
    sequence: {
      useMaxWidth: false
    },
    logLevel: 'error'
  });
  mermaidInitialized = true;
}

export function DiagramViewer({ syntax, title, type }: DiagramViewerProps) {
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    ensureMermaidInit();
  }, []);

  // Render diagram after DOM update using useLayoutEffect instead of setTimeout hack
  useLayoutEffect(() => {
    if (!syntax) return;

    let cancelled = false;

    (async () => {
      try {
        await mermaid.run();
        if (!cancelled) setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram');
        }
      }
    })();

    return () => { cancelled = true; };
  }, [syntax, title, type]);

  return (
    <div className="diagram-container">
      <div className="diagram-header">
        <h4 className="diagram-title">📊 {title}</h4>
        <span className="diagram-type-badge">{type}</span>
      </div>

      {error ? (
        <div className="diagram-error">
          <p>⚠️ {error}</p>
          <details className="diagram-debug">
            <summary>Show syntax</summary>
            <pre>{syntax}</pre>
          </details>
        </div>
      ) : (
        <pre className="mermaid">{syntax}</pre>
      )}
    </div>
  );
}
