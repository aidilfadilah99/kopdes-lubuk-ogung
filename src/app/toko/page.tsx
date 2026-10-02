"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { DataStore } from "@/lib/store";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MartReceiptModal } from "@/components/MartReceiptModal";
import {
  Product,
  ProductCategory,
  CartItem,
  Member,
  PaymentMethod,
  SaleTransaction,
} from "@/types";
import { formatRupiah } from "@/lib/utils";
import {
  Store,
  ShoppingCart,
  Package,
  History,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Receipt,
  UserCheck,
  CreditCard,
  Banknote,
  Wallet,
  Clock,
  ArrowRight,
  Filter,
  Flame,
  Wheat,
  UtensilsCrossed,
  Sparkles,
  CupSoda,
  Home,
  Sprout,
  RefreshCw,
  Edit2,
  X,
} from "lucide-react";

const CATEGORIES: { key: ProductCategory | "ALL"; label: string; icon: any }[] = [
  { key: "ALL", label: "Semua Produk", icon: Store },
  { key: "SEMBAKO", label: "Sembako", icon: Wheat },
  { key: "DAPUR", label: "Dapur & Bumbu", icon: UtensilsCrossed },
  { key: "MANDI_CUCI", label: "Mandi & Cuci", icon: Sparkles },
  { key: "MINUMAN", label: "Minuman & Susu", icon: CupSoda },
  { key: "RUMAH_TANGGA", label: "Gas & Rumah Tangga", icon: Flame },
  { key: "PERTANIAN", label: "Pertanian & Sawit", icon: Sprout },
];

function TokoPageContent() {
  const { currentUser } = useAuth();
  const isStaff = currentUser && currentUser.role !== "ANGGOTA";

  const [activeTab, setActiveTab] = useState<"pos" | "inventory" | "sales">(
    isStaff ? "pos" : "inventory"
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  // Cart State (POS)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [buyerType, setBuyerType] = useState<"ANGGOTA" | "UMUM">("ANGGOTA");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("TUNAI");
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [transactionNotes, setTransactionNotes] = useState("");

  // Last Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState<SaleTransaction | null>(null);

  // Restock Modal State
  const [restockTarget, setRestockTarget] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);

  // Add/Edit Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    sku: "",
    name: "",
    category: "SEMBAKO",
    unit: "pcs",
    costPrice: 0,
    priceMember: 0,
    priceGeneral: 0,
    stock: 0,
    minStock: 5,
    isActive: true,
  });

  const refreshData = () => {
    setProducts(DataStore.getProducts());
    setSales(DataStore.getSales());
    setMembers(DataStore.getMembers());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener("kopdes-data-synced", refreshData);
    return () => window.removeEventListener("kopdes-data-synced", refreshData);
  }, []);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const selectedMember = useMemo(() => {
    return members.find((m) => m.id === selectedMemberId);
  }, [members, selectedMemberId]);

  // Set default member if current user is ANGGOTA
  useEffect(() => {
    if (currentUser?.role === "ANGGOTA") {
      setBuyerType("ANGGOTA");
      if (currentUser.memberId) {
        setSelectedMemberId(currentUser.memberId);
      }
    }
  }, [currentUser]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isActive) return false;
      const matchCategory =
        selectedCategory === "ALL" || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery));
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart Calculations
  const cartSummary = useMemo(() => {
    let totalItems = 0;
    let totalAmount = 0;
    let totalCost = 0;
    let totalDiscount = 0;

    cart.forEach((item) => {
      totalItems += item.qty;
      const unitPrice =
        buyerType === "ANGGOTA"
          ? item.product.priceMember
          : item.product.priceGeneral;
      const regularPrice = item.product.priceGeneral;
      totalAmount += unitPrice * item.qty;
      totalCost += item.product.costPrice * item.qty;
      totalDiscount += (regularPrice - unitPrice) * item.qty;
    });

    const change = Math.max(0, cashGiven - totalAmount);
    return { totalItems, totalAmount, totalCost, totalDiscount, change };
  }, [cart, buyerType, cashGiven]);

  // POS Cart Handlers
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      notify(`Stok ${product.name} sedang habis!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      const unitPrice =
        buyerType === "ANGGOTA" ? product.priceMember : product.priceGeneral;

      if (existing) {
        if (existing.qty >= product.stock) {
          notify(`Jumlah melebihi stok yang tersedia (${product.stock} ${product.unit})!`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                qty: item.qty + 1,
                pricePerUnit: unitPrice,
                subtotal: (item.qty + 1) * unitPrice,
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            product,
            qty: 1,
            pricePerUnit: unitPrice,
            subtotal: unitPrice,
          },
        ];
      }
    });
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const newQty = item.qty + delta;
          if (newQty <= 0) return null;
          if (newQty > item.product.stock) {
            notify(`Maksimal stok tersedia adalah ${item.product.stock}!`);
            return item;
          }
          const unitPrice =
            buyerType === "ANGGOTA"
              ? item.product.priceMember
              : item.product.priceGeneral;
          return {
            ...item,
            qty: newQty,
            subtotal: newQty * unitPrice,
          };
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setCashGiven(0);
  };

  // Submit Transaction
  const handleCheckout = () => {
    if (cart.length === 0) {
      notify("Keranjang belanja masih kosong!");
      return;
    }

    if (buyerType === "ANGGOTA" && !selectedMemberId) {
      notify("Silakan pilih Anggota Koperasi terlebih dahulu!");
      return;
    }

    if (paymentMethod === "TUNAI" && cashGiven < cartSummary.totalAmount) {
      notify(`Uang tunai kurang ${formatRupiah(cartSummary.totalAmount - cashGiven)}!`);
      return;
    }

    if (paymentMethod === "POTONG_SIMPANAN") {
      if (!selectedMember) {
        notify("Pilih data anggota untuk pembayaran potong simpanan!");
        return;
      }
      if (selectedMember.savingsTotal < cartSummary.totalAmount) {
        notify(
          `Saldo simpanan ${selectedMember.name} (${formatRupiah(
            selectedMember.savingsTotal
          )}) tidak mencukupi untuk belanja ${formatRupiah(cartSummary.totalAmount)}!`
        );
        return;
      }
    }

    const now = new Date();
    const dateStr = now.toISOString();
    const dateFormatted = now.toISOString().slice(0, 10).replace(/-/g, "");
    const invoiceNo = `INV-KOP-${dateFormatted}-${Math.floor(100 + Math.random() * 900)}`;

    const saleRecord: SaleTransaction = {
      id: `sale-${Date.now()}`,
      invoiceNo,
      date: dateStr,
      buyerType,
      memberId: buyerType === "ANGGOTA" ? selectedMember?.id : undefined,
      memberName: buyerType === "ANGGOTA" ? selectedMember?.name : undefined,
      memberNik: buyerType === "ANGGOTA" ? selectedMember?.nik : undefined,
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        sku: item.product.sku,
        qty: item.qty,
        unit: item.product.unit,
        costPrice: item.product.costPrice,
        pricePerUnit:
          buyerType === "ANGGOTA"
            ? item.product.priceMember
            : item.product.priceGeneral,
        subtotal: item.subtotal,
      })),
      totalItems: cartSummary.totalItems,
      totalCost: cartSummary.totalCost,
      totalAmount: cartSummary.totalAmount,
      totalDiscount: cartSummary.totalDiscount,
      cashierName: currentUser?.name || "Petugas Kasir",
      cashierRole: currentUser?.role || "BENDAHARA",
      paymentMethod,
      amountPaid: paymentMethod === "TUNAI" ? cashGiven : cartSummary.totalAmount,
      changeAmount: paymentMethod === "TUNAI" ? cartSummary.change : 0,
      notes: transactionNotes,
    };

    DataStore.recordSale(saleRecord);
    refreshData();
    setActiveReceipt(saleRecord);
    setCart([]);
    setCashGiven(0);
    setTransactionNotes("");
    notify(`Transaksi ${invoiceNo} berhasil disimpan!`);
  };

  // Restock Handler
  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockTarget || restockQty <= 0) return;

    DataStore.restockProduct(restockTarget.id, restockQty);
    refreshData();
    notify(`Stok ${restockTarget.name} bertambah +${restockQty} ${restockTarget.unit}!`);
    setRestockTarget(null);
  };

  // Add / Edit Product Submit
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.sku) {
      notify("Nama produk dan SKU wajib diisi!");
      return;
    }

    const newProd: Product = {
      id: editingProduct?.id || `prd-${Date.now()}`,
      sku: productForm.sku || `SKU-${Date.now()}`,
      name: productForm.name || "",
      category: (productForm.category as ProductCategory) || "SEMBAKO",
      unit: productForm.unit || "pcs",
      costPrice: Number(productForm.costPrice) || 0,
      priceMember: Number(productForm.priceMember) || 0,
      priceGeneral: Number(productForm.priceGeneral) || 0,
      stock: Number(productForm.stock) || 0,
      minStock: Number(productForm.minStock) || 5,
      barcode: productForm.barcode,
      isActive: productForm.isActive !== false,
    };

    DataStore.saveProduct(newProd);
    refreshData();
    setIsProductModalOpen(false);
    setEditingProduct(null);
    notify(`Produk ${newProd.name} berhasil disimpan!`);
  };

  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      sku: `BRG-${Math.floor(100 + Math.random() * 900)}`,
      name: "",
      category: "SEMBAKO",
      unit: "pcs",
      costPrice: 0,
      priceMember: 0,
      priceGeneral: 0,
      stock: 20,
      minStock: 5,
      isActive: true,
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setProductForm(product);
    setIsProductModalOpen(true);
  };

  // Sales Summary
  const salesMetrics = useMemo(() => {
    const totalOmset = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalCost = sales.reduce((sum, s) => sum + s.totalCost, 0);
    const totalLaba = totalOmset - totalCost;
    const totalMemberSales = sales
      .filter((s) => s.buyerType === "ANGGOTA")
      .reduce((sum, s) => sum + s.totalAmount, 0);
    return { totalOmset, totalLaba, totalMemberSales, totalCount: sales.length };
  }, [sales]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-top-4">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-sm font-medium">{notification}</p>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm border border-emerald-400/20">
              <Store className="w-3.5 h-3.5" />
              <span>Unit Usaha Toko Sembako & Kebutuhan Harian</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Kopdes Mart Lubuk Ogung 🛒
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Minimarket desa penyedia kebutuhan harian warga dan sembako berkualitas dengan harga khusus anggota koperasi. Belanja di Kopdes Mart memperkuat ekonomi desa dan menambah alokasi SHU anggota!
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center">
              <span className="text-xs text-slate-300 block">Total Omset Mart</span>
              <span className="text-lg font-black text-emerald-300">
                {formatRupiah(salesMetrics.totalOmset)}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center">
              <span className="text-xs text-slate-300 block">Laba Bersih Mart</span>
              <span className="text-lg font-black text-amber-300">
                {formatRupiah(salesMetrics.totalLaba)}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-8 flex flex-wrap gap-2 border-t border-white/10 pt-4">
          {isStaff && (
            <button
              onClick={() => setActiveTab("pos")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "pos"
                  ? "bg-white text-emerald-900 shadow-md font-bold"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Kasir Toko (POS)</span>
              {cart.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-emerald-600 text-white">
                  {cart.length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab("inventory")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "inventory"
                ? "bg-white text-emerald-900 shadow-md font-bold"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Katalog & Stok ({products.length})</span>
          </button>

          {isStaff && (
            <button
              onClick={() => setActiveTab("sales")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "sales"
                  ? "bg-white text-emerald-900 shadow-md font-bold"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <History className="w-4 h-4" />
              <span>Riwayat Penjualan ({sales.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: KASIR / POINT OF SALE (POS) */}
      {activeTab === "pos" && isStaff && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* SISI KIRI: Katalog Barang Kasir */}
          <div className="lg:col-span-7 space-y-4">
            {/* Search & Category Filter */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama barang, kode SKU, atau barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Category Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSel = selectedCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setSelectedCategory(cat.key)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                        isSel
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid Produk */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stock <= 0;
                const isLow = p.stock > 0 && p.stock <= p.minStock;
                const price =
                  buyerType === "ANGGOTA" ? p.priceMember : p.priceGeneral;

                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && handleAddToCart(p)}
                    className={`bg-white rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between relative group ${
                      isOutOfStock
                        ? "opacity-60 border-slate-200 cursor-not-allowed bg-slate-50"
                        : "border-slate-200 hover:border-emerald-500 hover:shadow-md cursor-pointer"
                    }`}
                  >
                    {/* Badge Stok */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[10px] font-mono text-slate-400">
                        {p.sku}
                      </span>
                      {isOutOfStock ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                          Habis
                        </span>
                      ) : isLow ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                          Sisa {p.stock}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                          Stok: {p.stock} {p.unit}
                        </span>
                      )}
                    </div>

                    {/* Info Produk */}
                    <div className="space-y-1 mb-3">
                      <h4 className="font-semibold text-slate-900 text-sm line-clamp-2 group-hover:text-emerald-700 transition-colors">
                        {p.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 capitalize">
                        Kemasan: {p.unit}
                      </p>
                    </div>

                    {/* Harga & Tombol Beli */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-emerald-700 block">
                          {formatRupiah(price)}
                        </span>
                        {buyerType === "ANGGOTA" && (
                          <span className="text-[10px] text-slate-400 line-through">
                            {formatRupiah(p.priceGeneral)}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SISI KANAN: Keranjang Kasir & Checkout */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Keranjang Kasir ({cart.length})
                </h3>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                >
                  Kosongkan
                </button>
              )}
            </div>

            {/* Pilihan Tipe Pembeli (Anggota / Umum) */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                Status Pembeli:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBuyerType("ANGGOTA")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    buyerType === "ANGGOTA"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Anggota (Diskon)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBuyerType("UMUM");
                    setSelectedMemberId("");
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    buyerType === "UMUM"
                      ? "bg-slate-800 text-white shadow-sm"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span>Warga Umum</span>
                </button>
              </div>

              {/* Selector Anggota */}
              {buyerType === "ANGGOTA" && (
                <div className="pt-2">
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Pilih Data Anggota:
                  </label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full text-xs font-medium py-2 px-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Cari Nama / NIK Anggota --</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.dusun}) — Saldo: {formatRupiah(m.savingsTotal)}
                      </option>
                    ))}
                  </select>

                  {selectedMember && (
                    <div className="mt-2 p-2 bg-emerald-50 rounded-xl text-[11px] text-emerald-800 flex justify-between items-center">
                      <span>Saldo Simpanan:</span>
                      <span className="font-bold">
                        {formatRupiah(selectedMember.savingsTotal)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* List Item Belanja */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <ShoppingCart className="w-10 h-10 mx-auto stroke-1 mb-2 text-slate-300" />
                  <p className="text-xs font-medium">Keranjang masih kosong</p>
                  <p className="text-[11px] text-slate-400">
                    Klik produk di sebelah kiri untuk menambahkan
                  </p>
                </div>
              ) : (
                cart.map((item) => {
                  const unitPrice =
                    buyerType === "ANGGOTA"
                      ? item.product.priceMember
                      : item.product.priceGeneral;

                  return (
                    <div
                      key={item.product.id}
                      className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 truncate">
                          {item.product.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {formatRupiah(unitPrice)} x {item.qty} {item.product.unit}
                        </p>
                      </div>

                      {/* Qty Controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleUpdateQty(item.product.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-bold text-slate-800">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => handleUpdateQty(item.product.id, 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right shrink-0 min-w-16">
                        <span className="font-bold text-slate-900 block">
                          {formatRupiah(item.subtotal)}
                        </span>
                        <button
                          onClick={() => handleRemoveFromCart(item.product.id)}
                          className="text-rose-500 hover:text-rose-700 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Metode Pembayaran */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 block">
                Metode Pembayaran:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("TUNAI")}
                  className={`p-2 rounded-xl font-medium border flex items-center gap-2 transition-colors ${
                    paymentMethod === "TUNAI"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-bold"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>Tunai (Cash)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("POTONG_SIMPANAN")}
                  disabled={buyerType !== "ANGGOTA" || !selectedMember}
                  className={`p-2 rounded-xl font-medium border flex items-center gap-2 transition-colors ${
                    paymentMethod === "POTONG_SIMPANAN"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-bold"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  } ${
                    buyerType !== "ANGGOTA" || !selectedMember
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <Wallet className="w-4 h-4 text-teal-600" />
                  <span>Potong Tabungan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("QRIS")}
                  className={`p-2 rounded-xl font-medium border flex items-center gap-2 transition-colors ${
                    paymentMethod === "QRIS"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-bold"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <span>QRIS Digital</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("KASBON_ANGGOTA")}
                  disabled={buyerType !== "ANGGOTA" || !selectedMember}
                  className={`p-2 rounded-xl font-medium border flex items-center gap-2 transition-colors ${
                    paymentMethod === "KASBON_ANGGOTA"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-bold"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  } ${
                    buyerType !== "ANGGOTA" || !selectedMember
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Kasbon Tempo</span>
                </button>
              </div>

              {/* Input Nominal Tunai Diterima */}
              {paymentMethod === "TUNAI" && cart.length > 0 && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2 mt-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">Uang Diterima:</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setCashGiven(cartSummary.totalAmount)}
                        className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                      >
                        Uang Pas
                      </button>
                      <button
                        type="button"
                        onClick={() => setCashGiven(50000)}
                        className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                      >
                        50rb
                      </button>
                      <button
                        type="button"
                        onClick={() => setCashGiven(100000)}
                        className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                      >
                        100rb
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    value={cashGiven || ""}
                    onChange={(e) => setCashGiven(Number(e.target.value))}
                    placeholder="Masukkan nominal uang tunai..."
                    className="w-full font-mono text-sm font-bold py-2 px-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                  {cashGiven > 0 && (
                    <div className="flex justify-between text-xs pt-1">
                      <span className="text-slate-500">Kembalian:</span>
                      <span
                        className={`font-mono font-bold ${
                          cashGiven >= cartSummary.totalAmount
                            ? "text-emerald-700"
                            : "text-rose-600"
                        }`}
                      >
                        {formatRupiah(cartSummary.change)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Total Belanja & Diskon */}
            <div className="pt-2 border-t border-slate-200 space-y-1.5">
              {cartSummary.totalDiscount > 0 && (
                <div className="flex justify-between text-xs text-emerald-700 bg-emerald-50 p-2 rounded-xl font-medium">
                  <span>Hemat Diskon Anggota:</span>
                  <span className="font-bold">
                    - {formatRupiah(cartSummary.totalDiscount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-xs font-bold text-slate-500 uppercase">
                  Total Tagihan
                </span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {formatRupiah(cartSummary.totalAmount)}
                </span>
              </div>
            </div>

            {/* Tombol Bayar */}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Selesaikan Belanja & Cetak Struk</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: KATALOG & MANAJEMEN STOK (INVENTORY) */}
      {activeTab === "inventory" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari barang atau SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) =>
                  setSelectedCategory(e.target.value as ProductCategory | "ALL")
                }
                className="py-2 px-3 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {isStaff && (
              <button
                onClick={openAddProductModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Produk Baru</span>
              </button>
            )}
          </div>

          {/* Tabel Katalog Produk */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">SKU / Kode</th>
                    <th className="py-3 px-4">Nama Produk</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Kemasan</th>
                    {isStaff && <th className="py-3 px-4">Harga Beli (HPP)</th>}
                    <th className="py-3 px-4 text-emerald-700">Harga Anggota</th>
                    <th className="py-3 px-4">Harga Umum</th>
                    <th className="py-3 px-4 text-center">Stok</th>
                    {isStaff && <th className="py-3 px-4 text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredProducts.map((p) => {
                    const isOutOfStock = p.stock <= 0;
                    const isLow = p.stock > 0 && p.stock <= p.minStock;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-600">
                          {p.sku}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {p.name}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{p.unit}</td>
                        {isStaff && (
                          <td className="py-3 px-4 font-mono text-slate-500">
                            {formatRupiah(p.costPrice)}
                          </td>
                        )}
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700 bg-emerald-50/40">
                          {formatRupiah(p.priceMember)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {formatRupiah(p.priceGeneral)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isOutOfStock ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                              Habis (0)
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                              Kritis ({p.stock})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              {p.stock}
                            </span>
                          )}
                        </td>
                        {isStaff && (
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setRestockTarget(p);
                                setRestockQty(10);
                              }}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold text-[11px] transition-colors"
                              title="Tambah Stok Kulakan"
                            >
                              + Stok
                            </button>
                            <button
                              onClick={() => openEditProductModal(p)}
                              className="p-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Edit Produk"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RIWAYAT PENJUALAN & LABA MART */}
      {activeTab === "sales" && isStaff && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 block">Total Transaksi</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {salesMetrics.totalCount}
              </span>
              <span className="text-[11px] text-slate-400">Nota penjualan keluar</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 block">Total Omset Penjualan</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">
                {formatRupiah(salesMetrics.totalOmset)}
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">
                Penerimaan kas kotor mart
              </span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 block">Total Laba Bersih Mart</span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">
                {formatRupiah(salesMetrics.totalLaba)}
              </span>
              <span className="text-[11px] text-amber-700 font-medium">
                Masuk ke SHU Koperasi Desa
              </span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 block">Belanja Oleh Anggota</span>
              <span className="text-2xl font-black text-indigo-600 mt-1 block">
                {formatRupiah(salesMetrics.totalMemberSales)}
              </span>
              <span className="text-[11px] text-indigo-700 font-medium">
                Dihitung untuk SHU Belanja
              </span>
            </div>
          </div>

          {/* Tabel Riwayat Penjualan */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">No. Bukti</th>
                    <th className="py-3 px-4">Tanggal & Waktu</th>
                    <th className="py-3 px-4">Pembeli</th>
                    <th className="py-3 px-4">Item Belanja</th>
                    <th className="py-3 px-4">Metode Bayar</th>
                    <th className="py-3 px-4">Kasir</th>
                    <th className="py-3 px-4 text-right">Total Transaksi</th>
                    <th className="py-3 px-4 text-center">Struk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {sales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {s.invoiceNo}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(s.date).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="py-3 px-4">
                        {s.buyerType === "ANGGOTA" ? (
                          <span className="font-bold text-emerald-800">
                            {s.memberName} (Anggota)
                          </span>
                        ) : (
                          <span className="text-slate-600">Warga Umum</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {s.totalItems} item ({s.items.map((i) => i.productName).slice(0, 2).join(", ")}
                        {s.items.length > 2 && "..."})
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {s.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{s.cashierName}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 text-right">
                        {formatRupiah(s.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setActiveReceipt(s)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] transition-colors"
                        >
                          Lihat Struk
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Restock Produk */}
      {restockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base">
                Restock Produk Kulakan
              </h3>
              <button
                onClick={() => setRestockTarget(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-xs">
              <p className="font-bold text-slate-800">{restockTarget.name}</p>
              <p className="text-slate-500">
                Stok saat ini: {restockTarget.stock} {restockTarget.unit}
              </p>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Jumlah Tambahan Stok ({restockTarget.unit}):
                </label>
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  className="w-full text-sm font-bold py-2 px-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRestockTarget(null)}
                  className="flex-1 py-2 px-4 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                >
                  Tambah Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Produk */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingProduct ? "Edit Informasi Produk" : "Tambah Produk Baru Kopdes Mart"}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Kode SKU
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.sku}
                    onChange={(e) =>
                      setProductForm({ ...productForm, sku: e.target.value })
                    }
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Kategori
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        category: e.target.value as ProductCategory,
                      })
                    }
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="SEMBAKO">Sembako</option>
                    <option value="DAPUR">Dapur & Bumbu</option>
                    <option value="MANDI_CUCI">Mandi & Cuci</option>
                    <option value="MINUMAN">Minuman & Susu</option>
                    <option value="RUMAH_TANGGA">Gas & Rumah Tangga</option>
                    <option value="PERTANIAN">Pertanian & Sawit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Nama Barang / Produk
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beras Ramos Pelalawan 5kg"
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Satuan Kemasan
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="kg / pcs / dus"
                    value={productForm.unit}
                    onChange={(e) =>
                      setProductForm({ ...productForm, unit: e.target.value })
                    }
                    className="w-full py-2 px-3 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Stok Awal
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.stock}
                    onChange={(e) =>
                      setProductForm({ ...productForm, stock: Number(e.target.value) })
                    }
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Minimal Stok
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={productForm.minStock}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        minStock: Number(e.target.value),
                      })
                    }
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Harga Beli / HPP
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.costPrice}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        costPrice: Number(e.target.value),
                      })
                    }
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-emerald-700 block mb-1">
                    Harga Anggota (Diskon)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.priceMember}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        priceMember: Number(e.target.value),
                      })
                    }
                    className="w-full py-2 px-3 rounded-xl border border-emerald-300 font-mono font-bold text-emerald-800 bg-emerald-50/50"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Harga Umum
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.priceGeneral}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        priceGeneral: Number(e.target.value),
                      })
                    }
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-md"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Struk Belanja Mini-Market */}
      <MartReceiptModal
        sale={activeReceipt}
        onClose={() => setActiveReceipt(null)}
      />
    </div>
  );
}

export default function TokoPage() {
  return (
    <ProtectedRoute allowedRoles={["MASTER", "MANAGER", "ADMIN", "BENDAHARA", "ANGGOTA"]}>
      <TokoPageContent />
    </ProtectedRoute>
  );
}
