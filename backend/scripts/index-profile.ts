/**
 * Script to index Ela's profile into the Knowledge Base
 * Run this via: curl -X POST https://elamurugan-api.rugan.workers.dev/api/kb/index -H "Content-Type: application/json" -d @profile-kb.json
 *
 * This script generates the JSON payload for the KB indexing API.
 * The profile is split into logical documents for better RAG retrieval.
 */

// Each document below should be sent to POST /api/kb/index as:
// { "documents": [ { "title": "...", "content": "...", "slug": "..." }, ... ] }

const documents = [
  {
    title: "Ela - Professional Overview & Contact",
    slug: "ela-overview",
    content: `# Elamurugan Nallathambi - Professional Overview

## Contact Information
- Full Name: Elamurugan Nallathambi (Ela)
- Location: Charlotte, North Carolina, USA
- Phone: +1-313-753-0175
- Email: elamurugan.nallathambi@gmail.com
- LinkedIn: linkedin.com/in/elamurugan
- Portfolio: elamurugan.pages.dev
- GitHub: github.com/elamurugan

## Current Position
Senior Technical Manager & Enterprise Solution Architect at Cognizant Technology Solutions (Aug 2019 - Present), Charlotte, NC.

## Profile Summary
Enterprise Solution Architect with 18+ years of professional experience (2008-present). Started writing code in 2008 and never stopped. Gone from LAMP-stack websites to owning enterprise architecture for large-scale commerce platforms where SAP integration, cloud infrastructure, and data pipelines all have to work together.

Core is eCommerce and ERP/SAP integration across .NET, Node.js, Java, and PHP stacks on AWS and Azure, with Redis, Kubernetes, Grafana, and CI/CD automation. Hands-on with Databricks/Lakehouse pipelines and building LLM-powered applications with RAG, vector databases, and AI agents.

Managed and delivered with teams ranging from small startups to 16+ engineers — building working, maintainable systems while staying close to architecture decisions, code reviews, and production issues.

## Key Statistics
- 18+ years professional experience (2008-present)
- 200+ Magento stores delivered across global industries
- 30+ web applications at OneTeam across education, healthcare, retail, government
- 16 engineers led on largest project (Sealed Air)
- 22+ person team managed at EBDUS startup
- 500K+ daily users supported on single platforms
- Sub-2-second average page load time achieved consistently
- 70% page load improvement on Emerson Ecologics platform
- 60% reduction in incident response time at RJR
- 100% data integrity maintained during Magento 1→2 migrations
- Zero downtime deployments using blue-green strategies

## Education & Credentials
- B.Tech, Information Technology — Bharathidasan University, India (2008, First Class)
- AWS Certified Solutions Architect (2016)
- Adobe Commerce Certified Developer Plus (2017) - Verify at u.magento.com/certification/directory/dev/21795/
- Adobe Commerce Certified Developer (2016)
- US Work Authorization`
  },
  {
    title: "Ela - Cognizant & Fortune 500 Projects",
    slug: "ela-cognizant-projects",
    content: `# Cognizant Technology Solutions - Enterprise Projects (2019-Present)

## Sealed Air Corporation — B2B & B2C Commerce Platforms
Role: Enterprise Architect | Team Size: 16 engineers across Magento, .NET, AEM/React, and SAP tracks | Industry: Industrial packaging (Fortune 500)

### Architecture Overview
Sealed Air had two distinct commerce needs — a B2B portal for business clients and a B2C retail storefront for consumers. These were designed as separate platforms with shared SAP integration infrastructure.

### B2B Platform
- Built on Magento Commerce Cloud for business client ordering
- Customer-specific pricing, contract terms, bulk ordering
- SAP-connected catalog, inventory, and order management

### B2C Platform
- Headless architecture: AEM (Adobe Experience Manager) with React on the frontend
- Adobe Commerce (Magento) as the backend commerce engine (APIs only)
- Separate content management (AEM) and commerce logic (Adobe Commerce)
- Decoupled frontend for performance and flexibility

### SAP ECC Integration (Core Architecture)
- Integration layer built with Azure Logic Apps, Azure Service Bus, and .NET Core Web API (C#, Entity Framework)
- IDoc message types: ORDERS05 (purchase orders), DESADV (advance shipping notice), INVOIC (invoices)
- EDI X12 documents: 850 (purchase order), 856 (advance ship notice), 810 (invoice)
- BAPI calls for: customer master data, material master data, pricing conditions, ATP stock checks
- SAP modules involved: MM (Materials Management) and SD (Sales & Distribution)

### Full Order-to-Delivery Flow
1. Order capture on commerce platform
2. IDoc transmitted to SAP SD
3. Delivery processing in SAP
4. Shipment confirmation via DESADV IDoc
5. Invoice posting via INVOIC IDoc
6. Worldpay payment integration: tokenized payments, 3D Secure (3DS), PCI-DSS compliant
7. Reconciliation feeds to SAP FI (Financial Accounting)

### Infrastructure & DevOps
- Redis caching via Azure Cache for Redis
- Azure AD B2C for authentication (OAuth2/JWT)
- Monitoring: Azure Monitor, Application Insights, Grafana
- CI/CD: Azure DevOps with deployments to App Service and AKS (Azure Kubernetes Service)

Technologies: Magento Commerce Cloud, Adobe Commerce, AEM, React, .NET Core, C#, Entity Framework, Azure Logic Apps, Azure Service Bus, Azure AD B2C, Azure DevOps, AKS, Redis, Grafana, SAP ECC, IDoc, EDI X12, BAPI, Worldpay

---

## Emerson Ecologics (wellevate.me) — B2C Dispensary Platform
Role: Enterprise Architect | Duration: Aug 2019 – Sep 2020 | Industry: Healthcare/Supplements
Domain: wellevate.me — Professional-grade supplement dispensary for practitioners and patients

### Platform Migration
- Migrated from Magento 1 to headless Magento 2 on AWS EKS (Kubernetes)
- GraphQL + REST API layer serving the React frontend
- Dual portal: practitioner portal and patient-facing dispensary

### Integration Microservices
- Node.js/Express integration microservices running on ECS/Fargate
- Connected with ERP/SAP for: order fulfillment, inventory sync, pricing, returns

### Performance Achievement — 70% Page Load Improvement
- Achieved under 2-second load times (down from legacy 6+ seconds)
- Headless Kubernetes architecture (eliminated Magento frontend overhead)
- GraphQL optimization: persisted queries, query batching
- CloudFront edge caching with origin shield
- Brotli compression, WebP lazy loading, code splitting
- ElastiCache for API response caching

### Infrastructure
- Terraform-managed infrastructure (IaC)
- Horizontal Pod Autoscaling (HPA) for traffic spikes
- ALB ingress controllers
- Multi-AZ RDS Aurora for database high availability
- Event-driven processing via SQS/SNS/Lambda
- Monitoring: CloudWatch, NewRelic APM, Grafana

### Migration Results
- 100% data integrity maintained, zero downtime during migration
- 70% improvement in page load times
- Improved mobile experience via headless approach

---

## R.J. Reynolds Tobacco Company — B2C eCommerce & PACE Application
Role: Technical Architect | Duration: Sep 2020 – Present | Industry: Tobacco / Age-Gated Commerce
Brands Managed: Camel, Newport, Vuse, Velo, Doral, Eclipse, Kent, Pall Mall | Team Size: 10+ developers

### B2C eCommerce Platform
- Enterprise Magento 2 / Adobe Commerce serving RJR's brand portfolio
- Age-gated compliance eCommerce with strict verification
- AWS: EC2, RDS Aurora, S3, CloudFront, VPC
- Caching: Redis, Varnish, Fastly for sub-2-second loads
- CI/CD: Azure DevOps with blue-green deployments
- Cut incident response time by 60%

### PACE Application (Data Engineering)
- Hands-on Databricks notebooks and data workflows
- Built Spark-based ETL pipelines to transform product, compliance, and sales data
- Data stored in Delta Lake tables feeding the application layer
- Databricks Jobs for orchestration
- Unity Catalog for data governance`
  },
  {
    title: "Ela - OneTeam & Munetrix",
    slug: "ela-oneteam-munetrix",
    content: `# OneTeam US LLC (May 2017 – Jul 2019) — Digital Commerce Agency
Role: Senior Developer / Technical Lead / eCommerce SME
Location: Troy, Michigan

## Scope
Worked directly with US clients to solution, architect, and deliver 30+ web applications and eCommerce platforms across education, healthcare, retail, and government verticals — leading offshore development teams from scoping through production deployment.

## Notable Project: Munetrix (munetrix.com)
Michigan-based government and education data analytics platform used by 800+ school districts.

### What I Built
- ETL pipelines to aggregate large-scale public datasets: NCES (National Center for Education Statistics), M-STEP (Michigan state assessments), NWEA (MAP Growth), district financials, census data
- Data aggregated into normalized schemas for analysis
- Tableau integration for reporting and analytics
- Custom Angular/D3.js dashboards with role-based access levels and custom reports
- Purpose: government transparency, fiscal benchmarking, school performance tracking across Michigan

## eCommerce Delivery
- Delivered multi-store Magento 2 Commerce builds with complex catalog, multi-warehouse inventory, and custom shipping
- Ran Magento 1 to Magento 2 migrations end-to-end
- Designed REST/SOAP integrations with ERP systems, payment processors (Authorize.Net, Braintree, PayPal), and shipping carriers

## Technology Stack
- Backend: Node.js (Express), Java (Spring Boot), MongoDB, MySQL
- Frontend: Angular 5, React 16 with Redux
- DevOps: Docker dev environments, Jenkins CI/CD
- Performance: Varnish, Redis, Nginx tuning
- Mentored 6 developers on Magento 2 internals`
  },
  {
    title: "Ela - EBDUS Startup & 200+ Stores",
    slug: "ela-ebdus-startup",
    content: `# EBDUS LLC / MakeGoodMedia (Feb 2011 – Apr 2017) — Self-Employed / eCommerce Architect
Role: Lead Developer / Solution Architect / Delivery Manager
Location: Chennai, India

## Context
This was a startup where Ela wore every hat over six years. Not a linear progression — doing all of it simultaneously. Coding, architecting, scoping projects with clients, estimating, planning deliveries, and managing a team of 22+ people across development, QA, design, and infrastructure. Switching between hands-on development and client-facing delivery daily.

## Magento Store Delivery
- Designed, built, and shipped 200+ Magento 1 stores (Community Edition, Enterprise Edition, Professional Edition) for global clients
- Industries: wine, jewelry, sports, supplements, home goods, cultural marketplaces, action sports retail
- Integrated with SAP and Microsoft Dynamics using SOAP/XML-RPC APIs, cron-based sync, and flat-file exchange (CSV, EDI) for orders, inventory, customers, and pricing

## Platform Development
- Built multi-vendor marketplace platforms with PHP admin portals (Zend, YII)
- MySQL backends, commission engines, order routing, vendor dashboards
- REST APIs for mobile backends
- Amazon/eBay marketplace feeds
- Payment integrations: PayPal, Stripe, Authorize.Net, Braintree, WorldPay

## Performance Engineering
- Got page loads under 2 seconds on 500K+ daily visitor sites
- Varnish full-page cache, Memcached/Redis, MySQL query tuning, Nginx optimization
- Deployed across AWS, Rackspace, MageMojo, DigitalOcean
- Early deployment automation: Capistrano, Ansible

## Custom MVC Framework
Built a custom MVC eCommerce framework from scratch (inspired by Magento's architecture):
- XML layout-based templating engine
- Multi-theme inheritance system
- Page-level CSS/JS minification and concatenation
- SEO-friendly URL rewrite engine
- Admin CMS and site management
- Advanced layout caching engine
- Module-based architecture
- Used in production for multiple e-commerce implementations with 100K+ SKUs

## Notable Clients
WineCellarAge, VintageTub, West49, DiamondWave, Landmark Athletics, Thangamayil, Irtto, and 190+ more across US, UK, Canada, Australia.`
  },
  {
    title: "Ela - Technical Competencies & Architecture",
    slug: "ela-technical-competencies",
    content: `# Elamurugan's Technical Competencies

## Architecture & Leadership
- Enterprise Solution Design, Microservices, Event-Driven Architecture
- Headless Commerce, API-First Design, Domain-Driven Design (DDD)
- SLA-Based Workflows, High Availability Patterns
- Cross-functional team leadership (10–16 engineers), Stakeholder Management
- Architecture Governance, Mentoring, Agile/Scrum

## Cloud & DevOps
- AWS: EC2, S3, RDS, ECS, EKS, Lambda, SQS, SNS, CloudFront, ElastiCache, API Gateway, VPC, Aurora, Fargate
- Azure: Logic Apps, Service Bus, Functions, API Management, DevOps, AKS, Azure AD B2C, Azure Cache for Redis, Azure Monitor, Application Insights, App Service
- Containers: Docker, Kubernetes (EKS, AKS), Horizontal Pod Autoscaling, ALB Ingress, Multi-AZ
- IaC: Terraform, CloudFormation, Ansible, Capistrano
- CI/CD: Jenkins, GitLab CI, GitHub Actions, Azure DevOps, Blue-Green Deployments
- Monitoring: Grafana, Prometheus, NewRelic APM, CloudWatch, Application Insights, EFK Stack

## Backend & APIs
- Node.js/Express: Integration microservices, REST APIs
- Java/Spring Boot: Backend services, microservices
- .NET Core/Web API/C#: Enterprise APIs, Entity Framework, Azure integration
- PHP: Magento 1.x/2.x/Adobe Commerce (Expert, 14+ years), Laravel, Zend, YII
- Python: Scripting, ETL, data processing
- API Protocols: GraphQL, REST, SOAP, OAuth2/JWT, XML-RPC

## SAP & ERP Integration
- SAP ECC (MM/SD modules), IDoc (ORDERS05, DESADV, INVOIC)
- EDI X12 (850/856/810), BAPI/RFC
- SAP SNC, SAP FI reconciliation
- Microsoft Dynamics integration (SOAP, CSV/XML flat-file)
- Azure Logic Apps, Azure Service Bus, Middleware/ESB patterns

## Data & AI
- Databricks: Notebooks, Spark ETL, Delta Lake, Databricks Jobs, Unity Catalog
- Databases: MySQL, PostgreSQL, MongoDB, Oracle, DynamoDB, Aurora
- Caching: Redis, Varnish, Memcached, ElastiCache, CloudFront
- AI/LLM: OpenAI API, Anthropic Claude API, RAG Pipelines, Vector databases (Pinecone, ChromaDB), LangChain, AI agents
- ETL/ELT, public data analytics (NCES, census, M-STEP, NWEA)

## Performance Engineering
- Sub-2-second page load targets on 500K+ daily visitor sites
- Varnish, Redis, Memcached, MySQL query tuning, InnoDB optimization
- Nginx, CDN (CloudFront, Fastly), Brotli compression, WebP lazy loading
- GraphQL optimization: persisted queries, batching
- Load testing: JMeter, K6, Gatling, Blackfire profiling

## Architectural Philosophy
1. Code-first, diagram-backed — Architecture validated through working code
2. Automate everything — CI/CD, testing, monitoring, deployment
3. No-boundary learning — PHP → Java → Node.js → .NET → Python as needed
4. Translate complexity — Business intent → Specs → Architecture → Running code
5. Lead by doing — Architecture reviews at the same desk as code reviews
6. Performance is a feature — Sub-2-second load times aren't optional
7. Infrastructure as Code — Everything versioned, reproducible, scalable
8. Ship it — High throughput, zero SLA violations`
  }
];

console.log(JSON.stringify({ documents }, null, 2));
