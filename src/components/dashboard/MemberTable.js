"use client";

import { useState } from "react";
import { Pencil, Trash2, Search, Phone, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EditMemberDialog from "@/components/dashboard/EditMemberDialog";

export default function MemberTable({ initialMembers }) {
  const [members, setMembers] = useState(initialMembers);
  const [search, setSearch] = useState("");
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
      (member.email && member.email.toLowerCase().includes(searchLower)) ||
      (member.phone && member.phone.toLowerCase().includes(searchLower))
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
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setMembers(members.filter((m) => m._id !== memberId));
        if (editMember?._id === memberId) {
          setEditMember(null);
          setEditDialogOpen(false);
        }
        toast.success("Üye silindi", {
          description: "Üye ve bağlı üyelikler kaldırıldı.",
        });
      } else {
        toast.error("Üye silinemedi", {
          description: data.error || "Lütfen tekrar deneyin.",
        });
      }
    } catch (error) {
      toast.error("Bir hata oluştu", { description: "Lütfen tekrar deneyin." });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (member) => {
    setEditMember(member);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = (updatedMember) => {
    if (!updatedMember) return;

    // Güncellenmiş üye verisini state'e ekle
    setMembers(
      members.map((m) =>
        m._id === updatedMember._id
          ? { ...updatedMember, phone: updatedMember.phone || "" }
          : m
      )
    );
  };

  const handlePaymentStatusChange = async (memberId, newStatus) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/members/${memberId}/payment-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        setMembers(
          members.map((m) =>
            m._id === memberId ? { ...m, paymentStatus: newStatus } : m
          )
        );
        toast.success(
          newStatus === "paid" ? "Ödeme alındı" : "Ödeme durumu güncellendi",
          {
            description:
              newStatus === "paid"
                ? "Üyenin ödemesi alındı olarak işaretlendi."
                : "Üyenin ödemesi alınmadı olarak işaretlendi.",
          }
        );
      } else {
        toast.error("Güncelleme başarısız", {
          description: data.error || "Lütfen tekrar deneyin.",
        });
      }
    } catch (error) {
      toast.error("Bir hata oluştu", { description: "Lütfen tekrar deneyin." });
    } finally {
      setLoading(false);
    }
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
              Bu üyeyi silmek istediğinizden emin misiniz? Üyeye ait tüm
              üyelikler de kaldırılacaktır. Bu işlem geri alınamaz.
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
            {search ? "Üye bulunamadı" : "Henüz üye eklenmemiş"}
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
                  <TableHead>Cep Telefonu</TableHead>
                  <TableHead>Ödeme Durumu</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member._id}>
                    <TableCell className="font-medium">
                      {member.firstName} {member.lastName}
                    </TableCell>
                    <TableCell>{member.email || "-"}</TableCell>
                    <TableCell>
                      {member.phone ? (
                        <a
                          href={`tel:${member.phone.replace(/\s+/g, "")}`}
                          className="inline-flex items-center gap-1.5 text-orange-600 hover:text-orange-700 hover:underline cursor-pointer active:opacity-70 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="font-medium">{member.phone}</span>
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={
                            member.paymentStatus === "paid"
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            handlePaymentStatusChange(member._id, "paid")
                          }
                          disabled={loading || member.paymentStatus === "paid"}
                          className={`text-xs px-2 py-1 h-7 ${
                            member.paymentStatus === "paid"
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "hover:bg-green-100 hover:text-green-700 hover:border-green-300"
                          }`}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Alındı
                        </Button>
                        <Button
                          variant={
                            member.paymentStatus === "unpaid" ||
                            !member.paymentStatus
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            handlePaymentStatusChange(member._id, "unpaid")
                          }
                          disabled={
                            loading ||
                            member.paymentStatus === "unpaid" ||
                            !member.paymentStatus
                          }
                          className={`text-xs px-2 py-1 h-7 ${
                            member.paymentStatus === "unpaid" ||
                            !member.paymentStatus
                              ? "bg-red-600 hover:bg-red-700 text-white"
                              : "hover:bg-red-100 hover:text-red-700 hover:border-red-300"
                          }`}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Alınmadı
                        </Button>
                      </div>
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
