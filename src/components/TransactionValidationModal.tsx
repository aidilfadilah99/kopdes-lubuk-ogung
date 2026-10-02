"use client";

import React from "react";
import { SaleTransaction } from "@/types";
import { formatRupiah } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  X,
  User,
  ShoppingBag,
  CreditCard,
  Banknote,
  Wallet,
  Clock,
  ArrowRight,
} from "lucide-react";

interface TransactionValidationModalProps {
  candidate: SaleTransaction | null;
  onCancel: () => void;
  onConfirm: () => void;
  memberRemainingSavings?: number;
}

export function TransactionValidationModal({
  candidate,
  onCancel,
  onConfirm,
  memberRemainingSavings,
}: TransactionValidationModalProps) {
  if (!candidate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-in zoom-in-95">
        {/* Header Alert */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Verifikasi & Validasi Transaksi
              </h3>
              <p className="text-amber-100 text-xs">
                Cek ulang rincian belanja sebelum transaksi diproses
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-amber-100 hover:text-white p-1 rounded-lg hover:bg-amber-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Card Pembeli */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                  Identitas Pembeli
                </span>
                <p className="font-bold text-slate-900 text-sm">
                  {candidate.buyerType === "ANGGOTA"
                    ? candidate.memberName
                    : "Warga Umum (Non-Anggota)"}
                </p>
                {candidate.memberNik && (
                  <p className="text-slate-400 font-mono text-[10px]">
                    NIK: {candidate.memberNik}
                  </p>
                )}
              </div>
            </div>
            <div>
              {candidate.buyerType === "ANGGOTA" ? (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Anggota Koperasi
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                  Umum
                </span>
              )}
            </div>
          </div>

          {/* Rincian Item Barang */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-100/70 px-4 py-2 border-b border-slate-200 flex justify-between font-bold text-slate-600 text-[11px]">
              <span>Daftar Barang ({candidate.totalItems} unit)</span>
              <span>Subtotal</span>
            </div>
            <div className="divide-y divide-slate-100 max-h-44 overflow-y-auto p-1">
              {candidate.items.map((item, idx) => (
                <div key={idx} className="p-2.5 flex justify-between items-center text-xs">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-900">{item.productName}</p>
                    <p className="text-[10px] text-slate-500">
                      {item.qty} {item.unit} x {formatRupiah(item.pricePerUnit)}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-slate-800">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rincian Finansial & Metode Pembayaran */}
          <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-2xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total Tagihan:</span>
              <span className="text-lg font-black text-emerald-800 font-mono">
                {formatRupiah(candidate.totalAmount)}
              </span>
            </div>

            {candidate.totalDiscount > 0 && (
              <div className="flex justify-between items-center text-emerald-700 font-medium">
                <span>Diskon Anggota:</span>
                <span className="font-bold">- {formatRupiah(candidate.totalDiscount)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-emerald-200/60 flex justify-between items-center">
              <span className="text-slate-600">Metode Bayar:</span>
              <span className="font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                {candidate.paymentMethod === "TUNAI" && (
                  <>
                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                    Tunai (Cash)
                  </>
                )}
                {candidate.paymentMethod === "POTONG_SIMPANAN" && (
                  <>
                    <Wallet className="w-3.5 h-3.5 text-teal-600" />
                    Potong Saldo Simpanan
                  </>
                )}
                {candidate.paymentMethod === "QRIS" && (
                  <>
                    <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                    QRIS Digital
                  </>
                )}
                {candidate.paymentMethod === "KASBON_ANGGOTA" && (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Kasbon Tempo Anggota
                  </>
                )}
              </span>
            </div>

            {candidate.paymentMethod === "TUNAI" && (
              <div className="pt-1 flex justify-between items-center text-slate-700 font-mono">
                <span>Uang Diterima: {formatRupiah(candidate.amountPaid)}</span>
                <span className="font-bold text-emerald-700">
                  Kembalian: {formatRupiah(candidate.changeAmount)}
                </span>
              </div>
            )}

            {candidate.paymentMethod === "POTONG_SIMPANAN" && memberRemainingSavings !== undefined && (
              <div className="pt-1 flex justify-between items-center text-[11px] text-teal-800 font-medium">
                <span>Sisa Saldo Tabungan Anggota:</span>
                <span className="font-bold font-mono">
                  {formatRupiah(Math.max(0, memberRemainingSavings - candidate.totalAmount))}
                </span>
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-tight">
              Pastikan uang fisik / saldo dan barang belanjaan sudah diperiksa oleh kasir. Klik <strong>Konfirmasi Transaksi</strong> untuk mencetak struk belanja resmi.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors shadow-sm"
          >
            Periksa Kembali (Batal)
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-md flex items-center justify-center gap-1.5"
          >
            <span>Konfirmasi Transaksi</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
