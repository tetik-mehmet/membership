"use client";

import { useEffect, useState, useRef } from "react";
import {
  X,
  Package,
  Phone,
  MessageCircle,
  CreditCard,
  Calendar,
  Upload,
  ImageIcon,
  Camera,
  Trash2,
} from "lucide-react";
import { differenceInDays, startOfDay } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

function getDaysRemaining(endDate) {
  const end = startOfDay(new Date(endDate));
  const today = startOfDay(new Date());
  return differenceInDays(end, today);
}

function toWhatsAppHref(phone) {
  if (!phone || typeof phone !== "string") return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return null;
  const withCountry =
    digits.length === 10 && digits.startsWith("5")
      ? `90${digits}`
      : digits.startsWith("90")
      ? digits
      : digits;
  return `https://wa.me/${withCountry}`;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function MemberQuickInfoDrawer({
  open,
  onOpenChange,
  membership,
  onPhotoUpdate,
}) {
  const [uploadLoading, setUploadLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!cameraOpen) return;
    const video = videoRef.current;
    if (!video) return;
    setCameraError(null);
    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      .then((stream) => {
        streamRef.current = stream;
        video.srcObject = stream;
        return video.play();
      })
      .catch((err) => {
        setCameraError(err?.message || "Kamera açılamadı");
        setCameraOpen(false);
        toast.error("Kamera erişilemedi. İzin verdiğinizden emin olun.");
      });
    return () => {
      streamRef.current?.getTracks?.().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [cameraOpen]);

  if (!membership) return null;

  const member = membership.memberId || {};
  const pkg = membership.packageId || {};
  const memberId = member._id;
  const firstName = member.firstName?.trim() || "";
  const lastName = member.lastName?.trim() || "";
  const fullName = `${firstName} ${lastName}`.trim() || "—";
  const initials =
    [firstName.charAt(0), lastName.charAt(0)]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "?";
  const photoUrl = member.photoUrl?.trim() || null;
  const phone = member.phone?.trim() || "";
  const paymentStatus = member.paymentStatus || "unpaid";
  const packageName = pkg.name || "Paket bilinmiyor";
  const durationInDays = pkg.durationInDays ?? 0;
  const endDate = membership.endDate ? new Date(membership.endDate) : null;
  const isActive =
    membership.status === "active" && endDate && endDate >= new Date();
  const daysRemaining =
    endDate && isActive ? getDaysRemaining(membership.endDate) : 0;
  const totalDays = durationInDays || 1;
  const remainingPercent = isActive
    ? Math.min(100, Math.max(0, (daysRemaining / totalDays) * 100))
    : 0;
  const whatsappHref = toWhatsAppHref(phone);

  const validateFile = (file) => {
    if (!file?.type || !ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Sadece JPEG, PNG veya WebP yükleyebilirsiniz.");
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Dosya boyutu 5 MB'dan küçük olmalı.");
      return false;
    }
    return true;
  };

  const uploadPhoto = async (file) => {
    if (!memberId || !file || !validateFile(file)) return;
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch(`/api/members/${memberId}/photo`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Yükleme başarısız.");
        return;
      }
      toast.success("Fotoğraf yüklendi.");
      onPhotoUpdate?.(memberId, data.photoUrl);
    } catch {
      toast.error("Yükleme sırasında hata oluştu.");
    } finally {
      setUploadLoading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) uploadPhoto(file);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = () => setDragActive(false);

  const onFileChange = (e) => {
    const file = e.target?.files?.[0];
    if (file) uploadPhoto(file);
    e.target.value = "";
  };

  const openCamera = () => {
    setCameraError(null);
    setCameraOpen(true);
  };

  const closeCamera = () => {
    streamRef.current?.getTracks?.().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
    setCameraError(null);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      toast.error("Video hazır değil.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error("Fotoğraf alınamadı.");
          return;
        }
        const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
        closeCamera();
        uploadPhoto(file);
      },
      "image/jpeg",
      0.9
    );
  };

  const deletePhoto = async () => {
    if (!memberId || !photoUrl) return;
    if (!confirm("Bu fotoğrafı silmek istediğinize emin misiniz?")) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/members/${memberId}/photo`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Fotoğraf silinemedi.");
        return;
      }
      toast.success("Fotoğraf silindi.");
      onPhotoUpdate?.(memberId, null);
    } catch {
      toast.error("Silme sırasında hata oluştu.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Kapat"
        onClick={() => onOpenChange(false)}
        onKeyDown={(e) => e.key === "Escape" && onOpenChange(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ease-out",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      {/* Panel */}
      <aside
        aria-hidden={!open}
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l bg-background shadow-xl transition-transform duration-300 ease-out",
          "flex flex-col",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b px-4 py-4">
          <h2 className="text-lg font-semibold text-foreground">Üye Bilgisi</h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Üye adı + avatar */}
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-base font-semibold text-muted-foreground">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">{fullName}</p>
              {member.email && (
                <p className="text-sm text-muted-foreground truncate">
                  {member.email}
                </p>
              )}
            </div>
          </div>

          {/* Fotoğraf yükleme */}
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
              <ImageIcon className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">Üye fotoğrafı</span>
            </div>
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={cn(
                "relative rounded-lg border-2 border-dashed p-4 text-center transition-colors",
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 bg-muted/30 hover:border-muted-foreground/50",
                uploadLoading && "pointer-events-none opacity-70"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={uploadLoading}
                onChange={onFileChange}
              />
              {uploadLoading ? (
                <p className="text-sm text-muted-foreground">Yükleniyor...</p>
              ) : (
                <>
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-foreground font-medium mb-1">
                    Sürükleyip bırakın veya
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-primary font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
                  >
                    Dosyadan seç
                  </button>
                  <p className="text-xs text-muted-foreground mt-2">
                    JPEG, PNG veya WebP — en fazla 5 MB
                  </p>
                  <div className="mt-3 pt-3 border-t border-border">
                    <button
                      type="button"
                      onClick={openCamera}
                      disabled={uploadLoading}
                      className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-md bg-gradient-to-r from-orange-400 to-amber-500 text-white font-medium shadow-sm hover:from-orange-500 hover:to-amber-600 hover:shadow transition-all disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <Camera className="h-5 w-5" />
                      Fotoğraf çek
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Paket türü */}
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
              <Package className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">Paket</span>
            </div>
            <p className="text-foreground font-medium">{packageName}</p>
            {pkg.durationInDays != null && (
              <p className="text-sm text-muted-foreground">
                {pkg.durationInDays} gün
              </p>
            )}
          </div>

          {/* Kalan gün + progress bar */}
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
              <Calendar className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">Kalan süre</span>
            </div>
            {isActive ? (
              <>
                <p className="text-foreground font-medium mb-2">
                  {daysRemaining === 0
                    ? "Bugün bitiyor"
                    : daysRemaining === 1
                    ? "1 gün kaldı"
                    : `${daysRemaining} gün kaldı`}
                </p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${remainingPercent}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                {membership.status === "cancelled"
                  ? "İptal edildi"
                  : "Süresi doldu"}
              </p>
            )}
          </div>

          {/* Telefon / WhatsApp */}
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
              <Phone className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">İletişim</span>
            </div>
            {phone ? (
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`tel:${phone}`}
                  className="text-foreground font-medium hover:underline"
                >
                  {phone}
                </a>
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#25D366] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#20BD5A]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Telefon yok</p>
            )}
          </div>

          {/* Ödeme durumu */}
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
              <CreditCard className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">Ödeme durumu</span>
            </div>
            <Badge
              variant={paymentStatus === "paid" ? "default" : "destructive"}
            >
              {paymentStatus === "paid" ? "Ödendi" : "Ödenmedi"}
            </Badge>
          </div>

          {/* Yüklenen fotoğraf (büyük gösterim) + sil butonu */}
          {photoUrl && (
            <div className="pt-2 space-y-3">
              <img
                src={photoUrl}
                alt={fullName}
                className="w-full max-w-[280px] mx-auto rounded-xl object-cover aspect-square border border-border shadow-sm"
              />
              <button
                type="button"
                onClick={deletePhoto}
                disabled={deleteLoading}
                className="w-full max-w-[280px] mx-auto flex items-center justify-center gap-2 py-2.5 rounded-md border border-destructive/50 text-destructive font-medium hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                <Trash2 className="h-4 w-4" />
                {deleteLoading ? "Siliniyor..." : "Fotoğrafı sil"}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Kamera modalı */}
      {cameraOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80"
          onClick={closeCamera}
        >
          <div
            className="relative w-full max-w-lg rounded-xl overflow-hidden bg-background shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[4/3] bg-muted">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-muted-foreground text-sm">
                  {cameraError}
                </div>
              )}
            </div>
            <div className="flex gap-3 p-4 border-t border-border">
              <button
                type="button"
                onClick={closeCamera}
                className="flex-1 py-2.5 rounded-md border border-border bg-background font-medium hover:bg-muted transition-colors"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                disabled={cameraError || uploadLoading}
                className="flex-1 py-2.5 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Camera className="h-5 w-5" />
                Çek
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
