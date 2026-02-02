import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MembershipTable from "@/components/dashboard/MembershipTable";
import AssignPackageDialog from "@/components/dashboard/AssignPackageDialog";
import connectDB from "@/lib/db";
import MemberMembership from "@/models/MemberMembership";
import Member from "@/models/Member";
import MembershipPackage from "@/models/MembershipPackage";

export const dynamic = "force-dynamic";

async function getMembershipsData() {
  await connectDB();

  const [memberships, members, packages] = await Promise.all([
    MemberMembership.find()
      .populate("memberId", "firstName lastName email")
      .populate("packageId", "name durationInDays price")
      .sort({ startDate: -1 })
      .lean(),
    Member.find().sort({ firstName: 1 }).lean(),
    MembershipPackage.find({ isActive: true })
      .sort({ durationInDays: 1 })
      .lean(),
  ]);

  return {
    memberships: JSON.parse(JSON.stringify(memberships)),
    members: JSON.parse(JSON.stringify(members)),
    packages: JSON.parse(JSON.stringify(packages)),
  };
}

export default async function MembershipsPage() {
  const { memberships, members, packages } = await getMembershipsData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Üyelikler</h1>
          <p className="text-muted-foreground mt-2">
            Üyelikleri görüntüleyin ve yönetin
          </p>
        </div>
        <AssignPackageDialog members={members} packages={packages}>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
            <Plus className="h-5 w-5" />
            Üyelik Ata
          </button>
        </AssignPackageDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Üyelik Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <MembershipTable
            initialMemberships={memberships}
            members={members}
            packages={packages}
          />
        </CardContent>
      </Card>
    </div>
  );
}
