"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import EditPackageDialog from "@/components/dashboard/EditPackageDialog";

export default function PackageTable({ initialPackages }) {
  const [packages, setPackages] = useState(initialPackages);
  const [loading, setLoading] = useState(false);
  const [editPackage, setEditPackage] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleDeactivate = async (packageId) => {
    if (!confirm("Bu paketi deaktif etmek istediğinizden emin misiniz?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/packages/${packageId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setPackages(
          packages.map((pkg) =>
            pkg._id === packageId ? { ...pkg, isActive: false } : pkg
          )
        );
        toast.success("Paket deaktif edildi", {
          description: "Paket artık listede görünmeyecek.",
        });
      } else {
        toast.error("Paket deaktif edilemedi", {
          description: data.error || "Lütfen tekrar deneyin.",
        });
      }
    } catch (error) {
      toast.error("Bir hata oluştu", { description: "Lütfen tekrar deneyin." });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (pkg) => {
    setEditPackage(pkg);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = (updatedPackage) => {
    setPackages(
      packages.map((p) => (p._id === updatedPackage._id ? updatedPackage : p))
    );
  };

  return (
    <div className="space-y-4">
      <EditPackageDialog
        package={editPackage}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
      />
      {packages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Henüz paket eklenmemiş</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#6DC3BB]">
                <TableRow>
                  <TableHead>Paket Adı</TableHead>
                  <TableHead>Süre (Gün)</TableHead>
                  <TableHead>Fiyat (₺)</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg) => (
                  <TableRow key={pkg._id}>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell>{pkg.durationInDays} gün</TableCell>
                    <TableCell>{pkg.price.toLocaleString("tr-TR")} ₺</TableCell>
                    <TableCell>
                      <Badge variant={pkg.isActive ? "default" : "secondary"}>
                        {pkg.isActive ? "Aktif" : "Pasif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(pkg)}
                          disabled={loading}
                          title="Düzenle"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {pkg.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeactivate(pkg._id)}
                            disabled={loading}
                            title="Deaktif Et"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
