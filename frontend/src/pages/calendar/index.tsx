import { useState, useEffect, useMemo, useCallback } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import {
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  FileText,
  Send,
  PlusCircle,
  Filter,
  Inbox,
  ArrowUpCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCalendarEvents } from '@/hooks/useApi';
import Layout from '@/components/Layout/Layout';
import { formatDateTime } from '@/lib/utils';
import type { CalendarEvent, EventType } from '@/types';

// Plugins
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import idLocale from '@fullcalendar/core/locales/id';
import type {
  EventClickArg,
  EventContentArg,
  EventMountArg,
  DatesSetArg,
} from '@fullcalendar/core';

// SSR-safe import dengan loading state
const FullCalendar = dynamic(() => import('@fullcalendar/react'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>
  )
});

type FilterType = 'all' | 'incoming' | 'outgoing';

function getInitialRange() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: startOfMonth.toISOString(),
    end: endOfMonth.toISOString(),
  };
}

// Komponen Loading yang konsisten
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600 mx-auto"></div>
      <p className="mt-4 text-sm text-gray-600">Memuat kalender...</p>
    </div>
  </div>
);

// Komponen Stats terpisah untuk avoid conditional hooks
const CalendarStats = ({ allEvents }: { allEvents: CalendarEvent[] }) => {
  const stats = useMemo(() => {
    const incoming = allEvents.filter((e) => e.incomingLetterId).length;
    const outgoing = allEvents.filter((e) => e.outgoingLetterId).length;
    const other = allEvents.filter((e) => !e.incomingLetterId && !e.outgoingLetterId).length;
    
    return { 
      incoming, 
      outgoing, 
      other,
      total: allEvents.length 
    };
  }, [allEvents]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 flex items-center gap-4">
          <div className="p-4 bg-emerald-100 rounded-xl border-2 border-emerald-200">
            <Inbox className="h-7 w-7 text-emerald-600" />
          </div>
          <div>
            <div className="text-3xl font-bold text-emerald-600">{stats.incoming}</div>
            <div className="text-sm font-medium text-gray-600">Surat Masuk</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 flex items-center gap-4">
          <div className="p-4 bg-yellow-100 rounded-xl border-2 border-yellow-200">
            <ArrowUpCircle className="h-7 w-7 text-yellow-600" />
          </div>
          <div>
            <div className="text-3xl font-bold text-yellow-600">{stats.outgoing}</div>
            <div className="text-sm font-medium text-gray-600">Surat Keluar</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 flex items-center gap-4">
          <div className="p-4 bg-purple-100 rounded-xl border-2 border-purple-200">
            <FileText className="h-7 w-7 text-purple-600" />
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600">{stats.other}</div>
            <div className="text-sm font-medium text-gray-600">Acara Lain</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 flex items-center gap-4">
          <div className="p-4 bg-blue-100 rounded-xl border-2 border-blue-200">
            <CalendarIcon className="h-7 w-7 text-blue-600" />
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm font-medium text-gray-600">Total Acara</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Komponen Filter terpisah
const CalendarFilter = ({ 
  filter, 
  setFilter 
}: { 
  filter: FilterType; 
  setFilter: (filter: FilterType) => void;
}) => (
  <div className="flex items-center gap-2">
    <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl p-1.5">
      <span className="px-3 py-2 text-xs font-semibold text-white flex items-center gap-1.5">
        <Filter className="h-4 w-4" /> Filter
      </span>
      <button
        onClick={() => setFilter('all')}
        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
          filter === 'all' 
            ? 'bg-white text-emerald-600 shadow-md' 
            : 'text-white hover:bg-white/20'
        }`}
      >
        Semua
      </button>
      <button
        onClick={() => setFilter('incoming')}
        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
          filter === 'incoming' 
            ? 'bg-white text-emerald-600 shadow-md' 
            : 'text-white hover:bg-white/20'
        }`}
      >
        <Inbox className="h-4 w-4" />
        Masuk
      </button>
      <button
        onClick={() => setFilter('outgoing')}
        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
          filter === 'outgoing' 
            ? 'bg-white text-yellow-600 shadow-md' 
            : 'text-white hover:bg-white/20'
        }`}
      >
        <ArrowUpCircle className="h-4 w-4" />
        Keluar
      </button>
    </div>
  </div>
);

// Komponen Quick Add Modal terpisah
const QuickAddModal = ({ 
  newEventDate, 
  setNewEventDate,
  router 
}: { 
  newEventDate: string | null; 
  setNewEventDate: (date: string | null) => void;
  router: any;
}) => {
  if (!newEventDate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/75 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6">
          <div className="flex items-center gap-3 text-white">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <PlusCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Tambah Acara Baru</h3>
              <p className="text-emerald-100 text-sm mt-0.5">
                {new Date(newEventDate).toLocaleDateString('id-ID', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-5">
            Pilih jenis surat untuk membuat acara pada tanggal yang dipilih.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <button
              onClick={() =>
                router.push(`/letters/incoming/create?date=${encodeURIComponent(newEventDate)}`)
              }
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 p-[2px] transition-all hover:shadow-lg hover:scale-105"
            >
              <div className="relative flex flex-col items-center gap-3 rounded-[10px] bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-6 group-hover:from-emerald-100 group-hover:to-teal-100 transition-all">
                <div className="p-3 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition-colors">
                  <Inbox className="h-6 w-6 text-emerald-600" />
                </div>
                <span className="text-sm font-bold text-emerald-700">Surat Masuk</span>
              </div>
            </button>

            <button
              onClick={() =>
                router.push(`/letters/outgoing/create?date=${encodeURIComponent(newEventDate)}`)
              }
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 p-[2px] transition-all hover:shadow-lg hover:scale-105"
            >
              <div className="relative flex flex-col items-center gap-3 rounded-[10px] bg-gradient-to-r from-yellow-50 to-amber-50 px-4 py-6 group-hover:from-yellow-100 group-hover:to-amber-100 transition-all">
                <div className="p-3 bg-yellow-100 rounded-xl group-hover:bg-yellow-200 transition-colors">
                  <ArrowUpCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <span className="text-sm font-bold text-yellow-700">Surat Keluar</span>
              </div>
            </button>
          </div>

          <button
            onClick={() => setNewEventDate(null)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function untuk menentukan jenis event dan styling
const getEventTypeAndStyle = (event: CalendarEvent) => {
  if (event.incomingLetterId) {
    return {
      type: 'incoming' as const,
      style: 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-500 hover:from-emerald-100 hover:to-teal-100',
      badge: '📥 Masuk',
      badgeStyle: 'bg-emerald-100 text-emerald-700 border border-emerald-300',
      letterNumber: event.incomingLetter?.letterNumber
    };
  }
  
  if (event.outgoingLetterId) {
    return {
      type: 'outgoing' as const,
      style: 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-500 hover:from-yellow-100 hover:to-amber-100',
      badge: '📤 Keluar',
      badgeStyle: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
      letterNumber: event.outgoingLetter?.letterNumber
    };
  }
  
  return {
    type: 'other' as const,
    style: 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-500 hover:from-purple-100 hover:to-pink-100',
    badge: '📅 Acara',
    badgeStyle: 'bg-purple-100 text-purple-700 border border-purple-300',
    letterNumber: undefined
  };
};

// Helper function untuk menentukan route berdasarkan event type
const getEventRoute = (event: CalendarEvent) => {
  if (event.incomingLetterId) {
    return `/letters/incoming/${event.incomingLetterId}`;
  }
  if (event.outgoingLetterId) {
    return `/letters/outgoing/${event.outgoingLetterId}`;
  }
  return `/calendar/events/${event.id}`; // Fallback route untuk acara biasa
};

export default function CalendarPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  
  const [filter, setFilter] = useState<FilterType>('all');
  const [newEventDate, setNewEventDate] = useState<string | null>(null);
  const [range, setRange] = useState(getInitialRange);

  const { data: calendarData } = useCalendarEvents({
    start: range.start,
    end: range.end,
  });

  // Authentication check dengan useEffect yang konsisten
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  // Hooks yang selalu di-render (tidak conditional)
  const allEvents: CalendarEvent[] = calendarData?.events || [];

  const filteredEvents = useMemo(() => {
    if (filter === 'all') return allEvents;
    
    return allEvents.filter((event) => {
      const eventType = getEventTypeAndStyle(event).type;
      return eventType === filter;
    });
  }, [allEvents, filter]);

  const mappedEvents = useMemo(() => {
    const eventsByDate = new Map<string, CalendarEvent[]>();
    filteredEvents.forEach(event => {
      const dateKey = new Date(event.date).toDateString();
      if (!eventsByDate.has(dateKey)) {
        eventsByDate.set(dateKey, []);
      }
      eventsByDate.get(dateKey)!.push(event);
    });

    return filteredEvents.map((event) => {
      const eventInfo = getEventTypeAndStyle(event);
      const eventDate = new Date(event.date);
      const dateKey = eventDate.toDateString();
      const samedayEvents = eventsByDate.get(dateKey)!;
      const eventIndex = samedayEvents.indexOf(event);
      
      const adjustedDate = new Date(eventDate);
      if (samedayEvents.length > 1) {
        adjustedDate.setHours(9 + eventIndex, eventIndex * 15, 0, 0);
      } else {
        adjustedDate.setHours(9, 0, 0, 0);
      }
      
      return {
        id: String(event.id),
        title: event.title,
        start: adjustedDate.toISOString(),
        allDay: false,
        extendedProps: {
          original: event,
        },
        classNames: [
          'rounded-lg',
          'border-l-4',
          'shadow-sm',
          'hover:shadow-md',
          'transition-all',
          'cursor-pointer',
          eventInfo.style,
        ],
      };
    });
  }, [filteredEvents]);

  const onEventClick = useCallback((arg: EventClickArg) => {
    const data = arg.event.extendedProps?.original as CalendarEvent | undefined;
    if (!data) return;
    
    const route = getEventRoute(data);
    router.push(route);
  }, [router]);

  const onDateClick = useCallback((arg: DateClickArg) => {
    setNewEventDate(arg.dateStr);
  }, []);

  const eventDidMount = useCallback((arg: EventMountArg) => {
    const data = arg.event.extendedProps?.original as CalendarEvent | undefined;
    if (!data) return;
    
    const eventInfo = getEventTypeAndStyle(data);
    const detail = [
      eventInfo.letterNumber ? `No: ${eventInfo.letterNumber}` : '',
      data.location ? `Lokasi: ${data.location}` : '',
      data.date ? `Waktu: ${formatDateTime(data.date)}` : '',
      data.description ? `${data.description}` : '',
    ]
      .filter(Boolean)
      .join('\n');
      
    arg.el.setAttribute('title', detail);
  }, []);

  const eventContent = useCallback((arg: EventContentArg) => {
    const data = arg.event.extendedProps?.original as CalendarEvent | undefined;
    if (!data) return <>{arg.timeText} {arg.event.title}</>;
    
    const eventInfo = getEventTypeAndStyle(data);
    
    return (
      <div className="flex flex-col gap-1 p-2">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold leading-none">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full ${eventInfo.badgeStyle}`}
          >
            {eventInfo.badge}
          </span>
          {eventInfo.letterNumber && (
            <span className="text-gray-600 font-mono">#{eventInfo.letterNumber}</span>
          )}
        </div>
        <div className="text-[13px] font-bold text-gray-900 truncate leading-tight">
          {arg.event.title}
        </div>
        {data.location && (
          <div className="flex items-center gap-1 text-[11px] text-gray-600 truncate">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{data.location}</span>
          </div>
        )}
        {arg.timeText && (
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{arg.timeText}</span>
          </div>
        )}
      </div>
    );
  }, []);

  const onDatesSet = useCallback((arg: DatesSetArg) => {
    setRange(prev => {
      if (prev.start === arg.startStr && prev.end === arg.endStr) {
        return prev;
      }
      return { start: arg.startStr, end: arg.endStr };
    });
  }, []);

  // JANGAN gunakan conditional return sebelum hooks
  // Selalu render komponen yang sama structure-nya
  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <LoadingSpinner />; // atau redirect component
  }

  // Render utama - selalu konsisten
  return (
    <Layout>
      <Head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@fullcalendar/daygrid@6.1.15/index.global.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@fullcalendar/timegrid@6.1.15/index.global.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@fullcalendar/list@6.1.15/index.global.min.css"
        />
        <style jsx global>{`
          .fc {
            font-family: inherit;
          }
          .fc .fc-button-primary {
            background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
            border: none;
            border-radius: 0.75rem;
            padding: 0.5rem 1rem;
            font-weight: 600;
            transition: all 0.2s;
            box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
          }
          .fc .fc-button-primary:hover {
            background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
            box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);
            transform: translateY(-1px);
          }
          .fc .fc-button-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .fc .fc-button-primary:not(:disabled):active {
            transform: translateY(0);
          }
          .fc-theme-standard .fc-scrollgrid {
            border-radius: 1rem;
            overflow: hidden;
          }
          .fc-theme-standard td, .fc-theme-standard th {
            border-color: #e5e7eb;
          }
          .fc .fc-col-header-cell {
            background: linear-gradient(135deg, #f0fdf4 0%, #ccfbf1 100%);
            padding: 1rem;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.05em;
            color: #047857;
          }
          .fc .fc-daygrid-day-number {
            padding: 0.5rem;
            font-weight: 600;
            color: #374151;
          }
          .fc .fc-daygrid-day.fc-day-today {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%) !important;
          }
          .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            border-radius: 50%;
            width: 2rem;
            height: 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .fc-event {
            margin: 2px 4px;
          }
          .fc-daygrid-event-harness {
            margin: 2px 0;
          }
          .fc .fc-toolbar-title {
            font-size: 1.5rem;
            font-weight: 800;
            color: #047857;
            background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .fc .fc-list-event:hover td {
            background-color: #f0fdf4;
          }
        `}</style>
      </Head>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-lg p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl border border-white/30">
                <CalendarIcon className="h-8 w-8 text-white" />
              </div>
              <div className="text-white">
                <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
                  Kalender Acara
                  <Sparkles className="h-6 w-6 text-yellow-300" />
                </h1>
                <p className="text-emerald-100">
                  Pantau semua acara dari surat masuk dan keluar Anda
                </p>
              </div>
            </div>

            <CalendarFilter filter={filter} setFilter={setFilter} />
          </div>
        </div>

        {/* Stats */}
        <CalendarStats allEvents={allEvents} />

        {/* Calendar */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden p-6">
          <FullCalendar
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
            }}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            locales={[idLocale]}
            locale="id"
            events={mappedEvents as any}
            eventClick={onEventClick}
            dateClick={onDateClick}
            eventDidMount={eventDidMount}
            eventContent={eventContent}
            datesSet={onDatesSet}
            selectable={true}
            dayMaxEventRows={3}
            moreLinkClick="popover"
            height="auto"
            aspectRatio={1.8}
            slotMinTime="06:00:00"
            slotMaxTime="21:00:00"
            expandRows={true}
            nowIndicator={true}
            displayEventTime={true}
            eventDisplay="block"
          />
        </div>
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal 
        newEventDate={newEventDate} 
        setNewEventDate={setNewEventDate}
        router={router}
      />
    </Layout>
  );
}