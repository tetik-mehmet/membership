"use client";

import { useState } from "react";
import { Pencil, Trash2, Search, Phone, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [noteDrafts, setNoteDrafts] = useState({});
  const [noteSavingId, setNoteSavingId] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editMember, setEditMember] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteMemberId, setDeleteMemberId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const filteredMembers = members.filter((member) => {
    const searchLower = search.toLowerCase();

    const matchesSearch =
      member.firstName.toLowerCase().includes(searchLower) ||
      member.lastName.toLowerCase().includes(searchLower) ||
      (member.email && member.email.toLowerCase().includes(searchLower)) ||
      (member.phone && member.phone.toLowerCase().includes(searchLower));

    const matchesPayment =
      paymentFilter === "all"
        ? true
        : paymentFilter === "paid"
        ? member.paymentStatus === "paid"
        : paymentFilter === "partial"
        ? member.paymentStatus === "partial"
        : member.paymentStatus === "unpaid" || !member.paymentStatus;

    return matchesSearch && matchesPayment;
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

        let title = "Ödeme durumu güncellendi";
        let description = "Üyenin ödeme durumu güncellendi.";

        if (newStatus === "paid") {
          title = "Ödeme alındı";
          description = "Üyenin ödemesi alındı olarak işaretlendi.";
        } else if (newStatus === "partial") {
          title = "Kısmi ödeme";
          description = "Üyenin ödemesi kısmi olarak işaretlendi.";
        } else if (newStatus === "unpaid") {
          title = "Ödeme alınmadı";
          description = "Üyenin ödemesi alınmadı olarak işaretlendi.";
        }

        toast.success(title, {
          description,
        });
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

  const handleNoteChange = (memberId, value) => {
    setNoteDrafts((prev) => ({
      ...prev,
      [memberId]: value,
    }));
  };

  const handleNoteSave = async (memberId) => {
    const draft = noteDrafts[memberId];
    const member = members.find((m) => m._id === memberId);
    const currentNote = member?.note || "";
    const noteToSave =
      typeof draft === "string"
        ? draft
        : typeof currentNote === "string"
        ? currentNote
        : "";

    setNoteSavingId(memberId);
    try {
      const response = await fetch(`/api/members/${memberId}/note`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteToSave }),
      });

      const data = await response.json();

      if (data.success) {
        const savedNote = noteToSave;
        setMembers(
          members.map((m) =>
            m._id === memberId ? { ...m, note: savedNote } : m
          )
        );
        setNoteDrafts((prev) => ({
          ...prev,
          [memberId]: savedNote,
        }));
        toast.success("Not kaydedildi", {
          description: "Üye notu başarıyla güncellendi.",
        });
        setEditingNoteId(null);
      } else {
        toast.error("Not kaydedilemedi", {
          description: data.error || "Lütfen tekrar deneyin.",
        });
      }
    } catch (error) {
      toast.error("Bir hata oluştu", { description: "Lütfen tekrar deneyin." });
    } finally {
      setNoteSavingId(null);
    }
  };

  const handleNoteEditStart = (memberId) => {
    const member = members.find((m) => m._id === memberId);
    const currentNote = member?.note || "";
    setNoteDrafts((prev) => ({
      ...prev,
      [memberId]: currentNote,
    }));
    setEditingNoteId(memberId);
  };

  const handleNoteEditCancel = (memberId) => {
    setEditingNoteId((prev) => (prev === memberId ? null : prev));
    setNoteDrafts((prev) => {
      const next = { ...prev };
      delete next[memberId];
      return next;
    });
  };

  const handleNoteDelete = async (memberId) => {
    setNoteSavingId(memberId);
    try {
      const response = await fetch(`/api/members/${memberId}/note`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: "" }),
      });

      const data = await response.json();

      if (data.success) {
        setMembers(
          members.map((m) => (m._id === memberId ? { ...m, note: "" } : m))
        );
        setNoteDrafts((prev) => {
          const next = { ...prev };
          delete next[memberId];
          return next;
        });
        setEditingNoteId(null);
        toast.success("Not silindi", {
          description: "Üye notu temizlendi.",
        });
      } else {
        toast.error("Not silinemedi", {
          description: data.error || "Lütfen tekrar deneyin.",
        });
      }
    } catch (error) {
      toast.error("Bir hata oluştu", { description: "Lütfen tekrar deneyin." });
    } finally {
      setNoteSavingId(null);
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Üye ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Ödeme durumu:
          </span>
          <Select
            value={paymentFilter}
            onValueChange={(value) => setPaymentFilter(value)}
          >
            <SelectTrigger className="min-w-[140px]">
              <SelectValue placeholder="Filtre seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Hepsi</SelectItem>
              <SelectItem value="paid">Ödeme alındı</SelectItem>
              <SelectItem value="partial">Kısmi</SelectItem>
              <SelectItem value="unpaid">Ödeme alınmadı</SelectItem>
            </SelectContent>
          </Select>
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
                <TableRow className="bg-sky-100 text-slate-900 dark:bg-[#c4a484] dark:text-slate-900">
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>Cep Telefonu</TableHead>
                  <TableHead>Ödeme Durumu</TableHead>
                  <TableHead>Not</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member._id}>
                    <TableCell className="font-medium">
                      {member.firstName} {member.lastName}
                    </TableCell>
                    <TableCell>
                      {member.phone ? (
                        <a
                          href={`tel:${member.phone.replace(/\s+/g, "")}`}
                          className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer active:opacity-70 transition-colors [text-shadow:0_0_10px_rgba(129,140,248,0.9)]"
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
                      <div className="flex items-center gap-2 min-w-[260px]">
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
                        <Button
                          variant={
                            member.paymentStatus === "partial"
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            handlePaymentStatusChange(member._id, "partial")
                          }
                          disabled={
                            loading || member.paymentStatus === "partial"
                          }
                          className={`text-xs px-2 py-1 h-7 ${
                            member.paymentStatus === "partial"
                              ? "bg-amber-500 hover:bg-amber-600 text-white"
                              : "hover:bg-amber-100 hover:text-amber-700 hover:border-amber-300"
                          }`}
                        >
                          Kısmi
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 min-w-[220px]">
                        {editingNoteId === member._id ? (
                          <>
                            <Textarea
                              rows={2}
                              placeholder="Bu üye için not ekleyin..."
                              value={
                                noteDrafts[member._id] !== undefined
                                  ? noteDrafts[member._id]
                                  : member.note || ""
                              }
                              onChange={(e) =>
                                handleNoteChange(member._id, e.target.value)
                              }
                              className="resize-none text-xs leading-snug"
                            />
                            <div className="flex justify-end gap-1 flex-wrap">
                              <Button
                                type="button"
                                size="xs"
                                variant="outline"
                                disabled={noteSavingId === member._id}
                                onClick={() => handleNoteSave(member._id)}
                                className="h-7 px-2 text-[11px]"
                              >
                                {noteSavingId === member._id
                                  ? "Kaydediliyor..."
                                  : "Kaydet"}
                              </Button>
                              <Button
                                type="button"
                                size="xs"
                                variant="ghost"
                                onClick={() => handleNoteEditCancel(member._id)}
                                className="h-7 px-2 text-[11px]"
                              >
                                Vazgeç
                              </Button>
                              <Button
                                type="button"
                                size="xs"
                                variant="destructive"
                                disabled={noteSavingId === member._id}
                                onClick={() => handleNoteDelete(member._id)}
                                className="h-7 px-2 text-[11px]"
                              >
                                Sil
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`flex-1 text-sm whitespace-pre-line min-h-[1.5rem] ${
                                member.note?.trim()
                                  ? "text-pink-400 [text-shadow:0_0_10px_rgba(244,114,182,0.9)]"
                                  : "text-foreground"
                              }`}
                            >
                              {member.note?.trim() || ""}
                            </p>
                            <Button
                              type="button"
                              size="xs"
                              variant="outline"
                              onClick={() => handleNoteEditStart(member._id)}
                              className="h-7 px-2 text-[11px] whitespace-nowrap"
                            >
                              {member.note?.trim() ? "Düzenle" : "Not ekle"}
                            </Button>
                          </div>
                        )}
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
