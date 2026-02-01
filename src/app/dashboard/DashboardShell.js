'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  LayoutDashboard,
  Users,
  Package,
  CreditCard,
  Receipt,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Üyeler', href: '/dashboard/members', icon: Users },
  { name: 'Paketler', href: '/dashboard/packages', icon: Package },
  { name: 'Üyelikler', href: '/dashboard/memberships', icon: CreditCard },
  { name: 'Harcamalar', href: '/dashboard/expenses', icon: Receipt },
];

export default function DashboardShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-64 bg-card border-r border-border
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
            <h1 className="text-xl font-bold text-foreground truncate">
              Üyelik Yönetimi
            </h1>
            <div className="flex items-center gap-1 shrink-0">
              <ThemeToggle />
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Menüyü kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              const isExpenses = item.name === 'Harcamalar';
              const isMemberships = item.name === 'Üyelikler';

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                    transition-colors duration-200
                    ${isExpenses
                      ? isActive
                        ? 'bg-orange-400 text-orange-950 dark:bg-orange-500 dark:text-orange-950'
                        : 'text-muted-foreground hover:bg-orange-400 hover:text-orange-950 dark:hover:bg-orange-500 dark:hover:text-orange-950'
                      : isMemberships
                        ? isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-[#C9A227] hover:text-[#1a1a0a] dark:hover:bg-[#D4AF37] dark:hover:text-[#1a1a0a]'
                        : isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Ayarlar + Çıkış Yap - birbirine yakın */}
          <div className="p-4 pt-2 border-t border-border space-y-1">
            <Link
              href="/dashboard/settings"
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                transition-colors duration-200
                ${pathname === '/dashboard/settings'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}
              `}
            >
              <Settings className="h-5 w-5 shrink-0" />
              Ayarlar
            </Link>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start border-border text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="h-5 w-5 mr-3 shrink-0" />
              Çıkış Yap
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 bg-card/95 border-b border-border backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:hidden">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-lg font-semibold text-foreground truncate">
              Üyelik Yönetimi
            </h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Menüyü aç"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
