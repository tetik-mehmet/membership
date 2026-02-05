import {
  Plus,
  Wallet,
  Calendar,
  TrendingUp,
  TrendingDown,
  Receipt,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ExpenseTable from "@/components/dashboard/ExpenseTable";
import AddExpenseDialog from "@/components/dashboard/AddExpenseDialog";
import connectDB from "@/lib/db";
import Expense from "@/models/Expense";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  isWithinInterval,
} from "date-fns";
import { tr } from "date-fns/locale";

export const dynamic = "force-dynamic";

async function getExpenses() {
  await connectDB();
  const expenses = await Expense.find().sort({ date: -1 }).lean();
  return JSON.parse(JSON.stringify(expenses));
}

function calculateStats(expenses) {
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

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

  return {
    totalExpenses,
    currentMonthTotal,
    prevMonthTotal,
    diff,
    prevMonthName,
  };
}

export default async function ExpensesPage({ searchParams }) {
  const expenses = await getExpenses();
  const stats = calculateStats(expenses);
  const resolved =
    searchParams && typeof searchParams.then === "function"
      ? await searchParams
      : searchParams || {};
  const openAddExpense = resolved?.open === "add-expense";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Harcamalar</h1>
          <p className="text-muted-foreground mt-2">
            Elektrik, su ve ekstra masraflarınızı ay bazında takip edin
          </p>
        </div>
        <AddExpenseDialog defaultOpen={openAddExpense}>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
            <Plus className="h-5 w-5" />
            Yeni Harcama
          </button>
        </AddExpenseDialog>
      </div>

      {/* Özet kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Gider
            </CardTitle>
            <div className="bg-red-50 dark:bg-red-950/40 p-2 rounded-lg">
              <Wallet className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {stats.totalExpenses.toLocaleString("tr-TR")} ₺
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bu Ay
            </CardTitle>
            <div className="bg-blue-50 dark:bg-blue-950/40 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {stats.currentMonthTotal.toLocaleString("tr-TR")} ₺
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Geçen Aya Göre
            </CardTitle>
            <div
              className={`p-2 rounded-lg ${
                stats.diff > 0
                  ? "bg-red-50 dark:bg-red-950/40"
                  : stats.diff < 0
                  ? "bg-green-50 dark:bg-green-950/40"
                  : "bg-muted"
              }`}
            >
              {stats.diff > 0 ? (
                <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
              ) : stats.diff < 0 ? (
                <TrendingDown className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <Calendar className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {stats.prevMonthTotal > 0 ? (
              <>
                {stats.diff > 0 ? (
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                    +{stats.diff.toLocaleString("tr-TR")} ₺
                  </div>
                ) : stats.diff < 0 ? (
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {stats.diff.toLocaleString("tr-TR")} ₺
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-muted-foreground">
                    Değişmedi
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  ({stats.prevMonthName}&apos;a göre)
                </p>
              </>
            ) : stats.currentMonthTotal > 0 ? (
              <div className="text-sm text-muted-foreground">
                ({stats.prevMonthName}&apos;ta gider yok)
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Karşılaştırma yapılamıyor
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Liste kartı veya boş durum */}
      {expenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="bg-muted/50 dark:bg-muted/20 p-6 rounded-full mb-4">
              <Receipt className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Henüz harcama eklenmemiş
            </h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              İlk harcamanızı ekleyerek başlayın. Elektrik, su ve ekstra
              masraflarınızı kategori bazında kaydedebilirsiniz.
            </p>
            <AddExpenseDialog>
              <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
                <Plus className="h-5 w-5" />
                Yeni Harcama Ekle
              </button>
            </AddExpenseDialog>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Harcama Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseTable initialExpenses={expenses} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
