import { UserProfile } from '@journey-to-citizen/types';

/**
 * Display helper utilities for eligibility calculations
 * 
 * Note: Eligibility calculations are now performed in the backend (Firebase Functions).
 * These functions are only for displaying and formatting the stored eligibility data.
 */

/**
 * Get upcoming trips from user profile
 */
export function getUpcomingTrips(profile: UserProfile | null): number {
  if (!profile || !profile.travelAbsences) {
    return 0;
  }

  const today = new Date();
  return profile.travelAbsences.filter(absence => {
    const fromDate = new Date(absence.from);
    return fromDate > today;
  }).length;
}

/**
 * Format date for display
 * Handles both Date objects and Firestore Timestamps
 */
export function formatDate(date: Date | any | null): string {
  if (!date) return 'N/A';
  
  // Handle Firestore Timestamp
  if (date.toDate && typeof date.toDate === 'function') {
    date = date.toDate();
  }
  
  // Handle Date object or string
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

/**
 * Format days remaining in human-readable format
 */
export function formatDaysRemaining(days: number): string {
  if (days === 0) return 'Eligible now!';
  
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const remainingDays = days % 30;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
  if (remainingDays > 0 || parts.length === 0) {
    parts.push(`${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}`);
  }

  return parts.join(', ');
}
