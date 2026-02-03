"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Activity, LogIn, LogOut, Loader2 } from "lucide-react";

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString("tr-TR", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

export default function ActivityLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch("/api/auth/activity-logs", {
          credentials: "include",
        });
        const data = await res.json();

        if (!res.ok) {
          if (res.status === 403) {
            router.replace("/dashboard");
            return;
          }
          setError(data.error || "Veriler yüklenemedi");
          return;
        }

        if (data.success && data.data) {
          setLogs(data.data);
        }
      } catch (err) {
        setError("Bağlantı hatası");
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Admin Giriş/Çıkış Logları
          </h1>
          <p className="text-muted-foreground mt-2">
            Sistem aktivite kayıtları
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Admin Giriş/Çıkış Logları
        </h1>
        <p className="text-muted-foreground mt-2">
          Hangi adminin ne zaman sisteme giriş ve çıkış yaptığını görüntüleyin
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Aktivite Kayıtları
          </CardTitle>
          <CardDescription>Son 500 kayıt gösterilmektedir</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Henüz kayıt bulunmuyor.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih & Saat</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(log.timestamp)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.username}
                      </TableCell>
                      <TableCell>
                        {log.action === "login" ? (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          >
                            <LogIn className="h-3.5 w-3.5 mr-1.5" />
                            Giriş
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-rose-500/20 text-rose-600 dark:text-rose-400"
                          >
                            <LogOut className="h-3.5 w-3.5 mr-1.5" />
                            Çıkış
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
