"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { DataStore } from "@/lib/store";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ConfirmModal, ConfirmDetailItem } from "@/components/ConfirmModal";
import {
  Loan,
  LoanInstallment,
  Member,
  SavingsTransaction,
  SavingsType,
} from "@/types";
import {
  formatDateIndo,
  formatRupiah,
  getLoanStatusBadge,
} from "@/lib/utils";
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarCheck,
  CheckCircle,
  Printer,
  Search,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { RpReceipt, RpBanknote } from "@/components/RupiahIcons";

function BendaharaDashboardContent() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"setoran" | "pencairan" | "angsuran" | "mutasi">("setoran");

  const [members, setMembers] = useState<Member[]>([]);
  const [savings, setSavings] = useState<SavingsTransaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [installments, setInstallments] = useState<LoanInstallment[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // New Deposit Form State
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [depositType, setDepositType] = useState<SavingsType>("WAJIB");
  const [depositAmount, setDepositAmount] = useState<number>(30000);
  const [depositNotes, setDepositNotes] = useState("");

  // Last receipt modal
  const [receiptData, setReceiptData] = useState<{
    id: string;
    title: string;
    name: string;
    nik: string;
    amount: number;
    type: string;
    date: string;
    officer: string;
  } | null>(null);

  // Modern Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    description?: string;
    details?: ConfirmDetailItem[];
    confirmText?: string;
    theme?: "emerald" | "blue" | "amber" | "rose" | "indigo";
    icon?: "check" | "alert" | "dollar" | "wallet" | "help";
    onConfirm: () => void;
  } | null>(null);

  const refreshData = () => {
    setMembers(DataStore.getMembers());
    setSavings(DataStore.getSavings());
    setLoans(DataStore.getLoans());
    setInstallments(DataStore.getInstallments());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener("kopdes-data-synced", refreshData);
    return () => window.removeEventListener("kopdes-data-synced", refreshData);
  }, []);

  useEffect(() => {
    const config = DataStore.getConfig();
    if (depositType === "WAJIB") setDepositAmount(config.simpananWajibMonthly);
    else if (depositType === "POKOK") setDepositAmount(config.simpananPokokAmount);
  }, [depositType]);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // ProtectedRoute ensures currentUser exists, but TS needs this explicit guard
  if (!currentUser) return null;

  // Handle Submit Setoran
  const handleSubmitDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const member = members.find((m) => m.id === selectedMemberId);
    if (!member) {
      notify("⚠️ Harap pilih anggota yang menyetor.");
      return;
    }
    if (depositAmount <= 0) {
      notify("⚠️ Nominal setoran tidak valid.");
      return;
    }

    const trxId = `trx-s-${Date.now().toString().slice(-6)}`;
    const newTrx: SavingsTransaction = {
      id: trxId,
      memberId: member.id,
      memberName: member.name,
      memberNik: member.nik,
      type: depositType,
      amount: depositAmount,
      date: new Date().toISOString(),
      notes: depositNotes || `Setoran Simpanan ${depositType}`,
      officerName: currentUser.name,
      status: "SUCCESS",
    };

    DataStore.addSavings(newTrx);
    DataStore.addAuditLog(
      "SETORAN_SIMPANAN",
      `Bendahara mencatat setoran ${depositType} Rp ${depositAmount.toLocaleString("id-ID")} dari ${member.name}`,
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );

    setReceiptData({
      id: trxId,
      title: `BUKTI SETORAN SIMPANAN ${depositType}`,
      name: member.name,
      nik: member.nik,
      amount: depositAmount,
      type: `Simpanan ${depositType}`,
      date: new Date().toISOString(),
      officer: currentUser.name,
    });

    notify(`Setoran ${depositType} dari ${member.name} senilai ${formatRupiah(depositAmount)} berhasil dibukukan!`);
    refreshData();
  };

  // Handle Disburse Loan (Pencairan) with Modern Modal
  const handleDisburseLoan = (loan: Loan) => {
    setConfirmConfig({
      title: "Konfirmasi Pencairan Pinjaman",
      description: "Pastikan berkas akad pinjaman telah ditandatangani dan fisik dana telah siap sebelum pencairan.",
      details: [
        { label: "Nomor Pinjaman", value: loan.id },
        { label: "Nama Peminjam", value: loan.memberName },
        { label: "NIK", value: loan.memberNik },
        { label: "Plafon Pinjaman", value: formatRupiah(loan.amount), highlight: true },
        { label: "Jangka Waktu", value: `${loan.tenorMonths} Bulan` },
        { label: "Cicilan per Bulan", value: formatRupiah(loan.monthlyInstallment) },
      ],
      confirmText: "Ya, Cairkan Dana Sekarang",
      theme: "emerald",
      icon: "wallet",
      onConfirm: () => doDisburseLoan(loan),
    });
  };

  const doDisburseLoan = (loan: Loan) => {
    DataStore.updateLoanStatus(loan.id, "DISBURSED", currentUser.name);
    DataStore.addAuditLog(
      "PENCAIRAN_PINJAMAN",
      `Bendahara mencairkan dana pinjaman ${loan.id} senilai ${formatRupiah(loan.amount)} kepada ${loan.memberName}`,
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );

    setReceiptData({
      id: `kw-cair-${loan.id}`,
      title: "BUKTI PENCAIRAN PINJAMAN DANA DESA",
      name: loan.memberName,
      nik: loan.memberNik,
      amount: loan.amount,
      type: `Pinjaman Modal - Tenor ${loan.tenorMonths} Bulan`,
      date: new Date().toISOString(),
      officer: currentUser.name,
    });

    notify(`Dana pinjaman ${formatRupiah(loan.amount)} telah resmi dicairkan ke ${loan.memberName}! Jadwal angsuran otomatis terbit.`);
    refreshData();
  };

  // Handle Pay Installment with Modern Modal
  const handlePayInstallment = (ins: LoanInstallment) => {
    setConfirmConfig({
      title: "Terima Pembayaran Angsuran",
      description: `Konfirmasi penerimaan pembayaran cicilan pinjaman dari anggota warga secara resmi:`,
      details: [
        { label: "Nama Anggota", value: ins.memberName },
        { label: "Cicilan", value: `Angsuran Ke-${ins.installmentNo}` },
        { label: "ID Pinjaman", value: ins.loanId },
        { label: "Nominal Pembayaran", value: formatRupiah(ins.amount), highlight: true },
        { label: "Jatuh Tempo", value: formatDateIndo(ins.dueDate) },
      ],
      confirmText: "Ya, Terima & Cetak Kwitansi",
      theme: "emerald",
      icon: "dollar",
      onConfirm: () => doPayInstallment(ins),
    });
  };

  const doPayInstallment = (ins: LoanInstallment) => {
    DataStore.payInstallment(ins.id, currentUser.name);
    DataStore.addAuditLog(
      "TERIMA_ANGSURAN",
      `Bendahara menerima pembayaran angsuran ke-${ins.installmentNo} pinjaman ${ins.loanId} (${formatRupiah(ins.amount)}) dari ${ins.memberName}`,
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );

    setReceiptData({
      id: `kw-ang-${ins.id}`,
      title: `BUKTI PEMBAYARAN ANGSURAN KE-${ins.installmentNo}`,
      name: ins.memberName,
      nik: "-",
      amount: ins.amount,
      type: `Angsuran Pinjaman ${ins.loanId}`,
      date: new Date().toISOString(),
      officer: currentUser.name,
    });

    notify(`Angsuran ke-${ins.installmentNo} (${formatRupiah(ins.amount)}) dari ${ins.memberName} berhasil dibayarkan!`);
    refreshData();
  };

  // Filtered loan lists
  const approvedLoansReadyToDisburse = loans.filter((l) => l.status === "APPROVED");
  const pendingInstallments = installments.filter((i) => i.status === "PENDING");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast */}
      {notification && (
        <div className="p-4 rounded-xl bg-emerald-600 text-white font-medium text-sm shadow-lg flex items-center justify-between animate-in fade-in">
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
      <div className="bg-gradient-to-r from-emerald-700 to-teal-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600/50 border border-emerald-400/30 text-xs font-semibold text-emerald-200 uppercase tracking-wider">
            <Wallet className="w-4 h-4 text-emerald-300" />
            Loket Kasir & Keuangan Koperasi
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Loket Bendahara & Simpan Pinjam
          </h1>
          <p className="text-sm text-emerald-200">
            Pencatatan setoran simpanan warga, realisasi pencairan pinjaman yang telah disetujui, dan penerimaan cicilan angsuran.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur border border-white/20 p-4 rounded-2xl flex items-center gap-4">
          <RpReceipt className="w-8 h-8 text-emerald-300" />
          <div className="text-xs">
            <span className="text-emerald-200 block">Kwitansi Siap Cetak</span>
            <span className="font-bold text-white text-sm">Otomatis Terverifikasi</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("setoran")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === "setoran"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ArrowDownCircle className="w-4 h-4" />
          Loket Setoran Simpanan
        </button>

        <button
          onClick={() => setActiveTab("pencairan")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === "pencairan"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ArrowUpCircle className="w-4 h-4" />
          Pencairan Pinjaman (Disbursement)
          {approvedLoansReadyToDisburse.length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-xs font-bold">
              {approvedLoansReadyToDisburse.length} Siap Cair
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("angsuran")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === "angsuran"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          Terima Pembayaran Angsuran
          {pendingInstallments.length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-white text-emerald-800 text-xs font-bold">
              {pendingInstallments.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("mutasi")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === "mutasi"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <RpReceipt className="w-4 h-4" />
          Riwayat Transaksi Terakhir
        </button>
      </div>

      {/* TAB 1: FORM SETORAN */}
      {activeTab === "setoran" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Formulir Setoran Kasir</h3>
            <p className="text-xs text-slate-500 mb-6">Pencatatan kas masuk simpanan dari warga desa.</p>

            <form onSubmit={handleSubmitDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Anggota Warga
                </label>
                <select
                  required
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- Pilih Anggota --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.dusun}) - NIK: {m.nik}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis Simpanan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["POKOK", "WAJIB", "SUKARELA"] as SavingsType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDepositType(type)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        depositType === type
                          ? "bg-emerald-50 text-emerald-800 border-emerald-500 shadow-sm ring-1 ring-emerald-500"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nominal Setoran (Rp)
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Terbilang: {formatRupiah(depositAmount)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan / Berita Acara
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Setoran panen sawit / Simpanan wajib Maret"
                  value={depositNotes}
                  onChange={(e) => setDepositNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Simpan Transaksi & Terbitkan Kwitansi
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Mutasi Setoran Simpanan Terbaru</h3>
                <p className="text-xs text-slate-500">Rekap pemasukan kas koperasi dari simpanan warga.</p>
              </div>
              <span className="text-xs font-mono text-slate-500">{savings.length} Transaksi</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {savings.slice(0, 10).map((s) => (
                <div key={s.id} className="p-4 hover:bg-slate-50 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{s.memberName}</span>
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-700">
                        {s.type}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px]">{s.notes || "Setoran simpanan"}</div>
                    <div className="text-slate-400 text-[10px]">Petugas: {s.officerName}</div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="font-extrabold text-emerald-600 text-sm">
                      +{formatRupiah(s.amount)}
                    </div>
                    <div className="text-slate-400 text-[10px]">{formatDateIndo(s.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PENCAIRAN PINJAMAN */}
      {activeTab === "pencairan" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Daftar Pinjaman yang Disetujui (Menunggu Pencairan)
                </h3>
                <p className="text-xs text-slate-500">
                  Pinjaman ini telah lolos verifikasi Admin dan persetujuan Master/Kepala Desa.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                {approvedLoansReadyToDisburse.length} Siap Cair
              </span>
            </div>

            {approvedLoansReadyToDisburse.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-700 text-sm">Tidak Ada Pinjaman Menunggu Pencairan</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Semua pinjaman yang disetujui telah dicairkan kepada anggota pemohon.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {approvedLoansReadyToDisburse.map((loan) => (
                  <div key={loan.id} className="p-6 hover:bg-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                          {loan.id}
                        </span>
                        <span className="text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded">
                          Disetujui: {loan.approvalDate ? formatDateIndo(loan.approvalDate) : "-"}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900">
                        {loan.memberName} (NIK: {loan.memberNik})
                      </h4>
                      <p className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Tujuan:</span> {loan.purpose}
                      </p>
                      <div className="flex gap-4 text-xs pt-1">
                        <div>
                          <span className="text-slate-400 block">Plafon Cair:</span>
                          <span className="font-extrabold text-slate-900 text-sm">{formatRupiah(loan.amount)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Tenor:</span>
                          <span className="font-bold text-slate-800 text-sm">{loan.tenorMonths} Bulan</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Cicilan Bulanan:</span>
                          <span className="font-bold text-emerald-700 text-sm">{formatRupiah(loan.monthlyInstallment)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDisburseLoan(loan)}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowUpCircle className="w-4 h-4" />
                      Cairkan Dana & Cetak Kwitansi
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PEMBAYARAN ANGSURAN */}
      {activeTab === "angsuran" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Jadwal Tagihan Angsuran Anggota</h3>
                <p className="text-xs text-slate-500">Pencatatan pelunasan cicilan bulanan.</p>
              </div>
              <span className="text-xs font-mono text-slate-500">{pendingInstallments.length} Tagihan Aktif</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Anggota</th>
                    <th className="px-6 py-4">No. Pinjaman & Cicilan</th>
                    <th className="px-6 py-4">Jatuh Tempo</th>
                    <th className="px-6 py-4">Pokok & Jasa</th>
                    <th className="px-6 py-4">Total Tagihan</th>
                    <th className="px-6 py-4 text-right">Aksi Loket</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingInstallments.map((ins) => (
                    <tr key={ins.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {ins.memberName}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        Cicilan ke-{ins.installmentNo}
                        <div className="text-[10px] text-slate-400 font-mono">{ins.loanId}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {formatDateIndo(ins.dueDate)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <div>Pokok: {formatRupiah(ins.principalAmount)}</div>
                        <div className="text-slate-400 text-[10px]">Jasa: {formatRupiah(ins.interestAmount)}</div>
                      </td>
                      <td className="px-6 py-4 font-extrabold text-slate-900">
                        {formatRupiah(ins.amount)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handlePayInstallment(ins)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-colors"
                        >
                          Terima Pembayaran
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MUTASI KAS */}
      {activeTab === "mutasi" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Arus Kas Masuk & Keluar Koperasi</h3>
          <p className="text-xs text-slate-500">
            Transparansi buku kas bendahara Desa Lubuk Ogung.
          </p>

          <div className="space-y-3">
            {savings.map((s) => (
              <div key={s.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800">[KAS MASUK] Simpanan {s.type} - {s.memberName}</div>
                  <div className="text-slate-400 text-[11px]">{s.notes} &bull; Dicatat oleh {s.officerName}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-600 text-sm">+{formatRupiah(s.amount)}</div>
                  <div className="text-slate-400 text-[10px]">{formatDateIndo(s.date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Kwitansi Cetak */}
      {receiptData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 text-center space-y-4 border-b border-slate-100">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <RpReceipt className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">KOPERASI MERAH PUTIH</h4>
                <p className="text-xs text-slate-500">Desa Lubuk Ogung, Kec. Bandar Sei Kijang, Pelalawan</p>
                <div className="mt-2 text-xs font-bold text-emerald-800 bg-emerald-50 py-1 px-3 rounded-full inline-block">
                  {receiptData.title}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl text-left space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">No. Transaksi:</span>
                  <span className="font-bold text-slate-800">{receiptData.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Penyetor / Penerima:</span>
                  <span className="font-bold text-slate-800">{receiptData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Jenis:</span>
                  <span className="font-bold text-slate-800">{receiptData.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tanggal:</span>
                  <span className="font-bold text-slate-800">{formatDateIndo(receiptData.date)}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold">
                  <span className="text-slate-700">Jumlah:</span>
                  <span className="text-emerald-700">{formatRupiah(receiptData.amount)}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 italic">
                Tanda terima sah diterbitkan secara digital oleh: {receiptData.officer}
              </div>
            </div>

            <div className="p-4 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Dokumen
              </button>
              <button
                onClick={() => setReceiptData(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-white"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Confirmation Modal */}
      {confirmConfig && (
        <ConfirmModal
          title={confirmConfig.title}
          description={confirmConfig.description}
          details={confirmConfig.details}
          confirmText={confirmConfig.confirmText}
          theme={confirmConfig.theme || "emerald"}
          icon={confirmConfig.icon || "check"}
          onConfirm={confirmConfig.onConfirm}
          onClose={() => setConfirmConfig(null)}
        />
      )}
    </div>
  );
}

export default function BendaharaDashboard() {
  return (
    <ProtectedRoute allowedRoles={["BENDAHARA", "MANAGER"]}>
      <BendaharaDashboardContent />
    </ProtectedRoute>
  );
}
