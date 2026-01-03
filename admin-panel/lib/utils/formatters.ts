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
  const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_MEDIA_BASE_URL || 'http://localhost:8000/media';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/media')) {
    const base = MEDIA_BASE_URL.replace('/media', '');
    return `${base}${path}`;
  }
  return `${MEDIA_BASE_URL}/${path}`;
};


