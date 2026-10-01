"use client";

import React from "react";
import { X, CheckCircle, AlertTriangle, HelpCircle, DollarSign, Wallet } from "lucide-react";

export interface ConfirmDetailItem {
  label: string;
  value: string;
  highlight?: boolean;
}

interface ConfirmModalProps {
  title: string;
  description?: string;
  details?: ConfirmDetailItem[];
  confirmText?: string;
  cancelText?: string;
  theme?: "emerald" | "blue" | "amber" | "rose" | "indigo";
  icon?: "check" | "alert" | "dollar" | "wallet" | "help";
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  title,
  description,
  details = [],
  confirmText = "Ya, Konfirmasi",
  cancelText = "Batal",
  theme = "emerald",
  icon = "check",
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const themeStyles = {
    emerald: {
      headerBg: "from-emerald-700 to-teal-800",
      iconBg: "bg-emerald-100 text-emerald-700",
      buttonBg: "bg-emerald-600 hover:bg-emerald-700",
      ringColor: "focus:ring-emerald-500",
    },
    blue: {
      headerBg: "from-blue-700 to-indigo-800",
      iconBg: "bg-blue-100 text-blue-700",
      buttonBg: "bg-blue-600 hover:bg-blue-700",
      ringColor: "focus:ring-blue-500",
    },
    amber: {
      headerBg: "from-amber-600 to-orange-700",
      iconBg: "bg-amber-100 text-amber-700",
      buttonBg: "bg-amber-600 hover:bg-amber-700",
      ringColor: "focus:ring-amber-500",
    },
    rose: {
      headerBg: "from-rose-600 to-red-700",
      iconBg: "bg-rose-100 text-rose-700",
      buttonBg: "bg-rose-600 hover:bg-rose-700",
      ringColor: "focus:ring-rose-500",
    },
    indigo: {
      headerBg: "from-indigo-700 to-purple-800",
      iconBg: "bg-indigo-100 text-indigo-700",
      buttonBg: "bg-indigo-600 hover:bg-indigo-700",
      ringColor: "focus:ring-indigo-500",
    },
  }[theme];

  const renderIcon = () => {
    switch (icon) {
      case "dollar":
        return <DollarSign className="w-5 h-5" />;
      case "wallet":
        return <Wallet className="w-5 h-5" />;
      case "alert":
        return <AlertTriangle className="w-5 h-5" />;
      case "help":
        return <HelpCircle className="w-5 h-5" />;
      case "check":
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95">
        {/* Header */}
        <div className={`bg-gradient-to-r ${themeStyles.headerBg} px-6 py-4 flex items-center justify-between text-white`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              {renderIcon()}
            </div>
            <div>
              <p className="font-bold text-sm tracking-wide leading-tight">{title}</p>
              <p className="text-[11px] text-white/80">Konfirmasi Tindakan Transaksi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors rounded-lg p-1 hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          {description && (
            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              {description}
            </p>
          )}

          {/* Details Table */}
          {details.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl divide-y divide-slate-200/80 overflow-hidden text-xs">
              {details.map((item, idx) => (
                <div key={idx} className="px-4 py-2.5 flex items-center justify-between gap-4">
                  <span className="text-slate-500 font-medium">{item.label}</span>
                  <span
                    className={`font-semibold text-right ${
                      item.highlight ? "text-emerald-700 text-sm font-bold" : "text-slate-800"
                    }`}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-4 py-2.5 rounded-xl ${themeStyles.buttonBg} text-white font-bold text-xs shadow-md transition-all active:scale-[0.98]`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
