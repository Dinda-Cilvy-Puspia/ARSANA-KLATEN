/**
 * Example: How to use FormData debugging in your form component
 * 
 * This is a template showing best practices for handling 409 conflicts
 */

import { FormEvent, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api';
import { 
  debugFormData, 
  validateFormData, 
  checkLetterNumberExists,
  checkFormDataDuplicates 
} from '@/lib/formDataUtils';

export default function IncomingLetterForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ STEP 1: Validate letterNumber on blur (optional pre-check)
  const handleLetterNumberBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const letterNumber = e.target.value.trim();
    
    if (!letterNumber) return;
    
    // Check if letterNumber already exists
    const exists = await checkLetterNumberExists(letterNumber, apiClient);
    
    if (exists) {
      setErrors(prev => ({
        ...prev,
        letterNumber: 'Nomor surat sudah terdaftar. Gunakan nomor lain.'
      }));
      toast.error('Nomor surat sudah terdaftar!', { duration: 3000 });
    } else {
      setErrors(prev => {
        const { letterNumber, ...rest } = prev;
        return rest;
      });
    }
  };

  // ✅ STEP 2: Handle form submission with debugging
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const formData = new FormData(formRef.current!);
      
      // 🔍 DEBUG: Log all FormData contents (only in development)
      debugFormData(formData, 'Incoming Letter Submission');
      
      // ⚠️ CHECK: Look for duplicate keys
      const duplicates = checkFormDataDuplicates(formData);
      if (duplicates.length > 0) {
        console.warn('Found duplicate keys:', duplicates);
      }
      
      // ✅ VALIDATE: Check required fields
      const { isValid, missingFields } = validateFormData(formData, [
        'letterNumber',
        'subject',
        'sender',
        'recipient',
        'processor',
        'receivedDate',
        'processingMethod',
        'letterNature'
      ]);
      
      if (!isValid) {
        toast.error(`Field wajib: ${missingFields.join(', ')}`);
        
        // Mark missing fields with errors
        const fieldErrors: Record<string, string> = {};
        missingFields.forEach(field => {
          fieldErrors[field] = 'Field ini wajib diisi';
        });
        setErrors(fieldErrors);
        
        setIsSubmitting(false);
        return;
      }
      
      // 🧹 CLEAN: Trim whitespace from text fields
      const letterNumber = (formData.get('letterNumber') as string)?.trim();
      if (letterNumber) {
        formData.set('letterNumber', letterNumber);
      }
      
      // 🚀 SUBMIT: Send to API
      console.log('📤 Submitting form...');
      const response = await apiClient.createIncomingLetter(formData);
      
      console.log('✅ Success:', response);
      toast.success('Surat masuk berhasil dibuat!');
      
      // Reset form
      formRef.current?.reset();
      setErrors({});
      
    } catch (error: any) {
      console.error('❌ Submission error:', error);
      
      // Handle specific error codes
      if (error.response?.status === 409) {
        // 409 is already handled by api.ts with toast
        // Optionally highlight the conflicting field
        const field = error.response.data.field;
        if (field) {
          setErrors({ [field]: error.response.data.error });
        }
      } else if (error.response?.status === 400) {
        // Validation errors
        const details = error.response.data.details;
        if (details && Array.isArray(details)) {
          const fieldErrors: Record<string, string> = {};
          details.forEach((detail: any) => {
            fieldErrors[detail.field] = detail.message;
          });
          setErrors(fieldErrors);
        }
        toast.error(error.response.data.error || 'Data tidak valid');
      } else {
        toast.error('Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      {/* Letter Number Field */}
      <div>
        <label htmlFor="letterNumber" className="form-label form-label-required">
          Nomor Surat
        </label>
        <input
          type="text"
          id="letterNumber"
          name="letterNumber"
          className={`input ${errors.letterNumber ? 'input-error' : ''}`}
          placeholder="Contoh: 001/SM/2024"
          onBlur={handleLetterNumberBlur}
          required
        />
        {errors.letterNumber && (
          <p className="form-error">{errors.letterNumber}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Format: NOMOR/KODE/TAHUN (misal: 001/SM/2024)
        </p>
      </div>

      {/* Subject Field */}
      <div>
        <label htmlFor="subject" className="form-label form-label-required">
          Perihal
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          className={`input ${errors.subject ? 'input-error' : ''}`}
          placeholder="Perihal surat"
          required
        />
        {errors.subject && (
          <p className="form-error">{errors.subject}</p>
        )}
      </div>

      {/* Sender Field */}
      <div>
        <label htmlFor="sender" className="form-label form-label-required">
          Pengirim
        </label>
        <input
          type="text"
          id="sender"
          name="sender"
          className={`input ${errors.sender ? 'input-error' : ''}`}
          placeholder="Nama pengirim"
          required
        />
        {errors.sender && (
          <p className="form-error">{errors.sender}</p>
        )}
      </div>

      {/* More fields... */}

      {/* Submit Button */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => formRef.current?.reset()}
          disabled={isSubmitting}
        >
          Reset
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="loading-spinner h-4 w-4 mr-2"></span>
              Menyimpan...
            </>
          ) : (
            'Simpan Surat'
          )}
        </button>
      </div>
    </form>
  );
}
