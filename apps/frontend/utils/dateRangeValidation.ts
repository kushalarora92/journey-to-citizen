/**
 * Utility functions for validating and checking date ranges
 */

interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

/**
 * Check if two date ranges overlap
 */
export function doDateRangesOverlap(range1: DateRange, range2: DateRange): boolean {
  const start1 = new Date(range1.from + 'T00:00:00.000Z');
  const end1 = new Date(range1.to + 'T00:00:00.000Z');
  const start2 = new Date(range2.from + 'T00:00:00.000Z');
  const end2 = new Date(range2.to + 'T00:00:00.000Z');

  // Ranges overlap if:
  // start1 <= end2 AND start2 <= end1
  return start1 <= end2 && start2 <= end1;
}

/**
 * Check if a new date range overlaps with any existing ranges
 * Returns the overlapping ranges if found
 */
export function findOverlappingRanges(
  newRange: DateRange,
  existingRanges: DateRange[]
): DateRange[] {
  return existingRanges.filter(existing => 
    doDateRangesOverlap(newRange, existing)
  );
}

/**
 * Check if a date range exactly matches an existing range
 */
export function isExactDuplicate(
  newRange: DateRange,
  existingRanges: DateRange[]
): boolean {
  return existingRanges.some(
    existing => existing.from === newRange.from && existing.to === newRange.to
  );
}

/**
 * Format overlapping ranges for display in alert message
 */
export function formatOverlappingRangesMessage(ranges: DateRange[]): string {
  if (ranges.length === 0) return '';
  
  if (ranges.length === 1) {
    return `${formatDateForDisplay(ranges[0].from)} to ${formatDateForDisplay(ranges[0].to)}`;
  }
  
  return ranges
    .map(r => `• ${formatDateForDisplay(r.from)} to ${formatDateForDisplay(r.to)}`)
    .join('\n');
}

/**
 * Format date string for user-friendly display
 */
function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00.000Z');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });
}
