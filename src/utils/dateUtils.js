/**
 * Formats any date/timestamp input into a clean, simple IST date & time format.
 * Format: DD/MM/YYYY, HH:MM AM/PM (e.g., 09/02/2026, 05:43 PM)
 */
export const formatISTDateTime = (dateVal) => {
  if (!dateVal) return 'N/A';
  const strVal = String(dateVal).trim();
  if (
    !strVal ||
    strVal === 'N/A' ||
    strVal === 'Just Now' ||
    strVal === 'Recorded' ||
    strVal === 'Requested' ||
    strVal === 'Issued'
  ) {
    return strVal || 'N/A';
  }

  try {
    // If already in clean DD/MM/YYYY, HH:MM AM/PM format
    if (/^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2} (AM|PM)$/i.test(strVal)) {
      return strVal.toUpperCase();
    }

    // Try parsing date
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) {
      return strVal;
    }

    const formatted = date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    return formatted.toUpperCase();
  } catch (e) {
    return strVal;
  }
};
