"use client";

import { useState, useEffect, useRef } from "react";
import { QRCode } from "react-qr-code";
import { Copy, Check, Download, Printer, QrCode, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function QRCodeCard() {
  const [registerUrl, setRegisterUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const qrRef = useRef(null);

  useEffect(() => {
    const base =
      process.env.NEXT_PUBLIC_APP_URL?.trim() || window.location.origin;
    setRegisterUrl(`${base}/register`);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(registerUrl);
      setCopied(true);
      toast.success("Bağlantı kopyalandı");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kopyalama başarısız");
    }
  };

  const handleDownload = () => {
    const svgEl = qrRef.current?.querySelector("svg");
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "uye-kayit-qr.svg";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("QR kod indirildi");
  };

  const handlePrint = () => {
    const svgEl = qrRef.current?.querySelector("svg");
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Üye Kayıt QR Kodu</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: sans-serif; }
            svg { width: 280px; height: 280px; }
            p { margin-top: 16px; font-size: 14px; color: #555; text-align: center; }
          </style>
        </head>
        <body>
          ${svgData}
          <p>Üye olmak için QR kodu okutun</p>
          <p style="font-size:12px">${registerUrl}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-violet-50 to-violet-100/50 dark:from-violet-950/40 dark:to-violet-900/20 border-b border-violet-200/50 dark:border-violet-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/40">
            <QrCode className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <CardTitle className="text-foreground">QR Üye Kayıt Kodu</CardTitle>
            <CardDescription className="mt-1">
              Bu QR kodu okutan kişiler üye kayıt formuna yönlendirilir
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* QR Kod */}
        <div className="flex flex-col items-center gap-4">
          <div
            ref={qrRef}
            className="p-4 bg-white rounded-2xl shadow-sm border border-border/50"
          >
            {registerUrl && (
              <QRCode
                value={registerUrl}
                size={200}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox="0 0 256 256"
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Üye olmak isteyen kişiler bu kodu okutarak kayıt formuna ulaşır
          </p>
        </div>

        {/* URL satırı */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Kayıt Bağlantısı</p>
          <div className="flex gap-2">
            <Input
              value={registerUrl}
              readOnly
              className="bg-muted/50 text-sm font-mono"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="shrink-0"
              title="Kopyala"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              asChild
              className="shrink-0"
              title="Sayfayı Aç"
            >
              <a href={registerUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Aksiyon butonları */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none gap-2"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
            <span>İndir (SVG)</span>
          </Button>
          <Button
            variant="outline"
            className="flex-1 sm:flex-none gap-2"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4" />
            <span>Yazdır</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
