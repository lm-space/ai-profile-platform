#!/bin/bash
# =============================================================================
# Tiered Knowledge Base Indexing Script
# =============================================================================
#
# TIER SYSTEM:
#   Tier 1 (Always Include) — Profile, core skills, tech stack
#   Tier 2 (Topic Match)    — Achievements, key stats, project list summary
#   Tier 3 (RAG Search)     — Detailed case studies per project
#
# USAGE:
#   ./scripts/index-kb-tiered.sh [api-base-url]
#   Default: https://elamurugan-api.rugan.workers.dev
#
# REQUIRES: curl, jq (optional for pretty output)
# =============================================================================

API_BASE="${1:-https://elamurugan-api.rugan.workers.dev}"
ENDPOINT="${API_BASE}/api/kb/index"

echo "=== Tiered KB Indexing ==="
echo "API: ${ENDPOINT}"
echo ""

# Step 1: Run migration first (add tier/category columns)
echo "--- Step 0: Ensure migration is applied ---"
echo "Run manually if not done: npx wrangler d1 migrations apply elamurugan-db --remote"
echo ""

# Step 1: Index Tier 1 — Always-include context
echo "--- Step 1: Tier 1 (Always Include) ---"

curl -s -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d @- << 'TIER1_EOF'
{
  "documents": [
    {
      "title": "Ela - About Me & Profile",
      "slug": "ela-profile",
      "category": "profile",
      "tier": 1,
      "content": "# About Elamurugan Nallathambi\n\n## Who I Am\nElamurugan Nallathambi (Ela) — Enterprise Solution Architect based in Charlotte, NC. 18+ years building enterprise platforms since 2008. Currently Senior Technical Manager & Enterprise Solution Architect at Cognizant Technology Solutions.\n\nI started writing code in 2008 and never stopped. Gone from LAMP-stack websites to owning enterprise architecture for large-scale commerce platforms where SAP integration, cloud infrastructure, and data pipelines all have to work together.\n\n## Contact\n- Location: Charlotte, North Carolina, USA\n- Phone: +1-313-753-0175\n- Email: elamurugan.nallathambi@gmail.com\n- LinkedIn: linkedin.com/in/elamurugan\n- Portfolio: elamurugan.pages.dev\n- GitHub: github.com/elamurugan\n\n## Career Path\n- Cognizant Technology Solutions (2019-Present) — Senior Technical Manager & Enterprise Architect\n- OneTeam US LLC (2017-2019) — Senior Developer / Technical Lead\n- EBDUS LLC / MakeGoodMedia (2011-2017) — Self-Employed, eCommerce Architect, ran 22+ person team\n- Openwave Computing (2010-2011) — Magento Developer\n- SoftSolutions4u (2008-2010) — Web Application Developer\n\n## Education & Credentials\n- B.Tech Information Technology — Bharathidasan University, India (2008, First Class)\n- AWS Certified Solutions Architect (2016)\n- Adobe Commerce Certified Developer Plus (2017) — Verify: u.magento.com/certification/directory/dev/21795/\n- US Work Authorization\n\n## Philosophy\n1. Code-first, diagram-backed — Architecture validated through working code\n2. Automate everything — CI/CD, testing, monitoring, deployment\n3. No-boundary learning — PHP to Java to Node.js to .NET to Python as needed\n4. Lead by doing — Architecture reviews at the same desk as code reviews\n5. Performance is a feature — Sub-2-second load times aren't optional"
    },
    {
      "title": "Ela - Technical Toolset & Skills",
      "slug": "ela-skills",
      "category": "skills",
      "tier": 1,
      "content": "# Elamurugan's Technical Toolset\n\n## eCommerce & Platforms\nMagento 1.x / 2.x / Adobe Commerce (Expert, 14+ years, 200+ stores). Custom MVC Framework Design. Multi-Vendor Marketplace Architecture. Headless Commerce (GraphQL + REST). Adobe Commerce Certified Developer Plus.\n\n## Backend & Languages\nPHP (Master, 14 years) — Laravel, Zend, YII, Magento internals. Node.js (4+ years) — Express, REST APIs, integration microservices. Java — Spring Boot, Microservices. .NET Core / C# — Web API, Entity Framework, Azure integration. Python — Scripting, ETL, data processing. SOLID Design, DDD, Design Patterns.\n\n## Frontend\nReact — Component Architecture, Redux, hooks. Angular — Full-Featured SPAs, D3.js dashboards. JavaScript / jQuery — DOM Optimization. HTML5 / CSS3, LESS/SASS. SEO-Optimized UI, Mobile-First Design.\n\n## Cloud & Infrastructure\nAWS: EC2, S3, RDS, ECS, EKS, Lambda, SQS, SNS, CloudFront, ElastiCache, API Gateway, VPC, Aurora, Fargate. Azure: Logic Apps, Service Bus, Functions, API Management, DevOps, AKS, Azure AD B2C, Azure Cache for Redis, App Service. Containers: Docker, Kubernetes (EKS, AKS), Horizontal Pod Autoscaling, ALB Ingress. IaC: Terraform, CloudFormation, Ansible.\n\n## DevOps & CI/CD\nJenkins, GitLab CI, GitHub Actions, Azure DevOps. Blue-Green Deployments. Monitoring: Grafana, Prometheus, NewRelic APM, CloudWatch, EFK Stack.\n\n## SAP & ERP Integration\nSAP ECC (MM/SD modules), IDoc (ORDERS05, DESADV, INVOIC). EDI X12 (850/856/810), BAPI/RFC. Microsoft Dynamics integration (SOAP, CSV/XML). Azure Logic Apps + Service Bus middleware.\n\n## Data Engineering\nDatabricks: Notebooks, Spark ETL, Delta Lake, Databricks Jobs, Unity Catalog. Databases: MySQL, PostgreSQL, MongoDB, Oracle, DynamoDB, Aurora. Caching: Redis, Varnish, Memcached, ElastiCache, CloudFront.\n\n## AI & LLM\nOpenAI API, Anthropic Claude API. RAG Pipelines, Vector databases (Pinecone, ChromaDB). LangChain, AI agents. Document Chunking, Embeddings.\n\n## Performance Engineering\nSub-2-second page load targets on 500K+ daily visitor sites. Varnish, Redis, CDN (CloudFront, Fastly), Brotli compression. GraphQL optimization: persisted queries, batching. Load testing: JMeter, K6, Gatling, Blackfire."
    }
  ]
}
TIER1_EOF

echo ""
echo "--- Step 2: Tier 2 (Achievements & Project List) ---"

curl -s -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d @- << 'TIER2_EOF'
{
  "documents": [
    {
      "title": "Ela - Key Achievements & Stats",
      "slug": "ela-achievements",
      "category": "achievements",
      "tier": 2,
      "content": "# Key Achievements & Impact Numbers\n\n## Scale & Delivery\n- 200+ Magento stores delivered across global industries (wine, jewelry, sports, supplements, home goods, cultural marketplaces)\n- 30+ web applications at OneTeam across education, healthcare, retail, government\n- 500K+ daily users supported on single platforms with sub-2s response times\n\n## Performance Wins\n- 70% page load improvement on health & wellness eCommerce platform (6s down to under 2s)\n- Sub-2-second average page load time achieved consistently across all major projects\n- Zero downtime deployments using blue-green strategies on Kubernetes\n\n## Enterprise Impact\n- 60% reduction in incident response time at regulated consumer goods company\n- 100% data integrity maintained during all Magento 1 to 2 migrations\n- Led 16 engineers across 4 technology tracks (Magento, .NET, AEM/React, SAP) on Fortune 500 project\n\n## Team & Leadership\n- Built and ran a 22+ person team at EBDUS startup (developers, QA, designers, infrastructure)\n- Managed teams of 10-16 engineers at Cognizant across multiple technology stacks\n- Mentored 6 developers on Magento 2 internals at OneTeam\n- Architecture governance, Agile/Scrum, stakeholder management across all roles"
    },
    {
      "title": "Ela - Project Portfolio Summary",
      "slug": "ela-project-list",
      "category": "projects",
      "tier": 2,
      "content": "# Project Portfolio — Summary List\n\n## Cognizant (2019-Present)\n1. **Fortune 500 Industrial Packaging — B2B & B2C Commerce**: Enterprise architect for dual platforms (Magento Commerce Cloud B2B + headless AEM/React/Adobe Commerce B2C). SAP ECC integration with Azure middleware. 16 engineers, 4 tech tracks.\n2. **Health & Wellness eCommerce — Supplement Dispensary**: Migrated Magento 1 to headless Magento 2 on AWS EKS. 70% page load improvement. Node.js microservices on ECS/Fargate. Terraform IaC.\n3. **Regulated Consumer Goods — Age-Gated Commerce + Data Platform**: Technical architect for Adobe Commerce. Databricks Spark ETL, Delta Lake, Unity Catalog. Cut incident response by 60%.\n\n## OneTeam US (2017-2019)\n4. **Education Data Analytics Platform**: ETL pipelines for 800+ school districts (NCES, M-STEP, NWEA, census data). Angular/D3.js dashboards with Tableau integration.\n5. **30+ Web Applications**: Multi-store Magento 2 builds, platform migrations, ERP integrations across education, healthcare, retail, government.\n\n## EBDUS LLC / Self-Employed (2011-2017)\n6. **200+ Magento Commerce Stores**: Global clients across wine, jewelry, sports, supplements, home goods. SAP & Microsoft Dynamics integrations.\n7. **Multi-Vendor Marketplace Platforms**: PHP admin portals, commission engines, vendor dashboards, payment splitting.\n8. **Custom MVC eCommerce Framework**: Built from scratch — XML layout templating, multi-theme, SEO URL rewrites, admin CMS, layout caching. 100K+ SKUs.\n\n## Early Career (2008-2011)\n9. **Enterprise Magento Stores (Openwave)**: SAP ECC & Microsoft Dynamics integrations, multi-store/multi-currency setups.\n10. **LAMP-Stack Web Applications (SoftSolutions4u)**: Custom CMS platforms, Zend Framework apps, reusable PHP MVC framework."
    }
  ]
}
TIER2_EOF

echo ""
echo "--- Step 3: Tier 3 (Detailed Case Studies) ---"

curl -s -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d @- << 'TIER3_EOF'
{
  "documents": [
    {
      "title": "Case Study - Fortune 500 Industrial Packaging (B2B/B2C)",
      "slug": "case-industrial-packaging",
      "category": "case-study",
      "tier": 3,
      "content": "# Case Study: Fortune 500 Industrial Packaging — B2B & B2C Commerce\n\n## Overview\nRole: Enterprise Architect | Team Size: 16 engineers | Industry: Industrial Packaging (Fortune 500)\nDuration: Ongoing since 2019 at Cognizant\n\n## Challenge\nThe client needed two distinct commerce platforms — a B2B portal for business clients and a B2C retail storefront for consumers — both deeply integrated with SAP ECC for order management, inventory, and pricing.\n\n## Architecture\n### B2B Platform\n- Magento Commerce Cloud for business client ordering\n- Customer-specific pricing, contract terms, bulk ordering\n- SAP-connected catalog, inventory, and order management\n\n### B2C Platform\n- Headless architecture: AEM (Adobe Experience Manager) with React frontend\n- Adobe Commerce (Magento) as backend commerce engine (APIs only)\n- Separate content management (AEM) and commerce logic (Adobe Commerce)\n\n## SAP ECC Integration (Core)\n- Integration layer: Azure Logic Apps + Azure Service Bus + .NET Core Web API (C#, Entity Framework)\n- IDoc message types: ORDERS05 (purchase orders), DESADV (shipping notice), INVOIC (invoices)\n- EDI X12 documents: 850 (PO), 856 (ASN), 810 (invoice)\n- BAPI calls: customer master, material master, pricing conditions, ATP stock checks\n- SAP modules: MM (Materials Management) and SD (Sales & Distribution)\n\n## Order-to-Delivery Flow\n1. Order capture on commerce platform\n2. IDoc transmitted to SAP SD\n3. Delivery processing in SAP\n4. Shipment confirmation via DESADV IDoc\n5. Invoice posting via INVOIC IDoc\n6. Worldpay payment: tokenized, 3D Secure, PCI-DSS compliant\n7. Reconciliation feeds to SAP FI (Financial Accounting)\n\n## Infrastructure\n- Azure Cache for Redis, Azure AD B2C (OAuth2/JWT)\n- Monitoring: Azure Monitor, Application Insights, Grafana\n- CI/CD: Azure DevOps with deployments to App Service and AKS\n\n## Technologies\nMagento Commerce Cloud, Adobe Commerce, AEM, React, .NET Core, C#, Entity Framework, Azure Logic Apps, Azure Service Bus, Azure AD B2C, Azure DevOps, AKS, Redis, Grafana, SAP ECC, IDoc, EDI X12, BAPI, Worldpay"
    },
    {
      "title": "Case Study - Health & Wellness eCommerce Platform",
      "slug": "case-health-wellness",
      "category": "case-study",
      "tier": 3,
      "content": "# Case Study: Health & Wellness eCommerce — Supplement Dispensary\n\n## Overview\nRole: Enterprise Architect | Duration: Aug 2019 – Sep 2020 | Industry: Healthcare/Supplements\nPlatform: Professional-grade supplement dispensary for practitioners and patients\n\n## Challenge\nMigrate a legacy Magento 1 platform to modern headless architecture while achieving dramatic performance improvements and zero downtime.\n\n## Solution\n### Platform Migration\n- Migrated Magento 1 to headless Magento 2 on AWS EKS (Kubernetes)\n- GraphQL + REST API layer serving React frontend\n- Dual portal: practitioner portal and patient-facing dispensary\n\n### Integration Microservices\n- Node.js/Express integration microservices on ECS/Fargate\n- Connected with ERP/SAP for: order fulfillment, inventory sync, pricing, returns\n\n## Performance Achievement — 70% Improvement\n- Page loads went from 6+ seconds down to under 2 seconds\n- Headless Kubernetes architecture eliminated Magento frontend overhead\n- GraphQL optimization: persisted queries, query batching\n- CloudFront edge caching with origin shield\n- Brotli compression, WebP lazy loading, code splitting\n- ElastiCache for API response caching\n\n## Infrastructure\n- Terraform-managed infrastructure (IaC)\n- Horizontal Pod Autoscaling (HPA) for traffic spikes\n- ALB ingress controllers\n- Multi-AZ RDS Aurora for high availability\n- Event-driven processing: SQS/SNS/Lambda\n- Monitoring: CloudWatch, NewRelic APM, Grafana\n\n## Results\n- 100% data integrity maintained during migration\n- 70% improvement in page load times\n- Zero downtime during migration\n- Improved mobile experience via headless approach\n\n## Technologies\nMagento 2, AWS EKS, Kubernetes, GraphQL, REST, React, Node.js, Express, ECS, Fargate, Terraform, Aurora, CloudFront, ElastiCache, SQS, SNS, Lambda, NewRelic, Grafana"
    },
    {
      "title": "Case Study - Regulated Consumer Goods (Age-Gated Commerce + Data)",
      "slug": "case-consumer-goods",
      "category": "case-study",
      "tier": 3,
      "content": "# Case Study: Regulated Consumer Goods — Age-Gated Commerce & Data Platform\n\n## Overview\nRole: Technical Architect | Duration: Sep 2020 – Present | Industry: Tobacco / Consumer Goods\nTeam: 10+ developers\n\n## Challenge\nBuild and maintain a compliant age-gated eCommerce platform for a regulated consumer goods manufacturer, while also developing a data engineering platform for product, compliance, and sales analytics.\n\n## B2C eCommerce Platform\n- Enterprise Magento 2 / Adobe Commerce\n- Age-gated compliance eCommerce with strict verification\n- AWS: EC2, RDS Aurora, S3, CloudFront, VPC\n- Caching: Redis, Varnish, Fastly for sub-2-second loads\n- CI/CD: Azure DevOps with blue-green deployments\n- Cut incident response time by 60%\n\n## PACE Data Engineering Platform\n- Hands-on Databricks notebooks and data workflows\n- Built Spark-based ETL pipelines to transform product, compliance, and sales data\n- Data stored in Delta Lake tables feeding the application layer\n- Databricks Jobs for orchestration\n- Unity Catalog for data governance and access control\n\n## Technologies\nAdobe Commerce, Magento 2, AWS (EC2, RDS, S3, CloudFront, VPC), Redis, Varnish, Fastly, Azure DevOps, Databricks, Spark, Delta Lake, Unity Catalog"
    },
    {
      "title": "Case Study - Education Data Analytics (Munetrix)",
      "slug": "case-education-analytics",
      "category": "case-study",
      "tier": 3,
      "content": "# Case Study: Education Data Analytics Platform\n\n## Overview\nRole: Senior Developer / Technical Lead | Duration: 2017-2019 at OneTeam US\nPlatform: Michigan government & education data analytics, 800+ school districts\n\n## Challenge\nBuild a comprehensive education data analytics platform aggregating multiple public data sources for government transparency, fiscal benchmarking, and school performance tracking.\n\n## What Was Built\n### ETL Pipelines\n- Aggregated large-scale public datasets: NCES (National Center for Education Statistics), M-STEP (Michigan state assessments), NWEA (MAP Growth test scores), district financials, census data\n- Data aggregated into normalized schemas for cross-source analysis\n- Automated refresh cycles for updated public datasets\n\n### Analytics & Dashboards\n- Tableau integration for advanced reporting and analytics\n- Custom Angular/D3.js dashboards with role-based access levels\n- Custom reports for district comparisons, fiscal benchmarking\n- School performance tracking across Michigan\n\n## Technologies\nNode.js, Express, Angular 5, D3.js, Tableau, MySQL, ETL Pipelines, NCES, M-STEP, NWEA MAP Growth, Census Data"
    },
    {
      "title": "Case Study - 200+ Magento Stores & Custom Framework",
      "slug": "case-magento-stores",
      "category": "case-study",
      "tier": 3,
      "content": "# Case Study: 200+ Magento Commerce Stores & Custom eCommerce Framework\n\n## Overview\nRole: Lead Developer / Solution Architect / Delivery Manager\nDuration: 2011-2017 at EBDUS LLC (Self-Employed)\nTeam: 22+ people (developers, QA, design, infrastructure)\n\n## Magento Store Delivery\n- Designed, built, and shipped 200+ Magento 1 stores (Community, Enterprise, Professional Edition)\n- Global clients across: wine, jewelry, sports, supplements, home goods, cultural marketplaces, action sports retail\n- SAP & Microsoft Dynamics integrations using SOAP/XML-RPC APIs, cron-based sync, flat-file exchange (CSV, EDI)\n- Payment integrations: PayPal, Stripe, Authorize.Net, Braintree, WorldPay\n- Amazon/eBay marketplace feeds\n\n## Multi-Vendor Marketplace\n- Built multi-vendor platforms with PHP admin portals (Zend, YII)\n- MySQL backends, commission engines, order routing, vendor dashboards\n- REST APIs for mobile backends\n- Supports thousands of vendors and millions in monthly transaction volume\n\n## Performance Engineering\n- Got page loads under 2 seconds on 500K+ daily visitor sites\n- Varnish full-page cache, Memcached/Redis, MySQL query tuning, Nginx optimization\n- Deployed across AWS, Rackspace, MageMojo, DigitalOcean\n- Early deployment automation: Capistrano, Ansible\n\n## Custom MVC eCommerce Framework\nBuilt from scratch (inspired by Magento's architecture):\n- XML layout-based templating engine\n- Multi-theme inheritance system\n- Page-level CSS/JS minification and concatenation\n- SEO-friendly URL rewrite engine\n- Admin CMS and site management\n- Advanced layout caching engine\n- Module-based architecture\n- Used in production for multiple implementations with 100K+ SKUs\n\n## Technologies\nMagento 1.x (CE/EE/PE), PHP, MySQL, Zend Framework, YII, REST APIs, SOAP, XML-RPC, SAP, Microsoft Dynamics, PayPal, Stripe, WorldPay, Varnish, Redis, Memcached, Nginx, AWS, Capistrano, Ansible"
    }
  ]
}
TIER3_EOF

echo ""
echo "=== Indexing Complete ==="
echo ""
echo "Verify with: curl ${API_BASE}/api/kb/stats"
echo "Check tiers: curl ${API_BASE}/api/admin/kb/documents -H 'X-Admin-Key: YOUR_KEY'"
