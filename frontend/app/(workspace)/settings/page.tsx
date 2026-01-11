'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { ArrowLeft, Plus, Trash2, Check, X, Loader2, Pencil } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  provider: string;
  api_key_masked: string;
  base_url?: string;
  model: string;
  is_active: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('gpt-4');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadApiKeys();
    }
  }, [isAuthenticated]);

  const loadApiKeys = async () => {
    try {
      const keys = await api.getApiKeys();
      setApiKeys(keys);
    } catch (err) {
      console.error('Failed to load API keys:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingKey) {
        // Update existing key
        const updateData: any = { name, provider, model };
        // Only send api_key if it changed from the masked value
        if (apiKey && apiKey !== editingKey.api_key_masked) {
          updateData.api_key = apiKey;
        }
        if (baseUrl) updateData.base_url = baseUrl;

        await api.updateApiKey(editingKey.id, updateData);
      } else {
        // Create new key
        await api.createApiKey({
          name,
          provider,
          api_key: apiKey,
          base_url: baseUrl || undefined,
          model,
        });
      }
      await loadApiKeys();
      resetForm();
    } catch (err: any) {
      alert(err.message || 'Failed to save API key');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      await api.deleteApiKey(id);
      setApiKeys(apiKeys.filter((k) => k.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete API key');
    }
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    try {
      const result = await api.testApiKey(id);
      if (result.success) {
        alert('Connection successful!');
      } else {
        alert(`Connection failed: ${result.error}`);
      }
    } catch (err: any) {
      alert(`Test failed: ${err.message}`);
    } finally {
      setTesting(null);
    }
  };

  const handleEdit = (key: ApiKey) => {
    setEditingKey(key);
    setName(key.name);
    setProvider(key.provider);
    setApiKey(key.api_key_masked); // Show masked value
    setBaseUrl(key.base_url || '');
    setModel(key.model);
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingKey(null);
    setName('');
    setProvider('openai');
    setApiKey('');
    setBaseUrl('');
    setModel('gpt-4');
  };

  const getDefaultModel = (provider: string) => {
    switch (provider) {
      case 'openai':
        return 'gpt-4';
      case 'claude':
        return 'claude-3-opus-20240229';
      case 'gemini':
        return 'gemini-pro';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/documents')}
            className="p-2 hover:bg-secondary rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">API Keys</h2>
              <p className="text-sm text-muted-foreground">
                Configure your LLM API keys for AI features
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
            >
              <Plus className="w-4 h-4" />
              Add API Key
            </button>
          </div>

          {/* Add/Edit form */}
          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="mb-6 p-4 border border-border rounded-lg bg-secondary/30"
            >
              <h3 className="font-medium mb-4">
                {editingKey ? 'Edit API Key' : 'Add New API Key'}
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My OpenAI Key"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Provider</label>
                  <select
                    value={provider}
                    onChange={(e) => {
                      setProvider(e.target.value);
                      setModel(getDefaultModel(e.target.value));
                    }}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="claude">Claude (Anthropic)</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="custom">Custom API</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    API Key {editingKey && <span className="text-muted-foreground">(clear and enter new value to change)</span>}
                  </label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={editingKey ? '' : 'sk-...'}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    required={!editingKey}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Model</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="gpt-4"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>

                {provider === 'custom' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Base URL (for custom API)
                    </label>
                    <input
                      type="url"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://api.example.com/v1"
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      required={provider === 'custom'}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          )}

          {/* API keys list */}
          {apiKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
              <p>No API keys configured yet.</p>
              <p className="text-sm">Add an API key to use AI features.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div>
                    <h3 className="font-medium">{key.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {key.provider} • {key.model} • {key.api_key_masked}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTest(key.id)}
                      disabled={testing === key.id}
                      className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-secondary disabled:opacity-50 transition"
                    >
                      {testing === key.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Test'
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(key)}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(key.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
