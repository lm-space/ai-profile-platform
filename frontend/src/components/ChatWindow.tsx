import React, { useState, useMemo, RefObject } from 'react';
import { MessageRenderer } from './MessageRenderer';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isIntro?: boolean;
  diagram?: {
    type: string;
    syntax: string;
    title: string;
  };
}

interface ChatWindowProps {
  messages: Message[];
  loading: boolean;
  onSendMessage: (message: string) => void;
  onRestart: () => void;
  messagesEndRef: RefObject<HTMLDivElement>;
  onShowDiagram?: (diagram: Message['diagram']) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

// Constant array — defined outside component to avoid re-creation on every render
// Mix of the original openers and AI-depth prompts. The architecture ones also
// exercise the diagram tool, which is worth showing off early.
const SUGGESTED_QUESTIONS = [
  "Tell me about your background",
  "What have you built with MCP?",
  "How do you evaluate agents and catch hallucination?",
  "Show me a multi-agent architecture you've built",
  "What's your expertise in cloud architecture?",
  "How do you approach system design?",
  "How do you test with Playwright?",
  "How do you keep AI systems cheap enough to ship?",
  "What's your experience with Magento?",
  "Which AI coding tools do you actually use?"
];

export function ChatWindow({
  messages,
  loading,
  onSendMessage,
  onRestart,
  messagesEndRef,
  onShowDiagram,
  isExpanded = false,
  onToggleExpand
}: ChatWindowProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  return (
    <div className={`chat-window ${isExpanded ? 'expanded' : ''}`}>
      {/* Expand/Collapse Toggle - Icon button on left */}
      {onToggleExpand && (
        <div className="chat-expand-toggle-simple">
          <button
            onClick={onToggleExpand}
            title={isExpanded ? 'Collapse to normal view' : 'Expand to full width'}
          >
            {isExpanded ? '⇒' : '⇐'}
          </button>
        </div>
      )}
      <div className="messages-container">
        {messages.length === 0 && (
          <div className="initial-state">
            <div className="initial-icon">💬</div>
            <h2>Start a conversation</h2>
            <p>Ask Ela about architecture, cloud infrastructure, or 14+ years of tech leadership</p>

            <div className="suggested-questions">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  className="question-chip"
                  onClick={() => {
                    onSendMessage(q);
                    setInput('');
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`message-wrapper message-wrapper-${message.role}`} data-intro={message.isIntro ? 'true' : undefined}>
            <div className="message-avatar">
              {message.role === 'user' ? '👤' : '🧠'}
            </div>
            <MessageRenderer message={message} onShowDiagram={onShowDiagram} />
          </div>
        ))}

        {loading && (
          <div className="message message-assistant">
            <div className="message-avatar">🧠</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <form onSubmit={handleSubmit} className="message-form">
          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Ask Ela anything..."
            className="message-input"
            rows={1}
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="send-button"
            title="Send message (Enter)"
          >
            {loading ? '⏳' : '→'}
          </button>
        </form>
        <div className="input-hint">
          Shift + Enter for new line
        </div>

        {messages.length > 0 && (
          <button
            className="restart-button"
            onClick={onRestart}
            title="Start a new conversation"
          >
            🔄 New Session
          </button>
        )}
      </div>
    </div>
  );
}
