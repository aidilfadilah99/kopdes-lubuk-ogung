"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { DataStore } from "@/lib/store";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  CooperativeConfig,
  Loan,
  LoanInstallment,
  Member,
  SavingsTransaction,
} from "@/types";
import {
  formatDateIndo,
  formatRupiah,
  getLoanStatusBadge,
} from "@/lib/utils";
import {
  User,
  Wallet,
  Calculator,
  Send,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  FileText,
  XCircle,
} from "lucide-react";

function AnggotaPortalContent() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"tabungan" | "pinjaman" | "simulasi">("tabungan");

  const [member, setMember] = useState<Member | null>(null);
  const [mySavings, setMySavings] = useState<SavingsTransaction[]>([]);
  const [myLoans, setMyLoans] = useState<Loan[]>([]);
  const [myInstallments, setMyInstallments] = useState<LoanInstallment[]>([]);
  const [config, setConfig] = useState<CooperativeConfig | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Loan application state
  const [applyAmount, setApplyAmount] = useState<number>(5000000);
  const [applyTenor, setApplyTenor] = useState<number>(10);
  const [applyPurpose, setApplyPurpose] = useState<string>("");
  const [applyCollateral, setApplyCollateral] = useState<string>("");

  const refreshData = () => {
    if (!currentUser) return;
    const members = DataStore.getMembers();
    // Match member by memberId first, then by NIK
    const foundMember =
      members.find((m) => m.id === currentUser.memberId) ||
      members.find((m) => currentUser.nik && m.nik === currentUser.nik);

    setMember(foundMember || null);

    if (foundMember) {
      const allSavings = DataStore.getSavings();
      setMySavings(allSavings.filter((s) => s.memberId === foundMember.id));

      const allLoans = DataStore.getLoans();
      setMyLoans(allLoans.filter((l) => l.memberId === foundMember.id));

      const allIns = DataStore.getInstallments();
      setMyInstallments(allIns.filter((i) => i.memberId === foundMember.id));
    }

    setConfig(DataStore.getConfig());
  };

  useEffect(() => {
    refreshData();
  }, [currentUser]);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 5000);
  };

  // Calculate monthly installment simulation
  const interestRate = config?.defaultLoanInterestRate || 1.0;
  const principalMonthly = applyTenor > 0 ? Math.round(applyAmount / applyTenor) : 0;
  const interestMonthly = Math.round(applyAmount * (interestRate / 100));
  const totalMonthlyInstallment = principalMonthly + interestMonthly;

  // Handle Submit Loan
  const handleApplyLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || !currentUser) return;
    if (applyAmount < 500000) {
      notify("⚠️ Pengajuan pinjaman minimal Rp 500.000.");
      return;
    }
    if (!applyPurpose.trim()) {
      notify("⚠️ Harap sebutkan tujuan peminjaman modal usaha.");
      return;
    }

    const loanId = `pinj-${new Date().getFullYear()}-${String(DataStore.getLoans().length + 1).padStart(3, "0")}`;
    const newLoan: Loan = {
      id: loanId,
      memberId: member.id,
      memberName: member.name,
      memberNik: member.nik,
      amount: applyAmount,
      tenorMonths: applyTenor,
      interestRatePercent: interestRate,
      monthlyInstallment: totalMonthlyInstallment,
      purpose: applyPurpose,
      submissionDate: new Date().toISOString().split("T")[0],
      status: "PENDING_ADMIN",
      remainingAmount: applyAmount,
      collateralDescription: applyCollateral || "Surat Keterangan Usaha / Domisili Desa",
    };

    DataStore.createLoan(newLoan);
    DataStore.addAuditLog(
      "AJUKAN_PINJAMAN_ANGGOTA",
      `Anggota ${member.name} mengajukan pinjaman ${formatRupiah(applyAmount)} untuk keperluan: ${applyPurpose}`,
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );

    notify(`Pengajuan pinjaman ${formatRupiah(applyAmount)} berhasil dikirimkan ke Admin untuk diverifikasi!`);
    setApplyPurpose("");
    setApplyCollateral("");
    refreshData();
    setActiveTab("pinjaman");
  };

  // Savings breakdown
  const simpananPokok = mySavings.filter((s) => s.type === "POKOK").reduce((a, b) => a + b.amount, 0);
  const simpananWajib = mySavings.filter((s) => s.type === "WAJIB").reduce((a, b) => a + b.amount, 0);
  const simpananSukarela = mySavings.filter((s) => s.type === "SUKARELA").reduce((a, b) => a + b.amount, 0);
  const totalSimpanan = simpananPokok + simpananWajib + simpananSukarela;

  // Estimated personal SHU (proportional calculation demo)
  const estimatedShuMember = Math.round(totalSimpanan * 0.08);

  // ProtectedRoute guarantees currentUser is non-null here, but TS still needs this
  if (!currentUser) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast */}
      {notification && (
        <div className="p-4 rounded-xl bg-amber-600 text-white font-medium text-sm shadow-lg flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {notification}
          </div>
          <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white text-xs">
            Tutup
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 to-yellow-800 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/40 border border-amber-300/30 text-xs font-semibold text-amber-100 uppercase tracking-wider">
            <User className="w-4 h-4 text-amber-200" />
            Portal Mandiri Anggota Koperasi
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang, {member?.name || currentUser.name}
          </h1>
          <p className="text-sm text-amber-100">
            {member?.occupation} &bull; {member?.dusun}, Desa Lubuk Ogung &bull; NIK: {member?.nik}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur border border-white/20 p-4 rounded-2xl text-right">
          <span className="text-xs text-amber-200 block">Total Tabungan Anda</span>
          <span className="text-2xl font-extrabold text-white">
            {formatRupiah(totalSimpanan)}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("tabungan")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === "tabungan"
              ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Wallet className="w-4 h-4" />
          Rincian Tabungan & SHU
        </button>

        <button
          onClick={() => setActiveTab("pinjaman")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === "pinjaman"
              ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Pinjaman Aktif ({myLoans.length})
        </button>

        <button
          onClick={() => setActiveTab("simulasi")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === "simulasi"
              ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Calculator className="w-4 h-4" />
          Ajukan Pinjaman Baru
        </button>
      </div>

      {/* TAB 1: TABUNGAN & SHU */}
      {activeTab === "tabungan" && (
        <div className="space-y-8">
          {/* 3 Savings Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Simpanan Pokok</span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                {formatRupiah(simpananPokok)}
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Lunas di awal
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Simpanan Wajib</span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                {formatRupiah(simpananWajib)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-2">
                Iuran bulanan anggota
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Simpanan Sukarela</span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                {formatRupiah(simpananSukarela)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-2">
                Dapat ditarik sewaktu-waktu
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-100 p-5 rounded-2xl shadow-sm border border-amber-200">
              <span className="text-xs text-amber-800 font-bold flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-amber-600" /> Estimasi SHU 2026
              </span>
              <h3 className="text-xl font-extrabold text-amber-950 mt-1">
                {formatRupiah(estimatedShuMember)}
              </h3>
              <p className="text-[10px] text-amber-700 mt-2">
                Bagi hasil dihitung dari perputaran simpanan & jasa koperasi
              </p>
            </div>
          </div>

          {/* Savings History Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Riwayat Setoran Simpanan Saya</h3>
                <p className="text-xs text-slate-500">Bukti seluruh setoran yang tercatat di pembukuan bendahara.</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {mySavings.map((s) => (
                <div key={s.id} className="p-4 hover:bg-slate-50 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">
                      Setoran Simpanan {s.type}
                    </div>
                    <div className="text-slate-500 text-[11px]">{s.notes}</div>
                    <div className="text-slate-400 text-[10px]">
                      Tanggal: {formatDateIndo(s.date)} &bull; Diterima oleh: {s.officerName}
                    </div>
                  </div>
                  <div className="font-extrabold text-emerald-600 text-sm">
                    +{formatRupiah(s.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY LOANS */}
      {activeTab === "pinjaman" && (
        <div className="space-y-6">
          {myLoans.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">Belum Ada Pengajuan Pinjaman</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Anda tidak memiliki tanggungan pinjaman saat ini. Butuh modal usaha kebun atau dagang?
              </p>
              <button
                onClick={() => setActiveTab("simulasi")}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
              >
                Ajukan Pinjaman Sekarang
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {myLoans.map((loan) => {
                const statusBadge = getLoanStatusBadge(loan.status);
                const loanInstallments = myInstallments.filter((i) => i.loanId === loan.id);
                const isRejected = loan.status === "REJECTED";
                const rejector = loan.rejectedBy || loan.masterApprover || loan.adminReviewer;

                return (
                  <div
                    key={loan.id}
                    className={`bg-white rounded-2xl shadow-sm border p-6 space-y-6 transition-all ${
                      isRejected ? "border-rose-300 ring-1 ring-rose-200" : "border-slate-200"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {loan.id}
                          </span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${statusBadge.className}`}>
                            {statusBadge.label}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-base mt-2">
                          {loan.purpose}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Diajukan pada {formatDateIndo(loan.submissionDate)}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        {isRejected ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200">
                            <XCircle className="w-4 h-4 text-rose-600" />
                            Status: Tidak Disetujui
                          </div>
                        ) : (
                          <>
                            <span className="text-xs text-slate-400 block">Sisa Kewajiban Pokok + Jasa:</span>
                            <span className="text-xl font-extrabold text-slate-900">
                              {formatRupiah(loan.remainingAmount)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* BANNER ALASAN PENOLAKAN DARI PENGURUS */}
                    {isRejected && (
                      <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center flex-shrink-0 text-rose-700">
                            <XCircle className="w-6 h-6 text-rose-600" />
                          </div>
                          <div className="space-y-1 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h4 className="text-xs font-extrabold text-rose-900 uppercase tracking-wider">
                                Keterangan Alasan Penolakan Pengajuan
                              </h4>
                              {rejector && (
                                <span className="text-[11px] font-bold text-rose-700 bg-white/80 px-2.5 py-0.5 rounded-full border border-rose-200">
                                  Ditolak oleh: {rejector}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-rose-600">
                              {loan.rejectionDate
                                ? `Tanggal keputusan: ${formatDateIndo(loan.rejectionDate)}`
                                : "Diverifikasi melalui verifikasi berkas koperasi desa"}
                            </p>
                          </div>
                        </div>

                        {/* Catatan Alasan dari Pengurus */}
                        <div className="bg-white rounded-xl border border-rose-200 p-4 shadow-sm">
                          <p className="text-[11px] text-rose-500 font-bold uppercase tracking-wider mb-1">
                            Alasan / Catatan Penolakan:
                          </p>
                          <p className="text-sm font-semibold text-rose-950 leading-relaxed italic bg-rose-50/50 p-2.5 rounded-lg border border-rose-100">
                            &ldquo;{loan.rejectionReason || "Syarat administrasi atau kelayakan dokumen agunan belum memenuhi kriteria AD/ART Koperasi Desa Lubuk Ogung."}&rdquo;
                          </p>
                        </div>

                        <div className="text-xs text-rose-800 bg-rose-100/70 p-3 rounded-xl flex items-start gap-2 leading-relaxed">
                          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                          <span>
                            <strong>Petunjuk untuk Anggota:</strong> Mohon perbaiki atau lengkapi persyaratan sesuai catatan di atas. Setelah dokumen siap, Anda dapat mengajukan permohonan pinjaman baru melalui tab <strong>Simulasi & Pengajuan</strong>.
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <span className="text-slate-400 block">Plafon Pinjaman</span>
                        <span className="font-bold text-slate-800 text-sm">{formatRupiah(loan.amount)}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <span className="text-slate-400 block">Tenor Pinjaman</span>
                        <span className="font-bold text-slate-800 text-sm">{loan.tenorMonths} Bulan</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <span className="text-slate-400 block">Angsuran / Bulan</span>
                        <span className="font-bold text-emerald-700 text-sm">{formatRupiah(loan.monthlyInstallment)}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <span className="text-slate-400 block">Jaminan Terdaftar</span>
                        <span className="font-medium text-slate-700 line-clamp-1">{loan.collateralDescription || "-"}</span>
                      </div>
                    </div>

                    {/* Installments Table */}
                    {loanInstallments.length > 0 && (
                      <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                        <div className="bg-slate-100 px-4 py-2 font-bold text-slate-700">
                          Jadwal Angsuran Bulanan
                        </div>
                        <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto">
                          {loanInstallments.map((ins) => (
                            <div key={ins.id} className="px-4 py-2.5 flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-slate-800">
                                  Cicilan Ke-{ins.installmentNo}
                                </span>
                                <span className="text-slate-400 ml-2">
                                  (Jatuh tempo: {formatDateIndo(ins.dueDate)})
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-slate-900">
                                  {formatRupiah(ins.amount)}
                                </span>
                                {ins.status === "PAID" ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    Lunas
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                                    Belum Bayar
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SIMULASI & FORMULIR PINJAMAN */}
      {activeTab === "simulasi" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Formulir Permohonan Pinjaman Modal Usaha
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Khusus anggota Koperasi Desa Merah Putih Lubuk Ogung. Bunga flat 1% per bulan.
            </p>

            <form onSubmit={handleApplyLoan} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nominal Plafon yang Diajukan (Rp)
                </label>
                <input
                  type="number"
                  step="500000"
                  min="500000"
                  max="50000000"
                  required
                  value={applyAmount}
                  onChange={(e) => setApplyAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-lg font-extrabold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Terbilang: {formatRupiah(applyAmount)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Jangka Waktu (Tenor Bulan)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[3, 6, 10, 12, 18, 24].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setApplyTenor(t)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        applyTenor === t
                          ? "bg-amber-50 text-amber-900 border-amber-500 ring-2 ring-amber-400 font-extrabold"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {t} Bulan
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tujuan Penggunaan Modal
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Pembelian pupuk NPK & herbisida untuk kebun sawit seluas 2 hektar di Dusun II."
                  value={applyPurpose}
                  onChange={(e) => setApplyPurpose(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Agunan / Jaminan Penguat
                </label>
                <input
                  type="text"
                  placeholder="Contoh: SKGR No. 120/SKGR/LO/2021 atau BPKB Sepeda Motor"
                  value={applyCollateral}
                  onChange={(e) => setApplyCollateral(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Kirim Pengajuan Pinjaman ke Pengurus Koperasi
              </button>
            </form>
          </div>

          {/* Calculator Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Calculator className="w-4 h-4" /> Simulasi Angsuran
              </div>

              <div className="border-b border-slate-700 pb-4">
                <span className="text-xs text-slate-400">Total Pinjaman:</span>
                <div className="text-2xl font-extrabold text-white mt-1">
                  {formatRupiah(applyAmount)}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tenor:</span>
                  <span className="font-bold">{applyTenor} Bulan</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Jasa Koperasi (Flat):</span>
                  <span className="font-bold text-emerald-400">{interestRate}% / bln</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cicilan Pokok / bln:</span>
                  <span>{formatRupiah(principalMonthly)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Jasa / bln:</span>
                  <span>{formatRupiah(interestMonthly)}</span>
                </div>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                <span className="text-[11px] text-amber-300 font-semibold block uppercase">
                  Estimasi Kewajiban Bulanan:
                </span>
                <span className="text-2xl font-black text-amber-400">
                  {formatRupiah(totalMonthlyInstallment)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  *Tidak ada potongan biaya administrasi tersembunyi
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700 text-[11px] text-slate-400">
              Koperasi Merah Putih Lubuk Ogung berkomitmen menjaga transparansi agar tidak membebani warga desa.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnggotaPortal() {
  return (
    <ProtectedRoute allowedRoles={["ANGGOTA"]}>
      <AnggotaPortalContent />
    </ProtectedRoute>
  );
}
