export type UserRole = 'MASTER' | 'PENGAWAS' | 'MANAGER' | 'ADMIN' | 'BENDAHARA' | 'ANGGOTA' | 'KASIR' | 'GUDANG';

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  email?: string;
  nik?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  memberId?: string; // Link to Member if role === 'ANGGOTA'
  isActive: boolean;
}

export interface Member {
  id: string;
  nik: string;
  noKk: string;
  name: string;
  phone: string;
  email?: string;
  dusun: 'Dusun I' | 'Dusun II' | 'Dusun III' | 'Dusun IV' | 'Luar Desa';
  address: string;
  occupation: string; // e.g., Petani Sawit, Pedagang, Wiraswasta, PNS/Guru
  status: 'AKTIF' | 'PENDING_VERIFIKASI' | 'NON_AKTIF';
  joinDate: string;
  savingsTotal: number;
  simpananPokokPaid: boolean;
}

export type SavingsType = 'POKOK' | 'WAJIB' | 'SUKARELA' | 'PENARIKAN_SUKARELA';

export interface SavingsTransaction {
  id: string;
  memberId: string;
  memberName: string;
  memberNik: string;
  type: SavingsType;
  amount: number;
  date: string;
  notes?: string;
  officerName: string;
  status: 'SUCCESS' | 'PENDING';
}

export type LoanStatus = 
  | 'PENDING_ADMIN'    // Baru diajukan oleh anggota / admin input
  | 'PENDING_MASTER'   // Telah direview Admin, butuh persetujuan Master/Kepala Desa
  | 'APPROVED'         // Disetujui Master, siap dicairkan Bendahara
  | 'DISBURSED'        // Dana telah dicairkan ke anggota
  | 'REJECTED'         // Ditolak
  | 'PAID_OFF';        // Lunas

export interface Loan {
  id: string;
  memberId: string;
  memberName: string;
  memberNik: string;
  amount: number;
  tenorMonths: number;
  interestRatePercent: number; // misal 1% per bulan flat
  monthlyInstallment: number;
  purpose: string; // misal: Modal Pupuk Sawit, Usaha Warung, Pendidikan Anak
  submissionDate: string;
  approvalDate?: string;
  disbursementDate?: string;
  status: LoanStatus;
  adminReviewer?: string;
  masterApprover?: string;
  rejectionReason?: string;
  rejectedBy?: string;
  rejectionDate?: string;
  remainingAmount: number;
  collateralDescription?: string; // Jaminan (misal: SKGR, BPKB, Surat Tanah)
}

export interface LoanInstallment {
  id: string;
  loanId: string;
  memberId: string;
  memberName: string;
  installmentNo: number; // Cicilan ke-N
  amount: number;
  principalAmount: number;
  interestAmount: number;
  dueDate: string;
  paymentDate?: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  officerName?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  ipAddress?: string;
}

export interface CooperativeConfig {
  coopName: string;
  villageName: string;
  subDistrict: string; // Kecamatan Bandar Sei Kijang
  district: string;    // Kabupaten Pelalawan
  province: string;    // Riau
  legalNumber: string; // No. Badan Hukum Koperasi Merah Putih
  simpananPokokAmount: number; // Rp 100.000
  simpananWajibMonthly: number; // Rp 25.000
  defaultLoanInterestRate: number; // 1% per bulan
  maxLoanWithoutMasterApproval: number; // Rp 5.000.000
  currentFiscalYear: number;
  shuEstimateTotal: number;
  martMemberDiscountPercent: number; // e.g. 2.5% potongan harga untuk anggota
  sbmPerjalananDinas?: PerjalananDinasRate[];
}

export type ProductCategory = 
  | 'SEMBAKO' 
  | 'DAPUR' 
  | 'MANDI_CUCI' 
  | 'MINUMAN' 
  | 'SNACK' 
  | 'RUMAH_TANGGA' 
  | 'PERTANIAN';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  unit: string;              // "sak 5kg", "liter", "pcs", "kg", "papan", "bungkus", "tabung", "dus"
  costPrice: number;         // Harga Pokok Penjualan (HPP)
  priceMember: number;       // Harga Khusus Anggota Koperasi
  priceGeneral: number;      // Harga Umum / Non-Anggota
  stock: number;
  minStock: number;
  barcode?: string;
  imageUrl?: string;
  isActive: boolean;
}

export interface CartItem {
  product: Product;
  qty: number;
  pricePerUnit: number;
  subtotal: number;
}

export type PaymentMethod = 'TUNAI' | 'POTONG_SIMPANAN' | 'KASBON_ANGGOTA' | 'QRIS';

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  qty: number;
  unit: string;
  costPrice: number;
  pricePerUnit: number;
  subtotal: number;
}

export interface SaleTransaction {
  id: string;
  invoiceNo: string;
  date: string;
  buyerType: 'ANGGOTA' | 'UMUM';
  memberId?: string;
  memberName?: string;
  memberNik?: string;
  items: SaleItem[];
  totalItems: number;
  totalCost: number;
  totalAmount: number;
  totalDiscount: number;
  cashierName: string;
  cashierRole: UserRole;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  changeAmount: number;
  notes?: string;
}

// --- PERJALANAN DINAS & STANDAR BIAYA (SBM) ---
export type TingkatPerjalananDinas = 
  | 'DALAM_KECAMATAN' 
  | 'DALAM_KABUPATEN' 
  | 'LUAR_KABUPATEN_PROVINSI' 
  | 'LUAR_PROVINSI';

export interface PerjalananDinasRate {
  tingkat: TingkatPerjalananDinas;
  label: string;
  uangHarian: number;      // Per hari (uang saku + konsumsi)
  transport: number;       // Biaya tiket / BBM / travel / tol
  penginapan: number;      // Per malam jika menginap (> 1 hari)
}

export type StatusPerjalananDinas = 
  | 'DIAJUKAN' 
  | 'DISETUJUI' 
  | 'DICAIRKAN' 
  | 'DITOLAK';

export interface PerjalananDinas {
  id: string;
  nomorSppd: string;
  namaPegawai: string;
  jabatan: string;
  keperluan: string;
  tujuan: string;
  tingkat: TingkatPerjalananDinas;
  tanggalBerangkat: string;
  tanggalKembali: string;
  lamaHari: number;
  uangHarian: number;
  biayaTransport: number;
  biayaPenginapan: number;
  totalBiaya: number;
  status: StatusPerjalananDinas;
  tanggalPengajuan: string;
  approvedBy?: string;
  approvedDate?: string;
  disbursedBy?: string;
  disbursedDate?: string;
  notes?: string;
  hasilLaporan?: string;
}

// --- CATATAN & TEMUAN PENGAWASAN ---
export interface PengawasanNote {
  id: string;
  tanggal: string;
  pengawasName: string;
  aspek: 'KEUANGAN' | 'KEPATUHAN' | 'OPERASIONAL_MART' | 'PINJAMAN' | 'UMUM';
  judul: string;
  temuan: string;
  rekomendasi: string;
  status: 'TERBUKA' | 'DITINDAKLANJUTI' | 'SELESAI';
}

// --- PENYERTAAN MODAL (PEMERINTAH / DESA / PIHAK KETIGA) ---
export type KategoriPenyertaanModal = 'PEMERINTAH' | 'DESA' | 'HIBAH_CSR' | 'PIHAK_KETIGA' | 'LAINNYA';

export interface PenyertaanModal {
  id: string;
  nomorReferensi: string; // misal: "PM-2026-001"
  sumber: string; // misal: "Pemerintah Desa Lubuk Ogung (APBDes)", "Kemendesa PDTT", "Hibah CSR"
  kategori: KategoriPenyertaanModal;
  nominal: number;
  tanggal: string;
  peruntukan: string; // misal: "Modal Awal Pembangunan Gedung & Toko Mart"
  buktiDokumen?: string;
  penerima: string; // Nama Master / Bendahara / Manager yang mencatat
  metode: 'TRANSFER_BANK' | 'KAS_TUNAI';
  catatan?: string;
  status: 'DITERIMA';
}

// --- PENGELUARAN / PEMBELIAN BARANG & OPERASIONAL ---
export type KategoriPengeluaran = 
  | 'ASET_INVENTARIS'     // Belanja Aset Tetap (Peralatan, Rak Toko, Freezer, Komputer, Brankas)
  | 'KULAKAN_TOKO'        // Belanja Pengadaan / Kulakan Stok Barang Kopdes Mart
  | 'OPERASIONAL_KANTOR'; // Belanja Operasional, ATK, Listrik, Konsumsi

export interface PengeluaranBarang {
  id: string;
  nomorBukti: string; // misal: "BKK-2026-001"
  tanggal: string;
  kategori: KategoriPengeluaran;
  namaBarang: string; // misal: "Pengadaan 1 Unit Freezer Toko 300L", "Kulakan Minyakita 50 Karton"
  jumlah: number;
  satuan: string; // "unit", "karton", "sak", "paket", "pcs"
  hargaSatuan: number;
  totalBiaya: number;
  supplier: string; // misal: "Distributor Sembako Pekanbaru", "Toko Elektronik Pelalawan"
  metodePembayaran: 'KAS_TUNAI' | 'TRANSFER_BANK';
  petugas: string; // Nama petugas pencatat
  keterangan?: string;
  buktiNota?: string;
}
