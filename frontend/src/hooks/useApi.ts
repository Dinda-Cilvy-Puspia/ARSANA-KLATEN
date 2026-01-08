// frontend/src/hooks/useApi.ts

import { useQuery, useMutation, useQueryClient, type QueryKey } from 'react-query';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api';
import type { 
  IncomingLetter, 
  OutgoingLetter, 
} from '@/types';

// Definisikan tipe untuk error API agar lebih aman
interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

// ============================================================================
// Generic Mutation Hook (Sudah Baik)
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
  return useQuery(['incomingLetter', id], 
    // ✅ PERBAIKAN UTAMA DI SINI: Langsung ekstrak `data` dari response
    () => apiClient.getIncomingLetterById(id!).then(response => response.data), 
    {
      enabled: !!id,
    }
  );
};

export const useCreateIncomingLetter = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (formData: FormData) => apiClient.createIncomingLetter(formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['incomingLetters']);
        // Tidak perlu toast di sini, karena sudah ditangani di komponen
      },
      onError: (error: ApiError) => {
        const message = error.response?.data?.error || 'Gagal membuat surat masuk';
        toast.error(message);
      },
    }
  );
};

export const useUpdateIncomingLetter = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ id, formData }: { id: string; formData: FormData }) => apiClient.updateIncomingLetter(id, formData),
    {
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries(['incomingLetters']);
        queryClient.invalidateQueries(['incomingLetter', id]);
        // Toast sudah ditangani oleh `toast.promise` di komponen, jadi tidak perlu di sini
      },
      onError: (error: ApiError) => {
        const message = error.response?.data?.error || 'Gagal memperbarui surat masuk';
        // Biarkan `toast.promise` di komponen yang menangani pesan error
        throw new Error(message);
      },
    }
  );
};

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
      // Toast sudah ditangani di komponen
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

export const useOutgoingLetter = (id?: string) => {
  return useQuery(['outgoingLetter', id],
    // ✅ PERBAIKAN DI SINI
    () => apiClient.getOutgoingLetterById(id!).then(response => response.data),
    {
      enabled: !!id,
    }
  );
};

export const useCreateOutgoingLetter = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (formData: FormData) => apiClient.createOutgoingLetter(formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['outgoingLetters']);
        // Toast akan ditangani di komponen
      },
      onError: (error: ApiError) => {
        const message = error.response?.data?.error || 'Gagal membuat surat keluar';
        toast.error(message);
      },
    }
  );
};

export const useUpdateOutgoingLetter = () => {
  const queryClient = useQueryClient();

  return useMutation(
    // ✅ PERBAIKAN DI SINI: Menerima { id, formData }
    ({ id, formData }: { id: string; formData: FormData }) => apiClient.updateOutgoingLetter(id, formData),
    {
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries(['outgoingLetters']);
        queryClient.invalidateQueries(['outgoingLetter', id]);
        // Toast akan ditangani oleh toast.promise di komponen
      },
      onError: (error: ApiError) => {
        const message = error.response?.data?.error || 'Gagal memperbarui surat keluar';
        // Biarkan toast.promise di komponen yang menangani error
        throw new Error(message);
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


// ...// ============================================================================

export const useFileInfo = (params: { id?: string; type?: 'incoming' | 'outgoing' }) => {
  const { id, type } = params;
  return useQuery(
    ['fileInfo', type, id],
    () => apiClient.getFileInfo(id!, type!),
    {
      enabled: !!id && !!type,
      staleTime: 5 * 60 * 1000,
      retry: false,
    }
  );
};

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
  return useApiMutation<any, void>(
    (_?: void) => apiClient.markAllNotificationsAsRead(),
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