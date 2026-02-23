/**
 * Real-world scenario test: Chat endpoint with diagram generation
 * Simulates actual user interactions and backend processing
 */

import { detectDiagramRequest } from '../src/diagram/detector';
import { generateDiagram } from '../src/diagram/generator';
import { validateMermaidSyntax } from '../src/diagram/validator';

// Mock AI that returns realistic Mermaid diagrams
class RealisticMockAi {
  async run(model: string, options: any): Promise<any> {
    const diagramResponses: { [key: string]: string } = {
      'Architecture: ecommerce platform': `graph TB
    Client["👥 Client App"]
    API["🔌 API Gateway"]
    Auth["🔐 Auth Service"]
    Product["📦 Product Service"]
    Order["🛒 Order Service"]
    Payment["💳 Payment Service"]
    DB[(Database)]
    Cache["⚡ Redis Cache"]

    Client -->|Request| API
    API -->|Authenticate| Auth
    API -->|Fetch| Product
    API -->|Create| Order
    Order -->|Process| Payment
    Product --> Cache
    Payment --> DB
    Order --> DB`,

      'Flowchart: checkout process': `flowchart TD
    A["🛍️ Browse Products"]
    B["🛒 Add to Cart"]
    C{Cart Empty?}
    D["📋 Review Cart"]
    E{Apply Coupon?}
    F["💳 Enter Payment"]
    G{Payment Valid?}
    H["✅ Order Complete"]
    I["❌ Payment Failed"]

    A --> B
    B --> C
    C -->|No| D
    C -->|Yes| A
    D --> E
    E -->|Yes| D
    E -->|No| F
    F --> G
    G -->|Yes| H
    G -->|No| I
    I --> F`,

      'Sequence: microservices communication': `sequenceDiagram
    participant Client
    participant API
    participant Auth as Auth Service
    participant Inventory
    participant Payment
    participant DB

    Client->>API: POST /order
    API->>Auth: Verify Token
    Auth-->>API: ✓ Valid
    API->>Inventory: Check Stock
    Inventory-->>API: ✓ In Stock
    API->>Payment: Process Payment
    Payment-->>API: ✓ Charged
    API->>DB: Save Order
    DB-->>API: ✓ Saved
    API-->>Client: Order Created`
    };

    // Pick response based on confidence (simulate real LLM behavior)
    const keys = Object.keys(diagramResponses);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];

    return { response: diagramResponses[randomKey] };
  }
}

// Simulate a database insert
function simulateDbInsert(diagram: any): string {
  return `Stored in DB: diagram_${Math.random().toString(36).substring(7)}`;
}

async function testRealWorldScenario(): Promise<void> {
  console.log('\n🌍 REAL-WORLD SCENARIO TEST');
  console.log('Simulating actual chat endpoint processing\n');

  // Real user scenarios
  const userScenarios = [
    {
      sessionId: 'user-123',
      message: 'How would you design an eCommerce platform architecture?',
      expectedType: 'architecture'
    },
    {
      sessionId: 'user-456',
      message: 'Walk me through the checkout process flow',
      expectedType: 'flowchart'
    },
    {
      sessionId: 'user-789',
      message: 'Tell me how microservices communicate with each other',
      expectedType: 'sequence'
    },
    {
      sessionId: 'user-101',
      message: 'What skills do you have in PHP?',
      expectedType: null // Should not generate diagram
    }
  ];

  const mockAi = new RealisticMockAi();
  const results: any[] = [];

  for (const scenario of userScenarios) {
    console.log(`\n${'━'.repeat(60)}`);
    console.log(`👤 User Session: ${scenario.sessionId}`);
    console.log(`${'━'.repeat(60)}`);
    console.log(`💬 Message: "${scenario.message}"\n`);

    // Step 1: Detect diagram request
    const detection = detectDiagramRequest(scenario.message);
    console.log(`[Step 1] Diagram Detection:`);
    console.log(`  ├─ Needs Diagram: ${detection.needsDiagram}`);
    console.log(`  ├─ Type: ${detection.type || 'N/A'}`);
    console.log(`  ├─ Confidence: ${(detection.confidence * 100).toFixed(0)}%`);
    console.log(`  └─ Keywords: ${detection.keywords.join(', ') || 'None'}\n`);

    if (!detection.needsDiagram) {
      console.log(`⏭️  Skipping diagram generation (confidence too low)\n`);
      results.push({
        sessionId: scenario.sessionId,
        status: 'skipped',
        reason: 'low_confidence'
      });
      continue;
    }

    // Step 2: Generate diagram using AI
    console.log(`[Step 2] Diagram Generation (Mistral 7B):`);
    try {
      const generated = await generateDiagram({
        type: detection.type!,
        topic: detection.topic || 'Unknown',
        userMessage: scenario.message
      }, mockAi as any);

      console.log(`  ├─ Title: "${generated.title}"`);
      console.log(`  ├─ Syntax Length: ${generated.syntax.length} characters`);
      console.log(`  ├─ First Line: "${generated.syntax.split('\n')[0]}"`);
      console.log(`  └─ Extracted Successfully: ${generated.extractedSuccessfully}\n`);

      // Step 3: Validate generated diagram
      console.log(`[Step 3] Diagram Validation:`);
      const validation = validateMermaidSyntax(generated.syntax, detection.type!);
      console.log(`  ├─ Is Valid: ${validation.isValid}`);

      if (validation.errors.length > 0) {
        console.log(`  ├─ Errors: ${validation.errors.join('; ')}`);
      }
      if (validation.warnings.length > 0) {
        console.log(`  ├─ Warnings: ${validation.warnings.join('; ')}`);
      }

      if (validation.isValid && generated.extractedSuccessfully) {
        // Step 4: Store in database
        console.log(`  └─ Status: ✅ Valid\n`);
        console.log(`[Step 4] Database Storage:`);
        const dbId = simulateDbInsert(generated);
        console.log(`  └─ ${dbId}\n`);

        console.log(`✅ SUCCESS - Diagram stored and ready for frontend rendering\n`);
        results.push({
          sessionId: scenario.sessionId,
          status: 'success',
          type: generated.type,
          title: generated.title,
          syntaxLength: generated.syntax.length,
          dbId
        });
      } else {
        console.log(`  └─ Status: ⚠️  Invalid\n`);
        console.log(`⏭️  Skipping storage (validation failed)\n`);
        results.push({
          sessionId: scenario.sessionId,
          status: 'validation_failed',
          errors: validation.errors
        });
      }
    } catch (error: any) {
      console.log(`❌ Generation Error: ${error.message}\n`);
      results.push({
        sessionId: scenario.sessionId,
        status: 'error',
        error: error.message
      });
    }
  }

  // Summary
  console.log(`\n${'═'.repeat(60)}`);
  console.log('📊 TEST SUMMARY');
  console.log(`${'═'.repeat(60)}\n`);

  const successCount = results.filter(r => r.status === 'success').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;
  const failedCount = results.filter(r => r.status === 'validation_failed').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  console.log(`Total Scenarios: ${results.length}`);
  console.log(`  ✅ Successful: ${successCount}`);
  console.log(`  ⏭️  Skipped: ${skippedCount}`);
  console.log(`  ⚠️  Validation Failed: ${failedCount}`);
  console.log(`  ❌ Errors: ${errorCount}\n`);

  // Show successful diagrams
  if (successCount > 0) {
    console.log('📈 Generated Diagrams:');
    results.filter(r => r.status === 'success').forEach(r => {
      console.log(`  • ${r.title} (${r.syntaxLength} chars) → ${r.dbId}`);
    });
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log('✅ REAL-WORLD TEST COMPLETE');
  console.log(`${'═'.repeat(60)}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testRealWorldScenario();
}

export { testRealWorldScenario };
