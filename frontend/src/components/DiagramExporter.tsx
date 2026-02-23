import React from 'react';

interface DiagramExporterProps {
  syntax: string;
  title: string;
}

export function DiagramExporter({ syntax, title }: DiagramExporterProps) {
  const handleCopySyntax = async () => {
    try {
      await navigator.clipboard.writeText(syntax);
      // Silent copy - no alert needed
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadSVG = async () => {
    try {
      // Find the SVG element in the DOM
      const svgElement = document.querySelector('.mermaid-wrapper svg');
      if (!svgElement) {
        alert('Diagram not rendered yet. Please wait.');
        return;
      }

      // Clone and serialize SVG
      const svgClone = svgElement.cloneNode(true) as SVGElement;
      const svgString = new XMLSerializer().serializeToString(svgClone);

      // Create blob and download
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '-')}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download SVG:', err);
      alert('Failed to export diagram');
    }
  };

  return (
    <div className="diagram-toolbar">
      <button
        className="diagram-btn diagram-btn-copy"
        onClick={handleCopySyntax}
        title="Copy Mermaid syntax"
      >
        📋 Copy
      </button>
      <button
        className="diagram-btn diagram-btn-download"
        onClick={handleDownloadSVG}
        title="Download as SVG"
      >
        ⬇️ SVG
      </button>
    </div>
  );
}
