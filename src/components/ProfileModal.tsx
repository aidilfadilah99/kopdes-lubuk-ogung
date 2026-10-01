"use client";

import React, { useState } from "react";
import { X, User, Phone, Mail, Lock, Save, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { DataStore } from "@/lib/store";

interface ProfileModalProps {
  onClose: () => void;
}

export function ProfileModal({ onClose }: ProfileModalProps) {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState<"info" | "password">("info");

  const [name, setName] = useState(currentUser?.name ?? "");
  const [email, setEmail] = useState(currentUser?.email ?? "");
  const [phone, setPhone] = useState(currentUser?.phone ?? "");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  if (!currentUser) return null;

  const showMsg = (type: "success" | "error", text: string) => {
    setMsg({ type, text });
    if (type === "success") setTimeout(() => setMsg(null), 3000);
  };

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { showMsg("error", "Nama tidak boleh kosong."); return; }
    setSaving(true);
    const users = DataStore.getUsers();
    const idx = users.findIndex(u => u.id === currentUser.id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], name: name.trim(), email: email.trim(), phone: phone.trim() };
      DataStore.saveUser(users[idx]);
      DataStore.addAuditLog("UPDATE_PROFILE", `${currentUser.name} memperbarui data profil`, {
        id: currentUser.id, name: currentUser.name, role: currentUser.role,
      });
      // Update session
      localStorage.setItem("kopdes_session_v3", JSON.stringify(users[idx]));
    }
    setSaving(false);
    showMsg("success", "Profil berhasil diperbarui. Silakan refresh halaman untuk melihat perubahan nama.");
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const users = DataStore.getUsers();
    const user = users.find(u => u.id === currentUser.id);
    if (!user) return;
    if (user.password !== oldPassword) { showMsg("error", "Password lama salah."); return; }
    if (newPassword.length < 6) { showMsg("error", "Password baru minimal 6 karakter."); return; }
    if (newPassword !== confirmPassword) { showMsg("error", "Konfirmasi password tidak cocok."); return; }
    setSaving(true);
    user.password = newPassword;
    DataStore.saveUser(user);
    DataStore.addAuditLog("CHANGE_PASSWORD", `${currentUser.name} mengubah password akun`, {
      id: currentUser.id, name: currentUser.name, role: currentUser.role,
    });
    setOldPassword(""); setNewPassword(""); setConfirmPassword("");
    setSaving(false);
    showMsg("success", "Password berhasil diubah. Gunakan password baru saat login berikutnya.");
  };

  const ROLE_LABELS: Record<string, string> = {
    MASTER: "Master (Ketua Pengawas)", ADMIN: "Admin (Sekretaris)",
    BENDAHARA: "Bendahara (Kasir)", ANGGOTA: "Anggota Warga",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">{currentUser.name.charAt(0)}</span>
            </div>
            <div>
              <p className="text-white font-semibold leading-tight">{currentUser.name}</p>
              <p className="text-gray-400 text-xs">{ROLE_LABELS[currentUser.role] ?? currentUser.role}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {(["info", "password"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setMsg(null); }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                tab === t ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "info" ? "Data Diri" : "Ubah Password"}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Notification */}
          {msg && (
            <div className={`flex items-start gap-2 p-3 rounded-xl mb-4 text-sm ${
              msg.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              {msg.type === "success" ? <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
              {msg.text}
            </div>
          )}

          {tab === "info" ? (
            <form onSubmit={handleSaveInfo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Username</label>
                <input value={currentUser.username} disabled
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed font-mono" />
                <p className="text-[10px] text-gray-400 mt-1">Username tidak dapat diubah sendiri. Hubungi Master.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  <User className="w-3.5 h-3.5 inline mr-1" />Nama Lengkap
                </label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-800 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  <Mail className="w-3.5 h-3.5 inline mr-1" />Email
                </label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-800 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  <Phone className="w-3.5 h-3.5 inline mr-1" />No. WhatsApp
                </label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-800 focus:outline-none" />
              </div>
              <button type="submit" disabled={saving}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
                <Save className="w-4 h-4" />
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  <Lock className="w-3.5 h-3.5 inline mr-1" />Password Lama
                </label>
                <div className="relative">
                  <input type={showOld ? "text" : "password"} value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)} required
                    className="w-full px-3.5 py-2.5 pr-10 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-800 focus:outline-none" />
                  <button type="button" onClick={() => setShowOld(!showOld)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password Baru</label>
                <div className="relative">
                  <input type={showNew ? "text" : "password"} value={newPassword}
                    onChange={e => setNewPassword(e.target.value)} required minLength={6}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3.5 py-2.5 pr-10 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-800 focus:outline-none" />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Konfirmasi Password Baru</label>
                <input type="password" value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)} required
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-800 focus:outline-none" />
              </div>
              <button type="submit" disabled={saving}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
                <Lock className="w-4 h-4" />
                {saving ? "Menyimpan..." : "Ubah Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
