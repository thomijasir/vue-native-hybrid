/**
 * Returns the number of days in the month of the provided date.
 */
export function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * Returns the weekday index of the first day of the month.
 *
 * @returns A value from `0` (Sunday) to `6` (Saturday).
 */
export function getFirstDayOfMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

/**
 * Compares two dates by calendar day (year, month, day).
 *
 * @returns `false` when either value is `null`.
 */
export function isSameDate(date1: Date | null, date2: Date | null): boolean {
  if (!date1 || !date2) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Checks whether a date is outside the optional min/max bounds.
 */
export function isDateDisabled(
  date: Date,
  minDate?: Date,
  maxDate?: Date,
): boolean {
  if (minDate && date < minDate) return true;
  if (maxDate && date > maxDate) return true;
  return false;
}

/**
 * Formats a date as `DD/MM/YYYY`.
 *
 * @example
 * formatDate(new Date(2026, 0, 5)); // "05/01/2026"
 */
export function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Returns a new date offset by a number of months.
 *
 * @remarks
 * Uses native `Date#setMonth`, so day overflow follows JavaScript date rules.
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}
