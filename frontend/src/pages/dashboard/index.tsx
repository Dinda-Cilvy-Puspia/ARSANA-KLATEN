//dashboard/index.tsx

import React, { useEffect, useMemo, useState, useCallback, memo } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { useIncomingLetters, useOutgoingLetters, useUpcomingEvents } from "@/hooks/useApi";
import Layout from "@/components/Layout/Layout";
import { 
  FileText, 
  Send, 
  Calendar, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Plus, 
  BookOpen, 
  Clock, 
  TrendingUp, 
  AlertCircle 
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import type { IncomingLetter, OutgoingLetter } from "@/types";

// ====================================
// OPTIMIZED COMPONENTS WITH MEMO
// ====================================

const StatCard = memo(({
  title,
  value,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: { value: number; label: string };
}) => (
  <div className="group bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className={`rounded-xl p-3 ${color} group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-semibold ${trend.value >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          <TrendingUp className={`h-3 w-3 ${trend.value < 0 ? 'rotate-180' : ''}`} />
          <span>{Math.abs(trend.value)}%</span>
        </div>
      )}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
      {trend && <p className="text-xs text-gray-400 mt-1">{trend.label}</p>}
    </div>
  </div>
));

StatCard.displayName = 'StatCard';

const JakartaTime = memo(() => {
  const [currentTime, setCurrentTime] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      const jakartaTime = now.toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });
      const jakartaDate = now.toLocaleDateString("id-ID", {
        timeZone: "Asia/Jakarta",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      setCurrentTime(`${jakartaDate} | ${jakartaTime}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl px-4 py-2.5 shadow-sm">
      <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
      <span className="font-semibold">{currentTime}</span>
    </div>
  );
});

JakartaTime.displayName = 'JakartaTime';

const AgendaCard = memo(({ event }: { event: any }) => (
  <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200 cursor-pointer group">
    <div className="flex-shrink-0 text-center bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700 rounded-xl px-4 py-3 shadow-sm group-hover:shadow-md transition-shadow duration-200">
      <p className="text-xs font-bold uppercase tracking-wide">
        {new Date(event.date).toLocaleTimeString('id-ID', { hour: "2-digit", minute: "2-digit", hour12: false })}
      </p>
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-gray-900 truncate">{event.title}</p>
      {event.location && (
        <p className="text-sm text-gray-500 truncate flex items-center gap-1 mt-0.5">
          <Calendar className="h-3 w-3" />
          {event.location}
        </p>
      )}
    </div>
  </div>
));

AgendaCard.displayName = 'AgendaCard';

const ActivityItem = memo(({ letter, index, isLast }: { letter: any; index: number; isLast: boolean }) => (
  <li className="relative pb-4 group">
    {!isLast && (
      <div className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 bg-gradient-to-b from-gray-200 to-transparent" aria-hidden="true" />
    )}
    <div className="relative flex items-start space-x-3">
      <div>
        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white shadow-sm group-hover:shadow-md transition-shadow duration-200 ${
          letter.type === 'incoming' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
        }`}>
          {letter.type === 'incoming' ? 
            <ArrowDownCircle className="h-5 w-5 text-white" /> : 
            <ArrowUpCircle className="h-5 w-5 text-white" />}
        </span>
      </div>
      <div className="min-w-0 flex-1 pt-1.5">
        <p className="text-sm text-gray-600">
          {letter.type === 'incoming' ? `Surat Masuk dari ` : `Surat Keluar untuk `}
          <span className="font-semibold text-gray-900">{letter.type === 'incoming' ? letter.sender : letter.recipient}</span>
        </p>
        <p className="text-sm font-medium text-gray-800 mt-0.5 line-clamp-1">{letter.subject}</p>
        <p className="text-xs text-gray-400 mt-1">{formatDate(letter.createdAt)}</p>
      </div>
    </div>
  </li>
));

ActivityItem.displayName = 'ActivityItem';

// ====================================
// MAIN DASHBOARD COMPONENT
// ====================================

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  const { data: incomingLettersData, isLoading: incomingLoading } = useIncomingLetters({ limit: 5 });
  const { data: outgoingLettersData, isLoading: outgoingLoading } = useOutgoingLetters({ limit: 5 });
  const { data: upcomingEventsData, isLoading: eventsLoading } = useUpcomingEvents({ limit: 5 });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated, loading, router]);

  // ====================================
  // MEMOIZED COMPUTATIONS
  // ====================================

  const recentLetters = useMemo(() => {
    const incoming =
      incomingLettersData?.letters?.map((letter: IncomingLetter) => ({ ...letter, type: "incoming" as const })) || [];
    const outgoing =
      outgoingLettersData?.letters?.map((letter: OutgoingLetter) => ({ ...letter, type: "outgoing" as const })) || [];

    return [...incoming, ...outgoing]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [incomingLettersData, outgoingLettersData]);

  const stats = useMemo(() => ({
    incomingTotal: incomingLettersData?.pagination?.total || 0,
    outgoingTotal: outgoingLettersData?.pagination?.total || 0,
    agendaTotal: upcomingEventsData?.events?.length || 0,
    agendaToday: upcomingEventsData?.events?.filter(
      (event: any) => new Date(event.date).toDateString() === new Date().toDateString()
    ) || []
  }), [incomingLettersData, outgoingLettersData, upcomingEventsData]);

  const handleQuickAction = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  // ====================================
  // LOADING STATE
  // ====================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const isDataLoading = incomingLoading || outgoingLoading || eventsLoading;

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        {/* ====================================
            HEADER SECTION
        ==================================== */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900">
              Selamat Datang, <span className="text-[#12A168]">{user?.name || "Pengguna"}</span>!
            </h1>
            <p className="text-gray-600 flex items-center gap-2">
              <span>Berikut adalah ringkasan aktivitas surat Anda hari ini</span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <JakartaTime />
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button 
                onClick={() => handleQuickAction('/letters/incoming/create')}
                className="flex-1 sm:flex-none btn bg-gradient-to-r from-[#12A168] to-[#0e8653] hover:from-[#0e8653] hover:to-[#0a6b42] text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4 mr-2" />
                Surat Masuk
              </button>
              <button
                onClick={() => handleQuickAction('/letters/outgoing/create')}
                className="flex-1 sm:flex-none btn bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4 mr-2" />
                Surat Keluar
              </button>
            </div>
          </div>
        </div>

        {/* ====================================
            STATISTICS CARDS
        ==================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Surat Masuk"
            value={stats.incomingTotal}
            icon={ArrowDownCircle}
            color="bg-gradient-to-br from-emerald-500 to-teal-600"
            trend={{ value: 12, label: "dari bulan lalu" }}
          />
          <StatCard 
            title="Total Surat Keluar" 
            value={stats.outgoingTotal} 
            icon={ArrowUpCircle} 
            color="bg-gradient-to-br from-blue-500 to-indigo-600"
            trend={{ value: 8, label: "dari bulan lalu" }}
          />
          <StatCard 
            title="Total Agenda" 
            value={stats.agendaTotal} 
            icon={Calendar} 
            color="bg-gradient-to-br from-amber-500 to-orange-600"
            trend={{ value: -5, label: "dari bulan lalu" }}
          />
          <StatCard 
            title="Perlu Tindak Lanjut" 
            value={0} 
            icon={AlertCircle} 
            color="bg-gradient-to-br from-rose-500 to-pink-600"
          />
        </div>

        {/* ====================================
            MAIN CONTENT GRID
        ==================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AGENDA TODAY */}
          <div className="lg:col-span-1 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-600" />
                Agenda Hari Ini
              </h2>
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                {stats.agendaToday.length}
              </span>
            </div>
            {isDataLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex gap-4">
                    <div className="h-12 w-16 bg-gray-200 rounded-xl"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : stats.agendaToday.length > 0 ? (
              <div className="space-y-2">
                {stats.agendaToday.map((event: any) => (
                  <AgendaCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 font-medium">Tidak ada agenda untuk hari ini</p>
                <p className="text-xs text-gray-400 mt-1">Nikmati hari Anda!</p>
              </div>
            )}
          </div>

          {/* RECENT ACTIVITY */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Aktivitas Surat Terbaru
              </h2>
              <Link 
                href="/letters/incoming"
                className="text-sm font-semibold text-[#12A168] hover:text-[#0e8653] transition-colors"
              >
                Lihat Semua →
              </Link>
            </div>
            {isDataLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex gap-3">
                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentLetters.length > 0 ? (
              <div className="flow-root">
                <ul role="list" className="-mb-4">
                  {recentLetters.map((letter, index) => (
                    <ActivityItem 
                      key={`${letter.id}-${letter.type}`} 
                      letter={letter}
                      index={index}
                      isLast={index === recentLetters.length - 1}
                    />
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 font-medium">Belum ada aktivitas surat</p>
                <p className="text-xs text-gray-400 mt-1">Mulai dengan membuat surat baru</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}