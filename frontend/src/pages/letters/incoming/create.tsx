// --- START OF FILE create.tsx ---
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Upload, Calendar, X, FileText, CheckCircle, BookOpen } from 'lucide-react'; // Tambahkan BookOpen
import { useAuth } from '@/hooks/useAuth';
import { useCreateIncomingLetter } from '@/hooks/useApi';
import Layout from '@/components/Layout/Layout';
import Link from 'next/link';
import { CreateIncomingLetterRequest, LetterCategory } from '@/types';
import { toast } from 'react-hot-toast';

export default function CreateIncomingLetterPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const createLetterMutation = useCreateIncomingLetter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateIncomingLetterRequest>();

  const isInvitation = watch('isInvitation');
  const needsFollowUp = watch('needsFollowUp');
  const dispositionMethod = watch('dispositionMethod'); // Watch untuk metode disposisi

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  const onSubmit = async (data: CreateIncomingLetterRequest) => {
    try {
      // Proper data formatting for backend
      const formData = {
        ...data,
        // Ensure dates are properly formatted as ISO strings
        receivedDate: new Date(data.receivedDate).toISOString(),
        letterDate: data.letterDate ? new Date(data.letterDate).toISOString() : undefined,
        eventDate: data.eventDate ? new Date(data.eventDate).toISOString() : undefined,
        followUpDeadline: data.followUpDeadline ? new Date(data.followUpDeadline).toISOString() : undefined,
        // Ensure boolean conversion
        isInvitation: Boolean(data.isInvitation),
        needsFollowUp: Boolean(data.needsFollowUp),
        // Handle optional fields
        note: data.note || undefined, // Keterangan diubah menjadi catatan, tetap opsional
        eventTime: data.eventTime || undefined,
        eventLocation: data.eventLocation || undefined,
        eventNotes: data.eventNotes || undefined,
        srikandiDispositionNumber: dispositionMethod === 'SRIKANDI' ? data.srikandiDispositionNumber || undefined : undefined, // Hanya kirim jika Srikandi
        file: selectedFile || undefined,
      };

      await createLetterMutation.mutateAsync(formData);
      toast.success('Surat masuk berhasil ditambahkan!');
      router.push('/letters/incoming');
    } catch (error) {
      console.error('Failed to create letter:', error);
      toast.error('Gagal membuat surat masuk. Silakan coba lagi.');
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
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link
            href="/letters/incoming"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="section-title text-[#023538]">Tambah Surat Masuk</h1>
            <p className="section-description">Masukkan informasi surat masuk baru</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="card p-6 bg-[#EBFDF9] animate-slide-in">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary-600" />
              Informasi Surat
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label form-label-required">
                  Nomor Surat
                </label>
                <input
                  {...register('letterNumber', { 
                    required: 'Nomor surat wajib diisi',
                    minLength: { value: 3, message: 'Nomor surat minimal 3 karakter' }
                  })}
                  type="text"
                  className={`input ${errors.letterNumber ? 'input-error' : ''}`}
                  placeholder="Contoh: 001/SK/2024"
                />
                {errors.letterNumber && (
                  <p className="form-error">{errors.letterNumber.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Tanggal Surat
                </label>
                <input
                  {...register('letterDate')}
                  type="date"
                  className="input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Sifat Surat
                </label>
                <select
                  {...register('letterNature')}
                  className="input"
                  defaultValue="BIASA"
                >
                  <option value="BIASA">Biasa</option>
                  <option value="TERBATAS">Terbatas</option>
                  <option value="RAHASIA">Rahasia</option>
                  <option value="SANGAT_RAHASIA">Sangat Rahasia</option>
                  <option value="PENTING">Penting</option>
                </select>
              </div>

              <div className="md:col-span-2 form-group">
                <label className="form-label form-label-required">
                  Subjek Surat
                </label>
                <input
                  {...register('subject', { 
                    required: 'Subjek wajib diisi',
                    minLength: { value: 5, message: 'Subjek minimal 5 karakter' }
                  })}
                  type="text"
                  className={`input ${errors.subject ? 'input-error' : ''}`}
                  placeholder="Masukkan subjek surat"
                />
                {errors.subject && (
                  <p className="form-error">{errors.subject.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label form-label-required">
                  Pengirim
                </label>
                <input
                  {...register('sender', { 
                    required: 'Pengirim wajib diisi',
                    minLength: { value: 2, message: 'Nama pengirim minimal 2 karakter' }
                  })}
                  type="text"
                  className={`input ${errors.sender ? 'input-error' : ''}`}
                  placeholder="Nama pengirim atau instansi"
                />
                {errors.sender && (
                  <p className="form-error">{errors.sender.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label form-label-required">
                  Penerima
                </label>
                <input
                  {...register('recipient', { 
                    required: 'Penerima wajib diisi',
                    minLength: { value: 2, message: 'Nama penerima minimal 2 karakter' }
                  })}
                  type="text"
                  className={`input ${errors.recipient ? 'input-error' : ''}`}
                  placeholder="Nama penerima atau instansi"
                />
                {errors.recipient && (
                  <p className="form-error">{errors.recipient.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label form-label-required">
                  Pengolah
                </label>
                <input
                  {...register('processor', { 
                    required: 'Pengolah wajib diisi',
                    minLength: { value: 2, message: 'Nama pengolah minimal 2 karakter' }
                  })}
                  type="text"
                  className={`input ${errors.processor ? 'input-error' : ''}`}
                  placeholder="Nama pengolah"
                />
                {errors.processor && (
                  <p className="form-error">{errors.processor.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label form-label-required">
                  Tanggal Diterima
                </label>
                <input
                  {...register('receivedDate', { 
                    required: 'Tanggal diterima wajib diisi',
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
                  className={`input ${errors.receivedDate ? 'input-error' : ''}`}
                  max={new Date().toISOString().slice(0, 16)}
                />
                {errors.receivedDate && (
                  <p className="form-error">{errors.receivedDate.message}</p>
                )}
              </div>

              {/* Catatan (sebelumnya Keterangan) */}
              <div className="md:col-span-2 form-group">
                <label className="form-label">
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
          <div className="card p-6 bg-[#EBFDF9] animate-slide-in" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
              Metode Disposisi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label form-label-required">
                  Pilih Metode Disposisi
                </label>
                <select
                  {...register('dispositionMethod', { required: 'Metode disposisi wajib dipilih' })}
                  className={`input ${errors.dispositionMethod ? 'input-error' : ''}`}
                  defaultValue=""
                >
                  <option value="">Pilih...</option>
                  <option value="MANUAL">Manual</option>
                  <option value="SRIKANDI">Srikandi</option>
                </select>
                {errors.dispositionMethod && (
                  <p className="form-error">{errors.dispositionMethod.message}</p>
                )}
              </div>

              {dispositionMethod === 'SRIKANDI' && (
                <div className="form-group">
                  <label className="form-label form-label-required">
                    Nomor Disposisi Srikandi
                  </label>
                  <input
                    {...register('srikandiDispositionNumber', {
                      required: 'Nomor disposisi Srikandi wajib diisi jika metode Srikandi dipilih',
                      minLength: { value: 3, message: 'Nomor disposisi minimal 3 karakter' }
                    })}
                    type="text"
                    className={`input ${errors.srikandiDispositionNumber ? 'input-error' : ''}`}
                    placeholder="Contoh: SRIKANDI/001/2024"
                  />
                  {errors.srikandiDispositionNumber && (
                    <p className="form-error">{errors.srikandiDispositionNumber.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>


          {/* Invitation Section */}
          <div className="card p-6 bg-[#EBFDF9] animate-slide-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center mb-6">
              <input
                {...register('isInvitation')}
                type="checkbox"
                id="isInvitation"
                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="isInvitation" className="ml-3 text-sm font-medium text-gray-700">
                Ini adalah undangan/acara
              </label>
            </div>

            {isInvitation && (
              <div className="space-y-6 border-t pt-6 animate-fade-in">
                <h3 className="text-md font-semibold text-gray-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                  Detail Acara
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label className="form-label">
                      Tanggal Acara
                    </label>
                    <input
                      {...register('eventDate', {
                        validate: (value) => {
                          if (isInvitation && !value) {
                            return 'Tanggal acara wajib diisi untuk undangan';
                          }
                          if (value) {
                            const eventDate = new Date(value);
                            const receivedDate = new Date(watch('receivedDate'));
                            if (eventDate <= receivedDate) {
                              return 'Tanggal acara harus setelah tanggal diterima';
                            }
                          }
                          return true;
                        }
                      })}
                      type="date"
                      className={`input ${errors.eventDate ? 'input-error' : ''}`}
                    />
                    {errors.eventDate && (
                      <p className="form-error">{errors.eventDate.message}</p>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      Waktu Acara
                    </label>
                    <input
                      {...register('eventTime')}
                      type="time"
                      className="input"
                      placeholder="Contoh: 14:00"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      Lokasi Acara
                    </label>
                    <input
                      {...register('eventLocation')}
                      type="text"
                      className="input"
                      placeholder="Masukkan lokasi acara"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      Catatan Acara
                    </label>
                    <textarea
                      {...register('eventNotes')}
                      rows={3}
                      className="input"
                      placeholder="Masukkan catatan tambahan untuk acara"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Follow-up Section */}
          <div className="card p-6 bg-[#EBFDF9] animate-slide-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center mb-6">
              <input
                {...register('needsFollowUp')}
                type="checkbox"
                id="needsFollowUp"
                className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="needsFollowUp" className="ml-3 text-sm font-medium text-gray-700">
                Surat ini perlu ditindaklanjuti
              </label>
            </div>

            {needsFollowUp && (
              <div className="space-y-6 border-t pt-6 animate-fade-in">
                <h3 className="text-md font-semibold text-gray-900 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-emerald-600" />
                  Detail Tindak Lanjut
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label className="form-label form-label-required">
                      Deadline Tindak Lanjut
                    </label>
                    <input
                      {...register('followUpDeadline', {
                        required: needsFollowUp ? 'Deadline tindak lanjut wajib diisi' : false,
                        validate: (value) => {
                          if (needsFollowUp && value) {
                            const deadlineDate = new Date(value);
                            const receivedDate = new Date(watch('receivedDate'));
                            receivedDate.setHours(0, 0, 0, 0);
                            deadlineDate.setHours(0, 0, 0, 0);

                            if (deadlineDate <= receivedDate) {
                                return 'Deadline tindak lanjut harus setelah tanggal diterima';
                            }
                          }
                          return true;
                        }
                      })}
                      type="date"
                      className={`input ${errors.followUpDeadline ? 'input-error' : ''}`}
                    />
                    {errors.followUpDeadline && (
                      <p className="form-error">{errors.followUpDeadline.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div
            className="flex justify-start space-x-4 animate-slide-in"
            style={{ animationDelay: '0.4s' }}
          >
            <button
              type="submit"
              disabled={createLetterMutation.isLoading}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                createLetterMutation.isLoading
                  ? 'bg-[#12A168] opacity-70 cursor-not-allowed text-white'
                  : 'bg-[#12A168] hover:bg-[#0e7d52] text-white'
              }`}
            >
              {createLetterMutation.isLoading ? (
                <>
                  <div className="loading-spinner h-4 w-4 mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Tambah
                </>
              )}
            </button>

            <Link
              href="/letters/incoming"
              className="btn btn-secondary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Batal
            </Link>
          </div>
        </form>
      </div>
    </Layout>
  );
}
