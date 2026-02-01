'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Giriş başarılı', { description: 'Yönlendiriliyorsunuz...' });
        router.push('/dashboard');
        router.refresh();
      } else {
        const msg = data.error || 'Giriş başarısız';
        setError(msg);
        toast.error('Giriş başarısız', { description: msg });
      }
    } catch (err) {
      const msg = 'Bir hata oluştu. Lütfen tekrar deneyin.';
      setError(msg);
      toast.error('Hata', { description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username" className="text-stone-300 text-sm font-medium">
          Kullanıcı Adı
        </Label>
        <Input
          id="username"
          type="text"
          placeholder="admin"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          required
          disabled={loading}
          className="bg-stone-900/60 border-stone-600/50 text-stone-100 placeholder:text-stone-500 focus-visible:border-amber-500/80 focus-visible:ring-amber-500/30 transition-all duration-300 rounded-lg h-10"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-stone-300 text-sm font-medium">
          Şifre
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          disabled={loading}
          className="bg-stone-900/60 border-stone-600/50 text-stone-100 placeholder:text-stone-500 focus-visible:border-amber-500/80 focus-visible:ring-amber-500/30 transition-all duration-300 rounded-lg h-10"
        />
      </div>
      {error && (
        <div className="text-sm text-amber-200 bg-amber-950/40 border border-amber-700/50 rounded-lg p-3 animate-in fade-in duration-200">
          {error}
        </div>
      )}
      <Button
        type="submit"
        className="w-full h-11 rounded-lg font-medium bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 shadow-lg shadow-amber-900/30 hover:shadow-amber-700/40 focus-visible:ring-amber-500/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        disabled={loading}
      >
        {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
      </Button>
    </form>
  );
}
