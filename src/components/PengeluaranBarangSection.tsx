"use client";

import React, { useState } from "react";
import { DataStore } from "@/lib/store";
import { PengeluaranBarang, KategoriPengeluaran, UserRole, Product } from "@/types";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import {
  ShoppingBag,
  PlusCircle,
  Package,
  Store,
  FileText,
  Calendar,
  Trash2,
  CheckCircle2,
  Receipt,
  AlertCircle,
  X,
  Truck,
  Armchair,
} from "lucide-react";

interface Props {
  userRole: UserRole;
  userName: string;
}

export function PengeluaranBarangSection({ userRole, userName }: Props) {
  const [list, setList] = useState<PengeluaranBarang[]>(() => DataStore.getPengeluaranBarang());
  const [products, setProducts] = useState<Product[]>(() => DataStore.getProducts());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState<{
    kategori: KategoriPengeluaran;
    namaBarang: string;
    jumlah: number;
    satuan: string;
    hargaSatuan: number;
    supplier: string;
    tanggal: string;
    metodePembayaran: "KAS_TUNAI" | "TRANSFER_BANK";
    keterangan: string;
    selectedProductId?: string; // Jika kulakan barang toko yang sudah ada di katalog
  }>({
    kategori: "KULAKAN_TOKO",
    namaBarang: "",
    jumlah: 1,
    satuan: "unit",
    hargaSatuan: 0,
    supplier: "",
    tanggal: new Date().toISOString().split("T")[0],
    metodePembayaran: "KAS_TUNAI",
    keterangan: "",
    selectedProductId: "",
  });

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const refresh = () => {
    setList(DataStore.getPengeluaranBarang());
    setProducts(DataStore.getProducts());
  };

  const totalBiaya = Number(form.jumlah || 0) * Number(form.hargaSatuan || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.namaBarang.trim() || form.jumlah <= 0 || form.hargaSatuan <= 0 || !form.supplier.trim()) {
      notify("⚠️ Harap lengkapi nama barang, jumlah (>0), harga satuan (>0), dan supplier!");
      return;
    }

    const newBukti = `BKK-${new Date().getFullYear()}/${String(list.length + 1).padStart(3, "0")}`;
    const newEntry: PengeluaranBarang = {
      id: `pb-${Date.now()}`,
      nomorBukti: newBukti,
      tanggal: form.tanggal,
      kategori: form.kategori,
      namaBarang: form.namaBarang.trim(),
      jumlah: Number(form.jumlah),
      satuan: form.satuan.trim() || "unit",
      hargaSatuan: Number(form.hargaSatuan),
      totalBiaya,
      supplier: form.supplier.trim(),
      metodePembayaran: form.metodePembayaran,
      petugas: `${userName} (${userRole})`,
      keterangan: form.keterangan.trim() || undefined,
    };

    DataStore.addPengeluaranBarang(newEntry);

    // Jika kulakan produk toko yang dipilih, otomatis tambahkan stok ke produk tersebut!
    if (form.kategori === "KULAKAN_TOKO" && form.selectedProductId) {
      DataStore.restockProduct(form.selectedProductId, Number(form.jumlah));
    }

    refresh();
    setIsModalOpen(false);
    setForm({
      kategori: "KULAKAN_TOKO",
      namaBarang: "",
      jumlah: 1,
      satuan: "unit",
      hargaSatuan: 0,
      supplier: "",
      tanggal: new Date().toISOString().split("T")[0],
      metodePembayaran: "KAS_TUNAI",
      keterangan: "",
      selectedProductId: "",
    });
    notify(`Pengeluaran pembelian barang ${formatRupiah(newEntry.totalBiaya)} berhasil dicatat resmi!`);
  };

  const handleDelete = (id: string, nama: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus catatan pembelian "${nama}"?`)) {
      DataStore.deletePengeluaranBarang(id);
      refresh();
      notify(`Catatan pembelian ${nama} berhasil dihapus.`);
    }
  };

  // Ringkasan
  const totalPengeluaran = list.reduce((sum, p) => sum + p.totalBiaya, 0);
  const belanjaAset = list.filter((p) => p.kategori === "ASET_INVENTARIS").reduce((sum, p) => sum + p.totalBiaya, 0);
  const belanjaKulakan = list.filter((p) => p.kategori === "KULAKAN_TOKO").reduce((sum, p) => sum + p.totalBiaya, 0);
  const belanjaOperasional = list.filter((p) => p.kategori === "OPERASIONAL_KANTOR").reduce((sum, p) => sum + p.totalBiaya, 0);

  const canEdit = ["MASTER", "MANAGER", "BENDAHARA", "GUDANG"].includes(userRole);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {notification && (
        <div className="p-4 rounded-xl bg-emerald-700 text-white font-medium text-sm shadow-lg flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            {notification}
          </div>
          <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white text-xs">
            Tutup
          </button>
        </div>
      )}

      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-rose-700" />
            Pengeluaran Pembelian Barang & Belanja Modal
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan uang keluar untuk belanja aset inventaris, pengadaan kulakan stok toko, dan perlengkapan operasional.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-rose-200 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Catat Pembelian Barang Baru
          </button>
        )}
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-900 to-slate-900 text-white shadow-md">
          <div className="flex items-center justify-between text-rose-200 text-xs font-semibold uppercase tracking-wider">
            <span>Total Pengeluaran</span>
            <Receipt className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono mt-2 text-white">
            {formatRupiah(totalPengeluaran)}
          </div>
          <p className="text-[11px] text-rose-300 mt-1">
            {list.length} Bukti Pengeluaran
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Belanja Aset & Alat</span>
            <Armchair className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono mt-2 text-indigo-700">
            {formatRupiah(belanjaAset)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Menambah nilai Aset Tetap di Neraca
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Kulakan Stok Toko</span>
            <Store className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono mt-2 text-amber-700">
            {formatRupiah(belanjaKulakan)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Menambah persediaan barang Kopdes Mart
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Operasional & ATK</span>
            <FileText className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono mt-2 text-slate-800">
            {formatRupiah(belanjaOperasional)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Biaya operasional kantor & listrik
          </p>
        </div>
      </div>

      {/* Table of Purchases */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="font-bold text-slate-900 text-sm">Daftar Bukti Pembelian & Pengeluaran Barang</span>
          <span className="text-xs bg-rose-50 text-rose-700 font-bold px-2.5 py-1 rounded-full">
            {list.length} Transaksi
          </span>
        </div>

        {list.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p>Belum ada catatan pembelian barang atau belanja pengadaan.</p>
            {canEdit && (
              <p className="text-xs text-rose-600 font-medium">
                Klik tombol "Catat Pembelian Barang Baru" di atas untuk mencatat pengadaan aset, kulakan sembako, atau ATK.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">No. Bukti & Tanggal</th>
                  <th className="px-5 py-3.5">Nama Barang / Pembelian</th>
                  <th className="px-5 py-3.5">Kategori</th>
                  <th className="px-5 py-3.5">Volume & Satuan</th>
                  <th className="px-5 py-3.5">Supplier / Toko</th>
                  <th className="px-5 py-3.5 text-right">Harga Satuan</th>
                  <th className="px-5 py-3.5 text-right">Total Biaya</th>
                  <th className="px-5 py-3.5">Petugas</th>
                  {canEdit && <th className="px-5 py-3.5 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">
                      <div>{item.nomorBukti}</div>
                      <div className="text-[10px] text-slate-500 font-normal flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {formatDateIndo(item.tanggal)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{item.namaBarang}</div>
                      {item.keterangan && (
                        <div className="text-[10px] text-slate-400 mt-0.5 italic">{item.keterangan}</div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.kategori === "ASET_INVENTARIS"
                          ? "bg-indigo-100 text-indigo-800"
                          : item.kategori === "KULAKAN_TOKO"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-800"
                      }`}>
                        {item.kategori === "ASET_INVENTARIS"
                          ? "Aset / Peralatan"
                          : item.kategori === "KULAKAN_TOKO"
                          ? "Kulakan Mart"
                          : "Operasional"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-700 font-medium">
                      {item.jumlah} {item.satuan}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{item.supplier}</div>
                      <div className="text-[10px] text-slate-500">
                        {item.metodePembayaran === "TRANSFER_BANK" ? "Transfer Bank" : "Kas Tunai"}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-slate-700">
                      {formatRupiah(item.hargaSatuan)}
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-rose-700 text-sm">
                      -{formatRupiah(item.totalBiaya)}
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-[11px]">
                      {item.petugas}
                    </td>
                    {canEdit && (
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => handleDelete(item.id, item.namaBarang)}
                          title="Hapus Catatan"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form Tambah Pembelian Barang Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-rose-700" />
                <h4 className="font-extrabold text-slate-900 text-base">Catat Pembelian Barang Baru</h4>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Belanja</label>
                  <select
                    value={form.kategori}
                    onChange={(e) => {
                      const kat = e.target.value as KategoriPengeluaran;
                      setForm({ ...form, kategori: kat });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none font-medium"
                  >
                    <option value="KULAKAN_TOKO">Kulakan Stok Kopdes Mart</option>
                    <option value="ASET_INVENTARIS">Aset Tetap / Peralatan & Inventaris</option>
                    <option value="OPERASIONAL_KANTOR">Operasional Kantor / Listrik / ATK</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Metode Pembayaran</label>
                  <select
                    value={form.metodePembayaran}
                    onChange={(e) => setForm({ ...form, metodePembayaran: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none font-medium"
                  >
                    <option value="KAS_TUNAI">Kas Tunai Loket</option>
                    <option value="TRANSFER_BANK">Transfer Rekening Bank</option>
                  </select>
                </div>
              </div>

              {/* Jika Kulakan Toko, opsi pilih barang dari katalog toko */}
              {form.kategori === "KULAKAN_TOKO" && (
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                  <label className="block font-semibold text-amber-900">
                    Pilih Produk Toko (Otomatis Tambah Stok Produk)
                  </label>
                  <select
                    value={form.selectedProductId || ""}
                    onChange={(e) => {
                      const pId = e.target.value;
                      const selected = products.find((p) => p.id === pId);
                      if (selected) {
                        setForm({
                          ...form,
                          selectedProductId: pId,
                          namaBarang: selected.name,
                          satuan: selected.unit,
                          hargaSatuan: selected.costPrice,
                        });
                      } else {
                        setForm({ ...form, selectedProductId: "" });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-amber-300 text-xs bg-white focus:outline-none"
                  >
                    <option value="">-- Input Bebas / Barang Baru di luar Katalog --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stok Saat Ini: {p.stock} {p.unit})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-amber-700">
                    Memilih produk katalog akan langsung menambah stok fisik di Kopdes Mart setelah formulir disimpan.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Barang / Uraian Belanja <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 1 Unit Freezer Toko 300L / Kulakan Minyakita 50 Karton"
                  value={form.namaBarang}
                  onChange={(e) => setForm({ ...form, namaBarang: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jumlah (Qty) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.jumlah || ""}
                    onChange={(e) => setForm({ ...form, jumlah: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    placeholder="unit, sak, karton, dus"
                    value={form.satuan}
                    onChange={(e) => setForm({ ...form, satuan: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Harga Satuan (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={form.hargaSatuan || ""}
                    onChange={(e) => setForm({ ...form, hargaSatuan: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Total Calculation Display */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="font-semibold text-slate-700">Total Biaya Pengeluaran:</span>
                <span className="font-mono font-black text-rose-700 text-base">
                  {formatRupiah(totalBiaya)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Toko / Supplier <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Distributor Sembako Pekanbaru"
                    value={form.supplier}
                    onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Pembelian</label>
                  <input
                    type="date"
                    required
                    value={form.tanggal}
                    onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan / Nomor Nota (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Nomor faktur nota atau keterangan barang..."
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold shadow-md shadow-rose-200"
                >
                  Simpan Pembelian & Potong Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
