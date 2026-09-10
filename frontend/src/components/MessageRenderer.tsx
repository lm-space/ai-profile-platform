import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MermaidDiagram } from './MermaidDiagram';

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

export function MessageRenderer({ message }: MessageRendererProps) {
  const isUser = message.role === 'user';
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <div className={`message ${message.role}${message.isIntro ? ' intro' : ''}`}>
      <div className="message-content">
        <div className="message-text">
          {isUser ? (
            // User input is plain text — don't run it through a markdown parser.
            <p>{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Anything the model links to is external — open safely.
                a: ({ node, ...props }) => (
                  <a {...props} target="_blank" rel="noopener noreferrer" />
                ),
                // Wide tables and code shouldn't blow out the chat column.
                table: ({ node, ...props }) => (
                  <div className="table-scroll"><table {...props} /></div>
                ),
                pre: ({ node, ...props }) => (
                  <pre className="code-block" {...props} />
                )
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Diagram renders inline. The old version URL-encoded the whole
            Mermaid source into a link, which broke on longer diagrams. */}
        {!isUser && message.diagram?.syntax && (
          <div className="message-diagram">
            <div className="diagram-header">
              <h4 className="diagram-title">📊 {message.diagram.title}</h4>
              <div className="diagram-actions">
                <span className="diagram-type-badge">{message.diagram.type}</span>
                <button
                  className="diagram-expand"
                  onClick={() => setFullscreen(true)}
                  title="View full size"
                >
                  ⛶
                </button>
              </div>
            </div>
            <MermaidDiagram syntax={message.diagram.syntax} id={message.id} />
          </div>
        )}
      </div>

      {fullscreen && message.diagram && (
        <div
          className="diagram-fullscreen"
          role="dialog"
          aria-modal="true"
          aria-label={message.diagram.title}
          onClick={() => setFullscreen(false)}
        >
          <div className="diagram-fullscreen-inner" onClick={(e) => e.stopPropagation()}>
            <div className="diagram-header">
              <h4 className="diagram-title">📊 {message.diagram.title}</h4>
              <div className="diagram-actions">
                <span className="diagram-hint">drag to pan</span>
                <button
                  className="diagram-close"
                  onClick={() => setFullscreen(false)}
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>
            <MermaidDiagram syntax={message.diagram.syntax} id={`${message.id}-full`} fullscreen />
          </div>
        </div>
      )}
    </div>
  );
}
