"use client";

import React, { useState, useEffect } from "react";
import { DataStore } from "@/lib/store";
import {
  PerjalananDinas,
  PerjalananDinasRate,
  TingkatPerjalananDinas,
  UserRole,
} from "@/types";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import {
  Briefcase,
  Plus,
  CheckCircle2,
  Clock,
  Printer,
  Calendar,
  MapPin,
  FileText,
  DollarSign,
  AlertCircle,
  XCircle,
  Settings,
  ChevronRight,
  Shield,
  UserCheck,
  Building,
} from "lucide-react";
import { RpBadge } from "@/components/RupiahIcons";

interface PerjalananDinasModuleProps {
  userRole: UserRole;
  currentUserName: string;
}

export function PerjalananDinasModule({
  userRole,
  currentUserName,
}: PerjalananDinasModuleProps) {
  const [sppdList, setSppdList] = useState<PerjalananDinas[]>([]);
  const [rates, setRates] = useState<PerjalananDinasRate[]>([]);
  const [activeTab, setActiveTab] = useState<"daftar" | "tambah" | "tarif">("daftar");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [selectedSppd, setSelectedSppd] = useState<PerjalananDinas | null>(null);

  // Form State Pengajuan Baru
  const [namaPegawai, setNamaPegawai] = useState(currentUserName);
  const [jabatan, setJabatan] = useState(userRole === "PENGAWAS" ? "Dewan Pengawas" : userRole === "MANAGER" ? "Manager Koperasi" : userRole === "BENDAHARA" ? "Bendahara" : userRole === "MASTER" ? "Ketua Dewan Pengawas" : "Pengurus / Staf");
  const [keperluan, setKeperluan] = useState("");
  const [tujuan, setTujuan] = useState("");
  const [tingkat, setTingkat] = useState<TingkatPerjalananDinas>("DALAM_KABUPATEN");
  const [tanggalBerangkat, setTanggalBerangkat] = useState(new Date().toISOString().split("T")[0]);
  const [tanggalKembali, setTanggalKembali] = useState(new Date().toISOString().split("T")[0]);
  const [customNotes, setCustomNotes] = useState("");

  // Master Edit Tarif State
  const [editRates, setEditRates] = useState<PerjalananDinasRate[]>([]);
  const [rateSuccessMsg, setRateSuccessMsg] = useState("");

  const refreshData = () => {
    const data = DataStore.getPerjalananDinas();
    setSppdList(data);
    const config = DataStore.getConfig();
    const currentRates = config.sbmPerjalananDinas || [
      { tingkat: "DALAM_KECAMATAN", label: "Dalam Kecamatan (Bandar Sei Kijang)", uangHarian: 150000, transport: 75000, penginapan: 0 },
      { tingkat: "DALAM_KABUPATEN", label: "Kabupaten Pelalawan (Pangkalan Kerinci)", uangHarian: 250000, transport: 200000, penginapan: 250000 },
      { tingkat: "LUAR_KABUPATEN_PROVINSI", label: "Provinsi Riau (Pekanbaru / Luar Kabupaten)", uangHarian: 350000, transport: 400000, penginapan: 400000 },
      { tingkat: "LUAR_PROVINSI", label: "Luar Provinsi Riau (Jakarta / Nasional)", uangHarian: 500000, transport: 1500000, penginapan: 650000 },
    ];
    setRates(currentRates);
    setEditRates(JSON.parse(JSON.stringify(currentRates)));
  };

  useEffect(() => {
    refreshData();
    window.addEventListener("kopdes-data-synced", refreshData);
    return () => window.removeEventListener("kopdes-data-synced", refreshData);
  }, []);

  // Hitung durasi hari
  const startD = new Date(tanggalBerangkat);
  const endD = new Date(tanggalKembali);
  const diffTime = Math.max(0, endD.getTime() - startD.getTime());
  const calculatedDays = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);

  // Ambil tarif berdasarkan tingkat tujuan yang dipilih
  const currentRateObj = rates.find((r) => r.tingkat === tingkat) || rates[0];
  const calculatedUangHarian = (currentRateObj?.uangHarian || 0) * calculatedDays;
  const calculatedTransport = currentRateObj?.transport || 0;
  const calculatedPenginapan = calculatedDays > 1 ? (calculatedDays - 1) * (currentRateObj?.penginapan || 0) : 0;
  const calculatedTotal = calculatedUangHarian + calculatedTransport + calculatedPenginapan;

  const handleAjukanSppd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPegawai.trim() || !keperluan.trim() || !tujuan.trim()) {
      alert("Harap lengkapi semua kolom wajib!");
      return;
    }

    const romawiBulan = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][new Date().getMonth()];
    const nomorUrut = String(sppdList.length + 1).padStart(3, "0");
    const nomorSppd = `${nomorUrut}/SPPD/KOPDES-LO/${romawiBulan}/${new Date().getFullYear()}`;

    const newSppd: PerjalananDinas = {
      id: `sppd-${Date.now()}`,
      nomorSppd,
      namaPegawai,
      jabatan,
      keperluan,
      tujuan,
      tingkat,
      tanggalBerangkat,
      tanggalKembali,
      lamaHari: calculatedDays,
      uangHarian: calculatedUangHarian,
      biayaTransport: calculatedTransport,
      biayaPenginapan: calculatedPenginapan,
      totalBiaya: calculatedTotal,
      status: "DIAJUKAN",
      tanggalPengajuan: new Date().toISOString().split("T")[0],
      notes: customNotes,
    };

    DataStore.addPerjalananDinas(newSppd);
    alert(`Pengajuan SPPD ${nomorSppd} berhasil dikirim ke Bendahara & Master!`);
    setKeperluan("");
    setTujuan("");
    setCustomNotes("");
    setActiveTab("daftar");
  };

  const handleApprove = (id: string) => {
    if (confirm("Setujui pengajuan perjalanan dinas ini?")) {
      DataStore.approvePerjalananDinas(id, currentUserName);
      alert("SPPD disetujui! Bendahara sekarang dapat mencairkan dana.");
    }
  };

  const handleDisburse = (id: string) => {
    if (confirm("Cairkan dana kas untuk perjalanan dinas ini sekarang? Kas keluar akan langsung tercatat di BKU.")) {
      DataStore.disbursePerjalananDinas(id, currentUserName);
      alert("Dana SPPD berhasil dicairkan dan dibukukan ke BKU!");
    }
  };

  const handleReject = (id: string) => {
    const reason = prompt("Masukkan alasan penolakan SPPD:") || "Ditolak oleh pengurus";
    DataStore.rejectPerjalananDinas(id, reason);
    alert("SPPD telah ditolak.");
  };

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    DataStore.updateSbmPerjalananDinas(editRates);
    setRateSuccessMsg("Standar Biaya Masukan (SBM) Perjalanan Dinas berhasil diperbarui oleh Master!");
    setTimeout(() => setRateSuccessMsg(""), 4000);
  };

  // Filter list
  const filteredList = sppdList.filter((item) => {
    const matchStatus = filterStatus === "ALL" || item.status === filterStatus;
    const matchSearch =
      item.nomorSppd.toLowerCase().includes(search.toLowerCase()) ||
      item.namaPegawai.toLowerCase().includes(search.toLowerCase()) ||
      item.tujuan.toLowerCase().includes(search.toLowerCase()) ||
      item.keperluan.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalDicairkan = sppdList
    .filter((s) => s.status === "DICAIRKAN")
    .reduce((sum, s) => sum + s.totalBiaya, 0);

  const totalMenunggu = sppdList
    .filter((s) => s.status === "DIAJUKAN" || s.status === "DISETUJUI")
    .reduce((sum, s) => sum + s.totalBiaya, 0);

  return (
    <div className="space-y-6">
      {/* HEADER MODUL */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-lg border border-indigo-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-semibold text-indigo-300">
            <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
            Tata Kelola Operasional & SPPD Koperasi
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Surat Perintah Perjalanan Dinas (SPPD)
          </h2>
          <p className="text-xs text-indigo-200/80 max-w-2xl leading-relaxed">
            Pengelolaan dana perjalanan dinas stakeholder koperasi desa. Transparan, terstandar aturan SBM,
            dan dicairkan oleh Bendahara/Master dengan akuntabilitas penuh.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("daftar")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "daftar"
                ? "bg-white text-slate-900 shadow-sm"
                : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
            }`}
          >
            <FileText className="w-4 h-4" /> Daftar SPPD ({sppdList.length})
          </button>

          <button
            onClick={() => setActiveTab("tambah")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "tambah"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-emerald-700/60 hover:bg-emerald-600 text-white border border-emerald-500/30"
            }`}
          >
            <Plus className="w-4 h-4" /> Ajukan SPPD
          </button>

          {/* TAB TARIF SBM: HANYA MASTER YANG DAPAT MENGUBAH */}
          {userRole === "MASTER" && (
            <button
              onClick={() => setActiveTab("tarif")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "tarif"
                  ? "bg-amber-500 text-slate-900 shadow-sm"
                  : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30"
              }`}
            >
              <Settings className="w-4 h-4" /> Atur Nilai SBM Dinas (Master)
            </button>
          )}
        </div>
      </div>

      {/* KPI RINGKASAN PERJALANAN DINAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase">Total SPPD Terdata</span>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{sppdList.length} Kegiatan</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Dinas keluar daerah / kota</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase">Total Kas Terserap (Dicairkan)</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1 font-mono">{formatRupiah(totalDicairkan)}</div>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Tercatat resmi di BKU Bendahara</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase">Menunggu Persetujuan / Cair</span>
            <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1 font-mono">{formatRupiah(totalMenunggu)}</div>
            <p className="text-[11px] text-amber-700 font-medium mt-0.5">Perlu verifikasi Master / Bendahara</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* VIEW: TAB DAFTAR SPPD */}
      {activeTab === "daftar" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              {["ALL", "DIAJUKAN", "DISETUJUI", "DICAIRKAN", "DITOLAK"].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterStatus === st
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  {st === "ALL" ? "Semua Status" : st}
                </button>
              ))}
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Cari SPPD, nama, atau tujuan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* TABEL SPPD */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-3">No. SPPD / Tanggal</th>
                  <th className="py-3 px-3">Pegawai / Jabatan</th>
                  <th className="py-3 px-3">Tujuan & Maksud Dinas</th>
                  <th className="py-3 px-3 text-center">Durasi</th>
                  <th className="py-3 px-3 text-right">Total Anggaran</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Aksi / Otorisasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      Tidak ada data perjalanan dinas yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => {
                    const statusBadge = {
                      DIAJUKAN: "bg-amber-100 text-amber-800 border-amber-200",
                      DISETUJUI: "bg-blue-100 text-blue-800 border-blue-200",
                      DICAIRKAN: "bg-emerald-100 text-emerald-800 border-emerald-200",
                      DITOLAK: "bg-rose-100 text-rose-800 border-rose-200",
                    }[item.status];

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-3">
                          <span className="font-mono font-bold text-indigo-900 block">{item.nomorSppd}</span>
                          <span className="text-[10px] text-slate-400">{formatDateIndo(item.tanggalPengajuan)}</span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-slate-900 block">{item.namaPegawai}</span>
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">{item.jabatan}</span>
                        </td>
                        <td className="py-3.5 px-3 max-w-xs">
                          <span className="font-semibold text-slate-800 block flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" /> {item.tujuan}
                          </span>
                          <span className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{item.keperluan}</span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="font-bold text-slate-800 block">{item.lamaHari} Hari</span>
                          <span className="text-[10px] text-slate-400">
                            {item.tanggalBerangkat} s/d {item.tanggalKembali}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <span className="font-mono font-bold text-slate-900 text-sm block">
                            {formatRupiah(item.totalBiaya)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Harian: {formatRupiah(item.uangHarian)} | Trans: {formatRupiah(item.biayaTransport)}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusBadge}`}>
                            {item.status}
                          </span>
                          {item.status === "DICAIRKAN" && item.disbursedBy && (
                            <span className="block text-[9px] text-slate-400 mt-1">
                              Cair oleh: {item.disbursedBy}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5">
                            {/* TOMBOL APPROVAL KHUSUS MASTER */}
                            {userRole === "MASTER" && item.status === "DIAJUKAN" && (
                              <>
                                <button
                                  onClick={() => handleApprove(item.id)}
                                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-xs"
                                >
                                  Setujui
                                </button>
                                <button
                                  onClick={() => handleReject(item.id)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px]"
                                >
                                  Tolak
                                </button>
                              </>
                            )}

                            {/* TOMBOL PENCAIRAN OLEH BENDAHARA / MASTER */}
                            {(userRole === "BENDAHARA" || userRole === "MASTER") &&
                              item.status === "DISETUJUI" && (
                                <button
                                  onClick={() => handleDisburse(item.id)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs flex items-center gap-1"
                                >
                                  <DollarSign className="w-3.5 h-3.5" /> Cairkan Dana
                                </button>
                              )}

                            {/* TAMPILAN INFORMATIF / CETAK SPPD */}
                            <button
                              onClick={() => setSelectedSppd(item)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] flex items-center gap-1"
                            >
                              <Printer className="w-3.5 h-3.5" /> Cetak / Detail
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: TAB PENGAJUAN SPPD BARU */}
      {activeTab === "tambah" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900">Form Pengajuan Surat Perintah Perjalanan Dinas (SPPD)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Besaran uang harian, transportasi, dan penginapan dihitung otomatis berdasarkan <strong>Standar Biaya Masukan (SBM)</strong> yang ditetapkan oleh Master.
            </p>
          </div>

          <form onSubmit={handleAjukanSppd} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pegawai / Stakeholder Bertugas *</label>
                <input
                  type="text"
                  required
                  value={namaPegawai}
                  onChange={(e) => setNamaPegawai(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jabatan dalam Koperasi *</label>
                <input
                  type="text"
                  required
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tingkat Wilayah Tujuan (Standar SBM) *</label>
                <select
                  value={tingkat}
                  onChange={(e) => setTingkat(e.target.value as TingkatPerjalananDinas)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {rates.map((r) => (
                    <option key={r.tingkat} value={r.tingkat}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kota / Lokasi Spesifik Tujuan *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Kantor Diskop Kab. Pelalawan / Hotel Grand Central Pekanbaru"
                  value={tujuan}
                  onChange={(e) => setTujuan(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Maksud & Keperluan Perjalanan Dinas *</label>
              <textarea
                required
                rows={2}
                placeholder="Jelaskan agenda dinas resmi (contoh: Mengikuti Pelatihan Pengawasan Koperasi Desa, Kulakan sembako beras langsung distributor)..."
                value={keperluan}
                onChange={(e) => setKeperluan(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Berangkat *</label>
                <input
                  type="date"
                  required
                  value={tanggalBerangkat}
                  onChange={(e) => setTanggalBerangkat(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Kembali *</label>
                <input
                  type="date"
                  required
                  value={tanggalKembali}
                  onChange={(e) => setTanggalKembali(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Durasi Hari (Otomatis)</label>
                <div className="px-3.5 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-800 border border-slate-200">
                  {calculatedDays} Hari Kalender
                </div>
              </div>
            </div>

            {/* PREVIEW KALKULASI SBM DINAS */}
            <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-5 space-y-3">
              <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider block">
                Rincian Estimasi Biaya Berdasarkan Tarif SBM Master:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-indigo-100">
                  <span className="text-slate-500 block text-[11px]">Uang Harian ({calculatedDays}x):</span>
                  <span className="font-bold text-slate-900">{formatRupiah(calculatedUangHarian)}</span>
                  <span className="text-[10px] text-slate-400 block">Rp {currentRateObj?.uangHarian.toLocaleString("id-ID")}/hari</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-indigo-100">
                  <span className="text-slate-500 block text-[11px]">Transport / BBM / Tol:</span>
                  <span className="font-bold text-slate-900">{formatRupiah(calculatedTransport)}</span>
                  <span className="text-[10px] text-slate-400 block">Lump sum standar</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-indigo-100">
                  <span className="text-slate-500 block text-[11px]">Penginapan ({calculatedDays > 1 ? calculatedDays - 1 : 0} malam):</span>
                  <span className="font-bold text-slate-900">{formatRupiah(calculatedPenginapan)}</span>
                  <span className="text-[10px] text-slate-400 block">Rp {currentRateObj?.penginapan.toLocaleString("id-ID")}/malam</span>
                </div>
                <div className="bg-indigo-600 text-white p-3 rounded-xl shadow-xs">
                  <span className="text-indigo-100 block text-[11px]">Total Anggaran SPPD:</span>
                  <span className="font-black text-base">{formatRupiah(calculatedTotal)}</span>
                  <span className="text-[10px] text-indigo-200 block">Akan diajukan ke Bendahara</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
              <input
                type="text"
                placeholder="Misal: Nomor surat undangan atau catatan pendukung lainnya..."
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("daftar")}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Kirim Pengajuan SPPD
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW: TAB KHUSUS MASTER UNTUK ATUR STANDAR BIAYA PERJALANAN DINAS (SBM) */}
      {activeTab === "tarif" && userRole === "MASTER" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-2">
              <Shield className="w-3.5 h-3.5 text-amber-700" /> Hak Khusus Master Koperasi
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Pengaturan Standar Biaya Masukan (SBM) Perjalanan Dinas
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Sebagai Master, Anda berwenang menentukan besaran nilai uang harian, transport, dan penginapan.
              Semua pengajuan oleh Manager, Bendahara, Pengawas, maupun staf akan otomatis mengikuti tarif yang Anda tetapkan di sini.
            </p>
          </div>

          {rateSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {rateSuccessMsg}
            </div>
          )}

          <form onSubmit={handleSaveRates} className="space-y-6">
            <div className="space-y-4">
              {editRates.map((r, idx) => (
                <div key={r.tingkat} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" /> {r.label}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {r.tingkat}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Uang Harian / Saku / Makan (Per Hari):
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={r.uangHarian}
                        onChange={(e) => {
                          const updated = [...editRates];
                          updated[idx].uangHarian = Number(e.target.value);
                          setEditRates(updated);
                        }}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Biaya Transport / BBM / Travel:
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={r.transport}
                        onChange={(e) => {
                          const updated = [...editRates];
                          updated[idx].transport = Number(e.target.value);
                          setEditRates(updated);
                        }}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Biaya Penginapan (Per Malam):
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={r.penginapan}
                        onChange={(e) => {
                          const updated = [...editRates];
                          updated[idx].penginapan = Number(e.target.value);
                          setEditRates(updated);
                        }}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Simpan Perubahan Tarif SBM Master
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL CETAK / DETAIL LEMBAR SPPD RESMI */}
      {selectedSppd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            {/* KOP RESMI CETAK */}
            <div className="border-b-2 border-slate-900 pb-3 text-center">
              <h3 className="text-base font-black uppercase text-slate-900">
                KOPERASI DESA MERAH PUTIH LUBUK OGUNG
              </h3>
              <p className="text-[11px] text-slate-600 font-medium">
                Badan Hukum: AHU-0029381.AH.01.26.TAHUN 2026 &bull; Kec. Bandar Sei Kijang, Kab. Pelalawan
              </p>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mt-2 underline">
                SURAT PERINTAH PERJALANAN DINAS (SPPD)
              </h4>
              <p className="text-xs font-mono text-slate-700">Nomor: {selectedSppd.nomorSppd}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                <span className="font-semibold text-slate-500">1. Nama Pegawai yang Bertugas</span>
                <span className="col-span-2 font-bold text-slate-900">{selectedSppd.namaPegawai}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                <span className="font-semibold text-slate-500">2. Jabatan</span>
                <span className="col-span-2 font-bold text-slate-900">{selectedSppd.jabatan}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                <span className="font-semibold text-slate-500">3. Maksud / Keperluan Dinas</span>
                <span className="col-span-2 font-medium text-slate-800 leading-relaxed">{selectedSppd.keperluan}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                <span className="font-semibold text-slate-500">4. Tempat / Kota Tujuan</span>
                <span className="col-span-2 font-bold text-slate-900">{selectedSppd.tujuan}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                <span className="font-semibold text-slate-500">5. Lama Perjalanan</span>
                <span className="col-span-2 font-bold text-slate-900">
                  {selectedSppd.lamaHari} Hari ({selectedSppd.tanggalBerangkat} s/d {selectedSppd.tanggalKembali})
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                <span className="font-semibold text-slate-500">6. Rincian Biaya (SBM)</span>
                <div className="col-span-2 space-y-1">
                  <div className="flex justify-between">
                    <span>- Uang Harian:</span>
                    <span className="font-mono">{formatRupiah(selectedSppd.uangHarian)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>- Biaya Transport / BBM:</span>
                    <span className="font-mono">{formatRupiah(selectedSppd.biayaTransport)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>- Biaya Penginapan:</span>
                    <span className="font-mono">{formatRupiah(selectedSppd.biayaPenginapan)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                    <span>Total Biaya SPPD:</span>
                    <span className="font-mono text-emerald-700">{formatRupiah(selectedSppd.totalBiaya)}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                <span className="font-semibold text-slate-500">7. Status Pencairan Kas</span>
                <span className="col-span-2 font-bold text-slate-900">
                  {selectedSppd.status} {selectedSppd.disbursedBy ? `(Dicairkan oleh: ${selectedSppd.disbursedBy})` : ""}
                </span>
              </div>
              {selectedSppd.hasilLaporan && (
                <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                  <span className="font-semibold text-slate-500">8. Laporan Hasil Tugas</span>
                  <span className="col-span-2 text-slate-700 bg-slate-50 p-2 rounded-lg leading-relaxed">
                    {selectedSppd.hasilLaporan}
                  </span>
                </div>
              )}
            </div>

            {/* KOLOM TANDA TANGAN */}
            <div className="grid grid-cols-2 text-center text-xs pt-4 gap-4">
              <div>
                <p className="text-slate-500">Mengetahui / Menyetujui,</p>
                <p className="font-bold text-slate-900 mt-1">Master / Dewan Pengawas</p>
                <div className="h-16 flex items-end justify-center font-bold text-slate-800">
                  {selectedSppd.approvedBy || "( .............................. )"}
                </div>
              </div>
              <div>
                <p className="text-slate-500">Telah Dicairkan Kas,</p>
                <p className="font-bold text-slate-900 mt-1">Bendahara Koperasi</p>
                <div className="h-16 flex items-end justify-center font-bold text-slate-800">
                  {selectedSppd.disbursedBy || "( .............................. )"}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <button
                onClick={() => setSelectedSppd(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Cetak Lembar SPPD PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
