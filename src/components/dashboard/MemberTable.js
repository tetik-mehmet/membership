"use client";

import { useState, useEffect, useRef } from "react";
import { Pencil, Trash2, Search, Phone, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

function formatMembershipDuration(days) {
  if (!days || typeof days !== "number") return null;
  if (days >= 30) {
    const months = Math.round(days / 30);
    return months === 1 ? "1 aylık" : `${months} aylık`;
  }
  return `${days} günlük`;
}

function getDurationBadgeClasses(days) {
  if (!days || typeof days !== "number") return "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 border-slate-200 dark:border-slate-600";
  const months = Math.round(days / 30);
  if (months === 1)
    return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200/60 dark:border-green-700/50";
  if (months === 3)
    return "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200/60 dark:border-orange-700/50";
  if (months === 6)
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200/60 dark:border-blue-700/50";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 border-slate-200 dark:border-slate-600";
}

export default function MemberTable({ initialMembers }) {
  const [members, setMembers] = useState(initialMembers);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(false);
  const [noteDrafts, setNoteDrafts] = useState({});
  const [noteSavingId, setNoteSavingId] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editMember, setEditMember] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteMemberId, setDeleteMemberId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Arama veya sekme değişince sayfayı başa al
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeTab, pageSize]);

  const filterByTab = (member, tab) => {
    if (tab === "all") return true;
    if (tab === "paid") return member.paymentStatus === "paid";
    if (tab === "partial") return member.paymentStatus === "partial";
    return member.paymentStatus === "unpaid" || !member.paymentStatus;
  };

  const filteredMembers = members.filter((member) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      member.firstName.toLowerCase().includes(searchLower) ||
      member.lastName.toLowerCase().includes(searchLower) ||
      (member.email && member.email.toLowerCase().includes(searchLower)) ||
      (member.phone && member.phone.toLowerCase().includes(searchLower));
    return matchesSearch && filterByTab(member, activeTab);
  });

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedMembers = filteredMembers.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const tabCounts = {
    all: members.filter((m) => {
      const searchLower = search.toLowerCase();
      return (
        m.firstName.toLowerCase().includes(searchLower) ||
        m.lastName.toLowerCase().includes(searchLower) ||
        (m.email && m.email.toLowerCase().includes(searchLower)) ||
        (m.phone && m.phone.toLowerCase().includes(searchLower))
      );
    }).length,
    paid: members.filter((m) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        m.firstName.toLowerCase().includes(searchLower) ||
        m.lastName.toLowerCase().includes(searchLower) ||
        (m.email && m.email.toLowerCase().includes(searchLower)) ||
        (m.phone && m.phone.toLowerCase().includes(searchLower));
      return matchesSearch && m.paymentStatus === "paid";
    }).length,
    partial: members.filter((m) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        m.firstName.toLowerCase().includes(searchLower) ||
        m.lastName.toLowerCase().includes(searchLower) ||
        (m.email && m.email.toLowerCase().includes(searchLower)) ||
        (m.phone && m.phone.toLowerCase().includes(searchLower));
      return matchesSearch && m.paymentStatus === "partial";
    }).length,
    unpaid: members.filter((m) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        m.firstName.toLowerCase().includes(searchLower) ||
        m.lastName.toLowerCase().includes(searchLower) ||
        (m.email && m.email.toLowerCase().includes(searchLower)) ||
        (m.phone && m.phone.toLowerCase().includes(searchLower));
      return matchesSearch && (m.paymentStatus === "unpaid" || !m.paymentStatus);
    }).length,
  };

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
          : m,
      ),
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
            m._id === memberId ? { ...m, paymentStatus: newStatus } : m,
          ),
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
            m._id === memberId ? { ...m, note: savedNote } : m,
          ),
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
          members.map((m) => (m._id === memberId ? { ...m, note: "" } : m)),
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

  // ESC tuşu ile modalı kapatma
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && photoModalOpen) {
        setPhotoModalOpen(false);
      }
    };

    if (photoModalOpen) {
      document.addEventListener("keydown", handleEscape);
      // Scroll'u engelle
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [photoModalOpen]);

  return (
    <div className="space-y-4">
      <EditMemberDialog
        member={editMember}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
      />

      {/* Fotoğraf Modal */}

      {photoModalOpen && selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 animate-photo-modal-fade-in"
          onClick={() => setPhotoModalOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-photo-modal-backdrop" />

          {/* Modal Content */}
          <div
            className="relative z-10 w-full max-w-5xl animate-photo-modal-zoom-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Kapatma Butonu */}
            <button
              onClick={() => setPhotoModalOpen(false)}
              className="absolute -top-10 right-0 sm:-top-11 sm:right-0 p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Kapat"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* Fotoğraf Container */}
            <div className="relative bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <div className="relative aspect-square w-full max-h-[70vh] sm:max-h-[80vh]">
                <Image
                  src={selectedPhoto.url}
                  alt={selectedPhoto.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
                  priority
                />
              </div>

              {/* İsim Etiketi */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 sm:p-6">
                <h3 className="text-white text-lg sm:text-xl md:text-2xl font-semibold drop-shadow-lg">
                  {selectedPhoto.name}
                </h3>
              </div>
            </div>

            {/* Kapatma ipucu */}
            <p className="text-center text-white/60 text-xs sm:text-sm mt-3 sm:mt-4 animate-photo-modal-fade-in">
              <span className="hidden sm:inline">
                ESC veya dışarıya tıklayarak kapatabilirsiniz
              </span>
              <span className="sm:hidden">Kapatmak için ekrana dokunun</span>
            </p>
          </div>
        </div>
      )}

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
      {/* Arama + Sayfa başına seçim */}
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
            Sayfa başına:
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => setPageSize(Number(v))}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sekmeler */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto flex flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="flex-1 sm:flex-none">
            Tümü ({tabCounts.all})
          </TabsTrigger>
          <TabsTrigger value="paid" className="flex-1 sm:flex-none">
            Ödeme Alındı ({tabCounts.paid})
          </TabsTrigger>
          <TabsTrigger value="partial" className="flex-1 sm:flex-none">
            Kısmi ({tabCounts.partial})
          </TabsTrigger>
          <TabsTrigger value="unpaid" className="flex-1 sm:flex-none">
            Ödeme Alınmadı ({tabCounts.unpaid})
          </TabsTrigger>
        </TabsList>

        {["all", "paid", "partial", "unpaid"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-3">
            {filteredMembers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {search ? "Üye bulunamadı" : "Bu kategoride üye yok"}
                </p>
              </div>
            ) : (
              <>
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
                        {paginatedMembers.map((member) => {
                          const firstName = member.firstName?.trim() || "";
                          const lastName = member.lastName?.trim() || "";
                          const initials =
                            [firstName.charAt(0), lastName.charAt(0)]
                              .filter(Boolean)
                              .join("")
                              .toUpperCase() || "?";
                          const fullName =
                            `${firstName} ${lastName}`.trim() || "—";

                          return (
                            <TableRow key={member._id}>
                              <TableCell className="font-medium">
                                <div className="flex min-w-0 w-full items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (member.photoUrl) {
                                        setSelectedPhoto({
                                          url: member.photoUrl,
                                          name: fullName,
                                        });
                                        setPhotoModalOpen(true);
                                      }
                                    }}
                                    className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground overflow-hidden transition-all hover:ring-2 hover:ring-ring hover:ring-offset-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 group"
                                    aria-label={
                                      member.photoUrl
                                        ? "Fotoğrafı büyüt"
                                        : initials
                                    }
                                  >
                                    {member.photoUrl ? (
                                      <>
                                        <Image
                                          src={member.photoUrl}
                                          alt={fullName}
                                          fill
                                          className="object-cover transition-transform group-hover:scale-110"
                                          sizes="40px"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
                                      </>
                                    ) : (
                                      <span aria-hidden>{initials}</span>
                                    )}
                                  </button>
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 min-w-0">
                                    <span className="min-w-0 truncate font-semibold text-foreground">
                                      {fullName}
                                    </span>
                                    {formatMembershipDuration(
                                      member.membershipDurationDays,
                                    ) && (
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border whitespace-nowrap shrink-0 ${getDurationBadgeClasses(member.membershipDurationDays)}`}>
                                        {formatMembershipDuration(member.membershipDurationDays)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {member.phone ? (
                                  <a
                                    href={`tel:${member.phone.replace(/\s+/g, "")}`}
                                    className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer active:opacity-70 transition-colors [text-shadow:0_0_10px_rgba(129,140,248,0.9)]"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span className="font-medium">
                                      {member.phone}
                                    </span>
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
                                      handlePaymentStatusChange(
                                        member._id,
                                        "paid",
                                      )
                                    }
                                    disabled={
                                      loading || member.paymentStatus === "paid"
                                    }
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
                                      handlePaymentStatusChange(
                                        member._id,
                                        "unpaid",
                                      )
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
                                      handlePaymentStatusChange(
                                        member._id,
                                        "partial",
                                      )
                                    }
                                    disabled={
                                      loading ||
                                      member.paymentStatus === "partial"
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
                                          handleNoteChange(
                                            member._id,
                                            e.target.value,
                                          )
                                        }
                                        className="resize-none text-xs leading-snug"
                                      />
                                      <div className="flex justify-end gap-1 flex-wrap">
                                        <Button
                                          type="button"
                                          size="xs"
                                          variant="outline"
                                          disabled={
                                            noteSavingId === member._id
                                          }
                                          onClick={() =>
                                            handleNoteSave(member._id)
                                          }
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
                                          onClick={() =>
                                            handleNoteEditCancel(member._id)
                                          }
                                          className="h-7 px-2 text-[11px]"
                                        >
                                          Vazgeç
                                        </Button>
                                        <Button
                                          type="button"
                                          size="xs"
                                          variant="destructive"
                                          disabled={
                                            noteSavingId === member._id
                                          }
                                          onClick={() =>
                                            handleNoteDelete(member._id)
                                          }
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
                                        onClick={() =>
                                          handleNoteEditStart(member._id)
                                        }
                                        className="h-7 px-2 text-[11px] whitespace-nowrap"
                                      >
                                        {member.note?.trim()
                                          ? "Düzenle"
                                          : "Not ekle"}
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
                                    onClick={() =>
                                      handleDeleteClick(member._id)
                                    }
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
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
                    <p className="text-sm text-muted-foreground order-2 sm:order-1">
                      {filteredMembers.length} üyeden{" "}
                      <span className="font-medium text-foreground">
                        {(safePage - 1) * pageSize + 1}–
                        {Math.min(safePage * pageSize, filteredMembers.length)}
                      </span>{" "}
                      arası gösteriliyor
                    </p>
                    <div className="flex items-center gap-1 order-1 sm:order-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={safePage === 1}
                        className="h-8 w-8 p-0"
                        title="İlk sayfa"
                      >
                        <ChevronLeft className="h-3 w-3" />
                        <ChevronLeft className="h-3 w-3 -ml-2" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={safePage === 1}
                        className="h-8 w-8 p-0"
                        title="Önceki sayfa"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      {/* Sayfa numaraları */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                          (p) =>
                            p === 1 ||
                            p === totalPages ||
                            Math.abs(p - safePage) <= 1,
                        )
                        .reduce((acc, p, idx, arr) => {
                          if (idx > 0 && p - arr[idx - 1] > 1)
                            acc.push("...");
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((item, idx) =>
                          item === "..." ? (
                            <span
                              key={`ellipsis-${idx}`}
                              className="px-1 text-muted-foreground text-sm"
                            >
                              …
                            </span>
                          ) : (
                            <Button
                              key={item}
                              variant={safePage === item ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(item)}
                              className="h-8 w-8 p-0 text-xs"
                            >
                              {item}
                            </Button>
                          ),
                        )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={safePage === totalPages}
                        className="h-8 w-8 p-0"
                        title="Sonraki sayfa"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={safePage === totalPages}
                        className="h-8 w-8 p-0"
                        title="Son sayfa"
                      >
                        <ChevronRight className="h-3 w-3" />
                        <ChevronRight className="h-3 w-3 -ml-2" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
