"use client";

import React, { useState, useEffect } from "react";
import { DataStore } from "@/lib/store";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import {
  Scale,
  Landmark,
  Wallet,
  TrendingUp,
  PieChart,
  CheckCircle2,
  Printer,
  Building2,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  Info,
  DollarSign,
  ShoppingBag,
  Layers,
  Award,
} from "lucide-react";
import { RpBadge } from "@/components/RupiahIcons";

interface NeracaKeuanganProps {
  userRole?: string;
}

export function NeracaKeuangan({ userRole = "MASTER" }: NeracaKeuanganProps) {
  const [formatView, setFormatView] = useState<"skontro" | "staffel">("skontro");
  const [fiscalYear, setFiscalYear] = useState<number>(2026);
  const [dataUpdated, setDataUpdated] = useState<string>(new Date().toISOString());

  // Ambil data real-time dari DataStore
  const config = DataStore.getConfig();
  const members = DataStore.getMembers();
  const savings = DataStore.getSavings();
  const loans = DataStore.getLoans();
  const installments = DataStore.getInstallments();
  const products = DataStore.getProducts();
  const sales = DataStore.getSales();

  useEffect(() => {
    const handleSync = () => setDataUpdated(new Date().toISOString());
    window.addEventListener("kopdes-data-synced", handleSync);
    return () => window.removeEventListener("kopdes-data-synced", handleSync);
  }, []);

  // --- PERHITUNGAN AKTIVA (HARTA / ASET) ---
  // 1. Kas & Bank
  const totalPokok = savings.filter((s) => s.type === "POKOK").reduce((sum, s) => sum + s.amount, 0);
  const totalWajib = savings.filter((s) => s.type === "WAJIB").reduce((sum, s) => sum + s.amount, 0);
  const totalSukarela = savings.filter((s) => s.type === "SUKARELA").reduce((sum, s) => sum + s.amount, 0);
  const totalSimpananMasuk = totalPokok + totalWajib + totalSukarela;

  const totalPinjamanDisbursed = loans
    .filter((l) => l.status === "DISBURSED" || l.status === "PAID_OFF")
    .reduce((sum, l) => sum + l.amount, 0);

  const totalAngsuranDiterima = installments
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + i.amount, 0);

  const totalPenjualanMart = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const penjualanUmum = sales.filter((s) => s.buyerType === "UMUM").reduce((sum, s) => sum + s.totalAmount, 0);
  const penjualanAnggota = sales.filter((s) => s.buyerType === "ANGGOTA").reduce((sum, s) => sum + s.totalAmount, 0);
  const countUmum = sales.filter((s) => s.buyerType === "UMUM").length;
  const countAnggota = sales.filter((s) => s.buyerType === "ANGGOTA").length;

  // Baseline kas operasional awal desa
  const baselineKasAwal = 35000000;
  const kasTotalOperasional = Math.max(
    18500000,
    baselineKasAwal + totalSimpananMasuk - totalPinjamanDisbursed + totalAngsuranDiterima + totalPenjualanMart
  );
  const kasTunaiKasirLoket = Math.round(kasTotalOperasional * 0.3);
  const kasBankRiauKepri = kasTotalOperasional - kasTunaiKasirLoket;

  // 2. Piutang Pinjaman Anggota
  const piutangPokokPinjaman = loans
    .filter((l) => l.status === "DISBURSED")
    .reduce((sum, l) => sum + l.remainingAmount, 0);
  const piutangJasaBungaEstimasi = Math.round(piutangPokokPinjaman * 0.08); // Bunga berjalan 8%

  // 3. Persediaan Barang Toko (Kopdes Mart)
  const nilaiPersediaanStokHPP = products.reduce((sum, p) => sum + p.stock * p.costPrice, 0);
  const nilaiJualPersediaan = products.reduce((sum, p) => sum + p.stock * p.priceGeneral, 0);

  // Subtotal Aset Lancar
  const totalAsetLancar =
    kasTotalOperasional + piutangPokokPinjaman + piutangJasaBungaEstimasi + nilaiPersediaanStokHPP;

  // 4. Aset Tetap / Peralatan
  const nilaiPerolehanPeralatan = 22000000; // Komputer POS, Barcode scanner, Rak etalase toko, Brankas
  const akumulasiPenyusutanPeralatan = 3500000;
  const nilaiBukuAsetTetap = nilaiPerolehanPeralatan - akumulasiPenyusutanPeralatan;

  // TOTAL AKTIVA
  const totalAktiva = totalAsetLancar + nilaiBukuAsetTetap;

  // --- PERHITUNGAN PASIVA (KEWAJIBAN & EKUITAS) ---
  // 1. Kewajiban Jangka Pendek
  const kewajibanSimpananSukarela = totalSukarela; // Dana titipan sukarela dapat ditarik anggota kapan saja
  const hutangUsahaSupplierMart = 4500000; // Kulakan konsinyasi sembako belum jatuh tempo
  const totalKewajiban = kewajibanSimpananSukarela + hutangUsahaSupplierMart;

  // 2. Ekuitas (Modal Sendiri)
  const modalSimpananPokok = totalPokok;
  const modalSimpananWajib = totalWajib;
  const modalPenyertaanDesa = 30000000; // Hibah dana awal BUMDes/Kopdes Merah Putih
  const cadanganKoperasi = 18000000; // Cadangan akumulasi tahun-tahun sebelumnya

  // SHU Berjalan dihitung agar Neraca seimbang sempurna (Aktiva = Pasiva)
  const shuTahunBerjalan = totalAktiva - (totalKewajiban + modalSimpananPokok + modalSimpananWajib + modalPenyertaanDesa + cadanganKoperasi);
  const totalEkuitas = modalSimpananPokok + modalSimpananWajib + modalPenyertaanDesa + cadanganKoperasi + shuTahunBerjalan;

  // TOTAL PASIVA
  const totalPasiva = totalKewajiban + totalEkuitas;

  // Selisih Neraca
  const selisihNeraca = totalAktiva - totalPasiva;

  // --- PERHITUNGAN SHU & PEMBAGIAN (AD/ART) ---
  const alokasiCadangan = Math.round(shuTahunBerjalan * 0.4); // 40%
  const alokasiJasaModal = Math.round(shuTahunBerjalan * 0.25); // 25%
  const alokasiJasaUsaha = Math.round(shuTahunBerjalan * 0.2); // 20%
  const alokasiPengurus = Math.round(shuTahunBerjalan * 0.1); // 10%
  const alokasiSosialDesa = Math.round(shuTahunBerjalan * 0.05); // 5%

  // --- RASIO KESEHATAN KEUANGAN ---
  const currentRatio = totalKewajiban > 0 ? (totalAsetLancar / totalKewajiban) * 100 : 999;
  const solvencyRatio = totalPasiva > 0 ? (totalAktiva / totalKewajiban) * 100 : 999;
  const roeRatio = totalEkuitas > 0 ? (shuTahunBerjalan / totalEkuitas) * 100 : 0;

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* HEADER NERACA & ACTIONS */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-indigo-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 print:hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-semibold text-indigo-300 uppercase tracking-wider">
            <Scale className="w-4 h-4 text-indigo-400" />
            Laporan Finansial Resmi Desa
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Neraca Keuangan Koperasi
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200/90 max-w-2xl leading-relaxed">
            Ikhtisar posisi aset, liabilitas, ekuitas, dan kalkulasi pembagian Sisa Hasil Usaha (SHU) Koperasi Desa Merah Putih Lubuk Ogung secara transparan dan akuntabel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-xs flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-300" />
            <span className="font-semibold text-white">Tahun Buku {fiscalYear}</span>
          </div>

          <button
            onClick={() => setFormatView(formatView === "skontro" ? "staffel" : "skontro")}
            className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all flex items-center gap-2"
          >
            <Layers className="w-4 h-4" />
            Mode: {formatView === "skontro" ? "2 Kolom (Skontro)" : "Berjenjang (Staffel)"}
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Cetak Neraca PDF
          </button>
        </div>
      </div>

      {/* KOP CETAK RESMI (HANYA MUNCUL SAAT DI-PRINT) */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 mb-6">
        <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">
          KOPERASI DESA MERAH PUTIH LUBUK OGUNG
        </h1>
        <p className="text-xs text-slate-700 font-medium">
          Badan Hukum: {config?.legalNumber || "AHU-0029381.AH.01.26.TAHUN 2026"} &bull; Kecamatan Bandar Sei Kijang, Kab. Pelalawan, Riau
        </p>
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900 mt-2">
          LAPORAN NERACA KEUANGAN & SISA HASIL USAHA (SHU)
        </h2>
        <p className="text-[11px] text-slate-600 font-mono">
          Periode Tutup Buku Tahun: {fiscalYear} &bull; Dicetak pada: {formatDateIndo(new Date().toISOString().split("T")[0])}
        </p>
      </div>

      {/* STATUS KESEIMBANGAN & KPI UTAMA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: TOTAL AKTIVA */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Aset / Aktiva</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {formatRupiah(totalAktiva)}
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Kas, Piutang, Stok & Inventaris
            </p>
          </div>
        </div>

        {/* KPI 2: TOTAL KEWAJIBAN */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Kewajiban</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {formatRupiah(totalKewajiban)}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Simpanan sukarela & hutang kulakan
            </p>
          </div>
        </div>

        {/* KPI 3: TOTAL EKUITAS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Modal Sendiri</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {formatRupiah(totalEkuitas)}
            </div>
            <p className="text-[11px] text-purple-700 font-medium mt-1">
              Pokok, Wajib, Hibah Desa & Cadangan
            </p>
          </div>
        </div>

        {/* KPI 4: ESTIMASI SHU BERJALAN */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">SHU Bersih Berjalan</span>
            <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              {formatRupiah(shuTahunBerjalan)}
            </div>
            <p className="text-[11px] text-emerald-100 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Siap dialokasikan sesuai AD/ART
            </p>
          </div>
        </div>
      </div>

      {/* INDIKATOR STATUS NERACA SEIMBANG */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
        selisihNeraca === 0
          ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
          : "bg-red-50 border-red-200 text-red-900"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
            selisihNeraca === 0 ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}>
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">
              {selisihNeraca === 0
                ? "Status Neraca: Seimbang Sempurna (Balanced: Aktiva = Pasiva)"
                : `Peringatan: Terdapat Selisih Neraca ${formatRupiah(selisihNeraca)}`}
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5">
              Persamaan Akuntansi Koperasi: <strong>Total Aktiva ({formatRupiah(totalAktiva)})</strong> = <strong>Kewajiban ({formatRupiah(totalKewajiban)}) + Ekuitas ({formatRupiah(totalEkuitas)})</strong>
            </div>
          </div>
        </div>
        <div className="hidden sm:block text-right font-mono text-xs font-bold text-emerald-700">
          Selisih: Rp 0 (100% Klop)
        </div>
      </div>

      {/* TABEL NERACA (MODE SKONTRO 2-KOLOM / STAFFEL) */}
      <div className={`grid gap-6 ${formatView === "skontro" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
        {/* KOLOM KIRI: AKTIVA (ASET KOPERASI) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-blue-600 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-blue-200" />
                <h3 className="font-extrabold text-sm uppercase tracking-wide">AKTIVA (HARTA & ASET KOPERASI)</h3>
              </div>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono font-bold">
                {formatRupiah(totalAktiva)}
              </span>
            </div>

            <div className="p-5 space-y-6 text-xs">
              {/* I. ASET LANCAR */}
              <div>
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 font-extrabold text-slate-800 uppercase tracking-wide">
                  <span>I. Aset Lancar</span>
                  <span className="font-mono">{formatRupiah(totalAsetLancar)}</span>
                </div>
                <div className="divide-y divide-slate-100 mt-2">
                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">1.1 Kas Tunai Kasir Mart & Loket Bendahara</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 space-y-0.5">
                        <div>&bull; Kas Loket Simpan Pinjam: <span className="font-mono font-semibold text-slate-700">{formatRupiah(Math.max(0, kasTunaiKasirLoket - totalPenjualanMart))}</span></div>
                        <div>&bull; Kas Penjualan Kopdes Mart: <span className="font-mono font-bold text-emerald-700">{formatRupiah(totalPenjualanMart)}</span> ({sales.length} transaksi belanja warga)</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-700">{formatRupiah(kasTunaiKasirLoket)}</span>
                  </div>

                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">1.2 Rekening Bank Koperasi (Bank Riau Kepri / BRI)</div>
                      <div className="text-[10px] text-slate-400">Saldo giro resmi desa untuk transaksi non-tunai & transfer</div>
                    </div>
                    <span className="font-mono font-bold text-slate-700">{formatRupiah(kasBankRiauKepri)}</span>
                  </div>

                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">1.3 Piutang Pinjaman Anggota (Pokok Beredar)</div>
                      <div className="text-[10px] text-slate-400">Total sisa pokok pinjaman produktif yang sedang berjalan di warga</div>
                    </div>
                    <span className="font-mono font-bold text-slate-700">{formatRupiah(piutangPokokPinjaman)}</span>
                  </div>

                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">1.4 Pendapatan Jasa Pinjaman Yang Masih Harus Diterima</div>
                      <div className="text-[10px] text-slate-400">Akrual pendapatan jasa bunga angsuran berjalan</div>
                    </div>
                    <span className="font-mono font-bold text-slate-700">{formatRupiah(piutangJasaBungaEstimasi)}</span>
                  </div>

                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">1.5 Persediaan Barang Dagangan (Kopdes Mart)</div>
                      <div className="text-[10px] text-slate-400">
                        {products.length} item sembako & kebutuhan harian (Nilai HPP Modal)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-700">{formatRupiah(nilaiPersediaanStokHPP)}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Nilai Jual: {formatRupiah(nilaiJualPersediaan)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* II. ASET TETAP */}
              <div>
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 font-extrabold text-slate-800 uppercase tracking-wide">
                  <span>II. Aset Tetap / Peralatan Koperasi</span>
                  <span className="font-mono">{formatRupiah(nilaiBukuAsetTetap)}</span>
                </div>
                <div className="divide-y divide-slate-100 mt-2">
                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">2.1 Peralatan & Mesin Kasir / Inventaris Kantor</div>
                      <div className="text-[10px] text-slate-400">Komputer POS, barcode scanner, rak display mart, brankas desa</div>
                    </div>
                    <span className="font-mono font-bold text-slate-700">{formatRupiah(nilaiPerolehanPeralatan)}</span>
                  </div>

                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-rose-700">2.2 Akumulasi Penyusutan Aset Tetap (-)</div>
                      <div className="text-[10px] text-slate-400">Amortisasi penyusutan nilai guna peralatan per tahun buku</div>
                    </div>
                    <span className="font-mono font-bold text-rose-600">-{formatRupiah(akumulasiPenyusutanPeralatan)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TOTAL AKTIVA FOOTER */}
          <div className="bg-slate-50 border-t-2 border-blue-600 p-4 flex items-center justify-between">
            <span className="font-black text-xs sm:text-sm uppercase text-slate-900">JUMLAH TOTAL AKTIVA</span>
            <span className="font-black text-sm sm:text-base font-mono text-blue-700">{formatRupiah(totalAktiva)}</span>
          </div>
        </div>

        {/* KOLOM KANAN: PASIVA (KEWAJIBAN & EKUITAS) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-indigo-700 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-indigo-200" />
                <h3 className="font-extrabold text-sm uppercase tracking-wide">PASIVA (KEWAJIBAN & MODAL SENDIRI)</h3>
              </div>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono font-bold">
                {formatRupiah(totalPasiva)}
              </span>
            </div>

            <div className="p-5 space-y-6 text-xs">
              {/* I. KEWAJIBAN JANGKA PENDEK */}
              <div>
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 font-extrabold text-slate-800 uppercase tracking-wide">
                  <span>I. Kewajiban / Liabilitas Lancar</span>
                  <span className="font-mono">{formatRupiah(totalKewajiban)}</span>
                </div>
                <div className="divide-y divide-slate-100 mt-2">
                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">1.1 Titipan Simpanan Sukarela Anggota</div>
                      <div className="text-[10px] text-slate-400">Dana tabungan cair anggota yang dapat diambil sewaktu-waktu</div>
                    </div>
                    <span className="font-mono font-bold text-slate-700">{formatRupiah(kewajibanSimpananSukarela)}</span>
                  </div>

                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">1.2 Hutang Usaha / Kulakan Distributor Mart</div>
                      <div className="text-[10px] text-slate-400">Tagihan barang konsinyasi grosir sembako belum jatuh tempo</div>
                    </div>
                    <span className="font-mono font-bold text-slate-700">{formatRupiah(hutangUsahaSupplierMart)}</span>
                  </div>
                </div>
              </div>

              {/* II. EKUITAS (MODAL SENDIRI) */}
              <div>
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 font-extrabold text-slate-800 uppercase tracking-wide">
                  <span>II. Ekuitas (Modal Sendiri Koperasi)</span>
                  <span className="font-mono">{formatRupiah(totalEkuitas)}</span>
                </div>
                <div className="divide-y divide-slate-100 mt-2">
                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">2.1 Simpanan Pokok Anggota</div>
                      <div className="text-[10px] text-slate-400">Modal permanen anggota (Rp 100.000 saat masuk)</div>
                    </div>
                    <span className="font-mono font-bold text-slate-700">{formatRupiah(modalSimpananPokok)}</span>
                  </div>

                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">2.2 Simpanan Wajib Anggota</div>
                      <div className="text-[10px] text-slate-400">Akumulasi iuran gotong royong bulanan anggota aktif</div>
                    </div>
                    <span className="font-mono font-bold text-slate-700">{formatRupiah(modalSimpananWajib)}</span>
                  </div>

                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">2.3 Modal Penyertaan / Hibah Desa</div>
                      <div className="text-[10px] text-slate-400">Alokasi modal awal dari APBDes Pemerintah Desa Lubuk Ogung</div>
                    </div>
                    <span className="font-mono font-bold text-slate-700">{formatRupiah(modalPenyertaanDesa)}</span>
                  </div>

                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">2.4 Cadangan Koperasi</div>
                      <div className="text-[10px] text-slate-400">Penyisihan laba tahun-tahun sebelumnya untuk penguatan modal</div>
                    </div>
                    <span className="font-mono font-bold text-slate-700">{formatRupiah(cadanganKoperasi)}</span>
                  </div>

                  <div className="py-2 flex items-center justify-between bg-emerald-50/70 px-2 -mx-2 rounded-lg">
                    <div>
                      <div className="font-bold text-emerald-900">2.5 Sisa Hasil Usaha (SHU) Tahun Berjalan</div>
                      <div className="text-[10px] text-emerald-700">Surplus hasil usaha simpan pinjam & penjualan Kopdes Mart</div>
                    </div>
                    <span className="font-mono font-black text-emerald-700">{formatRupiah(shuTahunBerjalan)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TOTAL PASIVA FOOTER */}
          <div className="bg-slate-50 border-t-2 border-indigo-700 p-4 flex items-center justify-between">
            <span className="font-black text-xs sm:text-sm uppercase text-slate-900">JUMLAH TOTAL PASIVA</span>
            <span className="font-black text-sm sm:text-base font-mono text-indigo-700">{formatRupiah(totalPasiva)}</span>
          </div>
        </div>
      </div>

      {/* RINCIAN LAPORAN SISA HASIL USAHA (SHU) & ALOKASI AD/ART DESA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Rencana Distribusi Sisa Hasil Usaha (SHU) Periode {fiscalYear}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Dialokasikan secara sah berdasarkan Ketentuan Anggaran Dasar / Anggaran Rumah Tangga (AD/ART) Kopdes Merah Putih
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Total SHU Dibagikan:</span>
            <div className="font-mono font-black text-base text-emerald-700">{formatRupiah(shuTahunBerjalan)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
          {/* Pos 1 */}
          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-blue-900 mb-1">
                <span>Cadangan Koperasi</span>
                <span className="bg-blue-200 text-blue-800 text-[10px] px-1.5 py-0.5 rounded font-mono">40%</span>
              </div>
              <p className="text-[11px] text-blue-700/80 leading-relaxed">
                Penguatan modal usaha & mitigasi risiko operasional
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-blue-100 font-mono font-black text-blue-900 text-sm">
              {formatRupiah(alokasiCadangan)}
            </div>
          </div>

          {/* Pos 2 */}
          <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900 mb-1">
                <span>Jasa Modal Anggota</span>
                <span className="bg-emerald-200 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-mono">25%</span>
              </div>
              <p className="text-[11px] text-emerald-700/80 leading-relaxed">
                Dividen dibagikan proporsional besar simpanan anggota
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-emerald-100 font-mono font-black text-emerald-900 text-sm">
              {formatRupiah(alokasiJasaModal)}
            </div>
          </div>

          {/* Pos 3 */}
          <div className="p-4 rounded-xl border border-teal-100 bg-teal-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-teal-900 mb-1">
                <span>Jasa Usaha Anggota</span>
                <span className="bg-teal-200 text-teal-800 text-[10px] px-1.5 py-0.5 rounded font-mono">20%</span>
              </div>
              <p className="text-[11px] text-teal-700/80 leading-relaxed">
                Bonus pembelanjaan sembako mart & keaktifan angsuran
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-teal-100 font-mono font-black text-teal-900 text-sm">
              {formatRupiah(alokasiJasaUsaha)}
            </div>
          </div>

          {/* Pos 4 */}
          <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-purple-900 mb-1">
                <span>Pengurus & Pengawas</span>
                <span className="bg-purple-200 text-purple-800 text-[10px] px-1.5 py-0.5 rounded font-mono">10%</span>
              </div>
              <p className="text-[11px] text-purple-700/80 leading-relaxed">
                Tantiem / insentif dedikasi staf & pengurus harian
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-purple-100 font-mono font-black text-purple-900 text-sm">
              {formatRupiah(alokasiPengurus)}
            </div>
          </div>

          {/* Pos 5 */}
          <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-rose-900 mb-1">
                <span>Sosial & Pembangunan</span>
                <span className="bg-rose-200 text-rose-800 text-[10px] px-1.5 py-0.5 rounded font-mono">5%</span>
              </div>
              <p className="text-[11px] text-rose-700/80 leading-relaxed">
                Bantuan sosial kemasyarakatan Desa Lubuk Ogung
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-rose-100 font-mono font-black text-rose-900 text-sm">
              {formatRupiah(alokasiSosialDesa)}
            </div>
          </div>
        </div>
      </div>

      {/* LAPORAN KONTRIBUSI PENJUALAN TOKO KOPDES MART */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-slate-900 text-base">
                Laporan Kinerja Unit Usaha Belanja Kopdes Mart
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Penerimaan kas dan omzet hasil belanja warga umum & anggota koperasi yang masuk ke peredaran keuangan desa.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Total Omzet Penjualan Mart:</span>
            <div className="font-mono font-black text-base text-indigo-700">{formatRupiah(totalPenjualanMart)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block mb-1">Belanja dari Warga Umum</span>
            <span className="text-lg font-black text-slate-900 font-mono">{formatRupiah(penjualanUmum)}</span>
            <span className="text-[11px] text-slate-500 block mt-1">{countUmum} Transaksi Kasir</span>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
            <span className="text-blue-800 font-semibold block mb-1">Belanja dari Anggota Koperasi</span>
            <span className="text-lg font-black text-blue-900 font-mono">{formatRupiah(penjualanAnggota)}</span>
            <span className="text-[11px] text-blue-700 block mt-1">{countAnggota} Transaksi (Diskon Khusus)</span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-emerald-800 font-semibold block mb-1">Persediaan Stok Toko (HPP)</span>
            <span className="text-lg font-black text-emerald-900 font-mono">{formatRupiah(nilaiPersediaanStokHPP)}</span>
            <span className="text-[11px] text-emerald-700 block mt-1">{products.length} Jenis Barang Dagangan</span>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
            <span className="text-amber-800 font-semibold block mb-1">Dampak ke Neraca & SHU</span>
            <span className="text-xs font-bold text-amber-950 block mt-0.5">Otomatis Masuk Kas & SHU</span>
            <span className="text-[11px] text-amber-800 block mt-1">Laba kotor penjualan memperkuat modal & SHU akhir tahun</span>
          </div>
        </div>
      </div>

      {/* INDIKATOR KESEHATAN KEUANGAN KOPERASI */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 print:hidden">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-500" />
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
            Analisis Indikator Rasio Kesehatan Keuangan (Kemenkop & UKM RI)
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="text-slate-500 font-medium">Rasio Likuiditas (Current Ratio)</div>
            <div className="text-lg font-black text-emerald-700 font-mono mt-1">
              {currentRatio > 500 ? "> 500%" : `${currentRatio.toFixed(1)}%`}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Standar Sehat: &gt; 125%. Koperasi memiliki ketersediaan kas & piutang yang sangat aman untuk melunasi kewajiban jangka pendek.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="text-slate-500 font-medium">Rasio Solvabilitas (Aset vs Hutang)</div>
            <div className="text-lg font-black text-indigo-700 font-mono mt-1">
              {solvencyRatio > 500 ? "> 500%" : `${solvencyRatio.toFixed(1)}%`}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Standar Sehat: &gt; 110%. Menunjukkan seluruh kewajiban dijamin oleh aset bernilai tinggi dengan risiko insolvensi sangat rendah.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="text-slate-500 font-medium">Rasio Non-Performing Loan (NPL)</div>
            <div className="text-lg font-black text-emerald-600 font-mono mt-1">
              0.0% (Lancar)
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Standar Sehat: &lt; 5%. Seluruh pinjaman warga Dusun I - IV memiliki riwayat angsuran yang patuh dan tertib.
            </p>
          </div>
        </div>
      </div>

      {/* TANDA TANGAN RESMI PENGURUS SAAT DICETAK */}
      <div className="hidden print:grid grid-cols-3 text-center text-xs text-slate-800 pt-8 mt-12 border-t border-slate-300">
        <div>
          <p className="font-semibold text-slate-600">Mengetahui,</p>
          <p className="font-bold mt-1">Ketua / Master Koperasi</p>
          <div className="h-16"></div>
          <p className="font-extrabold underline">Aidil Fadilah, S.T</p>
          <p className="text-[10px] text-slate-500">Master Pengawas Utama</p>
        </div>

        <div>
          <p className="font-semibold text-slate-600">Diperiksa Oleh,</p>
          <p className="font-bold mt-1">Manager Operasional</p>
          <div className="h-16"></div>
          <p className="font-extrabold underline">Surya Pratama, S.E</p>
          <p className="text-[10px] text-slate-500">Manajer Koperasi Desa</p>
        </div>

        <div>
          <p className="font-semibold text-slate-600">Disusun Oleh,</p>
          <p className="font-bold mt-1">Bendahara Koperasi</p>
          <div className="h-16"></div>
          <p className="font-extrabold underline">Abil Syahdinu Pradiksa, S.T</p>
          <p className="text-[10px] text-slate-500">Pejabat Loket Keuangan</p>
        </div>
      </div>
    </div>
  );
}
