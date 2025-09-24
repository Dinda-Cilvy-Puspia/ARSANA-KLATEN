import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import {
  useIncomingLetters,
  useOutgoingLetters,
  useUpcomingEvents,
  useNotifications,
} from "@/hooks/useApi";
import Layout from "@/components/Layout/Layout";
import { FileText, Send, Calendar, Bell } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  const { data: incomingLettersData } = useIncomingLetters({ limit: 5 });
  const { data: outgoingLettersData } = useOutgoingLetters({ limit: 5 });
  const { data: upcomingEventsData } = useUpcomingEvents({ limit: 5 });
  const { data: notificationsData } = useNotifications({ limit: 5 });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const incomingTotal = incomingLettersData?.pagination?.total || 0;
  const outgoingTotal = outgoingLettersData?.pagination?.total || 0;
  const agendaTotal = upcomingEventsData?.events?.length || 0;
  const tindakLanjutTotal = 0; // sementara hardcode
  const agendaHariIni =
    upcomingEventsData?.events?.filter(
      (event: any) =>
        new Date(event.date).toDateString() === new Date().toDateString()
    ) || [];
  const notifications = notificationsData?.notifications || [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <h1 className="text-xl font-bold">Dashboard</h1>

        {/* Quick Actions */}
<div className="flex flex-wrap gap-3">
  <Link
    href="/letters/incoming/create"
    className="px-4 py-2 rounded-md text-white"
    style={{ backgroundColor: "#12A168" }}
  >
    <FileText className="h-4 w-4 mr-2 inline" />
    Tambah Surat Masuk
  </Link>

  <Link
    href="/letters/outgoing/create"
    className="px-4 py-2 rounded-md text-white"
    style={{ backgroundColor: "#12A168" }}
  >
    <Send className="h-4 w-4 mr-2 inline" />
    Tambah Surat Keluar
  </Link>

  <Link href="/calendar" className="btn btn-secondary">
    <Calendar className="h-4 w-4 mr-2" />
    Lihat Kalender
  </Link>
</div>


        {/* Stats */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <div className="bg-[#EBFDF9] border rounded-lg p-4 flex flex-col justify-between shadow-sm">
    <div className="flex items-start justify-between">
      <p className="text-sm font-medium text-gray-700">Surat Masuk</p>
      <FileText className="h-5 w-5 text-gray-700" />
    </div>
    <h2 className="text-2xl font-bold mt-2">{incomingTotal}</h2>
    <p className="text-xs text-gray-600 mt-1">Pada bulan ini</p>
  </div>

  <div className="bg-[#EBFDF9] border rounded-lg p-4 flex flex-col justify-between shadow-sm">
    <div className="flex items-start justify-between">
      <p className="text-sm font-medium text-gray-700">Surat Keluar</p>
      <Send className="h-5 w-5 text-gray-700" />
    </div>
    <h2 className="text-2xl font-bold mt-2">{outgoingTotal}</h2>
    <p className="text-xs text-gray-600 mt-1">Pada bulan ini</p>
  </div>

  <div className="bg-[#EBFDF9] border rounded-lg p-4 flex flex-col justify-between shadow-sm">
    <div className="flex items-start justify-between">
      <p className="text-sm font-medium text-gray-700">Agenda</p>
      <Calendar className="h-5 w-5 text-gray-700" />
    </div>
    <h2 className="text-2xl font-bold mt-2">{agendaTotal}</h2>
    <p className="text-xs text-gray-600 mt-1">Pada hari ini</p>
  </div>

  <div className="bg-[#EBFDF9] border rounded-lg p-4 flex flex-col justify-between shadow-sm">
    <div className="flex items-start justify-between">
      <p className="text-sm font-medium text-gray-700">Perlu Tindak Lanjut</p>
      <Bell className="h-5 w-5 text-gray-700" />
    </div>
    <h2 className="text-2xl font-bold mt-2">{tindakLanjutTotal}</h2>
    <p className="text-xs text-gray-600 mt-1">Pada hari ini</p>
  </div>
</div>



        {/* Agenda + Notifikasi */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Agenda Hari Ini */}
  <div className="bg-[#EBFDF9] border rounded-lg p-4">
    <h2 className="font-semibold mb-3">Agenda Hari ini</h2>
    {agendaHariIni.length > 0 ? (
      <div className="space-y-3">
        {agendaHariIni.map((event: any, i: number) => (
          <div
            key={i}
            className="border rounded-lg p-3 flex justify-between items-center bg-white"
          >
            <div>
              <p className="font-medium">{event.title}</p>
              {event.location && (
                <p className="text-sm text-gray-600">{event.location}</p>
              )}
              <p className="text-xs text-gray-500">
                {formatDate(event.date)}
              </p>
            </div>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
              {new Date(event.date).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-gray-500 text-sm">Tidak ada agenda hari ini</p>
    )}
  </div>

  {/* Notifikasi Terbaru */}
  <div className="bg-[#EBFDF9] border rounded-lg p-4">
    <h2 className="font-semibold mb-3">Notifikasi Terbaru</h2>
    {notifications.length > 0 ? (
      <div className="space-y-3">
        {notifications.slice(0, 3).map((notif: any, i: number) => (
          <div
            key={i}
            className={`border rounded-lg p-3 ${
              notif.type === "deadline"
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            <p className="font-medium">{notif.title}</p>
            <p className="text-sm">{notif.message}</p>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-gray-500 text-sm">Belum ada notifikasi</p>
    )}
  </div>
</div>

      </div>
    </Layout>
  );
}
