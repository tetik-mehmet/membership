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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function EditMembershipDialog({ membership, members, packages, open, onOpenChange, onSuccess }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    packageId: '',
    status: '',
  });

  useEffect(() => {
    if (membership) {
      const start = membership.startDate
        ? new Date(membership.startDate).toISOString().split('T')[0]
        : '';
      const end = membership.endDate
        ? new Date(membership.endDate).toISOString().split('T')[0]
        : '';
      setFormData({
        startDate: start,
        endDate: end,
        packageId: membership.packageId?._id || membership.packageId || '',
        status: membership.status || 'active',
      });
    }
  }, [membership]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!membership?._id) return;
    setLoading(true);

    try {
      const body = {
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
      };
      if (formData.packageId) body.packageId = formData.packageId;

      const response = await fetch(`/api/memberships/${membership._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        onOpenChange(false);
        onSuccess?.(data.data);
        router.refresh();
        toast.success('Üyelik güncellendi', { description: 'Üyelik bilgileri başarıyla kaydedildi.' });
      } else {
        toast.error('Güncellenemedi', { description: data.error || 'Lütfen bilgileri kontrol edin.' });
      }
    } catch (error) {
      toast.error('Bir hata oluştu', { description: 'Lütfen tekrar deneyin.' });
    } finally {
      setLoading(false);
    }
  };

  if (!membership) return null;

  // Mevcut üyeliğin paketi pasif olsa bile listede göster
  const pkgList = [...(packages || [])];
  const currentPkg = membership.packageId;
  const currentPkgId = currentPkg?._id || currentPkg;
  if (currentPkgId && !pkgList.some((p) => p._id === currentPkgId) && currentPkg) {
    const pkgObj = typeof currentPkg === 'object' ? currentPkg : { _id: currentPkg, name: 'Mevcut paket', durationInDays: 0, price: 0 };
    pkgList.unshift(pkgObj);
  }
  const statusOptions = [
    { value: 'active', label: 'Aktif' },
    { value: 'expired', label: 'Süresi Dolmuş' },
    { value: 'cancelled', label: 'İptal Edildi' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Üyelik Düzenle</DialogTitle>
          <DialogDescription>
            Üyelik tarihlerini ve durumunu güncelleyin
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Üye</Label>
            <p className="text-sm text-muted-foreground py-1">
              {membership.memberId?.firstName} {membership.memberId?.lastName}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-membership-package">Paket</Label>
            <Select
              value={formData.packageId}
              onValueChange={(value) => setFormData({ ...formData, packageId: value })}
              disabled={loading}
            >
              <SelectTrigger id="edit-membership-package">
                <SelectValue placeholder="Paket seçin" />
              </SelectTrigger>
              <SelectContent>
                {pkgList.map((p) => (
                  <SelectItem key={p._id} value={p._id}>
                    {p.name} - {p.durationInDays} gün - {p.price?.toLocaleString('tr-TR')} ₺
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-membership-start">Başlangıç Tarihi *</Label>
            <Input
              id="edit-membership-start"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-membership-end">Bitiş Tarihi *</Label>
            <Input
              id="edit-membership-end"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-membership-status">Durum</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
              disabled={loading}
            >
              <SelectTrigger id="edit-membership-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
