'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  MAX_UPLOAD_BYTES,
  ALLOWED_UPLOAD_FORMATS,
  ALLOWED_UPLOAD_EXTENSIONS,
  ALLOWED_UPLOAD_MIME_TYPES,
} from '@/lib/upload-constants';

interface AlbumOption {
  slug: string;
  title: string;
  photoCount: number;
}

type UploadStatus = 'queued' | 'uploading' | 'done' | 'error';

interface AdminUploadItem {
  id: string;
  file: File;
  previewUrl: string;
  altText: string;
  caption: string;
  status: UploadStatus;
  progress: number;
  errorMessage?: string;
}

interface SignResponse {
  uploadUrl: string;
  publicId: string;
  folder: string;
  apiKey: string;
  timestamp: number;
  signature: string;
}

const MAX_FILES = 20;

function isAllowedFile(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const extOk = ALLOWED_UPLOAD_EXTENSIONS.includes(ext);
  const mimeOk = file.type ? ALLOWED_UPLOAD_MIME_TYPES.includes(file.type) : false;
  return extOk || mimeOk;
}

function errorMessageFromBody(body: unknown, fallback: string): string {
  const message = (body as { error?: { message?: string } } | null)?.error?.message;
  return message || fallback;
}

function uploadToCloudinary(
  sign: SignResponse,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', sign.uploadUrl);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Storage rejected the upload (HTTP ${xhr.status}).`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error while transferring to storage.'));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', sign.apiKey);
    formData.append('timestamp', String(sign.timestamp));
    formData.append('public_id', sign.publicId);
    formData.append('folder', sign.folder);
    formData.append('signature', sign.signature);
    xhr.send(formData);
  });
}

export interface AdminUploadPanelProps {
  onUploaded: (count: number) => void;
}

export function AdminUploadPanel({ onUploaded }: AdminUploadPanelProps) {
  const [albums, setAlbums] = useState<AlbumOption[]>([]);
  const [albumSlug, setAlbumSlug] = useState('');
  const [items, setItems] = useState<AdminUploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<AdminUploadItem[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/media/albums');
        if (res.ok && !ignore) {
          const json = await res.json();
          const list: AlbumOption[] = json.data.albums ?? [];
          setAlbums(list);
          const preferred = list.find((album) => album.slug === 'pre-wedding');
          setAlbumSlug((preferred ?? list[0])?.slug ?? '');
        }
      } catch (err) {
        console.error('Failed to load albums:', err);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) {
        URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, []);

  const patchItem = useCallback((id: string, patch: Partial<AdminUploadItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const addFiles = useCallback((files: FileList | File[]) => {
    const incoming = Array.from(files);
    setNotice(null);

    let rejected = 0;
    let overflow = 0;
    const accepted: AdminUploadItem[] = [];

    for (const file of incoming) {
      if (!isAllowedFile(file) || file.size > MAX_UPLOAD_BYTES) {
        rejected += 1;
        continue;
      }
      accepted.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        altText: '',
        caption: '',
        status: 'queued',
        progress: 0,
      });
    }

    setItems((prev) => {
      const remaining = MAX_FILES - prev.length;
      if (accepted.length > remaining) {
        overflow = accepted.length - Math.max(remaining, 0);
        return [...prev, ...accepted.slice(0, Math.max(remaining, 0))];
      }
      return [...prev, ...accepted];
    });

    const notices: string[] = [];
    if (rejected > 0) {
      notices.push(
        `${rejected} file${rejected === 1 ? '' : 's'} skipped — only ${ALLOWED_UPLOAD_FORMATS.replace(/,/g, ', ')} up to ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB each`,
      );
    }
    if (overflow > 0) {
      notices.push(
        `Queue is full — ${overflow} file${overflow === 1 ? '' : 's'} not added (max ${MAX_FILES})`,
      );
    }
    if (notices.length > 0) {
      setNotice(notices.join('. ') + '.');
    }
  }, []);

  const removeItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const clearAll = () => {
    for (const item of items) {
      URL.revokeObjectURL(item.previewUrl);
    }
    setItems([]);
    setNotice(null);
  };

  const uploadItem = async (item: AdminUploadItem, slug: string): Promise<boolean> => {
    try {
      patchItem(item.id, { status: 'uploading', progress: 5, errorMessage: undefined });

      const signRes = await fetch('/api/admin/media/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumSlug: slug }),
      });
      if (!signRes.ok) {
        const json = await signRes.json().catch(() => null);
        throw new Error(errorMessageFromBody(json, 'Failed to authorize the upload.'));
      }
      const sign: SignResponse = (await signRes.json()).data;

      patchItem(item.id, { status: 'uploading', progress: 10 });
      await uploadToCloudinary(sign, item.file, (cloudinaryPercent) => {
        patchItem(item.id, { progress: 10 + Math.round(cloudinaryPercent * 0.8) });
      });

      patchItem(item.id, { progress: 90 });
      const createRes = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicId: sign.publicId,
          albumSlug: slug,
          altText: item.altText.trim() || null,
          caption: item.caption.trim() || null,
        }),
      });
      if (!createRes.ok) {
        const json = await createRes.json().catch(() => null);
        throw new Error(errorMessageFromBody(json, 'Failed to register the photograph.'));
      }

      patchItem(item.id, { status: 'done', progress: 100 });
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed.';
      patchItem(item.id, { status: 'error', progress: 0, errorMessage: message });
      return false;
    }
  };

  const uploadAll = async () => {
    if (isUploading || !albumSlug) return;
    const queue = items.filter((item) => item.status === 'queued' || item.status === 'error');
    if (queue.length === 0) return;

    setIsUploading(true);
    setNotice(null);

    let succeeded = 0;
    for (const item of queue) {
      const okResult = await uploadItem(item, albumSlug);
      if (okResult) succeeded += 1;
    }

    setIsUploading(false);
    if (succeeded > 0) {
      onUploaded(succeeded);
    }
  };

  const readyCount = items.filter(
    (item) => item.status === 'queued' || item.status === 'error',
  ).length;
  const doneCount = items.filter((item) => item.status === 'done').length;

  return (
    <div className="rounded-2xl border border-ink-100 bg-white shadow-xs p-5 space-y-4">
      {/* Album picker */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <label
            htmlFor="admin-upload-album"
            className="block text-xs font-semibold text-ink-700 mb-1.5"
          >
            Add to album
          </label>
          <select
            id="admin-upload-album"
            value={albumSlug}
            onChange={(e) => setAlbumSlug(e.target.value)}
            disabled={isUploading || albums.length === 0}
            className="w-full min-h-[44px] px-3 rounded-xl border border-ink-200 bg-ivory-50/50 text-sm text-ink-900 focus:outline-hidden focus:border-gold-500 disabled:opacity-50"
          >
            {albums.length === 0 && <option value="">No albums available</option>}
            {albums.map((album) => (
              <option key={album.slug} value={album.slug}>
                {album.title} ({album.photoCount})
              </option>
            ))}
          </select>
        </div>

        {items.length > 0 && !isUploading && (
          <button
            type="button"
            onClick={clearAll}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-ink-200 text-xs font-semibold text-ink-700 hover:bg-ivory-100 transition-colors cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setIsDragging(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) {
            addFiles(e.dataTransfer.files);
          }
        }}
        className={`rounded-2xl border-2 border-dashed transition-colors ${
          isDragging
            ? 'border-magenta-700 bg-magenta-950/5'
            : 'border-ink-200 bg-ivory-50/50 hover:border-gold-500'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_UPLOAD_MIME_TYPES.join(',')}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              addFiles(e.target.files);
            }
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="w-full min-h-[120px] px-5 py-6 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer disabled:cursor-not-allowed"
        >
          <span className="w-11 h-11 rounded-full bg-magenta-900 text-light-gold flex items-center justify-center text-lg font-serif font-bold">
            ↑
          </span>
          <span className="text-sm font-semibold text-ink-900">
            Drag &amp; drop photos here, or click to browse
          </span>
          <span className="text-xs text-ink-500">
            {ALLOWED_UPLOAD_FORMATS.replace(/,/g, ', ').toUpperCase()} — up to{' '}
            {Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB each, max {MAX_FILES} per batch
          </span>
        </button>
      </div>

      {/* Validation notice */}
      {notice && (
        <div className="p-3 rounded-xl bg-gold-50 border border-gold-200 text-gold-900 text-xs font-medium flex items-center justify-between gap-3">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-gold-700">
            ✕
          </button>
        </div>
      )}

      {/* Upload queue */}
      {items.length > 0 && (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex gap-3 p-3 rounded-xl border border-ink-100 bg-ivory-50/30"
            >
              <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-ivory-200">
                <Image
                  src={item.previewUrl}
                  alt=""
                  fill
                  unoptimized
                  sizes="64px"
                  className="object-cover"
                />
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-ink-800 truncate">
                    {item.file.name}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide ${
                        item.status === 'done'
                          ? 'text-green-700'
                          : item.status === 'error'
                            ? 'text-red-700'
                            : item.status === 'uploading'
                              ? 'text-magenta-800'
                              : 'text-ink-500'
                      }`}
                    >
                      {item.status === 'done'
                        ? 'Uploaded'
                        : item.status === 'error'
                          ? 'Failed'
                          : item.status === 'uploading'
                            ? `Uploading ${item.progress}%`
                            : 'Ready'}
                    </span>
                    {!isUploading && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.file.name}`}
                        className="w-8 h-8 rounded-lg border border-ink-200 text-ink-500 hover:text-red-700 hover:border-red-300 text-xs flex items-center justify-center cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {item.status === 'uploading' && (
                  <div
                    role="progressbar"
                    aria-valuenow={item.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-1.5 rounded-full bg-ivory-200 overflow-hidden"
                  >
                    <div
                      className="h-full bg-magenta-800 transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}

                {item.status === 'error' && item.errorMessage && (
                  <p className="text-[11px] text-red-700">{item.errorMessage}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <div>
                    <label htmlFor={`upload-alt-${item.id}`} className="sr-only">
                      Alt text for {item.file.name}
                    </label>
                    <input
                      id={`upload-alt-${item.id}`}
                      type="text"
                      value={item.altText}
                      disabled={item.status === 'uploading' || item.status === 'done'}
                      onChange={(e) => patchItem(item.id, { altText: e.target.value })}
                      placeholder="Alt text (accessibility)"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-ink-200 bg-white text-ink-900 focus:outline-hidden focus:border-gold-500 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label htmlFor={`upload-caption-${item.id}`} className="sr-only">
                      Caption for {item.file.name}
                    </label>
                    <input
                      id={`upload-caption-${item.id}`}
                      type="text"
                      value={item.caption}
                      disabled={item.status === 'uploading' || item.status === 'done'}
                      onChange={(e) => patchItem(item.id, { caption: e.target.value })}
                      placeholder="Caption / memory note"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-ink-200 bg-white text-ink-900 focus:outline-hidden focus:border-gold-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Batch action */}
      <div className="pt-1 border-t border-ink-100 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-ink-500">
          {readyCount} ready
          {doneCount > 0 ? ` · ${doneCount} uploaded` : ''}
          {albumSlug && albums.length > 0
            ? ` · → ${albums.find((album) => album.slug === albumSlug)?.title ?? albumSlug}`
            : ''}
        </span>
        <button
          type="button"
          onClick={uploadAll}
          disabled={isUploading || readyCount === 0 || !albumSlug}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-magenta-900 hover:bg-magenta-950 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isUploading ? 'Uploading…' : `Upload ${readyCount} Photo${readyCount === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  );
}
