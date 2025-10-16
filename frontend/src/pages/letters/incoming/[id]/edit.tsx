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
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useIncomingLetter, useUpdateIncomingLetter } from "@/hooks/useApi"
import Layout from "@/components/Layout/Layout"
import Link from "next/link"
import { toast } from "react-hot-toast"

// Tipe data final untuk form (disamakan dengan create.tsx)
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
  isInvitation?: boolean
  eventDate?: string
  eventTime?: string
  eventLocation?: string
  eventNotes?: string
  needsFollowUp?: boolean
  followUpDeadline?: string
}

// Komponen Sidebar Navigasi Vertikal (diambil dari create.tsx)
const VerticalStepper = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    {
      number: 1,
      title: "Informasi Surat",
      description: "Detail dasar mengenai surat.",
      icon: <ClipboardList className="h-6 w-6" />,
    },
    {
      number: 2,
      title: "Proses & Disposisi",
      description: "Pengolah dan tujuan disposisi.",
      icon: <BookOpen className="h-6 w-6" />,
    },
    {
      number: 3,
      title: "Tindakan & Acara",
      description: "Jadwal acara atau tindak lanjut.",
      icon: <Calendar className="h-6 w-6" />,
    },
  ]

  return (
    <nav className="flex flex-col space-y-4 p-4">
      {steps.map((step) => {
        const status = currentStep === step.number ? "active" : currentStep > step.number ? "complete" : "upcoming"
        return (
          <div key={step.number} className="flex items-start">
            <div className="flex flex-col items-center mr-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 ${
                  status === "active"
                    ? "bg-amber-500 text-white shadow-lg" // Warna diubah
                    : status === "complete"
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {status === "complete" ? <CheckCircle className="h-7 w-7" /> : step.icon}
              </div>
              {step.number !== steps.length && (
                <div className={`mt-2 h-16 w-0.5 ${status === "complete" ? "bg-emerald-500" : "bg-gray-200"}`} />
              )}
            </div>
            <div className="pt-2.5">
              <h3 className={`font-semibold ${status === "active" ? "text-amber-800" : "text-gray-900"}`}>{step.title}</h3>
              <p className="text-sm text-gray-500">{step.description}</p>
            </div>
          </div>
        )
      })}
    </nav>
  )
}

// Helper untuk format tanggal
const formatDateForInput = (dateString: string | undefined | null, type: "date" | "datetime-local") => {
  if (!dateString) return ""
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ""
    if (type === "datetime-local") {
      // Format: YYYY-MM-DDTHH:mm
      return date.toISOString().slice(0, 16)
    }
    // Format: YYYY-MM-DD
    return date.toISOString().split("T")[0]
  } catch (error) {
    return ""
  }
}

export default function EditIncomingLetterPage() {
  const router = useRouter()
  const { id } = router.query as { id: string }
  const { isAuthenticated, loading: authLoading } = useAuth()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [existingFileName, setExistingFileName] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)

  // Fetch data surat yang ada
  const { data: letterData, isLoading: fetchingLetter } = useIncomingLetter(id)
  const updateLetterMutation = useUpdateIncomingLetter()

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    reset,
    formState: { errors },
  } = useForm<NewCreateIncomingLetterRequest>({ mode: "onChange" })

  const dispositionMethod = watch("dispositionMethod")
  const isInvitation = watch("isInvitation")
  const needsFollowUp = watch("needsFollowUp")

  // Otentikasi
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/auth/login")
    }
  }, [isAuthenticated, authLoading, router])

  // Isi form dengan data yang ada
  useEffect(() => {
    if (letterData) {
      const letter = letterData.data || letterData
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
      setExistingFileName(letter.fileName)
    }
  }, [letterData, reset])

  const onSubmit = async (data: NewCreateIncomingLetterRequest) => {
    try {
      const formData = new FormData()

      // Tambahkan semua data ke FormData
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

      if (selectedFile) {
        formData.append("file", selectedFile)
      }

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

      // PERBAIKAN: Mengganti properti 'data' menjadi 'formData'
      await updateLetterMutation.mutateAsync({ id, formData: formData })
      toast.success("Surat masuk berhasil diperbarui!")
      router.push(`/letters/incoming/${id}`)
    } catch (error) {
      console.error("Failed to update letter:", error)
      toast.error("Gagal memperbarui surat. Silakan coba lagi.")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setExistingFileName(null) // Sembunyikan nama file lama saat file baru dipilih
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    const fileInput = document.getElementById("file") as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  const handleNextStep = async () => {
    let fieldsToValidate: FieldPath<NewCreateIncomingLetterRequest>[] = []
    if (currentStep === 1) {
      fieldsToValidate = ["receivedDate", "letterNumber", "subject", "sender", "recipient"]
    } else if (currentStep === 2) {
      fieldsToValidate = ["processor", "dispositionMethod", "dispositionTarget"]
    }

    const isValid = await trigger(fieldsToValidate)
    if (isValid) {
      setCurrentStep((prev) => prev + 1)
    } else {
      toast.error("Harap isi semua kolom yang wajib diisi sebelum melanjutkan.")
    }
  }

  const handlePrevStep = () => setCurrentStep((prev) => prev - 1)

  if (authLoading || fetchingLetter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        <p className="ml-4">Memuat data surat...</p>
      </div>
    )
  }
  if (!isAuthenticated) return null

  const inputFocusStyle = "focus:ring-2 focus:ring-amber-200 focus:border-amber-500"

  return (
    <Layout>
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-150px)] bg-gray-50 rounded-xl shadow-sm">
        <div className="w-full md:w-1/3 lg:w-1/4 bg-white rounded-l-xl border-r border-gray-200 p-4">
          <div className="flex items-center space-x-3 mb-6 p-2">
            <Link href={`/letters/incoming/${id}`} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="font-bold text-lg text-gray-800">Edit Surat Masuk</h1>
            </div>
          </div>
          <VerticalStepper currentStep={currentStep} />
        </div>

        <div className="w-full md:w-2/3 lg:w-3/4 p-6 md:p-10">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
            <div className="flex-grow">
              <h2 className="section-title text-amber-900">
                Langkah {currentStep}:{" "}
                {currentStep === 1 && "Informasi Utama Surat"}
                {currentStep === 2 && "Proses & Disposisi"}
                {currentStep === 3 && "Tindakan & Acara"}
              </h2>
              <p className="section-description mb-8">Pastikan semua data yang ditandai dengan (*) terisi dengan benar.</p>

              {/* Step 1: Informasi Surat */}
              {currentStep === 1 && (
                <div className="animate-fade-in space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="form-label form-label-required">Tanggal Penerimaan Surat</label>
                      <input {...register("receivedDate", { required: "Tanggal penerimaan wajib diisi" })} type="datetime-local" className={`input ${inputFocusStyle} ${errors.receivedDate ? "input-error" : ""}`} />
                      {errors.receivedDate && <p className="form-error">{errors.receivedDate.message}</p>}
                    </div>
                    <div className="form-group">
                      <label className="form-label form-label-required">Nomor Surat</label>
                      <input {...register("letterNumber", { required: "Nomor surat wajib diisi" })} type="text" className={`input ${inputFocusStyle} ${errors.letterNumber ? "input-error" : ""}`} placeholder="Contoh: 001/SK/2024" />
                      {errors.letterNumber && <p className="form-error">{errors.letterNumber.message}</p>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tanggal Surat</label>
                      <input {...register("letterDate")} type="date" className={`input ${inputFocusStyle}`} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Sifat Surat</label>
                      <select {...register("letterNature")} className={`input ${inputFocusStyle}`}>
                        <option value="BIASA">Biasa</option>
                        <option value="PENTING">Penting</option>
                        <option value="TERBATAS">Terbatas</option>
                        <option value="RAHASIA">Rahasia</option>
                        <option value="SANGAT_RAHASIA">Sangat Rahasia</option>
                      </select>
                    </div>
                    <div className="form-group md:col-span-2">
                      <label className="form-label form-label-required">Isi Ringkas/Subjek</label>
                      <input {...register("subject", { required: "Isi ringkas/subjek wajib diisi" })} type="text" className={`input ${inputFocusStyle} ${errors.subject ? "input-error" : ""}`} placeholder="Masukkan subjek atau isi ringkas surat" />
                      {errors.subject && <p className="form-error">{errors.subject.message}</p>}
                    </div>
                    <div className="form-group">
                      <label className="form-label form-label-required">Dari</label>
                      <input {...register("sender", { required: "Pengirim wajib diisi" })} type="text" className={`input ${inputFocusStyle} ${errors.sender ? "input-error" : ""}`} placeholder="Nama pengirim atau instansi" />
                      {errors.sender && <p className="form-error">{errors.sender.message}</p>}
                    </div>
                    <div className="form-group">
                      <label className="form-label form-label-required">Kepada</label>
                      <input {...register("recipient", { required: "Penerima wajib diisi" })} type="text" className={`input ${inputFocusStyle} ${errors.recipient ? "input-error" : ""}`} placeholder="Nama penerima atau instansi" />
                      {errors.recipient && <p className="form-error">{errors.recipient.message}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Proses & Disposisi */}
              {currentStep === 2 && (
                <div className="animate-fade-in">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-6">
                       <div className="form-group">
                        <label className="form-label form-label-required">Pengolah</label>
                        <input {...register("processor", { required: "Pengolah wajib diisi" })} type="text" className={`input ${inputFocusStyle} ${errors.processor ? "input-error" : ""}`} placeholder="Nama pengolah" />
                        {errors.processor && <p className="form-error">{errors.processor.message}</p>}
                      </div>
                      <div className="form-group">
                        <label className="form-label form-label-required">Ket (Manual / Srikandi)</label>
                        <div className="mt-1 flex w-full rounded-lg bg-gray-200 p-1">
                          <label className="relative flex-1 cursor-pointer text-center">
                            <input {...register("dispositionMethod", { required: "Keterangan wajib dipilih" })} type="radio" value="MANUAL" className="sr-only" />
                            <div className={`rounded-md py-2 px-3 text-sm font-semibold transition-all duration-200 ${dispositionMethod === "MANUAL" ? "bg-white text-amber-700 shadow-sm" : "text-gray-600 hover:bg-gray-300"}`}>Manual</div>
                          </label>
                          <label className="relative flex-1 cursor-pointer text-center">
                            <input {...register("dispositionMethod", { required: "Keterangan wajib dipilih" })} type="radio" value="SRIKANDI" className="sr-only" />
                            <div className={`rounded-md py-2 px-3 text-sm font-semibold transition-all duration-200 ${dispositionMethod === "SRIKANDI" ? "bg-white text-amber-700 shadow-sm" : "text-gray-600 hover:bg-gray-300"}`}>Srikandi</div>
                          </label>
                        </div>
                        {errors.dispositionMethod && <p className="form-error">{errors.dispositionMethod.message}</p>}
                      </div>
                      <div className="form-group">
                        <label className="form-label form-label-required">Disposisi</label>
                        <select {...register("dispositionTarget", { required: "Tujuan disposisi wajib dipilih" })} className={`input ${inputFocusStyle} ${errors.dispositionTarget ? "input-error" : ""}`}>
                          <option value="" disabled>Pilih tujuan disposisi...</option>
                          <option value="UMPEG">UMPEG</option>
                          <option value="PERENCANAAN">PERENCANAAN</option>
                          <option value="KAUR_KEUANGAN">KAUR_KEUANGAN</option>
                          <option value="KABID">KABID</option>
                          <option value="BIDANG1">BIDANG1</option>
                          <option value="BIDANG2">BIDANG2</option>
                          <option value="BIDANG3">BIDANG3</option>
                          <option value="BIDANG4">BIDANG4</option>
                          <option value="BIDANG5">BIDANG5</option>
                        </select>
                        {errors.dispositionTarget && <p className="form-error">{errors.dispositionTarget.message}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="form-label">File Lampiran</label>
                      {existingFileName && !selectedFile && (
                         <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg border">
                            <div className="flex items-center space-x-3 overflow-hidden">
                                <FileText className="h-8 w-8 text-gray-500 flex-shrink-0" />
                                <p className="text-sm font-medium text-gray-900 truncate">{existingFileName}</p>
                            </div>
                         </div>
                      )}
                      {!selectedFile ? (
                        <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-amber-500 transition-colors">
                          <input id="file" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                          <div className="flex flex-col items-center">
                            <Upload className="h-10 w-10 text-gray-400 mb-2" />
                            <span className="text-sm font-medium text-amber-700">{existingFileName ? 'Ganti file' : 'Klik atau jatuhkan file di sini'}</span>
                            <span className="text-xs text-gray-500 mt-1">Maks. 10MB</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg border">
                          <div className="flex items-center space-x-3 overflow-hidden">
                            <FileText className="h-8 w-8 text-gray-500 flex-shrink-0" />
                            <div className="truncate">
                              <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                              <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button type="button" onClick={removeFile} className="text-red-600 hover:text-red-800 p-1"><X className="h-5 w-5" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Tindakan & Acara */}
              {currentStep === 3 && (
                 <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label htmlFor="isInvitation" className={`flex flex-col space-y-1 cursor-pointer rounded-lg border-2 p-4 text-center transition-all duration-200 hover:shadow-md ${isInvitation ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500' : 'border-gray-200 bg-white'}`}>
                            <input {...register("isInvitation")} type="checkbox" id="isInvitation" className="sr-only" />
                            <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 ${isInvitation ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'}`}><Calendar className="h-6 w-6" /></div>
                            <span className="font-semibold">Ini adalah Undangan/Acara</span>
                            <p className="text-sm text-gray-500">Aktifkan untuk mengisi detail acara.</p>
                        </label>
                        <label htmlFor="needsFollowUp" className={`flex flex-col space-y-1 cursor-pointer rounded-lg border-2 p-4 text-center transition-all duration-200 hover:shadow-md ${needsFollowUp ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-500' : 'border-gray-200 bg-white'}`}>
                            <input {...register("needsFollowUp")} type="checkbox" id="needsFollowUp" className="sr-only" />
                            <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 ${needsFollowUp ? 'bg-sky-100 text-sky-600' : 'bg-gray-100 text-gray-600'}`}><ClipboardList className="h-6 w-6" /></div>
                            <span className="font-semibold">Perlu Tindak Lanjut</span>
                            <p className="text-sm text-gray-500">Aktifkan jika surat ini butuh respons.</p>
                        </label>
                    </div>
                    {isInvitation && (
                        <div className="card p-6 border-amber-200 border animate-fade-in">
                        <h3 className="font-semibold text-gray-800 mb-4">Detail Acara</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="form-group"><label className="form-label form-label-required">Tanggal Acara</label><input {...register("eventDate", { required: isInvitation ? "Tanggal acara wajib diisi" : false })} type="date" className={`input ${inputFocusStyle} ${errors.eventDate ? "input-error" : ""}`} />{errors.eventDate && <p className="form-error">{errors.eventDate.message}</p>}</div>
                            <div className="form-group"><label className="form-label form-label-required">Waktu Acara</label><input {...register("eventTime", { required: isInvitation ? "Waktu acara wajib diisi" : false })} type="time" className={`input ${inputFocusStyle} ${errors.eventTime ? "input-error" : ""}`} />{errors.eventTime && <p className="form-error">{errors.eventTime.message}</p>}</div>
                            <div className="form-group md:col-span-2"><label className="form-label form-label-required">Lokasi Acara</label><input {...register("eventLocation", { required: isInvitation ? "Lokasi acara wajib diisi" : false })} type="text" placeholder="Contoh: Ruang Rapat Utama" className={`input ${inputFocusStyle} ${errors.eventLocation ? "input-error" : ""}`} />{errors.eventLocation && <p className="form-error">{errors.eventLocation.message}</p>}</div>
                            <div className="form-group md:col-span-2"><label className="form-label">Catatan Acara (Opsional)</label><textarea {...register("eventNotes")} rows={3} className={`input ${inputFocusStyle}`} placeholder="Catatan tambahan untuk acara..." /></div>
                        </div>
                        </div>
                    )}
                    {needsFollowUp && (
                        <div className="card p-6 border-sky-200 border animate-fade-in">
                        <h3 className="font-semibold text-gray-800 mb-4">Detail Tindak Lanjut</h3>
                        <div className="form-group"><label className="form-label form-label-required">Tanggal Tindak Lanjut</label><input {...register("followUpDeadline", { required: needsFollowUp ? "Tanggal tindak lanjut wajib diisi" : false })} type="date" className={`input ${inputFocusStyle} ${errors.followUpDeadline ? "input-error" : ""}`} />{errors.followUpDeadline && <p className="form-error">{errors.followUpDeadline.message}</p>}</div>
                        </div>
                    )}
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
              <div>{currentStep > 1 && (<button type="button" onClick={handlePrevStep} className="btn btn-secondary"><ArrowLeft className="h-4 w-4 mr-2" />Sebelumnya</button>)}</div>
              <div>
                {currentStep < 3 && (<button type="button" onClick={handleNextStep} className="btn bg-amber-500 hover:bg-amber-600 text-white">Berikutnya<ChevronRight className="h-4 w-4 ml-2" /></button>)}
                {currentStep === 3 && (<button type="submit" disabled={updateLetterMutation.isLoading} className="btn bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-70">{updateLetterMutation.isLoading ? (<><div className="loading-spinner h-4 w-4 mr-2"></div>Menyimpan...</>) : (<><Save className="h-4 w-4 mr-2" />Simpan Perubahan</>)}</button>)}
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}