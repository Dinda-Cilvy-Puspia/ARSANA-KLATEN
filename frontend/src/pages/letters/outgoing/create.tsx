import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Upload, Calendar, X, Send, Hash, User, Shield, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCreateOutgoingLetter } from '@/hooks/useApi';
import Layout from '@/components/Layout/Layout';
import Link from 'next/link';
import { CreateOutgoingLetterRequest, LetterNature, SecurityClass } from '@/types';
import { toast } from 'react-hot-toast';

export default function CreateOutgoingLetterPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Define constant arrays for dropdown options
  const letterNatureOptions: LetterNature[] = ['BIASA', 'PENTING', 'SANGAT_RAHASIA', 'RAHASIA', 'PENTING'];
  const securityClassOptions: SecurityClass[] = ['BIASA'];

  const createLetterMutation = useCreateOutgoingLetter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateOutgoingLetterRequest>({
    defaultValues: {
      createdDate: new Date().toISOString().slice(0, 16), // Default to current datetime
      letterDate: new Date().toISOString().slice(0, 16), // Default to current datetime
      letterNature: 'BIASA', // Default to 'Biasa'
      securityClass: 'BIASA', // Default to 'Biasa'
      isInvitation: false,
    },
  });

  const isInvitation = watch('isInvitation');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  const onSubmit = async (data: CreateOutgoingLetterRequest) => {
    try {
      // Proper data formatting for backend
      const formData = {
        ...data,
        // Ensure dates are properly formatted as ISO strings
        createdDate: new Date(data.createdDate).toISOString(),
        letterDate: new Date(data.letterDate).toISOString(),
        executionDate: data.executionDate ? new Date(data.executionDate).toISOString() : undefined,
        eventDate: data.eventDate ? new Date(data.eventDate).toISOString() : undefined,
        // Ensure boolean conversion
        isInvitation: Boolean(data.isInvitation),
        // Handle optional fields
        classificationCode: data.classificationCode || undefined,
        serialNumber: data.serialNumber || undefined,
        note: data.note || undefined,
        eventLocation: data.eventLocation || undefined,
        eventNotes: data.eventNotes || undefined,
        file: selectedFile || undefined,
      };

      await createLetterMutation.mutateAsync(formData);
      toast.success('Surat keluar berhasil ditambahkan!');
      router.push('/letters/outgoing');
    } catch (error) {
      console.error('Failed to create letter:', error);
      toast.error('Gagal membuat surat keluar. Silakan coba lagi.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link
            href="/letters/outgoing"
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tambah Surat Keluar</h1>
            <p className="text-gray-600">Masukkan informasi surat keluar baru</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="card p-6 bg-[#EBFDF9]">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Informasi Surat
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Surat <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('letterNumber', { required: 'Nomor surat wajib diisi' })}
                  type="text"
                  className="input"
                  placeholder="Masukkan nomor surat"
                />
                {errors.letterNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.letterNumber.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Pembuatan <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('createdDate', {
                    required: 'Tanggal pembuatan wajib diisi',
                    validate: (value) => {
                      const date = new Date(value);
                      const now = new Date();
                      if (date > now) {
                        return 'Tanggal tidak boleh di masa depan';
                      }
                      return true;
                    }
                  })}
                  type="datetime-local"
                  className="input"
                  max={new Date().toISOString().slice(0, 16)}
                />
                {errors.createdDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.createdDate.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subjek <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('subject', { required: 'Subjek wajib diisi' })}
                  type="text"
                  className="input"
                  placeholder="Masukkan subjek surat"
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Surat <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('letterDate', {
                    required: 'Tanggal surat wajib diisi',
                    validate: (value) => {
                      const date = new Date(value);
                      const now = new Date();
                      if (date > now) {
                        return 'Tanggal tidak boleh di masa depan';
                      }
                      return true;
                    }
                  })}
                  type="datetime-local"
                  className="input"
                  max={new Date().toISOString().slice(0, 16)}
                />
                {errors.letterDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.letterDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sifat Surat <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('letterNature', { required: 'Sifat surat wajib diisi' })}
                  className="input"
                >
                  {letterNatureOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
                {errors.letterNature && (
                  <p className="mt-1 text-sm text-red-600">{errors.letterNature.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <User className="h-4 w-4 mr-1 text-gray-500" /> Pengirim <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('sender', { required: 'Pengirim wajib diisi' })}
                  type="text"
                  className="input"
                  placeholder="Masukkan nama pengirim"
                />
                {errors.sender && (
                  <p className="mt-1 text-sm text-red-600">{errors.sender.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <User className="h-4 w-4 mr-1 text-gray-500" /> Penerima <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('recipient', { required: 'Penerima wajib diisi' })}
                  type="text"
                  className="input"
                  placeholder="Masukkan nama penerima"
                />
                {errors.recipient && (
                  <p className="mt-1 text-sm text-red-600">{errors.recipient.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <User className="h-4 w-4 mr-1 text-gray-500" /> Pengolah <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('processor', { required: 'Pengolah wajib diisi' })}
                  type="text"
                  className="input"
                  placeholder="Masukkan nama pengolah"
                />
                {errors.processor && (
                  <p className="mt-1 text-sm text-red-600">{errors.processor.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Shield className="h-4 w-4 mr-1 text-gray-500" /> Klasifikasi Keamanan <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('securityClass', { required: 'Klasifikasi keamanan wajib diisi' })}
                  className="input"
                >
                  {securityClassOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
                {errors.securityClass && (
                  <p className="mt-1 text-sm text-red-600">{errors.securityClass.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Hash className="h-4 w-4 mr-1 text-gray-500" /> Kode Klasifikasi
                </label>
                <input
                  {...register('classificationCode')}
                  type="text"
                  className="input"
                  placeholder="Cth: 000/123/IX/2023"
                />
                {errors.classificationCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.classificationCode.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Hash className="h-4 w-4 mr-1 text-gray-500" /> Nomor Urut
                </label>
                <input
                  {...register('serialNumber', { valueAsNumber: true })}
                  type="number"
                  className="input"
                  placeholder="Cth: 123"
                />
                {errors.serialNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.serialNumber.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Pelaksanaan (Opsional)
                </label>
                <input
                  {...register('executionDate')}
                  type="datetime-local"
                  className="input"
                />
                {errors.executionDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.executionDate.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan
                </label>
                <textarea
                  {...register('note')}
                  rows={3}
                  className="input"
                  placeholder="Masukkan catatan tambahan (opsional)"
                />
              </div>
            </div>
          </div>
          
          {/* Disposition Method Section */}
          <div className="card p-6 bg-[#EBFDF9]">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Metode Disposisi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pilih Metode Disposisi <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('dispositionMethod', { required: 'Metode disposisi wajib dipilih' })}
                  className="input"
                  defaultValue=""
                >
                  <option value="">Pilih...</option>
                  <option value="MANUAL">Manual</option>
                  <option value="SRIKANDI">Srikandi</option>
                </select>
                {errors.dispositionMethod && (
                  <p className="mt-1 text-sm text-red-600">{errors.dispositionMethod.message}</p>
                )}
              </div>

              {watch('dispositionMethod') === 'SRIKANDI' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor Disposisi Srikandi <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('srikandiDispositionNumber', {
                      required: 'Nomor disposisi Srikandi wajib diisi jika metode Srikandi dipilih',
                      minLength: { value: 3, message: 'Nomor minimal 3 karakter' }
                    })}
                    type="text"
                    className="input"
                    placeholder="Contoh: SRIKANDI/001/2025"
                  />
                  {errors.srikandiDispositionNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.srikandiDispositionNumber.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>
      

          {/* Invitation Section */}
          <div className="card p-6 bg-[#EBFDF9]">
            <div className="flex items-center mb-4">
              <input
                {...register('isInvitation')}
                type="checkbox"
                id="isInvitation"
                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="isInvitation" className="ml-2 text-sm font-medium text-gray-700">
                Ini adalah undangan/acara
              </label>
            </div>

            {isInvitation && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-md font-medium text-gray-900 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Detail Acara
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal & Waktu Acara
                    </label>
                    <input
                      {...register('eventDate')}
                      type="datetime-local"
                      className="input"
                    />
                     {errors.eventDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.eventDate.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lokasi Acara
                    </label>
                    <input
                      {...register('eventLocation')}
                      type="text"
                      className="input"
                      placeholder="Masukkan lokasi acara"
                    />
                    {errors.eventLocation && (
                      <p className="mt-1 text-sm text-red-600">{errors.eventLocation.message}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Catatan Acara
                    </label>
                    <textarea
                      {...register('eventNotes')}
                      rows={2}
                      className="input"
                      placeholder="Masukkan catatan tambahan untuk acara (opsional)"
                    />
                    {errors.eventNotes && (
                      <p className="mt-1 text-sm text-red-600">{errors.eventNotes.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* File Upload Section */}
          <div className="card p-6 bg-[#EBFDF9]">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              File Lampiran
            </h2>
            
            {!selectedFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="sr-only"
                />
                <label
                  htmlFor="file"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <span className="text-sm font-medium text-gray-900">
                    Klik untuk mengunggah file
                  </span>
                  <span className="text-sm text-gray-500 mt-1">
                    PDF, DOC, DOCX, JPG, JPEG, PNG (maks. 10MB)
                  </span>
                </label>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-start space-x-4">
            <button
              type="submit"
              disabled={createLetterMutation.isLoading}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                createLetterMutation.isLoading
                  ? 'bg-[#12A168] opacity-70 cursor-not-allowed text-white'
                  : 'bg-[#12A168] hover:bg-[#0e7d52] text-white'
              }`}
            >
              {createLetterMutation.isLoading ? 'Menyimpan...' : 'Tambah'}
            </button>

            <Link
              href="/letters/outgoing"
              className="btn btn-secondary"
            >
              Batal
            </Link>
          </div>
        </form>
      </div>
    </Layout>
  );
}
