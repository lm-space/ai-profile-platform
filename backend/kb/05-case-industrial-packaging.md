---
title: Case Study - Fortune 500 Industrial Packaging (B2B/B2C)
slug: case-industrial-packaging
category: case-study
tier: 3
---

# Case Study: Fortune 500 Industrial Packaging — B2B & B2C Commerce

## Overview
Role: Enterprise Architect | Team Size: 16 engineers | Industry: Industrial Packaging (Fortune 500)
Duration: Ongoing since 2019 at Cognizant

## Challenge
The client needed two distinct commerce platforms — a B2B portal for business clients and a B2C retail storefront for consumers — both deeply integrated with SAP ECC for order management, inventory, and pricing.

## Architecture
### B2B Platform
- Magento Commerce Cloud for business client ordering
- Customer-specific pricing, contract terms, bulk ordering
- SAP-connected catalog, inventory, and order management

### B2C Platform
- Headless architecture: AEM (Adobe Experience Manager) with React frontend
- Adobe Commerce (Magento) as backend commerce engine (APIs only)
- Separate content management (AEM) and commerce logic (Adobe Commerce)

## SAP ECC Integration (Core)
- Integration layer: Azure Logic Apps + Azure Service Bus + .NET Core Web API (C#, Entity Framework)
- IDoc message types: ORDERS05 (purchase orders), DESADV (shipping notice), INVOIC (invoices)
- EDI X12 documents: 850 (PO), 856 (ASN), 810 (invoice)
- BAPI calls: customer master, material master, pricing conditions, ATP stock checks
- SAP modules: MM (Materials Management) and SD (Sales & Distribution)

## Order-to-Delivery Flow
1. Order capture on commerce platform
2. IDoc transmitted to SAP SD
3. Delivery processing in SAP
4. Shipment confirmation via DESADV IDoc
5. Invoice posting via INVOIC IDoc
6. Worldpay payment: tokenized, 3D Secure, PCI-DSS compliant
7. Reconciliation feeds to SAP FI (Financial Accounting)

## Infrastructure
- Azure Cache for Redis, Azure AD B2C (OAuth2/JWT)
- Monitoring: Azure Monitor, Application Insights, Grafana
- CI/CD: Azure DevOps with deployments to App Service and AKS

## Technologies
Magento Commerce Cloud, Adobe Commerce, AEM, React, .NET Core, C#, Entity Framework, Azure Logic Apps, Azure Service Bus, Azure AD B2C, Azure DevOps, AKS, Redis, Grafana, SAP ECC, IDoc, EDI X12, BAPI, Worldpay
