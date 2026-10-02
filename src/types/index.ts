export type UserRole = 'MASTER' | 'MANAGER' | 'ADMIN' | 'BENDAHARA' | 'ANGGOTA' | 'KASIR' | 'GUDANG';

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
