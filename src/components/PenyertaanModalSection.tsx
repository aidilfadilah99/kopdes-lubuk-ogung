"use client";

import React, { useState } from "react";
import { DataStore } from "@/lib/store";
import { PenyertaanModal, KategoriPenyertaanModal, UserRole } from "@/types";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import {
  Landmark,
  PlusCircle,
  Building2,
  HandCoins,
  FileCheck2,
  Calendar,
  Trash2,
  CheckCircle2,
  Receipt,
  AlertCircle,
  X,
} from "lucide-react";

interface Props {
  userRole: UserRole;
  userName: string;
}

export function PenyertaanModalSection({ userRole, userName }: Props) {
  const [list, setList] = useState<PenyertaanModal[]>(() => DataStore.getPenyertaanModal());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState<{
    sumber: string;
    kategori: KategoriPenyertaanModal;
    nominal: number;
    tanggal: string;
    peruntukan: string;
    buktiDokumen: string;
    metode: "TRANSFER_BANK" | "KAS_TUNAI";
    catatan: string;
  }>({
    sumber: "",
    kategori: "PEMERINTAH",
    nominal: 0,
    tanggal: new Date().toISOString().split("T")[0],
    peruntukan: "",
    buktiDokumen: "",
    metode: "TRANSFER_BANK",
    catatan: "",
  });

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const refresh = () => {
    setList(DataStore.getPenyertaanModal());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sumber.trim() || form.nominal <= 0 || !form.peruntukan.trim()) {
      notify("⚠️ Harap lengkapi sumber, nominal (harus > 0), dan peruntukan modal!");
      return;
    }

    const newRef = `PM-${new Date().getFullYear()}/${String(list.length + 1).padStart(3, "0")}`;
    const newEntry: PenyertaanModal = {
      id: `pm-${Date.now()}`,
      nomorReferensi: newRef,
      sumber: form.sumber.trim(),
      kategori: form.kategori,
      nominal: Number(form.nominal),
      tanggal: form.tanggal,
      peruntukan: form.peruntukan.trim(),
      buktiDokumen: form.buktiDokumen.trim() || undefined,
      penerima: `${userName} (${userRole})`,
      metode: form.metode,
      catatan: form.catatan.trim() || undefined,
      status: "DITERIMA",
    };

    DataStore.addPenyertaanModal(newEntry);
    refresh();
    setIsModalOpen(false);
    setForm({
      sumber: "",
      kategori: "PEMERINTAH",
      nominal: 0,
      tanggal: new Date().toISOString().split("T")[0],
      peruntukan: "",
      buktiDokumen: "",
      metode: "TRANSFER_BANK",
      catatan: "",
    });
    notify(`Penyertaan modal ${formatRupiah(newEntry.nominal)} dari ${newEntry.sumber} berhasil dicatat resmi!`);
  };

  const handleDelete = (id: string, sumber: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus catatan penyertaan modal dari "${sumber}"?`)) {
      DataStore.deletePenyertaanModal(id);
      refresh();
      notify(`Catatan penyertaan modal dari ${sumber} berhasil dihapus.`);
    }
  };

  // Ringkasan
  const totalModal = list.reduce((sum, p) => sum + p.nominal, 0);
  const modalPemerintah = list.filter((p) => p.kategori === "PEMERINTAH" || p.kategori === "DESA").reduce((sum, p) => sum + p.nominal, 0);
  const modalMitra = list.filter((p) => p.kategori === "HIBAH_CSR" || p.kategori === "PIHAK_KETIGA" || p.kategori === "LAINNYA").reduce((sum, p) => sum + p.nominal, 0);

  const canEdit = ["MASTER", "MANAGER", "BENDAHARA"].includes(userRole);

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
            <Landmark className="w-5 h-5 text-indigo-700" />
            Penyertaan Modal Koperasi
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan resmi modal awal pembangunan dari Pemerintah, APBDes, Hibah CSR, dan Pihak Ketiga.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-indigo-200 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Catat Penyertaan Modal Baru
          </button>
        )}
      </div>

      {/* 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-md">
          <div className="flex items-center justify-between text-indigo-200 text-xs font-semibold uppercase tracking-wider">
            <span>Total Penyertaan Modal</span>
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black font-mono mt-2 text-white">
            {formatRupiah(totalModal)}
          </div>
          <p className="text-[11px] text-indigo-300 mt-1">
            {list.length} Sumber Pendanaan Tercatat
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Dari Pemerintah & APBDes</span>
            <Landmark className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono mt-2 text-emerald-700">
            {formatRupiah(modalPemerintah)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Modal dasar pembangunan & fasilitas desa
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Dari Mitra / CSR / Investor</span>
            <HandCoins className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black font-mono mt-2 text-blue-700">
            {formatRupiah(modalMitra)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Penyertaan modal kerja & kemitraan strategis
          </p>
        </div>
      </div>

      {/* Table of Penyertaan Modal */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="font-bold text-slate-900 text-sm">Daftar Penyertaan Modal Resmi</span>
          <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-full">
            {list.length} Berkas
          </span>
        </div>

        {list.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p>Belum ada catatan penyertaan modal yang dimasukkan.</p>
            {canEdit && (
              <p className="text-xs text-indigo-600 font-medium">
                Klik tombol "Catat Penyertaan Modal Baru" di atas untuk menambahkan modal awal pemerintah atau pihak ketiga.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Ref & Tanggal</th>
                  <th className="px-5 py-3.5">Sumber Modal</th>
                  <th className="px-5 py-3.5">Kategori</th>
                  <th className="px-5 py-3.5">Peruntukan</th>
                  <th className="px-5 py-3.5">Bukti / Dokumen</th>
                  <th className="px-5 py-3.5 text-right">Nominal</th>
                  <th className="px-5 py-3.5">Penerima</th>
                  {canEdit && <th className="px-5 py-3.5 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">
                      <div>{item.nomorReferensi}</div>
                      <div className="text-[10px] text-slate-500 font-normal flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {formatDateIndo(item.tanggal)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{item.sumber}</div>
                      <div className="text-[10px] text-slate-500">{item.metode === "TRANSFER_BANK" ? "Transfer Bank" : "Kas Tunai"}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.kategori === "PEMERINTAH"
                          ? "bg-emerald-100 text-emerald-800"
                          : item.kategori === "DESA"
                          ? "bg-blue-100 text-blue-800"
                          : item.kategori === "HIBAH_CSR"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {item.kategori}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-700 max-w-xs">
                      <div className="font-medium line-clamp-2">{item.peruntukan}</div>
                      {item.catatan && <div className="text-[10px] text-slate-400 mt-0.5 italic">{item.catatan}</div>}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {item.buktiDokumen ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                          {item.buktiDokumen}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-emerald-700 text-sm">
                      {formatRupiah(item.nominal)}
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-[11px]">
                      {item.penerima}
                    </td>
                    {canEdit && (
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => handleDelete(item.id, item.sumber)}
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

      {/* Modal Form Tambah Penyertaan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-indigo-700" />
                <h4 className="font-extrabold text-slate-900 text-base">Catat Penyertaan Modal Masuk</h4>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Sumber / Pemberi Modal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kemendesa PDTT / Pemdes Lubuk Ogung (APBDes) / PT. Sawit"
                  value={form.sumber}
                  onChange={(e) => setForm({ ...form, sumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Sumber</label>
                  <select
                    value={form.kategori}
                    onChange={(e) => setForm({ ...form, kategori: e.target.value as KategoriPenyertaanModal })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                  >
                    <option value="PEMERINTAH">Pemerintah RI / Kementerian</option>
                    <option value="DESA">Pemerintah Desa (APBDes)</option>
                    <option value="HIBAH_CSR">Hibah CSR Perusahaan</option>
                    <option value="PIHAK_KETIGA">Investor / Pihak Ketiga</option>
                    <option value="LAINNYA">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Metode Masuk</label>
                  <select
                    value={form.metode}
                    onChange={(e) => setForm({ ...form, metode: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                  >
                    <option value="TRANSFER_BANK">Transfer Rekening Bank</option>
                    <option value="KAS_TUNAI">Uang Kas Tunai</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nominal Dana (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={100000}
                    step={100000}
                    placeholder="Contoh: 35000000"
                    value={form.nominal || ""}
                    onChange={(e) => setForm({ ...form, nominal: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  {form.nominal > 0 && (
                    <div className="text-[10px] text-indigo-700 font-bold mt-1">
                      {formatRupiah(form.nominal)}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Diterima</label>
                  <input
                    type="date"
                    required
                    value={form.tanggal}
                    onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Peruntukan Modal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Modal Awal Pembangunan Gedung & Pengadaan Sarana Toko"
                  value={form.peruntukan}
                  onChange={(e) => setForm({ ...form, peruntukan: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bukti / Dokumen Dasar Hukum (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Perdes No. 02/2026 / SK Bupati / MoU Kemitraan"
                  value={form.buktiDokumen}
                  onChange={(e) => setForm({ ...form, buktiDokumen: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan alokasi dana atau klausul lainnya..."
                  value={form.catatan}
                  onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                  className="px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold shadow-md shadow-indigo-200"
                >
                  Simpan Penyertaan Modal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
