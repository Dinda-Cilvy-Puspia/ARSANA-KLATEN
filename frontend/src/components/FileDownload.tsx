import React, { useState } from 'react';
import apiClient from '@/lib/api'; 
import { useFileInfo } from '@/hooks/useApi';
import { Download, Eye, AlertCircle, Loader2 } from 'lucide-react';
import { filesize } from 'filesize';
import { toast } from 'react-hot-toast';

// [DISARANKAN] Jadikan letterId sebagai prop wajib
interface FileDownloadProps {
  letterId: string;
  letterType: 'incoming' | 'outgoing';
}

const FileDownload: React.FC<FileDownloadProps> = ({ letterId, letterType }) => {
  const { data, isLoading, isError } = useFileInfo({ id: letterId, type: letterType });
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const handleDownload = async () => {
    if (!letterId) return;
    setIsDownloading(true);
    toast.loading('Mempersiapkan file untuk di-download...');

    try {
      const response = await apiClient.downloadFile(letterType, letterId);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // [DIUBAH] Langsung gunakan nama file dari hook useFileInfo
      link.setAttribute('download', data?.fileInfo?.fileName || 'downloaded-file');
      
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success('File berhasil di-download!');

    } catch (error) {
      // [DIUBAH] Tambahkan toast.dismiss() saat terjadi error
      toast.dismiss();
      toast.error('Gagal men-download file.');
      console.error("Download error:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreview = async () => {
    if (!letterId) return;
    setIsPreviewing(true);
    
    try {
      const response = await apiClient.previewFile(letterType, letterId);
      const fileBlob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(fileBlob);
      window.open(url, '_blank', 'noopener,noreferrer');

    } catch (error) {
      toast.error('Gagal membuka preview file.');
      console.error("Preview error:", error);
    } finally {
      setIsPreviewing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        Mengecek file...
      </div>
    );
  }

  if (isError || !data?.exists) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
        <AlertCircle className="h-5 w-5 text-gray-400" />
        Tidak ada file lampiran.
      </div>
    );
  }

  const { fileInfo } = data;

  return (
    <div className="space-y-4">
      <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
        <p className="font-bold text-gray-800 break-all">{fileInfo.fileName}</p>
        <p className="text-sm text-gray-500">
          {filesize(fileInfo.fileSize)} - {fileInfo.mimeType}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-emerald-600 text-white rounded-xl shadow-sm hover:bg-emerald-700 transition-all font-medium disabled:opacity-60"
        >
          {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {isDownloading ? 'Downloading...' : 'Download'}
        </button>
        
        {fileInfo.isViewable && (
          <button
            onClick={handlePreview}
            disabled={isPreviewing}
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white text-gray-700 rounded-xl shadow-sm border border-gray-300 hover:bg-gray-50 transition-all font-medium disabled:opacity-60"
          >
            {isPreviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            Preview
          </button>
        )}
      </div>
    </div>
  );
};

export default FileDownload;