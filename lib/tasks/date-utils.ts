/**
 * Safely parse a date value from various formats
 * 
 * @param dateValue - The date value to parse (string, Date object, or null)
 * @returns A properly formatted date or null
 */
export function safeParseDate(dateValue: any): Date | null {
  if (!dateValue) {
    return null;
  }

  try {
    // If it's already a Date object
    if (dateValue instanceof Date) {
      // Check if it's a valid date
      if (isNaN(dateValue.getTime())) {
        return null;
      }
      return dateValue;
    }

    // If it's a string, try to parse it
    if (typeof dateValue === 'string') {
      const parsedDate = new Date(dateValue);
      
      // Check if the parsing resulted in a valid date
      if (isNaN(parsedDate.getTime())) {
        return null;
      }
      
      return parsedDate;
    }
    
    // Handle other cases or invalid formats
    return null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
}

/**
 * Format a date for display
 * 
 * @param date - The date to format
 * @param format - The format to use (default: 'short')
 * @returns Formatted date string or empty string if date is invalid
 */
export function formatDate(date: Date | string | null, format: 'short' | 'full' = 'short'): string {
  if (!date) {
    return '';
  }

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    if (format === 'short') {
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
    
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}
