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
import { Fragment } from "react";
import {
  Activity,
  LogIn,
  LogOut,
  Loader2,
  UserPlus,
  UserX,
  NotebookPen,
  BadgePlus,
  BadgeMinus,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [actionFilter, setActionFilter] = useState("all");
  const [adminFilter, setAdminFilter] = useState("all");
  const [expandedNoteLogId, setExpandedNoteLogId] = useState(null);

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
            Admin Aktivite Logları
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

  const uniqueAdmins = Array.from(
    new Set(logs.map((log) => log.username).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "tr-TR"));

  const filteredLogs = logs.filter((log) => {
    const actionMatch =
      actionFilter === "all" ? true : log.action === actionFilter;
    const adminMatch =
      adminFilter === "all" ? true : log.username === adminFilter;
    return actionMatch && adminMatch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Admin Aktivite Logları
        </h1>
        <p className="text-muted-foreground mt-2">
          Hangi adminin ne zaman sisteme giriş/çıkış yaptığını, üye/üyelik
          ekleme-silme ve not güncelleme işlemlerini görüntüleyin
        </p>
      </div>

      <Card>
        <CardHeader className="border-b border-border/60 bg-muted/40">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Activity className="h-4 w-4" />
                </span>
                <span>Aktivite Kayıtları</span>
              </CardTitle>
              <CardDescription className="mt-1">
                Son 500 kayıt görüntüleniyor, filtreleyerek daraltabilirsiniz.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:text-right">
              <span className="uppercase tracking-wide text-[11px] font-semibold text-muted-foreground/80">
                Toplam Kayıt
              </span>
              <span className="text-lg font-semibold text-foreground">
                {filteredLogs.length.toLocaleString("tr-TR")}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="rounded-xl border border-border/60 bg-gradient-to-r from-background via-background to-background/80 p-3 sm:p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Filtreler
                </span>
                <span className="text-xs text-muted-foreground">
                  İşlem türüne ve işlemi yapan admine göre listeyi daraltın.
                </span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
                <div className="flex flex-col gap-1 min-w-[200px]">
                  <label className="text-xs font-medium text-muted-foreground">
                    İşlem türü
                  </label>
                  <Select
                    value={actionFilter}
                    onValueChange={(value) => setActionFilter(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="İşlem türü seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="login">Giriş</SelectItem>
                      <SelectItem value="logout">Çıkış</SelectItem>
                      <SelectItem value="member_created">Üye Ekleme</SelectItem>
                      <SelectItem value="member_deleted">Üye Silme</SelectItem>
                      <SelectItem value="member_note_updated">
                        Üye Notu Güncelleme
                      </SelectItem>
                      <SelectItem value="membership_created">
                        Üyelik Ekleme
                      </SelectItem>
                      <SelectItem value="membership_renewed">
                        Üyelik Yenileme
                      </SelectItem>
                      <SelectItem value="membership_deleted">
                        Üyelik Silme
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1 min-w-[200px]">
                  <label className="text-xs font-medium text-muted-foreground">
                    Admin
                  </label>
                  <Select
                    value={adminFilter}
                    onValueChange={(value) => setAdminFilter(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Admin seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      {uniqueAdmins.map((admin) => (
                        <SelectItem key={admin} value={admin}>
                          {admin}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          {filteredLogs.length === 0 ? (
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
                    <TableHead>Hedef Üye</TableHead>
                    <TableHead>Paket</TableHead>
                    <TableHead>İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <Fragment key={log.id}>
                      <TableRow>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(log.timestamp)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {log.username}
                        </TableCell>
                        <TableCell className="font-medium">
                          {log.targetMemberName || "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {log.targetPackageDurationInDays
                            ? `${Math.round(
                                log.targetPackageDurationInDays / 30
                              )} Ay`
                            : "-"}
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
                          ) : log.action === "logout" ? (
                            <Badge
                              variant="secondary"
                              className="bg-rose-500/20 text-rose-600 dark:text-rose-400"
                            >
                              <LogOut className="h-3.5 w-3.5 mr-1.5" />
                              Çıkış
                            </Badge>
                          ) : log.action === "member_created" ? (
                            <Badge
                              variant="secondary"
                              className="bg-sky-500/20 text-sky-600 dark:text-sky-400"
                            >
                              <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                              Üye Ekleme
                            </Badge>
                          ) : log.action === "member_deleted" ? (
                            <Badge
                              variant="secondary"
                              className="bg-slate-500/20 text-slate-700 dark:text-slate-300"
                            >
                              <UserX className="h-3.5 w-3.5 mr-1.5" />
                              Üye Silme
                            </Badge>
                          ) : log.action === "member_note_updated" ? (
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className="bg-amber-500/20 text-amber-700 dark:text-amber-300"
                              >
                                <NotebookPen className="h-3.5 w-3.5 mr-1.5" />
                                Üye Notu Güncelleme
                              </Badge>
                              {log.targetNote ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedNoteLogId((current) =>
                                      current === log.id ? null : log.id
                                    )
                                  }
                                  className="inline-flex items-center justify-center rounded-full border border-border bg-background p-1 hover:bg-accent hover:text-accent-foreground transition-colors"
                                  aria-label="Not içeriğini göster/gizle"
                                >
                                  <ChevronDown
                                    className={`h-3.5 w-3.5 transition-transform ${
                                      expandedNoteLogId === log.id
                                        ? "rotate-180"
                                        : ""
                                    }`}
                                  />
                                </button>
                              ) : null}
                            </div>
                          ) : log.action === "membership_created" ? (
                            <Badge
                              variant="secondary"
                              className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                            >
                              <BadgePlus className="h-3.5 w-3.5 mr-1.5" />
                              Üyelik Ekleme
                            </Badge>
                          ) : log.action === "membership_renewed" ? (
                            <Badge
                              variant="secondary"
                              className="bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                            >
                              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                              Üyelik Yenileme
                            </Badge>
                          ) : log.action === "membership_deleted" ? (
                            <Badge
                              variant="secondary"
                              className="bg-rose-500/20 text-rose-700 dark:text-rose-300"
                            >
                              <BadgeMinus className="h-3.5 w-3.5 mr-1.5" />
                              Üyelik Silme
                            </Badge>
                          ) : (
                            <Badge variant="secondary">{log.action}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                      {log.action === "member_note_updated" &&
                        expandedNoteLogId === log.id &&
                        log.targetNote && (
                          <TableRow>
                            <TableCell colSpan={5}>
                              <div className="rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
                                {log.targetNote}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                    </Fragment>
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
