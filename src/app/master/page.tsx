"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { DataStore } from "@/lib/store";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  AuditLog,
  CooperativeConfig,
  Loan,
  User,
  UserRole,
} from "@/types";
import {
  formatDateIndo,
  formatDateTimeIndo,
  formatRupiah,
  getLoanStatusBadge,
  getRoleBadge,
} from "@/lib/utils";
import {
  ShieldCheck,
  Users,
  CheckCircle,
  XCircle,
  Settings,
  History,
  UserPlus,
  AlertTriangle,
  Building,
  DollarSign,
  TrendingUp,
} from "lucide-react";

function MasterDashboardContent() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"approval" | "users" | "config" | "logs">("approval");
  
  // Data state
  const [loans, setLoans] = useState<Loan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [config, setConfig] = useState<CooperativeConfig | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // New User Form State
  const [newUserModalOpen, setNewUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: "",
    password: "kopdes2026",
    name: "",
    role: "ADMIN" as UserRole,
    email: "",
    phone: "",
  });

  // Config edit state
  const [configForm, setConfigForm] = useState<Partial<CooperativeConfig>>({});

  const refreshData = () => {
    setLoans(DataStore.getLoans());
    setUsers(DataStore.getUsers());
    const c = DataStore.getConfig();
    setConfig(c);
    setConfigForm(c);
    setLogs(DataStore.getAuditLogs());
  };

  useEffect(() => { refreshData(); }, []);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // ProtectedRoute ensures currentUser exists, but TS needs this explicit guard
  if (!currentUser) return null;

  // Handle Loan Approval
  const handleApproveLoan = (loan: Loan) => {
    DataStore.updateLoanStatus(loan.id, "APPROVED", currentUser.name);
    DataStore.addAuditLog(
      "APPROVE_PINJAMAN_MASTER",
      `Master menyetujui pinjaman ${formatRupiah(loan.amount)} untuk ${loan.memberName}`,
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );
    notify(`Pinjaman ${loan.memberName} senilai ${formatRupiah(loan.amount)} berhasil DISETUJUI! Siap dicairkan oleh Bendahara.`);
    refreshData();
  };

  const handleRejectLoan = (loan: Loan) => {
    const reason = prompt("Masukkan alasan penolakan pinjaman:", "Dokumen agunan belum memadai");
    if (reason === null) return;

    DataStore.updateLoanStatus(loan.id, "REJECTED", currentUser.name, reason);
    DataStore.addAuditLog(
      "REJECT_PINJAMAN_MASTER",
      `Master menolak pinjaman ${formatRupiah(loan.amount)} untuk ${loan.memberName}. Alasan: ${reason}`,
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );
    notify(`Pinjaman ${loan.memberName} telah ditolak.`);
    refreshData();
  };

  // Handle Create User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.username || !newUserData.name || !newUserData.password) {
      alert("Harap isi username, password, dan nama lengkap.");
      return;
    }

    const existingUsers = DataStore.getUsers();
    if (existingUsers.find(u => u.username.toLowerCase() === newUserData.username.toLowerCase())) {
      alert("Username sudah digunakan. Pilih username lain.");
      return;
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      username: newUserData.username.toLowerCase().trim(),
      password: newUserData.password,
      name: newUserData.name.trim(),
      role: newUserData.role,
      email: newUserData.email,
      phone: newUserData.phone,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    DataStore.saveUser(newUser);
    DataStore.addAuditLog(
      "CREATE_USER",
      `Master menambahkan akun baru: ${newUser.name} (${newUser.role})`,
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );

    notify(`Pengguna baru ${newUser.name} (${newUser.role}) berhasil ditambahkan!`);
    setNewUserModalOpen(false);
    setNewUserData({ username: "", password: "kopdes2026", name: "", role: "ADMIN", email: "", phone: "" });
    refreshData();
  };

  // Handle Save Config
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    DataStore.updateConfig(configForm);
    DataStore.addAuditLog(
      "UPDATE_CONFIG",
      `Master memperbarui konfigurasi parameter Koperasi Lubuk Ogung`,
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );
    notify("Pengaturan Koperasi berhasil disimpan!");
    refreshData();
  };

  // Pending Loans requiring Master approval
  const pendingMasterLoans = loans.filter((l) => l.status === "PENDING_MASTER");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Notification Toast */}
      {notification && (
        <div className="p-4 rounded-xl bg-emerald-600 text-white font-medium text-sm shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {notification}
          </div>
          <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white text-xs">
            Tutup
          </button>
        </div>
      )}

      {/* Dashboard Top Banner */}
      <div className="bg-gradient-to-r from-red-800 to-rose-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/50 border border-red-400/30 text-xs font-semibold text-rose-200 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-rose-300" />
            Wewenang Tertinggi Koperasi Desa
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Dashboard Master & Pengawas
          </h1>
          <p className="text-sm text-rose-200">
            Selamat datang, <span className="font-bold text-white">{currentUser.name}</span>. Kendalikan tata kelola, otorisasi pinjaman besar, dan transparansi ekonomi Desa Lubuk Ogung.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 backdrop-blur border border-white/20 p-3.5 rounded-2xl">
          <Building className="w-8 h-8 text-rose-300" />
          <div className="text-xs">
            <div className="text-rose-200">Koperasi Desa Merah Putih</div>
            <div className="font-bold text-white text-sm">Lubuk Ogung - Riau</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("approval")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === "approval"
              ? "bg-red-600 text-white shadow-md shadow-red-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Persetujuan Pinjaman Master
          {pendingMasterLoans.length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-white text-red-700 text-xs font-bold">
              {pendingMasterLoans.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === "users"
              ? "bg-red-600 text-white shadow-md shadow-red-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4" />
          Kelola Pengguna & Staf ({users.length})
        </button>

        <button
          onClick={() => setActiveTab("config")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === "config"
              ? "bg-red-600 text-white shadow-md shadow-red-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Settings className="w-4 h-4" />
          Pengaturan Koperasi
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === "logs"
              ? "bg-red-600 text-white shadow-md shadow-red-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <History className="w-4 h-4" />
          Audit Trail Log Aktivitas
        </button>
      </div>

      {/* TAB 1: MASTER LOAN APPROVAL */}
      {activeTab === "approval" && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">Ketentuan Pengawasan Master:</span> Sesuai regulasi AD/ART Kopdes Lubuk Ogung, 
              seluruh pengajuan pinjaman dengan plafon di atas{" "}
              <span className="font-bold text-amber-950">
                {formatRupiah(config?.maxLoanWithoutMasterApproval || 5000000)}
              </span>{" "}
              wajib memperoleh tanda tangan digital dan persetujuan dari Master / Ketua Pengawas sebelum dapat dicairkan oleh Bendahara.
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Pengajuan Pinjaman Menunggu Keputusan Master
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar pinjaman yang telah diverifikasi berkasnya oleh Admin Operasional.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg">
                {pendingMasterLoans.length} Menunggu Keputusan
              </span>
            </div>

            {pendingMasterLoans.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">Tidak Ada Antrian Pengajuan Tertunda</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Semua pengajuan pinjaman bernilai tinggi telah diproses. Sistem berjalan aman dan tertib.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingMasterLoans.map((loan) => (
                  <div key={loan.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                          {loan.id}
                        </span>
                        <span className="text-xs text-slate-400">
                          Diajukan: {formatDateIndo(loan.submissionDate)}
                        </span>
                        <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">
                          Direview oleh: {loan.adminReviewer || "Admin"}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-lg font-extrabold text-slate-900">
                          {loan.memberName} <span className="text-xs font-normal text-slate-500">(NIK: {loan.memberNik})</span>
                        </h4>
                        <p className="text-xs text-slate-600 mt-1">
                          <span className="font-semibold text-slate-700">Keperluan:</span> {loan.purpose}
                        </p>
                        {loan.collateralDescription && (
                          <p className="text-xs text-slate-600 mt-0.5">
                            <span className="font-semibold text-slate-700">Jaminan / Agunan:</span> {loan.collateralDescription}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs pt-1">
                        <div className="bg-slate-100 px-3 py-1.5 rounded-lg">
                          <span className="text-slate-500 block">Plafon Pinjaman:</span>
                          <span className="font-bold text-slate-900 text-sm">{formatRupiah(loan.amount)}</span>
                        </div>
                        <div className="bg-slate-100 px-3 py-1.5 rounded-lg">
                          <span className="text-slate-500 block">Tenor / Jangka Waktu:</span>
                          <span className="font-bold text-slate-900 text-sm">{loan.tenorMonths} Bulan</span>
                        </div>
                        <div className="bg-slate-100 px-3 py-1.5 rounded-lg">
                          <span className="text-slate-500 block">Cicilan / Bulan:</span>
                          <span className="font-bold text-emerald-700 text-sm">{formatRupiah(loan.monthlyInstallment)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex lg:flex-col gap-2 justify-end">
                      <button
                        onClick={() => handleApproveLoan(loan)}
                        className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Setujui (ACC Pinjaman)
                      </button>
                      <button
                        onClick={() => handleRejectLoan(loan)}
                        className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Tolak Pengajuan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: USER & RBAC MANAGEMENT */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Manajemen Pengguna & Staf Koperasi</h3>
              <p className="text-xs text-slate-500">
                Master memiliki hak istimewa untuk mengangkat, mengubah peran, dan menonaktifkan akun staf.
              </p>
            </div>
            <button
              onClick={() => setNewUserModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-md transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Tambah Akun Staf Baru
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Nama Lengkap</th>
                    <th className="px-6 py-4">Username</th>
                    <th className="px-6 py-4">Role / Hak Akses</th>
                    <th className="px-6 py-4">Kontak / Email</th>
                    <th className="px-6 py-4">Tanggal Dibuat</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const badge = getRoleBadge(u.role);
                    return (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{u.name}</div>
                          {u.nik && <div className="text-[11px] text-slate-400">NIK: {u.nik}</div>}
                        </td>
                        <td className="px-6 py-4 font-mono font-medium text-slate-700">
                          {u.username}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${badge.className}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          <div>{u.phone || "-"}</div>
                          <div className="text-slate-400">{u.email || "-"}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {formatDateIndo(u.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {u.id === currentUser.id ? (
                            <span className="text-[11px] text-slate-400 italic">Akun Anda</span>
                          ) : (
                            <button
                              onClick={() => {
                                if (confirm(`Yakin ingin menghapus akses ${u.name}?`)) {
                                  DataStore.deleteUser(u.id);
                                  notify(`Akses pengguna ${u.name} berhasil dihapus.`);
                                  refreshData();
                                }
                              }}
                              className="text-rose-600 hover:text-rose-800 font-semibold"
                            >
                              Hapus Akses
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONFIGURATION */}
      {activeTab === "config" && config && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="max-w-2xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Parameter Kebijakan Koperasi</h3>
              <p className="text-xs text-slate-500">
                Pengaturan ini mengatur nilai default simpanan wajib, tarif jasa pinjaman, serta ambang batas persetujuan.
              </p>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Resmi Koperasi
                </label>
                <input
                  type="text"
                  value={configForm.coopName || ""}
                  onChange={(e) => setConfigForm({ ...configForm, coopName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Badan Hukum
                  </label>
                  <input
                    type="text"
                    value={configForm.legalNumber || ""}
                    onChange={(e) => setConfigForm({ ...configForm, legalNumber: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tahun Buku Berjalan
                  </label>
                  <input
                    type="number"
                    value={configForm.currentFiscalYear || 2026}
                    onChange={(e) => setConfigForm({ ...configForm, currentFiscalYear: parseInt(e.target.value) || 2026 })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Besaran Simpanan Pokok (Rp)
                  </label>
                  <input
                    type="number"
                    value={configForm.simpananPokokAmount || 0}
                    onChange={(e) => setConfigForm({ ...configForm, simpananPokokAmount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Dibayar sekali saat awal menjadi anggota.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Besaran Simpanan Wajib Bulanan (Rp)
                  </label>
                  <input
                    type="number"
                    value={configForm.simpananWajibMonthly || 0}
                    onChange={(e) => setConfigForm({ ...configForm, simpananWajibMonthly: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Disetor setiap bulan oleh setiap anggota.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bunga / Jasa Pinjaman (% per bulan)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={configForm.defaultLoanInterestRate || 1.0}
                    onChange={(e) => setConfigForm({ ...configForm, defaultLoanInterestRate: parseFloat(e.target.value) || 1.0 })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Suku bunga jasa flat untuk pinjaman warga.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Limit Pinjaman Tanpa Persetujuan Master (Rp)
                  </label>
                  <input
                    type="number"
                    value={configForm.maxLoanWithoutMasterApproval || 0}
                    onChange={(e) => setConfigForm({ ...configForm, maxLoanWithoutMasterApproval: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none font-bold text-red-700"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Di atas angka ini wajib mendapat approval Master.</p>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-colors"
                >
                  Simpan Kebijakan Koperasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL LOGS */}
      {activeTab === "logs" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Rekam Jejak Aktivitas (Audit Trail)</h3>
              <p className="text-xs text-slate-500">
                Log real-time setiap perubahan data finansial, login, dan persetujuan pinjaman.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">Total: {logs.length} Log</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {logs.map((log) => {
              const badge = getRoleBadge(log.userRole);
              return (
                <div key={log.id} className="p-4 hover:bg-slate-50 flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.userName}</span>
                      <span className={`text-[10px] px-2 py-0.2 rounded border font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                      <span className="font-mono text-slate-400 font-semibold">
                        [{log.action}]
                      </span>
                    </div>
                    <p className="text-slate-600 font-normal">{log.details}</p>
                  </div>
                  <div className="text-right text-[11px] text-slate-400 whitespace-nowrap font-mono">
                    {formatDateTimeIndo(log.timestamp)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Tambah User */}
      {newUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-gradient-to-r from-red-600 to-rose-700 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Tambah Akun Pengguna Baru</h3>
                <p className="text-xs text-rose-100">Khusus otoritas Master Kopdes Lubuk Ogung</p>
              </div>
              <button
                onClick={() => setNewUserModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Hendra Saputra, S.Kom"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username (Untuk Login)
                </label>
                <input
                  type="text"
                  required
                  placeholder="hendra_admin"
                  value={newUserData.username}
                  onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password Awal
                </label>
                <input
                  type="text"
                  required
                  placeholder="kopdes2026"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">Pengguna dapat menghubungi Master untuk reset password.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role / Tingkat Hak Akses
                </label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as UserRole })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none font-medium"
                >
                  <option value="ADMIN">ADMIN (Sekretaris / Pengurus Operasional)</option>
                  <option value="BENDAHARA">BENDAHARA (Petugas Simpan Pinjam / Kasir)</option>
                  <option value="MASTER">MASTER (Wakil Ketua Pengawas)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. WhatsApp</label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={newUserData.phone}
                    onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-colors"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MasterDashboard() {
  return (
    <ProtectedRoute allowedRoles={["MASTER"]}>
      <MasterDashboardContent />
    </ProtectedRoute>
  );
}
