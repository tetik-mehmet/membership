'use client';

import { useState } from 'react';
import { Pencil, Trash2, Zap, Droplets, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import EditExpenseDialog from '@/components/dashboard/EditExpenseDialog';

const CATEGORY_LABELS = {
  electricity: 'Elektrik Faturası',
  water: 'Su Faturası',
  extra: 'Ekstra Masraflar',
};

const CATEGORY_ICONS = {
  electricity: Zap,
  water: Droplets,
  extra: Wallet,
};

export default function ExpenseTable({ initialExpenses }) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [loading, setLoading] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleDelete = async (expenseId) => {
    if (!confirm('Bu harcamayı silmek istediğinizden emin misiniz?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setExpenses(expenses.filter((e) => e._id !== expenseId));
        toast.success('Harcama silindi', { description: 'Harcama kaydı başarıyla kaldırıldı.' });
      } else {
        toast.error('Harcama silinemedi', { description: data.error || 'Lütfen tekrar deneyin.' });
      }
    } catch (error) {
      toast.error('Bir hata oluştu', { description: 'Lütfen tekrar deneyin.' });
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

  const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

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
                  <TableHead className="hidden sm:table-cell">Açıklama</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => {
                  const Icon = CATEGORY_ICONS[expense.category] || Wallet;
                  return (
                    <TableRow key={expense._id}>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {CATEGORY_LABELS[expense.category] || expense.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-destructive">
                          {expense.amount.toLocaleString('tr-TR')} ₺
                        </span>
                      </TableCell>
                      <TableCell>
                        {format(new Date(expense.date), 'dd MMM yyyy', { locale: tr })}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell max-w-[200px] truncate">
                        {expense.description || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
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
              </TableBody>
            </Table>
          </div>
          <div className="border-t bg-muted/30 px-4 py-3 text-right">
            <span className="text-sm font-semibold text-foreground">
              Toplam: {totalAmount.toLocaleString('tr-TR')} ₺
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
