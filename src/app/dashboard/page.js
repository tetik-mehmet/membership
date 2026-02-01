import { Users, CreditCard, AlertCircle, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import connectDB from "@/lib/db";
import Member from "@/models/Member";
import MembershipPackage from "@/models/MembershipPackage";
import MemberMembership from "@/models/MemberMembership";

export const dynamic = "force-dynamic";

async function getDashboardStats() {
  await connectDB();

  const [totalMembers, totalPackages, activeMemberships, expiredMemberships] =
    await Promise.all([
      Member.countDocuments(),
      MembershipPackage.countDocuments({ isActive: true }),
      MemberMembership.countDocuments({ status: "active" }),
      MemberMembership.countDocuments({ status: "expired" }),
    ]);

  return {
    totalMembers,
    totalPackages,
    activeMemberships,
    expiredMemberships,
  };
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Üyelik yönetim sisteminize hoş geldiniz
        </p>
      </div>

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
