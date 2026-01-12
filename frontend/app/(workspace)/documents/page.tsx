'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { FileText, Upload, Trash2, LogOut, Settings } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface Document {
  id: string;
  title: string;
  original_filename: string;
  file_type: string;
  updated_at: string;
}

export default function DocumentsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth, logout } = useAuthStore();
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);

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
      loadDocuments();
    }
  }, [isAuthenticated]);

  const loadDocuments = async () => {
    try {
      const docs = await api.getDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const doc = await api.uploadDocument(file);
      router.push(`/editor/${doc.id}`);
    } catch (err: any) {
      alert(err.message || t('documents.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('documents.deleteConfirm'))) return;

    try {
      await api.deleteDocument(id);
      setDocuments(documents.filter((d) => d.id !== id));
    } catch (err: any) {
      alert(err.message || t('documents.deleteFailed'));
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (isLoading) {
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
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Doc Studio</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <LanguageSwitcher />
            <Link
              href="/settings"
              className="p-2 hover:bg-secondary rounded-lg transition"
              title={t('common.settings')}
            >
              <Settings className="w-5 h-5" />
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-secondary rounded-lg transition"
              title={t('common.logout')}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">{t('documents.title')}</h2>
          <label className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:opacity-90 transition">
            <Upload className="w-4 h-4" />
            {uploading ? t('documents.uploading') : t('documents.upload')}
            <input
              type="file"
              accept=".docx,.doc"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>{t('documents.empty')}</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="border border-border rounded-lg p-4 hover:border-primary transition group"
              >
                <Link href={`/editor/${doc.id}`} className="block">
                  <div className="flex items-start gap-3">
                    <FileText className="w-8 h-8 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{doc.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {doc.original_filename}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(doc.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
                <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                    title={t('common.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
