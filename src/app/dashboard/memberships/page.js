import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
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
      .populate(
        "memberId",
        "firstName lastName email phone paymentStatus photoUrl"
      )
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

const VALID_TABS = ["all", "active", "expired"];

export default async function MembershipsPage({ searchParams }) {
  const { memberships, members, packages } = await getMembershipsData();
  const resolved =
    searchParams && typeof searchParams.then === "function"
      ? await searchParams
      : searchParams || {};
  const tabParam = resolved?.tab;
  const initialTab =
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : "all";
  const openAssign = resolved?.open === "assign";
  const focusExpired = resolved?.focus === "expired";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Üyelikler</h1>
        <p className="text-muted-foreground mt-2">
          Üyelikleri görüntüleyin ve yönetin
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Üyelik Listesi</CardTitle>
          <CardAction>
            <AssignPackageDialog
              members={members || []}
              packages={packages || []}
              defaultOpen={openAssign}
            />
          </CardAction>
        </CardHeader>
        <CardContent>
          <MembershipTable
            initialMemberships={memberships}
            members={members}
            packages={packages}
            initialTab={initialTab}
            focusExpired={focusExpired}
          />
        </CardContent>
      </Card>
    </div>
  );
}
