import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { chunkMarkdown } from './rag/chunker';
import { batchGenerateEmbeddings, serializeVector } from './rag/embeddings';
import { searchKnowledgeBase, formatSearchResultsForContext, tieredSearch, formatTieredContext } from './rag/retrieval';
import { detectDiagramRequest } from './diagram/detector';
import { generateDiagramWithProvider } from './diagram/generator';
import { validateMermaidSyntax } from './diagram/validator';
import { getActiveProviderConfig, createProvider } from './providers/factory';
import { RequestLogger } from './logging';
import type { AIProvider } from './providers/types';

// Environment types
interface Env {
    DB: D1Database;
    AI: Ai;
    APP_URL: string;
    ADMIN_EMAIL: string;
    OPENAI_API_KEY?: string;
    ELA_ADMIN_API_KEY?: string;
}

const app = new Hono<{ Bindings: Env }>();

// Enable CORS
app.use('*', cors({
    origin: ['https://elamurugan.pages.dev', 'https://elamurugan-api.pages.dev', 'http://localhost:5173', 'http://localhost:3000'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key']
}));

// System context - enriched with full profile details for authentic responses
// CONFIDENTIALITY: Uses domain descriptions instead of client names
const SYSTEM_CONTEXT = `You are Elamurugan Nallathambi (Ela), Senior Technical Manager & Enterprise Solution Architect at Cognizant (2019-present), Charlotte, NC. 18+ years building enterprise platforms since 2008.

GOLDEN RULE: Answer ONLY from MY documented experience. I've DONE this stuff - not generic definitions.
- Share ONLY practical insights from projects I've actually built
- If topic is outside my documented expertise, say so directly
- Stick to what I can prove I've built or managed

CONFIDENTIALITY RULE (CRITICAL):
- NEVER mention specific client/company names (e.g. never say "Sealed Air", "R.J. Reynolds", "Emerson Ecologics", "Munetrix")
- Instead use DOMAIN DESCRIPTIONS: "Fortune 500 packaging manufacturer", "regulated consumer goods company", "health & wellness eCommerce platform", "education data analytics platform"
- You CAN mention technology names, system names, and frameworks freely (SAP ECC, Magento, Databricks, etc.)
- You CAN mention your employer names (Cognizant, OneTeam US, EBDUS LLC)
- You CAN mention product/platform names (wellevate.me, PACE) only if they are public domain names, not client identifiers
- When referencing projects, describe the DOMAIN and SCALE, not the client

MY CAREER & KEY PROJECTS:
- **Cognizant (2019-present)**: Enterprise Architect for Fortune 500 clients
  - **Fortune 500 Packaging Manufacturer (B2B/B2C eCommerce)**: Led 16 engineers across B2B (Magento Commerce Cloud) and B2C (headless AEM+React+Adobe Commerce) platforms with deep SAP ECC integration (IDoc ORDERS05/DESADV/INVOIC, EDI X12 850/856/810, BAPI calls for MM/SD). Azure Logic Apps, Service Bus, .NET Core middleware. Worldpay payments with 3DS, PCI-DSS.
  - **Health & Wellness eCommerce Platform**: Migrated Magento 1 to 2 on AWS EKS. Achieved 70% page load improvement (6s to under 2s). GraphQL+REST headless, Node.js/Express microservices on ECS/Fargate, Terraform IaC, multi-AZ Aurora.
  - **Regulated Consumer Goods Company (Age-Gated Commerce)**: Technical Architect for age-gated commerce on Adobe Commerce. Cut incident response time by 60%. Built Databricks Spark ETL pipelines, Delta Lake tables, Unity Catalog governance for enterprise data application.
- **OneTeam US (2017-2019)**: Delivered 30+ web apps across education, healthcare, retail, government. Built education data analytics platform (800+ school districts) with ETL pipelines aggregating NCES, M-STEP, NWEA data with Tableau+Angular/D3.js dashboards.
- **EBDUS LLC (2011-2017)**: Self-employed, managed 22+ people. Shipped 200+ Magento stores globally. SAP & Microsoft Dynamics integrations (SOAP, XML-RPC, EDI). Got page loads under 2s on 500K+ daily visitor sites. Built a custom MVC eCommerce framework from scratch.
- **Openwave Computing (2010-2011)**: Full-stack developer, PHP/MySQL/jQuery.
- **SoftSolutions4u (2008-2010)**: Started career building LAMP-stack websites.

TECHNICAL DEPTH:
- **eCommerce**: Magento/Adobe Commerce expert 14+ yrs, 200+ stores, Certified Developer Plus. EAV modeling, multi-store, complex catalog, migrations.
- **SAP/ERP**: SAP ECC (MM/SD), IDoc, EDI X12, BAPI/RFC, Azure Logic Apps + Service Bus middleware, Microsoft Dynamics.
- **Cloud**: AWS (EC2, EKS, ECS, Lambda, SQS/SNS, CloudFront, Aurora, Fargate), Azure (AKS, Logic Apps, Service Bus, AD B2C, DevOps).
- **Data Engineering**: Databricks notebooks, Spark ETL, Delta Lake, Unity Catalog, Databricks Jobs. Public data analytics (NCES, census).
- **AI/LLM**: Building RAG pipelines, vector databases (Pinecone, ChromaDB), LangChain, AI agents, OpenAI & Claude APIs.
- **Backend**: Node.js/Express, Java/Spring Boot, .NET Core/C#, PHP (14+ yrs), Python.
- **Performance**: Sub-2s loads on 500K+ users. Varnish, Redis, CDN, GraphQL optimization, Brotli, WebP.
- **DevOps**: Docker, Kubernetes (EKS/AKS), Terraform, CI/CD (Jenkins, GitHub Actions, Azure DevOps), blue-green deployments.
- **Leadership**: Teams of 10-22 engineers, architecture governance, mentoring, Agile/Scrum.

CREDENTIALS:
- B.Tech IT, Bharathidasan University (2008)
- AWS Certified Solutions Architect (2016)
- Adobe Commerce Certified Developer Plus (2017)

KEY STATS: 200+ Magento stores | 30+ web apps | 500K+ daily users | 70% page load improvement | 60% incident response reduction | Zero downtime deployments | 100% data integrity on migrations

INTERVIEW RESPONSE STYLE:
- Answer the question directly - explain/describe, not offer to help
- NO phrases like "I can help you", "Let me build", "I'll help you with"
- Instead: "The flow typically involves...", "Here's how...", "The process works like..."
- 2-4 short paragraphs, practical not theoretical
- Use **bold** for important concepts I've worked with
- Reference projects by DOMAIN (e.g. "Fortune 500 packaging platform", "education data analytics", "health & wellness eCommerce")
- Sound like you're explaining to someone interested in your expertise

DIAGRAM CAPABILITY (CRITICAL — READ CAREFULLY):
- A SEPARATE automated system generates Mermaid diagrams alongside your responses — you do NOT generate diagrams yourself
- NEVER include Mermaid syntax, code blocks, or diagram code in your response text
- NEVER write "flowchart TD", "graph TB", "sequenceDiagram", "classDiagram", or ANY Mermaid markup
- NEVER say "I can't create diagrams" or "I can't generate visuals" — the system handles it
- NEVER say "here is a diagram" or "I will generate a flow diagram" — just describe the flow naturally in plain text
- Your job: describe architecture, flows, and processes in PLAIN TEXT with clear component names, steps, and data flows
- The automated diagram system will read your text + the user's question and generate a visual Mermaid diagram that appears as a clickable link below your response
- DO NOT attempt to be helpful by including diagram syntax — it will appear as ugly raw code in the chat
- Simply explain the technical concepts naturally in paragraphs, and the visual diagram link will appear automatically

TONE: Expert being interviewed, practical, authentic, conversational, direct`;

// Helper function to generate UUID
function generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Strip any Mermaid diagram syntax the AI may have included in its text response.
 * The diagram pipeline generates diagrams separately — raw syntax in text is a bug.
 */
function stripMermaidFromResponse(text: string): string {
    // Remove markdown-fenced mermaid blocks: ```mermaid ... ```
    let cleaned = text.replace(/```mermaid[\s\S]*?```/gi, '');

    // Remove standalone mermaid blocks that start with diagram declarations
    // Match blocks that start with flowchart/graph/sequenceDiagram/classDiagram and contain typical syntax
    cleaned = cleaned.replace(/\n?(flowchart\s+(?:TD|TB|LR|RL|BT)\s*\n(?:\s+.*\n)*)/gi, '');
    cleaned = cleaned.replace(/\n?(graph\s+(?:TD|TB|LR|RL|BT)\s*\n(?:\s+.*\n)*)/gi, '');
    cleaned = cleaned.replace(/\n?(sequenceDiagram\s*\n(?:\s+.*\n)*)/gi, '');
    cleaned = cleaned.replace(/\n?(classDiagram\s*\n(?:\s+.*\n)*)/gi, '');

    // Remove lines like "Here is a flow diagram:" or "Now I will generate a diagram"
    cleaned = cleaned.replace(/\n?(?:Here(?:'s| is) (?:a|the) (?:flow |architecture |sequence |class )?(?:diagram|visualization|chart)[:\s]*)\n?/gi, '');
    cleaned = cleaned.replace(/\n?(?:Now,? I (?:will|'ll) (?:generate|create) (?:a )?(?:flow )?diagram[:\s]*)\n?/gi, '');
    cleaned = cleaned.replace(/\n?(?:Let me (?:generate|create) (?:a )?(?:flow |architecture |visual )?diagram[:\s]*)\n?/gi, '');

    // Clean up excessive blank lines left behind
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    return cleaned.trim();
}

// Helper function to get or create conversation
async function getOrCreateConversation(db: D1Database, sessionId: string): Promise<string> {
    const existing = await db.prepare(
        'SELECT id FROM conversations WHERE session_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(sessionId).first();

    if (existing) {
        return (existing as any).id;
    }

    const conversationId = generateId();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await db.prepare(
        'INSERT INTO conversations (id, session_id, created_at, updated_at, expires_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(conversationId, sessionId, now, now, expiresAt).run();

    return conversationId;
}

// Helper function to detect contact intent and extract contact info
function detectContactIntent(message: string) {
    const lowerMsg = message.toLowerCase();
    const contactKeywords = ['contact', 'reach out', 'get in touch', 'call me', 'email me', 'reach me', 'call ela', 'ask ela', 'connect', 'hire'];
    const hasContactIntent = contactKeywords.some(keyword => lowerMsg.includes(keyword));

    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const emails = message.match(emailRegex);
    const email = emails ? emails[0] : null;

    const phoneRegex = /(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phones = message.match(phoneRegex);
    const phone = phones ? phones[0] : null;

    return { hasContactIntent, email, phone };
}

// Helper function to save contact request
async function saveContactRequest(db: D1Database, conversationId: string, message: string, contactInfo: any) {
    const contactId = generateId();
    const now = new Date().toISOString();

    let contactType = 'email';
    if (contactInfo.phone && !contactInfo.email) {
        contactType = 'call';
    } else if (!contactInfo.email && !contactInfo.phone && message.toLowerCase().includes('meeting')) {
        contactType = 'meeting';
    }

    const email = contactInfo.email || `visitor-${conversationId}@elamurugan.local`;

    await db.prepare(
        'INSERT INTO contact_requests (id, conversation_id, name, email, phone, message, type, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(contactId, conversationId, 'Website Visitor', email, contactInfo.phone || null, message, contactType, now, 'pending').run();
}

// ==========================================
// Session Memory: Build conversation soul/summary for context enrichment
// Tracks topics discussed, visitor interests, and conversation thread
// ==========================================
async function buildSessionMemory(db: D1Database, conversationId: string): Promise<string> {
    const history = await db.prepare(
        'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 20'
    ).bind(conversationId).all();

    const msgs = history.results || [];
    if (msgs.length === 0) return '';

    const userMessages = msgs.filter((m: any) => m.role === 'user').map((m: any) => m.content);
    const allUserText = userMessages.join(' ').toLowerCase();

    // Detect topics of interest from conversation
    const topics = new Set<string>();
    const topicKeywords: Record<string, string[]> = {
        'eCommerce/Magento': ['magento', 'ecommerce', 'e-commerce', 'adobe commerce', 'store', 'catalog', 'checkout', 'cart'],
        'SAP/ERP Integration': ['sap', 'erp', 'idoc', 'edi', 'bapi', 'dynamics', 'integration', 'middleware'],
        'Cloud Architecture': ['aws', 'azure', 'cloud', 'kubernetes', 'eks', 'docker', 'microservices', 'infrastructure', 'serverless'],
        'Data Engineering': ['databricks', 'spark', 'etl', 'data pipeline', 'delta lake', 'data warehouse', 'analytics', 'tableau'],
        'AI/LLM/RAG': ['ai', 'llm', 'rag', 'vector', 'embedding', 'langchain', 'openai', 'claude', 'machine learning', 'chatbot'],
        'Performance': ['performance', 'optimization', 'speed', 'load time', 'caching', 'scalability', 'varnish', 'redis'],
        'Leadership': ['team', 'lead', 'manage', 'mentor', 'agile', 'scrum', 'governance', 'hiring'],
        'Career/Background': ['experience', 'career', 'background', 'work history', 'certification', 'education', 'journey'],
        'Frontend': ['react', 'angular', 'vue', 'javascript', 'typescript', 'frontend', 'ui', 'ux', 'css'],
        'Backend': ['node', 'php', 'java', 'spring', '.net', 'api', 'backend', 'server', 'express', 'hono'],
        'DevOps/CI-CD': ['ci/cd', 'jenkins', 'github actions', 'terraform', 'deploy', 'devops', 'pipeline', 'docker'],
        'Payment/Security': ['payment', 'pci', 'worldpay', 'stripe', 'security', '3ds', 'authentication', 'oauth'],
        'Database': ['database', 'mysql', 'postgres', 'aurora', 'mongodb', 'redis', 'sql', 'schema', 'migration']
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
        if (keywords.some(kw => allUserText.includes(kw))) {
            topics.add(topic);
        }
    }

    let memory = '';
    if (topics.size > 0) {
        memory += `SESSION MEMORY - Topics this visitor has explored: ${[...topics].join(', ')}.\n`;
    }
    memory += `Conversation depth: ${msgs.length} messages (${userMessages.length} questions asked).\n`;

    // Include last 2 Q&A pairs for continuity
    const recentPairs: string[] = [];
    for (let i = Math.max(0, msgs.length - 4); i < msgs.length; i++) {
        const m = msgs[i] as any;
        const prefix = m.role === 'user' ? 'Q' : 'A';
        const preview = m.content.substring(0, 150) + (m.content.length > 150 ? '...' : '');
        recentPairs.push(`${prefix}: ${preview}`);
    }
    if (recentPairs.length > 0) {
        memory += `Recent thread:\n${recentPairs.join('\n')}\n`;
    }

    return memory;
}

// ==========================================
// Core chat logic: shared by both /api/chat and /api/chat/stream
// Runs all independent operations in parallel for speed
// ==========================================
async function prepareChatContext(c: any, sessionId: string, message: string, logger: RequestLogger) {
    const conversationId = await getOrCreateConversation(c.env.DB, sessionId);

    logger.log('session_info', {
        request_id: logger.requestId, session_id: sessionId,
        conversation_id: conversationId, timestamp: new Date().toISOString()
    });
    logger.log('user_message', { message, length: message.length });

    const messageId = generateId();
    const now = new Date().toISOString();

    // === PARALLEL PHASE: Run all independent operations concurrently ===
    const [historyResult, providerResult, sessionMemory] = await Promise.all([
        // 1. Fetch conversation history
        c.env.DB.prepare(
            'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 20'
        ).bind(conversationId).all(),

        // 2. Get provider config
        getActiveProviderConfig(c.env.DB).catch((err: Error) => {
            console.warn('Provider config failed:', err);
            return null;
        }),

        // 3. Build session memory (conversation soul)
        buildSessionMemory(c.env.DB, conversationId)
    ]);

    const contactInfo = detectContactIntent(message);
    const isFirstMessage = (!historyResult.results || historyResult.results.length === 0);

    // Store user message
    await c.env.DB.prepare(
        'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(messageId, conversationId, 'user', message, now).run();

    // Handle contact detection (non-blocking)
    if (contactInfo.hasContactIntent || contactInfo.email || contactInfo.phone) {
        c.executionCtx.waitUntil(saveContactRequest(c.env.DB, conversationId, message, contactInfo));
        logger.log('contact_detected', contactInfo);
    }

    // Initialize providers
    let providerConfig: any;
    let chatProvider: AIProvider;
    let diagramProvider: AIProvider;
    let embeddingProvider: AIProvider;

    if (providerResult) {
        providerConfig = providerResult;
        logger.log('provider_config_loaded', {
            source: 'database', provider: providerConfig.provider,
            chat_model: providerConfig.model_chat
        });
        const providers = await createProvider(providerConfig, c.env, c.env.DB);
        chatProvider = providers.chatProvider;
        diagramProvider = providers.diagramProvider;
        embeddingProvider = providers.embeddingProvider;
    } else {
        const { CloudflareAIProvider } = await import('./providers/cloudflare-ai');
        const fallback = new CloudflareAIProvider(c.env.AI, '@cf/mistral/mistral-7b-instruct-v0.1', '@cf/baai/bge-small-en-v1.5');
        chatProvider = fallback; diagramProvider = fallback; embeddingProvider = fallback;
        providerConfig = {
            provider: 'cloudflare', model_chat: '@cf/mistral/mistral-7b-instruct-v0.1',
            model_diagram: '@cf/mistral/mistral-7b-instruct-v0.1',
            model_embedding: '@cf/baai/bge-small-en-v1.5',
            config: { chat_temperature: 0.7, chat_max_tokens: 1024, diagram_temperature: 0.3, diagram_max_tokens: 1500 }
        };
        logger.log('provider_fallback', { reason: 'config_load_failed' });
    }

    // Build messages array from history
    const chatMessages = (historyResult.results || []).map((msg: any) => ({
        role: msg.role, content: msg.content
    }));
    chatMessages.push({ role: 'user', content: message });

    // === RAG: Tiered knowledge base search ===
    // Tier 1 = always included (profile, core skills)
    // Tier 2/3 = retrieved via semantic search (projects, case studies)
    let ragContext = '';
    let sources: any[] = [];
    const ragStart = Date.now();
    try {
        const { tier1, searchResults } = await tieredSearch(message, c.env.AI, c.env.DB, 5);

        logger.log('rag_tiered_search', {
            query: message,
            tier1_chunks: tier1.length,
            search_results: searchResults.length,
            tier1_detail: tier1.map(r => ({ title: r.document_title, section: r.heading })),
            search_detail: searchResults.slice(0, 5).map(r => ({
                title: r.document_title, section: r.heading, score: Math.round(r.score * 100)
            }))
        });

        // Format tiered context: tier-1 always present + tier-2/3 with score > 0.5
        const relevantSearch = searchResults.filter(r => r.score > 0.5);
        ragContext = formatTieredContext(tier1, searchResults, 0.5);

        // Build sources array from all contributing results
        sources = [
            ...tier1.map(r => ({
                document: r.document_title, section: r.heading,
                relevance: 100, tier: 1
            })),
            ...relevantSearch.map(r => ({
                document: r.document_title, section: r.heading,
                relevance: Math.round(r.score * 100), tier: r.tier || 3
            }))
        ];

        logger.log('rag_search', {
            query: message,
            tier1_count: tier1.length,
            search_count: searchResults.length,
            relevant_count: relevantSearch.length,
            threshold: 0.5,
            total_sources: sources.length
        }, { duration_ms: Date.now() - ragStart });
    } catch (error) {
        console.warn('RAG search failed:', error);
        logger.log('rag_search_error', { error: (error as Error).message, stack: (error as Error).stack }, { duration_ms: Date.now() - ragStart });
    }

    // === Build enriched system context with session memory + RAG ===
    let enhancedSystemContext = SYSTEM_CONTEXT;
    const contextSources: string[] = ['system_prompt'];

    // Inject session memory (conversation soul)
    if (sessionMemory) {
        enhancedSystemContext += `\n\n${sessionMemory}`;
        contextSources.push('session_memory');
    }

    // Inject RAG context
    if (ragContext && sources.length > 0) {
        enhancedSystemContext += `\n\nRELEVANT KNOWLEDGE BASE CONTEXT:\n${ragContext}`;
        contextSources.push(...sources.map(s => `${s.document} > ${s.section}`));
    }

    // Continuity instruction for ongoing conversations
    if (!isFirstMessage && chatMessages.length > 2) {
        enhancedSystemContext += `\n\nCONVERSATION CONTINUITY: This is an ongoing conversation. Reference earlier points naturally. Build on what was discussed. Keep answers consistent with previous responses. Remember the CONFIDENTIALITY RULE - never mention client names.`;
    }

    logger.log('system_context_built', {
        base_context_length: SYSTEM_CONTEXT.length,
        total_context_length: enhancedSystemContext.length,
        has_session_memory: !!sessionMemory,
        has_rag_context: ragContext.length > 0,
        rag_context_length: ragContext.length,
        context_sources: contextSources,
        full_system_prompt: enhancedSystemContext,
        rag_context_full: ragContext
    });

    return {
        conversationId, isFirstMessage, chatMessages, enhancedSystemContext,
        providerConfig, chatProvider, diagramProvider, embeddingProvider,
        contactInfo, sources, ragContext, logger
    };
}

// ==========================================
// Chat endpoint: standard JSON response
// ==========================================
app.post('/api/chat', async (c) => {
    try {
        const body = await c.req.json() as { sessionId: string; message: string };
        const { sessionId, message } = body;

        if (!sessionId || !message) {
            return c.json({ error: 'Missing sessionId or message' }, 400);
        }

        const requestId = generateId();
        const conversationId = await getOrCreateConversation(c.env.DB, sessionId);
        const logger = new RequestLogger(requestId, sessionId, conversationId);
        const ctx = await prepareChatContext(c, sessionId, message, logger);

        // AI Chat completion
        const aiStart = Date.now();
        logger.log('ai_request', {
            provider: ctx.providerConfig.provider,
            model: ctx.providerConfig.model_chat,
            system_context_length: ctx.enhancedSystemContext.length,
            messages_count: ctx.chatMessages.length + 1,
            temperature: ctx.providerConfig.config.chat_temperature,
            max_tokens: ctx.providerConfig.config.chat_max_tokens,
            full_system_prompt: ctx.enhancedSystemContext,
            messages_detail: ctx.chatMessages.map((m: any, i: number) => ({
                index: i, role: m.role, length: m.content.length, full_content: m.content
            }))
        });

        const chatResponse = await ctx.chatProvider.chat({
            messages: [
                { role: 'system', content: ctx.enhancedSystemContext },
                ...ctx.chatMessages
            ],
            temperature: ctx.providerConfig.config.chat_temperature,
            max_tokens: ctx.providerConfig.config.chat_max_tokens
        });

        logger.log('ai_response', {
            response_length: chatResponse.content.length,
            full_response: chatResponse.content,
            model: chatResponse.model, provider: chatResponse.provider,
            tokens_in: chatResponse.tokens_in, tokens_out: chatResponse.tokens_out
        }, {
            duration_ms: Date.now() - aiStart,
            provider: chatResponse.provider, model: chatResponse.model,
            tokens_in: chatResponse.tokens_in, tokens_out: chatResponse.tokens_out
        });

        let finalMessage = stripMermaidFromResponse(chatResponse.content);
        if (ctx.contactInfo.hasContactIntent || ctx.contactInfo.email || ctx.contactInfo.phone) {
            finalMessage += '\n\n**Thanks for reaching out!** Ela will get in touch with you shortly.';
        }

        // Store assistant response
        const assistantMessageId = generateId();
        await c.env.DB.prepare(
            'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(assistantMessageId, ctx.conversationId, 'assistant', finalMessage, new Date().toISOString()).run();

        // Diagram generation — runs SEPARATELY from AI text response
        let diagram = null;
        try {
            const detectionResult = detectDiagramRequest(message);
            console.log('[DIAGRAM] Detection:', JSON.stringify({ needsDiagram: detectionResult.needsDiagram, type: detectionResult.type, confidence: detectionResult.confidence, keywords: detectionResult.keywords }));
            if (detectionResult.needsDiagram && detectionResult.type) {
                logger.log('diagram_detected', { type: detectionResult.type, confidence: detectionResult.confidence });
                const diagramStart = Date.now();
                const diagramMaxTokens = ctx.providerConfig.config.diagram_max_tokens || 2000;
                const diagramTemp = ctx.providerConfig.config.diagram_temperature ?? 0.3;
                console.log('[DIAGRAM] Generating:', detectionResult.type, 'maxTokens:', diagramMaxTokens);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Diagram timeout after 30s')), 30000)
                );
                const diagramPromise = generateDiagramWithProvider({
                    type: detectionResult.type,
                    topic: detectionResult.topic || message,
                    userMessage: message,
                    ragContext: ctx.ragContext || undefined
                }, ctx.diagramProvider, diagramTemp, diagramMaxTokens);

                const diagramResult = await Promise.race([diagramPromise, timeoutPromise]) as any;
                console.log('[DIAGRAM] Generated:', { extracted: diagramResult.extractedSuccessfully, syntaxLen: diagramResult.syntax.length });
                const validation = validateMermaidSyntax(diagramResult.syntax, detectionResult.type);
                const finalSyntax = validation.corrected || diagramResult.syntax;
                console.log('[DIAGRAM] Validated:', { valid: validation.isValid, corrected: !!validation.corrected, errors: validation.errors });
                if (diagramResult.extractedSuccessfully && (validation.isValid || validation.corrected)) {
                    const diagramId = generateId();
                    c.executionCtx.waitUntil(c.env.DB.prepare(
                        'INSERT INTO diagrams_generated (id, conversation_id, message_id, diagram_type, diagram_syntax, diagram_title, topic, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
                    ).bind(diagramId, ctx.conversationId, assistantMessageId, diagramResult.type, finalSyntax, diagramResult.title, detectionResult.topic, new Date().toISOString()).run());
                    diagram = { type: diagramResult.type, syntax: finalSyntax, title: diagramResult.title };
                    logger.log('diagram_generated', { type: diagramResult.type, title: diagramResult.title }, { duration_ms: Date.now() - diagramStart });
                } else if (finalSyntax.length > 10 && finalSyntax.includes('\n')) {
                    // Best-effort: send diagram even if validation has issues
                    console.log('[DIAGRAM] Sending best-effort diagram despite validation issues');
                    diagram = { type: diagramResult.type, syntax: finalSyntax, title: diagramResult.title || 'Diagram' };
                }
            }
        } catch (error: any) {
            console.error('[DIAGRAM] ERROR:', error?.message || error);
            logger.log('diagram_error', { error: error.message, stack: error?.stack?.substring(0, 500) });
        }

        const intro = ctx.isFirstMessage ? "Thanks for checking in! This is Ela's AI assistant with context from Ela's work and experience. Hope that's ok!" : null;

        logger.log('final_response', {
            has_diagram: !!diagram, has_sources: ctx.sources.length > 0,
            is_first_message: ctx.isFirstMessage, response_length: finalMessage.length
        });

        c.executionCtx.waitUntil(logger.flush(c.env.DB));

        return c.json({
            success: true, conversationId: ctx.conversationId,
            userMessage: message, assistantMessage: finalMessage,
            intro, sources: ctx.sources, diagram,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Chat error:', error);
        return c.json({ error: 'Failed to process message', details: error.message }, 500);
    }
});

// ==========================================
// Streaming Chat endpoint: SSE for real-time token delivery
// When using OpenAI, tokens stream to client immediately
// Falls back to single-event SSE for Cloudflare AI
// ==========================================
app.post('/api/chat/stream', async (c) => {
    try {
        const body = await c.req.json() as { sessionId: string; message: string };
        const { sessionId, message } = body;

        if (!sessionId || !message) {
            return c.json({ error: 'Missing sessionId or message' }, 400);
        }

        const requestId = generateId();
        const conversationId = await getOrCreateConversation(c.env.DB, sessionId);
        const logger = new RequestLogger(requestId, sessionId, conversationId);
        const ctx = await prepareChatContext(c, sessionId, message, logger);

        const intro = ctx.isFirstMessage
            ? "Thanks for checking in! This is Ela's AI assistant with context from Ela's work and experience. Hope that's ok!"
            : null;

        const supportsStream = ctx.chatProvider.chatStream !== undefined;
        const encoder = new TextEncoder();

        if (supportsStream) {
            // === STREAMING PATH (OpenAI) ===
            logger.log('ai_request_stream', {
                provider: ctx.providerConfig.provider,
                model: ctx.providerConfig.model_chat, streaming: true
            });

            const aiStream = await ctx.chatProvider.chatStream!({
                messages: [
                    { role: 'system', content: ctx.enhancedSystemContext },
                    ...ctx.chatMessages
                ],
                temperature: ctx.providerConfig.config.chat_temperature,
                max_tokens: ctx.providerConfig.config.chat_max_tokens
            });

            let fullText = '';
            const reader = aiStream.getReader();
            const decoder = new TextDecoder();

            const wrappedStream = new ReadableStream<Uint8Array>({
                async start(controller) {
                    // Send metadata first
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'meta', conversationId: ctx.conversationId, intro,
                        sources: ctx.sources, provider: ctx.providerConfig.provider
                    })}\n\n`));
                },
                async pull(controller) {
                    const { done, value } = await reader.read();
                    if (done) {
                        let finalMessage = stripMermaidFromResponse(fullText);
                        if (ctx.contactInfo.hasContactIntent || ctx.contactInfo.email || ctx.contactInfo.phone) {
                            finalMessage += '\n\n**Thanks for reaching out!** Ela will get in touch with you shortly.';
                        }

                        // Check for diagram — runs SEPARATELY from AI text response
                        // Even if the AI says "I can't create diagrams", this pipeline still generates one
                        try {
                            const det = detectDiagramRequest(message);
                            console.log('[DIAGRAM] Detection:', JSON.stringify({ needsDiagram: det.needsDiagram, type: det.type, confidence: det.confidence, keywords: det.keywords }));
                            logger.log('stream_diagram_detection', { needsDiagram: det.needsDiagram, type: det.type, confidence: det.confidence, keywords: det.keywords });
                            if (det.needsDiagram && det.type) {
                                const diagramMaxTokens = ctx.providerConfig.config.diagram_max_tokens || 2000;
                                const diagramTemp = ctx.providerConfig.config.diagram_temperature ?? 0.3;
                                console.log('[DIAGRAM] Generating:', det.type, 'for topic:', det.topic, 'maxTokens:', diagramMaxTokens);
                                const dr = await generateDiagramWithProvider({
                                    type: det.type, topic: det.topic || message,
                                    userMessage: message, ragContext: ctx.ragContext || undefined
                                }, ctx.diagramProvider, diagramTemp, diagramMaxTokens);
                                console.log('[DIAGRAM] Generated:', { extracted: dr.extractedSuccessfully, syntaxLen: dr.syntax.length, title: dr.title });
                                const val = validateMermaidSyntax(dr.syntax, det.type);
                                const syn = val.corrected || dr.syntax;
                                console.log('[DIAGRAM] Validated:', { valid: val.isValid, corrected: !!val.corrected, errors: val.errors, warnings: val.warnings });
                                logger.log('stream_diagram_result', { extracted: dr.extractedSuccessfully, valid: val.isValid, corrected: !!val.corrected, title: dr.title, syntaxLen: syn.length, errors: val.errors });
                                if (dr.extractedSuccessfully && (val.isValid || val.corrected)) {
                                    console.log('[DIAGRAM] Sending SSE diagram event, syntax length:', syn.length);
                                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                                        type: 'diagram', diagram: { type: dr.type, syntax: syn, title: dr.title }
                                    })}\n\n`));
                                } else {
                                    console.log('[DIAGRAM] SKIPPED: extracted=', dr.extractedSuccessfully, 'valid=', val.isValid, 'corrected=', !!val.corrected);
                                    // If extraction failed but we have SOME syntax, try to send it anyway (best effort)
                                    if (syn.length > 10 && syn.includes('\n')) {
                                        console.log('[DIAGRAM] Sending best-effort diagram despite validation issues');
                                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                                            type: 'diagram', diagram: { type: dr.type, syntax: syn, title: dr.title || 'Diagram' }
                                        })}\n\n`));
                                    }
                                }
                            }
                        } catch (diagErr: any) {
                            console.error('[DIAGRAM] ERROR:', diagErr?.message || diagErr);
                            logger.log('stream_diagram_error', { error: diagErr?.message || 'Unknown diagram error', stack: diagErr?.stack?.substring(0, 500) });
                        }

                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'end' })}\n\n`));
                        controller.close();

                        // Persist response in background
                        c.executionCtx.waitUntil((async () => {
                            const msgId = generateId();
                            await c.env.DB.prepare(
                                'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
                            ).bind(msgId, ctx.conversationId, 'assistant', finalMessage, new Date().toISOString()).run();
                            logger.log('ai_response_stream_complete', { response_length: fullText.length });
                            await logger.flush(c.env.DB);
                        })());
                        return;
                    }

                    // Parse AI stream chunks
                    const chunk = decoder.decode(value, { stream: true });
                    for (const line of chunk.split('\n')) {
                        if (line.startsWith('data: ')) {
                            try {
                                const parsed = JSON.parse(line.slice(6));
                                if (parsed.text) {
                                    fullText += parsed.text;
                                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'token', text: parsed.text })}\n\n`));
                                }
                                if (parsed.done && parsed.tokens_in) {
                                    logger.log('ai_response', {
                                        response_length: fullText.length,
                                        provider: ctx.providerConfig.provider,
                                        model: parsed.model,
                                        tokens_in: parsed.tokens_in,
                                        tokens_out: parsed.tokens_out
                                    }, {
                                        provider: ctx.providerConfig.provider, model: parsed.model,
                                        tokens_in: parsed.tokens_in, tokens_out: parsed.tokens_out
                                    });
                                }
                            } catch { /* skip unparseable */ }
                        }
                    }
                },
                cancel() { reader.cancel(); }
            });

            return new Response(wrappedStream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        } else {
            // === NON-STREAMING FALLBACK (Cloudflare AI): single-event SSE ===
            const chatResponse = await ctx.chatProvider.chat({
                messages: [
                    { role: 'system', content: ctx.enhancedSystemContext },
                    ...ctx.chatMessages
                ],
                temperature: ctx.providerConfig.config.chat_temperature,
                max_tokens: ctx.providerConfig.config.chat_max_tokens
            });

            let finalMessage = stripMermaidFromResponse(chatResponse.content);
            if (ctx.contactInfo.hasContactIntent || ctx.contactInfo.email || ctx.contactInfo.phone) {
                finalMessage += '\n\n**Thanks for reaching out!** Ela will get in touch with you shortly.';
            }

            c.executionCtx.waitUntil(c.env.DB.prepare(
                'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
            ).bind(generateId(), ctx.conversationId, 'assistant', finalMessage, new Date().toISOString()).run());

            let diagram = null;
            try {
                const det = detectDiagramRequest(message);
                console.log('[DIAGRAM-FALLBACK] Detection:', JSON.stringify({ needsDiagram: det.needsDiagram, type: det.type, confidence: det.confidence }));
                if (det.needsDiagram && det.type) {
                    const diagramMaxTokens = ctx.providerConfig.config.diagram_max_tokens || 2000;
                    const dr = await generateDiagramWithProvider({
                        type: det.type, topic: det.topic || message,
                        userMessage: message, ragContext: ctx.ragContext || undefined
                    }, ctx.diagramProvider, ctx.providerConfig.config.diagram_temperature ?? 0.3, diagramMaxTokens);
                    console.log('[DIAGRAM-FALLBACK] Generated:', { extracted: dr.extractedSuccessfully, syntaxLen: dr.syntax.length });
                    const val = validateMermaidSyntax(dr.syntax, det.type);
                    const syn = val.corrected || dr.syntax;
                    if (dr.extractedSuccessfully && (val.isValid || val.corrected)) {
                        diagram = { type: dr.type, syntax: syn, title: dr.title };
                    } else if (syn.length > 10 && syn.includes('\n')) {
                        diagram = { type: dr.type, syntax: syn, title: dr.title || 'Diagram' };
                    }
                }
            } catch (diagErr: any) {
                console.error('[DIAGRAM-FALLBACK] ERROR:', diagErr?.message || diagErr);
            }

            c.executionCtx.waitUntil(logger.flush(c.env.DB));

            const sseBody = [
                `data: ${JSON.stringify({ type: 'meta', conversationId: ctx.conversationId, intro, sources: ctx.sources, provider: ctx.providerConfig.provider })}\n\n`,
                `data: ${JSON.stringify({ type: 'token', text: finalMessage })}\n\n`,
                diagram ? `data: ${JSON.stringify({ type: 'diagram', diagram })}\n\n` : '',
                `data: ${JSON.stringify({ type: 'end' })}\n\n`
            ].join('');

            return new Response(sseBody, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
    } catch (error: any) {
        console.error('Stream chat error:', error);
        return c.json({ error: 'Failed to process message', details: error.message }, 500);
    }
});

// ==========================================
// Existing API routes
// ==========================================

// Get conversation history
app.get('/api/conversations/:sessionId', async (c) => {
    try {
        const sessionId = c.req.param('sessionId');
        const conversation = await c.env.DB.prepare(
            'SELECT id FROM conversations WHERE session_id = ? ORDER BY created_at DESC LIMIT 1'
        ).bind(sessionId).first();

        if (!conversation) {
            return c.json({ messages: [] });
        }

        const messages = await c.env.DB.prepare(
            'SELECT id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC'
        ).bind(conversation.id).all();

        return c.json({
            conversationId: conversation.id,
            messages: messages.results || []
        });
    } catch (error: any) {
        console.error('History fetch error:', error);
        return c.json({ error: 'Failed to fetch conversation' }, 500);
    }
});

// Submit contact request
app.post('/api/contact', async (c) => {
    try {
        const body = await c.req.json() as {
            sessionId: string; name: string; email: string;
            phone?: string; message: string; type: 'call' | 'email' | 'meeting';
        };
        const { sessionId, name, email, phone, message, type } = body;

        if (!name || !email || !message || !type) {
            return c.json({ error: 'Missing required fields' }, 400);
        }

        const conversationId = await getOrCreateConversation(c.env.DB, sessionId);
        const contactId = generateId();
        const now = new Date().toISOString();

        await c.env.DB.prepare(
            'INSERT INTO contact_requests (id, conversation_id, name, email, phone, message, type, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(contactId, conversationId, name, email, phone || null, message, type, now, 'pending').run();

        return c.json({
            success: true, contactId,
            message: `Thank you for reaching out! Ela will ${type === 'call' ? 'call' : type === 'email' ? 'email' : 'schedule a meeting with'} you shortly.`,
            timestamp: now
        });
    } catch (error: any) {
        console.error('Contact error:', error);
        return c.json({ error: 'Failed to submit contact request', details: error.message }, 500);
    }
});

// Knowledge Base: Index documents
app.post('/api/kb/index', async (c) => {
    try {
        const body = await c.req.json() as {
            documents: Array<{ title: string; content: string; slug?: string; category?: string; tier?: number }>;
        };
        const { documents } = body;
        if (!documents || documents.length === 0) {
            return c.json({ error: 'No documents provided' }, 400);
        }

        const results = [];
        for (const doc of documents) {
            const slug = doc.slug || doc.title.toLowerCase().replace(/\s+/g, '-');
            const category = doc.category || 'general';
            const tier = doc.tier || 3;
            const now = new Date().toISOString();

            const existing = await c.env.DB.prepare(
                'SELECT id FROM kb_documents WHERE slug = ?'
            ).bind(slug).first();

            let docId: number;
            if (existing) {
                docId = (existing as any).id;
                await c.env.DB.prepare('UPDATE kb_documents SET content = ?, category = ?, tier = ?, updated_at = ? WHERE id = ?').bind(doc.content, category, tier, now, docId).run();
                await c.env.DB.prepare('DELETE FROM kb_chunks WHERE document_id = ?').bind(docId).run();
            } else {
                const docIdResult = await c.env.DB.prepare(
                    'INSERT INTO kb_documents (slug, title, doc_type, source_path, content, category, tier, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
                ).bind(slug, doc.title, 'markdown', `/projects/${slug}.md`, doc.content, category, tier, now, now).run();
                docId = (docIdResult.meta.last_row_id as unknown as number);
            }

            const chunks = chunkMarkdown(doc.content, doc.title);
            const chunkTexts = chunks.map(ch => ch.content);
            const embeddings = await batchGenerateEmbeddings(chunkTexts, c.env.AI);

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const embedding = embeddings[i];
                const serialized = serializeVector(embedding);
                await c.env.DB.prepare(
                    'INSERT INTO kb_chunks (document_id, chunk_index, content, heading, embedding, token_count) VALUES (?, ?, ?, ?, ?, ?)'
                ).bind(docId, i, chunk.content, chunk.heading, serialized, chunk.token_count).run();
            }

            results.push({ title: doc.title, slug, category, tier, chunks: chunks.length, status: existing ? 'updated' : 'created' });
        }

        return c.json({ success: true, indexed: results.length, results });
    } catch (error: any) {
        console.error('Indexing error:', error);
        return c.json({ error: 'Failed to index documents', details: error.message }, 500);
    }
});

// Knowledge Base: Search
app.post('/api/kb/search', async (c) => {
    try {
        const body = await c.req.json() as { query: string; topK?: number };
        const { query, topK = 5 } = body;
        if (!query) return c.json({ error: 'Missing query' }, 400);

        const results = await searchKnowledgeBase(query, c.env.AI, c.env.DB, topK);
        return c.json({ success: true, query, results, count: results.length });
    } catch (error: any) {
        console.error('Search error:', error);
        return c.json({ error: 'Failed to search knowledge base', details: error.message }, 500);
    }
});

// Knowledge Base: Statistics
app.get('/api/kb/stats', async (c) => {
    try {
        const docsResult = await c.env.DB.prepare('SELECT COUNT(*) as count FROM kb_documents').first();
        const chunksResult = await c.env.DB.prepare('SELECT COUNT(*) as count FROM kb_chunks').first();
        const tokensResult = await c.env.DB.prepare('SELECT SUM(token_count) as total FROM kb_chunks').first();

        return c.json({
            success: true,
            documents: (docsResult as any)?.count || 0,
            chunks: (chunksResult as any)?.count || 0,
            totalTokens: (tokensResult as any)?.total || 0
        });
    } catch (error: any) {
        return c.json({ error: 'Failed to fetch stats', details: error.message }, 500);
    }
});

// ==========================================
// Admin API routes (protected by X-Admin-Key header)
// ==========================================
const adminAuth = async (c: any, next: any) => {
    const adminKey = c.req.header('X-Admin-Key');
    const expectedKey = c.env.ELA_ADMIN_API_KEY;
    if (!expectedKey) return c.json({ error: 'Admin API key not configured' }, 503);
    if (!adminKey || adminKey !== expectedKey) return c.json({ error: 'Unauthorized' }, 401);
    await next();
};

// Admin: List sessions
app.get('/api/admin/sessions', adminAuth, async (c) => {
    try {
        const limit = parseInt(c.req.query('limit') || '50');
        const offset = parseInt(c.req.query('offset') || '0');

        const sessions = await c.env.DB.prepare(`
            SELECT c.session_id, c.id as conversation_id, c.created_at, c.updated_at,
                (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count,
                (SELECT content FROM messages WHERE conversation_id = c.id AND role = 'user' ORDER BY created_at ASC LIMIT 1) as first_message
            FROM conversations c ORDER BY c.updated_at DESC LIMIT ? OFFSET ?
        `).bind(limit, offset).all();

        const totalResult = await c.env.DB.prepare('SELECT COUNT(*) as count FROM conversations').first();

        return c.json({
            success: true, sessions: sessions.results || [],
            total: (totalResult as any)?.count || 0, limit, offset
        });
    } catch (error: any) {
        return c.json({ error: 'Failed to fetch sessions', details: error.message }, 500);
    }
});

// Admin: Get interaction logs
app.get('/api/admin/logs', adminAuth, async (c) => {
    try {
        const sessionId = c.req.query('session_id');
        const requestId = c.req.query('request_id');
        const limit = parseInt(c.req.query('limit') || '100');
        const offset = parseInt(c.req.query('offset') || '0');

        let query: string;
        let countQuery: string;
        let params: any[];
        let countParams: any[];

        if (requestId) {
            query = 'SELECT * FROM interaction_logs WHERE request_id = ? ORDER BY step_order ASC LIMIT ? OFFSET ?';
            countQuery = 'SELECT COUNT(*) as total FROM interaction_logs WHERE request_id = ?';
            params = [requestId, limit, offset]; countParams = [requestId];
        } else if (sessionId) {
            query = 'SELECT * FROM interaction_logs WHERE session_id = ? ORDER BY created_at DESC, step_order ASC LIMIT ? OFFSET ?';
            countQuery = 'SELECT COUNT(*) as total FROM interaction_logs WHERE session_id = ?';
            params = [sessionId, limit, offset]; countParams = [sessionId];
        } else {
            query = 'SELECT * FROM interaction_logs ORDER BY created_at DESC LIMIT ? OFFSET ?';
            countQuery = 'SELECT COUNT(*) as total FROM interaction_logs';
            params = [limit, offset]; countParams = [];
        }

        const logs = await c.env.DB.prepare(query).bind(...params).all();
        const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first() as any;
        const total = countResult?.total || 0;

        return c.json({
            success: true, logs: logs.results || [],
            count: logs.results?.length || 0, total, limit, offset,
            hasMore: offset + limit < total
        });
    } catch (error: any) {
        return c.json({ error: 'Failed to fetch logs', details: error.message }, 500);
    }
});

// Admin: Get full session detail
app.get('/api/admin/sessions/:sessionId', adminAuth, async (c) => {
    try {
        const sessionId = c.req.param('sessionId');
        const conversation = await c.env.DB.prepare(
            'SELECT * FROM conversations WHERE session_id = ? ORDER BY created_at DESC LIMIT 1'
        ).bind(sessionId).first();
        if (!conversation) return c.json({ error: 'Session not found' }, 404);

        const [messages, logs, contacts, diagrams] = await Promise.all([
            c.env.DB.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').bind((conversation as any).id).all(),
            c.env.DB.prepare('SELECT * FROM interaction_logs WHERE session_id = ? ORDER BY created_at ASC, step_order ASC LIMIT 500').bind(sessionId).all(),
            c.env.DB.prepare('SELECT * FROM contact_requests WHERE conversation_id = ? ORDER BY created_at DESC').bind((conversation as any).id).all(),
            c.env.DB.prepare('SELECT * FROM diagrams_generated WHERE conversation_id = ? ORDER BY created_at DESC').bind((conversation as any).id).all()
        ]);

        return c.json({
            success: true, conversation,
            messages: messages.results || [], logs: logs.results || [],
            contacts: contacts.results || [], diagrams: diagrams.results || []
        });
    } catch (error: any) {
        return c.json({ error: 'Failed to fetch session detail', details: error.message }, 500);
    }
});

// Admin: Get AI provider configurations
app.get('/api/admin/providers', adminAuth, async (c) => {
    try {
        const providers = await c.env.DB.prepare('SELECT * FROM ai_provider_config ORDER BY is_active DESC').all();
        return c.json({ success: true, providers: providers.results || [] });
    } catch (error: any) {
        return c.json({ error: 'Failed to fetch providers', details: error.message }, 500);
    }
});

// Admin: Switch active AI provider
app.post('/api/admin/providers/switch', adminAuth, async (c) => {
    try {
        const body = await c.req.json() as { provider_id: number };
        const { provider_id } = body;
        if (!provider_id) return c.json({ error: 'Missing provider_id' }, 400);

        const provider = await c.env.DB.prepare('SELECT * FROM ai_provider_config WHERE id = ?').bind(provider_id).first();
        if (!provider) return c.json({ error: 'Provider not found' }, 404);

        if ((provider as any).provider === 'openai') {
            const dbKey = await c.env.DB.prepare(
                'SELECT api_key FROM api_keys_config WHERE service = ? AND is_enabled = 1 LIMIT 1'
            ).bind('openai').first() as any;
            if (!dbKey?.api_key && !c.env.OPENAI_API_KEY) {
                return c.json({ error: 'OpenAI API key is not configured', details: 'Add key in Admin > API Keys' }, 400);
            }
        }

        await c.env.DB.batch([
            c.env.DB.prepare("UPDATE ai_provider_config SET is_active = 0, updated_at = datetime('now')"),
            c.env.DB.prepare("UPDATE ai_provider_config SET is_active = 1, updated_at = datetime('now') WHERE id = ?").bind(provider_id)
        ]);

        return c.json({ success: true, message: `Switched to ${(provider as any).provider} provider`, active_provider: provider });
    } catch (error: any) {
        return c.json({ error: 'Failed to switch provider', details: error.message }, 500);
    }
});

// Admin: Update provider config
app.put('/api/admin/providers/:id', adminAuth, async (c) => {
    try {
        const id = parseInt(c.req.param('id'));
        const body = await c.req.json() as { model_chat?: string; model_diagram?: string; model_embedding?: string; config?: any };
        const updates: string[] = [];
        const values: any[] = [];

        if (body.model_chat) { updates.push('model_chat = ?'); values.push(body.model_chat); }
        if (body.model_diagram) { updates.push('model_diagram = ?'); values.push(body.model_diagram); }
        if (body.model_embedding) { updates.push('model_embedding = ?'); values.push(body.model_embedding); }
        if (body.config) { updates.push('config = ?'); values.push(JSON.stringify(body.config)); }

        if (updates.length === 0) return c.json({ error: 'No fields to update' }, 400);

        updates.push("updated_at = datetime('now')");
        values.push(id);

        await c.env.DB.prepare(`UPDATE ai_provider_config SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
        const updated = await c.env.DB.prepare('SELECT * FROM ai_provider_config WHERE id = ?').bind(id).first();
        return c.json({ success: true, provider: updated });
    } catch (error: any) {
        return c.json({ error: 'Failed to update provider', details: error.message }, 500);
    }
});

// Admin: Get API keys configuration
app.get('/api/admin/api-keys', adminAuth, async (c) => {
    try {
        const keys = await c.env.DB.prepare('SELECT id, service, is_enabled, config, updated_at FROM api_keys_config ORDER BY service').all();
        return c.json({ success: true, keys: keys.results || [] });
    } catch (error: any) {
        return c.json({ error: 'Failed to fetch API keys', details: error.message }, 500);
    }
});

// Admin: Update API key
app.post('/api/admin/api-keys/:service', adminAuth, async (c) => {
    try {
        const service = c.req.param('service');
        const body = await c.req.json() as { api_key?: string; is_enabled?: boolean; config?: any };
        const updates: string[] = [];
        const values: any[] = [];

        if (body.api_key !== undefined) { updates.push('api_key = ?'); values.push(body.api_key || null); }
        if (body.is_enabled !== undefined) { updates.push('is_enabled = ?'); values.push(body.is_enabled ? 1 : 0); }
        if (body.config) { updates.push('config = ?'); values.push(JSON.stringify(body.config)); }

        if (updates.length === 0) return c.json({ error: 'No fields to update' }, 400);

        updates.push("updated_at = datetime('now')");
        values.push(service);

        await c.env.DB.prepare(`UPDATE api_keys_config SET ${updates.join(', ')} WHERE service = ?`).bind(...values).run();
        const updated = await c.env.DB.prepare('SELECT id, service, is_enabled, config, updated_at FROM api_keys_config WHERE service = ?').bind(service).first();
        return c.json({ success: true, key: updated });
    } catch (error: any) {
        return c.json({ error: 'Failed to update API key', details: error.message }, 500);
    }
});

// Admin: List contact requests
app.get('/api/admin/contacts', adminAuth, async (c) => {
    try {
        const status = c.req.query('status');
        const limit = parseInt(c.req.query('limit') || '50');
        let query = 'SELECT * FROM contact_requests';
        const params: any[] = [];
        if (status) { query += ' WHERE status = ?'; params.push(status); }
        query += ' ORDER BY created_at DESC LIMIT ?';
        params.push(limit);
        const contacts = await c.env.DB.prepare(query).bind(...params).all();
        return c.json({ success: true, contacts: contacts.results || [] });
    } catch (error: any) {
        return c.json({ error: 'Failed to fetch contacts', details: error.message }, 500);
    }
});

// Admin: Update contact status
app.put('/api/admin/contacts/:id', adminAuth, async (c) => {
    try {
        const id = c.req.param('id');
        const body = await c.req.json() as { status: string };
        await c.env.DB.prepare('UPDATE contact_requests SET status = ? WHERE id = ?').bind(body.status, id).run();
        return c.json({ success: true });
    } catch (error: any) {
        return c.json({ error: 'Failed to update contact', details: error.message }, 500);
    }
});

// Admin: Dashboard stats
app.get('/api/admin/stats', adminAuth, async (c) => {
    try {
        const [conversations, messages, contacts, diagrams, logs, kbDocs, kbChunks] = await c.env.DB.batch([
            c.env.DB.prepare('SELECT COUNT(*) as count FROM conversations'),
            c.env.DB.prepare('SELECT COUNT(*) as count FROM messages'),
            c.env.DB.prepare("SELECT COUNT(*) as count FROM contact_requests WHERE status = 'pending'"),
            c.env.DB.prepare('SELECT COUNT(*) as count FROM diagrams_generated'),
            c.env.DB.prepare('SELECT COUNT(*) as count FROM interaction_logs'),
            c.env.DB.prepare('SELECT COUNT(*) as count FROM kb_documents'),
            c.env.DB.prepare('SELECT COUNT(*) as count FROM kb_chunks')
        ]);

        const recentSessions = await c.env.DB.prepare(
            "SELECT COUNT(DISTINCT session_id) as count FROM interaction_logs WHERE created_at > datetime('now', '-1 day')"
        ).first();

        const providerStats = await c.env.DB.prepare(`
            SELECT provider, model, COUNT(*) as call_count,
                   AVG(duration_ms) as avg_duration_ms,
                   SUM(tokens_in) as total_tokens_in,
                   SUM(tokens_out) as total_tokens_out
            FROM interaction_logs WHERE step IN ('ai_response', 'diagram_generated')
            GROUP BY provider, model
        `).all();

        return c.json({
            success: true,
            stats: {
                conversations: (conversations.results?.[0] as any)?.count || 0,
                messages: (messages.results?.[0] as any)?.count || 0,
                pending_contacts: (contacts.results?.[0] as any)?.count || 0,
                diagrams: (diagrams.results?.[0] as any)?.count || 0,
                interaction_logs: (logs.results?.[0] as any)?.count || 0,
                kb_documents: (kbDocs.results?.[0] as any)?.count || 0,
                kb_chunks: (kbChunks.results?.[0] as any)?.count || 0,
                recent_sessions_24h: (recentSessions as any)?.count || 0
            },
            provider_usage: providerStats.results || []
        });
    } catch (error: any) {
        return c.json({ error: 'Failed to fetch stats', details: error.message }, 500);
    }
});

// Admin: Knowledge Base documents and chunks
app.get('/api/admin/kb/documents', adminAuth, async (c) => {
    try {
        const docs = await c.env.DB.prepare(`
            SELECT
                id, title, slug, doc_type, created_at, updated_at,
                (SELECT COUNT(*) FROM kb_chunks WHERE document_id = kb_documents.id) as chunk_count,
                (SELECT SUM(token_count) FROM kb_chunks WHERE document_id = kb_documents.id) as total_tokens
            FROM kb_documents
            ORDER BY created_at DESC
        `).all();

        return c.json({
            success: true,
            documents: docs.results || [],
            count: (docs.results || []).length
        });
    } catch (error: any) {
        return c.json({ error: 'Failed to fetch KB documents', details: error.message }, 500);
    }
});

// Admin: Knowledge Base chunks for a document
app.get('/api/admin/kb/documents/:docId/chunks', adminAuth, async (c) => {
    try {
        const docId = c.req.param('docId');
        const doc = await c.env.DB.prepare('SELECT id, title FROM kb_documents WHERE id = ?').bind(docId).first();

        if (!doc) return c.json({ error: 'Document not found' }, 404);

        const chunks = await c.env.DB.prepare(`
            SELECT id, heading, content, token_count
            FROM kb_chunks
            WHERE document_id = ?
            ORDER BY id ASC
        `).bind(docId).all();

        return c.json({
            success: true,
            document: doc,
            chunks: chunks.results || [],
            count: (chunks.results || []).length
        });
    } catch (error: any) {
        return c.json({ error: 'Failed to fetch KB chunks', details: error.message }, 500);
    }
});

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok' }));

// 404 handler
app.all('*', (c) => c.json({ error: 'Not found' }, 404));

export default app;
