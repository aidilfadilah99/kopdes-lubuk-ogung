"use client";

import React, { useState } from "react";
import { X, XCircle, AlertTriangle } from "lucide-react";

interface RejectModalProps {
  title: string;
  description: string;
  defaultReason?: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

export function RejectModal({ title, description, defaultReason = "", onConfirm, onClose }: RejectModalProps) {
  const [reason, setReason] = useState(defaultReason);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <XCircle className="w-5 h-5 text-white" />
            </div>
            <p className="text-white font-semibold">{title}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Warning */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800">{description}</p>
          </div>

          {/* Reason textarea */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Alasan Penolakan <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              required
              placeholder="Tuliskan alasan penolakan dengan jelas..."
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none resize-none"
            />
          </div>

          {/* Quick reasons */}
          <div>
            <p className="text-[10px] text-gray-500 mb-2 font-medium uppercase tracking-wide">Alasan umum:</p>
            <div className="flex flex-wrap gap-2">
              {[
                "Dokumen agunan belum memadai",
                "Syarat administrasi belum lengkap",
                "Kapasitas pinjam melebihi batas",
                "Anggota memiliki tunggakan aktif",
              ].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={!reason.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
              <XCircle className="w-4 h-4" />
              Tolak Pengajuan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
