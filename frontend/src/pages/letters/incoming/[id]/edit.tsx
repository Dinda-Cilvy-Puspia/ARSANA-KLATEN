// frontend/src/pages/letters/incoming/[id]/edit.tsx

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useForm } from "react-hook-form"
import {
  ArrowLeft,
  Upload,
  Calendar,
  X,
  FileText,
  CheckCircle,
  BookOpen,
  ClipboardList,
  Save,
  Clock,
  MapPin,
  User,
  Mail,
  Hash,
  Tag,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useIncomingLetter, useUpdateIncomingLetter } from "@/hooks/useApi"
import Layout from "@/components/Layout/Layout"
import Link from "next/link"
import { toast } from "react-hot-toast"

// Tipe data final untuk form
interface FormData {
  receivedDate: string
  letterNumber: string
  letterDate?: string
  letterNature?: string
  subject: string
  sender: string
  recipient: string
  processor: string
  dispositionMethod: "MANUAL" | "SRIKANDI"
  dispositionTarget: string
  file?: File
  isInvitation?: boolean
  eventDate?: string
  eventTime?: string
  eventLocation?: string
  eventNotes?: string
  needsFollowUp?: boolean
  followUpDeadline?: string
}

// Komponen Sidebar Navigasi Cerdas untuk Edit
const EditSidebarNavigation = ({ 
  currentSection, 
  onSectionChange,
  completion 
}: { 
  currentSection: string
  onSectionChange: (section: string) => void
  completion: { [key: string]: boolean }
}) => {
  const sections = [
    {
      id: "info",
      title: "Informasi Surat",
      description: "Data utama surat",
      icon: <FileText className="h-5 w-5" />,
      required: true,
    },
    {
      id: "details",
      title: "Detail Surat", 
      description: "Pengirim, penerima & subjek",
      icon: <Mail className="h-5 w-5" />,
      required: true,
    },
    {
      id: "process",
      title: "Proses & Disposisi",
      description: "Pengolah dan tujuan disposisi",
      icon: <BookOpen className="h-5 w-5" />,
      required: true,
    },
    {
      id: "events",
      title: "Agenda & Tindakan",
      description: "Jadwal acara atau tindak lanjut",
      icon: <Calendar className="h-5 w-5" />,
      required: false,
    },
    {
      id: "attachments",
      title: "Lampiran File",
      description: "Dokumen pendukung",
      icon: <Upload className="h-5 w-5" />,
      required: false,
    },
  ]

  return (
    <nav className="space-y-2 p-4">
      {sections.map((section) => {
        const isActive = currentSection === section.id
        const isComplete = completion[section.id]
        
        return (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={`w-full text-left p-4 rounded-xl transition-all duration-200 border-2 ${
              isActive
                ? "border-amber-500 bg-amber-50 shadow-md"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                isActive 
                  ? "bg-amber-500 text-white" 
                  : isComplete 
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}>
                {isComplete && !isActive ? <CheckCircle className="h-5 w-5" /> : section.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className={`font-semibold text-sm ${
                    isActive ? "text-amber-900" : "text-gray-900"
                  }`}>
                    {section.title}
                  </h3>
                  {section.required && (
                    <span className="text-xs text-red-500">*</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 text-left">
                  {section.description}
                </p>
                {isComplete && !isActive && (
                  <div className="mt-2 flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-medium">Selesai</span>
                  </div>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </nav>
  )
}

// Komponen Section Form untuk Edit
const EditFormSection = ({
  id,
  title,
  description,
  isActive,
  children,
  completed = false
}: {
  id: string
  title: string
  description: string
  isActive: boolean
  children: React.ReactNode
  completed?: boolean
}) => {
  if (!isActive) return null

  return (
    <section 
      id={id}
      className="animate-fade-in space-y-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            {title}
            {completed && <CheckCircle className="h-5 w-5 text-emerald-500" />}
          </h2>
          <p className="text-gray-600 mt-1">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

// Helper untuk format tanggal
const formatDateForInput = (dateString: string | undefined | null, type: "date" | "datetime-local") => {
  if (!dateString) return ""
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ""
    const pad = (num: number) => num.toString().padStart(2, '0');
    if (type === "datetime-local") {
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  } catch (error) {
    console.error("Failed to format date:", error);
    return ""
  }
}

export default function EditIncomingLetterPage() {
  const router = useRouter()
  const { id } = router.query
  const { isAuthenticated, loading: authLoading } = useAuth()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [existingFileName, setExistingFileName] = useState<string | null>(null)
  const [currentSection, setCurrentSection] = useState("info")
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const { data: letterData, isLoading: fetchingLetter } = useIncomingLetter(id as string)
  const updateLetterMutation = useUpdateIncomingLetter()

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    reset,
    formState: { errors, isValid, isDirty },
    getValues,
  } = useForm<FormData>({ 
    mode: "onChange",
    defaultValues: {
      letterNature: "BIASA",
      dispositionMethod: "MANUAL",
    }
  })

  const dispositionMethod = watch("dispositionMethod")
  const isInvitation = watch("isInvitation")
  const needsFollowUp = watch("needsFollowUp")

  // Auto-save functionality
  useEffect(() => {
    if (!isDirty) return

    const autoSave = setTimeout(() => {
      const formData = getValues()
      localStorage.setItem(`draft-edit-${id}`, JSON.stringify({
        data: formData,
        lastSaved: new Date().toISOString()
      }))
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
      toast.success('Perubahan disimpan otomatis', { duration: 2000 })
    }, 30000)

    return () => clearTimeout(autoSave)
  }, [isDirty, getValues, id])

  // Load letter data and draft
  useEffect(() => {
    if (letterData) {
      const letter = letterData;
      reset({
        receivedDate: formatDateForInput(letter.receivedDate, "datetime-local"),
        letterNumber: letter.letterNumber || "",
        letterDate: formatDateForInput(letter.letterDate, "date"),
        letterNature: letter.letterNature || "BIASA",
        subject: letter.subject || "",
        sender: letter.sender || "",
        recipient: letter.recipient || "",
        processor: letter.processor || "",
        dispositionMethod: letter.dispositionMethod || "MANUAL",
        dispositionTarget: letter.dispositionTarget || "",
        isInvitation: letter.isInvitation || false,
        eventDate: formatDateForInput(letter.eventDate, "date"),
        eventTime: letter.eventTime || "",
        eventLocation: letter.eventLocation || "",
        eventNotes: letter.eventNotes || "",
        needsFollowUp: letter.needsFollowUp || false,
        followUpDeadline: formatDateForInput(letter.followUpDeadline, "date"),
      })
      setExistingFileName(letter.fileName ?? null)
    }
  }, [letterData, reset])

  const onSubmit = (data: FormData) => {
    const formData = new FormData()
    
    // Iterasi melalui data form dan tambahkan ke FormData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (['receivedDate', 'letterDate', 'eventDate', 'followUpDeadline'].includes(key)) {
          formData.append(key, new Date(value as string).toISOString());
        } else if (typeof value === 'boolean') {
          formData.append(key, String(value));
        } else if (key !== 'file') {
          formData.append(key, value as string);
        }
      }
    });

    if (selectedFile) {
      formData.append("file", selectedFile)
    }

    toast.promise(
      updateLetterMutation.mutateAsync({ id: id as string, formData }),
      {
        loading: 'Menyimpan perubahan...',
        success: () => {
          // Clear draft on successful submit
          localStorage.removeItem(`draft-edit-${id}`)
          router.push(`/letters/incoming/${id}`);
          return 'Surat berhasil diperbarui!';
        },
        error: (err: any) => {
          console.error("Gagal memperbarui surat:", err);
          return err?.message || 'Gagal memperbarui surat. Silakan coba lagi.';
        },
      }
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Ukuran file terlalu besar. Maksimal 10MB.");
        return;
      }
      setSelectedFile(file)
      setExistingFileName(null)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    const fileInput = document.getElementById("file") as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  // Calculate section completion
  const sectionCompletion = {
    info: !!watch("receivedDate") && !!watch("letterNumber") && !!watch("subject"),
    details: !!watch("sender") && !!watch("recipient"),
    process: !!watch("processor") && !!watch("dispositionMethod") && !!watch("dispositionTarget"),
    events: true,
    attachments: true,
  }

  const scrollToSection = (sectionId: string) => {
    setCurrentSection(sectionId)
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  if (authLoading || fetchingLetter) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          <p className="ml-4">Memuat data surat...</p>
        </div>
      </Layout>
    )
  }
  if (!isAuthenticated) return null

  const inputFocusStyle = "focus:ring-2 focus:ring-amber-200 focus:border-amber-500 transition-colors duration-200"

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header dengan Auto-save Status */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Link 
                  href={`/letters/incoming/${id}`} 
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Edit Surat Masuk</h1>
                  <p className="text-sm text-gray-600">
                    {letterData?.subject}
                    {hasUnsavedChanges && " · Ada perubahan yang belum disimpan"}
                    {lastSaved && ` · Terakhir disimpan: ${lastSaved.toLocaleTimeString()}`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem(`draft-edit-${id}`, JSON.stringify({
                      data: getValues(),
                      lastSaved: new Date().toISOString()
                    }))
                    setLastSaved(new Date())
                    setHasUnsavedChanges(false)
                    toast.success('Draft disimpan')
                  }}
                  className="btn btn-secondary"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Draft
                </button>
                
                <button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={updateLetterMutation.isLoading || !isValid}
                  className="btn bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
                >
                  {updateLetterMutation.isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-6">
                <EditSidebarNavigation
                  currentSection={currentSection}
                  onSectionChange={scrollToSection}
                  completion={sectionCompletion}
                />
              </div>
            </div>

            {/* Main Form Content */}
            <div className="lg:col-span-3 space-y-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Section 1: Informasi Surat */}
                <EditFormSection
                  id="info"
                  title="Informasi Surat"
                  description="Data utama dan identitas surat"
                  isActive={currentSection === "info"}
                  completed={sectionCompletion.info}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="form-label form-label-required flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Tanggal Penerimaan Surat
                      </label>
                      <input 
                        {...register("receivedDate", { required: "Tanggal penerimaan wajib diisi" })} 
                        type="datetime-local" 
                        className={`input ${inputFocusStyle} ${errors.receivedDate ? "input-error" : ""}`} 
                      />
                      {errors.receivedDate && <p className="form-error">{errors.receivedDate.message}</p>}
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label form-label-required flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Nomor Surat
                      </label>
                      <input 
                        {...register("letterNumber", { required: "Nomor surat wajib diisi" })} 
                        type="text" 
                        className={`input ${inputFocusStyle} ${errors.letterNumber ? "input-error" : ""}`} 
                        placeholder="Contoh: 001/SK/2024" 
                      />
                      {errors.letterNumber && <p className="form-error">{errors.letterNumber.message}</p>}
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Tanggal Surat
                      </label>
                      <input 
                        {...register("letterDate")} 
                        type="date" 
                        className={`input ${inputFocusStyle}`} 
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Sifat Surat
                      </label>
                      <select 
                        {...register("letterNature")} 
                        className={`input ${inputFocusStyle}`}
                      >
                        <option value="BIASA">Biasa</option>
                        <option value="PENTING">Penting</option>
                        <option value="TERBATAS">Terbatas</option>
                        <option value="RAHASIA">Rahasia</option>
                        <option value="SANGAT_RAHASIA">Sangat Rahasia</option>
                      </select>
                    </div>
                    
                    <div className="form-group md:col-span-2">
                      <label className="form-label form-label-required flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Isi Ringkas/Subjek
                      </label>
                      <input 
                        {...register("subject", { required: "Isi ringkas/subjek wajib diisi" })} 
                        type="text" 
                        className={`input ${inputFocusStyle} ${errors.subject ? "input-error" : ""}`} 
                        placeholder="Masukkan subjek atau isi ringkas surat" 
                      />
                      {errors.subject && <p className="form-error">{errors.subject.message}</p>}
                    </div>
                  </div>
                </EditFormSection>

                {/* Section 2: Detail Surat */}
                <EditFormSection
                  id="details"
                  title="Detail Surat"
                  description="Informasi pengirim, penerima, dan pihak terkait"
                  isActive={currentSection === "details"}
                  completed={sectionCompletion.details}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="form-label form-label-required flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Dari (Pengirim)
                      </label>
                      <input 
                        {...register("sender", { required: "Pengirim wajib diisi" })} 
                        type="text" 
                        className={`input ${inputFocusStyle} ${errors.sender ? "input-error" : ""}`} 
                        placeholder="Nama pengirim atau instansi" 
                      />
                      {errors.sender && <p className="form-error">{errors.sender.message}</p>}
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label form-label-required flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Kepada (Penerima)
                      </label>
                      <input 
                        {...register("recipient", { required: "Penerima wajib diisi" })} 
                        type="text" 
                        className={`input ${inputFocusStyle} ${errors.recipient ? "input-error" : ""}`} 
                        placeholder="Nama penerima atau instansi" 
                      />
                      {errors.recipient && <p className="form-error">{errors.recipient.message}</p>}
                    </div>
                  </div>
                </EditFormSection>

                {/* Section 3: Proses & Disposisi */}
                <EditFormSection
                  id="process"
                  title="Proses & Disposisi"
                  description="Pengolahan dan penyaluran surat"
                  isActive={currentSection === "process"}
                  completed={sectionCompletion.process}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="form-group">
                        <label className="form-label form-label-required flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Pengolah
                        </label>
                        <input 
                          {...register("processor", { required: "Pengolah wajib diisi" })} 
                          type="text" 
                          className={`input ${inputFocusStyle} ${errors.processor ? "input-error" : ""}`} 
                          placeholder="Nama pengolah surat" 
                        />
                        {errors.processor && <p className="form-error">{errors.processor.message}</p>}
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label form-label-required">
                          Metode Disposisi
                        </label>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <label className={`relative cursor-pointer rounded-lg border-2 p-4 text-center transition-all duration-200 ${
                            dispositionMethod === "MANUAL" 
                              ? "border-amber-500 bg-amber-50 ring-2 ring-amber-500" 
                              : "border-gray-200 hover:border-gray-300"
                          }`}>
                            <input 
                              {...register("dispositionMethod", { required: "Metode disposisi wajib dipilih" })} 
                              type="radio" 
                              value="MANUAL" 
                              className="sr-only" 
                            />
                            <div className="font-semibold text-gray-900">Manual</div>
                            <p className="text-sm text-gray-500 mt-1">Proses manual</p>
                          </label>
                          
                          <label className={`relative cursor-pointer rounded-lg border-2 p-4 text-center transition-all duration-200 ${
                            dispositionMethod === "SRIKANDI" 
                              ? "border-amber-500 bg-amber-50 ring-2 ring-amber-500" 
                              : "border-gray-200 hover:border-gray-300"
                          }`}>
                            <input 
                              {...register("dispositionMethod", { required: "Metode disposisi wajib dipilih" })} 
                              type="radio" 
                              value="SRIKANDI" 
                              className="sr-only" 
                            />
                            <div className="font-semibold text-gray-900">Srikandi</div>
                            <p className="text-sm text-gray-500 mt-1">Sistem digital</p>
                          </label>
                        </div>
                        {errors.dispositionMethod && <p className="form-error">{errors.dispositionMethod.message}</p>}
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label form-label-required">
                          Tujuan Disposisi
                        </label>
                        <select 
                          {...register("dispositionTarget", { required: "Tujuan disposisi wajib dipilih" })} 
                          className={`input ${inputFocusStyle} ${errors.dispositionTarget ? "input-error" : ""}`}
                        >
                          <option value="" disabled>Pilih tujuan disposisi...</option>
                          <option value="UMPEG">UMPEG</option>
                          <option value="PERENCANAAN">PERENCANAAN</option>
                          <option value="KAUR_KEUANGAN">KAUR KEUANGAN</option>
                          <option value="KABID">KABID</option>
                          <option value="BIDANG1">BIDANG 1</option>
                          <option value="BIDANG2">BIDANG 2</option>
                          <option value="BIDANG3">BIDANG 3</option>
                          <option value="BIDANG4">BIDANG 4</option>
                          <option value="BIDANG5">BIDANG 5</option>
                        </select>
                        {errors.dispositionTarget && <p className="form-error">{errors.dispositionTarget.message}</p>}
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="form-group">
                        <label className="form-label">File Lampiran</label>
                        {existingFileName && !selectedFile && (
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
                            <div className="flex items-center space-x-3 overflow-hidden">
                              <FileText className="h-8 w-8 text-gray-500 flex-shrink-0" />
                              <div className="truncate">
                                <p className="text-sm font-medium text-gray-900 truncate">{existingFileName}</p>
                                <p className="text-sm text-gray-500">File saat ini</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {!selectedFile ? (
                          <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-amber-500 transition-colors group">
                            <input 
                              id="file" 
                              type="file" 
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
                              onChange={handleFileChange} 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                            />
                            <div className="flex flex-col items-center">
                              <Upload className="h-12 w-12 text-gray-400 mb-3 group-hover:text-amber-500 transition-colors" />
                              <span className="text-sm font-medium text-amber-700">
                                {existingFileName ? 'Ganti file' : 'Klik atau seret file ke sini'}
                              </span>
                              <span className="text-xs text-gray-500 mt-1">PDF, DOC, JPG, PNG (Maks. 10MB)</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-3 overflow-hidden">
                              <FileText className="h-8 w-8 text-gray-500 flex-shrink-0" />
                              <div className="truncate">
                                <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                                <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                            </div>
                            <button 
                              type="button" 
                              onClick={removeFile} 
                              className="text-red-600 hover:text-red-800 p-1 transition-colors"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </EditFormSection>

                {/* Section 4: Agenda & Tindakan */}
                <EditFormSection
                  id="events"
                  title="Agenda & Tindakan"
                  description="Jadwal acara dan tindak lanjut surat"
                  isActive={currentSection === "events"}
                >
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className={`flex flex-col space-y-3 cursor-pointer rounded-xl border-2 p-6 text-center transition-all duration-200 hover:shadow-md ${
                        isInvitation 
                          ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}>
                        <input 
                          {...register("isInvitation")} 
                          type="checkbox" 
                          className="sr-only" 
                        />
                        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200 ${
                          isInvitation ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <Calendar className="h-6 w-6" />
                        </div>
                        <span className="font-semibold text-gray-900">Ini adalah Undangan/Acara</span>
                        <p className="text-sm text-gray-500">Aktifkan untuk mengisi detail acara</p>
                      </label>
                      
                      <label className={`flex flex-col space-y-3 cursor-pointer rounded-xl border-2 p-6 text-center transition-all duration-200 hover:shadow-md ${
                        needsFollowUp 
                          ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}>
                        <input 
                          {...register("needsFollowUp")} 
                          type="checkbox" 
                          className="sr-only" 
                        />
                        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200 ${
                          needsFollowUp ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <ClipboardList className="h-6 w-6" />
                        </div>
                        <span className="font-semibold text-gray-900">Perlu Tindak Lanjut</span>
                        <p className="text-sm text-gray-500">Aktifkan jika surat butuh respons</p>
                      </label>
                    </div>

                    {/* Conditional: Event Details */}
                    {isInvitation && (
                      <div className="bg-purple-50 rounded-xl border border-purple-200 p-6 animate-fade-in">
                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-purple-600" />
                          Detail Acara
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="form-group">
                            <label className="form-label form-label-required">Tanggal Acara</label>
                            <input 
                              {...register("eventDate", { required: isInvitation ? "Tanggal acara wajib diisi" : false })} 
                              type="date" 
                              className={`input ${inputFocusStyle} ${errors.eventDate ? "input-error" : ""}`} 
                            />
                            {errors.eventDate && <p className="form-error">{errors.eventDate.message}</p>}
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label form-label-required">Waktu Acara</label>
                            <input 
                              {...register("eventTime", { required: isInvitation ? "Waktu acara wajib diisi" : false })} 
                              type="time" 
                              className={`input ${inputFocusStyle} ${errors.eventTime ? "input-error" : ""}`} 
                            />
                            {errors.eventTime && <p className="form-error">{errors.eventTime.message}</p>}
                          </div>
                          
                          <div className="form-group md:col-span-2">
                            <label className="form-label form-label-required flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              Lokasi Acara
                            </label>
                            <input 
                              {...register("eventLocation", { required: isInvitation ? "Lokasi acara wajib diisi" : false })} 
                              type="text" 
                              placeholder="Contoh: Ruang Rapat Utama, Gedung A Lantai 3" 
                              className={`input ${inputFocusStyle} ${errors.eventLocation ? "input-error" : ""}`} 
                            />
                            {errors.eventLocation && <p className="form-error">{errors.eventLocation.message}</p>}
                          </div>
                          
                          <div className="form-group md:col-span-2">
                            <label className="form-label flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Catatan Acara (Opsional)
                            </label>
                            <textarea 
                              {...register("eventNotes")} 
                              rows={3} 
                              className={`input ${inputFocusStyle}`} 
                              placeholder="Catatan tambahan untuk acara, seperti agenda, dress code, atau informasi penting lainnya..." 
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Conditional: Follow-up Details */}
                    {needsFollowUp && (
                      <div className="bg-orange-50 rounded-xl border border-orange-200 p-6 animate-fade-in">
                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <ClipboardList className="h-5 w-5 text-orange-600" />
                          Detail Tindak Lanjut
                        </h3>
                        <div className="form-group max-w-md">
                          <label className="form-label form-label-required">
                            Batas Waktu Tindak Lanjut
                          </label>
                          <input 
                            {...register("followUpDeadline", { required: needsFollowUp ? "Tanggal tindak lanjut wajib diisi" : false })} 
                            type="date" 
                            className={`input ${inputFocusStyle} ${errors.followUpDeadline ? "input-error" : ""}`} 
                          />
                          {errors.followUpDeadline && <p className="form-error">{errors.followUpDeadline.message}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </EditFormSection>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}