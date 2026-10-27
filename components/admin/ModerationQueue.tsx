'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { AdminUploadPanel } from '@/components/admin/AdminUploadPanel';

export interface AdminPhotoRow {
  id: string;
  publicId: string;
  src: string;
  thumbSrc: string;
  width: number;
  height: number;
  caption: string | null;
  altText: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  source: 'ADMIN' | 'GUEST';
  uploadedBy: string | null;
  createdAt: string;
  album: {
    id: string;
    slug: string;
    title: string;
  };
}

export function ModerationQueue() {
  const [statusTab, setStatusTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [photos, setPhotos] = useState<AdminPhotoRow[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeMessage, setActiveMessage] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const loadPhotos = useCallback(async (tab: 'PENDING' | 'APPROVED' | 'REJECTED', pg: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/media?status=${tab}&page=${pg}&limit=24`);
      if (res.ok) {
        const json = await res.json();
        setPhotos(json.data.rows);
        setCounts(json.data.counts);
        setTotalPages(json.data.totalPages);
      }
    } catch (err) {
      console.error('Failed to load photos:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await fetch(`/api/admin/media?status=${statusTab}&page=${page}&limit=24`);
        if (res.ok && !ignore) {
          const json = await res.json();
          setPhotos(json.data.rows);
          setCounts(json.data.counts);
          setTotalPages(json.data.totalPages);
        }
      } catch (err) {
        console.error('Failed to load photos:', err);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    init();
    return () => {
      ignore = true;
    };
  }, [statusTab, page]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllOnPage = () => {
    if (selectedIds.size === photos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(photos.map((p) => p.id)));
    }
  };

  const handleSingleUpdate = async (
    id: string,
    updates: { status?: 'APPROVED' | 'REJECTED' | 'PENDING'; caption?: string; altText?: string },
  ) => {
    try {
      const res = await fetch(`/api/admin/media/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        setActiveMessage('Photograph updated successfully.');
        setTimeout(() => setActiveMessage(null), 3000);
        await loadPhotos(statusTab, page);
      }
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'restore') => {
    if (selectedIds.size === 0) return;
    setIsActing(true);
    try {
      const res = await fetch('/api/admin/media/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          action,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setActiveMessage(`Successfully updated ${json.data.updated} photographs.`);
        setTimeout(() => setActiveMessage(null), 3000);
        setSelectedIds(new Set());
        await loadPhotos(statusTab, page);
      }
    } catch (err) {
      console.error('Bulk action failed:', err);
    } finally {
      setIsActing(false);
    }
  };

  const handleUploaded = (count: number) => {
    setActiveMessage(`${count} photo${count === 1 ? '' : 's'} uploaded and published.`);
    setTimeout(() => setActiveMessage(null), 4000);
    setStatusTab('APPROVED');
    setPage(1);
    setSelectedIds(new Set());
    void loadPhotos('APPROVED', 1);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-magenta-950">
            Media Moderation
          </h1>
          <p className="text-xs sm:text-sm text-ink-600 mt-1">
            Upload your own photographs or review submissions from wedding guests.
          </p>
        </div>

        <div className="flex flex-col gap-3 items-stretch sm:items-end">
          <button
            type="button"
            onClick={() => setShowUpload((open) => !open)}
            aria-expanded={showUpload}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-magenta-900 hover:bg-magenta-950 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            {showUpload ? 'Hide Upload Panel' : 'Upload Photos'}
          </button>

          {/* Status Filter Tabs (Touch Targets ≥ 44px) */}
          <div className="grid w-full grid-cols-3 p-1 rounded-2xl bg-ivory-200 border border-ink-100 sm:flex sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setStatusTab('PENDING');
                setSelectedIds(new Set());
                setPage(1);
              }}
              className={`min-h-[44px] min-w-0 justify-center px-2 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 sm:px-4 sm:justify-start cursor-pointer ${
                statusTab === 'PENDING'
                  ? 'bg-magenta-900 text-white shadow-xs'
                  : 'text-ink-700 hover:text-ink-900'
              }`}
            >
              <span>Pending</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] sm:px-2 ${statusTab === 'PENDING' ? 'bg-magenta-800 text-white' : 'bg-ivory-300 text-ink-600'}`}
              >
                {counts.pending}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStatusTab('APPROVED');
                setSelectedIds(new Set());
                setPage(1);
              }}
              className={`min-h-[44px] min-w-0 justify-center px-2 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 sm:px-4 sm:justify-start cursor-pointer ${
                statusTab === 'APPROVED'
                  ? 'bg-magenta-900 text-white shadow-xs'
                  : 'text-ink-700 hover:text-ink-900'
              }`}
            >
              <span>Approved</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] sm:px-2 ${statusTab === 'APPROVED' ? 'bg-magenta-800 text-white' : 'bg-ivory-300 text-ink-600'}`}
              >
                {counts.approved}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStatusTab('REJECTED');
                setSelectedIds(new Set());
                setPage(1);
              }}
              className={`min-h-[44px] min-w-0 justify-center px-2 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 sm:px-4 sm:justify-start cursor-pointer ${
                statusTab === 'REJECTED'
                  ? 'bg-magenta-900 text-white shadow-xs'
                  : 'text-ink-700 hover:text-ink-900'
              }`}
            >
              <span>Rejected</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] sm:px-2 ${statusTab === 'REJECTED' ? 'bg-magenta-800 text-white' : 'bg-ivory-300 text-ink-600'}`}
              >
                {counts.rejected}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Upload Panel */}
      {showUpload && <AdminUploadPanel onUploaded={handleUploaded} />}

      {/* Toast Feedback */}
      {activeMessage && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-900 text-xs font-medium flex items-center justify-between">
          <span>{activeMessage}</span>
          <button type="button" onClick={() => setActiveMessage(null)} className="text-green-700">
            ✕
          </button>
        </div>
      )}

      {/* Bulk Toolbar */}
      {photos.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-ink-100 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={selectAllOnPage}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-ink-200 text-xs font-medium text-ink-800 hover:bg-ivory-100 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedIds.size === photos.length && photos.length > 0}
                onChange={() => {}}
                className="w-4 h-4 rounded-sm text-magenta-900 pointer-events-none"
              />
              <span>
                {selectedIds.size === photos.length ? 'Deselect All' : 'Select All on Page'}
              </span>
            </button>
            <span className="text-xs text-ink-500">
              {selectedIds.size} of {photos.length} selected
            </span>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              {statusTab === 'PENDING' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleBulkAction('approve')}
                    disabled={isActing}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-green-700 hover:bg-green-800 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                  >
                    Approve Selected ({selectedIds.size})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkAction('reject')}
                    disabled={isActing}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                  >
                    Reject Selected ({selectedIds.size})
                  </button>
                </>
              )}

              {statusTab === 'APPROVED' && (
                <button
                  type="button"
                  onClick={() => handleBulkAction('reject')}
                  disabled={isActing}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                >
                  Reject Selected ({selectedIds.size})
                </button>
              )}

              {statusTab === 'REJECTED' && (
                <button
                  type="button"
                  onClick={() => handleBulkAction('restore')}
                  disabled={isActing}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-magenta-900 hover:bg-magenta-950 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                >
                  Restore to Pending ({selectedIds.size})
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Photo Cards Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-ink-500 text-sm">Loading media queue...</div>
      ) : photos.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-white border border-dashed border-ink-200 p-8 space-y-3 max-w-md mx-auto">
          <div className="w-14 h-14 mx-auto rounded-full bg-ivory-200 text-ink-400 flex items-center justify-center text-2xl">
            📷
          </div>
          <h2 className="font-serif text-lg font-bold text-ink-900">
            {statusTab === 'PENDING'
              ? 'Moderation Queue is Clear'
              : statusTab === 'APPROVED'
                ? 'No Approved Photos Yet'
                : 'No Rejected Photos'}
          </h2>
          <p className="text-xs text-ink-600">
            {statusTab === 'PENDING'
              ? 'All incoming guest memories have been reviewed! New uploads will appear here in real time.'
              : 'Photographs will appear here once reviewed.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {photos.map((photo) => {
            const isSelected = selectedIds.has(photo.id);
            const formattedDate = new Date(photo.createdAt).toLocaleString('en-GB', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={photo.id}
                className={`rounded-2xl border transition-all overflow-hidden bg-white shadow-xs flex flex-col justify-between ${
                  isSelected
                    ? 'border-magenta-700 ring-2 ring-magenta-700/20'
                    : 'border-ink-100 hover:border-gold-400'
                }`}
              >
                {/* Photo Preview & Selection */}
                <div className="relative aspect-4/3 w-full bg-ivory-200 overflow-hidden group">
                  <Image
                    src={photo.thumbSrc || photo.src}
                    alt={photo.altText || photo.caption || 'Wedding capture'}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Selection Checkbox (Touch target ≥ 44px) */}
                  <label
                    className="absolute top-2 left-2 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 cursor-pointer backdrop-blur-xs transition-colors"
                    aria-label={`Select photo ${photo.id}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(photo.id)}
                      className="w-5 h-5 rounded-sm text-magenta-900 cursor-pointer accent-magenta-900"
                    />
                  </label>

                  {/* Source Badge */}
                  <span className="absolute top-2 right-2 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-black/60 text-white backdrop-blur-xs">
                    {photo.source === 'GUEST'
                      ? `Guest (${photo.uploadedBy || 'Anonymous'})`
                      : 'Admin'}
                  </span>
                </div>

                {/* Body: Meta & Inline Editors */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-ink-500">
                      <span>Album: {photo.album.title}</span>
                      <span>{formattedDate}</span>
                    </div>

                    {/* Inline Alt Text Editor (a11y requirement) */}
                    <div>
                      <label
                        htmlFor={`alt-${photo.id}`}
                        className="block text-[11px] font-semibold text-ink-700 mb-1"
                      >
                        Alt Text (Accessibility):
                      </label>
                      <input
                        id={`alt-${photo.id}`}
                        type="text"
                        defaultValue={photo.altText || ''}
                        placeholder="Describe photograph for screen readers..."
                        onBlur={(e) => {
                          if (e.target.value !== (photo.altText || '')) {
                            handleSingleUpdate(photo.id, { altText: e.target.value });
                          }
                        }}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-ink-200 bg-ivory-50/50 text-ink-900 focus:outline-hidden focus:border-gold-500"
                      />
                    </div>

                    {/* Inline Caption Editor */}
                    <div>
                      <label
                        htmlFor={`caption-${photo.id}`}
                        className="block text-[11px] font-semibold text-ink-700 mb-1"
                      >
                        Caption / Memory Note:
                      </label>
                      <input
                        id={`caption-${photo.id}`}
                        type="text"
                        defaultValue={photo.caption || ''}
                        placeholder="Loving message or note..."
                        onBlur={(e) => {
                          if (e.target.value !== (photo.caption || '')) {
                            handleSingleUpdate(photo.id, { caption: e.target.value });
                          }
                        }}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-ink-200 bg-ivory-50/50 text-ink-900 focus:outline-hidden focus:border-gold-500"
                      />
                    </div>
                  </div>

                  {/* Actions (Touch targets ≥ 44px) */}
                  <div className="pt-2 border-t border-ink-100 flex items-center justify-end gap-2">
                    {photo.status === 'PENDING' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSingleUpdate(photo.id, { status: 'REJECTED' })}
                          className="min-h-[44px] px-3.5 py-2 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSingleUpdate(photo.id, { status: 'APPROVED' })}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-green-700 hover:bg-green-800 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                        >
                          Approve
                        </button>
                      </>
                    )}

                    {photo.status === 'APPROVED' && (
                      <button
                        type="button"
                        onClick={() => handleSingleUpdate(photo.id, { status: 'REJECTED' })}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Reject
                      </button>
                    )}

                    {photo.status === 'REJECTED' && (
                      <button
                        type="button"
                        onClick={() => handleSingleUpdate(photo.id, { status: 'PENDING' })}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl border border-ink-200 text-ink-800 hover:bg-ivory-100 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Restore to Pending
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-ink-200 text-xs font-semibold disabled:opacity-40 cursor-pointer"
          >
            Previous
          </button>
          <span className="text-xs text-ink-600 px-3">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-ink-200 text-xs font-semibold disabled:opacity-40 cursor-pointer"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
