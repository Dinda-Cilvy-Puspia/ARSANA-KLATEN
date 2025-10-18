// index.tsx

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { useAuth } from "@/hooks/useAuth"
import { useIncomingLetters, useOutgoingLetters, useUpcomingEvents } from "@/hooks/useApi"
import Layout from "@/components/Layout/Layout"
import { FileText, Send, Calendar, ArrowDownCircle, ArrowUpCircle, Plus, BookOpen, Clock } from "lucide-react"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import type { IncomingLetter, OutgoingLetter } from "@/types"; // <-- Jangan lupa import

// --- [BARU] Komponen untuk Kartu Statistik ---
const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  color: string
}) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-lg transition-shadow duration-300">
    <div className="flex items-center justify-between">
      <div className={`rounded-full p-3 ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
    <div className="mt-4">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
)

// --- [BARU] Komponen untuk menampilkan waktu Jakarta ---
const JakartaTime = () => {
  const [currentTime, setCurrentTime] = useState("")

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const jakartaTime = now.toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      })
      const jakartaDate = now.toLocaleDateString("id-ID", {
        timeZone: "Asia/Jakarta",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      })
      setCurrentTime(`${jakartaDate} | ${jakartaTime}`)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
      <Clock className="h-4 w-4 text-blue-500" />
      <span className="font-medium">{currentTime}</span>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading } = useAuth()

  const { data: incomingLettersData } = useIncomingLetters({ limit: 5 })
  const { data: outgoingLettersData } = useOutgoingLetters({ limit: 5 })
  const { data: upcomingEventsData } = useUpcomingEvents({ limit: 5 })

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth/login")
    }
  }, [isAuthenticated, loading, router])

  // --- [PERUBAHAN] Menggabungkan dan mengurutkan surat terbaru ---
  const recentLetters = useMemo(() => {
    const incoming =
  incomingLettersData?.letters?.map((letter: IncomingLetter) => ({ ...letter, type: "incoming" as const })) || []
    const outgoing =
  outgoingLettersData?.letters?.map((letter: OutgoingLetter) => ({ ...letter, type: "outgoing" as const })) || []

    return [...incoming, ...outgoing]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }, [incomingLettersData, outgoingLettersData])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  const incomingTotal = incomingLettersData?.pagination?.total || 0
  const outgoingTotal = outgoingLettersData?.pagination?.total || 0
  const agendaTotal = upcomingEventsData?.events?.length || 0;
  const agendaHariIni =
    upcomingEventsData?.events?.filter(
      (event: any) => new Date(event.date).toDateString() === new Date().toDateString()
    ) || []

  return (
    <Layout>
      <div className="space-y-8">
        {/* --- [PERUBAHAN] Header dengan Sambutan Personal & Aksi Cepat --- */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Selamat Datang, {user?.name || "Pengguna"}!</h1>
            <p className="text-gray-500">Berikut adalah ringkasan aktivitas surat Anda hari ini.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* --- [BARU] Tambahkan waktu Jakarta di sini --- */}
            <JakartaTime />
            <div className="flex items-center gap-3">
              <Link href="/letters/incoming/create" className="btn btn-primary bg-[#12A168] hover:bg-[#0e7d52]">
                <Plus className="h-4 w-4 mr-2" />
                Surat Masuk
              </Link>
              <Link href="/letters/outgoing/create" className="btn btn-secondary">
                <Plus className="h-4 w-4 mr-2" />
                Surat Keluar
              </Link>
            </div>
          </div>
        </div>

        {/* --- [PERUBAHAN] Kartu Statistik (KPI) yang Diperbarui --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Surat Masuk"
            value={incomingTotal}
            icon={ArrowDownCircle}
            color="bg-emerald-500"
          />
          <StatCard title="Total Surat Keluar" value={outgoingTotal} icon={ArrowUpCircle} color="bg-blue-500" />
          <StatCard title="Total Agenda" value={agendaTotal} icon={Calendar} color="bg-amber-500" />
          <StatCard title="Perlu Tindak Lanjut" value={0} icon={BookOpen} color="bg-rose-500" />
        </div>

        {/* --- [PERUBAHAN] Kolom Utama: Agenda & Aktivitas Terbaru --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kolom Kiri: Agenda Hari Ini */}
          <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-lg text-gray-800 mb-4">Agenda Hari Ini</h2>
            {agendaHariIni.length > 0 ? (
              <div className="space-y-4">
                {agendaHariIni.map((event: any) => (
                  <div key={event.id} className="flex items-center gap-4">
                    <div className="flex-shrink-0 text-center bg-amber-100 text-amber-700 rounded-lg px-3 py-2">
                      <p className="text-xs font-semibold">
                        {new Date(event.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{event.title}</p>
                      {event.location && <p className="text-sm text-gray-500">{event.location}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">Tidak ada agenda terjadwal untuk hari ini.</p>
              </div>
            )}
          </div>

          {/* Kolom Kanan: Aktivitas Surat Terbaru */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-lg text-gray-800 mb-4">Aktivitas Surat Terbaru</h2>
            {recentLetters.length > 0 ? (
              <div className="flow-root">
                <ul role="list" className="-mb-4">
                  {recentLetters.map((letter, index) => (
                    <li key={`${letter.id}-${letter.type}`} className="relative pb-4">
                      {index !== recentLetters.length - 1 && (
                         <div className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-200" aria-hidden="true" />
                      )}
                      <div className="relative flex items-start space-x-3">
                        <div>
                           <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                letter.type === 'incoming' ? 'bg-emerald-500' : 'bg-blue-500'
                            }`}>
                            {letter.type === 'incoming' ? 
                                <ArrowDownCircle className="h-5 w-5 text-white" /> : 
                                <ArrowUpCircle className="h-5 w-5 text-white" />}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5">
                          <p className="text-sm text-gray-600">
                            {letter.type === 'incoming' ? `Surat Masuk dari ` : `Surat Keluar untuk `}
                            <span className="font-semibold">{letter.type === 'incoming' ? letter.sender : letter.recipient}</span>
                          </p>
                          <p className="text-sm font-medium text-gray-800 mt-0.5">{letter.subject}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(letter.createdAt)}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">Belum ada aktivitas surat.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}