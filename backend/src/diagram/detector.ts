/**
 * Diagram Detection Module
 * Analyzes user messages to determine if a flow diagram is needed
 */

export type DiagramType = 'flowchart' | 'sequence' | 'architecture' | 'class';

export interface DiagramDetectionResult {
  needsDiagram: boolean;
  type?: DiagramType;
  topic?: string;
  confidence: number; // 0-1 scale
  keywords: string[];
  reason?: string;
}

/**
 * Keyword patterns for different diagram types
 * All keywords are pre-lowercased for O(1) comparison
 */
const DIAGRAM_KEYWORDS: Record<DiagramType, string[]> = {
  flowchart: [
    'flow', 'flowchart', 'process', 'steps', 'procedure',
    'workflow', 'sequence of', 'how it works', 'pipeline',
    'stages', 'phases', 'progression', 'ci/cd', 'cicd',
    'checkout', 'lifecycle', 'how does', 'what happens when'
  ],
  architecture: [
    'architecture', 'how would you build', 'design', 'system design',
    'infrastructure', 'components', 'layers', 'structure',
    'microservices', 'distributed', 'setup', 'deploy',
    'integration', 'show me the', 'how would you architect',
    'tech stack', 'what does your'
  ],
  sequence: [
    'interaction', 'sequence', 'communication', 'request', 'response',
    'flow between', 'message flow', 'data flow', 'exchange',
    'concurrent', 'parallel', 'async'
  ],
  class: [
    'class diagram', 'structure', 'relationships', 'entities',
    'database schema', 'model', 'domain model', 'object model'
  ]
};

/**
 * Extract topic/context from user message
 */
function extractTopic(message: string): string {
  const cleaned = message
    .replace(/^(how|what|can you|would you|tell me|show me|explain)\s+/i, '')
    .replace(/\?$/g, '')
    .trim();
  return cleaned.substring(0, 50);
}

/**
 * Calculate confidence score based on keyword matches
 * Uses pre-lowercased message to avoid redundant toLowerCase calls
 */
function calculateConfidence(
  lowerMessage: string,
  type: DiagramType,
  keywords: string[]
): number {
  // SUPER BOOST: Explicit diagram type mention
  if (lowerMessage.includes('flow diagram') || lowerMessage.includes('architecture diagram') ||
      lowerMessage.includes('sequence diagram') || lowerMessage.includes('class diagram')) {
    return 0.95;
  }

  // Base score from keyword matches
  let score = Math.min(keywords.length * 0.15, 0.8);

  // Boost for explicit "flow" or "diagram" keywords
  if (lowerMessage.includes('flow') || lowerMessage.includes('diagram')) {
    score += 0.2;
  }

  // Boost for architecture-specific keywords
  if (type === 'architecture') {
    if (lowerMessage.includes('how would you build') || lowerMessage.includes('architecture') ||
        lowerMessage.includes('how would you architect')) {
      score += 0.25;
    }
    if (lowerMessage.includes('design')) {
      score += 0.25;
      // Additional boost for system/infrastructure keywords with design
      if (lowerMessage.includes('system') || lowerMessage.includes('payment') ||
          lowerMessage.includes('infrastructure') || lowerMessage.includes('platform')) {
        score += 0.1;
      }
    }
    // Boost for "show me" + architecture context
    if (lowerMessage.includes('show me') || lowerMessage.includes('what does your')) {
      score += 0.15;
    }
    // Boost for integration/sap/erp context
    if (lowerMessage.includes('integration') || lowerMessage.includes('sap') ||
        lowerMessage.includes('erp') || lowerMessage.includes('kubernetes')) {
      score += 0.1;
    }
  }

  // Boost for flowchart CI/CD and pipeline context
  if (type === 'flowchart') {
    if (lowerMessage.includes('ci/cd') || lowerMessage.includes('cicd') ||
        lowerMessage.includes('pipeline')) {
      score += 0.2;
    }
    if (lowerMessage.includes('checkout') || lowerMessage.includes('lifecycle')) {
      score += 0.15;
    }
    if (lowerMessage.includes('look like') || lowerMessage.includes('how does') ||
        lowerMessage.includes('what does')) {
      score += 0.1;
    }
  }

  return Math.min(score, 1.0);
}

/**
 * Find matching keywords in message (uses pre-lowercased message)
 */
function findMatchingKeywords(lowerMessage: string, type: DiagramType): string[] {
  return DIAGRAM_KEYWORDS[type].filter(keyword => lowerMessage.includes(keyword));
}

/**
 * Determine the best diagram type based on message (uses pre-lowercased message)
 */
function determineDiagramType(lowerMessage: string): DiagramType {
  if (lowerMessage.includes('architecture') ||
      lowerMessage.includes('how would you build') ||
      lowerMessage.includes('how would you architect') ||
      lowerMessage.includes('system design') ||
      lowerMessage.includes('integration') ||
      (lowerMessage.includes('design') &&
       (lowerMessage.includes('system') || lowerMessage.includes('build') ||
        lowerMessage.includes('payment') || lowerMessage.includes('platform')))) {
    return 'architecture';
  }

  if (lowerMessage.includes('sequence') ||
      lowerMessage.includes('interaction') ||
      lowerMessage.includes('message flow')) {
    return 'sequence';
  }

  if (lowerMessage.includes('class') ||
      lowerMessage.includes('database schema') ||
      lowerMessage.includes('model')) {
    return 'class';
  }

  return 'flowchart';
}

/**
 * Main detection function
 * Analyzes a user message to determine if a diagram is needed
 */
export function detectDiagramRequest(message: string): DiagramDetectionResult {
  if (!message || message.trim().length < 10) {
    return {
      needsDiagram: false,
      confidence: 0,
      keywords: [],
      reason: 'Message too short'
    };
  }

  // Lowercase once, reuse everywhere
  const lowerMessage = message.toLowerCase();

  const type = determineDiagramType(lowerMessage);
  let keywords = findMatchingKeywords(lowerMessage, type);

  // Also check other diagram types for keywords (cross-type matching)
  if (keywords.length === 0) {
    const allTypes: DiagramType[] = ['flowchart', 'architecture', 'sequence', 'class'];
    for (const t of allTypes) {
      if (t === type) continue;
      const otherKeywords = findMatchingKeywords(lowerMessage, t);
      if (otherKeywords.length > keywords.length) {
        keywords = otherKeywords;
      }
    }
  }

  if (keywords.length === 0) {
    return {
      needsDiagram: false,
      confidence: 0,
      keywords: [],
      reason: 'No diagram keywords found'
    };
  }

  const confidence = calculateConfidence(lowerMessage, type, keywords);
  const needsDiagram = confidence >= 0.4;

  return {
    needsDiagram,
    type: needsDiagram ? type : undefined,
    topic: needsDiagram ? extractTopic(message) : undefined,
    confidence,
    keywords,
    reason: needsDiagram ? 'Diagram requested' : 'Confidence too low'
  };
}
