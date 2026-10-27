import { redirect } from 'next/navigation';

// Kept so previously printed table QR codes (which embed /upload/<token>)
// still work: every token URL now points at the single tokenless /upload page,
// gated only by the open/closed upload window.
export default function UploadTokenRedirect() {
  redirect('/upload');
}
