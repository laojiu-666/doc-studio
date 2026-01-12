'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { ArrowLeft, Plus, Trash2, Loader2, Pencil, RefreshCw, Shield } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface ApiKey {
  id: string;
  name: string;
  provider_name: string;
  provider_display_name: string;
  api_key_masked: string;
  base_url?: string;
  model: string;
  is_active: boolean;
}

interface LLMModel {
  model_id: string;
  display_name: string;
  input_price?: number | null;
  output_price?: number | null;
  context_length?: number | null;
}

interface LLMProvider {
  id: string;
  name: string;
  display_name: string;
  default_base_url?: string;
  api_format: string;
  is_active: boolean;
  models: LLMModel[];
}

// Helper function to format price
const formatPrice = (price: number | null | undefined): string => {
  if (price === null || price === undefined) return '-';
  if (price < 0.01) return `$${price.toFixed(4)}`;
  if (price < 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(2)}`;
};

// Helper function to format context length
const formatContextLength = (length: number | null | undefined): string => {
  if (length === null || length === undefined) return '-';
  if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M`;
  if (length >= 1000) return `${(length / 1000).toFixed(0)}K`;
  return length.toString();
};

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, isLoading, checkAuth, user } = useAuthStore();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(true);

  // Admin state
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);
  const [adminApiKeys, setAdminApiKeys] = useState<Record<string, string>>({});
  const [initializingProviders, setInitializingProviders] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [providerId, setProviderId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
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
      loadProviders();
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

  const loadProviders = async () => {
    setLoadingProviders(true);
    try {
      const data = await api.getProviders();
      setProviders(data);
      if (data.length > 0 && !providerId) {
        setProviderId(data[0].id);
        if (data[0].models.length > 0) {
          setModel(data[0].models[0].model_id);
        }
      }
    } catch (err) {
      console.error('Failed to load providers:', err);
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingKey) {
        const updateData: any = { name, provider_id: providerId, model };
        if (apiKey) {
          updateData.api_key = apiKey;
        }
        if (baseUrl) updateData.base_url = baseUrl;

        await api.updateApiKey(editingKey.id, updateData);
      } else {
        await api.createApiKey({
          name,
          provider_id: providerId,
          api_key: apiKey,
          base_url: baseUrl || undefined,
          model,
        });
      }
      await loadApiKeys();
      resetForm();
    } catch (err: any) {
      alert(err.message || t('settings.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('settings.deleteConfirm'))) return;

    try {
      await api.deleteApiKey(id);
      setApiKeys(apiKeys.filter((k) => k.id !== id));
    } catch (err: any) {
      alert(err.message || t('settings.deleteFailed'));
    }
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    try {
      const result = await api.testApiKey(id);
      if (result.success) {
        alert(t('settings.testSuccess'));
      } else {
        alert(`${t('settings.testFailed')}: ${result.error}`);
      }
    } catch (err: any) {
      alert(`${t('settings.testFailed')}: ${err.message}`);
    } finally {
      setTesting(null);
    }
  };

  const handleEdit = (key: ApiKey) => {
    setEditingKey(key);
    setName(key.name);
    const provider = providers.find(p => p.name === key.provider_name);
    if (provider) {
      setProviderId(provider.id);
    }
    setApiKey('');
    setBaseUrl(key.base_url || '');
    setModel(key.model);
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingKey(null);
    setName('');
    if (providers.length > 0) {
      setProviderId(providers[0].id);
      if (providers[0].models.length > 0) {
        setModel(providers[0].models[0].model_id);
      }
    }
    setApiKey('');
    setBaseUrl('');
  };

  const handleProviderChange = (newProviderId: string) => {
    setProviderId(newProviderId);
    const provider = providers.find(p => p.id === newProviderId);
    if (provider && provider.models.length > 0) {
      setModel(provider.models[0].model_id);
    } else {
      setModel('');
    }
  };

  const getModelsForProvider = (pid: string): LLMModel[] => {
    const provider = providers.find(p => p.id === pid);
    return provider?.models || [];
  };

  const getCurrentProvider = () => {
    return providers.find(p => p.id === providerId);
  };

  const getSelectedModel = (): LLMModel | undefined => {
    const models = getModelsForProvider(providerId);
    return models.find(m => m.model_id === model);
  };

  // Admin functions
  const handleInitializeProviders = async () => {
    setInitializingProviders(true);
    try {
      await api.adminInitializeProviders();
      await loadProviders();
      alert(t('settings.admin.initSuccess'));
    } catch (err: any) {
      alert(err.message || t('settings.admin.initFailed'));
    } finally {
      setInitializingProviders(false);
    }
  };

  const handleSyncModels = async (provider: LLMProvider) => {
    const key = adminApiKeys[provider.name];
    if (!key) {
      alert(t('settings.admin.apiKeyRequired'));
      return;
    }

    setSyncingProvider(provider.id);
    try {
      const result = await api.adminSyncModels(provider.id, key);
      if (result.success) {
        await loadProviders();
        alert(`${t('settings.admin.syncSuccess')}: ${result.models_count} ${t('settings.admin.models')}`);
      }
    } catch (err: any) {
      alert(err.message || t('settings.admin.syncFailed'));
    } finally {
      setSyncingProvider(null);
    }
  };

  const handleResetToDefault = async (provider: LLMProvider) => {
    if (!confirm(t('settings.admin.resetConfirm'))) return;

    setSyncingProvider(provider.id);
    try {
      await api.adminResetToDefault(provider.id);
      await loadProviders();
      alert(t('settings.admin.resetSuccess'));
    } catch (err: any) {
      alert(err.message || t('settings.admin.resetFailed'));
    } finally {
      setSyncingProvider(null);
    }
  };

  const isAdmin = user?.is_staff || user?.is_superuser;

  if (isLoading || loadingProviders) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/documents')}
              className="p-2 hover:bg-secondary rounded-lg transition"
              title={t('settings.back')}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">{t('settings.title')}</h1>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className={`p-2 rounded-lg transition ${showAdminPanel ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
                title={t('settings.admin.title')}
              >
                <Shield className="w-5 h-5" />
              </button>
            )}
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Admin Panel */}
        {isAdmin && showAdminPanel && (
          <section className="mb-8 p-4 border border-amber-500/50 rounded-lg bg-amber-50/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500" />
                {t('settings.admin.title')}
              </h2>
              <button
                onClick={handleInitializeProviders}
                disabled={initializingProviders}
                className="px-3 py-1.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition"
              >
                {initializingProviders ? <Loader2 className="w-4 h-4 animate-spin" /> : t('settings.admin.initialize')}
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">{t('settings.admin.desc')}</p>

            <div className="space-y-4">
              {providers.map((provider) => (
                <div key={provider.id} className="p-3 border border-border rounded-lg bg-background">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-medium">{provider.display_name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {provider.models.length} {t('settings.admin.models')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResetToDefault(provider)}
                        disabled={syncingProvider === provider.id}
                        className="px-2 py-1 text-xs border border-border rounded hover:bg-secondary disabled:opacity-50 transition"
                      >
                        {t('settings.admin.reset')}
                      </button>
                      <button
                        onClick={() => handleSyncModels(provider)}
                        disabled={syncingProvider === provider.id || !adminApiKeys[provider.name]}
                        className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50 transition flex items-center gap-1"
                      >
                        {syncingProvider === provider.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                        {t('settings.admin.sync')}
                      </button>
                    </div>
                  </div>
                  {provider.name !== 'custom' && (
                    <input
                      type="password"
                      value={adminApiKeys[provider.name] || ''}
                      onChange={(e) => setAdminApiKeys({ ...adminApiKeys, [provider.name]: e.target.value })}
                      placeholder={`${provider.display_name} API Key`}
                      className="w-full px-2 py-1 text-sm border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* API Keys Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">{t('settings.apiKeys')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('settings.apiKeysDesc')}
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
            >
              <Plus className="w-4 h-4" />
              {t('settings.addKey')}
            </button>
          </div>

          {/* Add/Edit form */}
          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="mb-6 p-4 border border-border rounded-lg bg-secondary/30"
            >
              <h3 className="font-medium mb-4">
                {editingKey ? t('settings.editKey') : t('settings.addKey')}
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('settings.name')}</label>
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
                  <label className="block text-sm font-medium mb-1">
                    {t('settings.provider')}
                    <span className="text-muted-foreground font-normal ml-1">({t('settings.providerHint')})</span>
                  </label>
                  <select
                    value={providerId}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>{p.display_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('settings.apiKey')}
                    {editingKey && <span className="text-muted-foreground font-normal ml-1">({t('settings.apiKeyEditHint')})</span>}
                  </label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={editingKey ? t('settings.apiKeyPlaceholderEdit') : 'sk-...'}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    required={!editingKey}
                  />
                  {editingKey && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('settings.currentKey')}: <code className="bg-secondary px-1 rounded">{editingKey.api_key_masked}</code>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('settings.model')}</label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  >
                    <option value="">{t('settings.modelPlaceholder')}</option>
                    {getModelsForProvider(providerId).map((m) => (
                      <option key={m.model_id} value={m.model_id}>
                        {m.display_name}
                        {m.input_price !== null && m.input_price !== undefined && 
                          ` (${formatPrice(m.input_price)}/${formatPrice(m.output_price)})`}
                      </option>
                    ))}
                  </select>
                  {/* Model info display */}
                  {model && (() => {
                    const selectedModel = getSelectedModel();
                    if (selectedModel && (selectedModel.input_price || selectedModel.context_length)) {
                      return (
                        <div className="mt-2 p-2 bg-secondary/50 rounded text-xs text-muted-foreground">
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            {selectedModel.input_price !== null && selectedModel.input_price !== undefined && (
                              <span>
                                {t('settings.modelInfo.inputPrice')}: {formatPrice(selectedModel.input_price)}/M
                              </span>
                            )}
                            {selectedModel.output_price !== null && selectedModel.output_price !== undefined && (
                              <span>
                                {t('settings.modelInfo.outputPrice')}: {formatPrice(selectedModel.output_price)}/M
                              </span>
                            )}
                            {selectedModel.context_length && (
                              <span>
                                {t('settings.modelInfo.contextLength')}: {formatContextLength(selectedModel.context_length)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    {t('settings.baseUrl')}
                    <span className="text-muted-foreground font-normal ml-1">({t('settings.baseUrlHint')})</span>
                  </label>
                  <input
                    type="url"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder={getCurrentProvider()?.default_base_url || 'https://api.example.com'}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('settings.baseUrlNote')}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition"
                >
                  {saving ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          )}

          {/* API keys list */}
          {apiKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
              <p>{t('settings.noKeys')}</p>
              <p className="text-sm">{t('settings.noKeysHint')}</p>
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
                      {key.provider_display_name || key.provider_name} • {key.model} • {key.api_key_masked}
                    </p>
                    {key.base_url && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Base URL: {key.base_url}
                      </p>
                    )}
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
                        t('settings.test')
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
