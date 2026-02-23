/**
 * Integration test for diagram generation with chat endpoint
 * Tests that detector, generator, and validator work together
 */

import { detectDiagramRequest } from '../src/diagram/detector';
import { generateDiagram } from '../src/diagram/generator';
import { validateMermaidSyntax } from '../src/diagram/validator';

// Mock AI interface for testing
class MockAi {
  async run(model: string, options: any): Promise<any> {
    // Return mock Mermaid diagram for testing
    return {
      response: `flowchart TD
    A[User] --> B[Request]
    B --> C{Valid?}
    C -->|Yes| D[Process]
    C -->|No| E[Error]
    D --> F[Response]
    E --> F`
    };
  }
}

async function testDiagramIntegration(): Promise<void> {
  console.log('\n🧪 DIAGRAM INTEGRATION TEST');
  console.log('Testing full flow: detection → generation → validation\n');

  // Test messages that should trigger diagrams
  const testMessages = [
    'How would you build a microservices architecture for eCommerce?',
    'What is the flow of a typical checkout process?',
    'Can you explain the sequence between payment services?'
  ];

  const mockAi = new MockAi();

  for (const message of testMessages) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📩 Message: "${message}"`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // Step 1: Detect if diagram is needed
    const detection = detectDiagramRequest(message);
    console.log(`\n✓ Step 1 - Detection:
  Needs Diagram: ${detection.needsDiagram}
  Type: ${detection.type || 'N/A'}
  Confidence: ${(detection.confidence * 100).toFixed(1)}%
  Topic: "${detection.topic || 'N/A'}"`);

    if (!detection.needsDiagram) {
      console.log('  ⚠️  Diagram not needed, skipping generation');
      continue;
    }

    // Step 2: Generate diagram
    try {
      const generated = await generateDiagram({
        type: detection.type!,
        topic: detection.topic || 'Unknown',
        userMessage: message
      }, mockAi as any);

      console.log(`\n✓ Step 2 - Generation:
  Type: ${generated.type}
  Title: "${generated.title}"
  Syntax Length: ${generated.syntax.length} chars
  Extracted Successfully: ${generated.extractedSuccessfully}`);

      // Step 3: Validate
      const validation = validateMermaidSyntax(generated.syntax, detection.type!);
      console.log(`\n✓ Step 3 - Validation:
  Is Valid: ${validation.isValid}
  Errors: ${validation.errors.length > 0 ? validation.errors.join('; ') : 'None'}
  Warnings: ${validation.warnings.length > 0 ? validation.warnings.join('; ') : 'None'}`);

      if (validation.isValid && generated.extractedSuccessfully) {
        console.log(`\n✅ SUCCESS - Diagram ready for rendering:
  Type: ${generated.type}
  Title: ${generated.title}
  Syntax: ${generated.syntax.substring(0, 80)}...`);
      } else {
        console.log(`\n⚠️  VALIDATION FAILED - Diagram would be skipped in chat`);
      }
    } catch (error: any) {
      console.log(`\n❌ Generation failed: ${error.message}`);
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log('✅ INTEGRATION TEST COMPLETE');
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  testDiagramIntegration();
}

export { testDiagramIntegration };
