"use client";

import React, { useState } from "react";
import { X, Save, AlertCircle, CheckCircle, User, Lock, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { DataStore } from "@/lib/store";
import { User as UserType, UserRole } from "@/types";

interface EditUserModalProps {
  user: UserType;
  onClose: () => void;
  onSaved: () => void;
  currentMasterId: string;
}

const ROLE_OPTIONS: { value: UserRole; label: string; color: string }[] = [
  { value: "MASTER", label: "Master (Ketua Pengawas)", color: "text-red-700" },
  { value: "MANAGER", label: "Manager (Semua Akses Operasional)", color: "text-purple-700" },
  { value: "ADMIN", label: "Admin (Sekretaris)", color: "text-blue-700" },
  { value: "BENDAHARA", label: "Bendahara (Kasir)", color: "text-green-700" },
  { value: "KASIR", label: "Kasir (Kopdes Mart)", color: "text-teal-700" },
  { value: "GUDANG", label: "Petugas Gudang (Kopdes Mart)", color: "text-orange-700" },
  { value: "ANGGOTA", label: "Anggota Warga", color: "text-yellow-700" },
];

export function EditUserModal({ user, onClose, onSaved, currentMasterId }: EditUserModalProps) {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [role, setRole] = useState<UserRole>(user.role);
  const [isActive, setIsActive] = useState(user.isActive !== false);
  const [resetPassword, setResetPassword] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isSelf = user.id === currentMasterId;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) {
      setMsg({ type: "error", text: "Nama dan username tidak boleh kosong." });
      return;
    }
    setSaving(true);

    // Check username uniqueness (exclude self)
    const allUsers = DataStore.getUsers();
    const dup = allUsers.find(u => u.id !== user.id && u.username.toLowerCase() === username.trim().toLowerCase());
    if (dup) {
      setMsg({ type: "error", text: `Username "${username}" sudah digunakan oleh ${dup.name}.` });
      setSaving(false);
      return;
    }

    const updated: UserType = {
      ...user,
      name: name.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim(),
      phone: phone.trim(),
      role,
      isActive,
      password: resetPassword.trim() !== "" ? resetPassword.trim() : user.password,
    };

    DataStore.saveUser(updated);
    DataStore.addAuditLog(
      "EDIT_USER_MASTER",
      `Master mengedit data akun ${updated.name} (${updated.role})${resetPassword ? " — password direset" : ""}`,
      { id: currentMasterId, name: "Master", role: "MASTER" }
    );

    setSaving(false);
    setMsg({ type: "success", text: "Data pengguna berhasil diperbarui." });
    setTimeout(() => { onSaved(); onClose(); }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-white font-semibold">Edit Pengguna</p>
            <p className="text-slate-300 text-xs mt-0.5">@{user.username}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {msg && (
            <div className={`flex items-start gap-2 p-3 rounded-xl text-sm ${
              msg.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              {msg.type === "success" ? <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
              {msg.text}
            </div>
          )}

          {/* Nama */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              <User className="w-3.5 h-3.5 inline mr-1" />Nama Lengkap
            </label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-600 focus:outline-none" />
          </div>

          {/* Username */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required
                disabled={isSelf}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-600 focus:outline-none font-mono disabled:bg-gray-50 disabled:text-gray-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Role</label>
              <select value={role} onChange={e => setRole(e.target.value as UserRole)}
                disabled={isSelf}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-600 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400">
                {ROLE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.value}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-600 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">No. WA</label>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="0812-xxxx-xxxx"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-600 focus:outline-none" />
            </div>
          </div>

          {/* Reset Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              <Lock className="w-3.5 h-3.5 inline mr-1" />Reset Password (kosongkan jika tidak diubah)
            </label>
            <input type="text" value={resetPassword} onChange={e => setResetPassword(e.target.value)}
              placeholder="Password baru..."
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-600 focus:outline-none font-mono" />
          </div>

          {/* Status Aktif */}
          {!isSelf && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <p className="text-sm font-semibold text-gray-800">Status Akun</p>
                <p className="text-xs text-gray-500">{isActive ? "Aktif — dapat login ke sistem" : "Nonaktif — tidak dapat login"}</p>
              </div>
              <button type="button" onClick={() => setIsActive(!isActive)}
                className={`transition-colors ${isActive ? "text-green-600 hover:text-green-700" : "text-gray-400 hover:text-gray-500"}`}>
                {isActive ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
              </button>
            </div>
          )}

          {/* Hapus Akun */}
          {!isSelf && (
            <div className="border border-red-200 rounded-xl overflow-hidden">
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="w-full px-4 py-3 flex items-center gap-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus Akun Pengguna Ini
                </button>
              ) : (
                <div className="p-3 bg-red-50 space-y-2">
                  <p className="text-sm font-semibold text-red-800 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Yakin hapus akun <span className="underline">{user.name}</span>?
                  </p>
                  <p className="text-xs text-red-600">Tindakan ini permanen dan tidak dapat dibatalkan. Data login akan dihapus dari sistem.</p>
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => setConfirmDelete(false)}
                      className="flex-1 px-3 py-2 rounded-lg border border-red-300 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors">
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        DataStore.deleteUser(user.id);
                        DataStore.addAuditLog(
                          "DELETE_USER_MASTER",
                          `Master menghapus akun pengguna: ${user.name} (${user.role})`,
                          { id: currentMasterId, name: "Master", role: "MASTER" }
                        );
                        onSaved();
                        onClose();
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
                    >
                      Hapus Permanen
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
              <Save className="w-4 h-4" />
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
