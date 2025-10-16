// frontend/src/pages/letters/outgoing/create.tsx

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useForm, type FieldPath } from "react-hook-form"
import {
  ArrowLeft, Upload, Calendar, X, FileText, CheckCircle, BookOpen, Send, ClipboardList, ChevronRight
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useCreateOutgoingLetter } from "@/hooks/useApi"
import Layout from "@/components/Layout/Layout"
import Link from "next/link"
import { toast } from "react-hot-toast"

// Tipe data untuk form, disesuaikan untuk Surat Keluar
interface FormData {
  letterNumber: string;
  createdDate: string;
  letterDate: string;
  securityClass?: 'BIASA';
  classificationCode?: string;
  serialNumber?: number;
  letterNature?: 'BIASA' | 'TERBATAS' | 'RAHASIA' | 'SANGAT_RAHASIA' | 'PENTING';
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
    { number: 1, title: "Informasi Utama", description: "Detail dasar & klasifikasi surat.", icon: <ClipboardList className="h-6 w-6" /> },
    { number: 2, title: "Konten & Pihak Terlibat", description: "Subjek, pengirim, dan penerima.", icon: <BookOpen className="h-6 w-6" /> },
    { number: 3, title: "Acara & Lampiran", description: "Jadwal acara atau unggah file.", icon: <Calendar className="h-6 w-6" /> },
  ];
  return (
    <nav className="flex flex-col space-y-4 p-4">
      {steps.map((step) => {
        const status = currentStep === step.number ? "active" : currentStep > step.number ? "complete" : "upcoming";
        return (
          <div key={step.number} className="flex items-start">
            <div className="flex flex-col items-center mr-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 ${
                  status === "active" ? "bg-primary-600 text-white shadow-lg" :
                  status === "complete" ? "bg-emerald-500 text-white" :
                  "bg-gray-200 text-gray-500"
              }`}>
                {status === "complete" ? <CheckCircle className="h-7 w-7" /> : step.icon}
              </div>
              {step.number !== steps.length && <div className={`mt-2 h-16 w-0.5 ${status === "complete" ? "bg-emerald-500" : "bg-gray-200"}`} />}
            </div>
            <div className="pt-2.5">
              <h3 className={`font-semibold ${status === "active" ? "text-primary-800" : status === "complete" ? "text-gray-900" : "text-gray-500"}`}>
                {step.title}
              </h3>
              <p className="text-sm text-gray-500">{step.description}</p>
            </div>
          </div>
        );
      })}
    </nav>
  );
};

export default function CreateOutgoingLetterPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const createLetterMutation = useCreateOutgoingLetter();

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FormData>({ 
    mode: "onChange",
    defaultValues: {
        letterNature: 'BIASA',
        securityClass: 'BIASA',
        isInvitation: false,
    }
  });

  const isInvitation = watch('isInvitation');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated, loading, router]);

  const onSubmit = (data: FormData) => {
    const formData = new FormData();
    // Loop melalui data form dan append ke FormData
    (Object.keys(data) as Array<keyof FormData>).forEach(key => {
      const value = data[key];
      // Hanya append jika value tidak null, undefined, atau string kosong
      if (value !== null && value !== undefined && value !== '' && key !== 'file') {
        // Konversi tanggal ke format ISO String jika ada valuenya
        if (['createdDate', 'letterDate', 'executionDate', 'eventDate'].includes(key) && value) {
          formData.append(key, new Date(value as string).toISOString());
        } else if (typeof value === 'boolean') {
          formData.append(key, String(value)); // Konversi boolean ke string 'true' atau 'false'
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    // Append file jika ada
    if (selectedFile) {
      formData.append('file', selectedFile);
    }
    
    // Menggunakan toast.promise untuk UX yang lebih baik
    toast.promise(
      createLetterMutation.mutateAsync(formData),
      {
        loading: 'Menyimpan surat baru...',
        success: () => {
          router.push('/letters/outgoing');
          return 'Surat keluar berhasil ditambahkan!';
        },
        error: (err: any) => err?.response?.data?.error || 'Gagal membuat surat. Silakan coba lagi.',
      }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast.error("Ukuran file terlalu besar. Maksimal 10MB.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    const fileInput = document.getElementById("file") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleNextStep = async () => {
    let fieldsToValidate: FieldPath<FormData>[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ["letterNumber", "createdDate", "letterDate"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["subject", "sender", "recipient", "processor"];
    }
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => prev + 1);
    } else {
      toast.error("Harap isi semua kolom yang wajib diisi sebelum melanjutkan.");
    }
  };

  const handlePrevStep = () => setCurrentStep((prev) => prev - 1);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  const inputFocusStyle = "focus:ring-2 focus:ring-primary-200 focus:border-primary-500";
  const requiredLabel = "form-label form-label-required";

  return (
    <Layout>
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-150px)] bg-gray-50 rounded-xl shadow-sm">
        <div className="w-full md:w-1/3 lg:w-1/4 bg-white rounded-l-xl border-r border-gray-200 p-4">
          <div className="flex items-center space-x-3 mb-6 p-2">
            <Link href="/letters/outgoing" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="font-bold text-lg text-gray-800">Tambah Surat Keluar</h1>
            </div>
          </div>
          <VerticalStepper currentStep={currentStep} />
        </div>

        <div className="w-full md:w-2/3 lg:w-3/4 p-6 md:p-10">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
            <div className="flex-grow">
              <h2 className="section-title text-[#023538]">
                Langkah {currentStep}:{" "}
                {currentStep === 1 && "Informasi Utama"}
                {currentStep === 2 && "Konten & Pihak Terlibat"}
                {currentStep === 3 && "Acara & Lampiran"}
              </h2>
              <p className="section-description mb-8">Pastikan semua data yang ditandai dengan (*) terisi dengan benar.</p>

              {currentStep === 1 && (
                <div className="animate-fade-in space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div><label className={requiredLabel}>Nomor Surat</label><input type="text" {...register('letterNumber', { required: 'Nomor surat wajib diisi' })} className={`input ${inputFocusStyle} ${errors.letterNumber ? "input-error" : ""}`} />{errors.letterNumber && <p className="form-error">{errors.letterNumber.message}</p>}</div>
                    <div><label className={requiredLabel}>Tanggal Pembuatan</label><input type="date" {...register('createdDate', { required: 'Tanggal pembuatan wajib diisi' })} className={`input ${inputFocusStyle} ${errors.createdDate ? "input-error" : ""}`} />{errors.createdDate && <p className="form-error">{errors.createdDate.message}</p>}</div>
                    <div><label className={requiredLabel}>Tanggal Surat</label><input type="date" {...register('letterDate', { required: 'Tanggal surat wajib diisi' })} className={`input ${inputFocusStyle} ${errors.letterDate ? "input-error" : ""}`} />{errors.letterDate && <p className="form-error">{errors.letterDate.message}</p>}</div>
                    <div><label className="form-label">Sifat Surat</label><select {...register('letterNature')} className={`input ${inputFocusStyle}`}><option value="BIASA">Biasa</option><option value="PENTING">Penting</option><option value="TERBATAS">Terbatas</option><option value="RAHASIA">Rahasia</option><option value="SANGAT_RAHASIA">Sangat Rahasia</option></select></div>
                    <div><label className="form-label">Klasifikasi Keamanan</label><select {...register('securityClass')} className={`input ${inputFocusStyle}`}><option value="BIASA">Biasa</option></select></div>
                    <div><label className="form-label">Tanggal Pelaksanaan</label><input type="date" {...register('executionDate')} className={`input ${inputFocusStyle}`} /></div>
                    <div><label className="form-label">Kode Klasifikasi</label><input type="text" {...register('classificationCode')} className={`input ${inputFocusStyle}`} /></div>
                    <div><label className="form-label">Nomor Urut</label><input type="number" {...register('serialNumber')} className={`input ${inputFocusStyle}`} /></div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="animate-fade-in space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-3"><label className={requiredLabel}>Subjek/Perihal</label><input type="text" {...register('subject', { required: 'Subjek wajib diisi' })} className={`input ${inputFocusStyle} ${errors.subject ? "input-error" : ""}`} />{errors.subject && <p className="form-error">{errors.subject.message}</p>}</div>
                    <div><label className={requiredLabel}>Pengirim</label><input type="text" {...register('sender', { required: 'Pengirim wajib diisi' })} className={`input ${inputFocusStyle} ${errors.sender ? "input-error" : ""}`} />{errors.sender && <p className="form-error">{errors.sender.message}</p>}</div>
                    <div><label className={requiredLabel}>Penerima</label><input type="text" {...register('recipient', { required: 'Penerima wajib diisi' })} className={`input ${inputFocusStyle} ${errors.recipient ? "input-error" : ""}`} />{errors.recipient && <p className="form-error">{errors.recipient.message}</p>}</div>
                    <div><label className={requiredLabel}>Pengolah</label><input type="text" {...register('processor', { required: 'Pengolah wajib diisi' })} className={`input ${inputFocusStyle} ${errors.processor ? "input-error" : ""}`} />{errors.processor && <p className="form-error">{errors.processor.message}</p>}</div>
                    <div className="md:col-span-3"><label className="form-label">Catatan</label><textarea {...register('note')} rows={3} className={`input ${inputFocusStyle}`} /></div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <label htmlFor="isInvitation" className={`flex flex-col space-y-1 cursor-pointer rounded-lg border-2 p-4 text-center transition-all duration-200 hover:shadow-md ${isInvitation ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500' : 'border-gray-200 bg-white'}`}>
                      <input {...register("isInvitation")} type="checkbox" id="isInvitation" className="sr-only" />
                      <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 ${isInvitation ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'}`}><Calendar className="h-6 w-6" /></div>
                      <span className="font-semibold">Surat Undangan/Acara</span>
                      <p className="text-sm text-gray-500">Aktifkan untuk mengisi detail acara.</p>
                    </label>
                    {isInvitation && (
                      <div className="card p-6 border-primary-200 border animate-fade-in">
                        <h3 className="font-semibold text-gray-800 mb-4">Detail Acara</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div><label className="form-label form-label-required">Tanggal Acara</label><input type="date" {...register("eventDate", { required: isInvitation ? "Tanggal wajib diisi" : false })} className={`input ${inputFocusStyle} ${errors.eventDate ? "input-error" : ""}`} />{errors.eventDate && <p className="form-error">{errors.eventDate.message}</p>}</div>
                          <div><label className="form-label">Waktu Acara</label><input type="time" {...register("eventTime")} className={`input ${inputFocusStyle}`} /></div>
                          <div className="md:col-span-2"><label className="form-label">Lokasi Acara</label><input type="text" {...register("eventLocation")} className={`input ${inputFocusStyle}`} /></div>
                          <div className="md:col-span-2"><label className="form-label">Catatan Acara</label><textarea {...register("eventNotes")} rows={2} className={`input ${inputFocusStyle}`} /></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="form-label">File Lampiran (Opsional)</label>
                    {!selectedFile ? (
                      <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                        <input id="file" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="flex flex-col items-center"><Upload className="h-10 w-10 text-gray-400 mb-2" /><span className="text-sm font-medium text-primary-700">Klik atau jatuhkan file</span><span className="text-xs text-gray-500 mt-1">Maks. 10MB</span></div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg border">
                        <div className="flex items-center space-x-3 overflow-hidden"><FileText className="h-8 w-8 text-gray-500 flex-shrink-0" /><div className="truncate"><p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p><p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p></div></div>
                        <button type="button" onClick={removeFile} className="text-red-600 hover:text-red-800 p-1"><X className="h-5 w-5" /></button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
              <div>{currentStep > 1 && (<button type="button" onClick={handlePrevStep} className="btn btn-secondary"><ArrowLeft className="h-4 w-4 mr-2" />Sebelumnya</button>)}</div>
              <div>
                {currentStep < 3 && (<button type="button" onClick={handleNextStep} className="btn btn-primary">Berikutnya<ChevronRight className="h-4 w-4 ml-2" /></button>)}
                {currentStep === 3 && (<button type="submit" disabled={createLetterMutation.isLoading} className="btn bg-[#12A168] hover:bg-[#0e7d52] text-white disabled:opacity-70">{createLetterMutation.isLoading ? (<><div className="loading-spinner h-4 w-4 mr-2"></div>Menyimpan...</>) : (<><Send className="h-4 w-4 mr-2" />Simpan Surat</>)}</button>)}
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}