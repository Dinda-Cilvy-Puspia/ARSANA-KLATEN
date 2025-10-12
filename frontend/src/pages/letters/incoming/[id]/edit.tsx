import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Upload, Calendar, X, FileText, Save } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIncomingLetter, useUpdateIncomingLetter } from '@/hooks/useApi';
import Layout from '@/components/Layout/Layout';
import Link from 'next/link';
import { CreateIncomingLetterRequest } from '@/types';
import { toast } from 'react-hot-toast';

export default function EditIncomingLetterPage() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, loading } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch existing letter data - Handle both data structures
  const { data: letterData, isLoading: fetchingLetter, error: fetchError } = useIncomingLetter(id as string);
  const updateLetterMutation = useUpdateIncomingLetter();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateIncomingLetterRequest>();

  const isInvitation = watch('isInvitation');

  // Debug logging
  useEffect(() => {
    console.log('Letter Data:', letterData);
    console.log('Fetching:', fetchingLetter);
    console.log('Error:', fetchError);
  }, [letterData, fetchingLetter, fetchError]);

  // Populate form with existing data - Handle both response structures
  useEffect(() => {
    if (letterData) {
      // Handle both response structures: letterData.data or letterData directly
      const letter = (letterData as any)?.data || letterData;
      
      console.log('Populating form with letter:', letter);
      
      try {
        reset({
          letterNumber: letter.letterNumber || '',
          letterDate: letter.letterDate ? new Date(letter.letterDate).toISOString().split('T')[0] : '',
          letterNature: letter.letterNature || 'BIASA',
          subject: letter.subject || '',
          sender: letter.sender || '',
          recipient: letter.recipient || '',
          processor: letter.processor || '',
          note: letter.note || '',
          receivedDate: letter.receivedDate ? new Date(letter.receivedDate).toISOString().split('T')[0] : '',
          isInvitation: letter.isInvitation || false,
          eventDate: letter.eventDate ? new Date(letter.eventDate).toISOString().split('T')[0] : '',
          eventTime: letter.eventTime || '',
          eventLocation: letter.eventLocation || '',
          eventNotes: letter.eventNotes || '',
        });
      } catch (error) {
        console.error('Error populating form:', error);
        toast.error('Gagal memuat data surat');
      }
    }
  }, [letterData, reset]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  const onSubmit = async (data: CreateIncomingLetterRequest) => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      const formData = {
        ...data,
        receivedDate: new Date(data.receivedDate).toISOString(),
        letterDate: data.letterDate ? new Date(data.letterDate).toISOString() : undefined,
        eventDate: data.eventDate ? new Date(data.eventDate).toISOString() : undefined,
        isInvitation: Boolean(data.isInvitation),
        note: data.note || undefined,
        eventTime: data.eventTime || undefined,
        eventLocation: data.eventLocation || undefined,
        eventNotes: data.eventNotes || undefined,
        file: selectedFile || undefined,
      };

      await updateLetterMutation.mutateAsync({ 
        id: id as string, 
        data: formData 
      });
      
      toast.success('Surat masuk berhasil diperbarui');
      router.push(`/letters/incoming/${id}`);
    } catch (error) {
      console.error('Error updating letter:', error);
      toast.error('Gagal memperbarui surat masuk');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Hanya file PDF, DOC, dan DOCX yang diperbolehkan');
        event.target.value = '';
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 10MB');
        event.target.value = '';
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    const fileInput = document.getElementById('file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  if (loading || fetchingLetter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Memuat data surat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Handle both data structures with proper type casting
  const letter = (letterData as any)?.data || letterData;

  if (fetchError || !letter) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-md border border-red-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Data Tidak Ditemukan</h2>
            <p className="text-gray-600 mb-6">
              Surat yang Anda cari tidak ditemukan atau telah dihapus.
            </p>
            <Link 
              href="/letters/incoming" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-medium shadow-md"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Daftar Surat
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-amber-500 rounded-2xl shadow-lg p-8">
          <Link
            href={`/letters/incoming/${id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-white hover:text-yellow-100 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Edit Surat Masuk</h1>
            <p className="text-yellow-100">
              Perbarui informasi surat masuk #{letter?.letterNumber || ''}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                Informasi Dasar
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Letter Number */}
                <div>
                  <label htmlFor="letterNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                    Nomor Surat <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="letterNumber"
                    {...register('letterNumber', { 
                      required: 'Nomor surat harus diisi',
                      minLength: { value: 3, message: 'Nomor surat minimal 3 karakter' }
                    })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                      errors.letterNumber ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                    }`}
                    placeholder="Contoh: 001/SK/2024"
                  />
                  {errors.letterNumber && (
                    <p className="mt-1.5 text-sm text-red-600">
                      ⚠ {errors.letterNumber.message}
                    </p>
                  )}
                </div>

                {/* Received Date */}
                <div>
                  <label htmlFor="receivedDate" className="block text-sm font-semibold text-gray-700 mb-2">
                    Tanggal Diterima <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="receivedDate"
                    {...register('receivedDate', { required: 'Tanggal diterima harus diisi' })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                      errors.receivedDate ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                    }`}
                  />
                  {errors.receivedDate && (
                    <p className="mt-1.5 text-sm text-red-600">
                      ⚠ {errors.receivedDate.message}
                    </p>
                  )}
                </div>

                {/* Letter Date */}
                <div>
                  <label htmlFor="letterDate" className="block text-sm font-semibold text-gray-700 mb-2">
                    Tanggal Surat
                  </label>
                  <input
                    type="date"
                    id="letterDate"
                    {...register('letterDate')}
                    className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* Letter Nature */}
                <div>
                  <label htmlFor="letterNature" className="block text-sm font-semibold text-gray-700 mb-2">
                    Sifat Surat
                  </label>
                  <select
                    id="letterNature"
                    {...register('letterNature')}
                    className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  >
                    <option value="BIASA">Biasa</option>
                    <option value="TERBATAS">Terbatas</option>
                    <option value="RAHASIA">Rahasia</option>
                    <option value="SANGAT_RAHASIA">Sangat Rahasia</option>
                    <option value="PENTING">Penting</option>
                  </select>
                </div>

                {/* Subject */}
                <div className="md:col-span-2">
                  <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                    Subjek/Perihal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    {...register('subject', { 
                      required: 'Subjek surat harus diisi',
                      minLength: { value: 5, message: 'Subjek minimal 5 karakter' }
                    })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                      errors.subject ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                    }`}
                    placeholder="Masukkan subjek atau perihal surat"
                  />
                  {errors.subject && (
                    <p className="mt-1.5 text-sm text-red-600">
                      ⚠ {errors.subject.message}
                    </p>
                  )}
                </div>

                {/* Sender */}
                <div>
                  <label htmlFor="sender" className="block text-sm font-semibold text-gray-700 mb-2">
                    Pengirim <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="sender"
                    {...register('sender', { 
                      required: 'Pengirim harus diisi',
                      minLength: { value: 2, message: 'Nama pengirim minimal 2 karakter' }
                    })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                      errors.sender ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                    }`}
                    placeholder="Nama pengirim surat"
                  />
                  {errors.sender && (
                    <p className="mt-1.5 text-sm text-red-600">
                      ⚠ {errors.sender.message}
                    </p>
                  )}
                </div>

                {/* Recipient */}
                <div>
                  <label htmlFor="recipient" className="block text-sm font-semibold text-gray-700 mb-2">
                    Penerima <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="recipient"
                    {...register('recipient', { 
                      required: 'Penerima harus diisi',
                      minLength: { value: 2, message: 'Nama penerima minimal 2 karakter' }
                    })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                      errors.recipient ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                    }`}
                    placeholder="Nama penerima surat"
                  />
                  {errors.recipient && (
                    <p className="mt-1.5 text-sm text-red-600">
                      ⚠ {errors.recipient.message}
                    </p>
                  )}
                </div>

                {/* Processor */}
                <div>
                  <label htmlFor="processor" className="block text-sm font-semibold text-gray-700 mb-2">
                    Pengolah <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="processor"
                    {...register('processor', { 
                      required: 'Pengolah harus diisi',
                      minLength: { value: 2, message: 'Nama pengolah minimal 2 karakter' }
                    })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                      errors.processor ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                    }`}
                    placeholder="Nama pengolah surat"
                  />
                  {errors.processor && (
                    <p className="mt-1.5 text-sm text-red-600">
                      ⚠ {errors.processor.message}
                    </p>
                  )}
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label htmlFor="note" className="block text-sm font-semibold text-gray-700 mb-2">
                    Catatan
                  </label>
                  <textarea
                    id="note"
                    rows={3}
                    {...register('note')}
                    className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
                    placeholder="Tambahkan catatan tambahan (opsional)"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Invitation Details */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Detail Acara (Jika Undangan)
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Is Invitation Checkbox */}
              <div className="flex items-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                <input
                  type="checkbox"
                  id="isInvitation"
                  {...register('isInvitation')}
                  className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                />
                <label htmlFor="isInvitation" className="ml-3 text-sm font-medium text-gray-700">
                  Surat ini berisi undangan acara
                </label>
              </div>

              {/* Event details */}
              {isInvitation && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div>
                    <label htmlFor="eventDate" className="block text-sm font-semibold text-gray-700 mb-2">
                      Tanggal Acara <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="eventDate"
                      {...register('eventDate', {
                        required: isInvitation ? 'Tanggal acara harus diisi untuk undangan' : false
                      })}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
                        errors.eventDate ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                      }`}
                    />
                    {errors.eventDate && (
                      <p className="mt-1.5 text-sm text-red-600">
                        ⚠ {errors.eventDate.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="eventTime" className="block text-sm font-semibold text-gray-700 mb-2">
                      Waktu Acara
                    </label>
                    <input
                      type="time"
                      id="eventTime"
                      {...register('eventTime')}
                      className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="eventLocation" className="block text-sm font-semibold text-gray-700 mb-2">
                      Lokasi Acara
                    </label>
                    <input
                      type="text"
                      id="eventLocation"
                      {...register('eventLocation')}
                      className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="Lokasi atau tempat acara"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="eventNotes" className="block text-sm font-semibold text-gray-700 mb-2">
                      Catatan Acara
                    </label>
                    <textarea
                      id="eventNotes"
                      rows={3}
                      {...register('eventNotes')}
                      className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                      placeholder="Catatan tambahan untuk acara (opsional)"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* File Upload */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-yellow-600" />
                File Dokumen
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Current file */}
              {letter?.fileName && !selectedFile && (
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <FileText className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{letter.fileName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">File saat ini</p>
                    </div>
                  </div>
                </div>
              )}

              {/* File input */}
              <div>
                <label htmlFor="file" className="block text-sm font-semibold text-gray-700 mb-3">
                  {letter?.fileName ? 'Ganti File Dokumen' : 'Upload File Dokumen'} (Opsional)
                </label>
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="file"
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 hover:from-yellow-50 hover:to-amber-50 transition-all duration-200"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
                        <Upload className="w-6 h-6 text-yellow-600" />
                      </div>
                      <p className="mb-2 text-sm font-medium text-gray-700">
                        <span className="font-bold text-yellow-600">Klik untuk upload</span> atau drag dan drop
                      </p>
                      <p className="text-xs text-gray-500">PDF, DOC, DOCX (Max. 10MB)</p>
                    </div>
                    <input
                      id="file"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>

              {/* Selected file preview */}
              {selectedFile && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-emerald-900 truncate">{selectedFile.name}</p>
                        <p className="text-xs text-emerald-700 mt-0.5">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="flex-shrink-0 p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-lg transition-all"
                      title="Hapus file"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
            <div className="flex justify-end gap-3">
              <Link
                href={`/letters/incoming/${id}`}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-medium"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}