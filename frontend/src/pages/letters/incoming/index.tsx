import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Download, 
  Eye,
  Calendar,
  FileText
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIncomingLetters, useDeleteIncomingLetter } from '@/hooks/useApi';
import Layout from '@/components/Layout/Layout';
import { formatDate } from '@/lib/utils';
import { IncomingLetter, LetterCategory } from '@/types';

const natureColors = {
  BIASA: 'bg-gray-100 text-gray-800',
  TERBATAS: 'bg-yellow-100 text-yellow-800',
  RAHASIA: 'bg-red-100 text-red-800',
  SANGAT_RAHASIA: 'bg-red-200 text-red-900',
  PENTING: 'bg-orange-100 text-orange-800',
};

const natureLabels = {
  BIASA: 'Biasa',
  TERBATAS: 'Terbatas',
  RAHASIA: 'Rahasia',
  SANGAT_RAHASIA: 'Sangat Rahasia',
  PENTING: 'Penting',
};

export default function IncomingLettersPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);

  const { data, isLoading, error } = useIncomingLetters({
    page: currentPage,
    limit: 10,
    search: searchQuery || undefined,
    category: categoryFilter || undefined,
  });

  const deleteLetterMutation = useDeleteIncomingLetter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLetterMutation.mutateAsync(id);
      setShowConfirmDelete(null);
    } catch (error) {
      console.error('Failed to delete letter:', error);
    }
  };

  const handleDownload = (letter: IncomingLetter) => {
    if (letter.filePath) {
      const baseURL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
      window.open(`${baseURL}/uploads/${letter.fileName}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const letters = data?.letters || [];
  const pagination = data?.pagination;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2">Surat Masuk</h1>
              <p className="text-emerald-100">Kelola dan pantau surat masuk organisasi Anda</p>
            </div>
            <Link
              href="/letters/incoming/create"
              className="flex items-center gap-2 px-6 py-3 bg-white text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
            >
              <Plus className="h-5 w-5" />
              <span>Tambah Surat</span>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nomor surat, subjek, atau pengirim..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="sm:w-56">
              <select
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 transition-all"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">Semua Kategori</option>
                <option value="BIASA">Biasa</option>
                <option value="TERBATAS">Terbatas</option>
                <option value="RAHASIA">Rahasia</option>
                <option value="SANGAT_RAHASIA">Sangat Rahasia</option>
                <option value="PENTING">Penting</option>
              </select>
            </div>

            <button
              type="submit"
              className="flex items-center justify-center px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
            >
              <Search className="h-5 w-5 mr-2" />
              Cari
            </button>
          </form>
        </div>

        {/* Letters Table */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Memuat data surat...</p>
            </div>
          ) : letters.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Informasi Surat
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Pengirim
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        File
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {letters.map((letter: IncomingLetter) => (
                      <tr key={letter.id} className="hover:bg-emerald-50/50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-semibold text-gray-900 mb-1">
                              {letter.letterNumber}
                            </div>
                            <div className="text-sm text-gray-600 line-clamp-2">
                              {letter.subject}
                            </div>
                            {letter.isInvitation && letter.eventDate && (
                              <div className="flex items-center gap-1 text-xs text-purple-600 mt-2 bg-purple-50 px-2 py-1 rounded-md inline-flex">
                                <Calendar className="h-3 w-3" />
                                <span className="font-medium">Acara: {formatDate(letter.eventDate)}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {letter.sender}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                natureColors[
                                  letter.letterNature as keyof typeof natureColors
                                ] || natureColors.BIASA
                              }`}
                            >
                              {natureLabels[
                                letter.letterNature as keyof typeof natureLabels
                              ] || letter.letterNature}
                            </span>
                            {letter.isInvitation && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-100 text-purple-800">
                                Undangan
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {formatDate(letter.receivedDate)}
                        </td>
                        <td className="px-6 py-4">
                          {letter.fileName ? (
                            <button
                              onClick={() => handleDownload(letter)}
                              className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                            >
                              <FileText className="h-4 w-4" />
                              <span className="line-clamp-1">{letter.fileName}</span>
                            </button>
                          ) : (
                            <span className="text-sm text-gray-400">Tidak ada file</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/letters/incoming/${letter.id}`}
                              className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              title="Lihat Detail"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            {(user?.role === 'ADMIN' || letter.userId === user?.id) && (
                              <>
                                <Link
                                  href={`/letters/incoming/${letter.id}/edit`}
                                  className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all"
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </Link>
                                <button
                                  onClick={() => setShowConfirmDelete(letter.id)}
                                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Hapus"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Menampilkan <span className="font-semibold">{((pagination.current - 1) * pagination.limit) + 1}</span> sampai{' '}
                      <span className="font-semibold">{Math.min(pagination.current * pagination.limit, pagination.total)}</span> dari{' '}
                      <span className="font-semibold">{pagination.total}</span> hasil
                    </div>
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
                        className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Berikutnya
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada surat masuk</h3>
              <p className="text-gray-600 mb-6">
                Mulai dengan menambahkan surat masuk pertama Anda.
              </p>
              <Link
                href="/letters/incoming/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
              >
                <Plus className="h-5 w-5" />
                Tambah Surat Masuk
              </Link>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showConfirmDelete && (
          <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-fade-in">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Konfirmasi Hapus
                  </h3>
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