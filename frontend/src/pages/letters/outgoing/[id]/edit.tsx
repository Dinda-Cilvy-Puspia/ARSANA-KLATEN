// frontend/src/pages/letters/outgoing/[id]/edit.tsx

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm, type FieldPath } from 'react-hook-form';
import {
  ArrowLeft, Upload, Calendar, X, FileText, Save, CheckCircle, BookOpen, ClipboardList, 
  ChevronRight, AlertCircle, Info, Sparkles
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOutgoingLetter, useUpdateOutgoingLetter } from '@/hooks/useApi';
import Layout from '@/components/Layout/Layout';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

// Tipe data untuk form
interface FormData {
  letterNumber: string;
  createdDate: string;
  letterDate: string;
  securityClass: 'BIASA';
  classificationCode?: string;
  serialNumber?: number;
  letterNature: 'BIASA' | 'TERBATAS' | 'RAHASIA' | 'SANGAT_RAHASIA' | 'PENTING';
  executionDate?: string;
  subject: string;
  sender: string;
  recipient: string;
  processor: string;
  note?: string;
  isInvitation?: boolean;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  eventNotes?: string;
  file?: File;
}

const VerticalStepper = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { number: 1, title: "Informasi Utama", description: "Detail dasar & klasifikasi surat", icon: <ClipboardList className="h-5 w-5" /> },
    { number: 2, title: "Konten & Pihak Terlibat", description: "Subjek, pengirim, dan penerima", icon: <BookOpen className="h-5 w-5" /> },
    { number: 3, title: "Acara & Lampiran", description: "Jadwal acara atau unggah file", icon: <Calendar className="h-5 w-5" /> },
  ];
  
  return (
    <nav className="flex flex-col space-y-2 p-6">
      {steps.map((step, index) => {
        const status = currentStep === step.number ? "active" : currentStep > step.number ? "complete" : "upcoming";
        return (
          <div key={step.number} className="relative">
            <div className="flex items-center group">
              <div className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 ${
                  status === "active" ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-200 scale-110" :
                  status === "complete" ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md" :
                  "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
              }`}>
                {status === "complete" ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-semibold">{step.number}</span>
                )}
                {status === "active" && (
                  <span className="absolute -inset-1 rounded-xl bg-amber-400 opacity-30 animate-ping"></span>
                )}
              </div>
              <div className="ml-4 flex-1">
                <h3 className={`text-sm font-semibold transition-colors ${
                  status === "active" ? "text-amber-900" : 
                  status === "complete" ? "text-emerald-900" : 
                  "text-gray-500 group-hover:text-gray-700"
                }`}>
                  {step.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`ml-5 mt-2 mb-2 h-8 w-0.5 transition-all duration-300 ${
                status === "complete" ? "bg-gradient-to-b from-emerald-500 to-emerald-300" : "bg-gray-200"
              }`} />
            )}
          </div>
        );
      })}
    </nav>
  );
};

const InfoBox = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
    <p className="text-sm text-blue-800">{children}</p>
  </div>
);

const FormSection = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className="mb-5">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-500" />
        {title}
      </h3>
      {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
    </div>
    {children}
  </div>
);

const formatDateForInput = (dateString?: string | null) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  } catch {
    return "";
  }
};

export default function EditOutgoingLetterPage() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingFileName, setExistingFileName] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const { data: letterData, isLoading: fetchingLetter } = useOutgoingLetter(id as string);
  const updateLetterMutation = useUpdateOutgoingLetter();

  const { register, handleSubmit, watch, trigger, reset, formState: { errors } } = useForm<FormData>({ mode: "onChange" });
  const isInvitation = watch('isInvitation');

  useEffect(() => {
    if (letterData) {
      reset({
        letterNumber: letterData.letterNumber,
        createdDate: formatDateForInput(letterData.createdDate),
        letterDate: formatDateForInput(letterData.letterDate),
        securityClass: letterData.securityClass || 'BIASA',
        classificationCode: letterData.classificationCode || '',
        serialNumber: letterData.serialNumber || undefined,
        letterNature: letterData.letterNature || 'BIASA',
        subject: letterData.subject,
        executionDate: formatDateForInput(letterData.executionDate),
        sender: letterData.sender,
        recipient: letterData.recipient,
        processor: letterData.processor,
        note: letterData.note || '',
        isInvitation: letterData.isInvitation,
        eventDate: formatDateForInput(letterData.eventDate),
        eventTime: letterData.eventTime || '',
        eventLocation: letterData.eventLocation || '',
        eventNotes: letterData.eventNotes || '',
      });
      setExistingFileName(letterData.fileName ?? null);
    }
  }, [letterData, reset]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const onSubmit = (data: FormData) => {
    const formData = new FormData();
    (Object.keys(data) as Array<keyof FormData>).forEach(key => {
      const value = data[key];
      if (value !== null && value !== undefined && value !== '' && key !== 'file') {
        if (['createdDate', 'letterDate', 'executionDate', 'eventDate'].includes(key) && value) {
          formData.append(key, new Date(value as string).toISOString());
        } else if (typeof value === 'boolean') {
          formData.append(key, String(value));
        } else {
          formData.append(key, value as string | Blob);
        }
      }
    });

    if (selectedFile) {
      formData.append('file', selectedFile);
    }
    
    toast.promise(
      updateLetterMutation.mutateAsync({ id: id as string, formData }),
      {
        loading: 'Menyimpan perubahan...',
        success: () => {
          router.push(`/letters/outgoing/${id}`);
          return 'Surat berhasil diperbarui!';
        },
        error: (err: any) => err?.message || 'Gagal memperbarui surat. Coba lagi.',
      }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Ukuran file terlalu besar. Maksimal 10MB.");
        return;
      }
      setSelectedFile(file);
      setExistingFileName(null);
      toast.success("File berhasil dipilih!");
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    const fileInput = document.getElementById("file") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
    toast.success("File dihapus");
  };

  const handleNextStep = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Stop event propagation
    
    let fieldsToValidate: FieldPath<FormData>[] = [];
    if (currentStep === 1) fieldsToValidate = ["letterNumber", "createdDate", "letterDate"];
    if (currentStep === 2) fieldsToValidate = ["subject", "sender", "recipient", "processor"];
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.error("Harap isi semua kolom wajib diisi sebelum melanjutkan.");
    }
  };

  const handlePrevStep = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Stop event propagation
    setCurrentStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (authLoading || fetchingLetter) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-amber-600 absolute top-0"></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Memuat data...</p>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) return null;

  const inputFocusStyle = "focus:ring-2 focus:ring-amber-200 focus:border-amber-500 transition-all";
  const requiredLabel = "form-label form-label-required";
  
  return (
    <Layout>
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-120px)] bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-xl overflow-hidden">
        {/* Sidebar */}
        <div className="w-full lg:w-80 bg-white border-r border-gray-200">
          <div className="sticky top-0">
            <div className="flex items-center gap-3 p-6 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
              <Link 
                href={`/letters/outgoing/${id}`} 
                className="p-2 rounded-lg hover:bg-white transition-all shadow-sm hover:shadow"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700" />
              </Link>
              <div>
                <h1 className="font-bold text-lg text-gray-900">Edit Surat Keluar</h1>
                <p className="text-xs text-gray-600">Perbarui informasi surat</p>
              </div>
            </div>
            <VerticalStepper currentStep={currentStep} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 lg:p-10 overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="max-w-5xl mx-auto">
            {/* Step Indicator Mobile */}
            <div className="lg:hidden mb-6 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Langkah {currentStep} dari 3</span>
                <span className="text-xs text-gray-500">{Math.round((currentStep / 3) * 100)}% Selesai</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 ease-out"
                  style={{ width: `${(currentStep / 3) * 100}%` }}
                />
              </div>
            </div>

            {/* Step Content */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-1 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentStep === 1 ? "Informasi Utama" : currentStep === 2 ? "Konten & Pihak Terlibat" : "Acara & Lampiran"}
                </h2>
              </div>
              <p className="text-gray-600 ml-7">
                {currentStep === 1 && "Masukkan detail dasar dan klasifikasi surat"}
                {currentStep === 2 && "Isi subjek surat dan pihak-pihak yang terlibat"}
                {currentStep === 3 && "Tambahkan detail acara (opsional) dan lampiran file"}
              </p>
            </div>

            {/* Step 1: Informasi Utama */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <InfoBox>
                  Pastikan nomor surat dan tanggal terisi dengan benar. Data ini akan digunakan sebagai identitas utama surat.
                </InfoBox>

                <FormSection title="Identitas Surat" description="Informasi dasar yang mengidentifikasi surat ini">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className={requiredLabel}>Nomor Surat</label>
                      <input 
                        type="text" 
                        {...register('letterNumber', { required: 'Nomor surat wajib diisi' })} 
                        className={`input ${inputFocusStyle} ${errors.letterNumber ? "input-error" : ""}`}
                        placeholder="Contoh: 001/SK/2024"
                      />
                      {errors.letterNumber && (
                        <div className="flex items-center gap-2 mt-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <p className="form-error">{errors.letterNumber.message}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className={requiredLabel}>Tanggal Pembuatan</label>
                      <input 
                        type="date" 
                        {...register('createdDate', { required: 'Tanggal pembuatan wajib diisi' })} 
                        className={`input ${inputFocusStyle} ${errors.createdDate ? "input-error" : ""}`}
                      />
                      {errors.createdDate && (
                        <div className="flex items-center gap-2 mt-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <p className="form-error">{errors.createdDate.message}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className={requiredLabel}>Tanggal Surat</label>
                      <input 
                        type="date" 
                        {...register('letterDate', { required: 'Tanggal surat wajib diisi' })} 
                        className={`input ${inputFocusStyle} ${errors.letterDate ? "input-error" : ""}`}
                      />
                      {errors.letterDate && (
                        <div className="flex items-center gap-2 mt-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <p className="form-error">{errors.letterDate.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </FormSection>

                <FormSection title="Klasifikasi & Sifat" description="Tentukan tingkat keamanan dan prioritas surat">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="form-label">Sifat Surat</label>
                      <select {...register('letterNature')} className={`input ${inputFocusStyle}`}>
                        <option value="BIASA">Biasa</option>
                        <option value="PENTING">Penting</option>
                        <option value="TERBATAS">Terbatas</option>
                        <option value="RAHASIA">Rahasia</option>
                        <option value="SANGAT_RAHASIA">Sangat Rahasia</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Klasifikasi Keamanan</label>
                      <select {...register('securityClass')} className={`input ${inputFocusStyle}`}>
                        <option value="BIASA">Biasa</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Tanggal Pelaksanaan</label>
                      <input type="date" {...register('executionDate')} className={`input ${inputFocusStyle}`} />
                    </div>

                    <div>
                      <label className="form-label">Kode Klasifikasi</label>
                      <input 
                        type="text" 
                        {...register('classificationCode')} 
                        className={`input ${inputFocusStyle}`}
                        placeholder="Contoh: A.1.2"
                      />
                    </div>

                    <div>
                      <label className="form-label">Nomor Urut</label>
                      <input 
                        type="number" 
                        {...register('serialNumber')} 
                        className={`input ${inputFocusStyle}`}
                        placeholder="1"
                      />
                    </div>
                  </div>
                </FormSection>
              </div>
            )}

            {/* Step 2: Konten & Pihak Terlibat */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <InfoBox>
                  Isi subjek surat dengan jelas dan lengkap. Pastikan semua pihak yang terlibat tercatat dengan benar.
                </InfoBox>

                <FormSection title="Subjek Surat" description="Perihal atau topik utama surat">
                  <div>
                    <label className={requiredLabel}>Subjek/Perihal</label>
                    <input 
                      type="text" 
                      {...register('subject', { required: 'Subjek wajib diisi' })} 
                      className={`input ${inputFocusStyle} ${errors.subject ? "input-error" : ""}`}
                      placeholder="Contoh: Undangan Rapat Koordinasi Tahunan"
                    />
                    {errors.subject && (
                      <div className="flex items-center gap-2 mt-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <p className="form-error">{errors.subject.message}</p>
                      </div>
                    )}
                  </div>
                </FormSection>

                <FormSection title="Pihak Terlibat" description="Pengirim, penerima, dan pengolah surat">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={requiredLabel}>Pengirim</label>
                      <input 
                        type="text" 
                        {...register('sender', { required: 'Pengirim wajib diisi' })} 
                        className={`input ${inputFocusStyle} ${errors.sender ? "input-error" : ""}`}
                        placeholder="Nama pengirim surat"
                      />
                      {errors.sender && (
                        <div className="flex items-center gap-2 mt-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <p className="form-error">{errors.sender.message}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className={requiredLabel}>Penerima</label>
                      <input 
                        type="text" 
                        {...register('recipient', { required: 'Penerima wajib diisi' })} 
                        className={`input ${inputFocusStyle} ${errors.recipient ? "input-error" : ""}`}
                        placeholder="Nama penerima surat"
                      />
                      {errors.recipient && (
                        <div className="flex items-center gap-2 mt-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <p className="form-error">{errors.recipient.message}</p>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className={requiredLabel}>Pengolah</label>
                      <input 
                        type="text" 
                        {...register('processor', { required: 'Pengolah wajib diisi' })} 
                        className={`input ${inputFocusStyle} ${errors.processor ? "input-error" : ""}`}
                        placeholder="Nama pengolah/PIC surat"
                      />
                      {errors.processor && (
                        <div className="flex items-center gap-2 mt-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <p className="form-error">{errors.processor.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </FormSection>

                <FormSection title="Catatan Tambahan" description="Informasi pendukung atau keterangan lainnya (opsional)">
                  <div>
                    <label className="form-label">Catatan</label>
                    <textarea 
                      {...register('note')} 
                      rows={4} 
                      className={`input ${inputFocusStyle}`}
                      placeholder="Tambahkan catatan atau keterangan jika diperlukan..."
                    />
                  </div>
                </FormSection>
              </div>
            )}

            {/* Step 3: Acara & Lampiran */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <InfoBox>
                  Aktifkan opsi surat undangan jika surat ini berisi informasi acara. Lampiran file bersifat opsional.
                </InfoBox>

                <FormSection title="Detail Acara" description="Aktifkan jika surat ini merupakan undangan atau pemberitahuan acara">
                  <div className="space-y-5">
                    <label 
                      htmlFor="isInvitation" 
                      className={`flex items-center gap-4 cursor-pointer rounded-xl border-2 p-5 transition-all duration-300 hover:shadow-lg ${
                        isInvitation 
                          ? 'border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 shadow-md' 
                          : 'border-gray-200 bg-white hover:border-amber-300'
                      }`}
                    >
                      <input {...register("isInvitation")} type="checkbox" id="isInvitation" className="sr-only" />
                      <div className={`flex h-14 w-14 items-center justify-center rounded-xl transition-all duration-300 ${
                        isInvitation ? 'bg-amber-500 text-white shadow-lg' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <Calendar className="h-7 w-7" />
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold text-gray-900 block">Surat Undangan/Acara</span>
                        <p className="text-sm text-gray-600 mt-1">Centang untuk mengisi detail informasi acara</p>
                      </div>
                      <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isInvitation ? 'border-amber-500 bg-amber-500' : 'border-gray-300'
                      }`}>
                        {isInvitation && <CheckCircle className="h-5 w-5 text-white" />}
                      </div>
                    </label>

                    {isInvitation && (
                      <div className="bg-gradient-to-br from-white to-amber-50 rounded-xl border-2 border-amber-200 p-6 animate-fade-in shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-amber-600" />
                          Informasi Acara
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="form-label form-label-required">Tanggal Acara</label>
                            <input 
                              type="date" 
                              {...register("eventDate", { required: isInvitation ? "Tanggal wajib diisi" : false })} 
                              className={`input ${inputFocusStyle} ${errors.eventDate ? "input-error" : ""}`}
                            />
                            {errors.eventDate && (
                              <div className="flex items-center gap-2 mt-2">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <p className="form-error">{errors.eventDate.message}</p>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="form-label">Waktu Acara</label>
                            <input 
                              type="time" 
                              {...register("eventTime")} 
                              className={`input ${inputFocusStyle}`}
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="form-label">Lokasi Acara</label>
                            <input 
                              type="text" 
                              {...register("eventLocation")} 
                              className={`input ${inputFocusStyle}`}
                              placeholder="Contoh: Aula Utama, Gedung A Lantai 3"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="form-label">Catatan Acara</label>
                            <textarea 
                              {...register("eventNotes")} 
                              rows={3} 
                              className={`input ${inputFocusStyle}`}
                              placeholder="Informasi tambahan tentang acara..."
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </FormSection>

                <FormSection title="Lampiran File" description="Unggah dokumen pendukung (opsional, maks. 10MB)">
                  <div className="space-y-4">
                    {existingFileName && !selectedFile && (
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-sm">
                          <FileText className="h-6 w-6 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">File Saat Ini</p>
                          <p className="text-sm text-gray-600 truncate">{existingFileName}</p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Terupload</span>
                      </div>
                    )}

                    {!selectedFile ? (
                      <div className="relative group">
                        <input 
                          id="file" 
                          type="file" 
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
                          onChange={handleFileChange} 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        />
                        <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                          existingFileName 
                            ? 'border-gray-300 bg-gray-50 hover:border-amber-400 hover:bg-amber-50' 
                            : 'border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 hover:border-amber-500 hover:shadow-lg'
                        }`}>
                          <div className="flex flex-col items-center">
                            <div className={`flex h-16 w-16 items-center justify-center rounded-full mb-4 transition-all ${
                              existingFileName ? 'bg-gray-200 text-gray-500' : 'bg-amber-100 text-amber-600 group-hover:scale-110'
                            }`}>
                              <Upload className="h-8 w-8" />
                            </div>
                            <span className="text-base font-semibold text-gray-900 mb-1">
                              {existingFileName ? 'Ganti File Lampiran' : 'Unggah File Lampiran'}
                            </span>
                            <span className="text-sm text-gray-600 mb-2">
                              Klik atau seret file ke area ini
                            </span>
                            <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                              PDF, DOC, DOCX, JPG, PNG • Maks. 10MB
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 shadow-sm animate-fade-in">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-sm">
                            <FileText className="h-6 w-6 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{selectedFile.name}</p>
                            <p className="text-sm text-gray-600">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={removeFile} 
                          className="ml-4 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Hapus file"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </FormSection>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-10 pt-6 border-t-2 border-gray-200 flex items-center justify-between">
              <div>
                {currentStep > 1 && (
                  <button 
                    type="button" 
                    onClick={handlePrevStep} 
                    className="btn btn-secondary flex items-center gap-2 hover:shadow-md transition-all"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Sebelumnya
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {currentStep < 3 ? (
                  <button 
                    type="button" 
                    onClick={handleNextStep} 
                    className="btn bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                  >
                    Berikutnya
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    disabled={updateLetterMutation.isLoading} 
                    className="btn bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    {updateLetterMutation.isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Simpan Perubahan
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }

        input:focus, select:focus, textarea:focus {
          outline: none;
        }

        .input {
          @apply w-full px-4 py-2.5 border border-gray-300 rounded-lg;
        }

        .input-error {
          @apply border-red-300 bg-red-50;
        }

        .form-label {
          @apply block text-sm font-medium text-gray-700 mb-2;
        }

        .form-label-required::after {
          content: " *";
          @apply text-red-500;
        }

        .form-error {
          @apply text-sm text-red-600;
        }

        .btn {
          @apply px-6 py-2.5 rounded-lg font-medium transition-all duration-200;
        }

        .btn-secondary {
          @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
        }

        /* Smooth scroll behavior */
        html {
          scroll-behavior: smooth;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </Layout>
  );
}