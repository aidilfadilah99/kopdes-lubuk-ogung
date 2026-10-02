"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { DataStore } from "@/lib/store";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ConfirmModal, ConfirmDetailItem } from "@/components/ConfirmModal";
import { NeracaKeuangan } from "@/components/NeracaKeuangan";
import { PerjalananDinasModule } from "@/components/PerjalananDinasModule";
import {
  Loan,
  LoanInstallment,
  Member,
  SavingsTransaction,
  SavingsType,
  SaleTransaction,
  PerjalananDinas,
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
  BarChart3,
  MessageSquare,
  FileSpreadsheet,
  Layers,
  ShieldAlert,
  DollarSign,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  Send,
  AlertTriangle,
  FileCheck,
  Building2,
  UserCheck,
  ShoppingBag,
  Store,
  Users,
  Briefcase,
} from "lucide-react";
import { RpReceipt, RpBanknote } from "@/components/RupiahIcons";
import { PenyertaanModalSection } from "@/components/PenyertaanModalSection";
import { PengeluaranBarangSection } from "@/components/PengeluaranBarangSection";
import { Landmark } from "lucide-react";

function BendaharaDashboardContent() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"setoran" | "pencairan" | "angsuran" | "sppd" | "modal" | "belanja" | "bku" | "neraca">("setoran");
  const [penyertaanModalList, setPenyertaanModalList] = useState<any[]>([]);
  const [pengeluaranBarangList, setPengeluaranBarangList] = useState<any[]>([]);

  // State data
  const [members, setMembers] = useState<Member[]>([]);
  const [savings, setSavings] = useState<SavingsTransaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [installments, setInstallments] = useState<LoanInstallment[]>([]);
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [sppdList, setSppdList] = useState<PerjalananDinas[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // Mode transaksi Loket Simpanan: SETORAN (Kas Masuk) vs PENARIKAN (Kas Keluar)
  const [transactionMode, setTransactionMode] = useState<"SETORAN" | "PENARIKAN">("SETORAN");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [depositType, setDepositType] = useState<SavingsType>("WAJIB");
  const [depositAmount, setDepositAmount] = useState<number>(30000);
  const [depositNotes, setDepositNotes] = useState("");

  // BKU (Buku Kas Umum) Filter & Search
  const [bkuFilter, setBkuFilter] = useState<"ALL" | "IN" | "OUT">("ALL");
  const [bkuSearch, setBkuSearch] = useState("");

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
    isWithdrawal?: boolean;
    note?: string;
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
    setSales(DataStore.getSales());
    setSppdList(DataStore.getPerjalananDinas());
    setPenyertaanModalList(DataStore.getPenyertaanModal());
    setPengeluaranBarangList(DataStore.getPengeluaranBarang());
  };

  const handleTabSwitch = (tab: "setoran" | "pencairan" | "angsuran" | "sppd" | "modal" | "belanja" | "bku" | "neraca") => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = tab === "setoran" ? "/bendahara" : `/bendahara?tab=${tab}`;
      window.history.pushState({}, "", url);
      window.dispatchEvent(
        new CustomEvent("kopdes-tab-change", { detail: { tab: tab === "setoran" ? "" : tab } })
      );
    }
  };

  useEffect(() => {
    refreshData();

    const syncTabFromUrl = (targetTab?: string) => {
      let tab = targetTab;
      if (typeof tab === "undefined" && typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        tab = params.get("tab") || "";
      }
      if (tab === "neraca") {
        setActiveTab("neraca");
      } else if (tab === "bku") {
        setActiveTab("bku");
      } else if (tab === "modal" || tab === "penyertaan-modal") {
        setActiveTab("modal");
      } else if (tab === "belanja" || tab === "pembelian-barang") {
        setActiveTab("belanja");
      } else if (tab === "sppd" || tab === "perjalanan-dinas") {
        setActiveTab("sppd");
      } else if (tab === "pencairan") {
        setActiveTab("pencairan");
      } else if (tab === "angsuran") {
        setActiveTab("angsuran");
      } else {
        setActiveTab("setoran");
      }
    };

    syncTabFromUrl();

    const handleCustomTab = (e: any) => {
      syncTabFromUrl(e.detail?.tab);
    };

    const handlePopState = () => {
      syncTabFromUrl();
    };

    window.addEventListener("kopdes-tab-change", handleCustomTab);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("kopdes-data-synced", refreshData);
    return () => {
      window.removeEventListener("kopdes-tab-change", handleCustomTab);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("kopdes-data-synced", refreshData);
    };
  }, []);

  useEffect(() => {
    const config = DataStore.getConfig();
    if (transactionMode === "SETORAN") {
      if (depositType === "WAJIB") setDepositAmount(config.simpananWajibMonthly);
      else if (depositType === "POKOK") setDepositAmount(config.simpananPokokAmount);
      else if (depositType === "SUKARELA" && depositAmount === 0) setDepositAmount(50000);
    } else {
      // PENARIKAN SUKARELA
      setDepositType("PENARIKAN_SUKARELA");
      if (depositAmount === 0 || depositAmount === config.simpananWajibMonthly) {
        setDepositAmount(50000);
      }
    }
  }, [depositType, transactionMode]);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // ProtectedRoute ensures currentUser exists, but TS needs this explicit guard
  if (!currentUser) return null;

  // Selected Member Object & Savings Breakdown
  const selectedMember = useMemo(() => {
    return members.find((m) => m.id === selectedMemberId);
  }, [members, selectedMemberId]);

  const memberSavingsBreakdown = useMemo(() => {
    if (!selectedMemberId) return { pokok: 0, wajib: 0, sukarela: 0, total: 0 };
    const memberTrx = savings.filter((s) => s.memberId === selectedMemberId);
    const pokok = memberTrx.filter((s) => s.type === "POKOK").reduce((sum, s) => sum + s.amount, 0);
    const wajib = memberTrx.filter((s) => s.type === "WAJIB").reduce((sum, s) => sum + s.amount, 0);
    const sukarelaIn = memberTrx.filter((s) => s.type === "SUKARELA").reduce((sum, s) => sum + s.amount, 0);
    const sukarelaOut = memberTrx.filter((s) => s.type === "PENARIKAN_SUKARELA").reduce((sum, s) => sum + s.amount, 0);
    const sukarelaNet = Math.max(0, sukarelaIn - sukarelaOut);
    return {
      pokok,
      wajib,
      sukarela: sukarelaNet,
      total: pokok + wajib + sukarelaNet,
    };
  }, [savings, selectedMemberId]);

  // Handle Submit Setoran atau Penarikan
  const handleSubmitSavingsForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      notify("âš ï¸ Harap pilih anggota terlebih dahulu.");
      return;
    }
    if (depositAmount <= 0) {
      notify("âš ï¸ Nominal transaksi harus lebih besar dari Rp 0.");
      return;
    }

    if (transactionMode === "SETORAN") {
      // SETORAN SIMPANAN (KAS MASUK)
      const trxId = `trx-s-${Date.now().toString().slice(-6)}`;
      const newTrx: SavingsTransaction = {
        id: trxId,
        memberId: selectedMember.id,
        memberName: selectedMember.name,
        memberNik: selectedMember.nik,
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
        `Bendahara mencatat setoran ${depositType} Rp ${depositAmount.toLocaleString("id-ID")} dari ${selectedMember.name}`,
        { id: currentUser.id, name: currentUser.name, role: currentUser.role }
      );

      setReceiptData({
        id: trxId,
        title: `BUKTI SETORAN SIMPANAN ${depositType}`,
        name: selectedMember.name,
        nik: selectedMember.nik,
        amount: depositAmount,
        type: `Setoran Simpanan ${depositType}`,
        date: new Date().toISOString(),
        officer: currentUser.name,
        note: depositNotes,
      });

      notify(`Setoran ${depositType} dari ${selectedMember.name} senilai ${formatRupiah(depositAmount)} berhasil dibukukan!`);
      setDepositNotes("");
      refreshData();
    } else {
      // PENARIKAN SIMPANAN SUKARELA (KAS KELUAR) - ROLE RISK MANAGEMENT
      if (depositAmount > memberSavingsBreakdown.sukarela) {
        notify(`âš ï¸ Saldo simpanan sukarela tidak mencukupi! Saldo sukarela ${selectedMember.name} hanya ${formatRupiah(memberSavingsBreakdown.sukarela)}. Simpanan pokok & wajib tidak dapat ditarik.`);
        return;
      }

      setConfirmConfig({
        title: "Konfirmasi Pengeluaran Kas - Penarikan Sukarela",
        description: "PERINGATAN RISIKO KAS: Anda akan mengeluarkan uang tunai dari brankas loket kasir. Pastikan identitas anggota telah diverifikasi dan uang fisik diserahkan langsung.",
        details: [
          { label: "Nama Anggota", value: selectedMember.name },
          { label: "NIK", value: selectedMember.nik },
          { label: "Wilayah", value: selectedMember.dusun },
          { label: "Saldo Sukarela Saat Ini", value: formatRupiah(memberSavingsBreakdown.sukarela) },
          { label: "Nominal Ditarik (Kas Keluar)", value: formatRupiah(depositAmount), highlight: true },
          { label: "Sisa Saldo Setelah Tarik", value: formatRupiah(memberSavingsBreakdown.sukarela - depositAmount) },
          { label: "Petugas Kasir", value: currentUser.name },
        ],
        confirmText: "Ya, Keluarkan Uang Kas & Cetak Kwitansi",
        theme: "rose",
        icon: "alert",
        onConfirm: () => doProcessWithdrawal(),
      });
    }
  };

  const doProcessWithdrawal = () => {
    if (!selectedMember) return;
    const trxId = `trx-w-${Date.now().toString().slice(-6)}`;
    const newTrx: SavingsTransaction = {
      id: trxId,
      memberId: selectedMember.id,
      memberName: selectedMember.name,
      memberNik: selectedMember.nik,
      type: "PENARIKAN_SUKARELA",
      amount: depositAmount,
      date: new Date().toISOString(),
      notes: depositNotes || "Penarikan Tunai Simpanan Sukarela",
      officerName: currentUser.name,
      status: "SUCCESS",
    };

    DataStore.addSavings(newTrx);
    DataStore.addAuditLog(
      "PENARIKAN_SIMPANAN",
      `Bendahara memproses penarikan simpanan sukarela ${formatRupiah(depositAmount)} oleh ${selectedMember.name}`,
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );

    setReceiptData({
      id: trxId,
      title: "BUKTI PENARIKAN SIMPANAN SUKARELA",
      name: selectedMember.name,
      nik: selectedMember.nik,
      amount: depositAmount,
      type: "Penarikan Tunai (Kas Keluar)",
      date: new Date().toISOString(),
      officer: currentUser.name,
      isWithdrawal: true,
      note: depositNotes,
    });

    notify(`Penarikan dana tunai ${formatRupiah(depositAmount)} kepada ${selectedMember.name} berhasil dibukukan!`);
    setDepositNotes("");
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
      description: "Konfirmasi penerimaan pembayaran cicilan pinjaman dari anggota warga secara resmi:",
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

  // Kirim Pengingat Tagihan via WhatsApp (Early Warning Credit Risk)
  const sendWaReminder = (ins: LoanInstallment) => {
    const member = members.find((m) => m.id === ins.memberId);
    const phone = member?.phone || "";
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone === "0" || phone === "-") {
      notify(`âš ï¸ Nomor HP/WhatsApp anggota ${ins.memberName} belum terdaftar.`);
      return;
    }
    const finalPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone;
    const textMsg = `Assalamu'alaikum Wr. Wb. / Yth. Bapak/Ibu ${ins.memberName},\n\nKami dari Bendahara Koperasi Desa Merah Putih Lubuk Ogung menginformasikan bahwa jadwal tagihan angsuran pinjaman (ID: ${ins.loanId}) cicilan ke-${ins.installmentNo} sebesar *${formatRupiah(ins.amount)}* jatuh tempo pada *${formatDateIndo(ins.dueDate)}*.\n\nPembayaran dapat disetorkan langsung di Loket Bendahara Koperasi.\n\nTerima kasih atas kerjasamanya.\nSalam gotong royong,\n*Bendahara Kopdes Lubuk Ogung*`;
    const waUrl = `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(textMsg)}`;
    window.open(waUrl, "_blank");
  };

  // Filtered loan lists
  const approvedLoansReadyToDisburse = loans.filter((l) => l.status === "APPROVED");
  const pendingInstallments = installments.filter((i) => i.status === "PENDING");

  // --- BUKU KAS UMUM (BKU) & REKONSILIASI KAS HARIAN ---
  const todayStr = new Date().toISOString().split("T")[0];

  // Daftar mutasi gabungan untuk BKU
  const bkuTransactions = useMemo(() => {
    const list: {
      id: string;
      date: string;
      type: "IN" | "OUT";
      category: string;
      description: string;
      member: string;
      amount: number;
      officer: string;
    }[] = [];

    // 1. Simpanan & Penarikan
    savings.forEach((s) => {
      const isOut = s.type === "PENARIKAN_SUKARELA";
      list.push({
        id: s.id,
        date: s.date,
        type: isOut ? "OUT" : "IN",
        category: isOut ? "Penarikan Sukarela" : `Simpanan ${s.type}`,
        description: s.notes || (isOut ? "Penarikan Tunai Sukarela" : `Setoran Simpanan ${s.type}`),
        member: s.memberName,
        amount: s.amount,
        officer: s.officerName,
      });
    });

    // 2. Angsuran Pinjaman (Kas Masuk)
    installments.forEach((ins) => {
      if (ins.status === "PAID" && ins.paymentDate) {
        list.push({
          id: `ins-${ins.id}`,
          date: ins.paymentDate,
          type: "IN",
          category: "Angsuran Pinjaman",
          description: `Pelunasan cicilan ke-${ins.installmentNo} pinjaman ${ins.loanId}`,
          member: ins.memberName,
          amount: ins.amount,
          officer: ins.officerName || "Bendahara",
        });
      }
    });

    // 3. Pencairan Pinjaman (Kas Keluar)
    loans.forEach((l) => {
      if (l.status === "DISBURSED" || l.status === "PAID_OFF") {
        list.push({
          id: `cair-${l.id}`,
          date: l.disbursementDate || l.approvalDate || l.submissionDate,
          type: "OUT",
          category: "Pencairan Pinjaman",
          description: `Pencairan dana modal pinjaman anggota ${l.id} (${l.tenorMonths} bln)`,
          member: l.memberName,
          amount: l.amount,
          officer: "Bendahara",
        });
      }
    });

    // 4. Penjualan Toko Kopdes Mart (Kas Masuk Kasir)
    sales.forEach((s) => {
      list.push({
        id: s.invoiceNo,
        date: s.date,
        type: "IN",
        category: `Mart (${s.buyerType === "ANGGOTA" ? "Anggota" : "Warga Umum"})`,
        description: `Penjualan ${s.items.length} item barang (${s.paymentMethod}) - Pembeli: ${s.buyerType === "ANGGOTA" ? (s.memberName || "Anggota") : "Warga Umum"}`,
        member: s.buyerType === "ANGGOTA" ? (s.memberName || "Anggota") : "Warga Umum",
        amount: s.totalAmount,
        officer: s.cashierName || "Kasir Mart",
      });
    });

    // 5. Pencairan Biaya Perjalanan Dinas (Kas Keluar)
    sppdList.forEach((sppd) => {
      if (sppd.status === "DICAIRKAN" && sppd.disbursedDate) {
        list.push({
          id: `sppd-${sppd.id}`,
          date: sppd.disbursedDate,
          type: "OUT",
          category: "Perjalanan Dinas",
          description: `Pencairan SPPD ${sppd.nomorSppd}: ${sppd.namaPegawai} (${sppd.tujuan})`,
          member: sppd.namaPegawai,
          amount: sppd.totalBiaya,
          officer: sppd.disbursedBy || "Bendahara",
        });
      }
    });

    // 6. Penyertaan Modal Masuk
    penyertaanModalList.forEach((pm: any) => {
      list.push({
        id: pm.nomorReferensi || pm.id,
        date: pm.tanggal,
        type: "IN",
        category: `Penyertaan Modal (${pm.kategori})`,
        description: `${pm.peruntukan} - Sumber: ${pm.sumber}`,
        member: pm.sumber,
        amount: pm.nominal,
        officer: pm.penerima || "Bendahara",
      });
    });

    // 7. Pengeluaran Pembelian Barang / Aset
    pengeluaranBarangList.forEach((pb: any) => {
      list.push({
        id: pb.nomorBukti || pb.id,
        date: pb.tanggal,
        type: "OUT",
        category: `Belanja ${pb.kategori === "ASET_INVENTARIS" ? "Aset/Peralatan" : pb.kategori === "KULAKAN_TOKO" ? "Kulakan Mart" : "Operasional"}`,
        description: `${pb.namaBarang} (${pb.jumlah} ${pb.satuan}) - Supplier: ${pb.supplier}`,
        member: pb.supplier,
        amount: pb.totalBiaya,
        officer: pb.petugas || "Bendahara",
      });
    });

    // Urutkan dari terbaru
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [savings, installments, loans, sales, sppdList, penyertaanModalList, pengeluaranBarangList]);

  // Rekonsiliasi Kas Hari Ini
  const todayIn = bkuTransactions
    .filter((t) => t.date.startsWith(todayStr) && t.type === "IN")
    .reduce((sum, t) => sum + t.amount, 0);

  // Rincian Sumber Kas Masuk Hari Ini
  const todayInMart = bkuTransactions
    .filter((t) => t.date.startsWith(todayStr) && t.type === "IN" && t.category.startsWith("Mart"))
    .reduce((sum, t) => sum + t.amount, 0);

  const todayInSimpanan = bkuTransactions
    .filter((t) => t.date.startsWith(todayStr) && t.type === "IN" && t.category.startsWith("Simpanan"))
    .reduce((sum, t) => sum + t.amount, 0);

  const todayInAngsuran = bkuTransactions
    .filter((t) => t.date.startsWith(todayStr) && t.type === "IN" && t.category === "Angsuran Pinjaman")
    .reduce((sum, t) => sum + t.amount, 0);

  // Rincian Pos Kas Keluar Hari Ini
  const todayOut = bkuTransactions
    .filter((t) => t.date.startsWith(todayStr) && t.type === "OUT")
    .reduce((sum, t) => sum + t.amount, 0);

  const todayOutPencairan = bkuTransactions
    .filter((t) => t.date.startsWith(todayStr) && t.type === "OUT" && t.category === "Pencairan Pinjaman")
    .reduce((sum, t) => sum + t.amount, 0);

  const todayOutPenarikan = bkuTransactions
    .filter((t) => t.date.startsWith(todayStr) && t.type === "OUT" && t.category === "Penarikan Sukarela")
    .reduce((sum, t) => sum + t.amount, 0);

  const todayOutSppd = bkuTransactions
    .filter((t) => t.date.startsWith(todayStr) && t.type === "OUT" && t.category === "Perjalanan Dinas")
    .reduce((sum, t) => sum + t.amount, 0);

  const todayNet = todayIn - todayOut;

  // Filter BKU
  const filteredBku = bkuTransactions.filter((t) => {
    const matchType = bkuFilter === "ALL" || t.type === bkuFilter;
    const matchSearch =
      t.member.toLowerCase().includes(bkuSearch.toLowerCase()) ||
      t.description.toLowerCase().includes(bkuSearch.toLowerCase()) ||
      t.category.toLowerCase().includes(bkuSearch.toLowerCase()) ||
      t.id.toLowerCase().includes(bkuSearch.toLowerCase());
    return matchType && matchSearch;
  });

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

      {/* Header Banner Bendahara */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 print:hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-xs font-semibold text-emerald-300 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            Otoritas Bendahara & Pengelolaan Risiko Kas
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Loket Keuangan & Kasir Koperasi
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/90 max-w-2xl leading-relaxed">
            Pusat kendali arus kas (cashflow), pencatatan setoran & penarikan sukarela warga, realisasi pencairan pinjaman, buku kas umum (BKU), serta pemantauan risiko kredit.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-white/10 backdrop-blur border border-white/20 p-3.5 rounded-2xl flex items-center gap-3">
            <RpReceipt className="w-8 h-8 text-emerald-300" />
            <div className="text-xs">
              <span className="text-emerald-200 block">Kwitansi & BKU Sah</span>
              <span className="font-bold text-white text-sm">Anti Selisih Kasir</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigasi Bendahara */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 print:hidden">
        <button
          onClick={() => handleTabSwitch("setoran")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === "setoran"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ArrowDownCircle className="w-4 h-4" />
          Loket Setor & Tarik Simpanan
        </button>

        <button
          onClick={() => handleTabSwitch("pencairan")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === "pencairan"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ArrowUpCircle className="w-4 h-4" />
          Pencairan Pinjaman
          {approvedLoansReadyToDisburse.length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-xs font-bold">
              {approvedLoansReadyToDisburse.length} Siap Cair
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabSwitch("angsuran")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === "angsuran"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          Terima Angsuran ({pendingInstallments.length})
        </button>

        <button
          onClick={() => handleTabSwitch("modal")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === "modal"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Landmark className="w-4 h-4" />
          Penyertaan Modal ({penyertaanModalList.length})
        </button>

        <button
          onClick={() => handleTabSwitch("belanja")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === "belanja"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Belanja Barang & Aset ({pengeluaranBarangList.length})
        </button>

        <button
          onClick={() => handleTabSwitch("bku")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === "bku"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Buku Kas Umum (BKU)
        </button>

        <button
          onClick={() => handleTabSwitch("sppd")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === "sppd"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Pencairan SPPD
          {sppdList.filter((s) => s.status === "DISETUJUI").length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-xs font-bold">
              {sppdList.filter((s) => s.status === "DISETUJUI").length} Siap Cair
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabSwitch("neraca")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === "neraca"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Neraca Keuangan & SHU
        </button>
      </div>

      {/* TAB 1: LOKET SETOR & TARIK SIMPANAN */}
      {activeTab === "setoran" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            {/* Toggle Mode Transaksi */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
              <button
                type="button"
                onClick={() => setTransactionMode("SETORAN")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  transactionMode === "SETORAN"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ArrowDownCircle className="w-3.5 h-3.5" />
                Setoran (Masuk)
              </button>
              <button
                type="button"
                onClick={() => setTransactionMode("PENARIKAN")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  transactionMode === "PENARIKAN"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ArrowUpCircle className="w-3.5 h-3.5" />
                Tarik Sukarela (Keluar)
              </button>
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              {transactionMode === "SETORAN" ? "Formulir Setoran Simpanan" : "Formulir Penarikan Simpanan Sukarela"}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              {transactionMode === "SETORAN"
                ? "Pencatatan uang masuk simpanan pokok, wajib, atau sukarela warga desa."
                : "Pengeluaran kas penarikan dana sukarela anggota dengan verifikasi saldo ketat."}
            </p>

            <form onSubmit={handleSubmitSavingsForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Anggota Warga <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- Pilih Anggota Warga --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.dusun}) - NIK: {m.nik}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rincian Saldo Simpanan Anggota Terpilih */}
              {selectedMember && (
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-slate-800 flex items-center justify-between">
                    <span>{selectedMember.name}</span>
                    <span className="text-emerald-700 font-mono font-black">{formatRupiah(memberSavingsBreakdown.total)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Pokok (Kunci):</span>
                      <span className="font-bold text-slate-700 font-mono">{formatRupiah(memberSavingsBreakdown.pokok)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Wajib (Kunci):</span>
                      <span className="font-bold text-slate-700 font-mono">{formatRupiah(memberSavingsBreakdown.wajib)}</span>
                    </div>
                    <div>
                      <span className="text-emerald-700 font-bold block">Sukarela (Cair):</span>
                      <span className="font-black text-emerald-700 font-mono">{formatRupiah(memberSavingsBreakdown.sukarela)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Pilihan Jenis Simpanan (Hanya jika mode SETORAN) */}
              {transactionMode === "SETORAN" ? (
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
              ) : (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-950">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Aturan Penarikan Simpanan:
                  </div>
                  <p>
                    Sesuai AD/ART Koperasi, yang dapat ditarik sewaktu-waktu hanyalah <strong>Simpanan Sukarela</strong>. Simpanan Pokok & Wajib merupakan modal permanen koperasi dan tidak dapat ditarik selama berstatus anggota.
                  </p>
                </div>
              )}

              {/* Nominal */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {transactionMode === "SETORAN" ? "Nominal Setoran (Rp)" : "Nominal Penarikan Tunai (Rp)"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  max={transactionMode === "PENARIKAN" ? memberSavingsBreakdown.sukarela : undefined}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(parseInt(e.target.value) || 0)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-base font-extrabold focus:outline-none font-mono ${
                    transactionMode === "PENARIKAN"
                      ? "border-rose-300 text-rose-900 focus:ring-2 focus:ring-rose-500"
                      : "border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  }`}
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Terbilang: {formatRupiah(depositAmount)}
                </span>
                {transactionMode === "PENARIKAN" && selectedMember && depositAmount > memberSavingsBreakdown.sukarela && (
                  <p className="text-red-500 text-[11px] mt-1 font-semibold">
                    âš ï¸ Melebihi saldo sukarela (Maks: {formatRupiah(memberSavingsBreakdown.sukarela)})
                  </p>
                )}
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan / Berita Acara
                </label>
                <input
                  type="text"
                  placeholder={transactionMode === "SETORAN" ? "Contoh: Setoran panen sawit / Wajib Maret" : "Contoh: Penarikan untuk biaya sekolah anak"}
                  value={depositNotes}
                  onChange={(e) => setDepositNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={transactionMode === "PENARIKAN" && (!selectedMember || depositAmount > memberSavingsBreakdown.sukarela || depositAmount <= 0)}
                className={`w-full py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                  transactionMode === "SETORAN"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-rose-600 hover:bg-rose-700 text-white disabled:bg-slate-300 disabled:cursor-not-allowed"
                }`}
              >
                {transactionMode === "SETORAN" ? (
                  <>
                    <ArrowDownCircle className="w-4 h-4" />
                    Bukukan Setoran & Cetak Kwitansi
                  </>
                ) : (
                  <>
                    <ArrowUpCircle className="w-4 h-4" />
                    Proses Penarikan Kas Tunai
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Kolom Kanan: Rekap Simpanan Warga */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Rekapitulasi Tabungan Warga</h3>
                  <p className="text-xs text-slate-500">Monitoring saldo simpanan pokok, wajib, dan sukarela per anggota.</p>
                </div>
                <span className="text-xs font-mono text-slate-400">{members.length} Anggota</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Nama & Dusun</th>
                      <th className="px-4 py-3">Simpanan Pokok</th>
                      <th className="px-4 py-3">Total Saldo</th>
                      <th className="px-4 py-3 text-right">Aksi Cepat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {members.slice(0, 10).map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{m.name}</div>
                          <div className="text-[11px] text-slate-400">{m.dusun} &bull; {m.nik}</div>
                        </td>
                        <td className="px-4 py-3">
                          {m.simpananPokokPaid ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Lunas
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Belum Lunas
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-emerald-700">
                          {formatRupiah(m.savingsTotal)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedMemberId(m.id);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] transition-colors"
                          >
                            Pilih Loket
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PENCAIRAN PINJAMAN (DISBURSEMENT) */}
      {activeTab === "pencairan" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Pinjaman yang Siap Dicairkan</h3>
                <p className="text-xs text-slate-500">
                  Daftar proposal pinjaman yang telah diverifikasi Admin & disetujui resmi oleh Master Koperasi.
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full">
                {approvedLoansReadyToDisburse.length} Siap Realisasi
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

      {/* TAB 3: PEMBAYARAN ANGSURAN & PERINGATAN WA */}
      {activeTab === "angsuran" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Jadwal Tagihan Angsuran Anggota</h3>
                <p className="text-xs text-slate-500">Pencatatan pelunasan cicilan bulanan dan mitigasi risiko keterlambatan.</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-full bg-slate-100 font-mono text-slate-600 font-bold">
                  {pendingInstallments.length} Tagihan Aktif
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-4">Anggota Warga</th>
                    <th className="px-5 py-4">Cicilan & Pinjaman</th>
                    <th className="px-5 py-4">Jatuh Tempo</th>
                    <th className="px-5 py-4">Pokok & Jasa</th>
                    <th className="px-5 py-4">Total Tagihan</th>
                    <th className="px-5 py-4 text-right">Aksi Loket</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingInstallments.map((ins) => {
                    const isDueSoon = new Date(ins.dueDate).getTime() - Date.now() < 7 * 24 * 3600 * 1000;
                    return (
                      <tr key={ins.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">{ins.memberName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{ins.loanId}</div>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-700">
                          Cicilan ke-{ins.installmentNo}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-medium text-slate-700">{formatDateIndo(ins.dueDate)}</div>
                          {isDueSoon && (
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              Mendekati Jatuh Tempo
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          <div>Pokok: {formatRupiah(ins.principalAmount)}</div>
                          <div className="text-slate-400 text-[10px]">Jasa: {formatRupiah(ins.interestAmount)}</div>
                        </td>
                        <td className="px-5 py-4 font-extrabold text-slate-900 font-mono text-sm">
                          {formatRupiah(ins.amount)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Tombol Ingatkan via WhatsApp */}
                            <button
                              type="button"
                              onClick={() => sendWaReminder(ins)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] transition-colors flex items-center gap-1"
                              title="Kirim pesan pengingat tagihan ke nomor WhatsApp anggota"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              Ingatkan WA
                            </button>

                            {/* Tombol Terima Pembayaran */}
                            <button
                              onClick={() => handlePayInstallment(ins)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-colors flex items-center gap-1"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              Terima Bayar
                            </button>
                          </div>
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

      {/* TAB 4: BUKU KAS UMUM (BKU) & REKONSILIASI KASIR HARIAN */}
      {activeTab === "bku" && (
        <div className="space-y-6">
          {/* KARTU REKONSILIASI KAS HARIAN (DAILY CASH CLOSING) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Rekonsiliasi Kas Harian (Daily Cash Closing)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rekapitulasi fisik kas brankas loket hari ini: <strong>{formatDateIndo(todayStr)}</strong>
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition-all self-start sm:self-auto"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Berita Acara Kasir
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* KARTU 1: TOTAL KAS MASUK + RINCIAN SUMBER DANA */}
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-emerald-800 font-bold text-xs uppercase tracking-wide">Total Kas Masuk Hari Ini (+)</span>
                    <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                      Penerimaan
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono block">
                    {formatRupiah(todayIn)}
                  </span>
                </div>

                {/* Sub-kategori Rincian Kas Masuk */}
                <div className="mt-3.5 pt-2.5 border-t border-emerald-200 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-900 flex items-center gap-1.5 font-medium">
                      <ShoppingBag className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      Penjualan Kopdes Mart:
                    </span>
                    <span className="font-mono font-bold text-emerald-800">{formatRupiah(todayInMart)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-900 flex items-center gap-1.5 font-medium">
                      <Wallet className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      Setoran Simpanan Warga:
                    </span>
                    <span className="font-mono font-bold text-emerald-800">{formatRupiah(todayInSimpanan)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-900 flex items-center gap-1.5 font-medium">
                      <CalendarCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      Pembayaran Angsuran:
                    </span>
                    <span className="font-mono font-bold text-emerald-800">{formatRupiah(todayInAngsuran)}</span>
                  </div>
                </div>
              </div>

              {/* KARTU 2: TOTAL KAS KELUAR + RINCIAN PENGELUARAN */}
              <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/70 border border-rose-200 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-rose-800 font-bold text-xs uppercase tracking-wide">Total Kas Keluar Hari Ini (-)</span>
                    <span className="text-[10px] bg-rose-200/80 text-rose-900 font-bold px-2 py-0.5 rounded-full">
                      Pengeluaran
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-rose-700 font-mono block">
                    -{formatRupiah(todayOut)}
                  </span>
                </div>

                {/* Sub-kategori Rincian Kas Keluar */}
                <div className="mt-3.5 pt-2.5 border-t border-rose-200 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-rose-900 flex items-center gap-1.5 font-medium">
                      <ArrowUpCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                      Pencairan Pinjaman:
                    </span>
                    <span className="font-mono font-bold text-rose-800">-{formatRupiah(todayOutPencairan)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-rose-900 flex items-center gap-1.5 font-medium">
                      <DollarSign className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                      Penarikan Sukarela:
                    </span>
                    <span className="font-mono font-bold text-rose-800">-{formatRupiah(todayOutPenarikan)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-rose-900 flex items-center gap-1.5 font-medium">
                      <Briefcase className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                      Perjalanan Dinas (SPPD):
                    </span>
                    <span className="font-mono font-bold text-rose-800">-{formatRupiah(todayOutSppd)}</span>
                  </div>
                </div>
              </div>

              {/* KARTU 3: NET CASHFLOW / SALDO KAS FISIK LOKET */}
              <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-indigo-800 font-bold text-xs uppercase tracking-wide">Net Cashflow Loket Hari Ini</span>
                    <span className="text-[10px] bg-indigo-200/80 text-indigo-900 font-bold px-2 py-0.5 rounded-full">
                      Posisi Kasir
                    </span>
                  </div>
                  <span className={`text-xl sm:text-2xl font-black font-mono block ${todayNet >= 0 ? "text-indigo-700" : "text-rose-700"}`}>
                    {todayNet >= 0 ? `+${formatRupiah(todayNet)}` : `-${formatRupiah(Math.abs(todayNet))}`}
                  </span>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-indigo-200 space-y-1.5 text-[11px] text-indigo-950">
                  <div className="flex items-center justify-between">
                    <span className="text-indigo-800">Status Brankas:</span>
                    <span className="font-bold text-emerald-700">âœ“ Fisik Wajib Klop</span>
                  </div>
                  <p className="text-[10px] text-indigo-700/90 leading-tight">
                    Selisih mutasi fisik uang tunai yang wajib ada di loket & brankas sebelum penutupan kas hari ini.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* TABEL BUKU KAS UMUM (BKU) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Buku Kas Umum (BKU) Koperasi</h3>
                <p className="text-xs text-slate-500">Seluruh pencatatan transaksi debet & kredit secara kronologis.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Filter Type */}
                <div className="flex rounded-xl bg-slate-100 p-1 text-xs">
                  <button
                    onClick={() => setBkuFilter("ALL")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      bkuFilter === "ALL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
                    }`}
                  >
                    Semua ({bkuTransactions.length})
                  </button>
                  <button
                    onClick={() => setBkuFilter("IN")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      bkuFilter === "IN" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600"
                    }`}
                  >
                    Masuk (+)
                  </button>
                  <button
                    onClick={() => setBkuFilter("OUT")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      bkuFilter === "OUT" ? "bg-rose-600 text-white shadow-sm" : "text-slate-600"
                    }`}
                  >
                    Keluar (-)
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari transaksi / anggota..."
                    value={bkuSearch}
                    onChange={(e) => setBkuSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none w-48"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-4">Tanggal & No. Bukti</th>
                    <th className="px-5 py-4">Kategori & Anggota</th>
                    <th className="px-5 py-4">Uraian / Keterangan</th>
                    <th className="px-5 py-4 text-right">Kas Masuk (Debet)</th>
                    <th className="px-5 py-4 text-right">Kas Keluar (Kredit)</th>
                    <th className="px-5 py-4 text-right">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBku.map((trx) => (
                    <tr key={trx.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-800">{formatDateIndo(trx.date)}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{trx.id}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          trx.type === "IN" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {trx.category}
                        </span>
                        <div className="font-bold text-slate-900 mt-0.5">{trx.member}</div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate">
                        {trx.description}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-700">
                        {trx.type === "IN" ? `+${formatRupiah(trx.amount)}` : "-"}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-rose-700">
                        {trx.type === "OUT" ? `-${formatRupiah(trx.amount)}` : "-"}
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-500 font-mono text-[11px]">
                        {trx.officer}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB PENYERTAAN MODAL (BENDAHARA) */}
      {activeTab === "modal" && (
        <PenyertaanModalSection
          userRole="BENDAHARA"
          userName={currentUser?.name || "Bendahara"}
        />
      )}

      {/* TAB BELANJA BARANG & ASET (BENDAHARA) */}
      {activeTab === "belanja" && (
        <PengeluaranBarangSection
          userRole="BENDAHARA"
          userName={currentUser?.name || "Bendahara"}
        />
      )}

      {/* TAB PENCAIRAN SPPD (BENDAHARA) */}
      {activeTab === "sppd" && (
        <PerjalananDinasModule
          userRole="BENDAHARA"
          currentUserName={currentUser.name}
        />
      )}

      {/* TAB 5: NERACA KEUANGAN (BENDAHARA) */}
      {activeTab === "neraca" && (
        <NeracaKeuangan userRole="BENDAHARA" />
      )}

      {/* Modal Kwitansi Cetak Resmi */}
      {receiptData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 text-center space-y-4 border-b border-slate-100">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                receiptData.isWithdrawal ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
              }`}>
                <RpReceipt className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">KOPERASI MERAH PUTIH</h4>
                <p className="text-xs text-slate-500">Desa Lubuk Ogung, Kec. Bandar Sei Kijang, Pelalawan</p>
                <div className={`mt-2 text-xs font-bold py-1 px-3 rounded-full inline-block ${
                  receiptData.isWithdrawal ? "bg-rose-100 text-rose-800" : "bg-emerald-50 text-emerald-800"
                }`}>
                  {receiptData.title}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl text-left space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">No. Transaksi:</span>
                  <span className="font-bold text-slate-800">{receiptData.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nama Warga:</span>
                  <span className="font-bold text-slate-800">{receiptData.name}</span>
                </div>
                {receiptData.nik && receiptData.nik !== "-" && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">NIK:</span>
                    <span className="font-bold text-slate-800">{receiptData.nik}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Jenis Transaksi:</span>
                  <span className="font-bold text-slate-800">{receiptData.type}</span>
                </div>
                {receiptData.note && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Keterangan:</span>
                    <span className="font-medium text-slate-700">{receiptData.note}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Tanggal & Waktu:</span>
                  <span className="font-bold text-slate-800">{formatDateIndo(receiptData.date)}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold">
                  <span className="text-slate-700">Jumlah Kas:</span>
                  <span className={receiptData.isWithdrawal ? "text-rose-700" : "text-emerald-700"}>
                    {formatRupiah(receiptData.amount)}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 italic">
                Tanda terima sah diverifikasi secara resmi oleh Bendahara: {receiptData.officer}
              </div>
            </div>

            <div className="p-4 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Kwitansi PDF
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
    <ProtectedRoute allowedRoles={["BENDAHARA", "MANAGER", "MASTER"]}>
      <BendaharaDashboardContent />
    </ProtectedRoute>
  );
}

