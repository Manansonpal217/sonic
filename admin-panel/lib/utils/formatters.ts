import { format, parseISO } from 'date-fns';

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  try {
    return format(parseISO(dateString), 'MMM dd, yyyy');
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  try {
    return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
  } catch {
    return dateString;
  }
};

export const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(num);
};

export const getMediaUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  const p = String(path).trim();
  // Extract actual /media/categories/xyz.jpg from malformed URLs
  const mediaPathMatch = p.match(/\/media\/[a-zA-Z0-9_]+\/[^?\s#]+\.(?:jpe?g|png|gif|webp)/i);
  if (mediaPathMatch) return mediaPathMatch[0];
  // Full URL: extract pathname
  if (p.startsWith('http://') || p.startsWith('https://')) {
    try {
      const url = new URL(p);
      if (url.pathname.startsWith('/media')) return url.pathname;
    } catch {
      /* fall through */
    }
  }
  // Clean /media/ path
  if (p.startsWith('/media')) return p.startsWith('/') ? p : `/${p}`;
  // Relative path like "categories/xyz.jpg"
  return `/media/${p.replace(/^\//, '')}`;
};


