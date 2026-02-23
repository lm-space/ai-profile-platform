-- Migration: 0002_create_diagrams_table.sql
-- Creates diagrams table for storing generated Mermaid diagrams

CREATE TABLE IF NOT EXISTS diagrams_generated (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  diagram_type TEXT NOT NULL,
  diagram_syntax TEXT NOT NULL,
  diagram_title TEXT,
  topic TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  viewed_count INTEGER DEFAULT 0,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_diagrams_conversation ON diagrams_generated(conversation_id);
CREATE INDEX IF NOT EXISTS idx_diagrams_message ON diagrams_generated(message_id);
CREATE INDEX IF NOT EXISTS idx_diagrams_type ON diagrams_generated(diagram_type);
CREATE INDEX IF NOT EXISTS idx_diagrams_created ON diagrams_generated(created_at);
