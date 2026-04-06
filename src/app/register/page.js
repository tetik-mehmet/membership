"use client";

import { useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // "success" | "error"
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) {
      setStatus("error");
      setErrorMessage("Lütfen tüm alanları eksiksiz doldurun.");
      return;
    }

    setLoading(true);
    setStatus(null);
    setErrorMessage("");

    try {
      const res = await fetch("/api/public/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Kayıt sırasında bir hata oluştu.");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Arka plan efekti */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/logo_montana.png"
            alt="Logo"
            width={140}
            height={140}
            className="object-contain drop-shadow-lg"
            priority
          />
        </div>

        {status === "success" ? (
          /* Başarı ekranı */
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center space-y-4 backdrop-blur-sm shadow-2xl">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-green-500/15 border border-green-500/30">
                <CheckCircle2 className="h-10 w-10 text-green-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">
                Kaydınız Alındı!
              </h2>
              <p className="text-sm text-white/60 leading-relaxed">
                Üyelik başvurunuz başarıyla alındı.
              </p>
            </div>
          </div>
        ) : (
          /* Kayıt formu */
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-2xl space-y-6">
            <div className="text-center space-y-1">
              <h1 className="text-xl font-bold text-white">Üye Ol</h1>
              <p className="text-sm text-white/50">
                Bilgilerinizi doldurun, kaydınızı tamamlayalım
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Ad - Soyad */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-white/70 text-xs font-medium">
                    Ad <span className="text-red-400">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="Adınız"
                      value={form.firstName}
                      onChange={handleChange}
                      disabled={loading}
                      autoComplete="given-name"
                      className="pl-8 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-primary/50 focus-visible:border-primary/50 h-10 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-white/70 text-xs font-medium">
                    Soyad <span className="text-red-400">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Soyadınız"
                      value={form.lastName}
                      onChange={handleChange}
                      disabled={loading}
                      autoComplete="family-name"
                      className="pl-8 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-primary/50 focus-visible:border-primary/50 h-10 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Telefon */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-white/70 text-xs font-medium">
                  Telefon Numarası <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="5xx xxx xx xx"
                    value={form.phone}
                    onChange={handleChange}
                    disabled={loading}
                    autoComplete="tel"
                    className="pl-8 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-primary/50 focus-visible:border-primary/50 h-10 text-sm"
                  />
                </div>
              </div>

              {/* Hata mesajı */}
              {status === "error" && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Kaydol butonu */}
              <Button
                type="submit"
                className="w-full h-11 font-semibold text-sm mt-2 bg-emerald-600 hover:bg-emerald-500 text-white border-0"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  "Kaydol"
                )}
              </Button>
            </form>
          </div>
        )}

        <p className="text-center text-xs text-white/25">
          Bilgileriniz güvenle saklanmakta olup üçüncü şahıslarla paylaşılmaz.
        </p>
      </div>
    </div>
  );
}
