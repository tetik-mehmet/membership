"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EditMemberDialog({
  member,
  open,
  onOpenChange,
  onSuccess,
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (member) {
      setFormData({
        firstName: member.firstName || "",
        lastName: member.lastName || "",
        email: member.email || "",
        phone: member.phone || "",
      });
    }
  }, [member]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!member?._id) return;
    setLoading(true);

    try {
      // Phone alanını her zaman gönder (boş string olsa bile)
      const submitData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email?.trim() || "",
        phone: formData.phone?.trim() || "", // Phone alanını MUTLAKA gönder
      };

      const response = await fetch(`/api/members/${member._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (data.success && data.data) {
        onOpenChange(false);
        // Güncellenmiş üye verisini onSuccess callback'ine gönder
        const updatedMember = {
          ...data.data,
          phone: data.data.phone || submitData.phone || "",
        };
        onSuccess?.(updatedMember);
        router.refresh();
        toast.success("Üye güncellendi", {
          description: "Üye bilgileri başarıyla kaydedildi.",
        });
      } else {
        toast.error("Güncellenemedi", {
          description: data.error || "Lütfen bilgileri kontrol edin.",
        });
      }
    } catch (error) {
      toast.error("Bir hata oluştu", { description: "Lütfen tekrar deneyin." });
    } finally {
      setLoading(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Üye Düzenle</DialogTitle>
          <DialogDescription>Üye bilgilerini güncelleyin</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-firstName">Ad *</Label>
            <Input
              id="edit-firstName"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-lastName">Soyad *</Label>
            <Input
              id="edit-lastName"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">E-posta</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-phone">Cep Telefonu</Label>
            <Input
              id="edit-phone"
              type="tel"
              value={formData.phone || ""}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="05XX XXX XX XX"
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
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
