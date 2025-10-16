// frontend/src/pages/letters/outgoing/index.tsx

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Calendar,
  FileText,
  User,
  Clock
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOutgoingLetters, useDeleteOutgoingLetter } from '@/hooks/useApi';
import Layout from '@/components/Layout/Layout';
import { formatDate } from '@/lib/utils';
import type { OutgoingLetter } from '@/types';
import { toast } from 'react-hot-toast';

// Objek untuk styling dan label sifat surat
const natureStyles = {
  BIASA: { label: "Biasa", className: "border-gray-300 bg-gray-100 text-gray-800" },
  PENTING: { label: "Penting", className: "border-blue-300 bg-blue-100 text-blue-800" },
  TERBATAS: { label: "Terbatas", className: "border-yellow-300 bg-yellow-100 text-yellow-800" },
  RAHASIA: { label: "Rahasia", className: "border-red-300 bg-red-100 text-red-800" },
  SANGAT_RAHASIA: { label: "Sangat Rahasia", className: "border-red-400 bg-red-200 text-red-900 font-bold" },
};

export default function OutgoingLettersPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);

  const { data, isLoading } = useOutgoingLetters({
    page: currentPage,
    limit: 9, 
    search: searchQuery || undefined,
    category: categoryFilter || undefined,
  });

  const deleteLetterMutation = useDeleteOutgoingLetter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); 
  };
  
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  const handleDelete = (id: string) => {
    toast.promise(
      deleteLetterMutation.mutateAsync(id),
      {
        loading: 'Menghapus surat...',
        success: 'Surat berhasil dihapus.',
        error: 'Gagal menghapus surat.',
      }
    ).finally(() => setShowConfirmDelete(null));
  };

  const handleDownload = (letter: OutgoingLetter, e: React.MouseEvent) => {
    e.stopPropagation();
    if (letter.filePath) {
      const baseURL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
      window.open(`${baseURL}/${letter.filePath}`, '_blank');
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) return null;

  const letters = data?.letters ?? [];
  const pagination = data?.pagination;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header dengan tema biru */}
        <div className="bg-gradient-to-r from-blue-600 to-sky-600 rounded-2xl shadow-lg p-8 text-white">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">Surat Keluar</h1>
              <p className="text-blue-100">Kelola dan lacak surat keluar organisasi Anda.</p>
            </div>
            <Link
              href="/letters/outgoing/create"
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-transform hover:scale-105 shadow-lg font-semibold"
            >
              <Plus className="h-5 w-5" />
              <span>Tambah Surat</span>
            </Link>
          </div>
        </div>

        {/* Search dan Filters */}
        <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-grow w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan nomor, subjek, atau penerima..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="w-full sm:w-48 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 transition-all"
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">Semua Sifat</option>
              {Object.entries(natureStyles).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
          </form>
        </div>

        {/* Grid Kartu Surat */}
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-md p-5 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-6 bg-gray-300 rounded w-1/2 mb-6"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : letters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* ✅ PERBAIKAN DI SINI: Menambahkan tipe OutgoingLetter */}
              {letters.map((letter: OutgoingLetter) => {
                const nature = natureStyles[letter.letterNature] || natureStyles.BIASA;
                return (
                  <Link href={`/letters/outgoing/${letter.id}`} key={letter.id} className="block group">
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-xl hover:border-blue-500 transition-all duration-300 flex flex-col h-full">
                      <div className="p-5 border-b border-gray-200">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-blue-700 truncate">{letter.letterNumber}</p>
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${nature.className}`}>
                            {nature.label}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mt-2 truncate group-hover:text-blue-600 transition-colors">
                          {letter.subject}
                        </h3>
                      </div>
                      <div className="p-5 flex-grow space-y-3 text-sm">
                        <div className="flex items-center gap-3 text-gray-600">
                          <User className="h-4 w-4 flex-shrink-0 text-gray-400" />
                          <span className="font-medium">Kepada: {letter.recipient}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                          <Clock className="h-4 w-4 flex-shrink-0 text-gray-400" />
                          <span>Tgl Surat: {formatDate(letter.letterDate)}</span>
                        </div>
                        {letter.isInvitation && letter.eventDate && (
                          <div className="flex items-center gap-3 text-purple-700">
                            <Calendar className="h-4 w-4 flex-shrink-0 text-purple-400" />
                            <span className="font-semibold">Acara: {formatDate(letter.eventDate)}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4 bg-gray-50/70 rounded-b-2xl mt-auto">
                        <div className="flex items-center justify-between">
                          <div>
                            {letter.fileName ? (
                              <button
                                onClick={(e) => handleDownload(letter, e)}
                                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
                              >
                                <FileText className="h-4 w-4" />
                                <span>Lihat File</span>
                              </button>
                            ) : (
                              <span className="text-sm text-gray-400">Tidak ada file</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1" onClick={stopPropagation}>
                            {(user?.role === 'ADMIN' || letter.userId === user?.id) && (
                              <>
                                <Link href={`/letters/outgoing/${letter.id}/edit`} className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Edit">
                                  <Edit className="h-4 w-4" />
                                </Link>
                                <button onClick={() => setShowConfirmDelete(letter.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Hapus">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-12 bg-white rounded-2xl shadow-md border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Surat Tidak Ditemukan</h3>
              <p className="text-gray-600">Tidak ada surat yang cocok dengan kriteria pencarian Anda.</p>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Halaman <span className="font-semibold">{pagination.current}</span> dari <span className="font-semibold">{pagination.pages}</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Sebelumnya
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                  disabled={currentPage >= pagination.pages}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Konfirmasi Hapus */}
        {showConfirmDelete && (
          <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-fade-in">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Konfirmasi Hapus</h3>
                  <p className="text-gray-600 text-sm">
                    Apakah Anda yakin ingin menghapus surat ini? Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowConfirmDelete(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDelete(showConfirmDelete)}
                  disabled={deleteLetterMutation.isLoading}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                  {deleteLetterMutation.isLoading ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}