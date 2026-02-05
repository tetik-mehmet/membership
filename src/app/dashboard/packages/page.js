import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PackageTable from "@/components/dashboard/PackageTable";
import AddPackageDialog from "@/components/dashboard/AddPackageDialog";
import connectDB from "@/lib/db";
import MembershipPackage from "@/models/MembershipPackage";

export const dynamic = "force-dynamic";

async function getPackages() {
  await connectDB();
  const packages = await MembershipPackage.find()
    .sort({ durationInDays: 1 })
    .lean();
  return JSON.parse(JSON.stringify(packages));
}

export default async function PackagesPage({ searchParams }) {
  const packages = await getPackages();
  const resolved =
    searchParams && typeof searchParams.then === "function"
      ? await searchParams
      : searchParams || {};
  const openAddPackage = resolved?.open === "add-package";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Üyelik Paketleri
          </h1>
          <p className="text-muted-foreground mt-2">
            Üyelik paketlerini tanımlayın ve yönetin
          </p>
        </div>
        <AddPackageDialog defaultOpen={openAddPackage}>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
            <Plus className="h-5 w-5" />
            Yeni Paket
          </button>
        </AddPackageDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Paket Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <PackageTable initialPackages={packages} />
        </CardContent>
      </Card>
    </div>
  );
}
