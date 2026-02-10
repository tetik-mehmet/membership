"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AddMemberDialog({ children, defaultOpen = false }) {
  const router = useRouter();
  const clearedUrlRef = useRef(false);
  const [open, setOpen] = useState(!!defaultOpen);

  useEffect(() => {
    if (defaultOpen && open && !clearedUrlRef.current) {
      clearedUrlRef.current = true;
      const url = new URL(window.location.href);
      url.searchParams.delete("open");
      const clean = url.pathname + (url.search ? url.search : "");
      window.history.replaceState({}, "", clean);
    }
  }, [defaultOpen, open]);
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    assignMembership: false,
    packageId: "",
    startDate: "",
  });

  // Dialog açıldığında aktif paketleri yükle
  useEffect(() => {
    const loadPackages = async () => {
      if (!open) return;
      setPackagesLoading(true);
      try {
        const res = await fetch("/api/packages?activeOnly=true");
        const data = await res.json();
        if (data.success) {
          setPackages(Array.isArray(data.data) ? data.data : []);
        } else {
          toast.error("Paketler yüklenemedi", {
            description:
              data.error || "Üyelik paketleri alınırken bir hata oluştu.",
          });
        }
      } catch (err) {
        console.error("Load packages error in dialog:", err);
        toast.error("Paketler yüklenemedi", {
          description: "Üyelik paketleri alınırken bir hata oluştu.",
        });
      } finally {
        setPackagesLoading(false);
      }
    };

    loadPackages();
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Üye formu verileri
    const memberPayload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
    };

    // Üyelik atama isteği için alanlar (isteğe bağlı)
    const shouldAssignMembership =
      formData.packageId && formData.startDate && formData.assignMembership;

    try {
      const response = await fetch("/api/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(memberPayload),
      });

      const data = await response.json();

      if (data.success) {
        const createdMember = data.data;

        // Eğer kullanıcı formda üyelik seçtiyse, aynı anda üyelik kaydı da oluştur
        if (shouldAssignMembership && createdMember?._id) {
          try {
            const membershipRes = await fetch("/api/memberships", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                memberId: createdMember._id,
                packageId: formData.packageId,
                startDate: formData.startDate,
              }),
            });

            const membershipData = await membershipRes.json();

            if (!membershipData.success) {
              toast.error("Üyelik atanamadı", {
                description:
                  membershipData.error ||
                  "Üyelik oluşturulurken bir sorun oluştu. Üyeyi üyelikler sayfasından manuel atayabilirsiniz.",
              });
            }
          } catch (membershipError) {
            console.error(
              "Membership create error in dialog:",
              membershipError
            );
            toast.error("Üyelik atanamadı", {
              description:
                "Üyelik oluşturulurken bir hata oluştu. Üyeyi üyelikler sayfasından manuel atayabilirsiniz.",
            });
          }
        }

        setOpen(false);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          assignMembership: false,
          packageId: "",
          startDate: "",
        });
        router.refresh();
        toast.success(
          shouldAssignMembership ? "Üye ve üyelik eklendi" : "Üye eklendi",
          {
            description: shouldAssignMembership
              ? "Yeni üye ve üyeliği başarıyla kaydedildi."
              : "Yeni üye başarıyla kaydedildi.",
          }
        );
      } else {
        toast.error("Üye eklenemedi", {
          description: data.error || "Lütfen bilgileri kontrol edin.",
        });
      }
    } catch (error) {
      console.error("Create member error in dialog:", error);
      toast.error("Bir hata oluştu", { description: "Lütfen tekrar deneyin." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni Üye Ekle</DialogTitle>
          <DialogDescription>Sisteme yeni bir üye ekleyin</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Ad *</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Soyad *</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Cep Telefonu</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="05XX XXX XX XX"
              disabled={loading}
            />
          </div>
          <div className="h-px bg-border my-2" />
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="assignMembership" className="font-medium">
                Bu üyeye hemen üyelik ata
              </Label>
              <Input
                id="assignMembership"
                type="checkbox"
                className="w-4 h-4"
                checked={!!formData.assignMembership}
                onChange={(e) => {
                  const checked = e.target.checked;
                  let startDate = formData.startDate;
                  if (checked && !startDate) {
                    const today = new Date();
                    const formatted = today.toISOString().slice(0, 10);
                    startDate = formatted;
                  }
                  setFormData({
                    ...formData,
                    assignMembership: checked,
                    startDate: checked ? startDate : "",
                  });
                }}
                disabled={loading}
              />
            </div>
            {formData.assignMembership && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="packageId">Üyelik Paketi *</Label>
                  <select
                    id="packageId"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.packageId || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, packageId: e.target.value })
                    }
                    disabled={loading || packagesLoading}
                    required
                  >
                    <option value="">Paket seçin</option>
                    {packages.map((pkg) => (
                      <option key={pkg._id} value={pkg._id}>
                        {pkg.name} ({pkg.durationInDays} gün -{" "}
                        {pkg.price?.toLocaleString("tr-TR")} ₺)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Başlangıç Tarihi *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            )}
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
            <Button type="submit" disabled={loading}>
              {loading ? "Ekleniyor..." : "Ekle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
