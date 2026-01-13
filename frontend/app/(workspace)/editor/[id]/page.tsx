'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import dynamic from 'next/dynamic';
import TiptapEditor, { TiptapEditorRef } from '@/components/editor/TiptapEditor';
import ChatPanel from '@/components/chat/ChatPanel';
import { ArrowLeft, Save, Download, MessageSquare, Eye, Edit3 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const DocxPreview = dynamic(() => import('@/components/editor/DocxPreview'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading preview...</div>,
});

interface Document {
  id: string;
  title: string;
  content_html: string;
}

type ViewMode = 'preview' | 'edit';

export default function EditorPage() {
  const router = useRouter();
  const params = useParams();
  const documentId = params.id as string;
  const { t } = useTranslation();

  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [document, setDocument] = useState<Document | null>(null);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [selectedText, setSelectedText] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [previewKey, setPreviewKey] = useState(0);
  const editorRef = useRef<TiptapEditorRef>(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && documentId) {
      loadDocument();
    }
  }, [isAuthenticated, documentId]);

  const loadDocument = async () => {
    try {
      const doc = await api.getDocument(documentId);
      setDocument(doc);
      setContent(doc.content_html);
    } catch (err) {
      console.error('Failed to load document:', err);
      router.push('/documents');
    }
  };

  const handleSave = async () => {
    if (!document) return;
    setSaving(true);
    try {
      await api.updateDocument(document.id, { content_html: content });
      setPreviewKey(prev => prev + 1);
    } catch (err: any) {
      alert(err.message || t('editor.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (!document) return;
    try {
      const blob = await api.exportDocument(document.id);
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${document.title}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || t('editor.downloadFailed'));
    }
  };

  const handleContentChange = useCallback((html: string) => {
    setContent(html);
  }, []);

  const handleSelectionChange = useCallback((text: string) => {
    setSelectedText(text);
  }, []);

  const handleInsertContent = useCallback((text: string) => {
    if (viewMode === 'edit' && editorRef.current) {
      editorRef.current.insertContent(text);
    } else {
      setContent(prev => prev + text);
    }
  }, [viewMode]);

  const handleReplaceSelection = useCallback((text: string) => {
    if (viewMode === 'edit' && editorRef.current) {
      editorRef.current.replaceSelection(text);
    }
  }, [viewMode]);

  const handleReplaceDocument = useCallback(async (newContent: string) => {
    setContent(newContent);
    if (document) {
      try {
        await api.updateDocument(document.id, { content_html: newContent });
        setPreviewKey(prev => prev + 1);
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    }
  }, [document]);

  if (isLoading || !document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/documents')}
              className="p-2 hover:bg-secondary rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-medium truncate max-w-md">{document.title}</h1>
            {/* View Mode Toggle */}
            <div className="flex items-center bg-secondary rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition ${
                  viewMode === 'preview' ? 'bg-white shadow-sm' : 'text-muted-foreground'
                }`}
                title={t('editor.preview')}
              >
                <Eye className="w-3 h-3" />
                {t('editor.preview')}
              </button>
              <button
                onClick={() => setViewMode('edit')}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition ${
                  viewMode === 'edit' ? 'bg-white shadow-sm' : 'text-muted-foreground'
                }`}
                title={t('editor.edit')}
              >
                <Edit3 className="w-3 h-3" />
                {t('editor.edit')}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {viewMode === 'edit' && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition text-sm"
              >
                <Save className="w-4 h-4" />
                {saving ? t('editor.saving') : t('editor.save')}
              </button>
            )}
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg hover:bg-secondary transition text-sm"
            >
              <Download className="w-4 h-4" />
              {t('editor.download')}
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-2 rounded-lg transition ${
                showChat ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
              }`}
              title={t('editor.chat')}
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Document Area */}
        <div className={`flex-1 overflow-auto ${showChat ? 'mr-96' : ''}`}>
          {viewMode === 'preview' ? (
            <div className="h-full">
              <DocxPreview key={previewKey} documentId={documentId} />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto py-8 px-4">
              <div className="bg-white border border-border rounded-lg shadow-sm min-h-[800px]">
                <TiptapEditor
                  ref={editorRef}
                  content={content}
                  onChange={handleContentChange}
                  onSelectionChange={handleSelectionChange}
                />
              </div>
            </div>
          )}
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="fixed right-0 top-[57px] bottom-0 w-96 border-l border-border bg-white">
            <ChatPanel
              documentId={documentId}
              selectedText={selectedText}
              documentContent={content}
              onInsertToDocument={handleInsertContent}
              onReplaceSelection={handleReplaceSelection}
              onReplaceDocument={handleReplaceDocument}
            />
          </div>
        )}
      </div>
    </div>
  );
}
