"use client";

import React from "react";
import { SaleTransaction } from "@/types";
import { formatRupiah } from "@/lib/utils";
import { Printer, X, CheckCircle2, ShoppingBag } from "lucide-react";

interface MartReceiptModalProps {
  sale: SaleTransaction | null;
  onClose: () => void;
}

export function MartReceiptModal({ sale, onClose }: MartReceiptModalProps) {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Top Banner */}
        <div className="bg-emerald-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <h3 className="font-bold text-base">Transaksi Berhasil!</h3>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-100 hover:text-white p-1 rounded-lg hover:bg-emerald-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Body (Printable Area) */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50 font-mono text-xs text-slate-800" id="mart-receipt">
          <div className="bg-white p-6 rounded-xl border border-dashed border-slate-300 shadow-sm space-y-4">
            {/* Header Struk */}
            <div className="text-center border-b border-dashed border-slate-300 pb-4">
              <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-sans font-black text-base tracking-wide uppercase">
                <ShoppingBag className="w-5 h-5" />
                <span>KOPDES MART</span>
              </div>
              <p className="font-sans font-bold text-slate-700 text-xs">
                Koperasi Desa Merah Putih Lubuk Ogung
              </p>
              <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                Kec. Bandar Sei Kijang, Kab. Pelalawan, Riau
              </p>
              <p className="text-[10px] text-slate-400 font-sans">
                Telp/WA: 0812-7566-0001
              </p>
            </div>

            {/* Meta Transaksi */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Bukti</span>
                <span className="font-bold text-slate-800">{sale.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu</span>
                <span>{new Date(sale.date).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kasir</span>
                <span>{sale.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pelanggan</span>
                <span className="font-bold">
                  {sale.buyerType === "ANGGOTA" ? (
                    <span className="text-emerald-700 font-sans font-semibold">
                      {sale.memberName} (ANGGOTA)
                    </span>
                  ) : (
                    "Warga Umum"
                  )}
                </span>
              </div>
            </div>

            {/* Daftar Item Barang */}
            <div className="space-y-2 border-b border-dashed border-slate-300 pb-4">
              <div className="font-bold text-slate-600 flex justify-between text-[11px]">
                <span>PRODUK</span>
                <span>TOTAL</span>
              </div>
              {sale.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-semibold text-slate-900 leading-tight">
                    {item.productName}
                  </div>
                  <div className="flex justify-between text-slate-500 text-[10px]">
                    <span>
                      {item.qty} {item.unit} x {formatRupiah(item.pricePerUnit)}
                    </span>
                    <span className="font-mono text-slate-800 font-bold">
                      {formatRupiah(item.subtotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Ringkasan Pembayaran */}
            <div className="space-y-1 text-[11px] pt-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Item</span>
                <span>{sale.totalItems} barang</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-sm pt-1">
                <span>TOTAL BELANJA</span>
                <span className="text-emerald-700">{formatRupiah(sale.totalAmount)}</span>
              </div>

              {sale.totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 bg-emerald-50 px-2 py-1 rounded font-sans text-[11px] font-medium">
                  <span>Hemat Diskon Anggota</span>
                  <span>- {formatRupiah(sale.totalDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500">Metode Bayar</span>
                <span className="font-bold font-sans">
                  {sale.paymentMethod === "TUNAI" && "Tunai (Cash)"}
                  {sale.paymentMethod === "POTONG_SIMPANAN" && "Potong Saldo Simpanan"}
                  {sale.paymentMethod === "KASBON_ANGGOTA" && "Kasbon Tempo Anggota"}
                  {sale.paymentMethod === "QRIS" && "QRIS Digital"}
                </span>
              </div>

              {sale.paymentMethod === "TUNAI" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Uang Diterima</span>
                    <span>{formatRupiah(sale.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-800">
                    <span className="text-slate-500">Kembalian</span>
                    <span>{formatRupiah(sale.changeAmount)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer Struk */}
            <div className="text-center pt-3 border-t border-dashed border-slate-300 space-y-1 font-sans">
              <p className="text-[11px] font-bold text-slate-700">
                TERIMA KASIH ATAS KUNJUNGAN ANDA!
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                Belanja Anda di Kopdes Mart memperkuat ekonomi desa dan menambah perolehan SHU Anggota.
              </p>
              <div className="pt-2 flex justify-center">
                <div className="h-6 w-44 bg-slate-200 rounded flex items-center justify-center text-[9px] tracking-widest text-slate-600">
                  |||||| |||| |||||| ||||||
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk Kasir</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
