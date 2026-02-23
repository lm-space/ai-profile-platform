/**
 * Diagram Generation Module
 * Generates Mermaid diagram syntax using AI providers
 */

import type { DiagramType } from './detector';
import type { AIProvider } from '../providers/types';
import {
  getDiagramGenerationPrompt,
  extractMermaidSyntax,
  generateDiagramTitle
} from './prompts';

export interface DiagramGenerationRequest {
  type: DiagramType;
  topic: string;
  userMessage: string;
  ragContext?: string;
}

export interface DiagramGenerationResult {
  type: DiagramType;
  syntax: string;
  title: string;
  extractedSuccessfully: boolean;
}

/**
 * Generate a diagram using the abstract AIProvider
 */
export async function generateDiagramWithProvider(
  request: DiagramGenerationRequest,
  provider: AIProvider,
  temperature: number = 0.3,
  maxTokens: number = 2000
): Promise<DiagramGenerationResult> {
  try {
    const prompt = getDiagramGenerationPrompt({
      type: request.type,
      topic: request.topic,
      userMessage: request.userMessage,
      ragContext: request.ragContext
    });

    // Use system + user message pattern for better model compliance
    const response = await provider.chat({
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: `Generate a detailed ${request.type} Mermaid diagram for: ${request.userMessage}\n\nReturn ONLY the raw Mermaid syntax, nothing else.` }
      ],
      temperature,
      max_tokens: maxTokens
    });

    const rawResponse = response.content || '';
    console.log('[DIAGRAM-GEN] Raw response length:', rawResponse.length, 'First 200 chars:', rawResponse.substring(0, 200));
    const syntax = extractMermaidSyntax(rawResponse);
    const title = generateDiagramTitle(request.topic, request.type);
    console.log('[DIAGRAM-GEN] Extracted syntax length:', syntax.length);

    return {
      type: request.type,
      syntax,
      title,
      extractedSuccessfully: syntax.length > 20
    };
  } catch (error: any) {
    console.error('[DIAGRAM GENERATION ERROR]', error.message);
    throw new Error(`Failed to generate diagram: ${error.message}`);
  }
}

/**
 * Legacy: Generate a diagram using Cloudflare AI binding directly
 */
export async function generateDiagram(
  request: DiagramGenerationRequest,
  ai: Ai
): Promise<DiagramGenerationResult> {
  try {
    const prompt = getDiagramGenerationPrompt({
      type: request.type,
      topic: request.topic,
      userMessage: request.userMessage,
      ragContext: request.ragContext
    });

    const response = (await ai.run(
      '@cf/mistral/mistral-7b-instruct-v0.1',
      {
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.3,
        max_tokens: 2000
      }
    )) as any;

    const rawResponse = response.response || '';
    const syntax = extractMermaidSyntax(rawResponse);
    const title = generateDiagramTitle(request.topic, request.type);

    return {
      type: request.type,
      syntax,
      title,
      extractedSuccessfully: syntax.length > 20
    };
  } catch (error: any) {
    console.error('[DIAGRAM GENERATION ERROR]', error.message);
    throw new Error(`Failed to generate diagram: ${error.message}`);
  }
}

/**
 * Attempt to fix invalid Mermaid syntax
 */
export function attemptFixSyntax(syntax: string): string {
  let fixed = syntax;

  if (!fixed.match(/^(flowchart|graph|sequenceDiagram|classDiagram)/)) {
    fixed = 'flowchart TD\n' + fixed;
  }

  fixed = fixed.replace(/\[\[/g, '[').replace(/\]\]/g, ']');
  fixed = fixed.replace(/^(flowchart|graph)\s+(flowchart|graph)/i, '$1');
  fixed = fixed.replace(/\u2192/g, '-->');

  return fixed.trim();
}
