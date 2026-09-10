---
title: Case Study - Health & Wellness eCommerce Platform
slug: case-health-wellness
category: case-study
tier: 3
---

# Case Study: Health & Wellness eCommerce — Supplement Dispensary

## Overview
Role: Enterprise Architect | Duration: Aug 2019 – Sep 2020 | Industry: Healthcare/Supplements
Platform: Professional-grade supplement dispensary for practitioners and patients

## Challenge
Migrate a legacy Magento 1 platform to modern headless architecture while achieving dramatic performance improvements and zero downtime.

## Solution
### Platform Migration
- Migrated Magento 1 to headless Magento 2 on AWS EKS (Kubernetes)
- GraphQL + REST API layer serving React frontend
- Dual portal: practitioner portal and patient-facing dispensary

### Integration Microservices
- Node.js/Express integration microservices on ECS/Fargate
- Connected with ERP/SAP for: order fulfillment, inventory sync, pricing, returns

## Performance Achievement — 70% Improvement
- Page loads went from 6+ seconds down to under 2 seconds
- Headless Kubernetes architecture eliminated Magento frontend overhead
- GraphQL optimization: persisted queries, query batching
- CloudFront edge caching with origin shield
- Brotli compression, WebP lazy loading, code splitting
- ElastiCache for API response caching

## Infrastructure
- Terraform-managed infrastructure (IaC)
- Horizontal Pod Autoscaling (HPA) for traffic spikes
- ALB ingress controllers
- Multi-AZ RDS Aurora for high availability
- Event-driven processing: SQS/SNS/Lambda
- Monitoring: CloudWatch, NewRelic APM, Grafana

## Results
- 100% data integrity maintained during migration
- 70% improvement in page load times
- Zero downtime during migration
- Improved mobile experience via headless approach

## Technologies
Magento 2, AWS EKS, Kubernetes, GraphQL, REST, React, Node.js, Express, ECS, Fargate, Terraform, Aurora, CloudFront, ElastiCache, SQS, SNS, Lambda, NewRelic, Grafana
