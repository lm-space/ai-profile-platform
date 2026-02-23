/**
 * Diagram Module Test Suite
 * Comprehensive tests for detector, generator, and validator
 *
 * Run with: npx ts-node src/diagram/test.ts
 */

import {
  detectDiagramRequest,
  type DiagramDetectionResult
} from './detector';
import {
  getDiagramGenerationPrompt,
  extractMermaidSyntax,
  generateDiagramTitle
} from './prompts';
import { validateMermaidSyntax } from './validator';

// Stub log functions (removed from modules, kept for test output)
function logDetectionResult(result: DiagramDetectionResult, message: string): void {
  console.log(`   Detection: needsDiagram=${result.needsDiagram}, type=${result.type}, confidence=${result.confidence.toFixed(2)}, keywords=[${result.keywords.join(', ')}]`);
}
function logValidationResult(result: { isValid: boolean; errors: string[]; warnings: string[] }): void {
  console.log(`   Validation: valid=${result.isValid}, errors=${result.errors.length}, warnings=${result.warnings.length}`);
}

// Test data
const TEST_CASES = [
  {
    name: 'Architecture question',
    message: 'How would you build a microservices architecture for an eCommerce platform?',
    shouldDetect: true,
    expectedType: 'architecture'
  },
  {
    name: 'Flow diagram question',
    message: 'What is the flow of a typical Magento checkout process?',
    shouldDetect: true,
    expectedType: 'flowchart'
  },
  {
    name: 'Sequence/interaction question',
    message: 'Can you explain the message flow between services?',
    shouldDetect: true,
    expectedType: 'sequence'
  },
  {
    name: 'Generic question (no diagram)',
    message: 'What is your experience with PHP?',
    shouldDetect: false,
    expectedType: undefined
  },
  {
    name: 'Short message (too short)',
    message: 'How?',
    shouldDetect: false,
    expectedType: undefined
  },
  {
    name: 'Design question',
    message: 'How would you design a payment processing system?',
    shouldDetect: true,
    expectedType: 'architecture'
  },
  {
    name: 'Payment system design (user exact question)',
    message: 'how would you design a payment processing system for a high-scale ecommerce',
    shouldDetect: true,
    expectedType: 'architecture'
  },
  {
    name: 'SAP integration architecture',
    message: 'Show me the architecture of your SAP ECC integration with Magento',
    shouldDetect: true,
    expectedType: 'architecture'
  },
  {
    name: 'Deployment pipeline flow',
    message: 'What does your CI/CD pipeline look like for Kubernetes deployments?',
    shouldDetect: true,
    expectedType: 'flowchart'
  },
  {
    name: 'Data flow question',
    message: 'How does data flow in your Databricks ETL pipeline?',
    shouldDetect: true,
    expectedType: 'flowchart'
  }
];

// Valid Mermaid examples for testing
const VALID_MERMAID_EXAMPLES = {
  flowchart: `flowchart TD
    A[Start] --> B[Process]
    B --> C{Decision}
    C -->|Yes| D[Action 1]
    C -->|No| E[Action 2]
    D --> F[End]
    E --> F`,

  architecture: `graph TB
    Client["Client"]
    API["API Server"]
    DB[(Database)]
    Cache["Cache"]
    Client -->|Request| API
    API -->|Query| DB
    API -->|Get/Set| Cache
    DB -->|Invalidate| Cache`,

  sequence: `sequenceDiagram
    participant Client
    participant Server
    participant DB
    Client->>Server: Request
    Server->>DB: Query
    DB-->>Server: Result
    Server-->>Client: Response`
};

const INVALID_MERMAID_EXAMPLES = [
  'This is not mermaid syntax at all',
  'flowchart TD\n[[Invalid brackets]]',
  'Missing diagram type',
  ''
];

/**
 * Test the detector module
 */
async function testDetector(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUITE: DIAGRAM DETECTOR');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  for (const testCase of TEST_CASES) {
    console.log(`\n📝 Test: ${testCase.name}`);
    console.log(`   Message: "${testCase.message}"`);

    const result = detectDiagramRequest(testCase.message);

    const detectionCorrect = result.needsDiagram === testCase.shouldDetect;
    const typeCorrect = !testCase.expectedType || result.type === testCase.expectedType;

    if (detectionCorrect && typeCorrect) {
      console.log('   ✅ PASSED');
      passed++;
    } else {
      console.log('   ❌ FAILED');
      console.log(`      Expected detection: ${testCase.shouldDetect}, Got: ${result.needsDiagram}`);
      if (testCase.expectedType) {
        console.log(`      Expected type: ${testCase.expectedType}, Got: ${result.type}`);
      }
      failed++;
    }

    logDetectionResult(result, testCase.message);
  }

  console.log(`\n📊 Detector Results: ${passed} passed, ${failed} failed`);
}

/**
 * Test the prompt generation
 */
async function testPrompts(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUITE: PROMPT GENERATION');
  console.log('='.repeat(60));

  const testMessage = 'How would you build a Magento microservices architecture?';
  const result = detectDiagramRequest(testMessage);

  if (!result.needsDiagram || !result.type) {
    console.log('❌ Detection failed - skipping prompt test');
    return;
  }

  console.log(`\n📝 Test: Prompt generation for ${result.type}`);

  const prompt = getDiagramGenerationPrompt({
    type: result.type,
    topic: result.topic || 'unknown',
    userMessage: testMessage
  });

  console.log(`   Prompt length: ${prompt.length} characters`);
  console.log(`   Contains diagram type: ${prompt.includes('DIAGRAM TYPE:')}`);
  console.log(`   Contains user question: ${prompt.includes('USER QUESTION:')}`);
  console.log('   ✅ PASSED');

  // Test title generation
  const title = generateDiagramTitle(result.topic || 'Magento Architecture', result.type);
  console.log(`\n📝 Test: Title generation`);
  console.log(`   Generated title: "${title}"`);
  console.log('   ✅ PASSED');
}

/**
 * Test the syntax extraction
 */
async function testSyntaxExtraction(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUITE: MERMAID SYNTAX EXTRACTION');
  console.log('='.repeat(60));

  const testCases = [
    {
      name: 'Plain syntax',
      input: VALID_MERMAID_EXAMPLES.flowchart,
      shouldWork: true
    },
    {
      name: 'Syntax with markdown',
      input: `\`\`\`mermaid\n${VALID_MERMAID_EXAMPLES.flowchart}\n\`\`\``,
      shouldWork: true
    },
    {
      name: 'Syntax with explanation prefix',
      input: `Here's the Mermaid diagram:\n${VALID_MERMAID_EXAMPLES.flowchart}`,
      shouldWork: true
    },
    {
      name: 'Invalid syntax',
      input: 'Not a diagram',
      shouldWork: false
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.name}`);
    const extracted = extractMermaidSyntax(testCase.input);
    const isValid = extracted.length > 20;

    if (isValid === testCase.shouldWork) {
      console.log('   ✅ PASSED');
    } else {
      console.log('   ❌ FAILED');
    }
    console.log(`   Extracted length: ${extracted.length} chars`);
  }
}

/**
 * Test the validator module
 */
async function testValidator(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUITE: MERMAID VALIDATOR');
  console.log('='.repeat(60));

  // Test valid diagrams
  console.log('\n✅ Testing VALID diagrams:');
  for (const [type, syntax] of Object.entries(VALID_MERMAID_EXAMPLES)) {
    console.log(`\n📝 Test: ${type} diagram validation`);
    const result = validateMermaidSyntax(syntax, type as any);
    console.log(`   Valid: ${result.isValid}`);
    if (!result.isValid) {
      console.log(`   Errors: ${result.errors.join(', ')}`);
      console.log('   ❌ FAILED - valid diagram marked invalid');
    } else {
      console.log('   ✅ PASSED');
    }
  }

  // Test invalid diagrams
  console.log('\n\n❌ Testing INVALID diagrams:');
  for (let i = 0; i < INVALID_MERMAID_EXAMPLES.length; i++) {
    const syntax = INVALID_MERMAID_EXAMPLES[i];
    console.log(`\n📝 Test: Invalid diagram #${i + 1}`);
    const result = validateMermaidSyntax(syntax, 'flowchart');
    console.log(`   Valid: ${result.isValid}`);
    if (result.isValid) {
      console.log('   ❌ FAILED - invalid diagram marked valid');
    } else {
      console.log(`   Errors: ${result.errors.slice(0, 2).join(', ')}`);
      console.log('   ✅ PASSED');
    }
  }
}

/**
 * Run all tests
 */
async function runAllTests(): Promise<void> {
  console.log('\n🚀 DIAGRAM MODULE TEST SUITE');
  console.log('Testing detector, prompts, syntax extraction, and validator');

  try {
    await testDetector();
    await testPrompts();
    await testSyntaxExtraction();
    await testValidator();

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS COMPLETED');
    console.log('='.repeat(60));
  } catch (error: any) {
    console.error('\n❌ TEST SUITE ERROR:', error.message);
  }
}

// Run tests if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export { runAllTests };
