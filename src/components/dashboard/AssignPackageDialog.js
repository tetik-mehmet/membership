"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, ChevronDown, Check, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function AssignPackageDialog({
  members = [],
  packages = [],
  defaultOpen = false,
}) {
  const router = useRouter();
  const clearedUrlRef = useRef(false);
  const [open, setOpen] = useState(!!defaultOpen);
  const [loading, setLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberSelectOpen, setMemberSelectOpen] = useState(false);
  const memberDropdownRef = useRef(null);
  const memberSearchInputRef = useRef(null);
  const [formData, setFormData] = useState({
    memberId: "",
    packageId: "",
    startDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (defaultOpen && open && !clearedUrlRef.current) {
      clearedUrlRef.current = true;
      const url = new URL(window.location.href);
      url.searchParams.delete("open");
      const clean = url.pathname + (url.search ? url.search : "");
      window.history.replaceState({}, "", clean);
    }
  }, [defaultOpen, open]);

  const filteredMembers = (members || []).filter((member) => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return true;
    const fullName = `${member.firstName || ""} ${
      member.lastName || ""
    }`.toLowerCase();
    const email = (member.email || "").toLowerCase();
    return fullName.includes(q) || email.includes(q);
  });

  useEffect(() => {
    if (memberSelectOpen && memberSearchInputRef.current) {
      memberSearchInputRef.current.focus();
    } else {
      setMemberSearch("");
    }
  }, [memberSelectOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        memberDropdownRef.current &&
        !memberDropdownRef.current.contains(event.target)
      ) {
        setMemberSelectOpen(false);
      }
    }
    if (memberSelectOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [memberSelectOpen]);

  const selectedMember = (members || []).find(
    (m) => m._id === formData.memberId
  );
  const selectedMemberLabel = selectedMember
    ? `${selectedMember.firstName} ${selectedMember.lastName}`
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/memberships", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setOpen(false);
        setFormData({
          memberId: "",
          packageId: "",
          startDate: new Date().toISOString().split("T")[0],
        });
        router.refresh();
        toast.success("Üyelik atandı", {
          description: "Paket başarıyla üyeye atandı.",
        });
      } else {
        toast.error("Üyelik atanamadı", {
          description: data.error || "Lütfen bilgileri kontrol edin.",
        });
      }
    } catch (error) {
      toast.error("Bir hata oluştu", { description: "Lütfen tekrar deneyin." });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (nextOpen) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setMemberSelectOpen(false);
      setMemberSearch("");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity shrink-0 font-medium"
      >
        <Plus className="h-5 w-5" />
        Üyelik Ata
      </button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
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
              <div className="relative" ref={memberDropdownRef}>
                <button
                  type="button"
                  onClick={() => !loading && setMemberSelectOpen((v) => !v)}
                  disabled={loading}
                  className={cn(
                    "border-input flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    !selectedMemberLabel && "text-muted-foreground"
                  )}
                >
                  <span className="truncate">
                    {selectedMemberLabel || "Üye seçin"}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 opacity-50 transition-transform",
                      memberSelectOpen && "rotate-180"
                    )}
                  />
                </button>
                {memberSelectOpen && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
                    <div className="p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          ref={memberSearchInputRef}
                          type="text"
                          placeholder="Üye ara (ad, soyad veya e-posta)..."
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          className="h-8 pl-8 text-sm"
                        />
                      </div>
                    </div>
                    <div className="max-h-[220px] overflow-y-auto p-1">
                      {filteredMembers.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                          Eşleşen üye yok
                        </p>
                      ) : (
                        filteredMembers.map((member) => (
                          <button
                            key={member._id}
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                memberId: member._id,
                              });
                              setMemberSelectOpen(false);
                            }}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                              formData.memberId === member._id &&
                                "bg-accent text-accent-foreground"
                            )}
                          >
                            {formData.memberId === member._id && (
                              <Check className="h-4 w-4 shrink-0" />
                            )}
                            <span
                              className={
                                formData.memberId === member._id ? "" : "pl-6"
                              }
                            >
                              {member.firstName} {member.lastName}
                              {member.email && (
                                <span className="ml-1.5 text-muted-foreground">
                                  ({member.email})
                                </span>
                              )}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="packageId">Paket *</Label>
              <Select
                value={formData.packageId}
                onValueChange={(value) =>
                  setFormData({ ...formData, packageId: value })
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Paket seçin" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg._id} value={pkg._id}>
                      {pkg.name} - {pkg.durationInDays} gün -{" "}
                      {pkg.price.toLocaleString("tr-TR")} ₺
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
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
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
              <Button
                type="submit"
                disabled={loading || !formData.memberId || !formData.packageId}
              >
                {loading ? "Atanıyor..." : "Ata"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
