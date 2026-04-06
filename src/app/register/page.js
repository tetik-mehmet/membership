"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, UserPlus, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      setErrorMessage("Lütfen tüm alanları doldurun.");
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
        setForm({ firstName: "", lastName: "", phone: "" });
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

  if (status === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardContent className="pt-10 pb-10 px-8 space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Kaydınız Alındı!
            </h2>
            <p className="text-muted-foreground">
              Üyelik başvurunuz başarıyla alındı. En kısa sürede sizi
              arayacağız.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setStatus(null)}
            >
              Yeni Kayıt
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Üst başlık */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Üye Ol</h1>
          <p className="text-muted-foreground text-sm">
            Bilgilerinizi doldurun, kaydınızı tamamlayalım
          </p>
        </div>

        {/* Form kartı */}
        <Card className="shadow-lg border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Kişisel Bilgiler</CardTitle>
            <CardDescription>
              Tüm alanları eksiksiz doldurun
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    Ad <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="Adınız"
                    value={form.firstName}
                    onChange={handleChange}
                    disabled={loading}
                    autoComplete="given-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Soyad <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Soyadınız"
                    value={form.lastName}
                    onChange={handleChange}
                    disabled={loading}
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Telefon Numarası <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="05xx xxx xx xx"
                  value={form.phone}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="tel"
                />
              </div>

              {status === "error" && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
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
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Bilgileriniz güvenle saklanmakta olup üçüncü şahıslarla paylaşılmaz.
        </p>
      </div>
    </div>
  );
}
