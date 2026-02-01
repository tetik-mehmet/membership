'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CATEGORY_LABELS = {
  electricity: 'Elektrik Faturası',
  water: 'Su Faturası',
  extra: 'Ekstra Masraflar',
};

export default function EditExpenseDialog({ expense, open, onOpenChange, onSuccess }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    date: '',
    description: '',
  });

  useEffect(() => {
    if (expense) {
      const dateStr = expense.date
        ? new Date(expense.date).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);
      setFormData({
        category: expense.category || '',
        amount: expense.amount?.toString() || '',
        date: dateStr,
        description: expense.description || '',
      });
    }
  }, [expense]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!expense?._id) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/expenses/${expense._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: formData.category,
          amount: parseFloat(formData.amount),
          date: formData.date ? new Date(formData.date).toISOString() : undefined,
          description: formData.description || '',
        }),
      });

      const data = await response.json();

      if (data.success) {
        onOpenChange(false);
        onSuccess?.(data.data);
        router.refresh();
        toast.success('Harcama güncellendi', { description: 'Harcama bilgileri başarıyla kaydedildi.' });
      } else {
        toast.error('Güncellenemedi', { description: data.error || 'Lütfen bilgileri kontrol edin.' });
      }
    } catch (error) {
      toast.error('Bir hata oluştu', { description: 'Lütfen tekrar deneyin.' });
    } finally {
      setLoading(false);
    }
  };

  if (!expense) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Harcama Düzenle</DialogTitle>
          <DialogDescription>
            Harcama bilgilerini güncelleyin
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-category">Kategori *</Label>
            <Select
              value={formData.category}
              onValueChange={(v) => setFormData({ ...formData, category: v })}
              required
              disabled={loading}
            >
              <SelectTrigger className="w-full" id="edit-category">
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-amount">Tutar (₺) *</Label>
            <Input
              id="edit-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="500"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-date">Tarih *</Label>
            <Input
              id="edit-date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Açıklama (İsteğe bağlı)</Label>
            <Textarea
              id="edit-description"
              placeholder="Örn: Ocak ayı elektrik faturası"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
              rows={2}
              className="resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
