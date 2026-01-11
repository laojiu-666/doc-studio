'use client';

import { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';

interface DocxPreviewProps {
  documentId: string;
  token: string | null;
}

export default function DocxPreview({ documentId, token }: DocxPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId || !containerRef.current || !token) return;

    const loadDocument = async () => {
      setLoading(true);
      setError(null);

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        const previewUrl = `${API_URL}/documents/${documentId}/preview/`;

        const response = await fetch(previewUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to load document');

        const arrayBuffer = await response.arrayBuffer();

        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          await renderAsync(arrayBuffer, containerRef.current, undefined, {
            className: 'docx-preview',
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            useBase64URL: true,
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to render document');
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [documentId, token]);

  if (!token) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <p>Loading document...</p>
        </div>
      )}
      <div
        ref={containerRef}
        className="h-full overflow-auto bg-gray-100"
      />
    </div>
  );
}
