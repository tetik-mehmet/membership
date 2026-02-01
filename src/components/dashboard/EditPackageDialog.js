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

export default function EditPackageDialog({ package: pkg, open, onOpenChange, onSuccess }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    durationInDays: '',
    price: '',
  });

  useEffect(() => {
    if (pkg) {
      setFormData({
        name: pkg.name || '',
        durationInDays: pkg.durationInDays?.toString() || '',
        price: pkg.price?.toString() || '',
      });
    }
  }, [pkg]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pkg?._id) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/packages/${pkg._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          durationInDays: parseInt(formData.durationInDays),
          price: parseFloat(formData.price),
        }),
      });

      const data = await response.json();

      if (data.success) {
        onOpenChange(false);
        onSuccess?.(data.data);
        router.refresh();
        toast.success('Paket güncellendi', { description: 'Paket bilgileri başarıyla kaydedildi.' });
      } else {
        toast.error('Güncellenemedi', { description: data.error || 'Lütfen bilgileri kontrol edin.' });
      }
    } catch (error) {
      toast.error('Bir hata oluştu', { description: 'Lütfen tekrar deneyin.' });
    } finally {
      setLoading(false);
    }
  };

  if (!pkg) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Paket Düzenle</DialogTitle>
          <DialogDescription>
            Paket bilgilerini güncelleyin
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-pkg-name">Paket Adı *</Label>
            <Input
              id="edit-pkg-name"
              placeholder="Örn: Aylık, 5 Aylık, Yıllık"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-pkg-duration">Süre (Gün) *</Label>
            <Input
              id="edit-pkg-duration"
              type="number"
              min="1"
              placeholder="30"
              value={formData.durationInDays}
              onChange={(e) => setFormData({ ...formData, durationInDays: e.target.value })}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-pkg-price">Fiyat (₺) *</Label>
            <Input
              id="edit-pkg-price"
              type="number"
              min="0"
              step="0.01"
              placeholder="500"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
              disabled={loading}
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
