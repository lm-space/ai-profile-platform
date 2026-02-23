import React from 'react';
import { DiagramViewer } from './DiagramViewer';
import { DiagramExporter } from './DiagramExporter';

interface DiagramModalProps {
  diagram: {
    type: string;
    syntax: string;
    title: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DiagramModal({ diagram, isOpen, onClose }: DiagramModalProps) {
  if (!isOpen || !diagram) return null;

  // Validate diagram structure
  if (!diagram.syntax || !diagram.title || !diagram.type) {
    console.warn('Invalid diagram data:', diagram);
    return null;
  }

  // Open diagram in full-page viewer
  const diagramUrl = `/diagram?type=${encodeURIComponent(diagram.type)}&syntax=${encodeURIComponent(diagram.syntax)}&title=${encodeURIComponent(diagram.title)}`;

  React.useEffect(() => {
    if (isOpen) {
      window.open(diagramUrl, '_blank');
      onClose();
    }
  }, [isOpen, diagramUrl, onClose]);

  return null;
}
