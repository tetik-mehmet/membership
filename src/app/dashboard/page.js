import { cookies } from "next/headers";
import Image from "next/image";
import {
  Users,
  CreditCard,
  AlertCircle,
  Package,
  Banknote,
  TrendingUp,
  Receipt,
  PiggyBank,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MembershipDistributionChart from "@/components/dashboard/MembershipDistributionChart";
import DashboardLottie from "@/components/dashboard/DashboardLottie";
import connectDB from "@/lib/db";
import Member from "@/models/Member";
import MembershipPackage from "@/models/MembershipPackage";
import MemberMembership from "@/models/MemberMembership";
import Expense from "@/models/Expense";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getUsername() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  const decoded = token ? verifyToken(token) : null;
  return decoded?.username || "admin";
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
    MemberMembership.countDocuments({ status: "active" }),
    MemberMembership.countDocuments({ status: "expired" }),
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
    (d) => ({ name: d.name || "Bilinmeyen", value: d.value })
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
  const [stats, username] = await Promise.all([
    getDashboardStats(),
    getUsername(),
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
    },
    {
      title: "Aktif Üyelik",
      value: stats.activeMemberships,
      icon: CreditCard,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/40",
    },
    {
      title: "Süresi Dolan",
      value: stats.expiredMemberships,
      icon: AlertCircle,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/40",
    },
    {
      title: "Aktif Paket",
      value: stats.totalPackages,
      icon: Package,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/40",
    },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
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
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Hoş geldin, {displayName}
          </h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Üyelik yönetim sisteminize hoş geldiniz
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
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
          );
        })}
      </div>

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
            <div className="w-full min-w-0 flex-1 max-w-xl">
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
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hızlı Başlangıç</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">1. Üye Ekle</h3>
            <p className="text-sm text-muted-foreground">
              Yeni üyeleri sisteme eklemek için Üyeler sayfasını ziyaret edin.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">2. Paket Tanımla</h3>
            <p className="text-sm text-muted-foreground">
              Üyelik paketlerini oluşturun ve fiyatlandırın (Aylık, 5 Aylık,
              Yıllık).
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">3. Üyelik Ata</h3>
            <p className="text-sm text-muted-foreground">
              Üyelere paket atayarak üyeliklerini aktif edin.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
