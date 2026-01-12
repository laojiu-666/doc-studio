'use client';

import { useState } from 'react';
import { Wand2, Sparkles, FileText, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface AIToolbarProps {
  selectedText: string;
  onInsert: (text: string) => void;
  documentId: string;
}

export default function AIToolbar({
  selectedText,
  onInsert,
  documentId,
}: AIToolbarProps) {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const hasSelection = selectedText.trim().length > 0;

  const handleQuickAction = async (action: string) => {
    if (!hasSelection) return;
    setLoading(true);
    // Quick actions will be handled through the chat panel
    // This is a placeholder for future implementation
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 border-b border-border">
      <span className="text-sm text-muted-foreground mr-2">{t('aiToolbar.title')}</span>

      <button
        onClick={() => handleQuickAction('polish')}
        disabled={!hasSelection || loading}
        className="flex items-center gap-1.5 px-3 py-1 text-sm rounded-lg bg-white border border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition"
        title={t('aiToolbar.polish')}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Sparkles className="w-3.5 h-3.5" />
        )}
        {t('aiToolbar.polish')}
      </button>

      <button
        onClick={() => handleQuickAction('summarize')}
        disabled={!hasSelection || loading}
        className="flex items-center gap-1.5 px-3 py-1 text-sm rounded-lg bg-white border border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition"
        title={t('aiToolbar.summarize')}
      >
        <FileText className="w-3.5 h-3.5" />
        {t('aiToolbar.summarize')}
      </button>

      <button
        onClick={() => handleQuickAction('expand')}
        disabled={!hasSelection || loading}
        className="flex items-center gap-1.5 px-3 py-1 text-sm rounded-lg bg-white border border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition"
        title={t('aiToolbar.expand')}
      >
        <Wand2 className="w-3.5 h-3.5" />
        {t('aiToolbar.expand')}
      </button>

      {hasSelection && (
        <span className="text-xs text-muted-foreground ml-auto">
          {selectedText.length} characters selected
        </span>
      )}

      {!hasSelection && (
        <span className="text-xs text-muted-foreground ml-auto">
          Select text to use AI actions
        </span>
      )}
    </div>
  );
}
