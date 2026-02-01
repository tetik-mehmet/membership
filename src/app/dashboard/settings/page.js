'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { UserPlus, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [addAdminLoading, setAddAdminLoading] = useState(false);
  const [addAdminForm, setAddAdminForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [formData, setFormData] = useState({
    currentPassword: '',
    newUsername: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [adminCount, setAdminCount] = useState(null);

  const fetchAdminCount = async () => {
    try {
      const res = await fetch('/api/auth/admins', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setAdminCount(data.data.count);
    } catch {
      setAdminCount(0);
    }
  };

  useEffect(() => {
    fetchAdminCount();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { currentPassword, newUsername, newPassword, confirmPassword } = formData;

    if (!currentPassword) {
      toast.error('Mevcut şifre gerekli', { description: 'Değişiklik yapmak için mevcut şifrenizi girin.' });
      return;
    }

    if (!newUsername?.trim() && !newPassword) {
      toast.error('Değişiklik gerekli', { description: 'Yeni kullanıcı adı veya şifre girin.' });
      return;
    }

    if (newPassword && newPassword.length < 6) {
      toast.error('Şifre çok kısa', { description: 'Yeni şifre en az 6 karakter olmalıdır.' });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      toast.error('Şifreler eşleşmiyor', { description: 'Yeni şifre ve tekrar alanları aynı olmalıdır.' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/change-credentials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newUsername: newUsername?.trim() || undefined,
          newPassword: newPassword || undefined,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        setFormData({
          currentPassword: '',
          newUsername: '',
          newPassword: '',
          confirmPassword: '',
        });
        toast.success('Bilgiler güncellendi', {
          description: 'Kullanıcı adı veya şifreniz başarıyla değiştirildi.',
        });
        router.refresh();
      } else {
        toast.error('Güncelleme başarısız', {
          description: data.error || 'Lütfen tekrar deneyin.',
        });
      }
    } catch (error) {
      toast.error('Bir hata oluştu', {
        description: 'Lütfen bağlantınızı kontrol edin ve tekrar deneyin.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    const { username, password, confirmPassword } = addAdminForm;

    if (!username?.trim()) {
      toast.error('Kullanıcı adı gerekli', {
        description: 'Yeni admin için kullanıcı adı girin.',
      });
      return;
    }

    if (!password || password.length < 6) {
      toast.error('Şifre çok kısa', {
        description: 'Şifre en az 6 karakter olmalıdır.',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Şifreler eşleşmiyor', {
        description: 'Şifre ve tekrar alanları aynı olmalıdır.',
      });
      return;
    }

    setAddAdminLoading(true);
    try {
      const response = await fetch('/api/auth/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        setAddAdminForm({ username: '', password: '', confirmPassword: '' });
        fetchAdminCount();
        toast.success('Admin eklendi', {
          description: `${data.data.username} sisteme giriş yapabilir.`,
        });
        router.refresh();
      } else {
        toast.error('Admin eklenemedi', {
          description: data.error || 'Lütfen tekrar deneyin.',
        });
      }
    } catch (error) {
      toast.error('Bir hata oluştu', {
        description: 'Lütfen bağlantınızı kontrol edin ve tekrar deneyin.',
      });
    } finally {
      setAddAdminLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Hesap Ayarları</h1>
          <p className="text-muted-foreground mt-2">
            Bilgilerinizi güncelleyin veya yeni admin kullanıcıları ekleyin
          </p>
        </div>
        {adminCount !== null && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/60 border border-border shrink-0">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Toplam {adminCount} admin
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        <Card>
          <CardHeader>
            <CardTitle>Bilgileri Güncelle</CardTitle>
            <CardDescription>
              Değişiklik yapmak için mevcut şifrenizi girin. Sadece değiştirmek istediğiniz alanları doldurun.
            </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mevcut Şifre *</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="••••••••"
                value={formData.currentPassword}
                onChange={(e) =>
                  setFormData({ ...formData, currentPassword: e.target.value })
                }
                required
                disabled={loading}
                className="bg-background"
              />
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
              <p className="text-xs text-muted-foreground">
                Boş bırakırsanız kullanıcı adı değişmez
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Yeni Şifre</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
                disabled={loading}
                autoComplete="new-password"
                minLength={6}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                En az 6 karakter. Boş bırakırsanız şifre değişmez
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                disabled={loading}
                autoComplete="new-password"
                className="bg-background"
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? 'Güncelleniyor...' : 'Güncelle'}
            </Button>
          </form>
        </CardContent>
      </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              <CardTitle>Yeni Admin Ekle</CardTitle>
            </div>
            <CardDescription>
              Sisteme giriş yapabilecek yeni admin kullanıcısı oluşturun
            </CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleAddAdmin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="newAdminUsername">Kullanıcı Adı *</Label>
              <Input
                id="newAdminUsername"
                type="text"
                placeholder="admin2"
                value={addAdminForm.username}
                onChange={(e) =>
                  setAddAdminForm({ ...addAdminForm, username: e.target.value })
                }
                disabled={addAdminLoading}
                autoComplete="off"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newAdminPassword">Şifre *</Label>
              <Input
                id="newAdminPassword"
                type="password"
                placeholder="••••••••"
                value={addAdminForm.password}
                onChange={(e) =>
                  setAddAdminForm({ ...addAdminForm, password: e.target.value })
                }
                disabled={addAdminLoading}
                autoComplete="new-password"
                minLength={6}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                En az 6 karakter
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newAdminConfirmPassword">Şifre (Tekrar) *</Label>
              <Input
                id="newAdminConfirmPassword"
                type="password"
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
                className="bg-background"
              />
            </div>
            <Button type="submit" disabled={addAdminLoading}>
              {addAdminLoading ? 'Ekleniyor...' : 'Admin Ekle'}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
