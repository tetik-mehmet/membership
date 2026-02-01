'use client';

import { useState } from 'react';
import { Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import EditMemberDialog from '@/components/dashboard/EditMemberDialog';

export default function MemberTable({ initialMembers }) {
  const [members, setMembers] = useState(initialMembers);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteMemberId, setDeleteMemberId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const filteredMembers = members.filter((member) => {
    const searchLower = search.toLowerCase();
    return (
      member.firstName.toLowerCase().includes(searchLower) ||
      member.lastName.toLowerCase().includes(searchLower) ||
      (member.email && member.email.toLowerCase().includes(searchLower))
    );
  });

  const handleDeleteClick = (memberId) => {
    setDeleteMemberId(memberId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteMemberId) return;
    const memberId = deleteMemberId;
    setDeleteDialogOpen(false);
    setDeleteMemberId(null);

    setLoading(true);
    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setMembers(members.filter((m) => m._id !== memberId));
        if (editMember?._id === memberId) {
          setEditMember(null);
          setEditDialogOpen(false);
        }
        toast.success('Üye silindi', { description: 'Üye ve bağlı üyelikler kaldırıldı.' });
      } else {
        toast.error('Üye silinemedi', { description: data.error || 'Lütfen tekrar deneyin.' });
      }
    } catch (error) {
      toast.error('Bir hata oluştu', { description: 'Lütfen tekrar deneyin.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (member) => {
    setEditMember(member);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = (updatedMember) => {
    setMembers(members.map((m) => (m._id === updatedMember._id ? updatedMember : m)));
  };

  return (
    <div className="space-y-4">
      <EditMemberDialog
        member={editMember}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
      />
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent showCloseButton={true}>
          <DialogHeader>
            <DialogTitle>Üyeyi sil</DialogTitle>
            <DialogDescription>
              Bu üyeyi silmek istediğinizden emin misiniz? Üyeye ait tüm üyelikler de kaldırılacaktır. Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={loading}
            >
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Üye ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredMembers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {search ? 'Üye bulunamadı' : 'Henüz üye eklenmemiş'}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Kayıt Tarihi</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member._id}>
                    <TableCell className="font-medium">
                      {member.firstName} {member.lastName}
                    </TableCell>
                    <TableCell>{member.email || '-'}</TableCell>
                    <TableCell>
                      {format(new Date(member.createdAt), 'dd MMM yyyy', { locale: tr })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(member)}
                          disabled={loading}
                          title="Düzenle"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(member._id)}
                          disabled={loading}
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
