'use client';

import { useState, useMemo } from 'react';
import { Ban, Pencil, Clock, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format, differenceInDays, startOfDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import EditMembershipDialog from '@/components/dashboard/EditMembershipDialog';

export default function MembershipTable({ initialMemberships, members, packages }) {
  const [memberships, setMemberships] = useState(initialMemberships);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [editMembership, setEditMembership] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const isExpired = (endDate) => new Date(endDate) < new Date();
  const getEffectiveStatus = (m) =>
    m.status === 'active' && isExpired(m.endDate) ? 'expired' : m.status;

  const filteredMemberships = memberships.filter((membership) => {
    const effective = getEffectiveStatus(membership);
    if (activeTab === 'all') return effective !== 'expired'; // Süresi dolmuş hariç
    return effective === activeTab;
  });

  // Paketlere göre grupla (paket sırasına göre)
  const groupedByPackage = useMemo(() => {
    const groups = new Map();
    const pkgOrder = packages?.map((p) => p._id?.toString()) || [];

    filteredMemberships.forEach((m) => {
      const pkgId = m.packageId?._id?.toString() || m.packageId?.toString() || '_unknown';
      if (!groups.has(pkgId)) {
        const pkg = m.packageId;
        groups.set(pkgId, {
          id: pkgId,
          name: pkg?.name || 'Paket bilinmiyor',
          price: pkg?.price,
          durationInDays: pkg?.durationInDays,
          memberships: [],
        });
      }
      groups.get(pkgId).memberships.push(m);
    });

    // Paket sırasına göre sırala, bilinmeyen en sonda
    return Array.from(groups.entries())
      .sort(([a], [b]) => {
        if (a === '_unknown') return 1;
        if (b === '_unknown') return -1;
        const idxA = pkgOrder.indexOf(a);
        const idxB = pkgOrder.indexOf(b);
        return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
      })
      .map(([, group]) => group);
  }, [filteredMemberships, packages]);

  const handleCancel = async (membershipId) => {
    if (!confirm('Bu üyeliği iptal etmek istediğinizden emin misiniz?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/memberships/${membershipId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      const data = await response.json();

      if (data.success) {
        setMemberships(
          memberships.map((m) =>
            m._id === membershipId ? { ...m, status: 'cancelled' } : m
          )
        );
        toast.success('Üyelik iptal edildi', { description: 'Üyelik başarıyla sonlandırıldı.' });
      } else {
        toast.error('Üyelik iptal edilemedi', { description: data.error || 'Lütfen tekrar deneyin.' });
      }
    } catch (error) {
      toast.error('Bir hata oluştu', { description: 'Lütfen tekrar deneyin.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (membership) => {
    setEditMembership(membership);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = (updated) => {
    setMemberships(memberships.map((m) => (m._id === updated._id ? updated : m)));
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'default',
      expired: 'destructive',
      cancelled: 'secondary',
    };

    const labels = {
      active: 'Aktif',
      expired: 'Süresi Dolmuş',
      cancelled: 'İptal Edildi',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  // Süresi 10 gün veya daha az kalan (henüz dolmamış) üyelikler
  const getDaysRemaining = (endDate) => {
    const end = startOfDay(new Date(endDate));
    const today = startOfDay(new Date());
    return differenceInDays(end, today);
  };

  const isExpiringSoon = (membership) => {
    if (membership.status !== 'active') return false;
    if (isExpired(membership.endDate)) return false;
    const days = getDaysRemaining(membership.endDate);
    return days >= 0 && days <= 10;
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <EditMembershipDialog
        membership={editMembership}
        members={members}
        packages={packages}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
      />
      <TabsList>
        <TabsTrigger value="all">Tümü ({memberships.filter((m) => getEffectiveStatus(m) !== 'expired').length})</TabsTrigger>
        <TabsTrigger value="active">
          Aktif ({memberships.filter((m) => getEffectiveStatus(m) === 'active').length})
        </TabsTrigger>
        <TabsTrigger value="expired">
          Süresi Dolmuş ({memberships.filter((m) => getEffectiveStatus(m) === 'expired').length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value={activeTab}>
        {filteredMemberships.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Üyelik bulunamadı</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByPackage.map((group) => (
              <div key={group.id} className="border rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-muted/50 dark:bg-muted/20 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary shrink-0" />
                    <h3 className="font-semibold text-foreground">{group.name}</h3>
                    {group.price != null && (
                      <span className="text-sm text-muted-foreground">
                        {group.price.toLocaleString('tr-TR')} ₺
                        {group.durationInDays ? ` / ${group.durationInDays} gün` : ''}
                      </span>
                    )}
                  </div>
                  <Badge variant="secondary" className="w-fit">
                    {group.memberships.length} üyelik
                  </Badge>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Üye</TableHead>
                        <TableHead className="hidden sm:table-cell">Başlangıç</TableHead>
                        <TableHead>Bitiş</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.memberships.map((membership) => (
                        <TableRow key={membership._id}>
                          <TableCell className="font-medium">
                            {membership.memberId?.firstName} {membership.memberId?.lastName}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {format(new Date(membership.startDate), 'dd MMM yyyy', { locale: tr })}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap items-center gap-2">
                              <span>{format(new Date(membership.endDate), 'dd MMM yyyy', { locale: tr })}</span>
                              {isExpiringSoon(membership) && (
                                <span
                                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200/60 dark:border-amber-700/50"
                                  title={`${getDaysRemaining(membership.endDate)} gün kaldı`}
                                >
                                  <Clock className="h-3.5 w-3.5 shrink-0" />
                                  {getDaysRemaining(membership.endDate) === 0
                                    ? 'Bugün bitiyor'
                                    : getDaysRemaining(membership.endDate) === 1
                                      ? '1 gün kaldı'
                                      : `${getDaysRemaining(membership.endDate)} gün kaldı`}
                                </span>
                              )}
                              {membership.status === 'active' && isExpired(membership.endDate) && (
                                <span className="text-xs text-red-600 dark:text-red-400 font-medium">Süre doldu</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(getEffectiveStatus(membership))}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClick(membership)}
                                disabled={loading}
                                title="Düzenle"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {getEffectiveStatus(membership) === 'active' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCancel(membership._id)}
                                  disabled={loading}
                                  title="İptal Et"
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
