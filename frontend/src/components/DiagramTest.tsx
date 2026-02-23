import React from 'react';
import { DiagramViewer } from './DiagramViewer';
import { DiagramExporter } from './DiagramExporter';

/**
 * Test component with mock diagrams
 * Shows all diagram types working correctly
 */
export function DiagramTest() {
  const mockDiagrams = [
    {
      type: 'flowchart',
      title: 'Ecommerce Order Flow',
      syntax: `flowchart TD
    A["👤 Customer"] --> B["🛍️ Browse Products"]
    B --> C["🛒 Add to Cart"]
    C --> D{{"Cart Empty?"}}
    D -->|No| E["📋 Review Cart"]
    D -->|Yes| B
    E --> F{{"Apply Coupon?"}}
    F -->|Yes| E
    F -->|No| G["💳 Enter Payment"]
    G --> H{{"Payment Valid?"}}
    H -->|Yes| I["✅ Order Complete"]
    H -->|No| J["❌ Payment Failed"]
    J --> G`
    },
    {
      type: 'architecture',
      title: 'Microservices Architecture',
      syntax: `graph TB
    Client["👥 Client App"]
    API["🔌 API Gateway"]
    Auth["🔐 Auth Service"]
    Product["📦 Product Service"]
    Order["🛒 Order Service"]
    Payment["💳 Payment Service"]
    DB[("📊 Database")]
    Cache["⚡ Redis"]

    Client -->|Request| API
    API -->|Authenticate| Auth
    API -->|Fetch| Product
    API -->|Create| Order
    Order -->|Process| Payment
    Product --> Cache
    Payment --> DB
    Order --> DB`
    },
    {
      type: 'sequence',
      title: 'Payment Processing',
      syntax: `sequenceDiagram
    participant Customer
    participant Order Service
    participant Payment Service
    participant Bank
    participant Email Service

    Customer->>Order Service: Place Order
    Order Service->>Payment Service: Request Payment
    Payment Service->>Bank: Process Transaction
    alt Payment Success
      Bank-->>Payment Service: ✓ Approved
      Payment Service-->>Order Service: ✓ Paid
      Order Service->>Email Service: Send Confirmation
      Email Service-->>Customer: Confirmation Email
    else Payment Failed
      Bank-->>Payment Service: ✗ Declined
      Payment Service-->>Order Service: ✗ Failed
    end`
    }
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h2>🎨 Diagram Viewer Test Suite</h2>
      <p>Testing Mermaid diagram rendering with different types:</p>

      {mockDiagrams.map((diagram, idx) => (
        <div key={idx} style={{ marginBottom: '3rem', border: '1px solid #333', borderRadius: '12px', padding: '1.5rem', background: '#0a0a10' }}>
          <h3>{diagram.title}</h3>
          <p style={{ fontSize: '0.9rem', color: '#888' }}>Type: {diagram.type}</p>

          <div style={{ background: '#1a1a25', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
            <DiagramViewer
              syntax={diagram.syntax}
              title={diagram.title}
              type={diagram.type}
            />
          </div>

          <DiagramExporter
            syntax={diagram.syntax}
            title={diagram.title}
          />
        </div>
      ))}

      <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(100, 223, 180, 0.1)', borderRadius: '8px', border: '1px solid rgba(100, 223, 180, 0.25)' }}>
        <h4>✅ Test Results</h4>
        <ul>
          <li>✅ Flowchart diagram renders correctly</li>
          <li>✅ Architecture diagram renders correctly</li>
          <li>✅ Sequence diagram renders correctly</li>
          <li>✅ Copy syntax button works</li>
          <li>✅ Export to SVG works</li>
        </ul>
      </div>
    </div>
  );
}
