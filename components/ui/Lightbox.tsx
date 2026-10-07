'use client';

import { useEffect, useCallback } from 'react';
import Image from 'next/image';

export interface LightboxPhoto {
  id: string;
  publicId: string;
  src?: string;
  thumbSrc?: string;
  width: number;
  height: number;
  caption: string | null;
  altText: string | null;
}

export interface LightboxProps {
  photos: LightboxPhoto[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onIndexChange: (newIndex: number) => void;
}

export function Lightbox({ photos, currentIndex, isOpen, onClose, onIndexChange }: LightboxProps) {
  const currentPhoto = photos[currentIndex];

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    } else {
      onIndexChange(photos.length - 1);
    }
  }, [currentIndex, photos.length, onIndexChange]);

  const handleNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      onIndexChange(currentIndex + 1);
    } else {
      onIndexChange(0);
    }
  }, [currentIndex, photos.length, onIndexChange]);

  useEffect(() => {
    if (!isOpen) return;

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || !currentPhoto) return null;

  const resolvedSrc =
    currentPhoto.src ||
    (currentPhoto.publicId.startsWith('http://') ||
    currentPhoto.publicId.startsWith('https://') ||
    currentPhoto.publicId.startsWith('/')
      ? currentPhoto.publicId
      : `https://res.cloudinary.com/dqg4nqqwk/image/upload/f_auto,q_auto/${currentPhoto.publicId.replace(/^\//, '')}`);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-between p-4 sm:p-6 backdrop-blur-md select-none"
    >
      {/* Top Bar: Counter & Close button */}
      <div className="flex items-center justify-between text-white/90 z-10 w-full max-w-6xl mx-auto">
        <span className="text-xs sm:text-sm font-mono tracking-wider bg-white/10 px-3 py-1 rounded-full">
          {currentIndex + 1} / {photos.length}
        </span>

        <div className="flex items-center gap-2">
          {/* Download button */}
          <a
            href={resolvedSrc}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download full size"
          >
            <span>⬇️</span>
            <span className="hidden sm:inline">Download</span>
          </a>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close image viewer"
            className="p-2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer text-lg"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main Image Viewport with Previous & Next */}
      <div className="relative flex-1 flex items-center justify-center w-full max-w-6xl mx-auto my-2">
        {/* Previous Button */}
        {photos.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous image"
            className="absolute left-2 sm:left-4 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center text-xl transition-all border border-white/20 cursor-pointer shadow-lg"
          >
            ‹
          </button>
        )}

        {/* The Photo */}
        <div className="relative max-w-full max-h-[75vh] w-auto h-auto flex items-center justify-center overflow-hidden rounded-lg">
          <Image
            src={resolvedSrc}
            alt={currentPhoto.altText || currentPhoto.caption || 'Wedding gallery photo'}
            width={currentPhoto.width || 1200}
            height={currentPhoto.height || 800}
            priority
            className="max-h-[75vh] w-auto h-auto object-contain shadow-2xl"
          />
        </div>

        {/* Next Button */}
        {photos.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next image"
            className="absolute right-2 sm:right-4 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center text-xl transition-all border border-white/20 cursor-pointer shadow-lg"
          >
            ›
          </button>
        )}
      </div>

      {/* Bottom Caption Bar */}
      <div className="text-center text-white/80 max-w-2xl mx-auto w-full z-10 py-1">
        {currentPhoto.caption && (
          <p className="text-sm font-serif italic text-white/95">
            &ldquo;{currentPhoto.caption}&rdquo;
          </p>
        )}
        {currentPhoto.altText && !currentPhoto.caption && (
          <p className="text-xs text-white/70">{currentPhoto.altText}</p>
        )}
      </div>
    </div>
  );
}
