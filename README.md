# Sistem Koperasi Desa Merah Putih - Desa Lubuk Ogung

Aplikasi tata kelola koperasi desa digital terpadu untuk **Koperasi Desa Merah Putih Lubuk Ogung**, Kecamatan Bandar Sei Kijang, Kabupaten Pelalawan, Provinsi Riau.

Dirancang khusus dengan standar **Role-Based Access Control (RBAC)** dan dioptimalkan 100% untuk deployment instan di **Vercel**.

---

## 🏛️ Struktur Peran & Hak Akses (RBAC)

Aplikasi memiliki pembagian peran yang sangat tegas:

1. **🔴 Master / Pengawas Utama** (`/master`)
   - Memegang wewenang tertinggi koperasi desa.
   - Otorisasi pinjaman besar (> Rp 5.000.000).
   - Manajemen akun pengguna & staf (mengangkat/menghapus Admin, Bendahara).
   - Pengaturan parameter kebijakan (Simpanan Pokok, Simpanan Wajib, Suku Bunga, Limit).
   - Rekam jejak audit (*Audit Trail Log*).

2. **🔵 Admin / Sekretaris Desa** (`/admin`)
   - Manajemen keanggotaan warga Dusun I, Dusun II, Dusun III, dan Dusun IV.
   - Verifikasi berkas KTP, KK, dan status domisili warga.
   - Telaah dan verifikasi permohonan pinjaman awal.

3. **🟢 Bendahara / Petugas Loket Simpan Pinjam** (`/bendahara`)
   - Loket setoran simpanan warga (Pokok, Wajib, Sukarela).
   - Pencairan dana pinjaman yang telah disetujui (*Disbursement*).
   - Loket penerimaan cicilan angsuran bulanan.
   - Cetak kwitansi transaksi digital resmi.

4. **🟡 Warga / Anggota Koperasi** (`/anggota`)
   - Pantau saldo tabungan (Pokok, Wajib, Sukarela).
   - Cek rincian pinjaman & jadwal angsuran bulanan.
   - Formulir pengajuan pinjaman modal usaha mandiri secara online.
   - Kalkulator simulasi angsuran & proyeksi SHU (Sisa Hasil Usaha).

---

## ⚡ Akun Demo Bawaan (1-Klik Switch di Header)

| Peran | Nama | Username | Password |
|---|---|---|---|
| **Master** | H. Syahrul Ramadhan, M.Si | `master` | `password123` |
| **Admin** | Rahmat Hidayat, S.P | `admin` | `password123` |
| **Bendahara** | Siti Aminah, S.E | `bendahara` | `password123` |
| **Anggota** | Budi Santoso (Petani Sawit) | `budi` | `password123` |
| **Anggota** | Siti Rohmah (Pedagang) | `siti_rohmah` | `password123` |

---

## 🚀 Menjalankan Secara Lokal

```bash
# Jalankan development server
npm run dev

# Buka browser
http://localhost:3000
```

---

## 🌐 Panduan Hosting di Vercel

1. Buat repositori baru di GitHub (misal: `kopdes-lubuk-ogung`).
2. Hubungkan folder ini ke Git & push:
   ```bash
   git init
   git add .
   git commit -m "feat: inisialisasi sistem Kopdes Lubuk Ogung"
   git branch -M main
   git remote add origin https://github.com/USERNAME_ANDA/kopdes-lubuk-ogung.git
   git push -u origin main
   ```
3. Buka [https://vercel.com](https://vercel.com), klik **"Add New Project"** & pilih repositori `kopdes-lubuk-ogung`.
4. Vercel akan otomatis mendeteksi konfigurasi **Next.js** dan langsung melakukan deploy dalam ~1 menit!
