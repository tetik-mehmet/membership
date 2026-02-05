"use client";

import { useState, Fragment, useMemo } from "react";
import {
  Pencil,
  Trash2,
  Zap,
  Droplets,
  Wallet,
  ChevronDown,
  ChevronUp,
  Calendar,
  ChevronsDownUp,
  ChevronsUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  isWithinInterval,
} from "date-fns";
import { tr } from "date-fns/locale";
import EditExpenseDialog from "@/components/dashboard/EditExpenseDialog";
import ExpenseByCategoryChart from "@/components/dashboard/ExpenseByCategoryChart";

const CATEGORY_LABELS = {
  electricity: "Elektrik Faturası",
  water: "Su Faturası",
  extra: "Ekstra Masraflar",
};

const CATEGORY_ICONS = {
  electricity: Zap,
  water: Droplets,
  extra: Wallet,
};

function getMonthKey(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "yyyy-MM");
}

export default function ExpenseTable({ initialExpenses }) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [loading, setLoading] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Ay bazlı gruplama: key = "yyyy-MM", en yeni ay üstte
  const groupedByMonth = useMemo(() => {
    const map = {};
    for (const e of expenses) {
      const key = getMonthKey(e.date);
      if (!map[key]) map[key] = { items: [], total: 0 };
      map[key].items.push(e);
      map[key].total += e.amount || 0;
    }
    // İçerideki harcamaları tarih azalan sırada tut
    Object.keys(map).forEach((k) => {
      map[k].items.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    });
    const sortedKeys = Object.keys(map).sort((a, b) => b.localeCompare(a));
    return sortedKeys.map((key) => ({
      key,
      label: format(new Date(key + "-01"), "MMMM yyyy", { locale: tr }),
      ...map[key],
    }));
  }, [expenses]);

  // Varsayılan: tüm aylar açık (ilk mount'ta groupedByMonth ile senkronize etmek için)
  const [expandedMonths, setExpandedMonths] = useState({});
  const expandedMonthsResolved = useMemo(() => {
    const base = { ...expandedMonths };
    groupedByMonth.forEach(({ key }) => {
      if (base[key] === undefined) base[key] = true;
    });
    return base;
  }, [expandedMonths, groupedByMonth]);

  const toggleMonth = (monthKey) => {
    setExpandedMonths((prev) => ({ ...prev, [monthKey]: !prev[monthKey] }));
  };

  const expandAllMonths = () => {
    const allExpanded = groupedByMonth.reduce((acc, { key }) => {
      acc[key] = true;
      return acc;
    }, {});
    setExpandedMonths(allExpanded);
  };

  const collapseAllMonths = () => {
    const allCollapsed = groupedByMonth.reduce((acc, { key }) => {
      acc[key] = false;
      return acc;
    }, {});
    setExpandedMonths(allCollapsed);
  };

  const handleDelete = async (expenseId) => {
    if (!confirm("Bu harcamayı silmek istediğinizden emin misiniz?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setExpenses(expenses.filter((e) => e._id !== expenseId));
        toast.success("Harcama silindi", {
          description: "Harcama kaydı başarıyla kaldırıldı.",
        });
      } else {
        toast.error("Harcama silinemedi", {
          description: data.error || "Lütfen tekrar deneyin.",
        });
      }
    } catch (error) {
      toast.error("Bir hata oluştu", { description: "Lütfen tekrar deneyin." });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (expense) => {
    setEditExpense(expense);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = (updated) => {
    setExpenses(expenses.map((e) => (e._id === updated._id ? updated : e)));
  };

  const now = new Date();
  const currentMonthKey = format(now, "yyyy-MM");
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));

  const currentMonthTotal = expenses
    .filter((e) => {
      const d = new Date(e.date);
      return isWithinInterval(d, {
        start: currentMonthStart,
        end: currentMonthEnd,
      });
    })
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const prevMonthTotal = expenses
    .filter((e) => {
      const d = new Date(e.date);
      return isWithinInterval(d, { start: prevMonthStart, end: prevMonthEnd });
    })
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const diff = currentMonthTotal - prevMonthTotal;
  const prevMonthName = format(subMonths(now, 1), "MMMM", { locale: tr });

  // Tüm ayların toplam gideri
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  if (expenses.length === 0) {
    return (
      <div className="space-y-4">
        <EditExpenseDialog
          expense={editExpense}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={handleEditSuccess}
        />
        <div className="text-center py-12">
          <p className="text-muted-foreground">Henüz harcama eklenmemiş</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <EditExpenseDialog
        expense={editExpense}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
      />

      {/* Kategori dağılımı grafiği */}
      <div className="border rounded-lg p-4 bg-muted/20">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Kategori Dağılımı
        </h3>
        <ExpenseByCategoryChart expenses={expenses} />
      </div>

      {/* Tümünü Aç/Kapat butonları */}
      {groupedByMonth.length > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={expandAllMonths}
            className="text-xs"
          >
            <ChevronsDownUp className="h-3.5 w-3.5 mr-1.5" />
            Tümünü Aç
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={collapseAllMonths}
            className="text-xs"
          >
            <ChevronsUpDown className="h-3.5 w-3.5 mr-1.5" />
            Tümünü Kapat
          </Button>
        </div>
      )}

      {/* Masaüstü: tablo görünümü */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kategori</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedByMonth.map(({ key, label, items, total }) => {
                const isExpanded = expandedMonthsResolved[key] !== false;
                return (
                  <Fragment key={key}>
                    <TableRow
                      className="bg-muted/20 hover:bg-muted/30 cursor-pointer"
                      onClick={() => toggleMonth(key)}
                    >
                      <TableCell className="font-medium" colSpan={2}>
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                          {label}
                          {key === currentMonthKey && (
                            <Badge variant="secondary" className="text-xs">
                              Bu ay
                            </Badge>
                          )}
                          <span className="text-muted-foreground font-normal">
                            ({items.length} kalem)
                          </span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-destructive">
                          Toplam: {total.toLocaleString("tr-TR")} ₺
                        </span>
                      </TableCell>
                      <TableCell colSpan={1} />
                      <TableCell className="text-right w-10">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMonth(key);
                          }}
                          aria-label={isExpanded ? "Kapat" : "Aç"}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {isExpanded &&
                      items.map((expense) => {
                        const Icon = CATEGORY_ICONS[expense.category] || Wallet;
                        return (
                          <TableRow key={expense._id} className="bg-background">
                            <TableCell className="pl-10">
                              <span className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                                {CATEGORY_LABELS[expense.category] ||
                                  expense.category}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-destructive">
                                {expense.amount.toLocaleString("tr-TR")} ₺
                              </span>
                            </TableCell>
                            <TableCell>
                              {format(new Date(expense.date), "dd MMM yyyy", {
                                locale: tr,
                              })}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {expense.description || "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div
                                className="flex items-center justify-end gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditClick(expense)}
                                  disabled={loading}
                                  title="Düzenle"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(expense._id)}
                                  disabled={loading}
                                  title="Sil"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobil: kart/liste görünümü */}
      <div className="md:hidden space-y-4">
        {groupedByMonth.map(({ key, label, items, total }) => {
          const isExpanded = expandedMonthsResolved[key] !== false;
          return (
            <div
              key={key}
              className="border rounded-lg overflow-hidden bg-card"
            >
              <button
                type="button"
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-muted/20 hover:bg-muted/30 text-left"
                onClick={() => toggleMonth(key)}
              >
                <span className="flex items-center gap-2 font-medium">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  {label}
                  {key === currentMonthKey && (
                    <Badge variant="secondary" className="text-xs">
                      Bu ay
                    </Badge>
                  )}
                  <span className="text-muted-foreground font-normal text-sm">
                    ({items.length} kalem)
                  </span>
                </span>
                <span className="font-semibold text-destructive text-sm shrink-0">
                  {total.toLocaleString("tr-TR")} ₺
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                )}
              </button>
              {isExpanded && (
                <div className="divide-y border-t">
                  {items.map((expense) => {
                    const Icon = CATEGORY_ICONS[expense.category] || Wallet;
                    return (
                      <div
                        key={expense._id}
                        className="px-4 py-3 flex flex-col gap-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="flex items-center gap-2 text-sm font-medium">
                            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                            {CATEGORY_LABELS[expense.category] ||
                              expense.category}
                          </span>
                          <span className="font-semibold text-destructive text-sm shrink-0">
                            {expense.amount.toLocaleString("tr-TR")} ₺
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>
                            {format(new Date(expense.date), "dd MMM yyyy", {
                              locale: tr,
                            })}
                          </span>
                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEditClick(expense)}
                              disabled={loading}
                              title="Düzenle"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleDelete(expense._id)}
                              disabled={loading}
                              title="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {expense.description ? (
                          <p className="text-xs text-muted-foreground truncate max-w-full">
                            {expense.description}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
