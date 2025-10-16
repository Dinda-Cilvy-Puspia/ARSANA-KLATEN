// frontend/src/pages/letters/outgoing/[id]/index.tsx

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  ArrowLeft, Edit, Trash2, Calendar, Send, User, Tag, MapPin, Clock, Info, FileText, Shield, Hash, AlertTriangle 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOutgoingLetter, useDeleteOutgoingLetter } from '@/hooks/useApi';
import Layout from '@/components/Layout/Layout';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';

const natureStyles = {
  BIASA: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', label: 'Biasa' },
  TERBATAS: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', label: 'Terbatas' },
  RAHASIA: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', label: 'Rahasia' },
  SANGAT_RAHASIA: { bg: 'bg-red-200', text: 'text-red-900', border: 'border-red-300', label: 'Sangat Rahasia' },
  PENTING: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', label: 'Penting' },
};

const DetailItem = ({ icon: Icon, label, children }: { icon: React.ElementType, label: string, children: React.ReactNode }) => (
  <div className="group">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-2">
      <Icon className="h-4 w-4 text-blue-600" />
      {label}
    </label>
    <div className="text-base text-gray-900 font-medium pl-6">
      {children || <span className="text-gray-400 font-normal">Tidak ada data</span>}
    </div>
  </div>
);

export default function OutgoingLetterDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const { data: letter, isLoading, error } = useOutgoingLetter(id as string);
  const deleteLetterMutation = useDeleteOutgoingLetter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleDelete = () => {
    if (!letter) return;
    toast.promise(
      deleteLetterMutation.mutateAsync(letter.id),
      {
        loading: 'Menghapus surat...',
        success: () => {
          router.push('/letters/outgoing');
          return 'Surat berhasil dihapus.';
        },
        error: 'Gagal menghapus surat.',
      }
    ).finally(() => setShowDeleteConfirm(false));
  };

  const handleDownload = () => {
    if (letter?.filePath) {
      const baseURL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
      window.open(`${baseURL}/${letter.filePath}`, '_blank');
    }
  };

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-600">Memuat detail surat...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !letter) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Surat Tidak Ditemukan</h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">Surat yang Anda cari mungkin telah dihapus atau tidak ada.</p>
          <Link href="/letters/outgoing" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-md">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Daftar Surat
          </Link>
        </div>
      </Layout>
    );
  }

  const natureStyle = natureStyles[letter.letterNature] || natureStyles.BIASA;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-sky-600 rounded-2xl shadow-lg p-8">
          <Link href="/letters/outgoing" className="inline-flex items-center gap-2 text-sm font-medium text-white hover:text-blue-100 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Surat Keluar
          </Link>
          <div className="md:flex md:items-start md:justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${natureStyle.bg} ${natureStyle.text} border ${natureStyle.border}`}>{natureStyle.label}</span>
                {letter.isInvitation && (<span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">Undangan</span>)}
              </div>
              <h1 className="text-3xl font-bold text-white mb-2 leading-tight">{letter.subject}</h1>
              <p className="text-sm text-blue-100">Nomor: <span className="font-semibold text-white">{letter.letterNumber}</span></p>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              {(user?.role === 'ADMIN' || letter.userId === user?.id) && (
                <>
                  <Link href={`/letters/outgoing/${letter.id}/edit`} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 rounded-xl shadow-md hover:shadow-lg transition-all font-medium">
                    <Edit className="h-4 w-4" />
                    Edit
                  </Link>
                  <button onClick={() => setShowDeleteConfirm(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl shadow-md hover:shadow-lg hover:bg-red-700 transition-all font-medium">
                    <Trash2 className="h-4 w-4" />
                    Hapus
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-sky-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Send className="h-5 w-5 text-blue-600" />Informasi Surat</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailItem icon={Clock} label="Tanggal Pembuatan">{formatDate(letter.createdDate)}</DetailItem>
                  <DetailItem icon={Clock} label="Tanggal Surat">{formatDate(letter.letterDate)}</DetailItem>
                  <DetailItem icon={Clock} label="Tanggal Pelaksanaan">{letter.executionDate ? formatDate(letter.executionDate) : null}</DetailItem>
                  <DetailItem icon={User} label="Pengirim">{letter.sender}</DetailItem>
                  <DetailItem icon={User} label="Penerima">{letter.recipient}</DetailItem>
                  <DetailItem icon={User} label="Pengolah">{letter.processor}</DetailItem>
                  <DetailItem icon={Shield} label="Klasifikasi Keamanan">{letter.securityClass}</DetailItem>
                  <DetailItem icon={Hash} label="Kode Klasifikasi">{letter.classificationCode}</DetailItem>
                  <DetailItem icon={Hash} label="Nomor Urut">{letter.serialNumber}</DetailItem>
                </div>
                {letter.note && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-3"><Info className="h-4 w-4 text-blue-600" />Catatan</label>
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl text-gray-800 whitespace-pre-wrap text-sm leading-relaxed border border-gray-200">{letter.note}</div>
                  </div>
                )}
              </div>
            </div>

            {letter.isInvitation && (
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Calendar className="h-5 w-5 text-purple-600" />Informasi Acara</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {letter.eventDate && (<DetailItem icon={Calendar} label="Tanggal Acara">{formatDate(letter.eventDate)}</DetailItem>)}
                    {letter.eventTime && (<DetailItem icon={Clock} label="Waktu Acara">{letter.eventTime}</DetailItem>)}
                    {letter.eventLocation && (<DetailItem icon={MapPin} label="Lokasi Acara">{letter.eventLocation}</DetailItem>)}
                  </div>
                  {letter.eventNotes && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-3"><Info className="h-4 w-4 text-purple-600" />Catatan Acara</label>
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl text-gray-800 whitespace-pre-wrap text-sm leading-relaxed border border-purple-200">{letter.eventNotes}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><FileText className="h-5 w-5 text-yellow-600" />File Lampiran</h3>
              </div>
              <div className="p-6">
                {letter.fileName ? (
                  <button onClick={handleDownload} className="w-full flex items-center gap-3 text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                    <FileText className="h-8 w-8 text-blue-500 flex-shrink-0" />
                    <div className="truncate"><p className="text-sm font-medium text-blue-900 truncate">{letter.fileName}</p><p className="text-xs text-blue-600">Klik untuk melihat/mengunduh</p></div>
                  </button>
                ) : (
                  <div className="text-center p-4 bg-gray-50 rounded-lg"><p className="text-sm text-gray-500">Tidak ada file yang dilampirkan.</p></div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Metadata</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100"><span className="text-sm text-gray-600 font-medium">Dibuat oleh</span><span className="text-sm font-semibold text-gray-900">{letter.user.name}</span></div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100"><span className="text-sm text-gray-600 font-medium">Tanggal dibuat</span><span className="text-sm font-semibold text-gray-900">{formatDate(letter.createdAt, true)}</span></div>
                <div className="flex justify-between items-center"><span className="text-sm text-gray-600 font-medium">Terakhir diubah</span><span className="text-sm font-semibold text-gray-900">{formatDate(letter.updatedAt, true)}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-fade-in">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Surat</h3>
                  <p className="text-sm text-gray-600">Apakah Anda yakin ingin menghapus surat "<span className="font-semibold">{letter.subject}</span>"? Tindakan ini tidak dapat dibatalkan.</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium">Batal</button>
                <button onClick={handleDelete} disabled={deleteLetterMutation.isLoading} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium">{deleteLetterMutation.isLoading ? 'Menghapus...' : 'Ya, Hapus'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}