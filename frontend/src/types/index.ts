// --- START OF FILE types.ts ---
// =======================
// 📌 Union Types
// =======================
export type Role = 'ADMIN' | 'STAFF';
export type LetterCategory = 'GENERAL' | 'INVITATION' | 'OFFICIAL' | 'ANNOUNCEMENT';
export type LetterNature = 'BIASA' | 'TERBATAS' | 'RAHASIA' | 'SANGAT_RAHASIA' | 'PENTING';
export type SecurityClass = 'BIASA' ;
export type DispositionMethodType = 'MANUAL' | 'SRIKANDI'; // Metode disposisi
export type DispositionType =
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
// 📌 Letter Types
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
  // 🔽 tambahan baru sesuai schema
  needsFollowUp: boolean;
  followUpDeadline?: string;
  dispositionMethod?: DispositionMethodType;
  srikandiDispositionNumber?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: UserMini;
  dispositions?: Disposition[];
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
  // 🔽 tambahan baru
  dispositionMethod?: DispositionMethodType;
  srikandiDispositionNumber?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: UserMini;
}

// =======================
// 📌 Create Request Types
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
  dispositionMethod?: DispositionMethodType;
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
  // 🔽 tambahan baru
  dispositionMethod?: DispositionMethodType;
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
// 📌 Disposition
// =======================
export interface Disposition {
  id: string;
  incomingLetterId: string;
  incomingLetter?: {
    id: string;
    letterNumber: string;
    subject: string;
  };
  dispositionTo: DispositionType;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDispositionRequest {
  incomingLetterId: string;
  dispositionTo: DispositionType;
  notes?: string;
}

// =======================
// 📌 Notification
// =======================
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: Pagination;
  unreadCount: number;
}

// =======================
// 📌 Calendar
// =======================
export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  location?: string;
  type: 'incoming' | 'outgoing';
  letterNumber: string;
  description?: string;
}

export interface CalendarResponse {
  events: CalendarEvent[];
}
// --- END OF FILE types.ts ---
