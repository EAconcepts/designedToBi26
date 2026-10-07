'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';

export interface FileUploadItem {
  id: string;
  file: File;
  previewUrl: string;
  caption: string;
  status: 'idle' | 'compressing' | 'signing' | 'uploading' | 'completing' | 'done' | 'error';
  progress: number;
  errorMessage?: string;
}

export interface UploadDropzoneProps {
  token: string;
  coupleContactPhone?: string;
}

const MAX_FILES = 10;
const TWO_MB = 2 * 1024 * 1024;

/**
 * Client-side compression for JPEG/PNG images over 2MB.
 * Leaves HEIC and GIF files completely untouched.
 */
async function compressImageIfNeeded(file: File): Promise<File> {
  const isJpeg =
    file.type === 'image/jpeg' ||
    file.name.toLowerCase().endsWith('.jpg') ||
    file.name.toLowerCase().endsWith('.jpeg');
  const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');

  if ((!isJpeg && !isPng) || file.size <= TWO_MB) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      const maxDim = 4000;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve(file);
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            return resolve(file);
          }
          const compressed = new File([blob], file.name.replace(/\.png$/i, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        'image/jpeg',
        0.82,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

export function UploadDropzone({
  token,
  coupleContactPhone = '+2348000000000',
}: UploadDropzoneProps) {
  const [items, setItems] = useState<FileUploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const announce = useCallback((msg: string) => {
    setAnnouncement(msg);
  }, []);

  const handleFiles = useCallback(
    (selectedFiles: FileList | File[]) => {
      const filesArray = Array.from(selectedFiles);
      if (filesArray.length === 0) return;

      const remainingSlots = MAX_FILES - items.length;
      if (remainingSlots <= 0) {
        announce(`Maximum limit of ${MAX_FILES} photos per session reached.`);
        return;
      }

      const allowedFiles = filesArray.slice(0, remainingSlots);
      const newItems: FileUploadItem[] = allowedFiles.map((file) => {
        const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const isImage =
          file.type.startsWith('image/') || /\.(heic|heif|jpg|jpeg|png|webp|gif)$/i.test(file.name);
        const previewUrl = isImage ? URL.createObjectURL(file) : '';

        return {
          id,
          file,
          previewUrl,
          caption: '',
          status: 'idle',
          progress: 0,
        };
      });

      setItems((prev) => [...prev, ...newItems]);
      announce(`Added ${newItems.length} photos. Ready to upload.`);
    },
    [items.length, announce],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const removeItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const updateCaption = (id: string, caption: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, caption } : item)));
  };

  const uploadSingleItem = async (item: FileUploadItem): Promise<boolean> => {
    try {
      // 1. Client compression
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'compressing', progress: 10 } : i)),
      );
      const fileToUpload = await compressImageIfNeeded(item.file);

      // 2. Request signature
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'signing', progress: 25 } : i)),
      );
      const signRes = await fetch('/api/upload/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-upload-token': token,
        },
        body: JSON.stringify({ token }),
      });

      if (!signRes.ok) {
        const errJson = await signRes.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || 'Failed to authorize upload link.');
      }

      const signData = (await signRes.json()).data;

      // 3. Direct upload to Cloudinary
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading', progress: 50 } : i)),
      );

      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('api_key', signData.apiKey);
      formData.append('timestamp', String(signData.timestamp));
      formData.append('public_id', signData.publicId);
      formData.append('folder', signData.folder);
      formData.append('signature', signData.signature);

      const uploadRes = await fetch(signData.uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const uploadErr = await uploadRes.text();
        console.error('Cloudinary upload failure:', uploadErr);
        throw new Error('Could not transfer image to storage. Check network and retry.');
      }

      // 4. Complete upload
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'completing', progress: 85 } : i)),
      );

      const completeRes = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-upload-token': token,
        },
        body: JSON.stringify({
          publicId: signData.publicId,
          caption: item.caption.trim() || undefined,
        }),
      });

      if (!completeRes.ok) {
        const compErr = await completeRes.json().catch(() => ({}));
        throw new Error(compErr?.error?.message || 'Failed to finalize photo registration.');
      }

      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'done', progress: 100 } : i)),
      );
      announce(`Uploaded ${item.file.name} successfully.`);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed.';
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: 'error', errorMessage: message, progress: 0 } : i,
        ),
      );
      announce(`Error uploading ${item.file.name}: ${message}`);
      return false;
    }
  };

  const uploadAll = async () => {
    setIsProcessingBatch(true);
    const queue = items.filter((i) => i.status === 'idle' || i.status === 'error');

    announce(`Starting upload of ${queue.length} photos sequentially.`);

    // Sequential loop for resilient mobile & weak venue connectivity
    for (const item of queue) {
      await uploadSingleItem(item);
    }

    setIsProcessingBatch(false);
  };

  const hasPending = items.some((i) => i.status === 'idle' || i.status === 'error');
  const allComplete = items.length > 0 && items.every((i) => i.status === 'done');

  return (
    <div className="space-y-6">
      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" role="status">
        {announcement}
      </div>

      {/* Styled Dropzone with Hidden Native Input */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-10 text-center transition-all ${
          isDragging
            ? 'border-magenta-700 bg-magenta-50/50'
            : 'border-gold-500/40 bg-ivory-50/60 hover:border-gold-600'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="photo-upload-input"
          multiple
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) {
              handleFiles(e.target.files);
            }
          }}
          disabled={items.length >= MAX_FILES || isProcessingBatch}
        />

        <div className="max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-magenta-900/10 text-magenta-900 flex items-center justify-center text-2xl">
            📷
          </div>

          <div>
            <label
              htmlFor="photo-upload-input"
              className="inline-block font-serif text-lg sm:text-xl font-bold text-magenta-950 cursor-pointer hover:text-magenta-800 underline underline-offset-4"
            >
              Choose Photographs
            </label>
            <p className="text-xs text-ink-600 mt-1">
              or drag & drop images here (max {MAX_FILES} photos per session, up to 10 MB each).
            </p>
          </div>

          <p className="text-[11px] text-ink-500 italic">
            Supports iPhone HEIC, JPEG, PNG, and WebP. Photos will be reviewed before appearing in
            the gallery.
          </p>
        </div>
      </div>

      {/* Photo Queue List */}
      {items.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-base sm:text-lg text-ink-900">
              Selected Memories ({items.length}/{MAX_FILES})
            </h2>
            {items.length > 0 && !isProcessingBatch && (
              <button
                type="button"
                onClick={() => setItems([])}
                className="text-xs text-magenta-800 hover:text-magenta-950 underline"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="flex gap-3 p-3 rounded-2xl bg-white border border-ink-100 shadow-xs relative overflow-hidden"
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 shrink-0 rounded-xl bg-ivory-200 overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl || '/img-1.jpg'}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details & Status */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-ink-900 truncate">
                        {item.file.name}
                      </p>
                      {item.status !== 'uploading' && item.status !== 'completing' && (
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-ink-400 hover:text-ink-700 text-sm p-1"
                          aria-label={`Remove ${item.file.name}`}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="Add a loving note or memory (optional)..."
                      value={item.caption}
                      onChange={(e) => updateCaption(item.id, e.target.value)}
                      disabled={item.status !== 'idle' && item.status !== 'error'}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-ink-200 bg-ivory-50/50 focus:outline-hidden focus:border-gold-500 text-ink-900 placeholder:text-ink-400"
                    />
                  </div>

                  {/* Status Indicator */}
                  <div className="pt-2">
                    {item.status === 'idle' && (
                      <span className="text-[11px] font-medium text-ink-500">Ready to upload</span>
                    )}
                    {item.status === 'compressing' && (
                      <span className="text-[11px] font-medium text-gold-700 animate-pulse">
                        Optimizing...
                      </span>
                    )}
                    {item.status === 'signing' && (
                      <span className="text-[11px] font-medium text-gold-700">Authorizing...</span>
                    )}
                    {item.status === 'uploading' && (
                      <span className="text-[11px] font-medium text-magenta-700 animate-pulse">
                        Uploading...
                      </span>
                    )}
                    {item.status === 'completing' && (
                      <span className="text-[11px] font-medium text-gold-700">Finalizing...</span>
                    )}
                    {item.status === 'done' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700">
                        <span>✓</span> Received for moderation
                      </span>
                    )}
                    {item.status === 'error' && (
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-medium text-red-600 truncate">
                          {item.errorMessage || 'Failed'}
                        </span>
                        <button
                          type="button"
                          onClick={() => uploadSingleItem(item)}
                          className="text-[11px] font-bold text-magenta-900 underline ml-1 cursor-pointer"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Button */}
          {hasPending && (
            <div className="pt-2">
              <button
                type="button"
                onClick={uploadAll}
                disabled={isProcessingBatch}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-magenta-900 hover:bg-magenta-950 text-white font-medium text-sm transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isProcessingBatch
                  ? 'Uploading Memories...'
                  : `Upload ${items.filter((i) => i.status !== 'done').length} Photographs`}
              </button>
            </div>
          )}

          {allComplete && (
            <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-green-900 space-y-1">
              <p className="font-serif font-bold text-sm">Thank you so much! 🎉</p>
              <p className="text-xs">
                Your moments have been received with love. After a brief review by our coordinators,
                they will appear in the guest moments gallery.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Weak Connection Table Note Fallback */}
      <div className="p-4 rounded-2xl bg-ivory-100/70 border border-gold-500/20 text-xs text-ink-600 space-y-1">
        <p className="font-semibold text-magenta-950">Having trouble on venue Wi-Fi?</p>
        <p>
          Spotty cellular connection? No worries at all! You can save your photos and upload them
          later, or tell us at the table or message us on WhatsApp at{' '}
          <a
            href={`https://wa.me/${coupleContactPhone.replace(/[^0-9]/g, '')}`}
            className="text-magenta-900 font-semibold underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {coupleContactPhone}
          </a>
          .
        </p>
        <p className="pt-1 text-[11px] text-ink-500">
          Read our{' '}
          <Link href="/privacy" className="underline hover:text-ink-800">
            Privacy Notice
          </Link>{' '}
          on how uploads are handled and how to request removal.
        </p>
      </div>
    </div>
  );
}
