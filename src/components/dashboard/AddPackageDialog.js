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

export default function AddPackageDialog({ children, defaultOpen = false }) {
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
  const [formData, setFormData] = useState({
    name: "",
    durationInDays: "",
    price: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/packages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          durationInDays: parseInt(formData.durationInDays),
          price: parseFloat(formData.price),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOpen(false);
        setFormData({ name: "", durationInDays: "", price: "" });
        router.refresh();
        toast.success("Paket eklendi", {
          description: "Yeni üyelik paketi oluşturuldu.",
        });
      } else {
        toast.error("Paket eklenemedi", {
          description: data.error || "Lütfen bilgileri kontrol edin.",
        });
      }
    } catch (error) {
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
          <DialogTitle>Yeni Paket Ekle</DialogTitle>
          <DialogDescription>
            Yeni bir üyelik paketi oluşturun
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Paket Adı *</Label>
            <Input
              id="name"
              placeholder="Örn: Aylık, 5 Aylık, Yıllık"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="durationInDays">Süre (Gün) *</Label>
            <Input
              id="durationInDays"
              type="number"
              min="1"
              placeholder="30"
              value={formData.durationInDays}
              onChange={(e) =>
                setFormData({ ...formData, durationInDays: e.target.value })
              }
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Fiyat (₺) *</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="500"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
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
            <Button type="submit" disabled={loading}>
              {loading ? "Ekleniyor..." : "Ekle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
