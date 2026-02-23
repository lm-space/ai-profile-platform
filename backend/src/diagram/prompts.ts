/**
 * Diagram Generation Prompts — Enhanced for Detailed Structural Flows
 * Templates for LLM to generate rich, detailed Mermaid diagram syntax
 */

import type { DiagramType } from './detector';

export interface DiagramPromptContext {
  type: DiagramType;
  topic: string;
  userMessage: string;
  ragContext?: string;
}

/**
 * Generate the core system prompt for diagram generation
 */
function getDiagramSystemPrompt(): string {
  return `You are an expert system architect and technical diagram specialist. Your task is to generate DETAILED, PRODUCTION-QUALITY Mermaid diagram syntax that thoroughly visualizes technical concepts, system architectures, and process flows.

CRITICAL RULES:
1. Generate ONLY valid Mermaid syntax — no explanations, no markdown code fences, no prose
2. Create DETAILED diagrams with 10-30 nodes for thorough coverage
3. Use descriptive, meaningful node labels (full words, not cryptic abbreviations)
4. Use proper Mermaid syntax for your diagram type
5. Ensure the diagram directly and comprehensively answers the user's question
6. Start with the diagram type declaration (flowchart TD, graph TB, sequenceDiagram, classDiagram)
7. Node IDs MUST NOT contain spaces — use underscores (node_id) or camelCase (nodeId)
8. Node labels CAN have spaces if quoted: node_id["Label With Spaces"]
9. All quoted text MUST use double quotes ["text"]
10. Use subgraphs to group related components logically
11. This diagram is being used to illustrate a technical explanation in a professional interview or review setting
12. Show data flow direction, error paths, and edge cases where relevant
13. Include technology names and specifics when the context provides them

BRACKET/QUOTE FORMAT (CRITICAL):
- CORRECT: node_id["Label (with text)"] — bracket and quote together at end
- INCORRECT: node_id["Label (with text)]"] — DO NOT split ] and "
- The format is ALWAYS: ["..."] with ] and " touching
- Never put ] inside the quotes!

SUBGRAPH SYNTAX (for grouping):
subgraph title["Display Title"]
    node1["Node"]
    node2["Node"]
end

STYLING (add at end for visual clarity):
style nodeId fill:#color,stroke:#color,color:#textColor

IMPORTANT: Return ONLY the raw Mermaid syntax, nothing else. Do NOT include markdown code blocks, explanation, or any text other than the diagram syntax.`;
}

/**
 * Generate enhanced flowchart prompt — detailed process flows
 */
function getFlowchartPrompt(context: DiagramPromptContext): string {
  const ragSection = context.ragContext
    ? `\nRELEVANT CONTEXT (use this to add specific details):\n${context.ragContext}\n`
    : '';

  return `${getDiagramSystemPrompt()}

DIAGRAM TYPE: Detailed Flowchart
TOPIC: ${context.topic}
USER QUESTION: ${context.userMessage}
${ragSection}
Generate a COMPREHENSIVE flowchart showing the complete process or workflow. Requirements:

STRUCTURE:
- Use subgraphs to group related phases/stages together
- Include 15-25 nodes for thorough coverage
- Show the complete lifecycle, not just the happy path
- Include error handling paths, decision branches, and edge cases
- Show parallel processes where they exist

NODE TYPES:
- Rectangles for processes/steps: id["Process Name"]
- Rounded for start/end: id([Start/End])
- Diamonds for decisions: id{"Decision?"}
- Parallelogram for I/O: id[/"Input/Output"/]
- Hexagon for preparation: id{{"Prep Step"}}

ARROW LABELS:
- Label all decision branches: -->|Yes| and -->|No|
- Label data flow: -->|"data format"|
- Use dotted lines for optional paths: -.->|"optional"|

INDENTATION (CRITICAL):
- EVERY node definition MUST be indented with 4 spaces after diagram declaration
- EVERY arrow/connection MUST be indented with 4 spaces
- Subgraph contents MUST be indented with 4 additional spaces

FORMAT:
flowchart TD
    subgraph phase1["Phase 1: Name"]
        node1["Step 1"]
        node2["Step 2"]
    end
    subgraph phase2["Phase 2: Name"]
        node3["Step 3"]
        node4{"Decision?"}
    end
    node1 --> node2
    node2 --> node3
    node3 --> node4
    node4 -->|Yes| success([Success])
    node4 -->|No| retry["Retry Logic"]

EXAMPLE (Quality Target):
flowchart TD
    subgraph input["Input Phase"]
        start([Request Received])
        validate["Validate Input Data"]
        auth{"Authenticated?"}
    end
    subgraph processing["Processing Phase"]
        transform["Transform Data"]
        enrich["Enrich with Context"]
        compute["Core Computation"]
    end
    subgraph output["Output Phase"]
        format["Format Response"]
        cache["Update Cache"]
        respond([Return Response])
    end
    start --> validate
    validate --> auth
    auth -->|Yes| transform
    auth -->|No| reject([401 Unauthorized])
    transform --> enrich
    enrich --> compute
    compute --> format
    format --> cache
    cache --> respond

Generate the detailed flowchart for: ${context.topic}`;
}

/**
 * Generate enhanced architecture prompt — detailed system diagrams
 */
function getArchitecturePrompt(context: DiagramPromptContext): string {
  const ragSection = context.ragContext
    ? `\nRELEVANT CONTEXT (use this to add specific details and technology names):\n${context.ragContext}\n`
    : '';

  return `${getDiagramSystemPrompt()}

DIAGRAM TYPE: Detailed Architecture Diagram
TOPIC: ${context.topic}
USER QUESTION: ${context.userMessage}
${ragSection}
Generate a COMPREHENSIVE architecture diagram showing all system components, layers, and interactions. Requirements:

STRUCTURE:
- Use subgraphs to represent architectural layers (Client, API, Service, Data, Infrastructure)
- Include 15-30 nodes covering all major components
- Show data flow direction with labeled arrows
- Include external integrations and third-party services
- Show caching layers, message queues, and middleware where relevant
- Indicate protocols and data formats on connections (HTTP, gRPC, WebSocket, REST, GraphQL)

NODE TYPES:
- Rectangles for services/components: id["Service Name"]
- Cylinders for databases: id[("Database Name")]
- Rounded for external services: id(["External API"])
- Double-border for key components: id[["Core Service"]]
- Hexagon for load balancers/gateways: id{{"API Gateway"}}

GROUPING (use subgraphs for layers):
subgraph client_layer["Client Layer"]
subgraph api_layer["API / Gateway Layer"]
subgraph service_layer["Service / Business Logic Layer"]
subgraph data_layer["Data / Storage Layer"]
subgraph infra_layer["Infrastructure / Cloud Layer"]

FORMATTING RULES (CRITICAL):
- EVERY node definition MUST be indented with 4 spaces after "graph TB"
- EVERY arrow/connection MUST be indented with 4 spaces
- Define each node ID ONLY ONCE at the top of its subgraph, THEN add connections
- NEVER redefine the same node ID with different labels
- Use labeled arrows: -->|"protocol/format"|

FORMAT:
graph TB
    subgraph client["Client Layer"]
        web["Web App (React)"]
        mobile["Mobile App"]
    end
    subgraph api["API Layer"]
        gateway{{"API Gateway"}}
        auth["Auth Service"]
    end
    subgraph services["Service Layer"]
        core[["Core Business Logic"]]
        worker["Background Workers"]
    end
    subgraph data["Data Layer"]
        primary[("Primary DB")]
        cache["Redis Cache"]
        queue["Message Queue"]
    end
    web -->|HTTPS| gateway
    mobile -->|HTTPS| gateway
    gateway -->|JWT| auth
    gateway -->|REST| core
    core -->|SQL| primary
    core -->|R/W| cache
    core -->|Publish| queue
    queue -->|Subscribe| worker
    worker -->|SQL| primary

Generate the detailed architecture for: ${context.topic}`;
}

/**
 * Generate enhanced sequence prompt — detailed interaction flows
 */
function getSequencePrompt(context: DiagramPromptContext): string {
  const ragSection = context.ragContext
    ? `\nRELEVANT CONTEXT (use this to add specific details):\n${context.ragContext}\n`
    : '';

  return `${getDiagramSystemPrompt()}

DIAGRAM TYPE: Detailed Sequence Diagram
TOPIC: ${context.topic}
USER QUESTION: ${context.userMessage}
${ragSection}
Generate a COMPREHENSIVE sequence diagram showing all interactions, data flows, and message exchanges. Requirements:

STRUCTURE:
- Include 4-8 participants covering all actors in the flow
- Show 15-30 messages/interactions for thorough coverage
- Include request AND response messages (bidirectional)
- Show error handling with alt/opt blocks
- Include activation bars for processing time
- Show parallel operations with par blocks where relevant
- Add notes for important details

PARTICIPANT NAMING:
- Use descriptive names: participant Client as "Web Client"
- Group related participants together
- Include external systems and third-party services

MESSAGE TYPES:
- Synchronous: ->>  (solid arrow)
- Asynchronous: -->>  (dashed arrow, for responses)
- Self-call: ->>+  (with activation)
- Note: Note over A,B: Description

ADVANCED BLOCKS:
- alt/else: For conditional flows
- opt: For optional steps
- loop: For repeated operations
- par: For parallel operations
- Note right of / Note left of / Note over: For annotations

FORMAT:
sequenceDiagram
    participant C as "Client"
    participant GW as "API Gateway"
    participant S as "Service"
    participant DB as "Database"
    participant Q as "Queue"

    C->>+GW: POST /api/resource
    GW->>GW: Validate JWT Token
    alt Valid Token
        GW->>+S: Forward Request
        S->>+DB: Query Data
        DB-->>-S: Result Set
        S->>Q: Publish Event
        S-->>-GW: 200 OK + Data
        GW-->>-C: Response
    else Invalid Token
        GW-->>C: 401 Unauthorized
    end

Generate the detailed sequence diagram for: ${context.topic}`;
}

/**
 * Generate enhanced class diagram prompt
 */
function getClassPrompt(context: DiagramPromptContext): string {
  const ragSection = context.ragContext
    ? `\nRELEVANT CONTEXT (use this to add specific details):\n${context.ragContext}\n`
    : '';

  return `${getDiagramSystemPrompt()}

DIAGRAM TYPE: Detailed Class / Entity Diagram
TOPIC: ${context.topic}
USER QUESTION: ${context.userMessage}
${ragSection}
Generate a COMPREHENSIVE class diagram showing entities, their properties, methods, and relationships. Requirements:

STRUCTURE:
- Include 6-15 classes/entities with attributes and methods
- Show all relationship types (inheritance, composition, aggregation, association)
- Include cardinality/multiplicity on relationships
- Group related classes logically
- Show interfaces and abstract classes where appropriate

CLASS DEFINITION:
class ClassName {
    +publicAttribute: Type
    -privateAttribute: Type
    #protectedAttribute: Type
    +publicMethod(param: Type): ReturnType
    -privateMethod(): void
}

RELATIONSHIPS:
- Inheritance: ChildClass --|> ParentClass
- Composition: Container *-- Part
- Aggregation: Whole o-- Part
- Association: ClassA --> ClassB
- Dependency: ClassA ..> ClassB

FORMAT:
classDiagram
    class Order {
        +orderId: String
        +status: OrderStatus
        +items: OrderItem[]
        +totalAmount: Decimal
        +place(): void
        +cancel(): void
        +calculateTotal(): Decimal
    }
    class OrderItem {
        +productId: String
        +quantity: Int
        +unitPrice: Decimal
        +getSubtotal(): Decimal
    }
    Order *-- OrderItem : contains
    Order --> Customer : placed by

Generate the detailed class diagram for: ${context.topic}`;
}

/**
 * Get the appropriate prompt based on diagram type
 */
export function getDiagramGenerationPrompt(context: DiagramPromptContext): string {
  switch (context.type) {
    case 'flowchart':
      return getFlowchartPrompt(context);
    case 'architecture':
      return getArchitecturePrompt(context);
    case 'sequence':
      return getSequencePrompt(context);
    case 'class':
      return getClassPrompt(context);
    default:
      return getFlowchartPrompt(context);
  }
}

/**
 * Fix common Mermaid syntax errors from LLM output
 * Handles bracket/quote misplacement, missing quotes, indentation, and more
 */
function fixMermaidSyntax(syntax: string): string {
  let fixed = syntax;

  // FIRST: Ensure diagram starts with a valid diagram type declaration
  const lines = fixed.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const firstLine = lines[0] || '';

  if (!firstLine.match(/^(flowchart|graph|sequenceDiagram|classDiagram)/)) {
    const fullText = fixed.toLowerCase();
    let diagramType = 'flowchart TD';

    if (fullText.includes('sequencediagram') || fullText.includes('participant')) {
      diagramType = 'sequenceDiagram';
    } else if (fullText.includes('classdiagram') || fullText.includes('class ')) {
      diagramType = 'classDiagram';
    } else if (fullText.includes('graph')) {
      diagramType = 'graph TB';
    }

    fixed = diagramType + '\n' + fixed;
  }

  // Fix bracket-quote misplacement: ["text)]"] → ["text)"]
  fixed = fixed.replace(/\)\]"/g, ')"');

  // Fix missing closing quotes on labels: ["text] → ["text"]
  fixed = fixed.replace(/\["([^\]"]*)\](?!")/g, '["$1"]');

  // Fix other bracket patterns: [)] → )
  fixed = fixed.replace(/\[\)]/g, ')');

  // Fix double brackets: [[...]] → [...]
  fixed = fixed.replace(/\[\[/g, '[').replace(/\]\]/g, ']');

  // Fix improperly escaped quotes in labels
  fixed = fixed.replace(/\["([^"]*)" ([^"]*)\]/g, '["$1 $2"]');

  // Fix decision node text - wrap unquoted text in quotes
  fixed = fixed.replace(/(\w+)\{([^}"]+)\}/g, (match, nodeId, text) => {
    if (text.trim().startsWith('"') && text.trim().endsWith('"')) {
      return match;
    }
    let cleanText = text.trim().replace(/[)\]};]*$/g, '');
    return `${nodeId}{"${cleanText}"}`;
  });

  // Fix old-style decision nodes with array syntax
  fixed = fixed.replace(/\{(\s*)(true|yes|success|false|no|failure)\s*\[/gi, () => {
    return '{';
  });

  // Fix subgraph syntax issues — ensure "end" keyword is on its own line
  fixed = fixed.replace(/(\S)\s+end\s*$/gm, '$1\n    end');

  // Fix missing indentation after diagram type declaration
  // Also remove duplicate node definitions
  const allLines = fixed.split('\n');
  const fixedLines: string[] = [];
  let inDiagram = false;
  const seenNodeIds = new Set<string>();

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];
    const trimmed = line.trim();

    // Check if this is a diagram start line
    if (trimmed.match(/^(flowchart|graph|sequenceDiagram|classDiagram)/)) {
      fixedLines.push(line);
      inDiagram = true;
      continue;
    }

    if (inDiagram && trimmed) {
      // Check line types
      const isNodeDef = trimmed.match(/^[a-zA-Z_]\w*\[/) ||
                        trimmed.match(/^[a-zA-Z_]\w*\{/) ||
                        trimmed.match(/^[a-zA-Z_]\w*\(/) ||
                        trimmed.match(/^[a-zA-Z_]\w*\-\-/);

      const isArrow = trimmed.match(/(--|=>|-\.-|[\w\)]\s*[\-=]+>)/);
      const isParticipant = trimmed.match(/^participant\s+/i);
      const isSubgraph = trimmed.match(/^(subgraph|end)/i);
      const isStyle = trimmed.match(/^style\s+/i);
      const isNote = trimmed.match(/^Note\s+/i);
      const isClass = trimmed.match(/^class\s+/i);
      const isAlt = trimmed.match(/^(alt|else|opt|loop|par|and|rect)\s*/i);

      // Extract node ID
      let nodeId: string | null = null;
      if (isNodeDef && !isArrow) {
        const nodeDefMatch = trimmed.match(/^([a-zA-Z_]\w*)/);
        if (nodeDefMatch) {
          nodeId = nodeDefMatch[1];
        }
      }

      // Add indentation if missing (but not for subgraph/end)
      const finalLine = line.startsWith('    ') || isSubgraph
        ? line
        : '    ' + trimmed;

      // Skip duplicate node definitions, but keep everything else
      if (isNodeDef && !isArrow && nodeId && seenNodeIds.has(nodeId)) {
        continue;
      } else if (isNodeDef && !isArrow && nodeId) {
        seenNodeIds.add(nodeId);
        fixedLines.push(finalLine);
      } else if (isArrow || isParticipant || isSubgraph || isStyle || isNote || isClass || isAlt) {
        fixedLines.push(finalLine);
      } else {
        fixedLines.push(line);
      }
      continue;
    }

    fixedLines.push(line);
  }

  fixed = fixedLines.join('\n');

  return fixed.trim();
}

/**
 * Extract Mermaid syntax from LLM response
 * LLM may include extra text, so we need to extract just the diagram syntax
 */
export function extractMermaidSyntax(response: string): string {
  let syntax = response.trim();

  // Remove markdown code blocks if present
  syntax = syntax.replace(/```mermaid\n?/g, '').replace(/```\n?/g, '');

  // Remove common explanatory prefixes
  syntax = syntax.replace(/^Here's? (?:the|a) (?:mermaid|diagram)[:\s]*/i, '');
  syntax = syntax.replace(/^The (?:mermaid|diagram)[:\s]*/i, '');
  syntax = syntax.replace(/^Mermaid syntax[:\s]*/i, '');

  // Remove trailing explanations (look for common patterns)
  const lines = syntax.split('\n');
  let cleanLines: string[] = [];
  let inDiagram = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Start of diagram
    if (trimmed.match(/^(flowchart|graph|sequenceDiagram|classDiagram)/)) {
      inDiagram = true;
      cleanLines.push(trimmed);
      continue;
    }

    if (!inDiagram) continue;

    // Keep subgraph, end, style, participant, Note, alt, else, opt, loop, par, class lines
    if (trimmed.match(/^(subgraph|end|style|participant|Note|alt|else|opt|loop|par|and|rect|class\s)/i)) {
      cleanLines.push(trimmed);
      continue;
    }

    // End of diagram — detect prose text (be conservative to avoid truncating valid syntax)
    // Only break if the line looks like a full natural language sentence (has spaces and no Mermaid operators)
    if (trimmed.length > 20 &&
        !trimmed.match(/[-=][-=]>|-->|==>|-.->|subgraph|style\s|:::/) &&
        !trimmed.match(/\[.*\]|\{.*\}|\(.*\)/) &&
        trimmed.match(/^[A-Z].*[.!?:]$/) &&
        cleanLines.length > 5) {
      break;
    }

    if (trimmed.length > 0) {
      cleanLines.push(trimmed);
    }
  }

  let result = cleanLines.join('\n').trim();

  // Apply syntax fixes
  result = fixMermaidSyntax(result);

  return result;
}

/**
 * Generate title based on topic
 */
export function generateDiagramTitle(topic: string, type: DiagramType): string {
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
  // Clean up the topic for a readable title
  const cleanTopic = topic.replace(/^(the|a|an)\s+/i, '').replace(/\?$/, '').trim();
  return `${typeLabel}: ${cleanTopic}`;
}
