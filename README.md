# 🏢 ARSANA - Sistem Manajemen Arsip Surat Dinas

Proyek **ARSANA** adalah sistem manajemen arsip surat berbasis web yang digunakan untuk mencatat, menyimpan, dan mengelola **surat masuk** serta **surat keluar** pada instansi pemerintahan.  
Proyek ini menggunakan **Next.js** untuk frontend dan **Express.js** untuk backend, dengan database **PostgreSQL** dan ORM **Prisma**.

---

## 🚀 Tech Stack

| Layer        | Teknologi yang Digunakan        |
|---------------|--------------------------------|
| Frontend      | Next.js + Tailwind CSS         |
| Backend       | Express.js                     |
| Database      | PostgreSQL                     |
| ORM           | Prisma                         |
| Deployment    | Vercel (Frontend) & Server Internal (Backend) |

---

## ⚙️ Instalasi dan Setup

Ikuti langkah-langkah berikut agar proyek berjalan dengan lancar:

### 1️⃣ Instal PostgreSQL
1. Kunjungi situs resmi PostgreSQL:  
   👉 [https://www.postgresql.org/download/](https://www.postgresql.org/download/)
2. Unduh versi terbaru sesuai sistem operasi.
3. Saat instalasi:  
   - **Jangan centang (uncheck)** opsi **pgAdmin**.  
   - Masukkan password:  
     ```
     postgres
     ```

---

### 2️⃣ Buat Database
Buka **CMD** atau **Git Bash**, lalu jalankan:
```bash
psql -U postgres
```
Masukkan password `postgres`, kemudian buat database:
```sql
CREATE DATABASE arsana;
\q
```

---

### 3️⃣ Clone / Pull Repo
```bash
git clone <link_repo_git>
cd ARSANA
```
Atau jika sudah pernah clone:
```bash
git pull origin main
```

---

### 4️⃣ Instal Dependensi
Masuk ke folder **frontend (fe)** dan **backend (be)**, kemudian jalankan:
```bash
npm install
```

---

### 5️⃣ Konfigurasi Environment
Salin file `.env.example` menjadi `.env`, lalu sesuaikan nilai-nilainya.  
Contoh koneksi database:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/arsana?schema=public"
```

---

### 6️⃣ Generate Prisma Client
```bash
npx prisma generate
```

---

### 7️⃣ Sinkronisasi Database
Coba jalankan salah satu perintah berikut:
```bash
npx prisma db push
```
Jika gagal, gunakan alternatif:
```bash
npx prisma migrate dev
```

---

### 8️⃣ Jalankan Seed Data
```bash
npx prisma db seed
```

---

### 9️⃣ Jalankan Aplikasi
Frontend:
```bash
npm run dev
```
Backend:
```bash
npm run dev
```

---

## 🧩 Struktur Folder

```
ARSANA/
├── be/                 # Backend (Express + Prisma)
│   ├── src/
│   ├── prisma/
│   ├── .env
│   └── package.json
├── fe/                 # Frontend (Next.js)
│   ├── app/
│   ├── components/
│   ├── public/
│   ├── .env
│   └── package.json
└── README.md
```

---

## 👥 Tim Pengembang
| Nama | Peran |
|------|-------|
| Muhammad Khairul Anam | Fullstack Developer |
| [Tambahkan anggota tim lain di sini] |  |

---

## 📄 Lisensi
Proyek ini bersifat **internal** dan hanya digunakan untuk kebutuhan instansi yang bersangkutan.  
Tidak diperbolehkan untuk disebarluaskan tanpa izin dari pengembang utama.

---

## 🧠 Catatan
Jika `npx prisma db push` gagal, gunakan langkah berikut:
```bash
npx prisma migrate dev --name init
npx prisma db seed
```
Kemudian ulangi menjalankan aplikasi dengan:
```bash
npm run dev
```

---

✨ _“Sistem Arsip Modern untuk Administrasi Dinas yang Efisien.”_
