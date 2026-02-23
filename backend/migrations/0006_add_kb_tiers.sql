-- Migration: 0006_add_kb_tiers.sql
-- Add category and tier to knowledge base for structured retrieval
-- Tier 1 = always included as context (profile, core skills)
-- Tier 2 = included when topic matches (achievements, project list)
-- Tier 3 = included only via RAG search (detailed case studies)

ALTER TABLE kb_documents ADD COLUMN category TEXT DEFAULT 'general';
ALTER TABLE kb_documents ADD COLUMN tier INTEGER DEFAULT 3;

-- Index for tier-based queries
CREATE INDEX IF NOT EXISTS idx_documents_tier ON kb_documents(tier);
CREATE INDEX IF NOT EXISTS idx_documents_category ON kb_documents(category);
