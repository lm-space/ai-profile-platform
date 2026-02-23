import React from 'react';

export interface MessageWithDiagram {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  isIntro?: boolean;
  diagram?: {
    type: string;
    syntax: string;
    title: string;
  };
}

interface MessageRendererProps {
  message: MessageWithDiagram;
  onShowDiagram?: (diagram: MessageWithDiagram['diagram']) => void;
}

export function MessageRenderer({ message, onShowDiagram }: MessageRendererProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`message ${message.role}${message.isIntro ? ' intro' : ''}`}>
      <div className="message-content">
        {/* Text content */}
        <div className="message-text">
          {message.content.split('\n').map((paragraph, idx) => (
            paragraph.trim() && (
              <p key={idx}>
                {paragraph.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i}>{part.slice(2, -2)}</strong>;
                  }
                  return part;
                })}
              </p>
            )
          ))}
        </div>

        {/* Diagram link (if present and assistant message) */}
        {!isUser && message.diagram && (
          <div className="message-diagram-link">
            <a
              href={`/diagram?type=${encodeURIComponent(message.diagram.type)}&syntax=${encodeURIComponent(message.diagram.syntax)}&title=${encodeURIComponent(message.diagram.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="diagram-link-button"
            >
              📊 View {message.diagram.title} ({message.diagram.type})
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
