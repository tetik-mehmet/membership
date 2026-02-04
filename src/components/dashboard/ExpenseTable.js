"use client";

import { useState, Fragment } from "react";
import {
  Pencil,
  Trash2,
  Zap,
  Droplets,
  Wallet,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

const CATEGORY_ORDER = ["electricity", "water", "extra"];

export default function ExpenseTable({ initialExpenses }) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [loading, setLoading] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(() =>
    CATEGORY_ORDER.reduce((acc, c) => ({ ...acc, [c]: true }), {})
  );

  const toggleCategory = (cat) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const groupedByCategory = CATEGORY_ORDER.reduce((acc, cat) => {
    const items = expenses.filter((e) => e.category === cat);
    if (items.length > 0) {
      acc[cat] = {
        items,
        total: items.reduce((s, e) => s + (e.amount || 0), 0),
      };
    }
    return acc;
  }, {});

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

  // Ay bazlı toplamlar (karşılaştırma için)
  const now = new Date();
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

  return (
    <div className="space-y-4">
      <EditExpenseDialog
        expense={editExpense}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
      />
      {expenses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Henüz harcama eklenmemiş</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Açıklama
                  </TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedByCategory).map(
                  ([cat, { items, total }]) => {
                    const Icon = CATEGORY_ICONS[cat] || Wallet;
                    const isExpanded = expandedCategories[cat];
                    return (
                      <Fragment key={cat}>
                        <TableRow
                          key={cat}
                          className="bg-muted/20 hover:bg-muted/30 cursor-pointer"
                          onClick={() => toggleCategory(cat)}
                        >
                          <TableCell className="font-medium">
                            <span className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                              {CATEGORY_LABELS[cat] || cat}{" "}
                              <span className="text-muted-foreground font-normal">
                                ({items.length})
                              </span>
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-destructive">
                              Toplam: {total.toLocaleString("tr-TR")} ₺
                            </span>
                          </TableCell>
                          <TableCell
                            colSpan={2}
                            className="hidden sm:table-cell"
                          />
                          <TableCell className="text-right w-10">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCategory(cat);
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
                          items.map((expense) => (
                            <TableRow
                              key={expense._id}
                              className="bg-background"
                            >
                              <TableCell className="pl-10 sm:pl-12 text-muted-foreground max-w-[140px] sm:max-w-[200px] truncate">
                                {expense.description || "—"}
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
                              <TableCell className="hidden sm:table-cell max-w-[200px] truncate">
                                {expense.description || "-"}
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
                          ))}
                      </Fragment>
                    );
                  }
                )}
              </TableBody>
            </Table>
          </div>
          <div className="border-t bg-muted/30 px-4 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-4 text-right">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {format(now, "MMMM yyyy", { locale: tr })} Toplam Gider
                </p>
                <p className="text-xl font-bold text-foreground">
                  {currentMonthTotal.toLocaleString("tr-TR")} ₺
                </p>
              </div>
              <div className="flex items-center justify-end sm:justify-end gap-1.5">
                {prevMonthTotal > 0 ? (
                  <>
                    {diff > 0 ? (
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-destructive">
                        ▲ +{diff.toLocaleString("tr-TR")} ₺
                      </span>
                    ) : diff < 0 ? (
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-500">
                        ▼ {diff.toLocaleString("tr-TR")} ₺
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">
                        Değişmedi
                      </span>
                    )}
                    <span className="text-sm text-muted-foreground">
                      ({prevMonthName}&apos;a göre)
                    </span>
                  </>
                ) : currentMonthTotal > 0 ? (
                  <span className="text-sm text-muted-foreground">
                    ({prevMonthName}&apos;ta gider yok)
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
