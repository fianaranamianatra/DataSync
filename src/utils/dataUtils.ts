/**
 * Utility functions for data processing and sanitization
 */

/**
 * Recursively sanitizes object keys to comply with Firestore field naming restrictions
 * Removes leading and trailing double underscores from field names
 * @param data - The data to sanitize (object, array, or primitive)
 * @returns Sanitized data with compliant field names
 */
export function sanitizeFirestoreKeys(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeFirestoreKeys(item));
  }

  if (typeof data === 'object') {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      let sanitizedKey = key;
      
      // Remove leading and trailing double underscores
      if (sanitizedKey.startsWith('__') && sanitizedKey.endsWith('__')) {
        sanitizedKey = sanitizedKey.replace(/^__/, '').replace(/__$/, '');
        
        // If key becomes empty after sanitization, use a fallback
        if (sanitizedKey === '') {
          sanitizedKey = 'field';
        }
      }
      
      // Recursively sanitize nested objects
      sanitized[sanitizedKey] = sanitizeFirestoreKeys(value);
    }
    
    return sanitized;
  }

  // Return primitive values as-is
  return data;
}