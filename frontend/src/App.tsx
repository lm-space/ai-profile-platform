import React, { useState, useEffect, useRef } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { DiagramModal } from './components/DiagramModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles.css';

// Use workers.dev domain for API (Cloudflare Workers backend)
const API_BASE = import.meta.env.DEV ? '/api' : 'https://elamurugan-api.rugan.workers.dev/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  isIntro?: boolean;
  diagram?: {
    type: string;
    syntax: string;
    title: string;
  };
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => {
    const stored = localStorage.getItem('elamurugan_session_id');
    if (stored) return stored;
    const newId = `session_${Math.random().toString(36).substring(2)}`;
    localStorage.setItem('elamurugan_session_id', newId);
    return newId;
  });
  const [showChat, setShowChat] = useState(false);
  const [selectedDiagram, setSelectedDiagram] = useState<{type: string; syntax: string; title: string} | null>(null);
  const [showDiagramModal, setShowDiagramModal] = useState(false);
  const [isExpandedChat, setIsExpandedChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversationHistory();
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversationHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/conversations/${sessionId}`);
      const data = await response.json();
      if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
        setMessages(data.messages);
      }
      // If no history, start with empty messages (no test diagram)
    } catch (error) {
      console.error('Failed to load conversation:', error);
      // Start with empty messages on error
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Optimistic update - add user message immediately
    const userMessageId = Math.random().toString();
    const assistantMessageId = Math.random().toString();
    setMessages(prev => [
      ...prev,
      { id: userMessageId, role: 'user', content: message }
    ]);
    setLoading(true);

    try {
      // Use SSE streaming endpoint for real-time token delivery
      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message })
      });

      if (!response.ok) {
        // Fallback to non-streaming endpoint if stream fails
        const fallbackResponse = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, message })
        });
        const data = await fallbackResponse.json();
        if (data.success) {
          setMessages(prev => {
            const newMessages: Message[] = [...prev];
            if (data.intro) {
              newMessages.push({
                id: `intro_${assistantMessageId}`,
                role: 'assistant',
                content: data.intro,
                isIntro: true
              });
            }
            newMessages.push({
              id: assistantMessageId,
              role: 'assistant',
              content: data.assistantMessage,
              diagram: data.diagram || undefined
            });
            return newMessages;
          });
        }
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let streamedContent = '';
      let introAdded = false;
      let assistantAdded = false;
      let streamDiagram: { type: string; syntax: string; title: string } | undefined;

      const processSSELine = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) return;

        try {
          const payload = JSON.parse(trimmed.slice(6));

          if (payload.type === 'meta') {
            if (payload.intro && !introAdded) {
              introAdded = true;
              setMessages(prev => [
                ...prev,
                {
                  id: `intro_${assistantMessageId}`,
                  role: 'assistant',
                  content: payload.intro,
                  isIntro: true
                }
              ]);
            }
            if (!assistantAdded) {
              assistantAdded = true;
              setMessages(prev => [
                ...prev,
                {
                  id: assistantMessageId,
                  role: 'assistant',
                  content: ''
                }
              ]);
              setLoading(false);
            }
          } else if (payload.type === 'token' && payload.text) {
            streamedContent += payload.text;
            const currentContent = streamedContent;
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantMessageId
                  ? { ...m, content: currentContent }
                  : m
              )
            );
          } else if (payload.type === 'diagram' && payload.diagram) {
            streamDiagram = payload.diagram;
            // Attach diagram immediately (don't wait for 'end')
            const diagramToAttach = payload.diagram;
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantMessageId
                  ? { ...m, diagram: diagramToAttach }
                  : m
              )
            );
          } else if (payload.type === 'end') {
            // Final attachment in case diagram arrived with end
            if (streamDiagram) {
              const diagramFinal = streamDiagram;
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMessageId
                    ? { ...m, diagram: diagramFinal }
                    : m
                )
              );
            }
          }
        } catch {
          // Skip unparseable SSE lines
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          processSSELine(line);
        }
      }

      // Process any remaining buffer after stream closes
      if (buffer.trim()) {
        for (const line of buffer.split('\n')) {
          processSSELine(line);
        }
      }

      // Strip any Mermaid syntax the AI may have included in its text response
      // The diagram pipeline handles diagrams separately — raw syntax in text is a bug
      const cleanMermaid = (text: string): string => {
        let cleaned = text.replace(/```mermaid[\s\S]*?```/gi, '');
        cleaned = cleaned.replace(/\n?(flowchart\s+(?:TD|TB|LR|RL|BT)\s*\n(?:\s+.*\n)*)/gi, '');
        cleaned = cleaned.replace(/\n?(graph\s+(?:TD|TB|LR|RL|BT)\s*\n(?:\s+.*\n)*)/gi, '');
        cleaned = cleaned.replace(/\n?(sequenceDiagram\s*\n(?:\s+.*\n)*)/gi, '');
        cleaned = cleaned.replace(/\n?(classDiagram\s*\n(?:\s+.*\n)*)/gi, '');
        cleaned = cleaned.replace(/\n?(?:Here(?:'s| is) (?:a|the) (?:flow |architecture |sequence |class )?(?:diagram|visualization|chart)[:\s]*)\n?/gi, '');
        cleaned = cleaned.replace(/\n?(?:Now,? I (?:will|'ll) (?:generate|create) (?:a )?(?:flow )?diagram[:\s]*)\n?/gi, '');
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
        return cleaned.trim();
      };

      // Clean up streamed content and update the message
      if (streamedContent) {
        const cleanedContent = cleanMermaid(streamedContent);
        if (cleanedContent !== streamedContent) {
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMessageId
                ? { ...m, content: cleanedContent }
                : m
            )
          );
        }
      }

      // Final safety: attach diagram if it arrived but wasn't applied
      if (streamDiagram) {
        const diagramSafety = streamDiagram;
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMessageId && !m.diagram
              ? { ...m, diagram: diagramSafety }
              : m
          )
        );
      }

      // If no tokens were streamed (edge case), ensure loading stops
      if (!assistantAdded && streamedContent === '') {
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    // Clear current conversation and start fresh
    setMessages([]);
    // Create new session ID for fresh conversation
    const newSessionId = `session_${Math.random().toString(36).substring(2)}`;
    localStorage.setItem('elamurugan_session_id', newSessionId);
    // Reload to pick up new session
    window.location.reload();
  };

  return (
    <ErrorBoundary>
      <>
        <div className="glow glow-1"></div>
        <div className="glow glow-2"></div>
        <div className="glow glow-3"></div>

      {/* HERO */}
      <section className="hero" id="about">
        <div className="wrap">
          <div className="hero-inner">
            <div className="ani">
              <div className="hero-badge">
                <span className="dot"></span>Enterprise Tech Architect
              </div>
              <h1>Elamurugan<br /><em>Nallathambi</em></h1>
              <p className="hero-sub">Enterprise Solution Architect with 18+ years architecting scalable commerce platforms. 200+ Magento stores delivered globally. Deep expertise in SAP/ERP integration, cloud architecture (AWS/Azure/Kubernetes), Databricks data engineering, and AI/LLM applications. Bridging business intent with technical execution — hands-on builder, team enabler, systems thinker.</p>
              <div className="hero-stats">
                <div className="hero-stat"><div className="num">19+</div><div className="lbl">Years Experience</div></div>
                <div className="hero-stat"><div className="num">200+</div><div className="lbl">Stores Delivered</div></div>
                <div className="hero-stat"><div className="num">10+</div><div className="lbl">Teams Led</div></div>
              </div>
            </div>
            <div className="hero-visual ani d2">
              <div className="hero-terminal">
                <div className="terminal-bar">
                  <span className="terminal-dot td-r"></span>
                  <span className="terminal-dot td-y"></span>
                  <span className="terminal-dot td-g"></span>
                  <span className="terminal-title">ela.config.ts</span>
                </div>
                <div className="terminal-body">
                  <span className="t-comment">// current focus</span><br />
                  <span className="t-key">role</span>: <span className="t-str">"Tech Architect"</span><br />
                  <span className="t-key">domain</span>: <span className="t-str">"Commerce Platforms"</span><br />
                  <span className="t-key">cloud</span>: <span className="t-str">"AWS · Docker · K8s"</span><br />
                  <span className="t-key">stack</span>: <span className="t-str">"Next.js · React · Node"</span><br />
                  <span className="t-key">data</span>: <span className="t-str">"Databricks · Delta Lake · Spark"</span><br />
                  <span className="t-key">erp</span>: <span className="t-str">"SAP ECC · IDoc · EDI X12"</span><br />
                  <span className="t-key">ai</span>: <span className="t-str">"RAG · LLM · Vector DB"</span><br />
                  <span className="t-key">devops</span>: <span className="t-str">"CI/CD · Terraform · GitOps"</span><br />
                  <span className="t-key">philosophy</span>: <span className="t-str">"Code first. Automate everything."</span><br />
                  <span className="t-comment">// polyglot — no tool boundaries</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section id="philosophy">
        <div className="wrap">
          <div className="sec-label">Philosophy</div>
          <h2 className="sec-title">How I Work</h2>
          <p className="sec-desc">Principles forged over a decade of building systems that ship, scale, and survive production.</p>
          <div className="phil-grid">
            <div className="phil-card ani"><div className="phil-icon">⚡</div><h3>Code-First Development</h3><p>Diagram-backed, but always code-first. Architecture decisions validated through working prototypes, not slides.</p></div>
            <div className="phil-card ani d1"><div className="phil-icon">🔄</div><h3>Automate Everything</h3><p>If it runs twice, automate it. CI/CD pipelines, infrastructure as code, testing frameworks — remove the human bottleneck.</p></div>
            <div className="phil-card ani d2"><div className="phil-icon">🧭</div><h3>No-Boundary Learning</h3><p>Tools are enablers, not identities. PHP to Java to TypeScript to Python — the right tool for the right problem.</p></div>
            <div className="phil-card ani d3"><div className="phil-icon">📐</div><h3>Translate Complexity</h3><p>Business intent into specs. Specs into diagrams. Diagrams into running code. Clarity at every layer.</p></div>
            <div className="phil-card ani d4"><div className="phil-icon">🚀</div><h3>Performance Is a Feature</h3><p>Sub-2-second load times aren't optional. Server tuning, code optimization, caching strategies — baked in from day one.</p></div>
            <div className="phil-card ani d5"><div className="phil-icon">🤝</div><h3>Lead by Doing</h3><p>Architecture reviews and code reviews happen at the same desk. Hands-on leadership that earns credibility through contribution.</p></div>
          </div>
        </div>
      </section>

      {/* EXPERIENCE */}
      <section id="experience">
        <div className="wrap">
          <div className="sec-label">Experience</div>
          <h2 className="sec-title">Career Timeline</h2>
          <p className="sec-desc">From building LAMP-stack web apps in 2004 to architecting enterprise serverless platforms — 19+ years of shipping at scale.</p>
          <div className="exp-list">
            <div className="exp-card ani">
              <div className="exp-top">
                <div><div className="exp-company">Cognizant Technology Solutions</div><div className="exp-role">Senior Technical Manager & Tech Architect</div></div>
                <span className="exp-date">Aug 2019 – Present</span>
              </div>
              <div className="exp-desc">Enterprise Solution Architect for Fortune 500 clients including Sealed Air and R.J. Reynolds. Architecture ownership for B2B/B2C commerce, SAP ECC integration (IDoc, EDI X12, BAPI), Azure/AWS infrastructure, and Databricks data engineering. Leading 10-16 engineer teams across Magento, .NET, AEM/React, and SAP tracks. Built Spark ETL pipelines, Delta Lake analytics, and achieved 60% reduction in incident response times.</div>
            </div>

            <div className="exp-card ani d1">
              <div className="exp-top">
                <div><div className="exp-company">Digital Commerce Agency</div><div className="exp-role">Architect / Full Stack Developer</div></div>
                <span className="exp-date">Jan 2018 – Jul 2019</span>
              </div>
              <div className="exp-desc">Delivered 30+ web applications across education, healthcare, retail, and government. Led multi-store Magento 2 builds, platform migrations, and ERP integrations. Built the Munetrix data analytics platform (800+ school districts, ETL pipelines for NCES/census data, Angular/D3.js dashboards). Mentored 6 developers on Magento internals.</div>
            </div>

            <div className="exp-card ani d2">
              <div className="exp-top">
                <div><div className="exp-company">Self-Employed</div><div className="exp-role">eCommerce Architect / Solution Developer</div></div>
                <span className="exp-date">Feb 2011 – Nov 2017</span>
              </div>
              <div className="exp-desc">Built and ran a 22+ person team delivering 200+ Magento stores for global clients across wine, jewelry, sports, supplements, and more. Integrated SAP, Microsoft Dynamics, payment gateways (PayPal, Stripe, WorldPay), and shipping carriers. Built a custom MVC eCommerce framework from scratch. Achieved sub-2-second loads on 500K+ daily visitor sites.</div>
            </div>

            <div className="exp-card ani d3">
              <div className="exp-top">
                <div><div className="exp-company">Openwave Computing Services</div><div className="exp-role">Magento Developer / Integration Specialist</div></div>
                <span className="exp-date">Jul 2010 – Dec 2011</span>
              </div>
              <div className="exp-desc">Enterprise Magento store development for US/UK markets. SAP ECC and Microsoft Dynamics integrations via SOAP and flat-file exchange. Multi-store, multi-currency, multi-language setups.</div>
            </div>

            <div className="exp-card ani d4">
              <div className="exp-top">
                <div><div className="exp-company">SoftSolutions4u Ltd</div><div className="exp-role">Web Application Developer</div></div>
                <span className="exp-date">Sep 2008 – Sep 2010</span>
              </div>
              <div className="exp-desc">Full-stack LAMP development. Custom CMS platforms, Zend Framework apps, reusable PHP MVC framework. Where the journey began.</div>
            </div>
          </div>
        </div>
      </section>

      {/* SKILLS */}
      <section id="skills">
        <div className="wrap">
          <div className="sec-label">Technical Expertise</div>
          <h2 className="sec-title">Tools of the Trade</h2>
          <p className="sec-desc">19+ years of hands-on expertise since 2004. Polyglot engineer fluent across full stack eCommerce, cloud-native architecture, and enterprise platforms.</p>
          <div className="skills-grid">
            <div className="skill-block sb-green">
              <h3>eCommerce & Platforms</h3>
              <div className="skill-item"><span className="sk-dot"></span>Magento 1.x / 2.x (Expert, 10+ yrs)</div>
              <div className="skill-item"><span className="sk-dot"></span>Adobe Commerce Certified Plus</div>
              <div className="skill-item"><span className="sk-dot"></span>Custom MVC Framework Design</div>
              <div className="skill-item"><span className="sk-dot"></span>Multi-Vendor Marketplace Architecture</div>
              <div className="skill-item"><span className="sk-dot"></span>Headless Commerce Solutions</div>
            </div>
            <div className="skill-block sb-blue">
              <h3>Backend & Languages</h3>
              <div className="skill-item"><span className="sk-dot"></span>PHP (Master, 14 yrs) · Laravel · Zend · YII</div>
              <div className="skill-item"><span className="sk-dot"></span>Node.js (4+ yrs) · Express · REST APIs</div>
              <div className="skill-item"><span className="sk-dot"></span>Java · Spring Boot · Microservices</div>
              <div className="skill-item"><span className="sk-dot"></span>.NET MVC · C#</div>
              <div className="skill-item"><span className="sk-dot"></span>SOLID Design · DDD · Design Patterns</div>
            </div>
            <div className="skill-block sb-pink">
              <h3>Frontend & UI</h3>
              <div className="skill-item"><span className="sk-dot"></span>React · Component Architecture</div>
              <div className="skill-item"><span className="sk-dot"></span>Angular · Full-Featured SPAs</div>
              <div className="skill-item"><span className="sk-dot"></span>JavaScript / jQuery · DOM Optimization</div>
              <div className="skill-item"><span className="sk-dot"></span>HTML5 / CSS3 · LESS/SASS</div>
              <div className="skill-item"><span className="sk-dot"></span>SEO-Optimized UI · Mobile-First Design</div>
            </div>
            <div className="skill-block sb-amber">
              <h3>Cloud & DevOps</h3>
              <div className="skill-item"><span className="sk-dot"></span>AWS (EC2, RDS, S3, VPC, EKS, Lambda)</div>
              <div className="skill-item"><span className="sk-dot"></span>Kubernetes · Docker · Containerization</div>
              <div className="skill-item"><span className="sk-dot"></span>CI/CD (Jenkins, GitLab, GitHub Actions)</div>
              <div className="skill-item"><span className="sk-dot"></span>Infrastructure as Code · Terraform</div>
              <div className="skill-item"><span className="sk-dot"></span>Nginx · Apache · Varnish Cache</div>
            </div>

            <div className="skill-block sb-green">
              <h3>Performance & Testing</h3>
              <div className="skill-item"><span className="sk-dot"></span>Sub-2s Load Time Optimization</div>
              <div className="skill-item"><span className="sk-dot"></span>Server Tuning & Query Optimization</div>
              <div className="skill-item"><span className="sk-dot"></span>Redis · Memcached · Varnish</div>
              <div className="skill-item"><span className="sk-dot"></span>UI Automation (Cypress, Robot Framework)</div>
              <div className="skill-item"><span className="sk-dot"></span>Load Testing (JMeter, K6, Gatling)</div>
            </div>
            <div className="skill-block sb-blue">
              <h3>Databases & Data</h3>
              <div className="skill-item"><span className="sk-dot"></span>MySQL / PostgreSQL · Advanced Queries</div>
              <div className="skill-item"><span className="sk-dot"></span>Databricks · Spark ETL · Delta Lake</div>
              <div className="skill-item"><span className="sk-dot"></span>MongoDB · DynamoDB · Aurora</div>
              <div className="skill-item"><span className="sk-dot"></span>Unity Catalog · Data Governance</div>
              <div className="skill-item"><span className="sk-dot"></span>ETL Pipelines · Data Migration</div>
            </div>
            <div className="skill-block sb-pink">
              <h3>SAP & ERP Integration</h3>
              <div className="skill-item"><span className="sk-dot"></span>SAP ECC (MM/SD) · IDoc · BAPI/RFC</div>
              <div className="skill-item"><span className="sk-dot"></span>EDI X12 (850/856/810)</div>
              <div className="skill-item"><span className="sk-dot"></span>Microsoft Dynamics · SOAP/CSV</div>
              <div className="skill-item"><span className="sk-dot"></span>Azure Logic Apps · Service Bus</div>
              <div className="skill-item"><span className="sk-dot"></span>Payment: Worldpay · PayPal · Stripe</div>
            </div>
            <div className="skill-block sb-amber">
              <h3>AI & LLM</h3>
              <div className="skill-item"><span className="sk-dot"></span>OpenAI · Anthropic Claude APIs</div>
              <div className="skill-item"><span className="sk-dot"></span>RAG Pipelines · Vector Databases</div>
              <div className="skill-item"><span className="sk-dot"></span>LangChain · AI Agent Frameworks</div>
              <div className="skill-item"><span className="sk-dot"></span>Document Chunking · Embeddings</div>
              <div className="skill-item"><span className="sk-dot"></span>Conversational AI Applications</div>
            </div>
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section id="projects">
        <div className="wrap">
          <div className="sec-label">Signature Work</div>
          <h2 className="sec-title">Notable Projects</h2>
          <p className="sec-desc">200+ Magento stores, Fortune 500 platforms, complex migrations, and custom frameworks built over 19+ years since 2004.</p>
          <div className="proj-grid">
            <div className="proj-card featured ani" style={{backgroundImage: 'linear-gradient(135deg, rgba(100,223,180,0.1), rgba(100,223,180,0.05))'}}>
              <div style={{position:'relative',zIndex:2}}>
                <h3>200+ Magento Commerce Stores</h3>
                <p><strong>Wine, Sports, Jewelry, Apparel, Health & more — Global Industries</strong></p>
                <p style={{fontSize:'0.85rem',color:'var(--text-secondary)'}}>Countless hours since 2004 across all areas of the web — web apps, desktop applications, mobile APIs. Designed & architected 200+ eCommerce stores across Magento CE/EE/PE. Integrated ERP, SAP, MS Dynamics, payment & shipping providers. Achieved sub-2-second page loads on 500K+ daily user sites.</p>
                <p style={{fontSize:'0.8rem',color:'var(--text-secondary)',fontStyle:'italic',marginTop:'0.8rem'}}>Experience spans running small agencies & freelancing to leading enterprise teams of 10+ developers. 190+ additional projects delivered — some disclosed above, others under the hood. Feel free to ask about specific industries, platforms, or experiences. 👉</p>
                <div className="proj-tags"><span>Magento 1 & 2</span><span>Global Industries</span><span>ERP Integration</span><span>&lt;2s Load</span><span>2004-Present</span></div>
              </div>
              <div style={{position:'absolute',right:'1.5rem',top:'1.5rem',fontSize:'6rem',opacity:'0.08',zIndex:1}}>🌍</div>
            </div>

            <div className="proj-card ani d1" style={{backgroundImage: 'linear-gradient(135deg, rgba(124,140,248,0.1), rgba(124,140,248,0.05))'}}>
              <div style={{position:'relative',zIndex:2}}>
                <h3>Tobacco & Consumer Products — Pricing Modeler</h3>
                <p style={{fontSize:'0.85rem',color:'var(--text-secondary)'}}>Lead architect & developer for Fortune 500 tobacco & consumer products manufacturer. Building & maintaining Pricing Modeler web application alongside managing Magento 2 eCommerce platform. Leading 10+ developer teams on platform enhancements, business optimization, and enterprise-scale AWS infrastructure. Handling complex regulatory, compliance, high-volume transactions, and dynamic pricing logic.</p>
                <div className="proj-tags"><span>Magento 2</span><span>Pricing Modeler</span><span>Fortune 500</span><span>AWS</span><span>2020-Present</span></div>
              </div>
              <div style={{position:'absolute',right:'1.5rem',top:'1.5rem',fontSize:'6rem',opacity:'0.08',zIndex:1}}>🏢</div>
            </div>

            <div className="proj-card ani d2" style={{backgroundImage: 'linear-gradient(135deg, rgba(232,160,191,0.1), rgba(232,160,191,0.05))'}}>
              <div style={{position:'relative',zIndex:2}}>
                <h3>Healthcare & Wellness — Professional Supplement Distribution</h3>
                <p><strong>Healthcare & Wellness — Professional Supplement Distribution</strong></p>
                <p style={{fontSize:'0.85rem',color:'var(--text-secondary)'}}>Architected zero-downtime migration from Magento 1 to headless Magento 2 on AWS EKS. Achieved 70% page load improvement (6s → &lt;2s) via GraphQL optimization, CloudFront edge caching, Brotli compression, and code splitting. Node.js/Express integration microservices on ECS/Fargate. Terraform-managed infrastructure with multi-AZ Aurora and HPA.</p>
                <div className="proj-tags"><span>70% Faster</span><span>Zero Downtime</span><span>Headless</span><span>Kubernetes</span><span>GraphQL</span></div>
              </div>
              <div style={{position:'absolute',right:'1.5rem',top:'1.5rem',fontSize:'6rem',opacity:'0.08',zIndex:1}}>⬆️</div>
            </div>

            <div className="proj-card ani d3" style={{backgroundImage: 'linear-gradient(135deg, rgba(240,192,80,0.1), rgba(240,192,80,0.05))'}}>
              <div style={{position:'relative',zIndex:2}}>
                <h3>Custom Magento-like Framework</h3>
                <p><strong>Production eCommerce MVC Platform</strong></p>
                <p style={{fontSize:'0.85rem',color:'var(--text-secondary)'}}>Built XML layout-based templating, CSS/JS minification, multi-theming, SEO URL rewrites, admin CMS, layout caching. Handles 100K+ SKU platforms with sub-2-second load times.</p>
                <div className="proj-tags"><span>Custom PHP</span><span>MVC Pattern</span><span>XML Layouts</span><span>Performance</span><span>2012-Present</span></div>
              </div>
              <div style={{position:'absolute',right:'1.5rem',top:'1.5rem',fontSize:'6rem',opacity:'0.08',zIndex:1}}>🧱</div>
            </div>

            <div className="proj-card ani d4" style={{backgroundImage: 'linear-gradient(135deg, rgba(100,223,180,0.1), rgba(124,140,248,0.05))'}}>
              <div style={{position:'relative',zIndex:2}}>
                <h3>Multi-Vendor Marketplace</h3>
                <p><strong>Thousands of Vendors · Millions in Volume</strong></p>
                <p style={{fontSize:'0.85rem',color:'var(--text-secondary)'}}>Architected multi-vendor platforms with vendor dashboards, commission calculation, payment splitting, dispute resolution, order fulfillment routing. Supports thousands of vendors and millions in monthly transaction volume.</p>
                <div className="proj-tags"><span>Marketplace</span><span>Vendor APIs</span><span>Payments</span><span>Fulfillment</span></div>
              </div>
              <div style={{position:'absolute',right:'1.5rem',top:'1.5rem',fontSize:'6rem',opacity:'0.08',zIndex:1}}>🤝</div>
            </div>

            <div className="proj-card ani d5" style={{backgroundImage: 'linear-gradient(135deg, rgba(124,140,248,0.1), rgba(232,160,191,0.05))'}}>
              <div style={{position:'relative',zIndex:2}}>
                <h3>Fortune 500 B2B/B2C — SAP ECC Integration</h3>
                <p><strong>Industrial Packaging — Sealed Air Corporation</strong></p>
                <p style={{fontSize:'0.85rem',color:'var(--text-secondary)'}}>Enterprise architect for dual B2B (Magento Commerce Cloud) and B2C (AEM + headless Adobe Commerce) platforms. Built SAP integration layer with Azure Logic Apps, Service Bus, and .NET Core — handling IDoc (ORDERS05, DESADV, INVOIC), EDI X12 (850/856/810), and BAPI calls. Worldpay tokenized payments with 3DS and PCI-DSS compliance. Led 16 engineers across 4 technology tracks.</p>
                <div className="proj-tags"><span>SAP ECC</span><span>Azure</span><span>.NET Core</span><span>AEM + React</span><span>16 Engineers</span></div>
              </div>
              <div style={{position:'absolute',right:'1.5rem',top:'1.5rem',fontSize:'6rem',opacity:'0.08',zIndex:1}}>🏭</div>
            </div>

            <div className="proj-card ani d6" style={{backgroundImage: 'linear-gradient(135deg, rgba(240,192,80,0.1), rgba(124,140,248,0.05))'}}>
              <div style={{position:'relative',zIndex:2}}>
                <h3>Education Data Analytics — Munetrix</h3>
                <p><strong>800+ School Districts · Public Data ETL Platform</strong></p>
                <p style={{fontSize:'0.85rem',color:'var(--text-secondary)'}}>Built ETL pipelines aggregating NCES, M-STEP, NWEA MAP Growth, district financials, and census data for Michigan's government transparency platform. Angular/D3.js dashboards with role-based access, custom reports, and Tableau integration for fiscal benchmarking and school performance tracking.</p>
                <div className="proj-tags"><span>ETL Pipelines</span><span>Angular</span><span>D3.js</span><span>Tableau</span><span>800+ Districts</span></div>
              </div>
              <div style={{position:'absolute',right:'1.5rem',top:'1.5rem',fontSize:'6rem',opacity:'0.08',zIndex:1}}>📊</div>
            </div>
          </div>
        </div>
      </section>

      {/* CERTIFICATIONS */}
      <section id="certs">
        <div className="wrap">
          <div className="sec-label">Certifications</div>
          <h2 className="sec-title">Credentials</h2>
          <div className="cert-row">
            <div className="cert-card"><div className="cert-icon">🏅</div><h3>Adobe Commerce Certified Developer Plus</h3><p>Expert Level — <a href="https://u.magento.com/certification/directory/dev/21795/" target="_blank" rel="noopener" style={{color:'var(--accent)',textDecoration:'none'}}>Verify</a></p></div>
            <div className="cert-card"><div className="cert-icon">☁️</div><h3>AWS Certified Solutions Architect</h3><p>Hands-on with IaC, EKS, ECS, Fargate</p></div>
            <div className="cert-card"><div className="cert-icon">🎓</div><h3>B.Tech Information Technology</h3><p>Bharathidasan University, India — First Class</p></div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials">
        <div className="wrap">
          <div className="sec-label">What Colleagues Say</div>
          <h2 className="sec-title">Voices of Collaboration</h2>
          <div className="testimonial-carousel-container">
            <div className="testimonial-carousel">
              <div className="testimonial ani">
                <blockquote>Working with Ela was a great experience. He was incredibly capable in his technologies but beyond that he was always ready and able to help in any questions related to development. Whether it was personal or professional he would always provide the best support.</blockquote>
                <cite><strong>International IT Consultant</strong><br />Domino's</cite>
              </div>
              <div className="testimonial ani">
                <blockquote>Whenever anyone had any issue with bugs, architecture, environments, or any specific implementation we asked Ela. He was always interested in learning more about development and encouraged us all to be better developers. Any high priority issue we faced, Ela was integral in getting it fixed.</blockquote>
                <cite><strong>CTO</strong><br />Epika Fleet Services</cite>
              </div>
              <div className="testimonial ani">
                <blockquote>He is very knowledgeable in multiple programming languages, and especially specialized systems. He is also a great team player and collaborator. I know that he will elevate any technical team to the next level.</blockquote>
                <cite><strong>Business Analyst & UI Developer</strong><br />Tech Company</cite>
              </div>
              <div className="testimonial ani">
                <blockquote>He is a very dedicated person, quite passionate in his tasks. There are quite a few occasions I got the chance to collaborate during my college days, and I really enjoyed working with him. He is quite understanding and agile. Any team he is part of is lucky to have him.</blockquote>
                <cite><strong>Dynamics Specialist</strong><br />Tech Platform</cite>
              </div>
              <div className="testimonial ani">
                <blockquote>Elamurugan is a highly knowledgeable and dedicated person in his work. His insights in new trends of technology and web creation helps to upgrade knowledge levels. He is reliable and consistent in delivering results and a recommended professional.</blockquote>
                <cite><strong>Client & Project Manager</strong><br />Enterprise Solutions</cite>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHAT MODAL */}
      {showChat && (
        <div className="chat-modal">
          <div className={`chat-container ${isExpandedChat ? 'expanded' : ''}`}>
            <button className="close-btn" onClick={() => setShowChat(false)}>✕</button>
            <ChatWindow
              messages={messages}
              loading={loading}
              onSendMessage={handleSendMessage}
              onRestart={handleRestart}
              messagesEndRef={messagesEndRef}
              onShowDiagram={(diagram) => {
                if (diagram) {
                  setSelectedDiagram(diagram);
                  setShowDiagramModal(true);
                }
              }}
              isExpanded={isExpandedChat}
              onToggleExpand={() => setIsExpandedChat(!isExpandedChat)}
            />
          </div>
        </div>
      )}

      {!showChat && (
        <button className="floating-chat-btn" onClick={() => setShowChat(true)} title="Chat with Ela">💬</button>
      )}

      {/* DIAGRAM MODAL */}
      <DiagramModal
        diagram={selectedDiagram}
        isOpen={showDiagramModal}
        onClose={() => setShowDiagramModal(false)}
      />

        {/* SLIDESHOW CTA */}
        <section className="slideshow-cta">
          <div className="wrap" style={{textAlign:'center',padding:'3rem 0'}}>
            <a
              href="/slideshow.html"
              className="slideshow-btn"
              style={{
                display:'inline-flex',alignItems:'center',gap:'0.75rem',
                padding:'1rem 2.5rem',
                background:'linear-gradient(135deg, var(--accent), var(--accent2))',
                color:'#000',fontWeight:700,fontSize:'1rem',
                borderRadius:'50px',textDecoration:'none',
                transition:'transform 0.3s ease, box-shadow 0.3s ease',
                boxShadow:'0 4px 20px rgba(100,223,180,0.3)'
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.transform = 'scale(1.05)'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.transform = 'scale(1)'; }}
            >
              <span style={{fontSize:'1.3rem'}}>▶</span>
              Watch My Story — Full Screen Presentation
            </a>
            <p style={{color:'var(--text-dim)',fontSize:'0.8rem',marginTop:'0.75rem'}}>Use arrow keys to navigate · Press Space for auto-play</p>
          </div>
        </section>

        {/* FOOTER */}
        <footer id="contact">
          <div className="wrap">
            <div className="footer-headline">Let's Build Something That Scales</div>
            <div className="footer-sub">Architecting scalable commerce platforms. Bridging business intent with technical execution.</div>
            <div style={{display:'flex',justifyContent:'center',gap:'1.5rem',margin:'1rem 0',flexWrap:'wrap'}}>
              <a href="https://linkedin.com/in/elamurugan" target="_blank" rel="noopener" style={{color:'var(--accent)',textDecoration:'none',fontSize:'0.85rem'}}>LinkedIn</a>
              <a href="https://github.com/elamurugan" target="_blank" rel="noopener" style={{color:'var(--accent)',textDecoration:'none',fontSize:'0.85rem'}}>GitHub</a>
              <a href="mailto:elamurugan.nallathambi@gmail.com" style={{color:'var(--accent)',textDecoration:'none',fontSize:'0.85rem'}}>Email</a>
            </div>
            <div className="footer-copy">© 2026 Elamurugan Nallathambi · Charlotte, NC</div>
          </div>
        </footer>
      </>
    </ErrorBoundary>
  );
}
