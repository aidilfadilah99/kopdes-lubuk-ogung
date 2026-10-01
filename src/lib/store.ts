"use client";

import {
  AuditLog,
  CooperativeConfig,
  Loan,
  LoanInstallment,
  Member,
  SavingsTransaction,
  User,
  UserRole,
} from "@/types";
import {
  initialAuditLogs,
  initialConfig,
  initialInstallments,
  initialLoans,
  initialMembers,
  initialSavings,
  initialUsers,
} from "./mock-data";

const STORAGE_KEYS = {
  USERS: "kopdes_users_v2",
  MEMBERS: "kopdes_members_v2",
  SAVINGS: "kopdes_savings_v2",
  LOANS: "kopdes_loans_v2",
  INSTALLMENTS: "kopdes_installments_v2",
  CONFIG: "kopdes_config_v2",
  LOGS: "kopdes_logs_v2",
};

function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

export const DataStore = {
  // CONFIG
  getConfig(): CooperativeConfig {
    return getFromStorage(STORAGE_KEYS.CONFIG, initialConfig);
  },
  updateConfig(newConfig: Partial<CooperativeConfig>): CooperativeConfig {
    const current = this.getConfig();
    const updated = { ...current, ...newConfig };
    setToStorage(STORAGE_KEYS.CONFIG, updated);
    return updated;
  },

  // USERS
  getUsers(): User[] {
    return getFromStorage(STORAGE_KEYS.USERS, initialUsers);
  },
  saveUser(user: User): void {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.unshift(user);
    }
    setToStorage(STORAGE_KEYS.USERS, users);
  },
  deleteUser(userId: string): void {
    const users = this.getUsers().filter((u) => u.id !== userId);
    setToStorage(STORAGE_KEYS.USERS, users);
  },

  // MEMBERS
  getMembers(): Member[] {
    return getFromStorage(STORAGE_KEYS.MEMBERS, initialMembers);
  },
  saveMember(member: Member): void {
    const members = this.getMembers();
    const idx = members.findIndex((m) => m.id === member.id);
    if (idx >= 0) {
      members[idx] = member;
    } else {
      members.unshift(member);
    }
    setToStorage(STORAGE_KEYS.MEMBERS, members);
  },

  // SAVINGS
  getSavings(): SavingsTransaction[] {
    return getFromStorage(STORAGE_KEYS.SAVINGS, initialSavings);
  },
  addSavings(trx: SavingsTransaction): void {
    const list = this.getSavings();
    list.unshift(trx);
    setToStorage(STORAGE_KEYS.SAVINGS, list);

    // Update member total savings
    const members = this.getMembers();
    const member = members.find((m) => m.id === trx.memberId);
    if (member) {
      member.savingsTotal += trx.amount;
      if (trx.type === "POKOK") member.simpananPokokPaid = true;
      setToStorage(STORAGE_KEYS.MEMBERS, members);
    }
  },

  // LOANS
  getLoans(): Loan[] {
    return getFromStorage(STORAGE_KEYS.LOANS, initialLoans);
  },
  createLoan(loan: Loan): void {
    const list = this.getLoans();
    list.unshift(loan);
    setToStorage(STORAGE_KEYS.LOANS, list);
  },
  updateLoanStatus(
    loanId: string,
    status: Loan["status"],
    actorName: string,
    note?: string
  ): Loan | null {
    const list = this.getLoans();
    const loan = list.find((l) => l.id === loanId);
    if (!loan) return null;

    loan.status = status;
    const now = new Date().toISOString().split("T")[0];

    if (status === "PENDING_MASTER") {
      loan.adminReviewer = actorName;
    } else if (status === "APPROVED") {
      loan.masterApprover = actorName;
      loan.approvalDate = now;
    } else if (status === "DISBURSED") {
      loan.disbursementDate = now;
      // generate installment schedule
      this.generateInstallmentSchedule(loan);
    } else if (status === "REJECTED") {
      loan.rejectionReason = note || "Ditolak oleh pengurus";
    }

    setToStorage(STORAGE_KEYS.LOANS, list);
    return loan;
  },

  // INSTALLMENTS
  getInstallments(): LoanInstallment[] {
    return getFromStorage(STORAGE_KEYS.INSTALLMENTS, initialInstallments);
  },
  generateInstallmentSchedule(loan: Loan): void {
    const installments = this.getInstallments();
    const principalPerMonth = Math.round(loan.amount / loan.tenorMonths);
    const interestPerMonth = Math.round(
      (loan.amount * (loan.interestRatePercent / 100))
    );
    const totalPerMonth = principalPerMonth + interestPerMonth;

    const startDate = new Date();
    for (let i = 1; i <= loan.tenorMonths; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      const ins: LoanInstallment = {
        id: `ins-${loan.id}-${i}`,
        loanId: loan.id,
        memberId: loan.memberId,
        memberName: loan.memberName,
        installmentNo: i,
        amount: totalPerMonth,
        principalAmount: principalPerMonth,
        interestAmount: interestPerMonth,
        dueDate: dueDate.toISOString().split("T")[0],
        status: "PENDING",
      };
      installments.push(ins);
    }
    setToStorage(STORAGE_KEYS.INSTALLMENTS, installments);
  },
  payInstallment(installmentId: string, officerName: string): LoanInstallment | null {
    const list = this.getInstallments();
    const ins = list.find((i) => i.id === installmentId);
    if (!ins) return null;

    ins.status = "PAID";
    ins.paymentDate = new Date().toISOString().split("T")[0];
    ins.officerName = officerName;
    setToStorage(STORAGE_KEYS.INSTALLMENTS, list);

    // Update remaining loan amount
    const loans = this.getLoans();
    const loan = loans.find((l) => l.id === ins.loanId);
    if (loan) {
      loan.remainingAmount = Math.max(0, loan.remainingAmount - ins.amount);
      if (loan.remainingAmount <= 0) {
        loan.status = "PAID_OFF";
      }
      setToStorage(STORAGE_KEYS.LOANS, loans);
    }

    return ins;
  },

  // AUDIT LOGS
  getAuditLogs(): AuditLog[] {
    return getFromStorage(STORAGE_KEYS.LOGS, initialAuditLogs);
  },
  addAuditLog(
    action: string,
    details: string,
    user: { id: string; name: string; role: UserRole }
  ): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      details,
    };
    logs.unshift(newLog);
    setToStorage(STORAGE_KEYS.LOGS, logs.slice(0, 100)); // Simpan 100 log terakhir
  },

  // RESET
  resetAll(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.MEMBERS);
    localStorage.removeItem(STORAGE_KEYS.SAVINGS);
    localStorage.removeItem(STORAGE_KEYS.LOANS);
    localStorage.removeItem(STORAGE_KEYS.INSTALLMENTS);
    localStorage.removeItem(STORAGE_KEYS.CONFIG);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
  },
};
