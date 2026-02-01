import Image from 'next/image';
import LoginForm from '@/components/LoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 sm:p-6">
      {/* Lüks arka plan – koyu tonlar ve altın geçişler */}
      <div
        className="absolute inset-0 bg-[linear-gradient(135deg,_#0c0a09_0%,_#1c1917_30%,_#292524_60%,_#0c0a09_100%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,_rgba(212,175,55,0.25),_transparent)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_60%_40%_at_80%_50%,_rgba(212,175,55,0.15),_transparent_50%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_50%_30%_at_20%_80%,_rgba(212,175,55,0.12),_transparent_50%)]"
        aria-hidden
      />
      {/* İnce altın çizgi dekorasyonu */}
      <div
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent"
        aria-hidden
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent"
        aria-hidden
      />

      <div className="absolute top-4 right-4 z-10 opacity-90 hover:opacity-100 transition-opacity">
        <ThemeToggle />
      </div>

      <Card
        className="relative w-full max-w-md border-2 border-amber-500/30 bg-stone-950/90 backdrop-blur-xl shadow-2xl shadow-amber-950/20 rounded-2xl overflow-hidden animate-login-fade-in-up animate-login-glow"
        style={{ animationDelay: '0.1s' }}
      >
        {/* Kart üstü hafif altın parıltı */}
        <div className="absolute inset-0 pointer-events-none animate-login-shimmer rounded-2xl" aria-hidden />

        <CardHeader className="relative space-y-4 pb-2 pt-8 sm:pt-10">
          {/* Logo – uygun boyut, responsive */}
          <div className="flex justify-center animate-login-float">
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40">
              <Image
                src="/logo_montana.png"
                alt="Logo"
                fill
                className="object-contain"
                sizes="(max-width: 640px) 144px, (max-width: 768px) 160px, 160px"
                priority
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-xl sm:text-2xl font-semibold text-center bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 bg-clip-text text-transparent">
              Üyelik Yönetim Sistemi
            </CardTitle>
            <CardDescription className="text-center text-stone-400 text-sm sm:text-base">
              Devam etmek için giriş yapın
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="relative pb-8 sm:pb-10 pt-2">
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
