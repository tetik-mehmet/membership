import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  CreditCard,
  AlertCircle,
  Package,
  Banknote,
  TrendingUp,
  Receipt,
  PiggyBank,
  UserPlus,
  CloudSun,
  Cloud,
  CloudRain,
  Sun,
  CloudSnow,
  CloudFog,
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MembershipDistributionChart from "@/components/dashboard/MembershipDistributionChart";
import DashboardLottie from "@/components/dashboard/DashboardLottie";
import AlertLottie from "@/components/dashboard/AlertLottie";
import connectDB from "@/lib/db";
import Member from "@/models/Member";
import MembershipPackage from "@/models/MembershipPackage";
import MemberMembership from "@/models/MemberMembership";
import Expense from "@/models/Expense";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard | Üyelik Yönetimi" };

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Günaydın";
  if (hour >= 12 && hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

async function getUsername() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  const decoded = token ? verifyToken(token) : null;
  return decoded?.username || "admin";
}

function getWeatherIcon(weatherCode) {
  if (weatherCode === 0) return Sun;
  if (weatherCode >= 1 && weatherCode <= 3) return CloudSun;
  if (weatherCode >= 45 && weatherCode <= 48) return CloudFog;
  if (weatherCode >= 51 && weatherCode <= 67) return CloudRain;
  if (weatherCode >= 71 && weatherCode <= 77) return CloudSnow;
  if (weatherCode >= 80 && weatherCode <= 99) return CloudRain;
  return Cloud;
}

function getWeatherLabel(weatherCode) {
  if (weatherCode === 0) return "Açık";
  if (weatherCode >= 1 && weatherCode <= 3) return "Parçalı bulutlu";
  if (weatherCode >= 45 && weatherCode <= 48) return "Sisli";
  if (weatherCode >= 51 && weatherCode <= 67) return "Yağmurlu";
  if (weatherCode >= 71 && weatherCode <= 77) return "Karlı";
  if (weatherCode >= 80 && weatherCode <= 99) return "Sağanak";
  return "Bulutlu";
}

async function getAnkaraWeather() {
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=39.9334&longitude=32.8597&current=temperature_2m,weather_code&timezone=Europe%2FIstanbul",
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const temp = Math.round(data.current?.temperature_2m ?? 0);
    const code = data.current?.weather_code ?? 0;
    return { temp, code };
  } catch {
    return null;
  }
}

function getStartOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfNextMonth() {
  const d = getStartOfMonth();
  d.setMonth(d.getMonth() + 1);
  return d;
}

async function getDashboardStats() {
  await connectDB();

  const startOfMonth = getStartOfMonth();
  const startOfNextMonth = getStartOfNextMonth();
  const now = new Date();

  // Toplam kazanç: Üyelikler sayfasındaki gibi - tüm üyeliklerin paket fiyatları toplamı
  // Aylık kazanç: Başlangıç tarihi (startDate) bu ay içinde olan üyeliklerin paket fiyatları toplamı
  const [
    totalMembers,
    totalPackages,
    activeMemberships,
    expiredMemberships,
    totalEarningsResult,
    monthlyEarningsResult,
    monthlyExpensesResult,
    distributionByPackageResult,
  ] = await Promise.all([
    Member.countDocuments(),
    MembershipPackage.countDocuments({ isActive: true }),
    // Etkin üyelik: statüsü active OLAN ve bitiş tarihi bugünden SONRA veya BUGÜN olanlar
    MemberMembership.countDocuments({
      status: "active",
      endDate: { $gte: now },
    }),
    // Süresi dolan: statüsü expired OLANLAR + statüsü active olup bitiş tarihi GEÇMİŞ olanlar
    MemberMembership.countDocuments({
      $or: [{ status: "expired" }, { status: "active", endDate: { $lt: now } }],
    }),
    MemberMembership.aggregate([
      {
        $lookup: {
          from: "membershippackages",
          localField: "packageId",
          foreignField: "_id",
          as: "pkg",
        },
      },
      { $unwind: "$pkg" },
      { $group: { _id: null, total: { $sum: "$pkg.price" } } },
    ]),
    MemberMembership.aggregate([
      { $match: { startDate: { $gte: startOfMonth, $lt: startOfNextMonth } } },
      {
        $lookup: {
          from: "membershippackages",
          localField: "packageId",
          foreignField: "_id",
          as: "pkg",
        },
      },
      { $unwind: "$pkg" },
      { $group: { _id: null, total: { $sum: "$pkg.price" } } },
    ]),
    Expense.aggregate([
      { $match: { date: { $gte: startOfMonth, $lt: startOfNextMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    // Üyelik dağılımı: paket türüne göre (paket adı + üyelik sayısı)
    MemberMembership.aggregate([
      {
        $lookup: {
          from: "membershippackages",
          localField: "packageId",
          foreignField: "_id",
          as: "pkg",
        },
      },
      { $unwind: { path: "$pkg", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$packageId",
          name: { $first: { $ifNull: ["$pkg.name", "Bilinmeyen Paket"] } },
          value: { $sum: 1 },
        },
      },
      { $sort: { value: -1 } },
      { $project: { _id: 0, name: "$name", value: "$value" } },
    ]),
  ]);

  const totalEarnings = totalEarningsResult[0]?.total ?? 0;
  const monthlyEarnings = monthlyEarningsResult[0]?.total ?? 0;
  const monthlyExpenses = monthlyExpensesResult[0]?.total ?? 0;
  const monthlyProfit = monthlyEarnings - monthlyExpenses;

  const membershipDistribution = (distributionByPackageResult || []).map(
    (d) => ({ name: d.name || "Bilinmeyen", value: d.value }),
  );

  return {
    totalMembers,
    totalPackages,
    activeMemberships,
    expiredMemberships,
    totalEarnings,
    monthlyEarnings,
    monthlyExpenses,
    monthlyProfit,
    membershipDistribution,
  };
}

export default async function DashboardPage() {
  const [stats, username, weather] = await Promise.all([
    getDashboardStats(),
    getUsername(),
    getAnkaraWeather(),
  ]);
  const displayName =
    username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();

  const cards = [
    {
      title: "Toplam Üye",
      value: stats.totalMembers,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/40",
      href: "/dashboard/members",
      ariaLabel: "Üyelere git",
    },
    {
      title: "Aktif Üyelik",
      value: stats.activeMemberships,
      icon: CreditCard,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/40",
      href: "/dashboard/memberships?tab=active",
      ariaLabel: "Aktif üyeliklere git",
    },
    {
      title: "Süresi Dolan",
      value: stats.expiredMemberships,
      icon: AlertCircle,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/40",
      href: "/dashboard/memberships?tab=expired",
      ariaLabel: "Süresi dolan üyeliklere git",
    },
    {
      title: "Aktif Paket",
      value: stats.totalPackages,
      icon: Package,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/40",
      href: "/dashboard/packages",
      ariaLabel: "Paketlere git",
    },
  ];

  const greeting = getGreeting();
  const todayFormatted = format(new Date(), "d MMMM yyyy, EEEE", {
    locale: tr,
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 p-4 sm:p-6 rounded-xl bg-muted/30 dark:bg-muted/20 border border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden bg-muted/50 dark:bg-muted/20 border border-border/50 shadow-sm">
            <Image
              src="/logo_montana.png"
              alt="Montana"
              fill
              className="object-contain p-1.5"
              sizes="(max-width: 640px) 64px, 80px"
              priority
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                {greeting}, {displayName}
              </h1>
              <a
                href="https://antrenman-takip.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-teal-500 hover:bg-teal-600 text-white transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
              >
                Antrenman Takip Programı
              </a>
              {weather && (
                <div className="flex items-center gap-6 ml-4 sm:ml-6 shrink-0">
                  <div
                    className="hidden sm:block w-1 h-12 shrink-0 rounded-full bg-gradient-to-b from-gray-200 via-gray-400 to-gray-600 shadow-[inset_1px_1px_0_rgba(255,255,255,0.4),2px_0_4px_rgba(0,0,0,0.15)] dark:from-gray-600 dark:via-gray-500 dark:to-gray-700 dark:shadow-[inset_1px_1px_0_rgba(255,255,255,0.1),2px_0_4px_rgba(0,0,0,0.3)]"
                    aria-hidden
                  />
                  <div
                    className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border-2 border-sky-300 dark:border-sky-700 text-sky-800 dark:text-sky-200 text-base shrink-0 shadow-sm ring-1 ring-sky-200/50 dark:ring-sky-700/50"
                    title={`Ankara: ${weather.temp}°C, ${getWeatherLabel(weather.code)}`}
                  >
                    {(() => {
                      const Icon = getWeatherIcon(weather.code);
                      return <Icon className="h-6 w-6 shrink-0" />;
                    })()}
                    <span className="font-semibold whitespace-nowrap text-lg">
                      Ankara {weather.temp}°C
                    </span>
                  </div>
                </div>
              )}
            </div>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
              Üyelik yönetim sisteminize hoş geldiniz
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground shrink-0">
          {todayFormatted}
        </p>
      </header>

      <h2 className="text-lg font-semibold text-foreground">Genel Bakış</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              aria-label={card.ariaLabel}
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
            >
              <Card className="transition-all duration-200 hover:shadow-md hover:scale-[1.02] h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <div className={`${card.bgColor} p-2 rounded-lg`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {card.value}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {stats.expiredMemberships > 0 && (
        <div
          role="alert"
          className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900/80 border border-amber-200/80 dark:border-amber-800/60 shadow-sm ring-1 ring-amber-500/10 dark:ring-amber-500/20 overflow-hidden"
        >
          {/* Turuncu gradient yanıp sönen arka plan */}
          <div
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-300/40 via-orange-400/50 to-amber-400/40 dark:from-amber-500/25 dark:via-orange-500/35 dark:to-amber-600/25 animate-alert-gradient-pulse pointer-events-none"
            aria-hidden
          />
          {/* Sol accent çizgisi */}
          <div className="absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 bg-gradient-to-b from-amber-400 to-amber-600 dark:from-amber-500 dark:to-amber-700 z-10" aria-hidden />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:flex-1 gap-3 sm:gap-4 pl-4 sm:pl-5 min-w-0">
            <div className="space-y-0.5 min-w-0">
              <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                Süresi dolan üyelikler
              </h3>
              <p className="text-sm text-amber-800/90 dark:text-amber-200/80">
                {stats.expiredMemberships} üyeliğin süresi doldu. Yenilemek için üyelikler sayfasına gidin.
              </p>
            </div>
            <Link
              href="/dashboard/memberships?tab=expired&focus=expired"
              className="inline-flex items-center justify-center self-start sm:self-center px-4 py-2.5 text-sm font-medium rounded-lg bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 shadow-sm"
            >
              Üyelikler
            </Link>
          </div>
          <div className="relative z-10 flex items-center justify-center shrink-0 pl-4 sm:pl-0">
            <AlertLottie className="w-20 h-20 sm:w-24 sm:h-24" />
          </div>
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          Hızlı Eylemler
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Link
            href="/dashboard/members?open=add-member"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#e8e4c8] bg-[#FFFBDE] text-black text-sm font-medium hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <UserPlus className="h-5 w-5 shrink-0" />
            Yeni üye
          </Link>
          <Link
            href="/dashboard/packages?open=add-package"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#6bb8b0] bg-[#90D1CA] text-foreground text-sm font-medium hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Package className="h-5 w-5 shrink-0" />
            Yeni paket
          </Link>
          <Link
            href="/dashboard/expenses?open=add-expense"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#0e7a73] bg-[#129990] text-white text-sm font-medium hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Receipt className="h-5 w-5 shrink-0" />
            Harcama ekle
          </Link>
          <Link
            href="/dashboard/memberships?open=assign"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#055552] bg-[#096B68] text-white text-sm font-medium hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CreditCard className="h-5 w-5 shrink-0" />
            Üyelik ata
          </Link>
        </div>
      </section>

      <h2 className="text-lg font-semibold text-foreground">Üyelik Dağılımı</h2>
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/30 dark:bg-muted/20">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Package className="h-5 w-5 text-primary" />
            Üyeliklerin Dağılımı
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Paket çeşitlerine göre üyelik sayıları
          </p>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-4">
            <div className="w-full min-w-0 flex-1 max-w-xl min-h-[240px] sm:min-h-[280px]">
              <MembershipDistributionChart
                data={stats.membershipDistribution}
              />
            </div>
            <div className="flex shrink-0 w-52 h-52 sm:w-60 sm:h-60">
              <DashboardLottie className="w-full h-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-lg font-semibold text-foreground">Finansal Özet</h2>
      <Card className="overflow-hidden">
        <CardHeader className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/50">
          <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
            <Banknote className="h-6 w-6" />
            Kazanç Özeti
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 dark:bg-muted/20 border border-border/50">
              <div className="flex-shrink-0 p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                <Banknote className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">
                  Toplam Kazanç
                </p>
                <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                  {stats.totalEarnings.toLocaleString("tr-TR")} ₺
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 dark:bg-muted/20 border border-border/50">
              <div className="flex-shrink-0 p-3 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">
                  Bu Ay Kazanç
                </p>
                <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                  {stats.monthlyEarnings.toLocaleString("tr-TR")} ₺
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 dark:bg-muted/20 border border-border/50">
              <div className="flex-shrink-0 p-3 rounded-lg bg-red-100 dark:bg-red-900/40">
                <Receipt className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">
                  Bu Ay Harcama
                </p>
                <p className="text-xl sm:text-2xl font-bold text-destructive tabular-nums">
                  {stats.monthlyExpenses.toLocaleString("tr-TR")} ₺
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 dark:bg-muted/20 border border-border/50">
              <div className="flex-shrink-0 p-3 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                <PiggyBank className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">
                  Bu Ay Kar
                </p>
                <p
                  className={`text-xl sm:text-2xl font-bold tabular-nums ${
                    stats.monthlyProfit >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-destructive"
                  }`}
                >
                  {stats.monthlyProfit.toLocaleString("tr-TR")} ₺
                </p>
                {stats.monthlyEarnings > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Kar marjı{" "}
                    {(
                      (stats.monthlyProfit / stats.monthlyEarnings) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
