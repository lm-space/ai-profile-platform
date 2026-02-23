/**
 * Edge case and error handling test
 * Tests boundary conditions and error scenarios
 */

import { detectDiagramRequest } from '../src/diagram/detector';
import { validateMermaidSyntax } from '../src/diagram/validator';

async function testEdgeCases(): Promise<void> {
  console.log('\n🔬 EDGE CASE & ERROR HANDLING TEST\n');

  const testCases = [
    {
      category: 'Empty/Null Input',
      tests: [
        { input: '', expected: 'skip', description: 'Empty string' },
        { input: '   ', expected: 'skip', description: 'Whitespace only' },
        { input: 'Hi', expected: 'skip', description: 'Single word' },
        { input: 'How?', expected: 'skip', description: 'Single question' }
      ]
    },
    {
      category: 'Mixed Keywords',
      tests: [
        { input: 'Flow process architecture diagram', expected: 'detect', description: 'Multiple keywords' },
        { input: 'Show a flow design diagram', expected: 'detect', description: 'Design + flow combo' }
      ]
    },
    {
      category: 'Case Sensitivity',
      tests: [
        { input: 'ARCHITECTURE', expected: 'detect', description: 'All uppercase' },
        { input: 'architecture', expected: 'detect', description: 'All lowercase' },
        { input: 'ArChItEcTuRe', expected: 'detect', description: 'Mixed case' }
      ]
    },
    {
      category: 'Special Characters',
      tests: [
        { input: 'How would you build an architecture? (please)', expected: 'detect', description: 'Parentheses' },
        { input: 'Architecture: how it works', expected: 'detect', description: 'Colon' },
        { input: 'Flow/Process...', expected: 'skip', description: 'Ellipsis' }
      ]
    }
  ];

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const category of testCases) {
    console.log(`📋 ${category.category}`);
    console.log(`${'─'.repeat(60)}\n`);

    for (const test of category.tests) {
      totalTests++;
      const result = detectDiagramRequest(test.input);
      const shouldDetect = test.expected === 'detect';
      const didDetect = result.needsDiagram;
      const passed = shouldDetect === didDetect;

      const status = passed ? '✅' : '❌';
      const confidence = (result.confidence * 100).toFixed(0);

      console.log(`${status} ${test.description}`);
      console.log(`   Input: "${test.input}"`);
      console.log(`   Expected: ${test.expected} | Got: ${didDetect ? 'detect' : 'skip'} (${confidence}%)\n`);

      if (passed) {
        passedTests++;
      } else {
        failedTests++;
      }
    }
  }

  // Validation edge cases
  console.log(`\n📋 Diagram Validation Edge Cases`);
  console.log(`${'─'.repeat(60)}\n`);

  const validationCases = [
    {
      syntax: '',
      type: 'flowchart' as any,
      description: 'Empty syntax'
    },
    {
      syntax: 'flowchart TD\nA[Start]',
      type: 'flowchart' as any,
      description: 'Minimal valid flowchart'
    },
    {
      syntax: 'graph TB\n' + Array(60).fill('Node[N]').join('\n'),
      type: 'architecture' as any,
      description: 'Too many nodes (60+ nodes)'
    },
    {
      syntax: 'flowchart TD\nA[Start] --> B[Process] --> C[End]',
      type: 'flowchart' as any,
      description: 'Normal flowchart'
    }
  ];

  for (const test of validationCases) {
    totalTests++;
    const result = validateMermaidSyntax(test.syntax, test.type);
    const status = result.isValid ? '✅' : '❌';

    console.log(`${status} ${test.description}`);
    console.log(`   Valid: ${result.isValid}`);
    if (result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.slice(0, 2).join('; ')}`);
    }
    console.log('');

    if ((test.description === 'Empty syntax' && !result.isValid) ||
        (test.description !== 'Empty syntax' && test.description !== 'Too many nodes' && result.isValid) ||
        (test.description === 'Too many nodes' && !result.isValid)) {
      passedTests++;
    } else {
      failedTests++;
    }
  }

  // Summary
  console.log(`\n${'═'.repeat(60)}`);
  console.log('📊 EDGE CASE TEST RESULTS');
  console.log(`${'═'.repeat(60)}\n`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

  if (failedTests === 0) {
    console.log('✅ All edge cases handled correctly!\n');
  } else {
    console.log(`⚠️  ${failedTests} edge case(s) need attention\n`);
  }

  console.log(`${'═'.repeat(60)}`);
  console.log('✅ EDGE CASE TEST COMPLETE');
  console.log(`${'═'.repeat(60)}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testEdgeCases();
}

export { testEdgeCases };
