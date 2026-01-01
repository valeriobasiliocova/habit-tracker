import { format } from 'date-fns';

/**
 * Returns the current date as an ISO string (YYYY-MM-DD) based on the LOCAL time.
 * Using standard .toISOString() returns UTC, which can result in the wrong date
 * if the user is in a timezone ahead of UTC (e.g., UTC+1) late at night.
 */
export function getLocalDateKey(date: Date = new Date()): string {
    return format(date, 'yyyy-MM-dd');
}

/**
 * Checks if a date string is valid and within the start/end range of a goal.
 */
export function isDateInGoalRange(dateStr: string, startDateStr: string, endDateStr?: string | null): boolean {
    // Normalize dates to YYYY-MM-DD by stripping time
    const d = dateStr.split('T')[0];
    const start = startDateStr.split('T')[0];
    const end = endDateStr ? endDateStr.split('T')[0] : null;

    if (d < start) return false;
    if (end && d > end) return false;
    return true;
}
