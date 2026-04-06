"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  UserPlus,
  Users,
  Eye,
  EyeOff,
  User,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  QrCode,
} from "lucide-react";
import QRCodeCard from "@/components/dashboard/QRCodeCard";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [addAdminLoading, setAddAdminLoading] = useState(false);
  const [currentUsername, setCurrentUsername] = useState("");
  const [lastUpdate, setLastUpdate] = useState(null);

  // Şifre görünürlük state'leri
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showAdminConfirmPassword, setShowAdminConfirmPassword] =
    useState(false);

  const [addAdminForm, setAddAdminForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [formData, setFormData] = useState({
    currentPassword: "",
    newUsername: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [adminCount, setAdminCount] = useState(null);
  const [adminUsernames, setAdminUsernames] = useState([]);

  // Şifre güçlülük hesaplama
  const calculatePasswordStrength = (password) => {
    if (!password) return { strength: 0, label: "", color: "" };

    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;

    if (strength <= 2) {
      return { strength, label: "Zayıf", color: "bg-red-500" };
    } else if (strength <= 4) {
      return { strength, label: "Orta", color: "bg-yellow-500" };
    } else {
      return { strength, label: "Güçlü", color: "bg-green-500" };
    }
  };

  const fetchAdminCount = async () => {
    try {
      const res = await fetch("/api/auth/admins", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setAdminCount(data.data.count);
        setAdminUsernames(data.data.usernames || []);
      }
    } catch {
      setAdminCount(0);
      setAdminUsernames([]);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json();
      if (data.success && data.data) {
        setCurrentUsername(data.data.username || "Admin");
      }
    } catch {
      setCurrentUsername("Admin");
    }
  };

  useEffect(() => {
    fetchAdminCount();
    fetchCurrentUser();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { currentPassword, newUsername, newPassword, confirmPassword } =
      formData;

    if (!currentPassword) {
      toast.error("Mevcut şifre gerekli", {
        description: "Değişiklik yapmak için mevcut şifrenizi girin.",
      });
      return;
    }

    if (!newUsername?.trim() && !newPassword) {
      toast.error("Değişiklik gerekli", {
        description: "Yeni kullanıcı adı veya şifre girin.",
      });
      return;
    }

    if (newPassword && newPassword.length < 6) {
      toast.error("Şifre çok kısa", {
        description: "Yeni şifre en az 6 karakter olmalıdır.",
      });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      toast.error("Şifreler eşleşmiyor", {
        description: "Yeni şifre ve tekrar alanları aynı olmalıdır.",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/change-credentials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newUsername: newUsername?.trim() || undefined,
          newPassword: newPassword || undefined,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        setFormData({
          currentPassword: "",
          newUsername: "",
          newPassword: "",
          confirmPassword: "",
        });
        setLastUpdate(new Date());
        fetchCurrentUser();
        toast.success("Bilgiler güncellendi", {
          description: "Kullanıcı adı veya şifreniz başarıyla değiştirildi.",
        });
        router.refresh();
      } else {
        toast.error("Güncelleme başarısız", {
          description: data.error || "Lütfen tekrar deneyin.",
        });
      }
    } catch (error) {
      toast.error("Bir hata oluştu", {
        description: "Lütfen bağlantınızı kontrol edin ve tekrar deneyin.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    const { username, password, confirmPassword } = addAdminForm;

    if (!username?.trim()) {
      toast.error("Kullanıcı adı gerekli", {
        description: "Yeni admin için kullanıcı adı girin.",
      });
      return;
    }

    if (!password || password.length < 6) {
      toast.error("Şifre çok kısa", {
        description: "Şifre en az 6 karakter olmalıdır.",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Şifreler eşleşmiyor", {
        description: "Şifre ve tekrar alanları aynı olmalıdır.",
      });
      return;
    }

    setAddAdminLoading(true);
    try {
      const response = await fetch("/api/auth/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        setAddAdminForm({ username: "", password: "", confirmPassword: "" });
        fetchAdminCount();
        toast.success("Admin eklendi", {
          description: `${data.data.username} sisteme giriş yapabilir.`,
        });
        router.refresh();
      } else {
        toast.error("Admin eklenemedi", {
          description: data.error || "Lütfen tekrar deneyin.",
        });
      }
    } catch (error) {
      toast.error("Bir hata oluştu", {
        description: "Lütfen bağlantınızı kontrol edin ve tekrar deneyin.",
      });
    } finally {
      setAddAdminLoading(false);
    }
  };

  const passwordStrength = calculatePasswordStrength(formData.newPassword);
  const adminPasswordStrength = calculatePasswordStrength(
    addAdminForm.password
  );
  const passwordsMatch =
    formData.newPassword &&
    formData.confirmPassword &&
    formData.newPassword === formData.confirmPassword;
  const adminPasswordsMatch =
    addAdminForm.password &&
    addAdminForm.confirmPassword &&
    addAdminForm.password === addAdminForm.confirmPassword;

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Hesap Ayarları</h1>
          <p className="text-muted-foreground mt-2">
            Bilgilerinizi güncelleyin veya yeni admin kullanıcıları ekleyin
          </p>
        </div>
      </div>

      {/* Profil Bilgileri Kartı */}
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-shrink-0 p-3 rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/20">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl mb-1">Profil Bilgileri</CardTitle>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Kullanıcı Adı:
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-base font-semibold"
                  >
                    {currentUsername || "Yükleniyor..."}
                  </Badge>
                </div>
                {lastUpdate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Son güncelleme:{" "}
                      {new Date(lastUpdate).toLocaleString("tr-TR")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Sekmeler */}
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full sm:w-auto grid-cols-3 mb-6">
          <TabsTrigger value="account" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Hesap Ayarları</span>
            <span className="sm:hidden">Hesap</span>
          </TabsTrigger>
          <TabsTrigger value="admin" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Admin Yönetimi</span>
            <span className="sm:hidden">Admin</span>
          </TabsTrigger>
          <TabsTrigger value="qr" className="gap-2">
            <QrCode className="h-4 w-4" />
            <span className="hidden sm:inline">QR Kayıt</span>
            <span className="sm:hidden">QR</span>
          </TabsTrigger>
        </TabsList>

        {/* Hesap Ayarları Sekmesi */}
        <TabsContent value="account" className="space-y-6 mt-0">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 border-b border-blue-200/50 dark:border-blue-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                  <KeyRound className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-foreground">
                    Bilgileri Güncelle
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Değişiklik yapmak için mevcut şifrenizi girin. Sadece
                    değiştirmek istediğiniz alanları doldurun.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="currentPassword"
                    className="flex items-center gap-2"
                  >
                    Mevcut Şifre <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.currentPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currentPassword: e.target.value,
                        })
                      }
                      required
                      disabled={loading}
                      className="bg-background pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      disabled={loading}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newUsername">Yeni Kullanıcı Adı</Label>
                  <Input
                    id="newUsername"
                    type="text"
                    placeholder="Yeni kullanıcı adı"
                    value={formData.newUsername}
                    onChange={(e) =>
                      setFormData({ ...formData, newUsername: e.target.value })
                    }
                    disabled={loading}
                    autoComplete="username"
                    className="bg-background"
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Boş bırakırsanız kullanıcı adı değişmez
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Yeni Şifre</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.newPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          newPassword: e.target.value,
                        })
                      }
                      disabled={loading}
                      autoComplete="new-password"
                      minLength={6}
                      className="bg-background pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      disabled={loading}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {formData.newPassword && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Şifre Gücü:
                        </span>
                        <span
                          className={`font-medium ${
                            passwordStrength.strength <= 2
                              ? "text-red-500"
                              : passwordStrength.strength <= 4
                              ? "text-yellow-500"
                              : "text-green-500"
                          }`}
                        >
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{
                            width: `${(passwordStrength.strength / 6) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    En az 6 karakter. Boş bırakırsanız şifre değişmez
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      disabled={loading}
                      autoComplete="new-password"
                      className={`bg-background pr-10 ${
                        formData.confirmPassword && formData.newPassword
                          ? passwordsMatch
                            ? "border-green-500/50 focus-visible:ring-green-500/20"
                            : "border-red-500/50 focus-visible:ring-red-500/20"
                          : ""
                      }`}
                    />
                    <div className="absolute right-10 top-1/2 -translate-y-1/2">
                      {formData.confirmPassword &&
                        formData.newPassword &&
                        (passwordsMatch ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ))}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {formData.confirmPassword &&
                    formData.newPassword &&
                    !passwordsMatch && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Şifreler eşleşmiyor
                      </p>
                    )}
                  {formData.confirmPassword &&
                    formData.newPassword &&
                    passwordsMatch && (
                      <p className="text-xs text-green-500 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Şifreler eşleşiyor
                      </p>
                    )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? "Güncelleniyor..." : "Güncelle"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Yönetimi Sekmesi */}
        <TabsContent value="admin" className="space-y-6 mt-0">
          {/* Admin İstatistikleri */}
          {adminCount !== null && (
            <Card className="overflow-hidden border-primary/20">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-950/40 dark:to-purple-900/20 border-b border-purple-200/50 dark:border-purple-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40">
                    <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-foreground">
                      Admin İstatistikleri
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Sistemdeki admin kullanıcı sayısı
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-muted/50 dark:bg-muted/20 border border-border/50">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-purple-100 dark:bg-purple-900/40">
                    <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Toplam Admin
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {adminCount}
                    </p>
                  </div>
                  {adminUsernames.length > 0 && (
                    <div className="w-full sm:w-auto flex flex-wrap items-center gap-2">
                      <span className="text-sm text-muted-foreground shrink-0">
                        Kullanıcılar:
                      </span>
                      {adminUsernames.map((name) => (
                        <Badge
                          key={name}
                          variant="secondary"
                          className="font-mono text-xs"
                        >
                          {name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Yeni Admin Ekleme Formu */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border-b border-emerald-200/50 dark:border-emerald-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                  <UserPlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-foreground">
                    Yeni Admin Ekle
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Sisteme giriş yapabilecek yeni admin kullanıcısı oluşturun
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleAddAdmin} className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="newAdminUsername"
                    className="flex items-center gap-2"
                  >
                    Kullanıcı Adı <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="newAdminUsername"
                    type="text"
                    placeholder="admin2"
                    value={addAdminForm.username}
                    onChange={(e) =>
                      setAddAdminForm({
                        ...addAdminForm,
                        username: e.target.value,
                      })
                    }
                    disabled={addAdminLoading}
                    autoComplete="off"
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="newAdminPassword"
                    className="flex items-center gap-2"
                  >
                    Şifre <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="newAdminPassword"
                      type={showAdminPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={addAdminForm.password}
                      onChange={(e) =>
                        setAddAdminForm({
                          ...addAdminForm,
                          password: e.target.value,
                        })
                      }
                      disabled={addAdminLoading}
                      autoComplete="new-password"
                      minLength={6}
                      className="bg-background pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      disabled={addAdminLoading}
                    >
                      {showAdminPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {addAdminForm.password && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Şifre Gücü:
                        </span>
                        <span
                          className={`font-medium ${
                            adminPasswordStrength.strength <= 2
                              ? "text-red-500"
                              : adminPasswordStrength.strength <= 4
                              ? "text-yellow-500"
                              : "text-green-500"
                          }`}
                        >
                          {adminPasswordStrength.label}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${adminPasswordStrength.color}`}
                          style={{
                            width: `${
                              (adminPasswordStrength.strength / 6) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    En az 6 karakter
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="newAdminConfirmPassword"
                    className="flex items-center gap-2"
                  >
                    Şifre (Tekrar) <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="newAdminConfirmPassword"
                      type={showAdminConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={addAdminForm.confirmPassword}
                      onChange={(e) =>
                        setAddAdminForm({
                          ...addAdminForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      disabled={addAdminLoading}
                      autoComplete="new-password"
                      className={`bg-background pr-10 ${
                        addAdminForm.confirmPassword && addAdminForm.password
                          ? adminPasswordsMatch
                            ? "border-green-500/50 focus-visible:ring-green-500/20"
                            : "border-red-500/50 focus-visible:ring-red-500/20"
                          : ""
                      }`}
                    />
                    <div className="absolute right-10 top-1/2 -translate-y-1/2">
                      {addAdminForm.confirmPassword &&
                        addAdminForm.password &&
                        (adminPasswordsMatch ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ))}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() =>
                        setShowAdminConfirmPassword(!showAdminConfirmPassword)
                      }
                      disabled={addAdminLoading}
                    >
                      {showAdminConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {addAdminForm.confirmPassword &&
                    addAdminForm.password &&
                    !adminPasswordsMatch && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Şifreler eşleşmiyor
                      </p>
                    )}
                  {addAdminForm.confirmPassword &&
                    addAdminForm.password &&
                    adminPasswordsMatch && (
                      <p className="text-xs text-green-500 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Şifreler eşleşiyor
                      </p>
                    )}
                </div>

                <Button
                  type="submit"
                  disabled={addAdminLoading}
                  className="w-full sm:w-auto"
                >
                  {addAdminLoading ? "Ekleniyor..." : "Admin Ekle"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* QR Kayıt Sekmesi */}
        <TabsContent value="qr" className="space-y-6 mt-0">
          <QRCodeCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
