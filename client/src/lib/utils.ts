import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get initials from a name (first letter of first and last name)
 */
export function getInitials(name: string): string {
  if (!name || typeof name !== 'string') return 'NA';
  
  const parts = name.trim().split(' ').filter(Boolean);
  
  if (parts.length === 0) return 'NA';
  
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Format a phone number
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  } else if (cleaned.length === 11 && cleaned.charAt(0) === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 11)}`;
  }
  
  // If not a standard format, return cleaned number
  return cleaned;
}

/**
 * Get color class for a lead status
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'new':
      return 'bg-purple-100 text-purple-700';
    case 'unread':
      return 'bg-blue-100 text-blue-700';
    case 'read':
      return 'bg-neutral-100 text-neutral-700';
    case 'contacted':
      return 'bg-blue-100 text-blue-700';
    case 'rnr':
      return 'bg-orange-100 text-orange-700';
    case 'follow_up':
      return 'bg-indigo-100 text-indigo-700';
    case 'interested':
      return 'bg-yellow-100 text-yellow-700';
    case 'not_interested':
      return 'bg-red-100 text-red-700';
    case 'junk':
      return 'bg-neutral-100 text-neutral-700';
    case 'converted':
      return 'bg-green-100 text-green-700';
    case 'lost':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-neutral-100 text-neutral-700';
  }
}

/**
 * Get color class for a lead source
 */
export function getSourceColor(source?: string): string {
  if (!source) return 'bg-neutral-100 text-neutral-700';
  
  switch (source.toLowerCase()) {
    case 'facebook':
      return 'bg-blue-100 text-blue-700';
    case 'google':
      return 'bg-purple-100 text-purple-700';
    case 'website':
      return 'bg-green-100 text-green-700';
    case 'referral':
      return 'bg-orange-100 text-orange-700';
    case 'manual':
      return 'bg-neutral-100 text-neutral-700';
    default:
      return 'bg-neutral-100 text-neutral-700';
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}
