// Lokasi: src/hooks/useApi.ts

import { useQuery, useMutation, useQueryClient, QueryKey } from 'react-query';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api';
import { 
  IncomingLetter, 
  OutgoingLetter, 
  CreateIncomingLetterRequest,
  CreateOutgoingLetterRequest
} from '@/types';

// Fungsi createFormData tidak lagi digunakan di file ini
// import { createFormData } from '@/lib/utils';

// Definisikan tipe untuk error API agar lebih aman
interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

// ============================================================================
// Generic Mutation Hook (Tidak Berubah, sudah baik)
// ============================================================================
const useApiMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  queryKeyToInvalidate: QueryKey,
  successMsg: string,
  errorMsg: string
) => {
  const queryClient = useQueryClient();

  return useMutation(mutationFn, {
    onSuccess: () => {
      queryClient.invalidateQueries(queryKeyToInvalidate);
      toast.success(successMsg);
    },
    onError: (error: ApiError) => {
      const message = error.response?.data?.error || errorMsg;
      toast.error(message);
    },
  });
};

// ============================================================================
// Hooks Surat Masuk (Incoming Letters)
// ============================================================================

export const useIncomingLetters = (params?: { page?: number; limit?: number; search?: string; category?: string; }) => {
  return useQuery(['incomingLetters', params], () => apiClient.getIncomingLetters(params), {
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
  });
};

export const useIncomingLetter = (id?: string) => {
  return useQuery(['incomingLetter', id], () => apiClient.getIncomingLetterById(id!), {
    enabled: !!id,
  });
};

// --- PERBAIKAN ---
// Hook sekarang secara eksplisit menerima FormData
export const useCreateIncomingLetter = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (formData: FormData) => apiClient.createIncomingLetter(formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['incomingLetters']);
        toast.success('Surat masuk berhasil dibuat');
      },
      onError: (error: ApiError) => {
        const message = error.response?.data?.error || 'Gagal membuat surat masuk';
        toast.error(message);
      },
    }
  );
};

// --- PERBAIKAN ---
// Hook update juga menerima FormData
export const useUpdateIncomingLetter = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ id, formData }: { id: string; formData: FormData }) => apiClient.updateIncomingLetter(id, formData),
    {
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries(['incomingLetters']);
        queryClient.invalidateQueries(['incomingLetter', id]);
        toast.success('Surat masuk berhasil diperbarui');
      },
      onError: (error: ApiError) => {
        const message = error.response?.data?.error || 'Gagal memperbarui surat masuk';
        toast.error(message);
      },
    }
  );
};

// Optimistic Update (Tidak Berubah, sudah baik)
export const useDeleteIncomingLetter = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (id: string) => apiClient.deleteIncomingLetter(id), {
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries(['incomingLetters']);
      const previousLetters = queryClient.getQueryData<any>(['incomingLetters']);
      
      queryClient.setQueryData(['incomingLetters'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          letters: oldData.letters.filter((letter: IncomingLetter) => letter.id !== deletedId),
        };
      });
      return { previousLetters };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousLetters) {
        queryClient.setQueryData(['incomingLetters'], context.previousLetters);
      }
      toast.error('Gagal menghapus surat masuk');
    },
    onSettled: () => {
      queryClient.invalidateQueries(['incomingLetters']);
    },
  });
};

// ============================================================================
// Hooks Surat Keluar (Outgoing Letters)
// ============================================================================

export const useOutgoingLetters = (params?: { page?: number; limit?: number; search?: string; category?: string; }) => {
  return useQuery(['outgoingLetters', params], () => apiClient.getOutgoingLetters(params), {
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
  });
};

export const useOutgoingLetter = (id: string) => {
  return useQuery(['outgoingLetter', id], () => apiClient.getOutgoingLetterById(id), {
    enabled: !!id,
  });
};

// --- PERBAIKAN ---
// Menerapkan pola yang sama untuk Surat Keluar
export const useCreateOutgoingLetter = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (formData: FormData) => apiClient.createOutgoingLetter(formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['outgoingLetters']);
        toast.success('Surat keluar berhasil dibuat');
      },
      onError: (error: ApiError) => {
        const message = error.response?.data?.error || 'Gagal membuat surat keluar';
        toast.error(message);
      },
    }
  );
};

// --- PERBAIKAN ---
// Menerapkan pola yang sama untuk Surat Keluar
export const useUpdateOutgoingLetter = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ id, formData }: { id: string; formData: FormData }) => apiClient.updateOutgoingLetter(id, formData),
    {
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries(['outgoingLetters']);
        queryClient.invalidateQueries(['outgoingLetter', id]);
        toast.success('Surat keluar berhasil diperbarui');
      },
      onError: (error: ApiError) => {
        const message = error.response?.data?.error || 'Gagal memperbarui surat keluar';
        toast.error(message);
      },
    }
  );
};

export const useDeleteOutgoingLetter = () => {
  return useApiMutation(
    (id: string) => apiClient.deleteOutgoingLetter(id),
    ['outgoingLetters'],
    'Surat keluar berhasil dihapus',
    'Gagal menghapus surat keluar'
  );
};

// ============================================================================
// Hooks untuk File
// ============================================================================

// --- TAMBAHKAN HOOK BARU INI ---
export const useFileInfo = (params: { id?: string; type?: 'incoming' | 'outgoing' }) => {
  const { id, type } = params;
  return useQuery(
    ['fileInfo', type, id], // Query key yang unik
    () => apiClient.getFileInfo(id!, type!),
    {
      enabled: !!id && !!type, // Hanya aktif jika id dan type ada
      staleTime: 5 * 60 * 1000, // Cache selama 5 menit
      retry: false, // Jangan coba lagi jika 404 (file tidak ditemukan)
    }
  );
};

// ============================================================================
// Hooks Notifikasi & Kalender (Tidak Berubah)
// ============================================================================
// (Sisa kode Anda dari sini ke bawah sudah baik dan tidak perlu diubah)

export const useNotifications = (params?: { page?: number; limit?: number; unreadOnly?: boolean; }) => {
  return useQuery(['notifications', params], () => apiClient.getNotifications(params), {
    refetchInterval: 30000,
  });
};

export const useMarkNotificationAsRead = () => {
  return useApiMutation(
    (id: string) => apiClient.markNotificationAsRead(id),
    ['notifications'],
    'Notifikasi ditandai telah dibaca',
    'Gagal menandai notifikasi'
  );
};

export const useMarkAllNotificationsAsRead = () => {
  return useApiMutation(
    () => apiClient.markAllNotificationsAsRead(),
    ['notifications'],
    'Semua notifikasi ditandai telah dibaca',
    'Gagal menandai semua notifikasi'
  );
};

export const useCalendarEvents = (params?: { start?: string; end?: string }) => {
  return useQuery(['calendarEvents', params], () => apiClient.getCalendarEvents(params), {
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpcomingEvents = (params?: { limit?: number }) => {
  return useQuery(['upcomingEvents', params], () => apiClient.getUpcomingEvents(params), {
    staleTime: 2 * 60 * 1000,
  });
};