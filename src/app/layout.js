import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata = {
  title: "Üyelik Yönetim Sistemi",
  description: "Modern üyelik yönetim sistemi",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background text-foreground">
        <ThemeProvider>
          {children}
          <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
            classNames: {
              toast: "rounded-lg shadow-lg border",
            },
          }}
        />
        </ThemeProvider>
      </body>
    </html>
  );
}
