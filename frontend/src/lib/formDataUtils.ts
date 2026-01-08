/**
 * Utility functions for debugging and validating FormData
 */

/**
 * Debug FormData contents in console
 */
export function debugFormData(formData: FormData, label: string = 'FormData'): void {
  if (process.env.NODE_ENV !== 'development') return;

  console.group(`🔍 ${label}`);
  console.table(
    Array.from(formData.entries()).map(([key, value]) => ({
      Key: key,
      Value: value instanceof File 
        ? `📄 ${value.name} (${(value.size / 1024).toFixed(2)} KB)` 
        : value,
      Type: value instanceof File ? 'File' : typeof value
    }))
  );
  console.groupEnd();
}

/**
 * Check for duplicate keys in FormData
 */
export function checkFormDataDuplicates(formData: FormData): string[] {
  const keys = Array.from(formData.keys());
  const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
  
  if (duplicates.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Duplicate keys found in FormData:', duplicates);
  }
  
  return duplicates;
}

/**
 * Validate required fields in FormData
 */
export function validateFormData(
  formData: FormData, 
  requiredFields: string[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];
  
  requiredFields.forEach(field => {
    const value = formData.get(field);
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      missingFields.push(field);
    }
  });
  
  if (missingFields.length > 0 && process.env.NODE_ENV === 'development') {
    console.error('❌ Missing required fields:', missingFields);
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

/**
 * Convert FormData to plain object for logging
 */
export function formDataToObject(formData: FormData): Record<string, any> {
  const obj: Record<string, any> = {};
  
  Array.from(formData.entries()).forEach(([key, value]) => {
    if (value instanceof File) {
      obj[key] = {
        type: 'File',
        name: value.name,
        size: value.size,
        mimeType: value.type
      };
    } else {
      obj[key] = value;
    }
  });
  
  return obj;
}

/**
 * Check if letterNumber already exists (client-side validation)
 */
export async function checkLetterNumberExists(
  letterNumber: string,
  apiClient: any
): Promise<boolean> {
  try {
    const response = await apiClient.getIncomingLetters({ 
      search: letterNumber,
      limit: 1 
    });
    
    const exists = response.letters?.some(
      (letter: any) => letter.letterNumber === letterNumber
    );
    
    if (exists && process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ Letter number "${letterNumber}" already exists`);
    }
    
    return exists;
  } catch (error) {
    console.error('Error checking letter number:', error);
    return false;
  }
}
