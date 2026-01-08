// --- START OF FILE types.ts ---
// =======================
// 📌 Union Types - DIPERBAIKI
// =======================
export type Role = 'ADMIN' | 'STAFF';
export type LetterCategory = 'GENERAL' | 'INVITATION' | 'OFFICIAL' | 'ANNOUNCEMENT';
export type LetterNature = 'BIASA' | 'TERBATAS' | 'RAHASIA' | 'SANGAT_RAHASIA' | 'PENTING';
export type SecurityClass = 'BIASA' | 'TERBATAS';

// ✅ KOREKSI: Metode Pengolahan (Manual/Srikandi)
export type ProcessingMethod = 'MANUAL' | 'SRIKANDI';

// ✅ KOREKSI: Target Disposisi (UMPEG, BIDANG1, dll)
export type DispositionTarget =
  | 'UMPEG'
  | 'PERENCANAAN'
  | 'KAUR_KEUANGAN'
  | 'KABID'
  | 'BIDANG1'
  | 'BIDANG2'
  | 'BIDANG3'
  | 'BIDANG4'
  | 'BIDANG5';

export type NotificationType = 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
export type EventType = 'MEETING' | 'APPOINTMENT' | 'DEADLINE' | 'OTHER';

// =======================
// 📌 User Types
// =======================
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export type UserMini = Pick<User, 'id' | 'name' | 'email'>;

// =======================
// 📌 Auth Types
// =======================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// =======================
// 📌 Letter Types - DIPERBAIKI
// =======================
export interface IncomingLetter {
  id: string;
  letterNumber: string;
  letterDate?: string;
  letterNature: LetterNature;
  subject: string;
  sender: string;
  recipient: string;
  processor: string;
  note?: string;
  receivedDate: string;
  fileName?: string;
  filePath?: string;
  isInvitation: boolean;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  eventNotes?: string;
  
  // ✅ DIPERBAIKI: Field untuk follow-up
  needsFollowUp: boolean;
  followUpDeadline?: string;
  
  // ✅ DIPERBAIKI: Metode pengolahan (Manual/Srikandi)
  processingMethod: ProcessingMethod;
  
  // ✅ DIPERBAIKI: Target disposisi
  dispositionTarget?: DispositionTarget;
  
  // ✅ DIPERBAIKI: Nomor disposisi Srikandi (jika menggunakan Srikandi)
  srikandiDispositionNumber?: string;
  
  // Metadata
  overdueNotifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: UserMini;
  
  // ❌ DIHAPUS: dispositions array (tidak diperlukan lagi)
}

export interface OutgoingLetter {
  id: string;
  createdDate: string;
  letterDate: string;
  letterNumber: string;
  letterNature: LetterNature;
  subject: string;
  sender: string;
  recipient: string;
  processor: string;
  note?: string;
  fileName?: string;
  filePath?: string;
  isInvitation: boolean;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  eventNotes?: string;
  executionDate?: string;
  classificationCode?: string;
  serialNumber?: number;
  securityClass: SecurityClass;
  
  // ✅ DIPERBAIKI: Metode pengolahan untuk surat keluar
  processingMethod: ProcessingMethod;
  
  // ✅ DIPERBAIKI: Nomor disposisi Srikandi
  srikandiDispositionNumber?: string;
  
  // Metadata
  overdueNotifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: UserMini;
}

// =======================
// 📌 Create Request Types - DIPERBAIKI
// =======================
export interface CreateIncomingLetterRequest {
  letterNumber: string;
  letterDate?: string;
  letterNature?: LetterNature;
  subject: string;
  sender: string;
  recipient: string;
  processor: string;
  note?: string;
  receivedDate: string;
  isInvitation?: boolean;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  eventNotes?: string;
  needsFollowUp?: boolean;
  followUpDeadline?: string;
  
  // ✅ DIPERBAIKI: Metode pengolahan
  processingMethod: ProcessingMethod;
  
  // ✅ DIPERBAIKI: Target disposisi
  dispositionTarget?: DispositionTarget;
  
  // ✅ DIPERBAIKI: Nomor disposisi Srikandi
  srikandiDispositionNumber?: string;
  
  file?: File | Blob;
}

export interface CreateOutgoingLetterRequest {
  createdDate: string;
  letterDate: string;
  letterNumber: string;
  letterNature?: LetterNature;
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
  executionDate?: string;
  classificationCode?: string;
  serialNumber?: number;
  securityClass?: SecurityClass;
  
  // ✅ DIPERBAIKI: Metode pengolahan untuk surat keluar
  processingMethod: ProcessingMethod;
  
  // ✅ DIPERBAIKI: Nomor disposisi Srikandi
  srikandiDispositionNumber?: string;
  
  file?: File | Blob;
}

// =======================
// 📌 Update Request Types - DITAMBAHKAN
// =======================
export interface UpdateIncomingLetterRequest {
  letterNumber?: string;
  letterDate?: string;
  letterNature?: LetterNature;
  subject?: string;
  sender?: string;
  recipient?: string;
  processor?: string;
  note?: string;
  receivedDate?: string;
  isInvitation?: boolean;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  eventNotes?: string;
  needsFollowUp?: boolean;
  followUpDeadline?: string;
  processingMethod?: ProcessingMethod;
  dispositionTarget?: DispositionTarget;
  srikandiDispositionNumber?: string;
  file?: File | Blob;
}

export interface UpdateOutgoingLetterRequest {
  createdDate?: string;
  letterDate?: string;
  letterNumber?: string;
  letterNature?: LetterNature;
  subject?: string;
  sender?: string;
  recipient?: string;
  processor?: string;
  note?: string;
  isInvitation?: boolean;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  eventNotes?: string;
  executionDate?: string;
  classificationCode?: string;
  serialNumber?: number;
  securityClass?: SecurityClass;
  processingMethod?: ProcessingMethod;
  srikandiDispositionNumber?: string;
  file?: File | Blob;
}

// =======================
// 📌 Pagination
// =======================
export interface Pagination {
  current: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginationResponse<T> {
  letters: T[];
  pagination: Pagination;
}

// =======================
// 📌 Calendar Event Types - DIPERBAIKI
// =======================
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  location?: string;
  type: EventType;
  
  // Relasi ke surat
  incomingLetterId?: string;
  outgoingLetterId?: string;
  incomingLetter?: {
    id: string;
    letterNumber: string;
    subject: string;
  };
  outgoingLetter?: {
    id: string;
    letterNumber: string;
    subject: string;
  };
  
  // Metadata
  userId: string;
  user: UserMini;
  notified3Days: boolean;
  notified1Day: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalendarEventRequest {
  title: string;
  description?: string;
  date: string;
  time?: string;
  location?: string;
  type?: EventType;
  incomingLetterId?: string;
  outgoingLetterId?: string;
}

export interface CalendarResponse {
  events: CalendarEvent[];
  pagination: Pagination;
}

// =======================
// 📌 Notification Types - DIPERBAIKI
// =======================
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  
  // Relasi
  userId?: string;
  calendarEventId?: string;
  calendarEvent?: {
    id: string;
    title: string;
    date: string;
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: Pagination;
  unreadCount: number;
}

// =======================
// 📌 Filter & Search Types - DITAMBAHKAN
// =======================
export interface LetterFilters {
  nature?: LetterNature;
  processingMethod?: ProcessingMethod;
  dispositionTarget?: DispositionTarget;
  needsFollowUp?: boolean;
  isInvitation?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface SearchLettersRequest {
  query?: string;
  filters?: LetterFilters;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// =======================
// 📌 Dashboard Stats Types - DITAMBAHKAN
// =======================
export interface DashboardStats {
  totalIncoming: number;
  totalOutgoing: number;
  pendingFollowUp: number;
  todayEvents: number;
  recentIncoming: IncomingLetter[];
  recentOutgoing: OutgoingLetter[];
  upcomingEvents: CalendarEvent[];
}

// =======================
// 📌 Export Types - DITAMBAHKAN
// =======================
export interface ExportRequest {
  type: 'incoming' | 'outgoing';
  format: 'excel' | 'pdf';
  filters?: LetterFilters;
  dateRange?: {
    start: string;
    end: string;
  };
}

// =======================
// 📌 Utility Types
// =======================

// Type untuk form data dengan file
export type FormDataWithFile = {
  [key: string]: string | number | boolean | File | Blob | null | undefined;
};

// Type untuk select options
export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

// Predefined options untuk dropdowns
export const PROCESSING_METHOD_OPTIONS: SelectOption[] = [
  { value: 'MANUAL', label: 'Manual', description: 'Diproses secara manual' },
  { value: 'SRIKANDI', label: 'Srikandi', description: 'Diproses melalui sistem Srikandi' },
];

export const DISPOSITION_TARGET_OPTIONS: SelectOption[] = [
  { value: 'UMPEG', label: 'UMPEG' },
  { value: 'PERENCANAAN', label: 'Perencanaan' },
  { value: 'KAUR_KEUANGAN', label: 'Kaur Keuangan' },
  { value: 'KABID', label: 'Kabid' },
  { value: 'BIDANG1', label: 'Bidang 1' },
  { value: 'BIDANG2', label: 'Bidang 2' },
  { value: 'BIDANG3', label: 'Bidang 3' },
  { value: 'BIDANG4', label: 'Bidang 4' },
  { value: 'BIDANG5', label: 'Bidang 5' },
];

export const LETTER_NATURE_OPTIONS: SelectOption[] = [
  { value: 'BIASA', label: 'Biasa' },
  { value: 'PENTING', label: 'Penting' },
  { value: 'TERBATAS', label: 'Terbatas' },
  { value: 'RAHASIA', label: 'Rahasia' },
  { value: 'SANGAT_RAHASIA', label: 'Sangat Rahasia' },
];

// =======================
// 📌 Response Types
// =======================
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: any;
}
// --- END OF FILE types.ts ---