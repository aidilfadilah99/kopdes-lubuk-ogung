import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KOPDES Merah Putih - Desa Lubuk Ogung",
  description: "Sistem Manajemen Koperasi Desa Merah Putih Desa Lubuk Ogung, Kec. Bandar Sei Kijang, Kab. Pelalawan, Riau.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
            <Header />
            <main className="flex-1 pb-16">{children}</main>
            <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <p className="font-semibold text-slate-700">
                  Koperasi Desa Merah Putih Lubuk Ogung &copy; {new Date().getFullYear()}
                </p>
                <p className="mt-1 text-slate-400">
                  Desa Lubuk Ogung, Kec. Bandar Sei Kijang, Kab. Pelalawan, Riau | Siap Hosting Vercel
                </p>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
