import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { LoanStatus, UserRole } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateTimeIndo(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getRoleBadge(role: UserRole) {
  switch (role) {
    case "MASTER":
      return {
        label: "Master / Pengawas",
        className: "bg-red-100 text-red-800 border-red-200",
      };
    case "MANAGER":
      return {
        label: "Manager Koperasi",
        className: "bg-purple-100 text-purple-800 border-purple-200",
      };
    case "ADMIN":
      return {
        label: "Admin / Pengurus",
        className: "bg-blue-100 text-blue-800 border-blue-200",
      };
    case "BENDAHARA":
      return {
        label: "Bendahara / Petugas",
        className: "bg-emerald-100 text-emerald-800 border-emerald-200",
      };
    case "ANGGOTA":
      return {
        label: "Warga / Anggota",
        className: "bg-amber-100 text-amber-800 border-amber-200",
      };
    case "KASIR":
      return {
        label: "Kasir Kopdes Mart",
        className: "bg-teal-100 text-teal-800 border-teal-200",
      };
    case "GUDANG":
      return {
        label: "Petugas Gudang / Stok",
        className: "bg-orange-100 text-orange-800 border-orange-200",
      };
    default:
      return {
        label: role,
        className: "bg-gray-100 text-gray-800 border-gray-200",
      };
  }
}

export function getLoanStatusBadge(status: LoanStatus) {
  switch (status) {
    case "PENDING_ADMIN":
      return {
        label: "Review Admin",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      };
    case "PENDING_MASTER":
      return {
        label: "Menunggu Master",
        className: "bg-purple-100 text-purple-800 border-purple-200",
      };
    case "APPROVED":
      return {
        label: "Disetujui (Siap Cair)",
        className: "bg-cyan-100 text-cyan-800 border-cyan-200",
      };
    case "DISBURSED":
      return {
        label: "Sedang Berjalan",
        className: "bg-emerald-100 text-emerald-800 border-emerald-200",
      };
    case "REJECTED":
      return {
        label: "Ditolak",
        className: "bg-rose-100 text-rose-800 border-rose-200",
      };
    case "PAID_OFF":
      return {
        label: "Lunas",
        className: "bg-gray-100 text-gray-800 border-gray-200",
      };
  }
}
