import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ExpenseTable from '@/components/dashboard/ExpenseTable';
import AddExpenseDialog from '@/components/dashboard/AddExpenseDialog';
import connectDB from '@/lib/db';
import Expense from '@/models/Expense';

export const dynamic = 'force-dynamic';

async function getExpenses() {
  await connectDB();
  const expenses = await Expense.find().sort({ date: -1 }).lean();
  return JSON.parse(JSON.stringify(expenses));
}

export default async function ExpensesPage() {
  const expenses = await getExpenses();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Harcamalar</h1>
          <p className="text-muted-foreground mt-2">
            Elektrik, su ve ekstra masraflarınızı kategori bazında kaydedin
          </p>
        </div>
        <AddExpenseDialog>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
            <Plus className="h-5 w-5" />
            Yeni Harcama
          </button>
        </AddExpenseDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Harcama Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseTable initialExpenses={expenses} />
        </CardContent>
      </Card>
    </div>
  );
}
