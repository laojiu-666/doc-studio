'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';
import WorkspaceLayout from '@/components/layout/WorkspaceLayout';
import ChatPanel from '@/components/chat/ChatPanel';
import DocxPreview from '@/components/editor/DocxPreview';
import PptPreview from '@/components/editor/PptPreview';
import {
  useWorkspaceStore,
  MENU_ITEMS,
} from '@/lib/stores/workspace';

export default function DocumentsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, checkAuth } = useAuthStore();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    viewMode,
    activeMenu,
    currentDocument,
    uploading,
    setCurrentDocument,
    setUploading,
  } = useWorkspaceStore();

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const doc = await api.uploadDocument(file);
      setCurrentDocument(doc);
    } catch (err: any) {
      alert(err.message || t('documents.uploadFailed'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  // Get current menu config
  const currentMenuConfig = activeMenu
    ? MENU_ITEMS.find((m) => m.id === activeMenu)
    : null;

  // Render document preview based on file type
  const renderDocumentPreview = () => {
    if (!currentDocument) return null;

    if (currentDocument.file_type === 'word') {
      return <DocxPreview documentId={currentDocument.id} />;
    } else if (currentDocument.file_type === 'ppt') {
      return <PptPreview documentId={currentDocument.id} />;
    }

    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Unsupported file type
      </div>
    );
  };

  // Render upload area for selected menu
  const renderUploadArea = () => {
    if (!activeMenu || !currentMenuConfig) {
      return (
        <div className="text-center text-muted-foreground">
          <p>请从左侧菜单选择功能</p>
        </div>
      );
    }

    return (
      <div className="text-center">
        <div
          onClick={triggerUpload}
          className="
            border-2 border-dashed border-border rounded-xl p-12
            hover:border-primary hover:bg-secondary/30
            cursor-pointer transition-all duration-200
          "
        >
          {uploading ? (
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
          ) : (
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          )}
          <p className="text-lg font-medium mb-2">
            {uploading ? '上传中...' : `上传 ${currentMenuConfig.label.replace('生成', '')} 文件`}
          </p>
          <p className="text-sm text-muted-foreground">
            支持格式: {currentMenuConfig.accept}
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={currentMenuConfig.accept}
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
      </div>
    );
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <WorkspaceLayout onLogout={handleLogout} userEmail={user?.email}>
      {/* Main Content Area */}
      <div
        className={`
          flex-1 flex flex-col overflow-hidden
          transition-all duration-300 ease-in-out
          ${viewMode === 'split' ? 'border-r border-border' : ''}
        `}
      >
        {viewMode === 'chat-focused' ? (
          // Chat-focused mode: centered chat or upload area
          <div className="flex-1 flex flex-col">
            {activeMenu ? (
              // Show upload area when menu is selected
              <div className="flex-1 flex items-center justify-center p-8">
                {renderUploadArea()}
              </div>
            ) : (
              // Show centered chat when no menu selected
              <ChatPanel visualMode="expanded" />
            )}
          </div>
        ) : (
          // Split mode: document preview
          <div className="flex-1 overflow-auto">
            {renderDocumentPreview()}
          </div>
        )}
      </div>

      {/* Right Chat Panel (only in split mode) */}
      {viewMode === 'split' && (
        <div className="w-96 flex-shrink-0 border-l border-border">
          <ChatPanel
            visualMode="compact"
            documentId={currentDocument?.id}
          />
        </div>
      )}
    </WorkspaceLayout>
  );
}
