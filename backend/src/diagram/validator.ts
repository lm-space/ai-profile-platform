/**
 * Diagram Validation Module
 * Validates Mermaid diagram syntax
 */

import type { DiagramType } from './detector';
import { attemptFixSyntax } from './generator';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  corrected?: string;
  fixAttempted: boolean;
}

/**
 * Validate Mermaid flowchart syntax
 */
function validateFlowchart(syntax: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for diagram type declaration
  if (!syntax.match(/^flowchart\s+(TD|LR|BT|RL|TB)/i)) {
    errors.push('Missing or invalid flowchart declaration (should be: flowchart TD/LR/BT/RL/TB)');
  }

  // Check for basic structure (any arrow type: -->, ==>, -.->)
  if (!syntax.match(/(-->|==>|-.->)/)) {
    warnings.push('No arrows found - diagram may be incomplete');
  }

  // Check for common syntax errors
  if (syntax.match(/\[\[.*?\]\]/)) {
    errors.push('Double brackets found - should be single brackets [...]');
  }

  // Count nodes (basic sanity check)
  const nodeMatches = syntax.match(/\[.*?\]|\{.*?\}|\(.*?\)/g) || [];
  if (nodeMatches.length < 2) {
    warnings.push('Very few nodes found - diagram may be too simple');
  }
  if (nodeMatches.length > 50) {
    errors.push('Too many nodes (50+) - diagram may be too complex');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fixAttempted: false
  };
}

/**
 * Validate Mermaid sequence diagram syntax
 */
function validateSequence(syntax: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for diagram type declaration
  if (!syntax.match(/^sequenceDiagram/i)) {
    errors.push('Missing sequenceDiagram declaration');
  }

  // Check for participants
  if (!syntax.match(/participant\s+\w+/i)) {
    errors.push('No participants defined - sequence diagram needs at least 2');
  }

  // Check for arrows
  if (!syntax.match(/(->>|--|>>)/)) {
    warnings.push('No message arrows found');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fixAttempted: false
  };
}

/**
 * Validate Mermaid graph syntax
 */
function validateGraph(syntax: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for graph declaration
  if (!syntax.match(/^graph\s+(TD|LR|BT|RL|TB)/i)) {
    errors.push('Missing or invalid graph declaration (should be: graph TD/LR/BT/RL/TB)');
  }

  // Check for structure
  if (!syntax.match(/--?>|-->|==>|\.->|\.-/)) {
    warnings.push('No connections found - graph may be incomplete');
  }

  // Count nodes
  const nodeMatches = syntax.match(/\[.*?\]|\(.*?\)|\{.*?\}|".*?"/g) || [];
  if (nodeMatches.length < 2) {
    errors.push('Graph should have at least 2 nodes');
  }
  if (nodeMatches.length > 50) {
    errors.push('Too many nodes (50+) - diagram too complex');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fixAttempted: false
  };
}

/**
 * Validate Mermaid class diagram syntax
 */
function validateClass(syntax: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for diagram type
  if (!syntax.match(/^classDiagram/i)) {
    errors.push('Missing classDiagram declaration');
  }

  // Check for class definitions
  if (!syntax.match(/class\s+\w+/i)) {
    warnings.push('No classes defined');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fixAttempted: false
  };
}

/**
 * Main validation function
 * Validates Mermaid syntax based on diagram type
 */
export function validateMermaidSyntax(
  syntax: string,
  type: DiagramType,
  depth: number = 0
): ValidationResult {
  // Basic checks
  if (!syntax || syntax.trim().length === 0) {
    return {
      isValid: false,
      errors: ['Empty diagram syntax'],
      warnings: [],
      fixAttempted: false
    };
  }

  // Type-specific validation
  let result: ValidationResult;
  switch (type) {
    case 'flowchart':
      result = validateFlowchart(syntax);
      break;
    case 'sequence':
      result = validateSequence(syntax);
      break;
    case 'architecture':
      result = validateGraph(syntax);
      break;
    case 'class':
      result = validateClass(syntax);
      break;
    default:
      result = validateFlowchart(syntax);
  }

  // If invalid and we haven't already tried fixing, attempt one fix
  if (!result.isValid && result.errors.length > 0 && depth < 1) {
    try {
      const corrected = attemptFixSyntax(syntax);
      // Re-validate with incremented depth to prevent infinite recursion
      const revalidation = validateMermaidSyntax(corrected, type, depth + 1);

      if (revalidation.isValid) {
        return {
          ...revalidation,
          corrected,
          fixAttempted: true
        };
      }
    } catch (error) {
      // Ignore fix attempts that fail
    }
  }

  return result;
}

