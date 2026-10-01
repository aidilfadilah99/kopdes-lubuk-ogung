# Sistem Koperasi Desa Merah Putih - Desa Lubuk Ogung

Aplikasi tata kelola koperasi desa digital terpadu untuk **Koperasi Desa Merah Putih Lubuk Ogung**, Kecamatan Bandar Sei Kijang, Kabupaten Pelalawan, Provinsi Riau.

Dirancang khusus dengan standar **Role-Based Access Control (RBAC)** dan dioptimalkan 100% untuk deployment instan di **Vercel**.

---

## 🏛️ Struktur Peran & Hak Akses (RBAC)

Aplikasi memiliki pembagian peran yang sangat tegas:

1. **🔴 Master / Pengawas Utama** (`/master`)
   - Memegang wewenang tertinggi koperasi desa.
   - Otorisasi pinjaman besar (> Rp 5.000.000).
   - Manajemen akun pengguna & staf (tambah, edit, nonaktifkan, hapus Manager, Admin, Bendahara).
   - Pengaturan parameter kebijakan (Simpanan Pokok, Simpanan Wajib, Suku Bunga, Limit).
   - Rekam jejak audit (*Audit Trail Log*).

2. **🟣 Manager / Manajer Operasional Koperasi**
   - **Memiliki seluruh akses operasional koperasi desa kecuali akses Master**:
     - Akses Dashboard Admin & Keanggotaan (`/admin`)
     - Akses Loket Keuangan & Kasir Bendahara (`/bendahara`)
     - Akses Portal Layanan Anggota Warga (`/anggota`)
   - Membantu pengawasan harian, operasional simpan pinjam, dan pelayanan warga secara terpadu.

3. **🔵 Admin / Sekretaris Desa** (`/admin`)
   - Manajemen keanggotaan warga Dusun I, Dusun II, Dusun III, dan Dusun IV.
   - Verifikasi berkas KTP, KK, dan status domisili warga.
   - Telaah dan verifikasi permohonan pinjaman awal.

4. **🟢 Bendahara / Petugas Loket Simpan Pinjam** (`/bendahara`)
   - Loket setoran simpanan warga (Pokok, Wajib, Sukarela).
   - Pencairan dana pinjaman yang telah disetujui (*Disbursement*).
   - Loket penerimaan cicilan angsuran bulanan.
   - Cetak kwitansi transaksi digital resmi (*Rupiah*).

5. **🟡 Warga / Anggota Koperasi** (`/anggota`)
   - Pantau saldo tabungan (Pokok, Wajib, Sukarela).
   - Cek rincian pinjaman & jadwal angsuran bulanan.
   - Formulir pengajuan pinjaman modal usaha mandiri secara online.
   - Kalkulator simulasi angsuran & proyeksi SHU (Sisa Hasil Usaha).

---

## ⚡ Akun Bawaan Sistem

> Sistem menggunakan login wajib — tidak ada akses tanpa autentikasi.

| Peran | Nama Pejabat | Username | Password |
|---|---|---|---|
| **🔴 Master** | **Aidil Fadilah, S.T** | `aidil` | `kopdes2026` |
| **🟣 Manager** | **Surya Pratama, S.E** | `manager` | `kopdes2026` |

> Akun Admin, Bendahara, dan Anggota dapat dibuat dan dikelola oleh Master melalui dashboard.  
> Password default anggota baru yang didaftarkan = **6 digit terakhir NIK**.

---

## 🔐 Fitur Autentikasi & Keamanan

- Login wajib untuk semua role — tidak ada akses instan
- Navigasi dinamis menyesuaikan hak akses (Manager dapat berpindah antar panel Admin, Bendahara, dan Anggota dengan mudah)
- Setiap pengguna dapat **edit profil** (nama, email, WA) dan **ubah password** via menu di Header
- Master dapat **edit / ganti role / nonaktifkan / hapus** akun pengguna lain
- Halaman `/transparansi` dapat diakses publik tanpa login
- Menggunakan standar simbol mata uang **Rupiah (Rp)** untuk seluruh elemen antarmuka, kwitansi, dan loket keuangan

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
   git remote add origin https://github.com/aidilfadilah99/kopdes-lubuk-ogung.git
   git push -u origin main
   ```
3. Buka [https://vercel.com](https://vercel.com), klik **"Add New Project"** & pilih repositori `kopdes-lubuk-ogung`.
4. Vercel akan otomatis mendeteksi konfigurasi **Next.js** dan langsung melakukan deploy dalam ~1 menit!
