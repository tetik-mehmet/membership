'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

export default function AssignPackageDialog({ children, members, packages }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    memberId: '',
    packageId: '',
    startDate: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/memberships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setOpen(false);
        setFormData({
          memberId: '',
          packageId: '',
          startDate: new Date().toISOString().split('T')[0],
        });
        router.refresh();
        toast.success('Üyelik atandı', { description: 'Paket başarıyla üyeye atandı.' });
      } else {
        toast.error('Üyelik atanamadı', { description: data.error || 'Lütfen bilgileri kontrol edin.' });
      }
    } catch (error) {
      toast.error('Bir hata oluştu', { description: 'Lütfen tekrar deneyin.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Üyelik Ata</DialogTitle>
          <DialogDescription>
            Bir üyeye paket atayarak üyelik oluşturun
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="memberId">Üye *</Label>
            <Select
              value={formData.memberId}
              onValueChange={(value) => setFormData({ ...formData, memberId: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Üye seçin" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member._id} value={member._id}>
                    {member.firstName} {member.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="packageId">Paket *</Label>
            <Select
              value={formData.packageId}
              onValueChange={(value) => setFormData({ ...formData, packageId: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Paket seçin" />
              </SelectTrigger>
              <SelectContent>
                {packages.map((pkg) => (
                  <SelectItem key={pkg._id} value={pkg._id}>
                    {pkg.name} - {pkg.durationInDays} gün - {pkg.price.toLocaleString('tr-TR')} ₺
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Başlangıç Tarihi *</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
              disabled={loading}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              İptal
            </Button>
            <Button type="submit" disabled={loading || !formData.memberId || !formData.packageId}>
              {loading ? 'Atanıyor...' : 'Ata'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
