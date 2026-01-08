# Rencana Perbaikan Bug - ARSANA KLATEN

## Status: 16 Error TypeScript di Frontend

### Ringkasan Error
Ditemukan **16 errors TypeScript** dalam **5 files**:

| File | Jumlah Error | Tipe Error |
|------|--------------|------------|
| `src/__tests__/hooks/useApi.test.tsx` | 3 | Missing 'variables' argument |
| `src/__tests__/hooks/useAuth.test.tsx` | 8 | Wrong argument count |
| `src/__tests__/lib/utils.test.ts` | 1 | Type mismatch |
| `src/pages/letters/outgoing/[id]/index.tsx` | 3 | Type/argument errors |
| `src/pages/notifications.tsx` | 1 | Expected 1-2 args, got 0 |

---

## Tahap Perbaikan

### ✅ Tahap 1: Periksa Error TypeScript
**Status**: SELESAI  
**Hasil**: Ditemukan 16 errors dalam 5 files

---

### 🔄 Tahap 2: Perbaiki Error di Test Files
**Priority**: Medium (karena ini test files, tidak mempengaruhi production)

#### 2.1 Fix: `src/__tests__/hooks/useApi.test.tsx` (3 errors)
- **Error**: Missing 'variables' argument di line 201
- **Solusi**: Tambahkan parameter variables yang diperlukan

#### 2.2 Fix: `src/__tests__/hooks/useAuth.test.tsx` (8 errors)
- **Error**: Wrong argument count di line 47
- **Solusi**: Sesuaikan jumlah argumen dengan signature function

#### 2.3 Fix: `src/__tests__/lib/utils.test.ts` (1 error)
- **Error**: Type mismatch di line 233
- **Solusi**: Sesuaikan tipe data

---

### 🔴 Tahap 3: Perbaiki Error di Production Files (PRIORITAS TINGGI)
**Priority**: HIGH (karena mempengaruhi aplikasi production)

#### 3.1 Fix: `src/pages/letters/outgoing/[id]/index.tsx` (3 errors)
- **Error**: Type/argument errors di line 103
- **Solusi**: 
  1. Periksa penggunaan mutation dengan id dan formData
  2. Pastikan tipe data sesuai dengan schema

#### 3.2 Fix: `src/pages/notifications.tsx` (1 error)
- **Error**: Expected 1-2 arguments, but got 0 di line 73
- **Solusi**: Tambahkan argument yang diperlukan

---

## Urutan Perbaikan yang Disarankan

1. **PERTAMA**: Perbaiki production files (Tahap 3)
   - `notifications.tsx` - 1 error (paling mudah)
   - `letters/outgoing/[id]/index.tsx` - 3 errors

2. **KEDUA**: Perbaiki test files (Tahap 2)
   - Test files tidak mempengaruhi aplikasi yang berjalan
   - Bisa diperbaiki setelah production stable

---

## Estimasi Waktu
- Tahap 3 (Production): ~15-30 menit
- Tahap 2 (Tests): ~20-40 menit
- **Total**: ~35-70 menit

---

## Catatan
- Backend sudah bersih (0 errors)
- Frontend dev server masih bisa berjalan meski ada TypeScript errors
- Prioritas: Production files > Test files
