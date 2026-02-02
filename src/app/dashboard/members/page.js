import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MemberTable from "@/components/dashboard/MemberTable";
import AddMemberDialog from "@/components/dashboard/AddMemberDialog";
import connectDB from "@/lib/db";
import Member from "@/models/Member";

export const dynamic = "force-dynamic";

async function getMembers() {
  await connectDB();
  const members = await Member.find().sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(members));
}

export default async function MembersPage() {
  const members = await getMembers();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Üyeler</h1>
          <p className="text-muted-foreground mt-2">
            Tüm üyeleri görüntüleyin ve yönetin
          </p>
        </div>
        <AddMemberDialog>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
            <Plus className="h-5 w-5" />
            Yeni Üye
          </button>
        </AddMemberDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Üye Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <MemberTable initialMembers={members} />
        </CardContent>
      </Card>
    </div>
  );
}
