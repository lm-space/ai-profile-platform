import React from 'react';
import { MermaidDiagram } from './MermaidDiagram';

interface DiagramViewerProps {
  syntax: string;
  title: string;
  type: string;
}

/**
 * Standalone diagram page wrapper (/diagram route).
 * Rendering itself lives in MermaidDiagram so the chat view and this page
 * share one mermaid init and one render path.
 */
export function DiagramViewer({ syntax, title, type }: DiagramViewerProps) {
  return (
    <div className="diagram-container">
      <div className="diagram-header">
        <h4 className="diagram-title">📊 {title}</h4>
        <span className="diagram-type-badge">{type}</span>
      </div>
      <MermaidDiagram syntax={syntax} id="standalone" />
    </div>
  );
}
