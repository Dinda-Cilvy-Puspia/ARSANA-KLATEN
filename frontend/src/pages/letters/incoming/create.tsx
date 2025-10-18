"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useForm, type FieldPath } from "react-hook-form"
import {
  ArrowLeft,
  Upload,
  Calendar,
  X,
  FileText,
  CheckCircle,
  BookOpen,
  Send,
  ClipboardList,
  ChevronRight,
  Save,
  Clock,
  MapPin,
  User,
  Mail,
  Hash,
  Tag,
  Image,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useCreateIncomingLetter } from "@/hooks/useApi"
import Layout from "@/components/Layout/Layout"
import Link from "next/link"
import { toast } from "react-hot-toast"

// Tipe data final untuk form
interface NewCreateIncomingLetterRequest {
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
  isInvitation: boolean // Ubah dari boolean | undefined menjadi boolean
  eventDate?: string
  eventTime?: string
  eventLocation?: string
  eventNotes?: string
  needsFollowUp: boolean // Ubah dari boolean | undefined menjadi boolean
  followUpDeadline?: string
}

// Komponen Sidebar Navigasi Cerdas - DIPERBAIKI
const SmartSidebarNavigation = ({ 
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
      optional: true,
    },
  ]

  return (
    <nav className="space-y-2 p-4">
      {sections.map((section) => {
        const isActive = currentSection === section.id
        const isComplete = completion[section.id]
        const isOptional = section.optional
        
        return (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={`w-full text-left p-4 rounded-xl transition-all duration-200 border-2 ${
              isActive
                ? "border-primary-500 bg-primary-50 shadow-md"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                isActive 
                  ? "bg-primary-500 text-white" 
                  : isComplete 
                  ? "bg-emerald-500 text-white"
                  : isOptional
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-200 text-gray-500"
              }`}>
                {isComplete && !isActive ? (
                  <CheckCircle className="h-5 w-5" />
                ) : isOptional && !isComplete && !isActive ? (
                  <span className="text-xs font-bold">Ops</span>
                ) : (
                  section.icon
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className={`font-semibold text-sm ${
                    isActive ? "text-primary-900" : "text-gray-900"
                  }`}>
                    {section.title}
                  </h3>
                  {section.required && (
                    <span className="text-xs text-red-500">*</span>
                  )}
                  {isOptional && (
                    <span className="text-xs text-blue-500">Opsional</span>
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
                {isOptional && !isComplete && !isActive && (
                  <div className="mt-2 flex items-center space-x-1">
                    <span className="text-xs text-blue-600 font-medium">Dapat diisi nanti</span>
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

// Komponen Section Form dengan Collapsible - DIPERBAIKI
const FormSection = ({
  id,
  title,
  description,
  isActive,
  children,
  completed = false,
  isOptional = false
}: {
  id: string
  title: string
  description: string
  isActive: boolean
  children: React.ReactNode
  completed?: boolean
  isOptional?: boolean
}) => {
  if (!isActive) return null

  return (
    <section 
      id={id}
      className={`animate-fade-in space-y-6 rounded-2xl p-6 shadow-sm border-2 ${
        isOptional 
          ? completed 
            ? "bg-blue-50 border-blue-200" 
            : "bg-white border-gray-200"
          : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              {title}
              {completed && <CheckCircle className="h-5 w-5 text-emerald-500" />}
            </h2>
            {isOptional && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                Opsional
              </span>
            )}
          </div>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

// Komponen Card Opsional - BARU
const OptionalSectionCard = ({
  title,
  description,
  icon,
  isEnabled,
  onToggle,
  children
}: {
  title: string
  description: string
  icon: React.ReactNode
  isEnabled: boolean
  onToggle: (enabled: boolean) => void
  children: React.ReactNode
}) => {
  return (
    <div className={`rounded-xl border-2 p-6 transition-all duration-200 ${
      isEnabled 
        ? "border-purple-500 bg-purple-50 ring-2 ring-purple-500" 
        : "border-gray-200 bg-gray-50 hover:border-gray-300"
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
            isEnabled ? "bg-purple-100 text-purple-600" : "bg-gray-200 text-gray-500"
          }`}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggle(!isEnabled)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
            isEnabled ? 'bg-purple-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
      
      {isEnabled && (
        <div className="mt-6 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  )
}

export default function CreateIncomingLetterPage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [currentSection, setCurrentSection] = useState("info")
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const createLetterMutation = useCreateIncomingLetter()

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isValid, isDirty },
    getValues,
    setValue,
  } = useForm<NewCreateIncomingLetterRequest>({ 
    mode: "onChange",
    defaultValues: {
      letterNature: "BIASA",
      dispositionMethod: "MANUAL",
      isInvitation: false,
      needsFollowUp: false,
    }
  })

  const dispositionMethod = watch("dispositionMethod")
  const isInvitation = watch("isInvitation")
  const needsFollowUp = watch("needsFollowUp")
  const eventDate = watch("eventDate")
  const eventTime = watch("eventTime")
  const eventLocation = watch("eventLocation")
  const followUpDeadline = watch("followUpDeadline")

  // Auto-save functionality
  useEffect(() => {
    if (!isDirty) return

    const autoSave = setTimeout(() => {
      const formData = getValues()
      localStorage.setItem('draft-incoming-letter', JSON.stringify({
        data: formData,
        lastSaved: new Date().toISOString()
      }))
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
      toast.success('Draft disimpan otomatis', { duration: 2000 })
    }, 30000)

    return () => clearTimeout(autoSave)
  }, [isDirty, getValues])

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('draft-incoming-letter')
    if (draft) {
      // Note: In real implementation, you would properly load the draft data
      setHasUnsavedChanges(true)
    }
  }, [])

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth/login")
    }
  }, [isAuthenticated, loading, router])

  const onSubmit = async (data: NewCreateIncomingLetterRequest) => {
    try {
      const formData = new FormData()

      // Data dari semua sections
      formData.append("receivedDate", new Date(data.receivedDate).toISOString())
      formData.append("letterNumber", data.letterNumber)
      if (data.letterDate) formData.append("letterDate", new Date(data.letterDate).toISOString())
      if (data.letterNature) formData.append("letterNature", data.letterNature)
      formData.append("subject", data.subject)
      formData.append("sender", data.sender)
      formData.append("recipient", data.recipient)
      formData.append("processor", data.processor)
      formData.append("dispositionMethod", data.dispositionMethod)
      formData.append("dispositionTarget", data.dispositionTarget)
      if (selectedFile) formData.append("file", selectedFile)

      // Data kondisional
      formData.append("isInvitation", String(data.isInvitation || false))
      formData.append("needsFollowUp", String(data.needsFollowUp || false))

      if (data.isInvitation && data.eventDate) {
        formData.append("eventDate", new Date(data.eventDate).toISOString())
        if (data.eventTime) formData.append("eventTime", data.eventTime)
        if (data.eventLocation) formData.append("eventLocation", data.eventLocation)
        if (data.eventNotes) formData.append("eventNotes", data.eventNotes)
      }
      if (data.needsFollowUp && data.followUpDeadline) {
        formData.append("followUpDeadline", new Date(data.followUpDeadline).toISOString())
      }

      await createLetterMutation.mutateAsync(formData)
      
      // Clear draft on successful submit
      localStorage.removeItem('draft-incoming-letter')
      
      toast.success("Surat masuk berhasil ditambahkan!")
      router.push("/letters/incoming")
    } catch (error) {
      console.error("Failed to create letter:", error)
      toast.error("Gagal membuat surat masuk. Silakan coba lagi.")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Ukuran file terlalu besar. Maksimal 10MB.")
        return
      }
      setSelectedFile(file)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    const fileInput = document.getElementById("file") as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  // Calculate section completion - DIPERBAIKI
  const sectionCompletion = {
    info: !!watch("receivedDate") && !!watch("letterNumber") && !!watch("subject"),
    details: !!watch("sender") && !!watch("recipient"),
    process: !!watch("processor") && !!watch("dispositionMethod") && !!watch("dispositionTarget"),
    events: (isInvitation ? !!eventDate && !!eventTime && !!eventLocation : true) && 
            (needsFollowUp ? !!followUpDeadline : true),
  }

  const scrollToSection = (sectionId: string) => {
    setCurrentSection(sectionId)
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  // Handler untuk toggle section opsional
  const handleInvitationToggle = (enabled: boolean) => {
    setValue("isInvitation", enabled)
    if (!enabled) {
      // Reset values when disabling
      setValue("eventDate", undefined)
      setValue("eventTime", undefined)
      setValue("eventLocation", undefined)
      setValue("eventNotes", undefined)
    }
  }

  const handleFollowUpToggle = (enabled: boolean) => {
    setValue("needsFollowUp", enabled)
    if (!enabled) {
      setValue("followUpDeadline", undefined)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  if (!isAuthenticated) return null

  const inputFocusStyle = "focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-colors duration-200"

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header dengan Auto-save Status */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Link 
                  href="/letters/incoming" 
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Buat Surat Masuk Baru</h1>
                  <p className="text-sm text-gray-600">
                    {hasUnsavedChanges ? "Ada perubahan yang belum disimpan" : "Semua perubahan telah disimpan"}
                    {lastSaved && ` · Terakhir disimpan: ${lastSaved.toLocaleTimeString()}`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('draft-incoming-letter', JSON.stringify({
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
                  disabled={createLetterMutation.isLoading || !isValid}
                  className="btn bg-[#12A168] hover:bg-[#0e7d52] text-white disabled:opacity-50"
                >
                  {createLetterMutation.isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Simpan Surat
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
                <SmartSidebarNavigation
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
                <FormSection
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
                        max={new Date().toISOString().slice(0, 16)} 
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
                </FormSection>

                {/* Section 2: Detail Surat */}
                <FormSection
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
                </FormSection>

                {/* Section 3: Proses & Disposisi */}
                <FormSection
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
                          Keterangan
                        </label>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <label className={`relative cursor-pointer rounded-lg border-2 p-4 text-center transition-all duration-200 ${
                            dispositionMethod === "MANUAL" 
                              ? "border-primary-500 bg-primary-50 ring-2 ring-primary-500" 
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
                              ? "border-primary-500 bg-primary-50 ring-2 ring-primary-500" 
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
                        <label className="form-label">File Lampiran (Opsional)</label>
                        {!selectedFile ? (
                          <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors group">
                            <input 
                              id="file" 
                              type="file" 
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
                              onChange={handleFileChange} 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                            />
                            <div className="flex flex-col items-center">
                              <Upload className="h-12 w-12 text-gray-400 mb-3 group-hover:text-primary-500 transition-colors" />
                              <span className="text-sm font-medium text-primary-700">
                                Klik atau seret file ke sini
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
                </FormSection>

                {/* Section 4: Agenda & Tindakan - DIPERBAIKI */}
                <FormSection
                  id="events"
                  title="Agenda & Tindakan"
                  description="Jadwal acara dan tindak lanjut surat"
                  isActive={currentSection === "events"}
                  completed={sectionCompletion.events}
                  isOptional={true}
                >
                  <div className="space-y-6">
                    {/* Undangan/Acara Card */}
                    <OptionalSectionCard
                      title="Ini adalah Undangan/Acara"
                      description="Aktifkan untuk mengisi detail acara seperti tanggal, waktu, dan lokasi"
                      icon={<Calendar className="h-6 w-6" />}
                      isEnabled={Boolean(isInvitation)}
                      onToggle={handleInvitationToggle}
                    >
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
                    </OptionalSectionCard>

                    {/* Tindak Lanjut Card */}
                    <OptionalSectionCard
                      title="Perlu Tindak Lanjut"
                      description="Aktifkan jika surat memerlukan respons atau follow-up dengan deadline tertentu"
                      icon={<ClipboardList className="h-6 w-6" />}
                      isEnabled={Boolean(needsFollowUp)}
                      onToggle={handleFollowUpToggle}
                    >
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
                    </OptionalSectionCard>
                  </div>
                </FormSection>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}