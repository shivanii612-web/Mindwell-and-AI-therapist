import { format } from 'date-fns';

/**
 * MindWell: Safe Date Formatting helper to avoid date-fns RangeError crashes.
 */
export const safeFormatDate = (dateVal: any, formatStr: string, fallback = "Not Available") => {
  if (!dateVal) return fallback;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return fallback;
  try {
    return format(d, formatStr);
  } catch (error) {
    return fallback;
  }
};

/**
 * MindWell: Check if a date string/object is valid
 */
export const isValidDate = (dateVal: any): boolean => {
  if (!dateVal) return false;
  const d = new Date(dateVal);
  return !isNaN(d.getTime());
};
