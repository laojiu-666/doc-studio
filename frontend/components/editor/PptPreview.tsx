'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface Slide {
  page: number;
  url: string;
}

interface PptPreviewProps {
  documentId: string;
}

export default function PptPreview({ documentId }: PptPreviewProps) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSlides();
  }, [documentId]);

  const loadSlides = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = api.getToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_URL}/documents/${documentId}/slides/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load slides');
      }

      const data = await response.json();
      setSlides(data.slides || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load PPT preview');
    } finally {
      setLoading(false);
    }
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading PPT preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-destructive">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">{error}</p>
          <button
            onClick={loadSlides}
            className="mt-4 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No slides available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Slide Display */}
      <div className="flex-1 flex items-center justify-center p-4 bg-secondary/30">
        <img
          src={slides[currentSlide]?.url}
          alt={`Slide ${currentSlide + 1}`}
          className="max-w-full max-h-full object-contain shadow-lg rounded"
        />
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center gap-4 p-4 border-t border-border">
        <button
          onClick={goToPrevious}
          disabled={currentSlide === 0}
          className="p-2 rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-sm">
          {currentSlide + 1} / {slides.length}
        </span>

        <button
          onClick={goToNext}
          disabled={currentSlide === slides.length - 1}
          className="p-2 rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Thumbnail Strip */}
      <div className="flex gap-2 p-2 overflow-x-auto border-t border-border bg-secondary/20">
        {slides.map((slide, index) => (
          <button
            key={slide.page}
            onClick={() => setCurrentSlide(index)}
            className={`
              flex-shrink-0 w-20 h-14 rounded overflow-hidden border-2 transition
              ${currentSlide === index ? 'border-primary' : 'border-transparent hover:border-border'}
            `}
          >
            <img
              src={slide.url}
              alt={`Thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
