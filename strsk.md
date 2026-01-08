Ruang Lingkup Sistem

### 3.1 Surat Masuk
Surat masuk merupakan surat yang diterima oleh dinas, baik dari sistem **SRIKANDI** maupun surat fisik/manual yang diinput oleh sekretariat.

#### Data Surat Masuk
1. Tanggal Penerimaan Surat  
2. Nomor dan Tanggal Surat  
3. Sifat Surat  
4. Isi Ringkas  
5. Dari  
6. Kepada  
7. Pengolah  
8. Keterangan  
9. Disposisi  
10. Pelaksanaan (untuk surat undangan)

#### Sifat Surat
- Biasa  
- Terbatas  
- Rahasia  
- Sangat Rahasia  

#### Keterangan (KET)
- SRIKANDI  
- Manual  

#### Disposisi
- Umpeg  
- Perencanaan  
- Kaur Keuangan  
- Kabid  
- Bidang-bidang terkait  
- Dan unit lainnya sesuai kebutuhan dinas  

---

### 3.2 Surat Keluar
Surat keluar merupakan surat yang dibuat dan dikeluarkan oleh sekretariat dinas.

#### Data Surat Keluar
1. Tanggal Pembuatan Surat  
2. Tanggal Surat  
3. Klasifikasi Keamanan  
4. Kode Klasifikasi  
5. Nomor Urut  
6. Nomor Surat  
7. Sifat Surat  
8. Isi Ringkas  
9. Pelaksanaan (untuk surat undangan)  
10. Dari  
11. Kepada  
12. Pengolah  
13. Keterangan  

#### Klasifikasi Keamanan
- Biasa  
- Terbatas  

#### Sifat Surat
- Biasa  
- Terbatas  
- Rahasia  
- Sangat Rahasia  

#### Keterangan (KET)
- SRIKANDI  
- Manual  

---

## 4. Label Surat dan Fitur Tambahan

### 4.1 Surat Undangan (Agenda)
Surat masuk maupun surat keluar dapat diberi **label Undangan**.  
Jika sebuah surat dilabeli sebagai undangan, maka sistem menyimpan data tambahan:

- Tanggal kegiatan  
- Waktu kegiatan  
- Tempat kegiatan  
- Catatan tambahan  

Surat undangan akan:
- Ditampilkan pada **modul Agenda**
- Muncul sebagai agenda kegiatan dinas
- Memicu **notifikasi otomatis**

---

### 4.2 Surat Perlu Tindakan
Surat dapat dilabeli sebagai **Perlu Tindakan** untuk menandai adanya tindak lanjut.

#### Data Tambahan
- Tanggal tindakan  

Surat dengan label *Perlu Tindakan* akan:
- Muncul pada **Agenda**
- Mengirimkan **notifikasi pengingat** kepada pengguna

---

## 5. Sistem Notifikasi
Sistem menyediakan notifikasi terpusat dengan fitur:
- Notifikasi agenda **H-7 dan H-3** sebelum kegiatan
- Notifikasi berdasarkan tanggal tindak lanjut
- Notifikasi saat pengguna menambahkan surat masuk atau keluar
- Status notifikasi:
  - Belum dibaca
  - Sudah dibaca

---

## 6. Kolaborasi Multi Pengguna
Aplikasi mendukung penggunaan oleh banyak pengguna dengan kemampuan:
- Mengakses arsip surat secara bersama
- Melihat agenda dinas secara real-time
- Menerima notifikasi aktivitas pengguna lain
- Mengurangi ketergantungan pada pencatatan manual