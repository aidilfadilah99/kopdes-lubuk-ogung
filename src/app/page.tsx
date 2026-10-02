"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Scale, LogIn, Users, TrendingUp, Shield } from "lucide-react";

export default function HomePage() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && currentUser) {
      const map: Record<string, string> = {
        MASTER: "/master",
        MANAGER: "/admin",
        ADMIN: "/admin",
        BENDAHARA: "/bendahara",
        ANGGOTA: "/anggota",
      };
      router.replace(map[currentUser.role] ?? "/transparansi");
    }
  }, [currentUser, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (currentUser) return null;

  // Public landing page
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-gray-50 to-white">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          <Shield className="w-4 h-4" />
          Sistem Manajemen Resmi
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
          Koperasi Desa Merah Putih
          <span className="text-red-700 block mt-1">Lubuk Ogung</span>
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-10">
          Platform digital pengelolaan simpan pinjam, keuangan, dan transparansi
          koperasi desa yang terintegrasi untuk seluruh warga.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/login"
            className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white font-semibold px-8 py-3 rounded-xl transition-colors shadow-lg shadow-red-200 w-full sm:w-auto justify-center"
          >
            <LogIn className="w-5 h-5" />
            Masuk ke Sistem
          </a>
          <a
            href="/transparansi"
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-semibold px-8 py-3 rounded-xl transition-colors w-full sm:w-auto justify-center"
          >
            <Scale className="w-5 h-5" />
            Portal Transparansi Publik
          </a>
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-4xl mx-auto px-4 pb-16 grid sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            icon: Shield,
            color: "text-red-600 bg-red-50",
            title: "Sistem Berbasis Peran",
            desc: "Akses terpisah untuk Master, Manager, Admin, Bendahara, dan Anggota sesuai tupoksi.",
          },
          {
            icon: TrendingUp,
            color: "text-green-600 bg-green-50",
            title: "Pengelolaan Keuangan",
            desc: "Catat simpanan, pinjaman modal, dan cicilan angsuran secara real-time.",
          },
          {
            icon: Users,
            color: "text-emerald-600 bg-emerald-50",
            title: "Kopdes Mart Sembako",
            desc: "Minimarket kebutuhan harian warga & sembako dengan diskon khusus anggota koperasi.",
          },
          {
            icon: Scale,
            color: "text-blue-600 bg-blue-50",
            title: "Transparansi Publik",
            desc: "Laporan keuangan dan proyeksi SHU terbuka dapat dipantau oleh seluruh warga.",
          },
        ].map((f) => (
          <div key={f.title} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className={`w-10 h-10 ${f.color} rounded-xl flex items-center justify-center mb-3`}>
              <f.icon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1 text-sm">{f.title}</h3>
            <p className="text-gray-600 text-xs leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
