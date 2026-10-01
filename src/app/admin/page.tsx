"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { DataStore } from "@/lib/store";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RejectModal } from "@/components/RejectModal";
import { Loan, Member } from "@/types";
import {
  formatDateIndo,
  formatRupiah,
  getLoanStatusBadge,
} from "@/lib/utils";
import {
  UserCheck,
  Users,
  UserPlus,
  FileCheck,
  Search,
  Filter,
  CheckCircle,
  Clock,
  ArrowRight,
  Send,
  Building2,
  XCircle,
  MapPin,
} from "lucide-react";

function AdminDashboardContent() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"members" | "loans">("members");

  const [members, setMembers] = useState<Member[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedDusun, setSelectedDusun] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<string | null>(null);
  const [rejectLoanTarget, setRejectLoanTarget] = useState<Loan | null>(null);

  // New Member Modal
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    nik: "",
    noKk: "",
    phone: "",
    email: "",
    dusun: "Dusun I" as Member["dusun"],
    address: "",
    occupation: "Petani Sawit",
  });

  const refreshData = () => {
    setMembers(DataStore.getMembers());
    setLoans(DataStore.getLoans());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener("kopdes-data-synced", refreshData);
    return () => window.removeEventListener("kopdes-data-synced", refreshData);
  }, []);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Handle Add Member
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!newMember.name || !newMember.nik) {
      notify("⚠️ Harap isi Nama Lengkap dan NIK warga dengan benar.");
      return;
    }

    const memberId = `mbr-${String(members.length + 1).padStart(3, "0")}`;
    const memberObj: Member = {
      id: memberId,
      name: newMember.name,
      nik: newMember.nik,
      noKk: newMember.noKk || "-",
      phone: newMember.phone || "-",
      email: newMember.email,
      dusun: newMember.dusun,
      address: newMember.address || `Desa Lubuk Ogung RT 01`,
      occupation: newMember.occupation,
      status: "AKTIF",
      joinDate: new Date().toISOString().split("T")[0],
      savingsTotal: 0,
      simpananPokokPaid: false,
    };

    DataStore.saveMember(memberObj);

    // Also auto-create a user login for this member
    const username = newMember.name.toLowerCase().split(" ")[0] + "_" + newMember.nik.slice(-4);
    DataStore.saveUser({
      id: `usr-${memberId}`,
      username: username,
      name: newMember.name,
      role: "ANGGOTA",
      nik: newMember.nik,
      phone: newMember.phone,
      memberId: memberId,
      password: newMember.nik.slice(-6), // Default password = 6 digit terakhir NIK
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    DataStore.addAuditLog(
      "REGISTER_MEMBER",
      `Admin mendaftarkan anggota baru: ${memberObj.name} (${memberObj.dusun})`,
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );

    notify(`Anggota ${memberObj.name} berhasil didaftarkan! Username akun: ${username}`);
    setIsAddMemberOpen(false);
    setNewMember({
      name: "",
      nik: "",
      noKk: "",
      phone: "",
      email: "",
      dusun: "Dusun I",
      address: "",
      occupation: "Petani Sawit",
    });
    refreshData();
  };

  // Verify pending member
  const handleVerifyMember = (m: Member) => {
    if (!currentUser) return;
    m.status = "AKTIF";
    DataStore.saveMember(m);
    DataStore.addAuditLog(
      "VERIFY_MEMBER",
      `Admin memverifikasi keanggotaan ${m.name} (${m.nik})`,
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );
    notify(`Status keanggotaan ${m.name} kini AKTIF!`);
    refreshData();
  };

  // Admin forwards to Master or Approves small loans
  const handleForwardToMaster = (loan: Loan) => {
    if (!currentUser) return;
    DataStore.updateLoanStatus(loan.id, "PENDING_MASTER", currentUser.name);
    DataStore.addAuditLog(
      "FORWARD_LOAN_TO_MASTER",
      `Admin meneruskan pengajuan pinjaman ${loan.id} (${formatRupiah(loan.amount)}) ke Master untuk persetujuan`,
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );
    notify(`Pengajuan pinjaman ${loan.memberName} telah diteruskan ke Dashboard Master.`);
    refreshData();
  };

  const handleAdminDirectApprove = (loan: Loan) => {
    if (!currentUser) return;
    DataStore.updateLoanStatus(loan.id, "APPROVED", currentUser.name);
    DataStore.addAuditLog(
      "ADMIN_APPROVE_LOAN",
      `Admin menyetujui pinjaman mikro ${loan.id} (${formatRupiah(loan.amount)})`,
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );
    notify(`Pinjaman ${loan.memberName} berhasil disetujui (siap dicairkan Bendahara)!`);
    refreshData();
  };

  const handleAdminRejectLoan = (loan: Loan) => {
    if (!currentUser) return;
    setRejectLoanTarget(loan);
  };

  const doAdminRejectLoan = (reason: string) => {
    if (!rejectLoanTarget || !currentUser) return;
    DataStore.updateLoanStatus(rejectLoanTarget.id, "REJECTED", currentUser.name, reason);
    DataStore.addAuditLog(
      "ADMIN_REJECT_LOAN",
      `Admin menolak pinjaman ${formatRupiah(rejectLoanTarget.amount)} dari ${rejectLoanTarget.memberName}. Alasan: ${reason}`,
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );
    notify(`Pinjaman ${rejectLoanTarget.memberName} telah ditolak.`);
    setRejectLoanTarget(null);
    refreshData();
  };

  // Filter members
  const filteredMembers = members.filter((m) => {
    const matchDusun = selectedDusun === "ALL" || m.dusun === selectedDusun;
    const matchSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.nik.includes(searchQuery) ||
      m.occupation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDusun && matchSearch;
  });

  const pendingAdminLoans = loans.filter((l) => l.status === "PENDING_ADMIN");
  const rejectedLoans = loans.filter((l) => l.status === "REJECTED");
  const pendingMembers = members.filter((m) => m.status === "PENDING_VERIFIKASI");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast */}
      {notification && (
        <div className="p-4 rounded-xl bg-blue-600 text-white font-medium text-sm shadow-lg flex items-center justify-between animate-in fade-in">
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
      <div className="bg-gradient-to-r from-blue-700 to-indigo-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/50 border border-blue-400/30 text-xs font-semibold text-blue-200 uppercase tracking-wider">
            <UserCheck className="w-4 h-4 text-blue-300" />
            Sekretariat & Operasional Desa
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Dashboard Admin & Keanggotaan
          </h1>
          <p className="text-sm text-blue-200">
            Pengelola administrasi warga, verifikasi pendaftaran baru di Dusun I s/d IV, serta telaah proposal pinjaman.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsAddMemberOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-900 font-bold text-xs shadow-md hover:bg-blue-50 transition-colors"
          >
            <UserPlus className="w-4 h-4 text-blue-600" />
            Daftarkan Warga Baru
          </button>
        </div>
      </div>

      {/* Quick Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("members")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === "members"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4" />
          Data Anggota Warga ({members.length})
          {pendingMembers.length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-xs font-bold">
              {pendingMembers.length} Verifikasi
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("loans")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === "loans"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Review Pengajuan Pinjaman
          {pendingAdminLoans.length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
              {pendingAdminLoans.length} Baru
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: MEMBERS */}
      {activeTab === "members" && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, NIK, atau pekerjaan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">Wilayah Dusun:</span>
              <select
                value={selectedDusun}
                onChange={(e) => setSelectedDusun(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">Semua Dusun Lubuk Ogung</option>
                <option value="Dusun I">Dusun I (Pusat / Pasar)</option>
                <option value="Dusun II">Dusun II (Kebun Sawit)</option>
                <option value="Dusun III">Dusun III (Sei Kijang Lama)</option>
                <option value="Dusun IV">Dusun IV (Pemukiman)</option>
              </select>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Nama & NIK</th>
                    <th className="px-6 py-4">Wilayah Dusun</th>
                    <th className="px-6 py-4">Mata Pencaharian</th>
                    <th className="px-6 py-4">Total Simpanan</th>
                    <th className="px-6 py-4">Status Anggota</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{m.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">NIK: {m.nik}</div>
                        <div className="text-[11px] text-slate-400">HP: {m.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                          <MapPin className="w-3.5 h-3.5 text-red-500" />
                          {m.dusun}
                        </span>
                        <div className="text-[10px] text-slate-400 line-clamp-1">{m.address}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium">
                        {m.occupation}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-emerald-700">{formatRupiah(m.savingsTotal)}</div>
                        <div className="text-[10px] text-slate-400">
                          {m.simpananPokokPaid ? "Pokok: Lunas" : "Pokok: Belum"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {m.status === "AKTIF" ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            Aktif
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                            Pending Verifikasi
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {m.status === "PENDING_VERIFIKASI" ? (
                          <button
                            onClick={() => handleVerifyMember(m)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                          >
                            Verifikasi Sekarang
                          </button>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">Terverifikasi</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LOANS REVIEW */}
      {activeTab === "loans" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Pengajuan Pinjaman yang Perlu Ditelaah Admin
                </h3>
                <p className="text-xs text-slate-500">
                  Verifikasi kelengkapan dokumen jaminan dan kesesuaian plafon anggota warga.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg">
                {pendingAdminLoans.length} Menunggu Review
              </span>
            </div>

            {pendingAdminLoans.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-blue-500 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">Tidak Ada Pengajuan Pinjaman Baru</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Semua berkas permohonan pinjaman warga telah direview oleh tim administrasi.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingAdminLoans.map((loan) => (
                  <div key={loan.id} className="p-6 hover:bg-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                          {loan.id}
                        </span>
                        <span className="text-xs text-slate-400">
                          Diajukan: {formatDateIndo(loan.submissionDate)}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-extrabold text-slate-900">
                          {loan.memberName} <span className="text-xs font-normal text-slate-500">(NIK: {loan.memberNik})</span>
                        </h4>
                        <p className="text-xs text-slate-600 mt-1">
                          <span className="font-semibold text-slate-700">Tujuan Modal:</span> {loan.purpose}
                        </p>
                        {loan.collateralDescription && (
                          <p className="text-xs text-slate-600 mt-0.5">
                            <span className="font-semibold text-slate-700">Agunan:</span> {loan.collateralDescription}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs">
                        <div className="bg-slate-100 px-3 py-1.5 rounded-lg">
                          <span className="text-slate-500 block">Plafon Diajukan:</span>
                          <span className="font-bold text-slate-900">{formatRupiah(loan.amount)}</span>
                        </div>
                        <div className="bg-slate-100 px-3 py-1.5 rounded-lg">
                          <span className="text-slate-500 block">Tenor:</span>
                          <span className="font-bold text-slate-900">{loan.tenorMonths} Bulan</span>
                        </div>
                        <div className="bg-slate-100 px-3 py-1.5 rounded-lg">
                          <span className="text-slate-500 block">Kewajiban per Bulan:</span>
                          <span className="font-bold text-emerald-700">{formatRupiah(loan.monthlyInstallment)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                      {loan.amount > 5000000 ? (
                        <button
                          onClick={() => handleForwardToMaster(loan)}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-colors"
                        >
                          <Send className="w-4 h-4" />
                          Teruskan ke Master (&gt; 5 Jt)
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAdminDirectApprove(loan)}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Setujui Langsung (Plafon Mikro)
                        </button>
                      )}

                      <button
                        onClick={() => handleAdminRejectLoan(loan)}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Tolak Berkas
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Riwayat Pengajuan yang Ditolak */}
          {rejectedLoans.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-rose-200 overflow-hidden">
              <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-rose-50/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 font-bold">
                    <XCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Riwayat Pengajuan yang Ditolak ({rejectedLoans.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Daftar berkas pinjaman yang tidak disetujui beserta alasan resmi yang tercatat.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg">
                  {rejectedLoans.length} Ditolak
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {rejectedLoans.map((loan) => (
                  <div key={loan.id} className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:bg-slate-50">
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {loan.id}
                        </span>
                        <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                          Ditolak
                        </span>
                        <span className="text-xs text-slate-400">
                          Diajukan: {formatDateIndo(loan.submissionDate)}
                        </span>
                        {loan.rejectionDate && (
                          <span className="text-xs text-slate-400">
                            &bull; Diputuskan: {formatDateIndo(loan.rejectionDate)}
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm">
                        {loan.memberName} &bull; Plafon: {formatRupiah(loan.amount)} ({loan.tenorMonths} Bulan)
                      </h4>
                      <p className="text-xs text-slate-600">
                        <span className="font-medium text-slate-700">Tujuan:</span> {loan.purpose}
                      </p>

                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-950">
                        <span className="font-bold text-rose-800 block mb-0.5">Keterangan Alasan Penolakan:</span>
                        <span className="italic font-medium">&ldquo;{loan.rejectionReason || "Syarat administrasi belum lengkap"}&rdquo;</span>
                        {(loan.rejectedBy || loan.masterApprover || loan.adminReviewer) && (
                          <span className="block mt-1 text-[11px] text-rose-600 font-semibold">
                            Diputuskan oleh: {loan.rejectedBy || loan.masterApprover || loan.adminReviewer}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Tambah Anggota */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Pendaftaran Anggota Warga Baru</h3>
                <p className="text-xs text-blue-100">Desa Lubuk Ogung, Kec. Bandar Sei Kijang</p>
              </div>
              <button
                onClick={() => setIsAddMemberOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Sesuai KTP
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Darmawan"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NIK (Nomor Induk Kependudukan)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    placeholder="140502xxxxxxxxxx"
                    value={newMember.nik}
                    onChange={(e) => setNewMember({ ...newMember, nik: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Kartu Keluarga (KK)
                  </label>
                  <input
                    type="text"
                    placeholder="140502xxxxxxxxxx"
                    value={newMember.noKk}
                    onChange={(e) => setNewMember({ ...newMember, noKk: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Wilayah Dusun
                  </label>
                  <select
                    value={newMember.dusun}
                    onChange={(e) => setNewMember({ ...newMember, dusun: e.target.value as Member["dusun"] })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-700"
                  >
                    <option value="Dusun I">Dusun I (Pusat / Pasar)</option>
                    <option value="Dusun II">Dusun II (Kebun Sawit)</option>
                    <option value="Dusun III">Dusun III (Sei Kijang Lama)</option>
                    <option value="Dusun IV">Dusun IV (Pemukiman)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mata Pencaharian
                  </label>
                  <input
                    type="text"
                    placeholder="Petani Sawit, Pedagang, dll"
                    value={newMember.occupation}
                    onChange={(e) => setNewMember({ ...newMember, occupation: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. Handphone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={newMember.phone}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email (Opsional)
                  </label>
                  <input
                    type="email"
                    placeholder="email@gmail.com"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Domisili Lengkap
                </label>
                <textarea
                  rows={2}
                  placeholder="Jl. Poros RT 02 / RW 01..."
                  value={newMember.address}
                  onChange={(e) => setNewMember({ ...newMember, address: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors"
                >
                  Daftarkan Anggota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Loan Modal */}
      {rejectLoanTarget && (
        <RejectModal
          title="Tolak Pengajuan Pinjaman"
          description={`Anda akan menolak pengajuan pinjaman ${rejectLoanTarget.memberName}. Tindakan ini dicatat di sistem dan anggota perlu mengajukan ulang.`}
          defaultReason="Syarat administrasi belum lengkap"
          onConfirm={doAdminRejectLoan}
          onClose={() => setRejectLoanTarget(null)}
        />
      )}
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
