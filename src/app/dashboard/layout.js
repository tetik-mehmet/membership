import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import DashboardShell from "./DashboardShell";

export default async function DashboardLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  const decoded = token ? verifyToken(token) : null;
  if (!token || !decoded) {
    redirect("/login");
  }

  const currentUsername = decoded.username || null;

  return (
    <DashboardShell currentUsername={currentUsername}>
      {children}
    </DashboardShell>
  );
}
