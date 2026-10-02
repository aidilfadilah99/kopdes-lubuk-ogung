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
  Product,
  SaleTransaction,
} from "@/types";
import {
  initialAuditLogs,
  initialConfig,
  initialInstallments,
  initialLoans,
  initialMembers,
  initialSavings,
  initialUsers,
  initialProducts,
  initialSales,
} from "./mock-data";

const STORAGE_KEYS = {
  USERS: "kopdes_users_v3",
  MEMBERS: "kopdes_members_v3",
  SAVINGS: "kopdes_savings_v3",
  LOANS: "kopdes_loans_v3",
  INSTALLMENTS: "kopdes_installments_v3",
  CONFIG: "kopdes_config_v3",
  LOGS: "kopdes_logs_v3",
  PRODUCTS: "kopdes_products_v3",
  SALES: "kopdes_sales_v3",
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

// Background sync to Neon Cloud Postgres
async function pushToCloud(key: string, value: any): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    }).catch((err) => {
      console.warn(`[Cloud DB] Background sync error for ${key}:`, err);
    });
  } catch (err) {
    console.warn(`[Cloud DB] Push failed:`, err);
  }
}

export const DataStore = {
  // SINKRONISASI CLOUD DATABASE
  async syncWithCloud(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    try {
      const res = await fetch("/api/db", { cache: "no-store" });
      if (!res.ok) return false;
      const json = await res.json();
      if (json.success && json.isCloud && json.data) {
        const { config, users, members, savings, loans, installments, audit_logs, products, sales } = json.data;
        if (config) setToStorage(STORAGE_KEYS.CONFIG, config);
        if (users) setToStorage(STORAGE_KEYS.USERS, users);
        if (members) setToStorage(STORAGE_KEYS.MEMBERS, members);
        if (savings) setToStorage(STORAGE_KEYS.SAVINGS, savings);
        if (loans) setToStorage(STORAGE_KEYS.LOANS, loans);
        if (installments) setToStorage(STORAGE_KEYS.INSTALLMENTS, installments);
        if (audit_logs) setToStorage(STORAGE_KEYS.LOGS, audit_logs);
        if (products) setToStorage(STORAGE_KEYS.PRODUCTS, products);
        if (sales) setToStorage(STORAGE_KEYS.SALES, sales);

        // Beritahu komponen UI bahwa data cloud terbaru sudah dimuat
        window.dispatchEvent(new Event("kopdes-data-synced"));
        return true;
      }
      return false;
    } catch (e) {
      console.warn("[Cloud DB] Sync error:", e);
      return false;
    }
  },

  // Mengambil daftar user terbaru langsung dari cloud (misal saat login di device baru)
  async fetchFreshUsers(): Promise<User[]> {
    if (typeof window === "undefined") return this.getUsers();
    try {
      const res = await fetch("/api/db?key=users", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setToStorage(STORAGE_KEYS.USERS, json.data);
          return json.data;
        }
      }
    } catch (e) {
      console.warn("[Cloud DB] Fetch fresh users error:", e);
    }
    return this.getUsers();
  },

  // CONFIG
  getConfig(): CooperativeConfig {
    return getFromStorage(STORAGE_KEYS.CONFIG, initialConfig);
  },
  updateConfig(newConfig: Partial<CooperativeConfig>): CooperativeConfig {
    const current = this.getConfig();
    const updated = { ...current, ...newConfig };
    setToStorage(STORAGE_KEYS.CONFIG, updated);
    pushToCloud("config", updated);
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
    pushToCloud("users", users);
  },
  deleteUser(userId: string): void {
    const users = this.getUsers().filter((u) => u.id !== userId);
    setToStorage(STORAGE_KEYS.USERS, users);
    pushToCloud("users", users);
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
    pushToCloud("members", members);
  },

  // SAVINGS
  getSavings(): SavingsTransaction[] {
    return getFromStorage(STORAGE_KEYS.SAVINGS, initialSavings);
  },
  addSavings(trx: SavingsTransaction): void {
    const list = this.getSavings();
    list.unshift(trx);
    setToStorage(STORAGE_KEYS.SAVINGS, list);
    pushToCloud("savings", list);

    // Update member total savings
    const members = this.getMembers();
    const member = members.find((m) => m.id === trx.memberId);
    if (member) {
      member.savingsTotal += trx.amount;
      if (trx.type === "POKOK") member.simpananPokokPaid = true;
      setToStorage(STORAGE_KEYS.MEMBERS, members);
      pushToCloud("members", members);
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
    pushToCloud("loans", list);
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
      loan.rejectionReason = note || "Ditolak oleh pengurus koperasi";
      loan.rejectedBy = actorName;
      loan.rejectionDate = now;
      loan.remainingAmount = 0;
    }

    setToStorage(STORAGE_KEYS.LOANS, list);
    pushToCloud("loans", list);
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
    pushToCloud("installments", installments);
  },
  payInstallment(installmentId: string, officerName: string): LoanInstallment | null {
    const list = this.getInstallments();
    const ins = list.find((i) => i.id === installmentId);
    if (!ins) return null;

    ins.status = "PAID";
    ins.paymentDate = new Date().toISOString().split("T")[0];
    ins.officerName = officerName;
    setToStorage(STORAGE_KEYS.INSTALLMENTS, list);
    pushToCloud("installments", list);

    // Update remaining loan amount
    const loans = this.getLoans();
    const loan = loans.find((l) => l.id === ins.loanId);
    if (loan) {
      loan.remainingAmount = Math.max(0, loan.remainingAmount - ins.amount);
      if (loan.remainingAmount <= 0) {
        loan.status = "PAID_OFF";
      }
      setToStorage(STORAGE_KEYS.LOANS, loans);
      pushToCloud("loans", loans);
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
    const trimmed = logs.slice(0, 100);
    setToStorage(STORAGE_KEYS.LOGS, trimmed);
    pushToCloud("audit_logs", trimmed);
  },

  // PRODUCTS / TOKO KOPDES MART
  getProducts(): Product[] {
    return getFromStorage(STORAGE_KEYS.PRODUCTS, initialProducts);
  },
  saveProduct(product: Product): void {
    const list = this.getProducts();
    const idx = list.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      list[idx] = product;
    } else {
      list.unshift(product);
    }
    setToStorage(STORAGE_KEYS.PRODUCTS, list);
    pushToCloud("products", list);
  },
  deleteProduct(productId: string): void {
    const list = this.getProducts().filter((p) => p.id !== productId);
    setToStorage(STORAGE_KEYS.PRODUCTS, list);
    pushToCloud("products", list);
  },
  restockProduct(productId: string, addQty: number): Product | null {
    const list = this.getProducts();
    const prd = list.find((p) => p.id === productId);
    if (!prd) return null;
    prd.stock += addQty;
    setToStorage(STORAGE_KEYS.PRODUCTS, list);
    pushToCloud("products", list);
    return prd;
  },

  // SALES / TRANSAKSI PENJUALAN
  getSales(): SaleTransaction[] {
    return getFromStorage(STORAGE_KEYS.SALES, initialSales);
  },
  recordSale(sale: SaleTransaction): void {
    const sales = this.getSales();
    sales.unshift(sale);
    setToStorage(STORAGE_KEYS.SALES, sales);
    pushToCloud("sales", sales);

    // Otomatis kurangi stok produk yang terjual
    const products = this.getProducts();
    for (const item of sale.items) {
      const p = products.find((prod) => prod.id === item.productId);
      if (p) {
        p.stock = Math.max(0, p.stock - item.qty);
      }
    }
    setToStorage(STORAGE_KEYS.PRODUCTS, products);
    pushToCloud("products", products);

    // Jika metode pembayaran 'POTONG_SIMPANAN', otomatis potong saldo tabungan anggota
    if (sale.paymentMethod === "POTONG_SIMPANAN" && sale.memberId) {
      const members = this.getMembers();
      const mem = members.find((m) => m.id === sale.memberId);
      if (mem) {
        mem.savingsTotal = Math.max(0, mem.savingsTotal - sale.totalAmount);
        setToStorage(STORAGE_KEYS.MEMBERS, members);
        pushToCloud("members", members);

        // Catat transaksi mutasi tabungan
        const savingsList = this.getSavings();
        const trx: SavingsTransaction = {
          id: `trx-mart-${Date.now()}`,
          memberId: mem.id,
          memberName: mem.name,
          memberNik: mem.nik,
          type: "SUKARELA",
          amount: -sale.totalAmount,
          date: sale.date.split("T")[0],
          notes: `Belanja Kopdes Mart (${sale.invoiceNo})`,
          officerName: sale.cashierName,
          status: "SUCCESS",
        };
        savingsList.unshift(trx);
        setToStorage(STORAGE_KEYS.SAVINGS, savingsList);
        pushToCloud("savings", savingsList);
      }
    }

    // Catat ke Audit Log
    this.addAuditLog(
      "TRANSAKSI_MART",
      `Penjualan ${sale.invoiceNo} Rp ${sale.totalAmount.toLocaleString("id-ID")} (${sale.buyerType === "ANGGOTA" ? sale.memberName : "Umum"}) - ${sale.paymentMethod}`,
      { id: "usr-cashier", name: sale.cashierName, role: sale.cashierRole }
    );
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
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.SALES);
  },
};
