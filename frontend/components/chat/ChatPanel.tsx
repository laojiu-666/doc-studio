'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { streamChat } from '@/lib/stream';
import { Send, Settings, Loader2, Plus } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import {
  parseEditOperations,
  applyEditOperations,
  hasEditOperations,
  extractExplanation,
} from '@/lib/selector-parser';

type ChatMode = 'edit';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ApiKey {
  id: string;
  name: string;
  provider: string;
  model: string;
}

interface ChatPanelProps {
  documentId: string;
  selectedText?: string;
  documentContent?: string;  // Current document HTML content
  onInsertToDocument?: (content: string) => void;
  onReplaceSelection?: (content: string) => void;
  onReplaceDocument?: (content: string) => void;
}

export default function ChatPanel({ documentId, selectedText, documentContent, onInsertToDocument, onReplaceSelection, onReplaceDocument }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState('');
  const [mode] = useState<ChatMode>('edit');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [selectedApiKey, setSelectedApiKey] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [lockedSelection, setLockedSelection] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (selectedText) {
      setLockedSelection(selectedText);
    }
  }, [selectedText]);

  const formatMessageContent = (content: string): string => {
    // Handle new <edit> format
    if (hasEditOperations(content)) {
      const explanation = extractExplanation(content);
      const ops = parseEditOperations(content);
      const opsCount = ops.length;
      return explanation + (opsCount > 0 ? ` [已应用 ${opsCount} 处编辑]` : '');
    }

    if (/<doc>\s*<\/doc>/.test(content)) {
      return content.replace(/<doc>\s*<\/doc>/g, '[已删除选中内容]');
    }
    if (/<doc-full>[\s\S]*?<\/doc-full>/.test(content)) {
      return content.replace(/<doc-full>[\s\S]*?<\/doc-full>/g, '[已更新文档]');
    }
    return content
      .replace(/<doc>([\s\S]*?)<\/doc>/g, '$1')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<p>([\s\S]*?)<\/p>/gi, '$1\n')
      .replace(/<[^>]+>/g, '')
      .trim();
  };

  useEffect(() => {
    loadApiKeys();
    createOrLoadSession();
  }, [documentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const loadApiKeys = async () => {
    try {
      const keys = await api.getApiKeys();
      setApiKeys(keys);
      if (keys.length > 0 && !selectedApiKey) {
        setSelectedApiKey(keys[0].id);
      }
    } catch (err) {
      console.error('Failed to load API keys:', err);
    }
  };

  const createOrLoadSession = async () => {
    try {
      const sessions = await api.getChatSessions(documentId);
      if (sessions.length > 0) {
        const session = await api.getChatSession(sessions[0].id);
        setSessionId(session.id);
        setMessages(session.messages || []);
      } else {
        const session = await api.createChatSession(documentId, 'Document Chat');
        setSessionId(session.id);
      }
    } catch (err) {
      console.error('Failed to load chat session:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedApiKey || !sessionId || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: 'user', content: userMessage },
    ]);
    setLoading(true);
    setStreaming('');

    let fullContent = '';

    try {
      const token = api.getToken();
      if (!token) throw new Error('Not authenticated');

      for await (const data of streamChat(sessionId, userMessage, selectedApiKey, token, mode, lockedSelection)) {
        if (data.content) {
          fullContent += data.content;
          setStreaming(fullContent);
        }
        if (data.error) {
          throw new Error(data.error);
        }
      }
    } catch (err: any) {
      if (!fullContent) {
        fullContent = `Error: ${err.message}`;
      }
    } finally {
      if (fullContent) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: 'assistant', content: fullContent },
        ]);

        if (mode === 'edit' && !fullContent.startsWith('Error:')) {
          // Try new <edit> format first
          if (hasEditOperations(fullContent) && documentContent && onReplaceDocument) {
            const operations = parseEditOperations(fullContent);
            if (operations.length > 0) {
              const updatedContent = applyEditOperations(documentContent, operations);
              onReplaceDocument(updatedContent);
              setLockedSelection('');
            }
          }
          // Fall back to legacy <doc-full> and <doc> format
          else {
            const docFullMatch = fullContent.match(/<doc-full>([\s\S]*?)<\/doc-full>/);
            if (docFullMatch && onReplaceDocument) {
              onReplaceDocument(docFullMatch[1].trim());
              setLockedSelection('');
            } else {
              const docMatch = fullContent.match(/<doc>([\s\S]*?)<\/doc>/);
              if (docMatch) {
                const extractedContent = docMatch[1].trim();
                if (lockedSelection && onReplaceSelection) {
                  onReplaceSelection(extractedContent);
                } else if (onInsertToDocument) {
                  onInsertToDocument(extractedContent);
                }
              }
            }
            setLockedSelection('');
          }
        }
      }
      setLoading(false);
      setStreaming('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = async () => {
    try {
      const session = await api.createChatSession(documentId, 'Document Chat');
      setSessionId(session.id);
      setMessages([]);
    } catch (err) {
      console.error('Failed to create new chat:', err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="font-medium">{t('chat.title')}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={handleNewChat}
            className="p-1.5 hover:bg-secondary rounded transition"
            title="New Chat"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 hover:bg-secondary rounded transition"
            title={t('common.settings')}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="p-3 border-b border-border bg-secondary/30">
          <label className="block text-sm font-medium mb-1">{t('chat.selectApiKey')}</label>
          <select
            value={selectedApiKey}
            onChange={(e) => setSelectedApiKey(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {apiKeys.length === 0 ? (
              <option value="">{t('chat.noApiKey')}</option>
            ) : (
              apiKeys.map((key) => (
                <option key={key.id} value={key.id}>
                  {key.name} ({key.provider} - {key.model})
                </option>
              ))
            )}
          </select>
          {apiKeys.length === 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {t('chat.goToSettings')}
            </p>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-auto p-3 space-y-4">
        {messages.length === 0 && !streaming && (
          <div className="text-center text-muted-foreground text-sm py-8">
            <p>Start a conversation with AI</p>
            <p className="text-xs mt-1">
              Ask questions about your document or request edits
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground px-3 py-2'
                  : 'bg-secondary'
              }`}
            >
              <p className={`whitespace-pre-wrap ${msg.role === 'assistant' ? 'px-3 py-2' : ''}`}>{msg.role === 'assistant' ? formatMessageContent(msg.content) : msg.content}</p>
            </div>
          </div>
        ))}

        {streaming && (
          <div className="flex justify-start">
            <div className="max-w-[85%] px-3 py-2 rounded-lg text-sm bg-secondary">
              <p className="whitespace-pre-wrap">{formatMessageContent(streaming)}</p>
            </div>
          </div>
        )}

        {loading && !streaming && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-lg bg-secondary">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        {lockedSelection && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-blue-600">已选中文本</span>
            <button
              onClick={() => setLockedSelection('')}
              className="text-xs text-blue-600 hover:text-blue-800"
              title="Clear selection"
            >
              ✕ 清除
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.placeholder')}
            className="flex-1 px-3 py-2 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            rows={2}
            disabled={loading || !selectedApiKey}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim() || !selectedApiKey}
            className="px-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition"
            title={t('chat.send')}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
