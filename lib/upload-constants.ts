// Shared upload constraints (client + server safe — no Node/browser-only imports).
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB per §3.0 / §3.4
export const ALLOWED_UPLOAD_FORMATS = 'jpg,jpeg,png,webp,gif,heic,heif';
export const ALLOWED_UPLOAD_EXTENSIONS = ALLOWED_UPLOAD_FORMATS.split(',');
export const ALLOWED_UPLOAD_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
];
