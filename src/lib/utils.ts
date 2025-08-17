import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Session token utility
export const getSessionToken = () => localStorage.getItem('sessionToken') || '';

// Debounce utility for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Format display name for conversations
export const formatDisplayName = (name: string, maxLength: number = 20): string => {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength - 3) + '...';
};

// Check if user is online based on last seen
export const isUserOnline = (lastSeen: number, threshold: number = 5 * 60 * 1000): boolean => {
  return Date.now() - lastSeen < threshold;
};

// Safe array access
export const safeArrayAccess = <T>(array: T[] | undefined | null, index: number): T | undefined => {
  return array && Array.isArray(array) && array.length > index ? array[index] : undefined;
};
