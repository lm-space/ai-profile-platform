-- Migration: 0001_create_knowledge_base.sql
-- Creates RAG knowledge base tables for semantic search

-- Documents table (source files)
CREATE TABLE IF NOT EXISTS kb_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  source_path TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Chunks table (semantic segments for retrieval)
CREATE TABLE IF NOT EXISTS kb_chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  heading TEXT,
  embedding BLOB NOT NULL,
  token_count INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES kb_documents(id) ON DELETE CASCADE
);

-- Full-text search index
CREATE VIRTUAL TABLE IF NOT EXISTS kb_chunks_fts USING fts5(
  content,
  heading,
  content='kb_chunks',
  content_rowid='id'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS kb_chunks_ai AFTER INSERT ON kb_chunks BEGIN
  INSERT INTO kb_chunks_fts(rowid, content, heading)
  VALUES (new.id, new.content, new.heading);
END;

CREATE TRIGGER IF NOT EXISTS kb_chunks_ad AFTER DELETE ON kb_chunks BEGIN
  DELETE FROM kb_chunks_fts WHERE rowid = old.id;
END;

CREATE TRIGGER IF NOT EXISTS kb_chunks_au AFTER UPDATE ON kb_chunks BEGIN
  UPDATE kb_chunks_fts
  SET content = new.content, heading = new.heading
  WHERE rowid = new.id;
END;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chunks_document ON kb_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_documents_slug ON kb_documents(slug);
CREATE INDEX IF NOT EXISTS idx_documents_type ON kb_documents(doc_type);
