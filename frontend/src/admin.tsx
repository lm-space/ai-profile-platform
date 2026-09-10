import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';

// API base URL
const API_BASE = import.meta.env.DEV
  ? 'http://localhost:8787'
  : 'https://elamurugan-api.rugan.workers.dev';

// Admin API client
function useAdminApi(apiKey: string) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Admin-Key': apiKey
  };

  const get = async (path: string) => {
    const res = await fetch(`${API_BASE}${path}`, { headers });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  };

  const post = async (path: string, body: any) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST', headers, body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  };

  const put = async (path: string, body: any) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT', headers, body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  };

  return { get, post, put };
}

// ============ Components ============

function LoginScreen({ onLogin }: { onLogin: (key: string) => void }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/stats`, {
        headers: { 'X-Admin-Key': key }
      });
      if (res.ok) {
        localStorage.setItem('admin_key', key);
        onLogin(key);
      } else {
        setError('Invalid admin key');
      }
    } catch {
      setError('Connection failed');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Admin Panel</h1>
        <p>Elamurugan AI Portfolio</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={key}
            onChange={e => { setKey(e.target.value); setError(''); }}
            placeholder="Enter admin API key"
            autoFocus
          />
          <button type="submit">Login</button>
          {error && <div className="error">{error}</div>}
        </form>
      </div>
    </div>
  );
}

function StatsCard({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <div className="stat-card">
      <span className="stat-icon">{icon}</span>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function Dashboard({ api }: { api: ReturnType<typeof useAdminApi> }) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.get('/api/admin/stats').then(setStats).catch(console.error);
  }, []);

  if (!stats) return <div className="loading">Loading stats...</div>;

  const s = stats.stats;

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <div className="stats-grid">
        <StatsCard icon="💬" label="Total Conversations" value={s.conversations} />
        <StatsCard icon="📨" label="Total Messages" value={s.messages} />
        <StatsCard icon="📋" label="Pending Contacts" value={s.pending_contacts} />
        <StatsCard icon="📊" label="Diagrams Generated" value={s.diagrams} />
        <StatsCard icon="📝" label="Interaction Logs" value={s.interaction_logs} />
        <StatsCard icon="📚" label="KB Documents" value={s.kb_documents} />
        <StatsCard icon="🧩" label="KB Chunks" value={s.kb_chunks} />
        <StatsCard icon="🕐" label="Sessions (24h)" value={s.recent_sessions_24h} />
      </div>

      {stats.provider_usage && stats.provider_usage.length > 0 && (
        <div className="section">
          <h3>Provider Usage</h3>
          <table>
            <thead>
              <tr><th>Provider</th><th>Model</th><th>Calls</th><th>Avg Duration</th><th>Tokens In</th><th>Tokens Out</th></tr>
            </thead>
            <tbody>
              {stats.provider_usage.map((p: any, i: number) => (
                <tr key={i}>
                  <td>{p.provider || '-'}</td>
                  <td><code>{p.model || '-'}</code></td>
                  <td>{p.call_count}</td>
                  <td>{p.avg_duration_ms ? `${Math.round(p.avg_duration_ms)}ms` : '-'}</td>
                  <td>{p.total_tokens_in || '-'}</td>
                  <td>{p.total_tokens_out || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Sessions({ api }: { api: ReturnType<typeof useAdminApi> }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/admin/sessions?limit=50')
      .then(data => setSessions(data.sessions || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const viewSession = async (sessionId: string) => {
    setSelected(null);
    const data = await api.get(`/api/admin/sessions/${sessionId}`);
    setSelected(data);
  };

  if (loading) return <div className="loading">Loading sessions...</div>;

  return (
    <div className="sessions">
      <h2>Chat Sessions</h2>
      <div className="sessions-layout">
        <div className="sessions-list">
          {sessions.map((s: any) => (
            <div
              key={s.session_id}
              className={`session-item ${selected?.conversation?.session_id === s.session_id ? 'active' : ''}`}
              onClick={() => viewSession(s.session_id)}
            >
              <div className="session-preview">{s.first_message?.substring(0, 60) || 'No messages'}</div>
              <div className="session-meta">
                <span>{s.message_count} msgs</span>
                <span>{new Date(s.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
          {sessions.length === 0 && <div className="empty">No sessions yet</div>}
        </div>

        {selected && (
          <div className="session-detail">
            <div className="session-messages">
              <h3>Messages</h3>
              {(selected.messages || []).map((m: any, i: number) => (
                <div key={i} className={`message ${m.role}`}>
                  <div className="message-role">{m.role}</div>
                  <div className="message-content">{m.content}</div>
                  <div className="message-time">{new Date(m.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>

            {selected.logs && selected.logs.length > 0 && (
              <div className="session-logs">
                <h3>Interaction Logs</h3>
                <div className="logs-timeline">
                  {selected.logs.map((log: any, i: number) => (
                    <div key={i} className="log-entry">
                      <div className="log-step">
                        <span className={`step-badge ${log.step}`}>{log.step}</span>
                        {log.duration_ms && <span className="duration">{log.duration_ms}ms</span>}
                        {log.provider && <span className="provider-badge">{log.provider}</span>}
                      </div>
                      {log.payload && (
                        <details className="log-payload">
                          <summary>Payload</summary>
                          <pre>{typeof log.payload === 'string' ? log.payload : JSON.stringify(log.payload, null, 2)}</pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected.diagrams && selected.diagrams.length > 0 && (
              <div className="session-diagrams">
                <h3>Diagrams</h3>
                {selected.diagrams.map((d: any, i: number) => (
                  <div key={i} className="diagram-info">
                    <strong>{d.diagram_title}</strong> ({d.diagram_type})
                    <details><summary>Syntax</summary><pre>{d.diagram_syntax}</pre></details>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Display names for provider / api-key rows. Unknown values fall back to the raw id.
const PROVIDER_LABELS: Record<string, string> = {
  anthropic: '🧠 Anthropic (Claude)',
  cloudflare: '☁️ Cloudflare AI',
  openai: '🤖 OpenAI'
};

function Providers({ api }: { api: ReturnType<typeof useAdminApi> }) {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  const loadProviders = useCallback(async () => {
    const data = await api.get('/api/admin/providers');
    setProviders(data.providers || []);
    setLoading(false);
  }, [api]);

  useEffect(() => { loadProviders(); }, [loadProviders]);

  const switchProvider = async (id: number) => {
    setSwitching(true);
    try {
      await api.post('/api/admin/providers/switch', { provider_id: id });
      await loadProviders();
    } catch (err: any) {
      alert(err.message);
    }
    setSwitching(false);
  };

  if (loading) return <div className="loading">Loading providers...</div>;

  return (
    <div className="providers">
      <h2>AI Providers</h2>
      <div className="providers-grid">
        {providers.map((p: any) => {
          const config = typeof p.config === 'string' ? JSON.parse(p.config) : p.config;
          return (
            <div key={p.id} className={`provider-card ${p.is_active ? 'active' : ''}`}>
              <div className="provider-header">
                <h3>{PROVIDER_LABELS[p.provider] || p.provider}</h3>
                {p.is_active ? (
                  <span className="active-badge">Active</span>
                ) : (
                  <button
                    onClick={() => switchProvider(p.id)}
                    disabled={switching}
                    className="switch-btn"
                  >
                    {switching ? 'Switching...' : 'Activate'}
                  </button>
                )}
              </div>
              <div className="provider-details">
                <div><strong>Chat Model:</strong> <code>{p.model_chat}</code></div>
                <div><strong>Diagram Model:</strong> <code>{p.model_diagram}</code></div>
                <div><strong>Embedding Model:</strong> <code>{p.model_embedding}</code></div>
                {config && (
                  <>
                    <div><strong>Chat Temp:</strong> {config.chat_temperature}</div>
                    <div><strong>Max Tokens:</strong> {config.chat_max_tokens}</div>
                  </>
                )}
                <div className="updated-at">Updated: {new Date(p.updated_at).toLocaleString()}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ApiKeys({ api }: { api: ReturnType<typeof useAdminApi> }) {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  const loadKeys = useCallback(async () => {
    const data = await api.get('/api/admin/api-keys');
    setKeys(data.keys || []);
    setLoading(false);
  }, [api]);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  const handleEdit = (service: string, key: any) => {
    setEditingService(service);
    setFormData({
      api_key: '',
      is_enabled: key?.is_enabled || false,
      config: key?.config ? (typeof key.config === 'string' ? JSON.parse(key.config) : key.config) : {}
    });
  };

  const handleSave = async () => {
    if (!editingService || !formData.api_key) {
      alert('Please enter an API key');
      return;
    }

    setSaving(true);
    try {
      await api.post(`/api/admin/api-keys/${editingService}`, {
        api_key: formData.api_key,
        is_enabled: formData.is_enabled
      });
      await loadKeys();
      setEditingService(null);
      setFormData({});
    } catch (err: any) {
      alert(err.message);
    }
    setSaving(false);
  };

  if (loading) return <div className="loading">Loading API keys...</div>;

  return (
    <div className="api-keys">
      <h2>API Keys Configuration</h2>
      <div className="api-keys-list">
        {keys.map((key: any) => (
          <div key={key.id} className="api-key-card">
            <div className="key-header">
              <h3>{PROVIDER_LABELS[key.service] ? `${PROVIDER_LABELS[key.service]} Key` : key.service}</h3>
              <span className={key.is_enabled ? 'active-badge' : 'status-badge'}>{key.is_enabled ? 'Enabled' : 'Disabled'}</span>
            </div>

            {editingService === key.service ? (
              <div className="key-form">
                <div className="form-group">
                  <label>API Key</label>
                  <input
                    type="password"
                    placeholder={`Enter your ${key.service} API key`}
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
                  />
                </div>
                <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_enabled}
                    onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                  />
                  Enable this API key
                </label>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-sm" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button className="btn-sm secondary" onClick={() => { setEditingService(null); setFormData({}); }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="key-details">
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  {key.is_enabled ? '✅ Configured and enabled' : '⚠️ Not configured or disabled'}
                </div>
                <button className="btn-sm" onClick={() => handleEdit(key.service, key)}>
                  Configure API Key
                </button>
              </div>
            )}
            <div className="updated-at">Updated: {new Date(key.updated_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Contacts({ api }: { api: ReturnType<typeof useAdminApi> }) {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadContacts = useCallback(async () => {
    const data = await api.get('/api/admin/contacts?limit=50');
    setContacts(data.contacts || []);
    setLoading(false);
  }, [api]);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  const updateStatus = async (id: string, status: string) => {
    await api.put(`/api/admin/contacts/${id}`, { status });
    await loadContacts();
  };

  if (loading) return <div className="loading">Loading contacts...</div>;

  return (
    <div className="contacts">
      <h2>Contact Requests</h2>
      <table>
        <thead>
          <tr><th>Name</th><th>Email</th><th>Phone</th><th>Type</th><th>Message</th><th>Status</th><th>Date</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {contacts.map((c: any) => (
            <tr key={c.id} className={`status-${c.status}`}>
              <td>{c.name}</td>
              <td>{c.email}</td>
              <td>{c.phone || '-'}</td>
              <td>{c.type}</td>
              <td className="message-cell">{c.message?.substring(0, 80)}</td>
              <td><span className={`status-badge ${c.status}`}>{c.status}</span></td>
              <td>{new Date(c.created_at).toLocaleDateString()}</td>
              <td>
                {c.status === 'pending' && (
                  <>
                    <button onClick={() => updateStatus(c.id, 'contacted')} className="btn-sm">Mark Contacted</button>
                    <button onClick={() => updateStatus(c.id, 'resolved')} className="btn-sm secondary">Resolve</button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {contacts.length === 0 && <tr><td colSpan={8} className="empty">No contacts yet</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function Logs({ api }: { api: ReturnType<typeof useAdminApi> }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ limit: 100, offset: 0, total: 0, hasMore: false });

  const loadLogs = useCallback(async (offset = 0) => {
    setLoading(true);
    try {
      const data = await api.get(`/api/admin/logs?limit=${pagination.limit}&offset=${offset}`);
      setLogs(data.logs || []);
      setPagination({
        limit: data.limit || 100,
        offset: data.offset || 0,
        total: data.total || 0,
        hasMore: data.hasMore || false
      });
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  }, [api, pagination.limit]);

  useEffect(() => {
    loadLogs(0);
  }, []);

  if (loading) return <div className="loading">Loading logs...</div>;

  // Group by request_id
  const grouped = new Map<string, any[]>();
  logs.forEach(log => {
    const key = log.request_id;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(log);
  });

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="logs">
      <h2>Interaction Logs</h2>
      <div className="pagination-info" style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        <span>Showing {pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} logs</span>
        {totalPages > 1 && <span style={{ marginLeft: '1rem' }}>Page {currentPage} of {totalPages}</span>}
      </div>

      <div className="logs-list">
        {Array.from(grouped.entries()).map(([reqId, steps]) => (
          <details key={reqId} className="log-group">
            <summary>
              <span className="req-id">{reqId.substring(0, 12)}...</span>
              <span className="session-id">Session: {steps[0]?.session_id?.substring(0, 8)}...</span>
              <span className="step-count">{steps.length} steps</span>
              <span className="log-time">{new Date(steps[0]?.created_at).toLocaleString()}</span>
            </summary>
            <div className="log-steps">
              {steps.sort((a, b) => a.step_order - b.step_order).map((step, i) => (
                <div key={i} className="log-step-detail">
                  <span className={`step-badge ${step.step}`}>{step.step}</span>
                  {step.duration_ms && <span className="duration">{step.duration_ms}ms</span>}
                  {step.provider && <span className="provider-badge">{step.provider}</span>}
                  {step.model && <span className="model-badge">{step.model}</span>}
                  {step.tokens_in && <span className="tokens">In: {step.tokens_in}</span>}
                  {step.tokens_out && <span className="tokens">Out: {step.tokens_out}</span>}
                  {step.payload && (
                    <details className="payload-detail">
                      <summary>Payload</summary>
                      <pre>{typeof step.payload === 'string' ? step.payload : JSON.stringify(step.payload, null, 2)}</pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </details>
        ))}
        {grouped.size === 0 && <div className="empty">No logs yet. Logs are created when users chat.</div>}
      </div>

      {totalPages > 1 && (
        <div className="pagination-controls" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          <button
            className="btn-sm"
            onClick={() => loadLogs(Math.max(0, pagination.offset - pagination.limit))}
            disabled={pagination.offset === 0}
          >
            ← Previous
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            Page {currentPage} of {totalPages}
          </div>
          <button
            className="btn-sm"
            onClick={() => loadLogs(pagination.offset + pagination.limit)}
            disabled={!pagination.hasMore}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function KB({ api }: { api: ReturnType<typeof useAdminApi> }) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [chunks, setChunks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get('/api/admin/kb/documents');
      setDocuments(data.documents || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadChunks = async (docId: number) => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get(`/api/admin/kb/documents/${docId}/chunks`);
      setSelectedDoc(data.document);
      setChunks(data.chunks || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      <h2>📚 Knowledge Base</h2>
      {error && <div className="error-message">{error}</div>}

      {!selectedDoc ? (
        <>
          <h3>Documents ({documents.length})</h3>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Type</th>
                  <th>Chunks</th>
                  <th>Tokens</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc: any) => (
                  <tr key={doc.id}>
                    <td><strong>{doc.title}</strong></td>
                    <td>{doc.doc_type}</td>
                    <td>{doc.chunk_count || 0}</td>
                    <td>{(doc.total_tokens || 0).toLocaleString()}</td>
                    <td>{new Date(doc.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn-sm"
                        onClick={() => loadChunks(doc.id)}
                      >
                        View Chunks
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      ) : (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <button className="btn-sm" onClick={() => { setSelectedDoc(null); setChunks([]); }}>
              ← Back to Documents
            </button>
          </div>
          <h3>Chunks from: {selectedDoc.title}</h3>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div>
              {chunks.length === 0 ? (
                <p className="empty">No chunks found</p>
              ) : (
                chunks.map((chunk: any, idx: number) => (
                  <details key={chunk.id} style={{ marginBottom: '1rem', borderLeft: '3px solid #0066cc', paddingLeft: '1rem' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 'bold', padding: '0.5rem', backgroundColor: '#2a2a2a', borderRadius: '4px', marginBottom: '0.5rem', color: '#fff' }}>
                      <strong>Chunk {idx + 1}</strong> - {chunk.heading} ({chunk.token_count} tokens)
                    </summary>
                    <pre style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.85rem', maxHeight: '400px', overflow: 'auto', backgroundColor: '#1a1a1a', padding: '1rem', borderRadius: '4px', color: '#e0e0e0', border: '1px solid #333' }}>
                      {chunk.content}
                    </pre>
                  </details>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============ Main App ============

type Tab = 'dashboard' | 'sessions' | 'providers' | 'contacts' | 'logs' | 'api-keys' | 'kb';

function AdminApp() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('admin_key') || '');
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const api = useAdminApi(apiKey);

  if (!apiKey) {
    return <LoginScreen onLogin={setApiKey} />;
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'sessions', label: 'Sessions', icon: '💬' },
    { id: 'logs', label: 'Logs', icon: '📝' },
    { id: 'kb', label: 'Knowledge Base', icon: '📚' },
    { id: 'providers', label: 'AI Providers', icon: '🤖' },
    { id: 'api-keys', label: 'API Keys', icon: '🔑' },
    { id: 'contacts', label: 'Contacts', icon: '📋' },
  ];

  return (
    <div className="admin-app">
      <nav className="admin-nav">
        <div className="nav-brand">
          <h1>Ela Admin</h1>
        </div>
        <div className="nav-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
        <button
          className="logout-btn"
          onClick={() => { localStorage.removeItem('admin_key'); setApiKey(''); }}
        >
          Logout
        </button>
      </nav>
      <main className="admin-content">
        {activeTab === 'dashboard' && <Dashboard api={api} />}
        {activeTab === 'sessions' && <Sessions api={api} />}
        {activeTab === 'logs' && <Logs api={api} />}
        {activeTab === 'kb' && <KB api={api} />}
        {activeTab === 'providers' && <Providers api={api} />}
        {activeTab === 'api-keys' && <ApiKeys api={api} />}
        {activeTab === 'contacts' && <Contacts api={api} />}
      </main>
    </div>
  );
}

// Mount
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>
);
